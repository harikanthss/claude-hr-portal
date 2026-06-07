// ============================================================================
// Data Hooks — Employees (TanStack Query + Supabase)
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { Json, Profile, ProfileInsert, ProfileUpdate } from '../../types/database';

const KEYS = {
  all: ['employees'] as const,
  detail: (id: string) => ['employees', id] as const,
  team: (managerId: string) => ['employees', 'team', managerId] as const,
};

/**
 * Fetch all employees (RLS handles scoping)
 */
export function useEmployees() {
  return useQuery({
    queryKey: KEYS.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, departments:department_id(id, name)')
        .order('full_name');
      if (error) throw error;
      return data as Profile[];
    },
  });
}

/**
 * Fetch a single employee by ID
 */
export function useEmployee(id: string | undefined) {
  return useQuery({
    queryKey: KEYS.detail(id ?? ''),
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, departments:department_id(id, name)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as Profile;
    },
  });
}

/**
 * Fetch team members (direct reports of a manager)
 */
export function useTeamMembers(managerId: string | undefined) {
  return useQuery({
    queryKey: KEYS.team(managerId ?? ''),
    enabled: !!managerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, departments:department_id(id, name)')
        .eq('manager_id', managerId!)
        .order('full_name');
      if (error) throw error;
      return data as Profile[];
    },
  });
}

/**
 * Create a new employee
 */
export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (employee: ProfileInsert) => {
      // First create auth user (requires service role — in production, use edge function)
      // For now, insert directly into profiles (assumes auth user exists)
      const { data, error } = await supabase
        .from('profiles')
        .insert(employee)
        .select()
        .single();
      if (error) throw error;

      // Log audit
      await supabase.from('audit_log').insert({
        actor_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'create',
        entity: 'profile',
        entity_id: data.id,
        diff: { after: employee } as Json,
      });

      return data as Profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

/**
 * Update an employee
 */
export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Profile> & { id: string }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(toProfileUpdate(updates))
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      await supabase.from('audit_log').insert({
        actor_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'update',
        entity: 'profile',
        entity_id: id,
        diff: { after: updates } as Json,
      });

      return data as Profile;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: KEYS.all });
      queryClient.invalidateQueries({ queryKey: KEYS.detail(data.id) });
    },
  });
}

/**
 * Deactivate (soft-delete) an employee
 */
export function useTerminateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'inactive' })
        .eq('id', id);
      if (error) throw error;

      await supabase.from('audit_log').insert({
        actor_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'terminate',
        entity: 'profile',
        entity_id: id,
        diff: { after: { status: 'inactive' } } as Json,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

function toProfileUpdate(updates: Partial<Profile>): ProfileUpdate {
  const { department, departments, manager, ...profileUpdates } = updates;
  return profileUpdates;
}
