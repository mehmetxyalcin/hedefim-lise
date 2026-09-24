import { unstable_cache } from "next/cache";
import { createStaticClient } from "@/lib/supabase/static";
import { mapBlogPost, type BlogPost, type BlogPostRow } from "@/types/blog";

export const BLOG_CACHE_TAG = "blog-posts";

// Ziyaretçi tarafı: yayındaki ve yayın tarihi gelmiş yazılar, en yeni önce.
// RLS aynı koşulu zaten uygular; sorgudaki filtre niyeti okunur kılar.
// Tablo henüz yoksa (019 uygulanmadan) blog boş durumla açılır, sayfa düşmez.
export const getPublishedPosts = unstable_cache(
  async (): Promise<BlogPost[]> => {
    try {
      const supabase = createStaticClient();
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("is_published", true)
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false });

      if (error) {
        console.error("Blog yazıları yüklenemedi:", error.message);
        return [];
      }
      return ((data ?? []) as BlogPostRow[]).map(mapBlogPost);
    } catch (error) {
      console.error("Blog yazıları yüklenemedi:", error instanceof Error ? error.message : error);
      return [];
    }
  },
  ["published-blog-posts"],
  // İleri tarihli yazı en geç bu süre sonunda görünür.
  { tags: [BLOG_CACHE_TAG], revalidate: 60 },
);

export async function getPublishedPost(slug: string): Promise<BlogPost | null> {
  const posts = await getPublishedPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}
