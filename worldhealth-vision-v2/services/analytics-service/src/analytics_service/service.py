import asyncio
from dataclasses import dataclass, field
from datetime import UTC, datetime
from statistics import median

import httpx

from analytics_service.clients.catalog_client import CatalogClient
from analytics_service.clients.timeseries_client import TimeseriesClient
from analytics_service.config import Settings
from analytics_service.models import (
    AnalyticsReadinessResponse,
    AuditEvidenceItem,
    ConfidenceLevel,
    ConfidenceSummary,
    CountryComparisonAnalyticsResponse,
    CountryDetail,
    CountryEconomicLens,
    CountryEconomicSnapshotResponse,
    CountryRelativeCostLens,
    CountryRelativeCostSnapshotResponse,
    CountryLatestComparisonItem,
    CountryOverviewItem,
    CountryOverviewResponse,
    DivergenceSummary,
    EconomicLensTone,
    EconomicSnapshotResponse,
    FreshnessLevel,
    FreshnessSummary,
    IndicatorDetail,
    IndicatorOverviewResponse,
    LatestSourceObservation,
    RegionDetail,
    RegionalEconomicLens,
    RegionalRelativeCostLens,
    RegionIndicatorOverviewResponse,
    RegionOverviewItem,
    RegionOverviewResponse,
    RegionalSourcePerspective,
    RelativeCostDecisionSignal,
    RelativeCostSnapshotResponse,
    SeriesAvailability,
    SourceDatasetDetail,
    SourceDetail,
    SourcePerspective,
    SourceAuditView,
    SourceRunSummary,
    TimeseriesObservation,
    TrendSignal,
)
from analytics_service.product_profiles import (
    ECONOMIC_LENS_PROFILES,
    EconomicLensProfile,
    RELATIVE_COST_DECISION_PROFILES,
    RELATIVE_COST_LENS_PROFILES,
    RelativeCostDecisionProfile,
    RelativeCostLensProfile,
    describe_country_economic_lens,
    describe_country_relative_cost_lens,
    describe_regional_economic_lens,
    describe_regional_relative_cost_lens,
)


class AnalyticsNotFoundError(Exception):
    """Raised when a catalog or timeseries resource does not exist."""


class AnalyticsDependencyError(Exception):
    """Raised when an upstream internal service is unavailable or unhealthy."""


@dataclass(frozen=True)
class SourceContext:
    source: SourceDetail | None
    dataset: SourceDatasetDetail | None
    latest_run: SourceRunSummary | None


@dataclass
class ResolutionCache:
    sources: dict[str, SourceDetail | None] = field(default_factory=dict)
    datasets: dict[tuple[str, str], SourceDatasetDetail | None] = field(default_factory=dict)
    latest_runs: dict[tuple[str, str], SourceRunSummary | None] = field(default_factory=dict)


TONE_SEVERITY = {
    "POSITIVE": 0,
    "BALANCED": 1,
    "WATCH": 2,
    "STRESS": 3,
    "CONTEXT": 1,
}

CONFIDENCE_PRIORITY = {
    "HIGH": 0,
    "MEDIUM": 1,
    "LOW": 2,
    "INSUFFICIENT_EVIDENCE": 3,
}

FRESHNESS_PRIORITY = {
    "FRESH": 0,
    "AGING": 1,
    "STALE": 2,
    "UNKNOWN": 3,
}


class AnalyticsService:
    def __init__(
        self,
        settings: Settings,
        catalog_client: CatalogClient,
        timeseries_client: TimeseriesClient,
    ) -> None:
        self._settings = settings
        self._catalog_client = catalog_client
        self._timeseries_client = timeseries_client

    async def aclose(self) -> None:
        await asyncio.gather(
            self._catalog_client.aclose(),
            self._timeseries_client.aclose(),
        )

    async def get_readiness(self) -> AnalyticsReadinessResponse:
        catalog_result, timeseries_result = await asyncio.gather(
            self._safe_readiness(self._catalog_client.get_readiness, self._catalog_client.unreachable),
            self._safe_readiness(self._timeseries_client.get_readiness, self._timeseries_client.unreachable),
        )

        status = "ok" if catalog_result.reachable and timeseries_result.reachable else "degraded"
        return AnalyticsReadinessResponse(status=status, dependencies=[catalog_result, timeseries_result])

    async def get_country_indicator_overview(
        self,
        country_iso3: str,
        indicator_code: str,
        source_code: str | None,
        dataset_code: str | None,
        period_granularity: str | None,
        include_missing: bool,
        series_limit: int | None,
    ) -> IndicatorOverviewResponse:
        normalized_country_iso3 = self._normalize_required_code(country_iso3)
        normalized_indicator_code = self._normalize_required_code(indicator_code)

        country, indicator = await asyncio.gather(
            self._call_catalog(lambda: self._catalog_client.get_country(normalized_country_iso3)),
            self._call_catalog(lambda: self._catalog_client.get_indicator(normalized_indicator_code)),
        )

        return await self._build_indicator_overview(
            country=country,
            indicator=indicator,
            source_code=self._normalize_optional_code(source_code),
            dataset_code=self._normalize_optional_code(dataset_code),
            period_granularity=self._normalize_optional_code(period_granularity),
            include_missing=include_missing,
            series_limit=series_limit or self._settings.default_country_overview_series_limit,
            resolution_cache=ResolutionCache(),
        )

    async def get_country_source_audit(
        self,
        country_iso3: str,
        indicator_code: str,
        source_code: str | None,
        dataset_code: str | None,
        period_granularity: str | None,
        include_missing: bool,
        series_limit: int | None,
    ) -> SourceAuditView:
        overview = await self.get_country_indicator_overview(
            country_iso3=country_iso3,
            indicator_code=indicator_code,
            source_code=source_code,
            dataset_code=dataset_code,
            period_granularity=period_granularity,
            include_missing=include_missing,
            series_limit=series_limit,
        )
        return overview.sourceAudit

    async def get_country_overview(
        self,
        country_iso3: str,
        indicator_codes: list[str] | None,
        source_code: str | None,
        dataset_code: str | None,
        period_granularity: str | None,
        include_missing: bool,
        max_indicators: int | None,
        series_limit: int | None,
    ) -> CountryOverviewResponse:
        normalized_country_iso3 = self._normalize_required_code(country_iso3)
        country = await self._call_catalog(lambda: self._catalog_client.get_country(normalized_country_iso3))

        indicator_details = await self._resolve_indicator_details(indicator_codes, max_indicators)
        resolution_cache = ResolutionCache()

        overview_items = await asyncio.gather(*[
            self._build_indicator_overview(
                country=country,
                indicator=indicator,
                source_code=self._normalize_optional_code(source_code),
                dataset_code=self._normalize_optional_code(dataset_code),
                period_granularity=self._normalize_optional_code(period_granularity),
                include_missing=include_missing,
                series_limit=series_limit or self._settings.default_country_overview_series_limit,
                resolution_cache=resolution_cache,
            )
            for indicator in indicator_details
        ])

        return CountryOverviewResponse(
            country=country,
            indicatorCount=len(overview_items),
            indicators=[
                CountryOverviewItem(
                    indicatorCode=item.indicator.code,
                    indicatorDisplayName=item.indicator.displayName,
                    unitLabel=item.indicator.unitLabel,
                    topic=item.indicator.topic,
                    trendDirection=item.trend.direction,
                    latestComparableValue=item.divergence.medianNumericValue,
                    latestComparableSourceCount=item.divergence.comparableValueCount,
                    latestPeriodLabel=item.trend.latestPeriodLabel,
                    selectedSourceCode=item.trend.sourceCode,
                    selectedDatasetCode=item.trend.datasetCode,
                    divergenceRangeAbsolute=item.divergence.rangeAbsolute,
                    agreementLevel=item.divergence.agreementLevel,
                    confidenceLevel=item.confidence.level,
                    freshnessLevel=item.freshness.level,
                )
                for item in overview_items
            ],
        )

    async def get_country_economic_snapshot(
        self,
        country_iso3: str,
        source_code: str | None,
        dataset_code: str | None,
        period_granularity: str | None,
        include_missing: bool,
        series_limit: int | None,
    ) -> CountryEconomicSnapshotResponse:
        normalized_country_iso3 = self._normalize_required_code(country_iso3)
        country = await self._call_catalog(lambda: self._catalog_client.get_country(normalized_country_iso3))

        resolution_cache = ResolutionCache()
        indicator_details = await asyncio.gather(*[
            self._call_catalog(lambda code=profile.indicator_code: self._catalog_client.get_indicator(code))
            for profile in ECONOMIC_LENS_PROFILES
        ])

        overview_items = await asyncio.gather(*[
            self._build_indicator_overview(
                country=country,
                indicator=indicator,
                source_code=self._normalize_optional_code(source_code),
                dataset_code=self._normalize_optional_code(dataset_code),
                period_granularity=self._normalize_optional_code(period_granularity),
                include_missing=include_missing,
                series_limit=series_limit or self._settings.default_country_overview_series_limit,
                resolution_cache=resolution_cache,
            )
            for indicator in indicator_details
        ])

        lenses = [
            self._build_country_economic_lens(profile, overview)
            for profile, overview in zip(ECONOMIC_LENS_PROFILES, overview_items, strict=True)
        ]

        return CountryEconomicSnapshotResponse(
            country=country,
            generatedAtUtc=datetime.now(UTC),
            lensCount=len(lenses),
            highlights=self._build_snapshot_highlights(lenses),
            lenses=lenses,
        )

    async def get_country_relative_cost_snapshot(
        self,
        country_iso3: str,
        source_code: str | None,
        dataset_code: str | None,
        period_granularity: str | None,
        include_missing: bool,
        series_limit: int | None,
    ) -> CountryRelativeCostSnapshotResponse:
        normalized_country_iso3 = self._normalize_required_code(country_iso3)
        country = await self._call_catalog(lambda: self._catalog_client.get_country(normalized_country_iso3))

        resolution_cache = ResolutionCache()
        indicator_details = await asyncio.gather(*[
            self._call_catalog(lambda code=profile.indicator_code: self._catalog_client.get_indicator(code))
            for profile in RELATIVE_COST_LENS_PROFILES
        ])

        overview_items = await asyncio.gather(*[
            self._build_indicator_overview(
                country=country,
                indicator=indicator,
                source_code=self._normalize_optional_code(source_code),
                dataset_code=self._normalize_optional_code(dataset_code),
                period_granularity=self._normalize_optional_code(period_granularity),
                include_missing=include_missing,
                series_limit=series_limit or self._settings.default_country_overview_series_limit,
                resolution_cache=resolution_cache,
            )
            for indicator in indicator_details
        ])

        lenses = [
            self._build_country_relative_cost_lens(profile, overview)
            for profile, overview in zip(RELATIVE_COST_LENS_PROFILES, overview_items, strict=True)
        ]
        decision_signals = self._build_relative_cost_decisions(
            lenses=lenses,
            scope_type="COUNTRY",
        )

        return CountryRelativeCostSnapshotResponse(
            country=country,
            generatedAtUtc=datetime.now(UTC),
            lensCount=len(lenses),
            highlights=self._build_snapshot_highlights(lenses),
            lenses=lenses,
            decisionSignalCount=len(decision_signals),
            decisionSignals=decision_signals,
        )

    async def get_region_indicator_overview(
        self,
        region_code: str,
        indicator_code: str,
        source_code: str | None,
        dataset_code: str | None,
        period_granularity: str | None,
        include_missing: bool,
        expected_region_type: str | None = None,
    ) -> RegionIndicatorOverviewResponse:
        normalized_region_code = self._normalize_required_code(region_code)
        normalized_indicator_code = self._normalize_required_code(indicator_code)

        region, countries, indicator = await asyncio.gather(
            self._resolve_region(normalized_region_code, expected_region_type),
            self._list_region_countries(normalized_region_code),
            self._call_catalog(lambda: self._catalog_client.get_indicator(normalized_indicator_code)),
        )

        if not countries:
            raise AnalyticsNotFoundError(f"No active countries available for region: {normalized_region_code}")

        return await self._build_region_indicator_overview(
            region=region,
            countries=countries,
            indicator=indicator,
            source_code=self._normalize_optional_code(source_code),
            dataset_code=self._normalize_optional_code(dataset_code),
            period_granularity=self._normalize_optional_code(period_granularity),
            include_missing=include_missing,
            resolution_cache=ResolutionCache(),
        )

    async def get_region_source_audit(
        self,
        region_code: str,
        indicator_code: str,
        source_code: str | None,
        dataset_code: str | None,
        period_granularity: str | None,
        include_missing: bool,
        expected_region_type: str | None = None,
    ) -> SourceAuditView:
        overview = await self.get_region_indicator_overview(
            region_code=region_code,
            indicator_code=indicator_code,
            source_code=source_code,
            dataset_code=dataset_code,
            period_granularity=period_granularity,
            include_missing=include_missing,
            expected_region_type=expected_region_type,
        )
        return overview.sourceAudit

    async def get_region_overview(
        self,
        region_code: str,
        indicator_codes: list[str] | None,
        source_code: str | None,
        dataset_code: str | None,
        period_granularity: str | None,
        include_missing: bool,
        max_indicators: int | None,
        expected_region_type: str | None = None,
    ) -> RegionOverviewResponse:
        normalized_region_code = self._normalize_required_code(region_code)

        region, countries = await asyncio.gather(
            self._resolve_region(normalized_region_code, expected_region_type),
            self._list_region_countries(normalized_region_code),
        )

        if not countries:
            raise AnalyticsNotFoundError(f"No active countries available for region: {normalized_region_code}")

        indicator_details = await self._resolve_indicator_details(
            indicator_codes,
            max_indicators or self._settings.default_region_overview_indicator_limit,
        )
        resolution_cache = ResolutionCache()

        overview_items = await asyncio.gather(*[
            self._build_region_indicator_overview(
                region=region,
                countries=countries,
                indicator=indicator,
                source_code=self._normalize_optional_code(source_code),
                dataset_code=self._normalize_optional_code(dataset_code),
                period_granularity=self._normalize_optional_code(period_granularity),
                include_missing=include_missing,
                resolution_cache=resolution_cache,
            )
            for indicator in indicator_details
        ])

        return RegionOverviewResponse(
            region=region,
            indicatorCount=len(overview_items),
            indicators=[
                RegionOverviewItem(
                    indicatorCode=item.indicator.code,
                    indicatorDisplayName=item.indicator.displayName,
                    unitLabel=item.indicator.unitLabel,
                    topic=item.indicator.topic,
                    comparableCountryCount=item.comparableCountryCount,
                    memberCountryCount=item.memberCountryCount,
                    coverageRatio=self._ratio(item.comparableCountryCount, item.memberCountryCount),
                    medianComparableValue=item.divergence.medianNumericValue,
                    latestPeriodLabel=item.divergence.latestComparablePeriodLabel,
                    selectedSourceCode=item.divergence.primarySourceCode,
                    selectedDatasetCode=item.sourcePerspectives[0].datasetCode if item.sourcePerspectives else None,
                    agreementLevel=item.divergence.agreementLevel,
                    confidenceLevel=item.confidence.level,
                    freshnessLevel=item.freshness.level,
                )
                for item in overview_items
            ],
        )

    async def compare_countries_latest(
        self,
        country_iso3: list[str],
        indicator_code: str,
        source_code: str | None,
        dataset_code: str | None,
        period_granularity: str | None,
        include_missing: bool,
    ) -> CountryComparisonAnalyticsResponse:
        normalized_countries = [self._normalize_required_code(item) for item in country_iso3]
        normalized_indicator_code = self._normalize_required_code(indicator_code)
        indicator = await self._call_catalog(lambda: self._catalog_client.get_indicator(normalized_indicator_code))
        items = await self._call_timeseries(
            lambda: self._timeseries_client.compare_countries_latest(
                country_iso3=normalized_countries,
                indicator_code=normalized_indicator_code,
                source_code=self._normalize_optional_code(source_code),
                dataset_code=self._normalize_optional_code(dataset_code),
                period_granularity=self._normalize_optional_code(period_granularity),
                include_missing=include_missing,
            )
        )

        numeric_values = [item.numericValue for item in items if item.numericValue is not None]
        return CountryComparisonAnalyticsResponse(
            indicator=indicator,
            countryCount=len({item.countryIso3 for item in items}),
            comparableValueCount=len(numeric_values),
            minNumericValue=min(numeric_values) if numeric_values else None,
            maxNumericValue=max(numeric_values) if numeric_values else None,
            items=items,
        )

    async def get_region_economic_snapshot(
        self,
        region_code: str,
        source_code: str | None,
        dataset_code: str | None,
        period_granularity: str | None,
        include_missing: bool,
        expected_region_type: str | None = None,
    ) -> EconomicSnapshotResponse:
        normalized_region_code = self._normalize_required_code(region_code)

        region, countries = await asyncio.gather(
            self._resolve_region(normalized_region_code, expected_region_type),
            self._list_region_countries(normalized_region_code),
        )

        if not countries:
            raise AnalyticsNotFoundError(f"No active countries available for region: {normalized_region_code}")

        resolution_cache = ResolutionCache()
        indicator_details = await asyncio.gather(*[
            self._call_catalog(lambda code=profile.indicator_code: self._catalog_client.get_indicator(code))
            for profile in ECONOMIC_LENS_PROFILES
        ])

        overview_items = await asyncio.gather(*[
            self._build_region_indicator_overview(
                region=region,
                countries=countries,
                indicator=indicator,
                source_code=self._normalize_optional_code(source_code),
                dataset_code=self._normalize_optional_code(dataset_code),
                period_granularity=self._normalize_optional_code(period_granularity),
                include_missing=include_missing,
                resolution_cache=resolution_cache,
            )
            for indicator in indicator_details
        ])

        lenses = [
            self._build_regional_economic_lens(profile, overview)
            for profile, overview in zip(ECONOMIC_LENS_PROFILES, overview_items, strict=True)
        ]

        snapshot_type = "CONTINENT" if region.type == "CONTINENT" else "REGION"
        return EconomicSnapshotResponse(
            region=region,
            snapshotType=snapshot_type,
            generatedAtUtc=datetime.now(UTC),
            lensCount=len(lenses),
            highlights=self._build_snapshot_highlights(lenses),
            lenses=lenses,
        )

    async def get_region_relative_cost_snapshot(
        self,
        region_code: str,
        source_code: str | None,
        dataset_code: str | None,
        period_granularity: str | None,
        include_missing: bool,
        expected_region_type: str | None = None,
    ) -> RelativeCostSnapshotResponse:
        normalized_region_code = self._normalize_required_code(region_code)

        region, countries = await asyncio.gather(
            self._resolve_region(normalized_region_code, expected_region_type),
            self._list_region_countries(normalized_region_code),
        )

        if not countries:
            raise AnalyticsNotFoundError(f"No active countries available for region: {normalized_region_code}")

        resolution_cache = ResolutionCache()
        indicator_details = await asyncio.gather(*[
            self._call_catalog(lambda code=profile.indicator_code: self._catalog_client.get_indicator(code))
            for profile in RELATIVE_COST_LENS_PROFILES
        ])

        overview_items = await asyncio.gather(*[
            self._build_region_indicator_overview(
                region=region,
                countries=countries,
                indicator=indicator,
                source_code=self._normalize_optional_code(source_code),
                dataset_code=self._normalize_optional_code(dataset_code),
                period_granularity=self._normalize_optional_code(period_granularity),
                include_missing=include_missing,
                resolution_cache=resolution_cache,
            )
            for indicator in indicator_details
        ])

        lenses = [
            self._build_regional_relative_cost_lens(profile, overview)
            for profile, overview in zip(RELATIVE_COST_LENS_PROFILES, overview_items, strict=True)
        ]
        snapshot_type = "CONTINENT" if region.type == "CONTINENT" else "REGION"
        decision_signals = self._build_relative_cost_decisions(
            lenses=lenses,
            scope_type=snapshot_type,
        )

        return RelativeCostSnapshotResponse(
            region=region,
            snapshotType=snapshot_type,
            generatedAtUtc=datetime.now(UTC),
            lensCount=len(lenses),
            highlights=self._build_snapshot_highlights(lenses),
            lenses=lenses,
            decisionSignalCount=len(decision_signals),
            decisionSignals=decision_signals,
        )

    async def _build_indicator_overview(
        self,
        country: CountryDetail,
        indicator: IndicatorDetail,
        source_code: str | None,
        dataset_code: str | None,
        period_granularity: str | None,
        include_missing: bool,
        series_limit: int,
        resolution_cache: ResolutionCache,
    ) -> IndicatorOverviewResponse:
        latest_by_source, availability, series = await asyncio.gather(
            self._call_timeseries(
                lambda: self._timeseries_client.list_latest_by_source(
                    country_iso3=country.iso3,
                    indicator_code=indicator.code,
                    source_code=source_code,
                    dataset_code=dataset_code,
                    period_granularity=period_granularity,
                    include_missing=include_missing,
                )
            ),
            self._call_timeseries(
                lambda: self._timeseries_client.list_series_availability(
                    country_iso3=country.iso3,
                    indicator_code=indicator.code,
                    source_code=source_code,
                    dataset_code=dataset_code,
                    period_granularity=period_granularity,
                    limit=100,
                )
            ),
            self._call_timeseries(
                lambda: self._timeseries_client.list_series(
                    country_iso3=country.iso3,
                    indicator_code=indicator.code,
                    source_code=source_code,
                    dataset_code=dataset_code,
                    period_granularity=period_granularity,
                    include_missing=include_missing,
                    sort_direction="DESC",
                    limit=series_limit * 4,
                )
            ),
        )

        primary_availability = self._select_primary_availability(availability)
        selected_series = self._select_series_preview(series, primary_availability, series_limit)
        trend = self._compute_trend(primary_availability, selected_series)
        source_contexts = await self._resolve_source_contexts_from_country_series(
            latest_by_source=latest_by_source,
            availability=availability,
            resolution_cache=resolution_cache,
        )
        source_perspectives = self._build_country_source_perspectives(
            latest_by_source=latest_by_source,
            availability=availability,
            source_contexts=source_contexts,
        )
        divergence = DivergenceSummary.from_latest_by_source(
            latest_by_source,
            primary_source_code=trend.sourceCode,
            primary_source_display_name=trend.sourceDisplayName,
            latest_comparable_period_label=trend.latestPeriodLabel,
            consistent_relative_threshold=self._settings.divergence_consistent_relative_threshold,
            mixed_relative_threshold=self._settings.divergence_mixed_relative_threshold,
        )
        freshness = self._build_freshness_summary(source_perspectives)
        confidence = self._build_country_confidence_summary(source_perspectives, freshness, divergence)
        source_audit = self._build_country_source_audit(
            country=country,
            indicator=indicator,
            source_perspectives=source_perspectives,
            freshness=freshness,
            divergence=divergence,
            confidence=confidence,
        )

        return IndicatorOverviewResponse(
            country=country,
            indicator=indicator,
            trend=trend,
            divergence=divergence,
            freshness=freshness,
            confidence=confidence,
            sourceAudit=source_audit,
            availability=availability,
            latestBySource=latest_by_source,
            sourcePerspectives=source_perspectives,
            selectedSeriesPreview=selected_series,
        )

    async def _build_region_indicator_overview(
        self,
        region: RegionDetail,
        countries: list,
        indicator: IndicatorDetail,
        source_code: str | None,
        dataset_code: str | None,
        period_granularity: str | None,
        include_missing: bool,
        resolution_cache: ResolutionCache,
    ) -> RegionIndicatorOverviewResponse:
        comparison_items = await self._call_timeseries(
            lambda: self._timeseries_client.compare_countries_latest(
                country_iso3=[item.iso3 for item in countries],
                indicator_code=indicator.code,
                source_code=source_code,
                dataset_code=dataset_code,
                period_granularity=period_granularity,
                include_missing=include_missing,
            )
        )

        source_contexts = await self._resolve_source_contexts_from_regional_items(
            comparison_items=comparison_items,
            resolution_cache=resolution_cache,
        )
        source_perspectives = self._build_regional_source_perspectives(
            comparison_items=comparison_items,
            member_country_count=len(countries),
            source_contexts=source_contexts,
        )
        primary_perspective = self._select_primary_regional_perspective(source_perspectives)
        divergence = DivergenceSummary.from_numeric_values(
            numeric_values=[item.medianNumericValue for item in source_perspectives],
            source_count=len(source_perspectives),
            primary_source_code=primary_perspective.sourceCode if primary_perspective else None,
            primary_source_display_name=primary_perspective.sourceDisplayName if primary_perspective else None,
            latest_comparable_period_label=primary_perspective.latestPeriodLabel if primary_perspective else None,
            consistent_relative_threshold=self._settings.divergence_consistent_relative_threshold,
            mixed_relative_threshold=self._settings.divergence_mixed_relative_threshold,
        )
        freshness = self._build_freshness_summary(source_perspectives)
        confidence = self._build_regional_confidence_summary(
            source_perspectives,
            freshness,
            divergence,
            primary_coverage_ratio=primary_perspective.coverageRatio if primary_perspective else None,
        )
        scope_type = region.type if region.type in {"CONTINENT", "REGION", "SUBREGION"} else "REGION"
        source_audit = self._build_regional_source_audit(
            scope_type=scope_type,
            region=region,
            indicator=indicator,
            source_perspectives=source_perspectives,
            freshness=freshness,
            divergence=divergence,
            confidence=confidence,
        )

        return RegionIndicatorOverviewResponse(
            region=region,
            memberCountryCount=len(countries),
            comparableCountryCount=primary_perspective.comparableCountryCount if primary_perspective else 0,
            indicator=indicator,
            divergence=divergence,
            freshness=freshness,
            confidence=confidence,
            sourceAudit=source_audit,
            sourcePerspectives=source_perspectives,
        )
    async def _resolve_indicator_details(
        self,
        indicator_codes: list[str] | None,
        max_indicators: int | None,
    ) -> list[IndicatorDetail]:
        effective_limit = max_indicators or self._settings.default_country_overview_indicator_limit

        if indicator_codes:
            normalized_codes: list[str] = []
            for item in indicator_codes:
                normalized_item = self._normalize_required_code(item)
                if normalized_item not in normalized_codes:
                    normalized_codes.append(normalized_item)
            normalized_codes = normalized_codes[:effective_limit]
            return await asyncio.gather(*[
                self._call_catalog(lambda code=code: self._catalog_client.get_indicator(code))
                for code in normalized_codes
            ])

        indicators = await self._call_catalog(self._catalog_client.list_core_indicators)
        selected_codes = [item.code for item in indicators[:effective_limit]]
        return await asyncio.gather(*[
            self._call_catalog(lambda code=code: self._catalog_client.get_indicator(code))
            for code in selected_codes
        ])

    async def _resolve_region(self, region_code: str, expected_region_type: str | None) -> RegionDetail:
        region = await self._call_catalog(lambda: self._catalog_client.get_region(region_code))
        if expected_region_type is not None and region.type != expected_region_type:
            raise AnalyticsNotFoundError(f"Unknown {expected_region_type.lower()}: {region_code}")
        return region

    async def _list_region_countries(self, region_code: str) -> list:
        return await self._call_catalog(
            lambda: self._catalog_client.list_countries(
                include_aggregates=False,
                active_only=True,
                region_code=region_code,
                limit=self._settings.region_country_limit,
            )
        )

    async def _resolve_source_contexts_from_country_series(
        self,
        latest_by_source: list[LatestSourceObservation],
        availability: list[SeriesAvailability],
        resolution_cache: ResolutionCache,
    ) -> dict[tuple[str, str], SourceContext]:
        pair_keys = {(item.sourceCode, item.datasetCode) for item in latest_by_source}
        pair_keys.update((item.sourceCode, item.datasetCode) for item in availability)
        return await self._resolve_source_contexts(pair_keys, resolution_cache)

    async def _resolve_source_contexts_from_regional_items(
        self,
        comparison_items: list[CountryLatestComparisonItem],
        resolution_cache: ResolutionCache,
    ) -> dict[tuple[str, str], SourceContext]:
        pair_keys = {(item.sourceCode, item.datasetCode) for item in comparison_items}
        return await self._resolve_source_contexts(pair_keys, resolution_cache)

    async def _resolve_source_contexts(
        self,
        pair_keys: set[tuple[str, str]],
        resolution_cache: ResolutionCache,
    ) -> dict[tuple[str, str], SourceContext]:
        source_codes_to_fetch = {
            source_code
            for source_code, _ in pair_keys
            if source_code not in resolution_cache.sources
        }

        if source_codes_to_fetch:
            source_results = await asyncio.gather(*[
                self._safe_optional_catalog(lambda code=source_code: self._catalog_client.get_source(code))
                for source_code in source_codes_to_fetch
            ])
            for source_code, source_detail in zip(source_codes_to_fetch, source_results, strict=True):
                resolution_cache.sources[source_code] = source_detail

        dataset_keys_to_fetch = [pair_key for pair_key in pair_keys if pair_key not in resolution_cache.datasets]
        if dataset_keys_to_fetch:
            dataset_results = await asyncio.gather(*[
                self._safe_optional_catalog(
                    lambda source_code=source_code, dataset_code=dataset_code:
                    self._catalog_client.get_source_dataset(source_code, dataset_code)
                )
                for source_code, dataset_code in dataset_keys_to_fetch
            ])
            for pair_key, dataset_detail in zip(dataset_keys_to_fetch, dataset_results, strict=True):
                resolution_cache.datasets[pair_key] = dataset_detail

        run_keys_to_fetch = [pair_key for pair_key in pair_keys if pair_key not in resolution_cache.latest_runs]
        if run_keys_to_fetch:
            run_results = await asyncio.gather(*[
                self._safe_latest_source_run(source_code, dataset_code)
                for source_code, dataset_code in run_keys_to_fetch
            ])
            for pair_key, latest_run in zip(run_keys_to_fetch, run_results, strict=True):
                resolution_cache.latest_runs[pair_key] = latest_run

        return {
            pair_key: SourceContext(
                source=resolution_cache.sources.get(pair_key[0]),
                dataset=resolution_cache.datasets.get(pair_key),
                latest_run=resolution_cache.latest_runs.get(pair_key),
            )
            for pair_key in pair_keys
        }

    def _build_country_source_perspectives(
        self,
        latest_by_source: list[LatestSourceObservation],
        availability: list[SeriesAvailability],
        source_contexts: dict[tuple[str, str], SourceContext],
    ) -> list[SourcePerspective]:
        availability_by_key = {
            (item.sourceCode, item.datasetCode, item.periodGranularity): item
            for item in availability
        }

        source_perspectives: list[SourcePerspective] = []
        for item in latest_by_source:
            availability_item = availability_by_key.get((item.sourceCode, item.datasetCode, item.periodGranularity))
            context = source_contexts.get((item.sourceCode, item.datasetCode), SourceContext(None, None, None))
            fetch_reference = item.fetchedAtUtc or (context.latest_run.fetchedAtUtc if context.latest_run else None)
            fetch_age_days = self._age_days(fetch_reference)
            publication_age_days = self._age_days(item.sourcePublishedAt)
            freshness_level = self._freshness_level(fetch_age_days, publication_age_days)

            source_perspectives.append(
                SourcePerspective(
                    sourceCode=item.sourceCode,
                    sourceDisplayName=item.sourceDisplayName,
                    sourceType=context.source.type if context.source else None,
                    sourceOrganizationName=context.source.organizationName if context.source else None,
                    sourceBiasNotes=context.source.biasNotes if context.source else None,
                    sourceQualityNotes=context.source.qualityNotes if context.source else None,
                    datasetCode=item.datasetCode,
                    datasetDisplayName=item.datasetDisplayName,
                    datasetCategory=context.dataset.category if context.dataset else None,
                    datasetDefaultGranularity=context.dataset.defaultGranularity if context.dataset else None,
                    datasetDefaultFrequency=context.dataset.defaultFrequency if context.dataset else None,
                    periodGranularity=item.periodGranularity,
                    periodLabel=item.periodLabel,
                    numericValue=item.numericValue,
                    textValue=item.textValue,
                    valueStatus=item.valueStatus,
                    availableObservationCount=availability_item.availableObservationCount if availability_item else 0,
                    observedObservationCount=availability_item.observedObservationCount if availability_item else 0,
                    estimatedObservationCount=availability_item.estimatedObservationCount if availability_item else 0,
                    suppressedObservationCount=availability_item.suppressedObservationCount if availability_item else 0,
                    missingObservationCount=availability_item.missingObservationCount if availability_item else 0,
                    firstPeriodStart=availability_item.firstPeriodStart if availability_item else None,
                    latestPeriodStart=item.periodStart,
                    latestPeriodEnd=item.periodEnd,
                    sourcePublishedAt=item.sourcePublishedAt,
                    fetchedAtUtc=item.fetchedAtUtc,
                    latestSuccessfulRunKey=context.latest_run.runKey if context.latest_run else None,
                    latestSuccessfulRunFetchedAtUtc=context.latest_run.fetchedAtUtc if context.latest_run else None,
                    latestSuccessfulRunPersistedAtUtc=context.latest_run.persistedAtUtc if context.latest_run else None,
                    latestSuccessfulRunRecordCount=context.latest_run.recordCount if context.latest_run else None,
                    freshnessLevel=freshness_level,
                    fetchAgeDays=fetch_age_days,
                    publicationAgeDays=publication_age_days,
                )
            )

        return sorted(
            source_perspectives,
            key=lambda item: (
                item.availableObservationCount,
                item.observedObservationCount,
                item.fetchedAtUtc or datetime.min.replace(tzinfo=UTC),
                item.periodLabel or "",
            ),
            reverse=True,
        )
    def _build_regional_source_perspectives(
        self,
        comparison_items: list[CountryLatestComparisonItem],
        member_country_count: int,
        source_contexts: dict[tuple[str, str], SourceContext],
    ) -> list[RegionalSourcePerspective]:
        grouped: dict[tuple[str, str, str], list[CountryLatestComparisonItem]] = {}
        for item in comparison_items:
            grouped.setdefault((item.sourceCode, item.datasetCode, item.periodGranularity), []).append(item)

        source_perspectives: list[RegionalSourcePerspective] = []
        for (source_code, dataset_code, period_granularity), items in grouped.items():
            numeric_items = [item for item in items if item.numericValue is not None]
            source_published_at = self._latest_datetime([item.sourcePublishedAt for item in items])
            fetched_at_utc = self._latest_datetime([item.fetchedAtUtc for item in items])
            context = source_contexts.get((source_code, dataset_code), SourceContext(None, None, None))
            fetch_reference = fetched_at_utc or (context.latest_run.fetchedAtUtc if context.latest_run else None)
            fetch_age_days = self._age_days(fetch_reference)
            publication_age_days = self._age_days(source_published_at)
            freshness_level = self._freshness_level(fetch_age_days, publication_age_days)
            latest_item = self._latest_country_item(items)

            min_item = min(numeric_items, key=lambda item: item.numericValue) if numeric_items else None
            max_item = max(numeric_items, key=lambda item: item.numericValue) if numeric_items else None

            source_perspectives.append(
                RegionalSourcePerspective(
                    sourceCode=source_code,
                    sourceDisplayName=items[0].sourceDisplayName,
                    sourceType=context.source.type if context.source else None,
                    sourceOrganizationName=context.source.organizationName if context.source else None,
                    sourceBiasNotes=context.source.biasNotes if context.source else None,
                    sourceQualityNotes=context.source.qualityNotes if context.source else None,
                    datasetCode=dataset_code,
                    datasetDisplayName=items[0].datasetDisplayName,
                    datasetCategory=context.dataset.category if context.dataset else None,
                    datasetDefaultGranularity=context.dataset.defaultGranularity if context.dataset else None,
                    datasetDefaultFrequency=context.dataset.defaultFrequency if context.dataset else None,
                    periodGranularity=period_granularity,
                    latestPeriodLabel=latest_item.periodLabel if latest_item else None,
                    memberCountryCount=member_country_count,
                    comparableCountryCount=len(numeric_items),
                    observedCountryCount=sum(1 for item in items if item.valueStatus == "OBSERVED"),
                    estimatedCountryCount=sum(1 for item in items if item.valueStatus == "ESTIMATED"),
                    missingCountryCount=max(member_country_count - len(numeric_items), 0),
                    coverageRatio=self._ratio(len(numeric_items), member_country_count),
                    medianNumericValue=float(median([item.numericValue for item in numeric_items])) if numeric_items else None,
                    minNumericValue=min_item.numericValue if min_item else None,
                    minCountryIso3=min_item.countryIso3 if min_item else None,
                    minCountryDisplayName=min_item.countryDisplayName if min_item else None,
                    maxNumericValue=max_item.numericValue if max_item else None,
                    maxCountryIso3=max_item.countryIso3 if max_item else None,
                    maxCountryDisplayName=max_item.countryDisplayName if max_item else None,
                    sourcePublishedAt=source_published_at,
                    fetchedAtUtc=fetched_at_utc,
                    latestSuccessfulRunKey=context.latest_run.runKey if context.latest_run else None,
                    latestSuccessfulRunFetchedAtUtc=context.latest_run.fetchedAtUtc if context.latest_run else None,
                    latestSuccessfulRunPersistedAtUtc=context.latest_run.persistedAtUtc if context.latest_run else None,
                    latestSuccessfulRunRecordCount=context.latest_run.recordCount if context.latest_run else None,
                    freshnessLevel=freshness_level,
                    fetchAgeDays=fetch_age_days,
                    publicationAgeDays=publication_age_days,
                )
            )

        return sorted(
            source_perspectives,
            key=lambda item: (
                item.comparableCountryCount,
                item.observedCountryCount,
                item.coverageRatio or 0,
                item.fetchedAtUtc or datetime.min.replace(tzinfo=UTC),
            ),
            reverse=True,
        )

    def _build_country_source_audit(
        self,
        country: CountryDetail,
        indicator: IndicatorDetail,
        source_perspectives: list[SourcePerspective],
        freshness: FreshnessSummary,
        divergence: DivergenceSummary,
        confidence: ConfidenceSummary,
    ) -> SourceAuditView:
        return SourceAuditView(
            scopeType="COUNTRY",
            scopeCode=country.iso3,
            scopeDisplayName=country.displayName,
            indicatorCode=indicator.code,
            indicatorDisplayName=indicator.displayName,
            confidenceLevel=confidence.level,
            freshnessLevel=freshness.level,
            agreementLevel=divergence.agreementLevel,
            primarySourceCode=divergence.primarySourceCode,
            primarySourceDisplayName=divergence.primarySourceDisplayName,
            comparableSourceCount=divergence.comparableValueCount,
            evidence=self._build_country_audit_evidence(
                source_perspectives=source_perspectives,
                freshness=freshness,
                divergence=divergence,
                confidence=confidence,
            ),
        )

    def _build_regional_source_audit(
        self,
        scope_type: str,
        region: RegionDetail,
        indicator: IndicatorDetail,
        source_perspectives: list[RegionalSourcePerspective],
        freshness: FreshnessSummary,
        divergence: DivergenceSummary,
        confidence: ConfidenceSummary,
    ) -> SourceAuditView:
        return SourceAuditView(
            scopeType=scope_type,
            scopeCode=region.code,
            scopeDisplayName=region.displayName,
            indicatorCode=indicator.code,
            indicatorDisplayName=indicator.displayName,
            confidenceLevel=confidence.level,
            freshnessLevel=freshness.level,
            agreementLevel=divergence.agreementLevel,
            primarySourceCode=divergence.primarySourceCode,
            primarySourceDisplayName=divergence.primarySourceDisplayName,
            comparableSourceCount=divergence.comparableValueCount,
            evidence=self._build_regional_audit_evidence(
                source_perspectives=source_perspectives,
                freshness=freshness,
                divergence=divergence,
                confidence=confidence,
            ),
        )

    def _build_country_audit_evidence(
        self,
        source_perspectives: list[SourcePerspective],
        freshness: FreshnessSummary,
        divergence: DivergenceSummary,
        confidence: ConfidenceSummary,
    ) -> list[AuditEvidenceItem]:
        source_codes = sorted({item.sourceCode for item in source_perspectives})
        dataset_codes = sorted({item.datasetCode for item in source_perspectives})
        evidence: list[AuditEvidenceItem] = []

        if divergence.comparableValueCount >= 2:
            evidence.append(
                AuditEvidenceItem(
                    code="MULTI_SOURCE_COMPARISON",
                    severity="POSITIVE",
                    title="Multiple comparable sources",
                    detail="Several source values are available, so this indicator can be cross-checked instead of relying on a single publisher.",
                    metricLabel="comparable_sources",
                    metricValue=divergence.comparableValueCount,
                    sourceCodes=source_codes,
                    datasetCodes=dataset_codes,
                )
            )
        elif divergence.comparableValueCount == 1:
            evidence.append(
                AuditEvidenceItem(
                    code="SINGLE_COMPARABLE_SOURCE",
                    severity="CAUTION",
                    title="Only one comparable source value",
                    detail="The current confidence is limited because there is only one comparable numeric source value to validate against.",
                    metricLabel="comparable_sources",
                    metricValue=1,
                    sourceCodes=source_codes,
                    datasetCodes=dataset_codes,
                )
            )
        else:
            evidence.append(
                AuditEvidenceItem(
                    code="NO_COMPARABLE_SOURCE",
                    severity="WARNING",
                    title="No comparable source values",
                    detail="Confidence is constrained because no comparable numeric source values are currently available.",
                    metricLabel="comparable_sources",
                    metricValue=0,
                    sourceCodes=source_codes,
                    datasetCodes=dataset_codes,
                )
            )

        evidence.extend(self._build_alignment_and_freshness_evidence(source_codes, dataset_codes, freshness, divergence))

        observed_source_count = sum(1 for item in source_perspectives if item.valueStatus == "OBSERVED")
        estimated_source_count = sum(1 for item in source_perspectives if item.valueStatus == "ESTIMATED")
        if observed_source_count > 0:
            evidence.append(
                AuditEvidenceItem(
                    code="OBSERVED_SOURCE_PRESENT",
                    severity="POSITIVE",
                    title="Observed values are available",
                    detail="At least one source contributes an observed value rather than only an estimate.",
                    metricLabel="observed_sources",
                    metricValue=observed_source_count,
                    sourceCodes=source_codes,
                    datasetCodes=dataset_codes,
                )
            )
        elif estimated_source_count > 0:
            evidence.append(
                AuditEvidenceItem(
                    code="ESTIMATED_ONLY",
                    severity="CAUTION",
                    title="Only estimated values available",
                    detail="The current evidence is driven by estimated values, which should be interpreted with added caution.",
                    metricLabel="estimated_sources",
                    metricValue=estimated_source_count,
                    sourceCodes=source_codes,
                    datasetCodes=dataset_codes,
                )
            )

        if confidence.sourceTypeDiversityCount >= 2:
            evidence.append(
                AuditEvidenceItem(
                    code="DIVERSE_SOURCE_FAMILIES",
                    severity="POSITIVE",
                    title="Multiple source families",
                    detail="The evidence mixes several source families, which helps reduce dependence on a single publication style.",
                    metricLabel="source_type_diversity",
                    metricValue=confidence.sourceTypeDiversityCount,
                    sourceCodes=source_codes,
                    datasetCodes=dataset_codes,
                )
            )
        elif divergence.comparableValueCount > 0:
            evidence.append(
                AuditEvidenceItem(
                    code="LIMITED_SOURCE_FAMILY_DIVERSITY",
                    severity="INFO",
                    title="Limited source family diversity",
                    detail="Comparable values currently come from a narrow source-family mix, so methodological blind spots may remain.",
                    metricLabel="source_type_diversity",
                    metricValue=confidence.sourceTypeDiversityCount,
                    sourceCodes=source_codes,
                    datasetCodes=dataset_codes,
                )
            )

        return evidence

    def _build_regional_audit_evidence(
        self,
        source_perspectives: list[RegionalSourcePerspective],
        freshness: FreshnessSummary,
        divergence: DivergenceSummary,
        confidence: ConfidenceSummary,
    ) -> list[AuditEvidenceItem]:
        source_codes = sorted({item.sourceCode for item in source_perspectives})
        dataset_codes = sorted({item.datasetCode for item in source_perspectives})
        evidence: list[AuditEvidenceItem] = []

        if divergence.comparableValueCount >= 2:
            evidence.append(
                AuditEvidenceItem(
                    code="MULTI_SOURCE_REGIONAL_COMPARISON",
                    severity="POSITIVE",
                    title="Multiple regional source perspectives",
                    detail="Several regional source perspectives are available, so the regional median can be challenged across datasets.",
                    metricLabel="comparable_source_perspectives",
                    metricValue=divergence.comparableValueCount,
                    sourceCodes=source_codes,
                    datasetCodes=dataset_codes,
                )
            )
        elif divergence.comparableValueCount == 1:
            evidence.append(
                AuditEvidenceItem(
                    code="SINGLE_REGIONAL_SOURCE_PERSPECTIVE",
                    severity="CAUTION",
                    title="Only one regional source perspective",
                    detail="Regional confidence is limited because only one source perspective currently provides a comparable regional median.",
                    metricLabel="comparable_source_perspectives",
                    metricValue=1,
                    sourceCodes=source_codes,
                    datasetCodes=dataset_codes,
                )
            )
        else:
            evidence.append(
                AuditEvidenceItem(
                    code="NO_REGIONAL_SOURCE_PERSPECTIVE",
                    severity="WARNING",
                    title="No comparable regional median",
                    detail="Regional confidence is constrained because no source perspective currently yields a comparable regional median.",
                    metricLabel="comparable_source_perspectives",
                    metricValue=0,
                    sourceCodes=source_codes,
                    datasetCodes=dataset_codes,
                )
            )

        evidence.extend(self._build_alignment_and_freshness_evidence(source_codes, dataset_codes, freshness, divergence))

        primary_coverage = max((item.coverageRatio or 0.0 for item in source_perspectives), default=0.0)
        if primary_coverage >= 0.8:
            evidence.append(
                AuditEvidenceItem(
                    code="HIGH_MEMBER_COVERAGE",
                    severity="POSITIVE",
                    title="Strong member-country coverage",
                    detail="The strongest source perspective covers most of the member countries in the selected region.",
                    metricLabel="coverage_ratio",
                    metricValue=round(primary_coverage, 4),
                    sourceCodes=source_codes,
                    datasetCodes=dataset_codes,
                )
            )
        elif primary_coverage >= 0.5:
            evidence.append(
                AuditEvidenceItem(
                    code="PARTIAL_MEMBER_COVERAGE",
                    severity="INFO",
                    title="Partial member-country coverage",
                    detail="The strongest source perspective covers a workable share of member countries, but not the full region.",
                    metricLabel="coverage_ratio",
                    metricValue=round(primary_coverage, 4),
                    sourceCodes=source_codes,
                    datasetCodes=dataset_codes,
                )
            )
        else:
            evidence.append(
                AuditEvidenceItem(
                    code="LOW_MEMBER_COVERAGE",
                    severity="WARNING",
                    title="Limited member-country coverage",
                    detail="The strongest source perspective covers only a limited share of member countries, which weakens the regional picture.",
                    metricLabel="coverage_ratio",
                    metricValue=round(primary_coverage, 4),
                    sourceCodes=source_codes,
                    datasetCodes=dataset_codes,
                )
            )

        if confidence.sourceTypeDiversityCount >= 2:
            evidence.append(
                AuditEvidenceItem(
                    code="DIVERSE_REGIONAL_SOURCE_FAMILIES",
                    severity="POSITIVE",
                    title="Multiple source families at regional level",
                    detail="The regional evidence spans multiple source families instead of relying on a single institutional lens.",
                    metricLabel="source_type_diversity",
                    metricValue=confidence.sourceTypeDiversityCount,
                    sourceCodes=source_codes,
                    datasetCodes=dataset_codes,
                )
            )
        elif divergence.comparableValueCount > 0:
            evidence.append(
                AuditEvidenceItem(
                    code="LIMITED_REGIONAL_SOURCE_FAMILY_DIVERSITY",
                    severity="INFO",
                    title="Limited source-family diversity",
                    detail="Comparable regional evidence still comes from a narrow family of sources, so blind spots may remain.",
                    metricLabel="source_type_diversity",
                    metricValue=confidence.sourceTypeDiversityCount,
                    sourceCodes=source_codes,
                    datasetCodes=dataset_codes,
                )
            )

        return evidence

    def _build_alignment_and_freshness_evidence(
        self,
        source_codes: list[str],
        dataset_codes: list[str],
        freshness: FreshnessSummary,
        divergence: DivergenceSummary,
    ) -> list[AuditEvidenceItem]:
        evidence: list[AuditEvidenceItem] = []

        if divergence.agreementLevel == "CONSISTENT":
            evidence.append(
                AuditEvidenceItem(
                    code="HIGH_SOURCE_ALIGNMENT",
                    severity="POSITIVE",
                    title="Tight source alignment",
                    detail="Comparable source values are tightly clustered relative to their median, which supports a stronger confidence level.",
                    metricLabel="range_relative_to_median",
                    metricValue=round(divergence.rangeRelativeToMedian, 6) if divergence.rangeRelativeToMedian is not None else None,
                    sourceCodes=source_codes,
                    datasetCodes=dataset_codes,
                )
            )
        elif divergence.agreementLevel == "MIXED":
            evidence.append(
                AuditEvidenceItem(
                    code="MODERATE_SOURCE_SPREAD",
                    severity="INFO",
                    title="Moderate spread across sources",
                    detail="Comparable source values are directionally aligned, but the spread is wide enough to keep confidence below its maximum.",
                    metricLabel="range_relative_to_median",
                    metricValue=round(divergence.rangeRelativeToMedian, 6) if divergence.rangeRelativeToMedian is not None else None,
                    sourceCodes=source_codes,
                    datasetCodes=dataset_codes,
                )
            )
        elif divergence.agreementLevel == "DIVERGENT":
            evidence.append(
                AuditEvidenceItem(
                    code="MATERIAL_SOURCE_DIVERGENCE",
                    severity="WARNING",
                    title="Material divergence across sources",
                    detail="Comparable source values diverge materially, which is a direct reason to downgrade confidence.",
                    metricLabel="range_relative_to_median",
                    metricValue=round(divergence.rangeRelativeToMedian, 6) if divergence.rangeRelativeToMedian is not None else None,
                    sourceCodes=source_codes,
                    datasetCodes=dataset_codes,
                )
            )

        if freshness.level == "FRESH":
            evidence.append(
                AuditEvidenceItem(
                    code="FRESH_SOURCE_METADATA",
                    severity="POSITIVE",
                    title="Fresh source snapshots",
                    detail="The comparable source snapshots are recent enough to support current analysis.",
                    metricLabel="max_reference_age_days",
                    metricValue=max(filter(lambda item: item is not None, [freshness.maxFetchAgeDays, freshness.maxPublicationAgeDays]), default=None),
                    sourceCodes=source_codes,
                    datasetCodes=dataset_codes,
                )
            )
        elif freshness.level == "AGING":
            evidence.append(
                AuditEvidenceItem(
                    code="AGING_SOURCE_METADATA",
                    severity="INFO",
                    title="Aging source snapshots",
                    detail="The source snapshots are still usable, but they are old enough to slightly reduce analytical confidence.",
                    metricLabel="max_reference_age_days",
                    metricValue=max(filter(lambda item: item is not None, [freshness.maxFetchAgeDays, freshness.maxPublicationAgeDays]), default=None),
                    sourceCodes=source_codes,
                    datasetCodes=dataset_codes,
                )
            )
        elif freshness.level == "STALE":
            evidence.append(
                AuditEvidenceItem(
                    code="STALE_SOURCE_METADATA",
                    severity="WARNING",
                    title="Stale source snapshots",
                    detail="The comparable source snapshots are stale, which directly weakens the trust level of the current view.",
                    metricLabel="max_reference_age_days",
                    metricValue=max(filter(lambda item: item is not None, [freshness.maxFetchAgeDays, freshness.maxPublicationAgeDays]), default=None),
                    sourceCodes=source_codes,
                    datasetCodes=dataset_codes,
                )
            )
        else:
            evidence.append(
                AuditEvidenceItem(
                    code="UNKNOWN_FRESHNESS",
                    severity="CAUTION",
                    title="Freshness could not be established",
                    detail="The upstream metadata does not expose enough publication or fetch timing to certify freshness cleanly.",
                    sourceCodes=source_codes,
                    datasetCodes=dataset_codes,
                )
            )

        return evidence

    def _build_country_economic_lens(
        self,
        profile: EconomicLensProfile,
        overview: IndicatorOverviewResponse,
    ) -> CountryEconomicLens:
        signal_tone, headline, narrative = describe_country_economic_lens(
            profile.lens_code,
            overview.divergence.medianNumericValue,
            overview.trend.direction,
        )
        primary_perspective = self._select_primary_source_perspective(overview.sourcePerspectives)

        return CountryEconomicLens(
            lensCode=profile.lens_code,
            lensDisplayName=profile.lens_display_name,
            signalTone=signal_tone,
            headline=headline,
            narrative=narrative,
            whyItMatters=profile.why_it_matters,
            indicatorCode=overview.indicator.code,
            indicatorDisplayName=overview.indicator.displayName,
            unitLabel=overview.indicator.unitLabel,
            latestComparableValue=overview.divergence.medianNumericValue,
            latestComparableSourceCount=overview.divergence.comparableValueCount,
            latestPeriodLabel=overview.divergence.latestComparablePeriodLabel,
            trendDirection=overview.trend.direction,
            selectedSourceCode=overview.divergence.primarySourceCode,
            selectedDatasetCode=primary_perspective.datasetCode if primary_perspective else None,
            agreementLevel=overview.divergence.agreementLevel,
            confidenceLevel=overview.confidence.level,
            freshnessLevel=overview.freshness.level,
            sourceAudit=overview.sourceAudit,
        )

    def _build_country_relative_cost_lens(
        self,
        profile: RelativeCostLensProfile,
        overview: IndicatorOverviewResponse,
    ) -> CountryRelativeCostLens:
        signal_tone, headline, narrative = describe_country_relative_cost_lens(
            profile.lens_code,
            overview.divergence.medianNumericValue,
            overview.trend.direction,
        )
        primary_perspective = self._select_primary_source_perspective(overview.sourcePerspectives)

        return CountryRelativeCostLens(
            lensCode=profile.lens_code,
            lensDisplayName=profile.lens_display_name,
            signalTone=signal_tone,
            headline=headline,
            narrative=narrative,
            whyItMatters=profile.why_it_matters,
            indicatorCode=overview.indicator.code,
            indicatorDisplayName=overview.indicator.displayName,
            unitLabel=overview.indicator.unitLabel,
            latestComparableValue=overview.divergence.medianNumericValue,
            latestComparableSourceCount=overview.divergence.comparableValueCount,
            latestPeriodLabel=overview.divergence.latestComparablePeriodLabel,
            trendDirection=overview.trend.direction,
            selectedSourceCode=overview.divergence.primarySourceCode,
            selectedDatasetCode=primary_perspective.datasetCode if primary_perspective else None,
            agreementLevel=overview.divergence.agreementLevel,
            confidenceLevel=overview.confidence.level,
            freshnessLevel=overview.freshness.level,
            sourceAudit=overview.sourceAudit,
        )

    def _build_regional_economic_lens(
        self,
        profile: EconomicLensProfile,
        overview: RegionIndicatorOverviewResponse,
    ) -> RegionalEconomicLens:
        signal_tone, headline, narrative = describe_regional_economic_lens(
            profile.lens_code,
            overview.divergence.medianNumericValue,
        )
        primary_perspective = self._select_primary_regional_perspective(overview.sourcePerspectives)

        return RegionalEconomicLens(
            lensCode=profile.lens_code,
            lensDisplayName=profile.lens_display_name,
            signalTone=signal_tone,
            headline=headline,
            narrative=narrative,
            whyItMatters=profile.why_it_matters,
            indicatorCode=overview.indicator.code,
            indicatorDisplayName=overview.indicator.displayName,
            unitLabel=overview.indicator.unitLabel,
            medianComparableValue=overview.divergence.medianNumericValue,
            comparableCountryCount=overview.comparableCountryCount,
            memberCountryCount=overview.memberCountryCount,
            coverageRatio=self._ratio(overview.comparableCountryCount, overview.memberCountryCount),
            latestPeriodLabel=overview.divergence.latestComparablePeriodLabel,
            selectedSourceCode=overview.divergence.primarySourceCode,
            selectedDatasetCode=primary_perspective.datasetCode if primary_perspective else None,
            agreementLevel=overview.divergence.agreementLevel,
            confidenceLevel=overview.confidence.level,
            freshnessLevel=overview.freshness.level,
        )

    def _build_regional_relative_cost_lens(
        self,
        profile: RelativeCostLensProfile,
        overview: RegionIndicatorOverviewResponse,
    ) -> RegionalRelativeCostLens:
        signal_tone, headline, narrative = describe_regional_relative_cost_lens(
            profile.lens_code,
            overview.divergence.medianNumericValue,
        )
        primary_perspective = self._select_primary_regional_perspective(overview.sourcePerspectives)

        return RegionalRelativeCostLens(
            lensCode=profile.lens_code,
            lensDisplayName=profile.lens_display_name,
            signalTone=signal_tone,
            headline=headline,
            narrative=narrative,
            whyItMatters=profile.why_it_matters,
            indicatorCode=overview.indicator.code,
            indicatorDisplayName=overview.indicator.displayName,
            unitLabel=overview.indicator.unitLabel,
            medianComparableValue=overview.divergence.medianNumericValue,
            comparableCountryCount=overview.comparableCountryCount,
            memberCountryCount=overview.memberCountryCount,
            coverageRatio=self._ratio(overview.comparableCountryCount, overview.memberCountryCount),
            latestPeriodLabel=overview.divergence.latestComparablePeriodLabel,
            selectedSourceCode=overview.divergence.primarySourceCode,
            selectedDatasetCode=primary_perspective.datasetCode if primary_perspective else None,
            agreementLevel=overview.divergence.agreementLevel,
            confidenceLevel=overview.confidence.level,
            freshnessLevel=overview.freshness.level,
        )

    def _build_relative_cost_decisions(
        self,
        *,
        lenses: list[RegionalRelativeCostLens | CountryRelativeCostLens],
        scope_type: str,
    ) -> list[RelativeCostDecisionSignal]:
        lens_by_code = {lens.lensCode: lens for lens in lenses}
        return [
            self._build_relative_cost_decision(
                profile=profile,
                lens_by_code=lens_by_code,
                scope_type=scope_type,
            )
            for profile in RELATIVE_COST_DECISION_PROFILES
        ]

    def _build_relative_cost_decision(
        self,
        *,
        profile: RelativeCostDecisionProfile,
        lens_by_code: dict[str, RegionalRelativeCostLens | CountryRelativeCostLens],
        scope_type: str,
    ) -> RelativeCostDecisionSignal:
        supporting_lenses = [
            lens_by_code[code]
            for code in profile.supporting_lens_codes
            if code in lens_by_code
        ]
        supporting_codes = [lens.lensCode for lens in supporting_lenses]
        cautionary_notes = self._relative_cost_cautionary_notes(profile.decision_code)

        if not supporting_lenses:
            return RelativeCostDecisionSignal(
                decisionCode=profile.decision_code,
                decisionDisplayName=profile.decision_display_name,
                signalTone="CONTEXT",
                headline="Insufficient supporting evidence",
                narrative="The current relative-cost snapshot does not yet expose enough supporting lenses to derive a decision-oriented signal.",
                whyItMatters=profile.why_it_matters,
                supportingLensCodes=[],
                confidenceLevel="INSUFFICIENT_EVIDENCE",
                freshnessLevel="UNKNOWN",
                cautionaryNotes=cautionary_notes,
            )

        if all(lens.signalTone == "CONTEXT" for lens in supporting_lenses):
            return RelativeCostDecisionSignal(
                decisionCode=profile.decision_code,
                decisionDisplayName=profile.decision_display_name,
                signalTone="CONTEXT",
                headline="Evidence still too thin for a decision signal",
                narrative=(
                    "The supporting price, inflation, and housing lenses are still too incomplete to turn this relative-cost snapshot "
                    "into a reliable travel or affordability decision aid."
                ),
                whyItMatters=profile.why_it_matters,
                supportingLensCodes=supporting_codes,
                confidenceLevel=self._worst_confidence_level(supporting_lenses),
                freshnessLevel=self._worst_freshness_level(supporting_lenses),
                cautionaryNotes=cautionary_notes,
            )

        general_cost = lens_by_code.get("GENERAL_COST_LEVEL")
        inflation = lens_by_code.get("CONSUMER_PRICE_PRESSURE")
        housing = lens_by_code.get("HOUSING_MARKET_HEAT")

        signal_tone, headline, narrative = self._describe_relative_cost_decision(
            decision_code=profile.decision_code,
            scope_type=scope_type,
            general_cost=general_cost,
            inflation=inflation,
            housing=housing,
        )

        return RelativeCostDecisionSignal(
            decisionCode=profile.decision_code,
            decisionDisplayName=profile.decision_display_name,
            signalTone=signal_tone,
            headline=headline,
            narrative=narrative,
            whyItMatters=profile.why_it_matters,
            supportingLensCodes=supporting_codes,
            confidenceLevel=self._worst_confidence_level(supporting_lenses),
            freshnessLevel=self._worst_freshness_level(supporting_lenses),
            cautionaryNotes=cautionary_notes,
        )

    def _describe_relative_cost_decision(
        self,
        *,
        decision_code: str,
        scope_type: str,
        general_cost: RegionalRelativeCostLens | CountryRelativeCostLens | None,
        inflation: RegionalRelativeCostLens | CountryRelativeCostLens | None,
        housing: RegionalRelativeCostLens | CountryRelativeCostLens | None,
    ) -> tuple[EconomicLensTone, str, str]:
        scope_label = {
            "COUNTRY": "country",
            "REGION": "region",
            "CONTINENT": "continent",
        }.get(scope_type, "scope")
        scope_possessive = {
            "COUNTRY": "The country's",
            "REGION": "The region's",
            "CONTINENT": "The continent's",
        }.get(scope_type, "This scope's")

        general_cost_severity = self._lens_tone_severity(general_cost.signalTone if general_cost else "CONTEXT")
        inflation_severity = self._lens_tone_severity(inflation.signalTone if inflation else "CONTEXT")
        housing_severity = self._lens_tone_severity(housing.signalTone if housing else "CONTEXT")

        if decision_code == "TRAVEL_AFFORDABILITY":
            severity = general_cost_severity
            if inflation_severity >= 2:
                severity = min(3, severity + 1)
            if housing_severity >= 3 and severity < 3:
                severity += 1

            tone = self._tone_from_severity(severity)
            if tone == "POSITIVE":
                headline = "Travel-cost context looks favorable"
                narrative = (
                    f"{scope_possessive} broad cost base looks meaningfully below the main OECD benchmark, and current inflation is not "
                    "materially intensifying the picture."
                )
            elif tone == "BALANCED":
                headline = "Travel-cost context looks manageable"
                narrative = (
                    f"{scope_possessive} broad cost base looks near the OECD benchmark rather than clearly cheap, so normal budget discipline "
                    "still matters for travel planning."
                )
            elif tone == "WATCH":
                headline = "Travel planning needs budget caution"
                narrative = (
                    f"{scope_possessive} broad cost base or current inflation is high enough to require tighter travel budgeting instead of a "
                    "casual affordability assumption."
                )
            else:
                headline = "Travel-cost context looks materially expensive"
                narrative = (
                    f"{scope_possessive} broad cost base is already elevated and current inflation leaves little room for comfort on day-to-day "
                    f"travel spend across the {scope_label}."
                )

            if housing_severity >= 2:
                narrative += (
                    " Housing-market heat also points to possible accommodation pressure, although this remains only a proxy until live lodging "
                    "sources are added."
                )
            elif housing is not None and housing.signalTone != "CONTEXT":
                narrative += " Housing-market heat does not currently add a strong additional warning signal."

            return tone, headline, narrative

        severity = max(general_cost_severity, inflation_severity)
        if housing_severity >= 2:
            severity = min(3, severity + 1)

        tone = self._tone_from_severity(severity)
        if tone == "POSITIVE":
            headline = "Affordability pressure looks contained"
            narrative = (
                f"{scope_possessive} broad cost base, current inflation, and housing signal do not currently point to intense affordability "
                f"pressure across the {scope_label}."
            )
        elif tone == "BALANCED":
            headline = "Affordability pressure looks present but manageable"
            narrative = (
                f"{scope_possessive} cost base and current inflation deserve attention, but the combined evidence still points to a manageable "
                "affordability backdrop rather than acute strain."
            )
        elif tone == "WATCH":
            headline = "Affordability pressure is building"
            narrative = (
                f"{scope_possessive} cost base, inflation, or housing heat is strong enough to suggest a meaningful affordability squeeze is "
                f"building across the {scope_label}."
            )
        else:
            headline = "Affordability pressure looks high"
            narrative = (
                f"{scope_possessive} cost base, inflation, and housing heat combine into a materially stressed affordability picture rather than "
                "a manageable one."
            )

        return tone, headline, narrative

    def _relative_cost_cautionary_notes(self, decision_code: str) -> list[str]:
        if decision_code == "TRAVEL_AFFORDABILITY":
            return [
                "This signal does not yet include live FX, airfare, taxes, or hotel quotes.",
                "Housing-market heat is used only as a proxy for accommodation pressure, not as a direct traveler lodging price.",
            ]
        return [
            "This signal does not yet combine wages, income distribution, or direct rent series.",
            "Housing-market heat is based on real house prices, which are not the same as rents or day-to-day housing bills.",
        ]

    def _lens_tone_severity(self, tone: EconomicLensTone) -> int:
        return TONE_SEVERITY.get(tone, 1)

    def _tone_from_severity(self, severity: int) -> EconomicLensTone:
        reverse_map = {
            0: "POSITIVE",
            1: "BALANCED",
            2: "WATCH",
            3: "STRESS",
        }
        return reverse_map.get(max(0, min(3, severity)), "BALANCED")

    def _worst_confidence_level(
        self,
        lenses: list[RegionalRelativeCostLens | CountryRelativeCostLens],
    ) -> ConfidenceLevel:
        return sorted(
            (lens.confidenceLevel for lens in lenses),
            key=lambda item: CONFIDENCE_PRIORITY.get(item, 99),
            reverse=True,
        )[0]

    def _worst_freshness_level(
        self,
        lenses: list[RegionalRelativeCostLens | CountryRelativeCostLens],
    ) -> FreshnessLevel:
        return sorted(
            (lens.freshnessLevel for lens in lenses),
            key=lambda item: FRESHNESS_PRIORITY.get(item, 99),
            reverse=True,
        )[0]

    def _build_snapshot_highlights(
        self,
        lenses: list[RegionalEconomicLens | CountryEconomicLens | RegionalRelativeCostLens | CountryRelativeCostLens],
    ) -> list[str]:
        tone_priority = {"STRESS": 0, "WATCH": 1, "POSITIVE": 2, "BALANCED": 3, "CONTEXT": 4}
        selected = sorted(lenses, key=lambda item: (tone_priority.get(item.signalTone, 99), item.lensCode))[:3]
        return [f"{item.lensDisplayName}: {item.headline}. {item.narrative}" for item in selected]

    def _select_primary_availability(self, items: list[SeriesAvailability]) -> SeriesAvailability | None:
        if not items:
            return None

        return sorted(
            items,
            key=lambda item: (
                item.availableObservationCount,
                item.observedObservationCount,
                item.latestFetchedAtUtc or datetime.min.replace(tzinfo=UTC),
                item.latestPeriodStart or datetime.min.date(),
            ),
            reverse=True,
        )[0]

    def _select_primary_regional_perspective(self, items: list[RegionalSourcePerspective]) -> RegionalSourcePerspective | None:
        if not items:
            return None
        return items[0]

    def _select_primary_source_perspective(self, items: list[SourcePerspective]) -> SourcePerspective | None:
        if not items:
            return None
        return items[0]

    def _select_series_preview(
        self,
        series: list[TimeseriesObservation],
        primary: SeriesAvailability | None,
        limit: int,
    ) -> list[TimeseriesObservation]:
        if primary is None:
            return []

        filtered = [
            item
            for item in series
            if item.sourceCode == primary.sourceCode
            and item.datasetCode == primary.datasetCode
            and item.periodGranularity == primary.periodGranularity
        ]
        return filtered[:limit]

    def _compute_trend(self, primary: SeriesAvailability | None, selected_series: list[TimeseriesObservation]) -> TrendSignal:
        if primary is None or len(selected_series) < 2:
            return TrendSignal(direction="INSUFFICIENT_DATA")

        latest = next((item for item in selected_series if item.numericValue is not None), None)
        previous_candidates = [item for item in selected_series[1:] if item.numericValue is not None]
        previous = previous_candidates[0] if previous_candidates else None

        if latest is None or previous is None:
            return TrendSignal(
                direction="INSUFFICIENT_DATA",
                sourceCode=primary.sourceCode,
                sourceDisplayName=primary.sourceDisplayName,
                datasetCode=primary.datasetCode,
                datasetDisplayName=primary.datasetDisplayName,
                periodGranularity=primary.periodGranularity,
                latestPeriodLabel=primary.latestPeriodLabel,
                observationsUsed=1 if latest else 0,
            )

        absolute_change = latest.numericValue - previous.numericValue
        relative_change = None
        if previous.numericValue != 0:
            relative_change = absolute_change / previous.numericValue

        direction = "FLAT"
        if relative_change is None:
            direction = "UP" if absolute_change > 0 else "DOWN" if absolute_change < 0 else "FLAT"
        elif relative_change > self._settings.flat_relative_change_threshold:
            direction = "UP"
        elif relative_change < -self._settings.flat_relative_change_threshold:
            direction = "DOWN"

        return TrendSignal(
            direction=direction,
            sourceCode=primary.sourceCode,
            sourceDisplayName=primary.sourceDisplayName,
            datasetCode=primary.datasetCode,
            datasetDisplayName=primary.datasetDisplayName,
            periodGranularity=primary.periodGranularity,
            latestPeriodLabel=latest.periodLabel,
            previousPeriodLabel=previous.periodLabel,
            latestNumericValue=latest.numericValue,
            previousNumericValue=previous.numericValue,
            absoluteChange=absolute_change,
            relativeChange=relative_change,
            observationsUsed=2,
        )

    def _build_freshness_summary(self, source_perspectives: list[SourcePerspective | RegionalSourcePerspective]) -> FreshnessSummary:
        comparable_source_count = sum(1 for item in source_perspectives if self._is_comparable_source_perspective(item))
        fetched_values = [item.fetchedAtUtc for item in source_perspectives if item.fetchedAtUtc is not None]
        published_values = [item.sourcePublishedAt for item in source_perspectives if item.sourcePublishedAt is not None]
        fetch_ages = [item.fetchAgeDays for item in source_perspectives if item.fetchAgeDays is not None]
        publication_ages = [item.publicationAgeDays for item in source_perspectives if item.publicationAgeDays is not None]
        max_reference_age = max(fetch_ages + publication_ages) if (fetch_ages or publication_ages) else None

        if max_reference_age is None:
            level: FreshnessLevel = "UNKNOWN"
        elif max_reference_age <= self._settings.freshness_fresh_days:
            level = "FRESH"
        elif max_reference_age <= self._settings.freshness_aging_days:
            level = "AGING"
        else:
            level = "STALE"

        return FreshnessSummary(
            level=level,
            comparableSourceCount=comparable_source_count,
            latestFetchedAtUtc=max(fetched_values) if fetched_values else None,
            oldestFetchedAtUtc=min(fetched_values) if fetched_values else None,
            latestSourcePublishedAt=max(published_values) if published_values else None,
            oldestSourcePublishedAt=min(published_values) if published_values else None,
            minFetchAgeDays=min(fetch_ages) if fetch_ages else None,
            maxFetchAgeDays=max(fetch_ages) if fetch_ages else None,
            minPublicationAgeDays=min(publication_ages) if publication_ages else None,
            maxPublicationAgeDays=max(publication_ages) if publication_ages else None,
        )
    def _build_country_confidence_summary(
        self,
        source_perspectives: list[SourcePerspective],
        freshness: FreshnessSummary,
        divergence: DivergenceSummary,
    ) -> ConfidenceSummary:
        source_types = {item.sourceType for item in source_perspectives if item.sourceType}
        observed_source_count = sum(1 for item in source_perspectives if item.valueStatus == "OBSERVED")
        estimated_source_count = sum(1 for item in source_perspectives if item.valueStatus == "ESTIMATED")
        reasons: list[str] = []
        score = 0

        if divergence.comparableValueCount == 0:
            return ConfidenceSummary(
                level="INSUFFICIENT_EVIDENCE",
                sourceCount=len(source_perspectives),
                comparableSourceCount=0,
                observedSourceCount=observed_source_count,
                estimatedSourceCount=estimated_source_count,
                sourceTypeDiversityCount=len(source_types),
                freshnessLevel=freshness.level,
                agreementLevel=divergence.agreementLevel,
                reasons=["No comparable source values are currently available for this indicator."],
            )

        if divergence.comparableValueCount >= 2:
            score += 2
            reasons.append("Multiple source values are available for cross-checking.")
        else:
            score += 1
            reasons.append("Only one comparable source value is currently available.")

        if observed_source_count >= 1:
            score += 1
            reasons.append("At least one source reports an observed value rather than an estimate.")
        elif estimated_source_count >= 1:
            reasons.append("The available source values are estimated rather than directly observed.")

        if freshness.level == "FRESH":
            score += 2
            reasons.append("The latest source snapshots are fresh.")
        elif freshness.level == "AGING":
            score += 1
            reasons.append("The latest source snapshots are usable but not fresh.")
        elif freshness.level == "STALE":
            reasons.append("The latest source snapshots are stale and should be interpreted carefully.")
        else:
            reasons.append("Freshness could not be established from the upstream metadata.")

        if divergence.agreementLevel == "CONSISTENT":
            score += 2
            reasons.append("The source values are tightly aligned.")
        elif divergence.agreementLevel == "MIXED":
            score += 1
            reasons.append("The source values are directionally aligned but not tightly clustered.")
        elif divergence.agreementLevel == "DIVERGENT":
            reasons.append("The source values materially diverge across datasets.")
        else:
            reasons.append("There is not enough source overlap to assess agreement.")

        if len(source_types) >= 2:
            score += 1
            reasons.append("The evidence spans multiple source families.")

        if score >= 6:
            level = "HIGH"
        elif score >= 3:
            level = "MEDIUM"
        else:
            level = "LOW"

        return ConfidenceSummary(
            level=level,
            sourceCount=len(source_perspectives),
            comparableSourceCount=divergence.comparableValueCount,
            observedSourceCount=observed_source_count,
            estimatedSourceCount=estimated_source_count,
            sourceTypeDiversityCount=len(source_types),
            freshnessLevel=freshness.level,
            agreementLevel=divergence.agreementLevel,
            reasons=reasons,
        )

    def _build_regional_confidence_summary(
        self,
        source_perspectives: list[RegionalSourcePerspective],
        freshness: FreshnessSummary,
        divergence: DivergenceSummary,
        primary_coverage_ratio: float | None,
    ) -> ConfidenceSummary:
        source_types = {item.sourceType for item in source_perspectives if item.sourceType}
        observed_source_count = sum(1 for item in source_perspectives if item.observedCountryCount > 0)
        estimated_source_count = sum(1 for item in source_perspectives if item.estimatedCountryCount > 0)
        reasons: list[str] = []
        score = 0

        if divergence.comparableValueCount == 0:
            return ConfidenceSummary(
                level="INSUFFICIENT_EVIDENCE",
                sourceCount=len(source_perspectives),
                comparableSourceCount=0,
                observedSourceCount=observed_source_count,
                estimatedSourceCount=estimated_source_count,
                sourceTypeDiversityCount=len(source_types),
                freshnessLevel=freshness.level,
                agreementLevel=divergence.agreementLevel,
                reasons=["No source perspective currently provides a comparable regional numeric snapshot."],
            )

        if divergence.comparableValueCount >= 2:
            score += 2
            reasons.append("Multiple source perspectives are available for regional comparison.")
        else:
            score += 1
            reasons.append("Only one source perspective is currently available for this regional view.")

        if primary_coverage_ratio is not None:
            if primary_coverage_ratio >= 0.8:
                score += 2
                reasons.append("The primary source covers most member countries in the region.")
            elif primary_coverage_ratio >= 0.5:
                score += 1
                reasons.append("The primary source covers a workable share of the member countries.")
            else:
                reasons.append("The primary source covers only a limited share of the member countries.")

        if freshness.level == "FRESH":
            score += 2
            reasons.append("The latest regional source snapshots are fresh.")
        elif freshness.level == "AGING":
            score += 1
            reasons.append("The latest regional source snapshots are usable but aging.")
        elif freshness.level == "STALE":
            reasons.append("The latest regional source snapshots are stale.")
        else:
            reasons.append("Freshness could not be established for the regional snapshots.")

        if divergence.agreementLevel == "CONSISTENT":
            score += 2
            reasons.append("Regional source medians are tightly aligned.")
        elif divergence.agreementLevel == "MIXED":
            score += 1
            reasons.append("Regional source medians are directionally aligned but spread out.")
        elif divergence.agreementLevel == "DIVERGENT":
            reasons.append("Regional source medians diverge materially across datasets.")
        else:
            reasons.append("There is not enough overlap to assess regional agreement.")

        if observed_source_count >= 1:
            score += 1
            reasons.append("At least one source perspective is grounded in observed values.")
        if len(source_types) >= 2:
            score += 1
            reasons.append("The regional picture spans multiple source families.")

        if score >= 6:
            level = "HIGH"
        elif score >= 3:
            level = "MEDIUM"
        else:
            level = "LOW"

        return ConfidenceSummary(
            level=level,
            sourceCount=len(source_perspectives),
            comparableSourceCount=divergence.comparableValueCount,
            observedSourceCount=observed_source_count,
            estimatedSourceCount=estimated_source_count,
            sourceTypeDiversityCount=len(source_types),
            freshnessLevel=freshness.level,
            agreementLevel=divergence.agreementLevel,
            reasons=reasons,
        )

    async def _safe_readiness(self, operation, fallback):
        try:
            return await operation()
        except Exception as exception:  # noqa: BLE001
            return fallback(exception)

    async def _safe_optional_catalog(self, operation):
        try:
            return await self._call_catalog(operation)
        except AnalyticsNotFoundError:
            return None

    async def _safe_latest_source_run(self, source_code: str, dataset_code: str) -> SourceRunSummary | None:
        source_runs = await self._call_timeseries(
            lambda: self._timeseries_client.list_source_runs(
                source_code=source_code,
                dataset_code=dataset_code,
                status="PERSISTED",
                limit=1,
            )
        )
        return source_runs[0] if source_runs else None

    async def _call_catalog(self, operation):
        try:
            return await operation()
        except httpx.HTTPStatusError as exception:
            if exception.response.status_code == 404:
                raise AnalyticsNotFoundError(exception.response.text) from exception
            raise AnalyticsDependencyError("catalog-service request failed.") from exception
        except httpx.HTTPError as exception:
            raise AnalyticsDependencyError("catalog-service is unavailable.") from exception

    async def _call_timeseries(self, operation):
        try:
            return await operation()
        except httpx.HTTPStatusError as exception:
            if exception.response.status_code == 404:
                raise AnalyticsNotFoundError(exception.response.text) from exception
            raise AnalyticsDependencyError("timeseries-service request failed.") from exception
        except httpx.HTTPError as exception:
            raise AnalyticsDependencyError("timeseries-service is unavailable.") from exception

    def _normalize_required_code(self, value: str) -> str:
        if value is None or not value.strip():
            raise ValueError("Required code parameter cannot be blank.")
        return value.strip().upper()

    def _normalize_optional_code(self, value: str | None) -> str | None:
        if value is None or not value.strip():
            return None
        return value.strip().upper()

    def _ratio(self, numerator: int, denominator: int) -> float | None:
        if denominator <= 0:
            return None
        return numerator / denominator

    def _age_days(self, value: datetime | None) -> int | None:
        if value is None:
            return None
        reference = value if value.tzinfo is not None else value.replace(tzinfo=UTC)
        delta_days = (datetime.now(UTC) - reference).days
        return max(delta_days, 0)

    def _freshness_level(self, fetch_age_days: int | None, publication_age_days: int | None) -> FreshnessLevel:
        available_ages = [age for age in (fetch_age_days, publication_age_days) if age is not None]
        if not available_ages:
            return "UNKNOWN"

        reference_age = max(available_ages)
        if reference_age <= self._settings.freshness_fresh_days:
            return "FRESH"
        if reference_age <= self._settings.freshness_aging_days:
            return "AGING"
        return "STALE"

    def _is_comparable_source_perspective(self, item: SourcePerspective | RegionalSourcePerspective) -> bool:
        numeric_value = getattr(item, "numericValue", None)
        if numeric_value is not None:
            return True
        comparable_country_count = getattr(item, "comparableCountryCount", None)
        if comparable_country_count is not None:
            return comparable_country_count > 0
        return False

    def _latest_datetime(self, values: list[datetime | None]) -> datetime | None:
        filtered = [value for value in values if value is not None]
        if not filtered:
            return None
        return max(filtered)

    def _latest_country_item(self, items: list[CountryLatestComparisonItem]) -> CountryLatestComparisonItem | None:
        if not items:
            return None
        return max(
            items,
            key=lambda item: (
                item.periodStart,
                item.fetchedAtUtc or datetime.min.replace(tzinfo=UTC),
            ),
        )
