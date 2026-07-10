export type Faq = {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isPublished: boolean;
  sourceTitle: string | null;
  sourcePage: number | null;
  createdAt: string;
  updatedAt: string;
};

export type FaqRow = {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_published: boolean;
  source_title: string | null;
  source_page: number | null;
  created_at: string;
  updated_at: string;
};

export function mapFaq(row: FaqRow): Faq {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    category: row.category,
    sortOrder: row.sort_order,
    isPublished: row.is_published,
    sourceTitle: row.source_title,
    sourcePage: row.source_page,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
