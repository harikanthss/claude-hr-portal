-- Grevya HR Portal - Supabase core schema
-- Source of truth for Priority 2 migration from SQLite to Supabase.

create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('admin', 'hr_manager', 'manager', 'employee');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.profile_status as enum ('active', 'inactive', 'on_leave');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.employment_type as enum ('full_time', 'part_time', 'contract', 'intern');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.leave_status as enum ('pending', 'approved', 'rejected', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.attendance_status as enum ('present', 'absent', 'late', 'half_day', 'holiday', 'leave', 'wfh', 'incomplete');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.work_mode as enum ('office', 'remote', 'hybrid');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.request_status as enum ('pending', 'approved', 'rejected', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payroll_status as enum ('draft', 'processing', 'processed', 'paid', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.review_status as enum ('draft', 'self_assessment', 'manager_review', 'completed', 'archived');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.job_status as enum ('active', 'paused', 'closed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.candidate_stage as enum ('applied', 'screening', 'interview', 'offer', 'hired', 'rejected');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.expense_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.shift_status as enum ('scheduled', 'completed', 'cancelled');
exception when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  head_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  avatar text,
  phone text,
  role public.app_role not null default 'employee',
  department_id uuid references public.departments(id) on delete set null,
  manager_id uuid references public.profiles(id) on delete set null,
  job_title text,
  status public.profile_status not null default 'active',
  employment_type public.employment_type not null default 'full_time',
  location text,
  hire_date date,
  salary numeric(12,2),
  dob date,
  gender text,
  emergency_contact jsonb not null default '{}'::jsonb,
  bio text,
  performance_score integer not null default 80 check (performance_score between 0 and 100),
  attendance_score integer not null default 95 check (attendance_score between 0 and 100),
  points integer not null default 0,
  streak integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.departments
  drop constraint if exists departments_head_id_fkey,
  add constraint departments_head_id_fkey foreign key (head_id) references public.profiles(id) on delete set null;

create table if not exists public.job_roles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  department_id uuid references public.departments(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (title, department_id)
);

create table if not exists public.leave_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  annual_quota integer not null default 0,
  carry_forward boolean not null default false,
  paid boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leave_balances (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  leave_type_id uuid not null references public.leave_types(id) on delete cascade,
  year integer not null,
  total numeric(5,2) not null default 0,
  used numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, leave_type_id, year)
);

create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  leave_type_id uuid not null references public.leave_types(id),
  from_date date not null,
  to_date date not null,
  days numeric(5,2) not null check (days > 0),
  status public.leave_status not null default 'pending',
  reason text,
  approver_id uuid references public.profiles(id) on delete set null,
  comments text,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (to_date >= from_date)
);

create table if not exists public.work_policies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  start_time time not null default '09:00',
  end_time time not null default '17:00',
  grace_minutes integer not null default 15,
  half_day_hours numeric(4,2) not null default 4,
  standard_hours numeric(4,2) not null default 8,
  work_days integer[] not null default array[1,2,3,4,5],
  allowed_geofences jsonb not null default '[]'::jsonb,
  allowed_ip_ranges text[] not null default array[]::text[],
  overtime_multiplier numeric(4,2) not null default 1.5,
  auto_clockout_time time not null default '23:59',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.holidays (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  name text not null,
  is_optional boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  work_date date not null,
  clock_in timestamptz,
  clock_out timestamptz,
  status public.attendance_status not null default 'present',
  work_mode public.work_mode not null default 'office',
  total_hours numeric(5,2) not null default 0,
  notes text,
  source text not null default 'manual',
  latitude numeric(10,7),
  longitude numeric(10,7),
  ip_address inet,
  out_of_fence boolean not null default false,
  overtime_hours numeric(5,2) not null default 0,
  is_incomplete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, work_date),
  check (clock_out is null or clock_in is null or clock_out >= clock_in)
);

create table if not exists public.attendance_regularizations (
  id uuid primary key default gen_random_uuid(),
  attendance_id uuid references public.attendance_records(id) on delete cascade,
  employee_id uuid not null references public.profiles(id) on delete cascade,
  requested_in timestamptz,
  requested_out timestamptz,
  reason text not null,
  status public.request_status not null default 'pending',
  approver_id uuid references public.profiles(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.work_mode_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  work_date date not null,
  mode public.work_mode not null default 'remote',
  reason text,
  status public.request_status not null default 'pending',
  approver_id uuid references public.profiles(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, work_date)
);

create table if not exists public.job_postings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  department_id uuid references public.departments(id) on delete set null,
  location text,
  type text,
  status public.job_status not null default 'active',
  description text,
  openings integer not null default 1,
  posted_by uuid references public.profiles(id) on delete set null,
  posted_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  job_posting_id uuid references public.job_postings(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  source text,
  stage public.candidate_stage not null default 'applied',
  rating integer check (rating between 0 and 100),
  notes text,
  applied_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payroll_runs (
  id uuid primary key default gen_random_uuid(),
  month text not null,
  year integer not null,
  status public.payroll_status not null default 'processed',
  processed_by uuid references public.profiles(id) on delete set null,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (month, year)
);

create table if not exists public.payroll_records (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.payroll_runs(id) on delete cascade,
  employee_id uuid not null references public.profiles(id) on delete cascade,
  base_salary numeric(12,2) not null default 0,
  allowances jsonb not null default '{}'::jsonb,
  deductions jsonb not null default '{}'::jsonb,
  net_pay numeric(12,2) not null default 0,
  status public.payroll_status not null default 'paid',
  payslip_pdf_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (run_id, employee_id)
);

create table if not exists public.review_cycles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  period text not null,
  type text not null default 'quarterly',
  status public.review_status not null default 'completed',
  due_date date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (period)
);

create table if not exists public.performance_reviews (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid references public.review_cycles(id) on delete set null,
  employee_id uuid not null references public.profiles(id) on delete cascade,
  reviewer_id uuid references public.profiles(id) on delete set null,
  self_assessment jsonb not null default '{}'::jsonb,
  manager_review jsonb not null default '{}'::jsonb,
  rating integer check (rating between 0 and 100),
  status public.review_status not null default 'completed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  category text not null,
  amount numeric(12,2) not null,
  description text,
  expense_date date,
  status public.expense_status not null default 'pending',
  receipt_path text,
  submitted_at timestamptz not null default now(),
  approver_id uuid references public.profiles(id) on delete set null,
  comments text,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  mime_type text,
  category text not null default 'general',
  storage_path text not null,
  file_size integer not null default 0,
  uploaded_by uuid references public.profiles(id) on delete set null,
  uploaded_at timestamptz not null default now(),
  description text,
  visibility text not null default 'restricted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  shift_date date not null,
  shift_type text not null default 'general',
  start_time time,
  end_time time,
  status public.shift_status not null default 'scheduled',
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  start_date date not null,
  end_date date,
  type text not null default 'meeting',
  color text not null default '#3b82f6',
  description text,
  visibility text not null default 'company',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'info',
  is_read boolean not null default false,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_prefs (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  event text not null,
  email boolean not null default true,
  in_app boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, event)
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  diff jsonb not null default '{}'::jsonb,
  ip_address inet,
  request_id text,
  metadata jsonb not null default '{}'::jsonb,
  at timestamptz not null default now()
);

create table if not exists public.onboarding_tasks (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.profiles(id) on delete cascade,
  task_label text not null,
  due_day integer not null default 0,
  assignee_id uuid references public.profiles(id) on delete set null,
  buddy_id uuid references public.profiles(id) on delete set null,
  notes text,
  done boolean not null default false,
  start_date date,
  completed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.department_budgets (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id) on delete cascade,
  month text not null,
  year integer not null,
  budget_amount numeric(12,2) not null default 0,
  spent_amount numeric(12,2) not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (department_id, month, year)
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  category text,
  pinned boolean not null default false,
  posted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.auth_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_manager_of(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = target
      and manager_id = auth.uid()
  )
$$;

create or replace function public.is_admin_or_hr()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.auth_role() in ('admin', 'hr_manager'), false)
$$;

create index if not exists idx_profiles_department_id on public.profiles(department_id);
create index if not exists idx_profiles_manager_id on public.profiles(manager_id);
create index if not exists idx_leave_requests_employee_id on public.leave_requests(employee_id);
create index if not exists idx_leave_requests_status on public.leave_requests(status);
create index if not exists idx_attendance_employee_date on public.attendance_records(employee_id, work_date);
create index if not exists idx_attendance_work_date on public.attendance_records(work_date);
create index if not exists idx_regularizations_employee_id on public.attendance_regularizations(employee_id);
create index if not exists idx_work_mode_requests_employee_id on public.work_mode_requests(employee_id);
create index if not exists idx_job_postings_department_id on public.job_postings(department_id);
create index if not exists idx_candidates_job_posting_id on public.candidates(job_posting_id);
create index if not exists idx_payroll_records_employee_id on public.payroll_records(employee_id);
create index if not exists idx_payroll_records_run_id on public.payroll_records(run_id);
create index if not exists idx_reviews_employee_id on public.performance_reviews(employee_id);
create index if not exists idx_reviews_reviewer_id on public.performance_reviews(reviewer_id);
create index if not exists idx_expenses_employee_id on public.expenses(employee_id);
create index if not exists idx_documents_employee_id on public.documents(employee_id);
create index if not exists idx_shifts_employee_date on public.shifts(employee_id, shift_date);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_audit_log_actor_id on public.audit_log(actor_id);
create index if not exists idx_audit_log_at on public.audit_log(at);

do $$ declare
  tbl text;
begin
  foreach tbl in array array[
    'departments','profiles','job_roles','leave_types','leave_balances','leave_requests',
    'work_policies','attendance_records','attendance_regularizations','work_mode_requests',
    'job_postings','candidates','payroll_runs','payroll_records','review_cycles',
    'performance_reviews','expenses','documents','shifts','calendar_events',
    'notification_prefs','onboarding_tasks','department_budgets','announcements'
  ] loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', tbl, tbl);
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', tbl, tbl);
  end loop;
end $$;

insert into public.leave_types (name, annual_quota, carry_forward, paid)
values
  ('annual', 18, true, true),
  ('sick', 12, false, true),
  ('casual', 12, false, true),
  ('emergency', 3, false, true),
  ('maternity', 180, false, true),
  ('paternity', 15, false, true),
  ('compensatory', 0, true, true),
  ('unpaid', 0, false, false)
on conflict (name) do nothing;

insert into public.work_policies (name)
values ('Default India Work Policy')
on conflict (name) do nothing;
