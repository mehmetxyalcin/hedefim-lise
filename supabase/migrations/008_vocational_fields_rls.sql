-- ─────────────────────────────────────────────────────────────────
-- vocational_fields (meslek alanı ana listesi) admin yazma politikası
--
-- RLS taramasında tek eksik tablo buydu: okuma politikası var ama yazma
-- politikası yok. Admin panelindeki meslek alanı ekle/düzenle/sil
-- (addVocationalField / updateVocationalField / deleteVocationalField)
-- bu yüzden sessizce başarısız oluyordu.
--
-- Mevcut okuma politikasına dokunmuyoruz; sadece eksik admin yazma
-- politikasını ekliyoruz. Idempotent.
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.vocational_fields ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_write_vocational_fields" ON public.vocational_fields;
CREATE POLICY "admin_write_vocational_fields"
  ON public.vocational_fields FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
