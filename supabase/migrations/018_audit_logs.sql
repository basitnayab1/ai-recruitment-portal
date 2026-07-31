-- =============================================================================
-- AI Recruitment Portal — activity log (audit trail)
-- =============================================================================

create table public.audit_logs (
  id            uuid primary key default gen_random_uuid(),
  actor_id      uuid references auth.users(id) on delete set null,
  actor_role    text not null check (actor_role in ('candidate', 'hr', 'admin')),
  action        text not null check (char_length(action) > 0),
  entity_type   text not null check (char_length(entity_type) > 0),
  entity_id     uuid,
  description   text not null check (char_length(description) > 0),
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

comment on table public.audit_logs is 'Immutable audit trail for recruitment actions. Inserts are server-side only; HR/admin may read via RLS.';

create index idx_audit_logs_created_at on public.audit_logs (created_at desc);
create index idx_audit_logs_action on public.audit_logs (action, created_at desc);
create index idx_audit_logs_actor_id on public.audit_logs (actor_id, created_at desc);
create index idx_audit_logs_entity on public.audit_logs (entity_type, entity_id);
create index idx_audit_logs_metadata_job_id on public.audit_logs ((metadata->>'jobId'), created_at desc);
create index idx_audit_logs_metadata_candidate_id on public.audit_logs ((metadata->>'candidateId'), created_at desc);

alter table public.audit_logs enable row level security;

create policy "HR and admin can view audit logs"
on public.audit_logs for select
to authenticated
using (public.is_hr_or_admin());
