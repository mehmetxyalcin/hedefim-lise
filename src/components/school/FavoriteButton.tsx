"use client";

import { useState } from "react";
import { Star, StarOff, Check } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import type { SchoolWithDetails } from "@/types/schoolDetail";

type Props = { school: SchoolWithDetails };

export function FavoriteButton({ school }: Props) {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const [showAdded, setShowAdded] = useState(false);

  const id = String(school.id);
  const added = isFavorite(id);

  const latestScore =
    [...school.scores].sort((a, b) => b.year - a.year)[0] ?? null;

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
        latest_score: latestScore
          ? {
              year: latestScore.year,
              percentile: latestScore.percentile,
              obp_score: latestScore.obpScore,
              lgs_score: latestScore.lgsScore,
              vocational_field_name:
                latestScore.vocationalField?.name ?? null,
            }
          : null,
      });
      setShowAdded(true);
      setTimeout(() => setShowAdded(false), 2000);
    }
  };

  if (showAdded) {
    return (
      <button
        type="button"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 font-semibold text-white"
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
        className="group flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 font-semibold text-gray-700 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
      >
        <StarOff className="h-5 w-5 text-gray-400 group-hover:text-red-500" />
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
