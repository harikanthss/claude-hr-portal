// ============================================================================
// Data Hooks — Payroll (TanStack Query + Supabase)
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { Json, PayrollRun, PayrollRecord } from '../../types/database';

const KEYS = {
  runs: ['payroll-runs'] as const,
  records: (month?: string) => ['payroll-records', month] as const,
  myRecords: (employeeId?: string) => ['payroll-records', 'mine', employeeId] as const,
};

/** Fetch payroll runs (HR/Admin only via RLS) */
export function usePayrollRuns() {
  return useQuery({
    queryKey: KEYS.runs,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll_runs')
        .select('*')
        .order('month', { ascending: false });
      if (error) throw error;
      return data as PayrollRun[];
    },
  });
}

/** Fetch payroll records for a specific month (RLS: employee sees own, HR sees all) */
export function usePayrollRecords(month?: string) {
  return useQuery({
    queryKey: KEYS.records(month),
    queryFn: async () => {
      let query = supabase
        .from('payroll_records')
        .select(`
          *,
          employee:employee_id(id, full_name, email, department_id, job_title),
          run:run_id(id, month, status)
        `)
        .order('created_at', { ascending: false });

      if (month) {
        // Filter by run's month
        query = query.eq('run.month', month);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PayrollRecord[];
    },
  });
}

/** Fetch own payslips (employee view) */
export function useMyPayslips(employeeId?: string) {
  return useQuery({
    queryKey: KEYS.myRecords(employeeId),
    enabled: !!employeeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll_records')
        .select(`
          *,
          run:run_id(id, month, status)
        `)
        .eq('employee_id', employeeId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PayrollRecord[];
    },
  });
}

/** Run payroll for a month (HR/Admin) */
export function useRunPayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (month: string) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;

      const [monthName, yearText] = month.includes('-')
        ? [month.split('-')[1], month.split('-')[0]]
        : [month, String(new Date().getFullYear())];

      // 1. Create payroll run
      const { data: run, error: runErr } = await supabase
        .from('payroll_runs')
        .insert({
          month: monthName,
          year: Number(yearText),
          status: 'processing',
          processed_by: userId!,
          processed_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (runErr) throw runErr;

      // 2. Get all active employees
      const { data: employees, error: empErr } = await supabase
        .from('profiles')
        .select('id, salary')
        .eq('status', 'active');
      if (empErr) throw empErr;

      // 3. Generate payroll records
      const records = (employees || []).map(emp => {
        const base = Number(emp.salary) || 0;
        const hra = Math.round(base * 0.4);
        const conveyance = 3200;
        const medical = 1250;
        const pf = Math.round(base * 0.12);
        const tax = Math.round(base * 0.1);
        const net = base + hra + conveyance + medical - pf - tax;

        return {
          run_id: run.id,
          employee_id: emp.id,
          base_salary: base,
          allowances: { hra, conveyance, medical } as Json,
          deductions: { pf_deduction: pf, tax_deduction: tax } as Json,
          net_pay: net,
          status: 'processed' as const,
        };
      });

      if (records.length > 0) {
        const { error: insertErr } = await supabase
          .from('payroll_records')
          .insert(records);
        if (insertErr) throw insertErr;
      }

      // 4. Mark run as completed
      await supabase
        .from('payroll_runs')
        .update({ status: 'processed' })
        .eq('id', run.id);

      // Audit
      await supabase.from('audit_log').insert({
        actor_id: userId,
        action: 'run_payroll',
        entity: 'payroll_run',
        entity_id: run.id,
        diff: { month, employee_count: records.length },
      });

      return run;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-records'] });
    },
  });
}
