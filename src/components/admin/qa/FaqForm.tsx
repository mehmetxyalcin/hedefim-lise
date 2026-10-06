import type { Faq, FaqCategory } from "@/types/faq";
import type { QaAdminState } from "@/lib/qa-admin";
import { AdminSubmitButton } from "@/components/admin/ui/AdminSubmitButton";
import { adminHint, adminInput, adminLabel } from "@/components/admin/ui/styles";
import { AnswerHint, CategorySelect, ReturnFields } from "@/components/admin/qa/shared";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  categories: FaqCategory[];
  state: QaAdminState;
  /** Düzenleme: mevcut soru. Yoksa yeni soru formu. */
  faq?: Faq;
  nextSortOrder?: number;
  idPrefix: string;
};

export function FaqForm({ action, categories, state, faq, nextSortOrder = 10, idPrefix }: Props) {
  return (
    <form action={action} className="space-y-4">
      <ReturnFields state={state} />
      {faq && <input type="hidden" name="id" value={faq.id} />}

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <label className="block">
          <span className={adminLabel}>Kategori</span>
          <CategorySelect categories={categories} defaultValue={faq?.categoryId ?? categories[0]?.id} />
        </label>
        <label className="block">
          <span className={adminLabel}>Soru</span>
          <input name="question" defaultValue={faq?.question} required maxLength={3000} className={adminInput} />
        </label>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-answer`} className={adminLabel}>
          Yanıt
        </label>
        <textarea
          id={`${idPrefix}-answer`}
          name="answer"
          defaultValue={faq?.answer}
          required
          rows={6}
          className={adminInput}
        />
        <AnswerHint />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className={adminLabel}>Adres (slug)</span>
          <input
            name="slug"
            defaultValue={faq?.slug}
            maxLength={100}
            placeholder="boşsa sorudan üretilir"
            className={adminInput}
            autoCapitalize="none"
            spellCheck={false}
          />
          <span className={adminHint}>Değiştirirseniz eski bağlantılar çalışmaz.</span>
        </label>
        <label className="block">
          <span className={adminLabel}>Sıra</span>
          <input name="sort_order" type="number" min="0" defaultValue={faq?.sortOrder ?? nextSortOrder} className={adminInput} />
        </label>
        <label className="block">
          <span className={adminLabel}>Kaynak sayfa</span>
          <input
            name="source_page"
            type="number"
            min="1"
            max="15"
            defaultValue={faq?.sourcePage ?? ""}
            className={adminInput}
          />
        </label>
      </div>

      <div className="flex flex-col gap-4 border-t border-admin-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <label className="inline-flex items-center gap-3 text-sm font-semibold text-admin-body">
            <input name="is_published" type="checkbox" defaultChecked={faq?.isPublished ?? true} className="h-4 w-4" />
            Yayında
          </label>
          <label className="inline-flex items-center gap-3 text-sm font-semibold text-admin-body">
            <input name="is_featured" type="checkbox" defaultChecked={faq?.isFeatured ?? false} className="h-4 w-4" />
            Öne çıkan
          </label>
        </div>
        <AdminSubmitButton
          label={faq ? "Değişiklikleri kaydet" : "Soruyu kaydet"}
          pendingLabel="Kaydediliyor…"
          variant={faq ? "secondary" : "primary"}
        />
      </div>
    </form>
  );
}
