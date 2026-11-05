import axios, { AxiosError } from "axios";
import type {
  CatalogListResponse,
  CompareCountriesResponse,
  CountryDetail,
  CountryEconomicSnapshotResponse,
  CountryRelativeCostSnapshotResponse,
  CountrySummary,
  ForecastResponse,
  IndicatorOverviewResponse,
  IndicatorRankResponse,
  RegionEconomicSnapshotResponse,
  RegionRelativeCostSnapshotResponse,
  RegionSummary,
  SourceDetail,
  TimeseriesSeriesResponse,
} from "./types";

const apiBaseUrl = import.meta.env.VITE_WHV_API_BASE_URL ?? "";

const whvApi = axios.create({
  baseURL: apiBaseUrl,
  timeout: 20000,
});

function extractErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    if (typeof error.response?.data?.detail === "string") {
      return error.response.data.detail;
    }

    if (typeof error.message === "string" && error.message.length > 0) {
      return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown API error";
}

// ---------------------------------------------------------------------------
// Cache mémoire + déduplication des requêtes en vol
// ---------------------------------------------------------------------------
// Les rangs, overviews et historiques s'affichent à plusieurs endroits du
// drawer et se relancent à chaque changement d'onglet / clic d'indicateur.
// Côté backend, un rang = un scan de TOUS les pays : sans cache, ouvrir un
// pays déclenche 4 scans monde simultanés (cartes KPI du Résumé), puis un de
// plus par indicateur cliqué. Ce cache garantit qu'une même clé n'est calculée
// qu'une fois par session (TTL court), et que des appels concurrents
// identiques partagent une seule requête réseau.

const DEFAULT_TTL_MS = 5 * 60 * 1000;

type CacheSlot<T> = { value: T; expiresAt: number };

class AsyncCache<T> {
  private readonly store = new Map<string, CacheSlot<T>>();
  private readonly inflight = new Map<string, Promise<T>>();

  constructor(private readonly ttlMs: number = DEFAULT_TTL_MS) {}

  get(key: string, loader: () => Promise<T>): Promise<T> {
    const slot = this.store.get(key);
    if (slot && slot.expiresAt > Date.now()) return Promise.resolve(slot.value);

    const pending = this.inflight.get(key);
    if (pending) return pending;

    const promise = loader()
      .then((value) => {
        this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
        this.inflight.delete(key);
        return value;
      })
      .catch((error) => {
        // Les erreurs ne sont pas mises en cache → un nouvel essai reste possible.
        this.inflight.delete(key);
        throw error;
      });

    this.inflight.set(key, promise);
    return promise;
  }
}

const rankCache = new AsyncCache<IndicatorRankResponse>();
const overviewCache = new AsyncCache<IndicatorOverviewResponse>();
const historyCache = new AsyncCache<TimeseriesSeriesResponse>();

export async function fetchCountries(): Promise<CountrySummary[]> {
  try {
    const response = await whvApi.get<CatalogListResponse<CountrySummary>>(
      "/api/catalog/countries",
      {
        params: {
          includeAggregates: false,
          activeOnly: true,
          limit: 500,
        },
      },
    );

    return [...response.data.items].sort((left, right) =>
      left.displayName.localeCompare(right.displayName),
    );
  } catch (error) {
    throw new Error(`Unable to load countries: ${extractErrorMessage(error)}`);
  }
}

export async function fetchCountryDetail(iso3: string): Promise<CountryDetail> {
  try {
    const response = await whvApi.get<CountryDetail>(`/api/catalog/countries/${iso3}`);
    return response.data;
  } catch (error) {
    throw new Error(`Unable to load country details: ${extractErrorMessage(error)}`);
  }
}

export async function fetchCountryEconomicSnapshot(
  iso3: string,
): Promise<CountryEconomicSnapshotResponse> {
  try {
    const response = await whvApi.get<CountryEconomicSnapshotResponse>(
      `/api/product/countries/${iso3}/economic-snapshot`,
    );
    return response.data;
  } catch (error) {
    throw new Error(`Unable to load economic snapshot: ${extractErrorMessage(error)}`);
  }
}

export async function fetchCountryRelativeCostSnapshot(
  iso3: string,
): Promise<CountryRelativeCostSnapshotResponse> {
  try {
    const response = await whvApi.get<CountryRelativeCostSnapshotResponse>(
      `/api/product/countries/${iso3}/relative-cost-snapshot`,
    );
    return response.data;
  } catch (error) {
    throw new Error(`Unable to load relative-cost snapshot: ${extractErrorMessage(error)}`);
  }
}

// ---------------------------------------------------------------------------
// Timeseries history — for trend charts
// ---------------------------------------------------------------------------

export async function fetchTimeSeriesHistory(
  iso3: string,
  indicatorCode: string,
  limit = 250,
): Promise<TimeseriesSeriesResponse> {
  return historyCache.get(`${iso3}|${indicatorCode}|${limit}`, async () => {
    try {
      // Sort DESC to get the most recent data first, then reverse for chronological display.
      // limit=250 covers 65 years × 3–4 sources without truncating recent years.
      const response = await whvApi.get<TimeseriesSeriesResponse>("/api/timeseries/series", {
        params: { countryIso3: iso3, indicatorCode, sortDirection: "DESC", limit },
      });
      return { ...response.data, items: [...response.data.items].reverse() };
    } catch (error) {
      throw new Error(`Unable to load time series: ${extractErrorMessage(error)}`);
    }
  });
}

// ---------------------------------------------------------------------------
// Indicator overview — per-source breakdown
// ---------------------------------------------------------------------------

export async function fetchIndicatorOverview(
  iso3: string,
  indicatorCode: string,
): Promise<IndicatorOverviewResponse> {
  return overviewCache.get(`${iso3}|${indicatorCode}`, async () => {
    try {
      const response = await whvApi.get<IndicatorOverviewResponse>(
        `/api/product/countries/${iso3}/indicators/${indicatorCode}/overview`,
        { params: { seriesLimit: 12 } },
      );
      return response.data;
    } catch (error) {
      throw new Error(`Unable to load indicator overview: ${extractErrorMessage(error)}`);
    }
  });
}

// ---------------------------------------------------------------------------
// Rankings
// ---------------------------------------------------------------------------

export async function fetchIndicatorRank(
  iso3: string,
  indicatorCode: string,
): Promise<IndicatorRankResponse> {
  return rankCache.get(`${iso3}|${indicatorCode}`, async () => {
    try {
      const response = await whvApi.get<IndicatorRankResponse>(
        `/api/product/countries/${iso3}/indicators/${encodeURIComponent(indicatorCode)}/rank`,
      );
      return response.data;
    } catch (error) {
      throw new Error(`Unable to load indicator rank: ${extractErrorMessage(error)}`);
    }
  });
}

// ---------------------------------------------------------------------------
// Sources — catalogue méthodologie
// ---------------------------------------------------------------------------

export async function fetchSources(): Promise<SourceDetail[]> {
  try {
    const response = await whvApi.get<CatalogListResponse<SourceDetail>>("/api/catalog/sources", {
      params: { enabledOnly: true },
    });
    return response.data.items;
  } catch (error) {
    throw new Error(`Unable to load sources: ${extractErrorMessage(error)}`);
  }
}

// ---------------------------------------------------------------------------
// Regions
// ---------------------------------------------------------------------------

export async function fetchRegions(): Promise<RegionSummary[]> {
  try {
    const response = await whvApi.get<CatalogListResponse<RegionSummary>>("/api/catalog/regions");
    return response.data.items;
  } catch (error) {
    throw new Error(`Unable to load regions: ${extractErrorMessage(error)}`);
  }
}

export async function fetchRegionEconomicSnapshot(
  regionCode: string,
): Promise<RegionEconomicSnapshotResponse> {
  try {
    const response = await whvApi.get<RegionEconomicSnapshotResponse>(
      `/api/product/regions/${regionCode}/economic-snapshot`,
    );
    return response.data;
  } catch (error) {
    throw new Error(`Unable to load region economic snapshot: ${extractErrorMessage(error)}`);
  }
}

export async function fetchRegionRelativeCostSnapshot(
  regionCode: string,
): Promise<RegionRelativeCostSnapshotResponse> {
  try {
    const response = await whvApi.get<RegionRelativeCostSnapshotResponse>(
      `/api/product/regions/${regionCode}/relative-cost-snapshot`,
    );
    return response.data;
  } catch (error) {
    throw new Error(`Unable to load region relative-cost snapshot: ${extractErrorMessage(error)}`);
  }
}

// ---------------------------------------------------------------------------
// Forecast — linear OLS projection with prediction intervals
// ---------------------------------------------------------------------------

export async function fetchIndicatorForecast(
  iso3: string,
  indicatorCode: string,
  lang: string = "fr",
): Promise<ForecastResponse> {
  try {
    const response = await whvApi.get<ForecastResponse>(
      `/api/analytics/countries/${iso3}/indicators/${encodeURIComponent(indicatorCode)}/forecast`,
      { params: { lang } },
    );
    return response.data;
  } catch (error) {
    throw new Error(`Unable to load forecast: ${extractErrorMessage(error)}`);
  }
}

// ---------------------------------------------------------------------------
// Multi-country comparison
// ---------------------------------------------------------------------------

export async function fetchCompareCountries(
  iso3List: string[],
  indicatorCode: string,
): Promise<CompareCountriesResponse> {
  try {
    const params = new URLSearchParams();
    iso3List.forEach((iso3) => params.append("countryIso3", iso3));
    params.append("indicatorCode", indicatorCode);
    const response = await whvApi.get<CompareCountriesResponse>(
      `/api/product/compare/countries/latest?${params.toString()}`,
    );
    return response.data;
  } catch (error) {
    throw new Error(`Unable to load comparison: ${extractErrorMessage(error)}`);
  }
}