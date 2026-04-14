from fastapi.testclient import TestClient

from analytics_service import api
from analytics_service.service import AnalyticsDependencyError, AnalyticsNotFoundError


class StubAnalyticsService:
    def __init__(self) -> None:
        self.country_overview_calls: list[dict] = []
        self.country_economic_snapshot_calls: list[dict] = []
        self.country_relative_cost_snapshot_calls: list[dict] = []
        self.country_indicator_calls: list[dict] = []
        self.country_source_audit_calls: list[dict] = []
        self.region_economic_snapshot_calls: list[dict] = []
        self.region_relative_cost_snapshot_calls: list[dict] = []
        self.region_source_audit_calls: list[dict] = []
        self.compare_calls: list[dict] = []
        self.closed = False

    async def aclose(self) -> None:
        self.closed = True

    async def get_readiness(self):
        return {
            "service": "analytics-service",
            "status": "ok",
            "dependencies": [
                {"dependency": "catalog-service", "reachable": True, "detail": {"status": "ok"}},
                {"dependency": "timeseries-service", "reachable": True, "detail": {"status": "ok"}},
            ],
        }

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
    ):
        self.country_overview_calls.append(
            {
                "country_iso3": country_iso3,
                "indicator_codes": indicator_codes,
                "source_code": source_code,
                "dataset_code": dataset_code,
                "period_granularity": period_granularity,
                "include_missing": include_missing,
                "max_indicators": max_indicators,
                "series_limit": series_limit,
            }
        )

        if country_iso3 == "BAD":
            raise ValueError("Country code is invalid.")
        if country_iso3 == "ZZZ":
            raise AnalyticsNotFoundError("Country was not found.")
        if country_iso3 == "ERR":
            raise AnalyticsDependencyError("timeseries-service is unavailable.")

        return {
            "country": {"iso3": country_iso3, "displayName": "France"},
            "indicatorCount": 1,
            "indicators": [
                {
                    "indicatorCode": "NY.GDP.MKTP.CD",
                    "indicatorDisplayName": "GDP (current US$)",
                    "unitLabel": "USD",
                    "topic": "MACROECONOMIC",
                    "trendDirection": "UP",
                    "latestComparableValue": 3150000000000.0,
                    "latestComparableSourceCount": 2,
                    "latestPeriodLabel": "2024",
                    "selectedSourceCode": "WORLD_BANK",
                    "selectedDatasetCode": "WDI",
                    "divergenceRangeAbsolute": 13000000000.0,
                }
            ],
        }

    async def get_country_indicator_overview(
        self,
        country_iso3: str,
        indicator_code: str,
        source_code: str | None,
        dataset_code: str | None,
        period_granularity: str | None,
        include_missing: bool,
        series_limit: int | None,
    ):
        self.country_indicator_calls.append(
            {
                "country_iso3": country_iso3,
                "indicator_code": indicator_code,
                "source_code": source_code,
                "dataset_code": dataset_code,
                "period_granularity": period_granularity,
                "include_missing": include_missing,
                "series_limit": series_limit,
            }
        )
        return {
            "country": {"iso3": country_iso3, "displayName": "France"},
            "indicator": {"code": indicator_code, "displayName": "GDP (current US$)"},
            "trend": {"direction": "UP"},
            "divergence": {"sourceCount": 2, "comparableValueCount": 2},
            "availability": [],
            "latestBySource": [],
            "selectedSeriesPreview": [],
        }

    async def get_country_economic_snapshot(
        self,
        country_iso3: str,
        source_code: str | None,
        dataset_code: str | None,
        period_granularity: str | None,
        include_missing: bool,
        series_limit: int | None,
    ):
        self.country_economic_snapshot_calls.append(
            {
                "country_iso3": country_iso3,
                "source_code": source_code,
                "dataset_code": dataset_code,
                "period_granularity": period_granularity,
                "include_missing": include_missing,
                "series_limit": series_limit,
            }
        )
        return {
            "country": {"iso3": country_iso3, "displayName": "France"},
            "generatedAtUtc": "2026-04-10T19:00:00Z",
            "lensCount": 1,
            "highlights": ["Growth momentum: Healthy expansion."],
            "lenses": [
                {
                    "lensCode": "GROWTH_MOMENTUM",
                    "lensDisplayName": "Growth momentum",
                    "signalTone": "BALANCED",
                    "headline": "Healthy expansion",
                    "narrative": "Growth is positive enough to support the economy, though it still needs to be checked against inflation and external balance.",
                    "whyItMatters": "Signals whether the economy is expanding, stalling, or contracting in real terms.",
                    "indicatorCode": "NY.GDP.MKTP.KD.ZG",
                    "indicatorDisplayName": "GDP growth (annual %)",
                    "unitLabel": "PERCENT",
                    "latestComparableValue": 2.3,
                    "latestComparableSourceCount": 2,
                    "latestPeriodLabel": "2024",
                    "trendDirection": "UP",
                    "selectedSourceCode": "WORLD_BANK",
                    "selectedDatasetCode": "WDI",
                    "agreementLevel": "CONSISTENT",
                    "confidenceLevel": "HIGH",
                    "freshnessLevel": "FRESH",
                    "sourceAudit": {
                        "scopeType": "COUNTRY",
                        "scopeCode": country_iso3,
                        "scopeDisplayName": "France",
                        "indicatorCode": "NY.GDP.MKTP.KD.ZG",
                        "indicatorDisplayName": "GDP growth (annual %)",
                        "confidenceLevel": "HIGH",
                        "freshnessLevel": "FRESH",
                        "agreementLevel": "CONSISTENT",
                        "primarySourceCode": "WORLD_BANK",
                        "primarySourceDisplayName": "World Bank",
                        "comparableSourceCount": 2,
                        "evidence": [],
                    },
                }
            ],
        }

    async def get_country_source_audit(
        self,
        country_iso3: str,
        indicator_code: str,
        source_code: str | None,
        dataset_code: str | None,
        period_granularity: str | None,
        include_missing: bool,
        series_limit: int | None,
    ):
        self.country_source_audit_calls.append(
            {
                "country_iso3": country_iso3,
                "indicator_code": indicator_code,
                "source_code": source_code,
                "dataset_code": dataset_code,
                "period_granularity": period_granularity,
                "include_missing": include_missing,
                "series_limit": series_limit,
            }
        )
        return {
            "scopeType": "COUNTRY",
            "scopeCode": country_iso3,
            "scopeDisplayName": "France",
            "indicatorCode": indicator_code,
            "indicatorDisplayName": "GDP (current US$)",
            "confidenceLevel": "HIGH",
            "freshnessLevel": "FRESH",
            "agreementLevel": "CONSISTENT",
            "primarySourceCode": "WORLD_BANK",
            "primarySourceDisplayName": "World Bank",
            "comparableSourceCount": 2,
            "evidence": [],
        }

    async def get_country_relative_cost_snapshot(
        self,
        country_iso3: str,
        source_code: str | None,
        dataset_code: str | None,
        period_granularity: str | None,
        include_missing: bool,
        series_limit: int | None,
    ):
        self.country_relative_cost_snapshot_calls.append(
            {
                "country_iso3": country_iso3,
                "source_code": source_code,
                "dataset_code": dataset_code,
                "period_granularity": period_granularity,
                "include_missing": include_missing,
                "series_limit": series_limit,
            }
        )
        return {
            "country": {"iso3": country_iso3, "displayName": "France"},
            "generatedAtUtc": "2026-04-10T19:00:00Z",
            "lensCount": 1,
            "highlights": ["General cost level: Above OECD cost benchmark."],
            "lenses": [
                {
                    "lensCode": "GENERAL_COST_LEVEL",
                    "lensDisplayName": "General cost level",
                    "signalTone": "WATCH",
                    "headline": "Above OECD cost benchmark",
                    "narrative": "The country’s overall price level is above the OECD benchmark.",
                    "whyItMatters": "Shows whether the country sits above or below the OECD benchmark for overall price levels.",
                    "indicatorCode": "WHV.PRICE.LEVEL.GDP.OECD100",
                    "indicatorDisplayName": "Comparative price level index, GDP level (OECD = 100)",
                    "unitLabel": "INDEX_OECD_100",
                    "latestComparableValue": 101.4,
                    "latestComparableSourceCount": 1,
                    "latestPeriodLabel": "2024",
                    "trendDirection": "UP",
                    "selectedSourceCode": "OECD",
                    "selectedDatasetCode": "OECD_PRICE_LEVELS",
                    "agreementLevel": "INSUFFICIENT_DATA",
                    "confidenceLevel": "MEDIUM",
                    "freshnessLevel": "FRESH",
                    "sourceAudit": {
                        "scopeType": "COUNTRY",
                        "scopeCode": country_iso3,
                        "scopeDisplayName": "France",
                        "indicatorCode": "WHV.PRICE.LEVEL.GDP.OECD100",
                        "indicatorDisplayName": "Comparative price level index, GDP level (OECD = 100)",
                        "confidenceLevel": "MEDIUM",
                        "freshnessLevel": "FRESH",
                        "agreementLevel": "INSUFFICIENT_DATA",
                        "primarySourceCode": "OECD",
                        "primarySourceDisplayName": "OECD Data",
                        "comparableSourceCount": 1,
                        "evidence": [],
                    },
                }
            ],
            "decisionSignalCount": 1,
            "decisionSignals": [
                {
                    "decisionCode": "TRAVEL_AFFORDABILITY",
                    "decisionDisplayName": "Travel affordability",
                    "signalTone": "WATCH",
                    "headline": "Travel planning needs budget caution",
                    "narrative": "The broad cost context requires tighter travel budgeting instead of a casual affordability assumption.",
                    "whyItMatters": "Turns broad price-level evidence into a practical travel-cost planning signal.",
                    "supportingLensCodes": ["GENERAL_COST_LEVEL"],
                    "confidenceLevel": "MEDIUM",
                    "freshnessLevel": "FRESH",
                    "cautionaryNotes": ["This signal does not yet include live FX or hotel quotes."],
                }
            ],
        }

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
    ):
        return {
            "region": {
                "code": region_code,
                "displayName": "Europe",
                "type": expected_region_type or "CONTINENT",
                "countryCount": 2,
                "aggregateCount": 0,
            },
            "indicatorCount": 1,
            "indicators": [
                {
                    "indicatorCode": "NY.GDP.MKTP.CD",
                    "indicatorDisplayName": "GDP (current US$)",
                    "unitLabel": "USD",
                    "topic": "MACROECONOMIC",
                    "comparableCountryCount": 2,
                    "memberCountryCount": 2,
                    "coverageRatio": 1.0,
                    "medianComparableValue": 3835000000000.0,
                    "latestPeriodLabel": "2024",
                    "selectedSourceCode": "WORLD_BANK",
                    "selectedDatasetCode": "WDI",
                    "agreementLevel": "CONSISTENT",
                    "confidenceLevel": "HIGH",
                    "freshnessLevel": "FRESH",
                }
            ],
        }

    async def get_region_economic_snapshot(
        self,
        region_code: str,
        source_code: str | None,
        dataset_code: str | None,
        period_granularity: str | None,
        include_missing: bool,
        expected_region_type: str | None = None,
    ):
        self.region_economic_snapshot_calls.append(
            {
                "region_code": region_code,
                "source_code": source_code,
                "dataset_code": dataset_code,
                "period_granularity": period_granularity,
                "include_missing": include_missing,
                "expected_region_type": expected_region_type,
            }
        )
        return {
            "region": {
                "code": region_code,
                "displayName": "Europe",
                "type": expected_region_type or "CONTINENT",
                "countryCount": 2,
                "aggregateCount": 0,
            },
            "snapshotType": expected_region_type or "REGION",
            "generatedAtUtc": "2026-04-10T19:00:00Z",
            "lensCount": 1,
            "highlights": ["Growth momentum: Healthy expansion."],
            "lenses": [
                {
                    "lensCode": "GROWTH_MOMENTUM",
                    "lensDisplayName": "Growth momentum",
                    "signalTone": "BALANCED",
                    "headline": "Healthy expansion",
                    "narrative": "Regional real GDP growth indicates a broadly resilient expansion rather than stagnation.",
                    "whyItMatters": "Signals whether the regional economy is expanding, stalling, or contracting in real terms.",
                    "indicatorCode": "NY.GDP.MKTP.KD.ZG",
                    "indicatorDisplayName": "GDP growth (annual %)",
                    "unitLabel": "PERCENT",
                    "medianComparableValue": 2.4,
                    "comparableCountryCount": 2,
                    "memberCountryCount": 2,
                    "coverageRatio": 1.0,
                    "latestPeriodLabel": "2024",
                    "selectedSourceCode": "WORLD_BANK",
                    "selectedDatasetCode": "WDI",
                    "agreementLevel": "CONSISTENT",
                    "confidenceLevel": "HIGH",
                    "freshnessLevel": "FRESH",
                }
            ],
        }

    async def get_region_indicator_overview(
        self,
        region_code: str,
        indicator_code: str,
        source_code: str | None,
        dataset_code: str | None,
        period_granularity: str | None,
        include_missing: bool,
        expected_region_type: str | None = None,
    ):
        return {
            "region": {
                "code": region_code,
                "displayName": "Europe",
                "type": expected_region_type or "CONTINENT",
                "countryCount": 2,
                "aggregateCount": 0,
            },
            "memberCountryCount": 2,
            "comparableCountryCount": 2,
            "indicator": {"code": indicator_code, "displayName": "GDP (current US$)"},
            "divergence": {"sourceCount": 2, "comparableValueCount": 2, "agreementLevel": "CONSISTENT"},
            "freshness": {"level": "FRESH", "comparableSourceCount": 2},
            "confidence": {
                "level": "HIGH",
                "sourceCount": 2,
                "comparableSourceCount": 2,
                "observedSourceCount": 1,
                "estimatedSourceCount": 1,
                "sourceTypeDiversityCount": 1,
                "freshnessLevel": "FRESH",
                "agreementLevel": "CONSISTENT",
                "reasons": [],
            },
            "sourcePerspectives": [],
        }

    async def get_region_source_audit(
        self,
        region_code: str,
        indicator_code: str,
        source_code: str | None,
        dataset_code: str | None,
        period_granularity: str | None,
        include_missing: bool,
        expected_region_type: str | None = None,
    ):
        self.region_source_audit_calls.append(
            {
                "region_code": region_code,
                "indicator_code": indicator_code,
                "source_code": source_code,
                "dataset_code": dataset_code,
                "period_granularity": period_granularity,
                "include_missing": include_missing,
                "expected_region_type": expected_region_type,
            }
        )
        return {
            "scopeType": expected_region_type or "REGION",
            "scopeCode": region_code,
            "scopeDisplayName": "Europe",
            "indicatorCode": indicator_code,
            "indicatorDisplayName": "GDP (current US$)",
            "confidenceLevel": "HIGH",
            "freshnessLevel": "FRESH",
            "agreementLevel": "CONSISTENT",
            "primarySourceCode": "WORLD_BANK",
            "primarySourceDisplayName": "World Bank",
            "comparableSourceCount": 2,
            "evidence": [],
        }

    async def get_region_relative_cost_snapshot(
        self,
        region_code: str,
        source_code: str | None,
        dataset_code: str | None,
        period_granularity: str | None,
        include_missing: bool,
        expected_region_type: str | None = None,
    ):
        self.region_relative_cost_snapshot_calls.append(
            {
                "region_code": region_code,
                "source_code": source_code,
                "dataset_code": dataset_code,
                "period_granularity": period_granularity,
                "include_missing": include_missing,
                "expected_region_type": expected_region_type,
            }
        )
        return {
            "region": {
                "code": region_code,
                "displayName": "Europe",
                "type": expected_region_type or "REGION",
                "countryCount": 2,
                "aggregateCount": 0,
            },
            "snapshotType": expected_region_type or "REGION",
            "generatedAtUtc": "2026-04-10T19:00:00Z",
            "lensCount": 1,
            "highlights": ["General cost level: Above OECD cost benchmark."],
            "lenses": [
                {
                    "lensCode": "GENERAL_COST_LEVEL",
                    "lensDisplayName": "General cost level",
                    "signalTone": "WATCH",
                    "headline": "Above OECD cost benchmark",
                    "narrative": "The region is above the OECD benchmark.",
                    "whyItMatters": "Shows whether the region sits above or below the OECD benchmark for overall price levels.",
                    "indicatorCode": "WHV.PRICE.LEVEL.GDP.OECD100",
                    "indicatorDisplayName": "Comparative price level index, GDP level (OECD = 100)",
                    "unitLabel": "INDEX_OECD_100",
                    "medianComparableValue": 100.3,
                    "comparableCountryCount": 2,
                    "memberCountryCount": 2,
                    "coverageRatio": 1.0,
                    "latestPeriodLabel": "2024",
                    "selectedSourceCode": "OECD",
                    "selectedDatasetCode": "OECD_PRICE_LEVELS",
                    "agreementLevel": "INSUFFICIENT_DATA",
                    "confidenceLevel": "MEDIUM",
                    "freshnessLevel": "FRESH",
                }
            ],
            "decisionSignalCount": 1,
            "decisionSignals": [
                {
                    "decisionCode": "HOUSEHOLD_AFFORDABILITY",
                    "decisionDisplayName": "Household affordability pressure",
                    "signalTone": "WATCH",
                    "headline": "Affordability pressure is building",
                    "narrative": "The regional cost context is strong enough to suggest a meaningful affordability squeeze is building.",
                    "whyItMatters": "Combines broad cost-base evidence into a more decision-oriented affordability signal.",
                    "supportingLensCodes": ["GENERAL_COST_LEVEL"],
                    "confidenceLevel": "MEDIUM",
                    "freshnessLevel": "FRESH",
                    "cautionaryNotes": ["This signal does not yet combine wages or direct rent series."],
                }
            ],
        }

    async def compare_countries_latest(
        self,
        country_iso3: list[str],
        indicator_code: str,
        source_code: str | None,
        dataset_code: str | None,
        period_granularity: str | None,
        include_missing: bool,
    ):
        self.compare_calls.append(
            {
                "country_iso3": country_iso3,
                "indicator_code": indicator_code,
                "source_code": source_code,
                "dataset_code": dataset_code,
                "period_granularity": period_granularity,
                "include_missing": include_missing,
            }
        )
        return {
            "indicator": {"code": indicator_code, "displayName": "GDP (current US$)"},
            "countryCount": len(country_iso3),
            "comparableValueCount": len(country_iso3),
            "minNumericValue": 1.0,
            "maxNumericValue": 2.0,
            "items": [],
        }


def test_readiness_endpoint_exposes_dependency_status(monkeypatch):
    service = StubAnalyticsService()
    monkeypatch.setattr(api, "build_analytics_service", lambda: service)

    with TestClient(api.app) as client:
        response = client.get("/api/analytics/readiness")

    assert response.status_code == 200
    body = response.json()
    assert body["service"] == "analytics-service"
    assert body["status"] == "ok"
    assert service.closed is True


def test_country_overview_endpoint_forwards_query_parameters(monkeypatch):
    service = StubAnalyticsService()
    monkeypatch.setattr(api, "build_analytics_service", lambda: service)

    with TestClient(api.app) as client:
        response = client.get(
            "/api/analytics/countries/FRA/overview",
            params=[
                ("indicatorCode", "NY.GDP.MKTP.CD"),
                ("indicatorCode", "FP.CPI.TOTL.ZG"),
                ("sourceCode", "WORLD_BANK"),
                ("datasetCode", "WDI"),
                ("periodGranularity", "ANNUAL"),
                ("includeMissing", "true"),
                ("maxIndicators", "4"),
                ("seriesLimit", "8"),
            ],
        )

    assert response.status_code == 200
    assert service.country_overview_calls == [
        {
            "country_iso3": "FRA",
            "indicator_codes": ["NY.GDP.MKTP.CD", "FP.CPI.TOTL.ZG"],
            "source_code": "WORLD_BANK",
            "dataset_code": "WDI",
            "period_granularity": "ANNUAL",
            "include_missing": True,
            "max_indicators": 4,
            "series_limit": 8,
        }
    ]


def test_country_overview_endpoint_maps_domain_errors(monkeypatch):
    service = StubAnalyticsService()
    monkeypatch.setattr(api, "build_analytics_service", lambda: service)

    with TestClient(api.app) as client:
        assert client.get("/api/analytics/countries/BAD/overview").status_code == 400
        assert client.get("/api/analytics/countries/ZZZ/overview").status_code == 404
        assert client.get("/api/analytics/countries/ERR/overview").status_code == 502


def test_country_indicator_overview_endpoint_uses_specific_indicator(monkeypatch):
    service = StubAnalyticsService()
    monkeypatch.setattr(api, "build_analytics_service", lambda: service)

    with TestClient(api.app) as client:
        response = client.get(
            "/api/analytics/countries/FRA/indicators/NY.GDP.MKTP.CD/overview",
            params={"sourceCode": "WORLD_BANK", "seriesLimit": 6},
        )

    assert response.status_code == 200
    assert service.country_indicator_calls == [
        {
            "country_iso3": "FRA",
            "indicator_code": "NY.GDP.MKTP.CD",
            "source_code": "WORLD_BANK",
            "dataset_code": None,
            "period_granularity": None,
            "include_missing": False,
            "series_limit": 6,
        }
    ]


def test_country_economic_snapshot_endpoint_forwards_parameters(monkeypatch):
    service = StubAnalyticsService()
    monkeypatch.setattr(api, "build_analytics_service", lambda: service)

    with TestClient(api.app) as client:
        response = client.get(
            "/api/analytics/countries/FRA/economic-snapshot",
            params={"periodGranularity": "ANNUAL", "seriesLimit": "6"},
        )

    assert response.status_code == 200
    assert response.json()["lensCount"] == 1
    assert service.country_economic_snapshot_calls == [
        {
            "country_iso3": "FRA",
            "source_code": None,
            "dataset_code": None,
            "period_granularity": "ANNUAL",
            "include_missing": False,
            "series_limit": 6,
        }
    ]


def test_country_relative_cost_snapshot_endpoint_forwards_parameters(monkeypatch):
    service = StubAnalyticsService()
    monkeypatch.setattr(api, "build_analytics_service", lambda: service)

    with TestClient(api.app) as client:
        response = client.get(
            "/api/analytics/countries/FRA/relative-cost-snapshot",
            params={"periodGranularity": "QUARTERLY", "seriesLimit": "6"},
        )

    assert response.status_code == 200
    assert response.json()["lensCount"] == 1
    assert response.json()["decisionSignalCount"] == 1
    assert service.country_relative_cost_snapshot_calls == [
        {
            "country_iso3": "FRA",
            "source_code": None,
            "dataset_code": None,
            "period_granularity": "QUARTERLY",
            "include_missing": False,
            "series_limit": 6,
        }
    ]


def test_region_overview_endpoint_supports_region_scope(monkeypatch):
    service = StubAnalyticsService()
    monkeypatch.setattr(api, "build_analytics_service", lambda: service)

    with TestClient(api.app) as client:
        response = client.get(
            "/api/analytics/regions/EUROPE/overview",
            params={"indicatorCode": "NY.GDP.MKTP.CD"},
        )

    assert response.status_code == 200
    assert response.json()["region"]["code"] == "EUROPE"


def test_continent_indicator_overview_endpoint_uses_continent_scope(monkeypatch):
    service = StubAnalyticsService()
    monkeypatch.setattr(api, "build_analytics_service", lambda: service)

    with TestClient(api.app) as client:
        response = client.get(
            "/api/analytics/continents/EUROPE/indicators/NY.GDP.MKTP.CD/overview",
        )

    assert response.status_code == 200
    assert response.json()["region"]["type"] == "CONTINENT"


def test_country_source_audit_endpoint_forwards_parameters(monkeypatch):
    service = StubAnalyticsService()
    monkeypatch.setattr(api, "build_analytics_service", lambda: service)

    with TestClient(api.app) as client:
        response = client.get(
            "/api/analytics/countries/FRA/indicators/NY.GDP.MKTP.CD/source-audit",
            params={"sourceCode": "WORLD_BANK", "seriesLimit": 6},
        )

    assert response.status_code == 200
    assert service.country_source_audit_calls == [
        {
            "country_iso3": "FRA",
            "indicator_code": "NY.GDP.MKTP.CD",
            "source_code": "WORLD_BANK",
            "dataset_code": None,
            "period_granularity": None,
            "include_missing": False,
            "series_limit": 6,
        }
    ]


def test_region_economic_snapshot_endpoint_supports_region_scope(monkeypatch):
    service = StubAnalyticsService()
    monkeypatch.setattr(api, "build_analytics_service", lambda: service)

    with TestClient(api.app) as client:
        response = client.get(
            "/api/analytics/regions/EUROPE/economic-snapshot",
            params={"periodGranularity": "ANNUAL"},
        )

    assert response.status_code == 200
    assert response.json()["lensCount"] == 1
    assert service.region_economic_snapshot_calls == [
        {
            "region_code": "EUROPE",
            "source_code": None,
            "dataset_code": None,
            "period_granularity": "ANNUAL",
            "include_missing": False,
            "expected_region_type": None,
        }
    ]


def test_region_relative_cost_snapshot_endpoint_supports_region_scope(monkeypatch):
    service = StubAnalyticsService()
    monkeypatch.setattr(api, "build_analytics_service", lambda: service)

    with TestClient(api.app) as client:
        response = client.get(
            "/api/analytics/regions/EUROPE/relative-cost-snapshot",
            params={"periodGranularity": "QUARTERLY"},
        )

    assert response.status_code == 200
    assert response.json()["lensCount"] == 1
    assert response.json()["decisionSignalCount"] == 1
    assert service.region_relative_cost_snapshot_calls == [
        {
            "region_code": "EUROPE",
            "source_code": None,
            "dataset_code": None,
            "period_granularity": "QUARTERLY",
            "include_missing": False,
            "expected_region_type": None,
        }
    ]


def test_continent_source_audit_endpoint_uses_continent_scope(monkeypatch):
    service = StubAnalyticsService()
    monkeypatch.setattr(api, "build_analytics_service", lambda: service)

    with TestClient(api.app) as client:
        response = client.get(
            "/api/analytics/continents/EUROPE/indicators/NY.GDP.MKTP.CD/source-audit",
        )

    assert response.status_code == 200
    assert response.json()["scopeType"] == "CONTINENT"
    assert service.region_source_audit_calls == [
        {
            "region_code": "EUROPE",
            "indicator_code": "NY.GDP.MKTP.CD",
            "source_code": None,
            "dataset_code": None,
            "period_granularity": None,
            "include_missing": False,
            "expected_region_type": "CONTINENT",
        }
    ]


def test_continent_relative_cost_snapshot_endpoint_uses_continent_scope(monkeypatch):
    service = StubAnalyticsService()
    monkeypatch.setattr(api, "build_analytics_service", lambda: service)

    with TestClient(api.app) as client:
        response = client.get(
            "/api/analytics/continents/EUROPE/relative-cost-snapshot",
        )

    assert response.status_code == 200
    assert response.json()["snapshotType"] == "CONTINENT"
    assert response.json()["decisionSignalCount"] == 1
    assert service.region_relative_cost_snapshot_calls == [
        {
            "region_code": "EUROPE",
            "source_code": None,
            "dataset_code": None,
            "period_granularity": None,
            "include_missing": False,
            "expected_region_type": "CONTINENT",
        }
    ]


def test_compare_countries_latest_endpoint_accepts_multiple_country_codes(monkeypatch):
    service = StubAnalyticsService()
    monkeypatch.setattr(api, "build_analytics_service", lambda: service)

    with TestClient(api.app) as client:
        response = client.get(
            "/api/analytics/compare/countries/latest",
            params=[
                ("countryIso3", "FRA"),
                ("countryIso3", "DEU"),
                ("indicatorCode", "NY.GDP.MKTP.CD"),
                ("sourceCode", "WORLD_BANK"),
            ],
        )

    assert response.status_code == 200
    assert service.compare_calls == [
        {
            "country_iso3": ["FRA", "DEU"],
            "indicator_code": "NY.GDP.MKTP.CD",
            "source_code": "WORLD_BANK",
            "dataset_code": None,
            "period_granularity": None,
            "include_missing": False,
        }
    ]
