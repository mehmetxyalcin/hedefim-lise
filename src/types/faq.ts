export type FaqOrigin = "editorial" | "community";

export type FaqCategory = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  sortOrder: number;
  isPublished: boolean;
};

export type FaqCategoryRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  sort_order: number;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Faq = {
  id: string;
  slug: string;
  question: string;
  answer: string;
  /** Kategori başlığı (eski metin kolonu; tetikleyiciyle category_id'den beslenir). */
  category: string;
  categoryId: string | null;
  sortOrder: number;
  isPublished: boolean;
  isFeatured: boolean;
  origin: FaqOrigin;
  submissionId: string | null;
  sourceTitle: string | null;
  sourcePage: number | null;
  createdAt: string;
  updatedAt: string;
};

export type FaqRow = {
  id: string;
  slug: string | null;
  question: string;
  answer: string;
  category: string;
  category_id: string | null;
  sort_order: number;
  is_published: boolean;
  is_featured: boolean | null;
  origin: FaqOrigin | null;
  submission_id: string | null;
  source_title: string | null;
  source_page: number | null;
  created_at: string;
  updated_at: string;
};

export type SubmissionStatus = "new" | "answered" | "rejected";

/** Yönetimde görülen ziyaretçi sorusu. Takip anahtarı hiçbir zaman okunmaz. */
export type QuestionSubmission = {
  id: string;
  question: string;
  categoryId: string | null;
  nickname: string | null;
  status: SubmissionStatus;
  answer: string | null;
  answeredAt: string | null;
  note: string | null;
  relatedFaqId: string | null;
  publishedFaqId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type QuestionSubmissionRow = {
  id: string;
  question: string;
  category_id: string | null;
  nickname: string | null;
  status: SubmissionStatus;
  answer: string | null;
  answered_at: string | null;
  note: string | null;
  related_faq_id: string | null;
  published_faq_id: string | null;
  created_at: string;
  updated_at: string;
};

/** Ziyaretçinin takip anahtarıyla gördüğü durum (get_question_status). */
export type QuestionStatus = {
  question: string;
  categoryTitle: string | null;
  status: SubmissionStatus;
  answer: string | null;
  note: string | null;
  createdAt: string;
  answeredAt: string | null;
  /** "Bu soru zaten yanıtlanmış" yönlendirmesi: /soru-cevap/{kategori}#{soru} */
  relatedHref: string | null;
  /** Soru düzenlenip herkese açık soru-cevaba eklendiyse adresi. */
  publishedHref: string | null;
};

export type QuestionStatusRow = {
  question: string;
  category_title: string | null;
  status: SubmissionStatus;
  answer: string | null;
  note: string | null;
  created_at: string;
  answered_at: string | null;
  related_slug: string | null;
  related_category_slug: string | null;
  published_slug: string | null;
  published_category_slug: string | null;
};

export function mapFaqCategory(row: FaqCategoryRow): FaqCategory {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    sortOrder: row.sort_order,
    isPublished: row.is_published,
  };
}

export function mapFaq(row: FaqRow): Faq {
  return {
    id: row.id,
    slug: row.slug ?? row.id,
    question: row.question,
    answer: row.answer,
    category: row.category,
    categoryId: row.category_id,
    sortOrder: row.sort_order,
    isPublished: row.is_published,
    isFeatured: row.is_featured ?? false,
    origin: row.origin ?? "editorial",
    submissionId: row.submission_id,
    sourceTitle: row.source_title,
    sourcePage: row.source_page,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSubmission(row: QuestionSubmissionRow): QuestionSubmission {
  return {
    id: row.id,
    question: row.question,
    categoryId: row.category_id,
    nickname: row.nickname,
    status: row.status,
    answer: row.answer,
    answeredAt: row.answered_at,
    note: row.note,
    relatedFaqId: row.related_faq_id,
    publishedFaqId: row.published_faq_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function faqHref(categorySlug: string, faqSlug: string): string {
  return `/soru-cevap/${categorySlug}#${faqSlug}`;
}

export function mapQuestionStatus(row: QuestionStatusRow): QuestionStatus {
  return {
    question: row.question,
    categoryTitle: row.category_title,
    status: row.status,
    answer: row.answer,
    note: row.note,
    createdAt: row.created_at,
    answeredAt: row.answered_at,
    relatedHref:
      row.related_slug && row.related_category_slug
        ? faqHref(row.related_category_slug, row.related_slug)
        : null,
    publishedHref:
      row.published_slug && row.published_category_slug
        ? faqHref(row.published_category_slug, row.published_slug)
        : null,
  };
}
