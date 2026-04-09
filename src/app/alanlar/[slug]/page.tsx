import {
  extractSchoolsFromVocationalField,
  mapVocationalField,
} from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { VocationalDetail } from "@/components/vocational/VocationalDetail";

type AlanDetayPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function AlanDetayPage({
  params,
}: AlanDetayPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vocational_fields")
    .select("*, school_vocational_fields(school_id, schools(*))")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    return <h1>Alan bulunamadı.</h1>;
  }

  return (
    <VocationalDetail
      field={mapVocationalField(data)}
      relatedSchools={extractSchoolsFromVocationalField(data)}
    />
  );
}
