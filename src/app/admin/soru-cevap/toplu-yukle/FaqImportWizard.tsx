"use client";

import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Download, Loader2, XCircle } from "lucide-react";
import { adminButton } from "@/components/admin/ui/Button";
import { Badge } from "@/components/admin/ui/Badge";
import { Pill, StepIndicator, UploadDropzone } from "@/components/admin/bulk-upload/shared";
import {
  FAQ_IMPORT_HEADERS,
  FAQ_IMPORT_MAX_ROWS,
  type FaqImportCommitResult,
  type FaqImportPreview,
} from "@/lib/faq-import";
import { commitFaqImport, previewFaqImport } from "./actions";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
// Sunucu eylemleri varsayılan olarak 1 MB ile sınırlı; payı bırakıp önceden uyar.
const MAX_PAYLOAD_CHARS = 900_000;

type Matrix = unknown[][];
type Done = Extract<FaqImportCommitResult, { ok: true }>;

async function readSheet(file: File): Promise<Matrix> {
  const XLSX = await import("xlsx");
  // CSV'yi metin olarak oku: tarayıcı UTF-8'i çözer, Türkçe harfler bozulmaz.
  const workbook = /\.csv$/i.test(file.name)
    ? XLSX.read(await file.text(), { type: "string" })
    : XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: "array" });
  const name = workbook.SheetNames.find((n) => n === "Sorular") ?? workbook.SheetNames[0];
  const sheet = name ? workbook.Sheets[name] : undefined;
  if (!sheet) throw new Error("Dosyada sayfa bulunamadı.");
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: "" });
}

async function downloadTemplate() {
  const XLSX = await import("xlsx");
  const sheet = XLSX.utils.aoa_to_sheet([
    [...FAQ_IMPORT_HEADERS],
    [
      "Tercih İşlemleri",
      "Tercih yaparken kaç okul seçebilirim?",
      "Örnek yanıt. Tercih sayısı sınırı her yıl kılavuzda belirtilir; kesin sayı için güncel kılavuza bakın.",
      12,
      10,
      "evet",
      "evet",
    ],
    [
      "Yeni Bir Kategori",
      "Kategori adı kayıtlı değilse ne olur?",
      "Kategori yüklemede otomatik oluşturulur; sonra panelden açıklama ve sıra verebilirsiniz.",
      "",
      "",
      "",
      "",
    ],
  ]);
  sheet["!cols"] = [{ wch: 22 }, { wch: 46 }, { wch: 70 }, { wch: 14 }, { wch: 8 }, { wch: 12 }, { wch: 10 }];

  const notes = XLSX.utils.aoa_to_sheet([
    ["Sütun", "Zorunlu", "Açıklama"],
    ["Kategori", "Evet", "Kayıtlı kategori adı. Kayıtlı değilse yeni kategori oluşturulur."],
    ["Soru", "Evet", "En fazla 500 karakter. Zaten kayıtlı olan soru atlanır."],
    ["Yanıt", "Evet", "En fazla 6000 karakter. Hücre içinde satır atlayabilirsiniz."],
    ["Kaynak sayfa", "Hayır", "Kılavuzdaki sayfa numarası (tam sayı)."],
    ["Sıra", "Hayır", "Boşsa kategorinin sonuna eklenir."],
    ["Öne çıkan", "Hayır", "evet / hayır. Boşsa hayır."],
    ["Yayında", "Hayır", "evet / hayır. Boşsa evet."],
  ]);
  notes["!cols"] = [{ wch: 16 }, { wch: 10 }, { wch: 80 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Sorular");
  XLSX.utils.book_append_sheet(workbook, notes, "Açıklama");
  XLSX.writeFile(workbook, "soru-cevap-sablonu.xlsx");
}

export function FaqImportWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rows, setRows] = useState<Matrix>([]);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<FaqImportPreview | null>(null);
  const [skipErrors, setSkipErrors] = useState(false);
  const [result, setResult] = useState<Done | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inFlight = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setStep(1);
    setRows([]);
    setPreview(null);
    setResult(null);
    setSkipErrors(false);
    setParseError(null);
    setActionError(null);
  }

  async function handleFile(file: File) {
    if (inFlight.current) return;
    setParseError(null);
    setActionError(null);
    if (!/\.(xlsx|csv)$/i.test(file.name)) {
      setParseError("Yalnızca .xlsx veya .csv dosyaları kabul edilir.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setParseError("Dosya boyutu 10 MB'ı aşıyor.");
      return;
    }
    inFlight.current = true;
    try {
      const matrix = await readSheet(file);
      if (matrix.length - 1 > FAQ_IMPORT_MAX_ROWS) {
        setParseError(`Dosyada ${matrix.length - 1} satır var; en fazla ${FAQ_IMPORT_MAX_ROWS} satır yüklenebilir. Dosyayı bölün.`);
        return;
      }
      if (JSON.stringify(matrix).length > MAX_PAYLOAD_CHARS) {
        setParseError("Dosyadaki metin çok uzun; tek seferde gönderilemez. Dosyayı ikiye bölüp ayrı ayrı yükleyin.");
        return;
      }
      const response = await previewFaqImport(matrix);
      if (!response.ok) {
        setParseError(response.message);
        return;
      }
      setRows(matrix);
      setFileName(file.name);
      setPreview(response.preview);
      setSkipErrors(false);
      setStep(2);
    } catch (error) {
      unstable_rethrow(error);
      setParseError(error instanceof Error ? error.message : "Dosya okunamadı.");
    } finally {
      inFlight.current = false;
    }
  }

  function handleCommit() {
    if (inFlight.current) return;
    inFlight.current = true;
    setActionError(null);
    startTransition(async () => {
      try {
        const response = await commitFaqImport(rows);
        if (response.ok) {
          setResult(response);
          setStep(3);
        } else {
          setActionError(response.message);
        }
      } catch (error) {
        unstable_rethrow(error);
        setActionError(
          "Yükleme sonucu alınamadı. Bağlantınızı ve oturumunuzu kontrol edin. Yeniden yüklemeden önce soru listesine bakın; zaten eklenmiş sorular tekrar yüklenirse atlanır.",
        );
      } finally {
        inFlight.current = false;
      }
    });
  }

  const counts = preview?.counts;
  const hasErrors = (counts?.error ?? 0) > 0;
  const canCommit = !!counts && counts.create > 0 && (!hasErrors || skipErrors) && !isPending;

  return (
    <div className="space-y-6">
      <StepIndicator step={step} />

      {actionError && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {actionError}
        </div>
      )}

      {step === 1 && (
        <div className="rounded-xl border border-admin-line bg-white p-6 shadow-admin-card sm:p-8">
          <h2 className="mb-6 text-xl font-bold text-admin-ink">Dosya yükle</h2>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-admin-line bg-admin-ground px-4 py-3">
            <span className="text-sm text-admin-body">
              Şablonu indirip doldurun, ardından yükleyin.{" "}
              <span className="text-admin-faint">Sütunlar: {FAQ_IMPORT_HEADERS.join(", ")}</span>
            </span>
            <button type="button" onClick={() => void downloadTemplate()} className={adminButton({ size: "sm" })}>
              <Download aria-hidden="true" className="h-4 w-4" />
              Şablonu indir
            </button>
          </div>
          <UploadDropzone
            onFile={(file) => void handleFile(file)}
            parseError={parseError}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            fileInputRef={fileInputRef}
            hint={`.xlsx veya .csv • Maks 10 MB • Maks ${FAQ_IMPORT_MAX_ROWS} satır`}
          />
        </div>
      )}

      {step === 2 && preview && counts && (
        <div className="rounded-xl border border-admin-line bg-white p-6 shadow-admin-card">
          <h2 className="mb-1 text-xl font-bold text-admin-ink">Önizleme</h2>
          <p className="mb-4 text-sm text-admin-muted">{fileName}</p>

          {preview.fileErrors.length > 0 && (
            <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {preview.fileErrors.map((message) => (
                <p key={message}>{message}</p>
              ))}
            </div>
          )}

          <div className="mb-3 flex flex-wrap gap-2">
            <Pill label="Satır" count={counts.total} color="slate" />
            <Pill label="Eklenecek" count={counts.create} color="green" />
            {counts.duplicate > 0 && <Pill label="Zaten kayıtlı" count={counts.duplicate} color="yellow" />}
            {counts.error > 0 && <Pill label="Hatalı" count={counts.error} color="red" />}
          </div>

          {preview.newCategories.length > 0 && (
            <p className="mb-4 text-sm text-admin-body">
              <span className="font-semibold">Yeni kategori oluşturulacak ({preview.newCategories.length}):</span>{" "}
              {preview.newCategories.join(", ")}. Açıklamasını ve sırasını sonra panelden düzenleyebilirsiniz.
            </p>
          )}

          {preview.items.length > 0 && (
            <div className="mb-4 max-h-[28rem] overflow-auto rounded-xl border border-admin-line">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-admin-ground">
                  <tr className="border-b border-admin-line text-left">
                    {["Durum", "Satır", "Kategori", "Soru", "Not"].map((heading) => (
                      <th key={heading} className="whitespace-nowrap px-3 py-2 text-xs font-semibold text-admin-body">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.items.map((item) => (
                    <tr
                      key={item.row}
                      className={`border-b border-admin-line-soft align-top ${item.status === "error" ? "bg-rose-50" : ""}`}
                    >
                      <td className="px-3 py-2">
                        {item.status === "ok" && (
                          <span title="Eklenecek">
                            <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-emerald-600" />
                            <span className="sr-only">Eklenecek</span>
                          </span>
                        )}
                        {item.status === "duplicate" && (
                          <span title="Zaten kayıtlı">
                            <AlertCircle aria-hidden="true" className="h-4 w-4 text-amber-600" />
                            <span className="sr-only">Zaten kayıtlı, atlanacak</span>
                          </span>
                        )}
                        {item.status === "error" && (
                          <span title="Hatalı">
                            <XCircle aria-hidden="true" className="h-4 w-4 text-rose-600" />
                            <span className="sr-only">Hatalı</span>
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 tabular-nums text-admin-faint">{item.row}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-admin-body">
                        {item.category || "—"}
                        {item.newCategory && (
                          <Badge tone="accent" className="ml-2">
                            yeni
                          </Badge>
                        )}
                      </td>
                      <td className="min-w-[16rem] max-w-md px-3 py-2 text-admin-body">{item.question || "—"}</td>
                      <td className={`min-w-[12rem] px-3 py-2 text-xs ${item.status === "error" ? "text-rose-700" : "text-admin-muted"}`}>
                        {item.message ?? ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {hasErrors && counts.create > 0 && (
            <label className="mb-4 flex cursor-pointer items-start gap-2 text-sm text-admin-body">
              <input
                type="checkbox"
                checked={skipErrors}
                onChange={(event) => setSkipErrors(event.target.checked)}
                className="mt-0.5 h-4 w-4"
              />
              <span>
                {counts.error} hatalı satırı atla, geri kalan {counts.create} soruyu ekle
              </span>
            </label>
          )}
          {counts.create === 0 && (
            <p className="mb-4 text-sm text-admin-muted">Eklenecek yeni soru yok. Dosyayı düzeltip yeniden yükleyin.</p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={reset} disabled={isPending} className={adminButton()}>
              Başka dosya seç
            </button>
            <button
              type="button"
              onClick={handleCommit}
              disabled={!canCommit}
              aria-busy={isPending || undefined}
              className={adminButton({ variant: "primary" })}
            >
              {isPending && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
              {isPending ? "Ekleniyor…" : `${counts.create} soruyu ekle`}
            </button>
          </div>
        </div>
      )}

      {step === 3 && result && (
        <div className="rounded-xl border border-admin-line bg-white p-6 shadow-admin-card sm:p-8">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 aria-hidden="true" className="h-6 w-6 text-emerald-600" />
            <h2 className="text-xl font-bold text-admin-ink">
              {result.created > 0 ? `${result.created} soru eklendi` : "Yeni soru eklenmedi"}
            </h2>
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            <Pill label="Eklenen" count={result.created} color="green" />
            {result.categoriesCreated.length > 0 && (
              <Pill label="Yeni kategori" count={result.categoriesCreated.length} color="slate" />
            )}
            {result.skippedDuplicates > 0 && <Pill label="Zaten kayıtlı" count={result.skippedDuplicates} color="yellow" />}
            {result.skippedErrors > 0 && <Pill label="Hatalı, atlandı" count={result.skippedErrors} color="red" />}
          </div>
          {result.categoriesCreated.length > 0 && (
            <p className="mb-4 text-sm text-admin-body">
              Oluşturulan kategoriler: {result.categoriesCreated.join(", ")}.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/admin/soru-cevap" className={adminButton({ variant: "primary" })}>
              Soru listesine dön
            </Link>
            <button type="button" onClick={reset} className={adminButton()}>
              Başka dosya yükle
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
