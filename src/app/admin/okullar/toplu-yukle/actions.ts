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

// ─── Vocational bulk upload ──────────────────────────────────────

export type VocationalRow = {
  institution_code: string;
  vocational_field: string;
  branch?: string;
};

export type VocationalUploadResult = {
  updated: number;
  errors: { institution_code: string; reason: string }[];
};

export async function fetchSchoolsByInstitutionCodes(
  codes: string[],
): Promise<{ institution_code: string; name: string; id: number }[]> {
  const { supabase } = await requireAdmin();
  if (codes.length === 0) return [];
  const { data, error } = await supabase
    .from("schools")
    .select("institution_code, name, id")
    .in("institution_code", codes);
  if (error) throw new Error(error.message);
  return (data ?? []) as { institution_code: string; name: string; id: number }[];
}

export async function fetchVocationalData(): Promise<{
  fields: { id: number; title: string }[];
  branches: { id: number; name: string; vocational_field_id: number }[];
}> {
  const { supabase } = await requireAdmin();
  try {
    const [{ data: fields }, { data: branches }] = await Promise.all([
      supabase.from("vocational_fields").select("id, title"),
      supabase.from("vocational_branches").select("id, name, vocational_field_id"),
    ]);
    return {
      fields: (fields ?? []) as { id: number; title: string }[],
      branches: (branches ?? []) as { id: number; name: string; vocational_field_id: number }[],
    };
  } catch {
    return { fields: [], branches: [] };
  }
}

// ─── Score bulk upload ───────────────────────────────────────────

export type ScoreRow = {
  institution_code: string;
  vocational_field?: string;
  obp_2025?: number;
  lgs_2025?: number;
  percentile_2025?: number;
  obp_2024?: number;
  lgs_2024?: number;
  percentile_2024?: number;
  obp_2023?: number;
  lgs_2023?: number;
  percentile_2023?: number;
};

export type ScoreUploadResult = {
  updated: number;
  errors: { institution_code: string; reason: string }[];
};

function normalizeScoreField(s: string): string {
  return s.trim().toLocaleLowerCase("tr-TR");
}

export async function bulkUploadScores(rows: ScoreRow[]): Promise<ScoreUploadResult> {
  const { supabase } = await requireAdmin();

  if (rows.length > 500) {
    throw new Error("Maksimum 500 satır yüklenebilir.");
  }

  // Tüm meslek alanlarını çek ve normalize Map oluştur
  const { data: allVocFields } = await supabase
    .from("vocational_fields")
    .select("id, title");
  const vocFieldMap = new Map(
    ((allVocFields ?? []) as { id: number; title: string }[]).map((f) => [
      normalizeScoreField(f.title),
      f,
    ]),
  );

  const result: ScoreUploadResult = { updated: 0, errors: [] };

  for (const row of rows) {
    try {
      const { data: school } = await supabase
        .from("schools")
        .select("id")
        .eq("institution_code", row.institution_code)
        .maybeSingle();

      if (!school) {
        result.errors.push({ institution_code: row.institution_code, reason: "Okul bulunamadı" });
        continue;
      }

      const schoolId = (school as { id: number }).id;

      // Meslek alanını çöz
      let vocFieldId: number | null = null;
      if (row.vocational_field?.trim()) {
        const found = vocFieldMap.get(normalizeScoreField(row.vocational_field));
        if (!found) {
          result.errors.push({
            institution_code: row.institution_code,
            reason: `Meslek alanı bulunamadı: "${row.vocational_field}"`,
          });
          continue;
        }
        vocFieldId = found.id;
      }

      const years = [2025, 2024, 2023] as const;

      for (const year of years) {
        const obp = row[`obp_${year}` as keyof ScoreRow] as number | undefined;
        const lgs = row[`lgs_${year}` as keyof ScoreRow] as number | undefined;
        const percentile = row[`percentile_${year}` as keyof ScoreRow] as number | undefined;

        if (obp === undefined && lgs === undefined && percentile === undefined) continue;

        // Mevcut kaydı bul (NULL-safe: IS NULL veya = value)
        let existingQuery = supabase
          .from("school_scores")
          .select("id, obp_score, lgs_score, percentile")
          .eq("school_id", schoolId)
          .eq("year", year);

        if (vocFieldId !== null) {
          existingQuery = existingQuery.eq("vocational_field_id", vocFieldId);
        } else {
          existingQuery = existingQuery.is("vocational_field_id", null);
        }

        const { data: existing } = await existingQuery.maybeSingle();
        const rec = existing as {
          id: string;
          obp_score: number | null;
          lgs_score: number | null;
          percentile: number | null;
        } | null;

        const payload = {
          school_id: schoolId,
          year,
          vocational_field_id: vocFieldId,
          obp_score: obp ?? rec?.obp_score ?? null,
          lgs_score: lgs ?? rec?.lgs_score ?? null,
          percentile: percentile ?? rec?.percentile ?? null,
        };

        if (rec) {
          await supabase.from("school_scores").update(payload).eq("id", rec.id);
        } else {
          await supabase.from("school_scores").insert(payload);
        }
      }

      result.updated++;
    } catch (err) {
      result.errors.push({
        institution_code: row.institution_code,
        reason: err instanceof Error ? err.message : "Bilinmeyen hata",
      });
    }
  }

  return result;
}

// ─── Facility bulk upload ────────────────────────────────────────

export type ParsedFacilityRow = {
  institution_code: string;
  facility_names: string[];
};

export type FacilityUploadResult = {
  updated: number;
  notFound: { facility_name: string; institution_code: string; school_name: string }[];
  errors: { institution_code: string; reason: string }[];
};

export async function fetchAllFacilities(): Promise<{ id: string; name: string }[]> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("facilities").select("id, name").order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as { id: string; name: string }[];
}

function normalizeFac(s: string): string {
  return s.trim().toLocaleLowerCase("tr-TR");
}

export async function bulkUploadFacilities(
  rows: ParsedFacilityRow[],
): Promise<FacilityUploadResult> {
  const { supabase } = await requireAdmin();

  if (rows.length > 500) {
    throw new Error("Maksimum 500 satır yüklenebilir.");
  }

  const { data: allFacilities } = await supabase.from("facilities").select("id, name");
  const facilityMap = new Map(
    ((allFacilities ?? []) as { id: string; name: string }[]).map((f) => [normalizeFac(f.name), f]),
  );

  const result: FacilityUploadResult = { updated: 0, notFound: [], errors: [] };

  for (const row of rows) {
    const { data: school } = await supabase
      .from("schools")
      .select("id, name")
      .eq("institution_code", row.institution_code)
      .maybeSingle();

    if (!school) {
      result.errors.push({ institution_code: row.institution_code, reason: "Okul bulunamadı" });
      continue;
    }

    const schoolId = (school as { id: number; name: string }).id;
    const schoolName = (school as { id: number; name: string }).name;

    await supabase.from("school_facilities").delete().eq("school_id", schoolId);

    const facilityIds: string[] = [];
    for (const name of row.facility_names) {
      const facility = facilityMap.get(normalizeFac(name));
      if (facility) {
        facilityIds.push(facility.id);
      } else {
        result.notFound.push({ facility_name: name, institution_code: row.institution_code, school_name: schoolName });
      }
    }

    if (facilityIds.length > 0) {
      await supabase
        .from("school_facilities")
        .insert(facilityIds.map((facilityId) => ({ school_id: schoolId, facility_id: facilityId })));
    }

    result.updated++;
  }

  return result;
}

function normalizeVoc(s: string): string {
  return s.trim().toLocaleLowerCase("tr-TR");
}

export async function bulkUploadVocational(
  rows: VocationalRow[],
): Promise<VocationalUploadResult> {
  const { supabase } = await requireAdmin();

  if (rows.length > 2000) {
    throw new Error("Maksimum 2000 satır yüklenebilir.");
  }

  const [{ data: allFields }, { data: allBranches }] = await Promise.all([
    supabase.from("vocational_fields").select("id, title"),
    supabase.from("vocational_branches").select("id, name, vocational_field_id"),
  ]);

  type VocField = { id: number; title: string };
  type VocBranch = { id: number; name: string; vocational_field_id: number };

  const fieldMap = new Map<string, VocField>(
    ((allFields ?? []) as VocField[]).map((f) => [normalizeVoc(f.title), f]),
  );
  const branchMap = new Map<string, VocBranch>(
    ((allBranches ?? []) as VocBranch[]).map((b) => [
      `${b.vocational_field_id}:${normalizeVoc(b.name)}`,
      b,
    ]),
  );

  const grouped = new Map<string, VocationalRow[]>();
  for (const row of rows) {
    const list = grouped.get(row.institution_code) ?? [];
    list.push(row);
    grouped.set(row.institution_code, list);
  }

  const result: VocationalUploadResult = { updated: 0, errors: [] };

  for (const [institutionCode, schoolRows] of grouped) {
    const { data: school } = await supabase
      .from("schools")
      .select("id")
      .eq("institution_code", institutionCode)
      .maybeSingle();

    if (!school) {
      result.errors.push({
        institution_code: institutionCode,
        reason: "Bu kurum koduna ait okul bulunamadı",
      });
      continue;
    }

    const schoolId = (school as { id: number }).id;

    // Delete existing (branches first, then fields)
    await supabase.from("school_vocational_branches").delete().eq("school_id", schoolId);
    await supabase.from("school_vocational_fields").delete().eq("school_id", schoolId);

    const insertedFieldSet = new Set<number>();
    const insertedBranchSet = new Set<number>();

    for (const row of schoolRows) {
      const field = fieldMap.get(normalizeVoc(row.vocational_field));
      if (!field) continue;

      if (!insertedFieldSet.has(field.id)) {
        const { error } = await supabase
          .from("school_vocational_fields")
          .insert({ school_id: schoolId, vocational_field_id: field.id });
        if (!error) insertedFieldSet.add(field.id);
      }

      if (row.branch?.trim()) {
        const branch = branchMap.get(`${field.id}:${normalizeVoc(row.branch)}`);
        if (branch && !insertedBranchSet.has(branch.id)) {
          const { error } = await supabase
            .from("school_vocational_branches")
            .insert({ school_id: schoolId, branch_id: branch.id });
          if (!error) insertedBranchSet.add(branch.id);
        }
      }
    }

    result.updated++;
  }

  return result;
}
