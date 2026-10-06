import type { SchoolStatistic } from "@/data/mersinSchoolStatistics2026";

// İstatistik bülteninin verisi: elle tutulan yedek kopya (2020'den beri) ile
// yönetim panelinden girilen canlı puanların birleşimi. Canlı değer varsa
// o kazanır; yoksa yedekteki değer kalır.

export type LiveScoreRow = {
  year: number;
  percentile: number | string | null;
  lgs_score: number | string | null;
  vocational_field_id: number | null;
  program: string | null;
};

export type LiveQuotaRow = {
  year: number;
  sinavli_count: number | null;
};

export type LiveSchoolRow = {
  slug: string;
  school_scores: LiveScoreRow[] | null;
  school_quotas: LiveQuotaRow[] | null;
};

const toNumber = (value: number | string | null) => {
  if (value == null) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
};

export function mergeLiveStatistics(
  base: SchoolStatistic[],
  rows: LiveSchoolRow[],
): SchoolStatistic[] {
  const bySlug = new Map(rows.map((row) => [row.slug, row]));
  return base.map((school) => {
    const live = bySlug.get(school.slug);
    if (!live) return school;
    const percentiles = { ...school.percentiles };
    const lgsScores = { ...school.lgsScores };
    const quotas = { ...school.quotas };
    // Yalnız okul geneli satırı: alan ya da program satırları başka bir taban.
    for (const score of live.school_scores ?? []) {
      if (score.vocational_field_id != null || score.program != null) continue;
      const percentile = toNumber(score.percentile);
      const lgs = toNumber(score.lgs_score);
      if (percentile != null) percentiles[score.year] = percentile;
      if (lgs != null) lgsScores[score.year] = lgs;
    }
    for (const quota of live.school_quotas ?? []) {
      if (quota.sinavli_count != null && quota.sinavli_count > 0) {
        quotas[quota.year] = quota.sinavli_count;
      }
    }
    return { ...school, percentiles, lgsScores, quotas };
  });
}

const yearsOf = (record: Partial<Record<number, number>>) =>
  Object.keys(record).map(Number);

/** Son puan yılı, bir önceki yıl ve kontenjanın son yılı. */
export function statisticYears(schools: SchoolStatistic[]) {
  const scoreYears = schools.flatMap((s) => yearsOf(s.percentiles));
  const quotaYears = schools.flatMap((s) => yearsOf(s.quotas));
  const latest = scoreYears.length ? Math.max(...scoreYears) : new Date().getFullYear();
  const first = scoreYears.length ? Math.min(...scoreYears) : latest;
  const quota = quotaYears.length ? Math.max(...quotaYears) : latest;
  return { first, latest, previous: latest - 1, quota };
}

/** Eksenin üst ucu: son iki yılın en geniş dilimi, 5'in katına yuvarlanır. */
export function axisMax(schools: SchoolStatistic[], years: number[]) {
  const values = schools.flatMap((s) =>
    years.map((y) => s.percentiles[y]).filter((v): v is number => v != null),
  );
  const max = values.length ? Math.max(...values) : 5;
  return Math.max(5, Math.ceil(max / 5) * 5);
}

/** Eksen çentikleri: dar eksende 5'er, genişte 10'ar dilim. */
export function axisTicks(max: number) {
  const step = max <= 25 ? 5 : 10;
  const ticks: number[] = [];
  for (let t = 0; t < max; t += step) ticks.push(t);
  return [...ticks, max];
}

/** Kullanıcının yazdığı dilim: "3,5", "%3.5" gibi. 0–100 dışı ya da sayı değilse null. */
export function parsePercentile(raw: string): number | null {
  const cleaned = raw.trim().replace(/^%/, "").replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return n > 0 && n <= 100 ? n : null;
}

export type DistrictQuota = {
  district: string;
  quota: number;
  previous: number;
  schools: number;
};

export function districtQuotas(
  schools: SchoolStatistic[],
  year: number,
): DistrictQuota[] {
  const totals = new Map<string, DistrictQuota>();
  for (const school of schools) {
    const entry = totals.get(school.district) ?? {
      district: school.district,
      quota: 0,
      previous: 0,
      schools: 0,
    };
    entry.quota += school.quotas[year] ?? 0;
    entry.previous += school.quotas[year - 1] ?? 0;
    entry.schools += 1;
    totals.set(school.district, entry);
  }
  return [...totals.values()].sort(
    (a, b) => b.quota - a.quota || a.district.localeCompare(b.district, "tr"),
  );
}
