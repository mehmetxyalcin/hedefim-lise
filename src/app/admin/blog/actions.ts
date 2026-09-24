"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { contentFormRules, validateAdminForm } from "@/lib/admin-form-validation";
import { requireAdmin } from "@/lib/admin-auth";
import { fromIstanbulInput, isReservedPostSlug, SLUG_PATTERN, slugifyTr } from "@/lib/blog";
import { BLOG_CACHE_TAG } from "@/lib/blog-data";
import { errorMessage, uploadBlogImage } from "@/lib/blog-storage";

export type BlogFormState =
  | { success: false; message: string }
  // savedAt formdaki dosya alanını sıfırlar; coverImageUrl kaydedilen kapaktır.
  | { success: true; message: string; coverImageUrl: string | null; savedAt: number }
  | null;

const LIST_PATH = "/admin/blog";
const DEFAULT_SIGNATURE = "Hedefim Lise";

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function fail(message: string): BlogFormState {
  return { success: false, message };
}

function refreshBlog(...slugs: (string | null | undefined)[]) {
  revalidateTag(BLOG_CACHE_TAG, {});
  revalidatePath("/blog");
  for (const slug of new Set(slugs)) if (slug) revalidatePath(`/blog/${slug}`);
  revalidatePath("/blog/rss.xml");
  revalidatePath("/sitemap.xml");
  revalidatePath(LIST_PATH);
}

/**
 * Yeni yazı veya güncelleme. Hata durumunda yönlendirmez, mesaj döner:
 * form istemcide olduğu gibi kalır, uzun yazı metni kaybolmaz.
 */
export async function saveBlogPost(_previous: BlogFormState, formData: FormData): Promise<BlogFormState> {
  const { supabase } = await requireAdmin();

  const validationError = validateAdminForm(formData, contentFormRules.saveBlogPost);
  if (validationError) return fail(validationError);

  const id = field(formData, "id") || null;
  const title = field(formData, "title");
  const slug = slugifyTr(field(formData, "slug") || title);
  if (!slug || !SLUG_PATTERN.test(slug)) {
    return fail("Adres (slug) en az bir harf veya rakam içermelidir.");
  }
  if (isReservedPostSlug(slug)) return fail(`“${slug}” adresi blogda başka bir sayfaya ayrılmış. Farklı bir adres girin.`);

  const publish = field(formData, "status") === "yayinda";
  const rawDate = field(formData, "published_at");
  const parsedDate = rawDate ? fromIstanbulInput(rawDate) : null;
  if (rawDate && !parsedDate) return fail("Yayın tarihi geçerli bir tarih ve saat olmalıdır.");
  // Yayına alınırken tarih boşsa yazı hemen görünür; taslakta planlanan tarih korunur.
  const publishedAt = parsedDate ?? (publish ? new Date().toISOString() : null);

  let previousSlug: string | null = null;
  if (id) {
    const { data: existing, error } = await supabase.from("blog_posts").select("slug").eq("id", id).maybeSingle();
    if (error) return fail(`Yazı okunamadı: ${error.message}`);
    if (!existing) return fail("Yazı bulunamadı; silinmiş olabilir. Sayfayı yenileyin.");
    previousSlug = existing.slug;
  }

  // Yazar seçildiyse imza onun adıdır; seçilmediyse yayın imzası.
  const authorId = field(formData, "author_id") || null;
  let authorName = DEFAULT_SIGNATURE;
  if (authorId) {
    const { data: author, error } = await supabase.from("blog_authors").select("name").eq("id", authorId).maybeSingle();
    if (error) return fail(`Yazar okunamadı: ${error.message}`);
    if (!author) return fail("Seçilen yazar bulunamadı; silinmiş olabilir. Sayfayı yenileyin.");
    authorName = author.name;
  }

  let coverImageUrl: string | null = field(formData, "current_cover") || null;
  if (formData.get("remove_cover") === "on") coverImageUrl = null;
  const coverFile = formData.get("cover_file");
  if (coverFile instanceof File && coverFile.size > 0) {
    try {
      coverImageUrl = await uploadBlogImage(supabase, coverFile, "blog", slug, "Kapak görseli");
    } catch (error) {
      return fail(errorMessage(error, "Kapak görseli yüklenemedi."));
    }
  }

  const record = {
    slug,
    title,
    excerpt: field(formData, "excerpt"),
    body: String(formData.get("body") ?? "").replace(/\r\n?/g, "\n").trim(),
    category: field(formData, "category"),
    highlight: field(formData, "highlight") || null,
    cover_image_url: coverImageUrl,
    cover_image_alt: coverImageUrl ? field(formData, "cover_image_alt") || null : null,
    author_id: authorId,
    author_name: authorName,
    is_published: publish,
    published_at: publishedAt,
    updated_at: new Date().toISOString(),
  };

  const result = id
    ? await supabase.from("blog_posts").update(record).eq("id", id).select("id").single()
    : await supabase.from("blog_posts").insert(record).select("id").single();

  if (result.error) {
    if (result.error.code === "23505") return fail(`“${slug}” adresi başka bir yazıda kullanılıyor. Farklı bir adres girin.`);
    return fail(`Yazı kaydedilemedi: ${result.error.message}`);
  }

  refreshBlog(slug, previousSlug);

  const message = publish
    ? publishedAt && new Date(publishedAt).getTime() > Date.now()
      ? "Yazı kaydedildi; yayın tarihinde görünecek."
      : "Yazı kaydedildi ve yayında."
    : "Taslak kaydedildi.";

  if (!id) redirect(`${LIST_PATH}/${result.data.id}/duzenle?success=${encodeURIComponent(message)}`);
  return { success: true, message, coverImageUrl, savedAt: Date.now() };
}

export async function deleteBlogPost(formData: FormData) {
  const { supabase } = await requireAdmin();

  const validationError = validateAdminForm(formData, contentFormRules.deleteBlogPost);
  if (validationError) redirect(`${LIST_PATH}?error=${encodeURIComponent(validationError)}`);

  const id = field(formData, "id");
  const { data, error } = await supabase.from("blog_posts").delete().eq("id", id).select("slug").single();
  if (error) redirect(`${LIST_PATH}?error=${encodeURIComponent(`Yazı silinemedi: ${error.message}`)}`);

  refreshBlog(data.slug);
  redirect(`${LIST_PATH}?success=${encodeURIComponent("Yazı silindi.")}`);
}
