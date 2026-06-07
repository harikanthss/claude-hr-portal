-- Grevya HR Portal - email access approval tokens
-- Single-use, expiring token records for admin access-review links.

create table if not exists public.access_approval_tokens (
  jti text primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  email text not null,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  used_action text,
  created_at timestamptz not null default now()
);

create index if not exists idx_access_approval_tokens_profile
  on public.access_approval_tokens(profile_id);

create index if not exists idx_access_approval_tokens_expires
  on public.access_approval_tokens(expires_at);

alter table public.access_approval_tokens enable row level security;

drop policy if exists "access approval tokens backend only" on public.access_approval_tokens;
create policy "access approval tokens backend only"
  on public.access_approval_tokens
  for all
  using (false)
  with check (false);
