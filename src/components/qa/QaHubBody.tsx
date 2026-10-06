"use client";

import { useDeferredValue, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { highlightRanges, indexFaqs, searchFaqs, searchTerms } from "@/lib/qa";
import type { Faq } from "@/types/faq";
import { DT, FOCUS, MICRO, TEXT_ACTION } from "@/components/school/doc-styles";
import { FaqItem } from "./FaqItem";
import { MyQuestions } from "./MyQuestions";
import { askHref, QA_ASK } from "./qa-format";

export type HubCategory = { id: string; slug: string; title: string };

type Props = {
  faqs: Faq[];
  categories: HubCategory[];
  /** Arama boşken ana sütun: konu dizini ve öne çıkanlar (sunucuda üretilir). */
  children: ReactNode;
  /** Künye (sunucuda üretilir). */
  aside: ReactNode;
};

const RESULT_LIMIT = 30;

const PRIMARY = `inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--teal)] px-5 py-3 font-display text-sm font-bold tracking-wide text-white transition-colors hover:bg-[var(--teal-deep)] ${FOCUS}`;

/** Aranan terimleri soruda vurgular; aralıklar kod noktası indeksidir. */
function Highlighted({ text, terms }: { text: string; terms: string[] }) {
  const ranges = highlightRanges(text, terms);
  if (ranges.length === 0) return text;
  const chars = Array.from(text);
  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const [start, end] of ranges) {
    if (start > cursor) parts.push(chars.slice(cursor, start).join(""));
    parts.push(
      <mark
        key={start}
        className="rounded-[3px] bg-[var(--teal-tint)] px-0.5 text-[var(--ink)] [box-decoration-break:clone] shadow-[inset_0_-2px_0_var(--teal)]"
      >
        {chars.slice(start, end).join("")}
      </mark>,
    );
    cursor = end;
  }
  if (cursor < chars.length) parts.push(chars.slice(cursor).join(""));
  return parts;
}

// Hub'ın etkileşimli gövdesi: tek büyük arama ve altındaki 8/4 ızgara. Arama
// boşken ana sütunda sunucunun ürettiği dizin durur; yazınca yerini anında
// sonuçlar alır. Künye her durumda yerinde kalır.
export function QaHubBody({ faqs, categories, children, aside }: Props) {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const index = useMemo(() => indexFaqs(faqs), [faqs]);
  const categoryOf = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const active = deferred.trim().length > 0;
  const terms = useMemo(() => searchTerms(deferred), [deferred]);
  const hits = useMemo(() => (active ? searchFaqs(index, deferred) : []), [active, index, deferred]);
  const shown = hits.slice(0, RESULT_LIMIT);
  const typed = deferred.trim();

  const announcement = !active
    ? ""
    : hits.length === 0
      ? "Sonuç bulunamadı."
      : `${hits.length} soru bulundu.`;

  return (
    <>
      <div className="container mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div className="lg:w-2/3 lg:pr-4">
          <div className="mb-2.5 flex items-baseline justify-between gap-4">
            <label htmlFor="qa-ara" className={DT}>
              Soru-cevaplarda ara
            </label>
            <Link href={QA_ASK} className={cn(TEXT_ACTION, "lg:hidden")}>
              Sorunu sor
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-[var(--ink-faint)]"
            />
            <input
              id="qa-ara"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape" && query) {
                  event.preventDefault();
                  setQuery("");
                }
              }}
              placeholder="Örneğin: kaç okul tercih edebilirim?"
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="search"
              aria-describedby="qa-ara-durum"
              className="h-14 w-full rounded-xl border border-[var(--line)] bg-[var(--doc-panel)] pr-12 pl-12 font-display text-[1.0625rem] font-semibold text-[var(--ink)] shadow-sm outline-none transition-colors placeholder:font-reading placeholder:font-normal placeholder:text-[var(--ink-faint)] focus:border-[var(--teal)] focus:ring-4 focus:ring-[var(--teal-ring)] sm:text-lg [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Aramayı temizle"
                className={`absolute top-1/2 right-2.5 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--ink-faint)] transition-colors hover:bg-[var(--doc-ground)] hover:text-[var(--ink)] ${FOCUS}`}
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            )}
          </div>
          <p id="qa-ara-durum" aria-live="polite" className="sr-only">
            {announcement}
          </p>
        </div>
      </div>

      <div className="border-t border-[var(--line)]">
        <div className="container mx-auto grid max-w-6xl gap-12 px-4 pt-8 pb-16 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:pb-20">
          <div className="min-w-0 lg:col-span-8">
            <MyQuestions rule="ink" className={cn("mb-10 lg:hidden", active && "hidden")} />
            {!active ? (
              children
            ) : hits.length === 0 ? (
              <section
                aria-label="Arama sonuçları"
                className="rounded-2xl border border-[var(--line)] bg-[var(--doc-panel)] p-5 shadow-sm sm:p-7"
              >
                <p className={MICRO}>Sonuç yok</p>
                <h2 className="mt-2 font-display text-xl leading-snug font-extrabold tracking-tight text-balance text-[var(--ink)] sm:text-2xl">
                  “{typed}” için bir yanıt bulamadık.
                </h2>
                <p className="mt-2 max-w-[52ch] text-[var(--ink-soft)]">
                  Daha kısa ya da farklı kelimelerle dene. Yine bulamazsan sorunu bize
                  yaz; yazdığın metin forma taşınır.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
                  <Link href={askHref(typed)} className={PRIMARY}>
                    Bu soruyu sor
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                  <button type="button" onClick={() => setQuery("")} className={TEXT_ACTION}>
                    Aramayı temizle
                  </button>
                </div>
              </section>
            ) : (
              <section
                aria-labelledby="qa-sonuc-baslik"
                className="rounded-2xl border border-[var(--line)] bg-[var(--doc-panel)] shadow-sm"
              >
                <div className="flex items-baseline justify-between gap-4 px-4 pt-4 pb-3 sm:px-5">
                  <h2 id="qa-sonuc-baslik" className={MICRO}>
                    <span className="tabular">{hits.length}</span> soru bulundu
                  </h2>
                  <button type="button" onClick={() => setQuery("")} className={TEXT_ACTION}>
                    Temizle
                  </button>
                </div>
                <ol className="divide-y divide-[color-mix(in_srgb,var(--line)_70%,transparent)] border-t border-[var(--line)] px-2 py-1 sm:px-3">
                  {shown.map(({ faq }) => {
                    const category = faq.categoryId ? categoryOf.get(faq.categoryId) : undefined;
                    if (!category) return null;
                    return (
                      <li key={faq.id}>
                        <FaqItem
                          faq={faq}
                          categorySlug={category.slug}
                          categoryTitle={category.title}
                          question={<Highlighted text={faq.question} terms={terms} />}
                        />
                      </li>
                    );
                  })}
                </ol>
                <div className="flex flex-col gap-2 border-t border-[var(--line)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <p className="text-[15px] text-[var(--ink-soft)]">
                    {hits.length > RESULT_LIMIT
                      ? `İlk ${RESULT_LIMIT} sonuç gösteriliyor; bir kelime daha ekleyip daralt.`
                      : "Aradığın bunlardan biri değil mi?"}
                  </p>
                  <Link href={askHref(typed)} className={cn(TEXT_ACTION, "shrink-0")}>
                    Bu soruyu bize sor
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </div>
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:col-span-4 lg:self-start">{aside}</aside>
        </div>
      </div>
    </>
  );
}
