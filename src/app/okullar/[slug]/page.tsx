import {
  extractVocationalFieldsFromSchool,
  mapSchool,
} from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { SchoolDetail } from "@/components/schools/SchoolDetail";

type OkulDetayPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function OkulDetayPage({
  params,
}: OkulDetayPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("schools")
    .select("*, school_vocational_fields(vocational_field_id, vocational_fields(*))")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    return <h1>Okul bulunamadı.</h1>;
  }

  return (
    <SchoolDetail
      school={mapSchool(data)}
      vocationalFields={extractVocationalFieldsFromSchool(data)}
    />
  );
}
