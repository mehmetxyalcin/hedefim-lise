# Yerleştirme türüne göre puan gösterimi — tasarım

Tarih: 22 Eylül 2026. Durum: kullanıcı onayladı, uygulama planı bekleniyor.

## Sorun

2025 verisinde 155 aktif okulun 197 puan kaydı var. 24 okulun birden fazla kaydı var; 20'si meslek lisesi yapısında: okul geneli için bir OBP kaydı (yerel yerleştirme) ve alanlar için ayrı yüzdelik kayıtları (merkezi yerleştirme). Örnek: Fatma Aliye MTAL — OBP 57,04; Çocuk Gelişimi %72,95, Tarım %99,67, Hasta ve Yaşlı Hizmetleri %99,73.

Bugünkü tutarsızlıklar:

1. Liste kartı, okulun son yılındaki ilk gelen kaydı gösteriyor; hangi programın değeri olduğu belirsiz.
2. Puan sıralaması aynı ilk kaydı kullanıyor; ana sayfa ölçeği ve aralık filtresi ise okulun en rekabetçi değerini (en küçük yüzdelik, en yüksek OBP) kullanıyor.
3. Alan filtresi seçildiğinde kart ve sıralama o alanın puanını kullanmıyor.

7 Eylül'de denenen çözüm (6a4cebb) kartın yerine kayıt listesi, açıklamalar ve açılır bölümler koyduğu için geri alındı. Bu tasarım kartın görünümünü korur.

## Kararlar

- Okul başına **en erişilebilir** değer esas alınır: yüzdelikte **en büyük sayı**, OBP'de **en düşük puan**. Soru "bu okula girebilir miyim?" sorusudur.
- Yerleştirme türü okulun **sahip olduğu puandan** çıkarılır: yüzdeliği olan okul merkezi, OBP'si olan okul yerel yerleştirmeyle öğrenci alır; ikisi birden olabilir. `schools.placement_type` filtrede kullanılmaz, detay sayfasında bilgi olarak kalır.
- Okul tek kart olarak kalır.

## 1. Ortak puan kuralı

Yeni dosya `src/lib/school-scores.ts` kuralın tek sahibidir. Ana sayfa ölçeği, `/okullar` filtresi, sıralama ve kart bunu kullanır. Saf fonksiyonlardan oluşur; Supabase veya React içermez.

Girdi, okulun puan satırlarıdır (`year`, `percentile`, `obp_score`, `vocational_field_id`) ve veri kümesinin son yılıdır (şu an 2025; tüm puanlı aktif okulların 2025 kaydı var).

- `merkezi(rows, year, fieldId?)`: o yılın geçerli yüzdeliklerinin en büyüğü. `fieldId` verilirse yalnız o alanın satırları. Geçerli yüzdelik yoksa `null`.
- `yerel(rows, year)`: o yılın geçerli OBP'lerinin en düşüğü. Alan filtresinden etkilenmez; alan kayıtlarında OBP yoktur, OBP okul geneline aittir. Yoksa `null`.
- Geçerli değer: sonlu sayı, `> 0` ve `<= 100`; boş, sıfır ve aralık dışı değerler yok sayılır. 2025 verisinde bu kurala takılan kayıt yok (22 Eylül 2026 kontrolü), dolayısıyla ölçek sayıları değişmez.

## 2. Ana sayfa ölçeği (`src/app/page.tsx`, `ScoreScale.tsx`)

- Yüzdelik dağılımı okul başına `merkezi`, OBP dağılımı okul başına `yerel` değerlerinden çizilir. Okul sayıları değişmez (yüzdelik 55, OBP 126, ikisi birden 26); konumlar değişir (Fatma Aliye %72,95 yerine %99,73).
- Ölçekten yapılan arama, aynı tanımla listeye gider: ölçekteki her işaret listedeki bir okuldur.
- Kodda "en rekabetçi değer" anlatan yorumlar ve `DESIGN.md` içindeki "most-competitive" ifadeleri yeni kurala göre güncellenir.
- Öne çıkan okul şeridi bu işin kapsamında değildir; bugünkü "en düşük yüzdelik" seçimi korunur.

## 3. Okul listesi (`src/app/okullar/page.tsx`, `SchoolList.tsx`)

**Yerleştirme filtresi** iki seçeneğe iner: "Yerel", "Merkezi". "Her İkisi" kalkar.

- `yerlestirme=merkezi`: `merkezi` değeri olan okullar.
- `yerlestirme=yerel`: `yerel` değeri olan okullar.
- Başka değerler (eski `yerel_merkezi` bağlantıları dahil) filtre yokmuş gibi davranır.
- Filtre `placement_type` sütununa değil, son yıl puanlarına uygulanır; mevcut ID daraltma yolu (`schoolIdFilter`) kullanılır.

**Aralık filtreleri** (`yuzdelik_min/max`, `obp_min/max`) `merkezi` ve `yerel` değerlerine uygulanır. İkisi birlikte verilirse okul iki koşulu da sağlamalıdır (bugünkü kesişim davranışı).

**Alan filtresi** (`alan`) seçiliyse `merkezi` yalnız o alanın yüzdeliğinden hesaplanır; bu değer kartta, yüzdelik sıralamasında ve yüzdelik aralığında kullanılır. Okul hâlâ alan ilişkisine göre listelenir (bugünkü davranış); seçilen alanın yüzdeliği yoksa okulun merkezi değeri `null` olur.

**Sıralama**: `yuzdelik_*` `merkezi` değerine, `obp_*` `yerel` değerine göre yapılır. Değeri olmayan okullar her iki yönde de sona gider; eşitlikte okul adı (tr) belirler. İsim sıralaması değişmez.

## 4. Kart

Kart düzeni ve sağdaki kutunun boyutu değişmez; yalnız kutunun içeriği değişir. Sayfa, her okul için hesaplanmış `merkezi` / `yerel` değerlerini ve yılı karta verir; kart kuralı yeniden hesaplamaz.

- `yerlestirme=merkezi`: tek büyük değer, etiket "Yüzdelik Dilim", değer `%99,73`.
- `yerlestirme=yerel`: tek büyük değer, etiket "OBP Puanı", değer `57,04`.
- Seçim yok:
  - Tek değeri olan okul: bugünkü gibi tek büyük değer ve etiketi.
  - İki değeri olan okul: kutu iki kısa satıra bölünür — "Merkezi %99,73" ve "Yerel OBP 57,04".
  - Değeri olmayan okul: "Veri yok".
- Yıl etiketi korunur. Sayılar Türkçe biçimde, iki ondalıkla yazılır.

## 5. Kapsam dışı

Okul detay sayfası, tercih listesi, LGS sıralaması, öne çıkan okul şeridi, veritabanı şeması. Migration yok.

## 6. Test ve doğrulama

- `tests/school-scores.test.mjs`: en büyük yüzdelik ve en düşük OBP; alan filtresinin yalnız merkezi değeri etkilemesi; eski yılların ve geçersiz değerlerin (0, boş, 100 üstü) yok sayılması; değeri olmayanın sıralamada sona gitmesi ve isimle eşitlik çözümü.
- Gerçek veriyle yerel `/okullar` kontrolü: "Merkezi" 55, "Yerel" 126 okul; tam aralık araması ölçekteki sayıyla aynı; eski `yerlestirme=yerel_merkezi` filtresiz liste.
- Fatma Aliye kartı: seçim yokken iki satır, Merkezi'de %99,73, Yerel'de OBP 57,04.
- Masaüstü ve mobil ekran görüntüsü; `npm test`, `npx eslint .`, üretim derlemesi.
