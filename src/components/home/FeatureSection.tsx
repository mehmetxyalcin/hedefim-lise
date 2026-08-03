import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Landmark,
  Search,
} from "lucide-react";

// Birincil araç: tercih robotu (okul filtreleme). Bölümün baskın kartı.
const primary = {
  href: "/okullar",
  icon: Search,
  title: "Akıllı Tercih Robotu",
  description:
    "Yüzdelik diliminize, ikamet ettiğiniz ilçeye ve aradığınız fiziksel imkanlara en uygun liseyi saniyeler içinde bulun.",
};

// Destekleyici araçlar.
const secondary = [
  {
    href: "/alanlar",
    icon: Briefcase,
    title: "Meslek Alanlarını Keşfet",
    description:
      "Hangi meslek lisesinde hangi bölümler var? İlgi ve yeteneklerinize en uygun mesleki alanları detaylıca inceleyin.",
  },
  {
    href: "/okullar",
    icon: Landmark,
    title: "Proje Okullarını Tanı",
    description:
      "Akademik başarısı yüksek, özel eğitim programları uygulayan ve proje yürüten okulları yakından tanıyın.",
  },
];

// Tek nötr aksan: ikonlar dinlenmede slate, hover'da tek Exam Blue sinyali
// (DESIGN.md One-Signal Rule). Kart başına farklı renk yok.
const iconTileClasses =
  "text-slate-600 bg-slate-100 border-slate-200 group-hover:border-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-200/70";

type FeatureSectionProps = {
  schoolCount?: number | null;
  districtCount?: number | null;
  latestYear?: number | null;
};

export function FeatureSection({
  schoolCount = null,
  districtCount = null,
  latestYear = null,
}: FeatureSectionProps) {
  const PrimaryIcon = primary.icon;
  const hasStats = schoolCount != null && districtCount != null;

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-sky-50 via-cyan-50/55 to-white py-24">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-12 left-[-10%] h-72 w-72 rounded-full bg-cyan-200/25 blur-3xl" />
        <div className="absolute right-[-8%] bottom-10 h-72 w-72 rounded-full bg-blue-200/20 blur-3xl" />
      </div>
      <div className="relative z-10 container mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
            Tercih sürecinizi kolaylaştıran araçlar
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-700">
            Hedeflerinize en uygun liseyi bulmanız için ihtiyacınız olan tüm
            veriler ve rehberlik araçları tek bir platformda toplandı.
          </p>
        </div>

        {/* Asimetrik bento: baskın birincil araç + iki destekleyici kart */}
        <div className="grid gap-6 md:grid-cols-3 md:grid-rows-2">
          {/* Baskın kart */}
          <Link
            href={primary.href}
            className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm shadow-sky-900/5 ring-1 ring-slate-900/5 transition-all duration-300 hover:-translate-y-1.5 hover:border-cyan-200 hover:shadow-2xl hover:shadow-sky-900/10 md:col-span-2 md:row-span-2 md:p-10"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="absolute top-0 right-0 p-6 opacity-0 transition-all duration-300 group-hover:opacity-100">
              <ArrowUpRight className="h-6 w-6 text-blue-500" />
            </div>

            <div>
              <div
                className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border shadow-sm transition-all duration-300 group-hover:scale-110 ${iconTileClasses}`}
              >
                <PrimaryIcon className="h-8 w-8" />
              </div>
              <h3 className="mb-3 text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
                {primary.title}
              </h3>
              <p className="max-w-xl text-lg leading-relaxed text-slate-600">
                {primary.description}
              </p>
            </div>

            {hasStats && (
              <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t border-slate-100 pt-6">
                <div className="flex flex-col">
                  <span className="tabular text-3xl font-extrabold text-slate-900">
                    {schoolCount}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    okul
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="tabular text-3xl font-extrabold text-slate-900">
                    {districtCount}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    ilçe
                  </span>
                </div>
                {latestYear != null && (
                  <div className="flex flex-col">
                    <span className="tabular text-3xl font-extrabold text-slate-900">
                      {latestYear}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      yılı verisi
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 flex items-center text-sm font-semibold text-blue-700 transition-all group-hover:gap-2">
              Daha Fazla
              <ArrowRight className="ml-1 h-4 w-4" />
            </div>
          </Link>

          {/* Destekleyici kartlar */}
          {secondary.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.title}
                href={card.href}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm shadow-sky-900/5 ring-1 ring-slate-900/5 transition-all duration-300 hover:-translate-y-1.5 hover:border-cyan-200 hover:shadow-2xl hover:shadow-sky-900/10"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="absolute top-0 right-0 p-6 opacity-0 transition-all duration-300 group-hover:opacity-100">
                  <ArrowUpRight className="h-6 w-6 text-blue-500" />
                </div>
                <div
                  className={`mb-6 flex h-14 w-14 items-center justify-center rounded-xl border shadow-sm transition-all duration-300 group-hover:scale-110 ${iconTileClasses}`}
                >
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="mb-3 text-xl font-bold tracking-tight text-slate-900">
                  {card.title}
                </h3>
                <p className="mb-8 flex-grow leading-relaxed text-slate-600">
                  {card.description}
                </p>
                <div className="flex items-center text-sm font-semibold text-blue-700 transition-all group-hover:gap-2">
                  Daha Fazla
                  <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
