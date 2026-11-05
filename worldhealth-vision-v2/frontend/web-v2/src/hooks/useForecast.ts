import { useEffect, useState } from "react";
import { fetchIndicatorForecast } from "../api/whvApi";
import type { ForecastResponse } from "../api/types";

type State = {
  forecast: ForecastResponse | null;
  loading: boolean;
  error: string | null;
};

export function useForecast(
  iso3: string,
  indicatorCode: string,
  lang: string,
  enabled: boolean,
): State {
  const [state, setState] = useState<State>({ forecast: null, loading: false, error: null });

  useEffect(() => {
    if (!enabled || !iso3 || !indicatorCode) return;

    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));

    fetchIndicatorForecast(iso3, indicatorCode, lang)
      .then((res) => {
        if (!active) return;
        setState({ forecast: res, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!active) return;
        setState({
          forecast: null,
          loading: false,
          error: err instanceof Error ? err.message : "Erreur de chargement de la projection",
        });
      });

    return () => { active = false; };
  }, [iso3, indicatorCode, lang, enabled]);

  return state;
}