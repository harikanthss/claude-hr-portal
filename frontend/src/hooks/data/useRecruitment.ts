// ============================================================================
// Data Hooks — Recruitment (TanStack Query + Supabase)
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { JobPosting, Candidate, JobPostingInsert, Json } from '../../types/database';

const KEYS = {
  jobs: ['job-postings'] as const,
  candidates: (jobId?: string) => ['candidates', jobId] as const,
};

/** Fetch job postings (RLS: HR/Admin/Manager) */
export function useJobPostings() {
  return useQuery({
    queryKey: KEYS.jobs,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*, department:department_id(id, name)')
        .order('posted_date', { ascending: false });
      if (error) throw error;
      return data as JobPosting[];
    },
  });
}

/** Fetch candidates for a job */
export function useCandidates(jobId?: string) {
  return useQuery({
    queryKey: KEYS.candidates(jobId),
    queryFn: async () => {
      let query = supabase
        .from('candidates')
        .select('*')
        .order('applied_at', { ascending: false });
      if (jobId) query = query.eq('job_posting_id', jobId);
      const { data, error } = await query;
      if (error) throw error;
      return data as Candidate[];
    },
  });
}

/** Post a new job */
export function usePostJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (job: JobPostingInsert) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { data, error } = await supabase
        .from('job_postings')
        .insert({ ...job, posted_by: userId! })
        .select()
        .single();
      if (error) throw error;
      return data as JobPosting;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.jobs });
    },
  });
}

/** Update candidate stage */
export function useUpdateCandidateStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, stage, notes }: { id: string; stage: Candidate['stage']; notes?: string }) => {
      const { data, error } = await supabase
        .from('candidates')
        .update({ stage, notes: notes || undefined })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Candidate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: KEYS.candidates(data.job_posting_id || undefined) });
      queryClient.invalidateQueries({ queryKey: KEYS.candidates() });
    },
  });
}

/** Hire a candidate — creates a profile and moves stage to 'hired' */
export function useHireCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      candidateId,
      jobPostingId,
      role,
      department_id,
      salary,
    }: {
      candidateId: string;
      jobPostingId: string;
      role?: string;
      department_id?: string;
      salary?: number;
    }) => {
      // 1. Get candidate details
      const { data: candidate, error: candErr } = await supabase
        .from('candidates')
        .select('*, job_posting:job_posting_id(title, department_id)')
        .eq('id', candidateId)
        .single();
      if (candErr) throw candErr;
      const candidateRow = candidate as Candidate & { job_posting?: { title?: string } | null };

      // 2. Move stage to hired
      await supabase
        .from('candidates')
        .update({ stage: 'hired' })
        .eq('id', candidateId);

      // Note: Creating the actual auth user + profile would require a service-role edge function.
      // For now, this marks them as hired. Profile creation happens via onboarding.

      // 3. Audit
      const userId = (await supabase.auth.getUser()).data.user?.id;
      await supabase.from('audit_log').insert({
        actor_id: userId,
        action: 'hire',
        entity: 'candidate',
        entity_id: candidateId,
        diff: { candidate_name: candidateRow.name, job_title: candidateRow.job_posting?.title } as Json,
      });

      return candidateRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}
