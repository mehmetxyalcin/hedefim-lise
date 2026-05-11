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
} from "@/app/admin/okullar/toplu-yukle/actions";
import type { UploadSchoolRow, UploadResult } from "@/app/admin/okullar/toplu-yukle/actions";

const MAX_ROWS = 500;

type RowStatus = "new" | "update" | "error";

type ParsedRow = {
  rowIndex: number;
  institution_code: string;
  name: string;
  district: string;
  school_type: string;
  education_type: "normal" | "ikili" | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  errors: string[];
  status: RowStatus;
};

function str(v: unknown): string {
  return String(v ?? "").trim();
}

function parseEducationType(
  value: string,
): { value: "normal" | "ikili" | null; error: string | null } {
  if (!value) return { value: null, error: null };
  const v = value.toLocaleLowerCase("tr-TR");
  if (v === "normal öğretim") return { value: "normal", error: null };
  if (v === "ikili öğretim") return { value: "ikili", error: null };
  return {
    value: null,
    error: "Öğretim Şekli geçersiz. 'Normal Öğretim' veya 'İkili Öğretim' olmalı",
  };
}

function validateRow(raw: Record<string, unknown>, index: number): Omit<ParsedRow, "status"> {
  const institution_code = str(raw["Kurum Kodu"]);
  const name = str(raw["Okul Adı"]);
  const district = str(raw["İlçe"]);
  const school_type = str(raw["Okul Türü"]);
  const eduRaw = str(raw["Öğretim Şekli"]);
  const edu = parseEducationType(eduRaw);

  const errors: string[] = [];
  if (!institution_code) errors.push("Kurum Kodu zorunludur");
  if (!name) errors.push("Okul Adı zorunludur");
  if (!district) errors.push("İlçe zorunludur");
  else if (!DISTRICTS.includes(district)) errors.push(`Geçersiz ilçe: "${district}"`);
  if (!school_type) errors.push("Okul Türü zorunludur");
  else if (!SCHOOL_TYPES.includes(school_type))
    errors.push(`Geçersiz tür: "${school_type}"`);
  if (edu.error) errors.push(edu.error);

  return {
    rowIndex: index + 2,
    institution_code,
    name,
    district,
    school_type,
    education_type: edu.value,
    phone: str(raw["Telefon"]) || null,
    website: str(raw["Website"]) || null,
    address: str(raw["Adres"]) || null,
    errors,
  };
}

// ─── Sub-components ─────────────────────────────────────────────

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
          {i < steps.length - 1 && (
            <div className="mx-4 h-px w-8 bg-slate-200" />
          )}
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

// ─── Main Wizard ────────────────────────────────────────────────

export function BulkUploadWizard() {
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
      const ws = wb.Sheets[wb.SheetNames[0]];

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

      const validated = rawRows.map((row, i) => validateRow(row, i));

      const validCodes = validated
        .filter((r) => r.institution_code)
        .map((r) => r.institution_code);

      let existingSet = new Set<string>();
      try {
        const existing = await checkInstitutionCodes(validCodes);
        existingSet = new Set(existing);
      } catch {
        // institution_code column might not exist yet; treat all as new
      }

      const withStatus: ParsedRow[] = validated.map((r) => ({
        ...r,
        status:
          r.errors.length > 0
            ? "error"
            : existingSet.has(r.institution_code)
              ? "update"
              : "new",
      }));

      setParsedRows(withStatus);
      setStep(2);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Dosya okunamadı.");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
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

      {/* ── ADIM 1: Dosya Yükle ── */}
      {step === 1 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-bold text-slate-900">Dosya Yükle</h2>

          <div className="mb-6 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <span className="text-sm text-slate-600">
              Şablonu indirip doldurun, ardından yükleyin.
            </span>
            <a
              href="/api/admin/okul-sablonu"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              Şablon İndir
            </a>
          </div>

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
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
          >
            <Upload className="mx-auto mb-4 h-12 w-12 text-slate-400" />
            <p className="mb-2 text-base font-semibold text-slate-700">
              Dosyayı buraya sürükleyin veya tıklayın
            </p>
            <p className="text-sm text-slate-400">.xlsx veya .csv • Maks 10 MB • Maks 500 satır</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
              }}
            />
          </div>

          {parseError && (
            <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {parseError}
            </p>
          )}
        </div>
      )}

      {/* ── ADIM 2: Önizleme ── */}
      {step === 2 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-slate-900">Önizleme ve Doğrulama</h2>

          <div className="mb-4 flex flex-wrap gap-2">
            <Pill label="Toplam" count={stats.total} color="slate" />
            <Pill label="Yeni eklenecek" count={stats.new} color="green" />
            <Pill label="Güncellenecek" count={stats.update} color="yellow" />
            {stats.error > 0 && <Pill label="Hatalı" count={stats.error} color="red" />}
          </div>

          <div className="mb-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  {["Durum", "#", "Kurum Kodu", "Okul Adı", "İlçe", "Tür", "Öğretim Şekli", "Telefon", "Website", "Adres"].map(
                    (h) => (
                      <th
                        key={h}
                        className="whitespace-nowrap px-3 py-2 text-xs font-semibold text-slate-600"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {parsedRows.map((row) => (
                  <tr
                    key={row.rowIndex}
                    className={`border-b border-slate-100 ${
                      row.status === "error" ? "bg-rose-50" : ""
                    }`}
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
                    <td className="px-3 py-2 text-slate-600">{row.district || "—"}</td>
                    <td className="max-w-[160px] truncate px-3 py-2 text-slate-600">
                      {row.school_type || "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {row.education_type === "normal"
                        ? "Normal Öğretim"
                        : row.education_type === "ikili"
                          ? "İkili Öğretim"
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
              <p className="mb-2 text-sm font-semibold text-rose-700">
                {stats.error} hatalı satır:
              </p>
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

      {/* ── ADIM 3: Sonuç ── */}
      {step === 3 && uploadResult && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-bold text-slate-900">Yükleme Tamamlandı</h2>

          <div className="mb-6 space-y-3">
            {uploadResult.added > 0 && (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">
                  {uploadResult.added} okul başarıyla eklendi{" "}
                  <span className="font-normal text-emerald-600">(pasif — yayına almak için düzenleyin)</span>
                </span>
              </div>
            )}
            {uploadResult.updated > 0 && (
              <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  {uploadResult.updated} okulun iletişim bilgileri güncellendi
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
