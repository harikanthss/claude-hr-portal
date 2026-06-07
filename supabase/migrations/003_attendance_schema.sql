-- ============================================================================
-- Migration 003: Attendance Schema
-- attendance_records, regularizations, work_mode_requests, work_policies, holidays
-- ============================================================================

-- ── Work policies ───────────────────────────────────────────────────────────
create table public.work_policies (
  id                  uuid primary key default uuid_generate_v4(),
  name                text not null default 'Default Policy',
  start_time          time not null default '09:00',
  end_time            time not null default '18:00',
  grace_minutes       integer not null default 15,
  half_day_hours      numeric(3,1) not null default 4.0,
  standard_hours      numeric(3,1) not null default 8.0,
  work_days           integer[] not null default '{1,2,3,4,5}', -- 0=Sun, 1=Mon, ..., 6=Sat
  overtime_multiplier numeric(3,1) default 1.5,
  auto_clockout_time  time default '23:59',
  allowed_geofences   jsonb default '[]', -- [{lat, lng, radius_meters, label}]
  allowed_ip_ranges   text[] default '{}', -- CIDR notation
  is_active           boolean default true,
  created_at          timestamptz default now()
);

-- ── Holidays ────────────────────────────────────────────────────────────────
create table public.holidays (
  id          uuid primary key default uuid_generate_v4(),
  date        date not null,
  name        text not null,
  is_optional boolean default false,
  created_at  timestamptz default now(),
  unique(date)
);

-- ── Attendance records ──────────────────────────────────────────────────────
create table public.attendance_records (
  id              uuid primary key default uuid_generate_v4(),
  employee_id     uuid not null references public.profiles(id) on delete cascade,
  work_date       date not null,
  clock_in        timestamptz,
  clock_out       timestamptz,
  status          text not null default 'present' check (status in ('present','absent','late','half_day','holiday','weekend','on_leave')),
  work_mode       text default 'office' check (work_mode in ('office','remote','hybrid','wfh')),
  total_hours     numeric(4,1) default 0,
  overtime_hours  numeric(4,1) default 0,
  latitude        numeric(10,7),
  longitude       numeric(10,7),
  ip_address      text,
  out_of_fence    boolean default false,
  is_incomplete   boolean default false,
  notes           text default '',
  source          text default 'web' check (source in ('web','mobile','api','auto')),
  created_at      timestamptz default now(),
  unique(employee_id, work_date)
);

-- ── Attendance regularizations ──────────────────────────────────────────────
create table public.attendance_regularizations (
  id              uuid primary key default uuid_generate_v4(),
  attendance_id   uuid references public.attendance_records(id) on delete cascade,
  employee_id     uuid not null references public.profiles(id) on delete cascade,
  requested_in    timestamptz not null,
  requested_out   timestamptz not null,
  reason          text not null,
  status          text not null default 'pending' check (status in ('pending','approved','rejected')),
  approver_id     uuid references public.profiles(id) on delete set null,
  decided_at      timestamptz,
  created_at      timestamptz default now()
);

-- ── Work mode requests (WFH approval) ──────────────────────────────────────
create table public.work_mode_requests (
  id              uuid primary key default uuid_generate_v4(),
  employee_id     uuid not null references public.profiles(id) on delete cascade,
  work_date       date not null,
  mode            text not null default 'wfh' check (mode in ('wfh','remote','hybrid')),
  reason          text default '',
  status          text not null default 'pending' check (status in ('pending','approved','rejected')),
  approver_id     uuid references public.profiles(id) on delete set null,
  decided_at      timestamptz,
  created_at      timestamptz default now(),
  unique(employee_id, work_date)
);

-- ── Indexes ─────────────────────────────────────────────────────────────────
create index idx_attendance_employee on public.attendance_records(employee_id);
create index idx_attendance_date on public.attendance_records(work_date);
create index idx_attendance_status on public.attendance_records(status);
create index idx_attendance_incomplete on public.attendance_records(is_incomplete) where is_incomplete = true;
create index idx_attendance_out_of_fence on public.attendance_records(out_of_fence) where out_of_fence = true;
create index idx_regularizations_employee on public.attendance_regularizations(employee_id);
create index idx_regularizations_status on public.attendance_regularizations(status);
create index idx_work_mode_requests_employee on public.work_mode_requests(employee_id);
create index idx_work_mode_requests_status on public.work_mode_requests(status);
create index idx_holidays_date on public.holidays(date);
