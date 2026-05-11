import type { Metadata } from "next";
import { mapVocationalField } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { VocationalAtlas } from "@/components/vocational/VocationalAtlas";

export const metadata: Metadata = {
  title: "Meslek Alanları",
  description:
    "Mesleki ve teknik liselerdeki alanları, becerileri ve kariyer yollarını keşfedin.",
  alternates: {
    canonical: "/alanlar",
  },
  openGraph: {
    title: "Meslek Alanları | Hedefim Lise",
    description:
      "Meslek alanlarını inceleyin, ilgi ve yeteneklerinize uygun eğitim yolunu planlayın.",
    url: "/alanlar",
  },
};

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
