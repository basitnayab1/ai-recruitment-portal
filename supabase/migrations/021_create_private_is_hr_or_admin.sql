-- =============================================================================
-- 021 — Create private.is_hr_or_admin() (step 1 of 2)
-- =============================================================================
-- RUN THIS MIGRATION BEFORE 022.
-- Creates the private schema and helper function only — no policy changes yet.
-- If you see "schema private does not exist", this file was not applied first.
-- =============================================================================

create schema if not exists private;

comment on schema private is
  'Internal PostgreSQL helpers (RLS, triggers). Not exposed via PostgREST.';

revoke all on schema private from public;
grant usage on schema private to postgres, authenticated, service_role;

create or replace function private.is_hr_or_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('hr', 'admin')
      and is_active = true
  );
$$;

comment on function private.is_hr_or_admin() is
  'RLS helper: true when auth.uid() is an active HR or admin in public.profiles.';

revoke all on function private.is_hr_or_admin() from public;
revoke all on function private.is_hr_or_admin() from anon;
grant execute on function private.is_hr_or_admin() to authenticated;
grant execute on function private.is_hr_or_admin() to service_role;
