-- =============================================================================
-- AI Recruitment Portal — candidate profile pictures
-- =============================================================================
-- One profile picture per candidate in private Storage (bucket: profile-pictures).
-- Candidates manage their own row/object; HR/admin can read only.
-- =============================================================================

create table if not exists public.candidate_profile_pictures (
  candidate_id  uuid primary key references public.candidate_profiles(id) on delete cascade,
  storage_path  text not null,
  file_name     text not null,
  file_size     integer not null check (file_size > 0),
  mime_type     text not null,
  uploaded_at   timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.candidate_profile_pictures is 'One current profile picture per candidate. storage_path is a private Storage object path (bucket: profile-pictures), never a public URL.';

drop trigger if exists trg_set_updated_at_candidate_profile_pictures on public.candidate_profile_pictures;

create trigger trg_set_updated_at_candidate_profile_pictures
before update on public.candidate_profile_pictures
for each row execute function public.set_updated_at();

alter table public.candidate_profile_pictures enable row level security;

drop policy if exists "Candidates can view own profile picture" on public.candidate_profile_pictures;
drop policy if exists "Candidates can insert own profile picture" on public.candidate_profile_pictures;
drop policy if exists "Candidates can update own profile picture" on public.candidate_profile_pictures;
drop policy if exists "Candidates can delete own profile picture" on public.candidate_profile_pictures;
drop policy if exists "HR and admin can view all profile pictures" on public.candidate_profile_pictures;

create policy "Candidates can view own profile picture"
on public.candidate_profile_pictures for select
to authenticated
using (auth.uid() = candidate_id);

create policy "Candidates can insert own profile picture"
on public.candidate_profile_pictures for insert
to authenticated
with check (auth.uid() = candidate_id);

create policy "Candidates can update own profile picture"
on public.candidate_profile_pictures for update
to authenticated
using (auth.uid() = candidate_id)
with check (auth.uid() = candidate_id);

create policy "Candidates can delete own profile picture"
on public.candidate_profile_pictures for delete
to authenticated
using (auth.uid() = candidate_id);

create policy "HR and admin can view all profile pictures"
on public.candidate_profile_pictures for select
to authenticated
using (public.is_hr_or_admin());

-- Private Storage bucket + RLS (paths: ${auth.uid()}/…)
insert into storage.buckets (id, name, public)
values ('profile-pictures', 'profile-pictures', false)
on conflict (id) do update set public = false;

drop policy if exists "Candidates can upload own profile picture file" on storage.objects;
drop policy if exists "Candidates can view own profile picture file" on storage.objects;
drop policy if exists "Candidates can replace own profile picture file" on storage.objects;
drop policy if exists "Candidates can delete own profile picture file" on storage.objects;
drop policy if exists "HR and admin can view profile picture files" on storage.objects;

create policy "Candidates can upload own profile picture file"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-pictures'
  and name like (auth.uid()::text || '/%')
);

create policy "Candidates can view own profile picture file"
on storage.objects for select
to authenticated
using (
  bucket_id = 'profile-pictures'
  and name like (auth.uid()::text || '/%')
);

create policy "Candidates can replace own profile picture file"
on storage.objects for update
to authenticated
using (
  bucket_id = 'profile-pictures'
  and name like (auth.uid()::text || '/%')
)
with check (
  bucket_id = 'profile-pictures'
  and name like (auth.uid()::text || '/%')
);

create policy "Candidates can delete own profile picture file"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'profile-pictures'
  and name like (auth.uid()::text || '/%')
);

create policy "HR and admin can view profile picture files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'profile-pictures'
  and public.is_hr_or_admin()
);
