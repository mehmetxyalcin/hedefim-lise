"use client";

import { adminButton } from "@/components/admin/ui/Button";
import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { AlertCircle, ArrowLeft, Check, CheckCircle2, Download, Loader2, X, XCircle } from "lucide-react";
import { fetchSchoolsByInstitutionCodes, fetchVocationalData, bulkUploadVocational } from "@/app/admin/okullar/toplu-yukle/actions";
import type { VocationalRow, VocationalUploadResult } from "@/app/admin/okullar/toplu-yukle/actions";
import { MAX_VOC_ROWS, str, normalizeStr } from "@/components/admin/bulk-upload/parsers";
import type { VocationalRawRow, VocationalValidatedRow, SchoolGroup } from "@/components/admin/bulk-upload/parsers";
import { StepIndicator, Pill, UploadDropzone } from "@/components/admin/bulk-upload/shared";

// ─── VocationalUploadWizard ───────────────────────────────────────

export function VocationalUploadWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [schoolGroups, setSchoolGroups] = useState<SchoolGroup[]>([]);
  const [skipErrors, setSkipErrors] = useState(false);
  const [uploadResult, setUploadResult] = useState<VocationalUploadResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const uploadInFlight = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const errorGroupCount = schoolGroups.filter((g) => g.hasErrors).length;
  const validGroupCount = schoolGroups.filter((g) => g.found && !g.hasErrors).length;
  const totalRows = schoolGroups.reduce((sum, g) => sum + g.rows.length, 0);
  const uploadableGroups = schoolGroups.filter((g) => g.found && !g.hasErrors);
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
    setUploadError(null);

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
        let branch_id: string | null = null;

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
    if (uploadInFlight.current) return;
    uploadInFlight.current = true;
    setUploadError(null);
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
      try {
        const result = await bulkUploadVocational(rowsToUpload);
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
              <span className="font-semibold text-admin-ink">Meslek Alanları</span>{" "}
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
        <div className="rounded-xl border border-admin-line bg-white p-6 shadow-admin-card">
          <h2 className="mb-4 text-xl font-bold text-admin-ink">Önizleme ve Doğrulama</h2>

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
                  className="overflow-hidden rounded-xl border border-admin-line"
                >
                  {/* Grup başlığı */}
                  <div
                    className={`flex items-start gap-3 px-4 py-3 ${
                      isError
                        ? "border-b border-rose-100 bg-rose-50"
                        : "border-b border-amber-100 bg-amber-50"
                    }`}
                  >
                    <span className="mt-0.5 shrink-0">
                      {isError ? <XCircle aria-hidden="true" className="h-4 w-4 text-rose-600" /> : <AlertCircle aria-hidden="true" className="h-4 w-4 text-amber-600" />}
                      <span className="sr-only">{isError ? "Hatalı" : "Uyarı"}</span>
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-admin-ink">
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
                    <div className="divide-y divide-admin-line-soft bg-white">
                      {group.rows.map((row) => (
                        <div
                          key={row.rowIndex}
                          className={`flex items-start gap-2 px-4 py-2 text-sm ${
                            row.errors.length > 0 ? "bg-rose-50" : ""
                          }`}
                        >
                          {row.errors.length > 0 ? (
                            <X aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600" />
                          ) : (
                            <Check aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                          )}
                          <span className="sr-only">{row.errors.length > 0 ? "Hatalı:" : "Geçerli:"}</span>
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-admin-body">
                              {row.vocational_field || "—"}
                            </span>
                            {row.branch && (
                              <span className="ml-2 text-admin-faint">└─ {row.branch}</span>
                            )}
                            {row.errors.length > 0 && (
                              <p className="mt-0.5 text-xs text-rose-700">
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
              <label className="flex cursor-pointer items-center gap-2 text-sm text-admin-body">
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
              className="inline-flex items-center gap-2 rounded-xl border border-admin-line bg-white px-4 py-2.5 text-sm font-semibold text-admin-body hover:bg-admin-ground"
            >
              <ArrowLeft className="h-4 w-4" />
              Geri
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploadableCount === 0 || (errorGroupCount > 0 && !skipErrors) || isPending}
              className={adminButton({ variant: "primary" })}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Yükle ({uploadableCount} okul)
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
              <div className="flex items-center gap-3 rounded-xl border border-admin-line bg-admin-ground px-4 py-3">
                <CheckCircle2 aria-hidden="true" className="h-5 w-5 shrink-0 text-emerald-600" />
                <span className="text-sm font-medium text-admin-body">
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
              <p className="text-sm text-admin-muted">Yüklenecek kayıt bulunamadı.</p>
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
                setSchoolGroups([]);
                setUploadResult(null);
                setSkipErrors(false);
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
