-- Grevya HR Portal - pending access workflow
-- Adds non-active access states without introducing a fake RBAC role.

alter type public.profile_status add value if not exists 'pending';
alter type public.profile_status add value if not exists 'rejected';

alter table public.profiles
  alter column role drop not null,
  alter column role drop default;

create index if not exists idx_profiles_status on public.profiles(status);

-- RLS determines which rows can be updated; column privileges prevent self-service
-- profile edits from changing authorization, payroll, reporting, or employment fields.
revoke update on public.profiles from authenticated, anon;

revoke update (
  role, status, department_id, manager_id, job_title, employment_type,
  hire_date, salary, performance_score, attendance_score, points, streak
) on public.profiles from authenticated, anon;

grant update (
  full_name, avatar, phone, location, dob, gender, emergency_contact, bio
) on public.profiles to authenticated;

create or replace function public.auth_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
    and status = 'active'
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
