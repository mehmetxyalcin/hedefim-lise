import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Landmark,
  Search,
} from "lucide-react";

const cards = [
  {
    href: "/alanlar",
    icon: Briefcase,
    title: "Meslek Alanlarini Kesfet",
    description:
      "Hangi meslek lisesinde hangi bolumler var? Ilgi ve yeteneklerinize en uygun mesleki alanlari detaylica inceleyin.",
    tone: "orange",
  },
  {
    href: "/okullar",
    icon: Search,
    title: "Akilli Tercih Robotu",
    description:
      "Yuzdelik diliminize, ikamet ettiginiz ilceye ve aradiginiz fiziksel imkanlara en uygun liseyi saniyeler icinde bulun.",
    tone: "blue",
  },
  {
    href: "/okullar",
    icon: Landmark,
    title: "Proje Okullarini Tani",
    description:
      "Akademik basarisi yuksek, ozel egitim programlari uygulayan ve proje yuru ten okullari yakindan taniyin.",
    tone: "emerald",
  },
];

const toneClasses = {
  orange:
    "text-orange-600 bg-orange-50 border-orange-100 group-hover:bg-orange-500 group-hover:text-white",
  blue:
    "text-blue-600 bg-blue-50 border-blue-100 group-hover:bg-blue-600 group-hover:text-white",
  emerald:
    "text-emerald-600 bg-emerald-50 border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white",
};

const arrowClasses = {
  orange: "text-orange-400",
  blue: "text-blue-400",
  emerald: "text-emerald-400",
};

const linkClasses = {
  orange: "text-orange-600",
  blue: "text-blue-600",
  emerald: "text-emerald-600",
};

export function FeatureSection() {
  return (
    <div className="relative overflow-hidden bg-slate-50 py-24">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <span className="mb-3 block text-xs font-bold uppercase tracking-wider text-blue-600">
            Platform Ozellikleri
          </span>
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Tercih surecinizi kolaylastiran araclar
          </h2>
          <p className="text-lg leading-relaxed text-slate-500">
            Hedeflerinize en uygun liseyi bulmaniz icin ihtiyaciniz olan tum
            veriler ve rehberlik araclari tek bir platformda toplandi.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.title}
                href={card.href}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="absolute top-0 right-0 p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <ArrowUpRight
                    className={`h-6 w-6 ${arrowClasses[card.tone as keyof typeof arrowClasses]}`}
                  />
                </div>
                <div
                  className={`mb-6 flex h-14 w-14 items-center justify-center rounded-xl border transition-all duration-300 group-hover:scale-110 ${toneClasses[card.tone as keyof typeof toneClasses]}`}
                >
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="mb-3 text-xl font-bold tracking-tight text-slate-900">
                  {card.title}
                </h3>
                <p className="mb-8 flex-grow leading-relaxed text-slate-500">
                  {card.description}
                </p>
                <div
                  className={`flex items-center text-sm font-semibold transition-all group-hover:gap-2 ${linkClasses[card.tone as keyof typeof linkClasses]}`}
                >
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
