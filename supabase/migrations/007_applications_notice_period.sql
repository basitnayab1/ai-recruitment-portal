-- =============================================================================
-- AI Recruitment Portal — applications.notice_period
-- =============================================================================
-- The candidate apply form (/candidate/apply/[jobId]) lets a candidate
-- state their notice period per application (it may differ from the
-- general value on their profile). `public.applications` (001) had no such
-- column. This is purely additive — a new nullable column with the same
-- value domain already used by `candidate_profile_details.notice_period`
-- (003) — so it does not affect any existing HR query, view, or RLS
-- policy on `applications`.
-- =============================================================================

alter table public.applications
  add column if not exists notice_period text
  check (
    notice_period is null
    or notice_period in ('immediate', '1_week', '2_weeks', '1_month', '2_months', '3_months_plus')
  );

comment on column public.applications.notice_period is 'Candidate-stated notice period for this specific application (optional).';
