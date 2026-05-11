import type { School } from "@/types/school";
import type { VocationalField } from "@/types/vocationalField";
import type {
  Facility,
  SchoolProject,
  SchoolQuota,
  SchoolScholarship,
  SchoolScore,
  SchoolWithDetails,
  VocationalBranch,
  VocationalFieldWithBranches,
} from "@/types/schoolDetail";

// ─────────────────────────────────────────────────────────────────
// Satır tipleri (Supabase'den gelen ham veri)
// ─────────────────────────────────────────────────────────────────

type SchoolRow = {
  id: number;
  slug: string;
  name: string;
  type: string;
  district: string;
  percentile: string;
  logo: string | null;
  color: string | null;
  description: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  images: string[] | null;
  features: string[] | null;
  projects: string[] | null;
  languages: string[] | null;
  is_active?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  placement_type?: string | null;
  education_type?: string | null;
  boarding_type?: string | null;
  transportation_info?: string | null;
  school_hours_start?: string | null;
  school_hours_end?: string | null;
  school_hours_note?: string | null;
  other_info?: string | null;
  school_vocational_fields?: Array<{
    vocational_field_id: number;
    vocational_fields?: VocationalFieldRow | null;
  }>;
};

type VocationalFieldRow = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  skills: string | null;
  career: string | null;
  branches: string[] | null;
  school_vocational_fields?: Array<{
    school_id: number;
    schools?: SchoolRow | null;
  }>;
};

type FacilityRow = {
  id: string;
  name: string;
  icon: string | null;
  is_default: boolean;
};

type VocationalBranchRow = {
  id: string;
  vocational_field_id: number;
  name: string;
};

type SchoolScoreRow = {
  id: string;
  school_id: number;
  year: number;
  obp_score: number | null;
  lgs_score: number | null;
  percentile: number | null;
};

type SchoolQuotaRow = {
  id: string;
  school_id: number;
  year: number;
  sinavli_count: number | null;
  sinavsiz_count: number | null;
};

type SchoolScholarshipRow = {
  id: string;
  school_id: number;
  title: string;
  description: string | null;
  amount_info: string | null;
  order_index: number;
};

type SchoolProjectRow = {
  id: string;
  school_id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  order_index: number;
};

// ─────────────────────────────────────────────────────────────────
// Mapper'lar
// ─────────────────────────────────────────────────────────────────

export function mapVocationalField(row: VocationalFieldRow): VocationalField {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? "",
    skills: row.skills ?? "",
    career: row.career ?? "",
    branches: row.branches ?? [],
    schools:
      row.school_vocational_fields?.map((item) => item.school_id).filter(Boolean) ??
      [],
  };
}

export function mapSchool(row: SchoolRow): School {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    type: row.type,
    district: row.district,
    percentile: row.percentile,
    logo: row.logo ?? row.name.slice(0, 2).toUpperCase(),
    color: row.color ?? "bg-gradient-to-br from-slate-700 to-slate-900",
    features: row.features ?? [],
    projects: row.projects ?? [],
    languages: row.languages ?? [],
    description: row.description ?? "",
    images: row.images ?? [],
    address: row.address ?? null,
    phone: row.phone ?? null,
    website: row.website ?? null,
    isActive: row.is_active ?? true,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    vocationalFields:
      row.school_vocational_fields
        ?.map((item) => item.vocational_field_id)
        .filter(Boolean) ?? [],
    placementType: row.placement_type ?? "yerel",
    educationType: row.education_type ?? "normal",
    boardingType: row.boarding_type ?? "yok",
    transportationInfo: row.transportation_info ?? null,
    schoolHoursStart: row.school_hours_start ?? null,
    schoolHoursEnd: row.school_hours_end ?? null,
    schoolHoursNote: row.school_hours_note ?? null,
    otherInfo: row.other_info ?? null,
  };
}

export function mapFacility(row: FacilityRow): Facility {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    isDefault: row.is_default,
  };
}

export function mapVocationalBranch(row: VocationalBranchRow): VocationalBranch {
  return {
    id: row.id,
    vocationalFieldId: row.vocational_field_id,
    name: row.name,
  };
}

export function mapSchoolScore(row: SchoolScoreRow): SchoolScore {
  return {
    id: row.id,
    schoolId: row.school_id,
    year: row.year,
    obpScore: row.obp_score,
    lgsScore: row.lgs_score,
    percentile: row.percentile,
  };
}

export function mapSchoolQuota(row: SchoolQuotaRow): SchoolQuota {
  return {
    id: row.id,
    schoolId: row.school_id,
    year: row.year,
    sinavliCount: row.sinavli_count,
    sinavsizCount: row.sinavsiz_count,
  };
}

export function mapSchoolScholarship(row: SchoolScholarshipRow): SchoolScholarship {
  return {
    id: row.id,
    schoolId: row.school_id,
    title: row.title,
    description: row.description,
    amountInfo: row.amount_info,
    orderIndex: row.order_index,
  };
}

export function mapSchoolProject(row: SchoolProjectRow): SchoolProject {
  return {
    id: row.id,
    schoolId: row.school_id,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    linkUrl: row.link_url,
    orderIndex: row.order_index,
  };
}

// ─────────────────────────────────────────────────────────────────
// Mevcut extract helper'ları
// ─────────────────────────────────────────────────────────────────

export function extractVocationalFieldsFromSchool(row: SchoolRow) {
  return (
    row.school_vocational_fields
      ?.map((item) => item.vocational_fields)
      .filter((field): field is VocationalFieldRow => Boolean(field))
      .map(mapVocationalField) ?? []
  );
}

export function extractSchoolsFromVocationalField(row: VocationalFieldRow) {
  return (
    row.school_vocational_fields
      ?.map((item) => item.schools)
      .filter((school): school is SchoolRow => Boolean(school))
      .filter((school) => school.is_active !== false)
      .map(mapSchool) ?? []
  );
}

// ─────────────────────────────────────────────────────────────────
// SchoolWithDetails mapper (getSchoolWithDetails için)
// Supabase nested select dönüşü dinamik olduğu için any kullanılıyor
// ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSchoolWithDetails(row: any): SchoolWithDetails {
  const facilities: Facility[] = (row.school_facilities ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((sf: any) => sf.facilities)
    .filter(Boolean)
    .map(mapFacility);

  const scores: SchoolScore[] = (row.school_scores ?? [])
    .map(mapSchoolScore)
    .sort((a: SchoolScore, b: SchoolScore) => b.year - a.year);

  const quotas: SchoolQuota[] = (row.school_quotas ?? [])
    .map(mapSchoolQuota)
    .sort((a: SchoolQuota, b: SchoolQuota) => b.year - a.year);

  const scholarships: SchoolScholarship[] = (row.school_scholarships ?? [])
    .map(mapSchoolScholarship)
    .sort((a: SchoolScholarship, b: SchoolScholarship) => a.orderIndex - b.orderIndex);

  const schoolProjects: SchoolProject[] = (row.school_projects ?? [])
    .map(mapSchoolProject)
    .sort((a: SchoolProject, b: SchoolProject) => a.orderIndex - b.orderIndex);

  const vocationalFieldsWithBranches: VocationalFieldWithBranches[] = (
    row.school_vocational_fields ?? []
  )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((svf: any) => svf.vocational_fields)
    .filter(Boolean)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((field: any) => {
      const selectedBranches: VocationalBranch[] = (
        field.school_vocational_branches ?? []
      )
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((svb: any) => svb.vocational_branches)
        .filter(Boolean)
        .map(mapVocationalBranch);

      return {
        id: field.id as number,
        title: field.title as string,
        slug: field.slug as string,
        selectedBranches,
      };
    });

  const base = mapSchool(row as SchoolRow);

  return {
    id: base.id,
    name: base.name,
    slug: base.slug,
    type: base.type,
    district: base.district,
    percentile: base.percentile,
    logo: base.logo,
    color: base.color,
    features: base.features,
    projects: base.projects,
    languages: base.languages,
    description: base.description,
    images: base.images,
    address: base.address ?? null,
    phone: base.phone ?? null,
    website: base.website ?? null,
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
