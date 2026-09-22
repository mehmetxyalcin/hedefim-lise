// Toplu yükleme: satır ayrıştırma, doğrulama ve tip yardımcıları (BulkUploadWizard.tsx'ten taşındı).
import { parseImportNumber } from "@/lib/import-validation";
import { DISTRICTS } from "@/data/districts";
import { SCHOOL_TYPES } from "@/data/schoolTypes";

export const MAX_ROWS = 500;
export const MAX_VOC_ROWS = 2000;

// ─── Shared helpers ──────────────────────────────────────────────

export function str(v: unknown): string {
  return String(v ?? "").trim();
}

export function normalizeStr(s: string): string {
  return s.trim().toLocaleLowerCase("tr-TR");
}

// ─── Basic mode types & helpers ──────────────────────────────────

export type RowStatus = "new" | "update" | "error";

export type ParsedRow = {
  rowIndex: number;
  institution_code: string;
  name: string;
  district: string;
  school_type: string;
  education_type: "normal" | "ikili" | null;
  boarding_type: "yok" | "kiz" | "erkek" | "kiz_erkek" | null | undefined;
  description: string | null;
  sinavli_2026: number | null | undefined;
  sinavsiz_2026: number | null | undefined;
  sinavli_2025: number | null | undefined;
  sinavsiz_2025: number | null | undefined;
  sinavli_2024: number | null | undefined;
  sinavsiz_2024: number | null | undefined;
  phone: string | null;
  website: string | null;
  address: string | null;
  errors: string[];
  status: RowStatus;
};

export type ExtractedRow = {
  rowIndex: number;
  institution_code: string;
  name: string;
  district: string;
  school_type: string;
  education_type: "normal" | "ikili" | null;
  edu_raw: string;
  boarding_type: "yok" | "kiz" | "erkek" | "kiz_erkek" | null | undefined;
  description: string | null;
  sinavli_2026: number | null | undefined;
  sinavsiz_2026: number | null | undefined;
  sinavli_2025: number | null | undefined;
  sinavsiz_2025: number | null | undefined;
  sinavli_2024: number | null | undefined;
  sinavsiz_2024: number | null | undefined;
  phone: string | null;
  website: string | null;
  address: string | null;
};

export function parseQuota(value: unknown): number | null | undefined {
  return parseImportNumber(value, 100000, true);
}

export function parseBoardingType(
  value: unknown,
): "yok" | "kiz" | "erkek" | "kiz_erkek" | null | undefined {
  const s = String(value ?? "").trim();
  if (!s) return undefined;
  const v = s.toLocaleLowerCase("tr-TR");
  if (v === "yok") return "yok";
  if (v === "kız" || v === "kiz") return "kiz";
  if (v === "erkek") return "erkek";
  if (v === "karma" || v === "kız-erkek" || v === "kiz-erkek") return "kiz_erkek";
  return null;
}

export function parseEducationType(value: string): "normal" | "ikili" | null {
  if (!value) return null;
  const v = value.toLocaleLowerCase("tr-TR");
  if (v === "normal öğretim") return "normal";
  if (v === "ikili öğretim") return "ikili";
  return null;
}

export function extractRow(raw: Record<string, unknown>, index: number): ExtractedRow {
  const eduRaw = str(raw["Öğretim Şekli"]);
  return {
    rowIndex: index + 2,
    institution_code: str(raw["Kurum Kodu"]),
    name: str(raw["Okul Adı"]),
    district: str(raw["İlçe"]),
    school_type: str(raw["Okul Türü"]),
    education_type: parseEducationType(eduRaw),
    edu_raw: eduRaw,
    boarding_type: parseBoardingType(raw["Pansiyon"]),
    description: str(raw["Açıklama"]) || null,
    sinavli_2026: parseQuota(raw["Sınavlı 2026"]),
    sinavsiz_2026: parseQuota(raw["Sınavsız 2026"]),
    sinavli_2025: parseQuota(raw["Sınavlı 2025"]),
    sinavsiz_2025: parseQuota(raw["Sınavsız 2025"]),
    sinavli_2024: parseQuota(raw["Sınavlı 2024"]),
    sinavsiz_2024: parseQuota(raw["Sınavsız 2024"]),
    phone: str(raw["Telefon"]) || null,
    website: str(raw["Website"]) || null,
    address: str(raw["Adres"]) || null,
  };
}

export function validateRow(row: ExtractedRow, isExisting: boolean): ParsedRow {
  const errors: string[] = [];

  if (!row.institution_code) {
    errors.push("Kurum Kodu zorunludur");
  } else if (!isExisting) {
    if (!row.name) errors.push("Yeni okul için Okul Adı zorunludur");
    if (!row.district) errors.push("Yeni okul için İlçe zorunludur");
    if (!row.school_type) errors.push("Yeni okul için Okul Türü zorunludur");
  }

  if (row.district && !DISTRICTS.includes(row.district)) {
    errors.push(`Geçersiz ilçe: "${row.district}"`);
  }
  if (row.school_type && !SCHOOL_TYPES.includes(row.school_type)) {
    errors.push(`Geçersiz tür: "${row.school_type}"`);
  }
  if (row.edu_raw && row.education_type === null) {
    errors.push("Öğretim Şekli geçersiz. 'Normal Öğretim' veya 'İkili Öğretim' olmalı");
  }
  if (row.boarding_type === null) {
    errors.push("Pansiyon geçersiz. 'Yok', 'Kız', 'Erkek' veya 'Karma' olmalı");
  }
  if (row.description && row.description.length > 1000) {
    errors.push("Açıklama en fazla 1000 karakter olabilir");
  }
  if (row.sinavli_2026 === null) errors.push("Sınavlı 2026 geçersiz (negatif olmayan tam sayı olmalı)");
  if (row.sinavsiz_2026 === null) errors.push("Sınavsız 2026 geçersiz (negatif olmayan tam sayı olmalı)");
  if (row.sinavli_2025 === null) errors.push("Sınavlı 2025 geçersiz (negatif olmayan tam sayı olmalı)");
  if (row.sinavsiz_2025 === null) errors.push("Sınavsız 2025 geçersiz (negatif olmayan tam sayı olmalı)");
  if (row.sinavli_2024 === null) errors.push("Sınavlı 2024 geçersiz (negatif olmayan tam sayı olmalı)");
  if (row.sinavsiz_2024 === null) errors.push("Sınavsız 2024 geçersiz (negatif olmayan tam sayı olmalı)");

  return {
    rowIndex: row.rowIndex,
    institution_code: row.institution_code,
    name: row.name,
    district: row.district,
    school_type: row.school_type,
    education_type: row.education_type,
    boarding_type: row.boarding_type,
    description: row.description,
    sinavli_2026: row.sinavli_2026,
    sinavsiz_2026: row.sinavsiz_2026,
    sinavli_2025: row.sinavli_2025,
    sinavsiz_2025: row.sinavsiz_2025,
    sinavli_2024: row.sinavli_2024,
    sinavsiz_2024: row.sinavsiz_2024,
    phone: row.phone,
    website: row.website,
    address: row.address,
    errors,
    status: errors.length > 0 ? "error" : isExisting ? "update" : "new",
  };
}

// ─── Vocational mode types ────────────────────────────────────────

export type VocationalRawRow = {
  rowIndex: number;
  institution_code: string;
  vocational_field: string;
  branch: string;
};

export type VocationalValidatedRow = {
  rowIndex: number;
  institution_code: string;
  vocational_field: string;
  branch: string;
  field_id: number | null;
  branch_id: string | null;
  errors: string[];
};

export type SchoolGroup = {
  institution_code: string;
  school_name: string;
  found: boolean;
  rows: VocationalValidatedRow[];
  hasErrors: boolean;
};

// ─── Score mode types & helpers ──────────────────────────────────

export type ScoreParsedRow = {
  rowIndex: number;
  institution_code: string;
  school_name: string;
  found: boolean;
  vocational_field_name: string;
  vocational_field_id: number | null;
  vocational_field_found: boolean;
  obp_2025: number | null | undefined;
  lgs_2025: number | null | undefined;
  percentile_2025: number | null | undefined;
  obp_2024: number | null | undefined;
  lgs_2024: number | null | undefined;
  percentile_2024: number | null | undefined;
  obp_2023: number | null | undefined;
  lgs_2023: number | null | undefined;
  percentile_2023: number | null | undefined;
  errors: string[];
};

export function parseScore(value: unknown, maximum: number): number | null | undefined {
  return parseImportNumber(value, maximum);
}

export function parsePercentile(value: unknown): number | null | undefined {
  return parseImportNumber(value, 100);
}

// ─── Facility mode types & helpers ──────────────────────────────

export type FacilityParsedGroup = {
  institution_code: string;
  school_name: string;
  found: boolean;
  all_names: string[];
  matched: { id: string; name: string }[];
  unmatched: string[];
  errors: string[];
};

export function parseFacilities(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
