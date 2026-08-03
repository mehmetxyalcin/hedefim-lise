import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

export type FeaturedSchool = {
  name: string;
  slug: string;
  district: string;
  type: string;
  percentile: number | null;
  obpScore: number | null;
  year: number;
};

function scoreDisplay(
  school: FeaturedSchool,
): { value: string; label: string } | null {
  // Türkçe ondalık: belge tek ayraç kullanır (virgül).
  if (school.percentile != null) {
    return {
      value: `%${school.percentile.toFixed(2).replace(".", ",")}`,
      label: "Yüzdelik Dilim",
    };
  }
  if (school.obpScore != null) {
    return {
      value: school.obpScore.toFixed(2).replace(".", ","),
      label: "OBP Puanı",
    };
  }
  return null;
}

// Ölçeğin en rekabetçi ucundaki gerçek okul — data-viz'i somutlaştırır.
// Yön #3 paleti/tipografisi; kart dili "belge girişi" gibi.
export function FeaturedSchoolStrip({ school }: { school: FeaturedSchool }) {
  const score = scoreDisplay(school);

  return (
    <section className="border-t border-[var(--line)]">
      <div className="container mx-auto max-w-6xl px-6 py-16">
        <p className="mb-5 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--ink-faint)]">
          Ölçeğin en rekabetçi ucu
        </p>

        <div className="flex flex-col gap-8 rounded-2xl border border-[var(--line)] bg-[var(--doc-panel)] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="min-w-0 flex-1">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-[var(--teal-tint)] px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--teal-deep)]">
                {school.type}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-[var(--line)] px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">
                <MapPin className="h-3 w-3" />
                {school.district}
              </span>
            </div>
            <Link href={`/okullar/${school.slug}`}>
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--ink)] transition-colors hover:text-[var(--teal)] sm:text-3xl">
                {school.name}
              </h2>
            </Link>
            <p className="mt-3 font-mono text-[11px] text-[var(--ink-faint)]">
              Veriler MEB ve okul kaynaklarından derlenmiştir.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-8 border-t border-[var(--line)] pt-6 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-8">
            {score && (
              <div className="flex flex-col">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">
                  {score.label}
                </span>
                <span className="tabular font-display text-4xl font-extrabold leading-none text-[var(--teal)]">
                  {score.value}
                </span>
                <span className="mt-1 font-mono text-[10px] text-[var(--ink-faint)]">
                  {school.year} yerleştirme verisi
                </span>
              </div>
            )}
            <Link
              href={`/okullar/${school.slug}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--teal)] px-5 py-3 font-display text-sm font-bold tracking-wide text-white transition-colors hover:bg-[var(--teal-deep)]"
            >
              Detaylı İncele
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-6">
          <Link
            href="/okullar"
            className="inline-flex items-center gap-1.5 font-display text-sm font-bold tracking-wide text-[var(--teal)] transition-colors hover:text-[var(--teal-deep)]"
          >
            Tüm okullara göz at
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
