-- =============================================================================
-- AI Recruitment Portal — Candidate Profile Details
-- =============================================================================
-- Design notes:
--   * `public.candidate_profiles` (see 002) remains the minimal, immutable
--     core identity record created at signup (id/email/full_name/phone/role)
--     and is NOT modified by this migration.
--   * `candidate_profile_details` holds the much larger, optional "complete
--     your profile" fields as a separate 1:1 extension table, keyed
--     directly by `candidate_id` (no surrogate id — mirrors the
--     id-references-auth.users(id) pattern already used by
--     `candidate_profiles` itself). This means core auth/session logic
--     never needs to change as this table grows.
--   * A row only exists once a candidate has saved their profile details at
--     least once — absence of a row simply means "not filled in yet", not
--     an error.
--   * `profile_completion` is a cached 0-100 snapshot written by the
--     application every time this row is saved (see
--     src/lib/candidate/profile-actions.ts), computed from both this table
--     and `candidate_profiles`. It is not recalculated by the database.
-- =============================================================================

create table public.candidate_profile_details (
  candidate_id            uuid primary key references public.candidate_profiles(id) on delete cascade,

  -- Personal details
  phone                   text,
  cnic                    text,
  date_of_birth           date,
  gender                  text check (gender is null or gender in ('male', 'female', 'other', 'prefer_not_to_say')),
  country                 text,
  province                text,
  city                    text,
  address                 text,

  -- Professional details
  current_job_title       text,
  years_of_experience     numeric(4, 1) check (years_of_experience is null or years_of_experience >= 0),
  highest_qualification   text check (
    highest_qualification is null
    or highest_qualification in ('high_school', 'associate', 'bachelors', 'masters', 'phd', 'other')
  ),
  current_company         text,
  expected_salary         numeric(12, 2) check (expected_salary is null or expected_salary >= 0),
  notice_period           text check (
    notice_period is null
    or notice_period in ('immediate', '1_week', '2_weeks', '1_month', '2_months', '3_months_plus')
  ),

  -- Online presence
  linkedin_url            text,
  portfolio_url           text,
  github_url              text,

  -- Cached completion snapshot, written by the application on every save.
  profile_completion      integer not null default 0 check (profile_completion between 0 and 100),

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

comment on table public.candidate_profile_details is 'Extended candidate profile fields (personal + professional details + online presence), 1:1 with candidate_profiles. Kept separate so candidate_profiles (core auth identity) never needs schema changes as this expands.';

-- Reuses the generic trigger function already defined in 001.
create trigger trg_set_updated_at_candidate_profile_details
before update on public.candidate_profile_details
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: a candidate may only ever read/create/update their own
-- row, same pattern as `candidate_profiles`. No HR/admin policy — not needed
-- until a feature actually requires HR to browse candidate details directly.
-- ---------------------------------------------------------------------------

alter table public.candidate_profile_details enable row level security;

create policy "Candidates can view own profile details"
on public.candidate_profile_details for select
to authenticated
using (auth.uid() = candidate_id);

create policy "Candidates can insert own profile details"
on public.candidate_profile_details for insert
to authenticated
with check (auth.uid() = candidate_id);

create policy "Candidates can update own profile details"
on public.candidate_profile_details for update
to authenticated
using (auth.uid() = candidate_id)
with check (auth.uid() = candidate_id);
