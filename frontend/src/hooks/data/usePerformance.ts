// ============================================================================
// Data Hooks — Performance (TanStack Query + Supabase)
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { Json, ReviewCycle, PerformanceReview, SelfAssessment, ManagerReview } from '../../types/database';

const KEYS = {
  cycles: ['review-cycles'] as const,
  reviews: (cycleId?: string) => ['performance-reviews', cycleId] as const,
  myReview: (employeeId?: string, cycleId?: string) => ['performance-reviews', 'mine', employeeId, cycleId] as const,
};

/** Fetch review cycles */
export function useReviewCycles() {
  return useQuery({
    queryKey: KEYS.cycles,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('review_cycles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ReviewCycle[];
    },
  });
}

/** Create a review cycle (HR/Admin) */
export function useCreateCycle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cycle: Omit<ReviewCycle, 'id' | 'created_at'>) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { data, error } = await supabase
        .from('review_cycles')
        .insert({ ...cycle, created_by: userId! })
        .select()
        .single();
      if (error) throw error;
      return data as ReviewCycle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.cycles });
    },
  });
}

/** Fetch performance reviews for a cycle (RLS handles scoping) */
export function usePerformanceReviews(cycleId?: string) {
  return useQuery({
    queryKey: KEYS.reviews(cycleId),
    enabled: !!cycleId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('performance_reviews')
        .select(`
          *,
          employee:employee_id(id, full_name, avatar, department_id, job_title),
          reviewer:reviewer_id(id, full_name),
          cycle:cycle_id(id, name, period, status)
        `)
        .eq('cycle_id', cycleId!)
        .order('created_at');
      if (error) throw error;
      return data as PerformanceReview[];
    },
  });
}

/** Fetch own review for a specific cycle */
export function useMyReview(employeeId?: string, cycleId?: string) {
  return useQuery({
    queryKey: KEYS.myReview(employeeId, cycleId),
    enabled: !!employeeId && !!cycleId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('performance_reviews')
        .select(`
          *,
          cycle:cycle_id(id, name, period, status),
          reviewer:reviewer_id(id, full_name)
        `)
        .eq('employee_id', employeeId!)
        .eq('cycle_id', cycleId!)
        .maybeSingle();
      if (error) throw error;
      return data as PerformanceReview | null;
    },
  });
}

/** Submit self-assessment (employee only writes own) */
export function useSubmitSelfAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      reviewId,
      assessment,
    }: {
      reviewId: string;
      assessment: SelfAssessment;
    }) => {
      const { data, error } = await supabase
        .from('performance_reviews')
        .update({
          self_assessment: assessment as Json,
          status: 'self_assessment',
        })
        .eq('id', reviewId)
        .select()
        .single();
      if (error) throw error;
      return data as PerformanceReview;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-reviews'] });
    },
  });
}

/** Submit manager review (manager/HR/admin) */
export function useSubmitManagerReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      reviewId,
      review,
      rating,
    }: {
      reviewId: string;
      review: ManagerReview;
      rating: number;
    }) => {
      const { data, error } = await supabase
        .from('performance_reviews')
        .update({
          manager_review: review as Json,
          rating,
          status: 'completed',
        })
        .eq('id', reviewId)
        .select()
        .single();
      if (error) throw error;

      // Audit
      const userId = (await supabase.auth.getUser()).data.user?.id;
      await supabase.from('audit_log').insert({
        actor_id: userId,
        action: 'submit_review',
        entity: 'performance_review',
        entity_id: reviewId,
        diff: { rating, review } as unknown as Json,
      });

      return data as PerformanceReview;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-reviews'] });
    },
  });
}
