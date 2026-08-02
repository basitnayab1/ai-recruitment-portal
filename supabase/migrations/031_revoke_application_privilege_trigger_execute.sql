-- =============================================================================
-- 031: Revoke EXECUTE on application privilege-escalation trigger function
-- =============================================================================
-- Function: public.prevent_candidate_application_privilege_escalation()
-- Kind: BEFORE UPDATE trigger function ONLY (returns trigger). Not an RPC.
--
-- Supabase Security Advisor warned that anon + authenticated can EXECUTE this
-- SECURITY DEFINER function. PostgreSQL grants EXECUTE to PUBLIC by default on
-- CREATE FUNCTION, which PostgREST surfaces as /rest/v1/rpc/....
--
-- Fix: keep SECURITY DEFINER (needed so the trigger can reliably call
-- private.is_hr_or_admin() regardless of caller grants), but revoke client
-- EXECUTE. Trigger firing does not require anon/authenticated EXECUTE.
-- Idempotent: safe to re-run.
-- =============================================================================

-- Ensure definition stays a trigger function (no signature / behavior change).
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

-- Strip default PUBLIC execute + PostgREST roles.
revoke all on function public.prevent_candidate_application_privilege_escalation()
  from public;
revoke execute on function public.prevent_candidate_application_privilege_escalation()
  from anon;
revoke execute on function public.prevent_candidate_application_privilege_escalation()
  from authenticated;

-- Ensure the trigger still exists (no-op if already attached from 028).
drop trigger if exists trg_prevent_candidate_application_privilege_escalation
  on public.applications;

create trigger trg_prevent_candidate_application_privilege_escalation
before update on public.applications
for each row
execute function public.prevent_candidate_application_privilege_escalation();

comment on function public.prevent_candidate_application_privilege_escalation() is
  'Trigger-only SECURITY DEFINER guard. Not callable via RPC — EXECUTE revoked from anon/authenticated.';
