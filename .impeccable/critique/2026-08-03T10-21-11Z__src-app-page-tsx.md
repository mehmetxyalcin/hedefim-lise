---
target: ana sayfa (landing)
total_score: 26
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 2
timestamp: 2026-08-03T10-21-11Z
slug: src-app-page-tsx
---
# Critique — Ana Sayfa (Landing: Hero + FeatureSection)

Method: dual-agent (A: a3b722fea22f6d7a1 · B: a01537458a80ff910) · Mode: Persuade

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|:---:|-----------|
| 1 | Visibility of System Status | 3 | "Okul Ara"da uçuş-anı geri bildirimi yok; Button `loading` desteği var ama Hero geçmiyor |
| 2 | Match System / Real World | 4 | Gerçek Mersin ilçeleri + tam terminoloji; tek zayıflık "Robot" |
| 3 | User Control and Freedom | 2 | `disabled hidden` placeholder → ilçe/tür seçilince "tümü"ne geri dönülemiyor |
| 4 | Consistency and Standards | 3 | Cyan açık gövdeye sızıyor; sistemin kendi Two-Worlds kuralını çiğniyor |
| 5 | Error Prevention | 4 | Select'ler girişi kısıtlıyor; boş arama geçerli yol |
| 6 | Recognition Rather Than Recall | 4 | Seçenek ve etiketler görünür |
| 7 | Flexibility and Efficiency | n/a | Tek-atışlık Persuade girişi; güç-kullanıcı filtresi araçta |
| 8 | Aesthetic and Minimalist | 3 | Hero yığın: rozet+başlık+alt+arama+2 chip+tam hukuki paragraf, 4 glow üstünde |
| 9 | Error Recovery | 3 | Başarısız/eşleşmeyen rota için geri bildirim yolu yok |
| 10 | Help and Documentation | n/a | Persuade yüzeyi; FAQ ("Soru-Cevap") başka yerde |
| **Total** | | **26/32 (81%)** | **Good** |

Uygulanan maksimum 32 (H7 ve H10 = n/a). İki puan kaybı doğrudan sistemin kendi kurallarını çiğnemesinden (H3 reset kilidi, H4 cyan sızıntısı).

## Design Specificity Verdict

**Hero için ürüne özgü; alt yarıda kategori-değiştirilebilir.**

Hero hak ediyor: koyu `#071426` "gece rehberlik masası" dünyası, üstünde yükselen beyaz arama paneli, 13 gerçek Mersin ilçesiyle canlı `İlçe` seçici. Türkçe alan sözlüğü (İlçe, Okul Türü, LGS tercih rehberi) ve dürüst uyarı taşıyıcı karakter.

`FeatureSection` bunu harcıyor: 3'lü kart gridi, jenerik Lucide ikonları, başlık+açıklama+"Daha Fazla →". Kopyayı değiştir, sigorta da satar CRM de. **İçinde Mersin yok, veri yok, okul yok.** Üç kartın ikisi aynı URL'ye (`/okullar`) gidiyor.

**En büyük kaçırılmış fırsat:** ürünün tüm farklılaştırıcısı *güncel, güvenilir, yerel Mersin verisi* — ama landing **sıfır veri gösteriyor.** Okul sayısı yok, "13 ilçe" yok, 2026 yüzdelik aralığı yok, örnek okul kartı yok. Üstelik kullanıcı elinde bir yüzdelikle geliyor; hero ise ilçe ve tür soruyor, **geldikleri sayıyı hiç sormuyor.**

**Deterministik tarama (Assessment B):** detektör 2 uyarı buldu, **ikisi de yanlış pozitif** — (1) Hero'daki gradient-clipped "Bilinçli" kelimesi (DESIGN.md'de tanımlı hero-only cihaz), (2) FeatureSection'da `text-slate-600 on bg-blue-600` (hover'da `group-hover:text-white` de var; slate hiçbir zaman mavi üstüne düşmüyor). Gerçek antipattern yok. Tarayıcı otomasyonu bu oturumda yok — görünür overlay iddiası yok.

## Overall Impression

Güvenilir, iyi işlenmiş bir hero (birinci ekranda tepe) → stok bir özellik gridi, kendi kendine kırılmış Two-Worlds kuralı, veri göstermeyen bir veri ürünü ve öğrencinin kaygısını yatıştırmadan önce yükselten bir tonla aşağı çekiliyor. En büyük fırsat: **farklılaştırıcıyı (yerel güncel veri) landing'de görünür kıl.**

## What's Working

1. **Koyu/açık ikilik gerçek, dekoratif değil.** `#071426` hero + katmanlı glow + soluk grid, üstünde yükselen beyaz `shadow-2xl` arama paneli — "Güvenilir Rehberlik Masası" North Star'ı gerçekten uyguluyor. Tıklamadan önce güven kazanıyor.
2. **Alan sadakati ve dürüstlük.** 13 gerçek ilçe, tam terminoloji, aşırı-iddia etmeyen uyarı (sahte MEB onayı yok) — üç okuryazarlığa da hizmet ediyor.
3. **One-Signal disiplini etkileşim katmanında.** Son düzeltmeler tutuyor: CTA artık mavi Button primary, üç özellik ikonu tek slate→hover-mavi tonuna birleşti.

## Priority Issues

### [P1] Two-Worlds kuralı açık gövdede kırık
- **Why:** FeatureSection zemini `from-sky-50 via-cyan-50/55 to-white`, `bg-cyan-200/25` glow, kart hover `border-cyan-200`. DESIGN.md: "veri kartındaki cyan glow sistemi bozar." Sinyal mavisini zayıflatıyor, kuralı öneriye indiriyor.
- **Fix:** gövdeyi mavi/slate'e çevir (`via-blue-50/40`, glow `bg-blue-200/15`, hover border `slate-300`/`blue-200`).
- **Command:** `/impeccable colorize`

### [P1] Farklılaştırıcı görünmez; giriş kullanıcının başlangıç durumunu yok sayıyor
- **Why:** Sayfada hiç gerçek veri yok (okul/ilçe sayısı, yüzdelik aralığı, örnek kart), hero yalnızca İlçe+Tür sunuyor — kullanıcı elinde yüzdelikle geldiği halde. Veri ürünü için ikna jenerik iddiaya düşüyor; en hızlı yol (yüzdelikle filtrele) kapıda yok.
- **Fix:** kanıt yüzeye çıkar ("13 ilçe · N okul · 2026 verileri" + 1 örnek okul kartı); hero girişine yüzdelik/isim alanı ekle.
- **Command:** `/impeccable shape`

### [P2] Select'ler "tümü"ne sıfırlanamıyor
- **Why:** `<option value="" disabled hidden>` — ilçe/tür seçilince reload olmadan seçimsize dönülemiyor. Danışmanlar bunu her öğrencide yaşar (H3).
- **Fix:** ilk seçeneği seçilebilir yap — `value=""` "Tüm İlçeler"/"Tüm Türler", `disabled hidden` kaldır.
- **Command:** `/impeccable harden`

### [P2] Karar anında ton çukuru
- **Why:** Korku çerçeveli başlık ("Geleceğini Şansa Bırakma") + hero içinde soğuk hukuki paragraf, ikisi de kaygılı 8. sınıfa tam karar anında çarpıyor. North Star "sakin/güven veren" ile çelişiyor.
- **Fix:** H1'i güven verici tona çevir; uyarıyı info-toggle arkasına al (aşamalı açığa çıkarma).
- **Command:** `/impeccable clarify`

### [P3] "Güncel Veriler (2026)" chip'inde semantik renk uyumsuzluğu
- **Why:** Onay tik'i (`CheckCircle2`) amber renkte + `orange-200/20` kenar. Tik = başarı (emerald), uyarı (amber) değil. Meaning-Only Rule sapması.
- **Fix:** onay tik'ini emerald yap veya tik'i kaldırıp nötr güncellik rozeti bırak.
- **Command:** `/impeccable colorize`

## Persona Red Flags

**Jordan (ilk kez):** "İlçe Seçiniz"/"Okul Türü Seçiniz" emir kipi zorunlu gibi okunuyor ama boş "Okul Ara" çalışıyor — karışık sinyal. Elindeki yüzdeliği koyacak yer yok. Hero'daki hukuki paragraf korkutucu ince-yazı gibi.

**Riley (stres testçi):** İlçe seç → "tüm ilçeler"e dönmek istiyor → dönemiyor (disabled+hidden). Boş "Okul Ara" → sessizce `/okullar`'a gidiyor, onay yok. CTA'ya çift tık → Hero `loading` geçmediği için `router.push` iki kez tetiklenebilir.

**Casey (dağınık mobil):** Mobilde panel `flex-col` — iki tam-genişlik select butonun üstüne yığılıyor, birincil aksiyon aşağı itiliyor; sonra yoğun hukuki paragraf viewport yiyor. Tercih döneminde telefon ağırlıklı → yüksek bounce. Dört glow + 56px grid mobilde bedava boyama maliyeti.

## Minor Observations

- İki kart aynı hedefe (`/okullar`) gidiyor; "Proje Okullarını Tanı" proje-okul filtresine deep-link olmalı.
- Dropdown'lar `ChevronDown` yerine `rotate-90 ChevronRight` kullanıyor.
- `size="lg"` = `py-3 text-sm`; Hero `text-base` ile yamalıyor — lg token hero için küçük.
- `<title>` yalın "Hedefim Lise" — etikette "Mersin"/tanımlayıcı yok.
- `bg-[#071426]` token yerine sabit değer — DESIGN.md `night-hero` ile drift riski.

## Questions to Consider

1. Var oluş sebebin yerel güncel Mersin verisi. Neden landing bunun hiçbirini göstermiyor — tek sayı, tek örnek, tek yüzdelik bile?
2. Kullanıcı elinde yüzdelikle giriyor. Neden kapı ilçe ve tür soruyor da geldiği sayıyı hiç sormuyor?
3. "Geleceğini Şansa Bırakma" Rehberlik Masası mı konuşuyor yoksa reklam panosu mu?
4. Two-Worlds sistemin imzası. Bir sonraki bölümde kendin kırıyorsan, kural mı mood board mı?
5. Bir danışman bir öğleden sonra 30 öğrenci geçiriyor. Un-pick olmayan ilçe dropdown'uyla kaç kez boğuşacak?
6. Üç jenerik araç kartıyla bitiyorsun. Sayfanın neresinde kaygılı bir çocuk "bunu yapabilirsin" duyuyor?
