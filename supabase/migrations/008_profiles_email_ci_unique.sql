-- Prevent duplicate profile rows for the same email with different casing.
-- Apply after confirming there are no duplicate lower(email) groups.

create unique index if not exists idx_profiles_email_lower_unique
  on public.profiles (lower(email));
