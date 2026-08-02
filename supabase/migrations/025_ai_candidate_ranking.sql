-- =============================================================================
-- 025: AI candidate ranking per job (derived from cached AI analysis)
-- =============================================================================
-- Stores computed rankings — no Groq output stored here directly. HR-only RLS.
-- Idempotent: safe to re-run.
-- =============================================================================

create table if not exists public.ai_candidate_ranking (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid not null references public.jobs(id) on delete cascade,
  candidate_id  uuid not null references public.candidate_profiles(id) on delete cascade,
  rank          integer not null check (rank > 0),
  score         numeric(5, 2) not null check (score >= 0 and score <= 100),
  reason        text not null,
  created_at    timestamptz not null default now(),
  constraint ai_candidate_ranking_job_candidate_unique unique (job_id, candidate_id)
);

comment on table public.ai_candidate_ranking is 'HR-facing candidate rank per job, computed from cached ai_resume_analysis (no Groq stored here).';

create index if not exists idx_ai_candidate_ranking_job_rank
on public.ai_candidate_ranking (job_id, rank asc);

alter table public.ai_candidate_ranking enable row level security;

drop policy if exists "HR and admin can manage ai candidate ranking" on public.ai_candidate_ranking;

create policy "HR and admin can manage ai candidate ranking"
on public.ai_candidate_ranking for all
to authenticated
using ((select private.is_hr_or_admin()))
with check ((select private.is_hr_or_admin()));
