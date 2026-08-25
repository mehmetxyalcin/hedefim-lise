import { createClient } from "@/lib/supabase/server";

// Okulun slug'ı değiştiğinde eskisi school_slug_history'ye düşer
// (migration 013 + schools_slug_history tetikleyicisi). Detay sayfası
// canlı slug'ı bulamadığında buraya bakar: paylaşılmış ya da arama
// motoruna girmiş eski adres 404 yerine kalıcı yönlendirme alır.
export async function findSchoolSlugInHistory(
  oldSlug: string,
): Promise<string | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("school_slug_history")
      .select("school:schools(slug, is_active)")
      .eq("old_slug", oldSlug)
      .maybeSingle();

    if (error || !data) return null;

    // PostgREST tekil ilişkiyi nesne döndürür; şema önbelleği FK'yı
    // henüz görmediyse dizi gelebiliyor. İkisini de karşıla.
    const raw = (data as { school?: unknown }).school;
    const school = (Array.isArray(raw) ? raw[0] : raw) as
      | { slug?: string | null; is_active?: boolean | null }
      | undefined;

    // Pasif okulun detay sayfası zaten 404 veriyor; oraya yönlendirmek
    // arama motoruna ölü bir zincir bırakır.
    if (!school?.slug || school.is_active !== true) return null;

    return school.slug;
  } catch {
    // Tablo yoksa (migration çalıştırılmamışsa) sayfa kendi 404'ünü versin.
    return null;
  }
}
