# Supabase Migration Validation Report

Generated: 2026-06-02T15:12:13.227Z

## Migration Files
- PASS supabase/migrations/001_initial_schema.sql
- PASS supabase/migrations/002_rls_policies.sql
- PASS supabase/generated/seed.sql

## SQL Errors
- PASS No SQL errors recorded by this runner.

## Schema Validation
- PASS Tables present: 27/27
- PASS Helper functions present: 4/4
- PASS RLS enabled on expected tables: 27/27
- Foreign keys found: 43
- Indexes found: 20
- Updated-at triggers found: 24
- RLS policies found: 65

## Missing Objects
- Missing tables: none
- Missing functions: none
- Tables without RLS: none

## Row Counts
- departments: 7
- profiles: 13
- job_roles: 0
- leave_types: 8
- leave_balances: 0
- leave_requests: 7
- work_policies: 1
- holidays: 7
- attendance_records: 330
- attendance_regularizations: 0
- work_mode_requests: 0
- job_postings: 5
- candidates: 5
- payroll_runs: 3
- payroll_records: 33
- review_cycles: 1
- performance_reviews: 5
- expenses: 5
- documents: 6
- shifts: 2
- calendar_events: 7
- notifications: 2
- notification_prefs: 0
- audit_log: 4
- onboarding_tasks: 14
- department_budgets: 9
- announcements: 0

## RLS Probe
- Status: COMPLETED
- PASS Employee cannot read peer payroll: actual 0, expected 0
- PASS Manager cannot read non-self payroll: actual 0, expected 0
- PASS Manager can read direct reports: actual 5, expected > 0
- PASS Employee leave scoped to self: actual 0, expected 0
- PASS Employee attendance scoped to self: actual 0, expected 0
- PASS Employee performance scoped to self: actual 0, expected 0
- PASS HR can read payroll records: actual 33, expected > 0
- PASS Admin can read profiles: actual 13, expected > 0

## Notes
- This runner uses the Priority 2 blueprint migrations only: 001_initial_schema.sql, 002_rls_policies.sql, and generated seed.sql.
- The older split migration family in supabase/migrations is intentionally not applied by this runner because it conflicts with the blueprint schema.
- Seed requires matching auth.users IDs before profile inserts can succeed in a real Supabase project.
