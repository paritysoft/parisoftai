-- ParitySoft AI — Supabase Storage bucket and policies for the media library.
-- Public read (website images), staff upload, admin delete. Executable/HTML types are not allowed.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  5242880, -- 5 MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/svg+xml']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "staff list media objects" on storage.objects for select to authenticated
  using (bucket_id = 'media' and public.is_staff());

create policy "staff upload media objects" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'media'
    and public.is_staff()
    and (storage.foldername(name))[1] = 'uploads'
  );

create policy "staff update media objects" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_staff())
  with check (bucket_id = 'media' and public.is_staff());

create policy "admins delete media objects" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());
