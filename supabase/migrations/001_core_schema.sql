-- ============================================================================
-- Migration 001: Core Schema — profiles, departments, job_roles
-- Grevya HR Portal — Supabase
-- ============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Role enum ───────────────────────────────────────────────────────────────
create type public.app_role as enum ('admin', 'hr_manager', 'manager', 'employee');

-- ── Departments ─────────────────────────────────────────────────────────────
create table public.departments (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  head_id     uuid, -- FK added after profiles exists
  created_at  timestamptz default now()
);

-- ── Profiles (PK = auth.users.id) ───────────────────────────────────────────
create table public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  full_name         text not null,
  email             text unique not null,
  avatar_url        text,
  phone             text default '',
  role              public.app_role not null default 'employee',
  department_id     uuid references public.departments(id) on delete set null,
  manager_id        uuid references public.profiles(id) on delete set null,
  job_title         text default '',
  status            text not null default 'active' check (status in ('active','inactive','on_leave','probation')),
  employment_type   text default 'full_time' check (employment_type in ('full_time','part_time','contract','intern')),
  location          text default '',
  hire_date         date,
  dob               date,
  gender            text check (gender in ('male','female','other','prefer_not_to_say')),
  salary            numeric(12,2) default 0 check (salary >= 0),
  emergency_contact jsonb default '{}',
  bio               text default '',
  points            integer default 0,
  streak            integer default 0,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- Add the FK on departments.head_id now that profiles exists
alter table public.departments
  add constraint fk_departments_head
  foreign key (head_id) references public.profiles(id) on delete set null;

-- ── Job roles ───────────────────────────────────────────────────────────────
create table public.job_roles (
  id              uuid primary key default uuid_generate_v4(),
  title           text not null,
  department_id   uuid references public.departments(id) on delete cascade,
  created_at      timestamptz default now()
);

-- ── Helper functions for RLS ────────────────────────────────────────────────

-- Returns the app_role of the currently authenticated user
create or replace function public.auth_role()
returns public.app_role
language sql stable security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- Returns true if the current user is the manager of the target user
create or replace function public.is_manager_of(target_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = target_id and manager_id = auth.uid()
  )
$$;

-- ── Auto-update updated_at trigger ──────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- ── Auto-create profile on auth.users insert ────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'employee')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Indexes ─────────────────────────────────────────────────────────────────
create index idx_profiles_email on public.profiles(email);
create index idx_profiles_department on public.profiles(department_id);
create index idx_profiles_manager on public.profiles(manager_id);
create index idx_profiles_status on public.profiles(status);
create index idx_profiles_role on public.profiles(role);
