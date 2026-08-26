-- ─────────────────────────────────────────────────────────────────
-- handle_new_user() üzerindeki PUBLIC EXECUTE yetkisini geri al
--
-- Supabase security advisor uyarısı: public.handle_new_user() fonksiyonu
-- anon ve authenticated rolleri tarafından EXECUTE edilebilir durumda.
-- Sebebi: Postgres her yeni fonksiyona varsayılan olarak PUBLIC EXECUTE
-- verir ve bu fonksiyon oluşturulurken (dashboard üzerinden, repo dışında)
-- o varsayılan yetki hiç geri alınmamış.
--
-- ÖNEMLİ — bu bir açık DEĞİL, hijyen düzeltmesidir:
-- Fonksiyon `returns trigger` tipinde. Canlı projede test edildi:
--   POST /rest/v1/rpc/handle_new_user  ->  404 PGRST202
--   "Could not find the function public.handle_new_user in the schema cache"
-- PostgREST trigger dönen fonksiyonları şema önbelleğine hiç almaz, yani
-- istek Postgres'e ulaşmadan reddedilir. Ulaşsaydı bile Postgres doğrudan
-- çağrıyı "trigger functions can only be called as triggers" diye
-- reddederdi. Yani iki katman koruma zaten var; buradaki amaç advisor
-- uyarısını kapatmak ve en az yetki ilkesini uygulamak.
--
-- SECURITY DEFINER KORUNUYOR. Fonksiyon kayıt anında public.profiles'a
-- yazıyor ve o anda yetkili bir oturum yok; SECURITY INVOKER'a çevirmek
-- kayıt akışını bozar. search_path zaten '' olarak sabitlenmiş durumda.
--
-- Kayıt akışı bu REVOKE'tan etkilenmez: trigger'ın çalışması için
-- çağıran rolün fonksiyon üzerinde EXECUTE yetkisi olması gerekmez.
-- Postgres trigger'ı tablo sahibinin adına çalıştırır.
-- ─────────────────────────────────────────────────────────────────

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
