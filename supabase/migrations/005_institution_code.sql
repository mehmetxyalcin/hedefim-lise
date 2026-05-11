ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS institution_code text UNIQUE;
