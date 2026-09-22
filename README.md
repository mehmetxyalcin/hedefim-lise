# Hedefim Lise

Mersin'deki liseler için tercih rehberi: okul arama ve filtreleme, okul
detayları, meslek alanları, istatistikler, soru-cevap ve tarayıcıda tutulan
tercih listesi. Yönetim paneli okul içeriklerini, yıllık puan/kontenjanları,
Excel toplu yüklemeyi, SSS'yi, mesajları ve site ayarlarını yönetir.

Next.js 16 (App Router) + React 19 + Supabase + Tailwind CSS 4. Ürün niyeti
`PRODUCT.md`, tasarım kuralları `DESIGN.md`, ayrıntılı proje haritası ve
devir notları `PROJECT_HANDOFF.md` içinde.

## Environment Variables

Copy `.env.example` to `.env.local` and set:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

In Supabase Auth, allow the local and production callback URLs:
`http://localhost:3000/auth/callback` and `https://hedefimlise.com/auth/callback`.

## Development

```bash
npm install
npm run dev          # http://localhost:3000
npm run dev:preview  # uses .next-dev, safe beside a running `next start`
npm test             # node:test suites, incl. PGlite RLS/RPC tests
npm run lint
npm run build
```

## Deploy

Production runs as a Node app (`next start`) on Hostinger at
https://hedefimlise.com. Hostinger pulls and builds GitHub `main`
automatically, so **pushing to `main` publishes**. Set the three environment
variables above in the Hostinger panel.

Supabase checklist:
- Storage buckets `school-images` and `site-assets` exist and are public.
- `profiles` contains an admin user with `role = 'admin'`.

### Database migrations

The live project has **no migration history table**. Migrations in
`supabase/migrations/` were applied one by one after checking the live schema;
do not run `supabase db push` or replay old files in bulk. Test a new
migration against PGlite (`tests/admin-import.database.test.mjs`) and with a
rolled-back transaction on the live database before applying it. The
repository is not a complete bootstrap schema; see `PROJECT_HANDOFF.md` §8.

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

-- public read (only if the table feeds public pages; `schools` instead
-- limits anon reads to active rows, see migration 016)
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
