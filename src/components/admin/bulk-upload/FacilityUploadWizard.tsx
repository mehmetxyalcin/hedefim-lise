"use client";

import { adminButton } from "@/components/admin/ui/Button";
import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { excludeInvalidSchools } from "@/lib/import-validation";
import { AlertCircle, ArrowLeft, Check, CheckCircle2, Download, Loader2, XCircle } from "lucide-react";
import { fetchSchoolsByInstitutionCodes, fetchAllFacilities, bulkUploadFacilities } from "@/app/admin/okullar/toplu-yukle/actions";
import type { ParsedFacilityRow, FacilityUploadResult } from "@/app/admin/okullar/toplu-yukle/actions";
import { str, normalizeStr, parseFacilities } from "@/components/admin/bulk-upload/parsers";
import type { FacilityParsedGroup } from "@/components/admin/bulk-upload/parsers";
import { StepIndicator, Pill, UploadDropzone } from "@/components/admin/bulk-upload/shared";

// ─── FacilityUploadWizard ─────────────────────────────────────────

export function FacilityUploadWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [groups, setGroups] = useState<FacilityParsedGroup[]>([]);
  const [uploadResult, setUploadResult] = useState<FacilityUploadResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const uploadInFlight = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const errorGroups = groups.filter((g) => !g.found || g.errors.length > 0);
  const validGroups = excludeInvalidSchools(groups, (g) => !g.found || g.errors.length > 0);
  const totalUnmatched = groups.reduce((s, g) => s + g.unmatched.length, 0);

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

        if (unmatched.length > 0) errors.push("Eşleşmeyen tesisler var; bu okulun mevcut tesisleri korunacak.");
        if (all_names.length === 0) errors.push("Tesis listesi boş; mevcut tesisler korunacak.");
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
    if (uploadInFlight.current) return;
    uploadInFlight.current = true;
    setUploadError(null);
    const rowsToUpload: ParsedFacilityRow[] = validGroups.map((g) => ({
      institution_code: g.institution_code,
      facility_names: g.all_names,
    }));

    startTransition(async () => {
      try {
        const result = await bulkUploadFacilities(rowsToUpload);
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
              <span className="font-semibold text-admin-ink">Tesisler</span>{" "}
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
        <div className="rounded-xl border border-admin-line bg-white p-6 shadow-admin-card">
          <h2 className="mb-4 text-xl font-bold text-admin-ink">Önizleme ve Doğrulama</h2>

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
                  className="overflow-hidden rounded-xl border border-admin-line"
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
                    <span className="mt-0.5 shrink-0">
                      {isError ? <XCircle aria-hidden="true" className="h-4 w-4 text-rose-600" /> : hasWarning ? <AlertCircle aria-hidden="true" className="h-4 w-4 text-amber-600" /> : <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-emerald-600" />}
                      <span className="sr-only">{isError ? "Hatalı" : hasWarning ? "Uyarı" : "Hazır"}</span>
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
                    <div className="divide-y divide-admin-line-soft bg-white">
                      {group.matched.map((fac) => (
                        <div key={fac.id} className="flex items-center gap-2 px-4 py-2 text-sm">
                          <Check aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                          <span className="sr-only">Eşleşti:</span>
                          <span className="text-admin-body">{fac.name}</span>
                        </div>
                      ))}
                      {group.unmatched.map((name) => (
                        <div
                          key={name}
                          className="flex items-center gap-2 bg-amber-50 px-4 py-2 text-sm"
                        >
                          <AlertCircle aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-amber-700" />
                          <span className="sr-only">Eşleşmedi:</span>
                          <span className="text-amber-700">{name}</span>
                          <span className="text-xs text-amber-400">(bulunamadı; bu okul yüklenmeyecek)</span>
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
                  <li className="text-rose-700">...ve {errorGroups.length - 5} satır daha</li>
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
              className="inline-flex items-center gap-2 rounded-xl border border-admin-line bg-white px-4 py-2.5 text-sm font-semibold text-admin-body hover:bg-admin-ground"
            >
              <ArrowLeft className="h-4 w-4" />
              Geri
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={validGroups.length === 0 || isPending}
              className={adminButton({ variant: "primary" })}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Yükle ({validGroups.length} okul)
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
                setGroups([]);
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
