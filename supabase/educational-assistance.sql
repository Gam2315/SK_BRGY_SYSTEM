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

notify pgrst, 'reload schema';
