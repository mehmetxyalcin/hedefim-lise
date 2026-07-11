-- İstatistikler ve Soru-Cevap bağlantılarını yönetilebilir menüye ekle.
-- Aynı href zaten varsa yeniden ekleme.
INSERT INTO public.navigation_items
  (label, href, order_index, is_visible, target)
SELECT
  'İstatistikler',
  '/istatistikler',
  COALESCE(MAX(order_index), -1) + 1,
  true,
  '_self'
FROM public.navigation_items
HAVING NOT EXISTS (
  SELECT 1 FROM public.navigation_items WHERE href = '/istatistikler'
);

INSERT INTO public.navigation_items
  (label, href, order_index, is_visible, target)
SELECT
  'Soru-Cevap',
  '/soru-cevap',
  COALESCE(MAX(order_index), -1) + 1,
  true,
  '_self'
FROM public.navigation_items
HAVING NOT EXISTS (
  SELECT 1 FROM public.navigation_items WHERE href = '/soru-cevap'
);
