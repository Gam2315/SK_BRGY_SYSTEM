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

create table if not exists public.educational_assistance_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  applicant_name text not null,
  applicant_email text not null,
  contact_number text,
  education_level text not null
    check (education_level in ('high_school', 'college')),
  school_name text not null,
  year_or_grade_level text not null,
  status text not null default 'Pending',
  submitted_at timestamptz not null default now()
);

create table if not exists public.educational_assistance_settings (
  id boolean primary key default true check (id),
  is_open boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

insert into public.educational_assistance_settings (id, is_open)
values (true, true)
on conflict (id) do nothing;

alter table public.educational_assistance_settings enable row level security;
revoke all on table public.educational_assistance_settings from anon, authenticated;
grant select on table public.educational_assistance_settings to authenticated;
grant update (is_open, updated_at, updated_by)
  on table public.educational_assistance_settings to authenticated;

drop policy if exists "Authenticated users can read education application settings"
  on public.educational_assistance_settings;
create policy "Authenticated users can read education application settings"
  on public.educational_assistance_settings
  for select
  to authenticated
  using (true);

drop policy if exists "Portal admins can update education application settings"
  on public.educational_assistance_settings;
create policy "Portal admins can update education application settings"
  on public.educational_assistance_settings
  for update
  to authenticated
  using ((select public.is_portal_admin()))
  with check ((select public.is_portal_admin()));

create or replace function public.require_educational_assistance_open()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.educational_assistance_settings
    where id = true
      and is_open
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'Educational assistance applications are currently closed.';
  end if;

  return new;
end;
$$;

revoke all on function public.require_educational_assistance_open()
  from public, anon, authenticated;

drop trigger if exists require_educational_assistance_open
  on public.educational_assistance_applications;
create trigger require_educational_assistance_open
  before insert on public.educational_assistance_applications
  for each row
  execute function public.require_educational_assistance_open();

alter table public.educational_assistance_applications
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists educational_assistance_applications_user_id_idx
  on public.educational_assistance_applications (user_id);

alter table public.educational_assistance_applications
  add column if not exists school_assessment_path text,
  add column if not exists school_id_front_path text,
  add column if not exists school_id_back_path text,
  add column if not exists review_notes text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users (id) on delete set null;

alter table public.educational_assistance_applications enable row level security;
revoke all on table public.educational_assistance_applications from anon, authenticated;
grant select, insert on table public.educational_assistance_applications to authenticated;
grant update (status, review_notes, reviewed_at, reviewed_by)
  on table public.educational_assistance_applications to authenticated;

drop policy if exists "Portal admins can read educational assistance applications"
  on public.educational_assistance_applications;
drop policy if exists "Applicants can read own educational assistance applications"
  on public.educational_assistance_applications;
drop policy if exists "Applicants and admins can read educational assistance applications"
  on public.educational_assistance_applications;
drop policy if exists "Authenticated applicants can submit educational assistance applications"
  on public.educational_assistance_applications;
create policy "Applicants and admins can read educational assistance applications"
  on public.educational_assistance_applications
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.is_portal_admin())
  );
create policy "Authenticated applicants can submit educational assistance applications"
  on public.educational_assistance_applications
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and lower(applicant_email) = lower((select auth.jwt() ->> 'email'))
    and status = 'Pending'
    and school_assessment_path like ((select auth.uid())::text || '/%')
    and school_id_front_path like ((select auth.uid())::text || '/%')
    and school_id_back_path like ((select auth.uid())::text || '/%')
  );
drop policy if exists "Portal admins can update educational assistance application reviews"
  on public.educational_assistance_applications;
create policy "Portal admins can update educational assistance application reviews"
  on public.educational_assistance_applications
  for update
  to authenticated
  using ((select public.is_portal_admin()))
  with check (
    (select public.is_portal_admin())
    and reviewed_by = (select auth.uid())
    and status in ('Pending', 'Approved', 'Rejected')
  );

create table if not exists public.jobseeker_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  applicant_name text not null,
  applicant_email text not null,
  contact_number text,
  desired_position text not null,
  skills_experience text,
  status text not null default 'Pending',
  submitted_at timestamptz not null default now()
);

alter table public.jobseeker_applications
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists jobseeker_applications_user_id_idx
  on public.jobseeker_applications (user_id);

alter table public.jobseeker_applications
  add column if not exists valid_id_front_path text,
  add column if not exists valid_id_back_path text,
  add column if not exists review_notes text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users (id) on delete set null;

alter table public.jobseeker_applications enable row level security;
revoke all on table public.jobseeker_applications from anon, authenticated;
grant select, insert on table public.jobseeker_applications to authenticated;
grant update (status, review_notes, reviewed_at, reviewed_by)
  on table public.jobseeker_applications to authenticated;

drop policy if exists "Portal admins can read jobseeker applications"
  on public.jobseeker_applications;
drop policy if exists "Applicants can read own jobseeker applications"
  on public.jobseeker_applications;
drop policy if exists "Applicants and admins can read jobseeker applications"
  on public.jobseeker_applications;
drop policy if exists "Authenticated applicants can submit jobseeker applications"
  on public.jobseeker_applications;
create policy "Applicants and admins can read jobseeker applications"
  on public.jobseeker_applications
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.is_portal_admin())
  );
create policy "Authenticated applicants can submit jobseeker applications"
  on public.jobseeker_applications
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and lower(applicant_email) = lower((select auth.jwt() ->> 'email'))
    and status = 'Pending'
    and valid_id_front_path like ((select auth.uid())::text || '/%')
    and valid_id_back_path like ((select auth.uid())::text || '/%')
  );
drop policy if exists "Portal admins can update jobseeker application reviews"
  on public.jobseeker_applications;
create policy "Portal admins can update jobseeker application reviews"
  on public.jobseeker_applications
  for update
  to authenticated
  using ((select public.is_portal_admin()))
  with check (
    (select public.is_portal_admin())
    and reviewed_by = (select auth.uid())
    and status in ('Pending', 'Approved', 'Rejected')
  );

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'application-documents',
  'application-documents',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Applicants can upload own application documents"
  on storage.objects;
create policy "Applicants can upload own application documents"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'application-documents'
    and name like ((select auth.uid())::text || '/%')
  );

drop policy if exists "Applicants and admins can read application documents"
  on storage.objects;
create policy "Applicants and admins can read application documents"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'application-documents'
    and (
      name like ((select auth.uid())::text || '/%')
      or (select public.is_portal_admin())
    )
  );

drop policy if exists "Applicants can remove own application documents"
  on storage.objects;
create policy "Applicants can remove own application documents"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'application-documents'
    and name like ((select auth.uid())::text || '/%')
  );

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

alter table public.announcement_subscribers enable row level security;
revoke all on table public.announcement_subscribers from anon, authenticated;
grant select, insert, update on table public.announcement_subscribers to authenticated;

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
