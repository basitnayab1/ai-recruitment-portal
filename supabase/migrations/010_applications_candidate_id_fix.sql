alter table public.applications
  add column if not exists candidate_id uuid references public.candidate_profiles(id);

alter table public.applications
  add column if not exists notice_period text;

create index if not exists idx_applications_candidate_id on public.applications (candidate_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'applications_candidate_job_unique'
  ) then
    alter table public.applications
      add constraint applications_candidate_job_unique unique (candidate_id, job_id);
  end if;
end $$;
