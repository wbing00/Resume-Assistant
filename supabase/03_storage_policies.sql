-- Resume Assistant V1 storage policies
-- Run this after creating the private `resumes` bucket if you want user-session uploads
-- to work without the server-side service-role upload fallback.

begin;

drop policy if exists "resumes_bucket_select_own" on storage.objects;
create policy "resumes_bucket_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'resumes'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "resumes_bucket_insert_own" on storage.objects;
create policy "resumes_bucket_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'resumes'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "resumes_bucket_update_own" on storage.objects;
create policy "resumes_bucket_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'resumes'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'resumes'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "resumes_bucket_delete_own" on storage.objects;
create policy "resumes_bucket_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'resumes'
  and auth.uid()::text = (storage.foldername(name))[1]
);

commit;