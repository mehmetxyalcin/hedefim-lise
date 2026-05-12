"use server";

import { requireAdmin } from "@/lib/admin-auth";

export type UploadSchoolRow = {
  institution_code: string;
  name: string;
  district: string;
  school_type: string;
  education_type?: "normal" | "ikili" | null;
  boarding_type?: "yok" | "kiz" | "erkek" | "kiz_erkek" | null;
  description?: string | null;
  sinavli_2025?: number;
  sinavsiz_2025?: number;
  sinavli_2024?: number;
  sinavsiz_2024?: number;
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

function slugifyBase(name: string): string {
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

function generateUniqueSlug(name: string, institutionCode: string): string {
  const base = slugifyBase(name) || slugifyBase(institutionCode);
  const code = slugifyBase(institutionCode) || institutionCode.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return `${base}-${code}`;
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

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    try {
      const existingId = existingMap.get(row.institution_code);

      let schoolId: number = existingId ?? 0;

      if (existingId) {
        const { error } = await supabase
          .from("schools")
          .update({
            ...(row.name?.trim() && { name: row.name.trim() }),
            ...(row.district?.trim() && { district: row.district.trim() }),
            ...(row.school_type?.trim() && { type: row.school_type.trim() }),
            ...(row.phone?.trim() && { phone: row.phone.trim() }),
            ...(row.website?.trim() && { website: row.website.trim() }),
            ...(row.address?.trim() && { address: row.address.trim() }),
            ...(row.education_type != null && { education_type: row.education_type }),
            ...(row.boarding_type != null && { boarding_type: row.boarding_type }),
            ...(row.description?.trim() && { description: row.description.trim() }),
          })
          .eq("id", existingId);

        if (error) throw new Error(error.message);
        result.updated++;
      } else {
        if (!row.name?.trim() || !row.district?.trim() || !row.school_type?.trim()) {
          throw new Error("Yeni okul için Okul Adı, İlçe ve Okul Türü zorunludur.");
        }

        const slug = generateUniqueSlug(row.name, row.institution_code);

        const { data: inserted, error } = await supabase
          .from("schools")
          .insert({
            name: row.name,
            slug,
            type: row.school_type,
            district: row.district,
            institution_code: row.institution_code,
            phone: row.phone ?? null,
            website: row.website ?? null,
            address: row.address ?? null,
            education_type: row.education_type ?? "normal",
            boarding_type: row.boarding_type ?? "yok",
            percentile: "0",
            logo: row.name.slice(0, 2).toUpperCase(),
            color: "bg-gradient-to-br from-slate-700 to-slate-900",
            description: row.description?.trim() ?? "",
            features: [],
            projects: [],
            languages: [],
            images: [],
            is_active: false,
          })
          .select("id")
          .single();

        if (error) throw new Error(error.message);
        schoolId = (inserted as { id: number }).id;
        result.added++;
      }

      if (row.sinavli_2025 !== undefined || row.sinavsiz_2025 !== undefined) {
        const { error: q25err } = await supabase.from("school_quotas").upsert(
          {
            school_id: schoolId,
            year: 2025,
            ...(row.sinavli_2025 !== undefined && { sinavli_count: row.sinavli_2025 }),
            ...(row.sinavsiz_2025 !== undefined && { sinavsiz_count: row.sinavsiz_2025 }),
          },
          { onConflict: "school_id,year" },
        );
        if (q25err) throw new Error(q25err.message);
      }

      if (row.sinavli_2024 !== undefined || row.sinavsiz_2024 !== undefined) {
        const { error: q24err } = await supabase.from("school_quotas").upsert(
          {
            school_id: schoolId,
            year: 2024,
            ...(row.sinavli_2024 !== undefined && { sinavli_count: row.sinavli_2024 }),
            ...(row.sinavsiz_2024 !== undefined && { sinavsiz_count: row.sinavsiz_2024 }),
          },
          { onConflict: "school_id,year" },
        );
        if (q24err) throw new Error(q24err.message);
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
