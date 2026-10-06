# Soru-Cevap Merkezi — tasarım

Tarih: 6 Ekim 2026. Kullanıcı isteği: soru-cevap sayfası yeni bir yapıyla yeniden kurulsun; kategorilerde panelden yüklenen hazır sorular olsun; ziyaretçiler de soru sorup yanıtını görebilsin. Kararlar Claude'a bırakıldı.

## Kararlar

1. **Kategoriler ayrı tablo** (`faq_categories`): adres (slug), başlık, kısa açıklama, sıra, yayın durumu. Panelden eklenir, sıralanır, gizlenir. İçinde soru olan kategori silinemez (FK RESTRICT); önce sorular taşınır.
2. **Hazır sorular** (`faqs`) kategoriye `category_id` ile bağlı; her sorunun kalıcı adresi (`slug`) var: `/soru-cevap/{kategori}#{soru}`. `is_featured` = hub'da "Öne çıkanlar". `origin` = `editorial` | `community` (ziyaretçi sorusundan doğduysa). Eski `category` metin kolonu uyum için duruyor; tetikleyici iki alanı senkron tutar.
3. **Ziyaretçi soruları üyeliksiz ve e-postasız.** Kullanıcıların çoğu 8. sınıf öğrencisi (reşit değil); kişisel veri toplanmaz. Soru gönderilince bir kez **takip bağlantısı** gösterilir: `/soru-cevap/takip/{64 hex}`. Anahtar tarayıcıda da saklanır (`localStorage["hedefim:sorularim"]`), hub'da "Sorduklarım" olarak listelenir. Veritabanında yalnız anahtarın SHA-256 özeti tutulur.
4. **Yanıt akışı (panel):** Gelen soru `new` → yönetici ya yanıtlar (`answered`, yanıt takip sayfasında görünür) ya da reddeder (`rejected`, isteğe bağlı açıklama notu ve "bu soru zaten yanıtlanmış" bağlantısı = `related_faq_id`). Yanıtlanan soru isteğe bağlı olarak **herkese açık soru-cevaba eklenir**: yönetici soru/yanıt metnini düzenler, kategori seçer → `faqs` satırı (`origin='community'`, `submission_id`) oluşur, `published_faq_id` bağlanır. Herkese açık bölümde bu sorular "Ziyaretçi sorusu" etiketiyle görünür; hub'da "Son yanıtlanan ziyaretçi soruları" şeridi vardır.
5. **Toplu yükleme:** `/admin/soru-cevap/toplu-yukle` — Excel/CSV (Kategori, Soru, Yanıt, Kaynak sayfa, Sıra, Öne çıkan, Yayında). Önizleme → onay. Bilinmeyen kategori önizlemede "yeni kategori oluşturulacak" diye görünür. Aynı soru (Türkçe katlanmış metin eşitliği) atlanır.
6. **Yanıt biçimi:** `lib/blog-markdown.ts` güvenli Markdown alt kümesi (paragraf, liste, kalın, bağlantı, not kutusu). Eski düz metin yanıtlar paragraf olarak okunur. HTML üretilmez.
7. **Kötüye kullanım:** bal küpü alanı, 3 sn alt süre, istemci başına saatte 3 / site geneli saatte 40 (veritabanında), telefon/e-posta yazımı reddedilir, IP saklanmaz (günlük tuzlu özet). Hiçbir ziyaretçi metni yönetici yayınlamadan herkese açık olmaz.

## Veri sözleşmesi (yazıldı, testli)

- Migration: `supabase/migrations/021_qa_center.sql` (test: `tests/qa.database.test.mjs`, PGlite).
- Tipler: `src/types/faq.ts` — `Faq`, `FaqCategory`, `QuestionSubmission`, `QuestionStatus`, eşleyiciler, `faqHref(categorySlug, faqSlug)`.
- Saf kurallar: `src/lib/qa.ts` — `foldTr`, `slugifyQuestion`, `uniqueSlug`, `indexFaqs` + `searchFaqs` (tüm terimler, kelime başı), `similarFaqs` (soru yazarken benzerleri), `highlightRanges`, `groupByCategory`, `checkSubmission`, sınır sabitleri, `MY_QUESTIONS_STORAGE_KEY`, `TOKEN_PATTERN`.
- Okuma: `src/lib/faqs.ts` — `getQaContent()` → `{ categories, faqs }` (yalnız yayında; önbellek etiketi `FAQ_CACHE_TAG = "faqs"`).
- Ziyaretçi eylemleri: `src/app/(site)/soru-cevap/actions.ts` — `submitQuestion(payload)`, `getQuestionStatus(token)`, `getQuestionStatuses(tokens)`.

## Herkese açık yüzey (`.landing` belge dünyası)

İletişim, İstatistikler ve Alanlar sayfalarıyla aynı dünya: kâğıt zemin `--doc-ground`, mürekkep, teal tek otorite rengi, vermilyon tek sıcak sinyal ("sen / burada eylem"), Archivo afiş başlıklar (`font-display`), Source Serif okuma metni, Roboto Mono küçük etiketler (`font-mono text-[11px] uppercase tracking-[0.18em]`), hairline ayrımlar, kart yığını değil künye/dizin. Ortak stiller: `src/components/school/doc-styles.ts` (`DT`, `FOCUS`, `MICRO`). Örnek sayfalar: `src/app/(site)/iletisim/page.tsx`, `src/components/statistics/StatisticsBulletin.tsx`, `src/app/(site)/alanlar/page.tsx`.

Sayfalar:

- `/soru-cevap` — Hub. Afiş başlık + tek büyük arama (sonuçlar anında, terimler vurgulu, sonuç yoksa "Sorunu bize sor" — yazılan metin forma taşınır). Altında 8/4 ızgara: solda **kategori dizini** (numaralı satırlar: başlık, açıklama, soru sayısı; satır → kategori sayfası) ve **Öne çıkanlar** (açılır yanıtlar); sağda yapışkan künye: "Sorunu sor" çağrısı, "Sorduklarım" (localStorage'dan, durumlarıyla), son yanıtlanan ziyaretçi soruları, dipnot (yanıtları rehber öğretmen ve psikolojik danışmanlar hazırlar; güncel MEB ve e-Okul duyurularına bakın).
- `/soru-cevap/[kategori]` — Kategori sayfası. Başlık + açıklama + soru sayısı; sorular açılır (`<details>`), her soru `id={slug}` çapalı, açıkken "Bağlantıyı kopyala"; `#slug` ile gelinirse o soru açık ve görünür. Kaynak sayfa notu. Yan sütun: kategori dizini (geçerli işaretli) + "Aradığını bulamadın mı? Sor". FAQPage + BreadcrumbList JSON-LD. `generateStaticParams` + bilinmeyen kategori `notFound()`.
- `/soru-cevap/sor` — Soru formu: soru (sayaçlı), isteğe bağlı açıklama, isteğe bağlı konu, isteğe bağlı rumuz, gizli bal küpü. Yazarken "Bunlar sorunuzu yanıtlıyor olabilir" (benzer sorular, `similarFaqs`). Kişisel bilgi uyarısı. `?q=` ile önceden doldurulur. Başarıda: takip bağlantısı büyük ve kopyalanabilir, "bu cihazda Sorduklarım'a kaydedildi" notu, bağlantıyı kaybederseniz yanıtı göremeyeceğiniz uyarısı.
- `/soru-cevap/takip/[token]` — Takip: soru, durum çizgisi (Alındı → İnceleniyor → Yanıtlandı / Yanıtlanmadı), yanıt (Markdown), not, ilgili / yayımlanan soru bağlantısı. `robots: noindex`. Geçersiz anahtar → nazik bulunamadı durumu (404 değil, sayfa içinde).

Mobil öncelikli (tercih döneminde çoğu ziyaret telefondan), 16px yan boşluk, yatay kaydırma yok. Türkçe arama İ/ı duyarlı. Azaltılmış harekete saygı. Klavye ve ekran okuyucu: arama sonuç sayısı `aria-live`, açılırlar yerel `<details>`.

Site haritası: hub + yayındaki kategori sayfaları. `robots`: `/soru-cevap/takip/` kapalı.

## Yönetim yüzeyi (`.admin`, `components/admin/ui/`)

`/admin/soru-cevap` sekmeli: **Sorular** (mevcut gruplu/aranabilir liste korunur; kategori seçimi tablodan; öne çıkan; adres alanı otomatik, düzenlenebilir; ziyaretçi kökenli etiket), **Gelen sorular** (Mesajlar gibi iki bölmeli gelen kutusu: durum süzgeci Yeni / Yanıtlanan / Reddedilen; seçili soruda yanıt yaz, reddet + not + ilgili soru seç, "Herkese açık soru-cevaba ekle" formu), **Kategoriler** (ekle, düzenle, sırala, gizle, silme yalnız boşsa). Yan menüde "Soru-cevap" yanında yeni soru sayacı. "Toplu yükleme" bağlantısı sayfa başlığında.

## Kapsam dışı

E-posta bildirimi (altyapı yok, kişisel veri istemiyoruz), oy/yararlı mı, yorum, ziyaretçinin soru düzenlemesi.

## Yayın sırası

1. Migration 021 canlıya (kullanıcı onayıyla) — kod ondan önce yayına girmemeli; yeni kod `faq_categories` ve RPC'leri okur.
2. Kod push (kullanıcı terminalinden).
