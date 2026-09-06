# Yönetici kayıt güvenliği — 6 Eylül 2026

## Yerel doğrulama

`npm test`: 17 test başarılı. Gerçek PostgreSQL motoru (PGlite) üzerinde RLS ile reddedilen yazmalarda geri alma; uygulama tarafında yetki reddi, okul bazında gruplama, hatalı okulun bütünüyle atlanması, sayı sınırları ve belirsiz bağlantı sonucu sınanıyor. `tsc --noEmit --incremental false` ve `npm run build` başarılı. Değişen uygulama dosyalarında ESLint: 0 hata, önceki 2 kullanılmayan değişken uyarısı. Arayüz otomatik tasarım taraması bulgu üretmedi; oturum açılmış tarayıcı akışı sınanmadı.

Test şeması canlı şemanın kopyası değildir. Depodaki eski migration'larda eksik olan temel tabloları ve uygulamanın kullandığı `school_scores.vocational_field_id` sütununu test kurulumu tanımlar. Bu nedenle testlerin geçmesi canlı şema uyumluluğunu kanıtlamaz.

## Geçiş planı (aşağıdaki canlı sonuçlarla güncellendi)

İlk yerel doğrulamada bağlantı yoktu. 6 Eylül 2026 tarihinde CLI girişi tamamlandı; aşağıdaki canlı doğrulama ve uygulama kaydı bu durumu günceller.

1. Canlı şemayı ve migration geçmişini incele. Özellikle puanların meslek alanı sütununu, kurum kodunun benzersizliğini, alan ID'lerinin integer ve dal/tesis ID'lerinin UUID olduğunu doğrula. `school_scores` üzerinde yalnız `(school_id, year)` benzersizliği çok alanlı puanlarla çelişir; bu geçmiş şema farkını canlı veri görülmeden kaldırma.
2. Okul, meslek alanı ve dal silmelerinin bağlı tablolarındaki FK silme davranışlarını kontrol et. Yeni kod tek parent DELETE kullanır; RESTRICT olan ilişkilerde silme işlemi veri kaybı olmadan hata verir. Gereken CASCADE değişikliklerini veriyi incelemeden uygulama.
3. Anonim ve normal kullanıcıların doğrudan tablo yazma/rol değiştirme yetkilerini, admin profil sorgusu ve ilgili tabloların RLS kurallarını doğrula. Yeni RPC'ler SECURITY INVOKER kullanır; mevcut RLS'yi atlamaz. Uygulama kontrolü doğrudan API erişimini tek başına güvenceye almaz.
4. Önce test ortamında `supabase/migrations/20260905185222_atomic_school_import.sql` uygula ve aşağıdaki akışları dene; ardından doğrulanmış migration'ı uygulama sürümünden önce canlıya al. Tüm bekleyen eski migration'ları incelemeden topluca çalıştırma.
5. Admin ile temel bilgi/kontenjan, puan, tesis ve alan/dal yüklemelerini dene. Bir okulun son satırını geçersiz yap; o okulun önceki değerleri korunmalı. Diğer başarılı okullar sonuçta ayrı sayılmalı. Alan/tesis düzenleme ekranında boş seçimle temizleme ve bilinmeyen seçimle reddetmeyi dene.
6. Normal kullanıcı ve oturumsuz erişimle yönetim işlemleri reddedilmeli. Bağlantı kesilirse sonuç belirsiz olarak görünmeli; tekrar yükleme öncesinde okul kontrol edilmeli.

## İşlem sınırları

Toplu yüklemede her okul ayrı veritabanı işlemidir; dosyanın tamamı tek işlem değildir. Bir okulun tüm yükleme satırları birlikte kaydedilir veya geri alınır. Boş Excel alanları mevcut değeri korur. Bilinmeyen tesis veya alan, o okulun değişikliklerini reddeder. Yeni okullar pasif oluşturulur. Eksik RPC durumunda yükleme durur; eski parça parça yazma yöntemine dönülmez.

Tek okul formunda tesis ve meslek alanı/dal değiştirme işlemleri birlikte geri alınabilir. Okul oluşturma ve sonrasında ilişki ekleme hâlâ ayrı çağrılardır; ilişki hatasında oluşturulan okul silinmeye çalışılır. Dolayısıyla tüm tek-okul formunun ve görsel depolama işlemlerinin bütünüyle atomik olduğu iddia edilmemelidir. Bu kalan sınır, sonraki iyileştirmede ele alınmalı.

## Canlı uygulama sonucu — 6 Eylül 2026

- Proje: `hsqattqhmvruhdikdayu` (uygulamanın ortam URL'siyle eşleştirildi).
- Canlı katalogdan JSONB okul listeleri ve ek kimlik sütunlu alan bağlantısı tablosu doğrulandı. Migration açık INSERT sütun listelerine ve boş JSON dizilerine uyarlandı; yerel fixture bu yapıyla güncellendi. 17 test tekrar geçti.
- Kurum kodu benzersiz; puanlarda `(school_id, year, COALESCE(vocational_field_id, 0))` benzersiz indeksi var. Yinelenen puan grubu yok. İlgili okul/alan/dal FK'ları CASCADE; iletişim mesajı okul bağı SET NULL.
- Public tablolarda RLS açık. Profil INSERT/UPDATE/DELETE yetkileri anon/authenticated rollerine verilmemiş; profil SELECT kendi kullanıcı kimliğiyle sınırlı. Daha geniş varsayılan TRUNCATE/REFERENCES/TRIGGER ayrıcalıkları mevcut; doğrudan SQL yetki daraltma ayrı takip maddesi.
- `docs/admin-save-smoke.sql` ile gerçek şemada geçici işlem yürütüldü: yeni pasif okul, temel bilgi/kontenjan, puan hatasında rollback, tesis koruma, alan/dal yazma ve temizleme, yetkisiz RPC ve doğrudan okul UPDATE reddi. İşlem ROLLBACK ile geri alındı. Bu, kullanıcı oturumuyla tarayıcı testi değildir.
- `20260905185222_atomic_school_import.sql` tek BEGIN/COMMIT içinde **canlıya uygulandı**, ardından PostgREST şema yenilemesi bildirildi. Mevcut okul kayıtlarını dönüştüren bir veri migration'ı yok; iki fonksiyon eklendi.
- Uygulama sonrasında aynı geri alınan SQL testleri tekrar geçti; kalan geçici okul sayısı 0.
- Dosya SHA-256: `a5070504fbf23ddc42f22e362bd35167f28a8459d289620aee2479769ab33b55`.
- Canlıda `supabase_migrations.schema_migrations` tablosu bulunmuyor. Bu uygulama CLI `db query` ile yapıldı; migration geçmişi oluşturulmadı. İleride geçmişi eşleştirmeden toplu `db push` yapma.
- Önce/sonra güvenlik danışmanı aynı tek uyarıyı verdi: sızdırılmış parola koruması kapalı. Yeni veritabanı güvenlik bulgusu raporlanmadı; Auth ayarı değiştirilmedi.
- **Uygulama kodu henüz dağıtılmadı ve commit edilmedi.** Kalan adım, değişen uygulama sürümünü yayımlamak ve oturumlu yönetim ekranında uçtan uca doğrulamaktır.
