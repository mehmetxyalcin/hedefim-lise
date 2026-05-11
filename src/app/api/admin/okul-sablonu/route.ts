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
    { wch: 20 },
    { wch: 30 },
    { wch: 50 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Okullar");

  const buffer: Buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="okul-sablonu.xlsx"',
    },
  });
}
