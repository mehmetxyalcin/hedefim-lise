import { PercentileScale } from "./PercentileScale";

type HeroProps = {
  schoolCount?: number | null;
  districtCount?: number | null;
  latestYear?: number | null;
  percentiles?: number[];
};

// Yön #3 — Yerleştirme Kılavuzu. Belge künyesi + afiş ölçeğinde başlık + yüzdelik
// ekseni (sahiplenilmiş data-viz) + taban çizgisinde dev tipografik kanıt figürleri.
export function Hero({
  schoolCount = null,
  districtCount = null,
  latestYear = null,
  percentiles = [],
}: HeroProps) {
  const hasStats = schoolCount != null && districtCount != null;

  return (
    <section className="relative">
      {/* Belge künyesi */}
      <div className="border-b border-[var(--line)]">
        <div className="container mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="font-display text-sm font-extrabold tracking-tight text-[var(--ink)]">
            Hedefim Lise
            <span className="ml-2 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--ink-faint)]">
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

      <div className="container mx-auto max-w-6xl px-6 pt-14 pb-20 md:pt-20">
        {/* Afiş başlık — mekanizma; sayı iddiası taban çizgisindeki kanıt figürlerinde */}
        <h1 className="font-display text-[clamp(2.5rem,7vw,5.5rem)] font-extrabold leading-[1.02] tracking-[-0.02em] text-[var(--ink)]">
          Mersin liselerini
          <br />
          tek bir <span className="text-[var(--teal)]">ölçekte</span> gör.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--ink-soft)] md:text-xl">
          MEB ve okul kaynaklarından derlenen yerleştirme verileriyle: yüzdelik
          dilimini gir, erişimindeki okulları işaretle, listene başla.
        </p>

        {/* Yüzdelik ekseni — sahiplenilmiş görsel fikir */}
        <div className="mt-10">
          <PercentileScale percentiles={percentiles} latestYear={latestYear} />
        </div>

        {/* Kanıt figürleri — dev tabular sayılar, chip değil */}
        {hasStats && (
          <div className="mt-14 grid grid-cols-2 gap-x-8 gap-y-8 border-t border-[var(--line)] pt-10 sm:grid-cols-3">
            <Figure value={schoolCount} label="aktif lise kaydı" />
            <Figure value={districtCount} label="ilçe kapsanıyor" />
            {latestYear != null && (
              <Figure value={latestYear} label="yerleştirme verisi" />
            )}
          </div>
        )}

        <p className="mt-10 max-w-2xl font-mono text-[11px] leading-relaxed text-[var(--ink-faint)]">
          Bağımsız bir rehberdir; bilgiler yalnızca bilgilendirme amaçlıdır ve
          resmi MEB kaynaklarından teyit edilmelidir.
        </p>
      </div>
    </section>
  );
}

function Figure({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col">
      <span className="tabular font-display text-5xl font-extrabold leading-none tracking-tight text-[var(--ink)] md:text-6xl">
        {value}
      </span>
      <span className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
        {label}
      </span>
    </div>
  );
}
