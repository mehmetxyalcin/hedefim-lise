import type { Metadata } from "next";
import { createVisitorClient } from "@/lib/supabase/visitor";
import { StatisticsBulletin } from "@/components/statistics/StatisticsBulletin";
import {
  mersinSchoolStatistics2026,
  STATISTICS_SOURCE,
} from "@/data/mersinSchoolStatistics2026";
import { mergeLiveStatistics, type LiveSchoolRow } from "@/lib/school-statistics";

export const metadata: Metadata = {
  title: "İstatistikler",
  description:
    "Mersin'de LGS ile öğrenci alan Anadolu, fen, sosyal bilimler ve Anadolu imam hatip liselerinin taban yüzdelik dilimleri, LGS puanları ve kontenjanları.",
  alternates: {
    canonical: "/istatistikler",
  },
};

// İstatistik bülteni, anasayfanın belge dünyasında (.landing) durur: afiş
// başlık, altında bir hairline, sonra 8 sütunluk dilim ekseni ve 4 sütunluk
// künye. Puanlar her istekte veritabanından okunur; okunamazsa yedek kopya.
export default async function StatisticsPage() {
  const supabase = await createVisitorClient();
  const { data, error } = await supabase
    .from("schools")
    .select(
      "slug, school_scores(year, percentile, lgs_score, vocational_field_id, program), school_quotas(year, sinavli_count)",
    )
    .in(
      "slug",
      mersinSchoolStatistics2026.map((school) => school.slug),
    );

  const live = !error && Array.isArray(data);
  const schools = live
    ? mergeLiveStatistics(mersinSchoolStatistics2026, data as LiveSchoolRow[])
    : mersinSchoolStatistics2026;

  return (
    <div className="landing">
      <section className="container mx-auto max-w-6xl px-6 pt-8 pb-8 md:pt-10">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-12">
          <h1 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.02] font-extrabold tracking-[-0.02em] text-balance text-[var(--ink)] lg:col-span-7">
            Hangi lise, hangi{" "}
            <span className="text-[var(--teal)]">dilimde?</span>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-[var(--ink-soft)] md:text-xl lg:col-span-5 lg:pb-2">
            Mersin&apos;de LGS ile öğrenci alan Anadolu, fen, sosyal bilimler ve
            imam hatip liselerinin taban dilimleri, puanları ve kontenjanları,
            yıl yıl.
          </p>
        </div>
      </section>

      <div className="border-t border-[var(--line)]">
        <StatisticsBulletin schools={schools} source={STATISTICS_SOURCE} live={live} />
      </div>
    </div>
  );
}
