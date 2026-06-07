// ============================================================================
// Data Hooks — Announcements (TanStack Query + Supabase)
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { api } from '../../services/store';
import type { Announcement } from '../../types/database';

const KEYS = {
  all: ['announcements'] as const,
};

/** Fetch all announcements (all authenticated users can read) */
export function useAnnouncements() {
  return useQuery({
    queryKey: KEYS.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*, author:posted_by(id, full_name, avatar_url)')
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Announcement[];
    },
  });
}

/** Publish a new announcement (HR/Admin) */
export function usePublishAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (announcement: { title: string; body: string; category: string; pinned?: boolean }) => {
      return api.post('/announcements', announcement) as Promise<Announcement>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

/** Toggle pin on an announcement */
export function useTogglePin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      const { error } = await supabase
        .from('announcements')
        .update({ pinned })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

/** Delete an announcement */
export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}
