"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownWideNarrow,
  ArrowRight,
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

const LIMIT_OPTIONS = [10, 20, 50, 100] as const;

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

  // URL-based filter form state — applied on "Ara" button click
  const [search, setSearch] = useState(initialSearch);
  const [ilce, setIlce] = useState(initialIlce);
  const [tur, setTur] = useState(initialTur);
  const [alan, setAlan] = useState(initialAlan); // vocational field ID as string
  const [limit, setLimit] = useState<number>(initialLimit);
  const [placement, setPlacement] = useState(initialPlacement);
  const [siralama, setSiralama] = useState(initialSiralama);

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  function buildSearchUrl(): string {
    const params = new URLSearchParams();
    const s = search.trim();
    if (s) params.set("ara", s);
    if (ilce) params.set("ilce", ilce);
    if (tur) params.set("tur", tur);
    if (alan) params.set("alan", alan);
    if (placement) params.set("yerlestirme", placement);
    if (limit !== 20) params.set("limit", String(limit));
    if (siralama !== "isim_asc") params.set("siralama", siralama);
    const qs = params.toString();
    return `/okullar${qs ? `?${qs}` : ""}`;
  }

  function handleSearch() {
    router.push(buildSearchUrl());
    setIsMobileFilterOpen(false);
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
  }

  function clearFilters() {
    setSearch("");
    setIlce("");
    setTur("");
    setLimit(20);
    setAlan("");
    setPlacement("");
    router.push("/okullar");
    setIsMobileFilterOpen(false);
  }

  // Active filter count: shows filters currently applied to server results
  const activeFilterCount =
    Number(Boolean(initialSearch)) +
    Number(Boolean(initialIlce)) +
    Number(Boolean(initialTur)) +
    Number(Boolean(initialAlan)) +
    Number(Boolean(initialPlacement)) +
    Number(initialLimit !== 20);

  const hasActiveFilters =
    Boolean(search.trim() || ilce || tur || alan || placement || limit !== 20);

  // No remaining client-side filters; all filtering is server-side via URL
  const filteredSchools = useMemo(
    () =>
      schools.filter(
        () => true,
      ),
    [schools],
  );

  const sidebarContent = (
    <div className="ml-auto flex h-full w-[85%] flex-col overflow-y-auto bg-white p-6 shadow-2xl lg:ml-0 lg:h-auto lg:w-full lg:overflow-visible lg:rounded-3xl lg:border lg:border-slate-200 lg:p-7 lg:shadow-sm">
      {/* Sidebar header */}
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
        <button
          onClick={() => setIsMobileFilterOpen(false)}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-grow space-y-5">
        {/* A) Arama kutusu */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Okul Ara</label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Okul adı ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              className="w-full rounded-lg border border-slate-200 py-2 pr-8 pl-9 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* B) İlçe */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">İlçe</label>
          <select
            value={ilce}
            onChange={(e) => setIlce(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Tüm İlçeler</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* C) Okul Türü */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Okul Türü</label>
          <select
            value={tur}
            onChange={(e) => setTur(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Tüm Türler</option>
            {SCHOOL_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* D) Meslek Alanı (client-side) */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Meslek Alanı</label>
          <select
            value={alan}
            onChange={(e) => setAlan(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Tüm Meslek Alanları</option>
            {vocationalFields.map((f) => (
              <option key={f.id} value={String(f.id)}>
                {f.title}
              </option>
            ))}
          </select>
        </div>

        {/* E) Yerleştirme Türü */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Yerleştirme Türü
          </label>
          <select
            value={placement}
            onChange={(e) => setPlacement(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Tümü</option>
            <option value="yerel">Yerel Yerleştirme</option>
            <option value="merkezi">Merkezi Yerleştirme</option>
            <option value="yerel_merkezi">Yerel ve Merkezi</option>
          </select>
        </div>
      </div>

      {/* F) Butonlar */}
      <div className="mt-6 space-y-2 border-t border-slate-100 pt-6">
        <button
          onClick={handleSearch}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <Search className="h-4 w-4" />
          Ara
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="w-full rounded-lg bg-slate-100 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-200"
          >
            Filtreleri Temizle
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Top bar: result count + sort + mobile filter button */}
      <div className="relative z-30 mb-6 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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
              {LIMIT_OPTIONS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="group relative hidden md:block">
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

          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtrele
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main layout: sidebar + cards */}
      <div className="relative flex flex-col items-start gap-8 lg:flex-row">
        {/* Sidebar */}
        <div
          className={`${
            isMobileFilterOpen ? "fixed inset-0 z-50 flex" : "hidden"
          } w-full shrink-0 flex-col bg-slate-900/40 backdrop-blur-sm lg:sticky lg:top-24 lg:flex lg:w-[300px] lg:bg-transparent lg:backdrop-blur-none`}
        >
          {sidebarContent}
          <div
            className="h-full w-[15%] lg:hidden"
            onClick={() => setIsMobileFilterOpen(false)}
          />
        </div>

        {/* Cards */}
        <div className="min-w-0 flex-1">
          <div className="grid gap-5">
            {filteredSchools.map((school) => (
              <div
                key={school.id}
                className="group relative flex flex-col gap-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50 sm:flex-row sm:p-6"
              >
                <div className="shrink-0">
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 text-xl font-extrabold text-white shadow-inner sm:h-20 sm:w-20 sm:text-2xl ${school.color}`}
                  >
                    {school.logo}
                  </div>
                </div>

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
                      <span
                        key={feature}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600"
                      >
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
                            <span className="mt-1 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              {score.label}
                            </span>
                            <span className="text-3xl font-extrabold text-slate-900 transition-colors group-hover:text-blue-700">
                              {score.value}
                            </span>
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
                <h3 className="mb-3 text-xl font-bold tracking-tight text-slate-900">
                  Sonuç Bulunamadı
                </h3>
                <p className="mb-8 max-w-md text-slate-500">
                  Seçtiğiniz kombinasyona uygun bir okul kaydı bulunamadı.
                  Lütfen filtrelerinizi esnetmeyi deneyin.
                </p>
                <button
                  onClick={clearFilters}
                  className="rounded-xl border border-slate-200 bg-white px-6 py-3 font-bold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
                >
                  Tüm Filtreleri Temizle
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
