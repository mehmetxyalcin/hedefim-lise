-- LGS puanlarını virgülden sonra dört hane hassasiyetle sakla.
-- numeric(7,4), 500.0000 gibi geçerli LGS puanlarını destekler.
ALTER TABLE public.school_scores
  ALTER COLUMN lgs_score TYPE numeric(7,4);
