-- ─────────────────────────────────────────────────────────────────
-- profiles: herkese açık okuma + ayrıcalık yükseltme yolunu kapat
--
-- BU MIGRATION ADVISOR UYARISINDAN DEĞİL, CANLI ORTAMDA MCP İLE YAPILAN
-- DOĞRULAMADAN ÇIKTI. Advisor bunu yakalamıyor çünkü tabloda RLS açık ve
-- politikalar mevcut; sorun politikaların İÇERİĞİ. Canlı durum (pg_policies,
-- information_schema.column_privileges ile doğrulandı):
--
--   profiles_select : FOR SELECT  TO public  USING (true)
--   profiles_insert : FOR INSERT  TO public  WITH CHECK (auth.uid() = id)
--   profiles_update : FOR UPDATE  TO public  USING (auth.uid() = id)  -- WITH CHECK YOK
--   profiles_delete : FOR DELETE  TO public  USING (auth.uid() = id)
--   ayrıca anon + authenticated rollerine role KOLONUNDA UPDATE yetkisi verilmiş
--
-- İKİ AYRI SORUN:
--
-- 1) BİLGİ SIZINTISI — profiles_select USING (true) + public rol, anon
--    anahtarla tüm yönetici satırlarını döndürüyor (canlıda doğrulandı):
--      GET /rest/v1/profiles?select=id,email,role -> 200
--      [{"email":"...","role":"admin"}, {"email":"...","role":"admin"}]
--
-- 2) AYRICALIK YÜKSELTME — profiles_update'te WITH CHECK yok ve role
--    kolonunda UPDATE yetkisi var. Oturum açmış herhangi bir kullanıcı
--    kendi satırında (auth.uid() = id) role='admin' yapabilir. USING
--    satırı seçtikten sonra WITH CHECK olmadığı için yeni değer hiç
--    denetlenmez. Bu, "UPDATE policy WITH CHECK ister" tuzağının tam örneği.
--
-- NEDEN ÖNEMLİ: profiles.role tüm yetkilendirmenin kaynağı — 006 ve
-- 003'teki yazma politikaları admin'liği buradan okuyor. leaked-password
-- koruması da kapalı olduğundan sızan yönetici e-postaları hedefli parola
-- denemesiyle birleşiyor.
--
-- NEDEN UYGULAMAYI BOZMAZ: koddaki üç profiles sorgusunun üçü de yalnızca
-- kendi satırını OKUYOR (.eq("id", user.id)):
--   src/lib/admin-auth.ts:31  src/app/admin/login/page.tsx:44
--   src/app/admin/login/actions.ts:83
-- Aşağıdaki self-select politikası bunları karşılar. Kod profiles'a HİÇ
-- yazmıyor; kayıt handle_new_user() (SECURITY DEFINER, postgres) ile RLS'i
-- baypas ederek yazdığı için yazma politikalarını ve anon/authenticated
-- yazma yetkilerini tamamen kaldırmak kayıt akışını etkilemez. Rol atama
-- yalnızca SQL editörü / service_role üzerinden yapılır.
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Mevcut aşırı geniş politikaları kaldır
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;

-- Yalnızca kendi satırını, yalnızca oturum açmış kullanıcı okuyabilsin
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ( (SELECT auth.uid()) = id );

-- Savunma katmanı: anon/authenticated rollerine profiles'ta yazma yetkisi
-- verilmesin (role kolonundaki UPDATE yetkisi de böylece kalkar). Kayıt
-- trigger'ı postgres yetkisiyle çalıştığı için bundan etkilenmez.
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM authenticated;
