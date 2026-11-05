// WorldHealthVision V2 — useRegions
// Fetches the list of available regions from the catalog service.

import { useEffect, useState } from "react";
import { fetchRegions } from "../api/whvApi";
import type { RegionSummary } from "../api/types";

type State = {
  regions: RegionSummary[];
  loading: boolean;
  error: string | null;
};

export function useRegions(): State {
  const [state, setState] = useState<State>({ regions: [], loading: false, error: null });

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));

    fetchRegions()
      .then((data) => {
        if (!active) return;
        setState({ regions: data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!active) return;
        setState({
          regions: [],
          loading: false,
          error: err instanceof Error ? err.message : "Error loading regions",
        });
      });

    return () => { active = false; };
  }, []);

  return state;
}