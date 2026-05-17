"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  Loader2,
  Upload,
  XCircle,
} from "lucide-react";
import { DISTRICTS } from "@/data/districts";
import { SCHOOL_TYPES } from "@/data/schoolTypes";
import {
  checkInstitutionCodes,
  bulkUploadSchools,
  fetchSchoolsByInstitutionCodes,
  fetchVocationalData,
  bulkUploadVocational,
  bulkUploadScores,
  fetchAllFacilities,
  bulkUploadFacilities,
} from "@/app/admin/okullar/toplu-yukle/actions";
import type {
  UploadSchoolRow,
  UploadResult,
  VocationalRow,
  VocationalUploadResult,
  ScoreRow,
  ScoreUploadResult,
  ParsedFacilityRow,
  FacilityUploadResult,
} from "@/app/admin/okullar/toplu-yukle/actions";

const MAX_ROWS = 500;
const MAX_VOC_ROWS = 2000;

// ─── Shared helpers ──────────────────────────────────────────────

function str(v: unknown): string {
  return String(v ?? "").trim();
}

function normalizeStr(s: string): string {
  return s.trim().toLocaleLowerCase("tr-TR");
}

// ─── Basic mode types & helpers ──────────────────────────────────

type RowStatus = "new" | "update" | "error";

type ParsedRow = {
  rowIndex: number;
  institution_code: string;
  name: string;
  district: string;
  school_type: string;
  education_type: "normal" | "ikili" | null;
  boarding_type: "yok" | "kiz" | "erkek" | "kiz_erkek" | null | undefined;
  description: string | null;
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

type ExtractedRow = {
  rowIndex: number;
  institution_code: string;
  name: string;
  district: string;
  school_type: string;
  education_type: "normal" | "ikili" | null;
  edu_raw: string;
  boarding_type: "yok" | "kiz" | "erkek" | "kiz_erkek" | null | undefined;
  description: string | null;
  sinavli_2025: number | null | undefined;
  sinavsiz_2025: number | null | undefined;
  sinavli_2024: number | null | undefined;
  sinavsiz_2024: number | null | undefined;
  phone: string | null;
  website: string | null;
  address: string | null;
};

function parseQuota(value: unknown): number | null | undefined {
  const s = String(value ?? "").trim();
  if (!s) return undefined;
  const num = parseInt(s, 10);
  if (isNaN(num) || num < 0 || !Number.isInteger(num)) return null;
  return num;
}

function parseBoardingType(
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

function parseEducationType(value: string): "normal" | "ikili" | null {
  if (!value) return null;
  const v = value.toLocaleLowerCase("tr-TR");
  if (v === "normal öğretim") return "normal";
  if (v === "ikili öğretim") return "ikili";
  return null;
}

function extractRow(raw: Record<string, unknown>, index: number): ExtractedRow {
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
    sinavli_2025: parseQuota(raw["Sınavlı 2025"]),
    sinavsiz_2025: parseQuota(raw["Sınavsız 2025"]),
    sinavli_2024: parseQuota(raw["Sınavlı 2024"]),
    sinavsiz_2024: parseQuota(raw["Sınavsız 2024"]),
    phone: str(raw["Telefon"]) || null,
    website: str(raw["Website"]) || null,
    address: str(raw["Adres"]) || null,
  };
}

function validateRow(row: ExtractedRow, isExisting: boolean): ParsedRow {
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

type VocationalRawRow = {
  rowIndex: number;
  institution_code: string;
  vocational_field: string;
  branch: string;
};

type VocationalValidatedRow = {
  rowIndex: number;
  institution_code: string;
  vocational_field: string;
  branch: string;
  field_id: number | null;
  branch_id: number | null;
  errors: string[];
};

type SchoolGroup = {
  institution_code: string;
  school_name: string;
  found: boolean;
  rows: VocationalValidatedRow[];
  hasErrors: boolean;
};

// ─── Score mode types & helpers ──────────────────────────────────

type ScoreParsedRow = {
  rowIndex: number;
  institution_code: string;
  school_name: string;
  found: boolean;
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

function parseScore(value: unknown): number | null | undefined {
  const s = String(value ?? "").trim().replace(",", ".");
  if (!s) return undefined;
  const num = parseFloat(s);
  if (isNaN(num) || num < 0) return null;
  return num;
}

function parsePercentile(value: unknown): number | null | undefined {
  const s = String(value ?? "").trim().replace(",", ".");
  if (!s) return undefined;
  const num = parseFloat(s);
  if (isNaN(num) || num < 0 || num > 100) return null;
  return num;
}

// ─── Facility mode types & helpers ──────────────────────────────

type FacilityParsedGroup = {
  institution_code: string;
  school_name: string;
  found: boolean;
  all_names: string[];
  matched: { id: string; name: string }[];
  unmatched: string[];
  errors: string[];
};

function parseFacilities(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// ─── Shared sub-components ───────────────────────────────────────

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { id: 1 as const, label: "Dosya Yükle" },
    { id: 2 as const, label: "Önizleme" },
    { id: 3 as const, label: "Sonuç" },
  ];
  return (
    <div className="flex items-center">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              s.id < step
                ? "bg-emerald-500 text-white"
                : s.id === step
                  ? "bg-blue-600 text-white"
                  : "bg-slate-200 text-slate-500"
            }`}
          >
            {s.id < step ? "✓" : s.id}
          </div>
          <span
            className={`ml-2 text-sm font-medium ${
              s.id === step ? "text-slate-900" : "text-slate-400"
            }`}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && <div className="mx-4 h-px w-8 bg-slate-200" />}
        </div>
      ))}
    </div>
  );
}

function Pill({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: "slate" | "green" | "yellow" | "red";
}) {
  const colorMap = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
    yellow: "bg-amber-100 text-amber-700",
    red: "bg-rose-100 text-rose-700",
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${colorMap[color]}`}>
      {label}: {count}
    </span>
  );
}

function UploadDropzone({
  onFile,
  parseError,
  isDragging,
  setIsDragging,
  fileInputRef,
  hint,
}: {
  onFile: (file: File) => void;
  parseError: string | null;
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  hint: string;
}) {
  return (
    <>
      <div
        role="button"
        tabIndex={0}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-colors ${
          isDragging
            ? "border-blue-400 bg-blue-50"
            : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) onFile(file);
        }}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
      >
        <Upload className="mx-auto mb-4 h-12 w-12 text-slate-400" />
        <p className="mb-2 text-base font-semibold text-slate-700">
          Dosyayı buraya sürükleyin veya tıklayın
        </p>
        <p className="text-sm text-slate-400">{hint}</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            e.target.value = "";
          }}
        />
      </div>
      {parseError && (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {parseError}
        </p>
      )}
    </>
  );
}

// ─── BasicUploadWizard ────────────────────────────────────────────

function BasicUploadWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [skipErrors, setSkipErrors] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.name.match(/\.(xlsx|csv)$/i)) {
      setParseError("Sadece .xlsx veya .csv dosyaları kabul edilir.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setParseError("Dosya boyutu 10 MB'ı aşıyor.");
      return;
    }
    setParseError(null);

    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(new Uint8Array(buffer), { type: "array" });
      const sheetName = wb.SheetNames.find((n) => n === "Okullar") ?? wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];

      if (!ws) {
        setParseError("Dosyada sayfa bulunamadı.");
        return;
      }

      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
        raw: false,
        defval: "",
      });

      if (rawRows.length === 0) {
        setParseError("Dosyada veri satırı bulunamadı.");
        return;
      }

      if (rawRows.length > MAX_ROWS) {
        setParseError(
          `Dosyada ${rawRows.length} satır var. Maksimum ${MAX_ROWS} satır yüklenebilir.`,
        );
        return;
      }

      const extracted = rawRows.map((row, i) => extractRow(row, i));

      const allCodes = extracted.map((r) => r.institution_code).filter(Boolean);
      let existingSet = new Set<string>();
      try {
        const existing = await checkInstitutionCodes(allCodes);
        existingSet = new Set(existing);
      } catch {
        // institution_code kolonu yoksa hepsini yeni say
      }

      const withStatus: ParsedRow[] = extracted.map((r) =>
        validateRow(r, existingSet.has(r.institution_code)),
      );

      setParsedRows(withStatus);
      setStep(2);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Dosya okunamadı.");
    }
  }

  function handleUpload() {
    const rowsToUpload: UploadSchoolRow[] = parsedRows
      .filter((r) => r.status !== "error")
      .map((r) => ({
        institution_code: r.institution_code,
        name: r.name,
        district: r.district,
        school_type: r.school_type,
        education_type: r.education_type,
        ...(r.boarding_type !== undefined &&
          r.boarding_type !== null && { boarding_type: r.boarding_type }),
        description: r.description,
        ...(r.sinavli_2025 !== undefined &&
          r.sinavli_2025 !== null && { sinavli_2025: r.sinavli_2025 }),
        ...(r.sinavsiz_2025 !== undefined &&
          r.sinavsiz_2025 !== null && { sinavsiz_2025: r.sinavsiz_2025 }),
        ...(r.sinavli_2024 !== undefined &&
          r.sinavli_2024 !== null && { sinavli_2024: r.sinavli_2024 }),
        ...(r.sinavsiz_2024 !== undefined &&
          r.sinavsiz_2024 !== null && { sinavsiz_2024: r.sinavsiz_2024 }),
        phone: r.phone,
        website: r.website,
        address: r.address,
      }));

    startTransition(async () => {
      const result = await bulkUploadSchools(rowsToUpload);
      setUploadResult(result);
      setStep(3);
    });
  }

  const stats = {
    total: parsedRows.length,
    new: parsedRows.filter((r) => r.status === "new").length,
    update: parsedRows.filter((r) => r.status === "update").length,
    error: parsedRows.filter((r) => r.status === "error").length,
  };
  const hasErrors = stats.error > 0;
  const canUpload = !hasErrors || skipErrors;
  const uploadableCount = parsedRows.filter((r) => r.status !== "error").length;

  return (
    <div className="space-y-6">
      <StepIndicator step={step} />

      {/* ── ADIM 1 ── */}
      {step === 1 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-bold text-slate-900">Dosya Yükle</h2>
          <div className="mb-6 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <span className="text-sm text-slate-600">
              Şablonu indirip doldurun, ardından yükleyin.{" "}
              <span className="text-slate-400">(Okullar sekmesi)</span>
            </span>
            <a
              href="/api/admin/okul-sablonu"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              Şablon İndir
            </a>
          </div>
          <UploadDropzone
            onFile={handleFile}
            parseError={parseError}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            fileInputRef={fileInputRef}
            hint=".xlsx veya .csv • Maks 10 MB • Maks 500 satır"
          />
        </div>
      )}

      {/* ── ADIM 2 ── */}
      {step === 2 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-slate-900">Önizleme ve Doğrulama</h2>

          <div className="mb-2 flex flex-wrap gap-2">
            <Pill label="Toplam" count={stats.total} color="slate" />
            <Pill label="Yeni eklenecek" count={stats.new} color="green" />
            <Pill label="Güncellenecek" count={stats.update} color="yellow" />
            {stats.error > 0 && <Pill label="Hatalı" count={stats.error} color="red" />}
          </div>
          {stats.update > 0 && (
            <p className="mb-4 text-xs text-amber-700">
              Güncellenecek okullarda yalnızca dolu alanlar mevcut değerlerin üzerine yazılır; boş
              bırakılan alanlar korunur.
            </p>
          )}

          <div className="mb-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  {[
                    "Durum",
                    "#",
                    "Kurum Kodu",
                    "Okul Adı",
                    "Öğretim Şekli",
                    "Pansiyon",
                    "Açıklama",
                    "Sınavlı 2025",
                    "Sınavsız 2025",
                    "Sınavlı 2024",
                    "Sınavsız 2024",
                    "Telefon",
                    "Website",
                    "Adres",
                  ].map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-3 py-2 text-xs font-semibold text-slate-600"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedRows.map((row) => (
                  <tr
                    key={row.rowIndex}
                    className={`border-b border-slate-100 ${row.status === "error" ? "bg-rose-50" : ""}`}
                  >
                    <td className="px-3 py-2">
                      {row.status === "new" && (
                        <span title="Yeni eklenecek">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </span>
                      )}
                      {row.status === "update" && (
                        <span title="Güncellenecek">
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                        </span>
                      )}
                      {row.status === "error" && (
                        <span title={row.errors.join("; ")}>
                          <XCircle className="h-4 w-4 text-rose-500" />
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-400">{row.rowIndex}</td>
                    <td className="px-3 py-2 font-mono text-slate-700">
                      {row.institution_code || "—"}
                    </td>
                    <td className="max-w-[200px] truncate px-3 py-2 text-slate-700">
                      {row.name || "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {row.education_type === "normal"
                        ? "Normal"
                        : row.education_type === "ikili"
                          ? "İkili"
                          : "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {row.boarding_type === undefined ? (
                        "—"
                      ) : row.boarding_type === "yok" ? (
                        "Pansiyon Yok"
                      ) : row.boarding_type === "kiz" ? (
                        "Kız"
                      ) : row.boarding_type === "erkek" ? (
                        "Erkek"
                      ) : row.boarding_type === "kiz_erkek" ? (
                        "Kız/Erkek"
                      ) : (
                        <span className="text-rose-500">Geçersiz</span>
                      )}
                    </td>
                    <td className="max-w-[180px] truncate px-3 py-2 text-slate-500">
                      {row.description
                        ? row.description.length > 50
                          ? row.description.slice(0, 50) + "..."
                          : row.description
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-center text-slate-600">
                      {row.sinavli_2025 !== undefined && row.sinavli_2025 !== null
                        ? row.sinavli_2025
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-center text-slate-600">
                      {row.sinavsiz_2025 !== undefined && row.sinavsiz_2025 !== null
                        ? row.sinavsiz_2025
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-center text-slate-600">
                      {row.sinavli_2024 !== undefined && row.sinavli_2024 !== null
                        ? row.sinavli_2024
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-center text-slate-600">
                      {row.sinavsiz_2024 !== undefined && row.sinavsiz_2024 !== null
                        ? row.sinavsiz_2024
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-500">{row.phone || "—"}</td>
                    <td className="max-w-[140px] truncate px-3 py-2 text-slate-500">
                      {row.website || "—"}
                    </td>
                    <td className="max-w-[160px] truncate px-3 py-2 text-slate-500">
                      {row.address || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasErrors && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
              <p className="mb-2 text-sm font-semibold text-rose-700">{stats.error} hatalı satır:</p>
              <ul className="space-y-0.5 text-xs text-rose-600">
                {parsedRows
                  .filter((r) => r.status === "error")
                  .slice(0, 10)
                  .map((r) => (
                    <li key={r.rowIndex}>
                      Satır {r.rowIndex}: {r.errors.join(", ")}
                    </li>
                  ))}
                {stats.error > 10 && (
                  <li className="text-rose-400">...ve {stats.error - 10} satır daha</li>
                )}
              </ul>
              <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={skipErrors}
                  onChange={(e) => setSkipErrors(e.target.checked)}
                  className="h-4 w-4"
                />
                Hatalı satırları atla ve devam et ({uploadableCount} satır yüklenecek)
              </label>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setParsedRows([]);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Geri
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={!canUpload || uploadableCount === 0 || isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Yükle ({uploadableCount} satır)
            </button>
          </div>
        </div>
      )}

      {/* ── ADIM 3 ── */}
      {step === 3 && uploadResult && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-bold text-slate-900">Yükleme Tamamlandı</h2>

          <div className="mb-6 space-y-3">
            {uploadResult.added > 0 && (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">
                  {uploadResult.added} okul başarıyla eklendi{" "}
                  <span className="font-normal text-emerald-600">
                    (pasif — yayına almak için düzenleyin)
                  </span>
                </span>
              </div>
            )}
            {uploadResult.updated > 0 && (
              <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  {uploadResult.updated} okulun bilgileri güncellendi
                </span>
              </div>
            )}
            {uploadResult.errors.length > 0 && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4">
                <div className="mb-3 flex items-center gap-3">
                  <XCircle className="h-5 w-5 shrink-0 text-rose-600" />
                  <span className="text-sm font-semibold text-rose-700">
                    {uploadResult.errors.length} satır hata ile karşılaşıldı
                  </span>
                </div>
                <ul className="space-y-1 text-xs text-rose-600">
                  {uploadResult.errors.map((e) => (
                    <li key={`${e.row}-${e.institution_code}`}>
                      Satır {e.row} ({e.institution_code}): {e.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {uploadResult.added === 0 &&
              uploadResult.updated === 0 &&
              uploadResult.errors.length === 0 && (
                <p className="text-sm text-slate-500">Yüklenecek satır bulunamadı.</p>
              )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Okul Listesine Git
            </Link>
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setParsedRows([]);
                setUploadResult(null);
                setSkipErrors(false);
                setParseError(null);
              }}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Yeni Yükleme
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── VocationalUploadWizard ───────────────────────────────────────

function VocationalUploadWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [schoolGroups, setSchoolGroups] = useState<SchoolGroup[]>([]);
  const [skipErrors, setSkipErrors] = useState(false);
  const [uploadResult, setUploadResult] = useState<VocationalUploadResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const errorGroupCount = schoolGroups.filter((g) => g.hasErrors).length;
  const validGroupCount = schoolGroups.filter((g) => g.found && !g.hasErrors).length;
  const totalRows = schoolGroups.reduce((sum, g) => sum + g.rows.length, 0);
  const uploadableGroups = schoolGroups.filter((g) => g.found && (!g.hasErrors || skipErrors));
  const uploadableCount = uploadableGroups.length;

  async function handleFile(file: File) {
    if (!file.name.match(/\.(xlsx|csv)$/i)) {
      setParseError("Sadece .xlsx veya .csv dosyaları kabul edilir.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setParseError("Dosya boyutu 10 MB'ı aşıyor.");
      return;
    }
    setParseError(null);

    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(new Uint8Array(buffer), { type: "array" });

      const sheetName =
        wb.SheetNames.find((n) => n === "Meslek Alanları") ?? wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      if (!ws) {
        setParseError("Dosyada sayfa bulunamadı.");
        return;
      }

      const allRaw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
        raw: false,
        defval: "",
      });

      // NOT: satırlarını ve tamamen boş satırları filtrele
      const rawRows = allRaw.filter((r) => {
        const code = str(r["Kurum Kodu"]);
        return code && !code.startsWith("NOT:");
      });

      if (rawRows.length === 0) {
        setParseError("Dosyada veri satırı bulunamadı.");
        return;
      }
      if (rawRows.length > MAX_VOC_ROWS) {
        setParseError(
          `Dosyada ${rawRows.length} satır var. Maksimum ${MAX_VOC_ROWS} satır yüklenebilir.`,
        );
        return;
      }

      const parsed: VocationalRawRow[] = rawRows.map((row, i) => ({
        rowIndex: i + 2,
        institution_code: str(row["Kurum Kodu"]),
        vocational_field: str(row["Meslek Alanı"]),
        branch: str(row["Dal"]),
      }));

      // DB'den veri çek
      const codes = [...new Set(parsed.map((r) => r.institution_code).filter(Boolean))];
      const [schoolsData, vocData] = await Promise.all([
        fetchSchoolsByInstitutionCodes(codes),
        fetchVocationalData(),
      ]);

      const schoolMap = new Map(schoolsData.map((s) => [s.institution_code, s]));
      const fieldMap = new Map(vocData.fields.map((f) => [normalizeStr(f.title), f]));
      const branchMap = new Map(
        vocData.branches.map((b) => [`${b.vocational_field_id}:${normalizeStr(b.name)}`, b]),
      );

      // Grupla ve doğrula
      const groupMap = new Map<
        string,
        { school: { institution_code: string; name: string; id: number } | null; rows: VocationalValidatedRow[]; hasErrors: boolean }
      >();

      for (const raw of parsed) {
        if (!groupMap.has(raw.institution_code)) {
          const school = schoolMap.get(raw.institution_code) ?? null;
          groupMap.set(raw.institution_code, {
            school,
            rows: [],
            hasErrors: school === null,
          });
        }

        const group = groupMap.get(raw.institution_code)!;
        const errors: string[] = [];

        if (!raw.institution_code) errors.push("Kurum Kodu zorunludur");
        if (!raw.vocational_field) errors.push("Meslek Alanı zorunludur");

        let field_id: number | null = null;
        let branch_id: number | null = null;

        if (raw.vocational_field) {
          const field = fieldMap.get(normalizeStr(raw.vocational_field));
          if (!field) {
            errors.push(`Meslek Alanı bulunamadı: "${raw.vocational_field}"`);
          } else {
            field_id = field.id;
            if (raw.branch) {
              const branch = branchMap.get(`${field.id}:${normalizeStr(raw.branch)}`);
              if (!branch) {
                errors.push(
                  `Dal bulunamadı: "${raw.branch}" (${raw.vocational_field} alanında)`,
                );
              } else {
                branch_id = branch.id;
              }
            }
          }
        }

        if (errors.length > 0) group.hasErrors = true;

        group.rows.push({
          rowIndex: raw.rowIndex,
          institution_code: raw.institution_code,
          vocational_field: raw.vocational_field,
          branch: raw.branch,
          field_id,
          branch_id,
          errors,
        });
      }

      const groups: SchoolGroup[] = Array.from(groupMap.entries()).map(([code, g]) => ({
        institution_code: code,
        school_name: g.school?.name ?? "",
        found: g.school !== null,
        rows: g.rows,
        hasErrors: g.hasErrors,
      }));

      setSchoolGroups(groups);
      setStep(2);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Dosya okunamadı.");
    }
  }

  function handleUpload() {
    const rowsToUpload: VocationalRow[] = [];
    for (const group of uploadableGroups) {
      for (const row of group.rows) {
        if (row.errors.length > 0) continue;
        rowsToUpload.push({
          institution_code: group.institution_code,
          vocational_field: row.vocational_field,
          ...(row.branch ? { branch: row.branch } : {}),
        });
      }
    }

    startTransition(async () => {
      const result = await bulkUploadVocational(rowsToUpload);
      setUploadResult(result);
      setStep(3);
    });
  }

  return (
    <div className="space-y-6">
      <StepIndicator step={step} />

      {/* ── ADIM 1 ── */}
      {step === 1 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-bold text-slate-900">Dosya Yükle</h2>
          <div className="mb-6 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <span className="text-sm text-slate-600">
              Şablonu indirip{" "}
              <span className="font-semibold text-blue-700">Meslek Alanları</span>{" "}
              sekmesini doldurun, ardından yükleyin.
            </span>
            <a
              href="/api/admin/okul-sablonu"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              Şablon İndir
            </a>
          </div>
          <div className="mb-6 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold">Dikkat</p>
            <p className="mt-1 text-amber-700">
              Yükleme, seçilen okulların <span className="font-semibold">tüm mevcut meslek
              alanlarını ve dallarını siler</span> ve dosyadaki verilerle değiştirir.
            </p>
          </div>
          <UploadDropzone
            onFile={handleFile}
            parseError={parseError}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            fileInputRef={fileInputRef}
            hint=".xlsx veya .csv • Maks 10 MB • Maks 2000 satır"
          />
        </div>
      )}

      {/* ── ADIM 2 ── */}
      {step === 2 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-slate-900">Önizleme ve Doğrulama</h2>

          <div className="mb-4 flex flex-wrap gap-2">
            <Pill label="Etkilenecek okul" count={validGroupCount} color="yellow" />
            <Pill label="Toplam satır" count={totalRows} color="slate" />
            {errorGroupCount > 0 && <Pill label="Hatalı grup" count={errorGroupCount} color="red" />}
          </div>

          <div className="mb-4 space-y-3">
            {schoolGroups.map((group) => {
              const isError = !group.found || group.hasErrors;
              return (
                <div
                  key={group.institution_code}
                  className="overflow-hidden rounded-xl border border-slate-200"
                >
                  {/* Grup başlığı */}
                  <div
                    className={`flex items-start gap-3 px-4 py-3 ${
                      isError
                        ? "border-b border-rose-100 bg-rose-50"
                        : "border-b border-amber-100 bg-amber-50"
                    }`}
                  >
                    <span className="mt-0.5 text-base leading-none">
                      {isError ? "🔴" : "🟡"}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {group.institution_code}
                        {group.school_name && ` — ${group.school_name}`}
                      </p>
                      {!group.found && (
                        <p className="text-xs text-rose-600">
                          Bu kurum koduna ait okul bulunamadı
                        </p>
                      )}
                      {group.found && !group.hasErrors && (
                        <p className="text-xs text-amber-700">
                          Mevcut alanlar silinecek,{" "}
                          {group.rows.length} yeni kayıt eklenecek
                        </p>
                      )}
                      {group.found && group.hasErrors && (
                        <p className="text-xs text-rose-600">
                          {group.rows.filter((r) => r.errors.length > 0).length} hatalı satır
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Satırlar */}
                  {group.found && group.rows.length > 0 && (
                    <div className="divide-y divide-slate-100 bg-white">
                      {group.rows.map((row) => (
                        <div
                          key={row.rowIndex}
                          className={`flex items-start gap-2 px-4 py-2 text-sm ${
                            row.errors.length > 0 ? "bg-rose-50" : ""
                          }`}
                        >
                          <span
                            className={`mt-0.5 text-xs font-bold ${
                              row.errors.length > 0 ? "text-rose-400" : "text-emerald-500"
                            }`}
                          >
                            {row.errors.length > 0 ? "✗" : "✓"}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-slate-700">
                              {row.vocational_field || "—"}
                            </span>
                            {row.branch && (
                              <span className="ml-2 text-slate-400">└─ {row.branch}</span>
                            )}
                            {row.errors.length > 0 && (
                              <p className="mt-0.5 text-xs text-rose-500">
                                {row.errors.join("; ")}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {errorGroupCount > 0 && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={skipErrors}
                  onChange={(e) => setSkipErrors(e.target.checked)}
                  className="h-4 w-4"
                />
                Hatalı grupları atla ve devam et ({uploadableCount} okul güncellenecek)
              </label>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setSchoolGroups([]);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Geri
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploadableCount === 0 || (errorGroupCount > 0 && !skipErrors) || isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Yükle ({uploadableCount} okul)
            </button>
          </div>
        </div>
      )}

      {/* ── ADIM 3 ── */}
      {step === 3 && uploadResult && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-bold text-slate-900">Yükleme Tamamlandı</h2>

          <div className="mb-6 space-y-3">
            {uploadResult.updated > 0 && (
              <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  {uploadResult.updated} okulun meslek alanları güncellendi
                </span>
              </div>
            )}
            {uploadResult.errors.length > 0 && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4">
                <div className="mb-3 flex items-center gap-3">
                  <XCircle className="h-5 w-5 shrink-0 text-rose-600" />
                  <span className="text-sm font-semibold text-rose-700">
                    {uploadResult.errors.length} okul için hata oluştu
                  </span>
                </div>
                <ul className="space-y-1 text-xs text-rose-600">
                  {uploadResult.errors.map((e) => (
                    <li key={e.institution_code}>
                      {e.institution_code}: {e.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {uploadResult.updated === 0 && uploadResult.errors.length === 0 && (
              <p className="text-sm text-slate-500">Yüklenecek kayıt bulunamadı.</p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Okul Listesine Git
            </Link>
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setSchoolGroups([]);
                setUploadResult(null);
                setSkipErrors(false);
                setParseError(null);
              }}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Yeni Yükleme
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ScoreUploadWizard ────────────────────────────────────────────

function ScoreUploadWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [parsedRows, setParsedRows] = useState<ScoreParsedRow[]>([]);
  const [uploadResult, setUploadResult] = useState<ScoreUploadResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validRows = parsedRows.filter((r) => r.found && r.errors.length === 0);
  const errorRows = parsedRows.filter((r) => !r.found || r.errors.length > 0);

  async function handleFile(file: File) {
    if (!file.name.match(/\.(xlsx|csv)$/i)) {
      setParseError("Sadece .xlsx veya .csv dosyaları kabul edilir.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setParseError("Dosya boyutu 10 MB'ı aşıyor.");
      return;
    }
    setParseError(null);

    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(new Uint8Array(buffer), { type: "array" });

      const sheetName =
        wb.SheetNames.find((n) => n === "Puan Bilgileri") ?? wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      if (!ws) {
        setParseError("Dosyada sayfa bulunamadı.");
        return;
      }

      const allRaw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
        raw: false,
        defval: "",
      });

      const rawRows = allRaw.filter((r) => {
        const code = str(r["Kurum Kodu"]);
        return code && !code.startsWith("NOT:");
      });

      if (rawRows.length === 0) {
        setParseError("Dosyada veri satırı bulunamadı.");
        return;
      }
      if (rawRows.length > 500) {
        setParseError(
          `Dosyada ${rawRows.length} satır var. Maksimum 500 satır yüklenebilir.`,
        );
        return;
      }

      const rawParsed: Omit<ScoreParsedRow, "school_name" | "found">[] = rawRows.map((row, i) => {
        const institution_code = str(row["Kurum Kodu"]);
        const obp_2025 = parseScore(row["OBP 2025"]);
        const lgs_2025 = parseScore(row["LGS 2025"]);
        const percentile_2025 = parsePercentile(row["Yüzdelik 2025"]);
        const obp_2024 = parseScore(row["OBP 2024"]);
        const lgs_2024 = parseScore(row["LGS 2024"]);
        const percentile_2024 = parsePercentile(row["Yüzdelik 2024"]);
        const obp_2023 = parseScore(row["OBP 2023"]);
        const lgs_2023 = parseScore(row["LGS 2023"]);
        const percentile_2023 = parsePercentile(row["Yüzdelik 2023"]);

        const errors: string[] = [];
        if (!institution_code) errors.push("Kurum Kodu zorunludur");
        if (obp_2025 === null) errors.push("OBP 2025 geçersiz: pozitif sayı olmalı");
        if (lgs_2025 === null) errors.push("LGS 2025 geçersiz: pozitif sayı olmalı");
        if (percentile_2025 === null) errors.push("Yüzdelik 2025 geçersiz: 0-100 arasında olmalı");
        if (obp_2024 === null) errors.push("OBP 2024 geçersiz: pozitif sayı olmalı");
        if (lgs_2024 === null) errors.push("LGS 2024 geçersiz: pozitif sayı olmalı");
        if (percentile_2024 === null) errors.push("Yüzdelik 2024 geçersiz: 0-100 arasında olmalı");
        if (obp_2023 === null) errors.push("OBP 2023 geçersiz: pozitif sayı olmalı");
        if (lgs_2023 === null) errors.push("LGS 2023 geçersiz: pozitif sayı olmalı");
        if (percentile_2023 === null) errors.push("Yüzdelik 2023 geçersiz: 0-100 arasında olmalı");

        const allEmpty =
          institution_code &&
          [obp_2025, lgs_2025, percentile_2025, obp_2024, lgs_2024, percentile_2024, obp_2023, lgs_2023, percentile_2023].every(
            (v) => v === undefined,
          );
        if (allEmpty) errors.push("Tüm puan alanları boş");

        return {
          rowIndex: i + 2,
          institution_code,
          obp_2025, lgs_2025, percentile_2025,
          obp_2024, lgs_2024, percentile_2024,
          obp_2023, lgs_2023, percentile_2023,
          errors,
        };
      });

      const codes = [...new Set(rawParsed.map((r) => r.institution_code).filter(Boolean))];
      const schoolsData = await fetchSchoolsByInstitutionCodes(codes);
      const schoolMap = new Map(schoolsData.map((s) => [s.institution_code, s]));

      const withNames: ScoreParsedRow[] = rawParsed.map((row) => {
        const school = schoolMap.get(row.institution_code);
        const found = Boolean(school);
        const errors = [...row.errors];
        if (!found && row.institution_code) errors.push("Okul bulunamadı");
        return { ...row, school_name: school?.name ?? "", found, errors };
      });

      setParsedRows(withNames);
      setStep(2);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Dosya okunamadı.");
    }
  }

  function handleUpload() {
    const rowsToUpload: ScoreRow[] = validRows.map((row) => {
      const r: ScoreRow = { institution_code: row.institution_code };
      if (typeof row.obp_2025 === "number") r.obp_2025 = row.obp_2025;
      if (typeof row.lgs_2025 === "number") r.lgs_2025 = row.lgs_2025;
      if (typeof row.percentile_2025 === "number") r.percentile_2025 = row.percentile_2025;
      if (typeof row.obp_2024 === "number") r.obp_2024 = row.obp_2024;
      if (typeof row.lgs_2024 === "number") r.lgs_2024 = row.lgs_2024;
      if (typeof row.percentile_2024 === "number") r.percentile_2024 = row.percentile_2024;
      if (typeof row.obp_2023 === "number") r.obp_2023 = row.obp_2023;
      if (typeof row.lgs_2023 === "number") r.lgs_2023 = row.lgs_2023;
      if (typeof row.percentile_2023 === "number") r.percentile_2023 = row.percentile_2023;
      return r;
    });

    startTransition(async () => {
      const result = await bulkUploadScores(rowsToUpload);
      setUploadResult(result);
      setStep(3);
    });
  }

  function ScoreCell({ value }: { value: number | null | undefined }) {
    if (value === undefined) return <span className="text-slate-300">—</span>;
    if (value === null) return <span className="font-bold text-rose-500">!</span>;
    return <span>{value}</span>;
  }

  return (
    <div className="space-y-6">
      <StepIndicator step={step} />

      {/* ── ADIM 1 ── */}
      {step === 1 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-bold text-slate-900">Dosya Yükle</h2>
          <div className="mb-6 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <span className="text-sm text-slate-600">
              Şablonu indirip{" "}
              <span className="font-semibold text-blue-700">Puan Bilgileri</span>{" "}
              sekmesini doldurun, ardından yükleyin.
            </span>
            <a
              href="/api/admin/okul-sablonu"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              Şablon İndir
            </a>
          </div>
          <UploadDropzone
            onFile={handleFile}
            parseError={parseError}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            fileInputRef={fileInputRef}
            hint=".xlsx veya .csv • Maks 10 MB • Maks 500 satır"
          />
        </div>
      )}

      {/* ── ADIM 2 ── */}
      {step === 2 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-slate-900">Önizleme ve Doğrulama</h2>

          <div className="mb-4 flex flex-wrap gap-2">
            <Pill label="Toplam" count={parsedRows.length} color="slate" />
            <Pill label="Güncellenecek" count={validRows.length} color="yellow" />
            {errorRows.length > 0 && <Pill label="Hatalı" count={errorRows.length} color="red" />}
          </div>

          <div className="mb-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  {[
                    "Durum", "Kurum Kodu", "Okul Adı",
                    "OBP 25", "LGS 25", "%Dilim 25",
                    "OBP 24", "LGS 24", "%Dilim 24",
                    "OBP 23", "LGS 23", "%Dilim 23",
                  ].map((h) => (
                    <th key={h} className="whitespace-nowrap px-3 py-2 text-xs font-semibold text-slate-600">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedRows.map((row) => {
                  const hasError = !row.found || row.errors.length > 0;
                  return (
                    <tr
                      key={row.rowIndex}
                      className={`border-b border-slate-100 ${hasError ? "bg-rose-50" : ""}`}
                    >
                      <td className="px-3 py-2 text-center text-base leading-none">
                        <span title={hasError ? row.errors.join("; ") : "Güncellenecek"}>
                          {hasError ? "🔴" : "🟡"}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-700">{row.institution_code}</td>
                      <td className="max-w-[180px] truncate px-3 py-2 text-slate-700">
                        {row.school_name || <span className="text-rose-500 text-xs">Bulunamadı</span>}
                      </td>
                      <td className="px-3 py-2 text-center text-slate-600"><ScoreCell value={row.obp_2025} /></td>
                      <td className="px-3 py-2 text-center text-slate-600"><ScoreCell value={row.lgs_2025} /></td>
                      <td className="px-3 py-2 text-center text-slate-600"><ScoreCell value={row.percentile_2025} /></td>
                      <td className="px-3 py-2 text-center text-slate-600"><ScoreCell value={row.obp_2024} /></td>
                      <td className="px-3 py-2 text-center text-slate-600"><ScoreCell value={row.lgs_2024} /></td>
                      <td className="px-3 py-2 text-center text-slate-600"><ScoreCell value={row.percentile_2024} /></td>
                      <td className="px-3 py-2 text-center text-slate-600"><ScoreCell value={row.obp_2023} /></td>
                      <td className="px-3 py-2 text-center text-slate-600"><ScoreCell value={row.lgs_2023} /></td>
                      <td className="px-3 py-2 text-center text-slate-600"><ScoreCell value={row.percentile_2023} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {errorRows.length > 0 && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
              <p className="mb-2 text-sm font-semibold text-rose-700">{errorRows.length} hatalı satır:</p>
              <ul className="space-y-0.5 text-xs text-rose-600">
                {errorRows.slice(0, 10).map((r) => (
                  <li key={r.rowIndex}>
                    Satır {r.rowIndex} ({r.institution_code}): {r.errors.join(", ")}
                  </li>
                ))}
                {errorRows.length > 10 && (
                  <li className="text-rose-400">...ve {errorRows.length - 10} satır daha</li>
                )}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => { setStep(1); setParsedRows([]); }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Geri
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={validRows.length === 0 || isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Yükle ({validRows.length} okul)
            </button>
          </div>
        </div>
      )}

      {/* ── ADIM 3 ── */}
      {step === 3 && uploadResult && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-bold text-slate-900">Yükleme Tamamlandı</h2>

          <div className="mb-6 space-y-3">
            {uploadResult.updated > 0 && (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">
                  {uploadResult.updated} okulun puan bilgileri güncellendi
                </span>
              </div>
            )}
            {uploadResult.errors.length > 0 && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4">
                <div className="mb-3 flex items-center gap-3">
                  <XCircle className="h-5 w-5 shrink-0 text-rose-600" />
                  <span className="text-sm font-semibold text-rose-700">
                    {uploadResult.errors.length} satır hata ile karşılaşıldı
                  </span>
                </div>
                <ul className="space-y-1 text-xs text-rose-600">
                  {uploadResult.errors.map((e) => (
                    <li key={e.institution_code}>
                      {e.institution_code}: {e.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {uploadResult.updated === 0 && uploadResult.errors.length === 0 && (
              <p className="text-sm text-slate-500">Güncellenecek kayıt bulunamadı.</p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Okul Listesine Git
            </Link>
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setParsedRows([]);
                setUploadResult(null);
                setParseError(null);
              }}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Yeni Yükleme
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FacilityUploadWizard ─────────────────────────────────────────

function FacilityUploadWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [groups, setGroups] = useState<FacilityParsedGroup[]>([]);
  const [uploadResult, setUploadResult] = useState<FacilityUploadResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const errorGroups = groups.filter((g) => !g.found || g.errors.length > 0);
  const validGroups = groups.filter((g) => g.found && g.errors.length === 0);
  const totalUnmatched = validGroups.reduce((s, g) => s + g.unmatched.length, 0);

  async function handleFile(file: File) {
    if (!file.name.match(/\.(xlsx|csv)$/i)) {
      setParseError("Sadece .xlsx veya .csv dosyaları kabul edilir.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setParseError("Dosya boyutu 10 MB'ı aşıyor.");
      return;
    }
    setParseError(null);

    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(new Uint8Array(buffer), { type: "array" });

      const sheetName = wb.SheetNames.find((n) => n === "Tesisler") ?? wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      if (!ws) {
        setParseError("Dosyada sayfa bulunamadı.");
        return;
      }

      const allRaw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
        raw: false,
        defval: "",
      });

      const rawRows = allRaw.filter((r) => {
        const code = str(r["Kurum Kodu"]);
        return code && !code.startsWith("NOT:");
      });

      if (rawRows.length === 0) {
        setParseError("Dosyada veri satırı bulunamadı.");
        return;
      }
      if (rawRows.length > 500) {
        setParseError(`Dosyada ${rawRows.length} satır var. Maksimum 500 satır yüklenebilir.`);
        return;
      }

      const codes = [
        ...new Set(rawRows.map((r) => str(r["Kurum Kodu"])).filter(Boolean)),
      ];
      const [schoolsData, allFacilities] = await Promise.all([
        fetchSchoolsByInstitutionCodes(codes),
        fetchAllFacilities(),
      ]);

      const schoolMap = new Map(schoolsData.map((s) => [s.institution_code, s]));
      const facilityMap = new Map(allFacilities.map((f) => [normalizeStr(f.name), f]));

      const parsedGroups: FacilityParsedGroup[] = rawRows.map((row) => {
        const institution_code = str(row["Kurum Kodu"]);
        const facilitiesRaw = str(row["Tesisler"]);
        const all_names = parseFacilities(facilitiesRaw);
        const school = schoolMap.get(institution_code);
        const found = Boolean(school);
        const errors: string[] = [];
        if (!found && institution_code) errors.push("Okul bulunamadı");

        const matched: { id: string; name: string }[] = [];
        const unmatched: string[] = [];
        for (const name of all_names) {
          const fac = facilityMap.get(normalizeStr(name));
          if (fac) {
            matched.push(fac);
          } else {
            unmatched.push(name);
          }
        }

        return {
          institution_code,
          school_name: school?.name ?? "",
          found,
          all_names,
          matched,
          unmatched,
          errors,
        };
      });

      setGroups(parsedGroups);
      setStep(2);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Dosya okunamadı.");
    }
  }

  function handleUpload() {
    const rowsToUpload: ParsedFacilityRow[] = validGroups.map((g) => ({
      institution_code: g.institution_code,
      facility_names: g.all_names,
    }));

    startTransition(async () => {
      const result = await bulkUploadFacilities(rowsToUpload);
      setUploadResult(result);
      setStep(3);
    });
  }

  return (
    <div className="space-y-6">
      <StepIndicator step={step} />

      {/* ── ADIM 1 ── */}
      {step === 1 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-bold text-slate-900">Dosya Yükle</h2>
          <div className="mb-6 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <span className="text-sm text-slate-600">
              Şablonu indirip{" "}
              <span className="font-semibold text-blue-700">Tesisler</span>{" "}
              sekmesini doldurun, ardından yükleyin.
            </span>
            <a
              href="/api/admin/okul-sablonu"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              Şablon İndir
            </a>
          </div>
          <div className="mb-6 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold">Dikkat</p>
            <p className="mt-1 text-amber-700">
              Yükleme, seçilen okulların{" "}
              <span className="font-semibold">tüm mevcut tesislerini siler</span> ve dosyadaki
              verilerle değiştirir.
            </p>
          </div>
          <UploadDropzone
            onFile={handleFile}
            parseError={parseError}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            fileInputRef={fileInputRef}
            hint=".xlsx veya .csv • Maks 10 MB • Maks 500 satır"
          />
        </div>
      )}

      {/* ── ADIM 2 ── */}
      {step === 2 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-slate-900">Önizleme ve Doğrulama</h2>

          <div className="mb-4 flex flex-wrap gap-2">
            <Pill label="Güncellenecek okul" count={validGroups.length} color="yellow" />
            {totalUnmatched > 0 && (
              <Pill label="Eşleşmeyen tesis" count={totalUnmatched} color="yellow" />
            )}
            {errorGroups.length > 0 && (
              <Pill label="Hatalı" count={errorGroups.length} color="red" />
            )}
          </div>

          <div className="mb-4 space-y-3">
            {groups.map((group) => {
              const isError = !group.found || group.errors.length > 0;
              const hasWarning = group.found && group.unmatched.length > 0;
              return (
                <div
                  key={group.institution_code}
                  className="overflow-hidden rounded-xl border border-slate-200"
                >
                  <div
                    className={`flex items-start gap-3 px-4 py-3 ${
                      isError
                        ? "border-b border-rose-100 bg-rose-50"
                        : hasWarning
                          ? "border-b border-amber-100 bg-amber-50"
                          : "border-b border-emerald-100 bg-emerald-50"
                    }`}
                  >
                    <span className="mt-0.5 text-base leading-none">
                      {isError ? "🔴" : hasWarning ? "🟡" : "🟢"}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {group.institution_code}
                        {group.school_name && ` — ${group.school_name}`}
                      </p>
                      {!group.found && (
                        <p className="text-xs text-rose-600">
                          Bu kurum koduna ait okul bulunamadı
                        </p>
                      )}
                      {group.found && (
                        <p
                          className={`text-xs ${hasWarning ? "text-amber-700" : "text-emerald-700"}`}
                        >
                          {group.matched.length} tesis eşleşti
                          {group.unmatched.length > 0 &&
                            `, ${group.unmatched.length} tesis bulunamadı`}
                        </p>
                      )}
                    </div>
                  </div>

                  {group.found && (group.matched.length > 0 || group.unmatched.length > 0) && (
                    <div className="divide-y divide-slate-100 bg-white">
                      {group.matched.map((fac) => (
                        <div key={fac.id} className="flex items-center gap-2 px-4 py-2 text-sm">
                          <span className="text-xs font-bold text-emerald-500">✓</span>
                          <span className="text-slate-700">{fac.name}</span>
                        </div>
                      ))}
                      {group.unmatched.map((name) => (
                        <div
                          key={name}
                          className="flex items-center gap-2 bg-amber-50 px-4 py-2 text-sm"
                        >
                          <span className="text-xs font-bold text-amber-500">⚠</span>
                          <span className="text-amber-700">{name}</span>
                          <span className="text-xs text-amber-400">(sistemde bulunamadı, atlanacak)</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {errorGroups.length > 0 && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <p className="font-semibold">{errorGroups.length} hatalı satır atlanacak:</p>
              <ul className="mt-1 space-y-0.5 text-xs text-rose-600">
                {errorGroups.slice(0, 5).map((g) => (
                  <li key={g.institution_code}>
                    {g.institution_code}: {g.errors.join(", ")}
                  </li>
                ))}
                {errorGroups.length > 5 && (
                  <li className="text-rose-400">...ve {errorGroups.length - 5} satır daha</li>
                )}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setGroups([]);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Geri
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={validGroups.length === 0 || isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Yükle ({validGroups.length} okul)
            </button>
          </div>
        </div>
      )}

      {/* ── ADIM 3 ── */}
      {step === 3 && uploadResult && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-bold text-slate-900">Yükleme Tamamlandı</h2>

          <div className="mb-6 space-y-3">
            {uploadResult.updated > 0 && (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">
                  {uploadResult.updated} okulun tesis bilgileri güncellendi
                </span>
              </div>
            )}
            {uploadResult.notFound.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
                <div className="mb-2 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-700">
                    {uploadResult.notFound.length} tesis sistemde bulunamadı ve atlandı
                  </span>
                </div>
                <ul className="space-y-1 text-xs text-amber-600">
                  {uploadResult.notFound.slice(0, 10).map((n) => (
                    <li key={`${n.institution_code}-${n.facility_name}`}>
                      {n.school_name} ({n.institution_code}): &quot;{n.facility_name}&quot;
                    </li>
                  ))}
                  {uploadResult.notFound.length > 10 && (
                    <li className="text-amber-400">
                      ...ve {uploadResult.notFound.length - 10} tesis daha
                    </li>
                  )}
                </ul>
              </div>
            )}
            {uploadResult.errors.length > 0 && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4">
                <div className="mb-3 flex items-center gap-3">
                  <XCircle className="h-5 w-5 shrink-0 text-rose-600" />
                  <span className="text-sm font-semibold text-rose-700">
                    {uploadResult.errors.length} okul için hata oluştu
                  </span>
                </div>
                <ul className="space-y-1 text-xs text-rose-600">
                  {uploadResult.errors.map((e) => (
                    <li key={e.institution_code}>
                      {e.institution_code}: {e.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {uploadResult.updated === 0 && uploadResult.errors.length === 0 && (
              <p className="text-sm text-slate-500">Güncellenecek kayıt bulunamadı.</p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Okul Listesine Git
            </Link>
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setGroups([]);
                setUploadResult(null);
                setParseError(null);
              }}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Yeni Yükleme
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Root component (mod seçici) ─────────────────────────────────

export function BulkUploadWizard() {
  const [mode, setMode] = useState<"basic" | "vocational" | "scores" | "facilities">("basic");

  const tabs = [
    { key: "basic" as const, label: "Temel Bilgiler" },
    { key: "vocational" as const, label: "Meslek Alanları ve Dallar" },
    { key: "scores" as const, label: "Puan Bilgileri" },
    { key: "facilities" as const, label: "Tesisler" },
  ];

  return (
    <div className="space-y-6">
      {/* Mod seçici */}
      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setMode(tab.key)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              mode === tab.key
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-white hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === "basic" && <BasicUploadWizard />}
      {mode === "vocational" && <VocationalUploadWizard />}
      {mode === "scores" && <ScoreUploadWizard />}
      {mode === "facilities" && <FacilityUploadWizard />}
    </div>
  );
}
