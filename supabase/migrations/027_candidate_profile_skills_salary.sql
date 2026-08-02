-- =============================================================================
-- 027: Candidate profile skills + current salary
-- =============================================================================
-- Additive / backward compatible:
--   * Existing rows keep working (skills default to empty array, salary null).
--   * No destructive changes to candidate_profiles or existing detail columns.
-- Idempotent: safe to re-run in the Supabase SQL Editor.
-- =============================================================================

alter table public.candidate_profile_details
  add column if not exists current_salary numeric(12, 2);

alter table public.candidate_profile_details
  add column if not exists skills text[] not null default '{}';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'candidate_profile_details_current_salary_check'
  ) then
    alter table public.candidate_profile_details
      add constraint candidate_profile_details_current_salary_check
      check (current_salary is null or current_salary >= 0);
  end if;
end $$;

comment on column public.candidate_profile_details.current_salary is
  'Optional current / last-drawn salary declared by the candidate.';
comment on column public.candidate_profile_details.skills is
  'Candidate-declared skills (chip list). Used by HR search, résumé analysis, ranking, and Copilot.';

create index if not exists candidate_profile_details_skills_gin_idx
  on public.candidate_profile_details using gin (skills);

-- Verify columns exist (raises if migration partially failed).
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'candidate_profile_details'
      and column_name = 'skills'
  ) then
    raise exception 'Migration 027 failed: candidate_profile_details.skills is missing';
  end if;
end $$;
