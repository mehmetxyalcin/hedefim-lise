"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";

export function FavoritesNavIcon() {
  const { favorites } = useFavorites();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Link
      href="/tercihlerim"
      className="relative flex items-center justify-center rounded-lg p-2 text-slate-300 transition-all hover:bg-white/5 hover:text-white"
      title="Tercih Listem"
    >
      <Star className="h-5 w-5" />
      {mounted && favorites.length > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-bold text-white">
          {favorites.length > 9 ? "9+" : favorites.length}
        </span>
      )}
    </Link>
  );
}
