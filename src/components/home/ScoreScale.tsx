"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown } from "lucide-react";
import { DISTRICTS } from "@/data/districts";
import { SCHOOL_TYPES } from "@/data/schoolTypes";

type Props = {
  percentiles: number[]; // sıralı (artan), merkezi yerleştirmeli okulların yüzdelik dilimleri
  obpScores: number[]; // sıralı (artan), yerel yerleştirmeli okulların OBP puanları
  latestYear: number | null;
};

// Türkçe ondalık: belge tek ayraç kullanır (virgül).
const fmt = (v: number) => v.toFixed(2).replace(".", ",");
const round2 = (v: number) => Math.round(v * 100) / 100;
const parseNum = (s: string): number | null => {
  const t = s.trim().replace(",", ".");
  if (t === "") return null;
  const v = Number(t);
  return Number.isFinite(v) ? v : null;
};

type Handle = "low" | "high";
type Metric = "yuzdelik" | "obp";

// Metrik sözleşmesi. İki metrik AYRI dağılımlardır çünkü okulların çoğu
// yalnızca birine sahiptir: merkezi yerleştirme yüzdelik dilimi, yerel
// yerleştirme OBP puanı üretir. Rekabetçilik yönü de terstir — bu yüzden
// "en rekabetçi" etiketi eksenin sabit bir ucuna çivilenmez, metriğe göre
// taşınır. Eksen her iki durumda da soldan sağa ARTAR: sayı doğrusu yalan
// söylemesin, yalnızca açıklaması yer değiştirsin.
const METRICS: Record<
  Metric,
  {
    tab: string;
    axisLabel: string;
    scope: string;
    unit: (v: number) => string;
    competitiveEnd: "start" | "end";
    minParam: string;
    maxParam: string;
    sort: string;
    inputLabel: string;
  }
> = {
  yuzdelik: {
    tab: "Yüzdelik dilimi",
    axisLabel: "yüzdelik dilim ölçeği",
    scope: "LGS ile merkezi yerleştirmeyle öğrenci alan okullar.",
    unit: (v) => `%${fmt(v)}`,
    competitiveEnd: "start", // düşük yüzdelik = daha rekabetçi
    minParam: "yuzdelik_min",
    maxParam: "yuzdelik_max",
    sort: "yuzdelik_asc",
    inputLabel: "Yüzdelik aralığı",
  },
  obp: {
    tab: "OBP puanı",
    axisLabel: "OBP puanı ölçeği",
    scope: "Yerel yerleştirmeyle (OBP) öğrenci alan okullar.",
    unit: (v) => fmt(v),
    competitiveEnd: "end", // yüksek OBP = daha rekabetçi
    minParam: "obp_min",
    maxParam: "obp_max",
    sort: "obp_desc",
    inputLabel: "OBP aralığı",
  },
};

// Sahiplenilmiş görsel fikir: Mersin liselerinin dağılımı tek bir ölçekte.
// Kullanıcı önce metriği seçer (elindeki sayı hangisiyse), sonra iki tutamakla
// bir ARALIK seçer; aralıktaki okullar teal, dışındakiler soluk.
// "Okulları gör" o aralığı gerçek filtre olarak uygular.
//
// İlçe ve okul türü daraltıcıları da bu şeridin içinde: landing'de /okullar'a
// giden TEK kontrol yüzeyi olsun, kullanıcı iki arama kutusu arasında seçim
// yapmak zorunda kalmasın. Hepsi aynı submit'te aynı URL'e gider.
export function ScoreScale({ percentiles, obpScores, latestYear }: Props) {
  const router = useRouter();

  const bounds = useMemo(() => {
    const of = (vals: number[]) =>
      vals.length === 0
        ? { min: 0, max: 100 }
        : { min: vals[0], max: vals[vals.length - 1] };
    return { yuzdelik: of(percentiles), obp: of(obpScores) };
  }, [percentiles, obpScores]);

  // Veri olmayan metrikle açılmayalım: yüzdelik boşsa OBP'den başla.
  const initialMetric: Metric =
    percentiles.length === 0 && obpScores.length > 0 ? "obp" : "yuzdelik";

  const [metric, setMetric] = useState<Metric>(initialMetric);
  const [low, setLow] = useState(bounds[initialMetric].min);
  const [high, setHigh] = useState(bounds[initialMetric].max);
  const [lowRaw, setLowRaw] = useState(fmt(bounds[initialMetric].min));
  const [highRaw, setHighRaw] = useState(fmt(bounds[initialMetric].max));
  const [dragging, setDragging] = useState<Handle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ilce, setIlce] = useState("");
  const [tur, setTur] = useState("");

  const trackRef = useRef<HTMLDivElement>(null);

  const cfg = METRICS[metric];
  const values = metric === "yuzdelik" ? percentiles : obpScores;
  const { min, max } = bounds[metric];

  const span = max - min;
  const pctToLeft = (p: number) => (span === 0 ? 50 : ((p - min) / span) * 100);
  const lowLeft = pctToLeft(low);
  const highLeft = pctToLeft(high);

  const inRangeCount = values.filter((p) => p >= low && p <= high).length;

  // Tam aralık seçiliyse bu bir filtre değildir.
  const isFullRange = low <= min + 0.001 && high >= max - 0.001;

  // Metrik değişince aralık yeni ölçeğin uçlarına sıfırlanır: eski metriğin
  // sayıları yeni eksende anlamsızdır (%0,94 ile 0,94 OBP aynı şey değil).
  function switchMetric(next: Metric) {
    if (next === metric) return;
    const b = bounds[next];
    setMetric(next);
    setLow(b.min);
    setHigh(b.max);
    setLowRaw(fmt(b.min));
    setHighRaw(fmt(b.max));
    setError(null);
  }

  function commit(which: Handle, value: number) {
    const v = round2(Math.min(max, Math.max(min, value)));
    if (which === "low") {
      const next = Math.min(v, high);
      setLow(next);
      setLowRaw(fmt(next));
    } else {
      const next = Math.max(v, low);
      setHigh(next);
      setHighRaw(fmt(next));
    }
    if (error) setError(null);
  }

  function valueFromClientX(clientX: number): number | null {
    const el = trackRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0) return null;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return min + ratio * span;
  }

  function handlePointerDown(which: Handle) {
    return (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragging(which);
    };
  }

  function handlePointerMove(which: Handle) {
    return (e: React.PointerEvent<HTMLDivElement>) => {
      if (dragging !== which) return;
      const v = valueFromClientX(e.clientX);
      if (v != null) commit(which, v);
    };
  }

  function handlePointerUp() {
    return (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setDragging(null);
    };
  }

  // Klavye: ok tuşları ince, PageUp/Down kaba, Home/End uçlar.
  function handleKeyDown(which: Handle) {
    return (e: React.KeyboardEvent<HTMLDivElement>) => {
      const step = Math.max(0.01, round2(span / 100));
      const current = which === "low" ? low : high;
      let next: number | null = null;
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = current - step;
      else if (e.key === "ArrowRight" || e.key === "ArrowUp")
        next = current + step;
      else if (e.key === "PageDown") next = current - step * 10;
      else if (e.key === "PageUp") next = current + step * 10;
      else if (e.key === "Home") next = min;
      else if (e.key === "End") next = max;
      if (next != null) {
        e.preventDefault();
        commit(which, next);
      }
    };
  }

  function applyRaw(which: Handle, raw: string) {
    const v = parseNum(raw);
    if (v == null) return;
    commit(which, v);
  }

  function submit() {
    const lowVal = parseNum(lowRaw);
    const highVal = parseNum(highRaw);
    if (lowVal == null || highVal == null) {
      setError("Aralık için iki sayı gir");
      return;
    }
    if (lowVal < 0 || lowVal > 100 || highVal < 0 || highVal > 100) {
      setError("Değerler 0 ile 100 arasında olmalı");
      return;
    }
    if (lowVal > highVal) {
      setError("Aralık başlangıcı bitişinden büyük olamaz");
      return;
    }
    setError(null);

    const params = new URLSearchParams();
    if (!isFullRange) {
      params.set(cfg.minParam, String(round2(lowVal)));
      params.set(cfg.maxParam, String(round2(highVal)));
    }
    if (ilce) params.set("ilce", ilce);
    if (tur) params.set("tur", tur);
    params.set("siralama", cfg.sort);
    router.push(`/okullar?${params.toString()}`);
  }

  const hasData = values.length > 0;
  // Tutamaklar birbirine yakınsa tek birleşik etiket (çakışma yapısal olarak önlenir).
  const merged = highLeft - lowLeft < 16;
  const trackTransition = dragging
    ? ""
    : "transition-[left,right,width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]";

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--doc-panel)] p-5 shadow-sm sm:p-6">
      {/* Metrik seçimi — elindeki sayı hangisiyse */}
      <div
        role="tablist"
        aria-label="Ölçek metriği"
        className="mb-5 inline-flex rounded-xl border border-[var(--line)] bg-[var(--doc-ground)] p-1"
      >
        {(Object.keys(METRICS) as Metric[]).map((m) => {
          const selected = m === metric;
          const count =
            m === "yuzdelik" ? percentiles.length : obpScores.length;
          return (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => switchMetric(m)}
              disabled={count === 0}
              className={`rounded-lg px-4 py-2.5 font-display text-sm font-bold tracking-tight transition-colors disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--teal-ring)] ${
                selected
                  ? "bg-[var(--teal)] text-white"
                  : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
              }`}
            >
              {METRICS[m].tab}
              <span
                className={`tabular ml-2 font-mono text-[11px] font-medium ${
                  selected ? "text-white/70" : "text-[var(--ink-faint)]"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Başlık + canlı okuma */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--ink-faint)]">
          {latestYear ?? ""} {cfg.axisLabel}
        </p>
        <p aria-live="polite" className="text-sm text-[var(--ink-soft)]">
          {hasData && (
            <>
              <span className="tabular font-display text-lg font-extrabold text-[var(--teal)]">
                {inRangeCount}
              </span>{" "}
              okul bu aralıkta
            </>
          )}
        </p>
      </div>

      {/* Eksen */}
      {hasData ? (
        <div ref={trackRef} className="relative mb-3 h-[6.5rem] touch-none">
          {/* seçili bant */}
          <div
            className={`absolute top-0 h-20 bg-[var(--teal-tint)] ${trackTransition}`}
            style={{ left: `${lowLeft}%`, width: `${highLeft - lowLeft}%` }}
          />

          {/* dağılım tick'leri */}
          <div className="absolute inset-x-0 top-0 h-20">
            {values.map((p, i) => {
              const inRange = p >= low && p <= high;
              return (
                <span
                  key={i}
                  className="absolute top-0 h-full w-px transition-[background-color,opacity] duration-200"
                  style={{
                    left: `${pctToLeft(p)}%`,
                    backgroundColor: inRange
                      ? "var(--teal)"
                      : "var(--ink-faint)",
                    opacity: inRange ? 0.75 : 0.14,
                  }}
                />
              );
            })}
          </div>

          {/* taban çizgisi */}
          <div className="absolute inset-x-0 top-20 h-px bg-[var(--line)]" />

          {/* tutamaklar */}
          {(["low", "high"] as Handle[]).map((which) => {
            const value = which === "low" ? low : high;
            const leftPct = which === "low" ? lowLeft : highLeft;
            return (
              <div
                key={which}
                role="slider"
                tabIndex={0}
                aria-label={
                  which === "low" ? "Aralık başlangıcı" : "Aralık bitişi"
                }
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={value}
                aria-valuetext={cfg.unit(value)}
                onPointerDown={handlePointerDown(which)}
                onPointerMove={handlePointerMove(which)}
                onPointerUp={handlePointerUp()}
                onPointerCancel={handlePointerUp()}
                onKeyDown={handleKeyDown(which)}
                className={`absolute top-0 bottom-4 z-10 w-11 -translate-x-1/2 cursor-ew-resize touch-none focus-visible:outline-none ${trackTransition}`}
                style={{ left: `${leftPct}%` }}
              >
                {/* görünür çizgi + tutamak */}
                <span className="pointer-events-none absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-[var(--vermilion)]" />
                <span className="pointer-events-none absolute top-[4.5rem] left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border border-[var(--doc-panel)] bg-[var(--vermilion)] shadow-sm" />
              </div>
            );
          })}

          {/* tutamak etiketleri — eksenin ÜSTÜNDE, uç etiketleriyle çakışmaz */}
          {merged ? (
            <span
              className={`tabular absolute -top-5 z-20 whitespace-nowrap font-mono text-[11px] font-semibold text-[var(--vermilion-deep)] ${trackTransition}`}
              style={{
                left: `${(lowLeft + highLeft) / 2}%`,
                transform: "translateX(-50%)",
              }}
            >
              {cfg.unit(low)} – {cfg.unit(high)}
            </span>
          ) : (
            <>
              <span
                className={`tabular absolute -top-5 z-20 whitespace-nowrap font-mono text-[11px] font-semibold text-[var(--vermilion-deep)] ${trackTransition}`}
                style={{
                  left: `${lowLeft}%`,
                  transform: lowLeft < 8 ? "translateX(0)" : "translateX(-50%)",
                }}
              >
                {cfg.unit(low)}
              </span>
              <span
                className={`tabular absolute -top-5 z-20 whitespace-nowrap font-mono text-[11px] font-semibold text-[var(--vermilion-deep)] ${trackTransition}`}
                style={{
                  left: `${highLeft}%`,
                  transform:
                    highLeft > 92 ? "translateX(-100%)" : "translateX(-50%)",
                }}
              >
                {cfg.unit(high)}
              </span>
            </>
          )}

          {/* uç etiketleri — "en rekabetçi" metriğin rekabetçi ucuna yazılır */}
          <div className="tabular absolute inset-x-0 top-[5.75rem] flex justify-between font-mono text-[10px] text-[var(--ink-faint)]">
            <span>
              {cfg.unit(min)}
              {cfg.competitiveEnd === "start" && " · en rekabetçi"}
            </span>
            <span>
              {cfg.unit(max)}
              {cfg.competitiveEnd === "end" && " · en rekabetçi"}
            </span>
          </div>
        </div>
      ) : (
        <p className="mb-3 text-sm text-[var(--ink-faint)]">
          Ölçek verisi şu anda yüklenemedi.
        </p>
      )}

      {/* Arama şeridi tek sıra: aralık → daraltıcılar → eylem. lg altında
          aralık grubu tam satırı alır, daraltıcılar alta sarar. */}
      <div className="mt-4 border-t border-[var(--line)] pt-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex flex-col gap-2 sm:w-full sm:flex-row sm:items-center lg:w-auto lg:shrink-0">
            <span className="text-sm font-medium whitespace-nowrap text-[var(--ink-soft)]">
              {cfg.inputLabel}
            </span>
            {/* Dar ekranda iki kutu satırı paylaşır; sm'den itibaren sabit genişlik. */}
            <div className="flex items-center gap-2">
              <input
                aria-label={`${cfg.inputLabel} başlangıcı`}
                type="text"
                inputMode="decimal"
                value={lowRaw}
                onChange={(e) => {
                  setLowRaw(e.target.value);
                  if (error) setError(null);
                }}
                onBlur={(e) => applyRaw("low", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    applyRaw("low", lowRaw);
                    submit();
                  }
                }}
                className="tabular w-full min-w-0 flex-1 rounded-xl border border-[var(--line)] bg-[var(--doc-ground)] px-3 py-3 text-base text-[var(--ink)] outline-none focus:border-[var(--teal)] focus:ring-4 focus:ring-[var(--teal-ring)] sm:w-24 sm:flex-none"
              />
              <span className="text-[var(--ink-faint)]">–</span>
              <input
                aria-label={`${cfg.inputLabel} bitişi`}
                type="text"
                inputMode="decimal"
                value={highRaw}
                onChange={(e) => {
                  setHighRaw(e.target.value);
                  if (error) setError(null);
                }}
                onBlur={(e) => applyRaw("high", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    applyRaw("high", highRaw);
                    submit();
                  }
                }}
                className="tabular w-full min-w-0 flex-1 rounded-xl border border-[var(--line)] bg-[var(--doc-ground)] px-3 py-3 text-base text-[var(--ink)] outline-none focus:border-[var(--teal)] focus:ring-4 focus:ring-[var(--teal-ring)] sm:w-24 sm:flex-none"
              />
            </div>
          </div>

          {/* Daraltıcılar + tek eylem. Boş seçenek "tümü" demek: geri alınabilir. */}
          <Select
            label="İlçe"
            value={ilce}
            onChange={setIlce}
            allLabel="Tüm ilçeler"
            options={DISTRICTS}
          />
          <Select
            label="Okul türü"
            value={tur}
            onChange={setTur}
            allLabel="Tüm okul türleri"
            options={SCHOOL_TYPES}
          />
          <button
            type="button"
            onClick={submit}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--teal)] px-6 py-3 font-display text-sm font-bold tracking-wide text-white transition-colors hover:bg-[var(--teal-deep)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--teal-ring)] sm:ml-auto sm:shrink-0"
          >
            Okulları gör
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      {error ? (
        <p className="mt-3 font-mono text-[11px] font-semibold text-[var(--vermilion-deep)]">
          {error}
        </p>
      ) : (
        <p className="mt-3 font-mono text-[11px] text-[var(--ink-faint)]">
          {cfg.scope} Tutamakları sürükleyerek aralık seç; ilçe ve okul türü
          isteğe bağlı daraltır.
        </p>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  allLabel,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  allLabel: string;
  options: readonly string[];
}) {
  return (
    // min-w-0: <select>'in min-content genişliği en uzun option'a göre hesaplanır
    // ("Özel Eğitim Meslek Lisesi (İşitme Engelliler)"); şeridi taşırmasın diye kırılır.
    <div className="relative min-w-0 flex-1">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 cursor-pointer appearance-none truncate rounded-xl border border-[var(--line)] bg-[var(--doc-ground)] py-3 pr-10 pl-3 text-base text-[var(--ink)] outline-none focus:border-[var(--teal)] focus:ring-4 focus:ring-[var(--teal-ring)]"
      >
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[var(--ink-faint)]"
      />
    </div>
  );
}
