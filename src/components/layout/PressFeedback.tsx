"use client";

import { useEffect } from "react";

const PRESSABLE = 'a[href], button, summary, [role="button"], [role="tab"]';
// Çok kısa bir dokunuşta da basılma tam derinliğine iner, sonra bırakılır.
const PRESS_MS = 90;
const RELEASE_MS = 260;
const EXPO_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";

type PressProp = "scale" | "opacity";

// Basılı hâl, öğenin boyuna göre: küçük ikon düğme belirgin, düğme ve satır
// orta, büyük kart hafif küçülür ki göze görünen çökme hep birkaç piksel
// kalsın. Metin içi bağlantıya transform işlemez; o soluklaşır.
function pressedFrame(el: HTMLElement, reduceMotion: boolean): [PressProp, string] | null {
  if (reduceMotion || getComputedStyle(el).display === "inline") return ["opacity", "0.55"];
  const { width, height } = el.getBoundingClientRect();
  // Ekranı kaplayan öğe (perde, arka plan) küçülürse sayfa sarsılır gibi olur.
  if (width * height > window.innerWidth * window.innerHeight * 0.5) return null;
  if (Math.max(width, height) <= 56) return ["scale", "0.9"];
  if (Math.min(width, height) <= 80) return ["scale", "0.97"];
  return ["scale", "0.985"];
}

// Tailwind v4 hover'ı yalnız hover destekli cihazlarda uygular; telefonda
// basılan düğme hiçbir şey göstermiyordu. Tek dinleyici sitenin her
// tıklanabilir öğesine basılma tepkisi verir. Kaydırmaya dönen dokunuş
// pointercancel ile hemen bırakılır. data-press="off" taşıyan öğe hariç.
// Animasyonlar tek anahtar kare kullanır: öbür uç öğenin kendi değeridir,
// böylece öğenin kendi opaklığı ya da ölçeği ezilmez.
export function PressFeedback() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let pressed: { el: HTMLElement; anim: Animation; at: number; prop: PressProp } | null = null;

    function release(immediate: boolean) {
      if (!pressed) return;
      const { el, anim, at, prop } = pressed;
      pressed = null;
      const settle = () => {
        const from = getComputedStyle(el)[prop];
        anim.cancel();
        el.animate([{ [prop]: from, offset: 0 }], { duration: RELEASE_MS, easing: EXPO_OUT });
      };
      const wait = immediate ? 0 : PRESS_MS - (performance.now() - at);
      if (wait > 0) window.setTimeout(settle, wait);
      else settle();
    }

    function onDown(e: PointerEvent) {
      if (!e.isPrimary || e.button !== 0) return;
      const el = (e.target as Element | null)?.closest?.<HTMLElement>(PRESSABLE);
      if (!el || el.matches(":disabled, [aria-disabled='true']")) return;
      if (el.closest("[data-press='off'], .admin")) return;
      const frame = pressedFrame(el, reduceMotion.matches);
      if (!frame) return;
      release(true);
      const [prop, value] = frame;
      const anim = el.animate([{ [prop]: value }], {
        duration: PRESS_MS,
        easing: EXPO_OUT,
        fill: "forwards",
      });
      pressed = { el, anim, at: performance.now(), prop };
    }

    const onUp = () => release(false);
    const onCancel = () => release(true);

    document.addEventListener("pointerdown", onDown, { capture: true, passive: true });
    document.addEventListener("pointerup", onUp, true);
    document.addEventListener("pointercancel", onCancel, true);
    window.addEventListener("blur", onCancel);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("pointercancel", onCancel, true);
      window.removeEventListener("blur", onCancel);
    };
  }, []);

  return null;
}
