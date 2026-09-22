// Yönetim defterinin saf mantığı: URL filtreleri, arama, sıralama ve tarih
// biçimleri. SchoolLedger (istemci) ve testler bunu kullanır.
import { buildTurkishNameRegex } from "@/lib/turkishSearch";
import {
  parseHealthCheckId,
  type HealthCheckId,
  type SchoolHealth,
} from "@/lib/school-health";

export type LedgerRow = {
  id: number;
  name: string;
  slug: string;
  district: string;
  type: string;
  isActive: boolean;
  updatedAt: string | null;
  createdAt: string | null;
  health: SchoolHealth;
};

export type LedgerStatus = "aktif" | "pasif";
export type LedgerMissing = HealthCheckId | "herhangi";
export type LedgerSort = "ad" | "ad-ters" | "guncel" | "yeni" | "ilce" | "tur" | "eksik";

export const LEDGER_SORT_LABELS: Record<LedgerSort, string> = {
  ad: "Okul adı (A-Z)",
  "ad-ters": "Okul adı (Z-A)",
  guncel: "Son güncellenen",
  yeni: "Son eklenen",
  ilce: "İlçe",
  tur: "Tür",
  eksik: "En çok eksik",
};

export type LedgerFilters = {
  ara: string;
  ilce: string | null;
  tur: string | null;
  durum: LedgerStatus | null;
  eksik: LedgerMissing | null;
  sirala: LedgerSort;
};

export const DEFAULT_LEDGER_FILTERS: LedgerFilters = {
  ara: "",
  ilce: null,
  tur: null,
  durum: null,
  eksik: null,
  sirala: "ad",
};

type ParamSource = { get(name: string): string | null };

export function parseLedgerFilters(params: ParamSource): LedgerFilters {
  const text = (key: string) => (params.get(key) ?? "").trim();
  const durum = text("durum");
  const eksik = text("eksik");
  const sirala = text("sirala");

  return {
    ara: text("ara"),
    ilce: text("ilce") || null,
    tur: text("tur") || null,
    durum: durum === "aktif" || durum === "pasif" ? durum : null,
    eksik: eksik === "herhangi" ? "herhangi" : parseHealthCheckId(eksik),
    sirala: Object.hasOwn(LEDGER_SORT_LABELS, sirala) ? (sirala as LedgerSort) : "ad",
  };
}

export function ledgerSearch(
  filters: LedgerFilters,
  extra: Record<string, string | null | undefined> = {},
): string {
  const params = new URLSearchParams();
  if (filters.ara) params.set("ara", filters.ara);
  if (filters.ilce) params.set("ilce", filters.ilce);
  if (filters.tur) params.set("tur", filters.tur);
  if (filters.durum) params.set("durum", filters.durum);
  if (filters.eksik) params.set("eksik", filters.eksik);
  if (filters.sirala !== "ad") params.set("sirala", filters.sirala);
  for (const [key, value] of Object.entries(extra)) {
    if (value) params.set(key, value);
  }
  const search = params.toString();
  return search ? `?${search}` : "";
}

export function countActiveFilters(filters: LedgerFilters): number {
  return [filters.ara, filters.ilce, filters.tur, filters.durum, filters.eksik].filter(Boolean).length;
}

const compareText = (first: string, second: string) =>
  first.localeCompare(second, "tr", { sensitivity: "base" });

function timeOf(value: string | null): number {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function matchesMissing(row: LedgerRow, missing: LedgerMissing | null): boolean {
  if (!missing) return true;
  if (missing === "herhangi") return !row.health.complete;
  return row.health.items.some((item) => item.id === missing && item.status === "missing");
}

export function applyLedgerFilters(rows: LedgerRow[], filters: LedgerFilters): LedgerRow[] {
  const pattern = filters.ara ? new RegExp(buildTurkishNameRegex(filters.ara), "i") : null;

  return rows
    .filter((row) => {
      if (pattern && !pattern.test(`${row.name} ${row.district} ${row.type} ${row.slug}`)) return false;
      if (filters.ilce && row.district !== filters.ilce) return false;
      if (filters.tur && row.type !== filters.tur) return false;
      if (filters.durum === "aktif" && !row.isActive) return false;
      if (filters.durum === "pasif" && row.isActive) return false;
      return matchesMissing(row, filters.eksik);
    })
    .sort((first, second) => {
      const byName = compareText(first.name, second.name);
      switch (filters.sirala) {
        case "ad-ters":
          return -byName;
        case "guncel":
          return timeOf(second.updatedAt) - timeOf(first.updatedAt) || byName;
        case "yeni":
          return timeOf(second.createdAt) - timeOf(first.createdAt) || byName;
        case "ilce":
          return compareText(first.district, second.district) || byName;
        case "tur":
          return compareText(first.type, second.type) || byName;
        case "eksik":
          return second.health.missing - first.health.missing || byName;
        default:
          return byName;
      }
    });
}

const TIME_ZONE = "Europe/Istanbul";
const DAY = 86_400_000;
const dayKeyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// İstanbul takvim gününün UTC gece yarısı; gün farkını saat diliminden bağımsız yapar.
function dayKey(date: Date): number {
  return Date.parse(`${dayKeyFormat.format(date)}T00:00:00Z`);
}

export function formatRelativeDate(value: string | null, now: Date): string {
  const date = parseDate(value);
  if (!date) return "—";
  const days = Math.round((dayKey(now) - dayKey(date)) / DAY);
  if (days <= 0) return "bugün";
  if (days === 1) return "dün";
  if (days < 7) return `${days} gün önce`;
  const sameYear = dayKeyFormat.format(now).slice(0, 4) === dayKeyFormat.format(date).slice(0, 4);
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(date);
}

export function formatFullDate(value: string | null): string {
  const date = parseDate(value);
  if (!date) return "Tarih yok";
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
