-- =============================================================================
-- AI Recruitment Portal — HR read access to candidate profiles
-- =============================================================================
-- Design notes:
--   * `candidate_profiles` (002) and `candidate_profile_details` (003) were
--     originally candidate-only ("no HR/admin read policy here — not needed
--     until a feature actually requires HR to browse candidate accounts
--     directly"). The HR → Candidates directory and candidate detail page
--     are exactly that feature, so this migration adds a read-only
--     `is_hr_or_admin()` SELECT policy to each table.
--   * Additive only: no existing policy is dropped, changed, or narrowed.
--     RLS combines multiple permissive policies with OR, so candidates'
--     own "view/insert/update own …" policies are completely unaffected —
--     a candidate still can only ever see their own row via those, this
--     just widens *read* access to also include HR/admin staff.
--   * Mirrors the identical pattern already used for résumés: see
--     "HR and admin can view all resumes" in
--     004_candidate_job_applications.sql.
--   * No INSERT/UPDATE/DELETE policy is added for HR/admin — candidates
--     remain the only writers of their own profile data.
--   * Idempotent (`drop policy if exists` before each `create policy`) so
--     this is safe to re-run — same pattern used for the candidate-facing
--     policies in 008_applications_candidate_schema.sql.
-- =============================================================================

drop policy if exists "HR and admin can view all candidate profiles" on public.candidate_profiles;
drop policy if exists "HR and admin can view all candidate profile details" on public.candidate_profile_details;

create policy "HR and admin can view all candidate profiles"
on public.candidate_profiles for select
to authenticated
using (public.is_hr_or_admin());

create policy "HR and admin can view all candidate profile details"
on public.candidate_profile_details for select
to authenticated
using (public.is_hr_or_admin());
