"use client";

import { useSyncExternalStore } from "react";
import {
  mergeFreshFavorites,
  moveFavorite,
  parseFavorites,
  type FavoriteSchool,
  type FreshSchoolRow,
} from "@/lib/favorites";

export type { FavoriteSchool, FavoriteScore } from "@/lib/favorites";

const STORAGE_KEY = "hedefim_favorites";
const SYNC_EVENT = "hedefim_favorites_updated";
const EMPTY: FavoriteSchool[] = [];

// useSyncExternalStore aynı veri için aynı referansı ister; ham metin
// değişmedikçe önceki ayrıştırılmış liste döner.
let cachedRaw: string | null = null;
let cachedList: FavoriteSchool[] = EMPTY;

function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function getSnapshot(): FavoriteSchool[] {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedList = raw ? parseFavorites(raw) : EMPTY;
  }
  return cachedList;
}

function getServerSnapshot(): FavoriteSchool[] {
  return EMPTY;
}

function subscribe(onChange: () => void) {
  // Aynı sekmedeki bileşenler SYNC_EVENT, diğer sekmeler `storage` ile.
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === STORAGE_KEY) onChange();
  };
  window.addEventListener(SYNC_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(SYNC_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function write(list: FavoriteSchool[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Gizli pencere / dolu depolama: liste bu oturumda değişmez.
    return;
  }
  window.dispatchEvent(new Event(SYNC_EVENT));
}

const noopSubscribe = () => () => {};

/** Sunucu ve hidrasyon sırasında false, tarayıcıda localStorage okunduktan sonra true. */
function useIsClient() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = useIsClient();

  const addFavorite = (school: FavoriteSchool) => {
    const current = getSnapshot();
    if (current.some((f) => f.id === school.id)) return;
    write([...current, school]);
  };

  const removeFavorite = (id: string) => {
    write(getSnapshot().filter((f) => f.id !== id));
  };

  const moveUp = (index: number) => write(moveFavorite(getSnapshot(), index, -1));

  const moveDown = (index: number) => write(moveFavorite(getSnapshot(), index, 1));

  const clearAll = () => write([]);

  const isFavorite = (id: string) => favorites.some((f) => f.id === id);

  /**
   * Sunucudan gelen güncel okul satırlarını listeye işler ve yanıtta
   * bulunmayan okulların kimliklerini döner. Liste o arada başka yerde
   * değişmiş olabileceği için her zaman depodaki son hal esas alınır.
   */
  const applyFreshRows = (rows: FreshSchoolRow[], requestedIds: string[]) => {
    const current = getSnapshot();
    const requested = new Set(requestedIds);
    const { list, missingIds } = mergeFreshFavorites(current, rows);
    if (JSON.stringify(list) !== JSON.stringify(current)) write(list);
    return missingIds.filter((id) => requested.has(id));
  };

  return {
    favorites,
    ready,
    addFavorite,
    removeFavorite,
    moveUp,
    moveDown,
    clearAll,
    isFavorite,
    applyFreshRows,
  };
}
