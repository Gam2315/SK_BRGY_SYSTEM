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
   - `BARANGAY_ADMIN_EMAIL` to the email address reserved for the administrator.
3. In Supabase Authentication URL Configuration, set the site URL and allow
   `/auth/callback` on each development/production origin.
4. Create and confirm the administrator account directly in the Supabase
   dashboard using the designated email. Administrator status is checked
   server-side against `BARANGAY_ADMIN_EMAIL`; public registration cannot
   create that account.
5. Restart the development server after changing environment variables.

To activate announcements, open the Supabase SQL Editor and run
`supabase/announcements.sql`. This repeatable setup creates the announcement
and resident email preference tables, their access policies, and refreshes the
API schema cache. If the administrator cannot publish after running it, add the
confirmed admin account to `portal_admins` once, replacing the email below:

```sql
insert into public.portal_admins (user_id)
select id
from auth.users
where lower(email) = lower('ADMIN_EMAIL_HERE')
on conflict (user_id) do nothing;
```

Public announcements display on the landing page. Residents can opt in to
announcement emails from their dashboard. To enable email delivery, configure a
Resend account and verify the sender domain/address. Set `RESEND_API_KEY` and
`ANNOUNCEMENT_FROM_EMAIL` in local environment settings and Vercel Environment
Variables; never expose the API key with a `NEXT_PUBLIC_` prefix. If delivery
fails, the announcement remains published and an administrator can retry
notification after fixing the email setup.

To enable Google sign-in, configure the Google OAuth client ID and secret in
Supabase under Authentication → Providers → Google. Add the Supabase callback
URL shown in the provider settings to the Google Cloud OAuth client's
authorized redirect URIs. In Supabase Authentication URL Configuration, add
each app origin (for example `http://localhost:3000` and the production URL)
to the allowed redirect URLs. The app uses `/auth/callback` to complete sign-in
and sends the configured administrator to `/admin`.

Residents can register with email and password and must follow the confirmation
email before signing in. Keep email confirmation enabled so public sign-up
cannot claim the designated administrator email without access to its inbox.
For confirmation email delivery beyond basic testing, configure a custom SMTP
provider in Supabase under Authentication → SMTP Settings. Supabase's default
mailer is restricted to authorized team addresses and has strict rate limits;
check the Auth logs and the recipient's spam folder if a confirmation message
does not arrive.
The admin dashboard can show educational assistance applications in separate
high school and college lists, along with a jobseeker applicant list. To create
or update the tables and their row-level security policies, run
`supabase/educational-assistance.sql` in the Supabase SQL Editor. This script
can be rerun safely to add applicant ownership and resident submission
permissions, private document storage bucket, storage policies, and admin
review permissions to an existing setup. Run the latest version before using
the application review controls. Then allow
the admin account to read the applications and private documents by running
this query there, replacing the email with the confirmed admin account email:

```sql
insert into public.portal_admins (user_id)
select id
from auth.users
where lower(email) = lower('ADMIN_EMAIL_HERE')
on conflict (user_id) do nothing;
```

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

To enable the admin activity log, run `supabase/activity-logs.sql` in the
Supabase SQL Editor after creating the `portal_admins` table with either setup
script. The admin dashboard then shows the latest 100 sign-ins, sign-outs,
application submissions and reviews, announcement changes, and subscription
preference updates. Activity records are readable only by accounts listed in
`public.portal_admins`.
