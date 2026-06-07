-- Grevya HR Portal - access review evidence
-- Stores who decided a pending access request, when, and through which path.

alter table public.profiles
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists decision_method text;

create index if not exists idx_profiles_reviewed_by
  on public.profiles(reviewed_by);

create index if not exists idx_profiles_reviewed_at
  on public.profiles(reviewed_at);
