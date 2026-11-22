import { useEffect, useMemo, useState } from "react";
import {
  fetchCountryDetail,
  fetchCountryEconomicSnapshot,
  fetchCountryRelativeCostSnapshot,
} from "../api/whvApi";
import type {
  CountryDetail,
  CountryEconomicSnapshotResponse,
  CountryRelativeCostSnapshotResponse,
} from "../api/types";
import { buildWbLens, useWorldBankLenses } from "./useWorldBankLenses";

type CountrySheetState = {
  countryDetail: CountryDetail | null;
  economicSnapshot: CountryEconomicSnapshotResponse | null;
  relativeCostSnapshot: CountryRelativeCostSnapshotResponse | null;
  loading: boolean;
  error: string | null;
};

export function useCountrySheet(countryIso3: string, enabled: boolean): CountrySheetState {
  const [backendError, setBackendError] = useState<string | null>(null);
  const [backendCountryIso3, setBackendCountryIso3] = useState<string | null>(null);
  const [countryDetail, setCountryDetail] = useState<CountryDetail | null>(null);
  const [economicSnapshot, setEconomicSnapshot] = useState<CountryEconomicSnapshotResponse | null>(null);
  const [relativeCostSnapshot, setRelativeCostSnapshot] = useState<CountryRelativeCostSnapshotResponse | null>(null);
  const backendLoading = enabled && backendCountryIso3 !== countryIso3;

  useEffect(() => {
    if (!enabled || countryIso3.trim().length === 0) return;

    let active = true;
    // Scope-tagged state below already hides every value from the previous
    // country during the first render, before this effect even executes.
    // Synchronous state resets inside effects cause avoidable cascading renders.

    async function loadBackend() {
      // Losing Analytics MUST NOT make a successful Catalog country detail
      // vanish; individual calls are independent, including in staging.
      const [detailResult, econResult, costResult] = await Promise.allSettled([
        fetchCountryDetail(countryIso3),
        fetchCountryEconomicSnapshot(countryIso3),
        fetchCountryRelativeCostSnapshot(countryIso3),
      ]);
      if (!active) return;
      const detail = detailResult.status === "fulfilled" ? detailResult.value : null;
      const econ = econResult.status === "fulfilled" ? econResult.value : null;
      const cost = costResult.status === "fulfilled" ? costResult.value : null;
      setCountryDetail(detail);
      setEconomicSnapshot(econ);
      setRelativeCostSnapshot(cost);
      setBackendCountryIso3(countryIso3);
      const rejection = [detailResult, econResult, costResult].find(
        result => result.status === "rejected",
      );
      setBackendError(rejection?.status === "rejected"
        ? rejection.reason instanceof Error ? rejection.reason.message : "Country services unavailable"
        : null);
    }

    void loadBackend();
    return () => { active = false; };
  }, [countryIso3, enabled]);

  // React can render the new country BEFORE this effect clears state.
  // Scope every backend payload to the ISO3 it was actually fetched for.
  const safeCountryDetail = backendCountryIso3 === countryIso3 ? countryDetail : null;
  const safeEconomicSnapshot = backendCountryIso3 === countryIso3 ? economicSnapshot : null;
  const safeRelativeCostSnapshot = backendCountryIso3 === countryIso3 ? relativeCostSnapshot : null;
  const safeBackendError = backendCountryIso3 === countryIso3 ? backendError : null;

  // Données Banque Mondiale directes — toujours récupérées en parallèle, même si le backend répond
  const wbEnabled = enabled && countryIso3 !== "-99" && countryIso3.trim().length > 0;
  const { wbData, loading: wbLoading } = useWorldBankLenses(countryIso3, wbEnabled);

  // Fusion backend + WB direct : le backend est prioritaire, WB complète les indicateurs manquants
  const mergedEconomicSnapshot = useMemo((): CountryEconomicSnapshotResponse | null => {
    // Codes déjà fournis par le backend — on n'écrase pas avec WB
    const backendCodes = new Set((safeEconomicSnapshot?.lenses ?? []).map((l) => l.indicatorCode));

    // Lenses WB pour les indicateurs absents du backend
    const wbLenses = Object.entries(wbData)
      .filter(([code]) => !backendCodes.has(code))
      .map(([code, point]) => buildWbLens(countryIso3, code, point.value, point.year));

    if (safeEconomicSnapshot) {
      // Le backend a répondu — on lui ajoute les données WB supplémentaires
      if (wbLenses.length === 0) return safeEconomicSnapshot;
      const all = [...safeEconomicSnapshot.lenses, ...wbLenses];
      return { ...safeEconomicSnapshot, lenses: all, lensCount: all.length };
    }

    // Backend hors ligne — on construit un snapshot minimal à partir de WB seul
    if (wbLenses.length > 0 && !backendLoading) {
      return {
        country: {
          iso3: countryIso3,
          displayName: countryIso3,
          regionCode: null,
          regionName: null,
          subregionCode: null,
          subregionName: null,
          aggregate: false,
          active: true,
          dataQualityTier: 2,
        },
        generatedAtUtc: new Date().toISOString(),
        lensCount: wbLenses.length,
        highlights: [],
        lenses: wbLenses,
      };
    }

    return null;
  }, [safeEconomicSnapshot, wbData, countryIso3, backendLoading]);

  const hasWbData = Object.keys(wbData).length > 0;

  return {
    countryDetail: safeCountryDetail,
    economicSnapshot: mergedEconomicSnapshot,
    relativeCostSnapshot: safeRelativeCostSnapshot,
    loading: backendLoading || wbLoading,
    // WB direct and catalog metadata are separate: no accidental claims
    // that missing private series mean a country has no statistics.
    error: safeBackendError && !hasWbData && !safeEconomicSnapshot && !safeCountryDetail
      ? safeBackendError : null,
  };
}