"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Layers3,
  ListChecks,
  Pencil,
  Search,
  XCircle,
} from "lucide-react";
import { DeleteSchoolButton } from "@/components/admin/DeleteSchoolButton";
import type { School } from "@/types/school";

type AdminSchoolListProps = {
  bulkStatusAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
  schools: School[];
  toggleStatusAction: (formData: FormData) => void | Promise<void>;
};

type StatusFilter = "all" | "active" | "passive";

type SortOption =
  | "name-asc"
  | "name-desc"
  | "updated-desc"
  | "created-desc"
  | "district-asc"
  | "type-asc"
  | "status-asc";

const sortLabels: Record<SortOption, string> = {
  "name-asc": "Okul adı (A-Z)",
  "name-desc": "Okul adı (Z-A)",
  "updated-desc": "Son güncellenen",
  "created-desc": "Son eklenen",
  "district-asc": "İlçe (A-Z)",
  "type-asc": "Tür (A-Z)",
  "status-asc": "Durum",
};

function compareText(first: string, second: string) {
  return first.localeCompare(second, "tr", { sensitivity: "base" });
}

function compareByName(first: School, second: School) {
  return compareText(first.name, second.name);
}

function getDateValue(value?: string | null) {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Tarih yok";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Tarih yok";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function isVocationalSchool(school: School) {
  return school.type.toLocaleLowerCase("tr-TR").includes("meslek");
}

function getContentWarnings(school: School) {
  const warnings: string[] = [];
  const descriptionLength = school.description.trim().length;

  if (school.images.length === 0) {
    warnings.push("Görsel eksik");
  }

  if (descriptionLength === 0) {
    warnings.push("Açıklama eksik");
  } else if (descriptionLength < 80) {
    warnings.push("Açıklama kısa");
  }

  if (school.features.length === 0) {
    warnings.push("Özellik eksik");
  }

  if (school.projects.length === 0) {
    warnings.push("Proje eksik");
  }

  if (school.languages.length === 0) {
    warnings.push("Dil eksik");
  }

  if (isVocationalSchool(school) && (school.vocationalFields?.length ?? 0) === 0) {
    warnings.push("Meslek alanı eksik");
  }

  return warnings;
}

function getContentScore(school: School) {
  const descriptionLength = school.description.trim().length;
  const checks = [
    school.images.length > 0,
    descriptionLength >= 80,
    school.features.length > 0,
    school.projects.length > 0,
    school.languages.length > 0,
    !isVocationalSchool(school) || (school.vocationalFields?.length ?? 0) > 0,
  ];

  const passedChecks = checks.filter(Boolean).length;
  return Math.round((passedChecks / checks.length) * 100);
}

export function AdminSchoolList({
  bulkStatusAction,
  deleteAction,
  schools,
  toggleStatusAction,
}: AdminSchoolListProps) {
  const [query, setQuery] = useState("");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<Set<number>>(
    () => new Set(),
  );
  const selectVisibleCheckboxRef = useRef<HTMLInputElement>(null);

  const districtOptions = useMemo(
    () =>
      [...new Set(schools.map((school) => school.district).filter(Boolean))].sort(
        compareText,
      ),
    [schools],
  );

  const typeOptions = useMemo(
    () =>
      [...new Set(schools.map((school) => school.type).filter(Boolean))].sort(
        compareText,
      ),
    [schools],
  );

  const stats = useMemo(() => {
    const active = schools.filter((school) => school.isActive !== false).length;
    const withVocationalFields = schools.filter(
      (school) => (school.vocationalFields?.length ?? 0) > 0,
    ).length;
    const incomplete = schools.filter(
      (school) => getContentWarnings(school).length > 0,
    ).length;

    return {
      active,
      incomplete,
      passive: schools.length - active,
      total: schools.length,
      withVocationalFields,
    };
  }, [schools]);

  const filteredSchools = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");

    return schools
      .filter((school) => {
        const matchesQuery =
          !normalizedQuery ||
          [school.name, school.district, school.type, school.slug]
            .join(" ")
            .toLocaleLowerCase("tr-TR")
            .includes(normalizedQuery);
        const matchesDistrict =
          districtFilter === "all" || school.district === districtFilter;
        const matchesType = typeFilter === "all" || school.type === typeFilter;
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && school.isActive !== false) ||
          (statusFilter === "passive" && school.isActive === false);

        return matchesQuery && matchesDistrict && matchesType && matchesStatus;
      })
      .sort((first, second) => {
        switch (sortBy) {
          case "name-desc":
            return compareText(second.name, first.name);
          case "updated-desc":
            return (
              getDateValue(second.updatedAt ?? second.createdAt) -
              getDateValue(first.updatedAt ?? first.createdAt)
            ) || compareByName(first, second);
          case "created-desc":
            return (
              getDateValue(second.createdAt) - getDateValue(first.createdAt)
            ) || compareByName(first, second);
          case "district-asc":
            return (
              compareText(first.district, second.district) ||
              compareByName(first, second)
            );
          case "type-asc":
            return (
              compareText(first.type, second.type) || compareByName(first, second)
            );
          case "status-asc":
            return (
              Number(first.isActive === false) - Number(second.isActive === false)
            ) || compareByName(first, second);
          case "name-asc":
          default:
            return compareText(first.name, second.name);
        }
      });
  }, [districtFilter, query, schools, sortBy, statusFilter, typeFilter]);

  const hasActiveFilters = Boolean(
    query ||
      districtFilter !== "all" ||
      typeFilter !== "all" ||
      statusFilter !== "all",
  );
  const schoolIds = useMemo(
    () => new Set(schools.map((school) => school.id)),
    [schools],
  );
  const validSelectedIds = useMemo(
    () => [...selectedSchoolIds].filter((id) => schoolIds.has(id)),
    [schoolIds, selectedSchoolIds],
  );
  const validSelectedIdSet = useMemo(
    () => new Set(validSelectedIds),
    [validSelectedIds],
  );
  const visibleSchoolIds = useMemo(
    () => filteredSchools.map((school) => school.id),
    [filteredSchools],
  );
  const selectedVisibleCount = visibleSchoolIds.filter((id) =>
    validSelectedIdSet.has(id),
  ).length;
  const selectedCount = validSelectedIds.length;
  const allVisibleSelected =
    visibleSchoolIds.length > 0 && selectedVisibleCount === visibleSchoolIds.length;
  const someVisibleSelected =
    selectedVisibleCount > 0 && selectedVisibleCount < visibleSchoolIds.length;

  useEffect(() => {
    if (selectVisibleCheckboxRef.current) {
      selectVisibleCheckboxRef.current.indeterminate = someVisibleSelected;
    }
  }, [someVisibleSelected]);

  function resetFilters() {
    setQuery("");
    setDistrictFilter("all");
    setTypeFilter("all");
    setStatusFilter("all");
    setSortBy("name-asc");
  }

  function toggleSchoolSelection(schoolId: number) {
    setSelectedSchoolIds((current) => {
      const next = new Set(current);

      if (next.has(schoolId)) {
        next.delete(schoolId);
      } else {
        next.add(schoolId);
      }

      return next;
    });
  }

  function toggleVisibleSelection() {
    setSelectedSchoolIds((current) => {
      const next = new Set(current);

      if (allVisibleSelected) {
        for (const id of visibleSchoolIds) {
          next.delete(id);
        }
      } else {
        for (const id of visibleSchoolIds) {
          next.add(id);
        }
      }

      return next;
    });
  }

  function clearSelection() {
    setSelectedSchoolIds(new Set());
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Toplam okul
          </p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Aktif
          </p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-800">
            {stats.active}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Pasif
          </p>
          <p className="mt-1 text-2xl font-extrabold text-amber-800">
            {stats.passive}
          </p>
        </div>
        <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                Alan ilişkili
              </p>
              <p className="mt-1 text-2xl font-extrabold text-violet-800">
                {stats.withVocationalFields}
              </p>
            </div>
            <Layers3 className="h-6 w-6 text-violet-400" />
          </div>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                Eksik içerik
              </p>
              <p className="mt-1 text-2xl font-extrabold text-rose-800">
                {stats.incomplete}
              </p>
            </div>
            <AlertTriangle className="h-6 w-6 text-rose-400" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1.2fr)_repeat(4,minmax(160px,1fr))_auto]">
          <label className="relative block">
            <span className="sr-only">Okul ara</span>
            <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Okul, ilçe, tür veya slug ara"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pr-4 pl-11 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
          </label>

          <select
            value={districtFilter}
            onChange={(event) => setDistrictFilter(event.target.value)}
            className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            aria-label="İlçe filtresi"
          >
            <option value="all">Tüm ilçeler</option>
            {districtOptions.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            aria-label="Okul türü filtresi"
          >
            <option value="all">Tüm türler</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            aria-label="Durum filtresi"
          >
            <option value="all">Tüm durumlar</option>
            <option value="active">Aktif</option>
            <option value="passive">Pasif</option>
          </select>

          <label className="relative block">
            <span className="sr-only">Sıralama</span>
            <ArrowUpDown className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pr-3 pl-11 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            >
              {Object.entries(sortLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={resetFilters}
            disabled={!hasActiveFilters && sortBy === "name-asc"}
            className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Sıfırla
          </button>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          {filteredSchools.length} / {schools.length} okul gösteriliyor
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold text-slate-900">Toplu işlemler</p>
          <p className="mt-1 text-sm text-slate-500">
            {selectedCount > 0
              ? `${selectedCount} okul seçildi. ${selectedVisibleCount} tanesi mevcut filtrede görünüyor.`
              : "Listeden okul seçerek toplu aktif/pasif işlemi yapabilirsiniz."}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {selectedCount > 0 && (
            <button
              type="button"
              onClick={clearSelection}
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Seçimi temizle
            </button>
          )}
          <form
            action={bulkStatusAction}
            onSubmit={(event) => {
              if (selectedCount === 0) {
                event.preventDefault();
                return;
              }
            }}
          >
            {validSelectedIds.map((id) => (
              <input key={id} type="hidden" name="ids" value={id} />
            ))}
            <input type="hidden" name="is_active" value="true" />
            <button
              type="submit"
              disabled={selectedCount === 0}
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Aktif yap
            </button>
          </form>
          <form
            action={bulkStatusAction}
            onSubmit={(event) => {
              if (selectedCount === 0) {
                event.preventDefault();
                return;
              }

              const confirmed = window.confirm(
                `${selectedCount} okulu pasif hale getirmek istediğinize emin misiniz? Pasif okullar yayındaki listede görünmez.`,
              );

              if (!confirmed) {
                event.preventDefault();
              }
            }}
          >
            {validSelectedIds.map((id) => (
              <input key={id} type="hidden" name="ids" value={id} />
            ))}
            <input type="hidden" name="is_active" value="false" />
            <button
              type="submit"
              disabled={selectedCount === 0}
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <XCircle className="h-3.5 w-3.5" />
              Pasif yap
            </button>
          </form>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] border-collapse text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    ref={selectVisibleCheckboxRef}
                    type="checkbox"
                    checked={allVisibleSelected}
                    disabled={visibleSchoolIds.length === 0}
                    onChange={toggleVisibleSelection}
                    aria-label="Görünen okulları seç"
                    className="h-4 w-4 rounded border-slate-300"
                  />
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Okul
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Tür
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                  İlçe
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Durum
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Güncelleme
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                  İçerik
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSchools.length === 0 ? (
                <tr className="border-t border-slate-200">
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">
                    Filtrelere uygun okul bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredSchools.map((school) => {
                  const isActive = school.isActive !== false;
                  const contentWarnings = getContentWarnings(school);
                  const contentScore = getContentScore(school);
                  const contentWarningsText = contentWarnings.join(", ");

                  return (
                    <tr
                      key={school.id}
                      className="border-t border-slate-200 transition-colors hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={validSelectedIdSet.has(school.id)}
                          onChange={() => toggleSchoolSelection(school.id)}
                          aria-label={`${school.name} okulunu seç`}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-semibold text-slate-900">{school.name}</p>
                          <p className="mt-1 text-xs text-slate-500">/{school.slug}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">{school.type}</td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {school.district}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                              : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                          }`}
                        >
                          {isActive ? "Aktif" : "Pasif"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        <div>
                          <p>{formatDate(school.updatedAt ?? school.createdAt)}</p>
                          {school.createdAt && (
                            <p className="mt-1 text-xs text-slate-400">
                              Eklenme: {formatDate(school.createdAt)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="min-w-44">
                          <div className="mb-2 flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                                contentWarnings.length === 0
                                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                  : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                              }`}
                            >
                              <ListChecks className="h-3.5 w-3.5" />
                              %{contentScore}
                            </span>
                          </div>
                          {contentWarnings.length === 0 ? (
                            <p className="text-xs font-medium text-emerald-700">
                              Tam görünüyor
                            </p>
                          ) : (
                            <div
                              className="flex flex-wrap gap-1.5"
                              title={contentWarningsText}
                            >
                              {contentWarnings.slice(0, 3).map((warning) => (
                                <span
                                  key={warning}
                                  className="rounded-full bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700"
                                >
                                  {warning}
                                </span>
                              ))}
                              {contentWarnings.length > 3 && (
                                <span
                                  className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600"
                                  title={contentWarningsText}
                                >
                                  +{contentWarnings.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Link
                            href={`/admin/okullar/${school.slug}/duzenle`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Düzenle
                          </Link>

                          {isActive ? (
                            <Link
                              href={`/okullar/${school.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Aç
                            </Link>
                          ) : (
                            <span className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-400">
                              <ExternalLink className="h-3.5 w-3.5" />
                              Aç
                            </span>
                          )}

                          <form
                            action={toggleStatusAction}
                            onSubmit={(event) => {
                              if (!isActive) {
                                return;
                              }

                              const confirmed = window.confirm(
                                `"${school.name}" okulunu pasif hale getirmek istediğinize emin misiniz? Pasif okullar yayındaki listede görünmez.`,
                              );

                              if (!confirmed) {
                                event.preventDefault();
                              }
                            }}
                          >
                            <input type="hidden" name="id" value={school.id} />
                            <input
                              type="hidden"
                              name="is_active"
                              value={String(!isActive)}
                            />
                            <button
                              type="submit"
                              aria-label={`${school.name} okulunu ${
                                isActive ? "pasif hale getir" : "aktif hale getir"
                              }`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
                            >
                              {isActive ? (
                                <EyeOff className="h-3.5 w-3.5" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                              {isActive ? "Pasifleştir" : "Aktifleştir"}
                            </button>
                          </form>

                          <DeleteSchoolButton
                            action={deleteAction}
                            schoolId={school.id}
                            schoolName={school.name}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
