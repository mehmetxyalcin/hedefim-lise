-- ─────────────────────────────────────────────────────────────────
-- schools tablosu RLS politikaları
--
-- Detay tablolarında (003_school_detail_tables.sql) admin yazma
-- politikaları açıkça tanımlı, ancak base `schools` tablosunun yazma
-- politikası repodaki migration'larda yoktu. RLS açık + yazma politikası
-- yoksa admin UPDATE sessizce 0 satır etkiler (hata dönmez) ve
-- "kayıt oluyor görünüyor ama veri değişmiyor" sorununa yol açar.
--
-- Bu migration idempotent'tir; mevcut kurulumu bozmadan tekrar çalışabilir.
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Herkese okuma
DROP POLICY IF EXISTS "public_read_schools" ON public.schools;
CREATE POLICY "public_read_schools"
  ON public.schools FOR SELECT USING (true);

-- Sadece admin yazabilir (insert / update / delete)
DROP POLICY IF EXISTS "admin_write_schools" ON public.schools;
CREATE POLICY "admin_write_schools"
  ON public.schools FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
