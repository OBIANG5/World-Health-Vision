// WorldHealthVision V2 — useFxHistory
// Récupère l'historique des taux de change sur 30 ou 90 jours via Frankfurter.
// Cache par clé "BASE-TARGET-DAYS" pour éviter les refetch.

import { useEffect, useState } from "react";
import { fetchFxHistory } from "../api/fxApi";
import type { FxHistoryPoint } from "../api/fxApi";

type State = { points: FxHistoryPoint[]; loading: boolean; error: string | null };

const historyCache = new Map<string, FxHistoryPoint[]>();

export function useFxHistory(
  base: string,
  target: string,
  days = 30,
  enabled = true,
): State {
  const key = `${base}-${target}-${days}`;

  const [state, setState] = useState<State>({
    points: historyCache.get(key) ?? [],
    loading: enabled && !historyCache.has(key),
    error: null,
  });

  useEffect(() => {
    if (!enabled || !base || !target || base === target) return;
    const cached = historyCache.get(key);
    if (cached) {
      setState({ points: cached, loading: false, error: null });
      return;
    }
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetchFxHistory(base, target, days)
      .then((pts) => {
        if (!active) return;
        historyCache.set(key, pts);
        setState({ points: pts, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!active) return;
        setState({ points: [], loading: false, error: err instanceof Error ? err.message : "Erreur historique FX" });
      });
    return () => { active = false; };
  }, [key, enabled, base, target, days]);

  return state;
}