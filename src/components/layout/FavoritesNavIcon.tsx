"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Star } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { isActiveLink } from "./nav-links";

// Tercih listesi her ekranda tek dokunuş uzakta: telefonda yalnız ikon,
// sm ve üstünde etiketli hap düğme. Sayı varsa yanında durur.
export function FavoritesNavIcon() {
  const { favorites } = useFavorites();
  const pathname = usePathname();
  const count = favorites.length;
  const active = isActiveLink("/tercihlerim", pathname);

  return (
    <Link
      href="/tercihlerim"
      aria-current={active ? "page" : undefined}
      aria-label={count > 0 ? `Tercihlerim, ${count} okul` : "Tercihlerim"}
      className="relative inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 text-sm font-semibold text-slate-800 shadow-sm shadow-slate-900/[0.04] transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 aria-[current=page]:border-blue-200 aria-[current=page]:bg-blue-50 aria-[current=page]:text-blue-800 sm:h-9 sm:pr-3 sm:pl-3"
    >
      <Star
        aria-hidden
        className={`h-4 w-4 ${count > 0 ? "fill-blue-600 text-blue-600" : "text-slate-500"}`}
      />
      <span className="hidden sm:inline">Tercihlerim</span>
      {count > 0 && (
        <span className="tabular-nums absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-blue-600 px-1 text-[11px] leading-none font-bold text-white ring-2 ring-white sm:static sm:ring-0">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
