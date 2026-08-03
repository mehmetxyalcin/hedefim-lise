"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

type Props = {
  percentiles: number[]; // sıralı (artan), aktif okulların son yıl yüzdelik dilimleri
  latestYear: number | null;
};

// Türkçe ondalık: belge tek ayraç kullanır (virgül).
const fmt = (v: number) => v.toFixed(2).replace(".", ",");

// Sahiplenilmiş görsel fikir: Mersin liselerinin yüzdelik dağılımı tek bir
// ölçekte. Kullanıcı yüzdeliğini girer, eksene vermilyon işaret düşer; kesimi
// >= kullanıcının değeri olan okullar (erişimdekiler) teal, daha rekabetçiler
// soluk. LGS: düşük yüzdelik dilimi = daha rekabetçi (solda).
export function PercentileScale({ percentiles, latestYear }: Props) {
  const router = useRouter();
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { min, max } = useMemo(() => {
    if (percentiles.length === 0) return { min: 0, max: 100 };
    return {
      min: percentiles[0],
      max: percentiles[percentiles.length - 1],
    };
  }, [percentiles]);

  // Geçerli 0–100 değeri; aksi halde null. (Marker yalnızca geçerliyken düşer.)
  const parsed = (() => {
    if (raw.trim() === "") return null;
    const v = Number(raw.trim().replace(",", "."));
    if (!Number.isFinite(v) || v < 0 || v > 100) return null;
    return v;
  })();

  const pctToLeft = (p: number) =>
    max === min ? 50 : ((p - min) / (max - min)) * 100;

  const reachableCount =
    parsed != null ? percentiles.filter((p) => p >= parsed).length : null;

  const markerLeft =
    parsed != null ? Math.min(100, Math.max(0, pctToLeft(parsed))) : null;

  // İşaret etiketi eksenin ÜSTÜNDE durur (uç etiketleriyle asla çakışmaz);
  // uçlara yaklaşınca panelden taşmasın diye hizası clamp'lenir.
  const markerLabelAlign =
    markerLeft == null
      ? ""
      : markerLeft < 8
        ? "left-0"
        : markerLeft > 92
          ? "right-0"
          : "left-1/2 -translate-x-1/2";

  function submit() {
    if (raw.trim() !== "" && parsed == null) {
      setError("Yüzdelik 0 ile 100 arasında bir sayı olmalı, örn. 5,00");
      return;
    }
    setError(null);
    const params = new URLSearchParams();
    if (parsed != null) {
      params.set("yuzdelik", String(parsed));
      params.set("siralama", "yuzdelik_asc");
    }
    const qs = params.toString();
    router.push(qs ? `/okullar?${qs}` : "/okullar");
  }

  const hasData = percentiles.length > 0;

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--doc-panel)] p-5 shadow-sm sm:p-7">
      {/* Başlık + canlı okuma */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--ink-faint)]">
          {latestYear ?? ""} yüzdelik dilim ölçeği ·{" "}
          <span className="tabular">{percentiles.length}</span> okul
        </p>
        <p aria-live="polite" className="text-sm text-[var(--ink-soft)]">
          {reachableCount != null && hasData && (
            <>
              <span className="tabular font-display text-lg font-extrabold text-[var(--teal)]">
                {reachableCount}
              </span>{" "}
              okul erişiminde
            </>
          )}
        </p>
      </div>

      {/* Eksen */}
      {hasData ? (
        <div className="relative mb-3 h-28">
          {/* dağılım tick'leri */}
          <div className="absolute inset-x-0 top-0 h-20">
            {percentiles.map((p, i) => {
              const reachable = parsed == null || p >= parsed;
              return (
                <span
                  key={i}
                  className="absolute top-0 h-full w-px transition-[background-color,opacity] duration-200"
                  style={{
                    left: `${pctToLeft(p)}%`,
                    backgroundColor: reachable
                      ? "var(--teal)"
                      : "var(--ink-faint)",
                    opacity: parsed == null ? 0.32 : reachable ? 0.6 : 0.14,
                  }}
                />
              );
            })}
          </div>

          {/* taban çizgisi */}
          <div className="absolute inset-x-0 top-20 h-px bg-[var(--line)]" />

          {/* kullanıcı işareti */}
          {markerLeft != null && (
            <div
              className="marker-in absolute top-0 bottom-6 w-[2px] bg-[var(--vermilion)] transition-[left] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ left: `${markerLeft}%` }}
            >
              <span className="absolute -top-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 bg-[var(--vermilion)]" />
              <span
                className={`tabular absolute -top-6 whitespace-nowrap font-mono text-[11px] font-semibold text-[var(--vermilion-deep)] ${markerLabelAlign}`}
              >
                sen · %{parsed != null ? fmt(parsed) : ""}
              </span>
            </div>
          )}

          {/* uç etiketleri — işaret etiketi eksenin üstünde olduğundan çakışmazlar */}
          <div className="tabular absolute inset-x-0 top-[5.75rem] flex justify-between font-mono text-[10px] text-[var(--ink-faint)]">
            <span>%{fmt(min)} · en rekabetçi</span>
            <span>%{fmt(max)}</span>
          </div>
        </div>
      ) : (
        <p className="mb-3 text-sm text-[var(--ink-faint)]">
          Ölçek verisi şu anda yüklenemedi.
        </p>
      )}

      {/* Giriş + eylem */}
      <div className="mt-6 flex flex-col gap-3 border-t border-[var(--line)] pt-5 sm:flex-row sm:items-center">
        <label
          htmlFor="yuzdelik-input"
          className="text-sm font-medium text-[var(--ink-soft)]"
        >
          Yüzdeliğini gir
        </label>
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <input
            id="yuzdelik-input"
            type="text"
            inputMode="decimal"
            placeholder="Örn. 5,00"
            value={raw}
            onChange={(e) => {
              setRaw(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            aria-invalid={error != null}
            aria-describedby={error ? "yuzdelik-error" : undefined}
            className="tabular w-full rounded-xl border border-[var(--line)] bg-[var(--doc-ground)] px-4 py-3 text-base text-[var(--ink)] placeholder:text-[var(--ink-faint)] outline-none focus:border-[var(--teal)] focus:ring-4 focus:ring-[var(--teal-ring)] sm:w-44"
          />
          <button
            type="button"
            onClick={submit}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--teal)] px-6 py-3 font-display text-sm font-bold tracking-wide text-white transition-colors hover:bg-[var(--teal-deep)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--teal-ring)]"
          >
            Okulları gör
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      {error ? (
        <p
          id="yuzdelik-error"
          className="mt-3 font-mono text-[11px] font-semibold text-[var(--vermilion-deep)]"
        >
          {error}
        </p>
      ) : (
        <p className="mt-3 font-mono text-[11px] text-[var(--ink-faint)]">
          Eşik filtresi değil: okulları yüzdeliğe göre sıralarız, konumunu
          ölçekte gösteririz.
        </p>
      )}
    </div>
  );
}
