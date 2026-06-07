// ============================================================================
// Data Hooks — Attendance (TanStack Query + Supabase)
// Covers ATT-01 through ATT-05
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { api } from '../../services/store';
import type { AttendanceRecord, AttendanceRegularization, WorkModeRequest, WorkPolicy, Holiday, RequestStatus, WorkMode } from '../../types/database';

const KEYS = {
  today: (employeeId?: string) => ['attendance', 'today', employeeId] as const,
  monthly: (employeeId?: string, month?: string) => ['attendance', 'monthly', employeeId, month] as const,
  team: (managerId?: string, date?: string) => ['attendance', 'team', managerId, date] as const,
  orgWide: (filters?: Record<string, string>) => ['attendance', 'org', filters] as const,
  regularizations: ['attendance-regularizations'] as const,
  workModeRequests: ['work-mode-requests'] as const,
  policies: ['work-policies'] as const,
  holidays: ['holidays'] as const,
};

// ── Work Policies ───────────────────────────────────────────────────────────

export function useWorkPolicies() {
  return useQuery({
    queryKey: KEYS.policies,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_policies')
        .select('*')
        .order('created_at');
      if (error) throw error;
      return data as WorkPolicy[];
    },
  });
}

export function useHolidays(year?: number) {
  return useQuery({
    queryKey: [...KEYS.holidays, year],
    queryFn: async () => {
      const y = year || new Date().getFullYear();
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .gte('date', `${y}-01-01`)
        .lte('date', `${y}-12-31`)
        .order('date');
      if (error) throw error;
      return data as Holiday[];
    },
  });
}

// ── Today's Record ──────────────────────────────────────────────────────────

export function useTodayAttendance(employeeId?: string) {
  const today = new Date().toISOString().split('T')[0];
  return useQuery({
    queryKey: KEYS.today(employeeId),
    enabled: !!employeeId,
    refetchInterval: 60000, // Refresh every minute for live clock
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', employeeId!)
        .eq('work_date', today)
        .maybeSingle();
      if (error) throw error;
      return data as AttendanceRecord | null;
    },
  });
}

// ── Clock In ────────────────────────────────────────────────────────────────

export function useClockIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      latitude?: number;
      longitude?: number;
      ip_address?: string;
      work_mode?: string;
      out_of_fence?: boolean;
    }) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('attendance_records')
        .insert({
          employee_id: userId!,
          work_date: today,
          clock_in: new Date().toISOString(),
          status: 'present',
          work_mode: (params.work_mode as AttendanceRecord['work_mode']) || 'office',
          latitude: params.latitude,
          longitude: params.longitude,
          ip_address: params.ip_address,
          out_of_fence: params.out_of_fence || false,
          source: 'web',
        })
        .select()
        .single();
      if (error) throw error;
      return data as AttendanceRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

// ── Clock Out ───────────────────────────────────────────────────────────────

export function useClockOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (recordId: string) => {
      const clockOut = new Date().toISOString();

      // Fetch current record to compute hours
      const { data: record } = await supabase
        .from('attendance_records')
        .select('clock_in')
        .eq('id', recordId)
        .single();

      let totalHours = 0;
      let overtimeHours = 0;

      if (record?.clock_in) {
        const diff = (new Date(clockOut).getTime() - new Date(record.clock_in).getTime()) / 3600000;
        totalHours = Math.round(diff * 10) / 10;

        // Fetch work policy for overtime calculation
        const { data: policies } = await supabase
          .from('work_policies')
          .select('standard_hours')
          .limit(1);
        const standardHours = policies?.[0]?.standard_hours || 8;
        overtimeHours = Math.max(0, Math.round((totalHours - standardHours) * 10) / 10);
      }

      const { data, error } = await supabase
        .from('attendance_records')
        .update({
          clock_out: clockOut,
          total_hours: totalHours,
          overtime_hours: overtimeHours,
          is_incomplete: false,
        })
        .eq('id', recordId)
        .select()
        .single();
      if (error) throw error;
      return data as AttendanceRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

// ── Monthly Records ─────────────────────────────────────────────────────────

export function useMonthlyAttendance(employeeId?: string, year?: number, month?: number) {
  const y = year || new Date().getFullYear();
  const m = month || new Date().getMonth() + 1;
  const monthStr = `${y}-${String(m).padStart(2, '0')}`;

  return useQuery({
    queryKey: KEYS.monthly(employeeId, monthStr),
    enabled: !!employeeId,
    queryFn: async () => {
      const startDate = `${monthStr}-01`;
      const endDate = new Date(y, m, 0).toISOString().split('T')[0]; // last day of month

      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', employeeId!)
        .gte('work_date', startDate)
        .lte('work_date', endDate)
        .order('work_date');
      if (error) throw error;
      return data as AttendanceRecord[];
    },
  });
}

// ── Team Attendance (Manager view) ──────────────────────────────────────────

export function useTeamAttendance(managerId?: string, date?: string) {
  const d = date || new Date().toISOString().split('T')[0];
  return useQuery({
    queryKey: KEYS.team(managerId, d),
    enabled: !!managerId,
    queryFn: async () => {
      // Get team member IDs first
      const { data: team } = await supabase
        .from('profiles')
        .select('id, full_name, avatar, department_id')
        .eq('manager_id', managerId!);

      if (!team?.length) return [];

      const teamIds = team.map(t => t.id);
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*, employee:employee_id(id, full_name, avatar, department_id)')
        .in('employee_id', teamIds)
        .eq('work_date', d);
      if (error) throw error;
      return data as AttendanceRecord[];
    },
  });
}

// ── Regularizations ─────────────────────────────────────────────────────────

export function useRegularizations(filters?: { status?: string }) {
  return useQuery({
    queryKey: [...KEYS.regularizations, filters],
    queryFn: async () => {
      let query = supabase
        .from('attendance_regularizations')
        .select('*, employee:employee_id(id, full_name, avatar)')
        .order('created_at', { ascending: false });

      if (filters?.status) query = query.eq('status', filters.status as RequestStatus);
      const { data, error } = await query;
      if (error) throw error;
      return data as AttendanceRegularization[];
    },
  });
}

export function useSubmitRegularization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      attendance_id?: string;
      requested_in: string;
      requested_out: string;
      reason: string;
    }) => {
      return api.post('/attendance/regularizations', params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.regularizations });
    },
  });
}

export function useApproveRegularization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const status = approved ? 'approved' : 'rejected';
      return api.put(`/attendance/regularizations/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.regularizations });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

// ── Work Mode Requests ──────────────────────────────────────────────────────

export function useWorkModeRequests(filters?: { status?: string }) {
  return useQuery({
    queryKey: [...KEYS.workModeRequests, filters],
    queryFn: async () => {
      let query = supabase
        .from('work_mode_requests')
        .select('*, employee:employee_id(id, full_name, avatar)')
        .order('created_at', { ascending: false });

      if (filters?.status) query = query.eq('status', filters.status as RequestStatus);
      const { data, error } = await query;
      if (error) throw error;
      return data as WorkModeRequest[];
    },
  });
}

export function useSubmitWorkModeRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { work_date: string; mode: string; reason: string }) => {
      return api.post('/attendance/work-mode-requests', { ...params, mode: params.mode as WorkMode });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.workModeRequests });
    },
  });
}

export function useApproveWorkModeRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const status = approved ? 'approved' : 'rejected';
      return api.put(`/attendance/work-mode-requests/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.workModeRequests });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}
