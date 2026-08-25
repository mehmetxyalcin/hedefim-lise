-- ─────────────────────────────────────────────────────────────────
-- Okul slug'larını isimden yeniden üret + eski adresleri koru
--
-- Eski slug üreticisi her kelimenin İLK HARFİNİ düşürüyordu:
--   "Anamur Anadolu Lisesi"  ->  anamur-nadolu-isesi-264499
--   "Erdemli Mesleki Eğitim Merkezi" -> erdemli-esleki-gitim-erkezi-762986
-- Sonuç: 183 okulun adresinde okul adı okunmuyor. sitemap.ts (013 öncesi
-- eklendi) bu adresleri arama motorlarına duyurduğu için hata artık
-- görünür hâle geldi.
--
-- Buradaki slug'lar canlı `name` + `institution_code` alanlarından,
-- uygulamanın kendi üreticisiyle (toplu-yukle/actions.ts içindeki
-- slugifyBase) hesaplandı ve tek tek bu dosyaya yazıldı. Migration
-- içinde slug üretmek yerine hazır eşleşme tutuluyor: değerler kod
-- incelemesinde görünür ve Postgres ile JS'in Türkçe harf katlaması
-- konusunda ayrışma ihtimali ortadan kalkar.
--
-- Tablodaki 184. okul (Mersin Üni. Dev. Kons. Müzik ve Sahne Sanatları
-- Lisesi, kurum kodu 759694) bilerek dışarıda: slug'ı bozulmamış, yalnızca
-- sonunda kurum kodu yok. Okunur ve muhtemelen dizine girmiş bir adresi
-- sırf biçim tutarlılığı için değiştirmiyoruz.
--
-- Kontroller (dry-run, 183 satır):
--   * yeni slug'larda çakışma yok
--   * hiçbir okulun yeni slug'ı başka bir okulun eski slug'ı değil
--     -> UNIQUE kısıtı tek UPDATE içinde ihlal edilmez
--
-- Migration idempotent'tir; ikinci çalıştırma hiçbir satıra dokunmaz.
-- ─────────────────────────────────────────────────────────────────

-- ── 1. Eski adres tarihçesi ──────────────────────────────────────
-- 183 satırı next.config.ts'e gömmek yerine tabloda tutuluyor:
-- slug bundan sonra da admin panelinden değişebilir, yönlendirme
-- listesi kendi kendine büyümeli.
CREATE TABLE IF NOT EXISTS public.school_slug_history (
  old_slug   text        PRIMARY KEY,
  school_id  bigint      NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Okul silindiğinde/güncellendiğinde tarihçesini toplamak için
CREATE INDEX IF NOT EXISTS school_slug_history_school_id_idx
  ON public.school_slug_history (school_id);

ALTER TABLE public.school_slug_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_school_slug_history" ON public.school_slug_history;
DROP POLICY IF EXISTS "admin_write_school_slug_history" ON public.school_slug_history;

-- Yönlendirme okul detay sayfasında, oturumsuz ziyaretçi için çalışıyor.
CREATE POLICY "public_read_school_slug_history"
  ON public.school_slug_history FOR SELECT
  USING (true);

CREATE POLICY "admin_write_school_slug_history"
  ON public.school_slug_history FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- ── 2. Bundan sonraki slug değişikliklerini otomatik kaydet ──────
-- Tetikleyici; admin formu, toplu yükleme ve elle çalıştırılan SQL
-- dâhil bütün yazma yollarını kapsar.
CREATE OR REPLACE FUNCTION public.record_school_slug_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  -- Okul yeni adrese taşındı: eskisi tarihçeye yazılır.
  INSERT INTO public.school_slug_history (old_slug, school_id)
  VALUES (OLD.slug, NEW.id)
  ON CONFLICT (old_slug) DO UPDATE SET school_id = EXCLUDED.school_id;

  -- Okul eski adreslerinden birine geri döndüyse o kayıt düşer:
  -- aynı slug hem canlı hem tarihçede durursa yönlendirme kendini
  -- hedef alır.
  DELETE FROM public.school_slug_history WHERE old_slug = NEW.slug;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS schools_slug_history ON public.schools;
CREATE TRIGGER schools_slug_history
  AFTER UPDATE OF slug ON public.schools
  FOR EACH ROW
  WHEN (OLD.slug IS DISTINCT FROM NEW.slug)
  EXECUTE FUNCTION public.record_school_slug_change();

-- ── 3. Doğru slug eşleşmesi ─────────────────────────────────────
-- pg_temp ile niteleniyor: niteliksiz ad search_path üzerinden
-- public'teki gerçek bir tabloya denk gelebilir.
DROP TABLE IF EXISTS pg_temp.dogru_slug;
CREATE TEMP TABLE dogru_slug (
  institution_code text PRIMARY KEY,
  slug             text NOT NULL
);

INSERT INTO pg_temp.dogru_slug (institution_code, slug) VALUES
  ('156864', 'gazi-mesleki-ve-teknik-anadolu-lisesi-156864'),  -- Gazi Mesleki ve Teknik Anadolu Lisesi
  ('156888', 'anamur-ticaret-mesleki-ve-teknik-anadolu-lisesi-156888'),  -- Anamur Ticaret Mesleki ve Teknik Anadolu Lisesi
  ('157103', 'erdemli-anadolu-imam-hatip-lisesi-157103'),  -- Erdemli Anadolu İmam Hatip Lisesi
  ('157259', 'gulnar-anadolu-imam-hatip-lisesi-157259'),  -- Gülnar Anadolu İmam Hatip Lisesi
  ('157367', 'mut-mesleki-ve-teknik-anadolu-lisesi-157367'),  -- Mut Mesleki ve Teknik Anadolu Lisesi
  ('157380', 'cennet-mahmut-ozdemir-anadolu-imam-hatip-lisesi-157380'),  -- Cennet-Mahmut Özdemir Anadolu İmam Hatip Lisesi
  ('157509', 'silifke-ticaret-mesleki-ve-teknik-anadolu-lisesi-157509'),  -- Silifke Ticaret Mesleki ve Teknik Anadolu Lisesi
  ('157762', 'abdulkerim-bengi-anadolu-lisesi-157762'),  -- Abdulkerim Bengi Anadolu Lisesi
  ('157774', 'tarsus-mesleki-ve-teknik-anadolu-lisesi-157774'),  -- Tarsus Mesleki ve Teknik Anadolu Lisesi
  ('157786', 'adile-onbasi-kiz-mesleki-ve-teknik-anadolu-lisesi-157786'),  -- Adile Onbaşı Kız Mesleki ve Teknik Anadolu Lisesi
  ('157798', 'kasim-ekenler-ticaret-mesleki-ve-teknik-anadolu-lisesi-157798'),  -- Kasım Ekenler Ticaret Mesleki ve Teknik Anadolu Lisesi
  ('157808', 'tarsus-anadolu-imam-hatip-lisesi-157808'),  -- Tarsus Anadolu İmam Hatip Lisesi
  ('214052', 'rustu-kazim-yucelen-mesleki-egitim-merkezi-214052'),  -- Rüştü Kazım Yücelen Mesleki Eğitim Merkezi
  ('231975', 'tarsus-mesleki-egitim-merkezi-231975'),  -- Tarsus Mesleki Eğitim Merkezi
  ('264499', 'anamur-anadolu-lisesi-264499'),  -- Anamur Anadolu Lisesi
  ('280185', 'silifke-anadolu-lisesi-280185'),  -- Silifke Anadolu Lisesi
  ('290534', 'mut-mesleki-egitim-merkezi-290534'),  -- Mut Mesleki Eğitim Merkezi
  ('300387', 'erdemli-anadolu-lisesi-300387'),  -- Erdemli Anadolu Lisesi
  ('301667', 'mustafa-kemal-anadolu-lisesi-301667'),  -- Mustafa Kemal Anadolu Lisesi
  ('323504', 'bozyazi-anadolu-lisesi-323504'),  -- Bozyazı Anadolu Lisesi
  ('324989', 'atayurt-gazi-cok-programli-anadolu-lisesi-324989'),  -- Atayurt Gazi Çok Programlı Anadolu Lisesi
  ('325062', 'yenice-sehit-huseyin-ayturk-cok-programli-anadolu-lisesi-325062'),  -- Yenice Şehit Hüseyin Aytürk Çok Programlı Anadolu Lisesi
  ('340376', 'valide-sultan-kiz-mesleki-ve-teknik-anadolu-lisesi-340376'),  -- Valide Sultan Kız Mesleki ve Teknik Anadolu Lisesi
  ('354257', 'aydincik-cok-programli-anadolu-lisesi-354257'),  -- Aydıncık Çok Programlı Anadolu Lisesi
  ('357095', 'tarsus-gulek-ibrahim-gunay-cok-programli-anadolu-lisesi-357095'),  -- Tarsus Gülek İbrahim Günay Çok Programlı Anadolu Lisesi
  ('365590', 'tasucu-turizm-mesleki-ve-teknik-anadolu-lisesi-365590'),  -- Taşucu Turizm Mesleki ve Teknik Anadolu Lisesi
  ('373055', 'silifke-anadolu-imam-hatip-lisesi-373055'),  -- Silifke Anadolu İmam Hatip Lisesi
  ('385680', 'zeyne-cok-programli-anadolu-lisesi-385680'),  -- Zeyne Çok Programlı Anadolu Lisesi
  ('745824', 'cemile-hamdi-ongun-mesleki-ve-teknik-anadolu-lisesi-745824'),  -- Cemile Hamdi Ongun Mesleki ve Teknik Anadolu Lisesi
  ('745832', 'davultepe-mesleki-ve-teknik-anadolu-lisesi-745832'),  -- Davultepe Mesleki ve Teknik Anadolu Lisesi
  ('746843', 'silifke-mesleki-egitim-merkezi-746843'),  -- Silifke Mesleki Eğitim Merkezi
  ('747616', 'silifke-ozel-egitim-uygulama-okulu-iii-kademe-747616'),  -- Silifke Özel Eğitim Uygulama Okulu III. Kademe
  ('748059', 'huseyin-polat-ozel-egitim-uygulama-okulu-iii-kademe-748059'),  -- Hüseyin Polat Özel Eğitim Uygulama Okulu III. Kademe
  ('748061', 'ak-ali-kucuk-ozel-egitim-uygulama-okulu-iii-kademe-748061'),  -- Ak Ali Küçük Özel Eğitim Uygulama Okulu III. Kademe
  ('748825', 'hoca-ahmet-yesevi-kiz-anadolu-imam-hatip-lisesi-748825'),  -- Hoca Ahmet Yesevi Kız Anadolu İmam Hatip Lisesi
  ('749368', 'sabiha-ciftci-kiz-mesleki-ve-teknik-anadolu-lisesi-749368'),  -- Sabiha Çiftçi Kız Mesleki ve Teknik Anadolu Lisesi
  ('749842', 'eyup-aygar-fen-lisesi-749842'),  -- Eyüp Aygar Fen Lisesi
  ('750856', 'ataturk-anadolu-lisesi-750856'),  -- Atatürk Anadolu Lisesi
  ('750857', 'anamur-cumhuriyet-anadolu-lisesi-750857'),  -- Anamur Cumhuriyet Anadolu Lisesi
  ('750858', 'tomuk-anadolu-lisesi-750858'),  -- Tömük Anadolu Lisesi
  ('750859', 'pakize-kokulu-anadolu-lisesi-750859'),  -- Pakize Kokulu Anadolu Lisesi
  ('750860', 'sehit-emin-celik-anadolu-lisesi-750860'),  -- Şehit Emin Çelik Anadolu Lisesi
  ('750861', 'ilker-eren-cevik-anadolu-lisesi-750861'),  -- İlker-Eren Çevik Anadolu Lisesi
  ('750863', 'sehit-cengiz-topel-anadolu-lisesi-750863'),  -- Şehit Cengiz Topel Anadolu Lisesi
  ('750864', 'hasan-akel-anadolu-lisesi-750864'),  -- Hasan Akel Anadolu Lisesi
  ('750865', 'toroslar-anadolu-lisesi-750865'),  -- Toroslar Anadolu Lisesi
  ('750866', 'sevket-pozcu-anadolu-lisesi-750866'),  -- Şevket Pozcu Anadolu Lisesi
  ('751331', 'fatma-zehra-kiz-anadolu-imam-hatip-lisesi-751331'),  -- Fatma Zehra Kız Anadolu İmam Hatip Lisesi
  ('751332', 'aksemsettin-anadolu-imam-hatip-lisesi-751332'),  -- Akşemsettin Anadolu İmam Hatip Lisesi
  ('751337', 'bozyazi-durmus-tufan-anadolu-imam-hatip-lisesi-751337'),  -- Bozyazı Durmuş Tufan Anadolu İmam Hatip Lisesi
  ('751442', 'bozyazi-15-temmuz-milli-irade-mesleki-ve-teknik-anadolu-lisesi-751442'),  -- Bozyazı 15 Temmuz Millî İrade Mesleki ve Teknik Anadolu Lisesi
  ('751495', 'tasucu-prof-dr-durmus-tezcan-denizcilik-mesleki-ve-teknik-anadolu-lisesi-751495'),  -- Taşucu Prof. Dr. Durmuş Tezcan Denizcilik Mesleki ve Teknik Anadolu Lisesi
  ('751620', 'merkez-gozne-cok-programli-anadolu-lisesi-751620'),  -- Merkez Gözne Çok Programlı Anadolu Lisesi
  ('751621', 'arslankoy-yahya-aydin-cok-programli-anadolu-lisesi-751621'),  -- Arslanköy Yahya Aydın Çok Programlı Anadolu Lisesi
  ('751624', 'silifke-yesilovacik-cok-programli-anadolu-lisesi-751624'),  -- Silifke Yeşilovacık Çok Programlı Anadolu Lisesi
  ('751625', 'gulnar-hatun-kiz-mesleki-ve-teknik-anadolu-lisesi-751625'),  -- Gülnar Hatun Kız Mesleki ve Teknik Anadolu Lisesi
  ('751629', 'kasim-ekenler-cok-programli-anadolu-lisesi-751629'),  -- Kasım Ekenler Çok Programlı Anadolu Lisesi
  ('751730', 'mine-gunasti-anadolu-imam-hatip-lisesi-751730'),  -- Mine Günaştı Anadolu İmam Hatip Lisesi
  ('752459', 'akib-zafer-caglayan-ticaret-mesleki-ve-teknik-anadolu-lisesi-752459'),  -- AKİB Zafer Çağlayan Ticaret Mesleki ve Teknik Anadolu Lisesi
  ('752483', 'yenice-ozel-egitim-uygulama-okulu-iii-kademe-752483'),  -- Yenice Özel Eğitim Uygulama Okulu III. Kademe
  ('757319', 'mezitli-kiz-anadolu-imam-hatip-lisesi-757319'),  -- Mezitli Kız Anadolu İmam Hatip Lisesi
  ('757465', 'akdeniz-ozel-egitim-uygulama-okulu-iii-kademe-757465'),  -- Akdeniz Özel Eğitim Uygulama Okulu III. Kademe
  ('758037', 'mut-osman-nuri-yalman-anadolu-lisesi-758037'),  -- Mut Osman Nuri Yalman Anadolu Lisesi
  ('758040', 'erdemli-borsa-istanbul-fen-lisesi-758040'),  -- Erdemli Borsa İstanbul Fen Lisesi
  ('758041', 'tarsus-sehit-halil-ozdemir-fen-lisesi-758041'),  -- Tarsus Şehit Halil Özdemir Fen Lisesi
  ('758179', 'erdemli-akdeniz-anadolu-lisesi-758179'),  -- Erdemli Akdeniz Anadolu Lisesi
  ('758234', 'sehit-ibrahim-armut-fen-lisesi-758234'),  -- Şehit İbrahim Armut Fen Lisesi
  ('758310', '75-yil-fen-lisesi-758310'),  -- 75.Yıl Fen Lisesi
  ('758334', 'toroslar-sifa-hatun-mesleki-ve-teknik-anadolu-lisesi-758334'),  -- Toroslar Şifa Hatun Mesleki ve Teknik Anadolu Lisesi
  ('759714', 'mersin-naim-suleymanoglu-spor-lisesi-759714'),  -- Mersin Naim Süleymanoğlu Spor Lisesi
  ('759715', 'mersin-nevit-kodalli-guzel-sanatlar-lisesi-759715'),  -- Mersin Nevit Kodallı Güzel Sanatlar Lisesi
  ('760238', 'mersin-kiz-anadolu-imam-hatip-lisesi-760238'),  -- Mersin Kız Anadolu İmam Hatip Lisesi
  ('760571', 'mezitli-ozel-egitim-uygulama-okulu-iii-kademe-760571'),  -- Mezitli Özel Eğitim Uygulama Okulu III. Kademe
  ('761162', 'erdemli-ertugrul-gazi-mesleki-ve-teknik-anadolu-lisesi-761162'),  -- Erdemli Ertuğrul Gazi Mesleki ve Teknik Anadolu Lisesi
  ('761173', 'yenisehir-anadolu-imam-hatip-lisesi-761173'),  -- Yenişehir Anadolu İmam Hatip Lisesi
  ('761472', 'toroslar-mimar-sinan-mesleki-ve-teknik-anadolu-lisesi-761472'),  -- Toroslar Mimar Sinan Mesleki ve Teknik Anadolu Lisesi
  ('761632', 'silifke-fen-lisesi-761632'),  -- Silifke Fen Lisesi
  ('762176', 'sehit-kubra-doganay-kiz-anadolu-imam-hatip-lisesi-762176'),  -- Şehit Kübra Doğanay Kız Anadolu İmam Hatip Lisesi
  ('762340', '15-temmuz-sehitler-anadolu-lisesi-762340'),  -- 15 Temmuz Şehitler Anadolu Lisesi
  ('762341', 'sehit-niyazi-erguven-anadolu-lisesi-762341'),  -- Şehit Niyazi Ergüven Anadolu Lisesi
  ('762642', 'prof-dr-nebi-bozkurt-kiz-anadolu-imam-hatip-lisesi-762642'),  -- Prof. Dr. Nebi Bozkurt Kız Anadolu İmam Hatip Lisesi
  ('762973', 'mersin-buyuksehir-belediyesi-ozel-egitim-uygulama-okulu-iii-kademe-762973'),  -- Mersin Büyükşehir Belediyesi Özel Eğitim Uygulama Okulu III. Kademe
  ('762986', 'erdemli-mesleki-egitim-merkezi-762986'),  -- Erdemli Mesleki Eğitim Merkezi
  ('763592', 'bozyazi-mesleki-ve-teknik-anadolu-lisesi-763592'),  -- Bozyazı Mesleki ve Teknik Anadolu Lisesi
  ('764326', 'dumlupinar-anadolu-imam-hatip-lisesi-764326'),  -- Dumlupınar Anadolu İmam Hatip Lisesi
  ('764788', 'ulastirma-hizmetleri-mesleki-ve-teknik-anadolu-lisesi-764788'),  -- Ulaştırma Hizmetleri Mesleki ve Teknik Anadolu Lisesi
  ('764926', 'anamur-sehit-yuksel-alcin-anadolu-imam-hatip-lisesi-764926'),  -- Anamur Şehit Yüksel Alçın Anadolu İmam Hatip Lisesi
  ('764985', 'omer-ummugulsum-cirik-mesleki-ve-teknik-anadolu-lisesi-764985'),  -- Ömer-Ümmügülsüm Cirık Mesleki ve Teknik Anadolu Lisesi
  ('765060', 'sehit-cennet-yigit-kiz-anadolu-imam-hatip-lisesi-765060'),  -- Şehit Cennet Yiğit Kız Anadolu İmam Hatip Lisesi
  ('765122', 'necip-fazil-anadolu-imam-hatip-lisesi-765122'),  -- Necip Fazıl Anadolu İmam Hatip Lisesi
  ('765360', 'mezitli-anadolu-lisesi-765360'),  -- Mezitli Anadolu Lisesi
  ('765488', 'nurettin-topcu-anadolu-lisesi-765488'),  -- Nurettin Topçu Anadolu Lisesi
  ('765673', 'erdemli-ozel-egitim-uygulama-okulu-iii-kademe-765673'),  -- Erdemli Özel Eğitim Uygulama Okulu III. Kademe
  ('766035', 'isa-oner-anadolu-lisesi-766035'),  -- İsa Öner Anadolu Lisesi
  ('766136', '15-temmuz-ozel-egitim-uygulama-okulu-iii-kademe-766136'),  -- 15 Temmuz Özel Eğitim Uygulama Okulu III. Kademe
  ('766283', 'yenisehir-mesleki-ve-teknik-anadolu-lisesi-766283'),  -- Yenişehir Mesleki ve Teknik Anadolu Lisesi
  ('766531', 'gulnar-ozel-egitim-uygulama-okulu-iii-kademe-766531'),  -- Gülnar Özel Eğitim Uygulama Okulu III. Kademe
  ('766950', 'uluslararasi-ashabi-kehf-anadolu-imam-hatip-lisesi-766950'),  -- Uluslararası Ashabı Kehf Anadolu İmam Hatip Lisesi
  ('767195', 'cumhuriyet-anadolu-lisesi-767195'),  -- Cumhuriyet Anadolu Lisesi
  ('767380', '100-yil-anadolu-lisesi-767380'),  -- 100. Yıl Anadolu Lisesi
  ('767381', 'cesmeli-anadolu-lisesi-767381'),  -- Çeşmeli Anadolu Lisesi
  ('767382', 'cahit-zarifoglu-anadolu-lisesi-767382'),  -- Cahit Zarifoğlu Anadolu Lisesi
  ('767388', 'sehit-vedat-yilmaz-anadolu-lisesi-767388'),  -- Şehit Vedat Yılmaz Anadolu Lisesi
  ('767391', 'korukent-anadolu-lisesi-767391'),  -- Korukent Anadolu Lisesi
  ('767957', 'huzurkent-danyal-uysal-anadolu-lisesi-767957'),  -- Huzurkent Danyal Uysal Anadolu Lisesi
  ('768134', 'ataturk-anadolu-lisesi-768134'),  -- Atatürk Anadolu Lisesi
  ('768135', 'iclal-ekenler-anadolu-lisesi-768135'),  -- İclal Ekenler Anadolu Lisesi
  ('768411', 'fuat-sezgin-anadolu-lisesi-768411'),  -- Fuat Sezgin Anadolu Lisesi
  ('769263', 'anamur-ozel-egitim-uygulama-okulu-iii-kademe-769263'),  -- Anamur Özel Eğitim Uygulama Okulu III. Kademe
  ('772313', 'tarsus-tobb-mesleki-ve-teknik-anadolu-lisesi-772313'),  -- Tarsus TOBB Mesleki ve Teknik Anadolu Lisesi
  ('772542', 'toroslar-ozel-egitim-uygulama-okulu-iii-kademe-772542'),  -- Toroslar Özel Eğitim Uygulama Okulu III. Kademe
  ('774076', 'nihal-erdem-anadolu-lisesi-774076'),  -- Nihal Erdem Anadolu Lisesi
  ('774341', 'silifke-nukleer-enerji-mesleki-ve-teknik-anadolu-lisesi-774341'),  -- Silifke Nükleer Enerji Mesleki ve Teknik Anadolu Lisesi
  ('774362', 'tarsus-adalet-cok-programli-anadolu-lisesi-774362'),  -- Tarsus Adalet Çok Programlı Anadolu Lisesi
  ('775423', 'mut-ozdemirler-mesleki-ve-teknik-anadolu-lisesi-775423'),  -- Mut Özdemirler Mesleki ve Teknik Anadolu Lisesi
  ('775730', 'toroslar-mesleki-egitim-merkezi-775730'),  -- Toroslar Mesleki Eğitim Merkezi
  ('775746', 'omer-ummugulsum-cirik-mesleki-egitim-merkezi-775746'),  -- Ömer-Ümmügülsüm Cirık Mesleki Eğitim Merkezi
  ('775949', 'sehit-ali-gumus-fen-lisesi-775949'),  -- Şehit Ali Gümüş Fen Lisesi
  ('776867', 'milli-irade-anadolu-lisesi-776867'),  -- Milli İrade Anadolu Lisesi
  ('777004', 'zubeyde-hanim-ozel-egitim-uygulama-okulu-iii-kademe-777004'),  -- Zübeyde Hanım Özel Eğitim Uygulama Okulu III. Kademe
  ('777032', 'iclal-ekenler-kiz-mesleki-ve-teknik-anadolu-lisesi-777032'),  -- İclal Ekenler Kız Mesleki ve Teknik Anadolu Lisesi
  ('824074', 'ticaret-ve-sanayi-odasi-mesleki-ve-teknik-anadolu-lisesi-824074'),  -- Ticaret ve Sanayi Odası Mesleki ve Teknik Anadolu Lisesi
  ('888690', 'tarsus-borsa-istanbul-mesleki-ve-teknik-anadolu-lisesi-888690'),  -- Tarsus Borsa İstanbul Mesleki ve Teknik Anadolu Lisesi
  ('962140', 'gulnar-anadolu-lisesi-962140'),  -- Gülnar Anadolu Lisesi
  ('962996', 'gulserin-gunasti-mesleki-ve-teknik-anadolu-lisesi-962996'),  -- Gülserin Günaştı Mesleki ve Teknik Anadolu Lisesi
  ('962998', 'gevher-nesibe-mesleki-ve-teknik-anadolu-lisesi-962998'),  -- Gevher Nesibe Mesleki ve Teknik Anadolu Lisesi
  ('963202', 'erdemli-kanuni-mesleki-ve-teknik-anadolu-lisesi-963202'),  -- Erdemli Kanuni Mesleki ve Teknik Anadolu Lisesi
  ('963203', 'abdulkadir-persembe-vakfi-mesleki-ve-teknik-anadolu-lisesi-963203'),  -- Abdulkadir Perşembe Vakfı Mesleki ve Teknik Anadolu Lisesi
  ('964198', 'ayhan-bozpinar-anadolu-lisesi-964198'),  -- Ayhan Bozpınar Anadolu Lisesi
  ('964199', 'kocahasanli-anadolu-lisesi-964199'),  -- Kocahasanlı Anadolu Lisesi
  ('965577', 'gulnar-mesleki-ve-teknik-anadolu-lisesi-965577'),  -- Gülnar Mesleki ve Teknik Anadolu Lisesi
  ('966362', 'ashabi-kehf-turizm-mesleki-ve-teknik-anadolu-lisesi-966362'),  -- Ashabı Kehf Turizm Mesleki ve Teknik Anadolu Lisesi
  ('966387', 'silifke-goksu-anadolu-lisesi-966387'),  -- Silifke Göksu Anadolu Lisesi
  ('967359', 'ataturk-kiz-mesleki-ve-teknik-anadolu-lisesi-967359'),  -- Atatürk Kız Mesleki ve Teknik Anadolu Lisesi
  ('967521', 'mersin-mesleki-ve-teknik-anadolu-lisesi-967521'),  -- Mersin Mesleki ve Teknik Anadolu Lisesi
  ('967523', 'ataturk-mesleki-ve-teknik-anadolu-lisesi-967523'),  -- Atatürk Mesleki ve Teknik Anadolu Lisesi
  ('967568', 'mersin-anadolu-imam-hatip-lisesi-967568'),  -- Mersin Anadolu İmam Hatip Lisesi
  ('967704', 'rasim-dokur-anadolu-lisesi-967704'),  -- Rasim Dokur Anadolu Lisesi
  ('967724', 'camlibel-kiz-mesleki-ve-teknik-anadolu-lisesi-967724'),  -- Çamlıbel Kız Mesleki ve Teknik Anadolu Lisesi
  ('967726', 'fatma-aliye-mesleki-ve-teknik-anadolu-lisesi-967726'),  -- Fatma Aliye Mesleki ve Teknik Anadolu Lisesi
  ('967767', 'yahya-gunsur-mesleki-ve-teknik-anadolu-lisesi-967767'),  -- Yahya Günsür Mesleki ve Teknik Anadolu Lisesi
  ('967811', 'ibni-sina-ozel-egitim-meslek-lisesi-967811'),  -- İbni Sina Özel Eğitim Meslek Lisesi
  ('967897', 'icel-anadolu-lisesi-967897'),  -- İçel Anadolu Lisesi
  ('967905', 'mersin-ticaret-ve-sanayi-odasi-anadolu-lisesi-967905'),  -- Mersin Ticaret ve Sanayi Odası Anadolu Lisesi
  ('967908', 'mehmet-serttas-anadolu-lisesi-967908'),  -- Mehmet Serttaş Anadolu Lisesi
  ('967913', 'mersin-mehmet-adnan-ozcelik-anadolu-lisesi-967913'),  -- Mersin Mehmet Adnan Özçelik Anadolu Lisesi
  ('967916', '19-mayis-anadolu-lisesi-967916'),  -- 19 Mayıs Anadolu Lisesi
  ('967917', 'mersin-yusuf-kalkavan-anadolu-lisesi-967917'),  -- Mersin Yusuf Kalkavan Anadolu Lisesi
  ('967922', 'tevfik-sirri-gur-anadolu-lisesi-967922'),  -- Tevfik Sırrı Gür Anadolu Lisesi
  ('967951', 'haci-sabanci-anadolu-lisesi-967951'),  -- Hacı Sabancı Anadolu Lisesi
  ('967952', 'akdeniz-mesleki-egitim-merkezi-967952'),  -- Akdeniz Mesleki Eğitim Merkezi
  ('968003', 'mersin-eyup-aygar-anadolu-lisesi-968003'),  -- Mersin Eyüp Aygar Anadolu Lisesi
  ('968064', 'yenisehir-mersin-anadolu-lisesi-968064'),  -- Yenişehir Mersin Anadolu Lisesi
  ('968065', 'haci-zarife-celebi-aygar-anadolu-lisesi-968065'),  -- Hacı Zarife-Çelebi Aygar Anadolu Lisesi
  ('968656', 'mezitli-mesleki-ve-teknik-anadolu-lisesi-968656'),  -- Mezitli Mesleki ve Teknik Anadolu Lisesi
  ('969342', 'evliya-celebi-turizm-mesleki-ve-teknik-anadolu-lisesi-969342'),  -- Evliya Çelebi Turizm Mesleki ve Teknik Anadolu Lisesi
  ('969343', 'nihal-erdem-ticaret-mesleki-ve-teknik-anadolu-lisesi-969343'),  -- Nihal Erdem Ticaret Mesleki ve Teknik Anadolu Lisesi
  ('969344', 'zeytinlibahce-ticaret-mesleki-ve-teknik-anadolu-lisesi-969344'),  -- Zeytinlibahçe Ticaret Mesleki ve Teknik Anadolu Lisesi
  ('969772', 'kadri-saman-mtso-mesleki-ve-teknik-anadolu-lisesi-969772'),  -- Kadri Şaman MTSO Mesleki ve Teknik Anadolu Lisesi
  ('970501', 'tasucu-anadolu-lisesi-970501'),  -- Taşucu Anadolu Lisesi
  ('970852', 'mahmut-arslan-anadolu-lisesi-970852'),  -- Mahmut Arslan Anadolu Lisesi
  ('970870', 'cagdaskent-anadolu-lisesi-970870'),  -- Çağdaşkent Anadolu Lisesi
  ('970969', 'yahya-akel-fen-lisesi-970969'),  -- Yahya Akel Fen Lisesi
  ('971643', 'akdeniz-mersin-deniz-ticaret-odasi-denizcilik-mesleki-ve-teknik-anadolu-lisesi-971643'),  -- Akdeniz Mersin Deniz Ticaret Odası Denizcilik Mesleki ve Teknik Anadolu Lisesi
  ('971701', 'hafsa-sultan-kiz-mesleki-ve-teknik-anadolu-lisesi-971701'),  -- Hafsa Sultan Kız Mesleki ve Teknik Anadolu Lisesi
  ('972420', 'salim-yilmaz-anadolu-lisesi-972420'),  -- Salim Yılmaz Anadolu Lisesi
  ('972421', 'huseyin-okan-merzeci-anadolu-lisesi-972421'),  -- Hüseyin Okan Merzeci Anadolu Lisesi
  ('972625', 'abdulkadir-persembe-vakfi-mesleki-ve-teknik-anadolu-lisesi-972625'),  -- Abdülkadir Perşembe Vakfı Mesleki ve Teknik Anadolu Lisesi
  ('972949', 'kargipinari-anadolu-lisesi-972949'),  -- Kargıpınarı Anadolu Lisesi
  ('972950', 'mersin-tarsus-zuhtu-gunasti-anadolu-lisesi-972950'),  -- Mersin Tarsus Zühtü Günaştı Anadolu Lisesi
  ('972951', 'silifke-ertan-cuceloglu-anadolu-lisesi-972951'),  -- Silifke Ertan Cüceloğlu Anadolu Lisesi
  ('972952', 'tarsus-borsa-istanbul-sehit-umut-sami-sensoy-anadolu-lisesi-972952'),  -- Tarsus Borsa İstanbul Şehit Umut Sami Şensoy Anadolu Lisesi
  ('973365', 'akdeniz-borsa-istanbul-mesleki-ve-teknik-anadolu-lisesi-973365'),  -- Akdeniz Borsa İstanbul Mesleki ve Teknik Anadolu Lisesi
  ('973428', 'mehmet-akif-ersoy-sosyal-bilimler-lisesi-973428'),  -- Mehmet Akif Ersoy Sosyal Bilimler Lisesi
  ('973771', 'tarsus-fatih-anadolu-lisesi-973771'),  -- Tarsus Fatih Anadolu Lisesi
  ('973772', 'gazi-anadolu-lisesi-973772'),  -- Gazi Anadolu Lisesi
  ('974019', 'sesim-sarpkaya-fen-lisesi-974019'),  -- Sesim Sarpkaya Fen Lisesi
  ('974043', 'arpacbahsis-turizm-mesleki-ve-teknik-anadolu-lisesi-974043'),  -- Arpaçbahşiş Turizm Mesleki ve Teknik Anadolu Lisesi
  ('974185', 'sevket-pozcu-kiz-mesleki-ve-teknik-anadolu-lisesi-974185'),  -- Şevket Pozcu Kız Mesleki ve Teknik Anadolu Lisesi
  ('974407', 'erdemli-tarim-mesleki-ve-teknik-anadolu-lisesi-974407'),  -- Erdemli Tarım Mesleki ve Teknik Anadolu Lisesi
  ('974571', 'mezitli-anadolu-imam-hatip-lisesi-974571'),  -- Mezitli Anadolu İmam Hatip Lisesi
  ('974731', 'aydincik-anadolu-lisesi-974731'),  -- Aydıncık Anadolu Lisesi
  ('974965', 'barboros-hayrettin-kiz-anadolu-imam-hatip-lisesi-974965');  -- Barboros Hayrettin Kız Anadolu İmam Hatip Lisesi

-- ── 4. Eski adresleri tarihçeye al ──────────────────────────────
-- UPDATE'ten önce çalışır. Tetikleyici de aynı kaydı yazacak; ikisi
-- de ON CONFLICT ile korunuyor, hangisinin önce davrandığı fark etmez.
INSERT INTO public.school_slug_history (old_slug, school_id)
SELECT s.slug, s.id
FROM public.schools s
JOIN pg_temp.dogru_slug d ON d.institution_code = s.institution_code
WHERE s.slug IS DISTINCT FROM d.slug
ON CONFLICT (old_slug) DO NOTHING;

-- ── 5. Slug'ları düzelt ─────────────────────────────────────────
-- updated_at bilerek tazeleniyor: sayfanın kanonik adresi gerçekten
-- değişti ve sitemap.ts lastModified'ı bu kolondan okuyor; arama
-- motorunun yeniden taraması isteniyor.
UPDATE public.schools s
SET slug = d.slug,
    updated_at = now()
FROM pg_temp.dogru_slug d
WHERE s.institution_code = d.institution_code
  AND s.slug IS DISTINCT FROM d.slug;

DROP TABLE pg_temp.dogru_slug;
