This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Supabase authentication

The portal includes a shared sign-in and resident account registration page at
`/login`, a resident dashboard at `/dashboard`, and a protected administrator
dashboard at `/admin`.

1. Create a Supabase project, enable the Email authentication provider, and
   keep email confirmation enabled.
2. Copy `.env.example` to `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
     from the Supabase project's API settings.
   - `NEXT_PUBLIC_SITE_URL` to the public site URL (use
     `http://localhost:3000` for local development).
3. In Supabase Authentication URL Configuration, set the site URL and allow
   `/auth/callback` on each development/production origin.
4. Run `supabase/educational-assistance.sql` in the Supabase SQL Editor to
   create the `portal_admins` table and the `is_portal_admin()` authorization
   function.
5. Create and confirm each administrator account in Supabase Authentication.
   Then add every admin account to `public.portal_admins` by running:

   ```sql
   insert into public.portal_admins (user_id)
   select id
   from auth.users
   where lower(email) in (
     lower('FIRST_ADMIN_EMAIL_HERE'),
     lower('SECOND_ADMIN_EMAIL_HERE')
   )
   on conflict (user_id) do nothing;
   ```

   Add or remove email values in the `in (...)` list as needed. Admin access
   is controlled by membership in this table, not by an environment variable.

To activate announcements, open the Supabase SQL Editor and run
`supabase/announcements.sql`. This repeatable setup creates the announcement
and resident email preference tables, their access policies, and refreshes the
API schema cache. If an administrator cannot publish after running it, confirm
that each admin account is present in `portal_admins` using the setup query
above.

Public announcements display on the landing page. Residents can opt in to
announcement emails from their dashboard. To enable email delivery, configure a
Resend account and verify the sender domain/address. Set `RESEND_API_KEY` and
`ANNOUNCEMENT_FROM_EMAIL` in local environment settings and Vercel Environment
Variables; never expose the API key with a `NEXT_PUBLIC_` prefix. If delivery
fails, the announcement remains published and an administrator can retry
notification after fixing the email setup.

To let administrators publish community activities and completed projects,
open the Supabase project's SQL Editor, paste the full contents of
`supabase/community-posts.sql`, and run it. This repeatable setup creates the
community posts table, ensures the admin-check helper exists, creates the
public photo bucket and access policies, and refreshes the API schema cache.
Rerun the script after updates. Ensure each administrator account is listed in
`public.portal_admins` as shown above. Administrators can create,
edit, and delete these posts from the Activities & Projects section of
`/admin`; published posts appear in the Activities & completed projects
section of the public landing page. Each post includes a title, description,
type, activity or completion date, and up to three optional JPG, PNG, or WebP
pictures (4 MB each). These posts do not send email notifications.

To enable Google sign-in, configure the Google OAuth client ID and secret in
Supabase under Authentication → Providers → Google. Add the Supabase callback
URL shown in the provider settings to the Google Cloud OAuth client's
authorized redirect URIs. In Supabase Authentication URL Configuration, add
each app origin (for example `http://localhost:3000` and the production URL)
to the allowed redirect URLs. The app uses `/auth/callback` to complete sign-in
and sends administrators listed in `public.portal_admins` to `/admin`.

Residents can register with email and password and must follow the confirmation
email before signing in. Keep email confirmation enabled. Public registration
does not grant administrator access; only accounts explicitly listed in
`public.portal_admins` are administrators.
For confirmation email delivery beyond basic testing, configure a custom SMTP
provider in Supabase under Authentication → SMTP Settings. Supabase's default
mailer is restricted to authorized team addresses and has strict rate limits;
check the Auth logs and the recipient's spam folder if a confirmation message
does not arrive.
Administrators can review education applicants at `/admin/education-applicants`,
jobseeker applicants at `/admin/jobseeker-applicants`, and recent activity at
`/admin/activity-logs`. Educational assistance applications appear in separate
high school and college lists. To create or update the tables and their
row-level security policies, run
`supabase/educational-assistance.sql` in the Supabase SQL Editor. This script
can be rerun safely to add applicant ownership and resident submission
permissions, private document storage bucket, storage policies, and admin
review permissions to an existing setup. Run the latest version before using
the application review controls. Add each administrator account to
`public.portal_admins` using the setup query above so they can read applications
and private documents.

Residents can submit educational assistance and jobseeker applications from
their dashboard after signing in. Each application is linked to the signed-in
account, and residents can see their own submission status. Application rows
are readable by the applicant and signed-in users listed in `portal_admins`;
only applicants can create their own rows. Administrators listed in
`portal_admins` can approve or reject either type and optionally leave a note
visible to the applicant. Administrators can open or close educational
assistance applications from the admin dashboard; closed applications are
blocked in both the resident form and the database. The automatic completeness
check confirms only that required information and document uploads are
present; administrators must review document contents and make the final
eligibility decision. Educational assistance requires a school assessment and
front/back school ID; jobseeker applications require front/back of a valid ID.
Documents accept JPG, PNG, WebP, or PDF files up to 5 MB each, are stored in
the private `application-documents` bucket, and are available to applicants
and authorized administrators through temporary signed links.

When an administrator approves educational assistance, the database creates a
unique claim token. The resident can show its QR code from the dashboard at the
barangay office with a valid ID. Administrators can scan it at
`/admin/claim-assistance`, verify the applicant details against the physical ID,
and confirm the one-time claim. The resident dashboard then shows the claim
date instead of the QR code. Run the latest
`supabase/educational-assistance.sql` before using this workflow.

To enable the admin activity log, run `supabase/activity-logs.sql` in the
Supabase SQL Editor after creating the `portal_admins` table with either setup
script. The admin dashboard then shows the latest 100 sign-ins, sign-outs,
application submissions and reviews, announcement changes, and subscription
preference updates. Activity records are readable only by accounts listed in
`public.portal_admins`.
