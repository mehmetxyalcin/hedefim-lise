"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { excludeInvalidSchools } from "@/lib/import-validation";
import { ArrowLeft, CheckCircle2, Download, Loader2, XCircle } from "lucide-react";
import { fetchSchoolsByInstitutionCodes, fetchVocationalData, bulkUploadScores } from "@/app/admin/okullar/toplu-yukle/actions";
import type { ScoreRow, ScoreUploadResult } from "@/app/admin/okullar/toplu-yukle/actions";
import { str, normalizeStr, parseScore, parsePercentile } from "@/components/admin/bulk-upload/parsers";
import type { ScoreParsedRow } from "@/components/admin/bulk-upload/parsers";
import { StepIndicator, Pill, UploadDropzone } from "@/components/admin/bulk-upload/shared";

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
          vocational_field_name,
          vocational_field_id,
          vocational_field_found,
          obp_2025, lgs_2025, percentile_2025,
          obp_2024, lgs_2024, percentile_2024,
          obp_2023, lgs_2023, percentile_2023,
          errors,
        };
      });

      // Kurum Kodu + meslek alanı kombinasyonu tekrarı kontrol et
      const seenKeys = new Set<string>();
      for (const row of rawParsed) {
        const key = `${row.institution_code}::${row.vocational_field_name.toLocaleLowerCase("tr-TR")}`;
        if (seenKeys.has(key)) {
          row.errors.push(
            `Tekrar eden kombinasyon: "${row.institution_code}" + "${row.vocational_field_name || "Okul Geneli"}"`,
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
    if (value === undefined) return <span className="text-slate-300">—</span>;
    if (value === null) return <span className="font-bold text-rose-500">!</span>;
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
            <Pill label="Güncellenecek okul" count={validSchoolCount} color="yellow" />
            {errorRows.length > 0 && <Pill label="Hatalı" count={errorRows.length} color="red" />}
          </div>

          <div className="mb-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  {[
                    "Durum", "Kurum Kodu", "Okul Adı", "Meslek Alanı",
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
                      <td className="max-w-[160px] truncate px-3 py-2">
                        {!row.vocational_field_name ? (
                          <span className="italic text-slate-400">Okul Geneli</span>
                        ) : !row.vocational_field_found ? (
                          <span className="text-rose-500">🔴 {row.vocational_field_name} (bulunamadı)</span>
                        ) : (
                          <span className="text-slate-700">{row.vocational_field_name}</span>
                        )}
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
              Yükle ({validSchoolCount} okul)
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
                setUploadError(null);
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
