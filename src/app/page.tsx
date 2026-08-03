import type { Metadata } from "next";
import { FeatureSection } from "@/components/home/FeatureSection";
import {
  FeaturedSchoolStrip,
  type FeaturedSchool,
} from "@/components/home/FeaturedSchoolStrip";
import { Hero } from "@/components/home/Hero";
import { createStaticClient } from "@/lib/supabase/static";

export const metadata: Metadata = {
  title: "Hedefim Lise",
  description:
    "Mersin lise tercih süreci için okulları, meslek alanlarını ve tercih rehberliğini tek yerde keşfedin.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Hedefim Lise",
    description:
      "Mersin'deki liseleri ve meslek alanlarını keşfedin, tercih sürecinizi güvenilir bilgilerle yönetin.",
    url: "/",
  },
};

// Hero sayıları için canlı veri gerekmez; tercih döneminde landing hızı kritik.
export const revalidate = 86400; // 24 saat (ISR)

type LandingData = {
  schoolCount: number | null;
  districtCount: number | null;
  latestYear: number | null;
  featured: FeaturedSchool | null;
};

async function getLandingData(): Promise<LandingData> {
  try {
    const supabase = createStaticClient();

    // Aktif okullar: toplam sayı + distinct ilçe (ikisi de veriden)
    const { data: activeRows } = await supabase
      .from("schools")
      .select("id, district")
      .eq("is_active", true);
    const active = activeRows ?? [];
    const schoolCount = active.length > 0 ? active.length : null;
    const districtCount =
      active.length > 0
        ? new Set(active.map((r) => r.district).filter(Boolean)).size
        : null;
    const activeIds = new Set(active.map((r) => r.id as number));

    // Son yıl: metin bu değere bağlanır (2025 dönerse "2025 verileri")
    const { data: yearRows } = await supabase
      .from("school_scores")
      .select("year")
      .order("year", { ascending: false })
      .limit(1);
    const latestYear = (yearRows?.[0]?.year as number | undefined) ?? null;

    // Öne çıkan okul: son yılın en rekabetçi aktif okulu.
    // LGS'de düşük yüzdelik dilimi = daha rekabetçi → ascending (en küçük önce).
    let featured: FeaturedSchool | null = null;
    if (latestYear != null) {
      const { data: scoreRows } = await supabase
        .from("school_scores")
        .select("school_id, percentile, obp_score")
        .eq("year", latestYear)
        .not("percentile", "is", null)
        .order("percentile", { ascending: true })
        .limit(50);
      const top = (scoreRows ?? []).find((s) =>
        activeIds.has(s.school_id as number),
      );
      if (top) {
        const { data: schoolRow } = await supabase
          .from("schools")
          .select("name, slug, district, type")
          .eq("id", top.school_id)
          .single();
        if (schoolRow) {
          featured = {
            name: schoolRow.name as string,
            slug: schoolRow.slug as string,
            district: schoolRow.district as string,
            type: schoolRow.type as string,
            percentile: top.percentile as number | null,
            obpScore: top.obp_score as number | null,
            year: latestYear,
          };
        }
      }
    }

    return { schoolCount, districtCount, latestYear, featured };
  } catch {
    // Veri/ağ yoksa (ör. build ortamı DB'ye erişemiyorsa) zarif düşüş:
    // Hero rakamsız chip'lerine döner, şerit gizlenir.
    return {
      schoolCount: null,
      districtCount: null,
      latestYear: null,
      featured: null,
    };
  }
}

export default async function Home() {
  const { schoolCount, districtCount, latestYear, featured } =
    await getLandingData();

  return (
    <>
      <Hero
        schoolCount={schoolCount}
        districtCount={districtCount}
        latestYear={latestYear}
      />
      {featured && <FeaturedSchoolStrip school={featured} />}
      <FeatureSection />
    </>
  );
}
