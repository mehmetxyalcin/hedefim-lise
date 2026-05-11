-- schools tablosuna iletişim alanları ekle (zaten varsa atla)
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS phone   text,
  ADD COLUMN IF NOT EXISTS website text;
