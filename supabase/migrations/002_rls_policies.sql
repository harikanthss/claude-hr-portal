-- Grevya HR Portal - Row Level Security policies

do $$ declare
  tbl text;
begin
  foreach tbl in array array[
    'departments','profiles','job_roles','leave_types','leave_balances','leave_requests',
    'work_policies','holidays','attendance_records','attendance_regularizations','work_mode_requests',
    'job_postings','candidates','payroll_runs','payroll_records','review_cycles',
    'performance_reviews','expenses','documents','shifts','calendar_events',
    'notifications','notification_prefs','audit_log','onboarding_tasks','department_budgets','announcements'
  ] loop
    execute format('alter table public.%I enable row level security', tbl);
  end loop;
end $$;

-- profiles
drop policy if exists profiles_select_scoped on public.profiles;
create policy profiles_select_scoped on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or manager_id = auth.uid()
  or public.is_admin_or_hr()
);

drop policy if exists profiles_insert_admin_hr on public.profiles;
create policy profiles_insert_admin_hr on public.profiles
for insert
to authenticated
with check (public.is_admin_or_hr());

drop policy if exists profiles_update_admin_hr on public.profiles;
create policy profiles_update_admin_hr on public.profiles
for update
to authenticated
using (public.is_admin_or_hr())
with check (public.is_admin_or_hr());

drop policy if exists profiles_delete_admin_hr on public.profiles;
create policy profiles_delete_admin_hr on public.profiles
for delete
to authenticated
using (public.is_admin_or_hr());

-- organization reference data
drop policy if exists departments_select_auth on public.departments;
create policy departments_select_auth on public.departments for select to authenticated using (true);
drop policy if exists departments_write_admin_hr on public.departments;
create policy departments_write_admin_hr on public.departments for all to authenticated using (public.is_admin_or_hr()) with check (public.is_admin_or_hr());

drop policy if exists job_roles_select_auth on public.job_roles;
create policy job_roles_select_auth on public.job_roles for select to authenticated using (true);
drop policy if exists job_roles_write_admin_hr on public.job_roles;
create policy job_roles_write_admin_hr on public.job_roles for all to authenticated using (public.is_admin_or_hr()) with check (public.is_admin_or_hr());

drop policy if exists leave_types_select_auth on public.leave_types;
create policy leave_types_select_auth on public.leave_types for select to authenticated using (true);
drop policy if exists leave_types_write_admin_hr on public.leave_types;
create policy leave_types_write_admin_hr on public.leave_types for all to authenticated using (public.is_admin_or_hr()) with check (public.is_admin_or_hr());

-- leave
drop policy if exists leave_balances_select_scoped on public.leave_balances;
create policy leave_balances_select_scoped on public.leave_balances
for select to authenticated
using (employee_id = auth.uid() or public.is_manager_of(employee_id) or public.is_admin_or_hr());

drop policy if exists leave_balances_write_admin_hr on public.leave_balances;
create policy leave_balances_write_admin_hr on public.leave_balances
for all to authenticated
using (public.is_admin_or_hr())
with check (public.is_admin_or_hr());

drop policy if exists leave_requests_select_scoped on public.leave_requests;
create policy leave_requests_select_scoped on public.leave_requests
for select to authenticated
using (employee_id = auth.uid() or public.is_manager_of(employee_id) or public.is_admin_or_hr());

drop policy if exists leave_requests_insert_self on public.leave_requests;
create policy leave_requests_insert_self on public.leave_requests
for insert to authenticated
with check (employee_id = auth.uid());

drop policy if exists leave_requests_update_approver on public.leave_requests;
create policy leave_requests_update_approver on public.leave_requests
for update to authenticated
using (public.is_manager_of(employee_id) or public.is_admin_or_hr())
with check (public.is_manager_of(employee_id) or public.is_admin_or_hr());

drop policy if exists leave_requests_delete_self_pending on public.leave_requests;
create policy leave_requests_delete_self_pending on public.leave_requests
for delete to authenticated
using (employee_id = auth.uid() and status = 'pending');

-- attendance
drop policy if exists work_policies_select_auth on public.work_policies;
create policy work_policies_select_auth on public.work_policies for select to authenticated using (true);
drop policy if exists work_policies_write_admin_hr on public.work_policies;
create policy work_policies_write_admin_hr on public.work_policies for all to authenticated using (public.is_admin_or_hr()) with check (public.is_admin_or_hr());

drop policy if exists holidays_select_auth on public.holidays;
create policy holidays_select_auth on public.holidays for select to authenticated using (true);
drop policy if exists holidays_write_admin_hr on public.holidays;
create policy holidays_write_admin_hr on public.holidays for all to authenticated using (public.is_admin_or_hr()) with check (public.is_admin_or_hr());

drop policy if exists attendance_records_select_scoped on public.attendance_records;
create policy attendance_records_select_scoped on public.attendance_records
for select to authenticated
using (employee_id = auth.uid() or public.is_manager_of(employee_id) or public.is_admin_or_hr());

drop policy if exists attendance_records_insert_self on public.attendance_records;
create policy attendance_records_insert_self on public.attendance_records
for insert to authenticated
with check (employee_id = auth.uid());

drop policy if exists attendance_records_update_self_or_admin on public.attendance_records;
create policy attendance_records_update_self_or_admin on public.attendance_records
for update to authenticated
using (employee_id = auth.uid() or public.is_admin_or_hr())
with check (employee_id = auth.uid() or public.is_admin_or_hr());

drop policy if exists attendance_regularizations_select_scoped on public.attendance_regularizations;
create policy attendance_regularizations_select_scoped on public.attendance_regularizations
for select to authenticated
using (employee_id = auth.uid() or public.is_manager_of(employee_id) or public.is_admin_or_hr());

drop policy if exists attendance_regularizations_insert_self on public.attendance_regularizations;
create policy attendance_regularizations_insert_self on public.attendance_regularizations
for insert to authenticated
with check (employee_id = auth.uid());

drop policy if exists attendance_regularizations_update_approver on public.attendance_regularizations;
create policy attendance_regularizations_update_approver on public.attendance_regularizations
for update to authenticated
using (public.is_manager_of(employee_id) or public.is_admin_or_hr())
with check (public.is_manager_of(employee_id) or public.is_admin_or_hr());

drop policy if exists work_mode_requests_select_scoped on public.work_mode_requests;
create policy work_mode_requests_select_scoped on public.work_mode_requests
for select to authenticated
using (employee_id = auth.uid() or public.is_manager_of(employee_id) or public.is_admin_or_hr());

drop policy if exists work_mode_requests_insert_self on public.work_mode_requests;
create policy work_mode_requests_insert_self on public.work_mode_requests
for insert to authenticated
with check (employee_id = auth.uid());

drop policy if exists work_mode_requests_update_approver on public.work_mode_requests;
create policy work_mode_requests_update_approver on public.work_mode_requests
for update to authenticated
using (public.is_manager_of(employee_id) or public.is_admin_or_hr())
with check (public.is_manager_of(employee_id) or public.is_admin_or_hr());

-- recruitment
drop policy if exists job_postings_select_recruiters on public.job_postings;
create policy job_postings_select_recruiters on public.job_postings
for select to authenticated
using (public.auth_role() in ('super_admin', 'admin', 'hr_manager', 'manager'));

drop policy if exists job_postings_insert_admin_hr_manager_owner on public.job_postings;
create policy job_postings_insert_admin_hr_manager_owner on public.job_postings
for insert to authenticated
with check (public.is_admin_or_hr() or (public.auth_role() = 'manager' and posted_by = auth.uid()));

drop policy if exists job_postings_update_admin_hr_owner on public.job_postings;
create policy job_postings_update_admin_hr_owner on public.job_postings
for update to authenticated
using (public.is_admin_or_hr() or posted_by = auth.uid())
with check (public.is_admin_or_hr() or posted_by = auth.uid());

drop policy if exists job_postings_delete_admin_hr on public.job_postings;
create policy job_postings_delete_admin_hr on public.job_postings
for delete to authenticated
using (public.is_admin_or_hr());

drop policy if exists candidates_select_recruiters on public.candidates;
create policy candidates_select_recruiters on public.candidates
for select to authenticated
using (
  public.is_admin_or_hr()
  or exists (
    select 1 from public.job_postings jp
    where jp.id = candidates.job_posting_id
      and jp.posted_by = auth.uid()
  )
);

drop policy if exists candidates_write_recruiters on public.candidates;
create policy candidates_write_recruiters on public.candidates
for all to authenticated
using (
  public.is_admin_or_hr()
  or exists (
    select 1 from public.job_postings jp
    where jp.id = candidates.job_posting_id
      and jp.posted_by = auth.uid()
  )
)
with check (
  public.is_admin_or_hr()
  or exists (
    select 1 from public.job_postings jp
    where jp.id = candidates.job_posting_id
      and jp.posted_by = auth.uid()
  )
);

-- payroll
drop policy if exists payroll_runs_select_scoped on public.payroll_runs;
create policy payroll_runs_select_scoped on public.payroll_runs
for select to authenticated
using (
  public.is_admin_or_hr()
  or exists (
    select 1 from public.payroll_records pr
    where pr.run_id = payroll_runs.id
      and pr.employee_id = auth.uid()
  )
);

drop policy if exists payroll_runs_write_admin_hr on public.payroll_runs;
create policy payroll_runs_write_admin_hr on public.payroll_runs
for all to authenticated
using (public.is_admin_or_hr())
with check (public.is_admin_or_hr());

drop policy if exists payroll_records_select_scoped on public.payroll_records;
create policy payroll_records_select_scoped on public.payroll_records
for select to authenticated
using (employee_id = auth.uid() or public.is_admin_or_hr());

drop policy if exists payroll_records_write_admin_hr on public.payroll_records;
create policy payroll_records_write_admin_hr on public.payroll_records
for all to authenticated
using (public.is_admin_or_hr())
with check (public.is_admin_or_hr());

-- performance
drop policy if exists review_cycles_select_auth on public.review_cycles;
create policy review_cycles_select_auth on public.review_cycles for select to authenticated using (true);
drop policy if exists review_cycles_write_admin_hr on public.review_cycles;
create policy review_cycles_write_admin_hr on public.review_cycles for all to authenticated using (public.is_admin_or_hr()) with check (public.is_admin_or_hr());

drop policy if exists performance_reviews_select_scoped on public.performance_reviews;
create policy performance_reviews_select_scoped on public.performance_reviews
for select to authenticated
using (
  employee_id = auth.uid()
  or reviewer_id = auth.uid()
  or public.is_manager_of(employee_id)
  or public.is_admin_or_hr()
);

drop policy if exists performance_reviews_insert_reviewer on public.performance_reviews;
create policy performance_reviews_insert_reviewer on public.performance_reviews
for insert to authenticated
with check (public.is_admin_or_hr() or public.is_manager_of(employee_id) or employee_id = auth.uid());

drop policy if exists performance_reviews_update_scoped on public.performance_reviews;
create policy performance_reviews_update_scoped on public.performance_reviews
for update to authenticated
using (employee_id = auth.uid() or public.is_manager_of(employee_id) or public.is_admin_or_hr())
with check (employee_id = auth.uid() or public.is_manager_of(employee_id) or public.is_admin_or_hr());

-- expenses
drop policy if exists expenses_select_scoped on public.expenses;
create policy expenses_select_scoped on public.expenses
for select to authenticated
using (employee_id = auth.uid() or public.is_manager_of(employee_id) or public.is_admin_or_hr());

drop policy if exists expenses_insert_self on public.expenses;
create policy expenses_insert_self on public.expenses for insert to authenticated with check (employee_id = auth.uid());

drop policy if exists expenses_update_approver on public.expenses;
create policy expenses_update_approver on public.expenses
for update to authenticated
using (public.is_manager_of(employee_id) or public.is_admin_or_hr())
with check (public.is_manager_of(employee_id) or public.is_admin_or_hr());

-- documents
drop policy if exists documents_select_scoped on public.documents;
create policy documents_select_scoped on public.documents
for select to authenticated
using (employee_id is null or employee_id = auth.uid() or public.is_manager_of(employee_id) or public.is_admin_or_hr());

drop policy if exists documents_insert_scoped on public.documents;
create policy documents_insert_scoped on public.documents
for insert to authenticated
with check (employee_id = auth.uid() or public.is_manager_of(employee_id) or public.is_admin_or_hr());

drop policy if exists documents_delete_admin_hr on public.documents;
create policy documents_delete_admin_hr on public.documents for delete to authenticated using (public.is_admin_or_hr());

-- shifts
drop policy if exists shifts_select_scoped on public.shifts;
create policy shifts_select_scoped on public.shifts
for select to authenticated
using (employee_id = auth.uid() or public.is_manager_of(employee_id) or public.is_admin_or_hr());

drop policy if exists shifts_write_scoped on public.shifts;
create policy shifts_write_scoped on public.shifts
for all to authenticated
using (public.is_manager_of(employee_id) or public.is_admin_or_hr())
with check (public.is_manager_of(employee_id) or public.is_admin_or_hr());

-- shared company content
drop policy if exists calendar_events_select_auth on public.calendar_events;
create policy calendar_events_select_auth on public.calendar_events for select to authenticated using (true);
drop policy if exists calendar_events_write_admin_hr on public.calendar_events;
create policy calendar_events_write_admin_hr on public.calendar_events for all to authenticated using (public.is_admin_or_hr()) with check (public.is_admin_or_hr());

drop policy if exists announcements_select_auth on public.announcements;
create policy announcements_select_auth on public.announcements for select to authenticated using (true);
drop policy if exists announcements_write_admin_hr on public.announcements;
create policy announcements_write_admin_hr on public.announcements for all to authenticated using (public.is_admin_or_hr()) with check (public.is_admin_or_hr());

-- notifications and prefs
drop policy if exists notifications_select_scoped on public.notifications;
create policy notifications_select_scoped on public.notifications
for select to authenticated
using (user_id is null or user_id = auth.uid());

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists notifications_insert_admin_hr on public.notifications;
create policy notifications_insert_admin_hr on public.notifications for insert to authenticated with check (public.is_admin_or_hr());

drop policy if exists notification_prefs_self on public.notification_prefs;
create policy notification_prefs_self on public.notification_prefs
for all to authenticated
using (employee_id = auth.uid())
with check (employee_id = auth.uid());

-- audit and operational tables
drop policy if exists audit_log_select_admin_hr on public.audit_log;
create policy audit_log_select_admin_hr on public.audit_log for select to authenticated using (public.is_admin_or_hr());

drop policy if exists onboarding_tasks_select_scoped on public.onboarding_tasks;
create policy onboarding_tasks_select_scoped on public.onboarding_tasks
for select to authenticated
using (employee_id = auth.uid() or public.is_manager_of(employee_id) or public.is_admin_or_hr());

drop policy if exists onboarding_tasks_write_admin_hr on public.onboarding_tasks;
create policy onboarding_tasks_write_admin_hr on public.onboarding_tasks
for all to authenticated
using (public.is_admin_or_hr())
with check (public.is_admin_or_hr());

drop policy if exists department_budgets_select_admin_hr on public.department_budgets;
create policy department_budgets_select_admin_hr on public.department_budgets for select to authenticated using (public.is_admin_or_hr());
drop policy if exists department_budgets_write_admin_hr on public.department_budgets;
create policy department_budgets_write_admin_hr on public.department_budgets for all to authenticated using (public.is_admin_or_hr()) with check (public.is_admin_or_hr());
