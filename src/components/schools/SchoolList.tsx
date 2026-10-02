"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronRight,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { DISTRICTS } from "@/data/districts";
import { SCHOOL_TYPES } from "@/data/schoolTypes";
import type { School } from "@/types/school";
import type { Placement, PlacementValues, ProgramOBPs } from "@/lib/school-scores";
import type { VocationalField } from "@/types/vocationalField";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { scoreRows } from "@/lib/score-display";
import { cn } from "@/lib/cn";
import { beginNavigation } from "@/lib/navigation-progress";

const LIMIT_OPTIONS = [10, 20, 50, 100] as const;

const PLACEMENT_OPTIONS = [
  { value: "yerel", label: "Yerel" },
  { value: "merkezi", label: "Merkezi" },
] as const;

type Props = {
  schools: School[];
  /** URL'de uygulanmış yerleştirme türü; kart bu türün puanını gösterir. */
  activePlacement: Placement | null;
  scoreYear: number | null;
  /** Okul ID → ortak kuralla hesaplanmış değerler (lib/school-scores). */
  scoreValues: Record<number, PlacementValues>;
  /** Okul ID → ÇPAL program bazlı OBP'ler (lib/school-scores). */
  programValues?: Record<number, ProgramOBPs>;
  vocationalFields: VocationalField[];
  totalCount: number;
  startItem: number;
  endItem: number;
  currentPage: number;
  totalPages: number;
  initialSearch?: string;
  initialIlce?: string;
  initialTur?: string;
  initialAlan?: string;
  initialLimit?: number;
  initialPlacement?: string;
  initialSiralama?: string;
  /** Landing ölçeğinden gelen puan aralıkları — filtre değişimlerinde korunur. */
  yuzdelikMin?: number | null;
  yuzdelikMax?: number | null;
  obpMin?: number | null;
  obpMax?: number | null;
};

function ScoreCell({ values, programs, placement }: { values: PlacementValues | undefined; programs: ProgramOBPs | undefined; placement: Placement | null }) {
  const { single, rows } = scoreRows(values, programs, placement);

  if (single) {
    return (
      <div className="text-right">
        <div className="tabular text-lg leading-tight font-bold text-slate-900">{single.value}</div>
        <div className="mt-0.5 text-xs text-slate-500">{single.label}</div>
      </div>
    );
  }
  if (rows) {
    return (
      <dl className="space-y-1">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-end gap-2.5">
            <dt className="text-xs whitespace-nowrap text-slate-500">{row.label}</dt>
            <dd className="tabular w-[4.25rem] text-right text-sm font-bold text-slate-900">{row.value}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return (
    <div className="text-right text-sm text-slate-400">
      <span aria-hidden="true">—</span>
      <span className="sr-only">Puan verisi yok</span>
    </div>
  );
}

const SORT_OPTIONS = [
  { value: "isim_asc", label: "İsme Göre (A-Z)" },
  { value: "yuzdelik_asc", label: "Yüzdelik: Düşükten Yükseğe" },
  { value: "yuzdelik_desc", label: "Yüzdelik: Yüksekten Düşüğe" },
  { value: "obp_desc", label: "OBP: Yüksekten Düşüğe" },
  { value: "obp_asc", label: "OBP: Düşükten Yükseğe" },
] as const;

const trFixed = (v: number) => v.toFixed(2).replace(".", ",");

const fieldLabel = "mb-1.5 block text-xs font-semibold text-slate-600";
const controlBase =
  "h-10 w-full rounded-lg border border-slate-200 bg-white text-sm text-slate-800 shadow-sm shadow-slate-900/[0.03] outline-none transition-colors hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

function SelectField({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={fieldLabel}>{label}</label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(controlBase, "cursor-pointer appearance-none truncate pr-9 pl-3")}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  );
}

function FilterChip({ children, onRemove, label }: { children: React.ReactNode; onRemove: () => void; label: string }) {
  return (
    <span className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full border border-blue-100 bg-blue-50 pr-1 pl-3 text-xs font-medium text-blue-800">
      {children}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`${label} filtresini kaldır`}
        className="flex h-5 w-5 items-center justify-center rounded-full text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-800 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

export function SchoolList({
  schools,
  activePlacement,
  scoreYear,
  scoreValues,
  programValues = {},
  vocationalFields,
  totalCount,
  startItem,
  endItem,
  totalPages,
  initialSearch = "",
  initialIlce = "",
  initialTur = "",
  initialAlan = "",
  initialLimit = 20,
  initialPlacement = "",
  initialSiralama = "isim_asc",
  yuzdelikMin = null,
  yuzdelikMax = null,
  obpMin = null,
  obpMax = null,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(initialSearch);
  const [ilce, setIlce] = useState(initialIlce);
  const [tur, setTur] = useState(initialTur);
  const [alan, setAlan] = useState(initialAlan);
  const [limit, setLimit] = useState<number>(initialLimit);
  const [placement, setPlacement] = useState(initialPlacement);
  const [siralama, setSiralama] = useState(initialSiralama);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [fieldSearch, setFieldSearch] = useState("");

  const hasYuzdelikRange = yuzdelikMin != null && yuzdelikMax != null;
  const hasObpRange = obpMin != null && obpMax != null;

  function go(url: string) {
    beginNavigation(url);
    startTransition(() => router.push(url));
  }

  // Puan aralıkları yan paneldeki filtre değişimlerinde düşmemeli.
  function keepRanges(params: URLSearchParams, drop: "yuzdelik" | "obp" | null = null) {
    if (hasYuzdelikRange && drop !== "yuzdelik") {
      params.set("yuzdelik_min", String(yuzdelikMin));
      params.set("yuzdelik_max", String(yuzdelikMax));
    }
    if (hasObpRange && drop !== "obp") {
      params.set("obp_min", String(obpMin));
      params.set("obp_max", String(obpMax));
    }
  }

  function buildSearchUrl(overrides: Record<string, string> = {}, dropRange: "yuzdelik" | "obp" | null = null): string {
    const params = new URLSearchParams();
    const s = (overrides.ara ?? search).trim();
    const _ilce = overrides.ilce ?? ilce;
    const _tur = overrides.tur ?? tur;
    const _alan = overrides.alan ?? alan;
    const _placement = overrides.yerlestirme ?? placement;
    const _limit = overrides.limit ? Number(overrides.limit) : limit;
    const _siralama = overrides.siralama ?? siralama;
    if (s) params.set("ara", s);
    if (_ilce) params.set("ilce", _ilce);
    if (_tur) params.set("tur", _tur);
    if (_alan) params.set("alan", _alan);
    if (_placement) params.set("yerlestirme", _placement);
    if (_limit !== 20) params.set("limit", String(_limit));
    if (_siralama !== "isim_asc") params.set("siralama", _siralama);
    keepRanges(params, dropRange);
    const qs = params.toString();
    return `/okullar${qs ? `?${qs}` : ""}`;
  }

  function handleSearch() {
    go(buildSearchUrl());
    setIsFilterOpen(false);
  }

  /** Masaüstü panelinde seçimler anında uygulanır (arama kutusu hariç: Enter / Ara). */
  function applyNow(key: "ilce" | "tur" | "alan" | "yerlestirme", value: string) {
    if (key === "ilce") setIlce(value);
    if (key === "tur") setTur(value);
    if (key === "alan") setAlan(value);
    if (key === "yerlestirme") setPlacement(value);
    go(buildSearchUrl({ [key]: value }));
  }

  function handleLimitChange(newLimit: number) {
    const params = new URLSearchParams();
    if (initialSearch) params.set("ara", initialSearch);
    if (initialIlce) params.set("ilce", initialIlce);
    if (initialTur) params.set("tur", initialTur);
    if (initialAlan) params.set("alan", initialAlan);
    if (initialPlacement) params.set("yerlestirme", initialPlacement);
    if (newLimit !== 20) params.set("limit", String(newLimit));
    if (siralama !== "isim_asc") params.set("siralama", siralama);
    keepRanges(params);
    const qs = params.toString();
    go(`/okullar${qs ? `?${qs}` : ""}`);
  }

  function handleSortChange(value: string) {
    setSiralama(value);
    const params = new URLSearchParams();
    if (initialSearch) params.set("ara", initialSearch);
    if (initialIlce) params.set("ilce", initialIlce);
    if (initialTur) params.set("tur", initialTur);
    if (initialAlan) params.set("alan", initialAlan);
    if (initialPlacement) params.set("yerlestirme", initialPlacement);
    if (limit !== 20) params.set("limit", String(limit));
    if (value !== "isim_asc") params.set("siralama", value);
    keepRanges(params);
    params.set("sayfa", "1");
    const qs = params.toString();
    go(`/okullar${qs ? `?${qs}` : ""}`);
    setIsSortOpen(false);
  }

  function clearFilters() {
    setSearch("");
    setIlce("");
    setTur("");
    setLimit(20);
    setAlan("");
    setPlacement("");
    go("/okullar");
    setIsFilterOpen(false);
  }

  const activeFilterCount =
    Number(Boolean(initialSearch)) +
    Number(Boolean(initialIlce)) +
    Number(Boolean(initialTur)) +
    Number(Boolean(initialAlan)) +
    Number(Boolean(initialPlacement)) +
    Number(hasYuzdelikRange) +
    Number(hasObpRange);

  const hasActiveFilters =
    Boolean(search.trim() || ilce || tur || alan || placement || limit !== 20) ||
    hasYuzdelikRange ||
    hasObpRange;

  const activeSortLabel =
    SORT_OPTIONS.find((o) => o.value === siralama)?.label ?? SORT_OPTIONS[0].label;

  const filteredVocFields = useMemo(
    () =>
      vocationalFields.filter((f) =>
        f.title.toLocaleLowerCase("tr-TR").includes(fieldSearch.toLocaleLowerCase("tr-TR")),
      ),
    [vocationalFields, fieldSearch],
  );

  const alanTitle = vocationalFields.find((f) => String(f.id) === initialAlan)?.title;

  // ── Uygulanmış filtreler (URL'deki hâl) ────────────────────────────────────
  const activeChips = activeFilterCount > 0 && (
    <>
      {initialSearch && (
        <FilterChip label="Arama" onRemove={() => { setSearch(""); go(buildSearchUrl({ ara: "" })); }}>
          &ldquo;{initialSearch}&rdquo;
        </FilterChip>
      )}
      {initialIlce && (
        <FilterChip label="İlçe" onRemove={() => { setIlce(""); go(buildSearchUrl({ ilce: "" })); }}>
          {initialIlce}
        </FilterChip>
      )}
      {initialTur && (
        <FilterChip label="Okul türü" onRemove={() => { setTur(""); go(buildSearchUrl({ tur: "" })); }}>
          {initialTur}
        </FilterChip>
      )}
      {initialAlan && (
        <FilterChip label="Meslek alanı" onRemove={() => { setAlan(""); go(buildSearchUrl({ alan: "" })); }}>
          {alanTitle ?? "Meslek alanı"}
        </FilterChip>
      )}
      {initialPlacement && (
        <FilterChip label="Yerleştirme" onRemove={() => { setPlacement(""); go(buildSearchUrl({ yerlestirme: "" })); }}>
          {PLACEMENT_OPTIONS.find((p) => p.value === initialPlacement)?.label ?? initialPlacement} yerleştirme
        </FilterChip>
      )}
      {hasYuzdelikRange && (
        <FilterChip label="Yüzdelik aralığı" onRemove={() => go(buildSearchUrl({}, "yuzdelik"))}>
          Yüzdelik <span className="tabular font-semibold">%{trFixed(yuzdelikMin!)} – %{trFixed(yuzdelikMax!)}</span>
        </FilterChip>
      )}
      {hasObpRange && (
        <FilterChip label="OBP aralığı" onRemove={() => go(buildSearchUrl({}, "obp"))}>
          OBP <span className="tabular font-semibold">{trFixed(obpMin!)} – {trFixed(obpMax!)}</span>
        </FilterChip>
      )}
    </>
  );

  // ── Masaüstü filtre paneli ─────────────────────────────────────────────────
  const sidebarContent = (
    <div>
      <div className="mb-5 flex h-7 items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900">Filtreler</h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="rounded text-xs font-semibold text-slate-500 underline-offset-2 transition-colors hover:text-rose-600 hover:underline focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
          >
            Tümünü temizle
          </button>
        )}
      </div>

      <div className="space-y-5">
        <form
          role="search"
          onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
        >
          <label htmlFor="okul-ara" className={fieldLabel}>Okul adı</label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="okul-ara"
              type="search"
              placeholder="Örn. Fen Lisesi"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(controlBase, "pr-14 pl-9 placeholder:text-slate-400 [&::-webkit-search-cancel-button]:hidden")}
            />
            <button
              type="submit"
              className="absolute top-1/2 right-1.5 h-7 -translate-y-1/2 rounded-md bg-slate-100 px-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-blue-600 hover:text-white focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
            >
              Ara
            </button>
          </div>
        </form>

        <SelectField id="filtre-ilce" label="İlçe" value={ilce} onChange={(v) => applyNow("ilce", v)}>
          <option value="">Tüm ilçeler</option>
          {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </SelectField>

        <SelectField id="filtre-tur" label="Okul türü" value={tur} onChange={(v) => applyNow("tur", v)}>
          <option value="">Tüm türler</option>
          {SCHOOL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </SelectField>

        <SelectField id="filtre-alan" label="Meslek alanı" value={alan} onChange={(v) => applyNow("alan", v)}>
          <option value="">Tüm meslek alanları</option>
          {vocationalFields.map((f) => <option key={f.id} value={String(f.id)}>{f.title}</option>)}
        </SelectField>

        <fieldset>
          <legend className={fieldLabel}>Yerleştirme türü</legend>
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-200/60 p-1">
            {[{ value: "", label: "Tümü" }, ...PLACEMENT_OPTIONS].map((opt) => {
              const selected = placement === opt.value;
              return (
                <button
                  key={opt.value || "tumu"}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => applyNow("yerlestirme", opt.value)}
                  className={cn(
                    "h-8 rounded-md text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none",
                    selected
                      ? "bg-white text-slate-900 shadow-sm shadow-slate-900/10"
                      : "text-slate-600 hover:text-slate-900",
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Merkezi: LGS yüzdelik dilimi. Yerel: OBP puanı.
          </p>
        </fieldset>
      </div>
    </div>
  );

  // ── Mobil filtre sayfası alt çubuğu ────────────────────────────────────────
  const filterFooter = (
    <div className="flex gap-3">
      <button
        onClick={clearFilters}
        className="flex-1 rounded-xl border border-slate-300 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        Temizle
      </button>
      <button
        onClick={handleSearch}
        className="flex-[2] rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
      >
        Sonuçları Göster
      </button>
    </div>
  );

  const scoreHeader = scoreYear != null ? `${scoreYear} puanı` : "Puan";

  return (
    <>
      {/* ── Mobil sticky filtre çubuğu ─────────────────────────────────────── */}
      <div className="sticky top-16 z-30 -mx-6 mb-4 border-b border-slate-200 bg-slate-50/95 px-6 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm shadow-slate-900/[0.03] transition-colors hover:bg-slate-50"
          >
            <SlidersHorizontal className="h-4 w-4 text-slate-500" />
            Filtrele
            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setIsSortOpen(true)}
            className="ml-auto flex h-10 min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm shadow-slate-900/[0.03] transition-colors hover:bg-slate-50"
          >
            <ArrowUpDown className="h-4 w-4 shrink-0 text-slate-500" />
            <span className="truncate">{activeSortLabel}</span>
          </button>
        </div>

        {activeFilterCount > 0 && (
          <div className="hide-scrollbar mt-2.5 flex gap-2 overflow-x-auto">
            {activeChips}
          </div>
        )}
      </div>

      {/* ── Ana ızgara: filtre paneli + sonuçlar ───────────────────────────── */}
      <div className="lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:items-start lg:gap-10 xl:gap-12">
        <aside aria-label="Filtreler" className="hidden lg:sticky lg:top-24 lg:block">
          {sidebarContent}
        </aside>

        <section aria-label="Okul listesi" className="min-w-0">
          {/* Sonuç çubuğu: toplam + sıralama + sayfa başına */}
          <div className="mb-3 flex min-h-10 flex-wrap items-center justify-between gap-x-6 gap-y-2">
            <p className="text-sm text-slate-600" aria-live="polite">
              {totalCount === 0 ? (
                "Sonuç bulunamadı."
              ) : (
                <>
                  <span className="tabular font-bold text-slate-900">{totalCount}</span> okul
                  {totalPages > 1 && (
                    <span className="tabular text-slate-500">
                      {" "}· {startItem}–{endItem} gösteriliyor
                    </span>
                  )}
                </>
              )}
            </p>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <span className="hidden sm:inline">Sayfa başına</span>
                <span className="sr-only sm:hidden">Sayfa başına</span>
                <span className="relative">
                  <select
                    value={limit}
                    onChange={(e) => { setLimit(Number(e.target.value)); handleLimitChange(Number(e.target.value)); }}
                    className="tabular h-9 cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white pr-7 pl-2.5 text-sm font-semibold text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  >
                    {LIMIT_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-1/2 right-2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </span>
              </label>

              {/* Masaüstü sıralama (mobilde alt sayfadan) */}
              <label className="relative hidden lg:block">
                <span className="sr-only">Sıralama</span>
                <ArrowUpDown className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <select
                  value={siralama}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="h-9 cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white pr-8 pl-8 text-sm font-semibold text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              </label>
            </div>
          </div>

          {activeFilterCount > 0 && (
            <div className="mb-4 hidden flex-wrap gap-2 lg:flex">{activeChips}</div>
          )}

          <div
            aria-busy={isPending}
            className={cn(
              "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.03] transition-opacity duration-200",
              isPending && "opacity-60",
            )}
          >
            {schools.length > 0 && (
              <>
                <div className="hidden grid-cols-[minmax(0,1fr)_12rem_1rem] items-center gap-x-6 border-b border-slate-200 bg-slate-50/70 px-5 py-2.5 text-xs font-semibold text-slate-500 sm:grid">
                  <span>Okul</span>
                  <span className="text-right">{scoreHeader}</span>
                  <span aria-hidden="true" />
                </div>

                <ul className="divide-y divide-slate-100">
                  {schools.map((school) => (
                    <li key={school.id}>
                      <Link
                        href={`/okullar/${school.slug}`}
                        className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-4 py-4 transition-colors hover:bg-slate-50 focus-visible:bg-blue-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset sm:grid-cols-[minmax(0,1fr)_12rem_1rem] sm:gap-x-6 sm:px-5"
                      >
                        <div className="min-w-0">
                          <h3 className="text-[15px] leading-snug font-bold text-slate-900 transition-colors group-hover:text-blue-700 sm:text-base">
                            {school.name}
                          </h3>
                          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-slate-500">
                            <span>{school.type}</span>
                            <span aria-hidden="true" className="text-slate-300">·</span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                              {school.district}
                            </span>
                            {school.features.slice(0, 3).map((feature) => (
                              <span key={feature} className="inline-flex items-center gap-2">
                                <span aria-hidden="true" className="text-slate-300">·</span>
                                {feature}
                              </span>
                            ))}
                          </p>
                        </div>

                        <ScoreCell values={scoreValues[school.id]} programs={programValues[school.id]} placement={activePlacement} />

                        <ChevronRight
                          aria-hidden="true"
                          className="hidden h-4 w-4 text-slate-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-blue-600 sm:block"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {schools.length === 0 && (
              <div className="flex flex-col items-center px-6 py-20 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <h3 className="mb-2 text-base font-bold text-slate-900">Bu filtrelerle okul bulunamadı</h3>
                <p className="mb-6 max-w-sm text-sm leading-relaxed text-slate-500">
                  Bir filtreyi kaldırmayı ya da ilçe veya okul türünü genişletmeyi deneyin.
                </p>
                <button
                  onClick={clearFilters}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
                >
                  Tüm filtreleri temizle
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ── Filtre Bottom Sheet ────────────────────────────────────────────── */}
      <BottomSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Filtrele"
        footer={filterFooter}
      >
        {/* Arama */}
        <div className="mb-6">
          <p className="mb-2 text-sm font-semibold text-slate-700">Okul adı</p>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Örn. Fen Lisesi"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
              className="h-11 w-full rounded-lg border border-slate-200 pr-4 pl-9 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
        </div>

        {/* İlçe */}
        <div className="mb-6">
          <p className="mb-2.5 text-sm font-semibold text-slate-700">İlçe</p>
          <div className="grid grid-cols-3 gap-2">
            {DISTRICTS.map((d) => (
              <button
                key={d}
                aria-pressed={ilce === d}
                onClick={() => setIlce(ilce === d ? "" : d)}
                className={cn(
                  "rounded-lg border px-2 py-2 text-center text-sm font-medium transition-colors",
                  ilce === d
                    ? "border-blue-300 bg-blue-50 text-blue-800"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Okul Türü */}
        <div className="mb-6">
          <p className="mb-2.5 text-sm font-semibold text-slate-700">Okul türü</p>
          <div className="space-y-2">
            {SCHOOL_TYPES.map((t) => (
              <button
                key={t}
                aria-pressed={tur === t}
                onClick={() => setTur(tur === t ? "" : t)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-left text-sm font-medium transition-colors",
                  tur === t
                    ? "border-blue-300 bg-blue-50 text-blue-800"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                )}
              >
                {t}
                {tur === t && <Check className="h-4 w-4 text-blue-600" />}
              </button>
            ))}
          </div>
        </div>

        {/* Yerleştirme */}
        <div className="mb-6">
          <p className="mb-2.5 text-sm font-semibold text-slate-700">Yerleştirme türü</p>
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
            {[{ value: "", label: "Tümü" }, ...PLACEMENT_OPTIONS].map((opt) => (
              <button
                key={opt.value || "tumu"}
                aria-pressed={placement === opt.value}
                onClick={() => setPlacement(opt.value)}
                className={cn(
                  "h-9 rounded-md text-sm font-semibold transition-all",
                  placement === opt.value
                    ? "bg-white text-slate-900 shadow-sm shadow-slate-900/10"
                    : "text-slate-600",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Meslek Alanı */}
        <div>
          <p className="mb-2.5 text-sm font-semibold text-slate-700">Meslek alanı</p>
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Alan ara..."
              value={fieldSearch}
              onChange={(e) => setFieldSearch(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 pr-4 pl-9 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 p-1.5">
            <button
              onClick={() => setAlan("")}
              className={cn(
                "mb-0.5 flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors",
                alan === "" ? "bg-blue-50 font-medium text-blue-800" : "text-slate-500 hover:bg-slate-50",
              )}
            >
              Tüm meslek alanları
              {alan === "" && <Check className="h-4 w-4 shrink-0 text-blue-600" />}
            </button>
            {filteredVocFields.map((f) => (
              <button
                key={f.id}
                onClick={() => setAlan(alan === String(f.id) ? "" : String(f.id))}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors",
                  alan === String(f.id)
                    ? "bg-blue-50 font-medium text-blue-800"
                    : "text-slate-700 hover:bg-slate-50",
                )}
              >
                {f.title}
                {alan === String(f.id) && <Check className="h-4 w-4 shrink-0 text-blue-600" />}
              </button>
            ))}
          </div>
        </div>
      </BottomSheet>

      {/* ── Sıralama Bottom Sheet ──────────────────────────────────────────── */}
      <BottomSheet
        isOpen={isSortOpen}
        onClose={() => setIsSortOpen(false)}
        title="Sıralama"
      >
        <div className="space-y-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSortChange(opt.value)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-4 py-3.5 text-sm transition-colors",
                siralama === opt.value
                  ? "bg-blue-50 font-semibold text-blue-800"
                  : "text-slate-700 hover:bg-slate-50",
              )}
            >
              {opt.label}
              {siralama === opt.value && <Check className="h-5 w-5 text-blue-600" />}
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}
