create or replace function public.log_application_status_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_hr_or_admin() then
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
