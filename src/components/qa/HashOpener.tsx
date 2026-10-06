"use client";

import { useEffect } from "react";

// Kategori sayfasına /soru-cevap/{kategori}#{soru} ile gelinince o soru açık
// ve görünür olsun. Next'in Link'i aynı sayfadaki çapalarda hashchange
// üretmediği için sayfa içi tıklamalar da dinlenir.
function openFromHash() {
  const raw = window.location.hash.slice(1);
  if (!raw) return;
  let id = raw;
  try {
    id = decodeURIComponent(raw);
  } catch {
    // Bozuk kodlanmış çapa: olduğu gibi dene.
  }
  const target = document.getElementById(id);
  if (!(target instanceof HTMLDetailsElement)) return;
  target.open = true;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.requestAnimationFrame(() => {
    target.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
    target.querySelector("summary")?.focus({ preventScroll: true });
  });
}

export function HashOpener() {
  useEffect(() => {
    openFromHash();

    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.("a[href*='#']");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.pathname !== window.location.pathname || !anchor.hash) return;
      // Gezinme bitsin, adres çubuğu yeni çapayı göstersin; sonra aç.
      window.setTimeout(openFromHash, 0);
    };

    window.addEventListener("hashchange", openFromHash);
    window.addEventListener("popstate", openFromHash);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("hashchange", openFromHash);
      window.removeEventListener("popstate", openFromHash);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return null;
}
