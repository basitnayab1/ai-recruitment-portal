-- =============================================================================
-- 022 — Point RLS/triggers at private.is_hr_or_admin() (step 2 of 2)
-- =============================================================================
-- Requires 021_create_private_is_hr_or_admin.sql to be applied first.
-- Updates all policies, the status-history trigger, then drops public copy.
-- =============================================================================

-- Guard: fail fast with a clear message if step 1 was skipped
do $guard$
begin
  if not exists (
    select 1
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and p.proname = 'is_hr_or_admin'
  ) then
    raise exception
      'private.is_hr_or_admin() does not exist. Apply migration 021 first.';
  end if;
end
$guard$;

-- ---------------------------------------------------------------------------
-- 1. RLS policies — public.profiles, jobs, recruitment tables (001)
-- ---------------------------------------------------------------------------
drop policy if exists "HR and admin can view all profiles" on public.profiles;
create policy "HR and admin can view all profiles"
on public.profiles for select
to authenticated
using ((select private.is_hr_or_admin()));

drop policy if exists "HR and admin can manage jobs" on public.jobs;
create policy "HR and admin can manage jobs"
on public.jobs for all
to authenticated
using ((select private.is_hr_or_admin()))
with check ((select private.is_hr_or_admin()));

drop policy if exists "HR and admin can manage applications" on public.applications;
create policy "HR and admin can manage applications"
on public.applications for all
to authenticated
using ((select private.is_hr_or_admin()))
with check ((select private.is_hr_or_admin()));

drop policy if exists "HR and admin can manage education" on public.education;
create policy "HR and admin can manage education"
on public.education for all
to authenticated
using ((select private.is_hr_or_admin()))
with check ((select private.is_hr_or_admin()));

drop policy if exists "HR and admin can manage skills" on public.skills;
create policy "HR and admin can manage skills"
on public.skills for all
to authenticated
using ((select private.is_hr_or_admin()))
with check ((select private.is_hr_or_admin()));

drop policy if exists "HR and admin can manage application notes" on public.application_notes;
create policy "HR and admin can manage application notes"
on public.application_notes for all
to authenticated
using ((select private.is_hr_or_admin()))
with check ((select private.is_hr_or_admin()));

drop policy if exists "HR and admin can manage job ai criteria" on public.job_ai_criteria;
create policy "HR and admin can manage job ai criteria"
on public.job_ai_criteria for all
to authenticated
using ((select private.is_hr_or_admin()))
with check ((select private.is_hr_or_admin()));

drop policy if exists "HR and admin can manage ai evaluations" on public.ai_evaluations;
create policy "HR and admin can manage ai evaluations"
on public.ai_evaluations for all
to authenticated
using ((select private.is_hr_or_admin()))
with check ((select private.is_hr_or_admin()));

drop policy if exists "HR and admin can view status history" on public.application_status_history;
create policy "HR and admin can view status history"
on public.application_status_history for select
to authenticated
using ((select private.is_hr_or_admin()));

-- ---------------------------------------------------------------------------
-- 2. RLS policies — candidate data + storage (004, 005, 009, 014, 019)
-- ---------------------------------------------------------------------------
drop policy if exists "HR and admin can view all candidate profiles" on public.candidate_profiles;
create policy "HR and admin can view all candidate profiles"
on public.candidate_profiles for select
to authenticated
using ((select private.is_hr_or_admin()));

drop policy if exists "HR and admin can view all candidate profile details" on public.candidate_profile_details;
create policy "HR and admin can view all candidate profile details"
on public.candidate_profile_details for select
to authenticated
using ((select private.is_hr_or_admin()));

drop policy if exists "HR and admin can view all resumes" on public.candidate_resumes;
create policy "HR and admin can view all resumes"
on public.candidate_resumes for select
to authenticated
using ((select private.is_hr_or_admin()));

drop policy if exists "HR and admin can view all profile pictures" on public.candidate_profile_pictures;
create policy "HR and admin can view all profile pictures"
on public.candidate_profile_pictures for select
to authenticated
using ((select private.is_hr_or_admin()));

drop policy if exists "HR and admin can view resume files" on storage.objects;
create policy "HR and admin can view resume files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'resumes'
  and (select private.is_hr_or_admin())
);

drop policy if exists "HR and admin can view profile picture files" on storage.objects;
create policy "HR and admin can view profile picture files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'profile-pictures'
  and (select private.is_hr_or_admin())
);

-- ---------------------------------------------------------------------------
-- 3. RLS policies — interviews, audit logs (015, 018)
-- ---------------------------------------------------------------------------
drop policy if exists "HR and admin can manage interviews" on public.interviews;
create policy "HR and admin can manage interviews"
on public.interviews for all
to authenticated
using ((select private.is_hr_or_admin()))
with check ((select private.is_hr_or_admin()));

drop policy if exists "HR and admin can view audit logs" on public.audit_logs;
create policy "HR and admin can view audit logs"
on public.audit_logs for select
to authenticated
using ((select private.is_hr_or_admin()));

-- ---------------------------------------------------------------------------
-- 4. Trigger helper — application status history (012)
-- ---------------------------------------------------------------------------
create or replace function public.log_application_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.is_hr_or_admin()) then
    return new;
  end if;

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

revoke all on function public.log_application_status_change() from public;
revoke all on function public.log_application_status_change() from anon;
revoke all on function public.log_application_status_change() from authenticated;

-- ---------------------------------------------------------------------------
-- 5. Drop the public copy (removes PostgREST RPC endpoint)
-- ---------------------------------------------------------------------------
drop function if exists public.is_hr_or_admin();
