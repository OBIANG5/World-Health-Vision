import { useEffect, useState } from "react";
import { fetchRegionEconomicSnapshot, fetchRegionRelativeCostSnapshot } from "../api/whvApi";
import type { RegionEconomicSnapshotResponse, RegionRelativeCostSnapshotResponse } from "../api/types";

type State = {
  economicSnapshot: RegionEconomicSnapshotResponse | null;
  relativeCostSnapshot: RegionRelativeCostSnapshotResponse | null;
  loading: boolean;
  error: string | null;
};

export function useRegionSheet(regionCode: string, enabled: boolean): State {
  const [state, setState] = useState<State>({
    economicSnapshot: null,
    relativeCostSnapshot: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!enabled || !regionCode) return;

    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));

    Promise.all([
      fetchRegionEconomicSnapshot(regionCode),
      fetchRegionRelativeCostSnapshot(regionCode),
    ])
      .then(([economicSnapshot, relativeCostSnapshot]) => {
        if (!active) return;
        setState({ economicSnapshot, relativeCostSnapshot, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!active) return;
        setState({
          economicSnapshot: null,
          relativeCostSnapshot: null,
          loading: false,
          error: err instanceof Error ? err.message : "Error loading region snapshot",
        });
      });

    return () => { active = false; };
  }, [regionCode, enabled]);

  return state;
}