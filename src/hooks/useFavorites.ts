"use client";

import { useState, useEffect } from "react";

export type FavoriteSchool = {
  id: string;
  name: string;
  district: string;
  school_type: string;
  slug: string;
  latest_score: {
    year: number;
    percentile: number | null;
    obp_score: number | null;
    lgs_score: number | null;
    vocational_field_name: string | null;
  } | null;
};

const STORAGE_KEY = "hedefim_favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteSchool[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setFavorites(JSON.parse(stored));
    } catch {}
  }, []);

  const save = (list: FavoriteSchool[]) => {
    setFavorites(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const addFavorite = (school: FavoriteSchool) => {
    if (favorites.some((f) => f.id === school.id)) return;
    save([...favorites, school]);
  };

  const removeFavorite = (id: string) => {
    save(favorites.filter((f) => f.id !== id));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const list = [...favorites];
    [list[index - 1], list[index]] = [list[index], list[index - 1]];
    save(list);
  };

  const moveDown = (index: number) => {
    if (index === favorites.length - 1) return;
    const list = [...favorites];
    [list[index], list[index + 1]] = [list[index + 1], list[index]];
    save(list);
  };

  const clearAll = () => save([]);

  const isFavorite = (id: string) => favorites.some((f) => f.id === id);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    moveUp,
    moveDown,
    clearAll,
    isFavorite,
  };
}
