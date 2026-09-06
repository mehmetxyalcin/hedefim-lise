import { revalidatePath } from "next/cache";
import type { requireAdmin } from "@/lib/admin-auth";

type AdminClient = Awaited<ReturnType<typeof requireAdmin>>["supabase"];
type ImportMode = "basic" | "scores" | "facilities" | "vocational";
type ImportRow = { institution_code: string; source_row?: number };
type ImportError = { row: number; institution_code: string; reason: string };

// A school is the unit of work: its rows commit together in PostgreSQL.
// Never fall back to separate REST writes if the migration is not installed.
export async function runSchoolImport(
  supabase: AdminClient,
  mode: ImportMode,
  rows: ImportRow[],
) {
  const maximum = mode === "vocational" ? 2000 : 500;
  if (!Array.isArray(rows) || rows.length > maximum) {
    throw new Error(`En fazla ${maximum} satır yüklenebilir.`);
  }

  const result = { added: 0, updated: 0, errors: [] as ImportError[] };
  const groups = new Map<string, ImportRow[]>();
  rows.forEach((row, index) => {
    const code = typeof row?.institution_code === "string" ? row.institution_code.trim() : "";
    const line = Number.isInteger(row?.source_row) && row.source_row! >= 2
      ? row.source_row! : index + 2;
    if (!code) {
      result.errors.push({ row: line, institution_code: "", reason: "Kurum kodu zorunludur." });
      return;
    }
    const group = groups.get(code) ?? [];
    group.push({ ...row, institution_code: code, source_row: line });
    groups.set(code, group);
  });

  let stopReason: string | null = null;
  for (const [code, group] of groups) {
    const fail = (reason: string) => result.errors.push({
      row: group[0].source_row!, institution_code: code, reason,
    });
    if (stopReason) {
      fail(`İşlenmedi: ${stopReason}`);
      continue;
    }

    try {
      const { data, error } = await supabase.rpc("admin_import_school", {
        p_mode: mode,
        p_rows: group,
      });
      if (error) {
        if (error.code === "PGRST202") {
          stopReason = "Güvenli kayıt güncellemesi veritabanında henüz hazır değil. Yükleme durduruldu.";
          fail(stopReason);
        } else if (!error.code || !/^(?:[0-9A-Z]{5}|PGRST\d+)$/.test(error.code)) {
          stopReason = "Bağlantı kesildi. Son okulun kayıt sonucu doğrulanamadı; yeniden yüklemeden önce kontrol edin.";
          fail(stopReason);
        } else {
          fail(`${error.message} Bu okulun bu yüklemedeki değişiklikleri kaydedilmedi.`);
        }
        continue;
      }

      if (!data || !["added", "updated", "skipped"].includes(data.operation)) {
        stopReason = "Kayıt sonucu doğrulanamadı. Yeniden yüklemeden önce okul bilgilerini kontrol edin.";
        fail(stopReason);
        continue;
      }
      if (data.operation === "added") result.added++;
      if (data.operation === "updated") result.updated++;
    } catch {
      // A transport error may occur after commit. Do not claim rollback or retry.
      stopReason = "Bağlantı kesildi. Son okulun kayıt sonucu doğrulanamadı; yeniden yüklemeden önce kontrol edin.";
      fail(stopReason);
    }
  }

  // Refresh even after an ambiguous network failure: the server may have committed.
  if (groups.size > 0) {
    revalidatePath("/", "layout");
    revalidatePath("/sitemap.xml");
  }
  return result;
}
