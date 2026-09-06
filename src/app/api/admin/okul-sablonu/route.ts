import { type NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(_req: NextRequest) {
  await requireAdmin();

  const XLSX = await import("xlsx");

  const headers = [
    "Kurum Kodu",
    "Okul Adı",
    "İlçe",
    "Okul Türü",
    "Öğretim Şekli",
    "Açıklama",
    "Pansiyon",
    "Sınavlı 2026",
    "Sınavsız 2026",
    "Sınavlı 2025",
    "Sınavsız 2025",
    "Sınavlı 2024",
    "Sınavsız 2024",
    "Telefon",
    "Website",
    "Adres",
  ];
  const example = [
    "733521",
    "Örnek Anadolu Lisesi",
    "Toroslar",
    "Anadolu Lisesi",
    "Normal Öğretim",
    "Mersin'in köklü Anadolu liselerinden biri.",
    "Yok",
    35,
    0,
    30,
    0,
    25,
    10,
    "0324 xxx xx xx",
    "www.ornek.meb.gov.tr",
    "Örnek Mah. Örnek Sk. No:1",
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  ws["!cols"] = [
    { wch: 15 },
    { wch: 40 },
    { wch: 15 },
    { wch: 35 },
    { wch: 20 },
    { wch: 60 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 20 },
    { wch: 30 },
    { wch: 50 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Okullar");

  // ─── Sheet 2: Meslek Alanları ──────────────────────────────────
  const vocHeaders = ["Kurum Kodu", "Meslek Alanı", "Dal"];
  const vocExamples = [
    ["733521", "Bilişim Teknolojileri Alanı", "Yazılım Geliştirme"],
    ["733521", "Bilişim Teknolojileri Alanı", "Ağ İşletmenliği"],
    ["733521", "Sağlık Hizmetleri Alanı", "Hemşire Yardımcılığı"],
    ["745231", "Muhasebe ve Finansman Alanı", ""],
  ];
  const vocNotes = [
    ["NOT: Dal sütunu boş bırakılabilir"],
    ["NOT: Aynı kurum kodunun mevcut tüm meslek alanları silinip yenileri eklenir"],
    ["NOT: Büyük/küçük harf fark etmez"],
  ];
  const wsVoc = XLSX.utils.aoa_to_sheet([vocHeaders, ...vocExamples, [], ...vocNotes]);
  wsVoc["!cols"] = [{ wch: 15 }, { wch: 45 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, wsVoc, "Meslek Alanları");

  // ─── Sheet 3: Puan Bilgileri ───────────────────────────────────
  const scoreHeaders = [
    "Kurum Kodu",
    "Meslek Alanı",
    "OBP 2025", "LGS 2025", "Yüzdelik 2025",
    "OBP 2024", "LGS 2024", "Yüzdelik 2024",
    "OBP 2023", "LGS 2023", "Yüzdelik 2023",
  ];
  const scoreExamples = [
    ["733521", "",                          85.50, 280.25, 65.00, 82.00, 260.00, 70.00, 80.00, 240.00, 72.00],
    ["745231", "Tesisat Teknolojisi",       95.50, 380.25, 15.00, 92.00, 360.00, 18.50, 90.00, 340.00, 22.00],
    ["745231", "Elektrik-Elektronik",       92.00, 360.00, 22.00, 90.00, 340.00, 25.00, 88.00, 320.00, 28.00],
  ];
  const scoreNotes = [
    ["NOT: Kurum Kodu zorunludur, diğer alanlar opsiyoneldir"],
    ["NOT: Meslek Alanı boşsa okul geneli puanı olarak kaydedilir"],
    ["NOT: Meslek Alanı doluysa o alana özel puan kaydedilir (aynı okul için birden fazla satır olabilir)"],
    ["NOT: Sadece dolu alanlar güncellenir; boş bırakılanlar mevcut değeri korur"],
    ["NOT: Ondalık sayılar için nokta (.) kullanın"],
    ["NOT: OBP ve yüzdelik 0-100, LGS 0-500 arasında olmalıdır"],
  ];
  const wsScore = XLSX.utils.aoa_to_sheet([scoreHeaders, ...scoreExamples, [], ...scoreNotes]);
  wsScore["!cols"] = [
    { wch: 15 },
    { wch: 35 },
    { wch: 12 }, { wch: 12 }, { wch: 15 },
    { wch: 12 }, { wch: 12 }, { wch: 15 },
    { wch: 12 }, { wch: 12 }, { wch: 15 },
  ];
  XLSX.utils.book_append_sheet(wb, wsScore, "Puan Bilgileri");

  // ─── Sheet 4: Tesisler ─────────────────────────────────────────
  const facilityHeaders = ["Kurum Kodu", "Tesisler"];
  const facilityExample = [
    "733521",
    "Kütüphane, Bilgisayar laboratuvarı, Kapalı spor salonu, Kantin",
  ];
  const facilityNotes = [
    ["NOT: Tesisler virgülle ayrılmış tek satırda yazılır"],
    ["NOT: Bir tesis eşleşmezse o okulun yüklemesi yapılmaz; mevcut tesisler korunur"],
    ["NOT: Mevcut tesisler silinip yenileri eklenir"],
    ["NOT: Büyük/küçük harf fark etmez"],
  ];
  const wsFac = XLSX.utils.aoa_to_sheet([facilityHeaders, facilityExample, [], ...facilityNotes]);
  wsFac["!cols"] = [{ wch: 15 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, wsFac, "Tesisler");

  const buffer: Buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="okul-sablonu.xlsx"',
    },
  });
}
