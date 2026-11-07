create table if not exists public.portal_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.portal_admins enable row level security;
revoke all on table public.portal_admins from anon, authenticated;

create or replace function public.is_portal_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.portal_admins
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_portal_admin() from public, anon;
grant execute on function public.is_portal_admin() to authenticated;

create table if not exists public.concern_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_name text check (
    reporter_name is null
    or char_length(reporter_name) between 1 and 120
  ),
  concern text not null check (char_length(concern) between 1 and 5000),
  image_path text,
  submitted_at timestamptz not null default now()
);

alter table public.concern_reports
  add column if not exists image_path text;

create index if not exists concern_reports_submitted_at_idx
  on public.concern_reports (submitted_at desc);

alter table public.concern_reports enable row level security;
revoke all on table public.concern_reports from public, anon, authenticated;
grant insert (reporter_name, concern, image_path)
  on table public.concern_reports to anon, authenticated;
grant select on table public.concern_reports to authenticated;

drop policy if exists "Anyone can submit a concern report"
  on public.concern_reports;
create policy "Anyone can submit a concern report"
  on public.concern_reports
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Portal admins can read concern reports"
  on public.concern_reports;
create policy "Portal admins can read concern reports"
  on public.concern_reports
  for select
  to authenticated
  using ((select public.is_portal_admin()));

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'concern-report-images',
  'concern-report-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can attach pictures to concern reports"
  on storage.objects;
create policy "Anyone can attach pictures to concern reports"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'concern-report-images');

drop policy if exists "Portal admins can read concern report pictures"
  on storage.objects;
create policy "Portal admins can read concern report pictures"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'concern-report-images'
    and (select public.is_portal_admin())
  );

notify pgrst, 'reload schema';
