import type { requireAdmin } from "@/lib/admin-auth";
import {
  BLOG_POST_SELECT,
  mapBlogAuthor,
  mapBlogPost,
  type BlogAuthor,
  type BlogAuthorRow,
  type BlogPost,
  type BlogPostRow,
} from "@/types/blog";

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

const UUID = /^[0-9a-f-]{36}$/i;

export async function loadAdminPost(supabase: AdminClient, id: string): Promise<BlogPost | null> {
  if (!UUID.test(id)) return null;
  const { data } = await supabase.from("blog_posts").select(BLOG_POST_SELECT).eq("id", id).maybeSingle();
  return data ? mapBlogPost(data as BlogPostRow) : null;
}

export async function loadAdminAuthors(supabase: AdminClient): Promise<BlogAuthor[]> {
  const { data } = await supabase.from("blog_authors").select("*").order("name");
  return ((data ?? []) as BlogAuthorRow[]).map(mapBlogAuthor);
}

export async function loadAdminAuthor(supabase: AdminClient, id: string): Promise<BlogAuthor | null> {
  if (!UUID.test(id)) return null;
  const { data } = await supabase.from("blog_authors").select("*").eq("id", id).maybeSingle();
  return data ? mapBlogAuthor(data as BlogAuthorRow) : null;
}
