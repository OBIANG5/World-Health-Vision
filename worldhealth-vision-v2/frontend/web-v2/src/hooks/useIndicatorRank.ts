// WorldHealthVision V2 — useIndicatorRank
// Récupère le rang mondial et régional d'un pays pour un indicateur donné.
// Appelé à la demande (enabled=true) pour éviter de saturer l'API au chargement.

import { useEffect, useState } from "react";
import { fetchIndicatorRank } from "../api/whvApi";
import type { IndicatorRankResponse } from "../api/types";

type State = {
  rank: IndicatorRankResponse | null;
  loading: boolean;
  error: string | null;
};

export function useIndicatorRank(
  iso3: string,
  indicatorCode: string,
  enabled: boolean,
): State {
  const [state, setState] = useState<State>({ rank: null, loading: false, error: null });

  useEffect(() => {
    if (!enabled || !iso3 || !indicatorCode) return;

    let active = true;
    setState({ rank: null, loading: true, error: null });

    fetchIndicatorRank(iso3, indicatorCode)
      .then((rank) => {
        if (active) setState({ rank, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (active)
          setState({ rank: null, loading: false, error: err instanceof Error ? err.message : String(err) });
      });

    return () => { active = false; };
  }, [iso3, indicatorCode, enabled]);

  return state;
}