-- Soru-cevap merkezi: yönetilen kategoriler, kalıcı soru adresleri, öne çıkan
-- sorular ve ziyaretçi soruları.
--
-- Uyum penceresi: migration kod yayından ÖNCE uygulanır. Eski kod faqs.category
-- (metin) yazmaya devam edebilsin diye kolon kalır; tetikleyici iki alanı
-- (category ↔ category_id) senkron tutar. Eski kolon ileride ayrı bir
-- migration'la kaldırılabilir.
--
-- Ziyaretçi soruları (question_submissions) tabloya doğrudan erişilemez:
-- ziyaretçi yalnız iki SECURITY DEFINER fonksiyonu çağırır — soru gönderme
-- (hız sınırlı) ve takip anahtarıyla kendi sorusunu okuma. Anahtarın kendisi
-- saklanmaz, yalnız SHA-256 özeti tutulur. E-posta ya da ad istenmez.

BEGIN;

-- ─── Türkçe adres üreteci (yalnız geri doldurma ve yedek için) ─────────────
CREATE OR REPLACE FUNCTION public.qa_slugify(value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT left(
    trim(BOTH '-' FROM regexp_replace(
      lower(translate(coalesce(value, ''), 'ÇĞİIÖŞÜçğıöşüÂâÎîÛû', 'cgiiosucgiosuaaiiuu')),
      '[^a-z0-9]+', '-', 'g'
    )),
    90
  );
$$;

-- ─── Kategoriler ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.faq_categories (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text        NOT NULL UNIQUE
                CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) <= 90
                       AND slug NOT IN ('sor', 'takip')),  -- /soru-cevap/sor ve /takip sayfaları
  title         text        NOT NULL UNIQUE CHECK (length(btrim(title)) BETWEEN 2 AND 80),
  description   text        CHECK (description IS NULL OR length(description) <= 300),
  sort_order    integer     NOT NULL DEFAULT 0,
  is_published  boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.faq_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_faq_categories" ON public.faq_categories;
DROP POLICY IF EXISTS "admin_write_faq_categories" ON public.faq_categories;

CREATE POLICY "public_read_published_faq_categories"
  ON public.faq_categories FOR SELECT
  USING (is_published = true);

CREATE POLICY "admin_write_faq_categories"
  ON public.faq_categories FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));

INSERT INTO public.faq_categories (slug, title, description, sort_order) VALUES
  ('tercih-islemleri', 'Tercih İşlemleri', 'Tercih takvimi, e-Okul üzerinden tercih, onay ve tercih grupları.', 10),
  ('yerlestirme', 'Yerleştirme', 'Yerleştirme sırası, puan eşitliği ve sonuçların açıklanması.', 20),
  ('nakil-islemleri', 'Nakil İşlemleri', 'Yerleştikten sonra okul değiştirme ve nakil dönemleri.', 30),
  ('ozel-durumlar', 'Özel Durumlar', 'Kaynaştırma, şehit ve gazi yakınları, sağlık gibi özel durumlar.', 40),
  ('pansiyon-ve-kayit', 'Pansiyon ve Kayıt', 'Pansiyonlu okullar ve kayıt işlemleri.', 50)
ON CONFLICT (slug) DO NOTHING;

-- Var olan sorularda geçen ama yukarıda olmayan kategoriler de kaybolmasın.
INSERT INTO public.faq_categories (slug, title, sort_order)
SELECT DISTINCT ON (public.qa_slugify(f.category))
       public.qa_slugify(f.category), btrim(f.category), 900
FROM public.faqs f
WHERE f.category IS NOT NULL
  AND public.qa_slugify(f.category) <> ''
  AND NOT EXISTS (SELECT 1 FROM public.faq_categories c WHERE c.title = btrim(f.category))
  AND NOT EXISTS (SELECT 1 FROM public.faq_categories c WHERE c.slug = public.qa_slugify(f.category))
ON CONFLICT DO NOTHING;

-- ─── Sorular: yeni alanlar ─────────────────────────────────────────────────
ALTER TABLE public.faqs
  ADD COLUMN IF NOT EXISTS category_id   uuid REFERENCES public.faq_categories(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS slug          text,
  ADD COLUMN IF NOT EXISTS is_featured   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS origin        text    NOT NULL DEFAULT 'editorial',
  ADD COLUMN IF NOT EXISTS submission_id uuid;

DO $$ BEGIN
  ALTER TABLE public.faqs ADD CONSTRAINT faqs_origin_check CHECK (origin IN ('editorial', 'community'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.faqs ADD CONSTRAINT faqs_slug_format
    CHECK (slug IS NULL OR (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) <= 100));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS faqs_slug_key ON public.faqs (slug);
CREATE INDEX IF NOT EXISTS faqs_category_id_idx ON public.faqs (category_id);

-- Geri doldurma: kategori bağlantısı ve benzersiz adres.
UPDATE public.faqs f
SET category_id = c.id
FROM public.faq_categories c
WHERE f.category_id IS NULL AND c.title = btrim(f.category);

WITH ranked AS (
  SELECT id,
         coalesce(nullif(public.qa_slugify(question), ''), 'soru') AS base,
         row_number() OVER (
           PARTITION BY coalesce(nullif(public.qa_slugify(question), ''), 'soru')
           ORDER BY sort_order, created_at, id
         ) AS n
  FROM public.faqs
  WHERE slug IS NULL
)
UPDATE public.faqs f
SET slug = CASE WHEN r.n = 1 THEN r.base ELSE r.base || '-' || r.n END
FROM ranked r
WHERE f.id = r.id;

-- Eski ve yeni kod aynı anda çalışabilsin: iki alan birbirinden tamamlanır.
CREATE OR REPLACE FUNCTION public.faqs_sync_category()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  found_title text;
  found_id uuid;
BEGIN
  IF NEW.category_id IS NOT NULL THEN
    SELECT title INTO found_title FROM public.faq_categories WHERE id = NEW.category_id;
    NEW.category := coalesce(found_title, NEW.category);
  ELSIF NEW.category IS NOT NULL THEN
    SELECT id INTO found_id FROM public.faq_categories WHERE title = btrim(NEW.category);
    NEW.category_id := found_id;
  END IF;

  IF NEW.slug IS NULL THEN
    NEW.slug := coalesce(nullif(public.qa_slugify(NEW.question), ''), 'soru')
                || '-' || substr(replace(NEW.id::text, '-', ''), 1, 6);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS faqs_sync_category ON public.faqs;
CREATE TRIGGER faqs_sync_category
  BEFORE INSERT OR UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.faqs_sync_category();

-- Kategori adı değişince eski metin kolonu da izlesin.
CREATE OR REPLACE FUNCTION public.faq_categories_propagate_title()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.title IS DISTINCT FROM OLD.title THEN
    UPDATE public.faqs SET category = NEW.title WHERE category_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS faq_categories_propagate_title ON public.faq_categories;
CREATE TRIGGER faq_categories_propagate_title
  AFTER UPDATE OF title ON public.faq_categories
  FOR EACH ROW EXECUTE FUNCTION public.faq_categories_propagate_title();

-- ─── Ziyaretçi soruları ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.question_submissions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  question         text        NOT NULL CHECK (length(btrim(question)) BETWEEN 10 AND 300),
  details          text        CHECK (details IS NULL OR length(details) <= 2000),
  category_id      uuid        REFERENCES public.faq_categories(id) ON DELETE SET NULL,
  nickname         text        CHECK (nickname IS NULL OR length(btrim(nickname)) BETWEEN 1 AND 40),
  status           text        NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'answered', 'rejected')),
  answer           text        CHECK (answer IS NULL OR length(answer) <= 6000),
  answered_at      timestamptz,
  note             text        CHECK (note IS NULL OR length(note) <= 600),
  related_faq_id   uuid        REFERENCES public.faqs(id) ON DELETE SET NULL,
  published_faq_id uuid        REFERENCES public.faqs(id) ON DELETE SET NULL,
  token_hash       text        NOT NULL UNIQUE,
  client_hash      text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT question_submissions_answer_required
    CHECK (status <> 'answered' OR (answer IS NOT NULL AND length(btrim(answer)) > 0))
);

CREATE INDEX IF NOT EXISTS question_submissions_status_idx
  ON public.question_submissions (status, created_at DESC);
CREATE INDEX IF NOT EXISTS question_submissions_client_idx
  ON public.question_submissions (client_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS question_submissions_category_idx
  ON public.question_submissions (category_id);
CREATE INDEX IF NOT EXISTS question_submissions_related_idx
  ON public.question_submissions (related_faq_id);
CREATE INDEX IF NOT EXISTS question_submissions_published_idx
  ON public.question_submissions (published_faq_id);

DO $$ BEGIN
  ALTER TABLE public.faqs ADD CONSTRAINT faqs_submission_id_fkey
    FOREIGN KEY (submission_id) REFERENCES public.question_submissions(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS faqs_submission_id_idx ON public.faqs (submission_id);

ALTER TABLE public.question_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_question_submissions" ON public.question_submissions;
CREATE POLICY "admin_all_question_submissions"
  ON public.question_submissions FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));

REVOKE ALL ON public.question_submissions FROM anon;

-- Soru gönderme. Dönen değer takip anahtarıdır; yalnız bir kez gösterilir.
-- Hız sınırı: aynı istemci özetinden saatte 3, sitenin tamamından saatte 40.
CREATE OR REPLACE FUNCTION public.submit_question(
  p_question    text,
  p_details     text DEFAULT NULL,
  p_category_id uuid DEFAULT NULL,
  p_nickname    text DEFAULT NULL,
  p_client_hash text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  q text := btrim(coalesce(p_question, ''));
  d text := nullif(btrim(coalesce(p_details, '')), '');
  n text := nullif(btrim(coalesce(p_nickname, '')), '');
  c text := nullif(btrim(coalesce(p_client_hash, '')), '');
  token text;
BEGIN
  IF length(q) < 10 OR length(q) > 300 THEN
    RAISE EXCEPTION 'qa:question_length' USING ERRCODE = '22023';
  END IF;
  IF d IS NOT NULL AND length(d) > 2000 THEN
    RAISE EXCEPTION 'qa:details_length' USING ERRCODE = '22023';
  END IF;
  IF n IS NOT NULL AND length(n) > 40 THEN
    RAISE EXCEPTION 'qa:nickname_length' USING ERRCODE = '22023';
  END IF;
  IF c IS NOT NULL AND length(c) > 128 THEN
    RAISE EXCEPTION 'qa:client_hash' USING ERRCODE = '22023';
  END IF;
  IF p_category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.faq_categories WHERE id = p_category_id AND is_published
  ) THEN
    p_category_id := NULL;
  END IF;

  IF c IS NOT NULL AND (
    SELECT count(*) FROM public.question_submissions
    WHERE client_hash = c AND created_at > now() - interval '1 hour'
  ) >= 3 THEN
    RAISE EXCEPTION 'qa:rate_limited' USING ERRCODE = 'P0001';
  END IF;
  IF (
    SELECT count(*) FROM public.question_submissions
    WHERE created_at > now() - interval '1 hour'
  ) >= 40 THEN
    RAISE EXCEPTION 'qa:busy' USING ERRCODE = 'P0001';
  END IF;

  token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

  INSERT INTO public.question_submissions (question, details, category_id, nickname, token_hash, client_hash)
  VALUES (q, d, p_category_id, n, encode(sha256(convert_to(token, 'UTF8')), 'hex'), c);

  RETURN token;
END;
$$;

-- Takip: anahtarı bilen, kendi sorusunun durumunu ve yanıtını okur.
CREATE OR REPLACE FUNCTION public.get_question_status(p_token text)
RETURNS TABLE (
  question        text,
  details         text,
  category_title  text,
  status          text,
  answer          text,
  note            text,
  created_at      timestamptz,
  answered_at     timestamptz,
  related_slug    text,
  related_category_slug text,
  published_slug  text,
  published_category_slug text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT s.question, s.details, c.title, s.status,
         CASE WHEN s.status = 'answered' THEN s.answer END,
         CASE WHEN s.status <> 'new' THEN s.note END,
         s.created_at, s.answered_at,
         rf.slug, rc.slug,
         pf.slug, pc.slug
  FROM public.question_submissions s
  LEFT JOIN public.faq_categories c ON c.id = s.category_id
  LEFT JOIN public.faqs rf ON rf.id = s.related_faq_id AND rf.is_published
  LEFT JOIN public.faq_categories rc ON rc.id = rf.category_id AND rc.is_published
  LEFT JOIN public.faqs pf ON pf.id = s.published_faq_id AND pf.is_published
  LEFT JOIN public.faq_categories pc ON pc.id = pf.category_id AND pc.is_published
  WHERE p_token ~ '^[0-9a-f]{64}$'
    AND s.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
$$;

REVOKE ALL ON FUNCTION public.submit_question(text, text, uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_question_status(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_question(text, text, uuid, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_question_status(text) TO anon, authenticated;

COMMIT;
