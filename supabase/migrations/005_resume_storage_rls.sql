-- =============================================================================
-- AI Recruitment Portal — Resume Storage RLS (private "resumes" bucket)
-- =============================================================================
-- Fixes: candidate résumé uploads failing with
--   "new row violates row-level security policy"
--
-- The "resumes" bucket already exists, but its object-level RLS policies
-- were missing or not matching the actual object paths. Object paths are
-- always `${auth.uid()}/${filename}` (see
-- src/lib/candidate/resume-actions.ts), so every candidate-facing policy
-- below checks that the object name starts with the caller's own uid
-- followed by '/'.
--
-- This migration is idempotent (safe to re-run): it re-asserts the bucket
-- is private and drops/recreates each policy by name before creating it.
-- =============================================================================

-- 1. Ensure the bucket exists and is private.
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do update set public = false;

-- 2. Candidate-facing object policies — own folder only.
drop policy if exists "Candidates can upload own resume file" on storage.objects;
drop policy if exists "Candidates can view own resume file" on storage.objects;
drop policy if exists "Candidates can replace own resume file" on storage.objects;
drop policy if exists "Candidates can delete own resume file" on storage.objects;

create policy "Candidates can upload own resume file"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'resumes'
  and name like (auth.uid()::text || '/%')
);

create policy "Candidates can view own resume file"
on storage.objects for select
to authenticated
using (
  bucket_id = 'resumes'
  and name like (auth.uid()::text || '/%')
);

create policy "Candidates can replace own resume file"
on storage.objects for update
to authenticated
using (
  bucket_id = 'resumes'
  and name like (auth.uid()::text || '/%')
)
with check (
  bucket_id = 'resumes'
  and name like (auth.uid()::text || '/%')
);

create policy "Candidates can delete own resume file"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'resumes'
  and name like (auth.uid()::text || '/%')
);

-- 3. HR/admin read-only access (unchanged from 004; recreated here so this
--    migration is fully idempotent even if 004's storage policies never
--    applied successfully).
drop policy if exists "HR and admin can view resume files" on storage.objects;

create policy "HR and admin can view resume files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'resumes'
  and public.is_hr_or_admin()
);
