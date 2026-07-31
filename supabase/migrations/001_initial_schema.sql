-- =============================================================================
-- AI Recruitment Portal — Initial Schema
-- =============================================================================
-- Design notes:
--   * There is no "candidates" table. Candidates do not authenticate; each row
--     in `applications` IS the candidate's submission for a given job, and
--     `education` / `skills` hang off that row.
--   * `profiles` extends `auth.users` and is used ONLY for internal HR/admin
--     staff accounts.
--   * CV files are never stored as public URLs — only the private Supabase
--     Storage object path is persisted, in `applications.cv_storage_path`.
--   * RLS is enabled on every table below. Public (anon) access is limited to
--     reading published jobs. All recruitment data (applications, education,
--     skills, notes, AI evaluations, status history, AI criteria) is
--     accessible only to authenticated HR/admin staff. Public application
--     submission is intentionally NOT enabled here — it requires a trusted,
--     server-only write path (e.g. a Route Handler using the service-role
--     key, never exposed to the browser) to be added in a later step.
-- =============================================================================


-- =============================================================================
-- 1. EXTENSIONS
-- =============================================================================

create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists citext;     -- case-insensitive email columns


-- =============================================================================
-- 2. ENUM TYPES
-- =============================================================================

create type public.user_role as enum ('hr', 'admin');

create type public.job_status as enum ('draft', 'published', 'closed');

create type public.job_employment_type as enum (
  'full_time',
  'part_time',
  'contract',
  'internship',
  'temporary'
);

-- Required application workflow statuses, in workflow order.
create type public.application_status as enum (
  'new',
  'ai_shortlisted',
  'hr_review',
  'interview',
  'hold',
  'rejected',
  'selected',
  'hired'
);

create type public.skill_proficiency as enum (
  'beginner',
  'intermediate',
  'advanced',
  'expert'
);

create type public.ai_recommendation as enum (
  'shortlist',
  'review',
  'reject'
);


-- =============================================================================
-- 3. UTILITY FUNCTIONS
-- =============================================================================

-- Generic "touch updated_at" trigger function, reused by every table below
-- that has an `updated_at` column.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- =============================================================================
-- 4. TABLE: profiles
-- =============================================================================
-- HR / admin staff accounts. One row per `auth.users` account. Candidates are
-- never represented here.

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       citext not null check (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  full_name   text not null check (char_length(full_name) > 0),
  phone       text,
  role        public.user_role not null default 'hr',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint profiles_email_unique unique (email)
);

comment on table public.profiles is 'Internal HR/admin staff accounts, extending auth.users. Not used for candidates.';

create index idx_profiles_role on public.profiles (role);

create trigger trg_set_updated_at_profiles
before update on public.profiles
for each row execute function public.set_updated_at();


-- =============================================================================
-- 5. SECURITY HELPER FUNCTIONS (depend on profiles)
-- =============================================================================
-- SECURITY DEFINER + fixed search_path so these can be safely used inside RLS
-- policies (including on `profiles` itself) without triggering recursive RLS
-- evaluation or search_path hijacking.

create or replace function public.is_hr_or_admin()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('hr', 'admin')
      and is_active = true
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and is_active = true
  );
$$;

revoke execute on function public.is_hr_or_admin() from public;
revoke execute on function public.is_admin() from public;
grant execute on function public.is_hr_or_admin() to authenticated;
grant execute on function public.is_admin() to authenticated;

-- Prevents an HR (non-admin) user from escalating their own — or anyone
-- else's — role via a direct row update. Only an existing admin may change
-- the `role` column.
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only admin users may change a profile role.';
  end if;
  return new;
end;
$$;

create trigger trg_prevent_role_self_escalation
before update on public.profiles
for each row execute function public.prevent_role_self_escalation();


-- =============================================================================
-- 6. TABLE: jobs
-- =============================================================================

create table public.jobs (
  id                uuid primary key default gen_random_uuid(),
  title             text not null check (char_length(title) > 0),
  slug              citext unique,
  description       text not null check (char_length(description) > 0),
  responsibilities  text,
  requirements      text,
  department        text,
  location          text,
  is_remote         boolean not null default false,
  employment_type   public.job_employment_type not null default 'full_time',
  salary_min        numeric(12, 2) check (salary_min is null or salary_min >= 0),
  salary_max        numeric(12, 2) check (salary_max is null or salary_max >= 0),
  status            public.job_status not null default 'draft',
  created_by        uuid references public.profiles(id) on delete set null,
  published_at      timestamptz,
  closes_at         timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint jobs_salary_range_check
    check (salary_min is null or salary_max is null or salary_max >= salary_min),
  constraint jobs_closes_after_published_check
    check (closes_at is null or published_at is null or closes_at >= published_at)
);

comment on table public.jobs is 'Job postings managed by HR. Only rows with status = published are visible publicly.';

create index idx_jobs_status on public.jobs (status);
create index idx_jobs_created_by on public.jobs (created_by);
create index idx_jobs_published_at on public.jobs (published_at desc) where status = 'published';

create trigger trg_set_updated_at_jobs
before update on public.jobs
for each row execute function public.set_updated_at();


-- =============================================================================
-- 7. TABLE: applications
-- =============================================================================
-- Each row represents one candidate's submission to one job. Candidate
-- contact/professional info lives directly on this table since there is no
-- separate candidate identity/account.

create table public.applications (
  id                  uuid primary key default gen_random_uuid(),
  job_id              uuid not null references public.jobs(id) on delete restrict,

  -- Candidate contact info
  full_name           text not null check (char_length(full_name) > 0),
  email               citext not null check (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone               text,

  -- Professional information
  current_position    text,
  current_company     text,
  years_of_experience numeric(4, 1) check (years_of_experience is null or years_of_experience >= 0),
  expected_salary     numeric(12, 2) check (expected_salary is null or expected_salary >= 0),
  linkedin_url        text,
  portfolio_url       text,
  cover_letter        text,

  -- CV: private Supabase Storage object path only, never a public URL.
  cv_storage_path     text not null check (char_length(cv_storage_path) > 0),

  -- Workflow
  status              public.application_status not null default 'new',
  assigned_hr_id      uuid references public.profiles(id) on delete set null,

  submitted_at        timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint applications_job_email_unique unique (job_id, email)
);

comment on table public.applications is 'Candidate applications. cv_storage_path is a private Storage path, never a public URL.';

-- idx_applications_job_status below also serves job_id-only lookups
-- (leftmost-prefix rule), so no separate job_id-only index is needed.
create index idx_applications_status on public.applications (status);
create index idx_applications_assigned_hr_id on public.applications (assigned_hr_id);
create index idx_applications_job_status on public.applications (job_id, status);
create index idx_applications_email on public.applications (email);

create trigger trg_set_updated_at_applications
before update on public.applications
for each row execute function public.set_updated_at();


-- =============================================================================
-- 8. TABLE: education
-- =============================================================================
-- Multiple education records per application (per candidate submission).

create table public.education (
  id                uuid primary key default gen_random_uuid(),
  application_id    uuid not null references public.applications(id) on delete cascade,
  institution_name  text not null check (char_length(institution_name) > 0),
  degree            text not null check (char_length(degree) > 0),
  field_of_study    text,
  start_date        date,
  end_date          date,
  is_current        boolean not null default false,
  grade             text,
  description       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint education_dates_check
    check (is_current or end_date is null or start_date is null or end_date >= start_date)
);

comment on table public.education is 'Zero or more education records per application.';

create index idx_education_application_id on public.education (application_id);

create trigger trg_set_updated_at_education
before update on public.education
for each row execute function public.set_updated_at();


-- =============================================================================
-- 9. TABLE: skills
-- =============================================================================

create table public.skills (
  id                  uuid primary key default gen_random_uuid(),
  application_id      uuid not null references public.applications(id) on delete cascade,
  skill_name          text not null check (char_length(skill_name) > 0),
  proficiency_level   public.skill_proficiency,
  years_of_experience numeric(4, 1) check (years_of_experience is null or years_of_experience >= 0),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint skills_application_skill_unique unique (application_id, skill_name)
);

comment on table public.skills is 'Zero or more skills per application.';

create index idx_skills_application_id on public.skills (application_id);
create index idx_skills_skill_name on public.skills (skill_name);

create trigger trg_set_updated_at_skills
before update on public.skills
for each row execute function public.set_updated_at();


-- =============================================================================
-- 10. TABLE: application_notes
-- =============================================================================
-- Free-text HR commentary on an application.

create table public.application_notes (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references public.applications(id) on delete cascade,
  author_id       uuid references public.profiles(id) on delete set null,
  note            text not null check (char_length(note) > 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.application_notes is 'Internal HR notes attached to an application.';

create index idx_application_notes_application_id on public.application_notes (application_id);
create index idx_application_notes_author_id on public.application_notes (author_id);

create trigger trg_set_updated_at_application_notes
before update on public.application_notes
for each row execute function public.set_updated_at();


-- =============================================================================
-- 11. TABLE: application_status_history
-- =============================================================================
-- Append-only audit trail. Rows are written exclusively by the trigger
-- defined in section 13 — no client-facing INSERT/UPDATE/DELETE policy
-- exists for this table (see RLS section), to preserve audit integrity.

create table public.application_status_history (
  id                uuid primary key default gen_random_uuid(),
  application_id    uuid not null references public.applications(id) on delete cascade,
  previous_status   public.application_status,
  new_status        public.application_status not null,
  changed_by        uuid references public.profiles(id) on delete set null,
  reason            text,
  created_at        timestamptz not null default now(),

  constraint application_status_history_change_check
    check (previous_status is distinct from new_status)
);

comment on table public.application_status_history is 'Immutable audit trail of application status transitions. Populated only by trigger.';

-- A single composite index covers both "all history for an application" and
-- "history for an application ordered by time" (leftmost-prefix rule).
create index idx_status_history_application_created on public.application_status_history (application_id, created_at desc);


-- =============================================================================
-- 12. TABLE: job_ai_criteria
-- =============================================================================
-- Job-specific weighted criteria used by the AI screener.

create table public.job_ai_criteria (
  id              uuid primary key default gen_random_uuid(),
  job_id          uuid not null references public.jobs(id) on delete cascade,
  criteria_name   text not null check (char_length(criteria_name) > 0),
  description     text,
  weight          numeric(5, 2) not null default 1.0 check (weight > 0),
  is_required     boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint job_ai_criteria_job_name_unique unique (job_id, criteria_name)
);

comment on table public.job_ai_criteria is 'Weighted AI screening criteria defined per job by HR.';

create index idx_job_ai_criteria_job_id on public.job_ai_criteria (job_id);

create trigger trg_set_updated_at_job_ai_criteria
before update on public.job_ai_criteria
for each row execute function public.set_updated_at();


-- =============================================================================
-- 13. TABLE: ai_evaluations
-- =============================================================================
-- AI screening results per application. Multiple evaluations per application
-- are allowed (e.g. re-runs); `evaluated_at` orders them.

create table public.ai_evaluations (
  id                uuid primary key default gen_random_uuid(),
  application_id    uuid not null references public.applications(id) on delete cascade,
  overall_score     numeric(5, 2) check (overall_score is null or (overall_score >= 0 and overall_score <= 100)),
  recommendation    public.ai_recommendation,
  summary           text,
  strengths         text,
  concerns          text,
  -- Per-criterion scores, informally keyed by job_ai_criteria.id (not
  -- enforced via FK, since jsonb map keys cannot carry a FK constraint).
  criteria_scores   jsonb not null default '{}'::jsonb,
  model_name        text,
  model_version     text,
  evaluated_at      timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

comment on table public.ai_evaluations is 'AI screening evaluation results per application. criteria_scores keys informally reference job_ai_criteria.id.';

-- A single composite index covers both "all evaluations for an application"
-- and "evaluations for an application ordered by time" (leftmost-prefix rule).
create index idx_ai_evaluations_application_evaluated on public.ai_evaluations (application_id, evaluated_at desc);


-- =============================================================================
-- 14. TRIGGER: automatic status-history logging
-- =============================================================================
-- SECURITY DEFINER so it can always write to application_status_history even
-- though that table has no client-facing write policies.

create or replace function public.log_application_status_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.application_status_history (application_id, previous_status, new_status, changed_by)
    values (new.id, null, new.status, auth.uid());
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    insert into public.application_status_history (application_id, previous_status, new_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

create trigger trg_log_application_status_change
after insert or update on public.applications
for each row execute function public.log_application_status_change();


-- =============================================================================
-- 15. ROW LEVEL SECURITY
-- =============================================================================

alter table public.profiles                    enable row level security;
alter table public.jobs                        enable row level security;
alter table public.applications                enable row level security;
alter table public.education                   enable row level security;
alter table public.skills                      enable row level security;
alter table public.application_notes           enable row level security;
alter table public.application_status_history  enable row level security;
alter table public.job_ai_criteria             enable row level security;
alter table public.ai_evaluations              enable row level security;

-- ---------------------------------------------------------------------------
-- profiles: staff can see their own profile; HR/admin can see all staff
-- profiles; only self-update is allowed (role changes are blocked for
-- non-admins by the trigger above). No INSERT/DELETE policy — provisioning
-- is deferred to the auth implementation step.
-- ---------------------------------------------------------------------------

create policy "Users can view own profile"
on public.profiles for select
to authenticated
using (auth.uid() = id);

create policy "HR and admin can view all profiles"
on public.profiles for select
to authenticated
using (public.is_hr_or_admin());

create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- jobs: public (anon + authenticated) may read published jobs only.
-- HR/admin can fully manage all jobs regardless of status.
-- ---------------------------------------------------------------------------

create policy "Public can view published jobs"
on public.jobs for select
to anon, authenticated
using (status = 'published');

create policy "HR and admin can manage jobs"
on public.jobs for all
to authenticated
using (public.is_hr_or_admin())
with check (public.is_hr_or_admin());

-- ---------------------------------------------------------------------------
-- applications, education, skills, application_notes, job_ai_criteria,
-- ai_evaluations: HR/admin only, in every direction. No anon access at all.
-- Public application submission will be added later via a trusted
-- server-only path (service-role key, never sent to the browser).
-- ---------------------------------------------------------------------------

create policy "HR and admin can manage applications"
on public.applications for all
to authenticated
using (public.is_hr_or_admin())
with check (public.is_hr_or_admin());

create policy "HR and admin can manage education"
on public.education for all
to authenticated
using (public.is_hr_or_admin())
with check (public.is_hr_or_admin());

create policy "HR and admin can manage skills"
on public.skills for all
to authenticated
using (public.is_hr_or_admin())
with check (public.is_hr_or_admin());

create policy "HR and admin can manage application notes"
on public.application_notes for all
to authenticated
using (public.is_hr_or_admin())
with check (public.is_hr_or_admin());

create policy "HR and admin can manage job ai criteria"
on public.job_ai_criteria for all
to authenticated
using (public.is_hr_or_admin())
with check (public.is_hr_or_admin());

create policy "HR and admin can manage ai evaluations"
on public.ai_evaluations for all
to authenticated
using (public.is_hr_or_admin())
with check (public.is_hr_or_admin());

-- ---------------------------------------------------------------------------
-- application_status_history: HR/admin read-only. No write policy for any
-- client role — rows are inserted exclusively by the SECURITY DEFINER
-- trigger (trg_log_application_status_change) to preserve audit integrity.
-- ---------------------------------------------------------------------------

create policy "HR and admin can view status history"
on public.application_status_history for select
to authenticated
using (public.is_hr_or_admin());
