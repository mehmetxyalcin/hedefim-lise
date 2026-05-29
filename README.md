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

## Row Level Security (RLS)

Server actions use the publishable (anon) key with the admin's auth session,
so **every table an admin writes to must have an admin-write RLS policy**.

The trap: if RLS is enabled but a table has *no write policy*, Supabase does
**not** error — an `UPDATE`/`DELETE` silently affects 0 rows, and an `INSERT`
throws "new row violates row-level security policy". This surfaces as "data
saves but doesn't change" or an unexplained 500. We hit this on `schools`,
`school_vocational_fields`, and `vocational_fields` (tables created in the
original schema before the migration files existed).

When you add a new table that admins write to, add this policy
(see `supabase/migrations/006`–`008` for the established pattern):

```sql
alter table public.YOUR_TABLE enable row level security;

-- public read (only if the table feeds public pages)
drop policy if exists "public_read_YOUR_TABLE" on public.YOUR_TABLE;
create policy "public_read_YOUR_TABLE"
  on public.YOUR_TABLE for select using (true);

-- admin write
drop policy if exists "admin_write_YOUR_TABLE" on public.YOUR_TABLE;
create policy "admin_write_YOUR_TABLE"
  on public.YOUR_TABLE for all
  using      (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
```

### Audit query

Run this in the Supabase SQL Editor to find any table with RLS enabled but no
write policy (the silent-failure trap) before it bites you:

```sql
select
  c.relname as tablo,
  c.relrowsecurity as rls_acik,
  count(*) filter (where p.cmd in ('SELECT','ALL'))                   as okuma_politikasi,
  count(*) filter (where p.cmd in ('INSERT','UPDATE','DELETE','ALL')) as yazma_politikasi,
  case
    when c.relrowsecurity
         and count(*) filter (where p.cmd in ('INSERT','UPDATE','DELETE','ALL')) = 0
      then '⚠️ RLS açık + yazma politikası yok → admin yazınca sessiz hata / 500'
    when c.relrowsecurity
         and count(*) filter (where p.cmd in ('SELECT','ALL')) = 0
      then '⚠️ RLS açık + okuma politikası yok → public sayfada veri görünmez'
    when not c.relrowsecurity then 'ℹ️ RLS kapalı (tablo herkese açık)'
    else '✅ OK'
  end as durum
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policies p on p.schemaname = n.nspname and p.tablename = c.relname
where n.nspname = 'public' and c.relkind = 'r'
group by c.relname, c.relrowsecurity
order by
  (c.relrowsecurity and count(*) filter (where p.cmd in ('INSERT','UPDATE','DELETE','ALL')) = 0) desc,
  c.relname;
```

Server actions that write should also check the result (`.select()` on updates,
and handle the error from inserts) so a blocked write becomes a visible message
instead of a silent success or a 500 — see `updateSchool` and
`syncSchoolVocationalFull` in `src/app/admin/okullar/actions.ts`.

## Notes

- Public pages and admin pages use server-side Supabase reads.
- Admin auth depends on Supabase Auth session cookies.
- The login flow uses `NEXT_PUBLIC_SITE_URL` in production-safe redirect URLs.
