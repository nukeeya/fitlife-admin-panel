begin;

alter table public.admission_submissions
  add column if not exists avatar text;

update storage.buckets
set public = false,
    file_size_limit = 15728640,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']
where id = 'profile-photos';

drop policy if exists "Anonymous users can upload admission profile photos" on storage.objects;
create policy "Anonymous users can upload admission profile photos"
on storage.objects for insert to anon
with check (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = 'admissions'
);

drop policy if exists "Authenticated users can view profile photos" on storage.objects;
create policy "Authenticated users can view profile photos"
on storage.objects for select to authenticated
using (bucket_id = 'profile-photos');

commit;
