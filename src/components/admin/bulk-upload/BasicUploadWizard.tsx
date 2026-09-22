"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { excludeInvalidSchools } from "@/lib/import-validation";
import { AlertCircle, ArrowLeft, CheckCircle2, Download, Loader2, XCircle } from "lucide-react";
import { checkInstitutionCodes, bulkUploadSchools } from "@/app/admin/okullar/toplu-yukle/actions";
import type { UploadSchoolRow, UploadResult } from "@/app/admin/okullar/toplu-yukle/actions";
import { MAX_ROWS, extractRow, validateRow } from "@/components/admin/bulk-upload/parsers";
import type { ParsedRow } from "@/components/admin/bulk-upload/parsers";
import { StepIndicator, Pill, UploadDropzone } from "@/components/admin/bulk-upload/shared";

// ─── BasicUploadWizard ────────────────────────────────────────────

export function BasicUploadWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [skipErrors, setSkipErrors] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const uploadInFlight = useRef(false);
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
    setUploadError(null);

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
    if (uploadInFlight.current) return;
    uploadInFlight.current = true;
    setUploadError(null);
    const rowsToUpload: UploadSchoolRow[] = excludeInvalidSchools(parsedRows, (r) => r.status === "error")
      .map((r) => ({
        source_row: r.rowIndex,
        institution_code: r.institution_code,
        name: r.name,
        district: r.district,
        school_type: r.school_type,
        education_type: r.education_type,
        ...(r.boarding_type !== undefined &&
          r.boarding_type !== null && { boarding_type: r.boarding_type }),
        description: r.description,
        ...(r.sinavli_2026 !== undefined &&
          r.sinavli_2026 !== null && { sinavli_2026: r.sinavli_2026 }),
        ...(r.sinavsiz_2026 !== undefined &&
          r.sinavsiz_2026 !== null && { sinavsiz_2026: r.sinavsiz_2026 }),
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
      try {
        const result = await bulkUploadSchools(rowsToUpload);
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

  const stats = {
    total: parsedRows.length,
    new: parsedRows.filter((r) => r.status === "new").length,
    update: parsedRows.filter((r) => r.status === "update").length,
    error: parsedRows.filter((r) => r.status === "error").length,
  };
  const hasErrors = stats.error > 0;
  const canUpload = !hasErrors || skipErrors;
  const uploadableCount = excludeInvalidSchools(parsedRows, (r) => r.status === "error").length;

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
                    "Sınavlı 2026",
                    "Sınavsız 2026",
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
                      {row.sinavli_2026 !== undefined && row.sinavli_2026 !== null
                        ? row.sinavli_2026
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-center text-slate-600">
                      {row.sinavsiz_2026 !== undefined && row.sinavsiz_2026 !== null
                        ? row.sinavsiz_2026
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
                Hatalı okulları atla ve devam et ({uploadableCount} satır yüklenecek)
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
