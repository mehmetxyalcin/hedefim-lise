-- Blog yazıları: yönetim panelinden yazılır, ziyaretçi yalnız yayın tarihi
-- gelmiş yayındaki yazıları görür. Kapak görselleri mevcut site-assets
-- bucket'ında (blog/ klasörü) durur; ek storage politikası gerekmez.
-- Uygulama yayınından ÖNCE uygulanır; tablo yoksa blog boş durum gösterir.

BEGIN;

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             text        NOT NULL UNIQUE
                               CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) <= 120),
  title            text        NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 200),
  excerpt          text        NOT NULL CHECK (char_length(btrim(excerpt)) BETWEEN 1 AND 300),
  body             text        NOT NULL,
  category         text        NOT NULL DEFAULT 'Genel' CHECK (char_length(btrim(category)) BETWEEN 1 AND 60),
  highlight        text        CHECK (highlight IS NULL OR char_length(highlight) <= 24),
  cover_image_url  text,
  cover_image_alt  text,
  author_name      text        NOT NULL DEFAULT 'Hedefim Lise',
  is_published     boolean     NOT NULL DEFAULT false,
  published_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blog_posts_published_has_date CHECK (NOT is_published OR published_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS blog_posts_public_idx
  ON public.blog_posts (published_at DESC)
  WHERE is_published;

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_blog_posts" ON public.blog_posts;
DROP POLICY IF EXISTS "admin_all_blog_posts" ON public.blog_posts;

-- İleri tarihli yazı, tarihi gelene kadar ziyaretçiye görünmez.
CREATE POLICY "public_read_published_blog_posts"
  ON public.blog_posts FOR SELECT
  USING (is_published AND published_at <= now());

CREATE POLICY "admin_all_blog_posts"
  ON public.blog_posts FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  ));

-- Başlangıç içeriği: iki TASLAK. Bilgiler 010_faqs.sql'deki 2026 kılavuz
-- kayıtlarından ve sitenin puan gösterme kuralından (school-scores.ts) gelir.
-- Yayına almadan önce yönetim panelinden okunup onaylanmalıdır.
INSERT INTO public.blog_posts (slug, title, excerpt, category, highlight, body)
VALUES
(
  'yerel-yerlestirme-nasil-isler',
  'Yerel yerleştirme nasıl işler?',
  'Sınavsız okullara yerleştirmede kayıt alanı, OBP ve devamsızlık nasıl sıralanır; beş tercihin üçü neden kayıt alanından olmalı? Kısa ve sade bir özet.',
  'Yerleştirme',
  '5 tercih',
  $body$
Merkezî sınava girmiş olsanız da girmemiş olsanız da tercih süreci aynı kapıdan başlar: **yerel yerleştirme**. Bu yazıda yerel yerleştirmenin kurallarını, öncelik sırasını ve tercih ekranındaki renklerin ne anlama geldiğini adım adım anlatıyoruz.

## Neden önce yerel tercih?

Merkezî sınav puanı olan öğrenciler dâhil bütün öğrenciler önce yerel yerleştirmeyle öğrenci alan okullardan tercih yapmalıdır. Yerel tercih yapılmazsa merkezî sınavla öğrenci alan okulların ve pansiyonlu okulların tercih ekranı açılmaz.

> [!önemli]
> LGS puanınız yüksek olsa bile yerel tercih adımını atlamayın. Bu adım, diğer tercih ekranlarını açan adımdır.

## Beş tercihin kuralları

Yerel yerleştirmede en fazla **5 okul** tercih edilebilir. Bu tercihlerle ilgili iki sınır vardır:

1. İlk 3 okul, öğrencinin **kayıt alanındaki** okullardan olmalıdır.
2. Aynı okul türünden (Anadolu lisesi, mesleki ve teknik Anadolu lisesi veya Anadolu imam hatip lisesi) en fazla 3 okul seçilebilir.

## Ekrandaki renkler ne anlatıyor?

Tercih ekranında okullar üç renkle gösterilir:

| Renk | Anlamı |
| --- | --- |
| Yeşil | Öğrencinin kendi kayıt alanındaki okullar |
| Mavi | Komşu kayıt alanındaki okullar |
| Kırmızı | Kayıt ve komşu kayıt alanı dışındaki il içi veya il dışı okullar |

## Öncelik sırası

Yerel yerleştirmede sıralama puanla başlamaz. Değerlendirme şu sırayla yapılır:

1. İkamet adresine göre **kayıt alanı** önceliği
2. **Okul başarı puanı (OBP)** üstünlüğü
3. 8. sınıftaki özürsüz devamsızlık gününün azlığı

Eşitlik devam ederse 8, 7 ve 6. sınıf yıl sonu başarı puanlarına sırasıyla bakılır.

## Tercihten sonra

Yapılan tercihler mutlaka ilgili ortaokul müdürlüğüne onaylatılmalıdır. Yerleştirme sonrasında okul kaydı, açık liseler ve yetenek sınavıyla öğrenci alan okullar dışında sistem tarafından otomatik yapılır.

> [!ipucu]
> Okul listesinde "Yerel" seçeneğini işaretlediğinizde okulların son yıl ==OBP taban değerlerini== görürsünüz. Bu değerler bir önceki yerleştirmenin sonucudur; bu yıl için garanti değildir.

Bu yazıdaki bilgiler 2026 Yılı Ortaöğretime Geçiş Tercih ve Yerleştirme Kılavuzu esas alınarak hazırlanmıştır. Tercih döneminde güncel MEB ve e-Okul duyurularını da takip edin.
$body$
),
(
  'yuzdelik-dilim-ve-obp-nasil-okunur',
  'Yüzdelik dilim ve OBP: Okul listesindeki puanlar nasıl okunur?',
  'Merkezî yerleştirmede yüzdelik dilim, yerel yerleştirmede OBP belirleyicidir. Listede gördüğünüz değerlerin ne anlattığını ve ne anlatmadığını açıklıyoruz.',
  'Tercih İşlemleri',
  'OBP',
  $body$
Okul listesinde her okulun yanında bir sayı görürsünüz. Bu sayının ne olduğu, okulun öğrenciyi **nasıl** aldığına bağlıdır. Bu yazı, o sayıyı doğru okumanıza yardımcı olmak için hazırlandı.

## İki yerleştirme, iki ölçü

Liselere iki yolla yerleşilir ve her yolun kendi ölçüsü vardır:

- **Merkezî yerleştirme:** Sınavla öğrenci alan okullar. Yerleştirme, merkezî sınav puanı üstünlüğü ve tercih sırasına göre yapılır. Listede bu okullar için ==yüzdelik dilim== gösterilir.
- **Yerel yerleştirme:** Sınavsız okullar. Kayıt alanı önceliğinden sonra ==OBP== (Ortaöğretim Başarı Puanı) belirleyicidir. Listede bu okullar için OBP gösterilir.

Bazı okullar iki yolla da öğrenci alır. Bu okullarda listede iki satır görürsünüz: biri merkezî yüzdelik dilim, diğeri yerel OBP.

## Yüzdelik dilim nasıl okunur?

Yüzdelik dilim, öğrencinin sınava giren bütün öğrenciler arasındaki yerini yüzde olarak gösterir. **Küçük sayı daha üst sıradır:** %1'lik dilim, sınava girenlerin en başarılı yüzde birlik kesimi demektir.

Listede bir okul için gördüğünüz yüzdelik dilim, o okula geçen yıl yerleşen son öğrencinin dilimidir; buna taban dilim de denir. Okulun birden fazla alanı ya da programı varsa listede en kolay ulaşılanın değeri yer alır, ayrıntılar okulun sayfasındadır. Kendi yüzdelik diliminiz bu sayıdan küçükse okul, geçen yılın sonuçlarına göre ulaşılabilir görünür.

## OBP nasıl okunur?

OBP, ortaokul yıl sonu başarı puanlarından hesaplanır ve 100 üzerinden değerlendirilir. Yerel yerleştirmede listede gördüğünüz değer, okula geçen yıl yerleşen öğrencilerin en düşük OBP'sidir. **Büyük sayı daha yüksek puandır.**

> [!dikkat]
> Listedeki değerler bir önceki yerleştirmenin sonucudur. Kontenjanlar, tercih eden öğrenci sayısı ve başarı dağılımı her yıl değişir; bu sayılar bu yıl için garanti değildir.

## Dengeli bir liste kurmak

Merkezî yerleştirmede en fazla 10 okul tercih edilebilir. Listeyi yalnızca ulaşılması zor okullarla doldurmak yerine şöyle bir denge kurmak işe yarar:

1. Geçen yılın değerlerine göre biraz zorlayıcı birkaç okul
2. Değerleri sizin puanınıza yakın okullar
3. Rahatça yerleşebileceğiniz, gerçekten gitmek isteyeceğiniz birkaç okul

Tercih sırası önemlidir. En çok istediğiniz okulu, ulaşma ihtimaliniz daha düşük olsa da, listenin başına yazın.

Okul listesinde **Merkezi** ya da **Yerel** seçeneğini işaretleyerek okulları bu değerlere göre süzebilir ve sıralayabilirsiniz. Beğendiğiniz okulları Tercihlerim listesine ekleyip sıralamasını orada da deneyebilirsiniz.
$body$
)
ON CONFLICT (slug) DO NOTHING;

-- Üst menüye Blog bağlantısı (görünür). Aynı href zaten varsa ekleme.
INSERT INTO public.navigation_items (label, href, order_index, is_visible, target)
SELECT 'Blog', '/blog', COALESCE(MAX(order_index), -1) + 1, true, '_self'
FROM public.navigation_items
HAVING NOT EXISTS (SELECT 1 FROM public.navigation_items WHERE href = '/blog');

COMMIT;
