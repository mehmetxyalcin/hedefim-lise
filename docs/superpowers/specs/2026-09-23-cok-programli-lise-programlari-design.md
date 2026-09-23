# Çok programlı liselerde program bazında puan ve tür — tasarım

Tarih: 23 Eylül 2026. Durum: kullanıcı onayladı, uygulama planı bekleniyor.

## Sorun

Sistemde 10 çok programlı Anadolu lisesi (ÇPAL) var; `schools.type` hepsinde "Çok Programlı Anadolu Lisesi". Bu okulların bir kısmı iki programla öğrenci alır: Anadolu Lisesi programı ve Anadolu Meslek Programı. Her programın ayrı OBP taban puanı vardır.

Bugünkü tutarsızlıklar:

1. `school_scores` okul geneli veya meslek alanı bazında satır tutar; "program" boyutu yoktur. 2026 OBP yüklemesinde (23 Eylül) iki programlı okullara iki değerden düşüğü yazıldı, diğer programın değeri kayboldu. Örnek: Merkez Gözne ÇPAL — Meslek 52,082 kaydedildi, Anadolu Lisesi 53,869 yok.
2. `/okullar` tür filtresi `type = seçilen tür` çalışır. "Anadolu Lisesi" veya "Anadolu Meslek Programı" seçen öğrenci ÇPAL'ları hiç görmez.

## Kararlar

- Öğrenci her programın OBP'sini ayrı görür ve okul, programlarına göre "Anadolu Lisesi" / "Anadolu Meslek Programı" filtrelerinde de çıkar.
- Okul **tek kart** kalır; favori, tercih listesi ve detay sayfası tek okul olarak çalışır.
- Okulun programları yönetimde **elle seçilir**; puanlardan çıkarılmaz. Puanı olmayan program da filtrede görünür.
- Veri modeli: puan tablosuna `program` kolonu (yaklaşım A). Sahte meslek alanı ve ayrı program tablosu reddedildi.

## 1. Veri modeli ve taşıma

İki migration: `017_school_programs.sql` şema ve içe aktarma fonksiyonu (testlerde de yüklenir), `018_cpal_2026_program_scores.sql` canlıya özel veri taşıma (okul ID'lerine bağlı).

**Şema**

- `schools.programs text[] not null default '{}'`. Değerler `anadolu_lisesi`, `meslek`; CHECK ile bu kümeyle sınırlı. Yalnız ÇPAL'larda anlamlıdır; diğer okullarda boş kalır.
- `school_scores.program text null`. `null` = okul geneli (bugünkü anlam). CHECK: `program in ('anadolu_lisesi','meslek')` veya `null`.
- `school_scores_unique_idx` `(school_id, year, coalesce(vocational_field_id,0))` yerine `(school_id, year, coalesce(vocational_field_id,0), coalesce(program,''))` olur.
- RLS değişmez; yeni kolonlar mevcut politikaların altındadır.

**Veri taşıma**

- 2023–2025 ÇPAL puanları olduğu gibi okul geneli kalır; kaynağı bilinmeyen geçmiş programa atanmaz.
- 2026: aşağıdaki 9 okulun `program is null` 2026 satırı silinir, yerine `okul_yerlestirme_puanlari_2026.xlsx` değerleriyle program satırları yazılır (OBP kolonu 3 ondalık, yarım yukarı yuvarlanır).
- `schools.programs` ilk kez aynı dosyadan doldurulur. Tarsus Adalet ÇPAL (id 121) verisiz olduğu için boş kalır; yönetimden seçilir.

| id | Okul | Anadolu Lisesi | Meslek | programs |
|---|---|---|---|---|
| 37 | Aydıncık ÇPAL | 72,650 | 45,326 | ikisi |
| 43 | Kasım Ekenler ÇPAL | 44,216 | 50,271 | ikisi |
| 62 | Zeyne ÇPAL | 51,351 | — | anadolu_lisesi |
| 95 | Atayurt Gazi ÇPAL | 57,133 | 33,216 | ikisi |
| 96 | Silifke Yeşilovacık ÇPAL | 51,626 | 54,452 | ikisi |
| 119 | Yenice Şehit Hüseyin Aytürk ÇPAL | 54,517 | 35,806 | ikisi |
| 120 | Tarsus Gülek İbrahim Günay ÇPAL | 59,663 | — | anadolu_lisesi |
| 153 | Merkez Gözne ÇPAL | 53,869 | 52,082 | ikisi |
| 154 | Arslanköy Yahya Aydın ÇPAL | 54,609 | 43,115 | ikisi |

Migration yalnız ekleme yapar; canlıdaki eski kod program satırlarını da okur ve en düşük OBP'yi alır, yani site migration ile kod yayını arasında bugünkü gibi görünür. Canlı veritabanına uygulamadan önce kullanıcı onayı alınır.

## 2. Puan kuralı (`src/lib/school-scores.ts`)

- `ScoreInput` `program?: "anadolu_lisesi" | "meslek" | null` alanını alır.
- `placementValues(rows, year, fieldId, program?)`:
  - `program` verilirse `yerel` = o yılın o programa ait geçerli OBP'lerinin en düşüğü. O yıl bu programa ait satır yoksa okul geneli (`program null`) satırlarına düşülür.
  - `program` verilmezse bugünkü kural: o yılın tüm geçerli OBP'lerinin en düşüğü.
  - `merkezi` programdan etkilenmez.
- Yeni saf fonksiyon `programOBPs(rows, year)`: o yılın program bazında en düşük OBP'lerini döndürür (`{ anadolu_lisesi: number | null, meslek: number | null }`); kart iki satırı buradan çizer.
- Ana sayfa ölçeği değişmez: ÇPAL tek nokta, programsız kuralla (en düşük OBP).

## 3. Tür filtresi (`src/app/(site)/okullar/page.tsx`)

Tür ile program eşlemesi tek yerde tutulur (ör. `src/lib/school-programs.ts`):

- `Anadolu Lisesi` → `anadolu_lisesi`
- `Anadolu Meslek Programı` → `meslek`

Filtre:

- Eşlemesi olan tür seçilince sorgu `type = tür` **veya** (`type = 'Çok Programlı Anadolu Lisesi'` ve `programs` o programı içerir) olur.
- Aynı durumda sayfa `placementValues`'a programı geçirir; kart, OBP sıralaması ve OBP aralığı o programın değerini kullanır.
- "Çok Programlı Anadolu Lisesi" ve diğer türler değişmez.
- Ana sayfa ölçeğindeki tür seçimi dağılımı süzmez, yalnız `tur` parametresiyle `/okullar`'a gider; eşleme orada uygulandığı için ölçekten gelen aramalar da ÇPAL'ları kapsar.

## 4. Öğrenci ekranları

**Liste kartı (`SchoolList.tsx` `ScoreBox`)**: düzen ve boyut değişmez.

- Tür filtresiyle program seçiliyse: tek büyük değer, etiket "OBP Puanı".
- Program seçili değilse, yerleştirme "Merkezi" değilse ve okulun o yıl iki program OBP'si varsa: bugünkü iki satırlı `dl` düzeni, etiketler "Anadolu Lisesi" ve "Meslek Programı".
- Diğer durumlar bugünkü gibi.

**Detay puan tablosu (`SchoolScoreCard.tsx`)**: program satırları "Anadolu Lisesi Programı" / "Meslek Programı" etiketiyle ayrı satırdır; okul geneli ve alan satırları bugünkü gibi.

**Kapsam dışı**: tercih listesi ve favoriler okulun en düşük OBP'sini göstermeye devam eder. `/alanlar` sayfaları değişmez.

## 5. Yönetim paneli

- **Okul formu**: tür "Çok Programlı Anadolu Lisesi" iken "Programlar" alanı: iki onay kutusu (Anadolu Lisesi, Anadolu Meslek Programı). Başka türde alan görünmez ve kaydedilen değer boş dizi olur. Sunucu tarafı doğrulama bilinmeyen değeri reddeder.
- **Puanlar sekmesi (`ScoresTab.tsx`)**: ÇPAL'da puan satırında "Program" seçimi (Okul geneli / Anadolu Lisesi / Meslek Programı); liste satırları program etiketi taşır. Seçilen program okulun `programs` listesinde değilse kayıt reddedilir.
- **Toplu puan yükleme**: şablona isteğe bağlı "Program" sütunu (`Anadolu Lisesi`, `Meslek Programı` veya boş) ve `OBP 2026`, `LGS 2026`, `Yüzdelik 2026` sütunları eklenir. `import_school_rows` puan modu yıl dizisine 2026'yı ekler, `program` değerini okur, satırı `(school_id, year, alan, program)` ile bulur. Okulda olmayan program ve program + meslek alanı birlikte verilmesi anlaşılır hatayla reddedilir.

## 6. Test ve yayın

- Birim testleri: program parametreli `yerel`; programa ait satır yoksa okul geneline düşüş; `programOBPs`; tür→program eşlemesi; içe aktarma satır doğrulaması (program değeri, 2026 sütunları).
- ESLint, üretim derlemesi.
- Yerel önizleme (canlı veri, migration sonrası): Gözne kartı iki satır (53,87 / 52,08); "Anadolu Lisesi" filtresinde Gözne 53,87, "Anadolu Meslek Programı" filtresinde 52,08; Zeyne yalnız Anadolu Lisesi filtresinde; detay tablosunda program satırları; masaüstü ve 375px.
- Sıra: (1) kullanıcı onayıyla migration ve 2026 program verisi canlıya; (2) kullanıcı onayıyla push.
- Belgeler: `DESIGN.md` puan kuralı notu, `PROJECT_HANDOFF.md` yeni bölüm; §23'teki eski "main'e birleştirilmedi" notu düzeltilir.
