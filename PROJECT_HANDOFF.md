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
| `/` | `src/app/page.tsx`; aktif okul sayıları, son puan yılı, dağılımlar, öne çıkan okul |
| `/okullar` | `src/app/okullar/page.tsx`; sunucuda sorgu/filtre/sayfalama; `components/schools/SchoolList.tsx` etkileşimleri |
| `/okullar/[slug]` | `lib/supabase/schoolDetail.ts` → **`components/school/SchoolDetail.tsx`** |
| `/alanlar` | Supabase meslek alanları → `components/vocational/VocationalAtlas.tsx` |
| `/alanlar/[slug]` | Alan + ilişkili aktif okullar + alan puanları → `VocationalDetail.tsx` / `school/VocationalSchoolList.tsx` |
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
