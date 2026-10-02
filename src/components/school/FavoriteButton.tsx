"use client";

import { useEffect, useState } from "react";
import { Check, Star } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { latestYearScores } from "@/lib/favorites";
import { cn } from "@/lib/cn";
import type { SchoolWithDetails } from "@/types/schoolDetail";
import { FOCUS } from "./doc-styles";

type Props = { school: SchoolWithDetails; className?: string };

// Tercih listesine ekleme/çıkarma: tek bir aç-kapa düğmesi (aria-pressed).
// Eklenince iki saniye "eklendi" der; listedeyken üzerine gelince ne
// yapacağını söyler. Belge dünyasının teal birincil eylemi.
export function FavoriteButton({ school, className }: Props) {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const [justAdded, setJustAdded] = useState(false);
  const id = String(school.id);
  const added = isFavorite(id);

  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setJustAdded(false), 2000);
    return () => clearTimeout(timer);
  }, [justAdded]);

  const toggle = () => {
    if (added) {
      removeFavorite(id);
      setJustAdded(false);
      return;
    }
    addFavorite({
      id,
      name: school.name,
      district: school.district,
      school_type: school.type,
      slug: school.slug,
      scores: latestYearScores(
        school.scores.map((s) => ({
          year: s.year,
          percentile: s.percentile,
          obp_score: s.obpScore,
          lgs_score: s.lgsScore,
          vocational_field_name: s.vocationalField?.name ?? null,
        })),
      ),
    });
    setJustAdded(true);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={added}
      className={cn(
        "group inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 font-display text-[15px] font-bold tracking-tight transition-colors duration-200",
        FOCUS,
        added
          ? justAdded
            ? "bg-[var(--teal-deep)] text-white"
            : "border border-[var(--teal)]/35 bg-[var(--teal-tint)] text-[var(--teal-deep)] hover:border-[var(--ink)]/30 hover:bg-[var(--doc-panel)] hover:text-[var(--ink)]"
          : "bg-[var(--teal)] text-white hover:bg-[var(--teal-deep)]",
        className,
      )}
    >
      {added ? (
        <>
          <Check className="h-[18px] w-[18px] shrink-0" strokeWidth={2.5} />
          {justAdded ? (
            <span>Tercihlerime eklendi</span>
          ) : (
            <>
              <span className="group-hover:hidden">Tercihlerimde</span>
              <span className="hidden group-hover:inline">Listeden çıkar</span>
            </>
          )}
        </>
      ) : (
        <>
          <Star className="h-[18px] w-[18px] shrink-0" strokeWidth={2.25} />
          <span>Tercihlerime ekle</span>
        </>
      )}
    </button>
  );
}
