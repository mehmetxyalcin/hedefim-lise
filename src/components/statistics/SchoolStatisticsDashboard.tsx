"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  Database,
  Filter,
  MapPinned,
  Minus,
  RotateCcw,
  Search,
  Users,
} from "lucide-react";
import type { SchoolStatistic, SchoolType } from "@/data/mersinSchoolStatistics2026";

type Props = {
  schools: SchoolStatistic[];
  source: string;
};

type Metric = "quota" | "percentile";

const numberFormatter = new Intl.NumberFormat("tr-TR");
const decimalFormatter = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function normalize(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i");
}

function typeBadge(type: SchoolType) {
  if (type === "Fen Lisesi") return "bg-violet-50 text-violet-700 ring-violet-200";
  if (type === "Sosyal Bilimler Lisesi") {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }
  return "bg-blue-50 text-blue-700 ring-blue-200";
}

function ChangeIndicator({ value, reverse = false }: { value: number; reverse?: boolean }) {
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-slate-500">
        <Minus className="h-3.5 w-3.5" /> Değişmedi
      </span>
    );
  }

  const positive = reverse ? value < 0 : value > 0;
  const Icon = value > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold ${
        positive ? "text-emerald-600" : "text-rose-600"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {value > 0 ? "+" : ""}
      {decimalFormatter.format(value)}
    </span>
  );
}

export function SchoolStatisticsDashboard({ schools, source }: Props) {
  const [typeFilter, setTypeFilter] = useState<SchoolType | "Tümü">("Tümü");
  const [districtFilter, setDistrictFilter] = useState("Tümü");
  const [search, setSearch] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState(schools[0]?.id ?? "");
  const [metric, setMetric] = useState<Metric>("percentile");

  const districts = useMemo(
    () => [...new Set(schools.map((school) => school.district))].sort((a, b) =>
      a.localeCompare(b, "tr"),
    ),
    [schools],
  );

  const types = useMemo(
    () => [...new Set(schools.map((school) => school.type))],
    [schools],
  );

  const filteredSchools = useMemo(() => {
    const normalizedSearch = normalize(search.trim());
    return schools
      .filter((school) => typeFilter === "Tümü" || school.type === typeFilter)
      .filter(
        (school) => districtFilter === "Tümü" || school.district === districtFilter,
      )
      .filter(
        (school) =>
          !normalizedSearch ||
          normalize(`${school.school} ${school.district} ${school.type}`).includes(
            normalizedSearch,
          ),
      )
      .sort(
        (a, b) =>
          (a.percentiles[2025] ?? Number.POSITIVE_INFINITY) -
          (b.percentiles[2025] ?? Number.POSITIVE_INFINITY),
      );
  }, [districtFilter, schools, search, typeFilter]);

  const summary = useMemo(() => {
    const quota2026 = filteredSchools.reduce(
      (total, school) => total + (school.quotas[2026] ?? 0),
      0,
    );
    const quota2025 = filteredSchools.reduce(
      (total, school) => total + (school.quotas[2025] ?? 0),
      0,
    );
    const percentileValues = filteredSchools
      .map((school) => school.percentiles[2025])
      .filter((value): value is number => value !== undefined);
    const averagePercentile = percentileValues.length
      ? percentileValues.reduce((sum, value) => sum + value, 0) /
        percentileValues.length
      : 0;

    return { quota2026, quota2025, averagePercentile };
  }, [filteredSchools]);

  const districtQuotas = useMemo(() => {
    const totals = new Map<string, number>();
    for (const school of filteredSchools) {
      totals.set(
        school.district,
        (totals.get(school.district) ?? 0) + (school.quotas[2026] ?? 0),
      );
    }
    return [...totals.entries()]
      .map(([district, quota]) => ({ district, quota }))
      .sort((a, b) => b.quota - a.quota);
  }, [filteredSchools]);

  const trendSchool =
    filteredSchools.find((school) => school.id === selectedSchoolId) ??
    filteredSchools[0] ??
    schools[0];

  const trendValues = useMemo(() => {
    if (!trendSchool) return [];
    const years = metric === "percentile" ? [2020, 2021, 2022, 2023, 2024, 2025] : [2020, 2021, 2022, 2023, 2024, 2025, 2026];
    return years.map((year) => ({
      year,
      value:
        metric === "percentile"
          ? trendSchool.percentiles[year]
          : trendSchool.quotas[year],
    }));
  }, [metric, trendSchool]);

  const trendMax = Math.max(
    ...trendValues.map((item) => item.value ?? 0),
    metric === "percentile" ? 1 : 30,
  );
  const districtMax = Math.max(...districtQuotas.map((item) => item.quota), 1);
  const rankingMax = Math.max(
    ...filteredSchools.map((school) => school.percentiles[2025] ?? 0),
    1,
  );

  function resetFilters() {
    setTypeFilter("Tümü");
    setDistrictFilter("Tümü");
    setSearch("");
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Filter className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900">Veriyi keşfet</h2>
              <p className="text-xs text-slate-500">Filtreler tüm grafikleri birlikte günceller.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Sıfırla
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr]">
          <label className="relative">
            <span className="sr-only">Okul ara</span>
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Okul veya ilçe ara..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
          </label>
          <label>
            <span className="sr-only">Okul türü</span>
            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as SchoolType | "Tümü")
              }
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="Tümü">Tüm okul türleri</option>
              {types.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">İlçe</span>
            <select
              value={districtFilter}
              onChange={(event) => setDistrictFilter(event.target.value)}
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="Tümü">Tüm ilçeler</option>
              {districts.map((district) => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-500">Okul</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{filteredSchools.length}</p>
              <p className="mt-1 text-xs text-slate-500">filtrelenen okul sayısı</p>
            </div>
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
        </article>
        <article className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">2026 Kontenjan</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{numberFormatter.format(summary.quota2026)}</p>
              <p className="mt-1 text-xs text-slate-500">toplam öğrenci kapasitesi</p>
            </div>
            <Users className="h-6 w-6 text-emerald-600" />
          </div>
        </article>
        <article className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-violet-600">2025 Ortalama Dilim</p>
              <p className="mt-2 text-3xl font-black text-slate-950">%{decimalFormatter.format(summary.averagePercentile)}</p>
              <p className="mt-1 text-xs text-slate-500">aritmetik ortalama</p>
            </div>
            <BarChart3 className="h-6 w-6 text-violet-600" />
          </div>
        </article>
        <article className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Kontenjan Değişimi</p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {summary.quota2026 - summary.quota2025 > 0 ? "+" : ""}
                {numberFormatter.format(summary.quota2026 - summary.quota2025)}
              </p>
              <p className="mt-1 text-xs text-slate-500">2025 yılına göre</p>
            </div>
            <MapPinned className="h-6 w-6 text-amber-600" />
          </div>
        </article>
      </section>

      {filteredSchools.length > 0 ? (
        <>
          <section className="grid gap-6 xl:grid-cols-2">
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">2026 görünümü</p>
                <h2 className="mt-1 text-xl font-extrabold text-slate-950">İlçelere göre kontenjan</h2>
              </div>
              <div className="space-y-4">
                {districtQuotas.map(({ district, quota }) => (
                  <div key={district}>
                    <div className="mb-1.5 flex items-center justify-between gap-4 text-sm">
                      <span className="font-semibold text-slate-700">{district}</span>
                      <span className="font-black tabular-nums text-slate-950">{numberFormatter.format(quota)}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-500"
                        style={{ width: `${(quota / districtMax) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">2025 yerleşme verisi</p>
                <h2 className="mt-1 text-xl font-extrabold text-slate-950">Yüzdelik dilim sıralaması</h2>
                <p className="mt-1 text-xs text-slate-500">Daha düşük değer daha seçici okulu gösterir.</p>
              </div>
              <div className="max-h-[410px] space-y-3 overflow-y-auto pr-2">
                {filteredSchools.map((school, index) => {
                  const percentile = school.percentiles[2025];
                  if (percentile === undefined) return null;
                  const width = Math.max(10, 100 - (percentile / rankingMax) * 78);
                  return (
                    <div key={school.id} className="rounded-xl bg-slate-50 p-3">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="mr-2 text-xs font-black text-slate-400">#{index + 1}</span>
                          <span className="text-sm font-bold text-slate-800">{school.school}</span>
                        </div>
                        <span className="shrink-0 text-sm font-black tabular-nums text-violet-700">%{decimalFormatter.format(percentile)}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-400"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white shadow-xl shadow-slate-300/30 md:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">Tarihsel eğilim</p>
                <h2 className="mt-1 text-xl font-extrabold">Yıllara göre okul görünümü</h2>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  value={trendSchool?.id ?? ""}
                  onChange={(event) => setSelectedSchoolId(event.target.value)}
                  className="h-11 max-w-full rounded-xl border border-white/10 bg-white/10 px-3 text-sm font-semibold text-white outline-none focus:border-cyan-400 sm:max-w-xs"
                >
                  {filteredSchools.map((school) => (
                    <option key={school.id} value={school.id} className="text-slate-900">
                      {school.school}
                    </option>
                  ))}
                </select>
                <div className="flex rounded-xl bg-white/10 p-1">
                  <button
                    type="button"
                    onClick={() => setMetric("percentile")}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition ${metric === "percentile" ? "bg-white text-slate-950" : "text-slate-300 hover:text-white"}`}
                  >
                    Yüzdelik
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetric("quota")}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition ${metric === "quota" ? "bg-white text-slate-950" : "text-slate-300 hover:text-white"}`}
                  >
                    Kontenjan
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 flex h-64 items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 pb-4 pt-8 sm:gap-4 md:px-6">
              {trendValues.map(({ year, value }) => (
                <div key={year} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <span className="text-[10px] font-bold tabular-nums text-cyan-200 sm:text-xs">
                    {value === undefined
                      ? "—"
                      : metric === "percentile"
                        ? `%${decimalFormatter.format(value)}`
                        : numberFormatter.format(value)}
                  </span>
                  <div className="flex h-[78%] w-full items-end justify-center">
                    {value !== undefined && (
                      <div
                        className="w-full max-w-12 rounded-t-lg bg-gradient-to-t from-blue-600 to-cyan-300 transition-all duration-500"
                        style={{ height: `${Math.max(8, (value / trendMax) * 100)}%` }}
                      />
                    )}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 sm:text-xs">{year}</span>
                </div>
              ))}
            </div>
            {metric === "percentile" && (
              <p className="mt-3 text-xs text-slate-400">Yüzdelik dilimde daha düşük değer daha seçici yerleşme düzeyini ifade eder.</p>
            )}
          </section>

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5 md:px-6">
              <h2 className="text-xl font-extrabold text-slate-950">Okul karşılaştırma tablosu</h2>
              <p className="mt-1 text-xs text-slate-500">2025 yüzdelik dilimi ve 2026 kontenjanı birlikte gösterilir.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Okul</th>
                    <th className="px-4 py-3">İlçe</th>
                    <th className="px-4 py-3">Tür</th>
                    <th className="px-4 py-3 text-right">2025 Dilim</th>
                    <th className="px-4 py-3 text-right">2026 Kont.</th>
                    <th className="px-5 py-3 text-right">Dilim değişimi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSchools.map((school) => {
                    const p2025 = school.percentiles[2025];
                    const p2024 = school.percentiles[2024];
                    return (
                      <tr key={school.id} className="transition-colors hover:bg-blue-50/40">
                        <td className="px-5 py-4 font-bold text-slate-900">{school.school}</td>
                        <td className="px-4 py-4 text-slate-600">{school.district}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${typeBadge(school.type)}`}>
                            {school.type}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right font-black tabular-nums text-violet-700">
                          {p2025 === undefined ? "—" : `%${decimalFormatter.format(p2025)}`}
                        </td>
                        <td className="px-4 py-4 text-right font-black tabular-nums text-slate-900">
                          {school.quotas[2026] === undefined ? "—" : numberFormatter.format(school.quotas[2026])}
                        </td>
                        <td className="px-5 py-4 text-right text-xs">
                          {p2025 === undefined || p2024 === undefined ? (
                            <span className="text-slate-400">Yeni / veri yok</span>
                          ) : (
                            <ChangeIndicator value={p2025 - p2024} reverse />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <Search className="mx-auto h-9 w-9 text-slate-300" />
          <h2 className="mt-4 text-lg font-extrabold text-slate-800">Bu filtrelerle okul bulunamadı</h2>
          <p className="mt-2 text-sm text-slate-500">Filtreleri sıfırlayıp yeniden deneyebilirsiniz.</p>
        </section>
      )}

      <aside className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-100 px-5 py-4 text-xs leading-5 text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Database className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
          <p>
            Kaynak: <strong>{source}</strong>. Boş hücreler “veri yok” olarak değerlendirilmiştir.
            Yüzdelik dilim ortalamaları basit aritmetik ortalamadır.
          </p>
        </div>
        <span className="shrink-0 font-bold text-slate-500">Son veri yılı: 2026</span>
      </aside>
    </div>
  );
}
