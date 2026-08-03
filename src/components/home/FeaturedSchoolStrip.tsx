import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

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
  if (school.percentile != null) {
    return { value: `%${school.percentile.toFixed(2)}`, label: "Yüzdelik Dilim" };
  }
  if (school.obpScore != null) {
    return { value: school.obpScore.toFixed(2), label: "OBP Puanı" };
  }
  return null;
}

// Landing'de "yerel güncel veri" farklılaştırıcısını kanıtlayan tek gerçek
// okul kartı. Kapsam dışı: FeatureSection ve Two-Worlds/cyan düzeltmesi.
export function FeaturedSchoolStrip({ school }: { school: FeaturedSchool }) {
  const score = scoreDisplay(school);

  return (
    <section className="bg-slate-50 py-12">
      <div className="container mx-auto max-w-5xl px-6">
        <p className="mb-4 text-sm font-medium text-slate-500">
          Mersin&apos;in en rekabetçi okulu
        </p>

        <div className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge tone="blue">{school.type}</Badge>
              <Badge tone="slate">
                <MapPin className="h-3 w-3" />
                {school.district}
              </Badge>
            </div>
            <Link href={`/okullar/${school.slug}`}>
              <h3 className="text-xl font-bold tracking-tight text-slate-900 transition-colors hover:text-blue-600 sm:text-2xl">
                {school.name}
              </h3>
            </Link>
            <p className="mt-2 text-xs text-slate-400">
              Veriler MEB ve okul kaynaklarından derlenmiştir.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-6 border-t border-slate-100 pt-5 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
            {score && (
              <div className="flex flex-col items-center text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {score.label}
                </span>
                <span className="tabular text-3xl font-extrabold text-slate-900">
                  {score.value}
                </span>
                <span className="mt-1 text-[10px] text-slate-400">
                  {school.year} yerleştirme verisi
                </span>
              </div>
            )}
            <Link
              href={`/okullar/${school.slug}`}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-600/40"
            >
              Detaylı İncele
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-5 text-center">
          <Link
            href="/okullar"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 transition-colors hover:text-blue-800"
          >
            Tüm okullara göz at
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
