drop policy if exists "Candidates can view own applications" on public.applications;
drop policy if exists "Candidates can insert own applications" on public.applications;
drop policy if exists "Candidates can update own applications" on public.applications;

create policy "Candidates can view own applications"
on public.applications for select
to authenticated
using (auth.uid() = candidate_id);

create policy "Candidates can insert own applications"
on public.applications for insert
to authenticated
with check (auth.uid() = candidate_id);

create policy "Candidates can update own applications"
on public.applications for update
to authenticated
using (auth.uid() = candidate_id)
with check (auth.uid() = candidate_id);
