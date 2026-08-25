import { ScoreScale } from "./ScoreScale";

type HeroProps = {
  latestYear?: number | null;
  percentiles?: number[];
  obpScores?: number[];
};

// Yön #3 — Yerleştirme Kılavuzu. Afiş ölçeğinde başlık +
// puan ekseni (sahiplenilmiş data-viz, aynı zamanda tek arama şeridi).
// Kanıt figürleri ve muafiyet notu FeatureSection'a taşındı: landing'de
// /okullar'a giden TEK kontrol yüzeyi kalsın. Belge künyesi kaldırıldı —
// Navbar markayı zaten taşıyordu, yıl ölçek başlığında duruyor.
export function Hero({
  latestYear = null,
  percentiles = [],
  obpScores = [],
}: HeroProps) {
  return (
    <section className="relative">
      <div className="container mx-auto max-w-6xl px-6 pt-8 pb-10 md:pt-10 md:pb-10">
        {/* Afiş başlık — mekanizma; sayı iddiası araç kartındaki kanıt figürlerinde */}
        <h1 className="font-display text-[clamp(2.5rem,7vw,5.5rem)] font-extrabold leading-[1.02] tracking-[-0.02em] text-balance text-[var(--ink)]">
          {/* Boşluk açıkça yazılır: br gizlendiğinde JSX satır sonu boşluğunu
              yutuyor ve kelimeler birleşiyordu. */}
          Mersin liselerini{" "}
          <br className="hidden sm:block" />
          tek bir <span className="text-[var(--teal)]">ölçekte</span> gör.
        </h1>

        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[var(--ink-soft)] md:text-xl">
          Yüzdelik dilimini ya da OBP puanını gir, aralığındaki okulları
          işaretle, listene başla.
        </p>

        {/* Puan ekseni + arama şeridi — sahiplenilmiş görsel fikir */}
        <div className="mt-6">
          <ScoreScale
            percentiles={percentiles}
            obpScores={obpScores}
            latestYear={latestYear}
          />
        </div>
      </div>
    </section>
  );
}
