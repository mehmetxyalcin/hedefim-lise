import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

// /robots.txt — Next'in metadata dosya konvansiyonu.
//
// Kapatılanlar tarama bütçesi değil, mahremiyet ve anlamsızlık gerekçeli:
// admin yüzeyleri ve oturum uçları zaten kimlik doğrulama arkasında, arama
// motorunun oraya girmesinin bir karşılığı yok; /tercihlerim ise listeyi
// tarayıcıda (localStorage) tuttuğu için bot yalnızca boş bir sayfa görür.
//
// /okullar'ın filtre parametreleri (ilce, tur, yuzdelik_min...) kasıtlı olarak
// AÇIK bırakıldı: sayfa zaten `canonical: "/okullar"` veriyor, yani kombinasyonlar
// tek adrese toplanıyor. Burada da kapatmak paylaşılan filtreli bağlantıların
// taranmasını engellerdi.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/login", "/auth/", "/api/", "/tercihlerim"],
    },
    sitemap: new URL("/sitemap.xml", getSiteUrl()).toString(),
  };
}
