import type { Metadata } from "next";
import { mapSchool, mapVocationalField } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { SchoolList } from "@/components/schools/SchoolList";

export const metadata: Metadata = {
  title: "Okullar",
  description:
    "Mersin'deki liseleri ilçe, okul türü ve meslek alanlarına göre inceleyin.",
  alternates: {
    canonical: "/okullar",
  },
  openGraph: {
    title: "Okullar | Hedefim Lise",
    description:
      "Mersin'deki liseleri karşılaştırın ve tercih süreciniz için doğru okulu keşfedin.",
    url: "/okullar",
  },
};

type Props = {
  searchParams?: Promise<{ ilce?: string; tur?: string }>;
};

export default async function OkullarPage({ searchParams }: Props) {
  const { ilce, tur } = searchParams ? await searchParams : {};
  const supabase = await createClient();
  const [{ data: schoolsData, error: schoolsError }, { data: fieldsData, error: fieldsError }] =
    await Promise.all([
      supabase
        .from("schools")
        .select("*, school_scores(id, school_id, year, obp_score, lgs_score, percentile)")
        .eq("is_active", true)
        .order("name"),
      supabase.from("vocational_fields").select("*").order("title"),
    ]);

  if (schoolsError || fieldsError) {
    return <h1>Veriler yüklenemedi.</h1>;
  }

  return (
    <SchoolList
      schools={(schoolsData ?? []).map(mapSchool)}
      vocationalFields={(fieldsData ?? []).map(mapVocationalField)}
      initialDistrict={ilce ?? ""}
      initialType={tur ?? ""}
    />
  );
}
