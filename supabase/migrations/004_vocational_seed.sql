-- ═══════════════════════════════════════════════════════════════════
-- 004_vocational_seed.sql
-- vocational_fields ve vocational_branches seed verisi
-- ON CONFLICT DO NOTHING — tekrar çalıştırılabilir
-- ═══════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────
-- 1. Meslek Alanları (vocational_fields)
-- ───────────────────────────────────────────────────────────────────

INSERT INTO public.vocational_fields (slug, title, description, skills, career, branches) VALUES
  ('bilisim-teknolojileri',                     'Bilişim Teknolojileri Alanı',                             NULL, NULL, NULL, '{}'),
  ('saglik-hizmetleri',                         'Sağlık Hizmetleri Alanı',                                 NULL, NULL, NULL, '{}'),
  ('yiyecek-icecek-hizmetleri',                 'Yiyecek İçecek Hizmetleri Alanı',                        NULL, NULL, NULL, '{}'),
  ('denizcilik',                                'Denizcilik Alanı',                                        NULL, NULL, NULL, '{}'),
  ('gemi-yapimi',                               'Gemi Yapımı Alanı',                                       NULL, NULL, NULL, '{}'),
  ('muhasebe-finansman',                        'Muhasebe ve Finansman Alanı',                             NULL, NULL, NULL, '{}'),
  ('pazarlama-perakende',                       'Pazarlama ve Perakende Alanı',                            NULL, NULL, NULL, '{}'),
  ('ulastirma-hizmetleri',                      'Ulaştırma Hizmetleri Alanı',                              NULL, NULL, NULL, '{}'),
  ('buro-yonetimi-yonetici-asistanligi',        'Büro Yönetimi ve Yönetici Asistanlığı Alanı',             NULL, NULL, NULL, '{}'),
  ('cocuk-gelisimi-egitimi',                    'Çocuk Gelişimi ve Eğitimi Alanı',                         NULL, NULL, NULL, '{}'),
  ('aihl-cocuk-gelisimi-egitimi',               'AIHL Çocuk Gelişimi ve Eğitimi Programı',                 NULL, NULL, NULL, '{}'),
  ('gida-teknolojisi',                          'Gıda Teknolojisi Alanı',                                  NULL, NULL, NULL, '{}'),
  ('guzellik-hizmetleri',                       'Güzellik Hizmetleri Alanı',                               NULL, NULL, NULL, '{}'),
  ('moda-tasarim-teknolojileri',                'Moda Tasarım Teknolojileri',                               NULL, NULL, NULL, '{}'),
  ('elektrik-elektronik-teknolojisi',           'Elektrik-Elektronik Teknolojisi Alanı',                   NULL, NULL, NULL, '{}'),
  ('makine-tasarim-teknolojisi',                'Makine ve Tasarım Teknolojisi Alanı',                     NULL, NULL, NULL, '{}'),
  ('metal-teknolojisi',                         'Metal Teknolojisi Alanı',                                 NULL, NULL, NULL, '{}'),
  ('mobilya-ic-mekan-tasarimi',                 'Mobilya ve İç Mekân Tasarımı Alanı',                      NULL, NULL, NULL, '{}'),
  ('motorlu-araclar-teknolojisi',               'Motorlu Araçlar Teknolojisi Alanı',                       NULL, NULL, NULL, '{}'),
  ('grafik-fotograf',                           'Grafik ve Fotoğraf Alanı',                                NULL, NULL, NULL, '{}'),
  ('hasta-yasli-hizmetleri',                    'Hasta ve Yaşlı Hizmetleri Alanı',                         NULL, NULL, NULL, '{}'),
  ('plastik-sanatlar',                          'Plastik Sanatlar Alanı',                                  NULL, NULL, NULL, '{}'),
  ('adalet',                                    'Adalet Alanı',                                            NULL, NULL, NULL, '{}'),
  ('konaklama-seyahat-hizmetleri',              'Konaklama ve Seyahat Hizmetleri Alanı',                   NULL, NULL, NULL, '{}'),
  ('tarim',                                     'Tarım Alanı',                                             NULL, NULL, NULL, '{}'),
  ('kimya-teknolojisi',                         'Kimya Teknolojisi Alanı',                                 NULL, NULL, NULL, '{}'),
  ('tesisat-teknolojisi-iklimlendirme',         'Tesisat Teknolojisi ve İklimlendirme Alanı',              NULL, NULL, NULL, '{}'),
  ('spor',                                      'Spor Alanı',                                              NULL, NULL, NULL, '{}'),
  ('gorsel-sanatlar',                           'Görsel Sanatlar Alanı',                                   NULL, NULL, NULL, '{}'),
  ('muzik',                                     'Müzik Alanı',                                             NULL, NULL, NULL, '{}'),
  ('insaat-teknolojisi',                        'İnşaat Teknolojisi Alanı',                                NULL, NULL, NULL, '{}'),
  ('harita-tapu-kadastro',                      'Harita-Tapu-Kadastro Alanı',                              NULL, NULL, NULL, '{}'),
  ('endustriyel-otomasyon-teknolojileri',       'Endüstriyel Otomasyon Teknolojileri Alanı',               NULL, NULL, NULL, '{}'),
  ('yenilenebilir-enerji-teknolojileri',        'Yenilenebilir Enerji Teknolojileri Alanı',                NULL, NULL, NULL, '{}'),
  ('biyomedikal-cihaz-teknolojileri',           'Biyomedikal Cihaz Teknolojileri Alanı',                   NULL, NULL, NULL, '{}'),
  ('fen-bilimleri',                             'Fen Bilimleri Alanı',                                     NULL, NULL, NULL, '{}'),
  ('hafif-duzey-zihinsel',                      'Hafif Düzeyde Zihinsel',                                  NULL, NULL, NULL, '{}'),
  ('hafif-otistik',                             'Hafif Otistik',                                           NULL, NULL, NULL, '{}'),
  ('orta-agir-otistik',                         'Orta Ağır Otistik',                                       NULL, NULL, NULL, '{}'),
  ('orta-agir-zihinsel',                        'Orta Ağır Zihinsel',                                      NULL, NULL, NULL, '{}')
ON CONFLICT (slug) DO NOTHING;


-- ───────────────────────────────────────────────────────────────────
-- 2. Meslek Dalları (vocational_branches)
--    vocational_field_id — slug üzerinden subquery ile bulunur
-- ───────────────────────────────────────────────────────────────────

-- Bilişim Teknolojileri
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('Ağ İşletmenliği'),
  ('Yazılım Geliştirme'),
  ('Ağ İşletmenliği ve Siber Güvenlik'),
  ('Web Programcılığı')
) AS t(dal)
WHERE slug = 'bilisim-teknolojileri'
ON CONFLICT (vocational_field_id, name) DO NOTHING;

-- Sağlık Hizmetleri
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('Sağlık Bakım Teknisyenliği'),
  ('Ebe Yardımcılığı'),
  ('Hemşire Yardımcılığı')
) AS t(dal)
WHERE slug = 'saglik-hizmetleri'
ON CONFLICT (vocational_field_id, name) DO NOTHING;

-- Yiyecek İçecek Hizmetleri
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('Yiyecek İçecek Hizmetleri'),
  ('Mutfak ve Servis')
) AS t(dal)
WHERE slug = 'yiyecek-icecek-hizmetleri'
ON CONFLICT (vocational_field_id, name) DO NOTHING;

-- Denizcilik
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('Gemi Makineleri İşletme'),
  ('Güverte İşletme')
) AS t(dal)
WHERE slug = 'denizcilik'
ON CONFLICT (vocational_field_id, name) DO NOTHING;

-- Gemi Yapımı
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('Yat İnşa')
) AS t(dal)
WHERE slug = 'gemi-yapimi'
ON CONFLICT (vocational_field_id, name) DO NOTHING;

-- Muhasebe ve Finansman
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('Muhasebe'),
  ('Sigortacılık')
) AS t(dal)
WHERE slug = 'muhasebe-finansman'
ON CONFLICT (vocational_field_id, name) DO NOTHING;

-- Pazarlama ve Perakende
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('Satış Danışmanlığı')
) AS t(dal)
WHERE slug = 'pazarlama-perakende'
ON CONFLICT (vocational_field_id, name) DO NOTHING;

-- Ulaştırma Hizmetleri
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('Lojistik')
) AS t(dal)
WHERE slug = 'ulastirma-hizmetleri'
ON CONFLICT (vocational_field_id, name) DO NOTHING;

-- Büro Yönetimi ve Yönetici Asistanlığı
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('Büro Yönetimi ve Yönetici Asistanlığı'),
  ('Dış Ticaret')
) AS t(dal)
WHERE slug = 'buro-yonetimi-yonetici-asistanligi'
ON CONFLICT (vocational_field_id, name) DO NOTHING;

-- Çocuk Gelişimi ve Eğitimi
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('Erken Çocukluk ve Özel Eğitim')
) AS t(dal)
WHERE slug = 'cocuk-gelisimi-egitimi'
ON CONFLICT (vocational_field_id, name) DO NOTHING;

-- AIHL Çocuk Gelişimi ve Eğitimi
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('Erken Çocukluk ve Özel Eğitim')
) AS t(dal)
WHERE slug = 'aihl-cocuk-gelisimi-egitimi'
ON CONFLICT (vocational_field_id, name) DO NOTHING;

-- Gıda Teknolojisi
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('Gıda Teknolojisi')
) AS t(dal)
WHERE slug = 'gida-teknolojisi'
ON CONFLICT (vocational_field_id, name) DO NOTHING;

-- Güzellik Hizmetleri
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('Güzellik Hizmetleri')
) AS t(dal)
WHERE slug = 'guzellik-hizmetleri'
ON CONFLICT (vocational_field_id, name) DO NOTHING;

-- Moda Tasarım Teknolojileri
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('Giysi Kalıp Tasarımı ve Üretimi')
) AS t(dal)
WHERE slug = 'moda-tasarim-teknolojileri'
ON CONFLICT (vocational_field_id, name) DO NOTHING;

-- Elektrik-Elektronik Teknolojisi
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('Elektrik Tesisatları ve Dağıtımı'),
  ('Elektrikli Cihazlar Teknik Servisi'),
  ('Elektronik ve Haberleşme'),
  ('Elektrik Tesisatları ve Pano Montörlüğü'),
  ('Savunma Elektronik Sistemleri')
) AS t(dal)
WHERE slug = 'elektrik-elektronik-teknolojisi'
ON CONFLICT (vocational_field_id, name) DO NOTHING;

-- Makine ve Tasarım Teknolojisi
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('Endüstriyel Bakım Onarım'),
  ('Bilgisayarlı Makine İmalatı'),
  ('Makine Bakım Onarım'),
  ('Endüstriyel Ürünler Tasarımı')
) AS t(dal)
WHERE slug = 'makine-tasarim-teknolojisi'
ON CONFLICT (vocational_field_id, name) DO NOTHING;

-- Metal Teknolojisi
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('Kaynakçılık'),
  ('Metal Doğrama'),
  ('Savunma Mekanik Sistemleri')
) AS t(dal)
WHERE slug = 'metal-teknolojisi'
ON CONFLICT (vocational_field_id, name) DO NOTHING;

-- Mobilya ve İç Mekân Tasarımı
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('Mobilya Üretim Teknolojisi'),
  ('Mobilya İç Mekan Ressamlığı'),
  ('İç Mekân ve Mobilya Teknolojisi'),
  ('Mobilya Süsleme Sanatları')
) AS t(dal)
WHERE slug = 'mobilya-ic-mekan-tasarimi'
ON CONFLICT (vocational_field_id, name) DO NOTHING;

-- Motorlu Araçlar Teknolojisi
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('Otomotiv Mekanikerliği'),
  ('Otomotiv Elektromekanik'),
  ('Otomotiv Gövde')
) AS t(dal)
WHERE slug = 'motorlu-araclar-teknolojisi'
ON CONFLICT (vocational_field_id, name) DO NOTHING;

-- Grafik ve Fotoğraf
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('Grafik'),
  ('Gazetecilik')
) AS t(dal)
WHERE slug = 'grafik-fotograf'
ON CONFLICT (vocational_field_id, name) DO NOTHING;

-- Hasta ve Yaşlı Hizmetleri
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('Hasta ve Yaşlı Bakımı')
) AS t(dal)
WHERE slug = 'hasta-yasli-hizmetleri'
ON CONFLICT (vocational_field_id, name) DO NOTHING;

-- Plastik Sanatlar
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('Plastik Sanatlar')
) AS t(dal)
WHERE slug = 'plastik-sanatlar'
ON CONFLICT (vocational_field_id, name) DO NOTHING;

-- Adalet
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('Zabıt Kâtipliği')
) AS t(dal)
WHERE slug = 'adalet'
ON CONFLICT (vocational_field_id, name) DO NOTHING;

-- Konaklama ve Seyahat Hizmetleri
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('Konaklama Hizmetleri'),
  ('Seyahat Acenteciliği')
) AS t(dal)
WHERE slug = 'konaklama-seyahat-hizmetleri'
ON CONFLICT (vocational_field_id, name) DO NOTHING;

-- Tarım
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('Süs Bitkileri ve Peyzaj'),
  ('Bahçe Bitkileri'),
  ('Tarım')
) AS t(dal)
WHERE slug = 'tarim'
ON CONFLICT (vocational_field_id, name) DO NOTHING;

-- Kimya Teknolojisi
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('Kimya Laboratuvarı'),
  ('Proses')
) AS t(dal)
WHERE slug = 'kimya-teknolojisi'
ON CONFLICT (vocational_field_id, name) DO NOTHING;

-- Tesisat Teknolojisi ve İklimlendirme
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('Tesisat ve Enerji Sistemleri'),
  ('Soğutma ve İklimlendirme Sistemleri')
) AS t(dal)
WHERE slug = 'tesisat-teknolojisi-iklimlendirme'
ON CONFLICT (vocational_field_id, name) DO NOTHING;

-- Spor
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('Atletizm')
) AS t(dal)
WHERE slug = 'spor'
ON CONFLICT (vocational_field_id, name) DO NOTHING;

-- Görsel Sanatlar
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('Dekoratif El Sanatları')
) AS t(dal)
WHERE slug = 'gorsel-sanatlar'
ON CONFLICT (vocational_field_id, name) DO NOTHING;

-- Müzik
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('Bale Alanı (Bale Anasanat Dalı)'),
  ('Bestecilik ve Orkestra Şefliği'),
  ('Piyano (Gitar Sanat Dalı)'),
  ('Piyano (Piyano Sanat Dalı)'),
  ('Üfleme ve Vurma Çalgılar'),
  ('Yaylı Çalgılar'),
  ('Piyano (Arp Sanat Dalı)')
) AS t(dal)
WHERE slug = 'muzik'
ON CONFLICT (vocational_field_id, name) DO NOTHING;

-- İnşaat Teknolojisi
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('İnşaat Altyapı'),
  ('İnşaat Üstyapı'),
  ('Yapı Yüzey Kaplama ve Yalıtım'),
  ('Yapı Dekorasyon'),
  ('Mimari Yapı Teknik Ressamlığı')
) AS t(dal)
WHERE slug = 'insaat-teknolojisi'
ON CONFLICT (vocational_field_id, name) DO NOTHING;

-- Harita-Tapu-Kadastro
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('Harita Kadastro')
) AS t(dal)
WHERE slug = 'harita-tapu-kadastro'
ON CONFLICT (vocational_field_id, name) DO NOTHING;

-- Endüstriyel Otomasyon Teknolojileri
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('Endüstriyel Otomasyon Teknolojileri')
) AS t(dal)
WHERE slug = 'endustriyel-otomasyon-teknolojileri'
ON CONFLICT (vocational_field_id, name) DO NOTHING;

-- Yenilenebilir Enerji Teknolojileri
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('Yenilenebilir Enerji Teknolojileri')
) AS t(dal)
WHERE slug = 'yenilenebilir-enerji-teknolojileri'
ON CONFLICT (vocational_field_id, name) DO NOTHING;

-- Biyomedikal Cihaz Teknolojileri
INSERT INTO public.vocational_branches (vocational_field_id, name)
SELECT id, dal FROM public.vocational_fields
CROSS JOIN (VALUES
  ('Tıbbi Laboratuvar ve Hasta Dışı Uygulama Cihazları')
) AS t(dal)
WHERE slug = 'biyomedikal-cihaz-teknolojileri'
ON CONFLICT (vocational_field_id, name) DO NOTHING;
