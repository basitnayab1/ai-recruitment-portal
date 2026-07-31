-- =============================================================================
-- AI Recruitment Portal — notification per-user + per-role isolation
-- =============================================================================
-- HR profiles and candidate profiles both use auth.users.id as their primary
-- key. Notifications must be scoped by (user_id, role) so dual-role accounts
-- never share read state or visibility between portals.
-- =============================================================================

create index if not exists idx_notifications_user_role_created_at
  on public.notifications (user_id, role, created_at desc);

create index if not exists idx_notifications_user_role_unread
  on public.notifications (user_id, role, created_at desc)
  where is_read = false;

comment on column public.notifications.user_id is
  'Owner auth.users id — one notification row per recipient user.';
comment on column public.notifications.role is
  'Portal role (candidate or hr) this notification belongs to. Required for isolation when the same auth user has both HR and candidate profiles.';
