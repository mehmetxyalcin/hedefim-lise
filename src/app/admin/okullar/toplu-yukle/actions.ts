"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { runSchoolImport } from "@/lib/admin-import";

export type UploadSchoolRow = {
  source_row?: number;
  institution_code: string;
  name: string;
  district: string;
  school_type: string;
  education_type?: "normal" | "ikili" | null;
  boarding_type?: "yok" | "kiz" | "erkek" | "kiz_erkek" | null;
  description?: string | null;
  sinavli_2026?: number;
  sinavsiz_2026?: number;
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

export async function bulkUploadSchools(
  rows: UploadSchoolRow[],
): Promise<UploadResult> {
  const { supabase } = await requireAdmin();
  const result = await runSchoolImport(supabase, "basic", rows);
  return { added: result.added, updated: result.updated, errors: result.errors };
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
  branches: { id: string; name: string; vocational_field_id: number }[];
}> {
  const { supabase } = await requireAdmin();
  try {
    const [{ data: fields, error: fieldsError }, { data: branches, error: branchesError }] = await Promise.all([
      supabase.from("vocational_fields").select("id, title"),
      supabase.from("vocational_branches").select("id, name, vocational_field_id"),
    ]);
    if (fieldsError || branchesError) throw new Error("Meslek alanları yüklenemedi. Lütfen yeniden deneyin.");
    return {
      fields: (fields ?? []) as { id: number; title: string }[],
      branches: (branches ?? []) as { id: string; name: string; vocational_field_id: number }[],
    };
  } catch {
    throw new Error("Meslek alanları yüklenemedi. Lütfen yeniden deneyin.");
  }
}

// ─── Score bulk upload ───────────────────────────────────────────

export type ScoreRow = {
  source_row?: number;
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

export async function bulkUploadScores(rows: ScoreRow[]): Promise<ScoreUploadResult> {
  const { supabase } = await requireAdmin();
  const result = await runSchoolImport(supabase, "scores", rows);
  return { updated: result.updated, errors: result.errors };
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

export async function bulkUploadFacilities(
  rows: ParsedFacilityRow[],
): Promise<FacilityUploadResult> {
  const { supabase } = await requireAdmin();
  const result = await runSchoolImport(supabase, "facilities", rows);
  return { updated: result.updated, errors: result.errors, notFound: [] };
}

export async function bulkUploadVocational(
  rows: VocationalRow[],
): Promise<VocationalUploadResult> {
  const { supabase } = await requireAdmin();
  const result = await runSchoolImport(supabase, "vocational", rows);
  return { updated: result.updated, errors: result.errors };
}
