// Soru-cevap toplu yüklemesinin saf kuralları: sütun adlarını tanıma, satır
// doğrulama, kategori/adres/sıra planı ve önizleme. Veritabanına dokunmaz;
// hem tarayıcıda hem sunucu eylemlerinde hem de testlerde aynı kod çalışır.

import { ANSWER_MAX, RESERVED_CATEGORY_SLUGS, foldTr, slugifyQuestion, uniqueSlug } from "@/lib/qa";

export const FAQ_IMPORT_MAX_ROWS = 500;
export const FAQ_IMPORT_QUESTION_MIN = 3;
export const FAQ_IMPORT_QUESTION_MAX = 500;
export const FAQ_IMPORT_CATEGORY_MIN = 2;
export const FAQ_IMPORT_CATEGORY_MAX = 80;
export const FAQ_IMPORT_SORT_STEP = 10;
export const FAQ_IMPORT_SORT_MAX = 1_000_000;
export const FAQ_IMPORT_SOURCE_TITLE =
  "2026 Yılı Ortaöğretime Geçiş Tercih ve Yerleştirme Kılavuzu";

export const FAQ_IMPORT_HEADERS = [
  "Kategori",
  "Soru",
  "Yanıt",
  "Kaynak sayfa",
  "Sıra",
  "Öne çıkan",
  "Yayında",
] as const;

type Field = "category" | "question" | "answer" | "sourcePage" | "sortOrder" | "isFeatured" | "isPublished";

// Anahtarlar foldTr ile katlanmış biçimdedir ("Yanıt", "YANIT", "yanit" aynı).
const HEADER_ALIASES: Record<Field, string[]> = {
  category: ["kategori", "kategori adi", "konu"],
  question: ["soru"],
  answer: ["yanit", "cevap"],
  sourcePage: ["kaynak sayfa", "kaynak sayfasi", "sayfa", "kilavuz sayfasi"],
  sortOrder: ["sira", "siralama"],
  isFeatured: ["one cikan", "one cikar", "one cikanlar"],
  isPublished: ["yayinda", "yayin", "yayinla", "yayin durumu"],
};

const REQUIRED: { field: Field; label: string }[] = [
  { field: "category", label: "Kategori" },
  { field: "question", label: "Soru" },
  { field: "answer", label: "Yanıt" },
];

const TRUE_WORDS = new Set(["evet", "e", "yes", "true", "1", "x"]);
const FALSE_WORDS = new Set(["hayir", "h", "no", "false", "0"]);

export type ParsedFaq = {
  /** Sayfadaki satır numarası (başlık satırı 1). */
  row: number;
  category: string;
  question: string;
  answer: string;
  sourcePage: number | null;
  sortOrder: number | null;
  isFeatured: boolean;
  isPublished: boolean;
};

/** category/question yalnız satır hatalarında, önizlemede satırı tanıtmak için doldurulur. */
export type FaqImportError = { row: number; message: string; category?: string; question?: string };

export type ParseResult = { rows: ParsedFaq[]; errors: FaqImportError[] };

function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") return String(value);
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? "" : value.toISOString();
  return String(value);
}

function parseBool(raw: string, fallback: boolean): boolean | null {
  const word = foldTr(raw);
  if (word === "") return fallback;
  if (TRUE_WORDS.has(word)) return true;
  if (FALSE_WORDS.has(word)) return false;
  return null;
}

function parseInteger(raw: string): number | null {
  const text = raw.trim();
  if (!/^\d+(?:[.,]0+)?$/.test(text)) return null;
  return Number(text.replace(/[.,]0+$/, ""));
}

function resolveFields(headers: string[]): Map<Field, number> {
  const folded = headers.map((header) => foldTr(header));
  const found = new Map<Field, number>();
  for (const field of Object.keys(HEADER_ALIASES) as Field[]) {
    const index = folded.findIndex((name) => name !== "" && HEADER_ALIASES[field].includes(name));
    if (index !== -1) found.set(field, index);
  }
  return found;
}

/** Satırları (dizi dizisi: ilki başlık; ya da nesne dizisi) doğrulayıp ayrıştırır. */
export function parseFaqSheet(input: unknown[][] | Record<string, unknown>[]): ParseResult {
  const errors: FaqImportError[] = [];
  const empty: ParseResult = { rows: [], errors };

  if (!Array.isArray(input) || input.length === 0) {
    errors.push({ row: 1, message: "Dosya boş." });
    return empty;
  }

  let headers: string[];
  let body: unknown[][];

  if (Array.isArray(input[0])) {
    const matrix = input as unknown[][];
    headers = (matrix[0] ?? []).map(cellText);
    body = matrix.slice(1).map((row) => (Array.isArray(row) ? row : []));
  } else {
    const objects = input as Record<string, unknown>[];
    const names: string[] = [];
    for (const object of objects) {
      if (object && typeof object === "object") {
        for (const key of Object.keys(object)) if (!names.includes(key)) names.push(key);
      }
    }
    headers = names;
    body = objects.map((object) => names.map((name) => (object ? object[name] : undefined)));
  }

  // Nesne dizisinde başlık satırı yoktur; ilk veri satırı sayfada 2. satırdır.
  const firstDataRow = 2;
  const fields = resolveFields(headers);
  const missing = REQUIRED.filter(({ field }) => !fields.has(field)).map(({ label }) => label);
  if (missing.length > 0) {
    errors.push({
      row: 1,
      message: `Zorunlu sütun bulunamadı: ${missing.join(", ")}. İlk satır sütun başlıklarını içermeli (${FAQ_IMPORT_HEADERS.join(", ")}).`,
    });
    return empty;
  }

  const cell = (row: unknown[], field: Field): string => {
    const index = fields.get(field);
    return index === undefined ? "" : cellText(row[index]);
  };

  const dataRows = body
    .map((cells, offset) => ({ cells, row: offset + firstDataRow }))
    .filter(({ cells }) => cells.some((value) => cellText(value).trim() !== ""));

  if (dataRows.length === 0) {
    errors.push({ row: 1, message: "Dosyada veri satırı yok." });
    return empty;
  }
  if (dataRows.length > FAQ_IMPORT_MAX_ROWS) {
    errors.push({
      row: 1,
      message: `Dosyada ${dataRows.length} satır var; en fazla ${FAQ_IMPORT_MAX_ROWS} satır yüklenebilir. Dosyayı bölün.`,
    });
    return empty;
  }

  const rows: ParsedFaq[] = [];
  for (const { cells, row } of dataRows) {
    const problems: string[] = [];

    const category = cell(cells, "category").replace(/\s+/g, " ").trim();
    const question = cell(cells, "question").replace(/\s+/g, " ").trim();
    const answer = cell(cells, "answer").replace(/\r\n?/g, "\n").trim();

    if (!category) problems.push("Kategori boş.");
    else if (
      category.length < FAQ_IMPORT_CATEGORY_MIN ||
      category.length > FAQ_IMPORT_CATEGORY_MAX ||
      !foldTr(category)
    )
      problems.push(`Kategori adı ${FAQ_IMPORT_CATEGORY_MIN}-${FAQ_IMPORT_CATEGORY_MAX} karakter olmalı ve harf ya da rakam içermeli.`);

    if (!question) problems.push("Soru boş.");
    else if (question.length < FAQ_IMPORT_QUESTION_MIN || !foldTr(question))
      problems.push("Soru çok kısa ya da harf/rakam içermiyor.");
    else if (question.length > FAQ_IMPORT_QUESTION_MAX)
      problems.push(`Soru en fazla ${FAQ_IMPORT_QUESTION_MAX} karakter olabilir (${question.length}).`);

    if (!answer) problems.push("Yanıt boş.");
    else if (answer.length > ANSWER_MAX)
      problems.push(`Yanıt en fazla ${ANSWER_MAX} karakter olabilir (${answer.length}).`);

    let sourcePage: number | null = null;
    const sourcePageRaw = cell(cells, "sourcePage").trim();
    if (sourcePageRaw) {
      const value = parseInteger(sourcePageRaw);
      if (value === null || value < 1 || value > 100_000) problems.push("Kaynak sayfa 1 veya daha büyük bir tam sayı olmalı.");
      else sourcePage = value;
    }

    let sortOrder: number | null = null;
    const sortRaw = cell(cells, "sortOrder").trim();
    if (sortRaw) {
      const value = parseInteger(sortRaw);
      if (value === null || value > FAQ_IMPORT_SORT_MAX) problems.push("Sıra 0 veya daha büyük bir tam sayı olmalı.");
      else sortOrder = value;
    }

    const featured = parseBool(cell(cells, "isFeatured"), false);
    if (featured === null) problems.push("Öne çıkan için evet/hayır yazın.");
    const published = parseBool(cell(cells, "isPublished"), true);
    if (published === null) problems.push("Yayında için evet/hayır yazın.");

    if (problems.length > 0) {
      errors.push({ row, message: problems.join(" "), category, question });
      continue;
    }

    rows.push({
      row,
      category,
      question,
      answer,
      sourcePage,
      sortOrder,
      isFeatured: featured === true,
      isPublished: published === true,
    });
  }

  return { rows, errors };
}

// ─── Plan ──────────────────────────────────────────────────────────────────

export type ExistingCategory = { id: string; title: string; slug: string; sortOrder?: number };
export type ExistingFaq = { question: string; slug: string; categoryId?: string | null; sortOrder?: number };

export type PlannedFaq = ParsedFaq & {
  /** Var olan kategorinin kimliği; yeni kategoriyse null. */
  categoryId: string | null;
  /** Yeni kategoriyse onun (ilk geçtiği yazımla) başlığı. */
  newCategoryTitle: string | null;
  slug: string;
  /** Her zaman dolu: Sıra boşsa kategorideki en büyük değerden +10. */
  sortOrder: number;
};

export type SkippedDuplicate = { row: number; question: string; reason: "existing" | "file" };

export type NewCategory = { title: string; slug: string; sortOrder: number };

export type FaqImportPlan = {
  create: PlannedFaq[];
  skippedDuplicates: SkippedDuplicate[];
  newCategories: NewCategory[];
};

export function planFaqImport(
  parsed: ParsedFaq[],
  existing: { categories: ExistingCategory[]; faqs: ExistingFaq[] },
): FaqImportPlan {
  const categoryByTitle = new Map<string, ExistingCategory>();
  const categoryBySlug = new Map<string, ExistingCategory>();
  const categorySlugs = new Set<string>(RESERVED_CATEGORY_SLUGS);
  let maxCategorySort = 0;
  for (const category of existing.categories) {
    categoryByTitle.set(foldTr(category.title), category);
    categoryBySlug.set(category.slug, category);
    categorySlugs.add(category.slug);
    maxCategorySort = Math.max(maxCategorySort, category.sortOrder ?? 0);
  }

  const seenQuestions = new Map<string, "existing" | "file">();
  const takenSlugs = new Set<string>();
  const sortByCategory = new Map<string, number>();
  for (const faq of existing.faqs) {
    seenQuestions.set(foldTr(faq.question), "existing");
    takenSlugs.add(faq.slug);
    if (faq.categoryId) {
      sortByCategory.set(faq.categoryId, Math.max(sortByCategory.get(faq.categoryId) ?? 0, faq.sortOrder ?? 0));
    }
  }

  const newByKey = new Map<string, NewCategory>();
  const create: PlannedFaq[] = [];
  const skippedDuplicates: SkippedDuplicate[] = [];

  for (const row of parsed) {
    const questionKey = foldTr(row.question);
    const seen = seenQuestions.get(questionKey);
    if (seen) {
      skippedDuplicates.push({ row: row.row, question: row.question, reason: seen });
      continue;
    }
    seenQuestions.set(questionKey, "file");

    const categoryKey = foldTr(row.category);
    const categoryGuess = slugifyQuestion(row.category);
    const known = categoryByTitle.get(categoryKey) ?? categoryBySlug.get(categoryGuess);
    let categoryId: string | null = null;
    let newCategoryTitle: string | null = null;
    let sortKey: string;

    if (known) {
      categoryId = known.id;
      sortKey = known.id;
    } else {
      let added = newByKey.get(categoryKey);
      if (!added) {
        const slug = uniqueSlug(categoryGuess, categorySlugs);
        categorySlugs.add(slug);
        maxCategorySort += FAQ_IMPORT_SORT_STEP;
        added = { title: row.category, slug, sortOrder: maxCategorySort };
        newByKey.set(categoryKey, added);
      }
      newCategoryTitle = added.title;
      sortKey = `new:${categoryKey}`;
    }

    const slug = uniqueSlug(slugifyQuestion(row.question), takenSlugs);
    takenSlugs.add(slug);

    const current = sortByCategory.get(sortKey) ?? 0;
    const sortOrder = row.sortOrder ?? current + FAQ_IMPORT_SORT_STEP;
    sortByCategory.set(sortKey, Math.max(current, sortOrder));

    create.push({ ...row, categoryId, newCategoryTitle, slug, sortOrder });
  }

  return { create, skippedDuplicates, newCategories: [...newByKey.values()] };
}

// ─── Önizleme ──────────────────────────────────────────────────────────────

export type PreviewStatus = "ok" | "duplicate" | "error";

export type PreviewItem = {
  row: number;
  category: string;
  newCategory: boolean;
  question: string;
  status: PreviewStatus;
  message: string | null;
};

export type FaqImportPreview = {
  items: PreviewItem[];
  counts: { total: number; create: number; duplicate: number; error: number; newCategories: number };
  newCategories: string[];
  /** Satır eşlemesi olmayan dosya düzeyi hatalar (ör. eksik sütun). */
  fileErrors: string[];
};

/** Sayfa sırasındaki satırlar için tek bir önizleme: ok / yinelenen / hatalı. */
export function buildFaqPreview(parsed: ParseResult, plan: FaqImportPlan): FaqImportPreview {
  const items: PreviewItem[] = [];
  const fileErrors: string[] = [];

  for (const planned of plan.create) {
    items.push({
      row: planned.row,
      category: planned.categoryId ? planned.category : (planned.newCategoryTitle ?? planned.category),
      newCategory: planned.categoryId === null,
      question: planned.question,
      status: "ok",
      message: null,
    });
  }
  const byRow = new Map(parsed.rows.map((row) => [row.row, row]));
  for (const skipped of plan.skippedDuplicates) {
    const row = byRow.get(skipped.row);
    items.push({
      row: skipped.row,
      category: row?.category ?? "",
      newCategory: false,
      question: skipped.question,
      status: "duplicate",
      message: skipped.reason === "existing" ? "Bu soru zaten kayıtlı; atlanacak." : "Dosyada daha önce geçen soru; atlanacak.",
    });
  }
  for (const error of parsed.errors) {
    // Veri satırları sayfada 2. satırdan başlar; 1. satır dosya düzeyi hatadır.
    if (error.row <= 1) {
      fileErrors.push(error.message);
      continue;
    }
    items.push({
      row: error.row,
      category: error.category ?? "",
      newCategory: false,
      question: error.question ?? "",
      status: "error",
      message: error.message,
    });
  }

  items.sort((a, b) => a.row - b.row);
  const counts = {
    total: items.length,
    create: plan.create.length,
    duplicate: plan.skippedDuplicates.length,
    error: items.filter((item) => item.status === "error").length,
    newCategories: plan.newCategories.length,
  };
  return { items, counts, newCategories: plan.newCategories.map((category) => category.title), fileErrors };
}

// ─── Sunucu eylemi sonucu ─────────────────────────────────────────────────

export type FaqImportCommitResult =
  | {
      ok: true;
      created: number;
      skippedDuplicates: number;
      skippedErrors: number;
      categoriesCreated: string[];
    }
  | { ok: false; message: string };

export type FaqImportPreviewResult =
  | { ok: true; preview: FaqImportPreview }
  | { ok: false; message: string };
