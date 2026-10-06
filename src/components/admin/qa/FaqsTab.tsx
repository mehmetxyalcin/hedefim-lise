import Link from "next/link";
import { ChevronDown, ExternalLink, Eye, EyeOff, Inbox, Plus, Search, Star, Trash2 } from "lucide-react";
import type { Faq, FaqCategory } from "@/types/faq";
import { faqHref } from "@/types/faq";
import { foldTr } from "@/lib/qa";
import { qaAdminHref, type QaAdminState } from "@/lib/qa-admin";
import { Badge } from "@/components/admin/ui/Badge";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { ConfirmButton } from "@/components/admin/ui/ConfirmButton";
import { adminButton } from "@/components/admin/ui/Button";
import { adminCard, adminControl, adminFocus, adminInput } from "@/components/admin/ui/styles";
import { cn } from "@/lib/cn";
import { FaqForm } from "@/components/admin/qa/FaqForm";
import { ReturnFields } from "@/components/admin/qa/shared";
import { createFaq, deleteFaq, updateFaq } from "@/app/admin/soru-cevap/actions";

type Props = {
  faqs: Faq[];
  categories: FaqCategory[];
  state: QaAdminState;
};

function matches(faq: Faq, rawQuery: string, foldedQuery: string): boolean {
  if (!rawQuery) return true;
  if (faq.slug.includes(rawQuery)) return true;
  return foldTr(`${faq.question} ${faq.answer}`).includes(foldedQuery);
}

export function FaqsTab({ faqs, categories, state }: Props) {
  const here: QaAdminState = { sekme: "sorular", ara: state.ara, kategori: state.kategori };
  const rawQuery = (state.ara ?? "").toLocaleLowerCase("tr-TR");
  const foldedQuery = foldTr(state.ara ?? "");
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  const visible = faqs.filter(
    (faq) => (!state.kategori || faq.categoryId === state.kategori) && matches(faq, rawQuery, foldedQuery),
  );

  // Kategori sırasıyla; kategorisi olmayan (eski) kayıtlar en sonda.
  const groups = [
    ...categories.map((category) => ({ id: category.id, title: category.title, category })),
    { id: "", title: "Kategorisiz", category: null },
  ]
    .map((group) => ({
      ...group,
      items: visible.filter((faq) => (faq.categoryId ?? "") === group.id),
    }))
    .filter((group) => group.items.length > 0);

  const nextSortOrder = (faqs.reduce((max, faq) => Math.max(max, faq.sortOrder), 0) || 0) + 10;
  // Tek sonuç varsa (ör. bir sorunun adresiyle gelindiğinde) düzenleme açık gelir.
  const openFirst = Boolean(state.ara) && visible.length === 1;

  return (
    <>
      <details className="group mb-6 open:rounded-xl open:border open:border-admin-line open:bg-white open:shadow-admin-card">
        <summary
          className={cn(
            adminButton({ variant: "primary" }),
            "w-fit cursor-pointer list-none group-open:m-4 [&::-webkit-details-marker]:hidden",
          )}
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Yeni soru
        </summary>
        <div className="border-t border-admin-line p-5">
          <p className="mb-4 text-sm text-admin-muted">
            Yayında seçeneği açıksa kaydedilen soru ziyaretçilere gösterilir. Öne çıkan sorular soru-cevap ana
            sayfasında listelenir.
          </p>
          {categories.length === 0 ? (
            <p className="text-sm text-admin-muted">
              Önce “Kategoriler” sekmesinden bir kategori ekleyin.
            </p>
          ) : (
            <FaqForm
              action={createFaq}
              categories={categories}
              state={here}
              nextSortOrder={nextSortOrder}
              idPrefix="new-faq"
            />
          )}
        </div>
      </details>

      <form method="get" className="mb-2 flex flex-wrap gap-2" role="search">
        <input type="hidden" name="sekme" value="sorular" />
        <label className="relative min-w-0 grow basis-60">
          <span className="sr-only">Sorularda ara</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-admin-faint"
          />
          <input
            type="search"
            name="ara"
            defaultValue={state.ara ?? ""}
            placeholder="Soru, yanıt veya adreste ara"
            className={cn(adminInput, "pl-9")}
          />
        </label>
        <select
          name="kategori"
          defaultValue={state.kategori ?? ""}
          aria-label="Kategori"
          className={cn(adminControl, "grow sm:grow-0")}
        >
          <option value="">Tüm kategoriler</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.title}
              {category.isPublished ? "" : " (gizli)"}
            </option>
          ))}
        </select>
        <button type="submit" className={adminButton()}>
          Uygula
        </button>
      </form>

      {visible.length === 0 ? (
        <div className={cn(adminCard, "mt-4")}>
          <EmptyState
            title={faqs.length === 0 ? "Henüz soru yok" : "Eşleşen soru yok"}
            body={
              faqs.length === 0
                ? "İlk soruyu “Yeni soru” ile ekleyin ya da “Toplu yükleme” ile bir tablo yükleyin."
                : "Aramayı ya da kategoriyi değiştirin."
            }
          />
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.id || "none"} aria-label={group.title}>
            <h2 className="mt-6 mb-2 flex items-center gap-2 text-sm font-semibold text-admin-muted">
              <span>
                {group.title} <span className="tabular-nums">· {group.items.length}</span>
              </span>
              {group.category && !group.category.isPublished && <Badge>Kategori gizli</Badge>}
            </h2>
            <div className="space-y-2">
              {group.items.map((faq) => {
                const category = faq.categoryId ? categoryById.get(faq.categoryId) : undefined;
                const live = faq.isPublished && category?.isPublished;
                return (
                  <details
                    key={faq.id}
                    id={`faq-${faq.id}`}
                    open={openFirst || undefined}
                    className={cn(adminCard, "group open:ring-1 open:ring-admin-accent-soft")}
                  >
                    <summary className="flex cursor-pointer list-none items-start gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
                      <span className="mt-0.5 w-8 shrink-0 text-xs text-admin-muted tabular-nums">#{faq.sortOrder}</span>
                      <span className="flex-1 leading-6 font-semibold text-admin-ink">{faq.question}</span>
                      <span className="flex flex-wrap items-center justify-end gap-1.5">
                        {faq.origin === "community" && <Badge tone="accent">Ziyaretçi sorusu</Badge>}
                        {faq.isFeatured && (
                          <Badge tone="warning" icon={<Star aria-hidden="true" className="h-3 w-3" />}>
                            Öne çıkan
                          </Badge>
                        )}
                        <Badge
                          tone={faq.isPublished ? "success" : "neutral"}
                          icon={
                            faq.isPublished ? (
                              <Eye aria-hidden="true" className="h-3 w-3" />
                            ) : (
                              <EyeOff aria-hidden="true" className="h-3 w-3" />
                            )
                          }
                        >
                          {faq.isPublished ? "Yayında" : "Taslak"}
                        </Badge>
                      </span>
                      <ChevronDown
                        aria-hidden="true"
                        className="mt-0.5 h-4 w-4 shrink-0 text-admin-faint transition-transform group-open:rotate-180"
                      />
                    </summary>

                    <div className="border-t border-admin-line p-5">
                      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                        {live && category ? (
                          <a
                            href={faqHref(category.slug, faq.slug)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn("inline-flex items-center gap-1.5 rounded font-medium text-admin-accent hover:underline", adminFocus)}
                          >
                            <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                            Sitede gör
                          </a>
                        ) : (
                          <span className="text-admin-muted">
                            {faq.isPublished ? "Kategori gizli olduğu için sitede görünmüyor." : "Taslak; sitede görünmüyor."}
                          </span>
                        )}
                        {faq.submissionId && (
                          <Link
                            href={qaAdminHref({ sekme: "gelen", durum: "tumu", soru: faq.submissionId })}
                            className={cn("inline-flex items-center gap-1.5 rounded font-medium text-admin-accent hover:underline", adminFocus)}
                          >
                            <Inbox aria-hidden="true" className="h-3.5 w-3.5" />
                            Geldiği soruyu aç
                          </Link>
                        )}
                        <code className="text-xs text-admin-muted">/{category?.slug ?? "…"}#{faq.slug}</code>
                      </div>

                      <FaqForm
                        action={updateFaq}
                        categories={categories}
                        state={here}
                        faq={faq}
                        idPrefix={`faq-${faq.id}`}
                      />

                      <form action={deleteFaq} className="mt-3 flex justify-end border-t border-admin-line pt-3">
                        <ReturnFields state={here} />
                        <input type="hidden" name="id" value={faq.id} />
                        <ConfirmButton
                          message={`"${faq.question}" sorusunu silmek istediğinize emin misiniz? Bu işlem geri alınmaz.`}
                          className={adminButton({ variant: "danger", size: "sm" })}
                        >
                          <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                          Soruyu sil
                        </ConfirmButton>
                      </form>
                    </div>
                  </details>
                );
              })}
            </div>
          </section>
        ))
      )}
    </>
  );
}
