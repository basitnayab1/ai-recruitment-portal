-- Expand jobs for full posting + structured skill matching.
-- Additive / backward compatible: existing rows keep working via defaults/nulls.

alter table public.jobs
  add column if not exists summary text,
  add column if not exists required_skills text[] not null default '{}',
  add column if not exists preferred_skills text[] not null default '{}',
  add column if not exists matching_keywords text[] not null default '{}',
  add column if not exists experience_required text,
  add column if not exists education_required text,
  add column if not exists seniority_level text,
  add column if not exists work_mode text,
  add column if not exists benefits text,
  add column if not exists open_positions integer not null default 1,
  add column if not exists hiring_manager text,
  add column if not exists internal_notes text;

comment on column public.jobs.summary is 'Short job summary / overview for candidates.';
comment on column public.jobs.required_skills is 'Structured must-have skills for display and AI matching.';
comment on column public.jobs.preferred_skills is 'Structured nice-to-have skills.';
comment on column public.jobs.matching_keywords is 'Keywords used for candidate matching / SEO.';
comment on column public.jobs.experience_required is 'Human-readable experience requirement.';
comment on column public.jobs.education_required is 'Human-readable education requirement.';
comment on column public.jobs.seniority_level is 'e.g. junior, mid, senior, lead.';
comment on column public.jobs.work_mode is 'remote | hybrid | onsite';
comment on column public.jobs.benefits is 'Benefits / perks narrative.';
comment on column public.jobs.open_positions is 'Number of open headcount for this role.';
comment on column public.jobs.hiring_manager is 'Optional hiring manager display name.';
comment on column public.jobs.internal_notes is 'Internal HR notes (not shown to candidates).';

-- Keep is_remote in sync for older consumers when work_mode is set.
-- (Application code also sets both on write.)

alter table public.jobs
  drop constraint if exists jobs_work_mode_check;

alter table public.jobs
  add constraint jobs_work_mode_check
  check (
    work_mode is null
    or work_mode in ('remote', 'hybrid', 'onsite')
  );

alter table public.jobs
  drop constraint if exists jobs_open_positions_check;

alter table public.jobs
  add constraint jobs_open_positions_check
  check (open_positions >= 1);

create index if not exists jobs_required_skills_gin_idx
  on public.jobs using gin (required_skills);
