import Link from "next/link";
import { ArrowLeft, ExternalLink, Globe, RotateCcw, Trash2 } from "lucide-react";
import type { Faq, FaqCategory, QuestionSubmission } from "@/types/faq";
import { faqHref } from "@/types/faq";
import { formatFullDate } from "@/lib/admin-ledger";
import { ANSWER_MAX, NOTE_MAX } from "@/lib/qa";
import { qaAdminHref, type QaAdminState } from "@/lib/qa-admin";
import { Badge } from "@/components/admin/ui/Badge";
import { AdminSubmitButton } from "@/components/admin/ui/AdminSubmitButton";
import { ConfirmButton } from "@/components/admin/ui/ConfirmButton";
import { adminButton } from "@/components/admin/ui/Button";
import { adminCard, adminFocus, adminHint, adminInput, adminLabel } from "@/components/admin/ui/styles";
import { cn } from "@/lib/cn";
import { AnswerHint, CategorySelect, ReturnFields } from "@/components/admin/qa/shared";
import { SUBMISSION_STATUS } from "@/components/admin/qa/status";
import {
  answerSubmission,
  deleteSubmission,
  publishSubmission,
  reopenSubmission,
  rejectSubmission,
} from "@/app/admin/soru-cevap/actions";

type Props = {
  submission: QuestionSubmission;
  categories: FaqCategory[];
  /** Yayındaki sorular (ilgili soru seçimi ve bağlantılar için). */
  publishedFaqs: Faq[];
  allFaqs: Faq[];
  /** Listeye dönüş ve eylem sonrası dönülecek görünüm. */
  state: QaAdminState;
};

function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="mb-3">
      <h3 className="text-[15px] font-bold text-admin-ink">{children}</h3>
      {hint && <p className="mt-0.5 text-[13px] text-admin-muted">{hint}</p>}
    </div>
  );
}

export function SubmissionDetail({ submission: s, categories, publishedFaqs, allFaqs, state }: Props) {
  const status = SUBMISSION_STATUS[s.status];
  const suggested = categories.find((category) => category.id === s.categoryId);
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const published = s.publishedFaqId ? allFaqs.find((faq) => faq.id === s.publishedFaqId) : undefined;
  const related = s.relatedFaqId ? allFaqs.find((faq) => faq.id === s.relatedFaqId) : undefined;
  const fields = { ...state, sekme: "gelen" as const, soru: s.id };
  const listHref = qaAdminHref({ sekme: "gelen", durum: state.durum });

  const publicHref = (faq: Faq | undefined) => {
    const category = faq?.categoryId ? categoryById.get(faq.categoryId) : undefined;
    return faq && category && faq.isPublished && category.isPublished ? faqHref(category.slug, faq.slug) : null;
  };
  const publishedHref = publicHref(published);
  const relatedHref = publicHref(related);

  // Yayındaki sorular kategoriye göre öbeklenir (ilgili soru seçimi).
  const relatedGroups = categories
    .map((category) => ({ category, faqs: publishedFaqs.filter((faq) => faq.categoryId === category.id) }))
    .filter((group) => group.faqs.length > 0);

  return (
    <article className={cn(adminCard, "p-5 lg:sticky lg:top-20")}>
      <Link
        href={listHref}
        className={cn(
          "mb-4 inline-flex items-center gap-1.5 rounded text-sm text-admin-muted hover:text-admin-ink lg:hidden",
          adminFocus,
        )}
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Gelen sorular
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg leading-snug font-bold text-admin-ink">{s.question}</h2>
          <p className="mt-1 text-sm text-admin-muted">{formatFullDate(s.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={status.tone}>{status.label}</Badge>
          {s.publishedFaqId && <Badge tone="accent">Sitede yayında</Badge>}
        </div>
      </div>

      <dl className="mt-5 grid gap-4 border-t border-admin-line pt-5 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-admin-muted">Rumuz</dt>
          <dd className="mt-0.5 font-semibold text-admin-ink">{s.nickname ?? "Belirtilmemiş"}</dd>
        </div>
        <div>
          <dt className="text-xs text-admin-muted">Önerilen kategori</dt>
          <dd className="mt-0.5 font-semibold text-admin-ink">{suggested?.title ?? "Seçilmemiş"}</dd>
        </div>
      </dl>

      {s.details && (
        <div className="mt-4">
          <p className="mb-1 text-xs text-admin-muted">Açıklama</p>
          <p className="rounded-lg bg-admin-ground px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-admin-body">
            {s.details}
          </p>
        </div>
      )}

      <p className="mt-5 rounded-lg border border-admin-line bg-admin-ground px-4 py-3 text-[13px] leading-relaxed text-admin-body">
        Ziyaretçi, yanıtı ve notu yalnızca kendisine verilen özel takip bağlantısından görür. “Herkese açık soru-cevaba
        ekle” demediğiniz sürece hiçbir ziyaretçi sorusu ya da yanıtı sitede herkese görünmez.
      </p>

      {/* Yanıt */}
      <section className="mt-6 border-t border-admin-line pt-5" aria-label="Yanıt">
        <SectionTitle hint="Yanıt Markdown alt kümesini destekler. Kaydedince soru “Yanıtlanan” olur.">
          {s.status === "answered" ? "Yanıtı düzenle" : "Yanıtla"}
        </SectionTitle>
        <form action={answerSubmission} className="space-y-4">
          <ReturnFields state={fields} />
          <input type="hidden" name="id" value={s.id} />
          <div>
            <label htmlFor={`answer-${s.id}`} className={adminLabel}>
              Yanıt
            </label>
            <textarea
              id={`answer-${s.id}`}
              name="answer"
              defaultValue={s.answer ?? ""}
              required
              rows={7}
              maxLength={ANSWER_MAX}
              className={adminInput}
            />
            <AnswerHint />
          </div>
          <label className="block">
            <span className={adminLabel}>Ziyaretçiye not (isteğe bağlı)</span>
            <textarea name="note" defaultValue={s.note ?? ""} rows={2} maxLength={NOTE_MAX} className={adminInput} />
            <span className={adminHint}>Yanıtın altında takip sayfasında görünür.</span>
          </label>
          <AdminSubmitButton
            label={s.status === "answered" ? "Yanıtı güncelle" : "Yanıtı kaydet"}
            pendingLabel="Kaydediliyor…"
          />
        </form>
      </section>

      {/* Herkese açık soru-cevaba ekle */}
      <section className="mt-6 border-t border-admin-line pt-5" aria-label="Herkese açık soru-cevap">
        <SectionTitle hint="Soru ve yanıtı düzenleyip kategorisini seçerek soru-cevap sayfasında “Ziyaretçi sorusu” etiketiyle yayımlayın.">
          Herkese açık soru-cevaba ekle
        </SectionTitle>
        {s.publishedFaqId ? (
          <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <p className="font-semibold">Bu soru soru-cevaba eklendi.</p>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
              {publishedHref && (
                <a
                  href={publishedHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn("inline-flex items-center gap-1.5 rounded font-medium underline", adminFocus)}
                >
                  <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                  Sitede gör
                </a>
              )}
              {published ? (
                <Link
                  href={qaAdminHref({ sekme: "sorular", ara: published.slug, kategori: published.categoryId ?? undefined })}
                  className={cn("inline-flex items-center gap-1.5 rounded font-medium underline", adminFocus)}
                >
                  Sorular sekmesinde düzenle
                </Link>
              ) : (
                <span>Soru artık listede yok; silinmiş olabilir.</span>
              )}
            </div>
          </div>
        ) : s.status !== "answered" ? (
          <p className="rounded-lg bg-admin-ground px-4 py-3 text-sm text-admin-muted">
            {s.status === "new"
              ? "Önce yanıtı kaydedin; yalnızca yanıtlanmış sorular eklenebilir."
              : "Reddedilen soru eklenemez. Eklemek için önce yeniden açıp yanıtlayın."}
          </p>
        ) : (
          <form action={publishSubmission} className="space-y-4">
            <ReturnFields state={fields} />
            <input type="hidden" name="id" value={s.id} />
            <label className="block">
              <span className={adminLabel}>Soru</span>
              <input name="question" defaultValue={s.question} required maxLength={3000} className={adminInput} />
            </label>
            <div>
              <label htmlFor={`publish-answer-${s.id}`} className={adminLabel}>
                Yanıt
              </label>
              <textarea
                id={`publish-answer-${s.id}`}
                name="answer"
                defaultValue={s.answer ?? ""}
                required
                rows={6}
                maxLength={ANSWER_MAX}
                className={adminInput}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={adminLabel}>Kategori</span>
                <CategorySelect categories={categories} defaultValue={s.categoryId} placeholder="Kategori seçin" />
              </label>
              <label className="block">
                <span className={adminLabel}>Adres (slug)</span>
                <input
                  name="slug"
                  maxLength={100}
                  placeholder="boşsa sorudan üretilir"
                  className={adminInput}
                  autoCapitalize="none"
                  spellCheck={false}
                />
              </label>
            </div>
            <AdminSubmitButton
              label={
                <>
                  <Globe aria-hidden="true" className="h-4 w-4" />
                  Herkese açık soru-cevaba ekle
                </>
              }
              pendingLabel="Ekleniyor…"
            />
          </form>
        )}
      </section>

      {/* Reddet */}
      {s.status !== "answered" && (
        <section className="mt-6 border-t border-admin-line pt-5" aria-label="Reddet">
          <SectionTitle hint="Reddedilen soru yanıtsız kalır. Not ve ilgili soru bağlantısı ziyaretçinin takip sayfasında görünür.">
            {s.status === "rejected" ? "Reddi düzenle" : "Reddet"}
          </SectionTitle>
          {s.status === "rejected" && (s.note || related) && (
            <p className="mb-3 text-sm text-admin-muted">
              {related && (
                <>
                  İlgili soru:{" "}
                  {relatedHref ? (
                    <a href={relatedHref} target="_blank" rel="noopener noreferrer" className="font-medium text-admin-accent hover:underline">
                      {related.question}
                    </a>
                  ) : (
                    related.question
                  )}
                </>
              )}
            </p>
          )}
          <form action={rejectSubmission} className="space-y-4">
            <ReturnFields state={fields} />
            <input type="hidden" name="id" value={s.id} />
            <label className="block">
              <span className={adminLabel}>Not (isteğe bağlı)</span>
              <textarea
                name="note"
                defaultValue={s.status === "rejected" ? (s.note ?? "") : ""}
                rows={2}
                maxLength={NOTE_MAX}
                className={adminInput}
                placeholder="Örn. Bu soru kılavuzda yanıtlanmıyor."
              />
            </label>
            <label className="block">
              <span className={adminLabel}>Bu soru zaten yanıtlanmış (isteğe bağlı)</span>
              <select
                name="related_faq_id"
                defaultValue={s.relatedFaqId ?? ""}
                className={cn(adminInput, "w-full")}
              >
                <option value="">İlgili soru yok</option>
                {relatedGroups.map((group) => (
                  <optgroup key={group.category.id} label={group.category.title}>
                    {group.faqs.map((faq) => (
                      <option key={faq.id} value={faq.id}>
                        {faq.question.length > 90 ? `${faq.question.slice(0, 89)}…` : faq.question}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <AdminSubmitButton
              label={s.status === "rejected" ? "Reddi güncelle" : "Soruyu reddet"}
              pendingLabel="Kaydediliyor…"
              variant="secondary"
            />
          </form>
        </section>
      )}

      {/* Yeniden aç / sil */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-admin-line pt-4">
        {s.status !== "new" ? (
          <form action={reopenSubmission}>
            <ReturnFields state={fields} />
            <input type="hidden" name="id" value={s.id} />
            <button type="submit" className={adminButton()}>
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              Yeniden aç
            </button>
          </form>
        ) : (
          <span />
        )}
        <form action={deleteSubmission}>
          <ReturnFields state={fields} />
          <input type="hidden" name="id" value={s.id} />
          <ConfirmButton
            message="Bu ziyaretçi sorusunu silmek istediğinize emin misiniz? Ziyaretçinin takip bağlantısı çalışmaz olur. Bu işlem geri alınmaz."
            className={adminButton({ variant: "danger", size: "sm" })}
          >
            <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
            Soruyu sil
          </ConfirmButton>
        </form>
      </div>
    </article>
  );
}
