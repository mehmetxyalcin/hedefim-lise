import { ChevronDown, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import type { Faq, FaqCategory } from "@/types/faq";
import type { QaAdminState } from "@/lib/qa-admin";
import { Badge } from "@/components/admin/ui/Badge";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { AdminSubmitButton } from "@/components/admin/ui/AdminSubmitButton";
import { ConfirmButton } from "@/components/admin/ui/ConfirmButton";
import { adminButton } from "@/components/admin/ui/Button";
import { adminCard, adminHint, adminInput, adminLabel } from "@/components/admin/ui/styles";
import { cn } from "@/lib/cn";
import { ReturnFields } from "@/components/admin/qa/shared";
import { deleteCategory, saveCategory } from "@/app/admin/soru-cevap/actions";

type Props = {
  categories: FaqCategory[];
  faqs: Faq[];
};

function CategoryForm({
  category,
  nextSortOrder,
  state,
}: {
  category?: FaqCategory;
  nextSortOrder: number;
  state: QaAdminState;
}) {
  return (
    <form action={saveCategory} className="space-y-4">
      <ReturnFields state={state} />
      {category && <input type="hidden" name="id" value={category.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={adminLabel}>Başlık</span>
          <input name="title" defaultValue={category?.title} required minLength={2} maxLength={80} className={adminInput} />
        </label>
        <label className="block">
          <span className={adminLabel}>Adres (slug)</span>
          <input
            name="slug"
            defaultValue={category?.slug}
            maxLength={90}
            placeholder="boşsa başlıktan üretilir"
            className={adminInput}
            autoCapitalize="none"
            spellCheck={false}
          />
          <span className={adminHint}>Sayfa adresi: /soru-cevap/adres. Değiştirirseniz eski bağlantılar çalışmaz.</span>
        </label>
      </div>
      <label className="block">
        <span className={adminLabel}>Kısa açıklama</span>
        <textarea
          name="description"
          defaultValue={category?.description ?? ""}
          rows={2}
          maxLength={300}
          className={adminInput}
        />
        <span className={adminHint}>En fazla 300 karakter; kategori dizininde başlığın altında görünür.</span>
      </label>
      <div className="grid gap-4 sm:grid-cols-[10rem_1fr] sm:items-end">
        <label className="block">
          <span className={adminLabel}>Sıra</span>
          <input
            name="sort_order"
            type="number"
            min="0"
            defaultValue={category?.sortOrder ?? nextSortOrder}
            className={adminInput}
          />
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex items-center gap-3 text-sm font-semibold text-admin-body">
            <input name="is_published" type="checkbox" defaultChecked={category?.isPublished ?? true} className="h-4 w-4" />
            Yayında
          </label>
          <AdminSubmitButton
            label={category ? "Değişiklikleri kaydet" : "Kategoriyi ekle"}
            pendingLabel="Kaydediliyor…"
            variant={category ? "secondary" : "primary"}
          />
        </div>
      </div>
    </form>
  );
}

export function CategoriesTab({ categories, faqs }: Props) {
  const here: QaAdminState = { sekme: "kategoriler" };
  const counts = new Map<string, number>();
  for (const faq of faqs) {
    if (faq.categoryId) counts.set(faq.categoryId, (counts.get(faq.categoryId) ?? 0) + 1);
  }
  const nextSortOrder = categories.reduce((max, category) => Math.max(max, category.sortOrder), 0) + 10;

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
          Yeni kategori
        </summary>
        <div className="border-t border-admin-line p-5">
          <CategoryForm nextSortOrder={nextSortOrder} state={here} />
        </div>
      </details>

      {categories.length === 0 ? (
        <div className={adminCard}>
          <EmptyState title="Henüz kategori yok" body="Soruları gruplamak için ilk kategoriyi ekleyin." />
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((category) => {
            const count = counts.get(category.id) ?? 0;
            return (
              <details key={category.id} className={cn(adminCard, "group open:ring-1 open:ring-admin-accent-soft")}>
                <summary className="flex cursor-pointer list-none items-start gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
                  <span className="mt-0.5 w-8 shrink-0 text-xs text-admin-muted tabular-nums">#{category.sortOrder}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block leading-6 font-semibold text-admin-ink">{category.title}</span>
                    <span className="block truncate text-xs text-admin-muted">/soru-cevap/{category.slug}</span>
                  </span>
                  <span className="flex flex-wrap items-center justify-end gap-1.5">
                    <Badge>
                      <span className="tabular-nums">{count}</span> soru
                    </Badge>
                    <Badge
                      tone={category.isPublished ? "success" : "neutral"}
                      icon={
                        category.isPublished ? (
                          <Eye aria-hidden="true" className="h-3 w-3" />
                        ) : (
                          <EyeOff aria-hidden="true" className="h-3 w-3" />
                        )
                      }
                    >
                      {category.isPublished ? "Yayında" : "Gizli"}
                    </Badge>
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0 text-admin-faint transition-transform group-open:rotate-180"
                  />
                </summary>
                <div className="border-t border-admin-line p-5">
                  <CategoryForm category={category} nextSortOrder={nextSortOrder} state={here} />

                  <form action={deleteCategory} className="mt-3 flex flex-col items-end gap-1.5 border-t border-admin-line pt-3">
                    <ReturnFields state={here} />
                    <input type="hidden" name="id" value={category.id} />
                    <ConfirmButton
                      message={`"${category.title}" kategorisini silmek istediğinize emin misiniz? Bu işlem geri alınmaz.`}
                      className={adminButton({ variant: "danger", size: "sm" })}
                      disabled={count > 0}
                      aria-describedby={count > 0 ? `category-lock-${category.id}` : undefined}
                    >
                      <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                      Kategoriyi sil
                    </ConfirmButton>
                    {count > 0 && (
                      <p id={`category-lock-${category.id}`} className="text-xs text-admin-muted">
                        İçinde {count} soru var; silmek için önce soruları başka kategoriye taşıyın.
                      </p>
                    )}
                  </form>
                </div>
              </details>
            );
          })}
        </div>
      )}
    </>
  );
}
