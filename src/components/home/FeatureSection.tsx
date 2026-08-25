import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

// Kılavuz dizini grameri: ikon karosu yerine mono bölüm kodu + Archivo başlık.
// Birincil araç: tercih robotu (okul filtreleme). Bölümün baskın kartı.
const primary = {
  href: "/okullar",
  code: "01",
  title: "Akıllı Tercih Robotu",
  description:
    "Yüzdelik diliminize, ikamet ettiğiniz ilçeye ve aradığınız fiziksel imkanlara en uygun liseyi saniyeler içinde bulun.",
  cta: "Tercih robotunu aç",
};

// Destekleyici araçlar.
const secondary = [
  {
    href: "/alanlar",
    code: "02 — alan rehberi",
    title: "Meslek Alanlarını Keşfet",
    description:
      "Hangi meslek lisesinde hangi bölümler var? İlgi ve yeteneklerinize en uygun mesleki alanları detaylıca inceleyin.",
  },
  {
    href: "/okullar",
    code: "03 — proje okulları",
    title: "Proje Okullarını Tanı",
    description:
      "Akademik başarısı yüksek, özel eğitim programları uygulayan ve proje yürüten okulları yakından tanıyın.",
  },
];

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
  // Kanıt figürleri artık burada: baskın kartın boşluğunu doldurur ve sayılar
  // soyut bir bant yerine tanıttıkları aracın kanıtı olarak okunur.
  const hasStats = schoolCount != null && districtCount != null;

  return (
    <div className="border-t border-[var(--line)] pt-16 pb-16">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="mb-10 max-w-2xl">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-[var(--ink)] md:text-4xl">
            Tercih sürecinizi kolaylaştıran araçlar
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-[var(--ink-soft)]">
            Hedeflerinize en uygun liseyi bulmanız için ihtiyacınız olan tüm
            veriler ve rehberlik araçları tek bir yerde toplandı.
          </p>
        </div>

        {/* Asimetrik bento: baskın birincil araç + iki destekleyici kart */}
        <div className="grid gap-5 md:grid-cols-3 md:grid-rows-2">
          {/* Baskın kart */}
          <Link
            href={primary.href}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--doc-panel)] p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--teal)] md:col-span-2 md:row-span-2 md:p-10"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-[var(--teal)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="absolute top-0 right-0 p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <ArrowUpRight className="h-6 w-6 text-[var(--teal)]" />
            </div>

            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--ink-faint)] transition-colors group-hover:text-[var(--teal)]">
                {primary.code} — birincil araç
              </p>
              <h3 className="mt-4 mb-3 font-display text-2xl font-extrabold tracking-tight text-[var(--ink)] md:text-3xl">
                {primary.title}
              </h3>
              <p className="max-w-xl text-lg leading-relaxed text-[var(--ink-soft)]">
                {primary.description}
              </p>
            </div>

            {/* Kanıt + eylem tek blok: kartın boşluğu tek bir nefes olarak kalsın,
                sayılarla CTA arasında ikinci bir boşluk açılmasın. */}
            <div className="mt-10">
              {hasStats && (
                <dl className="grid grid-cols-2 gap-x-8 gap-y-8 border-t border-[var(--line)] pt-8 sm:grid-cols-3">
                  <Figure value={schoolCount} label="aktif lise kaydı" />
                  <Figure value={districtCount} label="ilçe kapsanıyor" />
                  {latestYear != null && (
                    <Figure value={latestYear} label="yerleştirme verisi" />
                  )}
                </dl>
              )}

              <div className="mt-8 flex items-center gap-1.5 font-display text-sm font-bold tracking-wide text-[var(--teal)] transition-all group-hover:gap-2.5">
                {primary.cta}
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </Link>

          {/* Destekleyici kartlar */}
          {secondary.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--doc-panel)] p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--teal)]"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-[var(--teal)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="absolute top-0 right-0 p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <ArrowUpRight className="h-6 w-6 text-[var(--teal)]" />
              </div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--ink-faint)] transition-colors group-hover:text-[var(--teal)]">
                {card.code}
              </p>
              <h3 className="mt-4 mb-3 font-display text-xl font-bold tracking-tight text-[var(--ink)]">
                {card.title}
              </h3>
              <p className="mb-8 flex-grow leading-relaxed text-[var(--ink-soft)]">
                {card.description}
              </p>
              <div className="flex items-center gap-1.5 font-display text-sm font-bold tracking-wide text-[var(--teal)] transition-all group-hover:gap-2.5">
                Daha Fazla
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>

        {/* Muafiyet notu — bölümün dipnotu; tıklanabilir kartın içine girmez. */}
        <p className="mt-8 max-w-2xl font-mono text-[11px] leading-relaxed text-[var(--ink-faint)]">
          Bağımsız bir rehberdir; bilgiler yalnızca bilgilendirme amaçlıdır ve
          resmi MEB kaynaklarından teyit edilmelidir.
        </p>
      </div>
    </div>
  );
}

function Figure({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col">
      <dt className="order-2 mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
        {label}
      </dt>
      <dd className="tabular order-1 font-display text-4xl font-extrabold leading-none tracking-tight text-[var(--ink)] md:text-5xl">
        {value}
      </dd>
    </div>
  );
}
