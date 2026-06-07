-- Add founder-level role support without changing the existing UI structure.

alter type public.app_role add value if not exists 'super_admin' before 'admin';

create or replace function public.is_admin_or_hr()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.auth_role() in ('super_admin', 'admin', 'hr_manager'), false)
$$;

create unique index if not exists idx_profiles_email_lower_unique
  on public.profiles (lower(email));
