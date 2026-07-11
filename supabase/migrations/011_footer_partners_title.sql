-- Footer'daki paydaşlar bölüm başlığını yönetilebilir yap.
ALTER TABLE public.footer_settings
  ADD COLUMN IF NOT EXISTS partners_title text NOT NULL DEFAULT 'Proje Paydaşları';
