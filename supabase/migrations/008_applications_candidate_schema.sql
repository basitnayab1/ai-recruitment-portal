-- =============================================================================
-- AI Recruitment Portal — applications: authenticated candidate schema
-- =============================================================================
-- Extends the existing `public.applications` table (001, previously built
-- for the old HR-only workflow: each row was written by a trusted
-- server-only path with no candidate identity at all) to support
-- authenticated, self-service candidate applications.
--
-- This migration ONLY ADDS to the table — no existing column, constraint,
-- or HR-facing RLS policy is modified or removed. It is idempotent (safe
-- to re-run) via `if not exists` guards and existence checks, since parts
-- of this may already have been applied by earlier migrations
-- (004_candidate_job_applications.sql, 007_applications_notice_period.sql).
-- =============================================================================

-- 1. candidate_id — links a submission to the authenticated candidate who
--    made it. Nullable: rows from the old HR-only workflow (and any future
--    HR-created application with no candidate account) have no candidate
--    identity, which is intentional, not an error state.
alter table public.applications
  add column if not exists candidate_id uuid references public.candidate_profiles(id) on delete set null;

comment on column public.applications.candidate_id is 'Set for applications submitted through the candidate self-service flow. Null for any application without a linked candidate account.';

-- 2. notice_period — candidate-stated notice period for this specific
--    application (may differ from the general value on their profile).
alter table public.applications
  add column if not exists notice_period text
  check (
    notice_period is null
    or notice_period in ('immediate', '1_week', '2_weeks', '1_month', '2_months', '3_months_plus')
  );

comment on column public.applications.notice_period is 'Candidate-stated notice period for this specific application (optional).';

-- 3. Index on candidate_id — supports "my applications" lookups and the
--    duplicate-application check below.
create index if not exists idx_applications_candidate_id on public.applications (candidate_id);

-- 4. Duplicate-application protection: one candidate may only apply once
--    per job. Postgres unique constraints treat NULL as distinct from any
--    other value, so rows with candidate_id null (old HR-only rows) never
--    collide with each other or with candidate rows — this constraint only
--    ever applies between two rows that both have a real candidate_id.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'applications_candidate_job_unique'
  ) then
    alter table public.applications
      add constraint applications_candidate_job_unique unique (candidate_id, job_id);
  end if;
end $$;

-- 5. RLS: candidate-facing policies (additive — the existing
--    "HR and admin can manage applications" policy from 001 is untouched;
--    RLS combines multiple permissive policies with OR, so these only ever
--    widen access to a candidate's own rows). Recreated idempotently here
--    in case 004's policies were never applied.
drop policy if exists "Candidates can view own applications" on public.applications;
drop policy if exists "Candidates can insert own applications" on public.applications;

create policy "Candidates can view own applications"
on public.applications for select
to authenticated
using (auth.uid() = candidate_id);

create policy "Candidates can insert own applications"
on public.applications for insert
to authenticated
with check (auth.uid() = candidate_id);
