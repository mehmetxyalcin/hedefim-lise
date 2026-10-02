"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { NAV_START_EVENT, leadsToNewPage } from "@/lib/navigation-progress";

// Hızlı (önceden yüklenmiş) geçişlerde çubuk hiç görünmesin, yanıp sönmesin.
const SHOW_AFTER_MS = 120;
// Geçiş hata verip adres hiç değişmezse çubuk sonsuza dek asılı kalmasın.
const GIVE_UP_AFTER_MS = 15000;

// Başlığın alt çizgisinde dolan 2px Exam Blue çubuk: dokunulan sayfa sunucudan
// gelirken "isteğin alındı, yoldayız" der. Mevcut sayfa göstergesiyle aynı
// kalınlık ve renk; başlığın kendi dilinden. Bitiş sinyali adres değişimidir
// (yeni sayfa ekrana geldiği anda pathname/searchParams değişir).
export function NavigationProgress() {
  const barRef = useRef<HTMLSpanElement>(null);
  const finishRef = useRef<() => void>(() => {});
  const pathname = usePathname();
  const search = useSearchParams().toString();

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let running = false;
    let showTimer = 0;
    let giveUpTimer = 0;
    let fill: Animation | null = null;

    function show() {
      if (!bar) return;
      bar.getAnimations().forEach((a) => a.cancel());
      // Hareket azaltılmışsa çubuk ilerlemez, yalnız belirir.
      fill = reduceMotion.matches
        ? bar.animate(
            [
              { scale: "1 1", opacity: 0 },
              { scale: "1 1", opacity: 0.6 },
            ],
            { duration: 200, fill: "forwards" },
          )
        : // Hızla dörtte bire, sonra yavaşlayarak; sona hiç varmaz, varış adres değişince.
          bar.animate(
            [
              { scale: "0 1", opacity: 1 },
              { scale: "0.25 1", opacity: 1, offset: 0.04 },
              { scale: "0.55 1", opacity: 1, offset: 0.2 },
              { scale: "0.8 1", opacity: 1, offset: 0.6 },
              { scale: "0.92 1", opacity: 1 },
            ],
            { duration: GIVE_UP_AFTER_MS, easing: "ease-out", fill: "forwards" },
          );
    }

    function start() {
      window.clearTimeout(giveUpTimer);
      giveUpTimer = window.setTimeout(finish, GIVE_UP_AFTER_MS);
      if (running) return;
      running = true;
      showTimer = window.setTimeout(show, SHOW_AFTER_MS);
    }

    function finish() {
      if (!running) return;
      running = false;
      window.clearTimeout(showTimer);
      window.clearTimeout(giveUpTimer);
      if (!bar || !fill) return;
      const from = getComputedStyle(bar).scale;
      fill.cancel();
      fill = null;
      bar.animate(
        [
          { scale: from, opacity: 1 },
          { scale: "1 1", opacity: 1, offset: 0.45 },
          { scale: "1 1", opacity: 0 },
        ],
        { duration: 420, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
      );
    }

    // Capture: next/link kendi tıklamasında preventDefault çağırır; ondan önce bakılır.
    function onClick(e: MouseEvent) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      if (link.target && link.target !== "_self") return;
      if (link.hasAttribute("download")) return;
      if (leadsToNewPage(new URL(link.href))) start();
    }

    finishRef.current = finish;
    document.addEventListener("click", onClick, true);
    window.addEventListener(NAV_START_EVENT, start);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener(NAV_START_EVENT, start);
      window.clearTimeout(showTimer);
      window.clearTimeout(giveUpTimer);
    };
  }, []);

  useEffect(() => {
    finishRef.current();
  }, [pathname, search]);

  return (
    <span
      ref={barRef}
      aria-hidden
      className="pointer-events-none absolute inset-x-0 -bottom-px h-0.5 origin-left scale-x-0 bg-blue-600 opacity-0"
    />
  );
}
