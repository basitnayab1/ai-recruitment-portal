-- =============================================================================
-- 030: Hot-path indexes for common list/lookup queries
-- =============================================================================

create index if not exists idx_interviews_date_time
  on public.interviews (interview_date asc, interview_time asc);

create index if not exists idx_interviews_status_date
  on public.interviews (status, interview_date asc)
  where status = 'scheduled';

create index if not exists idx_applications_status_submitted_at
  on public.applications (status, submitted_at desc);

create index if not exists idx_applications_submitted_at
  on public.applications (submitted_at desc);

create index if not exists idx_ai_resume_analysis_application_updated
  on public.ai_resume_analysis (application_id, updated_at desc)
  where application_id is not null;

create index if not exists idx_ai_candidate_ranking_candidate_id
  on public.ai_candidate_ranking (candidate_id);

create index if not exists idx_candidate_profiles_created_at
  on public.candidate_profiles (created_at desc);

create index if not exists idx_ai_resume_analysis_score
  on public.ai_resume_analysis (score desc);

create index if not exists idx_jobs_published_closes_at
  on public.jobs (closes_at asc)
  where status = 'published' and closes_at is not null;

create index if not exists idx_applications_candidate_submitted_at
  on public.applications (candidate_id, submitted_at desc);

create index if not exists idx_interviews_candidate_date
  on public.interviews (candidate_id, interview_date asc, interview_time asc);
