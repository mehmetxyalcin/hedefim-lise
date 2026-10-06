import { unstable_cache } from "next/cache";
import { createStaticClient } from "@/lib/supabase/static";
import {
  mapFaq,
  mapFaqCategory,
  type Faq,
  type FaqCategory,
  type FaqCategoryRow,
  type FaqRow,
} from "@/types/faq";

export const FAQ_CACHE_TAG = "faqs";

export type QaContent = {
  categories: FaqCategory[];
  /** Yalnız yayında olan kategorilerdeki yayında sorular, kategori ve sıra düzeninde. */
  faqs: Faq[];
};

/**
 * Herkese açık soru-cevap içeriği. Tek önbellek girdisi: sayfa başına ayrı
 * sorgu yerine tüm içerik (yüzlerce satır) bir kez okunur; arama tarayıcıda
 * yapılır. Yönetim eylemleri "faqs" etiketini tazeler. Okuma hatası fırlatılır
 * ki boş sonuç önbelleğe yazılmasın; sayfalar boş içerikle açılır ve bir
 * sonraki istekte yeniden denenir.
 */
const readQaContent = unstable_cache(
  async (): Promise<QaContent> => {
    const supabase = createStaticClient();
    const [categoriesResult, faqsResult] = await Promise.all([
      supabase
        .from("faq_categories")
        .select("id, slug, title, description, sort_order, is_published")
        .eq("is_published", true)
        .order("sort_order")
        .order("title"),
      supabase
        .from("faqs")
        .select("*")
        .eq("is_published", true)
        .order("sort_order")
        .order("created_at"),
    ]);

    const error = categoriesResult.error ?? faqsResult.error;
    if (error) throw new Error(error.message);

    const categories = (categoriesResult.data as FaqCategoryRow[]).map(mapFaqCategory);
    const order = new Map(categories.map((category, index) => [category.id, index]));
    const faqs = (faqsResult.data as FaqRow[])
      .map(mapFaq)
      .filter((faq) => faq.categoryId !== null && order.has(faq.categoryId))
      .sort(
        (a, b) =>
          order.get(a.categoryId!)! - order.get(b.categoryId!)! ||
          a.sortOrder - b.sortOrder ||
          a.createdAt.localeCompare(b.createdAt),
      );

    return { categories, faqs };
  },
  ["qa-content-v3"],
  { tags: [FAQ_CACHE_TAG], revalidate: 300 },
);

export async function getQaContent(): Promise<QaContent> {
  try {
    return await readQaContent();
  } catch (error) {
    console.error("Soru-cevaplar yüklenemedi:", error instanceof Error ? error.message : error);
    return { categories: [], faqs: [] };
  }
}

/** Eski çağrılar için: yayındaki tüm sorular. */
export async function getPublishedFaqs(): Promise<Faq[]> {
  return (await getQaContent()).faqs;
}
