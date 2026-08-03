"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown } from "lucide-react";
import { DISTRICTS } from "@/data/districts";
import { SCHOOL_TYPES } from "@/data/schoolTypes";

type Props = {
  percentiles: number[]; // sıralı (artan), aktif okulların son yıl yüzdelik dilimleri
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

// Sahiplenilmiş görsel fikir: Mersin liselerinin yüzdelik dağılımı tek bir
// ölçekte. Kullanıcı iki tutamakla bir ARALIK seçer; aralıktaki okullar teal,
// dışındakiler soluk. "Okulları gör" o aralığı gerçek filtre olarak uygular.
// LGS: düşük yüzdelik dilimi = daha rekabetçi (solda).
//
// İlçe ve okul türü daraltıcıları da bu şeridin içinde: landing'de /okullar'a
// giden TEK kontrol yüzeyi olsun, kullanıcı iki arama kutusu arasında seçim
// yapmak zorunda kalmasın. Üçü de aynı submit'te aynı URL'e gider.
export function PercentileScale({ percentiles, latestYear }: Props) {
  const router = useRouter();

  const { min, max } = useMemo(() => {
    if (percentiles.length === 0) return { min: 0, max: 100 };
    return { min: percentiles[0], max: percentiles[percentiles.length - 1] };
  }, [percentiles]);

  const [low, setLow] = useState(min);
  const [high, setHigh] = useState(max);
  const [lowRaw, setLowRaw] = useState(fmt(min));
  const [highRaw, setHighRaw] = useState(fmt(max));
  const [dragging, setDragging] = useState<Handle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ilce, setIlce] = useState("");
  const [tur, setTur] = useState("");

  const trackRef = useRef<HTMLDivElement>(null);

  const span = max - min;
  const pctToLeft = (p: number) => (span === 0 ? 50 : ((p - min) / span) * 100);
  const lowLeft = pctToLeft(low);
  const highLeft = pctToLeft(high);

  const inRangeCount = percentiles.filter(
    (p) => p >= low && p <= high,
  ).length;

  // Tam aralık seçiliyse bu bir filtre değildir.
  const isFullRange = low <= min + 0.001 && high >= max - 0.001;

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
      else if (e.key === "ArrowRight" || e.key === "ArrowUp") next = current + step;
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
      setError("Aralık için iki sayı gir, örn. 1,00 ve 8,00");
      return;
    }
    if (lowVal < 0 || lowVal > 100 || highVal < 0 || highVal > 100) {
      setError("Yüzdelik değerleri 0 ile 100 arasında olmalı");
      return;
    }
    if (lowVal > highVal) {
      setError("Aralık başlangıcı bitişinden büyük olamaz");
      return;
    }
    setError(null);

    const params = new URLSearchParams();
    if (!isFullRange) {
      params.set("yuzdelik_min", String(round2(lowVal)));
      params.set("yuzdelik_max", String(round2(highVal)));
    }
    if (ilce) params.set("ilce", ilce);
    if (tur) params.set("tur", tur);
    params.set("siralama", "yuzdelik_asc");
    router.push(`/okullar?${params.toString()}`);
  }

  const hasData = percentiles.length > 0;
  // Tutamaklar birbirine yakınsa tek birleşik etiket (çakışma yapısal olarak önlenir).
  const merged = highLeft - lowLeft < 16;
  const trackTransition = dragging
    ? ""
    : "transition-[left,right,width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]";

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--doc-panel)] p-5 shadow-sm sm:p-7">
      {/* Başlık + canlı okuma */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--ink-faint)]">
          {latestYear ?? ""} yüzdelik dilim ölçeği ·{" "}
          <span className="tabular">{percentiles.length}</span> okul
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
        <div ref={trackRef} className="relative mb-3 h-28 touch-none">
          {/* seçili bant */}
          <div
            className={`absolute top-0 h-20 bg-[var(--teal-tint)] ${trackTransition}`}
            style={{ left: `${lowLeft}%`, width: `${highLeft - lowLeft}%` }}
          />

          {/* dağılım tick'leri */}
          <div className="absolute inset-x-0 top-0 h-20">
            {percentiles.map((p, i) => {
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
                  which === "low"
                    ? "Aralık başlangıcı (en rekabetçi uç)"
                    : "Aralık bitişi"
                }
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={value}
                aria-valuetext={`%${fmt(value)}`}
                onPointerDown={handlePointerDown(which)}
                onPointerMove={handlePointerMove(which)}
                onPointerUp={handlePointerUp()}
                onPointerCancel={handlePointerUp()}
                onKeyDown={handleKeyDown(which)}
                className={`absolute top-0 bottom-6 z-10 w-11 -translate-x-1/2 cursor-ew-resize touch-none focus-visible:outline-none ${trackTransition}`}
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
              className={`tabular absolute -top-6 z-20 whitespace-nowrap font-mono text-[11px] font-semibold text-[var(--vermilion-deep)] ${trackTransition}`}
              style={{
                left: `${(lowLeft + highLeft) / 2}%`,
                transform: "translateX(-50%)",
              }}
            >
              %{fmt(low)} – %{fmt(high)}
            </span>
          ) : (
            <>
              <span
                className={`tabular absolute -top-6 z-20 whitespace-nowrap font-mono text-[11px] font-semibold text-[var(--vermilion-deep)] ${trackTransition}`}
                style={{
                  left: `${lowLeft}%`,
                  transform:
                    lowLeft < 8 ? "translateX(0)" : "translateX(-50%)",
                }}
              >
                %{fmt(low)}
              </span>
              <span
                className={`tabular absolute -top-6 z-20 whitespace-nowrap font-mono text-[11px] font-semibold text-[var(--vermilion-deep)] ${trackTransition}`}
                style={{
                  left: `${highLeft}%`,
                  transform:
                    highLeft > 92 ? "translateX(-100%)" : "translateX(-50%)",
                }}
              >
                %{fmt(high)}
              </span>
            </>
          )}

          {/* uç etiketleri */}
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

      {/* Arama şeridi: aralık → daraltıcılar → tek eylem */}
      <div className="mt-6 border-t border-[var(--line)] pt-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <span className="text-sm font-medium text-[var(--ink-soft)]">
            Yüzdelik aralığı
          </span>
          <div className="flex items-center gap-2">
            <input
              aria-label="Aralık başlangıcı"
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
              className="tabular w-24 rounded-xl border border-[var(--line)] bg-[var(--doc-ground)] px-3 py-3 text-base text-[var(--ink)] outline-none focus:border-[var(--teal)] focus:ring-4 focus:ring-[var(--teal-ring)]"
            />
            <span className="text-[var(--ink-faint)]">–</span>
            <input
              aria-label="Aralık bitişi"
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
              className="tabular w-24 rounded-xl border border-[var(--line)] bg-[var(--doc-ground)] px-3 py-3 text-base text-[var(--ink)] outline-none focus:border-[var(--teal)] focus:ring-4 focus:ring-[var(--teal-ring)]"
            />
          </div>
        </div>

        {/* Daraltıcılar + tek eylem. Boş seçenek "tümü" demek: geri alınabilir. */}
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
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
          Tutamakları sürükleyerek aralık seç; ilçe ve okul türü isteğe bağlı
          daraltır.
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
