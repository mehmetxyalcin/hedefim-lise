-- 2026 ÇPAL OBP'leri program bazında. Kaynak: okul_yerlestirme_puanlari_2026.xlsx
-- (23 Eylül 2026). İlk yüklemede program ayrımı olmadığından okul geneline iki
-- değerden düşüğü yazılmıştı; bu dosya o satırları program satırlarıyla değiştirir.
-- Canlı veriye özeldir (okul ID'leri); 017'den sonra, kullanıcı onayıyla uygulanır.
BEGIN;

UPDATE public.schools SET programs = '{anadolu_lisesi,meslek}'
  WHERE id IN (37, 43, 95, 96, 119, 153, 154) AND type = 'Çok Programlı Anadolu Lisesi';
UPDATE public.schools SET programs = '{anadolu_lisesi}'
  WHERE id IN (62, 120) AND type = 'Çok Programlı Anadolu Lisesi';

DELETE FROM public.school_scores
  WHERE year = 2026 AND program IS NULL AND vocational_field_id IS NULL
    AND lgs_score IS NULL AND percentile IS NULL
    AND school_id IN (37, 43, 62, 95, 96, 119, 120, 153, 154);

INSERT INTO public.school_scores (school_id, year, program, obp_score) VALUES
  (37, 2026, 'anadolu_lisesi', 72.6495), (37, 2026, 'meslek', 45.3261),
  (43, 2026, 'anadolu_lisesi', 44.2159), (43, 2026, 'meslek', 50.2711),
  (62, 2026, 'anadolu_lisesi', 51.3507),
  (95, 2026, 'anadolu_lisesi', 57.1325), (95, 2026, 'meslek', 33.2157),
  (96, 2026, 'anadolu_lisesi', 51.6263), (96, 2026, 'meslek', 54.4519),
  (119, 2026, 'anadolu_lisesi', 54.5165), (119, 2026, 'meslek', 35.8055),
  (120, 2026, 'anadolu_lisesi', 59.6626),
  (153, 2026, 'anadolu_lisesi', 53.8694), (153, 2026, 'meslek', 52.0819),
  (154, 2026, 'anadolu_lisesi', 54.6093), (154, 2026, 'meslek', 43.1147);

COMMIT;
