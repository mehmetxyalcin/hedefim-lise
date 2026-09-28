# Hedefim Lise — Proje haritası ve görev devir notları

İnceleme tarihi: 5 Eylül 2026. Referans: `main`, `26ca9f6`.

Bu belge Claude ile Codex arasındaki görev devirlerini kolaylaştırmak için yerel kaynak kodu, proje belgeleri, Git durumu ve statik kontrollerden hazırlanmıştır. Canlı Supabase şeması, canlı kayıt sayıları, Hostinger yapılandırması ve tarayıcı akışları bu incelemede doğrulanmadı. Migration yorumlarındaki geçmiş canlı doğrulamalar bu oturumda yapılmış testler değildir. Yeni görevde bu belgenin tarihinden sonraki değişiklikler ayrıca okunmalıdır.

## 1. Ürün ve çalışma kuralları

- Mersin'de lise seçen öğrenciler, veliler ve rehber öğretmenler için Türkçe lise rehberi.
- Ana akış: yüzdelik dilim/OBP, ilçe, tür veya meslek alanıyla okul bulma → okul detayı → tercih listesine ekleme → sıralama/yazdırma.
- Yönetim paneli okul içeriklerini, yıllık puanları/kontenjanları, tesisleri, meslek alanlarını/dallarını, bursları, projeleri, SSS'yi ve site ayarlarını yönetir.
- `CLAUDE.md`, `AGENTS.md` dosyasına yönlendiriyor. `AGENTS.md`, kod yazmadan önce kurulu Next.js sürümünün `node_modules/next/dist/docs/` altındaki ilgili belgesini okumayı istiyor.
- Ürün niyeti `PRODUCT.md`, tasarım kuralları `DESIGN.md` içinde. Belgeler ile kodun çeliştiği yerler aşağıda ayrı listelendi.
- İnceleme sırasında uygulama kodu, ayarlar ve veritabanı değiştirilmedi; yalnızca bu devir belgesi eklendi.

## 2. Teknoloji ve çalıştırma

| Katman | Mevcut yapı |
| --- | --- |
| Uygulama | Next.js 16.2.3, App Router, React 19.2.4 |
| Dil | TypeScript 5, strict, `@/*` → `src/*` |
| Stil | Tailwind CSS 4, `src/app/globals.css` |
| Veri/kimlik/depolama | Supabase JS + Supabase SSR |
| İkonlar | Lucide React |
| Excel içe aktarma/şablon | `xlsx`, ihtiyaç anında dinamik import |
| Analitik | Root layout içinde sabit Google Analytics kimliği |
| Paket yöneticisi | npm; `package-lock.json` mevcut |

Komutlar: `npm run dev`, `npm run dev:preview`, `npm run build`, `npm run start`, `npm run lint`.

`dev:preview`, `NEXT_DIST_DIR=.next-dev` kullanır. `next.config.ts`, bu değişkenle farklı derleme dizinini destekler; aynı `.next` üzerinde geliştirme ve üretim sunucusunu birlikte çalıştırmamak gerekir.

Gerekli değişken adları: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`. Bu belgeye gerçek anahtar/değer alınmadı. `.env.example` ayrıca `NEXT_PUBLIC_GA_ID` gösteriyor, ancak kod bunu okumuyor.

`PRODUCT.md`, Hostinger üzerinde `next start` ile dağıtımı tarif ediyor. Depoda Hostinger servis/CI yapılandırması görülmedi; README hâlâ Vercel'i anlatıyor. `src/lib/site.ts` site adresini önce `NEXT_PUBLIC_SITE_URL`, sonra Vercel değişkenleri, en son localhost üzerinden çözüyor.

Görsel optimizasyonu `images.unoptimized: true` ile kapalı. Supabase public storage ve Unsplash adresleri için remote pattern tanımlı. Okul görselleri `school-images`, site logosu `site-assets` bucket'ını kullanıyor. Okul görsel yükleme sınırı kodda 5 MB; site logosu 2 MB.

## 3. Sayfa ve modül haritası

| Yol | Giriş dosyası / davranış |
| --- | --- |
| `/` | `src/app/(site)/page.tsx` (genel sayfalar 23 Eylül'den beri `(site)` route group'unda; URL'ler aynı); aktif okul sayıları, son puan yılı, dağılımlar, öne çıkan okul |
| `/okullar` | `src/app/okullar/page.tsx`; sunucuda sorgu/filtre/sayfalama; `components/schools/SchoolList.tsx` etkileşimleri |
| `/okullar/[slug]` | `lib/supabase/schoolDetail.ts` → **`components/school/SchoolDetail.tsx`** |
| `/alanlar` | Supabase meslek alanları → `lib/vocational-atlas.ts` (`buildAtlas`) → `components/vocational/VocationalAtlas.tsx` |
| `/alanlar/[slug]` | Alan + ilişkili aktif okullar + `/okullar?alan=` ile aynı puan kuralı (`placementValues` + `lib/score-display.ts`) → `VocationalDetail.tsx` |
| `/istatistikler` | `data/mersinSchoolStatistics2026.ts` → `SchoolStatisticsDashboard.tsx`; Supabase'den bağımsız |
| `/soru-cevap` | `lib/faqs.ts` → `components/faq/FaqSearch.tsx`; yayımlanmış kayıtlar, kategori ve metin araması |
| `/tercihlerim` | Tamamen tarayıcıdaki tercih listesi; sıra değiştirme, silme, temizleme, yazdırma |
| `/hakkinda` | `components/about/AboutProject.tsx` |
| `/iletisim` | `ContactForm.tsx` + `actions.ts`; okul araması ve mesaj kaydı |
| `/login` | `/admin/login` yönlendirmesi |
| `/admin/login` | Supabase e-posta/parola girişi |
| `/auth/callback` | Auth code → session; admin kapsamlı güvenli dönüş yolu |
| `/admin` | Okul listesi, içerik eksikliği göstergeleri, tekli/toplu aktif-pasif, silme |
| `/admin/okullar/yeni` | Yeni okul formu |
| `/admin/okullar/[slug]/duzenle` | Sekiz sekmeli güncel düzenleme yüzeyi |
| `/admin/okullar/toplu-yukle` | Dört modlu Excel yükleme sihirbazı |
| `/admin/schools/new`, `/admin/schools/[id]/edit` | Hâlâ bulunan eski tek formlu yollar; yeni action'ların bazı hata dönüşleri de bunları kullanıyor |
| `/admin/meslek-alanlari` | Alan/dal ekleme, yeniden adlandırma, silme |
| `/admin/soru-cevap` | Soru, yanıt, kategori, sıra, yayın durumu ve kaynak sayfası |
| `/admin/mesajlar` | Mesaj listesi/detayı; okunmadı, okundu, yanıtlandı durumları |
| `/admin/site-settings` | Site logosu/başlığı |
| `/admin/site-settings/navigation` | Menü sırası, görünürlüğü ve linkleri |
| `/admin/site-settings/footer` | Alt bilgi, paydaş başlığı, linkler ve sosyal bağlantılar |
| `/api/admin/okul-sablonu` | Dört sayfalı `.xlsx` şablon üretimi |
| `/sitemap.xml`, `/robots.txt` | Next metadata yolları; aktif okul ve alan adresleri |

`src/` altında 120 TS/TSX dosyası var. Bileşenler `home`, `school`, `schools`, `vocational`, `statistics`, `faq`, `about`, `admin`, `layout`, `ui` olarak ayrılmış.

Statik import taramasında referans bulunmayan dosyalar: `components/schools/SchoolDetail.tsx`, `components/auth/LoginForm.tsx`, `data/schools.ts`, `data/vocationalFields.ts`. Özellikle tekil **school/** altındaki detay bileşeni aktiftir; çoğul **schools/** altındaki 772 satırlık alternatif üzerinde yanlışlıkla çalışılmamalı. Eski örnek okul/alan dizileri canlı rehberin veri kaynağı değildir.

## 4. Veri modeli ve dönüşümler

| Tablo grubu | Görevi |
| --- | --- |
| `schools` | Ad, slug, kurum kodu, ilçe, tür, aktiflik, temel bilgiler, görsel/dil/özellik dizileri, iletişim ve öğretim bilgileri |
| `school_scores` | Yıl, OBP, LGS, yüzdelik; kod okul geneli veya `vocational_field_id` ile alan bazında puan bekliyor |
| `school_quotas` | Okul/yıl bazında sınavlı ve sınavsız kontenjan |
| `vocational_fields`, `vocational_branches` | Meslek alanı ve dal sözlüğü |
| `school_vocational_fields`, `school_vocational_branches` | Okulun alan/dal ilişkileri |
| `facilities`, `school_facilities` | Tesis sözlüğü ve okul ilişkileri |
| `school_scholarships`, `school_projects` | Sıralanabilir burs/proje kayıtları |
| `school_slug_history` | Eski slug → okul kimliği; güncel slug ilişkiden çözülür |
| `profiles` | Supabase kullanıcısının e-posta/rol bilgisi; admin yetkisinin kaynağı |
| `contact_messages` | İletişim formu ve mesaj durumları |
| `faqs` | Soru-cevap, kategori, yayın durumu, sıra ve kaynak |
| `site_settings`, `navigation_items` | Site kimliği ve menü |
| `footer_settings`, `footer_links`, `footer_social_links` | Alt bilgi içerikleri |

`types/school.ts` liste modelini, `types/schoolDetail.ts` ayrıntılı modeli tanımlıyor. Supabase satırları snake_case, uygulama modeli çoğunlukla camelCase. `lib/supabase/public.ts` sorgu istemcisi değildir; mapper/helper katmanıdır. Ayrıntı yükleyici `schoolDetail.ts` içinde ayrıca kendi mapper'ı var. Detay bileşeni bazı alt bileşenler için yeniden snake_case'e çeviriyor.

Temel okul kimliği ve alan kimliği kodda sayısal; tesis, dal ve detay kayıtları migration'larda UUID. Toplu alan yükleyicide dal kimliğinin `number` diye yazıldığı yerler var; canlı şemaya göre tiplerin gözden geçirilmesi gerekir.

`schools.percentile`, `features`, `projects` gibi eski alanlar ile ilişkisel `school_scores`, `school_facilities`, `school_projects` birlikte bulunuyor. Admin içerik tamlığı göstergesi hâlâ eski dizi alanlarını okuyor; detay tablosunda proje olması bu göstergeyi tek başına doldurmuyor.

## 5. Arama, puan ve tercih sözleşmeleri

- Okul listesi parametreleri: `ara`, `ilce`, `tur`, `alan` (alan ID), `yerlestirme`, `limit`, `sayfa`, `siralama`, `yuzdelik_min/max`, `obp_min/max`.
- Sayfa boyutları 10/20/50/100, varsayılan 20. İsim sıralaması veritabanında, puan sıralaması okul ID'lerini bellekte sıralayıp ilgili sayfanın ayrıntılarını çekerek yapılıyor.
- Yerleştirme değerleri `yerel`, `merkezi`, `yerel_merkezi`; sorgu bunlara tam eşitlik uyguluyor.
- Türkçe ad araması `lib/turkishSearch.ts` ile regex özel karakterlerini kaçırıp `i/ı/İ/I` ailesini aynı karakter sınıfında eşleştiriyor. Okul listesi ve iletişim araması bunu kullanıyor.
- Ana sayfa `ScoreScale.tsx`: yüzdelik/OBP sekmeleri, sürüklenebilir ve klavyeyle yönetilebilir iki uç, ilçe/tür seçimi. Virgül veya noktalı giriş; 0–100 kontrolü.
- Ölçek ve aralık filtresi: tablodaki **genel en son yıl**, okul başına **en düşük yüzdelik / en yüksek OBP**. İki aralık birlikte verilirse kesişim uygulanıyor.
- Tam ölçek seçiliyken aralık parametresi gönderilmiyor; yalnız sıralama ve varsa ilçe/tür gidiyor. Bu durumda puanı bulunmayan okullar da sonuçlarda yer alabilir.
- Puan sıralaması ve liste kartı aynı yılın birden fazla alan kaydı varsa ilk gelen kaydı seçiyor; ölçeğin en rekabetçi kayıt kuralını paylaşmıyor. Ayrıca sıralama okulun kendi son yılını esas alıyor. Bu fark ileride tekleştirme gerektirebilir.
- Detay sayfasında yıllık puanlar ve okul/alan satırları gösteriliyor; LGS burada dört ondalık haneyle yazılıyor. Tercih listesindeki LGS gösterimi iki hane.
- `useFavorites.ts`, `localStorage` anahtarı `hedefim_favorites` içinde okulun ve son yıl puanlarının **ekleme anındaki kopyasını** tutuyor. Oturum/hesap gerekmez, buluta senkronizasyon ve otomatik veri tazeleme yok. Aynı sayfadaki bileşenler özel event ile eşitleniyor; diğer sekmeler için `storage` event dinleyicisi yok.

## 6. Yönetim kayıt akışları

Ana dosya `src/app/admin/okullar/actions.ts` (1.155 satır).

Sekmeler: `temel`, `iletisim`, `puanlar`, `tesisler`, `meslekler`, `burslar`, `projeler`, `diger`. Temel/iletişim/diğer sekmeleri `useActionState` sonucu ve `router.refresh()` kullanıyor; diğerleri kendi form/action'ları üzerinden yönleniyor. `UnsavedChangesWarning` form değişikliği ve ayrılma uyarılarını yönetiyor.

- Yeni okul: zorunlu alanlar + slug normalizasyonu/benzersizliği → görsel yükleme → okul insert → meslek alanları. İlişki yazımı başarısızsa okul kaydını silerek geri alma deneniyor.
- Temel güncelleme: yalnız temel alanları yazar; iletişim, diğer bilgi, puan ve ilişkiler ayrı işlemlerde. `updateSchool`, `.select("id")` ile sıfır satır güncellemesini kontrol ediyor.
- Tesis/alan/dal eşitlemelerinin bir kısmı sil + ekle. İşlemler ortak bir veritabanı transaction'ı içinde değil; bazı yollarda sınırlı geri alma var.
- Silme/aktiflik işlemleri liste, alanlar, sitemap ve ilgili detay yollarını yeniliyor.
- Alan/dal yönetimi `admin/meslek-alanlari/actions.ts`; site ayarları `admin/site-settings/actions.ts`; SSS ve mesajların ayrı action dosyaları var.

### Toplu yükleme

`components/admin/BulkUploadWizard.tsx` (2.050 satır) ve `admin/okullar/toplu-yukle/actions.ts` (579 satır). Modlar: temel okul, meslek alanı/dal, puanlar, tesisler. Ortak süreç dosya seçme → çözümleme/önizleme → yükleme/sonuç. Hatalı satır atlama seçenekleri moda göre değişiyor.

- Eşleştirme anahtarı kurum kodu. Yeni okullar **pasif** ekleniyor. Yeni slug okul adından ve kurum kodundan türetiliyor.
- Temel güncellemede boş okul hücreleri mevcut bilgiyi korur. Kontenjan sütunları 2026/2025/2024.
- Puan yüklemesi 2025/2024/2023 ile sabit. Alan boşsa okul geneli; doluysa alan adı çözülüyor. Boş puan hücreleri mevcut değeri korur.
- Temel/puan/tesis işlemlerinde 500, meslek alanlarında 2.000 satır üst sınırı.
- Geçerli alan/tesis bulunursa mevcut ilişkiler değiştirilir; hiç eşleşme yoksa mevcut ilişkiler korunur.
- Şablon, istemci parser'ı ve server action alan/yıl sözleşmeleri birlikte ele alınmalı.

## 7. Yetkilendirme ve önbellek

- `lib/supabase/server.ts`: request cookie'leriyle SSR client. `client.ts`: tarayıcı client. `static.ts`: cookie ve kalıcı session olmadan public veri client'ı.
- `proxy.ts` yalnız `/admin/:path*` üzerinde çalışır, pathname/search header'larını ekler, oturum kontrolü/refresh yapar. Admin login açıktır; proxy tek başına rol kontrolü yapmaz.
- `requireAdmin()` geçerli kullanıcı yoksa login'e yönlendirir; kullanıcı var ama admin değilse **throw/redirect yerine `profile: null` döner**. Bu dönüşün çağıran yerde kontrol edilmesi gerekir.
- Okul/SSS/site ayarlarının çoğu `profile` kontrolü yapıyor. Toplu yükleme, alan/dal yönetimi, mesaj durumu ve Excel şablonu gibi bazı yollar yalnız `supabase` alıyor veya sonucu kullanmıyor. Bu yollarda rolün engellenmesi RLS'ye bağımlı; yalnız helper adı güvence sayılmamalı. Canlı yetkisiz yazma testi yapılmadı.
- Uygulama publishable key + kullanıcı session'ı kullanır. Depodaki yazma politikaları admin rolünü `profiles` üzerinden sorgular.
- `006` içindeki public school SELECT politikası tüm satırları okutur; pasif okulları gizleyen şey sayfa sorgularındaki `is_active` filtresidir. Pasiflik gizlilik sınırı değildir; iletişim araması da aktiflik filtresi koymuyor.
- Ana sayfanın ISR hedefi 24 saat, sitemap 1 saat. Navbar/footer/site ayarları ve yayımlanmış SSS `unstable_cache` ile 60 saniye ve etiketler kullanıyor. Cache Components ayarı açık değil.
- SSS/site ayarları etiketlerini yeniliyor. Okul puanı güncelleme yolları ana sayfayı ayrıca yenilemiyor; toplu yükleme action'larında `revalidatePath` yok. Güncellemenin ana sayfa/sitemap'e ne zaman yansıdığı görev bazında kontrol edilmeli.

## 8. Migration geçmişi ve yeniden kurulum sınırı

`001` site ayarları + site-assets; `002` okul iletişim; `003` detay tabloları/kolonlar; `004` alan/dal seed; `005` kurum kodu; `006–008` okul/alan ilişkileri için RLS; `009` LGS dört hane; `010` SSS; `011` paydaş başlığı; `012` menüye istatistik/SSS; `013` okul slug onarımı ve tarihçe; `014` kullanıcı trigger fonksiyonu execute yetkileri; `015` profiles self-read ve yazma kısıtları.

`013`: 183 kurum kodu için slug eşleştirmesi içeriyor; güncel aktif okul bulunamazsa eski adres tarihçesi üzerinden kalıcı yönlendirme var. Bundan sonraki slug değişiklikleri trigger ile kaydediliyor. Public detay ve güncel admin düzenleme sayfası tarihçeyi kullanıyor.

Depo tek başına eksiksiz başlangıç şeması değil:

- Başlangıç `schools`, `profiles`, `vocational_fields`, `school_vocational_fields` ve `handle_new_user` tanımları migration dosyalarında yok.
- `contact_messages` kurulum SQL'i migration yerine `admin/mesajlar/page.tsx` içinde hata ekranı metni olarak duruyor.
- `003`, puan için `UNIQUE(school_id, year)` tanımlıyor; güncel kod alan bazında birden fazla kayıt ve `vocational_field_id` bekliyor. Bu değişikliği getiren migration depoda bulunamadı.
- `school-images` bucket kurulumu/politikaları migration'larda bulunamadı; README kurulmasını istiyor.
- Migration'ların canlıya uygulanma durumu bu incelemede teyit edilmedi. Sıfırdan kurulum veya şema değişimi öncesi canlı şema ve migration geçmişi karşılaştırılmalı.

## 9. Tasarım ve belge farklılıkları

- Genel yüzeyler: koyu lacivert navbar/footer, açık slate gövde, mavi eylemler; Inter/Roboto Mono.
- Yalnız ana sayfadaki `.landing`: açık belge zemini, petrol yeşili eylemler, turuncu kullanıcı seçimi; Archivo/Source Serif 4. Bu renk/font dünyası diğer sayfalara yayılmamalı.
- `globals.css`: ortak tipografi, landing değişkenleri, hareket tercihleri ve tercih listesi için yazdırma stilleri.
- Mobil listede BottomSheet, detayda sabit tercih butonu; landing select kontrolü işaretçi türüne göre native/custom davranış kullanıyor.
- `DESIGN.md`, eski `PercentileScale.tsx` adını anıyor; gerçek dosya `ScoreScale.tsx`. Bazı tasarım maddeleri önceki sürümden kalma veya birbiriyle çelişiyor.
- `PRODUCT.md` kalan Vercel Analytics bileşeninden söz ediyor; güncel layout ve package.json içinde bu bağımlılık/bileşen yok.
- `PRODUCT.md` bağımsızlık ve doğrulanmış kurumsal ortak olmaması ilkesini yazıyor; `site-settings.ts` fallback metni Akdeniz RAM koordinatörlüğü iddiası içeriyor. Kurumsal metin değişiminde gerçek durum kullanıcıdan doğrulanmalı.

## 10. Kontrol sonuçları ve takip edilecek bulgular

Bu bölüm tespit kaydıdır; aşağıdakilere düzeltme uygulanmadı.

1. `tsc --noEmit --incremental false`: **başarılı**.
2. `npm run lint`: `.claude/worktrees/.../.next-dev` üretilmiş dosyalarını da taradığı görüldü ve durduruldu. ESLint ignore listesi bu yerel çalışma kopyalarını kapsamıyor.
3. `eslint src next.config.ts eslint.config.mjs postcss.config.mjs`: **29 hata, 5 uyarı**. Başlıca gruplar: açık `any`, effect içinde state güncelleme, JSX tırnakları, okul filtre fonksiyonlarında immutability kuralı. `SchoolQuotaCard.tsx:20` için koşullu hook çağrısı da raporlandı. Lint bulguları çalışma zamanı testi yerine geçmez.
4. `bulkUploadScores`: puan insert/update sonuçlarının `error` alanları kontrol edilmiyor; başarısız yazma `updated` sayısını artırabilir. Tesis yüklemesinde de delete/insert sonuçları kontrol edilmiyor. Kısmi işlem/sayaç davranışı ele alınmalı.
5. Ölçek/aralık filtreleriyle kart/sıralama puan seçimi farklı; çok alanlı okul ve farklı veri yıllarıyla doğrulanmalı.
6. Liste sayfası `offset` değerini sayfa sayısına göre sınırlamadan önce hesaplıyor. Çok büyük `sayfa` değerinde görünen sayfa numarası ile getirilen sonuç kümesi ayrışabilir.
7. Eski İngilizce admin yolları ile sekmeli Türkçe yollar aynı action'ları kullanıyor. Form alanları ve action sonuç davranışı aynı değil; eski yolu değiştirirken kaydetme kapsamı incelenmeli.
8. Excel şablonundaki OBP örnekleri 100 üzerinde; ana sayfa OBP aralığı 0–100 kabul ediyor. Örnek veri ve puan parser sözleşmesi birlikte gözden geçirilmeli.
9. Form verisini kabul eden bazı action'larda ayrıntılı sunucu doğrulaması sınırlı; istemci doğrulaması veya RLS'nin varlığı veri doğruluğu garantisi değildir.
10. Uygulama için ayrı test script'i/test altyapısı görülmedi. Bu incelemede production build, tarayıcı testi, canlı veri sorgusu veya canlı yazma yapılmadı.

## 11. Claude ↔ Codex devir düzeni

İnceleme anında:

- Ana çalışma dizini `main @ 26ca9f6`; başlangıç çalışma ağacı temizdi.
- `.claude/worktrees/elegant-chatterjee-1e3948`: detached `26ca9f6`, temiz.
- `.claude/worktrees/wonderful-lederberg-2f338d`: detached `0b356c5`, temiz; ana dizindeki son iki güvenlik commit'ini içermiyor.
- Bu kopyaların branch/commit ve durumları zamanla değişebilir; görev alırken tekrar okunmalı. Kullanıcının hangi kopyayı devrettiği açık değilse görevle ilgili farklardan anlaşılmaya çalışılmalı.

Her devirde kaydedilecek kısa bağlam: görev, hedef branch/çalışma dizini, tamamlanan değişiklikler, kalan iş, yapılan kontroller ve canlıya uygulanan migration/deploy durumu. Önce mevcut `git status`/son commit'ler ve bu belgeden sonraki diff okunmalı; başka çalışma kopyasındaki değişiklikler üzerine yazılmamalı.

Hızlı yön bulma: okul arama için `app/okullar/page.tsx`; ana sayfa için `app/page.tsx` + `home/ScoreScale.tsx`; detay için `lib/supabase/schoolDetail.ts` + `components/school/`; kayıt için `admin/okullar/actions.ts`; toplu yükleme için wizard + toplu action + şablon route; yetki için `admin-auth.ts` + `proxy.ts` + ilgili RLS; içerik yönetimi için ilgili admin action + cache helper.

## 12. Kayıt güvenliği çalışması — 6 Eylül 2026

Kullanıcı öncelik 1'i (admin yetkisi ve veri kaybına karşı güvenilir kayıt) uygulamayı onayladı. Önceki bölümler ilk incelemenin fotoğrafıdır; aşağıdaki değişiklikler onların üzerine gelir. Çalışma henüz commit/deploy edilmedi.

- `admin-auth.ts` artık profil okunamazsa, profil yoksa veya rol admin değilse tüm çağıranları durduruyor.
- Toplu yükleme, yeni `admin-import.ts` aracılığıyla her okul için tek RPC kullanıyor. Doğrulanmamış yazmalar başarı sayılmıyor; bağlantı belirsizliğinde yeniden deneme yapılmadan işlem duruyor. Ana sayfa ve site haritası önbelleği yenileniyor.
- Yeni migration iki SECURITY INVOKER fonksiyonu tanımlar: `admin_import_school` ve `admin_replace_school_relations`. Tesis/alan/dal değiştirmede silme veya ekleme başarısızlığı eski ilişkileri korur. Normal form da ilişki RPC'sini kullanır.
- Wizard, hatalı okulun kısmi satırlarını yüklemiyor; bilinmeyen tesisleri sessizce atlamıyor; tekrar tıklamayı engelliyor ve işlem hatasını gösteriyor. Puan/kontenjan girişleri tam sayı/aralık kontrollerinden geçiyor. Excel OBP örnekleri düzeltildi.
- Okul/alan/dal silmeleri FK davranışına bağlı tek DELETE oldu; bazı güncelleme/silmelerde hiç satır etkilenmemesi artık hata. Canlı FK davranışı ayrıca doğrulanmalı.
- `npm test` eklendi; 17 test başarılı. TypeScript ve üretim derlemesi başarılı. Değişen uygulama dosyalarında lint 0 hata/2 eski uyarı. Canlı veya oturumlu tarayıcı testi yapılmadı.
- **Canlıya uygulanmadı:** Supabase yönetim araçları görünmüyor, CLI oturumu yok. Yeni migration uygulamadan bu sürümü dağıtma. Eski migration'ların şema eksikleri test fixture'ında açıkça modellenmiştir; canlıyla aynı olduğu varsayılmamalı.
- Ayrıntılı geçiş ve kalan işlem sınırları: `docs/admin-save-verification.md`. Bir sonraki adım yönetim bağlantısıyla canlı şemayı/RLS'yi doğrulamak, test ortamında migration ve akış testlerini tamamlamaktır.

## 13. Canlı veritabanı adımı tamamlandı — 6 Eylül 2026

Kullanıcı resmi Supabase CLI girişini tamamladı. Uygulamanın projesi `hsqattqhmvruhdikdayu` olarak doğrulandı. Canlı şema farkları (JSONB liste sütunları ve ek kimlik sütunlu bağlantı tablosu) migration/testlere işlendi; 17 test geçti. Yeni iki RPC tek işlemde canlıya uygulandı; öncesinde ve sonrasında geçici kayıtlarla ROLLBACK testleri geçti. Geçici okul kalmadı. Önceki “bağlantı yok / migration uygulanmadı” notları artık tarihsel bilgidir.

Ayrıntılı kanıt, dosya checksum'ı ve uygulanma yöntemi `docs/admin-save-verification.md` içinde; tekrar kullanılabilir SQL denemesi `docs/admin-save-smoke.sql` içinde. Canlıda migration history tablosu yok; eski migration'ları topluca çalıştırma. Güvenlik danışmanının tek kalan uyarısı sızdırılmış parola korumasının kapalı olmasıdır. Uygulama kodu henüz commit/deploy edilmedi; sıradaki adım uygulama dağıtımı ve gerçek yönetici oturumuyla tarayıcı doğrulamasıdır.

## 14. Yayın yöntemi — kullanıcı doğrulaması

6 Eylül 2026: Kullanıcı güncel sitenin GitHub üzerinden Hostinger tarafından otomatik çekildiğini doğruladı. Yayın hedefi `origin/main`, canlı adres `https://hedefimlise.com`. Kayıt güvenliği değişiklikleri için ana dala gönderim onaylandı. Dağıtım sonucu ayrıca doğrulanmalıdır.

## Canlı yayın doğrulaması — 6 Eylül 2026

- GitHub `main`: `48991f07cfc18efa96d937e30a3dc48c18eb4678` gönderildi.
- Hostinger paneli bu commit için **Tamamlandı**, dağıtım zamanı **2026-09-06 16:14**, süre **1m 32s**, Node **22.x** gösterdi.
- Kullanıcının gerçek yönetici oturumuyla okul listesi ve toplu yükleme ekranı açıldı.
- CSV önizleme testi: 767380 kurum koduna bilinmeyen tesis verildi. Ekran “bu okul yüklenmeyecek”, “mevcut tesisleri korunacak”, “Güncellenecek okul: 0” gösterdi; “Yükle (0 okul)” devre dışıydı. Kalıcı yazma yapılmadı.
- Veritabanı kayıt/rollback kontrolleri önceki SQL testleriyle; oturumlu tarayıcı doğrulaması ise erişim ve geçersiz dosyanın önizlemede engellenmesiyle sınırlı. Tarayıcıdan başarılı kalıcı kayıt senaryosu denenmedi.
- Bu doğrulama notu yayın sonrası yerel olarak eklendi; uygulama sürümü 48991f0'dır. Önceki “henüz commit/deploy edilmedi” ifadeleri tarihsel durumdur.

## 15. Program bazlı puanlar — yerel uygulama

Kullanıcı okul tek kart kalırken alan/program puanlarının ayrı eşleşmesini onayladı. `src/lib/program-scores.ts` filtreleme ve sıralamanın ortak sözleşmesi oldu. Veri kümesindeki en son yıl kullanılır; eski yıla fallback yok. Alan filtresi seçiliyse yalnız o alanın puanı kullanılır; alan belirtilmeyen kayıt alanlara kopyalanmaz. Aynı anda OBP ve yüzdelik aralığı verilirse aynı kayıt ikisini de sağlamalıdır. Sıralama yalnız eşleşen kayıtlar arasından yönüne göre değer seçer; eksik metrik en sona gider, eşitlik okul adı/ID ile çözülür.

Okul listesi sayfalı kompakt aday sorgusuyla tüm adayları değerlendirip yalnız görünen sayfanın ayrıntılarını getirir. Geçersiz yüksek sayfa numarası veriye erişmeden önce sınırlandırılır. Kartlarda yıl, alan adı, ayrı OBP/LGS/yüzdelik değerleri ve sıralamada kullanılan kayıt gösterilir. Üçten fazla eşleşme ve diğer kayıtlar açılır bölümde. Puan tablosunda alan belirtilmeyen kayıtlar “Okul geneli (alan belirtilmemiş)” olarak kalır; ayrı yerleştirme programı oldukları varsayılmaz.

Ana sayfa ölçeği tüm puan kayıtlarını çizer; aralık/ilçe/tür sayacı benzersiz okul sayar. Tam aralık seçimi de URL'ye taşınır; puanı olmayan okullar yanlışlıkla arama sonucuna eklenmez. LGS için ayrı sıralama seçenekleri eklendi.

Doğrulama: 25 test başarılı (8 yeni puan testi), değişen dosyalarda ESLint temiz, üretim derlemesi başarılı. Gerçek verilerle yerel /okullar önizlemesi ve masaüstü/mobil görünüm kontrol edildi. %15–25 sorgusunda 2025 yılı için 6 okul ve sıralı değerler görüldü; OBP sıralaması ayrıca gözlendi. Veritabanı değişikliği/migration yok. Bu ikinci aşama henüz commit veya canlı dağıtım yapılmadan yerel çalışma ağacındadır. Önizleme: localhost:3105.

## 16. Program puanları canlıda — 7 Eylül 2026

**Güncel karar: Kullanıcı bu düzenlemeyi beğenmedi ve geri alınmasını istedi. Alan/program puanı çözümü ertelendi; aşağıdaki yayın kaydı tarihseldir. Uygulama dosyaları 48991f0 sürümündeki durumuna döndürüldü. Kayıt güvenliği ve canlı veritabanındaki RPC düzeltmeleri korunuyor. Bu soruna kullanıcı yeniden başlamayı istediğinde başka bir yaklaşım geliştirilecek.**

Önceki yerel durum notunun ardından `6a4cebba8b9dbc6fc594eea5216df5b37050b455` GitHub main dalına gönderildi. Hostinger paneli bu sürüm için **Tamamlandı**, **2026-09-07 09:49**, **1m 42s**, Node **22.x** gösterdi. Yayın öncesi 25 test ve değişen dosyaların ESLint kontrolü tekrar geçti.

Canlı `/okullar?yuzdelik_min=15&yuzdelik_max=25&siralama=yuzdelik_asc` ekranında 2025 yılı, 6 okul, artan yüzdelikler (15,04; 15,90; 16,38; 16,39; 20,93; 21,81), ayrı LGS değerleri ve “Sıralamada bu kayıt esas alındı” açıklamaları doğrulandı. Çok alanlı kayıt eşleşmesinin kapsamlı doğrulaması birim testlerinde; bu canlı örnekte puanlar alan belirtilmemiş okul geneli kayıtlarıdır. Yeni veritabanı değişikliği yok. Bu yayın sonrası devir notu yerelde tutulmuştur; uygulama kodu GitHub ve canlıda aynı sürümdedir.

## 17. Kontenjan bileşeni ve yönetim form kontrolleri — 8 Eylül 2026

Kullanıcı sıradaki iki işi sormadan tamamlayıp yayımlamamızı istedi. Çok alanlı puan/sıralama çözümü ertelenmiş olarak kalır; geri alma sürümü edf748a korunarak aşağıdaki iki iş uygulanmıştır.

- SchoolQuotaCard hook'u her render'da çağrılır; boş veri null döner. Seçili yıl artık yoksa mevcut en yeni yıl gösterilir. Görünüm korunur; yıl düğmelerine aria-pressed eklendi.
- admin-form-validation.ts ortak sunucu kontrolleri: zorunlu metinler, metin uzunlukları, okul türü/ilçe/yerleştirme/pansiyon seçenekleri, kimlik ve çoklu seçimler, saatler, telefon/e-posta, güvenli bağlantılar, dosya türü/boyutu ve puan/kontenjan aralıkları. Geçersiz çoklu seçimler sessizce atılmaz. Boş alan/dal seçimi hâlâ bilinçli temizleme sağlar.
- Okul, burs/proje, tesis/alan/dal, SSS, site/menü/footer/sosyal bağlantı ve mesaj durumu action'ları yetki kontrolünün ardından yazma başlamadan doğrulanır. Puan alanının seçili okula bağlı olduğu doğrulanır. Tamamen boş puan/kontenjan yerine açıklayıcı hata; sıfır geçerlidir.
- Burs/proje güncelleme ve silme school_id ile de sınırlandırılır. SSS/menü/link güncelleme-silmede hiç kayıt etkilenmemesi başarı sayılmaz. Eski SchoolForm dönen action mesajını artık gösterir; bu, eski/yeni ekranların tüm kayıt davranışlarını birleştirme çalışması değildir.
- 30 test geçti: gerçek React DOM ile boş→dolu→yıl değiştirme→seçili yılı kaldırma→boş veri, sunucu action'larında hatalı girişte sıfır yazma, geçerli girişler, alan-okul ilişkisi ve başarısız kayıt senaryoları. jsdom 26.1.0 yalnız geliştirme/test bağımlılığı olarak sabitlendi.
- TypeScript, değişen dosyaların ESLint kontrolü ve üretim derlemesi başarılı. Veritabanı şema/migration değişikliği yok. Testlerde kalıcı canlı okul oluşturulmadı/değiştirilmedi.
- Kalan işler: eski/yeni yönetim yollarının tüm kayıt kapsamını uyumlama ve proje genelindeki önceki lint borcu. Bu çalışmada sıralama işlemlerinin çoklu yazma atomikliği veya yüklenen dosyaların yaşam döngüsü yeniden tasarlanmadı.

Canlı doğrulama eki: 301c519 Hostinger üzerinde 2026-09-08 01:24'te 58 saniyede tamamlandı. Canlı yeni okul formunda ftp://example.com adresi sunucuda engellendi ve açıklayıcı uyarı göründü; kayıt oluşturulmadı. Kontenjan kartında Mut Osman Nuri Yalman Anadolu Lisesi için 2026→2025 geçişi doğrulandı. Form denemesi, React'in hata yanıtında bazı alanları sıfırladığını ortaya çıkardı; ana okul formlarında gönderim transition içinde elle başlatılarak taslak korunuyor ve kaydetme süresince buton devre dışı kalıyor. Bu davranış ayrı React DOM testiyle doğrulandı; toplam 31 test.

## 18. Pasif okul görünürlüğü ve tercih listesi — 22 Eylül 2026

- İletişim formu okul araması yalnız aktif okulları listeler; sunucu action'ı gönderilen okulun aktif olduğunu doğrular.
- `016_schools_hide_inactive.sql` canlıya uygulandı (tek BEGIN/COMMIT, `execute_sql`; migration geçmişi yine oluşturulmadı). Canlıda depoda olmayan `schools_select USING (true)` politikası vardı; o da kaldırıldı. Okuma artık `anon_read_active_schools` (anon, yalnız aktif) ve `authenticated_read_schools` (aktif veya admin). Uygulama öncesi hata ile geri alınan denemede bir okul pasife çekildi: anon/üye 183, admin 184 okul gördü. Uygulama anında canlıda pasif okul yoktu; anon REST 184 aktif okul döndürdü.
- `useFavorites` `useSyncExternalStore` ile yeniden yazıldı; sekmeler arası `storage` eşitlemesi var. Saf mantık `src/lib/favorites.ts`. `/tercihlerim` her açılışta ad/slug/ilçe/tür ve son yıl puanlarını yayındaki veriden yeniler; yayında olmayan okul silinmez, işaretlenir.
- 37 test, TypeScript ve üretim derlemesi başarılı; ESLint 26→23 hata. Kalan: `ContactForm.tsx` effect içi setState ve önceki lint borcu. İletişim formu gerçek gönderimle denenmedi.

## 19. Kurumsal bağlılık metni ve iletişim — 22 Eylül 2026

- Kullanıcı doğruladı: proje Akdeniz RAM çalışanlarının gönüllü projesidir, resmî RAM projesi değildir. Kural `PRODUCT.md` Brand Commitments içinde.
- `site-settings.ts` yedek footer metnindeki "RAM koordinatörlüğünde" iddiası kaldırıldı; yedek iletişim info@hedefimlise.com, telefon yok, adres "Mersin, Türkiye".
- `/iletisim` sabit RAM e-postası yerine footer ayarlarını okur.
- Canlı `footer_settings` güncellendi (e-posta info@hedefimlise.com, telefon NULL, adres "Mersin, Türkiye"). Kullanıcı info@ kutusunun açık olduğunu doğruladı.
- Hakkında sayfasında RAM'ler yalnız "Yararlanılan Kaynaklar" altında; "Sosyal Sorumluluk Projesi" etiketi korundu.

## 20. Temizlik ve lint — 22 Eylül 2026

- Canlı footer tanıtım metnindeki yazım düzeltildi ("Mersin'de").
- Kullanılmayan dosyalar silindi: `components/schools/SchoolDetail.tsx`, `components/auth/LoginForm.tsx`, `data/schools.ts`, `data/vocationalFields.ts`, `public/` altındaki Next şablon SVG'leri. Aktif detay bileşeni `components/school/SchoolDetail.tsx`.
- `.claude/worktrees/` altındaki iki eski worktree (temiz, commit'leri `main` içinde) kaldırıldı. ESLint `.claude/**` ve `.next-*/**` dizinlerini taramaz.
- `npx eslint .`: 0 hata, 0 uyarı. `/okullar` aralık yardımcısı modül düzeyine taşındı (davranış aynı; altı filtre URL'sinde canlıyla aynı sonuç). İletişim formu kısa sorguda effect içinde setState yapmaz, sonuçları render'da gizler. Okul detay yükleyicisindeki ham sorgu `console.log`'u kaldırıldı.
- README Hostinger/`main` yayını, test komutu ve migration geçmişi olmayan canlı veritabanı kuralıyla yeniden yazıldı. `.env.example` depoya alındı (`.gitignore` istisnası); kodun okumadığı `NEXT_PUBLIC_GA_ID` satırı çıkarıldı. GA kimliği hâlâ `layout.tsx` içinde sabit.

## 21. Eski yönetim yolları kaldırıldı — 22 Eylül 2026

- Hata: sekmeli yeni/düzenle ekranları da `createSchool`/`updateSchool` kullanıyordu; slug çakışması, zorunlu alan, görsel yükleme, insert ve meslek alanı hataları kullanıcıyı eski `/admin/schools/new` veya `/admin/schools/[id]/edit` sayfasına yönlendiriyor, sekmeli taslak kayboluyordu. Artık tüm bu hatalar `{ success: false, message }` döner (`SchoolFormError`, `readSchoolBasics`); sekmeli form mesajı gösterir, taslak korunur.
- `/admin/schools/new` → kalıcı yönlendirme `/admin/okullar/yeni`; `/admin/schools/[id]/edit` → id'den slug bulunup `/admin/okullar/[slug]/duzenle` (yoksa `/admin?error`). Eski `SchoolForm.tsx` silindi.
- Taslak koruma testi sekmeli forma taşındı; slug çakışması için yeni action testi. 38 test, lint 0, derleme başarılı. Oturumlu tarayıcıda eski yol yönlendirmesi ve slug çakışması denenmedi.

## 22. Yerleştirme türüne göre puan — 22 Eylül 2026

Tasarım: `docs/superpowers/specs/2026-09-22-yerlesim-turune-gore-puan-design.md`; plan: `docs/superpowers/plans/2026-09-22-yerlesim-turune-gore-puan.md`. 16. bölümdeki ertelenen program puanı sorununun kullanıcıyla kararlaştırılan çözümüdür.

- Tek kural `src/lib/school-scores.ts`: veri kümesinin son yılında okul başına **en erişilebilir** değer — merkezi = en büyük yüzdelik, yerel = en düşük OBP; geçerli değer `0 < v <= 100`. Ana sayfa ölçeği, `/okullar` filtre/aralık/sıralama ve liste kartı bunu kullanır. Önceki "en rekabetçi değer" kuralı kalktı.
- Yerleştirme filtresi yalnız `yerel` | `merkezi`; türü `placement_type` değil okulun puanı belirler. Eski `yerel_merkezi` adresleri filtresiz liste açar. Yönetim formu ve detay şeridi `placement_type` üç değerini göstermeye devam eder.
- Alan filtresi merkezi değeri yalnız o alanın yüzdeliğinden hesaplar. Veride sınavlı programlar ayrı "(SINAVLI)" alanlarıdır ve yüzdelikler onlarda; sınavsız alan seçilince kartta OBP görünür.
- Kart: Merkezi seçiliyse yüzdelik, Yerel seçiliyse OBP; seçim yoksa iki puanlı okulda iki satır ("Merkezi", "Yerel OBP"). Sayılar tr-TR.
- Doğrulama (yerel, canlı veri): Merkezi 55, Yerel 126, tam yüzdelik aralığı 55, tam OBP aralığı 126, ikisi birlikte 26, `yerel_merkezi` 184. Fatma Aliye: iki satır %99,73 / 57,04; Merkezi %99,73; Yerel 57,04; alan 78 + Merkezi %72,95; alan 12 → OBP 57,04. Sıralamalar ve değeri olmayanların sonda kalması kontrol edildi. 44 test, lint 0, derleme başarılı; masaüstü ve 375px ekran görüntüsü.

## 23. Yönetim paneli yeniden tasarımı — 23 Eylül 2026

Tasarım: `docs/superpowers/specs/2026-09-23-admin-panel-redesign-design.md`; plan: `docs/superpowers/plans/2026-09-23-admin-panel-redesign.md`; yön özeti: `.impeccable/surfaces/src-app-admin-layout-tsx.md`. Dal: `feat/admin-panel-redesign`; 23 Eylül'de main'e ileri sarma ile birleştirildi ve `3112ddd` olarak canlıya çıktı (push kullanıcı terminalinden yapıldı).

- Genel sayfalar `src/app/(site)/` route group'unda; Navbar/Footer `(site)/layout.tsx` içinde. URL'ler aynı. `/admin` kendi kabuğunu kullanır (`components/admin/shell/AdminFrame.tsx`: gruplu, daraltılabilir yan menü + `/` kısayollu okul arama + kullanıcı menüsü). Daraltma tercihi `admin_sidebar` çerezinde.
- Görsel dil yalnız `.admin` kapsamında: indigo `#4f46e5`, `admin-*` Tailwind renkleri (`globals.css` `@theme inline` + `.admin`), ortak parçalar `components/admin/ui/`. Genel site Exam Blue, ana sayfa `.landing` olarak kaldı.
- Veri sağlığı kuralı `src/lib/school-health.ts`: görsel, açıklama (≥80), tesis, yabancı dil, son puan yılı, son kontenjan yılı, meslek lisesinde alan, telefon. Son yıllar veriden. Eski "eksik içerik" göstergesi (eski dizi sütunlarını okuyup her okulu eksik sayıyordu) kaldırıldı. Canlı veri (23 Eylül): eksik kayıt 66/184; en büyük eksik yabancı dil 41; 2025 puanı yok 29; 2026 kontenjanı yok 26.
- `/admin` = okullar defteri: bağlantılı özet sayaçları, URL filtreleri (`ara`, `ilce`, `tur`, `durum`, `eksik`, `sirala`, `okul`) `history.replaceState` ile (sunucu turu yok), tıklanabilir pip başlık kodları, künye paneli (eksiklerden ilgili form sekmesine "Düzelt"), toplu işlem çubuğu. İlişkiler okul sorgusuna gömülü okunur (tesis ilişkisi 1.931 satırla 1000 satır sınırını aşıyor).
- Okul formu: dikey sekme rayı + veri sağlığı özeti, yapışkan kaydet çubuğu, açıklama sayacı. `UnsavedChangesWarning` artık kayıt sonucunu (`admin-form-settled`) dinliyor: başarısız kayıttan sonra ayrılma uyarısı yeniden çalışıyor (önceden ilk kayıt denemesinden sonra hiç çalışmıyordu).
- Onaysız silen düğmelere onay eklendi: puan, kontenjan, burs, proje (sekmeler), SSS, menü öğesi, footer ve sosyal bağlantı (`components/admin/ui/ConfirmButton.tsx`).
- Mesajlar iki bölmeli (açmak durumu değiştirmez); SSS gruplu ve aranabilir; site ayarları üç ayrı menü sayfası; meslek alanlarında okul sayısı; toplu yükleme `components/admin/bulk-upload/` altında mod başına dosya (gövde birebir taşındı).
- Aktif/pasif ve silme sonrası dönüş: `toggleSchoolStatus`, `bulkUpdateSchoolStatus` ve `deleteSchool` formdaki `return_to` alanını `src/lib/admin-return.ts` ile doğrular (yalnız `/admin?…`; başka adres `/admin`'e düşer) ve bildirimi o adrese ekler. Defter filtreleri ve açık künye paneli korunur; silmede `okul` parametresi atılır. `return_to` yoksa davranış eskisi gibidir.
- Yetki, RLS ve veritabanı değişmedi; server action'larda yalnız yukarıdaki üç action'ın dönüş adresi değişti. 63 test (yeni: `school-health`, `admin-ledger`, `admin-ledger-view`, `admin-return` ve dönüş adresi action testleri), lint 0, üretim derlemesi başarılı. Ekranlar önce oturumsuz, anonim verili geçici bir rotada (commit edilmedi, silindi), sonra kullanıcının kendi girişiyle oturumlu olarak masaüstü/mobil gezildi; `.impeccable/review/`. Canlı veriye yazan işlem (kaydet, sil, aktif/pasif) denenmedi.

## 24. Çok programlı liselerde program bazında puan — 23 Eylül 2026

Tasarım: `docs/superpowers/specs/2026-09-23-cok-programli-lise-programlari-design.md`; plan: `docs/superpowers/plans/2026-09-23-cok-programli-lise-programlari.md`.

- 2026 OBP (okul geneli) 106 okul için yüklendi (kaynak `okul_yerlestirme_puanlari_2026.xlsx`; Excel "Okul kodu" sistem kurum koduyla uyuşmadığından eşleme ilçe + ad ile yapıldı). Son yıl 2026 olduğu için 2026 yüzdelikleri yüklenene kadar merkezi değerler listede görünmez.
- `schools.programs` ve `school_scores.program` (017). 9 ÇPAL'ın 2026 OBP'leri program satırlarına bölündü (018). Tarsus Adalet ÇPAL'ın programları yönetimden seçilmeli.
- Kural `src/lib/school-programs.ts` + `school-scores.ts`; `/okullar` tür filtresi ÇPAL'ları programına göre kapsar; kart iki program satırı; detay tablosunda program satırları.
- Yönetim: okul formunda Programlar, puan sekmesinde 2026 ve Kapsam seçimi, toplu yüklemede Program ve 2026 sütunları.


## 25. Blog bölümü — 24 Eylül 2026

Dal: `feat/blog`. Yön sözleşmesi: `.impeccable/surfaces/src-app-site-blog-page-tsx.md` (seed 7e5d5fdf).

- Kullanıcı blog için Exam Blue'yu istemedi; blog `.blog` kapsamında kendi dünyasıdır ("Ders kitabı bölüm sayfası"): beyaz kâğıt, mürekkep `#14161a`, tek spot renk limon `#f4c534` (yalnız dolgu), Schibsted Grotesk (başlık/plaka) + Literata (okuma). Fontlar yalnız `components/blog/fonts.ts` → `BlogFrame` içinde yüklenir. Ortak Navbar/Footer korunur.
- Public: `/blog` (başlık + kategori sekmeleri/arama, öne çıkan yazı, 3 son yazı, İçindekiler arşivi, 12'li sayfalama; `?kategori=`, `?ara=`, `?sayfa=`), `/blog/[slug]` (kenar dizini + okuma ilerlemesi, paylaş, `/okullar` yönlendirmesi, sıradaki yazılar, BlogPosting + BreadcrumbList JSON-LD), `/blog/rss.xml`, sitemap girişleri. Görsel yoksa kapak = kategori tonunda tipografik plaka + "kapak vurgusu".
- Metin biçimi: `lib/blog-markdown.ts` güvenli Markdown alt kümesi; HTML üretmez, React ağacı basar. Bağlantı/görsel adresleri güvenlik süzgecinden geçer. Desteklenenler yönetim formundaki "Biçimlendirme rehberi"nde.
- Veri: `019_blog_posts.sql` — `blog_posts` tablosu, RLS (ziyaretçi yalnız `is_published` ve `published_at <= now()`; yazma yalnız admin), iki TASLAK yazı (SSS'deki 2026 kılavuz bilgileriyle), görünür "Blog" menü öğesi. Kapaklar `site-assets/blog/`. **24 Eylül 2026 canlıya uygulandı** (kullanıcı onayı; `execute_sql`, tek BEGIN/COMMIT, dosya sha256 81ec95bd…). Tek fark: kod henüz yayında olmadığından menü öğesi `is_visible = false` eklendi (order 6); kod yayına girince görünür yapılmalı. Doğrulama: RLS açık, iki politika, iki taslak, anon REST boş liste döndü ve INSERT 42501 ile reddedildi; güvenlik danışmanında yeni uyarı yok.
- Yönetim: `/admin/blog` (arama, durum süzgeci: Yayında / Zamanlanmış / Taslak), `yeni`, `[id]/duzenle` (başlıktan otomatik adres, sayaçlar, biçim araç çubuğu, İstanbul saatiyle ileri tarihli yayın, kapak yükleme/kaldırma; hata olursa metin korunur), `[id]/onizleme` (public bileşenin aynısı), silme onaylı. Önbellek etiketi `blog-posts`.
- Doğrulama: 95 test (yeni `blog.test`, `blog-actions.test`, `blog.database.test` — PGlite ile RLS ve kısıtlar), tsc, `eslint .` temiz, üretim derlemesi başarılı. Görsel doğrulama commit edilmeyen örnek verilerle masaüstü/mobil yapıldı (`.impeccable/review/blog/`); oturumlu yönetim akışı ve canlı yazma denenmedi.

## 26. Blog yazar profilleri — 24 Eylül 2026

Dal: `feat/blog-authors`.

- `020_blog_authors.sql`: `blog_authors` (ad, slug, unvan, hakkında, fotoğraf, e-posta, telefon, web, Instagram, X, LinkedIn, YouTube; hepsi isteğe bağlı, biçim kısıtlı), RLS (herkes okur, yalnız admin yazar), `blog_posts.author_id` (ON DELETE SET NULL). **Kod bu tabloyu gömülü sorguladığı için migration yayından ÖNCE uygulanmalı**; aksi hâlde yazı sorgusu hata verir ve blog boş görünür. **24 Eylül 2026 canlıya uygulandı** (kullanıcı onayı; `execute_sql`, tek BEGIN/COMMIT, dosyayla aynı). Doğrulama: RLS açık, iki politika, `author_id` ON DELETE SET NULL, anon gömülü sorgu 200, anon INSERT 42501; güvenlik danışmanında yeni uyarı yok.
- Public: `/blog/yazar/[slug]` profil (fotoğraf ya da baş harf plakası, unvan, hakkında, iletişim listesi, yazıları), ProfilePage/Person JSON-LD; yazı sayfasında imza profile bağlanır, sonda "Yazar hakkında" kartı. `yazar` yazılar için saklı adres. Site haritası yalnız yayında yazısı olan yazarları listeler.
- Yönetim: `/admin/blog/yazarlar` (liste, yeni, düzenle, sil); yazı formunda yazar seçimi (boş = "Hedefim Lise"). Yazar adı değişince yazılardaki `author_name` imzası güncellenir; yazar silinirse yazılar kalır, imza düz metin olur. Fotoğraflar `site-assets/blog/yazarlar/`.
- İletişim bilgisi herkese açıktır; formda yalnız yazarın onay verdiği kişisel bilgilerin girilmesi, kurumların resmî iletişim bilgisinin kullanılmaması uyarısı var (PRODUCT.md kurumsal bağlılık kuralı).
- Doğrulama: 102 test (yazar action'ları, saklı adres, yazar seçimi, 020 RLS/kısıt/silme davranışı), tsc, `eslint .`, üretim derlemesi. Görsel kontrol commit edilmeyen örnek verilerle (`.impeccable/review/blog-authors/`); oturumlu yönetim akışı denenmedi.

## 27. Meslek atlası landing belge dünyasında — 28 Eylül 2026

- `/alanlar` artık `.landing` kapsamında (iletişim sayfasıyla aynı iskelet): afiş soru başlığı, altında 8 sütun dizin paneli + 4 sütun yapışkan künye. Kart ızgarası kaldırıldı; 78 kaydın yalnız 2'sinde açıklama/dal vardı ve kartların çoğu boş kalıyordu.
- `lib/vocational-atlas.ts` (`buildAtlas`): "(SINAVLI)" kayıtlarını aynı başlıklı ana alanın altına bağlar, yalnız görünür ve aktif okulları sayar, bağlı okulu olmayan kayıtları dipnot listesine ayırır, Türkçe sıralar ve arama anahtarı üretir (`foldTurkish`). Testi: `tests/vocational-atlas.test.mjs`.
- Dizin: satır başına "bir çizgi = bir okul" şeridi, A–Z / okul sayısı sıralaması (view transition ile satırlar yer değiştirir; azaltılmış harekette kapalı), Türkçe duyarsız arama, harf dizini. Sorgu `schools(is_active)` gömülü seçimle okul sayısını alır; sayfa önbellek davranışı değişmedi (dinamik).
- Alan sayfası (`/alanlar/[slug]`) da aynı dünyaya taşındı: okullar ilçeye göre gruplu tek panelde, puan `/okullar?alan={id}` listesindekiyle aynı (22 okulda karşılaştırıldı, fark yok). Puan hücresi kuralı `SchoolList.tsx`'ten `lib/score-display.ts`'e taşındı; iki sayfa onu kullanır. Künye yalnız veride olanı yazar (dallar, beceriler, kariyer, sınavlı/sınavsız eş program bağlantısı `findSibling`); "Okul listesinde filtrele" → `/okullar?alan={id}`.
- Eski sayfadaki uydurma/sabit metinler kaldırıldı: her dala aynı cümle, "Kamu Kurumları / Özel Sektör / İş Yeri Açma" listesi, M.T.O.K. kontenjanı ve ek puan kutuları (bale ve özel eğitim programlarında da çıkıyordu). `vocational_field_id` kolonu yokken çalışan yedek sorgu da kaldırıldı (kolon canlıda var).
- Kullanılmayan `school/VocationalSchoolList.tsx` ve `lib/vocational-icons.ts` silindi.
