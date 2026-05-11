import { createClient } from "@/lib/supabase/server";
import { mapSchoolWithDetails } from "@/lib/supabase/public";
import type { SchoolWithDetails } from "@/types/schoolDetail";

// Tüm ilişkili veriyi tek nested sorguda çeker
const SCHOOL_DETAIL_SELECT = `
  *,
  school_vocational_fields(
    vocational_field_id,
    vocational_fields(
      id,
      slug,
      title,
      description,
      skills,
      career,
      branches,
      school_vocational_branches(
        branch_id,
        vocational_branches(id, vocational_field_id, name)
      )
    )
  ),
  school_facilities(
    facilities(id, name, icon, is_default)
  ),
  school_scores(id, school_id, year, obp_score, lgs_score, percentile),
  school_quotas(id, school_id, year, sinavli_count, sinavsiz_count),
  school_scholarships(id, school_id, title, description, amount_info, order_index),
  school_projects(id, school_id, title, description, image_url, link_url, order_index)
` as const;

export async function getSchoolWithDetails(
  slug: string,
): Promise<SchoolWithDetails | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("schools")
    .select(SCHOOL_DETAIL_SELECT)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapSchoolWithDetails(data);
}

// school_vocational_branches junction için filtreli subquery
// Belirli bir okul için seçili dalları çeker
export async function getSchoolSelectedBranches(
  schoolId: number,
): Promise<string[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("school_vocational_branches")
    .select("branch_id")
    .eq("school_id", schoolId);

  return (data ?? []).map((row) => row.branch_id);
}
