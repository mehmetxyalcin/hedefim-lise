-- Blog yazarları: her yazarın bir profil sayfası (/blog/yazar/<slug>) olur.
-- İletişim alanlarının hepsi isteğe bağlıdır; doldurulan bilgi herkese açıktır.
-- blog_posts.author_name imza olarak kalır: yazarsız yazılarda "Hedefim Lise",
-- yazarlı yazılarda yazarın adı (yazar silinirse bağlantısız düz imza olur).

BEGIN;

CREATE TABLE IF NOT EXISTS public.blog_authors (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           text        NOT NULL UNIQUE
                             CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) <= 120),
  name           text        NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
  title          text        CHECK (title IS NULL OR char_length(title) <= 160),
  bio            text        CHECK (bio IS NULL OR char_length(bio) <= 5000),
  photo_url      text,
  email          text        CHECK (email IS NULL OR email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  phone          text        CHECK (phone IS NULL OR char_length(phone) <= 30),
  website_url    text        CHECK (website_url IS NULL OR website_url ~ '^https?://'),
  instagram_url  text        CHECK (instagram_url IS NULL OR instagram_url ~ '^https?://'),
  x_url          text        CHECK (x_url IS NULL OR x_url ~ '^https?://'),
  linkedin_url   text        CHECK (linkedin_url IS NULL OR linkedin_url ~ '^https?://'),
  youtube_url    text        CHECK (youtube_url IS NULL OR youtube_url ~ '^https?://'),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_authors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_blog_authors" ON public.blog_authors;
DROP POLICY IF EXISTS "admin_all_blog_authors" ON public.blog_authors;

-- Profiller herkese açıktır; yalnız yönetici yazar.
CREATE POLICY "public_read_blog_authors"
  ON public.blog_authors FOR SELECT
  USING (true);

CREATE POLICY "admin_all_blog_authors"
  ON public.blog_authors FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  ));

-- Yazar silinirse yazıları kalır; bağlantı düşer, imza metni korunur.
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS author_id uuid REFERENCES public.blog_authors(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS blog_posts_author_idx
  ON public.blog_posts (author_id)
  WHERE author_id IS NOT NULL;

COMMIT;
