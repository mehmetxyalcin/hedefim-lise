import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, FileSpreadsheet } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminPage } from "@/components/admin/ui/AdminPage";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { FlashBanner } from "@/components/admin/ui/FlashBanner";
import { adminButton } from "@/components/admin/ui/Button";
import { cleanState, parseTab } from "@/lib/qa-admin";
import {
  mapFaq,
  mapFaqCategory,
  mapSubmission,
  type FaqCategoryRow,
  type FaqRow,
  type QuestionSubmissionRow,
} from "@/types/faq";
import { QaTabs } from "@/components/admin/qa/QaTabs";
import { FaqsTab } from "@/components/admin/qa/FaqsTab";
import { InboxTab } from "@/components/admin/qa/InboxTab";
import { CategoriesTab } from "@/components/admin/qa/CategoriesTab";

export const metadata: Metadata = {
  title: "Soru-cevap | Yönetim",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

// Takip anahtarı özeti (token_hash) ve istemci özeti (client_hash) bilerek okunmaz.
const SUBMISSION_COLUMNS =
  "id, question, details, category_id, nickname, status, answer, answered_at, note, related_faq_id, published_faq_id, created_at, updated_at";
const SUBMISSION_LIMIT = 500;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminFaqPage({ searchParams }: PageProps) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) {
    return (
      <AdminPage width="form">
        <PageHeader title="Yetkisiz erişim" />
      </AdminPage>
    );
  }

  const params = searchParams ? await searchParams : {};
  const [categoriesResult, faqsResult, submissionsResult] = await Promise.all([
    supabase.from("faq_categories").select("*").order("sort_order").order("title"),
    supabase.from("faqs").select("*").order("sort_order").order("created_at"),
    supabase
      .from("question_submissions")
      .select(SUBMISSION_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(SUBMISSION_LIMIT),
  ]);

  const loadError = categoriesResult.error ?? faqsResult.error;
  if (loadError) {
    return (
      <AdminPage width="form">
        <PageHeader title="Soru-cevap" />
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
          <h2 className="font-bold">Soru-cevap tabloları yüklenemedi</h2>
          <p className="mt-2 text-sm">
            Supabase üzerinde 021_qa_center.sql migration dosyasını uygulayın. Hata: {loadError.message}
          </p>
        </div>
      </AdminPage>
    );
  }

  const categories = ((categoriesResult.data ?? []) as FaqCategoryRow[]).map(mapFaqCategory);
  const faqs = ((faqsResult.data ?? []) as FaqRow[]).map(mapFaq);
  // Gelen sorular tablosu yoksa ya da okunamıyorsa diğer sekmeler çalışmaya devam eder.
  const submissionsError = submissionsResult.error;
  const submissions = submissionsError
    ? []
    : ((submissionsResult.data ?? []) as unknown as QuestionSubmissionRow[]).map(mapSubmission);

  const newCount = submissions.filter((s) => s.status === "new").length;
  const state = cleanState({
    sekme: first(params.sekme),
    durum: first(params.durum),
    soru: first(params.soru),
    ara: first(params.ara),
    kategori: first(params.kategori),
  });
  const tab = parseTab(state.sekme) ?? (newCount > 0 ? "gelen" : "sorular");
  const published = faqs.filter((faq) => faq.isPublished).length;

  return (
    <AdminPage width="form">
      <PageHeader
        title="Soru-cevap"
        description={`${faqs.length} soru · ${published} yayında · ${newCount} yeni ziyaretçi sorusu`}
        actions={
          <>
            <Link href="/admin/soru-cevap/toplu-yukle" className={adminButton({ variant: "secondary" })}>
              <FileSpreadsheet aria-hidden="true" className="h-4 w-4" />
              Toplu yükleme
            </Link>
            <a href="/soru-cevap" target="_blank" rel="noopener noreferrer" className={adminButton({ variant: "ghost" })}>
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
              Sayfayı görüntüle
            </a>
          </>
        }
      />
      <FlashBanner success={first(params.success)} error={first(params.error)} />
      <QaTabs
        active={tab}
        newCount={newCount}
        counts={{
          sorular: faqs.length,
          gelen: submissionsError ? null : submissions.length,
          kategoriler: categories.length,
        }}
      />

      {tab === "sorular" && <FaqsTab faqs={faqs} categories={categories} state={state} />}
      {tab === "kategoriler" && <CategoriesTab categories={categories} faqs={faqs} />}
      {tab === "gelen" &&
        (submissionsError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
            <h2 className="font-bold">Gelen sorular yüklenemedi</h2>
            <p className="mt-2 text-sm">
              Supabase üzerinde 021_qa_center.sql migration dosyasını uygulayın. Hata: {submissionsError.message}
            </p>
          </div>
        ) : (
          <InboxTab
            submissions={submissions}
            categories={categories}
            faqs={faqs}
            state={state}
            defaultFilter={newCount > 0 ? "yeni" : "tumu"}
          />
        ))}
    </AdminPage>
  );
}
