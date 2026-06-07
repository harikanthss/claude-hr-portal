// ============================================================================
// Data Hooks — Audit Log (TanStack Query + Supabase)
// ============================================================================

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { AuditLogEntry, Json } from '../../types/database';

const KEYS = {
  all: (filters?: Record<string, string>) => ['audit-log', filters] as const,
};

/** Fetch audit log entries (Admin/HR only via RLS) */
export function useAuditLog(filters?: {
  entity?: string;
  action?: string;
  actor_id?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: KEYS.all(filters as Record<string, string>),
    queryFn: async () => {
      let query = supabase
        .from('audit_log')
        .select('*, actor:actor_id(id, full_name, email)')
        .order('at', { ascending: false })
        .limit(filters?.limit || 100);

      if (filters?.entity) query = query.eq('entity', filters.entity);
      if (filters?.action) query = query.eq('action', filters.action);
      if (filters?.actor_id) query = query.eq('actor_id', filters.actor_id);

      const { data, error } = await query;
      if (error) throw error;
      return data as AuditLogEntry[];
    },
  });
}

/** Helper: log an audit entry from client-side */
export async function logAudit(
  action: string,
  entity: string,
  entityId?: string,
  diff?: Record<string, unknown>
) {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  await supabase.from('audit_log').insert({
    actor_id: userId || null,
    action,
    entity,
    entity_id: entityId || null,
    diff: (diff || {}) as Json,
  });
}
