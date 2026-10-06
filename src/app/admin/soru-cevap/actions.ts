"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { contentFormRules, qaFormRules, validateAdminForm } from "@/lib/admin-form-validation";
import { requireAdmin } from "@/lib/admin-auth";
import { FAQ_CACHE_TAG } from "@/lib/faqs";
import { RESERVED_CATEGORY_SLUGS, slugifyQuestion, uniqueSlug } from "@/lib/qa";
import { qaAdminHref, readReturnState, type QaAdminState } from "@/lib/qa-admin";

const DEFAULT_SOURCE = "2026 Yılı Ortaöğretime Geçiş Tercih ve Yerleştirme Kılavuzu";
const SORT_STEP = 10;

type Admin = Awaited<ReturnType<typeof requireAdmin>>;
type Db = Admin["supabase"];
type DbError = { code?: string; message: string } | null | undefined;

// Tek bir "kayıt değişti" bildirimi: herkese açık sayfalar, site haritası ve
// panelin kendisi. Her değiştiren eylem bunu başarıdan önce çağırır.
function refreshQa() {
  revalidateTag(FAQ_CACHE_TAG, {});
  revalidatePath("/soru-cevap", "layout");
  revalidatePath("/admin/soru-cevap");
  revalidatePath("/sitemap.xml");
}

function field(form: FormData, key: string): string {
  const value = form.get(key);
  // Tarayıcı satır sonlarını \r\n gönderir; veritabanı sınırları ve Markdown
  // için \n'e çevrilir.
  return typeof value === "string" ? value.replace(/\r\n?/g, "\n").trim() : "";
}

function optionalInteger(form: FormData, key: string): number | null {
  const raw = field(form, key);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isInteger(value) ? value : null;
}

function bail(state: QaAdminState, message: string): never {
  redirect(qaAdminHref(state, { error: message }));
}

function done(state: QaAdminState, message: string): never {
  redirect(qaAdminHref(state, { success: message }));
}

async function guard(): Promise<Db> {
  const { supabase, profile } = await requireAdmin();
  if (!profile) redirect("/admin");
  return supabase;
}

function check(form: FormData, rules: Parameters<typeof validateAdminForm>[1], state: QaAdminState) {
  const message = validateAdminForm(form, rules);
  if (message) bail(state, message);
}

function dbMessage(error: NonNullable<DbError>, missing: string): string {
  // .single() sıfır satırda PGRST116 verir: kayıt bu arada silinmiş.
  return error.code === "PGRST116" ? missing : error.message;
}

function asRows<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : [];
}

async function takenFaqSlugs(supabase: Db, exceptId?: string): Promise<string[]> {
  let query = supabase.from("faqs").select("slug");
  if (exceptId) query = query.neq("id", exceptId);
  const { data } = await query;
  return asRows<{ slug: string | null }>(data).flatMap((row) => (row.slug ? [row.slug] : []));
}

async function nextSortOrder(supabase: Db, categoryId: string): Promise<number> {
  const { data } = await supabase
    .from("faqs")
    .select("sort_order")
    .eq("category_id", categoryId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const top = (data as { sort_order?: number } | null)?.sort_order;
  return (typeof top === "number" ? top : 0) + SORT_STEP;
}

function faqWriteError(error: NonNullable<DbError>): string {
  if (error.code === "23505") return "Bu adres başka bir soruda kullanılıyor. Farklı bir adres yazın ya da boş bırakın.";
  if (error.code === "23503") return "Seçilen kategori bulunamadı; sayfayı yenileyip tekrar deneyin.";
  return error.message;
}

// ─── Sorular ─────────────────────────────────────────────────────────────────

function faqFields(form: FormData) {
  return {
    question: field(form, "question"),
    answer: field(form, "answer"),
    categoryId: field(form, "category_id"),
    slug: field(form, "slug"),
    sortOrder: optionalInteger(form, "sort_order") ?? 0,
    sourcePage: optionalInteger(form, "source_page"),
    isFeatured: form.get("is_featured") === "on",
    isPublished: form.get("is_published") === "on",
  };
}

export async function createFaq(form: FormData) {
  const supabase = await guard();
  const state: QaAdminState = { ...readReturnState(form), sekme: "sorular" };
  check(form, contentFormRules.createFaq, state);

  const f = faqFields(form);
  const slug = f.slug || uniqueSlug(slugifyQuestion(f.question), await takenFaqSlugs(supabase));

  const { error } = await supabase.from("faqs").insert({
    question: f.question,
    answer: f.answer,
    category_id: f.categoryId,
    slug,
    sort_order: f.sortOrder,
    is_featured: f.isFeatured,
    is_published: f.isPublished,
    source_title: DEFAULT_SOURCE,
    source_page: f.sourcePage,
  });
  if (error) bail(state, faqWriteError(error));

  refreshQa();
  done(state, "Soru eklendi.");
}

export async function updateFaq(form: FormData) {
  const supabase = await guard();
  const state: QaAdminState = { ...readReturnState(form), sekme: "sorular" };
  check(form, contentFormRules.updateFaq, state);

  const id = field(form, "id");
  const f = faqFields(form);
  // Adres boş bırakıldıysa sorudan yeniden üretilir (kendi adresi çakışma sayılmaz).
  const slug = f.slug || uniqueSlug(slugifyQuestion(f.question), await takenFaqSlugs(supabase, id));

  const { error } = await supabase
    .from("faqs")
    .update({
      question: f.question,
      answer: f.answer,
      category_id: f.categoryId,
      slug,
      sort_order: f.sortOrder,
      is_featured: f.isFeatured,
      is_published: f.isPublished,
      source_page: f.sourcePage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id")
    .single();
  if (error) bail(state, faqWriteError({ ...error, message: dbMessage(error, "Soru bulunamadı; silinmiş olabilir.") }));

  refreshQa();
  done(state, "Soru güncellendi.");
}

export async function deleteFaq(form: FormData) {
  const supabase = await guard();
  const state: QaAdminState = { ...readReturnState(form), sekme: "sorular" };
  check(form, contentFormRules.deleteFaq, state);

  const { error } = await supabase.from("faqs").delete().eq("id", field(form, "id")).select("id").single();
  if (error) bail(state, dbMessage(error, "Soru bulunamadı; zaten silinmiş olabilir."));

  refreshQa();
  done(state, "Soru silindi.");
}

// ─── Gelen sorular ───────────────────────────────────────────────────────────

export async function answerSubmission(form: FormData) {
  const supabase = await guard();
  const state: QaAdminState = { ...readReturnState(form), sekme: "gelen" };
  check(form, qaFormRules.answerSubmission, state);

  const id = field(form, "id");
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("question_submissions")
    .update({
      status: "answered",
      answer: field(form, "answer"),
      note: field(form, "note") || null,
      answered_at: now,
      // Yanıtlanan soruda eski "zaten yanıtlanmış" yönlendirmesi anlamsız kalır.
      related_faq_id: null,
      updated_at: now,
    })
    .eq("id", id)
    .select("id")
    .single();
  if (error) bail(state, dbMessage(error, "Soru bulunamadı; silinmiş olabilir."));

  refreshQa();
  done({ ...state, soru: id }, "Yanıt kaydedildi. Ziyaretçi takip bağlantısından görecek.");
}

export async function rejectSubmission(form: FormData) {
  const supabase = await guard();
  const state: QaAdminState = { ...readReturnState(form), sekme: "gelen" };
  check(form, qaFormRules.rejectSubmission, state);

  const id = field(form, "id");
  const { error } = await supabase
    .from("question_submissions")
    .update({
      status: "rejected",
      note: field(form, "note") || null,
      related_faq_id: field(form, "related_faq_id") || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id")
    .single();
  if (error) {
    bail(
      state,
      error.code === "23503"
        ? "Seçilen ilgili soru bulunamadı; sayfayı yenileyip tekrar deneyin."
        : dbMessage(error, "Soru bulunamadı; silinmiş olabilir."),
    );
  }

  refreshQa();
  done({ ...state, soru: id }, "Soru reddedildi. Not ve ilgili soru bağlantısı ziyaretçiye görünür.");
}

export async function reopenSubmission(form: FormData) {
  const supabase = await guard();
  const state: QaAdminState = { ...readReturnState(form), sekme: "gelen" };
  check(form, qaFormRules.reopenSubmission, state);

  const id = field(form, "id");
  // Yanıt metni korunur; yeniden yanıtlarken düzenlenir.
  const { error } = await supabase
    .from("question_submissions")
    .update({ status: "new", updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id")
    .single();
  if (error) bail(state, dbMessage(error, "Soru bulunamadı; silinmiş olabilir."));

  refreshQa();
  done({ ...state, soru: id }, "Soru yeniden “Yeni” durumuna alındı.");
}

export async function publishSubmission(form: FormData) {
  const supabase = await guard();
  const state: QaAdminState = { ...readReturnState(form), sekme: "gelen" };
  check(form, qaFormRules.publishSubmission, state);

  const id = field(form, "id");
  const here = { ...state, soru: id };
  const question = field(form, "question");
  const answer = field(form, "answer");
  const categoryId = field(form, "category_id");

  const { data: submission, error: readError } = await supabase
    .from("question_submissions")
    .select("id, status, published_faq_id")
    .eq("id", id)
    .maybeSingle();
  if (readError) bail(here, readError.message);
  const row = submission as { status: string; published_faq_id: string | null } | null;
  if (!row) bail(state, "Soru bulunamadı; silinmiş olabilir.");
  if (row.status !== "answered") {
    bail(here, "Yalnızca yanıtlanmış sorular herkese açık soru-cevaba eklenebilir. Önce yanıtı kaydedin.");
  }
  if (row.published_faq_id) bail(here, "Bu soru zaten herkese açık soru-cevaba eklenmiş.");

  const taken = await takenFaqSlugs(supabase);
  const requested = field(form, "slug");
  const slug = requested || uniqueSlug(slugifyQuestion(question), taken);
  if (requested && taken.includes(requested)) {
    bail(here, "Bu adres başka bir soruda kullanılıyor. Farklı bir adres yazın ya da boş bırakın.");
  }

  const { data: created, error: insertError } = await supabase
    .from("faqs")
    .insert({
      question,
      answer,
      category_id: categoryId,
      slug,
      sort_order: await nextSortOrder(supabase, categoryId),
      is_published: true,
      origin: "community",
      submission_id: id,
    })
    .select("id")
    .single();
  if (insertError) bail(here, faqWriteError(insertError));
  const faqId = (created as { id: string } | null)?.id;
  if (!faqId) bail(here, "Soru eklenemedi; tekrar deneyin.");

  const { error: linkError } = await supabase
    .from("question_submissions")
    .update({ published_faq_id: faqId, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id")
    .single();
  if (linkError) {
    // Yarım kalan durum bırakma: eklenen soruyu geri al.
    await supabase.from("faqs").delete().eq("id", faqId);
    bail(here, `Soru bağlanamadı, ekleme geri alındı: ${linkError.message}`);
  }

  refreshQa();
  done(here, "Soru herkese açık soru-cevaba eklendi.");
}

export async function deleteSubmission(form: FormData) {
  const supabase = await guard();
  const state: QaAdminState = { ...readReturnState(form), sekme: "gelen" };
  check(form, qaFormRules.deleteSubmission, state);

  // Seçim silinen soruyu göstermeye devam etmesin.
  const { soru: _selected, ...list } = state;
  void _selected;
  const { error } = await supabase
    .from("question_submissions")
    .delete()
    .eq("id", field(form, "id"))
    .select("id")
    .single();
  if (error) bail(list, dbMessage(error, "Soru bulunamadı; zaten silinmiş olabilir."));

  refreshQa();
  done(list, "Ziyaretçi sorusu silindi.");
}

// ─── Kategoriler ─────────────────────────────────────────────────────────────

function categoryWriteError(error: NonNullable<DbError>): string {
  if (error.code === "23505") {
    return error.message.includes("title")
      ? "Bu başlıkta bir kategori zaten var."
      : "Bu adres başka bir kategoride kullanılıyor. Farklı bir adres yazın ya da boş bırakın.";
  }
  if (error.code === "23514") return "Kategori bilgileri geçersiz: başlık 2–80 karakter, adres yalnız küçük harf, rakam ve tire olmalı.";
  return error.message;
}

// Kimlik varsa günceller, yoksa ekler (tek form iki işi de görür).
export async function saveCategory(form: FormData) {
  const supabase = await guard();
  const state: QaAdminState = { ...readReturnState(form), sekme: "kategoriler" };
  check(form, qaFormRules.saveCategory, state);

  const id = field(form, "id") || null;
  const title = field(form, "title");
  if (title.length < 2) bail(state, "Başlık en az 2 karakter olmalıdır.");

  let slug = field(form, "slug");
  if (!slug) {
    let query = supabase.from("faq_categories").select("slug");
    if (id) query = query.neq("id", id);
    const { data } = await query;
    const taken = asRows<{ slug: string }>(data).map((row) => row.slug);
    slug = uniqueSlug(slugifyQuestion(title), [...taken, ...RESERVED_CATEGORY_SLUGS]);
  } else if (RESERVED_CATEGORY_SLUGS.includes(slug)) {
    bail(state, `"${slug}" adresi sitedeki bir sayfaya ayrılmış; başka bir adres seçin.`);
  }

  const values = {
    title,
    slug,
    description: field(form, "description") || null,
    sort_order: optionalInteger(form, "sort_order") ?? 0,
    is_published: form.get("is_published") === "on",
  };

  if (id) {
    const { error } = await supabase
      .from("faq_categories")
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id")
      .single();
    if (error) bail(state, categoryWriteError({ ...error, message: dbMessage(error, "Kategori bulunamadı; silinmiş olabilir.") }));
  } else {
    const { error } = await supabase.from("faq_categories").insert(values);
    if (error) bail(state, categoryWriteError(error));
  }

  refreshQa();
  done(state, id ? "Kategori güncellendi." : "Kategori eklendi.");
}

export async function deleteCategory(form: FormData) {
  const supabase = await guard();
  const state: QaAdminState = { ...readReturnState(form), sekme: "kategoriler" };
  check(form, qaFormRules.deleteCategory, state);

  const id = field(form, "id");
  const { count, error: countError } = await supabase
    .from("faqs")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);
  if (countError) bail(state, countError.message);
  if ((count ?? 0) > 0) {
    bail(state, `Bu kategoride ${count} soru var; önce soruları başka kategoriye taşıyın.`);
  }

  const { error } = await supabase.from("faq_categories").delete().eq("id", id).select("id").single();
  if (error) {
    bail(
      state,
      error.code === "23503"
        ? "Bu kategoride soru var; önce soruları başka kategoriye taşıyın."
        : dbMessage(error, "Kategori bulunamadı; zaten silinmiş olabilir."),
    );
  }

  refreshQa();
  done(state, "Kategori silindi.");
}
