"use client";

import { useState } from "react";
import { Star, StarOff, Check } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { latestYearScores } from "@/lib/favorites";
import type { SchoolWithDetails } from "@/types/schoolDetail";

type Props = { school: SchoolWithDetails };

export function FavoriteButton({ school }: Props) {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const [showAdded, setShowAdded] = useState(false);

  const id = String(school.id);
  const added = isFavorite(id);

  const latestScores = latestYearScores(
    school.scores.map((s) => ({
      year: s.year,
      percentile: s.percentile,
      obp_score: s.obpScore,
      lgs_score: s.lgsScore,
      vocational_field_name: s.vocationalField?.name ?? null,
    })),
  );

  const handleClick = () => {
    if (added) {
      removeFavorite(id);
    } else {
      addFavorite({
        id,
        name: school.name,
        district: school.district,
        school_type: school.type,
        slug: school.slug,
        scores: latestScores,
      });
      setShowAdded(true);
      setTimeout(() => setShowAdded(false), 2000);
    }
  };

  if (showAdded) {
    return (
      <button
        type="button"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white"
      >
        <Check className="h-5 w-5" />
        Listeye Eklendi!
      </button>
    );
  }

  if (added) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="group flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 font-semibold text-slate-700 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
      >
        <StarOff className="h-5 w-5 text-slate-400 group-hover:text-rose-500" />
        <span className="group-hover:hidden">Tercihlerimde</span>
        <span className="hidden group-hover:inline">Listeden Çıkar</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition-all hover:bg-blue-700"
    >
      <Star className="h-5 w-5" />
      Tercihe Ekle
    </button>
  );
}
