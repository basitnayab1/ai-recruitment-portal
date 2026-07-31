-- =============================================================================
-- AI Recruitment Portal — in-app notifications
-- =============================================================================

create table public.notifications (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            text not null check (role in ('candidate', 'hr')),
  title           text not null check (char_length(title) > 0),
  message         text not null check (char_length(message) > 0),
  type            text not null check (char_length(type) > 0),
  reference_id    uuid,
  reference_type  text,
  is_read         boolean not null default false,
  created_at      timestamptz not null default now()
);

comment on table public.notifications is 'In-app notifications for candidates and HR staff. Inserts are performed server-side via the service role; users may only read and mark their own rows.';

create index idx_notifications_user_id on public.notifications (user_id);
create index idx_notifications_user_created_at on public.notifications (user_id, created_at desc);
create index idx_notifications_user_unread on public.notifications (user_id, created_at desc) where is_read = false;

alter table public.notifications enable row level security;

create policy "Users can view own notifications"
on public.notifications for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can update own notifications"
on public.notifications for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
