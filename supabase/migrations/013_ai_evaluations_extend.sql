-- =============================================================================
-- 013: Extend ai_evaluations for AI Resume Evaluation
-- =============================================================================
-- Adds the two pieces of evaluation output that don't already have a home
-- on `public.ai_evaluations` (001_initial_schema.sql):
--   - Skills/Experience/Education sub-scores  -> existing `criteria_scores`
--     jsonb column (informally keyed, as already documented on that table)
--   - Strengths / Weaknesses                  -> existing `strengths` /
--     `concerns` text columns
--   - Hiring Recommendation                   -> existing `recommendation`
--     (public.ai_recommendation: shortlist / review / reject)
--   - Missing Skills / Interview Questions    -> new columns below (no
--     existing column fits these)
--
-- Purely additive: existing columns, rows, RLS policies, and indexes are
-- untouched, so nothing that already reads `ai_evaluations` (e.g. the HR
-- dashboard's "Recent Applications" AI score column) is affected.
-- =============================================================================

alter table public.ai_evaluations
  add column if not exists missing_skills text[] not null default '{}';

alter table public.ai_evaluations
  add column if not exists interview_questions text[] not null default '{}';

comment on column public.ai_evaluations.missing_skills is 'Skills the job asks for that were not found in the résumé/application.';
comment on column public.ai_evaluations.interview_questions is 'AI-suggested, role-specific interview questions for this candidate.';
