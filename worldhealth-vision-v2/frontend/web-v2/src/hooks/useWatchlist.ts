// WorldHealthVision V2 — useWatchlist
// Persiste la liste de pays favoris (étoilés) dans localStorage.
// Clé unique par utilisateur : "whv_watchlist_v1".

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "whv_watchlist_v1";

function loadFromStorage(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return new Set(parsed as string[]);
  } catch {
    // storage corrompu — on repart de zéro
  }
  return new Set();
}

function saveToStorage(set: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    // quota dépassé — on ignore silencieusement
  }
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<Set<string>>(() => loadFromStorage());

  useEffect(() => {
    saveToStorage(watchlist);
  }, [watchlist]);

  const toggle = useCallback((iso3: string) => {
    setWatchlist((prev) => {
      const next = new Set(prev);
      if (next.has(iso3)) {
        next.delete(iso3);
      } else {
        next.add(iso3);
      }
      return next;
    });
  }, []);

  const isWatched = useCallback((iso3: string) => watchlist.has(iso3), [watchlist]);

  return { watchlist, toggle, isWatched };
}