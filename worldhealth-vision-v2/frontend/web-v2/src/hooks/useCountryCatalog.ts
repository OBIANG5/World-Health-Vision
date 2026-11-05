import { useEffect, useState } from "react";
import { fetchCountries } from "../api/whvApi";
import type { CountrySummary } from "../api/types";

type CountryCatalogState = {
  countries: CountrySummary[];
  loading: boolean;
  error: string | null;
};

export function useCountryCatalog(): CountryCatalogState {
  const [state, setState] = useState<CountryCatalogState>({
    countries: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;

    async function loadCountries() {
      try {
        const countries = await fetchCountries();
        if (!active) {
          return;
        }

        setState({
          countries,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (!active) {
          return;
        }

        setState({
          countries: [],
          loading: false,
          error: error instanceof Error ? error.message : "Unable to load countries",
        });
      }
    }

    void loadCountries();

    return () => {
      active = false;
    };
  }, []);

  return state;
}