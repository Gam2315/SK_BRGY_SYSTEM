create table if not exists public.barangay_officials (
  id uuid primary key default gen_random_uuid(),
  position text not null unique check (
    position in (
      'Punong Barangay',
      'Barangay Kagawad',
      'Barangay Secretary',
      'Barangay Treasurer',
      'SK Chairman'
    )
  ),
  full_name text check (full_name is null or char_length(full_name) <= 120),
  phone text check (phone is null or char_length(phone) <= 40),
  email text check (email is null or char_length(email) <= 254),
  photo_path text,
  is_published boolean not null default false,
  sort_order integer not null,
  updated_at timestamptz not null default now()
);

alter table public.barangay_officials
  add column if not exists photo_path text;

alter table public.barangay_officials
  drop constraint if exists barangay_officials_position_check;

update public.barangay_officials
set position = 'SK Chairman'
where position = 'SK Chairperson';

alter table public.barangay_officials
  add constraint barangay_officials_position_check
  check (
    position in (
      'Punong Barangay',
      'Barangay Kagawad',
      'Barangay Secretary',
      'Barangay Treasurer',
      'SK Chairman'
    )
  );

insert into public.barangay_officials (position, sort_order)
values
  ('Punong Barangay', 1),
  ('Barangay Kagawad', 2),
  ('Barangay Secretary', 3),
  ('Barangay Treasurer', 4),
  ('SK Chairman', 5)
on conflict (position) do update
set sort_order = excluded.sort_order;

alter table public.barangay_officials enable row level security;
revoke all on table public.barangay_officials from anon, authenticated;
grant select on table public.barangay_officials to anon, authenticated;
grant update on table public.barangay_officials to authenticated;

drop policy if exists "Anyone can read published barangay officials"
  on public.barangay_officials;
create policy "Anyone can read published barangay officials"
  on public.barangay_officials
  for select
  to anon, authenticated
  using (is_published and full_name is not null);

drop policy if exists "Portal admins can read all barangay officials"
  on public.barangay_officials;
create policy "Portal admins can read all barangay officials"
  on public.barangay_officials
  for select
  to authenticated
  using ((select public.is_portal_admin()));

drop policy if exists "Portal admins can update barangay officials"
  on public.barangay_officials;
create policy "Portal admins can update barangay officials"
  on public.barangay_officials
  for update
  to authenticated
  using ((select public.is_portal_admin()))
  with check ((select public.is_portal_admin()));

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'barangay-official-photos',
  'barangay-official-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can read barangay official profile pictures"
  on storage.objects;
create policy "Anyone can read barangay official profile pictures"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'barangay-official-photos');

drop policy if exists "Portal admins can upload barangay official profile pictures"
  on storage.objects;
create policy "Portal admins can upload barangay official profile pictures"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'barangay-official-photos'
    and (select public.is_portal_admin())
  );

drop policy if exists "Portal admins can delete barangay official profile pictures"
  on storage.objects;
create policy "Portal admins can delete barangay official profile pictures"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'barangay-official-photos'
    and (select public.is_portal_admin())
  );

notify pgrst, 'reload schema';
