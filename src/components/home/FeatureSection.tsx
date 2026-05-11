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
    title: "Meslek Alanlarını Keşfet",
    description:
      "Hangi meslek lisesinde hangi bölümler var? İlgi ve yeteneklerinize en uygun mesleki alanları detaylıca inceleyin.",
    tone: "orange",
  },
  {
    href: "/okullar",
    icon: Search,
    title: "Akıllı Tercih Robotu",
    description:
      "Yüzdelik diliminize, ikamet ettiğiniz ilçeye ve aradığınız fiziksel imkanlara en uygun liseyi saniyeler içinde bulun.",
    tone: "blue",
  },
  {
    href: "/okullar",
    icon: Landmark,
    title: "Proje Okullarını Tanı",
    description:
      "Akademik başarısı yüksek, özel eğitim programları uygulayan ve proje yürüten okulları yakından tanıyın.",
    tone: "emerald",
  },
];

const toneClasses = {
  orange:
    "text-orange-600 bg-orange-50 border-orange-100 shadow-orange-100/70 group-hover:border-orange-300 group-hover:bg-gradient-to-br group-hover:from-amber-400 group-hover:to-rose-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-orange-200/70",
  blue:
    "text-cyan-700 bg-cyan-50 border-cyan-100 shadow-cyan-100/70 group-hover:border-cyan-300 group-hover:bg-gradient-to-br group-hover:from-cyan-400 group-hover:to-sky-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-cyan-200/70",
  emerald:
    "text-emerald-600 bg-emerald-50 border-emerald-100 shadow-emerald-100/70 group-hover:border-emerald-300 group-hover:bg-gradient-to-br group-hover:from-emerald-400 group-hover:to-cyan-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-emerald-200/70",
};

const arrowClasses = {
  orange: "text-orange-500",
  blue: "text-cyan-500",
  emerald: "text-emerald-500",
};

const linkClasses = {
  orange: "text-orange-600 group-hover:text-rose-600",
  blue: "text-cyan-700 group-hover:text-sky-700",
  emerald: "text-emerald-600",
};

export function FeatureSection() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-sky-50 via-cyan-50/55 to-white py-24">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-12 left-[-10%] h-72 w-72 rounded-full bg-cyan-200/35 blur-3xl" />
        <div className="absolute right-[-8%] bottom-10 h-72 w-72 rounded-full bg-orange-200/35 blur-3xl" />
      </div>
      <div className="relative z-10 container mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <span className="mb-3 block text-xs font-bold uppercase tracking-wider text-cyan-700">
            Platform Özellikleri
          </span>
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Tercih sürecinizi kolaylaştıran araçlar
          </h2>
          <p className="text-lg leading-relaxed text-slate-500">
            Hedeflerinize en uygun liseyi bulmanız için ihtiyacınız olan tüm
            veriler ve rehberlik araçları tek bir platformda toplandı.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.title}
                href={card.href}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-8 shadow-sm shadow-sky-900/5 ring-1 ring-slate-900/5 backdrop-blur transition-all duration-300 hover:-translate-y-1.5 hover:border-cyan-100 hover:bg-white hover:shadow-2xl hover:shadow-sky-900/10"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-sky-400 to-orange-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="absolute top-0 right-0 p-6 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                  <ArrowUpRight
                    className={`h-6 w-6 ${arrowClasses[card.tone as keyof typeof arrowClasses]}`}
                  />
                </div>
                <div
                  className={`mb-6 flex h-14 w-14 items-center justify-center rounded-xl border shadow-sm transition-all duration-300 group-hover:scale-110 ${toneClasses[card.tone as keyof typeof toneClasses]}`}
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
