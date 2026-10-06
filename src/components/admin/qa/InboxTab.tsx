import Link from "next/link";
import { Inbox, MessageCircleQuestion } from "lucide-react";
import type { Faq, FaqCategory, QuestionSubmission } from "@/types/faq";
import { formatFullDate, formatRelativeDate } from "@/lib/admin-ledger";
import { qaAdminHref, SUBMISSION_FILTERS, type QaAdminState, type SubmissionFilterKey } from "@/lib/qa-admin";
import { Badge } from "@/components/admin/ui/Badge";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { adminCard, adminFocus } from "@/components/admin/ui/styles";
import { cn } from "@/lib/cn";
import { SubmissionDetail } from "@/components/admin/qa/SubmissionDetail";
import { SUBMISSION_STATUS } from "@/components/admin/qa/status";

type Props = {
  submissions: QuestionSubmission[];
  categories: FaqCategory[];
  faqs: Faq[];
  state: QaAdminState;
  /** Süzgeç belirtilmediyse kullanılan varsayılan. */
  defaultFilter: SubmissionFilterKey;
};

export function InboxTab({ submissions, categories, faqs, state, defaultFilter }: Props) {
  const filter = SUBMISSION_FILTERS.find((f) => f.key === (state.durum ?? defaultFilter)) ?? SUBMISSION_FILTERS[0];
  const selected = state.soru ? (submissions.find((s) => s.id === state.soru) ?? null) : null;
  const visible = filter.status ? submissions.filter((s) => s.status === filter.status) : submissions;
  const counts = {
    new: submissions.filter((s) => s.status === "new").length,
    answered: submissions.filter((s) => s.status === "answered").length,
    rejected: submissions.filter((s) => s.status === "rejected").length,
  };
  const now = new Date();
  const detailState: QaAdminState = { sekme: "gelen", durum: filter.key };
  const publishedFaqs = faqs.filter((faq) => faq.isPublished);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:items-start">
      <section
        aria-label="Gelen sorular"
        className={cn(adminCard, "overflow-hidden", selected && "hidden lg:block")}
      >
        <nav aria-label="Durum filtresi" className="flex gap-1 overflow-x-auto border-b border-admin-line p-2">
          {SUBMISSION_FILTERS.map((f) => {
            const count = f.status ? counts[f.status] : submissions.length;
            return (
              <Link
                key={f.key}
                href={qaAdminHref({ sekme: "gelen", durum: f.key, soru: state.soru })}
                aria-current={f.key === filter.key ? "page" : undefined}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-[13px] whitespace-nowrap transition-colors",
                  f.key === filter.key
                    ? "bg-admin-tint font-semibold text-admin-tint-ink"
                    : "text-admin-body hover:bg-admin-line-soft",
                  adminFocus,
                )}
              >
                {f.label}
                <span className="ml-1 tabular-nums">({count})</span>
              </Link>
            );
          })}
        </nav>

        {visible.length === 0 ? (
          <EmptyState
            icon={<Inbox aria-hidden="true" className="h-8 w-8" />}
            title={filter.status ? "Bu durumda soru yok" : "Henüz ziyaretçi sorusu yok"}
            body="Ziyaretçilerin soru-cevap sayfasından sorduğu sorular burada listelenir."
          />
        ) : (
          <ul className="divide-y divide-admin-line-soft lg:max-h-[calc(100vh-17rem)] lg:overflow-y-auto">
            {visible.map((s) => {
              const isSelected = s.id === state.soru;
              const isNew = s.status === "new";
              const status = SUBMISSION_STATUS[s.status];
              return (
                <li key={s.id}>
                  <Link
                    href={qaAdminHref({ sekme: "gelen", durum: filter.key, soru: s.id })}
                    aria-current={isSelected ? "true" : undefined}
                    className={cn(
                      "block px-4 py-3 transition-colors",
                      isSelected ? "bg-admin-tint" : "hover:bg-admin-ground",
                      adminFocus,
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {isNew && <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-admin-accent" />}
                      <span className="flex-1 truncate text-xs text-admin-muted">{s.nickname ?? "Rumuzsuz"}</span>
                      <span className="shrink-0 text-xs text-admin-muted tabular-nums" title={formatFullDate(s.createdAt)}>
                        {formatRelativeDate(s.createdAt, now)}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 line-clamp-2 text-sm",
                        isNew ? "font-semibold text-admin-ink" : "text-admin-body",
                      )}
                    >
                      {s.question}
                    </span>
                    <span className="mt-1.5 flex flex-wrap gap-1.5">
                      {filter.status === null && <Badge tone={status.tone}>{status.label}</Badge>}
                      {s.publishedFaqId && <Badge tone="accent">Sitede</Badge>}
                    </span>
                    {isNew && <span className="sr-only">Yeni</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {selected ? (
        <SubmissionDetail
          key={selected.id}
          submission={selected}
          categories={categories}
          publishedFaqs={publishedFaqs}
          allFaqs={faqs}
          state={detailState}
        />
      ) : (
        <div className={cn(adminCard, "hidden lg:block")}>
          <EmptyState
            icon={<MessageCircleQuestion aria-hidden="true" className="h-8 w-8" />}
            title="Bir soru seçin"
            body="Soldaki listeden bir soru açın; yanıtlayabilir, reddedebilir ya da herkese açık soru-cevaba ekleyebilirsiniz."
          />
        </div>
      )}
    </div>
  );
}
