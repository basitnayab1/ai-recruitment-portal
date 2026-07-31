-- =============================================================================
-- AI Recruitment Portal — Candidate Profiles
-- =============================================================================
-- Design notes:
--   * `public.profiles` (see 001) is reserved exclusively for internal
--     HR/admin staff accounts. Candidate accounts are a completely separate
--     concept and must never be represented there.
--   * `candidate_profiles` is the only source of truth for "this auth.users
--     account is a candidate". Nothing here grants HR/admin access, and
--     nothing in 001's HR authorization logic (`is_hr_or_admin`, etc.)
--     depends on or is affected by this table.
--   * `role` is intentionally hard-constrained to the literal value
--     'candidate' — it exists for symmetry/auditability with
--     `profiles.role`, not because candidates can ever hold another role.
--     Even a buggy or malicious write can never change it.
-- =============================================================================

create table public.candidate_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       citext not null check (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  full_name   text not null check (char_length(full_name) > 0),
  phone       text,
  role        text not null default 'candidate' check (role = 'candidate'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint candidate_profiles_email_unique unique (email)
);

comment on table public.candidate_profiles is 'Candidate-facing accounts. Always role = candidate; completely separate from public.profiles (HR/admin staff).';

create index idx_candidate_profiles_email on public.candidate_profiles (email);

-- Reuses the generic trigger function already defined in 001.
create trigger trg_set_updated_at_candidate_profiles
before update on public.candidate_profiles
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: a candidate may only ever read/create/update their own
-- row. There is no HR/admin read policy here — not needed until a feature
-- actually requires HR to browse candidate accounts directly.
-- ---------------------------------------------------------------------------

alter table public.candidate_profiles enable row level security;

create policy "Candidates can view own profile"
on public.candidate_profiles for select
to authenticated
using (auth.uid() = id);

create policy "Candidates can insert own profile"
on public.candidate_profiles for insert
to authenticated
with check (auth.uid() = id);

create policy "Candidates can update own profile"
on public.candidate_profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
