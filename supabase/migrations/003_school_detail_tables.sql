-- ═══════════════════════════════════════════════════════════════════
-- 003_school_detail_tables.sql
-- Okul detay sayfası için ek kolonlar ve yeni tablolar
-- ═══════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────
-- 1. schools tablosuna yeni kolonlar
-- ───────────────────────────────────────────────────────────────────

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS placement_type       text         NOT NULL DEFAULT 'yerel',
  ADD COLUMN IF NOT EXISTS education_type       text         NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS boarding_type        text         NOT NULL DEFAULT 'yok',
  ADD COLUMN IF NOT EXISTS transportation_info  text,
  ADD COLUMN IF NOT EXISTS school_hours_start   time,
  ADD COLUMN IF NOT EXISTS school_hours_end     time,
  ADD COLUMN IF NOT EXISTS school_hours_note    text,
  ADD COLUMN IF NOT EXISTS other_info           text,
  ADD COLUMN IF NOT EXISTS updated_at           timestamptz  DEFAULT now();


-- ───────────────────────────────────────────────────────────────────
-- 2. facilities — tesis master listesi
-- ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.facilities (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL UNIQUE,
  icon        text,
  is_default  boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);


-- ───────────────────────────────────────────────────────────────────
-- 3. school_facilities — junction: okul ↔ tesis
-- ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.school_facilities (
  school_id   integer  NOT NULL REFERENCES public.schools(id)   ON DELETE CASCADE,
  facility_id uuid     NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  PRIMARY KEY (school_id, facility_id)
);


-- ───────────────────────────────────────────────────────────────────
-- 4. vocational_branches — dal master listesi
-- ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.vocational_branches (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  vocational_field_id integer     NOT NULL REFERENCES public.vocational_fields(id) ON DELETE CASCADE,
  name                text        NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vocational_field_id, name)
);


-- ───────────────────────────────────────────────────────────────────
-- 5. school_vocational_branches — junction: okul ↔ dal
-- ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.school_vocational_branches (
  school_id  integer  NOT NULL REFERENCES public.schools(id)              ON DELETE CASCADE,
  branch_id  uuid     NOT NULL REFERENCES public.vocational_branches(id)  ON DELETE CASCADE,
  PRIMARY KEY (school_id, branch_id)
);


-- ───────────────────────────────────────────────────────────────────
-- 6. school_quotas — kontenjan, yıl bazlı
-- ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.school_quotas (
  id             uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id      integer  NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  year           integer  NOT NULL,
  sinavli_count  integer,
  sinavsiz_count integer,
  UNIQUE (school_id, year)
);


-- ───────────────────────────────────────────────────────────────────
-- 7. school_scores — OBP / LGS / yüzdelik, yıl bazlı
-- ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.school_scores (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   integer      NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  year        integer      NOT NULL,
  obp_score   numeric(6,3),
  lgs_score   numeric(6,3),
  percentile  numeric(6,3),
  UNIQUE (school_id, year)
);


-- ───────────────────────────────────────────────────────────────────
-- 8. school_scholarships — burs imkânları
-- ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.school_scholarships (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id    integer     NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title        text        NOT NULL,
  description  text,
  amount_info  text,
  order_index  integer     NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);


-- ───────────────────────────────────────────────────────────────────
-- 9. school_projects — projeler
-- ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.school_projects (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id    integer     NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title        text        NOT NULL,
  description  text,
  image_url    text,
  link_url     text,
  order_index  integer     NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.facilities                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_facilities          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocational_branches        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_vocational_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_quotas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_scores              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_scholarships        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_projects            ENABLE ROW LEVEL SECURITY;

-- Public okuma
CREATE POLICY "public_read_facilities"
  ON public.facilities FOR SELECT USING (true);

CREATE POLICY "public_read_school_facilities"
  ON public.school_facilities FOR SELECT USING (true);

CREATE POLICY "public_read_vocational_branches"
  ON public.vocational_branches FOR SELECT USING (true);

CREATE POLICY "public_read_school_vocational_branches"
  ON public.school_vocational_branches FOR SELECT USING (true);

CREATE POLICY "public_read_school_quotas"
  ON public.school_quotas FOR SELECT USING (true);

CREATE POLICY "public_read_school_scores"
  ON public.school_scores FOR SELECT USING (true);

CREATE POLICY "public_read_school_scholarships"
  ON public.school_scholarships FOR SELECT USING (true);

CREATE POLICY "public_read_school_projects"
  ON public.school_projects FOR SELECT USING (true);

-- Sadece admin yazabilir
CREATE POLICY "admin_write_facilities"
  ON public.facilities FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "admin_write_school_facilities"
  ON public.school_facilities FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "admin_write_vocational_branches"
  ON public.vocational_branches FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "admin_write_school_vocational_branches"
  ON public.school_vocational_branches FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "admin_write_school_quotas"
  ON public.school_quotas FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "admin_write_school_scores"
  ON public.school_scores FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "admin_write_school_scholarships"
  ON public.school_scholarships FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "admin_write_school_projects"
  ON public.school_projects FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));


-- ═══════════════════════════════════════════════════════════════════
-- SEED: Tesis master listesi (icon = emoji)
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO public.facilities (name, icon, is_default) VALUES
  ('Fizik Laboratuvarı',              '⚛️',  true),
  ('Kimya Laboratuvarı',              '🧪',  true),
  ('Biyoloji Laboratuvarı',           '🔬',  true),
  ('Bilgisayar Laboratuvarı',         '💻',  true),
  ('Kütüphane',                       '📚',  true),
  ('Çalışma Odası',                   '📖',  true),
  ('Konferans Salonu',                '🎤',  true),
  ('Müzik Atölyesi',                  '🎵',  true),
  ('Resim Atölyesi',                  '🎨',  true),
  ('Drama Atölyesi',                  '🎭',  true),
  ('Kulüp Odaları',                   '👥',  true),
  ('Açık Spor Alanı',                 '⚽',  true),
  ('Kapalı Spor Salonu',              '🏋️',  true),
  ('Soyunma ve Giyinme Odası',        null,   true),
  ('Yemekhane',                       '🍽️',  true),
  ('Kantin',                          '☕',  true),
  ('Dinlenme Alanları',               '🛋️',  true),
  ('Mescit',                          '🕌',  true),
  ('Pansiyon',                        '🛏️',  true),
  ('Revir',                           '🏥',  true),
  ('Engelli Erişimine Uygun Rampa',   '♿',  true),
  ('Engelli Erişimine Uygun Asansör', '🛗',  true),
  ('Engelli WC',                      '♿',  true)
ON CONFLICT (name) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════
-- SEED: Meslek dalları (vocational_fields slug ile join)
-- Notlar:
--   • vocational_fields tablosu boşsa INSERT'ler sessizce atlanır
--   • slug'lar DB'de farklıysa tekrar çalıştırılabilir (ON CONFLICT)
-- ═══════════════════════════════════════════════════════════════════

-- Bilişim Teknolojileri
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('Yazılım Geliştirme'),
  ('Ağ İşletmenliği ve Siber Güvenlik'),
  ('Veritabanı Yönetimi'),
  ('Grafik ve Animasyon')
) AS dallar(dal)
WHERE slug = 'bilisim-teknolojileri'
ON CONFLICT (vocational_field_id, name) DO NOTHING;

-- Elektrik-Elektronik Teknolojisi
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('Endüstriyel Bakım Onarım'),
  ('Elektrik Tesisatları ve Dağıtımı'),
  ('Görüntü ve Ses Sistemleri'),
  ('Otomasyon Sistemleri')
) AS dallar(dal)
WHERE slug = 'elektrik-elektronik-teknolojisi'
ON CONFLICT (vocational_field_id, name) DO NOTHING;

-- Sağlık Hizmetleri
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('Ebe Yardımcılığı'),
  ('Hemşire Yardımcılığı'),
  ('Sağlık Bakım Teknisyenliği'),
  ('Acil Tıp Teknisyenliği')
) AS dallar(dal)
WHERE slug = 'saglik-hizmetleri'
ON CONFLICT (vocational_field_id, name) DO NOTHING;
