import { useEffect, useState } from "react";
import { fetchIndicatorOverview } from "../api/whvApi";
import type { IndicatorOverviewResponse } from "../api/types";

type State = {
  overview: IndicatorOverviewResponse | null;
  loading: boolean;
  error: string | null;
};

export function useIndicatorOverview(
  iso3: string,
  indicatorCode: string,
  enabled: boolean,
): State {
  const [state, setState] = useState<State>({ overview: null, loading: false, error: null });

  useEffect(() => {
    if (!enabled || !iso3 || !indicatorCode) return;

    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));

    fetchIndicatorOverview(iso3, indicatorCode)
      .then((data) => {
        if (!active) return;
        setState({ overview: data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!active) return;
        setState({
          overview: null,
          loading: false,
          error: err instanceof Error ? err.message : "Error loading indicator overview",
        });
      });

    return () => { active = false; };
  }, [iso3, indicatorCode, enabled]);

  return state;
}