// WorldHealthVision V2 — useFxRates
// Récupère les taux de change via Frankfurter. Mise en cache par paire de devise.

import { useEffect, useState } from "react";
import { fetchFxRates, FX_SUPPORTED_CURRENCIES } from "../api/fxApi";
import type { FxRatesResponse } from "../api/fxApi";

type State = {
  rates: FxRatesResponse | null;
  loading: boolean;
  error: string | null;
  supported: boolean;
};

const ratesCache = new Map<string, FxRatesResponse>();

export function useFxRates(baseCurrency: string): State {
  const supported = FX_SUPPORTED_CURRENCIES.has(baseCurrency.toUpperCase());
  const effectiveBase = supported ? baseCurrency.toUpperCase() : "USD";

  const [state, setState] = useState<State>({
    rates: ratesCache.get(effectiveBase) ?? null,
    loading: !ratesCache.has(effectiveBase),
    error: null,
    supported,
  });

  useEffect(() => {
    let active = true;
    const cached = ratesCache.get(effectiveBase);
    if (cached) {
      setState({ rates: cached, loading: false, error: null, supported });
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    fetchFxRates(effectiveBase)
      .then((data) => {
        if (!active) return;
        ratesCache.set(effectiveBase, data);
        setState({ rates: data, loading: false, error: null, supported });
      })
      .catch((err: unknown) => {
        if (!active) return;
        setState({
          rates: null,
          loading: false,
          error: err instanceof Error ? err.message : "Erreur taux de change",
          supported,
        });
      });

    return () => { active = false; };
  }, [effectiveBase, supported]);

  return state;
}