-- ============================================================================
-- Migration 002: Leave Schema — leave_types, leave_balances, leave_requests
-- ============================================================================

-- ── Leave types ─────────────────────────────────────────────────────────────
create table public.leave_types (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null unique,
  annual_quota    integer not null default 0,
  carry_forward   boolean default false,
  paid            boolean default true,
  description     text default '',
  created_at      timestamptz default now()
);

-- ── Leave balances (per employee per type per year) ─────────────────────────
create table public.leave_balances (
  id              uuid primary key default uuid_generate_v4(),
  employee_id     uuid not null references public.profiles(id) on delete cascade,
  leave_type_id   uuid not null references public.leave_types(id) on delete cascade,
  year            integer not null default extract(year from current_date),
  total           numeric(5,1) not null default 0,
  used            numeric(5,1) not null default 0,
  created_at      timestamptz default now(),
  unique(employee_id, leave_type_id, year)
);

-- ── Leave requests ──────────────────────────────────────────────────────────
create table public.leave_requests (
  id              uuid primary key default uuid_generate_v4(),
  employee_id     uuid not null references public.profiles(id) on delete cascade,
  leave_type_id   uuid not null references public.leave_types(id) on delete restrict,
  from_date       date not null,
  to_date         date not null,
  days            numeric(4,1) not null check (days > 0),
  reason          text default '',
  status          text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  approver_id     uuid references public.profiles(id) on delete set null,
  decided_at      timestamptz,
  approver_notes  text default '',
  created_at      timestamptz default now(),
  constraint valid_date_range check (to_date >= from_date)
);

-- ── Indexes ─────────────────────────────────────────────────────────────────
create index idx_leave_balances_employee on public.leave_balances(employee_id);
create index idx_leave_balances_year on public.leave_balances(year);
create index idx_leave_requests_employee on public.leave_requests(employee_id);
create index idx_leave_requests_status on public.leave_requests(status);
create index idx_leave_requests_approver on public.leave_requests(approver_id);
create index idx_leave_requests_dates on public.leave_requests(from_date, to_date);
