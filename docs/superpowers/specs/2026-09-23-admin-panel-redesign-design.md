# Yönetim paneli yeniden tasarımı — tasarım

Tarih: 23 Eylül 2026. Durum: kullanıcı ekran ekran onayladı, spec incelemesi bekleniyor. Dal: `feat/admin-panel-redesign`.

## Amaç

`/admin` altındaki tüm ekranları modern, sade ve daha işlevsel bir arayüze taşımak. Kullanıcının referansı Sneat tarzı bir admin şablonuydu (beyaz ikonlu gruplu yan menü, üst bar, açık gri zemin, yumuşak gölgeli beyaz kartlar, tek vurgu rengi); görsel birebir kopyalanmaz, yön olarak kullanılır.

## Kararlar (kullanıcı onaylı)

- **Vurgu rengi:** yalnız panelde tanımlı **indigo**. Genel sitenin Exam Blue'su ve ana sayfanın `.landing` dünyası panele taşınmaz; panelin indigosu da panel dışına çıkmaz.
- **Kullanım:** bir iki kişi, çoğunlukla masaüstü. Yoğun tablo ve geniş menü önceliklidir; mobil düzgün çalışır ama birincil hedef değildir.
- **Yön: "Veri Sağlık Defteri".** Ayrı bir KPI panosu yok. Okul listesi panelin kalbidir; özet sayaçlar işin yapıldığı yerde, defterin üstünde durur. Her okulun sabit sekiz maddelik veri sağlığı kontrolü vardır.
- **"Eksik içerik" kuralı gerçek tablolara göre yeniden tanımlanır.** Bugünkü gösterge eski `projects`/`features` dizi sütunlarını okuduğu için (184 okulun 184'ünde `projects`, 180'inde `features` boş) neredeyse her okulu eksik sayıyor.
- **Mimari: route group.** Genel sayfalar `src/app/(site)/` altına taşınır; Navbar/Footer o grubun layout'una geçer. `/admin` kendi kabuğunu alır.
- **`BulkUploadWizard.tsx` bölünür** (davranış birebir aynı).

## Değişmeyecekler

- Tüm server action imzaları ve dönüş sözleşmeleri (`src/app/admin/**/actions.ts`, `src/app/admin/okullar/actions.ts`). Action dosyalarının yolları değişmez (testler bu yolları yükler).
- Yetki: `requireAdmin()` her sayfada kendi çağrısıyla kalır; `proxy.ts` ve RLS'e dokunulmaz. Layout'taki ek `requireAdmin()` yalnız kabuk verisi içindir, sayfaların kontrolünün yerine geçmez.
- Sekmeli formda hata sonrası taslağın korunması (`tests/admin-form-draft.test.mjs`) ve `UnsavedChangesWarning` davranışı.
- Toplu yüklemenin önizleme, hatalı okulu yüklememe, tekrar tıklamayı engelleme ve okul başına atomik RPC davranışı.
- Pasifleştirme/silme onay pencereleri.
- Veritabanı şeması. Yeni sorgular yalnız okuma yapar.

## 1. Mimari: kabuğun siteden ayrılması

- `src/app/(site)/layout.tsx`: bugünkü kök layout'taki `<Navbar />`, `<main className="flex-1">` ve `<Footer />` buraya taşınır.
- `(site)` altına taşınanlar: `page.tsx` (ana sayfa), `alanlar`, `hakkinda`, `iletisim`, `istatistikler`, `login`, `okullar`, `soru-cevap`, `tercihlerim`. URL'ler değişmez.
- Kök kalanlar: `layout.tsx` (html/body, fontlar, GA, yön sözleşmesi yorumu), `globals.css`, `favicon.ico`, `robots.ts`, `sitemap.ts`, `api/`, `auth/`, `admin/`.
- `layout.tsx` gövdesi `min-h-full flex flex-col` kalır; `(site)/layout.tsx` fragment döner.
- Tek kök layout korunduğu için site ↔ admin geçişinde tam sayfa yenileme olmaz.

## 2. Panel görsel dili (`.admin` kapsamı)

Token'lar `globals.css` içinde `.admin` sınıfına bağlı CSS değişkenleri olarak tanımlanır (ana sayfanın `.landing` örneği gibi); panel dışında yoktur.

| Rol | Değer |
| --- | --- |
| Zemin | `#f4f5fa` |
| Kart / menü / üst bar | `#ffffff` |
| Mürekkep | `#1e2235` |
| İkincil metin | `#5b6178` |
| Soluk metin | `#8a8fa3` |
| Çizgi | `#e6e8f0` |
| Vurgu (indigo) | `#4f46e5`, hover `#4338ca`, tint `#eef2ff`, tint metni `#3730a3` |
| Başarı / uyarı / tehlike | emerald `#059669`, amber `#b45309`, rose `#e11d48` (yalnız anlam taşırken) |

- Kartlar: beyaz, 12px köşe, `1px` çizgi + çok hafif gölge (`0 1px 2px rgb(30 34 53 / .04), 0 4px 12px rgb(30 34 53 / .04)`).
- Tipografi: Inter, sabit rem ölçeği (12 / 13 / 14 / 16 / 20px); başlıklar 700. Sayılar `tabular-nums`, sayı sütunları sağa hizalı.
- İndigo yalnız: etkin menü öğesi, seçili satır, birincil düğme, odak halkası, okunmamış rozeti. Ekran başına tek birincil (dolu indigo) düğme.
- Durum asla yalnız renkle anlatılmaz: rozetlerde etiket, piplerde biçim (dolu / çerçeve / çizgi), erişilebilir etiket.
- Tek durum sözlüğü: hover, odak (`ring-2` indigo + offset), basılı, seçili, devre dışı, yükleniyor her bileşende aynı.
- Hareket: 150–200ms, yalnız durum değişimi (panel açılışı, menü daralması). `prefers-reduced-motion` altında kapalı.

### Ortak bileşenler (`src/components/admin/ui/`)

`AdminShell`, `AdminSidebar`, `AdminTopbar`, `SchoolQuickSearch`, `PageHeader` (konum satırı + başlık + eylem yuvası), `Card`, `Button` (primary / secondary / ghost / danger), `Badge`, `HealthPips`, `FlashBanner` (`?success`/`?error`), `EmptyState`, ve form alanları için ortak sınıflar (`adminInput`, `adminLabel`). Sekmelerdeki kopya `inputCls` tanımları bu tek kaynağa bağlanır.

## 3. Kabuk (`src/app/admin/layout.tsx`)

- Giriş sayfası (`x-pathname === "/admin/login"`) kabuksuz kalır; diğer tüm sayfalar kabukla sarılır.
- Layout, giriş dışında `requireAdmin()` çağırır ve kabuk için şunları okur: kullanıcı e-postası, okunmamış mesaj sayısı, toplam okul sayısı, hızlı arama listesi (`id, name, slug, district`).
- **Yan menü** (beyaz, ~240px, masaüstünde sabit):
  - *İçerik:* Okullar (`/admin`, toplam sayı), Toplu yükleme, Meslek alanları.
  - *Ziyaretçiler:* Mesajlar (okunmamış sayısı rozetle), Soru-cevap.
  - *Site:* Genel ayarlar, Menü, Alt bilgi.
  - Altta **Daralt**: yalnız ikon şeridine iner (etiketler `title`/`aria-label` ile). Tercih `admin_sidebar` çerezinde tutulur; layout sunucuda okur, titreme olmaz.
  - Etkin öğe `usePathname` ile belirlenir (istemci alt bileşen). `/admin/okullar/*` → Okullar etkin.
  - `lg` altı: menü, üst bardaki hamburgerle soldan açılan çekmece (odak tuzağı, Esc ile kapanır, arka plan kaydırması kilitli).
- **Üst bar:** "Okul ara ve düzenle…" hızlı arama (`/` kısayolu; Türkçe harf duyarlı eşleşme: `buildTurkishNameRegex` deseni istemcide `new RegExp(desen, "i")` ile kullanılır, ad ve ilçe üzerinde; ok tuşları + Enter düzenleme ekranını açar; `combobox`/`listbox` rolleri), sağda "Siteyi aç" (yeni sekme) ve avatar menüsü (e-posta, Çıkış → mevcut `signOutAdmin`).
- **Sayfa başlığı kalıbı:** konum satırı ("İçerik / Okullar"), 20px/700 başlık, isteğe bağlı açıklama, sağda eylem yuvası. Eski "← Admin Paneli" bağlantıları kaldırılır.
- **Giriş ekranı:** gri zeminde ortalanmış tek kart, "HL" işareti ve "Hedefim Lise · Yönetim", e-posta/şifre, tek indigo "Giriş yap". Action, `next` ve hata kutusu aynen.

## 4. Veri sağlığı kuralı (`src/lib/school-health.ts`)

Saf modül; Supabase ve React içermez. Defter, künye paneli ve form rayı aynı kuralı kullanır.

Sabit sırayla sekiz kontrol:

| Kod | Kontrol | Tamam sayılır | Form sekmesi |
| --- | --- | --- | --- |
| `gorsel` | Görsel | en az bir görsel | Temel |
| `aciklama` | Açıklama | kırpılmış uzunluk ≥ 80 | Temel |
| `tesis` | Tesis | en az bir `school_facilities` kaydı | Tesisler |
| `dil` | Yabancı dil | en az bir dil | Temel |
| `puan` | Puan | veri kümesinin son puan yılında en az bir `school_scores` kaydı | Puanlar |
| `kontenjan` | Kontenjan | veri kümesinin son kontenjan yılında `school_quotas` kaydı | Puanlar |
| `alan` | Meslek alanı | türü "meslek" içeren okulda en az bir alan; diğerlerinde **gerekmez** | Meslek alanları |
| `telefon` | Telefon | boş olmayan telefon | İletişim |

- Durumlar: `ok` / `missing` / `na`.
- Son yıllar veri kümesinden hesaplanır (bugün puan 2025, kontenjan 2026); tabloda hiç kayıt yoksa ilgili kontrol `na` olur.
- "Tam kayıt" = `missing` içermeyen okul.
- Projeler, burslar ve özellikler isteğe bağlıdır; kontrole girmez.
- Mesaj metinleri kuralın içindedir ("Açıklama kısa", "2025 puanı yok"); sayaç başlığı son yılı yazar.
- Eski `getContentWarnings`/`getContentScore` kaldırılır.

## 5. Okullar defteri (`/admin`)

- **Özet şeridi:** Yayında, Pasif, Tam kayıt (x/toplam), "{yıl} puanı yok", Okunmamış mesaj. Sayaçlar bağlantıdır: pasif → `?durum=pasif`, puan → `?eksik=puan`, mesaj → `/admin/mesajlar?durum=okunmamis`. Sıfır olan sayaç soluk.
- **Filtreler** (URL'de): `ara`, `ilce`, `tur`, `durum` (`aktif`/`pasif`), `eksik` (sekiz koddan biri veya `herhangi`), `sirala` (ad A-Z, ad Z-A, son güncellenen, son eklenen, ilçe, tür, **en çok eksik**). Filtre değişimi `router.replace` ile, kaydırma korunarak. Etkin filtre sayısı ve "Sıfırla".
- **Tablo:** seçim kutusu, Okul (ad; altında "ilçe · tür"), durum noktası + etiket, sekiz pip (başlıkta kısaltmalar ve açıklama lejantı), Güncel (göreli tarih; `title` içinde tam tarih). Başlık yapışkan; 184 satır tek sayfada. Satır tıklanabilir ve klavyeyle seçilebilir.
- **Künye paneli** (`?okul=slug`): ad, ilçe · tür, durum; eksikler listesi ve her eksik için ilgili sekmeye **Düzelt →** (`/admin/okullar/{slug}/duzenle?tab=…`); tamam/gerekmez özeti; birincil **Düzenle**; ikincil **Sitede aç** (yalnız aktifken) ve **Pasifleştir/Aktifleştir**; en altta kırmızı metin düğmesi **Okulu sil**. `xl` ve üstünde tablonun sağında sütun; altında sağdan açılan çekmece (Esc, odak yönetimi, kapanınca odak satıra döner).
- **Toplu işlem çubuğu:** seçim varken tablonun altında yapışkan: "N okul seçildi · Aktif yap · Pasif yap · Seçimi temizle". Mevcut `bulkUpdateSchoolStatus` ve pasif onayı.
- **Boş durum:** filtreye uyan okul yoksa "Bu filtrelere uyan okul yok" + "Filtreleri sıfırla".
- **Veri:** mevcut okul sorgusu + salt okuma: `school_scores(school_id, year)`, `school_quotas(school_id, year)`, `school_facilities(school_id)`, okunmamış mesaj sayısı.
- `AdminSchoolList.tsx` parçalanır: `SchoolLedger` (durum + filtre), `LedgerTable`, `SchoolDetailPanel`, `BulkActionBar`, `LedgerSummary`.

## 6. Okul düzenleme ve yeni okul

- **Başlık:** konum satırı, okulun adı + durum; sağda "Sitede aç". Yeni okulda başlık "Yeni okul".
- **Dikey sekme rayı** (`lg` ve üstü; altında bugünkü yatay kaydırmalı çubuk): tepede "Veri sağlığı x/8 tamam"; eksiği olan sekmenin yanında çerçeve nokta (bölüm 4'teki eşleme). Sekmeler `?tab=` ve düz `<a href>` ile kalır (`UnsavedChangesWarning` bağlantı tıklamalarını yakalar).
- **Yeni okulda** 3–7. sekmeler rayda kilitli ve soluk, "Önce temel bilgileri kaydedin" ipucuyla; amber kutu kalkar.
- **Form kartları:** başlıklı beyaz kartlar, masaüstünde iki sütun ızgara, ortak giriş stili (40px, indigo odak). Kuralın bildiği eksik kart başlığında not olarak görünür (açıklamada canlı "42/80" sayacı).
- **Yapışkan kaydet çubuğu** (yalnız Temel/İletişim/Diğer; formun içinde): solda "Kaydedilmemiş değişiklik var" (amber nokta) — `UnsavedChangesWarning` kirli durumu `CustomEvent` ile yayınlar, uyarı mantığı değişmez; sağda İptal + tek birincil kaydet. Başarı: çubukta 4 sn "Kaydedildi" (`role="status"`). Hata: çubuğun üstünde `role="alert"` kutusu, metin aynen.
- **Test sözleşmesi:** konteynerdeki ilk `form` ana formdur ve içinde tek `button[type="submit"]` vardır; hata `role="alert"` içindedir; `SchoolFormTabs` ve alt bileşenleri `next/navigation`dan yalnız `useRouter` ve `useSearchParams` kullanır.
- **Mini-action sekmeleri:** formlar ve action'lar aynı; Puanlar yıl başlıklı tabloya döner (sağa hizalı, tabular sayılar), ↑↓ düğmeleri etiketli ikon düğmeler, silme düğmeleri tek tip.

## 7. Diğer ekranlar

- **Mesajlar:** iki bölmeli gelen kutusu. Solda liste (gönderen, konu, önizleme, göreli tarih; okunmamış kalın + indigo nokta), üstte "Tümü · Okunmamış · Okundu · Yanıtlandı" çipleri (`?durum=okunmamis|okundu|yanitlandi`; yok = tümü; `?mesaj=` ile birlikte kullanılabilir). Sağda seçili mesaj (`?mesaj=id`): bilgiler, ilgili okul (düzenleme ekranına bağlantı), metin; birincil "E-posta ile yanıtla", ikincil "Okundu"/"Yanıtlandı". Açmak durumu değiştirmez. Mobilde liste ve detay ayrı görünümler. Tablo hatası ekranı ve SQL'i korunur.
- **Soru-cevap:** kategoriye göre gruplu liste (sıra, soru, Yayında/Taslak rozeti, kaynak sayfa), arama + kategori filtresi, birincil "Yeni soru" (açılır kart, varsayılan kapalı). Satır içi `<details>` düzenleme korunur; silme ayrı kırmızı metin düğmesi.
- **Meslek alanları:** arama + alan satırları (ad, dal sayısı, okul sayısı), açılınca dallar çip olarak; yeniden adlandırma/silme satır içinde. `VocationalFieldsManager` mantığı ve action'ları aynen; okul sayısı salt okuma sorgusuyla.
- **Site ayarları:** Genel / Menü / Alt bilgi yan menüden ayrı sayfalar; sayfa içi sekme çubuğu kalkar. Formlar ve action'lar aynen; Menü sayfasında sıra no'lu satırlar ve satırda görünürlük anahtarı.
- **Toplu yükleme:** dört mod açıklamalı seçim kartları (beklenen Excel sayfası + "Şablonu indir" → `/api/admin/okul-sablonu`); adım göstergesi yatay ilerleme çubuğu; önizlemede Yeni / Güncellenecek / Atlanacak rozetleri, tabular sayılar.

### `BulkUploadWizard` bölünmesi

`src/components/admin/bulk-upload/` altında: `BulkUploadWizard.tsx` (mod seçici), `BasicUploadWizard.tsx`, `VocationalUploadWizard.tsx`, `ScoreUploadWizard.tsx`, `FacilityUploadWizard.tsx`, ortak parçalar (`StepIndicator.tsx`, önizleme/sonuç yardımcıları) ve saf ayrıştırma yardımcıları (`parsers.ts`). Önce yalnız taşıma (davranış ve JSX aynı, derleme ve testler geçer, ayrı commit), sonra restil. Eski dosya yolu kaldırılır, `toplu-yukle/page.tsx` yeni yolu içe aktarır.

## 8. Ortak durumlar

- Boş durumlar davetle başlar ve tek eylem önerir.
- Kaydetme sırasında düğme "Kaydediliyor…" ve kilitli; tekrar gönderim engelli.
- Yıkıcı işlemler kırmızı ve onaylı; birincil konumda durmaz.
- `?success` / `?error` her ekranda aynı `FlashBanner` ile, kapatılabilir.
- Odak halkası her yerde aynı; tüm ikon düğmelerin `aria-label`'ı var.

## 9. Doğrulama

- Yeni birim testleri: `tests/school-health.test.mjs` (sekiz kontrol, `na` durumları, son yıl hesabı, tam kayıt sayımı, meslek lisesi tespiti). Defter filtre ayrıştırması saf fonksiyonsa onun testi.
- Mevcut `npm test` (44 test + yeniler), `npx eslint .` (0 hata/uyarı), üretim derlemesi (`NEXT_DIST_DIR=.next-verify npx next build`; sonra `.next-verify` silinir, Next'in `tsconfig.json` değişikliği geri alınır).
- Tarayıcı: kullanıcı uygulama içi tarayıcıda `/admin/login` üzerinden kendisi giriş yapar; tüm ekranlar masaüstü (1440) ve mobil (390) genişlikte kontrol edilir. Canlı veriye yazan hiçbir işlem (kaydet, sil, aktif/pasif, mesaj durumu, toplu yükleme onayı) kullanıcı onayı olmadan tetiklenmez.
- Genel site regresyonu: route group taşıması sonrası `/`, `/okullar`, bir okul detayı, `/alanlar`, `/iletisim` açılır; Navbar/Footer görünür, admin'de görünmez.
- `impeccable detect` değişen UI dosyalarında bir kez; ardından bağımsız bitiş incelemesi ve `DESIGN.md`'ye panel dünyasının belgelenmesi (yalnız `/admin` kapsamı).

## Kapsam dışı

- Grafik/analitik pano, rol yönetimi, çoklu kullanıcı etkinlik geçmişi.
- Server action'ların yeniden yazımı, sekme kayıtlarının tek transaction'a alınması.
- Genel sitenin görünümü (yalnız dosya konumu değişir).
- Karanlık tema.
