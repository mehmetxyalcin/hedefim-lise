// Okul puanlarının tek kuralı: ana sayfa ölçeği, /okullar filtresi,
// sıralama ve liste kartı aynı değeri kullanır. Okul başına "en erişilebilir"
// program esas alınır: merkezi yerleştirmede en büyük yüzdelik, yerel
// yerleştirmede en düşük OBP. ÇPAL'da tür filtresi programı seçer (lib/school-programs). Yalnız veri kümesinin son yılı kullanılır.

import type { SchoolProgram } from "./school-programs";

export type ScoreInput = {
  year: number;
  percentile: number | null;
  obp_score: number | null;
  vocational_field_id?: number | null;
  program?: SchoolProgram | null;
};

export type ProgramOBPs = Record<SchoolProgram, number | null>;

export type PlacementValues = { merkezi: number | null; yerel: number | null };

export type Placement = "yerel" | "merkezi";

export type ScoreSort = "yuzdelik_asc" | "yuzdelik_desc" | "obp_desc" | "obp_asc";

export function isValidScore(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 && value <= 100;
}

/**
 * Okulun son yıl değerleri. `fieldId` verilirse merkezi değeri yalnız o
 * alanın yüzdeliğinden gelir. `program` verilirse yerel değeri o programın
 * OBP'sinden gelir; o yıl programa ait satır yoksa okul geneli satırlarına
 * düşülür. Program verilmezse tüm satırların en düşük OBP'si kullanılır.
 */
export function placementValues(
  rows: ScoreInput[],
  year: number | null,
  fieldId: number | null = null,
  program: SchoolProgram | null = null,
): PlacementValues {
  let merkezi: number | null = null;
  let yerel: number | null = null;
  if (year == null) return { merkezi, yerel };
  const yearRows = rows.filter((row) => row.year === year);
  const own = program == null ? [] : yearRows.filter((row) => row.program === program);
  const obpRows =
    program == null ? yearRows
    : own.length > 0 ? own
    : yearRows.filter((row) => (row.program ?? null) === null);
  for (const row of yearRows) {
    const inField = fieldId == null || row.vocational_field_id === fieldId;
    if (inField && isValidScore(row.percentile) && (merkezi == null || row.percentile > merkezi)) {
      merkezi = row.percentile;
    }
  }
  for (const row of obpRows) {
    if (isValidScore(row.obp_score) && (yerel == null || row.obp_score < yerel)) {
      yerel = row.obp_score;
    }
  }
  return { merkezi, yerel };
}

/** Son yılda program bazında en düşük OBP; okul geneli satırlar sayılmaz. */
export function programOBPs(rows: ScoreInput[], year: number | null): ProgramOBPs {
  const result: ProgramOBPs = { anadolu_lisesi: null, meslek: null };
  if (year == null) return result;
  for (const row of rows) {
    if (row.year !== year || !row.program || !isValidScore(row.obp_score)) continue;
    const current = result[row.program];
    if (current == null || row.obp_score < current) result[row.program] = row.obp_score;
  }
  return result;
}

export function valuesBySchool(
  rows: (ScoreInput & { school_id: number })[],
  year: number | null,
  fieldId: number | null = null,
  program: SchoolProgram | null = null,
): Map<number, PlacementValues> {
  const grouped = new Map<number, ScoreInput[]>();
  for (const row of rows) {
    const list = grouped.get(row.school_id) ?? [];
    list.push(row);
    grouped.set(row.school_id, list);
  }
  const result = new Map<number, PlacementValues>();
  grouped.forEach((list, schoolId) => {
    result.set(schoolId, placementValues(list, year, fieldId, program));
  });
  return result;
}

/** Değeri olmayan okul her iki yönde de sona gider; eşitlikte ad belirler. */
export function compareByScore(
  a: { name: string; values: PlacementValues },
  b: { name: string; values: PlacementValues },
  sort: ScoreSort,
): number {
  const key = sort.startsWith("yuzdelik") ? "merkezi" : "yerel";
  const ascending = sort.endsWith("_asc");
  const av = a.values[key];
  const bv = b.values[key];
  if (av != null && bv != null && av !== bv) return ascending ? av - bv : bv - av;
  if (av == null && bv != null) return 1;
  if (bv == null && av != null) return -1;
  return a.name.localeCompare(b.name, "tr");
}

export function parsePlacement(raw: string | undefined): Placement | null {
  return raw === "yerel" || raw === "merkezi" ? raw : null;
}
