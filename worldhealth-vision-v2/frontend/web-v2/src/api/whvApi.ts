import axios, { AxiosError } from "axios";
import type {
  CatalogListResponse,
  CompareCountriesResponse,
  CountryDetail,
  CountryLocalContext,
  CountryLocalCoverageOverview,
  CountryNationalComparisons,
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
  SourceDataCoverage,
  CountryPublishedCoverage,
  CountryPublishedIndicatorsResponse,
  PublishedLatestSourcesResponse,
  ScopedPublishedValuesResponse,
  CatalogIndicatorDetail,
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

  private readonly ttlMs: number;

  constructor(ttlMs: number = DEFAULT_TTL_MS) {
    this.ttlMs = ttlMs;
  }

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
const sourceCoverageCache = new AsyncCache<SourceDataCoverage[]>(2 * 60 * 1000);
const countryLocalContextCache = new AsyncCache<CountryLocalContext>(2 * 60 * 1000);
const countrySourceCoverageCache = new AsyncCache<CountryLocalCoverageOverview>(2 * 60 * 1000);
const nationalComparisonCache = new AsyncCache<CountryNationalComparisons>(2 * 60 * 1000);

/**
 * Truthful country coverage: ONLY the real rights/attestation-filtered
 * Timeseries database. Do NOT infer coverage from catalog countries.
 * Intentionally no cache: permissions can be revoked after prior fetches.
 */
export async function fetchCountryPublishedCoverage(
  iso3: string,
): Promise<CountryPublishedCoverage> {
  const code = iso3.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) throw new Error("Invalid ISO3 country");
  const response = await whvApi.get<CountryPublishedCoverage>(
    `/api/timeseries/countries/${code}/published-coverage`,
    { timeout: 12000 },
  );
  const data = response.data;
  if (!data || data.countryIso3 !== code ||
      !["PUBLISHED_DATA_AVAILABLE", "NO_PUBLICLY_ELIGIBLE_DATA"].includes(data.coverageStatus) ||
      ![data.availableObservationCount, data.observedObservationCount,
        data.estimatedObservationCount, data.publishedIndicatorCount,
        data.publishedSourceCount].every(value => Number.isSafeInteger(value) && value >= 0) ||
      data.availableObservationCount !==
        data.observedObservationCount + data.estimatedObservationCount ||
      (data.coverageStatus === "NO_PUBLICLY_ELIGIBLE_DATA" &&
        data.availableObservationCount !== 0) ||
      (data.coverageStatus === "PUBLISHED_DATA_AVAILABLE" &&
        data.availableObservationCount === 0)) {
    throw new Error("Inconsistent public coverage data");
  }
  return data;
}

/** Rights can be revoked: NO client cache for these requests. */
export async function fetchCountryPublishedIndicators(
  iso3: string,
  limit = 100,
): Promise<CountryPublishedIndicatorsResponse> {
  const code = iso3.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code) || !Number.isInteger(limit) || limit < 1 || limit > 500)
    throw new Error("Invalid public indicator discovery request");
  const response = await whvApi.get<CountryPublishedIndicatorsResponse>(
    `/api/timeseries/countries/${code}/published-indicators`, { params: { limit }, timeout: 12000 },
  );
  const data = response.data;
  if (!data || !Array.isArray(data.items) || !Number.isSafeInteger(data.count) ||
      data.count !== data.items.length || data.items.length > limit ||
      !data.items.every((item) => item && typeof item.indicatorCode === "string" &&
        /^[A-Z0-9._-]{1,120}$/.test(item.indicatorCode) &&
        typeof item.indicatorDisplayName === "string" &&
        [item.availableObservationCount, item.observedObservationCount,
         item.estimatedObservationCount, item.publishedSourceCount].every(
           (value) => Number.isSafeInteger(value) && value >= 0,
         ) &&
        item.availableObservationCount > 0 && item.publishedSourceCount > 0 &&
        item.availableObservationCount === item.observedObservationCount + item.estimatedObservationCount))
    throw new Error("Inconsistent published indicator discovery response");
  return data;
}

/** Do not memoize source values: a signed grant can be revoked after viewing. */
export async function fetchPublishedLatestSources(
  iso3: string, indicatorCode: string,
): Promise<PublishedLatestSourcesResponse> {
  const code = iso3.trim().toUpperCase();
  const indicator = indicatorCode.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code) || !/^[A-Z0-9._-]{1,120}$/.test(indicator))
    throw new Error("Invalid latest-source query");
  const response = await whvApi.get<PublishedLatestSourcesResponse>(
    "/api/timeseries/series/latest",
    { params: { countryIso3: code, indicatorCode: indicator }, timeout: 12000 },
  );
  const data = response.data;
  if (!data || !Array.isArray(data.items) || !Number.isSafeInteger(data.count) ||
      data.count !== data.items.length || data.count > 1000 ||
      !data.items.every((item) =>
        item && item.countryIso3 === code && item.indicatorCode === indicator &&
        typeof item.sourceCode === "string" && typeof item.datasetCode === "string"))
    throw new Error("Inconsistent latest-source observation response");
  // Never render a SUPPRESSED/MISSING or null-valued record as a public value.
  const items = data.items.filter((item) =>
    ["OBSERVED", "ESTIMATED"].includes(item.valueStatus) &&
    (Number.isFinite(item.numericValue) || (typeof item.textValue === "string" && item.textValue.length > 0)));
  return { count: items.length, items };
}

export async function fetchCatalogIndicatorDetail(code: string): Promise<CatalogIndicatorDetail> {
  if (!/^[A-Z0-9._-]{1,120}$/.test(code)) throw new Error("Invalid indicator code");
  const response = await whvApi.get<CatalogIndicatorDetail>(
    `/api/catalog/indicators/${encodeURIComponent(code)}`, { timeout: 10000 },
  );
  if (!response.data || response.data.code !== code)
    throw new Error("Inconsistent catalog indicator information");
  return response.data;
}

export async function fetchCatalogSourceDetail(code: string): Promise<SourceDetail> {
  if (!/^[A-Z0-9._-]{1,120}$/.test(code)) throw new Error("Invalid source code");
  const response = await whvApi.get<SourceDetail>(
    `/api/catalog/sources/${encodeURIComponent(code)}`, { timeout: 10000 },
  );
  if (!response.data || response.data.code !== code)
    throw new Error("Inconsistent catalog source information");
  return response.data;
}

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

/**
 * Separate, documented national evidence. No fallback to fictional local
 * values when a backend is unreachable; callers must show "not verifiable".
 */
export async function fetchCountryLocalContext(iso3: string): Promise<CountryLocalContext> {
  const code = iso3.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) throw new Error("Invalid ISO3 country code");
  return countryLocalContextCache.get(code, async () => {
    try {
      const response = await whvApi.get<CountryLocalContext>(
        `/api/catalog/countries/${encodeURIComponent(code)}/local-context`,
        { timeout: 15000 },
      );
      const data = response.data;
      if (data.countryIso3 !== code || !Array.isArray(data.localSources) ||
          !Array.isArray(data.documentedReleases)) {
        throw new Error("Unexpected national evidence response");
      }
      return data;
    } catch (error) {
      throw new Error(`Unable to verify local country sources: ${extractErrorMessage(error)}`);
    }
  });
}

/** World-wide source research audit from the real country registry, including gaps. */
export async function fetchCountrySourceCoverage(): Promise<CountryLocalCoverageOverview> {
  return countrySourceCoverageCache.get("all", async () => {
    try {
      const response = await whvApi.get<CountryLocalCoverageOverview>(
        "/api/catalog/local-sources/coverage",
        { params: { limit: 500, offset: 0 }, timeout: 20000 },
      );
      const data = response.data;
      if (!Array.isArray(data.items)
          || !Number.isInteger(data.totalCountryCount)
          || !Number.isInteger(data.countriesNotResearchedLocally)
          || data.totalCountryCount < 0
          || data.returnedCount !== data.items.length
          || data.totalCountryCount < data.returnedCount) {
        throw new Error("Unexpected country coverage response");
      }
      return data;
    } catch (error) {
      throw new Error(`Unable to verify national source research: ${extractErrorMessage(error)}`);
    }
  });
}

/**
 * Read canonical international values alongside documented national releases.
 * A dependency failure is NOT rewritten as a "0 observations" claim.
 */
export async function fetchCountryNationalComparisons(
  iso3: string,
): Promise<CountryNationalComparisons> {
  const code = iso3.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) throw new Error("Invalid ISO3 country code");
  return nationalComparisonCache.get(code, async () => {
    try {
      const response = await whvApi.get<CountryNationalComparisons>(
        `/api/product/countries/${encodeURIComponent(code)}/national-comparisons`,
        { timeout: 15000 },
      );
      const data = response.data;
      if (data.countryIso3 !== code || !Array.isArray(data.comparisons) ||
          data.comparisonCount !== data.comparisons.length) {
        throw new Error("Invalid national comparison response");
      }
      return data;
    } catch (error) {
      throw new Error(`Unable to verify canonical international series: ${extractErrorMessage(error)}`);
    }
  });
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

/**
 * The catalog alone cannot prove data availability. This route reads the
 * canonical timeseries store and intentionally remains separate from fetchSources.
 * On a preview or disconnected backend, it REJECTS so the UI displays "unknown"
 * rather than claiming zero observations or presenting fabricated coverage.
 */
export async function fetchSourceDataCoverage(): Promise<SourceDataCoverage[]> {
  return sourceCoverageCache.get("all-source-coverage", async () => {
    try {
      const response = await whvApi.get<CatalogListResponse<SourceDataCoverage>>(
        "/api/timeseries/sources/coverage",
        { timeout: 15000 },
      );
      if (!Array.isArray(response.data.items)) {
        throw new Error("Unexpected source coverage response");
      }
      return response.data.items;
    } catch (error) {
      throw new Error(`Unable to load observed source coverage: ${extractErrorMessage(error)}`);
    }
  });
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

/**
 * Scoped observations are NOT national totals or country-comparison inputs.
 * No caching: an Ed25519 geography grant or original reuse right may be
 * revoked after a previously displayed value.
 */
export async function fetchCountryScopedPublishedValues(
  iso3: string, limit = 20,
): Promise<ScopedPublishedValuesResponse> {
  const code = iso3.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code) || !Number.isInteger(limit) || limit < 1 || limit > 50)
    throw new Error("Invalid scoped source request");
  const response = await whvApi.get<ScopedPublishedValuesResponse>(
    "/api/timeseries/countries/" + code + "/scoped-values",
    { params: { limit }, timeout: 12000, headers: { "Cache-Control": "no-cache" } },
  );
  const data = response.data;
  if (!data || !Array.isArray(data.items) || !Number.isSafeInteger(data.count) ||
      data.count !== data.items.length || data.count > limit ||
      !data.items.every(item => {
        if (!item || item.countryIso3Parent !== code ||
            item.comparabilityStatus !== "SOURCE_SCOPED_NOT_COUNTRY_EQUIVALENT" ||
            !["PARTIAL_COUNTRY","SUBNATIONAL"].includes(item.coverageKind) ||
            !["OBSERVED","ESTIMATED"].includes(item.valueStatus) ||
            !Number.isFinite(item.numericValue) ||
            ![item.sourceCode,item.datasetCode,item.indicatorCode].every(
              key => typeof key === "string" && /^[A-Z0-9._-]{1,64}$/.test(key)) ||
            typeof item.sourceNativeGeographyCode !== "string" ||
            !/^[A-Za-z0-9._-]{1,96}$/.test(item.sourceNativeGeographyCode) ||
            typeof item.geographicVersion !== "string" ||
            !/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(item.geographicVersion) ||
            (item.geographicReferenceYear !== null &&
              (!Number.isInteger(item.geographicReferenceYear) ||
               item.geographicReferenceYear < 1800 || item.geographicReferenceYear > 2200)) ||
            typeof item.scopeDisplayLabel !== "string" ||
            item.scopeDisplayLabel.trim().length === 0 ||
            item.scopeDisplayLabel.length > 256 ||
            !Array.isArray(item.territorialExclusions) || item.territorialExclusions.length > 32 ||
            !item.territorialExclusions.every(x => typeof x === "string" && x.length <= 256) ||
            typeof item.methodologyCode !== "string" || !/^[A-Za-z0-9._-]{1,96}$/.test(item.methodologyCode) ||
            typeof item.unitCode !== "string" || !/^[A-Za-z0-9._-]{1,64}$/.test(item.unitCode) ||
            typeof item.attributionText !== "string" || !item.attributionText.trim() ||
            typeof item.periodStart !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(item.periodStart) ||
            typeof item.periodEnd !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(item.periodEnd) ||
            typeof item.periodLabel !== "string" || item.periodLabel.length > 32 ||
            typeof item.fetchedAtUtc !== "string")
          return false;
        try {
          const src = new URL(item.sourceMetadataUrl);
          return src.protocol === "https:" && item.sourceMetadataUrl.length <= 1024;
        } catch { return false; }
      }))
    throw new Error("Unverified or misleading scoped publication response");
  return data;
}
