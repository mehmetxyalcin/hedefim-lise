// Okul detay sayfasının saf veri kuralları: puan cetveli (yıl sütunları,
// yerleştirme grupları, kontenjan satırları) ve meslek alanlarının
// sınavlı programlarıyla eşlenmesi. Supabase veya React içermez.

import { PROGRAM_ROW_LABELS, type SchoolProgram } from "./school-programs";
import { isValidScore } from "./school-scores";
import { baseTitle, foldTurkish, isSinavli } from "./vocational-atlas";

/** Cetvel yalnız son üç yılı gösterir; daha eski kayıtlar sayfada yer almaz. */
export const LEDGER_YEARS = 3;

export type LedgerScoreInput = {
  year: number;
  percentile: number | null;
  obpScore: number | null;
  lgsScore: number | null;
  program: SchoolProgram | null;
  vocationalFieldId: number | null;
  vocationalField?: { id: number; name: string } | null;
};

export type LedgerQuotaInput = {
  year: number;
  sinavliCount: number | null;
  sinavsizCount: number | null;
};

export type LedgerMetric = "yuzdelik" | "lgs" | "obp";

/** Değerler `years` dizisiyle aynı sıradadır; kayıt yoksa null. */
export type LedgerRow = {
  key: string;
  label: string;
  values: Partial<Record<LedgerMetric, (number | null)[]>>;
};

export type LedgerGroup = {
  placement: "merkezi" | "yerel";
  metrics: LedgerMetric[];
  rows: LedgerRow[];
};

export type QuotaRow = {
  key: "sinavli" | "sinavsiz";
  values: (number | null)[];
};

export type Ledger = {
  years: number[];
  groups: LedgerGroup[];
  quotas: QuotaRow[];
  /** Kontenjan çubuklarının ortak ölçeği: tablodaki en büyük sayı. */
  quotaMax: number;
};

function isValidLgs(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 && value <= 500;
}

const METRIC_VALUE: Record<LedgerMetric, (row: LedgerScoreInput) => number | null> = {
  yuzdelik: (row) => (isValidScore(row.percentile) ? row.percentile : null),
  lgs: (row) => (isValidLgs(row.lgsScore) ? row.lgsScore : null),
  obp: (row) => (isValidScore(row.obpScore) ? row.obpScore : null),
};

const GROUP_METRICS: Record<LedgerGroup["placement"], LedgerMetric[]> = {
  merkezi: ["yuzdelik", "lgs"],
  yerel: ["obp"],
};

type Scope = { key: string; label: string; rank: number };

function scopeOf(row: LedgerScoreInput): Scope {
  if (row.program) {
    return {
      key: `program:${row.program}`,
      label: PROGRAM_ROW_LABELS[row.program],
      rank: row.program === "anadolu_lisesi" ? 1 : 2,
    };
  }
  if (row.vocationalFieldId != null) {
    const name = row.vocationalField?.name ?? "Meslek alanı";
    return {
      key: `alan:${row.vocationalFieldId}`,
      label: isSinavli(name) ? baseTitle(name) : name,
      rank: 3,
    };
  }
  return { key: "genel", label: "Okul geneli", rank: 0 };
}

export function buildLedger(
  scores: LedgerScoreInput[],
  quotas: LedgerQuotaInput[],
): Ledger {
  const scored = scores.filter((row) =>
    (Object.keys(METRIC_VALUE) as LedgerMetric[]).some((m) => METRIC_VALUE[m](row) != null),
  );
  const counted = quotas.filter((q) => q.sinavliCount != null || q.sinavsizCount != null);
  const present = [...new Set([...scored.map((r) => r.year), ...counted.map((q) => q.year)])];
  // Pencere takvim yılıdır: son kayıtlı yıl ve ondan önceki iki yıl. Arada
  // kaydı olmayan yıl sütun olmaz; pencere dışındaki eski yıl da geri gelmez.
  const latest = Math.max(...present);
  const years = present.filter((year) => year > latest - LEDGER_YEARS).sort((a, b) => a - b);
  const col = new Map(years.map((year, i) => [year, i]));

  const groups: LedgerGroup[] = [];
  for (const placement of ["merkezi", "yerel"] as const) {
    const candidates = GROUP_METRICS[placement];
    const rows = new Map<string, LedgerRow & { rank: number }>();
    for (const score of scored) {
      const i = col.get(score.year);
      if (i == null) continue;
      for (const metric of candidates) {
        const value = METRIC_VALUE[metric](score);
        if (value == null) continue;
        const scope = scopeOf(score);
        let row = rows.get(scope.key);
        if (!row) {
          row = { key: scope.key, label: scope.label, rank: scope.rank, values: {} };
          rows.set(scope.key, row);
        }
        const list = (row.values[metric] ??= years.map(() => null));
        // Aynı yıl ve kapsamda ikinci kayıt varsa ilki geçerli kalır.
        if (list[i] == null) list[i] = value;
      }
    }
    if (rows.size === 0) continue;
    const ordered = [...rows.values()].sort(
      (a, b) => a.rank - b.rank || a.label.localeCompare(b.label, "tr"),
    );
    const metrics = candidates.filter((m) => ordered.some((row) => row.values[m]));
    groups.push({
      placement,
      metrics,
      rows: ordered.map(({ key, label, values }) => ({ key, label, values })),
    });
  }

  const quotaRows: QuotaRow[] = [];
  for (const key of ["sinavli", "sinavsiz"] as const) {
    const values = years.map((year) => {
      const record = counted.find((q) => q.year === year);
      if (!record) return null;
      return key === "sinavli" ? record.sinavliCount : record.sinavsizCount;
    });
    // Hiç yeri olmayan kontenjan türü satır olmaz (ör. yalnız merkezi alan okulun sınavsızı).
    if (values.some((v) => v != null && v > 0)) quotaRows.push({ key, values });
  }
  const quotaMax = Math.max(0, ...quotaRows.flatMap((r) => r.values.map((v) => v ?? 0)));

  return { years, groups, quotas: quotaRows, quotaMax };
}

export const formatPercentile = (v: number) =>
  `%${v.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatPoints = (v: number) =>
  v.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** LGS puanları resmi tablolardaki gibi dört ondalıkla; sütunda virgüller hizalanır. */
export const formatLgs = (v: number) =>
  v.toLocaleString("tr-TR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });

export const METRIC_FORMAT: Record<LedgerMetric, (v: number) => string> = {
  yuzdelik: formatPercentile,
  lgs: formatLgs,
  obp: formatPoints,
};

// ── Meslek alanları ─────────────────────────────────────────────────────

export type SchoolFieldInput = {
  id: number;
  slug: string;
  title: string;
  branches: string[];
};

export type SchoolFieldEntry = {
  id: number;
  slug: string;
  title: string;
  branches: string[];
  /** Aynı taban başlıklı sınavlı program; okul onu da okutuyorsa. */
  sinavli: { slug: string; branches: string[] } | null;
  /** Taban alanı bu okulda olmayan sınavlı program. */
  sinavliOnly: boolean;
};

/**
 * Atlasla aynı kural: "(SINAVLI)" kayıt, okulun aynı taban başlıklı
 * alanının altına iner; taban alan yoksa kendi satırıdır.
 */
export function groupSchoolFields(fields: SchoolFieldInput[]): SchoolFieldEntry[] {
  const bases = fields.filter((f) => !isSinavli(f.title));
  const byKey = new Map<string, SchoolFieldEntry>();
  const entries: SchoolFieldEntry[] = bases.map((f) => {
    const entry: SchoolFieldEntry = { ...f, sinavli: null, sinavliOnly: false };
    byKey.set(foldTurkish(f.title), entry);
    return entry;
  });
  for (const f of fields) {
    if (!isSinavli(f.title)) continue;
    const title = baseTitle(f.title);
    const base = byKey.get(foldTurkish(title));
    if (base && !base.sinavli) base.sinavli = { slug: f.slug, branches: f.branches };
    else entries.push({ ...f, title, sinavli: null, sinavliOnly: true });
  }
  return entries.sort((a, b) => a.title.localeCompare(b.title, "tr"));
}

/** "03247131681" → "0324 713 16 81"; tanınmayan biçim olduğu gibi kalır. */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9)}`;
  }
  return phone.trim();
}

/** "İNGİLİZCE" → "İngilizce": Türkçe büyük/küçük harf kurallarıyla. */
export function turkishTitleCase(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/(^|[\s-])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toLocaleUpperCase("tr-TR"));
}
