// ============================================================================
// Data Hooks — Leave (TanStack Query + Supabase)
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { LeaveRequest, LeaveBalance, LeaveType, LeaveStatus } from '../../types/database';

const KEYS = {
  types: ['leave-types'] as const,
  balances: (employeeId?: string) => ['leave-balances', employeeId] as const,
  requests: ['leave-requests'] as const,
  myRequests: (employeeId?: string) => ['leave-requests', 'mine', employeeId] as const,
};

/** Fetch all leave types */
export function useLeaveTypes() {
  return useQuery({
    queryKey: KEYS.types,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leave_types')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as LeaveType[];
    },
  });
}

/** Fetch leave balances for a specific employee (or current user) */
export function useLeaveBalances(employeeId?: string) {
  return useQuery({
    queryKey: KEYS.balances(employeeId),
    queryFn: async () => {
      let query = supabase
        .from('leave_balances')
        .select('*, leave_type:leave_type_id(*)');

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }
      query = query.eq('year', new Date().getFullYear());

      const { data, error } = await query;
      if (error) throw error;
      return data as LeaveBalance[];
    },
  });
}

/** Fetch leave requests (RLS handles scoping) */
export function useLeaveRequests(filters?: { status?: string; employeeId?: string }) {
  return useQuery({
    queryKey: [...KEYS.requests, filters],
    queryFn: async () => {
      let query = supabase
        .from('leave_requests')
        .select(`
          *,
          employee:employee_id(id, full_name, email, avatar, department_id),
          leave_type:leave_type_id(id, name),
          approver:approver_id(id, full_name)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) query = query.eq('status', filters.status as LeaveStatus);
      if (filters?.employeeId) query = query.eq('employee_id', filters.employeeId);

      const { data, error } = await query;
      if (error) throw error;
      return data as LeaveRequest[];
    },
  });
}

/** Apply for leave */
export function useApplyLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: {
      leave_type_id: string;
      from_date: string;
      to_date: string;
      days: number;
      reason: string;
    }) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { data, error } = await supabase
        .from('leave_requests')
        .insert({ ...request, employee_id: userId! })
        .select()
        .single();
      if (error) throw error;
      return data as LeaveRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.requests });
    },
  });
}

/** Approve a leave request */
export function useApproveLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;

      // Get the request to find the balance to decrement
      const { data: request, error: fetchErr } = await supabase
        .from('leave_requests')
        .select('employee_id, leave_type_id, days')
        .eq('id', id)
        .single();
      if (fetchErr) throw fetchErr;

      // Update the request status
      const { error: updateErr } = await supabase
        .from('leave_requests')
        .update({
          status: 'approved',
          approver_id: userId!,
          decided_at: new Date().toISOString(),
          comments: notes || '',
        })
        .eq('id', id);
      if (updateErr) throw updateErr;

      // Decrement leave balance
      const year = new Date().getFullYear();
      const { data: balance } = await supabase
        .from('leave_balances')
        .select('id, used')
        .eq('employee_id', request.employee_id)
        .eq('leave_type_id', request.leave_type_id)
        .eq('year', year)
        .single();

      if (balance) {
        await supabase
          .from('leave_balances')
          .update({ used: balance.used + request.days })
          .eq('id', balance.id);
      }

      // Audit log
      await supabase.from('audit_log').insert({
        actor_id: userId,
        action: 'approve',
        entity: 'leave_request',
        entity_id: id,
        diff: { status: 'approved', notes },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.requests });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
    },
  });
}

/** Reject a leave request */
export function useRejectLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;

      const { error } = await supabase
        .from('leave_requests')
        .update({
          status: 'rejected',
          approver_id: userId!,
          decided_at: new Date().toISOString(),
          comments: notes || '',
        })
        .eq('id', id);
      if (error) throw error;

      await supabase.from('audit_log').insert({
        actor_id: userId,
        action: 'reject',
        entity: 'leave_request',
        entity_id: id,
        diff: { status: 'rejected', notes },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.requests });
    },
  });
}
