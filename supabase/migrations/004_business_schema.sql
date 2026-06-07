-- ============================================================================
-- Migration 004: Business Schema
-- job_postings, candidates, payroll, performance, announcements, audit_log
-- ============================================================================

-- ── Job postings ────────────────────────────────────────────────────────────
create table public.job_postings (
  id              uuid primary key default uuid_generate_v4(),
  title           text not null,
  department_id   uuid references public.departments(id) on delete set null,
  location        text default '',
  type            text default 'full_time' check (type in ('full_time','part_time','contract','intern')),
  status          text default 'active' check (status in ('active','closed','draft','on_hold')),
  description     text default '',
  requirements    text default '',
  salary_range    text default '',
  openings        integer default 1,
  posted_by       uuid references public.profiles(id) on delete set null,
  posted_date     date default current_date,
  created_at      timestamptz default now()
);

-- ── Candidates ──────────────────────────────────────────────────────────────
create table public.candidates (
  id              uuid primary key default uuid_generate_v4(),
  job_posting_id  uuid references public.job_postings(id) on delete cascade,
  name            text not null,
  email           text not null,
  phone           text default '',
  source          text default 'direct' check (source in ('direct','referral','linkedin','naukri','indeed','other')),
  stage           text not null default 'applied' check (stage in ('applied','screening','interview','offer','hired','rejected')),
  rating          integer default 0 check (rating >= 0 and rating <= 5),
  resume_url      text,
  notes           text default '',
  applied_at      timestamptz default now(),
  created_at      timestamptz default now()
);

-- ── Payroll runs ────────────────────────────────────────────────────────────
create table public.payroll_runs (
  id              uuid primary key default uuid_generate_v4(),
  month           text not null, -- 'YYYY-MM' format
  status          text not null default 'draft' check (status in ('draft','processing','completed','cancelled')),
  processed_by    uuid references public.profiles(id) on delete set null,
  processed_at    timestamptz,
  notes           text default '',
  created_at      timestamptz default now(),
  unique(month)
);

-- ── Payroll records (per employee per run) ──────────────────────────────────
create table public.payroll_records (
  id              uuid primary key default uuid_generate_v4(),
  run_id          uuid not null references public.payroll_runs(id) on delete cascade,
  employee_id     uuid not null references public.profiles(id) on delete cascade,
  base_salary     numeric(12,2) not null default 0,
  hra             numeric(10,2) default 0,
  conveyance      numeric(10,2) default 0,
  medical         numeric(10,2) default 0,
  bonus           numeric(10,2) default 0,
  overtime_pay    numeric(10,2) default 0,
  pf_deduction    numeric(10,2) default 0,
  tax_deduction   numeric(10,2) default 0,
  esi_deduction   numeric(10,2) default 0,
  other_deductions numeric(10,2) default 0,
  net_pay         numeric(12,2) not null default 0,
  status          text default 'pending' check (status in ('pending','processed','paid')),
  payslip_url     text, -- Supabase Storage path
  created_at      timestamptz default now(),
  unique(run_id, employee_id)
);

-- ── Review cycles ───────────────────────────────────────────────────────────
create table public.review_cycles (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  period          text not null, -- 'Q1 2024', 'H1 2024', 'Annual 2024'
  type            text default 'quarterly' check (type in ('quarterly','half_yearly','annual','360_degree')),
  status          text default 'active' check (status in ('draft','active','completed','cancelled')),
  due_date        date,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz default now()
);

-- ── Performance reviews ─────────────────────────────────────────────────────
create table public.performance_reviews (
  id                uuid primary key default uuid_generate_v4(),
  cycle_id          uuid not null references public.review_cycles(id) on delete cascade,
  employee_id       uuid not null references public.profiles(id) on delete cascade,
  reviewer_id       uuid references public.profiles(id) on delete set null,
  self_assessment   jsonb default '{}', -- {goals, achievements, areas_of_improvement, rating}
  manager_review    jsonb default '{}', -- {technical, communication, leadership, delivery, innovation, teamwork, overall, comments}
  rating            numeric(3,1),
  status            text default 'pending' check (status in ('pending','self_review','manager_review','completed')),
  created_at        timestamptz default now(),
  updated_at        timestamptz default now(),
  unique(cycle_id, employee_id)
);

create trigger perf_reviews_updated_at
  before update on public.performance_reviews
  for each row execute function public.handle_updated_at();

-- ── Announcements ───────────────────────────────────────────────────────────
create table public.announcements (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  body        text not null,
  category    text default 'general' check (category in ('general','policy','event','urgent','celebration')),
  pinned      boolean default false,
  posted_by   uuid references public.profiles(id) on delete set null,
  created_at  timestamptz default now()
);

-- ── Notification preferences ────────────────────────────────────────────────
create table public.notification_prefs (
  id          uuid primary key default uuid_generate_v4(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  event       text not null, -- 'leave_approved', 'payslip_ready', etc.
  email       boolean default true,
  in_app      boolean default true,
  created_at  timestamptz default now(),
  unique(employee_id, event)
);

-- ── Audit log ───────────────────────────────────────────────────────────────
create table public.audit_log (
  id          uuid primary key default uuid_generate_v4(),
  actor_id    uuid references public.profiles(id) on delete set null,
  action      text not null, -- 'create', 'update', 'delete', 'approve', 'reject'
  entity      text not null, -- 'profile', 'leave_request', 'payroll', etc.
  entity_id   uuid,
  diff        jsonb default '{}', -- {before, after} for updates
  metadata    jsonb default '{}', -- {ip_address, user_agent, etc.}
  created_at  timestamptz default now()
);

-- ── Indexes ─────────────────────────────────────────────────────────────────
create index idx_candidates_job on public.candidates(job_posting_id);
create index idx_candidates_stage on public.candidates(stage);
create index idx_payroll_records_employee on public.payroll_records(employee_id);
create index idx_payroll_records_run on public.payroll_records(run_id);
create index idx_perf_reviews_employee on public.performance_reviews(employee_id);
create index idx_perf_reviews_cycle on public.performance_reviews(cycle_id);
create index idx_perf_reviews_reviewer on public.performance_reviews(reviewer_id);
create index idx_announcements_pinned on public.announcements(pinned) where pinned = true;
create index idx_audit_log_actor on public.audit_log(actor_id);
create index idx_audit_log_entity on public.audit_log(entity, entity_id);
create index idx_audit_log_created on public.audit_log(created_at);
