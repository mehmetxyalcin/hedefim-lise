"use client";

import { adminButton } from "@/components/admin/ui/Button";
import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { excludeInvalidSchools } from "@/lib/import-validation";
import { AlertCircle, ArrowLeft, CheckCircle2, Download, Loader2, XCircle } from "lucide-react";
import { fetchSchoolsByInstitutionCodes, fetchVocationalData, bulkUploadScores } from "@/app/admin/okullar/toplu-yukle/actions";
import type { ScoreRow, ScoreUploadResult } from "@/app/admin/okullar/toplu-yukle/actions";
import { str, normalizeStr, parseScore, parsePercentile } from "@/components/admin/bulk-upload/parsers";
import type { ScoreParsedRow } from "@/components/admin/bulk-upload/parsers";
import { StepIndicator, Pill, UploadDropzone } from "@/components/admin/bulk-upload/shared";
import { parseProgramLabel, PROGRAM_LABELS, PROGRAM_ROW_LABELS } from "@/lib/school-programs";

// ─── ScoreUploadWizard ────────────────────────────────────────────

export function ScoreUploadWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [parsedRows, setParsedRows] = useState<ScoreParsedRow[]>([]);
  const [uploadResult, setUploadResult] = useState<ScoreUploadResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const uploadInFlight = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validRows = excludeInvalidSchools(parsedRows, (r) => !r.found || r.errors.length > 0);
  const validSchoolCount = new Set(validRows.map((r) => r.institution_code)).size;
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
    setUploadError(null);

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

      // Tüm meslek alanlarını çek
      const vocData = await fetchVocationalData();
      const vocFieldMap = new Map(
        vocData.fields.map((f) => [normalizeStr(f.title), f]),
      );

      const rawParsed: Omit<ScoreParsedRow, "school_name" | "found">[] = rawRows.map((row, i) => {
        const institution_code = str(row["Kurum Kodu"]);
        const vocational_field_name = str(row["Meslek Alanı"]);

        const program_label = str(row["Program"]);
        const parsedProgram = parseProgramLabel(program_label);
        const program = parsedProgram ?? null;

        // Meslek alanı çözümle
        let vocational_field_id: number | null = null;
        let vocational_field_found = true;
        if (vocational_field_name) {
          const field = vocFieldMap.get(normalizeStr(vocational_field_name));
          if (field) {
            vocational_field_id = field.id;
          } else {
            vocational_field_found = false;
          }
        }

        const obp_2026 = parseScore(row["OBP 2026"], 100);
        const lgs_2026 = parseScore(row["LGS 2026"], 500);
        const percentile_2026 = parsePercentile(row["Yüzdelik 2026"]);
        const obp_2025 = parseScore(row["OBP 2025"], 100);
        const lgs_2025 = parseScore(row["LGS 2025"], 500);
        const percentile_2025 = parsePercentile(row["Yüzdelik 2025"]);
        const obp_2024 = parseScore(row["OBP 2024"], 100);
        const lgs_2024 = parseScore(row["LGS 2024"], 500);
        const percentile_2024 = parsePercentile(row["Yüzdelik 2024"]);
        const obp_2023 = parseScore(row["OBP 2023"], 100);
        const lgs_2023 = parseScore(row["LGS 2023"], 500);
        const percentile_2023 = parsePercentile(row["Yüzdelik 2023"]);

        const errors: string[] = [];
        if (!institution_code) errors.push("Kurum Kodu zorunludur");
        if (!vocational_field_found) errors.push(`Meslek Alanı bulunamadı: "${vocational_field_name}"`);
        if (parsedProgram === undefined) errors.push(`Program geçersiz: "${program_label}" (Anadolu Lisesi veya Meslek Programı yazın)`);
        if (program && vocational_field_name) errors.push("Program ve Meslek Alanı aynı satırda doldurulamaz");
        if (obp_2026 === null) errors.push("OBP 2026 geçersiz: pozitif sayı olmalı");
        if (lgs_2026 === null) errors.push("LGS 2026 geçersiz: pozitif sayı olmalı");
        if (percentile_2026 === null) errors.push("Yüzdelik 2026 geçersiz: 0-100 arasında olmalı");
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
          [obp_2026, lgs_2026, percentile_2026, obp_2025, lgs_2025, percentile_2025, obp_2024, lgs_2024, percentile_2024, obp_2023, lgs_2023, percentile_2023].every(
            (v) => v === undefined,
          );
        if (allEmpty) errors.push("Tüm puan alanları boş");

        return {
          rowIndex: i + 2,
          institution_code,
          vocational_field_name,
          vocational_field_id,
          vocational_field_found,
          program_label,
          program,
          obp_2026, lgs_2026, percentile_2026,
          obp_2025, lgs_2025, percentile_2025,
          obp_2024, lgs_2024, percentile_2024,
          obp_2023, lgs_2023, percentile_2023,
          errors,
        };
      });

      // Kurum Kodu + meslek alanı/program kombinasyonu tekrarı kontrol et
      const seenKeys = new Set<string>();
      for (const row of rawParsed) {
        const key = `${row.institution_code}::${row.vocational_field_name.toLocaleLowerCase("tr-TR")}::${row.program ?? ""}`;
        if (seenKeys.has(key)) {
          row.errors.push(
            `Tekrar eden kombinasyon: "${row.institution_code}" + "${row.program ? PROGRAM_LABELS[row.program] : row.vocational_field_name || "Okul Geneli"}"`,
          );
        } else {
          seenKeys.add(key);
        }
      }

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
    if (uploadInFlight.current) return;
    uploadInFlight.current = true;
    setUploadError(null);
    const rowsToUpload: ScoreRow[] = validRows.map((row) => {
      const r: ScoreRow = { institution_code: row.institution_code, source_row: row.rowIndex };
      if (row.vocational_field_name) r.vocational_field = row.vocational_field_name;
      if (row.program) r.program = row.program;
      if (typeof row.obp_2026 === "number") r.obp_2026 = row.obp_2026;
      if (typeof row.lgs_2026 === "number") r.lgs_2026 = row.lgs_2026;
      if (typeof row.percentile_2026 === "number") r.percentile_2026 = row.percentile_2026;
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
      try {
        const result = await bulkUploadScores(rowsToUpload);
        setUploadResult(result);
        setStep(3);
      } catch (error) {
        unstable_rethrow(error);
        setUploadError("Yükleme sonucu alınamadı. Bağlantınızı ve oturumunuzu kontrol edin. Yeniden yüklemeden önce okul listesinden hangi kayıtların işlendiğini doğrulayın.");
      } finally {
        uploadInFlight.current = false;
      }
    });
  }

  function ScoreCell({ value }: { value: number | null | undefined }) {
    if (value === undefined) return <span className="text-admin-line-strong">—</span>;
    if (value === null) return <span className="font-bold text-rose-700">!</span>;
    return <span>{value}</span>;
  }

  return (
    <div className="space-y-6">
      <StepIndicator step={step} />
      {uploadError && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {uploadError}
        </div>
      )}

      {/* ── ADIM 1 ── */}
      {step === 1 && (
        <div className="rounded-xl border border-admin-line bg-white p-8 shadow-admin-card">
          <h2 className="mb-6 text-xl font-bold text-admin-ink">Dosya yükle</h2>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-admin-line bg-admin-ground px-4 py-3">
            <span className="text-sm text-admin-body">
              Şablonu indirip{" "}
              <span className="font-semibold text-admin-ink">Puan Bilgileri</span>{" "}
              sekmesini doldurun, ardından yükleyin.
            </span>
            <a
              href="/api/admin/okul-sablonu"
              className={adminButton({ size: "sm" })}
            >
              <Download className="h-4 w-4" />
              Şablonu indir
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
        <div className="rounded-xl border border-admin-line bg-white p-6 shadow-admin-card">
          <h2 className="mb-4 text-xl font-bold text-admin-ink">Önizleme ve Doğrulama</h2>

          <div className="mb-4 flex flex-wrap gap-2">
            <Pill label="Toplam" count={parsedRows.length} color="slate" />
            <Pill label="Güncellenecek okul" count={validSchoolCount} color="yellow" />
            {errorRows.length > 0 && <Pill label="Hatalı" count={errorRows.length} color="red" />}
          </div>

          <div className="mb-4 overflow-x-auto rounded-xl border border-admin-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-admin-line bg-admin-ground text-left">
                  {[
                    "Durum", "Kurum Kodu", "Okul Adı", "Kapsam",
                    "OBP 26", "LGS 26", "%Dilim 26",
                    "OBP 25", "LGS 25", "%Dilim 25",
                    "OBP 24", "LGS 24", "%Dilim 24",
                    "OBP 23", "LGS 23", "%Dilim 23",
                  ].map((h) => (
                    <th key={h} className="whitespace-nowrap px-3 py-2 text-xs font-semibold text-admin-body">
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
                      className={`border-b border-admin-line-soft ${hasError ? "bg-rose-50" : ""}`}
                    >
                      <td className="px-3 py-2 text-center text-base leading-none">
                        <span title={hasError ? row.errors.join("; ") : "Güncellenecek"} className="inline-flex">
                          {hasError ? <XCircle aria-hidden="true" className="h-4 w-4 text-rose-600" /> : <AlertCircle aria-hidden="true" className="h-4 w-4 text-amber-600" />}
                          <span className="sr-only">{hasError ? "Hatalı" : "Güncellenecek"}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-admin-body">{row.institution_code}</td>
                      <td className="max-w-[180px] truncate px-3 py-2 text-admin-body">
                        {row.school_name || <span className="text-rose-700 text-xs">Bulunamadı</span>}
                      </td>
                      <td className="max-w-[160px] truncate px-3 py-2">
                        {row.program ? (
                          <span className="text-admin-body">{PROGRAM_ROW_LABELS[row.program]}</span>
                        ) : row.program_label && !row.vocational_field_name ? (
                          <span className="text-rose-700">{row.program_label} (geçersiz)</span>
                        ) : !row.vocational_field_name ? (
                          <span className="italic text-admin-faint">Okul geneli</span>
                        ) : !row.vocational_field_found ? (
                          <span className="text-rose-700">{row.vocational_field_name} (bulunamadı)</span>
                        ) : (
                          <span className="text-admin-body">{row.vocational_field_name}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center text-admin-body"><ScoreCell value={row.obp_2026} /></td>
                      <td className="px-3 py-2 text-center text-admin-body"><ScoreCell value={row.lgs_2026} /></td>
                      <td className="px-3 py-2 text-center text-admin-body"><ScoreCell value={row.percentile_2026} /></td>
                      <td className="px-3 py-2 text-center text-admin-body"><ScoreCell value={row.obp_2025} /></td>
                      <td className="px-3 py-2 text-center text-admin-body"><ScoreCell value={row.lgs_2025} /></td>
                      <td className="px-3 py-2 text-center text-admin-body"><ScoreCell value={row.percentile_2025} /></td>
                      <td className="px-3 py-2 text-center text-admin-body"><ScoreCell value={row.obp_2024} /></td>
                      <td className="px-3 py-2 text-center text-admin-body"><ScoreCell value={row.lgs_2024} /></td>
                      <td className="px-3 py-2 text-center text-admin-body"><ScoreCell value={row.percentile_2024} /></td>
                      <td className="px-3 py-2 text-center text-admin-body"><ScoreCell value={row.obp_2023} /></td>
                      <td className="px-3 py-2 text-center text-admin-body"><ScoreCell value={row.lgs_2023} /></td>
                      <td className="px-3 py-2 text-center text-admin-body"><ScoreCell value={row.percentile_2023} /></td>
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
                  <li className="text-rose-700">...ve {errorRows.length - 10} satır daha</li>
                )}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => { setStep(1); setParsedRows([]); }}
              className="inline-flex items-center gap-2 rounded-xl border border-admin-line bg-white px-4 py-2.5 text-sm font-semibold text-admin-body hover:bg-admin-ground"
            >
              <ArrowLeft className="h-4 w-4" />
              Geri
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={validRows.length === 0 || isPending}
              className={adminButton({ variant: "primary" })}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Yükle ({validSchoolCount} okul)
            </button>
          </div>
        </div>
      )}

      {/* ── ADIM 3 ── */}
      {step === 3 && uploadResult && (
        <div className="rounded-xl border border-admin-line bg-white p-8 shadow-admin-card">
          <h2 className="mb-6 text-xl font-bold text-admin-ink">Yükleme tamamlandı</h2>

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
              <p className="text-sm text-admin-muted">Güncellenecek kayıt bulunamadı.</p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className={adminButton({ variant: "primary" })}
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
                setUploadError(null);
              }}
              className="inline-flex items-center justify-center rounded-xl border border-admin-line bg-white px-5 py-2.5 text-sm font-semibold text-admin-body hover:bg-admin-ground"
            >
              Yeni yükleme
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
