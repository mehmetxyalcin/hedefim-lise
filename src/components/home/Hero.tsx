import { PercentileScale } from "./PercentileScale";

type HeroProps = {
  latestYear?: number | null;
  percentiles?: number[];
};

// Yön #3 — Yerleştirme Kılavuzu. Belge künyesi + afiş ölçeğinde başlık +
// yüzdelik ekseni (sahiplenilmiş data-viz, aynı zamanda tek arama şeridi).
// Kanıt figürleri ve muafiyet notu FeatureSection'a taşındı: landing'de
// /okullar'a giden TEK kontrol yüzeyi kalsın.
export function Hero({ latestYear = null, percentiles = [] }: HeroProps) {
  return (
    <section className="relative">
      {/* Belge künyesi */}
      <div className="border-b border-[var(--line)]">
        <div className="container mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="font-display text-sm font-extrabold tracking-tight text-[var(--ink)]">
            Hedefim Lise
            {/* Dar ekranda künye sarıp yıl etiketiyle iç içe geçiyordu; alt
                başlık orada gizlenir, künyenin iki ucu tek satırda kalır. */}
            <span className="ml-2 hidden font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--ink-faint)] sm:inline">
              Mersin lise tercih rehberi
            </span>
          </span>
          {latestYear != null && (
            <span className="tabular font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--ink-faint)]">
              {latestYear} verileri
            </span>
          )}
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-6 pt-14 pb-16 md:pt-20 md:pb-20">
        {/* Afiş başlık — mekanizma; sayı iddiası araç kartındaki kanıt figürlerinde */}
        <h1 className="font-display text-[clamp(2.5rem,7vw,5.5rem)] font-extrabold leading-[1.02] tracking-[-0.02em] text-[var(--ink)]">
          Mersin liselerini
          <br />
          tek bir <span className="text-[var(--teal)]">ölçekte</span> gör.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--ink-soft)] md:text-xl">
          MEB ve okul kaynaklarından derlenen yerleştirme verileriyle: yüzdelik
          aralığını seç, ilçe ve okul türüyle daralt, listene başla.
        </p>

        {/* Yüzdelik ekseni + arama şeridi — sahiplenilmiş görsel fikir */}
        <div className="mt-10">
          <PercentileScale percentiles={percentiles} latestYear={latestYear} />
        </div>
      </div>
    </section>
  );
}
