create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users (id) on delete set null,
  actor_email text not null,
  action text not null check (char_length(action) between 1 and 80),
  summary text not null check (char_length(summary) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists activity_logs_created_at_idx
  on public.activity_logs (created_at desc);

alter table public.activity_logs enable row level security;
revoke all on table public.activity_logs from anon, authenticated;
grant select, insert on table public.activity_logs to authenticated;

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

drop policy if exists "Portal admins can read activity logs"
  on public.activity_logs;
create policy "Portal admins can read activity logs"
  on public.activity_logs
  for select
  to authenticated
  using ((select public.is_portal_admin()));

drop policy if exists "Users can record their own activity"
  on public.activity_logs;
create policy "Users can record their own activity"
  on public.activity_logs
  for insert
  to authenticated
  with check (
    actor_user_id = (select auth.uid())
    and lower(actor_email) = lower((select auth.jwt() ->> 'email'))
  );

notify pgrst, 'reload schema';
