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

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  body text not null check (char_length(body) between 1 and 5000),
  published_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id),
  email_status text not null default 'pending'
    check (email_status in ('pending', 'sent', 'failed')),
  email_sent_at timestamptz,
  email_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists announcements_published_at_idx
  on public.announcements (published_at desc);

alter table public.announcements enable row level security;
revoke all on table public.announcements from anon, authenticated;
grant select on table public.announcements to anon, authenticated;
grant insert, update, delete on table public.announcements to authenticated;

drop policy if exists "Anyone can read published announcements"
  on public.announcements;
create policy "Anyone can read published announcements"
  on public.announcements
  for select
  to anon, authenticated
  using (published_at is not null);

drop policy if exists "Portal admins can read all announcements"
  on public.announcements;
create policy "Portal admins can read all announcements"
  on public.announcements
  for select
  to authenticated
  using ((select public.is_portal_admin()));

drop policy if exists "Portal admins can publish announcements"
  on public.announcements;
create policy "Portal admins can publish announcements"
  on public.announcements
  for insert
  to authenticated
  with check (
    (select public.is_portal_admin())
    and created_by = (select auth.uid())
    and published_at is not null
  );

drop policy if exists "Portal admins can edit announcements"
  on public.announcements;
create policy "Portal admins can edit announcements"
  on public.announcements
  for update
  to authenticated
  using ((select public.is_portal_admin()))
  with check ((select public.is_portal_admin()));

drop policy if exists "Portal admins can delete announcements"
  on public.announcements;
create policy "Portal admins can delete announcements"
  on public.announcements
  for delete
  to authenticated
  using ((select public.is_portal_admin()));

create table if not exists public.announcement_subscribers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  subscribed boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists announcement_subscribers_subscribed_idx
  on public.announcement_subscribers (subscribed)
  where subscribed;

alter table public.announcement_subscribers enable row level security;
revoke all on table public.announcement_subscribers from anon, authenticated;
grant select, insert, update
  on table public.announcement_subscribers to authenticated;

drop policy if exists "Residents can read their announcement preference"
  on public.announcement_subscribers;
create policy "Residents can read their announcement preference"
  on public.announcement_subscribers
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.is_portal_admin())
  );

drop policy if exists "Residents can set their announcement preference"
  on public.announcement_subscribers;
create policy "Residents can set their announcement preference"
  on public.announcement_subscribers
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and lower(email) = lower((select auth.jwt() ->> 'email'))
  );

drop policy if exists "Residents can update their announcement preference"
  on public.announcement_subscribers;
create policy "Residents can update their announcement preference"
  on public.announcement_subscribers
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and lower(email) = lower((select auth.jwt() ->> 'email'))
  );

notify pgrst, 'reload schema';
