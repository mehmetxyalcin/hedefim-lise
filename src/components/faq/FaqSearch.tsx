"use client";

import { FormEvent, useMemo, useState } from "react";
import { BookOpen, Search, X } from "lucide-react";
import type { Faq } from "@/types/faq";

type Props = {
  faqs: Faq[];
};

function normalize(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i");
}

export function FaqSearch({ faqs }: Props) {
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");

  const filteredFaqs = useMemo(() => {
    const normalizedQuery = normalize(query.trim());
    if (!normalizedQuery) return faqs;

    return faqs.filter((faq) =>
      normalize(`${faq.question} ${faq.answer} ${faq.category}`).includes(
        normalizedQuery,
      ),
    );
  }, [faqs, query]);

  const groupedFaqs = useMemo(() => {
    const groups = new Map<string, Faq[]>();
    for (const faq of filteredFaqs) {
      const current = groups.get(faq.category) ?? [];
      current.push(faq);
      groups.set(faq.category, current);
    }
    return [...groups.entries()];
  }, [filteredFaqs]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery(searchInput);
  }

  function clearSearch() {
    setSearchInput("");
    setQuery("");
  }

  return (
    <>
      <form
        role="search"
        onSubmit={handleSubmit}
        className="mx-auto mb-8 flex max-w-3xl flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg shadow-slate-200/50 sm:flex-row"
      >
        <label className="relative flex-1">
          <span className="sr-only">Soru-cevaplarda ara</span>
          <Search
            aria-hidden="true"
            className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Örneğin: kaç okul tercih edebilirim?"
            className="h-12 w-full rounded-xl border border-transparent bg-slate-50 pl-12 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
          />
        </label>
        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
        >
          <Search aria-hidden="true" className="h-4 w-4" />
          Ara
        </button>
      </form>

      {query && (
        <div className="mx-auto mb-6 flex max-w-4xl items-center justify-between gap-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <p>
            <strong>{filteredFaqs.length}</strong> sonuç bulundu: “{query}”
          </p>
          <button
            type="button"
            onClick={clearSearch}
            className="inline-flex shrink-0 items-center gap-1 font-semibold hover:text-blue-950"
          >
            <X aria-hidden="true" className="h-4 w-4" />
            Temizle
          </button>
        </div>
      )}

      {groupedFaqs.length > 0 ? (
        <div className="mx-auto max-w-4xl space-y-10">
          {groupedFaqs.map(([category, categoryFaqs]) => (
            <section key={category} aria-labelledby={`category-${category}`}>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <BookOpen aria-hidden="true" className="h-4 w-4" />
                </div>
                <div>
                  <h2
                    id={`category-${category}`}
                    className="text-xl font-extrabold tracking-tight text-slate-900"
                  >
                    {category}
                  </h2>
                  <p className="text-xs font-medium text-slate-400">
                    {categoryFaqs.length} soru
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {categoryFaqs.map((faq, index) => (
                  <details
                    key={faq.id}
                    open={Boolean(query) && index === 0}
                    className="group rounded-2xl border border-slate-200 bg-white shadow-sm open:border-blue-200 open:shadow-md open:shadow-blue-100/40"
                  >
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-5 text-left marker:content-none md:px-6">
                      <span className="font-bold leading-6 text-slate-900 group-hover:text-blue-700">
                        {faq.question}
                      </span>
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg font-medium text-slate-500 transition-transform group-open:rotate-45 group-open:bg-blue-100 group-open:text-blue-700">
                        +
                      </span>
                    </summary>
                    <div className="border-t border-slate-100 px-5 py-5 md:px-6">
                      <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                        {faq.answer}
                      </p>
                      {faq.sourcePage && (
                        <p className="mt-4 text-xs font-medium text-slate-400">
                          Kaynak: 2026 Ortaöğretime Geçiş Tercih ve Yerleştirme
                          Kılavuzu, sayfa {faq.sourcePage}
                        </p>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <Search aria-hidden="true" className="mx-auto h-8 w-8 text-slate-300" />
          <h2 className="mt-4 font-bold text-slate-800">Sonuç bulunamadı</h2>
          <p className="mt-2 text-sm text-slate-500">
            Farklı veya daha kısa bir arama ifadesi deneyebilirsiniz.
          </p>
        </div>
      )}
    </>
  );
}
