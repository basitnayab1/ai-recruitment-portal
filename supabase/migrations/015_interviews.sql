-- =============================================================================
-- AI Recruitment Portal — interviews
-- =============================================================================
-- Dedicated interview records linked to applications. Interview logistics
-- live here — not on `public.applications`. HR/admin manage interviews;
-- candidates can read their own rows via `candidate_id`.
-- =============================================================================

create type public.interview_type as enum ('online', 'on_site', 'phone');

create type public.interview_status as enum ('scheduled', 'cancelled', 'completed');

create table public.interviews (
  id                uuid primary key default gen_random_uuid(),
  application_id    uuid not null references public.applications(id) on delete cascade,
  candidate_id      uuid references public.candidate_profiles(id) on delete set null,
  job_id            uuid not null references public.jobs(id) on delete restrict,
  interviewer_name  text not null check (char_length(interviewer_name) > 0),
  interview_type    public.interview_type not null,
  meeting_link      text,
  office_location   text,
  interview_date    date not null,
  interview_time    time not null,
  timezone          text not null check (char_length(timezone) > 0),
  duration_minutes  integer not null check (duration_minutes > 0 and duration_minutes <= 480),
  notes             text,
  status            public.interview_status not null default 'scheduled',
  created_by        uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.interviews is 'Interview schedules for candidate applications. Internal notes are HR-only.';
comment on column public.interviews.notes is 'Internal HR notes — never shown to candidates.';

create unique index idx_interviews_one_scheduled_per_application
  on public.interviews (application_id)
  where status = 'scheduled';

create index idx_interviews_candidate_id on public.interviews (candidate_id);
create index idx_interviews_job_id on public.interviews (job_id);
create index idx_interviews_application_id on public.interviews (application_id);
create index idx_interviews_status on public.interviews (status);

create trigger trg_set_updated_at_interviews
before update on public.interviews
for each row execute function public.set_updated_at();

alter table public.interviews enable row level security;

create policy "HR and admin can manage interviews"
on public.interviews for all
to authenticated
using (public.is_hr_or_admin())
with check (public.is_hr_or_admin());

create policy "Candidates can view own interviews"
on public.interviews for select
to authenticated
using (auth.uid() = candidate_id);
