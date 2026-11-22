import { useEffect, useMemo, useState } from "react";
import { fetchCountries } from "../api/whvApi";
import type { CountrySummary } from "../api/types";
import { useLang } from "../context/LanguageContext";
import {
  listWorldBankCatalog,
  worldBankCatalogProvenance,
  type CountryCatalogSource,
} from "../catalog/worldBankCountryCatalog";

type CountryCatalogState = {
  countries: CountrySummary[];
  // The versioned static catalog is available at first render, so there is
  // no global blocking spinner while the private Gateway is missing.
  loading: boolean;
  error: string | null;
  source: CountryCatalogSource;
  asOfUtc: string | null;
};

/**
 * Progressive enhancement: immediately navigable, dated, attributed
 * World Bank geography → upgrade to the real WHV Catalog when it responds.
 *
 * Never convert WB metadata into rights-approved statistical series.
 * The snapshot is independent of the 217-country WHV canonical registry.
 */
export function useCountryCatalog(): CountryCatalogState {
  const locale = useLang();
  const offlineCountries = useMemo(() => listWorldBankCatalog(locale), [locale]);
  const [liveCountries, setLiveCountries] = useState<CountrySummary[] | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadCountries() {
      try {
        const countries = await fetchCountries();
        if (!active) return;
        if (!Array.isArray(countries) || countries.length === 0) {
          throw new Error("World-Vision Catalog returned an empty list");
        }
        setLiveCountries(countries);
        setBackendError(null);
      } catch (error) {
        if (!active) return;
        setLiveCountries(null);
        setBackendError(error instanceof Error ? error.message : "Unable to reach World-Vision Catalog");
      }
    }
    void loadCountries();
    return () => { active = false; };
  }, []);

  return {
    countries: liveCountries ?? offlineCountries,
    loading: false,
    error: backendError,
    source: liveCountries ? "WHV_CATALOG" : "WORLD_BANK_SNAPSHOT",
    asOfUtc: liveCountries ? null : worldBankCatalogProvenance.asOfUtc,
  };
}
