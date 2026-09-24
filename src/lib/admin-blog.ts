import type { requireAdmin } from "@/lib/admin-auth";
import { mapBlogPost, type BlogPost, type BlogPostRow } from "@/types/blog";

type AdminClient = Awaited<ReturnType<typeof requireAdmin>>["supabase"];

// Formun kategori önerileri: yazılardakiler + SSS ile aynı başlangıç kümesi.
export const DEFAULT_BLOG_CATEGORIES = [
  "Tercih İşlemleri",
  "Yerleştirme",
  "Nakil İşlemleri",
  "Okul Seçimi",
  "Pansiyon ve Kayıt",
  "Genel",
];

export function blogCategoryOptions(posts: { category: string }[]): string[] {
  return [...new Set([...DEFAULT_BLOG_CATEGORIES, ...posts.map((post) => post.category)])];
}

export async function loadAdminPost(supabase: AdminClient, id: string): Promise<BlogPost | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await supabase.from("blog_posts").select("*").eq("id", id).maybeSingle();
  return data ? mapBlogPost(data as BlogPostRow) : null;
}
