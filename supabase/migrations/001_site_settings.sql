-- ─────────────────────────────────────────────────────────────
-- Tablolar
-- ─────────────────────────────────────────────────────────────

-- site_settings: tek satır (singleton) — sabit UUID ile upsert edilir
create table if not exists site_settings (
  id          uuid        primary key default gen_random_uuid(),
  logo_url    text,
  logo_alt    text        not null default 'Hedefim Lise',
  site_title  text        not null default 'Hedefim Lise',
  updated_at  timestamptz not null default now(),
  updated_by  uuid        references profiles(id) on delete set null
);

-- navigation_items: menü öğeleri
create table if not exists navigation_items (
  id          uuid        primary key default gen_random_uuid(),
  label       text        not null,
  href        text        not null,
  order_index integer     not null default 0,
  is_visible  boolean     not null default true,
  target      text        not null default '_self',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- footer_settings: tek satır (singleton)
create table if not exists footer_settings (
  id             uuid        primary key default gen_random_uuid(),
  about_text     text,
  copyright_text text        not null default '© 2026 Hedefim Lise',
  contact_email  text,
  contact_phone  text,
  address        text,
  updated_at     timestamptz not null default now()
);

-- footer_links: section'a göre gruplanmış linkler
create table if not exists footer_links (
  id          uuid    primary key default gen_random_uuid(),
  section     text    not null,
  label       text    not null,
  href        text    not null,
  order_index integer not null default 0,
  is_visible  boolean not null default true
);

-- footer_social_links: sosyal medya linkleri
create table if not exists footer_social_links (
  id          uuid    primary key default gen_random_uuid(),
  platform    text    not null,
  url         text    not null,
  order_index integer not null default 0,
  is_visible  boolean not null default true
);

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────

alter table site_settings       enable row level security;
alter table navigation_items    enable row level security;
alter table footer_settings     enable row level security;
alter table footer_links        enable row level security;
alter table footer_social_links enable row level security;

-- Herkese okuma izni (public)
create policy "public_read_site_settings"
  on site_settings for select using (true);

create policy "public_read_navigation_items"
  on navigation_items for select using (true);

create policy "public_read_footer_settings"
  on footer_settings for select using (true);

create policy "public_read_footer_links"
  on footer_links for select using (true);

create policy "public_read_footer_social_links"
  on footer_social_links for select using (true);

-- Sadece admin yazabilir (profiles.role = 'admin')
create policy "admin_write_site_settings"
  on site_settings for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "admin_write_navigation_items"
  on navigation_items for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "admin_write_footer_settings"
  on footer_settings for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "admin_write_footer_links"
  on footer_links for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "admin_write_footer_social_links"
  on footer_social_links for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────────────────────
-- Storage: site-assets bucket
-- ─────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do nothing;

create policy "public_read_site_assets"
  on storage.objects for select
  using (bucket_id = 'site-assets');

create policy "admin_insert_site_assets"
  on storage.objects for insert
  with check (
    bucket_id = 'site-assets'
    and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "admin_update_site_assets"
  on storage.objects for update
  using (
    bucket_id = 'site-assets'
    and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "admin_delete_site_assets"
  on storage.objects for delete
  using (
    bucket_id = 'site-assets'
    and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────────────────────
-- Başlangıç verisi (seed)
-- ─────────────────────────────────────────────────────────────

insert into site_settings (id, logo_url, logo_alt, site_title)
values (
  '00000000-0000-0000-0000-000000000001'::uuid,
  null,
  'Hedefim Lise',
  'Hedefim Lise'
)
on conflict (id) do nothing;

insert into navigation_items (label, href, order_index, is_visible, target) values
  ('Ana Sayfa',      '/',         0, true, '_self'),
  ('Tercih Robotu',  '/okullar',  1, true, '_self'),
  ('Meslek Atlası',  '/alanlar',  2, true, '_self'),
  ('Proje Hakkında', '/hakkinda', 3, true, '_self');

insert into footer_settings (id, about_text, copyright_text, contact_email, contact_phone, address)
values (
  '00000000-0000-0000-0000-000000000002'::uuid,
  'Öğrencilerin doğru lise tercihleri yapabilmesi amacıyla Akdeniz Rehberlik ve Araştırma Merkezi koordinatörlüğünde yürütülen sosyal sorumluluk projesidir.',
  '© 2026 Hedefim Lise, Yolum Bilinçli Tercih Projesi.',
  'akdenizram33@gmail.com',
  '0 (324) 336 11 84',
  'Akdeniz Rehberlik ve Araştırma Merkezi, Akdeniz, Mersin'
)
on conflict (id) do nothing;

insert into footer_links (section, label, href, order_index, is_visible) values
  ('paydaşlar', 'Akdeniz RAM',    '#', 0, true),
  ('paydaşlar', 'Mezitli RAM',    '#', 1, true),
  ('paydaşlar', 'Tarsus RAM',     '#', 2, true),
  ('paydaşlar', 'Toroslar RAM',   '#', 3, true),
  ('paydaşlar', 'Yenişehir RAM',  '#', 4, true),
  ('hukuki',    'Gizlilik Politikası', '#', 0, true),
  ('hukuki',    'Kullanım Koşulları',  '#', 1, true);
