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

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('activity', 'project')),
  title text not null check (char_length(title) between 1 and 160),
  body text not null check (char_length(body) between 1 and 5000),
  activity_date date not null,
  image_paths text[] not null default '{}',
  created_by uuid not null references auth.users (id),
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.community_posts
  add column if not exists image_paths text[] not null default '{}';

create index if not exists community_posts_published_at_idx
  on public.community_posts (published_at desc);

alter table public.community_posts enable row level security;
revoke all on table public.community_posts from anon, authenticated;
grant select on table public.community_posts to anon, authenticated;
grant insert, update, delete on table public.community_posts to authenticated;

drop policy if exists "Anyone can read published community posts"
  on public.community_posts;
create policy "Anyone can read published community posts"
  on public.community_posts
  for select
  to anon, authenticated
  using (published_at <= now());

drop policy if exists "Portal admins can publish community posts"
  on public.community_posts;
create policy "Portal admins can publish community posts"
  on public.community_posts
  for insert
  to authenticated
  with check (
    (select public.is_portal_admin())
    and created_by = (select auth.uid())
    and published_at <= now()
  );

drop policy if exists "Portal admins can edit community posts"
  on public.community_posts;
create policy "Portal admins can edit community posts"
  on public.community_posts
  for update
  to authenticated
  using ((select public.is_portal_admin()))
  with check ((select public.is_portal_admin()));

drop policy if exists "Portal admins can delete community posts"
  on public.community_posts;
create policy "Portal admins can delete community posts"
  on public.community_posts
  for delete
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
  'community-post-images',
  'community-post-images',
  true,
  4194304,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can read community post images"
  on storage.objects;
create policy "Anyone can read community post images"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'community-post-images');

drop policy if exists "Portal admins can upload community post images"
  on storage.objects;
create policy "Portal admins can upload community post images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'community-post-images'
    and (select public.is_portal_admin())
  );

drop policy if exists "Portal admins can delete community post images"
  on storage.objects;
create policy "Portal admins can delete community post images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'community-post-images'
    and (select public.is_portal_admin())
  );

notify pgrst, 'reload schema';
