"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { FAQ_CACHE_TAG } from "@/lib/faqs";
import {
  FAQ_IMPORT_MAX_ROWS,
  FAQ_IMPORT_SOURCE_TITLE,
  buildFaqPreview,
  parseFaqSheet,
  planFaqImport,
  type ExistingCategory,
  type ExistingFaq,
  type FaqImportCommitResult,
  type FaqImportPreviewResult,
  type ParseResult,
} from "@/lib/faq-import";

type Supabase = Awaited<ReturnType<typeof requireAdmin>>["supabase"];

const PAGE = 1000;

/** İstemciye güvenilmez: yalnız "dizi dizisi" biçimini ve boyutu kabul eder. */
function checkRows(rows: unknown): unknown[][] | null {
  if (!Array.isArray(rows) || rows.length === 0 || rows.length > FAQ_IMPORT_MAX_ROWS + 1) return null;
  const cells: unknown[][] = [];
  for (const row of rows) {
    if (!Array.isArray(row) || row.length > 40) return null;
    cells.push(row.map((cell) => (typeof cell === "string" || typeof cell === "number" || typeof cell === "boolean" ? cell : null)));
  }
  return cells;
}

async function loadExisting(supabase: Supabase): Promise<{ categories: ExistingCategory[]; faqs: ExistingFaq[] } | string> {
  const categoryResult = await supabase.from("faq_categories").select("id, title, slug, sort_order");
  if (categoryResult.error) return categoryResult.error.message;
  const categories: ExistingCategory[] = (categoryResult.data ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    slug: row.slug as string,
    sortOrder: (row.sort_order as number | null) ?? 0,
  }));

  // PostgREST tek istekte en fazla 1000 satır döndürür; sayfa sayfa oku.
  const faqs: ExistingFaq[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("faqs")
      .select("question, slug, category_id, sort_order")
      .order("created_at")
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) return error.message;
    for (const row of data ?? []) {
      faqs.push({
        question: row.question as string,
        slug: (row.slug as string | null) ?? "",
        categoryId: row.category_id as string | null,
        sortOrder: (row.sort_order as number | null) ?? 0,
      });
    }
    if (!data || data.length < PAGE) break;
  }
  return { categories, faqs };
}

async function prepare(rows: unknown) {
  const { supabase } = await requireAdmin();
  const cells = checkRows(rows);
  if (!cells) return { ok: false, message: "Dosya içeriği okunamadı ya da satır sayısı sınırı aşıldı." } as const;
  const parsed = parseFaqSheet(cells);
  const existing = await loadExisting(supabase);
  if (typeof existing === "string") return { ok: false, message: `Mevcut sorular okunamadı: ${existing}` } as const;
  return { ok: true, supabase, parsed, existing, plan: planFaqImport(parsed.rows, existing) } as const;
}

export async function previewFaqImport(rows: unknown[][]): Promise<FaqImportPreviewResult> {
  const prepared = await prepare(rows);
  if (!prepared.ok) return { ok: false, message: prepared.message };
  return { ok: true, preview: buildFaqPreview(prepared.parsed, prepared.plan) };
}

export async function commitFaqImport(rows: unknown[][]): Promise<FaqImportCommitResult> {
  const prepared = await prepare(rows);
  if (!prepared.ok) return { ok: false, message: prepared.message };
  const { supabase, parsed, existing, plan } = prepared;
  const skippedErrors = countRowErrors(parsed);

  if (parsed.rows.length === 0) {
    return { ok: false, message: parsed.errors[0]?.message ?? "Yüklenecek geçerli satır yok." };
  }

  if (plan.create.length === 0) {
    return {
      ok: true,
      created: 0,
      skippedDuplicates: plan.skippedDuplicates.length,
      skippedErrors,
      categoriesCreated: [],
    };
  }

  const titleById = new Map(existing.categories.map((category) => [category.id, category.title]));
  const idByTitle = new Map<string, string>();
  const createdCategoryIds: string[] = [];

  if (plan.newCategories.length > 0) {
    const { data, error } = await supabase
      .from("faq_categories")
      .insert(
        plan.newCategories.map((category) => ({
          title: category.title,
          slug: category.slug,
          sort_order: category.sortOrder,
          is_published: true,
        })),
      )
      .select("id, title");
    if (error) return { ok: false, message: `Kategoriler oluşturulamadı: ${error.message}` };
    for (const row of data ?? []) {
      idByTitle.set(row.title as string, row.id as string);
      titleById.set(row.id as string, row.title as string);
      createdCategoryIds.push(row.id as string);
    }
  }

  const records = plan.create.map((faq) => {
    const categoryId = faq.categoryId ?? idByTitle.get(faq.newCategoryTitle ?? "") ?? null;
    return {
      category_id: categoryId,
      category: categoryId ? (titleById.get(categoryId) ?? faq.category) : faq.category,
      question: faq.question,
      answer: faq.answer,
      slug: faq.slug,
      sort_order: faq.sortOrder,
      is_published: faq.isPublished,
      is_featured: faq.isFeatured,
      origin: "editorial" as const,
      source_title: FAQ_IMPORT_SOURCE_TITLE,
      source_page: faq.sourcePage,
    };
  });

  if (records.some((record) => record.category_id === null)) {
    await removeCategories(supabase, createdCategoryIds);
    return { ok: false, message: "Kategori eşleştirilemedi; hiçbir şey kaydedilmedi." };
  }

  // Tek insert tek ifadedir: ya hepsi yazılır ya hiçbiri.
  const { error: insertError } = await supabase.from("faqs").insert(records);
  if (insertError) {
    await removeCategories(supabase, createdCategoryIds);
    return {
      ok: false,
      message: `Sorular kaydedilemedi; hiçbir soru eklenmedi. ${insertError.message}`,
    };
  }

  revalidateTag(FAQ_CACHE_TAG, {});
  revalidatePath("/soru-cevap", "layout");
  revalidatePath("/admin/soru-cevap");

  return {
    ok: true,
    created: records.length,
    skippedDuplicates: plan.skippedDuplicates.length,
    skippedErrors,
    categoriesCreated: plan.newCategories.map((category) => category.title),
  };
}

function countRowErrors(parsed: ParseResult): number {
  return parsed.errors.filter((error) => error.row > 1).length;
}

async function removeCategories(supabase: Supabase, ids: string[]) {
  if (ids.length === 0) return;
  // Yarım kalan yüklemede açılan boş kategoriler geride bırakılmasın.
  await supabase.from("faq_categories").delete().in("id", ids);
}
