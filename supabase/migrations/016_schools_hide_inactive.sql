-- ─────────────────────────────────────────────────────────────────
-- schools: pasif okullar yalnızca yöneticiye görünsün
--
-- 006'daki public_read_schools USING (true) tüm satırları anon anahtarla
-- okutuyordu. Pasif okulları gizleyen tek şey sayfa sorgularındaki
-- is_active filtresiydi; filtre unutulan yerde (ör. iletişim formu okul
-- araması) veya doğrudan REST çağrısında taslak/pasif okullar görünüyordu.
--
-- Yöneticiler pasif okulları yönetim panelinde görmeye ve düzenlemeye
-- devam eder: admin_write_schools (FOR ALL) zaten tüm satırları okutur,
-- aşağıdaki politika da admin koşulunu açıkça içerir. Toplu yükleme
-- RPC'leri SECURITY INVOKER olduğundan yönetici oturumuyla çalışır.
--
-- Herkese açık kod, gömülü schools satırının null gelmesini zaten
-- eliyor (extractSchoolsFromVocationalField, slugHistory).
--
-- Politika role göre ikiye ayrıldı: ziyaretçinin okul okuması profiles
-- tablosuna hiç dokunmasın. anon'un profiles SELECT yetkisi ileride
-- kaldırılırsa "is_active OR EXISTS(profiles ...)" tipi tek politika her
-- ziyaretçi sorgusunu "permission denied for table profiles" ile düşürür.
--
-- Canlıda (22 Eylül 2026, pg_policies) depoda bulunmayan ikinci bir
-- "schools_select" USING (true) politikası da vardı. Permissive politikalar
-- OR'lanır; bırakılırsa pasif okullar görünmeye devam eder.
--
-- Bu migration idempotent'tir.
-- ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "public_read_schools" ON public.schools;
DROP POLICY IF EXISTS "schools_select" ON public.schools;
DROP POLICY IF EXISTS "anon_read_active_schools" ON public.schools;
DROP POLICY IF EXISTS "authenticated_read_schools" ON public.schools;

CREATE POLICY "anon_read_active_schools"
  ON public.schools FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "authenticated_read_schools"
  ON public.schools FOR SELECT
  TO authenticated
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );
