"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { ChevronDown } from "lucide-react";

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  allLabel: string;
  options: readonly string[];
};

// İşaretçi türüne göre iki ayrı kontrol. Dokunmalı cihazda yerel <select>
// kalır: iOS/Android'in tekerlek seçicisi tek elle bizim panelimizden iyi.
// Fareyle ise kendi listemizi çiziyoruz — işletim sistemi menüsü şeridin
// dibinde açıldığında kırpılıyor ve kendi içinde kaymıyordu.
const COARSE = "(pointer: coarse)";

function subscribeCoarse(onStoreChange: () => void) {
  const mql = window.matchMedia(COARSE);
  mql.addEventListener("change", onStoreChange);
  return () => mql.removeEventListener("change", onStoreChange);
}

function useCoarsePointer() {
  return useSyncExternalStore(
    subscribeCoarse,
    () => window.matchMedia(COARSE).matches,
    () => true, // sunucuda yerel select: JS gelmeden de çalışan biçim
  );
}

// İki biçim aynı görünsün: kutu stili tek yerde tanımlı.
const CONTROL =
  "w-full min-w-0 cursor-pointer truncate rounded-xl border border-[var(--line)] bg-[var(--doc-ground)] py-3 pr-10 pl-3 text-base text-[var(--ink)] outline-none";

// Panelin uzayabileceği tavan; aşağıda bu kadar yer yoksa yukarı açılır.
const PANEL_MAX_PX = 256; // max-h-64

export function FilterSelect(props: Props) {
  return useCoarsePointer() ? (
    <NativeSelect {...props} />
  ) : (
    <ListboxSelect {...props} />
  );
}

function NativeSelect({ label, value, onChange, allLabel, options }: Props) {
  return (
    // min-w-0: <select>'in min-content genişliği en uzun option'a göre hesaplanır
    // ("Özel Eğitim Meslek Lisesi (İşitme Engelliler)"); şeridi taşırmasın diye kırılır.
    <div className="relative min-w-0 flex-1">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${CONTROL} appearance-none focus:border-[var(--teal)] focus:ring-4 focus:ring-[var(--teal-ring)]`}
      >
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <Chevron />
    </div>
  );
}

function ListboxSelect({ label, value, onChange, allLabel, options }: Props) {
  // Boş değer "tümü" demek; listede ilk sırada gerçek bir seçenek olarak durur.
  const items = ["", ...options];
  const labelOf = useCallback(
    (v: string) => (v === "" ? allLabel : v),
    [allLabel],
  );

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [dropUp, setDropUp] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typed = useRef({ buf: "", at: 0 });
  const listId = useId();

  function openList() {
    const el = triggerRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      const below = window.innerHeight - r.bottom;
      // Şerit foldun dibine yakın durduğu için aşağısı çoğu zaman dar kalıyor.
      setDropUp(below < PANEL_MAX_PX + 8 && r.top > below);
    }
    setActive(Math.max(0, items.indexOf(value)));
    setOpen(true);
  }

  function commit(v: string) {
    onChange(v);
    setOpen(false);
    triggerRef.current?.focus();
  }

  // Dışarı tıklayınca kapan. Seçenek tıklaması rootRef içinde kaldığı için
  // pointerdown burada kapatmaz, click'e sıra gelir.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Klavyeyle gezinirken etkin seçenek görünür kalsın.
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter") {
        e.preventDefault();
        openList();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((i) => Math.min(items.length - 1, i + 1));
        return;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
        return;
      case "Home":
        e.preventDefault();
        setActive(0);
        return;
      case "End":
        e.preventDefault();
        setActive(items.length - 1);
        return;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        return;
      case "Tab":
        setOpen(false);
        return;
      case "Enter":
      case " ":
        e.preventDefault();
        commit(items[active]);
        return;
    }

    // Yazarak bulma. Türkçe katlama: "İ" ile "i" aynı harfe insin.
    if (e.key.length === 1) {
      const now = Date.now();
      const buf = now - typed.current.at > 700 ? e.key : typed.current.buf + e.key;
      typed.current = { buf, at: now };
      const needle = buf.toLocaleLowerCase("tr");
      const hit = items.findIndex((v) =>
        labelOf(v).toLocaleLowerCase("tr").startsWith(needle),
      );
      if (hit >= 0) setActive(hit);
    }
  }

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-label={label}
        aria-controls={listId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={handleKeyDown}
        className={`${CONTROL} text-left focus-visible:border-[var(--teal)] focus-visible:ring-4 focus-visible:ring-[var(--teal-ring)]`}
      >
        {labelOf(value)}
      </button>
      <Chevron flipped={open} />

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={label}
          className={`absolute z-30 max-h-64 w-full overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--doc-panel)] p-1 shadow-lg ${
            dropUp ? "bottom-full mb-2 listbox-up" : "top-full mt-2 listbox-down"
          }`}
        >
          {items.map((v, i) => {
            const selected = v === value;
            const isActive = i === active;
            return (
              <li
                key={v || "__all"}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={selected}
                data-active={isActive}
                onMouseEnter={() => setActive(i)}
                onClick={() => commit(v)}
                className={`cursor-pointer truncate rounded-lg px-3 py-2.5 text-base ${
                  isActive ? "bg-[var(--teal-tint)]" : ""
                } ${
                  selected
                    ? "font-semibold text-[var(--teal)]"
                    : "text-[var(--ink)]"
                }`}
              >
                {labelOf(v)}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Chevron({ flipped = false }: { flipped?: boolean }) {
  return (
    <ChevronDown
      aria-hidden
      className={`pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[var(--ink-faint)] transition-transform duration-200 ${
        flipped ? "rotate-180" : ""
      }`}
    />
  );
}
