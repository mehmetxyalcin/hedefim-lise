"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { buildTurkishNameRegex } from "@/lib/turkishSearch";
import { cn } from "@/lib/cn";

export type QuickSearchSchool = { id: number; name: string; slug: string; district: string };

const MAX_RESULTS = 8;

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

// Sonuçlar gerçek <a> bağlantılarıdır; Enter etkin bağlantıya click() gönderir.
// Böylece okul formundaki kaydedilmemiş değişiklik uyarısı atlanmaz.
export function SchoolQuickSearch({ schools }: { schools: QuickSearchSchool[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const results = useMemo(() => {
    const text = query.trim();
    if (!text) return [];
    const pattern = new RegExp(buildTurkishNameRegex(text), "i");
    return schools.filter((s) => pattern.test(`${s.name} ${s.district}`)).slice(0, MAX_RESULTS);
  }, [query, schools]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "/" && !isTypingTarget(event.target)) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const showList = open && query.trim().length > 0;
  const activeIndex = Math.min(active, Math.max(results.length - 1, 0));

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive(Math.min(activeIndex + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive(Math.max(activeIndex - 1, 0));
    } else if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      listRef.current?.querySelectorAll("a")[activeIndex]?.click();
    } else if (event.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div className="relative w-full max-w-md min-w-0">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-admin-faint"
      />
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && results[activeIndex] ? `${listId}-${activeIndex}` : undefined}
        aria-label="Okul ara ve düzenle"
        placeholder="Okul ara ve düzenle…"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
        className="h-10 w-full rounded-lg border border-admin-line-strong bg-admin-ground pr-10 pl-9 text-sm text-admin-ink outline-none placeholder:text-admin-faint focus:border-admin-accent focus:bg-white focus:ring-2 focus:ring-admin-accent/20"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border border-admin-line bg-white px-1.5 font-sans text-[11px] text-admin-faint sm:block">
        /
      </kbd>
      {showList && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label="Okullar"
          className="absolute top-full right-0 left-0 z-50 mt-1.5 max-h-80 overflow-y-auto rounded-lg border border-admin-line bg-white p-1 shadow-lg"
        >
          {results.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-admin-muted">Eşleşen okul yok.</li>
          ) : (
            results.map((school, index) => (
              <li key={school.id} id={`${listId}-${index}`} role="option" aria-selected={index === activeIndex}>
                <a
                  href={`/admin/okullar/${school.slug}/duzenle`}
                  tabIndex={-1}
                  onMouseEnter={() => setActive(index)}
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm",
                    index === activeIndex ? "bg-admin-tint text-admin-tint-ink" : "text-admin-ink",
                  )}
                >
                  <span className="block truncate font-medium">{school.name}</span>
                  <span className="block text-xs text-admin-muted">{school.district}</span>
                </a>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
