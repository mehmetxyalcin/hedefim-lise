import { createClient } from "@/lib/supabase/server";
import type {
  SchoolWithDetails,
  Facility,
  SchoolScore,
  SchoolQuota,
  SchoolScholarship,
  SchoolProject,
  VocationalFieldWithBranches,
  VocationalBranch,
} from "@/types/schoolDetail";

// school_vocational_branches'ın school_vocational_fields içine nested
// join'i PostgREST'te desteklenmiyor (FK yok). Top-level tutulur,
// mapper içinde vocational_field_id'ye göre gruplama yapılır.
const SCHOOL_DETAIL_SELECT = `
  *,
  school_facilities (
    facility:facilities ( id, name, icon )
  ),
  school_vocational_fields (
    vocational_field:vocational_fields ( id, slug, title )
  ),
  school_vocational_branches (
    branch:vocational_branches ( id, vocational_field_id, name )
  ),
  school_scores ( id, school_id, year, obp_score, lgs_score, percentile ),
  school_quotas ( id, school_id, year, sinavli_count, sinavsiz_count ),
  school_scholarships ( id, school_id, title, description, amount_info, order_index ),
  school_projects ( id, school_id, title, description, image_url, link_url, order_index )
` as const;

const SCHOOL_BASIC_SELECT = `
  *,
  school_vocational_fields (
    vocational_field:vocational_fields ( id, slug, title )
  )
` as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRawToSchoolWithDetails(row: any): SchoolWithDetails {
  // Tesisler: school_facilities[].facility
  const facilities: Facility[] = (row.school_facilities ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((sf: any) => sf.facility)
    .filter(Boolean)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((f: any): Facility => ({
      id: f.id as string,
      name: f.name as string,
      icon: (f.icon as string | null) ?? null,
      isDefault: false,
    }));

  // Dalları vocational_field_id'ye göre grupla
  const branchesByFieldId = new Map<number, VocationalBranch[]>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (row.school_vocational_branches ?? []).forEach((svb: any) => {
    const b = svb.branch;
    if (!b) return;
    const fid = b.vocational_field_id as number;
    const branch: VocationalBranch = {
      id: b.id as string,
      vocationalFieldId: fid,
      name: b.name as string,
    };
    const list = branchesByFieldId.get(fid) ?? [];
    list.push(branch);
    branchesByFieldId.set(fid, list);
  });

  // Meslek alanları + dallar
  const vocationalFieldsWithBranches: VocationalFieldWithBranches[] = (
    row.school_vocational_fields ?? []
  )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((svf: any) => svf.vocational_field)
    .filter(Boolean)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((f: any): VocationalFieldWithBranches => ({
      id: f.id as number,
      title: f.title as string,
      slug: (f.slug as string) ?? "",
      selectedBranches: branchesByFieldId.get(f.id as number) ?? [],
    }));

  // Puanlar — yılı büyükten küçüğe sırala
  const scores: SchoolScore[] = [...(row.school_scores ?? [])]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => b.year - a.year)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((s: any): SchoolScore => ({
      id: (s.id as string) ?? "",
      schoolId: (s.school_id as number) ?? row.id,
      year: s.year as number,
      obpScore: (s.obp_score as number | null) ?? null,
      lgsScore: (s.lgs_score as number | null) ?? null,
      percentile: (s.percentile as number | null) ?? null,
    }));

  // Kontenjan
  const quotas: SchoolQuota[] = (row.school_quotas ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (q: any): SchoolQuota => ({
      id: (q.id as string) ?? "",
      schoolId: (q.school_id as number) ?? row.id,
      year: q.year as number,
      sinavliCount: (q.sinavli_count as number | null) ?? null,
      sinavsizCount: (q.sinavsiz_count as number | null) ?? null,
    }),
  );

  // Burslar — order_index ASC
  const scholarships: SchoolScholarship[] = [...(row.school_scholarships ?? [])]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => a.order_index - b.order_index)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((s: any): SchoolScholarship => ({
      id: s.id as string,
      schoolId: (s.school_id as number) ?? row.id,
      title: s.title as string,
      description: (s.description as string | null) ?? null,
      amountInfo: (s.amount_info as string | null) ?? null,
      orderIndex: s.order_index as number,
    }));

  // Projeler — order_index ASC
  const schoolProjects: SchoolProject[] = [...(row.school_projects ?? [])]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => a.order_index - b.order_index)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((p: any): SchoolProject => ({
      id: p.id as string,
      schoolId: (p.school_id as number) ?? row.id,
      title: p.title as string,
      description: (p.description as string | null) ?? null,
      imageUrl: (p.image_url as string | null) ?? null,
      linkUrl: (p.link_url as string | null) ?? null,
      orderIndex: p.order_index as number,
    }));

  return {
    id: row.id as number,
    name: row.name as string,
    slug: row.slug as string,
    type: row.type as string,
    district: row.district as string,
    percentile: (row.percentile as string) ?? "0",
    logo: (row.logo as string | null) ?? (row.name as string).slice(0, 2).toUpperCase(),
    color: (row.color as string | null) ?? "bg-gradient-to-br from-slate-700 to-slate-900",
    features: (row.features as string[]) ?? [],
    projects: (row.projects as string[]) ?? [],
    languages: (row.languages as string[]) ?? [],
    description: (row.description as string | null) ?? "",
    images: (row.images as string[]) ?? [],
    address: (row.address as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    website: (row.website as string | null) ?? null,
    placementType: (row.placement_type as string | null) ?? "yerel",
    educationType: (row.education_type as string | null) ?? "normal",
    boardingType: (row.boarding_type as string | null) ?? "yok",
    transportationInfo: (row.transportation_info as string | null) ?? null,
    schoolHoursStart: (row.school_hours_start as string | null) ?? null,
    schoolHoursEnd: (row.school_hours_end as string | null) ?? null,
    schoolHoursNote: (row.school_hours_note as string | null) ?? null,
    otherInfo: (row.other_info as string | null) ?? null,
    facilities,
    scores,
    quotas,
    scholarships,
    schoolProjects,
    vocationalFieldsWithBranches,
  };
}

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

  // Tablolar henüz oluşturulmamışsa (migration çalıştırılmamış) temel sorguyla dön
  if (error) {
    console.warn("[getSchoolWithDetails] Detay sorgusu başarısız, fallback kullanılıyor:", error.message);
    const { data: basicData, error: basicError } = await supabase
      .from("schools")
      .select(SCHOOL_BASIC_SELECT)
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (basicError || !basicData) return null;

    return mapRawToSchoolWithDetails({
      ...basicData,
      school_vocational_branches: [],
      school_facilities: [],
      school_scores: [],
      school_quotas: [],
      school_scholarships: [],
      school_projects: [],
    });
  }

  if (!data) return null;

  // Hangi alanların dolu geldiğini terminalde göster
  console.log("[getSchoolWithDetails] Ham sorgu sonucu:", {
    slug,
    school_facilities: (data as any).school_facilities?.length ?? 0,
    school_vocational_fields: (data as any).school_vocational_fields?.length ?? 0,
    school_vocational_branches: (data as any).school_vocational_branches?.length ?? 0,
    school_scores: (data as any).school_scores?.length ?? 0,
    school_quotas: (data as any).school_quotas?.length ?? 0,
    school_scholarships: (data as any).school_scholarships?.length ?? 0,
    school_projects: (data as any).school_projects?.length ?? 0,
  });

  return mapRawToSchoolWithDetails(data);
}

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
