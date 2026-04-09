import type { School } from "@/types/school";
import type { VocationalField } from "@/types/vocationalField";

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
    vocationalFields:
      row.school_vocational_fields
        ?.map((item) => item.vocational_field_id)
        .filter(Boolean) ?? [],
  };
}

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
