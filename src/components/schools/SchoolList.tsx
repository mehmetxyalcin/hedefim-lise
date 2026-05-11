"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowDownWideNarrow,
  ArrowRight,
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Filter,
  GraduationCap,
  MapPin,
  Phone,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import { DISTRICTS } from "@/data/districts";
import { SCHOOL_TYPES } from "@/data/schoolTypes";
import type { School, SchoolScoreRaw } from "@/types/school";
import type { VocationalField } from "@/types/vocationalField";

type Filters = {
  district: string;
  type: string;
  field: string;
  hasGym: boolean;
  hasLibrary: boolean;
};

const initialFilters: Filters = {
  district: "",
  type: "",
  field: "",
  hasGym: false,
  hasLibrary: false,
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

type SchoolListProps = {
  schools: School[];
  vocationalFields: VocationalField[];
  initialDistrict?: string;
  initialType?: string;
};

export function SchoolList({ schools, vocationalFields, initialDistrict = "", initialType = "" }: SchoolListProps) {
  const [filters, setFilters] = useState<Filters>({
    ...initialFilters,
    district: initialDistrict,
    type: initialType,
  });
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const activeFiltersCount =
    Number(Boolean(filters.district)) +
    Number(Boolean(filters.type)) +
    Number(Boolean(filters.field)) +
    Number(filters.hasGym) +
    Number(filters.hasLibrary);

  const filteredSchools = useMemo(
    () =>
      schools.filter((school) => {
        return (
          (filters.district === "" || school.district === filters.district) &&
          (filters.type === "" || school.type === filters.type) &&
          (filters.field === "" ||
            school.vocationalFields?.includes(Number.parseInt(filters.field, 10))) &&
          (!filters.hasGym || school.features.includes("Kapalı Spor Salonu")) &&
          (!filters.hasLibrary || school.features.includes("Z-Kütüphane"))
        );
      }),
    [filters, schools],
  );

  const selectedField = vocationalFields.find(
    (field) => field.id === Number.parseInt(filters.field, 10),
  );

  function removeFilter(key: keyof Filters) {
    setFilters((prev) => ({
      ...prev,
      [key]: typeof prev[key] === "boolean" ? false : "",
    }));
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-10 pb-24">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="mb-10 max-w-3xl">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-100/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" /> Akıllı Tercih Sistemi
            </span>
          </div>
          <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Sana Uygun Liseleri Keşfet
          </h1>
          <p className="text-lg leading-relaxed text-slate-500">
            İlçe, okul türü ve aradığın fiziksel imkanlara göre veritabanını
            filtrele, en uygun eşleşmeleri hızla analiz et.
          </p>
        </div>

        <div className="relative z-30 mb-8 flex flex-col items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
            <span className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">
              {filteredSchools.length}
              <span className="ml-1 font-medium text-slate-500">Sonuç</span>
            </span>

            {filters.district && (
              <div
                className="group flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
                onClick={() => removeFilter("district")}
              >
                <MapPin className="h-3.5 w-3.5 text-slate-400 transition-colors group-hover:text-red-500" />
                {filters.district}
                <XCircle className="ml-1 h-3.5 w-3.5 text-slate-300 transition-colors group-hover:text-red-500" />
              </div>
            )}
            {filters.type && (
              <div
                className="group flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
                onClick={() => removeFilter("type")}
              >
                <GraduationCap className="h-3.5 w-3.5 text-slate-400 transition-colors group-hover:text-red-500" />
                {filters.type}
                <XCircle className="ml-1 h-3.5 w-3.5 text-slate-300 transition-colors group-hover:text-red-500" />
              </div>
            )}
            {filters.field && (
              <div
                className="group flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
                onClick={() => removeFilter("field")}
              >
                <Briefcase className="h-3.5 w-3.5 text-slate-400 transition-colors group-hover:text-red-500" />
                {selectedField?.title}
                <XCircle className="ml-1 h-3.5 w-3.5 text-slate-300 transition-colors group-hover:text-red-500" />
              </div>
            )}
            {filters.hasGym && (
              <div
                className="group flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
                onClick={() => removeFilter("hasGym")}
              >
                Spor Salonu
                <XCircle className="ml-1 h-3.5 w-3.5 text-slate-300 transition-colors group-hover:text-red-500" />
              </div>
            )}
            {filters.hasLibrary && (
              <div
                className="group flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
                onClick={() => removeFilter("hasLibrary")}
              >
                Z-Kütüphane
                <XCircle className="ml-1 h-3.5 w-3.5 text-slate-300 transition-colors group-hover:text-red-500" />
              </div>
            )}

            {activeFiltersCount > 0 && (
              <button
                onClick={() => setFilters(initialFilters)}
                className="ml-2 text-xs font-semibold text-blue-600 underline underline-offset-2 transition-colors hover:text-blue-800"
              >
                Sıfırla
              </button>
            )}
          </div>

          <div className="mt-2 flex w-full items-center gap-3 border-t border-slate-100 pt-4 md:mt-0 md:w-auto md:border-t-0 md:pt-0">
            <div className="group relative flex-1 md:w-56">
              <ArrowDownWideNarrow className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600" />
              <select
                defaultValue="yüzdelik"
                className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-10 pl-10 text-sm font-semibold text-slate-700 outline-none transition-all hover:bg-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="yüzdelik">Yüzdelik: Düşükten Yükseğe</option>
                <option value="isim">İsim: A&apos;dan Z&apos;ye</option>
              </select>
              <ChevronRight className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
            </div>

            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 md:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtrele
            </button>
          </div>
        </div>

        <div className="relative flex flex-col items-start gap-8 lg:flex-row">
          <div
            className={`${isMobileFilterOpen ? "fixed inset-0 z-50 flex" : "hidden"} w-full shrink-0 flex-col bg-slate-900/40 backdrop-blur-sm lg:sticky lg:top-24 lg:flex lg:w-[320px] lg:bg-transparent lg:backdrop-blur-none`}
          >
            <div className="ml-auto flex h-full w-[85%] flex-col overflow-y-auto border-r border-slate-200 bg-white p-6 shadow-2xl lg:ml-0 lg:h-auto lg:w-full lg:overflow-visible lg:rounded-3xl lg:border lg:p-7 lg:shadow-sm">
              <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-5">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900">
                    <Filter className="h-5 w-5 text-blue-600" />
                    Detaylı Filtre
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Sonuçlari daraltarak hedefine ulaş.
                  </p>
                </div>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:hidden"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-grow space-y-8">
                <div>
                  <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    İlçe Lokasyonu
                  </label>
                  <div className="group relative">
                    <MapPin className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                    <select
                      className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pr-10 pl-10 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-all hover:bg-slate-100 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      value={filters.district}
                      onChange={(e) =>
                        setFilters({ ...filters, district: e.target.value })
                      }
                    >
                      <option value="">Tüm İlçeler</option>
                      {DISTRICTS.map((district) => (
                        <option key={district} value={district}>
                          {district}
                        </option>
                      ))}
                    </select>
                    <ChevronRight className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Okul Türü
                  </label>
                  <div className="group relative">
                    <GraduationCap className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                    <select
                      className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pr-10 pl-10 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-all hover:bg-slate-100 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      value={filters.type}
                      onChange={(e) =>
                        setFilters({ ...filters, type: e.target.value })
                      }
                    >
                      <option value="">Tüm Türler</option>
                      {SCHOOL_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <ChevronRight className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Meslek Alani
                  </label>
                  <div className="group relative">
                    <Briefcase className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                    <select
                      className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pr-10 pl-10 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-all hover:bg-slate-100 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      value={filters.field}
                      onChange={(e) =>
                        setFilters({ ...filters, field: e.target.value })
                      }
                    >
                      <option value="">Tüm Alanlar</option>
                      {vocationalFields.map((field) => (
                        <option key={field.id} value={field.id}>
                          {field.title}
                        </option>
                      ))}
                    </select>
                    <ChevronRight className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Tesis & Imkanlar
                  </label>
                  <div className="space-y-2.5">
                    {[
                      { key: "hasGym", label: "Kapali Spor Salonu" },
                      { key: "hasLibrary", label: "Z-Kütüphane" },
                    ].map((item) => {
                      const checked = filters[item.key as keyof Filters] as boolean;
                      return (
                        <label
                          key={item.key}
                          className={`flex cursor-pointer items-center rounded-xl border p-3.5 transition-all duration-200 ${
                            checked
                              ? "border-blue-200 bg-blue-50/50 ring-1 ring-blue-500/5 shadow-sm"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <div
                            className={`mr-3.5 flex h-5 w-5 items-center justify-center rounded-[6px] border transition-colors ${
                              checked
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-slate-300 bg-slate-50"
                            }`}
                          >
                            {checked && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                          </div>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={checked}
                            onChange={(e) =>
                              setFilters({
                                ...filters,
                                [item.key]: e.target.checked,
                              } as Filters)
                            }
                          />
                          <span
                            className={`text-sm font-semibold transition-colors ${
                              checked ? "text-blue-900" : "text-slate-700"
                            }`}
                          >
                            {item.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3 border-t border-slate-100 pt-6">
                <button
                  onClick={() => {
                    setFilters(initialFilters);
                    if (window.innerWidth < 1024) {
                      setIsMobileFilterOpen(false);
                    }
                  }}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                >
                  Sıfırla
                </button>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="flex-[2] rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm lg:hidden"
                >
                  Uygula
                </button>
              </div>
            </div>
            <div
              className="h-full w-[15%] lg:hidden"
              onClick={() => setIsMobileFilterOpen(false)}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="grid gap-5">
              {filteredSchools.map((school, index) => (
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

                    <h3 className="mb-2 line-clamp-1 text-xl font-bold tracking-tight text-slate-900 transition-colors group-hover:text-blue-600 sm:text-2xl">
                      {school.name}
                    </h3>

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
                          {(index === 0 || index === 2) && (
                            <div className="absolute -top-3 flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-white ring-2 ring-white shadow-sm">
                              <BadgeCheck className="h-3 w-3" />
                              Eslesme
                            </div>
                          )}
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
                      Detayli Incele
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
                    Sonuç Bulunamadi
                  </h3>
                  <p className="mb-8 max-w-md text-slate-500">
                    Seçtiğiniz kombinasyona uygun bir okul kaydı bulunamadı.
                    Lutfen filtrelerinizi esnetmeyi deneyin.
                  </p>
                  <button
                    onClick={() => setFilters(initialFilters)}
                    className="rounded-xl border border-slate-200 bg-white px-6 py-3 font-bold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
                  >
                    Tüm Filtreleri Temizle
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
