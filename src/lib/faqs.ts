import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { mapFaq, type Faq, type FaqRow } from "@/types/faq";

function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.",
    );
  }

  return createClient(url, key);
}

export const getPublishedFaqs = unstable_cache(
  async (): Promise<Faq[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("faqs")
      .select("*")
      .eq("is_published", true)
      .order("sort_order")
      .order("created_at");

    if (error) {
      console.error("Soru-cevaplar yüklenemedi:", error.message);
      return [];
    }

    return ((data ?? []) as FaqRow[]).map(mapFaq);
  },
  ["published-faqs"],
  { tags: ["faqs"], revalidate: 60 },
);
