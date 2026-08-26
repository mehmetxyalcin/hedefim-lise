-- ─────────────────────────────────────────────────────────────────
-- profiles tablosunu herkese açık okumadan kapat
--
-- BU MIGRATION ADVISOR UYARISINDAN DEĞİL, CANLI ORTAMDA YAPILAN
-- DOĞRULAMADAN ÇIKTI. Yayındaki projeye publishable (anon) anahtarla
-- yapılan istek tüm yönetici hesaplarını döndürüyor:
--
--   GET /rest/v1/profiles?select=id,email,role  ->  200 OK
--   [{"email":"...","role":"admin"}, {"email":"...","role":"admin"}]
--
-- Yani public.profiles üzerinde RLS ya kapalı ya da sınırsız bir okuma
-- politikası var. Repodaki hiçbir migration'da profiles için politika
-- tanımlı değil — tablo baştan beri korumasız.
--
-- NEDEN ÖNEMLİ: profiles tüm yetkilendirmenin kaynağı. 006 ve 003'teki
-- yazma politikaları role bilgisini buradan okuyor:
--   EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()
--           AND role = 'admin')
-- Sızan veri parola değil ama yönetici e-postalarının tam listesi.
-- "Leaked password protection" da kapalı olduğu için bu liste doğrudan
-- hedefli parola denemesi için kullanılabilir hâle geliyor. İki bulgu
-- birleşince risk tek tek olduklarından yüksek.
--
-- NEDEN BU POLİTİKA UYGULAMAYI BOZMAZ: koddaki üç profiles sorgusunun
-- üçü de yalnızca çağıranın KENDİ satırını okuyor (.eq("id", user.id)):
--   src/lib/admin-auth.ts:31
--   src/app/admin/login/page.tsx:44
--   src/app/admin/login/actions.ts:83
-- Aşağıdaki self-select politikası bu üç sorgunun tamamını karşılar.
-- 006'daki EXISTS alt sorgusu da id = auth.uid() ile filtrelendiği için
-- politikadan geçer. Politika profiles'a kendisi bakmadığı için
-- sonsuz döngü (infinite recursion) riski yoktur.
--
-- Kayıt akışı etkilenmez: handle_new_user() SECURITY DEFINER olarak
-- postgres yetkisiyle çalışır ve RLS'i baypas eder.
--
-- Yazma politikası bilerek EKLENMEDİ. Rol değişikliği yalnızca
-- service_role / SQL editörü üzerinden yapılmalı; anon veya
-- authenticated rolüne profiles'ta yazma yetkisi verilmemeli.
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Herkese açık okumayı kaldır (adı ne olursa olsun kalıntı politikalar)
DROP POLICY IF EXISTS "public_read_profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;

-- Yalnızca kendi satırını okuyabilsin
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ( (SELECT auth.uid()) = id );

-- ─────────────────────────────────────────────────────────────────
-- UYGULAMADAN ÖNCE ÇALIŞTIR: mevcut politikaları gör.
-- Yukarıdaki DROP'lar isim tahminine dayanıyor. Dashboard üzerinden
-- oluşturulmuş, farklı isimli izin verici bir SELECT politikası varsa
-- bu dosya onu kaldırmaz ve tablo açık kalmaya devam eder.
--
--   SELECT policyname, cmd, roles, qual
--   FROM pg_policies
--   WHERE schemaname = 'public' AND tablename = 'profiles';
--
--   SELECT relrowsecurity FROM pg_class
--   WHERE oid = 'public.profiles'::regclass;
--
-- Listede beklenmeyen bir politika çıkarsa adını yukarıdaki DROP
-- bloğuna ekle. Uyguladıktan sonra doğrula (200 yerine [] dönmeli):
--   curl "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/profiles?select=id,email" \
--        -H "apikey: <publishable-key>"
-- ─────────────────────────────────────────────────────────────────
