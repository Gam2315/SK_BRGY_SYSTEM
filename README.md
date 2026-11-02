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

Residents can register with email and password and must follow the confirmation
email before signing in. Keep email confirmation enabled so public sign-up
cannot claim the designated administrator email without access to its inbox.
The dashboards are authenticated, but request tracking and editable
announcements still need their data tables and management workflows.
