-- =============================================================================
-- 028: Security harden — candidates must not UPDATE applications
-- =============================================================================
-- CRITICAL: Policy "Candidates can update own applications" allowed any
-- authenticated candidate to PATCH their own application row via PostgREST
-- (including status → hired/interview) using the publishable key + JWT.
-- The app never updates applications as a candidate — drop the policy.
-- Idempotent: safe to re-run.
-- =============================================================================

drop policy if exists "Candidates can update own applications" on public.applications;

-- Defense in depth: reject candidate-driven mutations to privileged columns
-- if a future policy re-opens UPDATE.
create or replace function public.prevent_candidate_application_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  -- HR/admin may change anything (existing HR policies).
  if private.is_hr_or_admin() then
    return new;
  end if;

  -- Candidates must never change hiring-critical fields.
  if new.status is distinct from old.status
     or new.candidate_id is distinct from old.candidate_id
     or new.job_id is distinct from old.job_id
     or new.cv_storage_path is distinct from old.cv_storage_path
     or new.full_name is distinct from old.full_name
     or new.email is distinct from old.email
  then
    raise exception 'Candidates cannot modify protected application fields.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_candidate_application_privilege_escalation
  on public.applications;

create trigger trg_prevent_candidate_application_privilege_escalation
before update on public.applications
for each row
execute function public.prevent_candidate_application_privilege_escalation();

comment on function public.prevent_candidate_application_privilege_escalation() is
  'Blocks candidates from escalating application status or rewriting identity/CV fields.';
