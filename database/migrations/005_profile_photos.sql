begin;

alter table public.members
  add column if not exists avatar text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-photos',
  'profile-photos',
  true,
  15728640,
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Authenticated users can upload profile photos" on storage.objects;
create policy "Authenticated users can upload profile photos"
on storage.objects for insert to authenticated
with check (bucket_id = 'profile-photos');

drop policy if exists "Authenticated users can update profile photos" on storage.objects;
create policy "Authenticated users can update profile photos"
on storage.objects for update to authenticated
using (bucket_id = 'profile-photos')
with check (bucket_id = 'profile-photos');

drop policy if exists "Authenticated users can delete profile photos" on storage.objects;
create policy "Authenticated users can delete profile photos"
on storage.objects for delete to authenticated
using (bucket_id = 'profile-photos');

commit;
