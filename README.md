Hedefim Lise is a Next.js App Router project with:
- public school and vocational field pages
- Supabase-backed data loading
- admin login with Supabase Auth
- school CRUD with image upload and vocational field relations

## Environment Variables

Copy `.env.example` to `.env.local` and set:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Production notes:
- In Vercel, set the same three variables in Project Settings.
- `NEXT_PUBLIC_SITE_URL` should be your full production domain, for example `https://your-app.vercel.app`.
- In Supabase Auth, add your local and production callback URLs:
  - `http://localhost:3000/auth/callback`
  - `https://your-app.vercel.app/auth/callback`

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

## Deploy on Vercel

The project is ready for Vercel deployment.

Checklist:
- Add the environment variables from `.env.example`
- Ensure the Supabase Storage bucket `school-images` exists and is public
- Ensure Supabase auth redirect URLs include `/auth/callback`
- Ensure your `profiles` table contains an admin user with `role = 'admin'`

Build locally before deploy:

```bash
npm run lint
npm run build
```

## Notes

- Public pages and admin pages use server-side Supabase reads.
- Admin auth depends on Supabase Auth session cookies.
- The login flow uses `NEXT_PUBLIC_SITE_URL` in production-safe redirect URLs.
