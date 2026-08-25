import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";
import { createStaticClient } from "@/lib/supabase/static";

// Sitemap build'e çakılı kalmasın: içerik admin panelinden değişiyor, dosya
// canlı veriden yeniden üretilebilmeli. Admin eylemleri ayrıca
// revalidatePath("/sitemap.xml") çağırdığı için değişiklik anında yansır;
// bu süre yalnızca hiçbir eylem tetiklenmediğinde geçerli olan tavan.
export const revalidate = 3600; // 1 saat

// robots.txt'te kapattığımız yollar (admin, login, auth, api, tercihlerim)
// burada da yok: sitemap ile robots birbiriyle çelişmemeli.
const STATIC_ENTRIES = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/okullar", changeFrequency: "daily", priority: 0.9 },
  { path: "/alanlar", changeFrequency: "weekly", priority: 0.8 },
  { path: "/istatistikler", changeFrequency: "weekly", priority: 0.7 },
  { path: "/soru-cevap", changeFrequency: "weekly", priority: 0.6 },
  { path: "/hakkinda", changeFrequency: "monthly", priority: 0.4 },
  { path: "/iletisim", changeFrequency: "monthly", priority: 0.4 },
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const absolute = (path: string) => new URL(path, base).toString();

  const entries: MetadataRoute.Sitemap = STATIC_ENTRIES.map((entry) => ({
    url: absolute(entry.path),
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));

  try {
    const supabase = createStaticClient();

    const [schoolRows, fieldRows] = await Promise.all([
      // is_active filtresi okul detay sayfasındakiyle aynı: pasif okulun
      // sayfası 404 verir, sitemap'e girerse arama motoruna ölü bağlantı olur.
      supabase
        .from("schools")
        .select("slug, updated_at")
        .eq("is_active", true),
      supabase.from("vocational_fields").select("slug"),
    ]);

    for (const row of schoolRows.data ?? []) {
      if (!row.slug) continue;
      entries.push({
        url: absolute(`/okullar/${row.slug}`),
        // lastModified yalnızca gerçek olduğunda yazılır; admin okul
        // güncellerken updated_at'i kendisi set ediyor. Her URL'e "şimdi"
        // basmak arama motoruna yalan söylemek olurdu.
        lastModified: row.updated_at ? new Date(row.updated_at) : undefined,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    for (const row of fieldRows.data ?? []) {
      if (!row.slug) continue;
      // vocational_fields'ta updated_at kolonu yok; lastmod isteğe bağlı,
      // uydurmak yerine boş bırakılıyor.
      entries.push({
        url: absolute(`/alanlar/${row.slug}`),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  } catch {
    // Veri/ağ yoksa (ör. build ortamı DB'ye erişemiyorsa) statik yollarla dön.
    // Eksik sitemap, düşen bir build'den iyidir; bir sonraki revalidate'te dolar.
  }

  return entries;
}
