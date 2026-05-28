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
const SYNC_EVENT = "hedefim_favorites_updated";

function readStorage(): FavoriteSchool[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as FavoriteSchool[]) : [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteSchool[]>([]);

  useEffect(() => {
    setFavorites(readStorage());

    // Aynı sekmedeki diğer useFavorites örneklerini senkronize et
    const onSync = () => setFavorites(readStorage());
    window.addEventListener(SYNC_EVENT, onSync);
    return () => window.removeEventListener(SYNC_EVENT, onSync);
  }, []);

  const save = (list: FavoriteSchool[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    setFavorites(list);
    window.dispatchEvent(new Event(SYNC_EVENT));
  };

  const addFavorite = (school: FavoriteSchool) => {
    const current = readStorage();
    if (current.some((f) => f.id === school.id)) return;
    save([...current, school]);
  };

  const removeFavorite = (id: string) => {
    save(readStorage().filter((f) => f.id !== id));
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
