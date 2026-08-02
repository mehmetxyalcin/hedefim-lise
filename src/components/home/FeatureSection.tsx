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
  },
  {
    href: "/okullar",
    icon: Search,
    title: "Akıllı Tercih Robotu",
    description:
      "Yüzdelik diliminize, ikamet ettiğiniz ilçeye ve aradığınız fiziksel imkanlara en uygun liseyi saniyeler içinde bulun.",
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
// (DESIGN.md One-Signal Rule). Kart başına farklı renk yok — renk bilgi taşımaz.
const iconTileClasses =
  "text-slate-600 bg-slate-100 border-slate-200 group-hover:border-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-200/70";
const arrowClass = "text-blue-500";
const linkClass = "text-blue-700";

export function FeatureSection() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-sky-50 via-cyan-50/55 to-white py-24">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-12 left-[-10%] h-72 w-72 rounded-full bg-cyan-200/25 blur-3xl" />
        <div className="absolute right-[-8%] bottom-10 h-72 w-72 rounded-full bg-blue-200/20 blur-3xl" />
      </div>
      <div className="relative z-10 container mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <span className="mb-3 block text-xs font-bold uppercase tracking-wider text-blue-700">
            Platform Özellikleri
          </span>
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Tercih sürecinizi kolaylaştıran araçlar
          </h2>
          <p className="text-lg leading-relaxed text-slate-700">
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
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm shadow-sky-900/5 ring-1 ring-slate-900/5 transition-all duration-300 hover:-translate-y-1.5 hover:border-cyan-200 hover:shadow-2xl hover:shadow-sky-900/10"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="absolute top-0 right-0 p-6 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                  <ArrowUpRight className={`h-6 w-6 ${arrowClass}`} />
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
                <div
                  className={`flex items-center text-sm font-semibold transition-all group-hover:gap-2 ${linkClass}`}
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
