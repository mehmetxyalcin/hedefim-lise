// Tercih listesinin saf mantığı: localStorage biçimi, puan seçimi ve
// sunucudan gelen güncel verinin listeye işlenmesi. React ve tarayıcı
// API'si içermez; hook (hooks/useFavorites.ts) ve testler bunu kullanır.

export type FavoriteScore = {
  year: number;
  percentile: number | null;
  obp_score: number | null;
  lgs_score: number | null;
  vocational_field_name: string | null;
};

export type FavoriteSchool = {
  id: string;
  name: string;
  district: string;
  school_type: string;
  slug: string;
  scores: FavoriteScore[];
};

// Supabase'den okunan güncel okul satırı (tercihlerim yenilemesi)
export type FreshSchoolRow = {
  id: number | string;
  name: string;
  slug: string;
  district: string;
  type: string;
  school_scores:
    | {
        year: number;
        percentile: number | null;
        obp_score: number | null;
        lgs_score: number | null;
        vocational_field: { title: string } | null;
      }[]
    | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNumberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseScore(value: unknown): FavoriteScore | null {
  if (!isRecord(value) || typeof value.year !== "number") return null;
  return {
    year: value.year,
    percentile: toNumberOrNull(value.percentile),
    obp_score: toNumberOrNull(value.obp_score),
    lgs_score: toNumberOrNull(value.lgs_score),
    vocational_field_name:
      typeof value.vocational_field_name === "string"
        ? value.vocational_field_name
        : null,
  };
}

function parseFavorite(value: unknown): FavoriteSchool | null {
  if (!isRecord(value)) return null;
  const id = typeof value.id === "number" ? String(value.id) : value.id;
  if (typeof id !== "string" || !id || typeof value.slug !== "string") {
    return null;
  }
  // Eski kayıtlar tek `latest_score` tutuyordu.
  const rawScores = Array.isArray(value.scores)
    ? value.scores
    : value.latest_score
      ? [value.latest_score]
      : [];
  return {
    id,
    name: typeof value.name === "string" ? value.name : "",
    district: typeof value.district === "string" ? value.district : "",
    school_type: typeof value.school_type === "string" ? value.school_type : "",
    slug: value.slug,
    scores: rawScores
      .map(parseScore)
      .filter((s): s is FavoriteScore => s !== null),
  };
}

/** localStorage metnini okur; bozuk veya tekrarlanan kayıtları eler. */
export function parseFavorites(raw: string | null): FavoriteSchool[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const seen = new Set<string>();
  const list: FavoriteSchool[] = [];
  for (const item of parsed) {
    const favorite = parseFavorite(item);
    if (!favorite || seen.has(favorite.id)) continue;
    seen.add(favorite.id);
    list.push(favorite);
  }
  return list;
}

/** Okulun en son yılına ait tüm puan kayıtları; okul geneli önce. */
export function latestYearScores(scores: FavoriteScore[]): FavoriteScore[] {
  if (scores.length === 0) return [];
  const latest = Math.max(...scores.map((s) => s.year));
  return scores
    .filter((s) => s.year === latest)
    .sort((a, b) => {
      if (a.vocational_field_name === b.vocational_field_name) return 0;
      if (a.vocational_field_name === null) return -1;
      if (b.vocational_field_name === null) return 1;
      return a.vocational_field_name.localeCompare(b.vocational_field_name, "tr");
    });
}

export function favoriteFromFreshRow(row: FreshSchoolRow): FavoriteSchool {
  return {
    id: String(row.id),
    name: row.name,
    district: row.district,
    school_type: row.type,
    slug: row.slug,
    scores: latestYearScores(
      (row.school_scores ?? []).map((s) => ({
        year: s.year,
        percentile: s.percentile,
        obp_score: s.obp_score,
        lgs_score: s.lgs_score,
        vocational_field_name: s.vocational_field?.title ?? null,
      })),
    ),
  };
}

/**
 * Listedeki okulları sunucudan gelen güncel satırlarla değiştirir.
 * Sıra korunur. Yanıtta bulunmayan (pasif ya da silinmiş) okullar
 * silinmez, eklendikleri andaki haliyle kalır ve `missingIds` içinde
 * döner; kullanıcı ne yapacağına kendisi karar verir.
 */
export function mergeFreshFavorites(
  list: FavoriteSchool[],
  rows: FreshSchoolRow[],
): { list: FavoriteSchool[]; missingIds: string[] } {
  const fresh = new Map(rows.map((row) => [String(row.id), favoriteFromFreshRow(row)]));
  const missingIds: string[] = [];
  const merged = list.map((favorite) => {
    const update = fresh.get(favorite.id);
    if (update) return update;
    missingIds.push(favorite.id);
    return favorite;
  });
  return { list: merged, missingIds };
}

export function moveFavorite(
  list: FavoriteSchool[],
  index: number,
  offset: -1 | 1,
): FavoriteSchool[] {
  const target = index + offset;
  if (index < 0 || index >= list.length || target < 0 || target >= list.length) {
    return list;
  }
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
