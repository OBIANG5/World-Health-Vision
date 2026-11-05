import { useEffect, useState } from "react";
import { fetchTimeSeriesHistory } from "../api/whvApi";
import { fetchWbHistory } from "../api/worldBankDirectApi";
import { WB_DIRECT_CODES } from "./useWorldBankLenses";
import type { TimeseriesPoint } from "../api/types";

type State = {
  points: TimeseriesPoint[];
  loading: boolean;
  error: string | null;
};

const WB_CODE_SET = new Set<string>(WB_DIRECT_CODES);

export function useIndicatorHistory(
  iso3: string,
  indicatorCode: string,
  enabled: boolean,
  limit = 250,
): State {
  const [state, setState] = useState<State>({ points: [], loading: false, error: null });

  useEffect(() => {
    if (!enabled || !iso3 || !indicatorCode) return;

    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));

    async function load() {
      // 1. Essai via le backend WHV (timeseries-service)
      try {
        const res = await fetchTimeSeriesHistory(iso3, indicatorCode, limit);
        if (!active) return;
        if (res.items.length > 0) {
          setState({ points: res.items, loading: false, error: null });
          return;
        }
      } catch {
        // Backend inaccessible — on continue vers le fallback WB
      }

      // 2. Fallback : API Banque Mondiale directe (pour les codes WB standards)
      if (WB_CODE_SET.has(indicatorCode)) {
        try {
          const wbPoints = await fetchWbHistory(iso3, indicatorCode, 60);
          if (!active) return;
          if (wbPoints.length > 0) {
            const points: TimeseriesPoint[] = wbPoints.map((p) => ({
              periodStart: `${p.year}-01-01`,
              periodLabel: p.year,
              numericValue: p.value,
              valueStatus: "OBSERVED",
              sourceCode: "WORLD_BANK",
              sourceDisplayName: "Banque Mondiale",
              datasetCode: "WB_PUBLIC_DATA",
            }));
            setState({ points, loading: false, error: null });
            return;
          }
        } catch {
          // Pas de données WB disponibles non plus
        }
      }

      if (!active) return;
      setState({ points: [], loading: false, error: null });
    }

    void load();
    return () => { active = false; };
  }, [iso3, indicatorCode, enabled, limit]);

  return state;
}