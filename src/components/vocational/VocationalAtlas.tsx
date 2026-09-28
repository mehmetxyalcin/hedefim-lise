"use client";

import {
  Fragment,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { ArrowRight, Search, X } from "lucide-react";
import {
  foldTurkish,
  type Atlas,
  type AtlasEntry,
  type AtlasProgram,
} from "@/lib/vocational-atlas";

// Meslek atlası, anasayfanın belge dünyasında (.landing) bir dizin sayfasıdır:
// kart ızgarası değil, harf harf ilerleyen bir alan listesi; her satırda
// alanı okutan okul sayısı. "Okul sayısı" sıralaması aynı satırları en çok
// okulu olan alandan başlayarak dizer.

const ALPHABET = [
  "A", "B", "C", "Ç", "D", "E", "F", "G", "H", "I", "İ", "J", "K", "L",
  "M", "N", "O", "Ö", "P", "R", "S", "Ş", "T", "U", "Ü", "V", "Y", "Z",
];

type Sort = "alfabetik" | "okul";

const SORTS: { id: Sort; label: string }[] = [
  { id: "alfabetik", label: "A–Z" },
  { id: "okul", label: "Okul sayısı" },
];

const INPUT_CLASS =
  "w-full rounded-xl border border-[var(--line)] bg-[var(--doc-ground)] py-2.5 pr-10 pl-10 text-base text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--ink-faint)] focus:border-[var(--teal)] focus:bg-[var(--doc-panel)] focus:ring-4 focus:ring-[var(--teal-ring)] [&::-webkit-search-cancel-button]:hidden";
const MICRO =
  "font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--ink-faint)]";
const FOCUS =
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--teal-ring)]";
// Satır ızgarası: alan · sayı · ok. Başlık satırı aynı ızgarayı kullanır.
// Telefonda sayı, birden çok satıra kırılan başlığın ilk satırına hizalanır.
const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 sm:grid-cols-[minmax(0,1fr)_2.25rem_1rem] sm:items-center";
// Sol oluk: alfabetik düzende harf, sayı düzeninde sıra numarası.
const GUTTER = "grid grid-cols-[2.25rem_minmax(0,1fr)] sm:grid-cols-[3.25rem_minmax(0,1fr)]";

function letterId(letter: string) {
  const index = ALPHABET.indexOf(letter);
  return `harf-${index >= 0 ? index : "diger"}`;
}

export function VocationalAtlas({ atlas }: { atlas: Atlas }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("alfabetik");

  const folded = foldTurkish(query);
  const entries = useMemo(
    () =>
      folded
        ? atlas.entries.filter((entry) => entry.searchText.includes(folded))
        : atlas.entries,
    [atlas.entries, folded],
  );
  const empty = useMemo(
    () =>
      folded
        ? atlas.empty.filter((p) => foldTurkish(p.title).includes(folded))
        : atlas.empty,
    [atlas.empty, folded],
  );
  const ranked = useMemo(
    () =>
      [...entries].sort(
        (a, b) =>
          b.schoolCount - a.schoolCount ||
          (b.sinavli?.schoolCount ?? 0) - (a.sinavli?.schoolCount ?? 0) ||
          a.title.localeCompare(b.title, "tr"),
      ),
    [entries],
  );
  const groups = useMemo(() => {
    const map = new Map<string, AtlasEntry[]>();
    for (const entry of entries) {
      const list = map.get(entry.letter);
      if (list) list.push(entry);
      else map.set(entry.letter, [entry]);
    }
    return [...map.entries()];
  }, [entries]);
  const letters = new Set(groups.map(([letter]) => letter));

  // Tek yazılı an: sıralama değişince satırlar yeni yerlerine kayar.
  function changeSort(next: Sort) {
    if (next === sort) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("startViewTransition" in document)) {
      setSort(next);
      return;
    }
    const root = document.documentElement;
    root.setAttribute("data-vt", "atlas");
    const transition = document.startViewTransition(() => {
      flushSync(() => setSort(next));
    });
    transition.finished.finally(() => root.removeAttribute("data-vt"));
  }

  const nothingFound = entries.length === 0 && empty.length === 0;

  return (
    <div className="container mx-auto grid max-w-6xl gap-10 px-6 pt-8 pb-16 lg:grid-cols-12 lg:gap-12 lg:pb-20">
      <section
        aria-labelledby="dizin-baslik"
        className="min-w-0 rounded-2xl border border-[var(--line)] bg-[var(--doc-panel)] shadow-sm lg:col-span-8"
      >
        <h2 id="dizin-baslik" className="sr-only">
          Alan dizini
        </h2>

        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="relative min-w-0 flex-1">
            <label htmlFor="alan-ara" className="sr-only">
              Alan ya da dal ara
            </label>
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--ink-faint)]"
            />
            <input
              id="alan-ara"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setQuery("");
              }}
              placeholder="Alan ya da dal ara"
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="search"
              className={INPUT_CLASS}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Aramayı temizle"
                className={`absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--ink-faint)] transition-colors hover:bg-[var(--doc-ground)] hover:text-[var(--ink)] ${FOCUS}`}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div
            role="group"
            aria-label="Sıralama"
            className="inline-flex shrink-0 self-start rounded-xl border border-[var(--line)] bg-[var(--doc-ground)] p-1 sm:self-auto"
          >
            {SORTS.map((option) => {
              const selected = option.id === sort;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => changeSort(option.id)}
                  className={`rounded-lg px-4 py-2 font-display text-sm font-bold tracking-tight transition-colors ${FOCUS} ${
                    selected
                      ? "bg-[var(--teal)] text-white"
                      : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {sort === "alfabetik" && letters.size > 1 && (
          <LetterIndex
            letters={letters}
            className="hide-scrollbar -mt-1 flex gap-1 overflow-x-auto px-4 pb-3 sm:px-5 lg:hidden"
            onlyPresent
          />
        )}

        <div
          className={`${GUTTER} border-t border-[var(--line)] px-4 pt-3 pb-2 sm:px-5`}
        >
          <p aria-live="polite" className={`${MICRO} col-start-2`}>
            <span className={ROW_GRID}>
              <span>
                <span className="tabular">{entries.length}</span> alan
                {folded ? " bulundu" : ""}
              </span>
              {!nothingFound && (
                <span aria-hidden className="text-right">
                  Okul
                </span>
              )}
            </span>
          </p>
        </div>

        {nothingFound ? (
          <div className="border-t border-[var(--line)] px-5 py-14 text-center">
            <p className="font-display text-lg font-bold text-[var(--ink)]">
              “{query.trim()}” ile eşleşen alan yok.
            </p>
            <p className="mt-1.5 text-[var(--ink-soft)]">
              Başka bir kelime deneyin ya da tüm alanlara dönün.
            </p>
            <button
              type="button"
              onClick={() => setQuery("")}
              className={`mt-5 inline-flex items-center gap-1.5 rounded-md font-display text-sm font-bold text-[var(--teal)] transition-colors hover:text-[var(--teal-deep)] ${FOCUS}`}
            >
              Tüm alanları göster
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : sort === "alfabetik" ? (
          groups.map(([letter, list]) => (
            <section
              key={letter}
              id={letterId(letter)}
              aria-labelledby={`${letterId(letter)}-baslik`}
              className={`${GUTTER} scroll-mt-24 border-t border-[var(--line)] px-4 sm:px-5`}
            >
              <h3
                id={`${letterId(letter)}-baslik`}
                className="pt-3 font-display text-2xl leading-none font-extrabold text-[var(--teal)] sm:pt-3.5 sm:text-[1.75rem]"
              >
                {letter}
              </h3>
              <ol className="divide-y divide-[color-mix(in_srgb,var(--line)_60%,transparent)]">
                {list.map((entry) => (
                  <EntryRow key={entry.id} entry={entry} />
                ))}
              </ol>
            </section>
          ))
        ) : (
          <ol className="divide-y divide-[color-mix(in_srgb,var(--line)_60%,transparent)] border-t border-[var(--line)] px-4 sm:px-5">
            {ranked.map((entry, index) => (
              <li key={entry.id} className={GUTTER}>
                <span className="tabular pt-[1.1rem] font-mono text-[11px] font-medium text-[var(--ink-faint)]">
                  {index + 1}
                </span>
                <EntryRow as="div" entry={entry} />
              </li>
            ))}
          </ol>
        )}

        {empty.length > 0 && (
          <div className={`${GUTTER} border-t border-[var(--line)] px-4 py-5 sm:px-5`}>
            <div className="col-start-2">
              <h3 className={MICRO}>Okul kaydı bulunmayan alanlar</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
                {empty.map((program, index) => (
                  <Fragment key={program.id}>
                    {index > 0 && ", "}
                    <Link
                      href={`/alanlar/${program.slug}`}
                      className={`rounded-sm underline decoration-[var(--line)] underline-offset-4 transition-colors hover:text-[var(--teal)] hover:decoration-[var(--teal)] ${FOCUS}`}
                    >
                      {program.title}
                    </Link>
                  </Fragment>
                ))}
              </p>
            </div>
          </div>
        )}
      </section>

      <aside className="lg:sticky lg:top-24 lg:col-span-4 lg:self-start">
        <dl>
          <div className="border-t border-[var(--ink)] pt-5 pb-7">
            <dt className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--ink-faint)]">
              Mersin&apos;de okutulan
            </dt>
            <dd className="mt-3">
              <span className="tabular font-display text-5xl leading-none font-extrabold tracking-tight text-[var(--ink)]">
                {atlas.fieldCount}
              </span>
              <span className="ml-2 font-display text-lg font-bold text-[var(--ink)]">
                alan
              </span>
              <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-soft)]">
                <span className="tabular">{atlas.schoolCount}</span> okulda;{" "}
                <span className="tabular">{atlas.sinavliCount}</span> alanın
                sınavlı programı da var.
              </p>
            </dd>
          </div>
          <div className="border-t border-[var(--line)] py-5">
            <dt className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--ink-faint)]">
              Sınavlı program
            </dt>
            <dd className="mt-2 text-[15px] leading-relaxed text-[var(--ink-soft)]">
              Öğrencisini LGS puanıyla, merkezi yerleştirmeyle alan program.
              Dizinde alanın hemen altında durur.
            </dd>
          </div>
        </dl>

        {sort === "alfabetik" && letters.size > 1 && (
          <div className="hidden border-t border-[var(--line)] py-5 lg:block">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--ink-faint)]">
              Harf dizini
            </p>
            <LetterIndex
              letters={letters}
              className="mt-3 grid grid-cols-7 gap-1"
            />
          </div>
        )}

        <p className="mt-8 font-mono text-[11px] leading-relaxed text-[var(--ink-faint)]">
          Bağımsız bir rehberdir; alan ve okul bilgileri resmi MEB
          kaynaklarından teyit edilmelidir.
        </p>
      </aside>
    </div>
  );
}

function EntryRow({
  entry,
  as: Tag = "li",
}: {
  entry: AtlasEntry;
  as?: "li" | "div";
}) {
  // Satırın kimliği sıralama geçişinde korunur: A–Z'den sayıya geçerken
  // aynı satır kendi yerinden yenisine kayar.
  const style = { viewTransitionName: `alan-${entry.id}` } as CSSProperties;

  return (
    <Tag style={style} className="atlas-row min-w-0 py-1">
      <ProgramLink program={entry}>
        <span className="min-w-0">
          <span className="block font-display text-[1.0625rem] leading-snug font-bold text-[var(--ink)] transition-colors group-hover:text-[var(--teal)]">
            {entry.title}
          </span>
          {entry.branches.length > 0 && (
            <span className="mt-1 block text-sm leading-snug text-[var(--ink-soft)]">
              {entry.branches.join(" · ")}
            </span>
          )}
        </span>
      </ProgramLink>

      {entry.sinavli && (
        <ProgramLink program={entry.sinavli} sub parentTitle={entry.title}>
          <span className="flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden
              className="mb-1.5 ml-1 h-2.5 w-2.5 shrink-0 border-b border-l border-[var(--ink-faint)]"
            />
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--ink-soft)] transition-colors group-hover:text-[var(--teal)]">
              Sınavlı program
            </span>
          </span>
        </ProgramLink>
      )}
    </Tag>
  );
}

function ProgramLink({
  program,
  sub = false,
  parentTitle,
  children,
}: {
  program: AtlasProgram;
  sub?: boolean;
  parentTitle?: string;
  children: ReactNode;
}) {
  const countTone =
    program.schoolCount === 0
      ? "text-[var(--ink-faint)]"
      : sub
        ? "text-[var(--ink-soft)]"
        : "text-[var(--ink)]";

  return (
    <Link
      href={`/alanlar/${program.slug}`}
      className={`group -mx-2 rounded-lg px-2 transition-colors hover:bg-[var(--doc-ground)] ${FOCUS} ${ROW_GRID} ${
        sub ? "py-1.5" : "py-2.5"
      }`}
    >
      {sub && parentTitle && <span className="sr-only">{parentTitle}, </span>}
      {children}
      <span
        className={`tabular text-right font-display leading-none ${countTone} ${
          sub ? "text-base font-bold" : "pt-[3px] text-lg font-extrabold sm:pt-0"
        }`}
      >
        {program.schoolCount}
        <span className="sr-only"> okul</span>
      </span>
      <ArrowRight
        aria-hidden
        className="hidden h-4 w-4 -translate-x-1 text-[var(--teal)] opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 sm:block"
      />
    </Link>
  );
}

function LetterIndex({
  letters,
  className,
  onlyPresent = false,
}: {
  letters: Set<string>;
  className: string;
  onlyPresent?: boolean;
}) {
  const list = onlyPresent
    ? ALPHABET.filter((letter) => letters.has(letter))
    : ALPHABET;

  return (
    <nav aria-label="Harf dizini">
      <ul className={className}>
        {list.map((letter) =>
          letters.has(letter) ? (
            <li key={letter} className="shrink-0">
              <a
                href={`#${letterId(letter)}`}
                className={`flex h-9 min-w-9 items-center justify-center rounded-lg font-display text-sm font-bold text-[var(--ink)] transition-colors hover:bg-[var(--teal-tint)] hover:text-[var(--teal)] ${FOCUS}`}
              >
                {letter}
              </a>
            </li>
          ) : (
            <li
              key={letter}
              aria-hidden
              className="flex h-9 min-w-9 items-center justify-center font-display text-sm font-bold text-[var(--ink-faint)] opacity-35"
            >
              {letter}
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
