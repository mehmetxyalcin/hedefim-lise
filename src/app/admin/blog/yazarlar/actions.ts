"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { contentFormRules, validateAdminForm } from "@/lib/admin-form-validation";
import { requireAdmin } from "@/lib/admin-auth";
import { SLUG_PATTERN, slugifyTr } from "@/lib/blog";
import { BLOG_CACHE_TAG } from "@/lib/blog-data";
import { errorMessage, uploadBlogImage } from "@/lib/blog-storage";

export type AuthorFormState =
  | { success: false; message: string }
  // savedAt dosya alanını sıfırlar; photoUrl kaydedilen fotoğraftır.
  | { success: true; message: string; photoUrl: string | null; savedAt: number }
  | null;

const LIST_PATH = "/admin/blog/yazarlar";

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optional(formData: FormData, key: string) {
  return field(formData, key) || null;
}

function fail(message: string): AuthorFormState {
  return { success: false, message };
}

function refreshAuthors(...slugs: (string | null | undefined)[]) {
  revalidateTag(BLOG_CACHE_TAG, {});
  revalidatePath("/blog");
  // İmza ve yazar kartı bütün yazı sayfalarında görünür.
  revalidatePath("/blog/[slug]", "page");
  for (const slug of new Set(slugs)) if (slug) revalidatePath(`/blog/yazar/${slug}`);
  revalidatePath("/sitemap.xml");
  revalidatePath(LIST_PATH);
  revalidatePath("/admin/blog");
}

export async function saveBlogAuthor(_previous: AuthorFormState, formData: FormData): Promise<AuthorFormState> {
  const { supabase } = await requireAdmin();

  const validationError = validateAdminForm(formData, contentFormRules.saveBlogAuthor);
  if (validationError) return fail(validationError);

  const id = field(formData, "id") || null;
  const name = field(formData, "name");
  const slug = slugifyTr(field(formData, "slug") || name);
  if (!slug || !SLUG_PATTERN.test(slug)) return fail("Adres (slug) en az bir harf veya rakam içermelidir.");

  let previousSlug: string | null = null;
  if (id) {
    const { data: existing, error } = await supabase.from("blog_authors").select("slug").eq("id", id).maybeSingle();
    if (error) return fail(`Yazar okunamadı: ${error.message}`);
    if (!existing) return fail("Yazar bulunamadı; silinmiş olabilir. Sayfayı yenileyin.");
    previousSlug = existing.slug;
  }

  let photoUrl: string | null = field(formData, "current_photo") || null;
  if (formData.get("remove_photo") === "on") photoUrl = null;
  const photoFile = formData.get("photo_file");
  if (photoFile instanceof File && photoFile.size > 0) {
    try {
      photoUrl = await uploadBlogImage(supabase, photoFile, "blog/yazarlar", slug, "Fotoğraf");
    } catch (error) {
      return fail(errorMessage(error, "Fotoğraf yüklenemedi."));
    }
  }

  const record = {
    slug,
    name,
    title: optional(formData, "title"),
    bio: String(formData.get("bio") ?? "").replace(/\r\n?/g, "\n").trim() || null,
    photo_url: photoUrl,
    email: optional(formData, "email"),
    phone: optional(formData, "phone"),
    website_url: optional(formData, "website_url"),
    instagram_url: optional(formData, "instagram_url"),
    x_url: optional(formData, "x_url"),
    linkedin_url: optional(formData, "linkedin_url"),
    youtube_url: optional(formData, "youtube_url"),
    updated_at: new Date().toISOString(),
  };

  const result = id
    ? await supabase.from("blog_authors").update(record).eq("id", id).select("id").single()
    : await supabase.from("blog_authors").insert(record).select("id").single();

  if (result.error) {
    if (result.error.code === "23505") return fail(`“${slug}” adresi başka bir yazarda kullanılıyor. Farklı bir adres girin.`);
    return fail(`Yazar kaydedilemedi: ${result.error.message}`);
  }

  // Yazılardaki imza yazarın güncel adını taşır (RSS ve yazarsız görünümler için).
  if (id) {
    const { error } = await supabase.from("blog_posts").update({ author_name: name }).eq("author_id", id);
    if (error) return fail(`Yazar kaydedildi ancak yazılardaki imza güncellenemedi: ${error.message}`);
  }

  refreshAuthors(slug, previousSlug);

  if (!id) {
    redirect(`${LIST_PATH}/${result.data.id}?success=${encodeURIComponent("Yazar eklendi.")}`);
  }
  return { success: true, message: "Yazar kaydedildi.", photoUrl, savedAt: Date.now() };
}

export async function deleteBlogAuthor(formData: FormData) {
  const { supabase } = await requireAdmin();

  const validationError = validateAdminForm(formData, contentFormRules.deleteBlogAuthor);
  if (validationError) redirect(`${LIST_PATH}?error=${encodeURIComponent(validationError)}`);

  const id = field(formData, "id");
  // Yazılar silinmez: author_id NULL olur, imza metni kalır (020, ON DELETE SET NULL).
  const { data, error } = await supabase.from("blog_authors").delete().eq("id", id).select("slug").single();
  if (error) redirect(`${LIST_PATH}?error=${encodeURIComponent(`Yazar silinemedi: ${error.message}`)}`);

  refreshAuthors(data.slug);
  redirect(`${LIST_PATH}?success=${encodeURIComponent("Yazar silindi. Yazıları imzalarıyla birlikte yayında kalır.")}`);
}
