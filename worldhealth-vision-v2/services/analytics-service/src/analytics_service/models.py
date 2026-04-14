from datetime import date, datetime
from statistics import median
from typing import Literal

from pydantic import BaseModel, Field


FreshnessLevel = Literal["FRESH", "AGING", "STALE", "UNKNOWN"]
AgreementLevel = Literal["CONSISTENT", "MIXED", "DIVERGENT", "INSUFFICIENT_DATA"]
ConfidenceLevel = Literal["HIGH", "MEDIUM", "LOW", "INSUFFICIENT_EVIDENCE"]
AuditEvidenceSeverity = Literal["POSITIVE", "INFO", "CAUTION", "WARNING"]
EconomicLensTone = Literal["POSITIVE", "BALANCED", "WATCH", "STRESS", "CONTEXT"]


class RegionDetail(BaseModel):
    code: str
    displayName: str
    type: Literal["CONTINENT", "REGION", "SUBREGION"]
    countryCount: int
    aggregateCount: int


class CountrySummary(BaseModel):
    iso3: str
    iso2: str | None = None
    displayName: str
    regionCode: str | None = None
    regionName: str | None = None
    subregionCode: str | None = None
    subregionName: str | None = None
    aggregate: bool
    active: bool


class CountryDetail(BaseModel):
    iso3: str
    iso2: str | None = None
    displayName: str
    regionCode: str | None = None
    regionName: str | None = None
    subregionCode: str | None = None
    subregionName: str | None = None
    worldBankIncomeGroup: str | None = None
    lendingType: str | None = None
    capitalCity: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    sovereignState: str | None = None
    aggregate: bool
    active: bool
    dataQualityTier: int


class IndicatorSummary(BaseModel):
    code: str
    displayName: str
    topic: str
    unitLabel: str
    preferredFrequency: str | None = None
    sourceDatasetCode: str | None = None
    core: bool


class IndicatorDetail(BaseModel):
    code: str
    displayName: str
    topic: str
    unitLabel: str
    description: str | None = None
    preferredFrequency: str
    sourceDatasetCode: str | None = None
    core: bool
    methodologyNotes: str | None = None


class SourceDetail(BaseModel):
    code: str
    displayName: str
    type: str
    organizationName: str
    homepageUrl: str | None = None
    documentationUrl: str | None = None
    accessModel: str
    licenseSummary: str
    geographicScope: str
    temporalGranularity: str
    updateCadence: str | None = None
    biasNotes: str | None = None
    qualityNotes: str | None = None
    enabled: bool


class SourceDatasetDetail(BaseModel):
    sourceCode: str
    code: str
    displayName: str
    description: str | None = None
    category: str
    defaultGranularity: str
    defaultFrequency: str
    documentationUrl: str | None = None
    licenseSummary: str | None = None
    enabled: bool


class LatestSourceObservation(BaseModel):
    sourceCode: str
    sourceDisplayName: str
    datasetCode: str
    datasetDisplayName: str
    sourceRunKey: str
    countryIso3: str
    countryDisplayName: str
    indicatorCode: str
    indicatorDisplayName: str
    periodGranularity: str
    periodStart: date
    periodEnd: date
    periodLabel: str
    numericValue: float | None = None
    textValue: str | None = None
    valueStatus: str
    sourcePublishedAt: datetime | None = None
    fetchedAtUtc: datetime | None = None


class SeriesAvailability(BaseModel):
    sourceCode: str
    sourceDisplayName: str
    datasetCode: str
    datasetDisplayName: str
    countryIso3: str
    countryDisplayName: str
    indicatorCode: str
    indicatorDisplayName: str
    periodGranularity: str
    availableObservationCount: int
    observedObservationCount: int
    estimatedObservationCount: int
    suppressedObservationCount: int
    missingObservationCount: int
    firstPeriodStart: date | None = None
    latestPeriodStart: date | None = None
    latestPeriodEnd: date | None = None
    latestPeriodLabel: str | None = None
    latestNumericValue: float | None = None
    latestTextValue: str | None = None
    latestValueStatus: str | None = None
    latestFetchedAtUtc: datetime | None = None


class TimeseriesObservation(BaseModel):
    sourceCode: str
    sourceDisplayName: str
    datasetCode: str
    datasetDisplayName: str
    sourceRunKey: str
    countryIso3: str
    countryDisplayName: str
    indicatorCode: str
    indicatorDisplayName: str
    periodGranularity: str
    periodStart: date
    periodEnd: date
    periodLabel: str
    numericValue: float | None = None
    textValue: str | None = None
    valueStatus: str
    sourcePublishedAt: datetime | None = None
    fetchedAtUtc: datetime | None = None


class CountryLatestComparisonItem(BaseModel):
    countryIso3: str
    countryDisplayName: str
    indicatorCode: str
    indicatorDisplayName: str
    sourceCode: str
    sourceDisplayName: str
    datasetCode: str
    datasetDisplayName: str
    periodGranularity: str
    periodStart: date
    periodEnd: date
    periodLabel: str
    numericValue: float | None = None
    textValue: str | None = None
    valueStatus: str
    sourcePublishedAt: datetime | None = None
    fetchedAtUtc: datetime | None = None


class SourceRunSummary(BaseModel):
    id: str
    sourceCode: str
    sourceDisplayName: str
    datasetCode: str
    datasetDisplayName: str
    runKey: str
    fetchedAtUtc: datetime
    persistedAtUtc: datetime | None = None
    recordCount: int
    status: str


class DependencyReadiness(BaseModel):
    dependency: str
    reachable: bool
    detail: dict | None = None


class AnalyticsReadinessResponse(BaseModel):
    service: str = "analytics-service"
    status: Literal["ok", "degraded"]
    dependencies: list[DependencyReadiness]


class TrendSignal(BaseModel):
    direction: Literal["UP", "DOWN", "FLAT", "INSUFFICIENT_DATA"]
    sourceCode: str | None = None
    sourceDisplayName: str | None = None
    datasetCode: str | None = None
    datasetDisplayName: str | None = None
    periodGranularity: str | None = None
    latestPeriodLabel: str | None = None
    previousPeriodLabel: str | None = None
    latestNumericValue: float | None = None
    previousNumericValue: float | None = None
    absoluteChange: float | None = None
    relativeChange: float | None = None
    observationsUsed: int = 0


class DivergenceSummary(BaseModel):
    sourceCount: int
    comparableValueCount: int
    agreementLevel: AgreementLevel
    primarySourceCode: str | None = None
    primarySourceDisplayName: str | None = None
    latestComparablePeriodLabel: str | None = None
    medianNumericValue: float | None = None
    minNumericValue: float | None = None
    maxNumericValue: float | None = None
    rangeAbsolute: float | None = None
    rangeRelativeToMedian: float | None = None

    @classmethod
    def from_numeric_values(
        cls,
        numeric_values: list[float | None],
        source_count: int,
        primary_source_code: str | None = None,
        primary_source_display_name: str | None = None,
        latest_comparable_period_label: str | None = None,
        consistent_relative_threshold: float = 0.02,
        mixed_relative_threshold: float = 0.08,
    ) -> "DivergenceSummary":
        comparable_values = [value for value in numeric_values if value is not None]
        if not comparable_values:
            return cls(
                sourceCount=source_count,
                comparableValueCount=0,
                agreementLevel="INSUFFICIENT_DATA",
                primarySourceCode=primary_source_code,
                primarySourceDisplayName=primary_source_display_name,
                latestComparablePeriodLabel=latest_comparable_period_label,
            )

        median_numeric_value = float(median(comparable_values))
        min_numeric_value = min(comparable_values)
        max_numeric_value = max(comparable_values)
        range_absolute = max_numeric_value - min_numeric_value

        if len(comparable_values) < 2:
            agreement_level: AgreementLevel = "INSUFFICIENT_DATA"
            range_relative_to_median = None
        elif range_absolute == 0:
            agreement_level = "CONSISTENT"
            range_relative_to_median = 0.0
        elif median_numeric_value == 0:
            agreement_level = "DIVERGENT"
            range_relative_to_median = None
        else:
            range_relative_to_median = range_absolute / abs(median_numeric_value)
            if range_relative_to_median <= consistent_relative_threshold:
                agreement_level = "CONSISTENT"
            elif range_relative_to_median <= mixed_relative_threshold:
                agreement_level = "MIXED"
            else:
                agreement_level = "DIVERGENT"

        return cls(
            sourceCount=source_count,
            comparableValueCount=len(comparable_values),
            agreementLevel=agreement_level,
            primarySourceCode=primary_source_code,
            primarySourceDisplayName=primary_source_display_name,
            latestComparablePeriodLabel=latest_comparable_period_label,
            medianNumericValue=median_numeric_value,
            minNumericValue=min_numeric_value,
            maxNumericValue=max_numeric_value,
            rangeAbsolute=range_absolute,
            rangeRelativeToMedian=range_relative_to_median,
        )

    @classmethod
    def from_latest_by_source(
        cls,
        items: list[LatestSourceObservation],
        primary_source_code: str | None = None,
        primary_source_display_name: str | None = None,
        latest_comparable_period_label: str | None = None,
        consistent_relative_threshold: float = 0.02,
        mixed_relative_threshold: float = 0.08,
    ) -> "DivergenceSummary":
        return cls.from_numeric_values(
            numeric_values=[item.numericValue for item in items],
            source_count=len(items),
            primary_source_code=primary_source_code,
            primary_source_display_name=primary_source_display_name,
            latest_comparable_period_label=latest_comparable_period_label,
            consistent_relative_threshold=consistent_relative_threshold,
            mixed_relative_threshold=mixed_relative_threshold,
        )


class FreshnessSummary(BaseModel):
    level: FreshnessLevel
    comparableSourceCount: int
    latestFetchedAtUtc: datetime | None = None
    oldestFetchedAtUtc: datetime | None = None
    latestSourcePublishedAt: datetime | None = None
    oldestSourcePublishedAt: datetime | None = None
    minFetchAgeDays: int | None = None
    maxFetchAgeDays: int | None = None
    minPublicationAgeDays: int | None = None
    maxPublicationAgeDays: int | None = None


class ConfidenceSummary(BaseModel):
    level: ConfidenceLevel
    sourceCount: int
    comparableSourceCount: int
    observedSourceCount: int
    estimatedSourceCount: int
    sourceTypeDiversityCount: int
    freshnessLevel: FreshnessLevel
    agreementLevel: AgreementLevel
    reasons: list[str] = Field(default_factory=list)


class AuditEvidenceItem(BaseModel):
    code: str
    severity: AuditEvidenceSeverity
    title: str
    detail: str
    metricLabel: str | None = None
    metricValue: float | int | str | None = None
    sourceCodes: list[str] = Field(default_factory=list)
    datasetCodes: list[str] = Field(default_factory=list)


class SourceAuditView(BaseModel):
    scopeType: Literal["COUNTRY", "REGION", "CONTINENT", "SUBREGION"]
    scopeCode: str
    scopeDisplayName: str
    indicatorCode: str
    indicatorDisplayName: str
    confidenceLevel: ConfidenceLevel
    freshnessLevel: FreshnessLevel
    agreementLevel: AgreementLevel
    primarySourceCode: str | None = None
    primarySourceDisplayName: str | None = None
    comparableSourceCount: int
    evidence: list[AuditEvidenceItem] = Field(default_factory=list)


class SourcePerspective(BaseModel):
    sourceCode: str
    sourceDisplayName: str
    sourceType: str | None = None
    sourceOrganizationName: str | None = None
    sourceBiasNotes: str | None = None
    sourceQualityNotes: str | None = None
    datasetCode: str
    datasetDisplayName: str
    datasetCategory: str | None = None
    datasetDefaultGranularity: str | None = None
    datasetDefaultFrequency: str | None = None
    periodGranularity: str | None = None
    periodLabel: str | None = None
    numericValue: float | None = None
    textValue: str | None = None
    valueStatus: str | None = None
    availableObservationCount: int = 0
    observedObservationCount: int = 0
    estimatedObservationCount: int = 0
    suppressedObservationCount: int = 0
    missingObservationCount: int = 0
    firstPeriodStart: date | None = None
    latestPeriodStart: date | None = None
    latestPeriodEnd: date | None = None
    sourcePublishedAt: datetime | None = None
    fetchedAtUtc: datetime | None = None
    latestSuccessfulRunKey: str | None = None
    latestSuccessfulRunFetchedAtUtc: datetime | None = None
    latestSuccessfulRunPersistedAtUtc: datetime | None = None
    latestSuccessfulRunRecordCount: int | None = None
    freshnessLevel: FreshnessLevel = "UNKNOWN"
    fetchAgeDays: int | None = None
    publicationAgeDays: int | None = None


class RegionalSourcePerspective(BaseModel):
    sourceCode: str
    sourceDisplayName: str
    sourceType: str | None = None
    sourceOrganizationName: str | None = None
    sourceBiasNotes: str | None = None
    sourceQualityNotes: str | None = None
    datasetCode: str
    datasetDisplayName: str
    datasetCategory: str | None = None
    datasetDefaultGranularity: str | None = None
    datasetDefaultFrequency: str | None = None
    periodGranularity: str | None = None
    latestPeriodLabel: str | None = None
    memberCountryCount: int
    comparableCountryCount: int
    observedCountryCount: int
    estimatedCountryCount: int
    missingCountryCount: int
    coverageRatio: float | None = None
    medianNumericValue: float | None = None
    minNumericValue: float | None = None
    minCountryIso3: str | None = None
    minCountryDisplayName: str | None = None
    maxNumericValue: float | None = None
    maxCountryIso3: str | None = None
    maxCountryDisplayName: str | None = None
    sourcePublishedAt: datetime | None = None
    fetchedAtUtc: datetime | None = None
    latestSuccessfulRunKey: str | None = None
    latestSuccessfulRunFetchedAtUtc: datetime | None = None
    latestSuccessfulRunPersistedAtUtc: datetime | None = None
    latestSuccessfulRunRecordCount: int | None = None
    freshnessLevel: FreshnessLevel = "UNKNOWN"
    fetchAgeDays: int | None = None
    publicationAgeDays: int | None = None


class IndicatorOverviewResponse(BaseModel):
    country: CountryDetail
    indicator: IndicatorDetail
    trend: TrendSignal
    divergence: DivergenceSummary
    freshness: FreshnessSummary
    confidence: ConfidenceSummary
    sourceAudit: SourceAuditView
    availability: list[SeriesAvailability]
    latestBySource: list[LatestSourceObservation]
    sourcePerspectives: list[SourcePerspective]
    selectedSeriesPreview: list[TimeseriesObservation]


class CountryOverviewItem(BaseModel):
    indicatorCode: str
    indicatorDisplayName: str
    unitLabel: str
    topic: str
    trendDirection: Literal["UP", "DOWN", "FLAT", "INSUFFICIENT_DATA"]
    latestComparableValue: float | None = None
    latestComparableSourceCount: int
    latestPeriodLabel: str | None = None
    selectedSourceCode: str | None = None
    selectedDatasetCode: str | None = None
    divergenceRangeAbsolute: float | None = None
    agreementLevel: AgreementLevel
    confidenceLevel: ConfidenceLevel
    freshnessLevel: FreshnessLevel


class CountryOverviewResponse(BaseModel):
    country: CountryDetail
    indicatorCount: int
    indicators: list[CountryOverviewItem]


class CountryEconomicLens(BaseModel):
    lensCode: str
    lensDisplayName: str
    signalTone: EconomicLensTone
    headline: str
    narrative: str
    whyItMatters: str
    indicatorCode: str
    indicatorDisplayName: str
    unitLabel: str
    latestComparableValue: float | None = None
    latestComparableSourceCount: int
    latestPeriodLabel: str | None = None
    trendDirection: Literal["UP", "DOWN", "FLAT", "INSUFFICIENT_DATA"]
    selectedSourceCode: str | None = None
    selectedDatasetCode: str | None = None
    agreementLevel: AgreementLevel
    confidenceLevel: ConfidenceLevel
    freshnessLevel: FreshnessLevel
    sourceAudit: SourceAuditView


class CountryEconomicSnapshotResponse(BaseModel):
    country: CountryDetail
    generatedAtUtc: datetime
    lensCount: int
    highlights: list[str] = Field(default_factory=list)
    lenses: list[CountryEconomicLens]


class CountryRelativeCostLens(BaseModel):
    lensCode: str
    lensDisplayName: str
    signalTone: EconomicLensTone
    headline: str
    narrative: str
    whyItMatters: str
    indicatorCode: str
    indicatorDisplayName: str
    unitLabel: str
    latestComparableValue: float | None = None
    latestComparableSourceCount: int
    latestPeriodLabel: str | None = None
    trendDirection: Literal["UP", "DOWN", "FLAT", "INSUFFICIENT_DATA"]
    selectedSourceCode: str | None = None
    selectedDatasetCode: str | None = None
    agreementLevel: AgreementLevel
    confidenceLevel: ConfidenceLevel
    freshnessLevel: FreshnessLevel
    sourceAudit: SourceAuditView


class RelativeCostDecisionSignal(BaseModel):
    decisionCode: str
    decisionDisplayName: str
    signalTone: EconomicLensTone
    headline: str
    narrative: str
    whyItMatters: str
    supportingLensCodes: list[str]
    confidenceLevel: ConfidenceLevel
    freshnessLevel: FreshnessLevel
    cautionaryNotes: list[str] = Field(default_factory=list)


class CountryRelativeCostSnapshotResponse(BaseModel):
    country: CountryDetail
    generatedAtUtc: datetime
    lensCount: int
    highlights: list[str] = Field(default_factory=list)
    lenses: list[CountryRelativeCostLens]
    decisionSignalCount: int
    decisionSignals: list[RelativeCostDecisionSignal]


class RegionIndicatorOverviewResponse(BaseModel):
    region: RegionDetail
    memberCountryCount: int
    comparableCountryCount: int
    indicator: IndicatorDetail
    divergence: DivergenceSummary
    freshness: FreshnessSummary
    confidence: ConfidenceSummary
    sourceAudit: SourceAuditView
    sourcePerspectives: list[RegionalSourcePerspective]


class RegionOverviewItem(BaseModel):
    indicatorCode: str
    indicatorDisplayName: str
    unitLabel: str
    topic: str
    comparableCountryCount: int
    memberCountryCount: int
    coverageRatio: float | None = None
    medianComparableValue: float | None = None
    latestPeriodLabel: str | None = None
    selectedSourceCode: str | None = None
    selectedDatasetCode: str | None = None
    agreementLevel: AgreementLevel
    confidenceLevel: ConfidenceLevel
    freshnessLevel: FreshnessLevel


class RegionOverviewResponse(BaseModel):
    region: RegionDetail
    indicatorCount: int
    indicators: list[RegionOverviewItem]


class RegionalEconomicLens(BaseModel):
    lensCode: str
    lensDisplayName: str
    signalTone: EconomicLensTone
    headline: str
    narrative: str
    whyItMatters: str
    indicatorCode: str
    indicatorDisplayName: str
    unitLabel: str
    medianComparableValue: float | None = None
    comparableCountryCount: int
    memberCountryCount: int
    coverageRatio: float | None = None
    latestPeriodLabel: str | None = None
    selectedSourceCode: str | None = None
    selectedDatasetCode: str | None = None
    agreementLevel: AgreementLevel
    confidenceLevel: ConfidenceLevel
    freshnessLevel: FreshnessLevel


class EconomicSnapshotResponse(BaseModel):
    region: RegionDetail
    snapshotType: Literal["REGION", "CONTINENT"]
    generatedAtUtc: datetime
    lensCount: int
    highlights: list[str] = Field(default_factory=list)
    lenses: list[RegionalEconomicLens]


class RegionalRelativeCostLens(BaseModel):
    lensCode: str
    lensDisplayName: str
    signalTone: EconomicLensTone
    headline: str
    narrative: str
    whyItMatters: str
    indicatorCode: str
    indicatorDisplayName: str
    unitLabel: str
    medianComparableValue: float | None = None
    comparableCountryCount: int
    memberCountryCount: int
    coverageRatio: float | None = None
    latestPeriodLabel: str | None = None
    selectedSourceCode: str | None = None
    selectedDatasetCode: str | None = None
    agreementLevel: AgreementLevel
    confidenceLevel: ConfidenceLevel
    freshnessLevel: FreshnessLevel


class RelativeCostSnapshotResponse(BaseModel):
    region: RegionDetail
    snapshotType: Literal["REGION", "CONTINENT"]
    generatedAtUtc: datetime
    lensCount: int
    highlights: list[str] = Field(default_factory=list)
    lenses: list[RegionalRelativeCostLens]
    decisionSignalCount: int
    decisionSignals: list[RelativeCostDecisionSignal]


class CountryComparisonAnalyticsResponse(BaseModel):
    indicator: IndicatorDetail
    countryCount: int
    comparableValueCount: int
    minNumericValue: float | None = None
    maxNumericValue: float | None = None
    items: list[CountryLatestComparisonItem]


class CatalogListEnvelope(BaseModel):
    count: int
    items: list[dict] = Field(default_factory=list)


class TimeseriesListEnvelope(BaseModel):
    count: int
    items: list[dict] = Field(default_factory=list)
