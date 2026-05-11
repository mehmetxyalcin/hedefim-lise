"use server";

import { requireAdmin } from "@/lib/admin-auth";

export type UploadSchoolRow = {
  institution_code: string;
  name: string;
  district: string;
  school_type: string;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
};

export type UploadResult = {
  added: number;
  updated: number;
  errors: { row: number; institution_code: string; reason: string }[];
};

export async function checkInstitutionCodes(codes: string[]): Promise<string[]> {
  const { supabase } = await requireAdmin();
  if (codes.length === 0) return [];

  const { data, error } = await supabase
    .from("schools")
    .select("institution_code")
    .in("institution_code", codes);

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((r) => r.institution_code)
    .filter((c): c is string => Boolean(c));
}

function slugify(name: string): string {
  return name
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export async function bulkUploadSchools(
  rows: UploadSchoolRow[],
): Promise<UploadResult> {
  const { supabase } = await requireAdmin();

  if (rows.length > 500) {
    throw new Error("Maksimum 500 satır yüklenebilir.");
  }

  const result: UploadResult = { added: 0, updated: 0, errors: [] };

  const codes = rows.map((r) => r.institution_code).filter(Boolean);

  const { data: existingData } = await supabase
    .from("schools")
    .select("id, institution_code")
    .in("institution_code", codes);

  const existingMap = new Map<string, number>(
    (existingData ?? []).map((r) => [r.institution_code as string, r.id as number]),
  );

  const { data: slugData } = await supabase.from("schools").select("slug");
  const existingSlugs = new Set((slugData ?? []).map((r) => r.slug as string));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    try {
      const existingId = existingMap.get(row.institution_code);

      if (existingId) {
        const { error } = await supabase
          .from("schools")
          .update({
            phone: row.phone ?? null,
            website: row.website ?? null,
            address: row.address ?? null,
          })
          .eq("id", existingId);

        if (error) throw new Error(error.message);
        result.updated++;
      } else {
        let slug = slugify(row.name) || slugify(row.institution_code);

        if (existingSlugs.has(slug)) {
          const withCode = `${slug}-${slugify(row.institution_code)}`;
          slug = existingSlugs.has(withCode)
            ? `${withCode}-${Date.now()}`
            : withCode;
        }
        existingSlugs.add(slug);

        const { error } = await supabase.from("schools").insert({
          name: row.name,
          slug,
          type: row.school_type,
          district: row.district,
          institution_code: row.institution_code,
          phone: row.phone ?? null,
          website: row.website ?? null,
          address: row.address ?? null,
          percentile: "0",
          logo: row.name.slice(0, 2).toUpperCase(),
          color: "bg-gradient-to-br from-slate-700 to-slate-900",
          description: "",
          features: [],
          projects: [],
          languages: [],
          images: [],
          is_active: false,
        });

        if (error) throw new Error(error.message);
        result.added++;
      }
    } catch (err) {
      result.errors.push({
        row: rowNum,
        institution_code: row.institution_code,
        reason: err instanceof Error ? err.message : "Bilinmeyen hata",
      });
    }
  }

  return result;
}
