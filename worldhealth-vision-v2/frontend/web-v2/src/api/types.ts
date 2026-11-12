export type AgreementLevel =
  | "CONSISTENT"
  | "MIXED"
  | "DIVERGENT"
  | "INSUFFICIENT_DATA";

export type ConfidenceLevel =
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "INSUFFICIENT_EVIDENCE";

export type FreshnessLevel = "FRESH" | "AGING" | "STALE" | "UNKNOWN";

export type SignalTone = "POSITIVE" | "BALANCED" | "WATCH" | "STRESS" | "CONTEXT";

export type AuditEvidenceSeverity = "POSITIVE" | "INFO" | "CAUTION" | "WARNING";

export interface CatalogListResponse<T> {
  count: number;
  items: T[];
}

export interface CountrySummary {
  iso3: string;
  iso2: string | null;
  displayName: string;
  regionCode: string | null;
  regionName: string | null;
  subregionCode: string | null;
  subregionName: string | null;
  currencyCode: string | null;
  currencyName: string | null;
  currencySymbol: string | null;
  capitalCity: string | null;
  aggregate: boolean;
  active: boolean;
}

export interface CountryDetail extends CountrySummary {
  worldBankIncomeGroup: string | null;
  lendingType: string | null;
  capitalCity: string | null;
  latitude: number | null;
  longitude: number | null;
  sovereignState: string | null;
  currencyMinorUnit: number | null;
  dataQualityTier: number;
}

/** Country-local research registry. Verified organization is not verified data. */
export interface CountryLocalSource {
  countryIso3: string;
  sourceCode: string;
  displayName: string;
  organizationName: string;
  sourceRole: string;
  sourceType: "NATIONAL_OFFICIAL" | "LOCAL_MEDIA" | "LOCAL_RESEARCH" | "LOCAL_COMMUNITY";
  homepageUrl: string;
  evidenceUrl: string;
  verificationState: "VERIFIED_ORGANIZATION" | "REVIEW_REQUIRED";
  lastReviewedOn: string;
  methodologyCaveat: string;
  reuseRightsNote: string;
}

/** A documented release is editorial evidence, NOT a canonical observation. */
export interface CountryDocumentedRelease {
  releaseCode: string;
  countryIso3: string;
  sourceCode: string;
  indicatorCode: string;
  referenceYear: number;
  valueNumeric: number;
  unitLabel: string;
  populationScope: "ALL_RESIDENTS" | "NATIONAL_CITIZENS" | "NOT_APPLICABLE";
  methodKind: string;
  publicationStatus: string;
  releaseDate: string;
  title: string;
  primaryEvidenceUrl: string;
  corroborationUrl: string | null;
  methodologyCaveat: string;
  internationalComparisonNote: string;
  verificationStatus: "DOCUMENTED_NOT_INGESTED" | "INGESTED_VERIFIED";
  reviewedOn: string;
}

export interface CountryLocalContext {
  countryIso3: string;
  localSourceCount: number;
  localSources: CountryLocalSource[];
  documentedReleaseCount: number;
  documentedReleases: CountryDocumentedRelease[];
}

export interface SourceAuditEvidence {
  code: string;
  severity: AuditEvidenceSeverity;
  title: string;
  detail: string;
  metricLabel: string | null;
  metricValue: number | string | null;
  sourceCodes: string[];
  datasetCodes: string[];
}

export interface SourceAuditView {
  scopeType: "COUNTRY" | "REGION" | "CONTINENT" | "SUBREGION";
  scopeCode: string;
  scopeDisplayName: string;
  indicatorCode: string;
  indicatorDisplayName: string;
  confidenceLevel: ConfidenceLevel;
  freshnessLevel: FreshnessLevel;
  agreementLevel: AgreementLevel;
  primarySourceCode: string | null;
  primarySourceDisplayName: string | null;
  comparableSourceCount: number;
  evidence: SourceAuditEvidence[];
}

export interface CountryEconomicLens {
  lensCode: string;
  lensDisplayName: string;
  signalTone: SignalTone;
  headline: string;
  narrative: string;
  whyItMatters: string;
  indicatorCode: string;
  indicatorDisplayName: string;
  unitLabel: string;
  latestComparableValue: number | null;
  latestComparableSourceCount: number;
  latestPeriodLabel: string | null;
  trendDirection: "UP" | "DOWN" | "FLAT" | "INSUFFICIENT_DATA";
  selectedSourceCode: string | null;
  selectedDatasetCode: string | null;
  agreementLevel: AgreementLevel;
  confidenceLevel: ConfidenceLevel;
  freshnessLevel: FreshnessLevel;
  sourceAudit: SourceAuditView;
}

export interface CountryEconomicSnapshotResponse {
  country: {
    iso3: string;
    displayName: string;
    regionCode: string | null;
    regionName: string | null;
    subregionCode: string | null;
    subregionName: string | null;
    aggregate: boolean;
    active: boolean;
    dataQualityTier: number;
  };
  generatedAtUtc: string;
  lensCount: number;
  highlights: string[];
  lenses: CountryEconomicLens[];
}

export interface CountryRelativeCostLens {
  lensCode: string;
  lensDisplayName: string;
  signalTone: SignalTone;
  headline: string;
  narrative: string;
  whyItMatters: string;
  indicatorCode: string;
  indicatorDisplayName: string;
  unitLabel: string;
  latestComparableValue: number | null;
  latestComparableSourceCount: number;
  latestPeriodLabel: string | null;
  trendDirection: "UP" | "DOWN" | "FLAT" | "INSUFFICIENT_DATA";
  selectedSourceCode: string | null;
  selectedDatasetCode: string | null;
  agreementLevel: AgreementLevel;
  confidenceLevel: ConfidenceLevel;
  freshnessLevel: FreshnessLevel;
  sourceAudit: SourceAuditView;
}

export interface RelativeCostDecisionSignal {
  decisionCode: string;
  decisionDisplayName: string;
  signalTone: SignalTone;
  headline: string;
  narrative: string;
  whyItMatters: string;
  supportingLensCodes: string[];
  confidenceLevel: ConfidenceLevel;
  freshnessLevel: FreshnessLevel;
  cautionaryNotes: string[];
}

// ---------------------------------------------------------------------------
// Timeseries — historical data points used by trend charts
// ---------------------------------------------------------------------------

export interface TimeseriesPoint {
  periodStart: string;
  periodLabel: string;
  numericValue: number | null;
  valueStatus: string;
  sourceCode: string;
  sourceDisplayName: string;
  datasetCode: string;
}

export interface TimeseriesSeriesResponse {
  count: number;
  items: TimeseriesPoint[];
}

// ---------------------------------------------------------------------------
// Indicator overview — per-source values, trend, divergence
// ---------------------------------------------------------------------------

export interface SourcePerspective {
  sourceCode: string;
  sourceDisplayName: string;
  datasetCode: string;
  datasetDisplayName: string;
  periodLabel: string | null;
  numericValue: number | null;
  valueStatus: string;
  freshnessLevel: FreshnessLevel;
  availableObservationCount: number;
  observedObservationCount: number;
  fetchAgeDays: number | null;
  firstPeriodStart: string | null;
  latestPeriodStart: string | null;
}

export interface TrendSignal {
  direction: "UP" | "DOWN" | "FLAT" | "INSUFFICIENT_DATA";
  latestNumericValue: number | null;
  previousNumericValue: number | null;
  latestPeriodLabel: string | null;
  previousPeriodLabel: string | null;
  absoluteChange: number | null;
  relativeChange: number | null;
  sourceCode: string | null;
  sourceDisplayName: string | null;
}

export interface DivergenceSummary {
  agreementLevel: AgreementLevel;
  medianNumericValue: number | null;
  minNumericValue: number | null;
  maxNumericValue: number | null;
  rangeAbsolute: number | null;
  rangeRelativeToMedian: number | null;
  sourceCount: number;
  comparableValueCount: number;
  primarySourceCode: string | null;
  latestComparablePeriodLabel: string | null;
}

export interface IndicatorOverviewResponse {
  country: CountryDetail;
  indicator: {
    code: string;
    displayName: string;
    topic: string;
    unitLabel: string;
    description: string | null;
  };
  trend: TrendSignal;
  divergence: DivergenceSummary;
  freshness: { level: FreshnessLevel; maxFetchAgeDays: number | null };
  confidence: { level: ConfidenceLevel };
  sourcePerspectives: SourcePerspective[];
  latestBySource: TimeseriesPoint[];
  selectedSeriesPreview: TimeseriesPoint[];
  sourceAudit: SourceAuditView;
}

// ---------------------------------------------------------------------------
// Multi-country comparison
// ---------------------------------------------------------------------------

export interface CompareCountriesItem {
  countryIso3: string;
  countryDisplayName: string;
  indicatorCode: string;
  indicatorDisplayName: string;
  numericValue: number | null;
  valueStatus: string;
  periodLabel: string | null;
  sourceCode: string;
  sourceDisplayName: string;
  datasetCode: string;
}

export interface CompareCountriesResponse {
  indicator: {
    code: string;
    displayName: string;
    unitLabel: string;
  };
  countryCount: number;
  comparableValueCount: number;
  minNumericValue: number | null;
  maxNumericValue: number | null;
  items: CompareCountriesItem[];
}

// ---------------------------------------------------------------------------
// Regions
// ---------------------------------------------------------------------------

export interface RegionSummary {
  code: string;
  displayName: string;
  type: string;
  countryCount: number;
  aggregateCount: number;
}

// Lens régional : médiane sur N pays, pas de latestComparableValue ni sourceAudit
export interface RegionalEconomicLens {
  lensCode: string;
  lensDisplayName: string;
  signalTone: SignalTone;
  headline: string;
  narrative: string;
  whyItMatters: string;
  indicatorCode: string;
  indicatorDisplayName: string;
  unitLabel: string;
  medianComparableValue: number | null;
  comparableCountryCount: number;
  memberCountryCount: number;
  coverageRatio: number | null;
  latestPeriodLabel: string | null;
  selectedSourceCode: string | null;
  selectedDatasetCode: string | null;
  agreementLevel: AgreementLevel;
  confidenceLevel: ConfidenceLevel;
  freshnessLevel: FreshnessLevel;
}

export type RegionalRelativeCostLens = RegionalEconomicLens;

export interface RegionEconomicSnapshotResponse {
  region: {
    code: string;
    displayName: string;
    type: string;
    countryCount: number;
    aggregateCount: number;
  };
  generatedAtUtc: string;
  lensCount: number;
  highlights: string[];
  lenses: RegionalEconomicLens[];
}

export interface RegionRelativeCostSnapshotResponse {
  region: {
    code: string;
    displayName: string;
    type: string;
    countryCount: number;
    aggregateCount: number;
  };
  generatedAtUtc: string;
  lensCount: number;
  highlights: string[];
  lenses: RegionalRelativeCostLens[];
  decisionSignalCount: number;
  decisionSignals: RelativeCostDecisionSignal[];
}

// ---------------------------------------------------------------------------
// Rankings
// ---------------------------------------------------------------------------

export interface IndicatorRankResponse {
  iso3: string;
  indicatorCode: string;
  worldRank: number | null;
  worldTotal: number;
  regionRank: number | null;
  regionTotal: number;
  regionCode: string | null;
  regionName: string | null;
  value: number | null;
  periodLabel: string | null;
  sourceCode: string | null;
}

// ---------------------------------------------------------------------------
// Sources catalog
// ---------------------------------------------------------------------------

/**
 * Reported by the real V2 timeseries store, NOT by catalog.source.
 * Observed and estimated values remain distinct; null dates mean no evidence.
 */
export interface SourceDataCoverage {
  sourceCode: string;
  sourceDisplayName: string;
  observedRecordCount: number;
  estimatedRecordCount: number;
  observedNumericCount: number;
  coveredCountryCount: number;
  latestAvailablePeriodStart: string | null;
  latestDataFetchedAtUtc: string | null;
}

export interface SourceDetail {
  code: string;
  displayName: string;
  type: string;
  organizationName: string;
  homepageUrl: string | null;
  documentationUrl: string | null;
  accessModel: string;
  licenseSummary: string | null;
  geographicScope: string;
  temporalGranularity: string;
  updateCadence: string | null;
  biasNotes: string | null;
  qualityNotes: string | null;
  enabled: boolean;
}

// ---------------------------------------------------------------------------

export interface CountryRelativeCostSnapshotResponse {
  country: {
    iso3: string;
    displayName: string;
    regionCode: string | null;
    regionName: string | null;
    subregionCode: string | null;
    subregionName: string | null;
    aggregate: boolean;
    active: boolean;
    dataQualityTier: number;
  };
  generatedAtUtc: string;
  lensCount: number;
  highlights: string[];
  lenses: CountryRelativeCostLens[];
  decisionSignalCount: number;
  decisionSignals: RelativeCostDecisionSignal[];
}

// ---------------------------------------------------------------------------
// Forecast — linear OLS projection with prediction intervals
// ---------------------------------------------------------------------------

export type ForecastQuality = "RELIABLE" | "INDICATIVE" | "SPECULATIVE";

export interface ForecastPoint {
  year: number;
  value: number;
  ciLow80: number;
  ciHigh80: number;
  ciLow95: number;
  ciHigh95: number;
}

export interface ForecastMetadata {
  method: string;
  nObservations: number;
  fromYear: number;
  toYear: number;
  rSquared: number;
  slope: number;
  quality: ForecastQuality;
  horizonYears: number;
  caveats: string[];
}

export interface ForecastResponse {
  indicatorCode: string;
  iso3: string;
  baseYear: number;
  horizonYears: number;
  insufficientData: boolean;
  points: ForecastPoint[];
  metadata: ForecastMetadata;
}