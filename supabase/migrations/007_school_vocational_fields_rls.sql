-- ─────────────────────────────────────────────────────────────────
-- school_vocational_fields (okul ↔ meslek alanı junction) RLS politikaları
--
-- Bu junction tablosu (schools ile aynı dönemde oluşturulduğu için)
-- repodaki migration'larda RLS politikası almamıştı. RLS açık + admin
-- yazma politikası yoksa, "Meslek Alanları" sekmesindeki INSERT
-- "new row violates row-level security policy" hatası verir ve server
-- action yakalamadığı için 500 döner.
--
-- 006_schools_rls.sql ile aynı desen; idempotent.
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.school_vocational_fields ENABLE ROW LEVEL SECURITY;

-- Herkese okuma
DROP POLICY IF EXISTS "public_read_school_vocational_fields" ON public.school_vocational_fields;
CREATE POLICY "public_read_school_vocational_fields"
  ON public.school_vocational_fields FOR SELECT USING (true);

-- Sadece admin yazabilir (insert / update / delete)
DROP POLICY IF EXISTS "admin_write_school_vocational_fields" ON public.school_vocational_fields;
CREATE POLICY "admin_write_school_vocational_fields"
  ON public.school_vocational_fields FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
