-- =============================================================================
-- 014: HR résumé Storage RLS + candidate_resumes read access
-- =============================================================================
-- Ensures HR/admin can SELECT résumé objects in the private "resumes" bucket
-- and read `candidate_resumes` rows when using the normal authenticated
-- client. Idempotent — safe to re-run.
--
-- Note: HR resume route handlers also mint signed URLs via the server-only
-- admin client after `requireHRUser()`, so downloads work even if this
-- migration has not been applied yet. Applying it still allows future
-- authenticated-client Storage reads (e.g. listing) without bypassing RLS.
-- =============================================================================

-- candidate_resumes: HR read (006 recreated candidate-only policies and may
-- have omitted this if 004 never ran).
drop policy if exists "HR and admin can view all resumes" on public.candidate_resumes;

create policy "HR and admin can view all resumes"
on public.candidate_resumes for select
to authenticated
using (public.is_hr_or_admin());

-- Storage: private bucket + HR SELECT on all objects in "resumes".
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do update set public = false;

drop policy if exists "HR and admin can view resume files" on storage.objects;

create policy "HR and admin can view resume files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'resumes'
  and public.is_hr_or_admin()
);
