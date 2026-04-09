import { mapSchool, mapVocationalField } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { SchoolList } from "@/components/schools/SchoolList";

export default async function OkullarPage() {
  const supabase = await createClient();
  const [{ data: schoolsData, error: schoolsError }, { data: fieldsData, error: fieldsError }] =
    await Promise.all([
      supabase.from("schools").select("*").eq("is_active", true).order("name"),
      supabase.from("vocational_fields").select("*").order("title"),
    ]);

  if (schoolsError || fieldsError) {
    return <h1>Veriler yüklenemedi.</h1>;
  }

  return (
    <SchoolList
      schools={(schoolsData ?? []).map(mapSchool)}
      vocationalFields={(fieldsData ?? []).map(mapVocationalField)}
    />
  );
}
