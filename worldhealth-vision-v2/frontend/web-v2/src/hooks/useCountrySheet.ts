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
  const [backendLoading, setBackendLoading] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [countryDetail, setCountryDetail] = useState<CountryDetail | null>(null);
  const [economicSnapshot, setEconomicSnapshot] = useState<CountryEconomicSnapshotResponse | null>(null);
  const [relativeCostSnapshot, setRelativeCostSnapshot] = useState<CountryRelativeCostSnapshotResponse | null>(null);

  useEffect(() => {
    if (!enabled || countryIso3.trim().length === 0) return;

    let active = true;
    setBackendLoading(true);
    setBackendError(null);
    setCountryDetail(null);
    setEconomicSnapshot(null);
    setRelativeCostSnapshot(null);

    async function loadBackend() {
      try {
        const [detail, econ, cost] = await Promise.all([
          fetchCountryDetail(countryIso3),
          fetchCountryEconomicSnapshot(countryIso3),
          fetchCountryRelativeCostSnapshot(countryIso3),
        ]);
        if (!active) return;
        setCountryDetail(detail);
        setEconomicSnapshot(econ);
        setRelativeCostSnapshot(cost);
        setBackendLoading(false);
        setBackendError(null);
      } catch (error) {
        if (!active) return;
        setBackendLoading(false);
        setBackendError(error instanceof Error ? error.message : "Unable to load country sheet");
      }
    }

    void loadBackend();
    return () => { active = false; };
  }, [countryIso3, enabled]);

  // Données Banque Mondiale directes — toujours récupérées en parallèle, même si le backend répond
  const wbEnabled = enabled && countryIso3 !== "-99" && countryIso3.trim().length > 0;
  const { wbData, loading: wbLoading } = useWorldBankLenses(countryIso3, wbEnabled);

  // Fusion backend + WB direct : le backend est prioritaire, WB complète les indicateurs manquants
  const mergedEconomicSnapshot = useMemo((): CountryEconomicSnapshotResponse | null => {
    // Codes déjà fournis par le backend — on n'écrase pas avec WB
    const backendCodes = new Set((economicSnapshot?.lenses ?? []).map((l) => l.indicatorCode));

    // Lenses WB pour les indicateurs absents du backend
    const wbLenses = Object.entries(wbData)
      .filter(([code]) => !backendCodes.has(code))
      .map(([code, point]) => buildWbLens(countryIso3, code, point.value, point.year));

    if (economicSnapshot) {
      // Le backend a répondu — on lui ajoute les données WB supplémentaires
      if (wbLenses.length === 0) return economicSnapshot;
      const all = [...economicSnapshot.lenses, ...wbLenses];
      return { ...economicSnapshot, lenses: all, lensCount: all.length };
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
  }, [economicSnapshot, wbData, countryIso3, backendLoading]);

  const hasWbData = Object.keys(wbData).length > 0;

  return {
    countryDetail,
    economicSnapshot: mergedEconomicSnapshot,
    relativeCostSnapshot,
    loading: backendLoading || wbLoading,
    // N'affiche l'erreur backend que si WB est aussi vide (pas d'internet ou code inconnu)
    error: backendError && !hasWbData ? backendError : null,
  };
}