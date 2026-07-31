-- =============================================================================
-- 020 — Restore authenticated EXECUTE on is_hr_or_admin()
-- =============================================================================
-- The Security Advisor hardening (REVOKE EXECUTE from authenticated) breaks
-- login for both portals:
--
--   * HR login queries `profiles` (src/lib/auth/actions.ts). That table has
--     two permissive SELECT policies; evaluating
--     "HR and admin can view all profiles" calls is_hr_or_admin(). Without
--     EXECUTE, Postgres raises "permission denied for function
--     is_hr_or_admin()" and the SELECT fails.
--
--   * Candidate login upserts `candidate_profiles`
--     (src/lib/candidate-auth/ensure-profile.ts). Migration 009 added
--     "HR and admin can view all candidate profiles", which also calls
--     is_hr_or_admin() during SELECT / upsert policy checks — same failure.
--
-- authenticated MUST retain EXECUTE for RLS policy evaluation. anon must not
-- (not an RPC endpoint for guests). is_admin() and trigger helpers stay
-- internal-only (no GRANT to authenticated).
-- =============================================================================

revoke all on function public.is_hr_or_admin() from public;
revoke all on function public.is_hr_or_admin() from anon;

grant execute on function public.is_hr_or_admin() to authenticated;
