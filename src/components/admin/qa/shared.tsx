import type { FaqCategory } from "@/types/faq";
import type { QaAdminState } from "@/lib/qa-admin";
import { adminControl } from "@/components/admin/ui/styles";
import { cn } from "@/lib/cn";

/**
 * Her değiştiren formun içine konur: eylem bittiğinde aynı sekmeye, süzgece ve
 * seçime dönülür. Değerler sunucuda yeniden doğrulanır (cleanState).
 */
export function ReturnFields({ state }: { state: QaAdminState }) {
  return (
    <>
      {(["sekme", "durum", "soru", "ara", "kategori"] as const).map((key) =>
        state[key] ? <input key={key} type="hidden" name={key} value={state[key]} /> : null,
      )}
    </>
  );
}

const MARKDOWN_HINTS: [string, string][] = [
  ["**kalın**", "Kalın yazı"],
  ["- madde / 1. adım", "Madde veya numaralı liste"],
  ["[metin](/okullar)", "Bağlantı; site içi yol veya https:// adresi"],
  ["> [!ipucu] …", "Kutu: not, ipucu, dikkat veya önemli"],
];

/** Yanıt alanlarının altında: blog Markdown alt kümesi desteklenir. */
export function AnswerHint() {
  return (
    <details className="mt-2 rounded-lg bg-admin-ground px-3 py-2 text-xs text-admin-body">
      <summary className="cursor-pointer font-semibold">Yanıtta biçimlendirme kullanabilirsiniz</summary>
      <dl className="mt-2 grid gap-x-5 gap-y-1.5 sm:grid-cols-[auto_1fr]">
        {MARKDOWN_HINTS.map(([code, meaning]) => (
          <div key={code} className="contents">
            <dt>
              <code className="rounded bg-white px-1.5 py-0.5 text-admin-ink">{code}</code>
            </dt>
            <dd className="text-admin-muted">{meaning}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-admin-muted">
        Paragrafları boş bir satırla ayırın. Düz metin olarak yazılmış yanıtlar da olduğu gibi okunur; HTML etiketleri
        metin olarak gösterilir.
      </p>
    </details>
  );
}

export function CategorySelect({
  categories,
  name = "category_id",
  defaultValue,
  placeholder,
  required = true,
  className,
}: {
  categories: FaqCategory[];
  name?: string;
  defaultValue?: string | null;
  /** Verilirse boş bir ilk seçenek olur ("Kategori seçin"). */
  placeholder?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue ?? ""}
      required={required}
      className={cn(adminControl, "w-full", className)}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.title}
          {category.isPublished ? "" : " (gizli)"}
        </option>
      ))}
    </select>
  );
}
