-- =============================================================================
-- 023: AI resume analysis cache (Groq)
-- =============================================================================
-- Stores structured Groq résumé analysis results keyed by candidate, résumé
-- content hash, and optional application (job context). HR-only via RLS.
-- Idempotent: safe to re-run.
-- =============================================================================

create table if not exists public.ai_resume_analysis (
  id               uuid primary key default gen_random_uuid(),
  candidate_id     uuid not null references public.candidate_profiles(id) on delete cascade,
  application_id   uuid references public.applications(id) on delete set null,
  resume_hash      text not null check (char_length(resume_hash) > 0),
  job_title        text not null check (char_length(job_title) > 0),
  job_description  text not null check (char_length(job_description) > 0),
  analysis_json    jsonb not null,
  score            numeric(5, 2) not null check (score >= 0 and score <= 100),
  recommendation   text not null check (char_length(recommendation) > 0),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.ai_resume_analysis is 'Cached Groq résumé analysis per candidate/résumé hash/job context. HR-only.';
comment on column public.ai_resume_analysis.resume_hash is 'SHA-256 hex digest of the résumé file bytes at analysis time.';
comment on column public.ai_resume_analysis.analysis_json is 'Full normalized ResumeAnalysis JSON returned by Groq.';

-- One cached row per candidate + résumé hash + job context (nullable application).
create unique index if not exists idx_ai_resume_analysis_unique
on public.ai_resume_analysis (
  candidate_id,
  resume_hash,
  coalesce(application_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

create index if not exists idx_ai_resume_analysis_candidate_created
on public.ai_resume_analysis (candidate_id, created_at desc);

drop trigger if exists trg_set_updated_at_ai_resume_analysis on public.ai_resume_analysis;

create trigger trg_set_updated_at_ai_resume_analysis
before update on public.ai_resume_analysis
for each row execute function public.set_updated_at();

alter table public.ai_resume_analysis enable row level security;

drop policy if exists "HR and admin can manage ai resume analysis" on public.ai_resume_analysis;

create policy "HR and admin can manage ai resume analysis"
on public.ai_resume_analysis for all
to authenticated
using ((select private.is_hr_or_admin()))
with check ((select private.is_hr_or_admin()));
