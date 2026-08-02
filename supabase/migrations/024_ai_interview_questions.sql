-- =============================================================================
-- 024: AI interview questions cache (Groq)
-- =============================================================================
-- Stores generated interview question sets per application. HR-only via RLS.
-- Idempotent: safe to re-run.
-- =============================================================================

create table if not exists public.ai_interview_questions (
  id              uuid primary key default gen_random_uuid(),
  candidate_id    uuid not null references public.candidate_profiles(id) on delete cascade,
  application_id  uuid not null references public.applications(id) on delete cascade,
  questions_json  jsonb not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint ai_interview_questions_application_unique unique (application_id)
);

comment on table public.ai_interview_questions is 'Cached Groq-generated interview questions per application. HR-only.';
comment on column public.ai_interview_questions.questions_json is 'Full normalized InterviewQuestions JSON returned by Groq.';

create index if not exists idx_ai_interview_questions_candidate
on public.ai_interview_questions (candidate_id, created_at desc);

drop trigger if exists trg_set_updated_at_ai_interview_questions on public.ai_interview_questions;

create trigger trg_set_updated_at_ai_interview_questions
before update on public.ai_interview_questions
for each row execute function public.set_updated_at();

alter table public.ai_interview_questions enable row level security;

drop policy if exists "HR and admin can manage ai interview questions" on public.ai_interview_questions;

create policy "HR and admin can manage ai interview questions"
on public.ai_interview_questions for all
to authenticated
using ((select private.is_hr_or_admin()))
with check ((select private.is_hr_or_admin()));
