-- =============================================================================
-- 029: Security harden — notification RLS role isolation
-- =============================================================================
-- Notifications were scoped only by user_id. Dual-role accounts (same auth
-- user with HR + candidate profiles) could read/update the other portal's
-- notifications via PostgREST. Scope SELECT/UPDATE by portal role too.
-- Idempotent: safe to re-run.
-- =============================================================================

drop policy if exists "Users can view own notifications" on public.notifications;
drop policy if exists "Users can update own notifications" on public.notifications;
drop policy if exists "Users can view own portal notifications" on public.notifications;
drop policy if exists "Users can update own portal notifications" on public.notifications;

create policy "Users can view own portal notifications"
on public.notifications for select
to authenticated
using (
  auth.uid() = user_id
  and (
    (
      role = 'hr'
      and private.is_hr_or_admin()
    )
    or (
      role = 'candidate'
      and exists (
        select 1
        from public.candidate_profiles cp
        where cp.id = auth.uid()
          and cp.role = 'candidate'
      )
    )
  )
);

create policy "Users can update own portal notifications"
on public.notifications for update
to authenticated
using (
  auth.uid() = user_id
  and (
    (
      role = 'hr'
      and private.is_hr_or_admin()
    )
    or (
      role = 'candidate'
      and exists (
        select 1
        from public.candidate_profiles cp
        where cp.id = auth.uid()
          and cp.role = 'candidate'
      )
    )
  )
)
with check (
  auth.uid() = user_id
  and (
    (
      role = 'hr'
      and private.is_hr_or_admin()
    )
    or (
      role = 'candidate'
      and exists (
        select 1
        from public.candidate_profiles cp
        where cp.id = auth.uid()
          and cp.role = 'candidate'
      )
    )
  )
);
