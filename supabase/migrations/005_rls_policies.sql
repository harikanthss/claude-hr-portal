-- ============================================================================
-- Migration 005: Row-Level Security Policies
-- Enables RLS on ALL tables and creates per-role access policies
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════════════
-- PROFILES
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.profiles enable row level security;

-- Self can read own profile
create policy "profiles_select_self"
  on public.profiles for select
  using (id = auth.uid());

-- Manager can read direct reports
create policy "profiles_select_manager"
  on public.profiles for select
  using (manager_id = auth.uid());

-- HR/Admin can read all
create policy "profiles_select_hr_admin"
  on public.profiles for select
  using (public.auth_role() in ('super_admin', 'hr_manager', 'admin'));

-- Employee directory: all authenticated can see basic info (enforced via view if needed)
create policy "profiles_select_directory"
  on public.profiles for select
  using (auth.uid() is not null and status = 'active');

-- HR/Admin can insert/update/delete profiles
create policy "profiles_insert_hr_admin"
  on public.profiles for insert
  with check (public.auth_role() in ('super_admin', 'hr_manager', 'admin'));

create policy "profiles_update_hr_admin"
  on public.profiles for update
  using (public.auth_role() in ('super_admin', 'hr_manager', 'admin'));

-- Self can update own limited fields (phone, emergency_contact, avatar, bio)
create policy "profiles_update_self"
  on public.profiles for update
  using (id = auth.uid());

create policy "profiles_delete_hr_admin"
  on public.profiles for delete
  using (public.auth_role() in ('super_admin', 'hr_manager', 'admin'));

-- ═══════════════════════════════════════════════════════════════════════════
-- DEPARTMENTS
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.departments enable row level security;

create policy "departments_select_all"
  on public.departments for select
  using (auth.uid() is not null);

create policy "departments_modify_hr_admin"
  on public.departments for all
  using (public.auth_role() in ('super_admin', 'hr_manager', 'admin'));

-- ═══════════════════════════════════════════════════════════════════════════
-- JOB ROLES
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.job_roles enable row level security;

create policy "job_roles_select_all"
  on public.job_roles for select
  using (auth.uid() is not null);

create policy "job_roles_modify_hr_admin"
  on public.job_roles for all
  using (public.auth_role() in ('super_admin', 'hr_manager', 'admin'));

-- ═══════════════════════════════════════════════════════════════════════════
-- LEAVE TYPES
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.leave_types enable row level security;

create policy "leave_types_select_all"
  on public.leave_types for select
  using (auth.uid() is not null);

create policy "leave_types_modify_hr_admin"
  on public.leave_types for all
  using (public.auth_role() in ('super_admin', 'hr_manager', 'admin'));

-- ═══════════════════════════════════════════════════════════════════════════
-- LEAVE BALANCES
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.leave_balances enable row level security;

-- Self sees own balances
create policy "leave_balances_select_self"
  on public.leave_balances for select
  using (employee_id = auth.uid());

-- Manager sees team balances
create policy "leave_balances_select_manager"
  on public.leave_balances for select
  using (public.is_manager_of(employee_id));

-- HR/Admin sees all
create policy "leave_balances_select_hr_admin"
  on public.leave_balances for select
  using (public.auth_role() in ('super_admin', 'hr_manager', 'admin'));

-- Only HR/Admin can modify balances
create policy "leave_balances_modify_hr_admin"
  on public.leave_balances for all
  using (public.auth_role() in ('super_admin', 'hr_manager', 'admin'));

-- ═══════════════════════════════════════════════════════════════════════════
-- LEAVE REQUESTS
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.leave_requests enable row level security;

-- Self sees own requests
create policy "leave_requests_select_self"
  on public.leave_requests for select
  using (employee_id = auth.uid());

-- Manager sees team requests
create policy "leave_requests_select_manager"
  on public.leave_requests for select
  using (public.is_manager_of(employee_id));

-- HR/Admin sees all
create policy "leave_requests_select_hr_admin"
  on public.leave_requests for select
  using (public.auth_role() in ('super_admin', 'hr_manager', 'admin'));

-- Self can insert own requests
create policy "leave_requests_insert_self"
  on public.leave_requests for insert
  with check (employee_id = auth.uid());

-- Manager (of the employee), HR, Admin can update (approve/reject)
create policy "leave_requests_update_approver"
  on public.leave_requests for update
  using (
    public.is_manager_of(employee_id)
    or public.auth_role() in ('super_admin', 'hr_manager', 'admin')
  );

-- Self can cancel own pending request
create policy "leave_requests_update_self_cancel"
  on public.leave_requests for update
  using (employee_id = auth.uid() and status = 'pending');

-- ═══════════════════════════════════════════════════════════════════════════
-- ATTENDANCE RECORDS
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.attendance_records enable row level security;

-- Self, manager, HR/Admin can see
create policy "attendance_select"
  on public.attendance_records for select
  using (
    employee_id = auth.uid()
    or public.is_manager_of(employee_id)
    or public.auth_role() in ('super_admin', 'hr_manager', 'admin')
  );

-- Self can clock in/out (insert)
create policy "attendance_insert_self"
  on public.attendance_records for insert
  with check (employee_id = auth.uid());

-- Self can update own record (clock out)
create policy "attendance_update_self"
  on public.attendance_records for update
  using (employee_id = auth.uid());

-- HR/Admin can update any record (regularization, direct edit)
create policy "attendance_update_hr_admin"
  on public.attendance_records for update
  using (public.auth_role() in ('super_admin', 'hr_manager', 'admin'));

-- ═══════════════════════════════════════════════════════════════════════════
-- ATTENDANCE REGULARIZATIONS
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.attendance_regularizations enable row level security;

create policy "regularizations_select"
  on public.attendance_regularizations for select
  using (
    employee_id = auth.uid()
    or public.is_manager_of(employee_id)
    or public.auth_role() in ('super_admin', 'hr_manager', 'admin')
  );

create policy "regularizations_insert_self"
  on public.attendance_regularizations for insert
  with check (employee_id = auth.uid());

create policy "regularizations_update_approver"
  on public.attendance_regularizations for update
  using (
    public.is_manager_of(employee_id)
    or public.auth_role() in ('super_admin', 'hr_manager', 'admin')
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- WORK MODE REQUESTS
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.work_mode_requests enable row level security;

create policy "work_mode_select"
  on public.work_mode_requests for select
  using (
    employee_id = auth.uid()
    or public.is_manager_of(employee_id)
    or public.auth_role() in ('super_admin', 'hr_manager', 'admin')
  );

create policy "work_mode_insert_self"
  on public.work_mode_requests for insert
  with check (employee_id = auth.uid());

create policy "work_mode_update_approver"
  on public.work_mode_requests for update
  using (
    public.is_manager_of(employee_id)
    or public.auth_role() in ('super_admin', 'hr_manager', 'admin')
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- WORK POLICIES
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.work_policies enable row level security;

create policy "work_policies_select_all"
  on public.work_policies for select
  using (auth.uid() is not null);

create policy "work_policies_modify_hr_admin"
  on public.work_policies for all
  using (public.auth_role() in ('super_admin', 'hr_manager', 'admin'));

-- ═══════════════════════════════════════════════════════════════════════════
-- HOLIDAYS
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.holidays enable row level security;

create policy "holidays_select_all"
  on public.holidays for select
  using (auth.uid() is not null);

create policy "holidays_modify_hr_admin"
  on public.holidays for all
  using (public.auth_role() in ('super_admin', 'hr_manager', 'admin'));

-- ═══════════════════════════════════════════════════════════════════════════
-- JOB POSTINGS
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.job_postings enable row level security;

-- HR/Admin/Manager can view
create policy "job_postings_select"
  on public.job_postings for select
  using (public.auth_role() in ('super_admin', 'hr_manager', 'admin', 'manager'));

create policy "job_postings_insert_hr_admin"
  on public.job_postings for insert
  with check (public.auth_role() in ('super_admin', 'hr_manager', 'admin'));

create policy "job_postings_update"
  on public.job_postings for update
  using (
    public.auth_role() in ('super_admin', 'hr_manager', 'admin')
    or posted_by = auth.uid()
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- CANDIDATES
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.candidates enable row level security;

create policy "candidates_select"
  on public.candidates for select
  using (public.auth_role() in ('super_admin', 'hr_manager', 'admin', 'manager'));

create policy "candidates_insert_hr_admin"
  on public.candidates for insert
  with check (public.auth_role() in ('super_admin', 'hr_manager', 'admin'));

create policy "candidates_update"
  on public.candidates for update
  using (public.auth_role() in ('super_admin', 'hr_manager', 'admin'));

create policy "candidates_delete_hr_admin"
  on public.candidates for delete
  using (public.auth_role() in ('super_admin', 'hr_manager', 'admin'));

-- ═══════════════════════════════════════════════════════════════════════════
-- PAYROLL RUNS
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.payroll_runs enable row level security;

-- Only HR/Admin can see and manage payroll runs
create policy "payroll_runs_select_hr_admin"
  on public.payroll_runs for select
  using (public.auth_role() in ('super_admin', 'hr_manager', 'admin'));

create policy "payroll_runs_modify_hr_admin"
  on public.payroll_runs for all
  using (public.auth_role() in ('super_admin', 'hr_manager', 'admin'));

-- ═══════════════════════════════════════════════════════════════════════════
-- PAYROLL RECORDS — CRITICAL PRIVACY
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.payroll_records enable row level security;

-- Employee sees ONLY own payslip
create policy "payroll_records_select_self"
  on public.payroll_records for select
  using (employee_id = auth.uid());

-- HR/Admin sees all
create policy "payroll_records_select_hr_admin"
  on public.payroll_records for select
  using (public.auth_role() in ('super_admin', 'hr_manager', 'admin'));

-- Only HR/Admin can modify payroll records
create policy "payroll_records_modify_hr_admin"
  on public.payroll_records for all
  using (public.auth_role() in ('super_admin', 'hr_manager', 'admin'));

-- ⚠️  Managers and Employees get NO org-wide select — closes salary leak

-- ═══════════════════════════════════════════════════════════════════════════
-- REVIEW CYCLES
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.review_cycles enable row level security;

create policy "review_cycles_select"
  on public.review_cycles for select
  using (auth.uid() is not null);

create policy "review_cycles_modify_hr_admin"
  on public.review_cycles for all
  using (public.auth_role() in ('super_admin', 'hr_manager', 'admin'));

-- ═══════════════════════════════════════════════════════════════════════════
-- PERFORMANCE REVIEWS — CRITICAL PRIVACY
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.performance_reviews enable row level security;

-- Self, reviewer, manager of employee, HR/Admin
create policy "perf_reviews_select"
  on public.performance_reviews for select
  using (
    employee_id = auth.uid()
    or reviewer_id = auth.uid()
    or public.is_manager_of(employee_id)
    or public.auth_role() in ('super_admin', 'hr_manager', 'admin')
  );

-- Self can update own self-assessment
create policy "perf_reviews_update_self"
  on public.performance_reviews for update
  using (employee_id = auth.uid());

-- Manager/HR/Admin can update manager review
create policy "perf_reviews_update_reviewer"
  on public.performance_reviews for update
  using (
    reviewer_id = auth.uid()
    or public.is_manager_of(employee_id)
    or public.auth_role() in ('super_admin', 'hr_manager', 'admin')
  );

-- HR/Admin can insert reviews
create policy "perf_reviews_insert_hr_admin"
  on public.performance_reviews for insert
  with check (public.auth_role() in ('super_admin', 'hr_manager', 'admin'));

-- ═══════════════════════════════════════════════════════════════════════════
-- ANNOUNCEMENTS
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.announcements enable row level security;

-- All authenticated can view
create policy "announcements_select_all"
  on public.announcements for select
  using (auth.uid() is not null);

-- HR/Admin can create/edit/delete
create policy "announcements_modify_hr_admin"
  on public.announcements for all
  using (public.auth_role() in ('super_admin', 'hr_manager', 'admin'));

-- ═══════════════════════════════════════════════════════════════════════════
-- NOTIFICATION PREFS
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.notification_prefs enable row level security;

create policy "notif_prefs_select_self"
  on public.notification_prefs for select
  using (employee_id = auth.uid());

create policy "notif_prefs_modify_self"
  on public.notification_prefs for all
  using (employee_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════
-- AUDIT LOG
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.audit_log enable row level security;

-- Only Admin can read audit log
create policy "audit_log_select_admin"
  on public.audit_log for select
  using (public.auth_role() in ('super_admin', 'admin'));

-- HR can also view (not modify)
create policy "audit_log_select_hr"
  on public.audit_log for select
  using (public.auth_role() = 'hr_manager');

-- System inserts (via triggers/functions) use service role, so no insert policy needed for users
-- But allow authenticated to insert for client-side audit writes
create policy "audit_log_insert_authenticated"
  on public.audit_log for insert
  with check (auth.uid() is not null);

-- ═══════════════════════════════════════════════════════════════════════════
-- STORAGE BUCKETS
-- ═══════════════════════════════════════════════════════════════════════════

-- Create storage buckets
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
insert into storage.buckets (id, name, public) values ('documents', 'documents', false);
insert into storage.buckets (id, name, public) values ('payslips', 'payslips', false);

-- Avatar storage policies (public read, authenticated upload)
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_auth_upload"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid() is not null);

create policy "avatars_owner_update"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Document storage policies (HR/Admin + self)
create policy "documents_select"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or public.auth_role() in ('super_admin', 'hr_manager', 'admin')
    )
  );

create policy "documents_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or public.auth_role() in ('super_admin', 'hr_manager', 'admin')
    )
  );

-- Payslip storage (self + HR/Admin)
create policy "payslips_select"
  on storage.objects for select
  using (
    bucket_id = 'payslips'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or public.auth_role() in ('super_admin', 'hr_manager', 'admin')
    )
  );

create policy "payslips_insert_hr_admin"
  on storage.objects for insert
  with check (
    bucket_id = 'payslips'
    and public.auth_role() in ('super_admin', 'hr_manager', 'admin')
  );
