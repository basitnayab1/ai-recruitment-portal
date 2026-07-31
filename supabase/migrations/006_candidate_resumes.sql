-- =============================================================================
-- AI Recruitment Portal — candidate_resumes table
-- =============================================================================
-- Fixes: "the table public.candidate_resumes does not exist"
--
-- One current résumé per candidate. storage_path is a private Storage
-- object path (bucket: resumes — see 005_resume_storage_rls.sql), never a
-- public URL.
--
-- Idempotent (safe to re-run): guards table creation and each policy.
-- =============================================================================

create table if not exists public.candidate_resumes (
  candidate_id  uuid primary key references public.candidate_profiles(id) on delete cascade,
  storage_path  text not null,
  file_name     text not null,
  file_size     bigint not null,
  mime_type     text not null,
  uploaded_at   timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.candidate_resumes is 'One current resume/CV per candidate. storage_path is a private Storage object path (bucket: resumes), never a public URL.';

drop trigger if exists trg_set_updated_at_candidate_resumes on public.candidate_resumes;

create trigger trg_set_updated_at_candidate_resumes
before update on public.candidate_resumes
for each row execute function public.set_updated_at();

alter table public.candidate_resumes enable row level security;

drop policy if exists "Candidates can view own resume" on public.candidate_resumes;
drop policy if exists "Candidates can insert own resume" on public.candidate_resumes;
drop policy if exists "Candidates can update own resume" on public.candidate_resumes;
drop policy if exists "Candidates can delete own resume" on public.candidate_resumes;

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
