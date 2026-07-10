-- 2026 tercih kılavuzu soru-cevap içerikleri
CREATE TABLE IF NOT EXISTS public.faqs (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  question       text        NOT NULL,
  answer         text        NOT NULL,
  category       text        NOT NULL DEFAULT 'Genel',
  sort_order     integer     NOT NULL DEFAULT 0,
  is_published   boolean     NOT NULL DEFAULT true,
  source_title   text,
  source_page    integer     CHECK (source_page IS NULL OR source_page > 0),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS faqs_published_sort_idx
  ON public.faqs (is_published, sort_order, created_at);

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_faqs" ON public.faqs;
DROP POLICY IF EXISTS "admin_write_faqs" ON public.faqs;

CREATE POLICY "public_read_published_faqs"
  ON public.faqs FOR SELECT
  USING (is_published = true);

CREATE POLICY "admin_write_faqs"
  ON public.faqs FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));

INSERT INTO public.faqs
  (question, answer, category, sort_order, source_title, source_page)
VALUES
  (
    '2026 lise tercihleri ne zaman yapılacak?',
    'Tercihler 13-27 Temmuz 2026 tarihleri arasında alınacaktır. Son başvuru 27 Temmuz 2026 saat 17.00''dir.',
    'Tercih İşlemleri',
    10,
    '2026 Yılı Ortaöğretime Geçiş Tercih ve Yerleştirme Kılavuzu',
    6
  ),
  (
    'Tercihler nereden ve nasıl yapılabilir?',
    'Tercihler öğrenci ve velisi tarafından e-Okul üzerinden bireysel olarak veya herhangi bir resmî ortaokul, meslek ortaokulu ya da imam hatip ortaokulu müdürlüğünden yapılabilir. Yapılan tercihler mutlaka ilgili ortaokul müdürlüğüne onaylatılmalıdır.',
    'Tercih İşlemleri',
    20,
    '2026 Yılı Ortaöğretime Geçiş Tercih ve Yerleştirme Kılavuzu',
    6
  ),
  (
    'Liseye tercih başvurusu yapabilmek için genel şartlar nelerdir?',
    'Öğrencinin 2025-2026 eğitim öğretim yılında 8. sınıfı başarıyla tamamlamış veya Açık Öğretim Ortaokulundan mezun durumda olması gerekir. Sınavla öğrenci alan okullar için merkezî sınav puanı bulunmalı ve tercih edilecek okulun kayıt-kabul şartları taşınmalıdır.',
    'Tercih İşlemleri',
    30,
    '2026 Yılı Ortaöğretime Geçiş Tercih ve Yerleştirme Kılavuzu',
    6
  ),
  (
    'LGS puanı olan öğrenciler de yerel yerleştirme tercihi yapmak zorunda mı?',
    'Evet. Merkezî sınav puanına sahip öğrenciler dâhil tüm öğrenciler önce yerel yerleştirme ile öğrenci alan okul tercihinde bulunmalıdır. Yerel tercih yapılmazsa merkezî sınavla öğrenci alan okullar ve pansiyonlu okullar tercih ekranı açılmaz.',
    'Tercih İşlemleri',
    40,
    '2026 Yılı Ortaöğretime Geçiş Tercih ve Yerleştirme Kılavuzu',
    6
  ),
  (
    'Öğrenciler hangi tercih gruplarından seçim yapabilir?',
    'Merkezî sınava giren öğrenciler; merkezî sınavla öğrenci alan okullar, yerel yerleştirme ile öğrenci alan okullar ve pansiyonlu okullar olmak üzere üç grupta tercih yapabilir. Merkezî sınava girmeyen öğrenciler ise yerel yerleştirme ve pansiyonlu okullar gruplarından tercih yapabilir.',
    'Tercih İşlemleri',
    50,
    '2026 Yılı Ortaöğretime Geçiş Tercih ve Yerleştirme Kılavuzu',
    7
  ),
  (
    'En fazla kaç okul tercih edilebilir?',
    'Yerel yerleştirmede en fazla 5, merkezî sınavla öğrenci alan okullarda en fazla 10 ve pansiyonlu okullarda en fazla 5 okul tercih edilebilir. Böylece şartları sağlayan bir öğrenci toplamda en fazla 20 okul seçebilir.',
    'Tercih İşlemleri',
    60,
    '2026 Yılı Ortaöğretime Geçiş Tercih ve Yerleştirme Kılavuzu',
    7
  ),
  (
    'Yerel yerleştirme tercihlerinde hangi sınırlamalar var?',
    'En fazla 5 okul seçilebilir ve ilk 3 okulun öğrencinin kayıt alanından olması gerekir. Aynı okul türünden - Anadolu lisesi, mesleki ve teknik Anadolu lisesi veya Anadolu imam hatip lisesi - en fazla 3 okul tercih edilebilir.',
    'Tercih İşlemleri',
    70,
    '2026 Yılı Ortaöğretime Geçiş Tercih ve Yerleştirme Kılavuzu',
    7
  ),
  (
    'Yerel tercih ekranındaki yeşil, mavi ve kırmızı renkler ne anlama gelir?',
    'Yeşil renk öğrencinin kendi kayıt alanındaki okulları, mavi renk komşu kayıt alanındaki okulları, kırmızı renk ise öğrencinin kayıt ve komşu kayıt alanında bulunmayan il içi veya il dışı diğer okulları gösterir.',
    'Tercih İşlemleri',
    80,
    '2026 Yılı Ortaöğretime Geçiş Tercih ve Yerleştirme Kılavuzu',
    7
  ),
  (
    'Onaylanan tercihler düzeltilebilir veya iptal edilebilir mi?',
    'Düzeltmeler öncelikle elektronik onaydan önce yapılmalıdır. Onaydan sonra düzeltme veya iptal için tercih takviminde belirtilen süre içinde ilgili ortaokul müdürlüğüne başvurulabilir. Başvuru durumu “İptal” görünen öğrenciler yerleştirmeye alınmaz.',
    'Tercih İşlemleri',
    90,
    '2026 Yılı Ortaöğretime Geçiş Tercih ve Yerleştirme Kılavuzu',
    8
  ),
  (
    '2026 yerleştirme sonuçları ne zaman açıklanacak?',
    'Yerleştirme sonuçları ve boş kontenjanlar 5 Ağustos 2026 tarihinde MEB internet adresinde ilan edilecektir. Sonuç bilgisinde öğrencinin kaydının yapıldığı okul yer alacaktır.',
    'Yerleştirme',
    100,
    '2026 Yılı Ortaöğretime Geçiş Tercih ve Yerleştirme Kılavuzu',
    9
  ),
  (
    'Merkezî yerleştirme hangi ölçüte göre yapılır?',
    'Sınavla öğrenci alan okulların kontenjanlarına, öğrencilerin merkezî sınav puanı üstünlüğü ve tercih sırası doğrultusunda yerleştirme yapılır.',
    'Yerleştirme',
    110,
    '2026 Yılı Ortaöğretime Geçiş Tercih ve Yerleştirme Kılavuzu',
    9
  ),
  (
    'Merkezî sınav puanları eşitse hangi öğrenci öncelikli olur?',
    'Puan eşitliğinde sırasıyla OBP üstünlüğü; 8, 7 ve 6. sınıf yıl sonu başarı puanları; 8. sınıftaki özürsüz devamsızlık gününün azlığı; tercih önceliği ve doğum tarihine göre yaşı küçük olan öğrenci dikkate alınır.',
    'Yerleştirme',
    120,
    '2026 Yılı Ortaöğretime Geçiş Tercih ve Yerleştirme Kılavuzu',
    9
  ),
  (
    'Yerel yerleştirmede öncelik sırası nasıldır?',
    'Önce öğrencinin ikamet adresine göre kayıt alanı, ardından okul başarı puanı üstünlüğü ve 8. sınıftaki özürsüz devamsızlık gününün azlığı değerlendirilir. Eşitlik hâlinde sırasıyla 8, 7 ve 6. sınıf yıl sonu başarı puanlarına bakılır.',
    'Yerleştirme',
    130,
    '2026 Yılı Ortaöğretime Geçiş Tercih ve Yerleştirme Kılavuzu',
    10
  ),
  (
    'Yerleşen öğrencinin lise kaydı otomatik yapılır mı?',
    'Evet. Açık liseler ve yetenek sınavıyla öğrenci alan okullar hariç olmak üzere yerleştirme sonucunda öğrencilerin okul kayıtları sistem tarafından otomatik yapılır.',
    'Yerleştirme',
    140,
    '2026 Yılı Ortaöğretime Geçiş Tercih ve Yerleştirme Kılavuzu',
    9
  ),
  (
    '2026 nakil tercihleri ve sonuç tarihleri ne zaman?',
    'Birinci nakil tercihleri 5-7 Ağustos 2026, sonuçları 10 Ağustos 2026; ikinci nakil tercihleri 10-12 Ağustos 2026, sonuçları ise 14 Ağustos 2026 tarihindedir. Başvurular ilgili son gün saat 17.00''ye kadar yapılabilir.',
    'Nakil İşlemleri',
    150,
    '2026 Yılı Ortaöğretime Geçiş Tercih ve Yerleştirme Kılavuzu',
    8
  ),
  (
    'Nakil döneminde en fazla kaç okul tercih edilebilir?',
    'Her nakil döneminde merkezî sınavla öğrenci alan okullar, yerel yerleştirme ile öğrenci alan okullar ve pansiyonlu okulların her birinden en fazla 3 okul tercih edilebilir. Nakil tercihi, okulun boş kontenjanına bakılmaksızın yapılabilir.',
    'Nakil İşlemleri',
    160,
    '2026 Yılı Ortaöğretime Geçiş Tercih ve Yerleştirme Kılavuzu',
    8
  ),
  (
    'İlk yerleştirmede tercih yapmayan öğrenci nakil başvurusu yapabilir mi?',
    'Evet. İlk yerleştirme için tercih başvurusu yapmayan öğrenciler de yerleştirmeye esas nakil dönemlerinde tercihte bulunabilir.',
    'Nakil İşlemleri',
    170,
    '2026 Yılı Ortaöğretime Geçiş Tercih ve Yerleştirme Kılavuzu',
    8
  ),
  (
    'Özel okul veya yetenek sınavıyla öğrenci alan bir okula kayıt yaptıran öğrenci tercih yapabilir mi?',
    'Bu okullara kesin kayıt yaptıran öğrenciler tercih yapamaz. Aday kayıt, ön kayıt veya kesin kayıt öncesinde yapılmış tercihler de Bakanlık tarafından iptal edilir. Öğrenci tercih süresi içinde kaydını iptal ettirirse yeniden tercih yapabilir.',
    'Özel Durumlar',
    180,
    '2026 Yılı Ortaöğretime Geçiş Tercih ve Yerleştirme Kılavuzu',
    5
  ),
  (
    'Hiçbir okula yerleşemeyen öğrenciler ne yapmalı?',
    'Öğrenciler 17-26 Ağustos 2026 tarihleri arasında il veya ilçe öğrenci yerleştirme ve nakil komisyonuna başvurabilir. Komisyon yerleştirmeleri, ikinci nakil sonunda boş kontenjanı kalan okullar için 28 Ağustos 2026 tarihinde tamamlanır.',
    'Özel Durumlar',
    190,
    '2026 Yılı Ortaöğretime Geçiş Tercih ve Yerleştirme Kılavuzu',
    9
  ),
  (
    'Yatılılık başvuruları ne zaman ve nasıl yapılır?',
    'Yatılı okumak isteyen öğrenciler 31 Ağustos-3 Eylül 2026 tarihleri arasında saat 17.00''ye kadar pansiyonlu okul müdürlüğüne veya pansiyonu olmayan okullar için İl/İlçe Yatılılık ve Bursluluk Komisyonuna başvurabilir. Başvuru e-Okul üzerinden de yapılabilir. Sonuçlar 4 Eylül 2026 tarihinde ilan edilir.',
    'Pansiyon ve Kayıt',
    200,
    '2026 Yılı Ortaöğretime Geçiş Tercih ve Yerleştirme Kılavuzu',
    13
  ),
  (
    'Denizcilik alanını tercih edecek öğrencilerden sağlık raporu istenir mi?',
    'Evet. Denizcilik alanı bulunan okullar için yetkili sağlık kuruluşlarından “Gemiadamı Olur Sağlık Raporu” alınması gerekir. Asıl kazanan adaylar raporu 14 Ağustos 2026 tarihine kadar kayıt hakkı kazandıkları okul müdürlüğüne teslim etmelidir.',
    'Özel Durumlar',
    210,
    '2026 Yılı Ortaöğretime Geçiş Tercih ve Yerleştirme Kılavuzu',
    12
  ),
  (
    'Mesleki eğitim merkezine yerleşen öğrenci ne zaman iş yeriyle sözleşme yapmalıdır?',
    'Öğrenci, çıraklık eğitimine başlayacağı iş yeriyle yerleştirildiği tarihten itibaren en geç 2 ay içinde sözleşme imzalamalıdır. Sözleşme imzalamayan öğrencinin kaydı silinir ve öğrenci il/ilçe yerleştirme ve nakil komisyonuna yönlendirilir.',
    'Özel Durumlar',
    220,
    '2026 Yılı Ortaöğretime Geçiş Tercih ve Yerleştirme Kılavuzu',
    13
  );
