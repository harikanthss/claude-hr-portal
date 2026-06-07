// ============================================================================
// Edge Function: Auto Clock-Out (ATT-05)
// Runs on schedule (pg_cron or Supabase CRON) to mark incomplete sessions
// Deploy: supabase functions deploy auto-clockout
// Schedule: Set CRON in Supabase Dashboard → Database → Extensions → pg_cron
//   SELECT cron.schedule('auto-clockout', '59 23 * * *',
//     $$SELECT net.http_post(url:='<SUPABASE_URL>/functions/v1/auto-clockout', ...)$$);
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const today = new Date().toISOString().split('T')[0];

    // Find all open sessions (clock_in exists, clock_out is null, not already marked incomplete)
    const { data: openSessions, error: fetchErr } = await supabase
      .from('attendance_records')
      .select('id, employee_id, clock_in')
      .eq('work_date', today)
      .is('clock_out', null)
      .eq('is_incomplete', false);

    if (fetchErr) throw fetchErr;

    if (!openSessions?.length) {
      return new Response(
        JSON.stringify({ message: 'No open sessions found', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark all as incomplete (do NOT fill hours — require regularization)
    const ids = openSessions.map((s) => s.id);
    const { error: updateErr } = await supabase
      .from('attendance_records')
      .update({ is_incomplete: true })
      .in('id', ids);

    if (updateErr) throw updateErr;

    // Log to audit
    await supabase.from('audit_log').insert({
      actor_id: null, // system action
      action: 'auto_clockout',
      entity: 'attendance_records',
      entity_id: null,
      diff: { affected_count: openSessions.length, affected_ids: ids },
      metadata: { triggered_at: new Date().toISOString() },
    });

    return new Response(
      JSON.stringify({
        message: `Marked ${openSessions.length} sessions as incomplete`,
        count: openSessions.length,
        ids,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
