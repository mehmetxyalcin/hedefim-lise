"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  GraduationCap,
  MapPin,
  Search,
  X,
  XCircle,
} from "lucide-react";
import { DISTRICTS } from "@/data/districts";
import { SCHOOL_TYPES } from "@/data/schoolTypes";

const LIMIT_OPTIONS = [10, 20, 50, 100] as const;

type Props = {
  initialValues: {
    search: string;
    ilce: string;
    tur: string;
    limit: number;
  };
};

export function SchoolFilters({ initialValues }: Props) {
  const router = useRouter();
  const [searchText, setSearchText] = useState(initialValues.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ref ile stale closure problemini önle
  const valuesRef = useRef(initialValues);
  valuesRef.current = initialValues;
  const searchTextRef = useRef(searchText);
  searchTextRef.current = searchText;

  // Üst bileşenden gelen search değişirse input'u güncelle (badge ile temizleme)
  useEffect(() => {
    setSearchText(initialValues.search);
  }, [initialValues.search]);

  function buildUrl(overrides: {
    ara?: string;
    ilce?: string;
    tur?: string;
    limit?: number;
  }) {
    const v = valuesRef.current;
    const params = new URLSearchParams();
    const ara = "ara" in overrides ? overrides.ara : v.search;
    const ilce = "ilce" in overrides ? overrides.ilce : v.ilce;
    const tur = "tur" in overrides ? overrides.tur : v.tur;
    const limit = "limit" in overrides ? overrides.limit : v.limit;
    if (ara) params.set("ara", ara);
    if (ilce) params.set("ilce", ilce);
    if (tur) params.set("tur", tur);
    if (limit && limit !== 20) params.set("limit", String(limit));
    const qs = params.toString();
    return `/okullar${qs ? `?${qs}` : ""}`;
  }

  // 500ms debounce ile arama
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      router.push(buildUrl({ ara: searchTextRef.current }));
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchText]); // eslint-disable-line react-hooks/exhaustive-deps

  function clearSearch() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearchText("");
    router.push(buildUrl({ ara: "" }));
  }

  const hasActiveFilters = Boolean(
    initialValues.search || initialValues.ilce || initialValues.tur,
  );

  const selectClass =
    "cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-8 pl-10 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

  return (
    <div className="mb-6 space-y-3">
      {/* Ana filtre satırı */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
        {/* Arama */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (debounceRef.current) clearTimeout(debounceRef.current);
                router.push(buildUrl({ ara: searchText }));
              }
            }}
            placeholder="Okul adı ara..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-10 pl-10 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
          />
          {searchText && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Aramayı temizle"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* İlçe */}
        <div className="relative">
          <MapPin className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <select
            value={initialValues.ilce}
            onChange={(e) => router.push(buildUrl({ ilce: e.target.value }))}
            className={`${selectClass} w-full md:w-44`}
          >
            <option value="">Tüm İlçeler</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <ChevronRight className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
        </div>

        {/* Okul türü */}
        <div className="relative">
          <GraduationCap className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <select
            value={initialValues.tur}
            onChange={(e) => router.push(buildUrl({ tur: e.target.value }))}
            className={`${selectClass} w-full md:w-52`}
          >
            <option value="">Tüm Türler</option>
            {SCHOOL_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <ChevronRight className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
        </div>

        {/* Sayfa başına */}
        <div className="flex shrink-0 items-center gap-2">
          <span className="whitespace-nowrap text-sm text-slate-500">Sayfa başına:</span>
          <select
            value={initialValues.limit}
            onChange={(e) => router.push(buildUrl({ limit: Number(e.target.value) }))}
            className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          >
            {LIMIT_OPTIONS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Aktif filtre badge'leri */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {initialValues.search && (
            <button
              type="button"
              onClick={clearSearch}
              className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
            >
              Arama: &ldquo;{initialValues.search}&rdquo;
              <XCircle className="h-3.5 w-3.5" />
            </button>
          )}
          {initialValues.ilce && (
            <button
              type="button"
              onClick={() => router.push(buildUrl({ ilce: "" }))}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              {initialValues.ilce}
              <XCircle className="h-3.5 w-3.5 text-slate-300" />
            </button>
          )}
          {initialValues.tur && (
            <button
              type="button"
              onClick={() => router.push(buildUrl({ tur: "" }))}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
              {initialValues.tur}
              <XCircle className="h-3.5 w-3.5 text-slate-300" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (debounceRef.current) clearTimeout(debounceRef.current);
              setSearchText("");
              router.push("/okullar");
            }}
            className="text-xs font-semibold text-rose-600 underline underline-offset-2 hover:text-rose-800"
          >
            Tümünü Temizle
          </button>
        </div>
      )}
    </div>
  );
}
