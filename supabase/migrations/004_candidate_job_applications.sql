-- =============================================================================
-- AI Recruitment Portal — Candidate Job Application Workflow
-- =============================================================================
-- Design notes:
--   * `public.applications` (001) was originally designed with no candidate
--     identity at all ("there is no candidates table... each row IS the
--     candidate's submission"), written only by a future trusted
--     server-only path. Candidate accounts now exist (002), so this
--     migration ADDS a nullable `candidate_id` link and new, additive RLS
--     policies enabling candidates to submit and view their own
--     applications — it does not touch the existing
--     "HR and admin can manage applications" policy or any other HR-facing
--     behavior.
--   * Duplicate applications are already prevented by the existing
--     `applications_job_email_unique` constraint (job_id, email) from 001 —
--     no new constraint is needed for that.
--   * `candidate_resumes` is a new 1:1 extension table (same
--     candidate_id-as-primary-key pattern as `candidate_profile_details`,
--     003) tracking each candidate's current résumé file. The actual file
--     bytes live in a new private Storage bucket ("resumes"); only the
--     private object path is ever persisted, never a public URL — same
--     rule as `applications.cv_storage_path`.
-- =============================================================================


-- =============================================================================
-- 1. applications: link to candidate_profiles
-- =============================================================================

alter table public.applications
  add column candidate_id uuid references public.candidate_profiles(id) on delete set null;

comment on column public.applications.candidate_id is 'Set for applications submitted through the candidate self-service flow. Null for any application without a linked candidate account.';

create index idx_applications_candidate_id on public.applications (candidate_id);

-- Additive policies — the existing "HR and admin can manage applications"
-- policy (001) is untouched; RLS combines multiple permissive policies with
-- OR, so this only ever widens access to a candidate's own rows.
create policy "Candidates can view own applications"
on public.applications for select
to authenticated
using (auth.uid() = candidate_id);

create policy "Candidates can insert own applications"
on public.applications for insert
to authenticated
with check (auth.uid() = candidate_id);


-- =============================================================================
-- 2. TABLE: candidate_resumes
-- =============================================================================

create table public.candidate_resumes (
  candidate_id  uuid primary key references public.candidate_profiles(id) on delete cascade,
  storage_path  text not null check (char_length(storage_path) > 0),
  file_name     text not null check (char_length(file_name) > 0),
  file_size     integer not null check (file_size > 0),
  mime_type     text not null check (char_length(mime_type) > 0),
  uploaded_at   timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.candidate_resumes is 'One current resume/CV per candidate. storage_path is a private Storage object path (bucket: resumes), never a public URL.';

create trigger trg_set_updated_at_candidate_resumes
before update on public.candidate_resumes
for each row execute function public.set_updated_at();

alter table public.candidate_resumes enable row level security;

create policy "Candidates can view own resume"
on public.candidate_resumes for select
to authenticated
using (auth.uid() = candidate_id);

create policy "Candidates can insert own resume"
on public.candidate_resumes for insert
to authenticated
with check (auth.uid() = candidate_id);

create policy "Candidates can update own resume"
on public.candidate_resumes for update
to authenticated
using (auth.uid() = candidate_id)
with check (auth.uid() = candidate_id);

create policy "Candidates can delete own resume"
on public.candidate_resumes for delete
to authenticated
using (auth.uid() = candidate_id);

-- HR/admin need to be able to look up whose résumé is whose (e.g. future
-- "view résumé" links from the applications review UI). Read-only.
create policy "HR and admin can view all resumes"
on public.candidate_resumes for select
to authenticated
using (public.is_hr_or_admin());


-- =============================================================================
-- 3. STORAGE: private "resumes" bucket + object policies
-- =============================================================================
-- Object paths are always `${candidate_id}/${filename}` — policies below
-- check that the first path segment matches the caller's own uid.

insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

create policy "Candidates can upload own resume file"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Candidates can view own resume file"
on storage.objects for select
to authenticated
using (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Candidates can replace own resume file"
on storage.objects for update
to authenticated
using (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Candidates can delete own resume file"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "HR and admin can view resume files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'resumes'
  and public.is_hr_or_admin()
);
