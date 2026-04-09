import { mapVocationalField } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { VocationalAtlas } from "@/components/vocational/VocationalAtlas";

export default async function AlanlarPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vocational_fields")
    .select("*")
    .order("title");

  if (error) {
    return <h1>Alanlar yüklenemedi.</h1>;
  }

  return <VocationalAtlas vocationalFields={(data ?? []).map(mapVocationalField)} />;
}
