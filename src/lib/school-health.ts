// Yönetim panelinin veri sağlığı kuralı: her okul için sabit sırada sekiz kontrol.
// Defter, künye paneli ve okul formu bu tek kuralı kullanır. Saf modül;
// Supabase veya React içermez (tests/school-health.test.mjs).

export type HealthCheckId =
  | "gorsel"
  | "aciklama"
  | "tesis"
  | "dil"
  | "puan"
  | "kontenjan"
  | "alan"
  | "telefon";

export type HealthStatus = "ok" | "missing" | "na";

export type SchoolFormTab = "temel" | "iletisim" | "puanlar" | "tesisler" | "meslekler";

export const HEALTH_CHECKS: readonly {
  id: HealthCheckId;
  short: string;
  label: string;
  tab: SchoolFormTab;
}[] = [
  { id: "gorsel", short: "G", label: "Görsel", tab: "temel" },
  { id: "aciklama", short: "A", label: "Açıklama", tab: "temel" },
  { id: "tesis", short: "T", label: "Tesis", tab: "tesisler" },
  { id: "dil", short: "D", label: "Yabancı dil", tab: "temel" },
  { id: "puan", short: "P", label: "Puan", tab: "puanlar" },
  { id: "kontenjan", short: "K", label: "Kontenjan", tab: "puanlar" },
  { id: "alan", short: "M", label: "Meslek alanı", tab: "meslekler" },
  { id: "telefon", short: "Tel", label: "Telefon", tab: "iletisim" },
];

export const MIN_DESCRIPTION_LENGTH = 80;

export type HealthInput = {
  type: string;
  description: string;
  images: string[];
  languages: string[];
  phone: string | null;
  vocationalFieldCount: number;
  facilityCount: number;
  scoreYears: number[];
  quotaYears: number[];
};

// Veri kümesinin son puan ve kontenjan yılları; tabloda hiç kayıt yoksa null.
export type HealthYears = { scoreYear: number | null; quotaYear: number | null };

export type HealthItem = {
  id: HealthCheckId;
  label: string;
  short: string;
  tab: SchoolFormTab;
  status: HealthStatus;
  message: string | null;
};

export type SchoolHealth = {
  items: HealthItem[];
  missing: number;
  required: number;
  complete: boolean;
};

export function latestYear(years: Iterable<number>): number | null {
  let latest: number | null = null;
  for (const year of years) {
    if (Number.isFinite(year) && (latest === null || year > latest)) latest = year;
  }
  return latest;
}

export function isVocationalType(type: string): boolean {
  return type.toLocaleLowerCase("tr-TR").includes("meslek");
}

type Verdict = { status: HealthStatus; message: string | null };

const ok: Verdict = { status: "ok", message: null };
const na: Verdict = { status: "na", message: null };
const missing = (message: string): Verdict => ({ status: "missing", message });

function judge(id: HealthCheckId, input: HealthInput, years: HealthYears): Verdict {
  switch (id) {
    case "gorsel":
      return input.images.length > 0 ? ok : missing("Görsel yok");
    case "aciklama": {
      const length = input.description.trim().length;
      if (length === 0) return missing("Açıklama yok");
      return length >= MIN_DESCRIPTION_LENGTH
        ? ok
        : missing(`Açıklama kısa (${length}/${MIN_DESCRIPTION_LENGTH})`);
    }
    case "tesis":
      return input.facilityCount > 0 ? ok : missing("Tesis kaydı yok");
    case "dil":
      return input.languages.length > 0 ? ok : missing("Yabancı dil yok");
    case "puan":
      if (years.scoreYear === null) return na;
      return input.scoreYears.includes(years.scoreYear)
        ? ok
        : missing(`${years.scoreYear} puanı yok`);
    case "kontenjan":
      if (years.quotaYear === null) return na;
      return input.quotaYears.includes(years.quotaYear)
        ? ok
        : missing(`${years.quotaYear} kontenjanı yok`);
    case "alan":
      if (!isVocationalType(input.type)) return na;
      return input.vocationalFieldCount > 0 ? ok : missing("Meslek alanı yok");
    case "telefon":
      return (input.phone ?? "").trim().length > 0 ? ok : missing("Telefon yok");
  }
}

export function evaluateSchoolHealth(input: HealthInput, years: HealthYears): SchoolHealth {
  const items = HEALTH_CHECKS.map((check) => ({ ...check, ...judge(check.id, input, years) }));
  const missingCount = items.filter((item) => item.status === "missing").length;
  const required = items.filter((item) => item.status !== "na").length;
  return { items, missing: missingCount, required, complete: missingCount === 0 };
}

export function parseHealthCheckId(raw: string | null | undefined): HealthCheckId | null {
  return HEALTH_CHECKS.find((check) => check.id === raw)?.id ?? null;
}

export function missingTabs(health: SchoolHealth): Set<SchoolFormTab> {
  return new Set(health.items.filter((item) => item.status === "missing").map((item) => item.tab));
}

export function countMissing(list: SchoolHealth[], id: HealthCheckId): number {
  return list.filter((health) =>
    health.items.some((item) => item.id === id && item.status === "missing"),
  ).length;
}
