import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { faqHref, type Faq } from "@/types/faq";
import { FOCUS } from "@/components/school/doc-styles";
import { AnswerBody } from "./AnswerBody";
import { CopyLinkButton } from "./CopyLinkButton";
import { CommunityTag } from "./CommunityTag";
import { sourceNote } from "./qa-format";

type Props = {
  faq: Faq;
  categorySlug: string;
  /** Kategori sayfasında soru kendi çapasını taşır (id = slug). */
  anchor?: boolean;
  /** Sol kenardaki mono sıra numarası ("01"). */
  number?: string;
  /** Hub'da ve aramada: kategori adı etiket olarak, "Konuya git" bağlantısıyla. */
  categoryTitle?: string;
  /** Vurgulu soru metni (arama); verilmezse düz soru. */
  question?: ReactNode;
  /** Üzerinde durduğu zemin: beyaz panelde üzerine gelince kâğıt, kâğıtta beyaz. */
  tone?: "panel" | "ground";
  className?: string;
};

// Tek soru: yerel <details> açılır. Kapalıyken soru ve küçük etiketler;
// açıkken yanıt, kaynak sayfa notu ve bağlantı eylemleri. Yükseklik
// destekleyen tarayıcıda yumuşak açılır (.landing details.disclosure).
export function FaqItem({ faq, categorySlug, anchor, number, categoryTitle, question, tone = "panel", className }: Props) {
  const href = faqHref(categorySlug, faq.slug);
  const source = sourceNote(faq);
  const community = faq.origin === "community";
  const hasMeta = Boolean(categoryTitle) || community;

  return (
    <details
      id={anchor ? faq.slug : undefined}
      className={cn("disclosure group/faq scroll-mt-24", className)}
    >
      <summary
        className={cn(
          "group/sum grid cursor-pointer items-start gap-x-3 rounded-lg px-2 py-3.5 transition-colors sm:gap-x-4",
          tone === "panel" ? "hover:bg-[var(--doc-ground)]" : "hover:bg-[var(--doc-panel)]",
          number ? "grid-cols-[1.5rem_minmax(0,1fr)_auto] sm:grid-cols-[2rem_minmax(0,1fr)_auto]" : "grid-cols-[minmax(0,1fr)_auto]",
          FOCUS,
        )}
      >
        {number && (
          <span
            aria-hidden="true"
            className="tabular pt-[5px] font-mono text-[11px] font-medium text-[var(--ink-faint)]"
          >
            {number}
          </span>
        )}
        <span className="min-w-0">
          <span className="block font-display text-[1.0625rem] leading-snug font-bold text-balance break-words text-[var(--ink)] transition-colors group-hover/sum:text-[var(--teal)]">
            {question ?? faq.question}
          </span>
          {hasMeta && (
            <span className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
              {categoryTitle && (
                <span className="font-mono text-[10px] font-medium tracking-[0.14em] text-[var(--ink-faint)] uppercase">
                  {categoryTitle}
                </span>
              )}
              {community && <CommunityTag />}
            </span>
          )}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="mt-[3px] h-4 w-4 shrink-0 text-[var(--ink-faint)] transition-transform duration-300 group-open/faq:rotate-180 group-open/faq:text-[var(--teal)] motion-reduce:transition-none"
        />
      </summary>

      <div className={cn("px-2 pt-1 pb-6", number && "sm:pl-14")}>
        <AnswerBody answer={faq.answer} />
        <div className="mt-5 border-t border-[color-mix(in_srgb,var(--line)_70%,transparent)] pt-3">
          {source && (
            <p className="mb-2.5 font-mono text-[11px] leading-relaxed text-[var(--ink-faint)]">{source}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5">
            <CopyLinkButton path={href} />
            {categoryTitle && (
              <Link
                href={href}
                className={`inline-flex items-center gap-1.5 rounded-md font-display text-sm font-bold text-[var(--teal)] transition-colors hover:text-[var(--teal-deep)] ${FOCUS}`}
              >
                Konusunda aç
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </details>
  );
}
