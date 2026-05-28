"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownWideNarrow,
  ArrowRight,
  ArrowUpDown,
  Check,
  CheckCircle2,
  ChevronRight,
  Filter,
  MapPin,
  Phone,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { DISTRICTS } from "@/data/districts";
import { SCHOOL_TYPES } from "@/data/schoolTypes";
import type { School, SchoolScoreRaw } from "@/types/school";
import type { VocationalField } from "@/types/vocationalField";
import { BottomSheet } from "@/components/ui/BottomSheet";

const LIMIT_OPTIONS = [10, 20, 50, 100] as const;

const PLACEMENT_OPTIONS = [
  { value: "yerel", label: "Yerel" },
  { value: "merkezi", label: "Merkezi" },
  { value: "yerel_merkezi", label: "Her İkisi" },
] as const;

type Props = {
  schools: School[];
  vocationalFields: VocationalField[];
  initialSearch?: string;
  initialIlce?: string;
  initialTur?: string;
  initialAlan?: string;
  initialLimit?: number;
  initialPlacement?: string;
  initialSiralama?: string;
};

type DisplayScore = {
  value: string;
  label: string;
  year: number;
};

function getDisplayScore(scores: SchoolScoreRaw[] | undefined): DisplayScore | null {
  if (!scores || scores.length === 0) return null;
  const latest = [...scores].sort((a, b) => b.year - a.year)[0];
  if (latest.percentile != null) {
    return { value: `%${latest.percentile.toFixed(2)}`, label: "Yüzdelik Dilim", year: latest.year };
  }
  if (latest.obp_score != null) {
    return { value: latest.obp_score.toFixed(2), label: "OBP Puanı", year: latest.year };
  }
  return null;
}

const SORT_OPTIONS = [
  { value: "isim_asc", label: "İsme Göre (A-Z)" },
  { value: "yuzdelik_asc", label: "Yüzdelik: Düşükten Yükseğe" },
  { value: "yuzdelik_desc", label: "Yüzdelik: Yüksekten Düşüğe" },
  { value: "obp_desc", label: "OBP: Yüksekten Düşüğe" },
  { value: "obp_asc", label: "OBP: Düşükten Yükseğe" },
] as const;

export function SchoolList({
  schools,
  vocationalFields,
  initialSearch = "",
  initialIlce = "",
  initialTur = "",
  initialAlan = "",
  initialLimit = 20,
  initialPlacement = "",
  initialSiralama = "isim_asc",
}: Props) {
  const router = useRouter();

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

  function buildSearchUrl(overrides: Record<string, string> = {}): string {
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
    const qs = params.toString();
    return `/okullar${qs ? `?${qs}` : ""}`;
  }

  function handleSearch() {
    router.push(buildSearchUrl());
    setIsFilterOpen(false);
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
    const qs = params.toString();
    router.push(`/okullar${qs ? `?${qs}` : ""}`);
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
    params.set("sayfa", "1");
    const qs = params.toString();
    router.push(`/okullar${qs ? `?${qs}` : ""}`);
    setIsSortOpen(false);
  }

  function clearFilters() {
    setSearch("");
    setIlce("");
    setTur("");
    setLimit(20);
    setAlan("");
    setPlacement("");
    router.push("/okullar");
    setIsFilterOpen(false);
  }

  const activeFilterCount =
    Number(Boolean(initialSearch)) +
    Number(Boolean(initialIlce)) +
    Number(Boolean(initialTur)) +
    Number(Boolean(initialAlan)) +
    Number(Boolean(initialPlacement)) +
    Number(initialLimit !== 20);

  const hasActiveFilters =
    Boolean(search.trim() || ilce || tur || alan || placement || limit !== 20);

  const filteredSchools = useMemo(() => schools.filter(() => true), [schools]);

  const activeSortLabel =
    SORT_OPTIONS.find((o) => o.value === siralama)?.label ?? SORT_OPTIONS[0].label;

  const filteredVocFields = useMemo(
    () =>
      vocationalFields.filter((f) =>
        f.title.toLowerCase().includes(fieldSearch.toLowerCase()),
      ),
    [vocationalFields, fieldSearch],
  );

  // ── Desktop sidebar content ─────────────────────────────────────────────────
  const sidebarContent = (
    <div className="flex h-full w-full flex-col overflow-y-auto rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
      <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-5">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-bold tracking-tight text-slate-900">Detaylı Filtre</h2>
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </div>
      </div>

      <div className="flex-grow space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Okul Ara</label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Okul adı ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
              className="w-full rounded-lg border border-slate-200 py-2 pr-8 pl-9 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600">×</button>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">İlçe</label>
          <select value={ilce} onChange={(e) => setIlce(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
            <option value="">Tüm İlçeler</option>
            {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Okul Türü</label>
          <select value={tur} onChange={(e) => setTur(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
            <option value="">Tüm Türler</option>
            {SCHOOL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Meslek Alanı</label>
          <select value={alan} onChange={(e) => setAlan(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
            <option value="">Tüm Meslek Alanları</option>
            {vocationalFields.map((f) => <option key={f.id} value={String(f.id)}>{f.title}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Yerleştirme Türü</label>
          <select value={placement} onChange={(e) => setPlacement(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
            <option value="">Tümü</option>
            <option value="yerel">Yerel Yerleştirme</option>
            <option value="merkezi">Merkezi Yerleştirme</option>
            <option value="yerel_merkezi">Yerel ve Merkezi</option>
          </select>
        </div>
      </div>

      <div className="mt-6 space-y-2 border-t border-slate-100 pt-6">
        <button onClick={handleSearch} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
          <Search className="h-4 w-4" />
          Ara
        </button>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="w-full rounded-lg bg-slate-100 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-200">
            Filtreleri Temizle
          </button>
        )}
      </div>
    </div>
  );

  // ── Mobile filter sheet footer ──────────────────────────────────────────────
  const filterFooter = (
    <div className="flex gap-3">
      <button
        onClick={clearFilters}
        className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
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

  return (
    <>
      {/* ── Mobil sticky filtre çubuğu ─────────────────────────────────────── */}
      <div className="sticky top-20 z-30 mb-4 border-b border-gray-200 bg-white px-0 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtrele
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setIsSortOpen(true)}
            className="ml-auto flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <ArrowUpDown className="h-4 w-4" />
            <span className="max-w-[140px] truncate">{activeSortLabel}</span>
          </button>
        </div>

        {/* Aktif filtre chip'leri */}
        {activeFilterCount > 0 && (
          <div className="hide-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
            {initialSearch && (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700">
                &ldquo;{initialSearch}&rdquo;
                <button onClick={() => { setSearch(""); router.push(buildSearchUrl({ ara: "" })); }}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {initialIlce && (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700">
                {initialIlce}
                <button onClick={() => { setIlce(""); router.push(buildSearchUrl({ ilce: "" })); }}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {initialTur && (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700">
                {initialTur}
                <button onClick={() => { setTur(""); router.push(buildSearchUrl({ tur: "" })); }}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {initialPlacement && (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700">
                {PLACEMENT_OPTIONS.find((p) => p.value === initialPlacement)?.label ?? initialPlacement}
                <button onClick={() => { setPlacement(""); router.push(buildSearchUrl({ yerlestirme: "" })); }}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Masaüstü sonuç sayısı + sıralama çubuğu ──────────────────────── */}
      <div className="relative z-20 mb-6 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">
            {filteredSchools.length}
            <span className="ml-1 font-medium text-slate-500">sonuç</span>
          </span>
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap text-xs text-slate-500">Sayfa başına:</span>
            <select
              value={limit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              {LIMIT_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {/* Masaüstü sıralama select */}
        <div className="group relative hidden lg:block">
          <ArrowDownWideNarrow className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <select
            value={siralama}
            onChange={(e) => handleSortChange(e.target.value)}
            className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-10 pl-10 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronRight className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
        </div>
      </div>

      {/* ── Ana grid: sidebar + kartlar ───────────────────────────────────── */}
      <div className="relative flex flex-col items-start gap-8 lg:flex-row">
        {/* Masaüstü sidebar */}
        <div className="hidden w-[300px] shrink-0 lg:sticky lg:top-24 lg:block lg:self-start">
          {sidebarContent}
        </div>

        {/* Okul kartları */}
        <div className="min-w-0 flex-1">
          <div className="grid gap-5">
            {filteredSchools.map((school) => (
              <div
                key={school.id}
                className="group relative flex flex-col gap-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50 sm:flex-row sm:p-6"
              >
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-blue-100 bg-blue-50/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                      {school.type}
                    </span>
                    <span className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      <MapPin className="h-3 w-3" />
                      {school.district}
                    </span>
                    {school.phone && (
                      <a
                        href={`tel:${school.phone}`}
                        className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-500 transition-colors hover:border-blue-200 hover:text-blue-600"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`${school.name} telefonu: ${school.phone}`}
                      >
                        <Phone className="h-3 w-3" />
                        {school.phone}
                      </a>
                    )}
                  </div>

                  <Link href={`/okullar/${school.slug}`}>
                    <h3 className="mb-2 line-clamp-1 text-xl font-bold tracking-tight text-slate-900 transition-colors hover:text-blue-600 group-hover:text-blue-600 sm:text-2xl">
                      {school.name}
                    </h3>
                  </Link>

                  <p className="mb-4 max-w-2xl pr-4 text-sm leading-relaxed text-slate-500 line-clamp-2">
                    {school.description}
                  </p>

                  <div className="mt-auto flex flex-wrap gap-2">
                    {school.features.slice(0, 3).map((feature) => (
                      <span key={feature} className="flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600">
                        <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="relative flex shrink-0 flex-col justify-between border-t border-slate-100 pt-5 sm:w-48 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
                  {(() => {
                    const score = getDisplayScore(school.scores);
                    return (
                      <div className="relative mb-4 flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition-colors group-hover:border-blue-100 group-hover:bg-blue-50/40">
                        {score ? (
                          <>
                            <span className="mt-1 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{score.label}</span>
                            <span className="text-3xl font-extrabold text-slate-900 transition-colors group-hover:text-blue-700">{score.value}</span>
                            <span className="mt-1 text-[10px] text-slate-400">{score.year}</span>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">Veri yok</span>
                        )}
                      </div>
                    );
                  })()}
                  <Link
                    href={`/okullar/${school.slug}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-600/40"
                  >
                    Detaylı İncele
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}

            {filteredSchools.length === 0 && (
              <div className="flex flex-col items-center rounded-3xl border border-slate-200 bg-white py-24 text-center shadow-sm">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-slate-100 bg-slate-50">
                  <Search className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="mb-3 text-xl font-bold tracking-tight text-slate-900">Sonuç Bulunamadı</h3>
                <p className="mb-8 max-w-md text-slate-500">
                  Seçtiğiniz kombinasyona uygun bir okul kaydı bulunamadı. Lütfen filtrelerinizi esnetmeyi deneyin.
                </p>
                <button onClick={clearFilters} className="rounded-xl border border-slate-200 bg-white px-6 py-3 font-bold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50">
                  Tüm Filtreleri Temizle
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Filtre Bottom Sheet ────────────────────────────────────────────── */}
      <BottomSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Filtrele"
        footer={filterFooter}
      >
        {/* Arama */}
        <div className="mb-5">
          <p className="mb-2 text-sm font-semibold text-gray-700">Okul Ara</p>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Okul adı ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 py-2.5 pr-4 pl-9 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* İlçe */}
        <div className="mb-5">
          <p className="mb-3 text-sm font-semibold text-gray-700">İlçe</p>
          <div className="grid grid-cols-3 gap-2">
            {DISTRICTS.map((d) => (
              <button
                key={d}
                onClick={() => setIlce(ilce === d ? "" : d)}
                className={`rounded-xl border px-2 py-2 text-center text-sm font-medium transition-colors ${
                  ilce === d
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-blue-300"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Okul Türü */}
        <div className="mb-5">
          <p className="mb-3 text-sm font-semibold text-gray-700">Okul Türü</p>
          <div className="space-y-2">
            {SCHOOL_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setTur(tur === t ? "" : t)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                  tur === t
                    ? "border-blue-300 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-blue-200"
                }`}
              >
                {t}
                {tur === t && <Check className="h-4 w-4 text-blue-600" />}
              </button>
            ))}
          </div>
        </div>

        {/* Yerleştirme */}
        <div className="mb-5">
          <p className="mb-3 text-sm font-semibold text-gray-700">Yerleştirme Türü</p>
          <div className="grid grid-cols-3 gap-2">
            {PLACEMENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPlacement(placement === opt.value ? "" : opt.value)}
                className={`rounded-xl border py-2 text-sm font-medium transition-colors ${
                  placement === opt.value
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-blue-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Meslek Alanı */}
        <div>
          <p className="mb-3 text-sm font-semibold text-gray-700">Meslek Alanı</p>
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Alan ara..."
              value={fieldSearch}
              onChange={(e) => setFieldSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 py-2 pr-4 pl-9 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-100 p-2">
            <button
              onClick={() => setAlan("")}
              className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                alan === "" ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              Tüm Meslek Alanları
              {alan === "" && <Check className="h-4 w-4 shrink-0 text-blue-600" />}
            </button>
            {filteredVocFields.map((f) => (
              <button
                key={f.id}
                onClick={() => setAlan(alan === String(f.id) ? "" : String(f.id))}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  alan === String(f.id)
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
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
              className={`flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-sm transition-colors ${
                siralama === opt.value
                  ? "bg-blue-50 font-semibold text-blue-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
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
