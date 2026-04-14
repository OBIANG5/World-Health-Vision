import asyncio
import json

import httpx

from analytics_service.clients.catalog_client import CatalogClient
from analytics_service.clients.timeseries_client import TimeseriesClient
from analytics_service.config import Settings
from analytics_service.service import AnalyticsService


INDICATOR_FIXTURES = {
    "NY.GDP.MKTP.CD": {
        "displayName": "GDP (current US$)",
        "topic": "MACROECONOMIC",
        "unitLabel": "USD",
        "description": "Gross domestic product at current prices.",
        "preferredFrequency": "ANNUAL",
        "sourceDatasetCode": "WDI",
        "core": True,
        "methodologyNotes": "Official GDP indicator.",
    },
    "NY.GDP.PCAP.CD": {
        "displayName": "GDP per capita (current US$)",
        "topic": "MACROECONOMIC",
        "unitLabel": "USD_PER_PERSON",
        "description": "Gross domestic product divided by population.",
        "preferredFrequency": "ANNUAL",
        "sourceDatasetCode": "WDI",
        "core": True,
        "methodologyNotes": "Cross-country scale adjusted output signal.",
    },
    "NY.GDP.MKTP.KD.ZG": {
        "displayName": "GDP growth (annual %)",
        "topic": "MACROECONOMIC",
        "unitLabel": "PERCENT",
        "description": "Annual percentage growth rate of GDP.",
        "preferredFrequency": "ANNUAL",
        "sourceDatasetCode": "WDI",
        "core": True,
        "methodologyNotes": "Read with inflation and labor stress.",
    },
    "FP.CPI.TOTL.ZG": {
        "displayName": "Inflation, consumer prices (annual %)",
        "topic": "PRICES",
        "unitLabel": "PERCENT",
        "description": "Annual percentage change in consumer prices.",
        "preferredFrequency": "ANNUAL",
        "sourceDatasetCode": "WDI",
        "core": True,
        "methodologyNotes": "Official CPI should later be compared with field-price proxies.",
    },
    "WHV.PRICE.LEVEL.GDP.OECD100": {
        "displayName": "Comparative price level index, GDP level (OECD = 100)",
        "topic": "PRICES",
        "unitLabel": "INDEX_OECD_100",
        "description": "Relative general price level at GDP level, indexed to the OECD average = 100.",
        "preferredFrequency": "ANNUAL",
        "sourceDatasetCode": "OECD_PRICE_LEVELS",
        "core": False,
        "methodologyNotes": "Useful for cross-country cost-level comparisons, but not a household basket or housing affordability metric.",
    },
    "WHV.HOUSING.PRICE.REAL.INDEX2015": {
        "displayName": "Real house price index (2015 = 100)",
        "topic": "HOUSING",
        "unitLabel": "INDEX_2015_100",
        "description": "Quarterly real house-price index with 2015 set to 100.",
        "preferredFrequency": "QUARTERLY",
        "sourceDatasetCode": "OECD_HOUSING_PRICES",
        "core": False,
        "methodologyNotes": "Useful to detect structural housing heat and market cooling, but it does not directly measure rents or household affordability.",
    },
    "SL.UEM.TOTL.ZS": {
        "displayName": "Unemployment (% of labor force)",
        "topic": "LABOR",
        "unitLabel": "PERCENT",
        "description": "Share of the labor force without work.",
        "preferredFrequency": "ANNUAL",
        "sourceDatasetCode": "WDI",
        "core": True,
        "methodologyNotes": "Definitions vary across labor systems.",
    },
    "SL.TLF.CACT.ZS": {
        "displayName": "Labor force participation rate, total (% of total population ages 15+)",
        "topic": "LABOR",
        "unitLabel": "PERCENT",
        "description": "Share of the population ages 15+ that is economically active.",
        "preferredFrequency": "ANNUAL",
        "sourceDatasetCode": "ILOSTAT_BULK",
        "core": True,
        "methodologyNotes": "Important complement to unemployment because low unemployment can coincide with weak participation.",
    },
    "BN.CAB.XOKA.GD.ZS": {
        "displayName": "Current account balance (% of GDP)",
        "topic": "EXTERNAL_BALANCE",
        "unitLabel": "PERCENT_OF_GDP",
        "description": "Current account balance as share of GDP.",
        "preferredFrequency": "ANNUAL",
        "sourceDatasetCode": "WDI",
        "core": True,
        "methodologyNotes": "Important for external fragility analysis.",
    },
}


REGIONAL_COMPARE_FIXTURES = {
    "NY.GDP.MKTP.CD": {
        "WORLD_BANK": {"FRA": 3150000000000.0, "DEU": 4520000000000.0},
        "IMF": {"FRA": 3137000000000.0, "DEU": 4495000000000.0},
    },
    "NY.GDP.PCAP.CD": {
        "WORLD_BANK": {"FRA": 48000.0, "DEU": 53000.0},
        "IMF": {"FRA": 47000.0, "DEU": 52000.0},
    },
    "NY.GDP.MKTP.KD.ZG": {
        "WORLD_BANK": {"FRA": 2.3, "DEU": 2.5},
        "IMF": {"FRA": 2.2, "DEU": 2.4},
    },
    "FP.CPI.TOTL.ZG": {
        "WORLD_BANK": {"FRA": 2.9, "DEU": 2.6},
        "IMF": {"FRA": 3.1, "DEU": 2.8},
    },
    "WHV.PRICE.LEVEL.GDP.OECD100": {
        "OECD": {"FRA": 101.4, "DEU": 99.2},
    },
    "WHV.HOUSING.PRICE.REAL.INDEX2015": {
        "OECD": {"FRA": 121.5, "DEU": 118.4},
    },
    "SL.UEM.TOTL.ZS": {
        "WORLD_BANK": {"FRA": 7.2, "DEU": 3.8},
        "IMF": {"FRA": 7.0, "DEU": 4.0},
        "ILOSTAT": {"FRA": 7.1, "DEU": 3.9},
    },
    "SL.TLF.CACT.ZS": {
        "ILOSTAT": {"FRA": 64.2, "DEU": 62.5},
    },
    "BN.CAB.XOKA.GD.ZS": {
        "WORLD_BANK": {"FRA": -0.7, "DEU": 6.4},
        "IMF": {"FRA": -0.5, "DEU": 6.2},
    },
}


COUNTRY_TIME_SERIES_FIXTURES = {
    "NY.GDP.MKTP.CD": {
        "WORLD_BANK": {"latest": 3150000000000.0, "previous": 3050000000000.0},
        "IMF": {"latest": 3137000000000.0, "previous": None},
    },
    "NY.GDP.PCAP.CD": {
        "WORLD_BANK": {"latest": 48000.0, "previous": 46800.0},
        "IMF": {"latest": 47000.0, "previous": None},
    },
    "NY.GDP.MKTP.KD.ZG": {
        "WORLD_BANK": {"latest": 2.3, "previous": 1.1},
        "IMF": {"latest": 2.2, "previous": None},
    },
    "FP.CPI.TOTL.ZG": {
        "WORLD_BANK": {"latest": 2.9, "previous": 4.8},
        "IMF": {"latest": 3.1, "previous": None},
    },
    "WHV.PRICE.LEVEL.GDP.OECD100": {
        "OECD": {"latest": 101.4, "previous": 99.8},
    },
    "WHV.HOUSING.PRICE.REAL.INDEX2015": {
        "OECD": {"latest": 121.5, "previous": 118.0},
    },
    "SL.UEM.TOTL.ZS": {
        "WORLD_BANK": {"latest": 7.2, "previous": 7.4},
        "IMF": {"latest": 7.0, "previous": None},
        "ILOSTAT": {"latest": 7.1, "previous": 7.5},
    },
    "SL.TLF.CACT.ZS": {
        "ILOSTAT": {"latest": 64.2, "previous": 63.8},
    },
    "BN.CAB.XOKA.GD.ZS": {
        "WORLD_BANK": {"latest": -0.7, "previous": -1.3},
        "IMF": {"latest": -0.5, "previous": None},
    },
}


def test_country_indicator_overview_computes_trend_and_divergence():
    async def run():
        service = build_service()
        overview = await service.get_country_indicator_overview(
            country_iso3="fra",
            indicator_code="ny.gdp.mktp.cd",
            source_code=None,
            dataset_code=None,
            period_granularity="annual",
            include_missing=False,
            series_limit=4,
        )
        await service.aclose()

        assert overview.country.displayName == "France"
        assert overview.indicator.displayName == "GDP (current US$)"
        assert overview.trend.direction == "UP"
        assert overview.trend.sourceCode == "WORLD_BANK"
        assert overview.divergence.comparableValueCount == 2
        assert overview.divergence.rangeAbsolute == 13000000000.0
        assert overview.divergence.agreementLevel == "CONSISTENT"
        assert overview.confidence.level in {"HIGH", "MEDIUM"}
        assert overview.freshness.level in {"FRESH", "AGING"}
        assert overview.sourceAudit.scopeType == "COUNTRY"
        assert overview.sourceAudit.comparableSourceCount == 2
        assert any(item.code == "MULTI_SOURCE_COMPARISON" for item in overview.sourceAudit.evidence)
        assert len(overview.sourcePerspectives) == 2
        assert len(overview.selectedSeriesPreview) == 2

    asyncio.run(run())


def test_country_indicator_overview_supports_ilostat_participation_series():
    async def run():
        service = build_service()
        overview = await service.get_country_indicator_overview(
            country_iso3="FRA",
            indicator_code="SL.TLF.CACT.ZS",
            source_code=None,
            dataset_code=None,
            period_granularity="ANNUAL",
            include_missing=False,
            series_limit=4,
        )
        await service.aclose()

        assert overview.indicator.code == "SL.TLF.CACT.ZS"
        assert overview.trend.sourceCode == "ILOSTAT"
        assert overview.divergence.comparableValueCount == 1
        assert overview.sourceAudit.scopeType == "COUNTRY"
        assert overview.sourcePerspectives[0].sourceCode == "ILOSTAT"
        assert overview.sourcePerspectives[0].datasetCode == "ILOSTAT_BULK"

    asyncio.run(run())


def test_country_indicator_overview_supports_oecd_price_level_series():
    async def run():
        service = build_service()
        overview = await service.get_country_indicator_overview(
            country_iso3="FRA",
            indicator_code="WHV.PRICE.LEVEL.GDP.OECD100",
            source_code=None,
            dataset_code=None,
            period_granularity="ANNUAL",
            include_missing=False,
            series_limit=4,
        )
        await service.aclose()

        assert overview.indicator.code == "WHV.PRICE.LEVEL.GDP.OECD100"
        assert overview.trend.sourceCode == "OECD"
        assert overview.divergence.comparableValueCount == 1
        assert overview.sourceAudit.scopeType == "COUNTRY"
        assert overview.sourcePerspectives[0].sourceCode == "OECD"
        assert overview.sourcePerspectives[0].datasetCode == "OECD_PRICE_LEVELS"

    asyncio.run(run())


def test_country_indicator_overview_supports_oecd_housing_series():
    async def run():
        service = build_service()
        overview = await service.get_country_indicator_overview(
            country_iso3="FRA",
            indicator_code="WHV.HOUSING.PRICE.REAL.INDEX2015",
            source_code=None,
            dataset_code=None,
            period_granularity=None,
            include_missing=False,
            series_limit=4,
        )
        await service.aclose()

        assert overview.indicator.code == "WHV.HOUSING.PRICE.REAL.INDEX2015"
        assert overview.trend.sourceCode == "OECD"
        assert overview.trend.periodGranularity == "QUARTERLY"
        assert overview.latestBySource[0].periodLabel == "2024-Q4"
        assert overview.sourcePerspectives[0].datasetCode == "OECD_HOUSING_PRICES"

    asyncio.run(run())


def test_country_overview_builds_product_summary_cards():
    async def run():
        service = build_service()
        overview = await service.get_country_overview(
            country_iso3="FRA",
            indicator_codes=["NY.GDP.MKTP.CD"],
            source_code=None,
            dataset_code=None,
            period_granularity="ANNUAL",
            include_missing=False,
            max_indicators=3,
            series_limit=4,
        )
        await service.aclose()

        assert overview.country.iso3 == "FRA"
        assert overview.indicatorCount == 1
        assert overview.indicators[0].trendDirection == "UP"
        assert overview.indicators[0].latestComparableSourceCount == 2
        assert overview.indicators[0].confidenceLevel in {"HIGH", "MEDIUM"}

    asyncio.run(run())


def test_country_economic_snapshot_returns_curated_business_lenses():
    async def run():
        service = build_service()
        snapshot = await service.get_country_economic_snapshot(
            country_iso3="FRA",
            source_code=None,
            dataset_code=None,
            period_granularity="ANNUAL",
            include_missing=False,
            series_limit=6,
        )
        await service.aclose()

        assert snapshot.country.iso3 == "FRA"
        assert snapshot.lensCount == 6
        assert {item.lensCode for item in snapshot.lenses} == {
            "ECONOMIC_SCALE",
            "PROSPERITY_LEVEL",
            "GROWTH_MOMENTUM",
            "PRICE_PRESSURE",
            "LABOR_STRESS",
            "EXTERNAL_BALANCE",
        }
        growth_lens = next(item for item in snapshot.lenses if item.lensCode == "GROWTH_MOMENTUM")
        labor_lens = next(item for item in snapshot.lenses if item.lensCode == "LABOR_STRESS")
        assert growth_lens.signalTone in {"BALANCED", "POSITIVE"}
        assert growth_lens.trendDirection == "UP"
        assert growth_lens.sourceAudit.scopeType == "COUNTRY"
        assert growth_lens.sourceAudit.comparableSourceCount == 2
        assert labor_lens.latestComparableSourceCount == 3
        assert labor_lens.sourceAudit.comparableSourceCount == 3
        assert len(snapshot.highlights) >= 1

    asyncio.run(run())


def test_country_relative_cost_snapshot_returns_cost_product_lenses():
    async def run():
        service = build_service()
        snapshot = await service.get_country_relative_cost_snapshot(
            country_iso3="FRA",
            source_code=None,
            dataset_code=None,
            period_granularity=None,
            include_missing=False,
            series_limit=6,
        )
        await service.aclose()

        assert snapshot.country.iso3 == "FRA"
        assert snapshot.lensCount == 3
        assert {item.lensCode for item in snapshot.lenses} == {
            "GENERAL_COST_LEVEL",
            "HOUSING_MARKET_HEAT",
            "CONSUMER_PRICE_PRESSURE",
        }
        assert snapshot.decisionSignalCount == 2
        assert {item.decisionCode for item in snapshot.decisionSignals} == {
            "TRAVEL_AFFORDABILITY",
            "HOUSEHOLD_AFFORDABILITY",
        }
        housing_lens = next(item for item in snapshot.lenses if item.lensCode == "HOUSING_MARKET_HEAT")
        travel_signal = next(item for item in snapshot.decisionSignals if item.decisionCode == "TRAVEL_AFFORDABILITY")
        assert housing_lens.selectedDatasetCode == "OECD_HOUSING_PRICES"
        assert housing_lens.trendDirection == "UP"
        assert housing_lens.latestComparableValue == 121.5
        assert travel_signal.supportingLensCodes == [
            "GENERAL_COST_LEVEL",
            "CONSUMER_PRICE_PRESSURE",
            "HOUSING_MARKET_HEAT",
        ]
        assert travel_signal.freshnessLevel in {"FRESH", "AGING"}
        assert len(travel_signal.cautionaryNotes) == 2

    asyncio.run(run())


def test_region_relative_cost_snapshot_returns_cost_product_lenses():
    async def run():
        service = build_service()
        snapshot = await service.get_region_relative_cost_snapshot(
            region_code="EUROPE",
            source_code=None,
            dataset_code=None,
            period_granularity=None,
            include_missing=False,
        )
        await service.aclose()

        assert snapshot.region.code == "EUROPE"
        assert snapshot.lensCount == 3
        assert {item.lensCode for item in snapshot.lenses} == {
            "GENERAL_COST_LEVEL",
            "HOUSING_MARKET_HEAT",
            "CONSUMER_PRICE_PRESSURE",
        }
        assert snapshot.decisionSignalCount == 2
        general_cost = next(item for item in snapshot.lenses if item.lensCode == "GENERAL_COST_LEVEL")
        household_signal = next(
            item for item in snapshot.decisionSignals if item.decisionCode == "HOUSEHOLD_AFFORDABILITY"
        )
        assert general_cost.selectedDatasetCode == "OECD_PRICE_LEVELS"
        assert household_signal.signalTone in {"BALANCED", "WATCH", "STRESS"}
        assert household_signal.confidenceLevel in {"HIGH", "MEDIUM", "LOW", "INSUFFICIENT_EVIDENCE"}

    asyncio.run(run())


def test_region_indicator_overview_builds_regional_source_perspectives():
    async def run():
        service = build_service()
        overview = await service.get_region_indicator_overview(
            region_code="EUROPE",
            indicator_code="NY.GDP.MKTP.CD",
            source_code=None,
            dataset_code=None,
            period_granularity="ANNUAL",
            include_missing=False,
        )
        await service.aclose()

        assert overview.region.code == "EUROPE"
        assert overview.memberCountryCount == 2
        assert overview.comparableCountryCount == 2
        assert overview.divergence.comparableValueCount == 2
        assert overview.sourceAudit.scopeType == "CONTINENT"
        assert any(item.code == "HIGH_MEMBER_COVERAGE" for item in overview.sourceAudit.evidence)
        assert overview.sourcePerspectives[0].coverageRatio == 1.0
        assert overview.confidence.level in {"HIGH", "MEDIUM"}

    asyncio.run(run())


def test_region_economic_snapshot_returns_curated_business_lenses():
    async def run():
        service = build_service()
        snapshot = await service.get_region_economic_snapshot(
            region_code="EUROPE",
            source_code=None,
            dataset_code=None,
            period_granularity="ANNUAL",
            include_missing=False,
            expected_region_type="CONTINENT",
        )
        await service.aclose()

        assert snapshot.snapshotType == "CONTINENT"
        assert snapshot.lensCount == 6
        assert {item.lensCode for item in snapshot.lenses} == {
            "ECONOMIC_SCALE",
            "PROSPERITY_LEVEL",
            "GROWTH_MOMENTUM",
            "PRICE_PRESSURE",
            "LABOR_STRESS",
            "EXTERNAL_BALANCE",
        }
        growth_lens = next(item for item in snapshot.lenses if item.lensCode == "GROWTH_MOMENTUM")
        assert growth_lens.signalTone in {"BALANCED", "POSITIVE"}
        assert growth_lens.confidenceLevel in {"HIGH", "MEDIUM"}
        assert len(snapshot.highlights) >= 1

    asyncio.run(run())


def test_compare_countries_latest_summarizes_numeric_range():
    async def run():
        service = build_service()
        comparison = await service.compare_countries_latest(
            country_iso3=["FRA", "DEU"],
            indicator_code="NY.GDP.MKTP.CD",
            source_code="WORLD_BANK",
            dataset_code="WDI",
            period_granularity="ANNUAL",
            include_missing=False,
        )
        await service.aclose()

        assert comparison.countryCount == 2
        assert comparison.comparableValueCount == 2
        assert comparison.minNumericValue == 3150000000000.0
        assert comparison.maxNumericValue == 4520000000000.0

    asyncio.run(run())


def build_service() -> AnalyticsService:
    settings = Settings(
        catalog_base_url="http://catalog.test",
        timeseries_base_url="http://timeseries.test",
        request_timeout_seconds=5,
        default_country_overview_indicator_limit=5,
        default_country_overview_series_limit=6,
    )

    catalog_client = CatalogClient(
        base_url=settings.catalog_base_url,
        timeout_seconds=settings.request_timeout_seconds,
        transport=httpx.MockTransport(catalog_handler),
    )
    timeseries_client = TimeseriesClient(
        base_url=settings.timeseries_base_url,
        timeout_seconds=settings.request_timeout_seconds,
        transport=httpx.MockTransport(timeseries_handler),
    )

    return AnalyticsService(
        settings=settings,
        catalog_client=catalog_client,
        timeseries_client=timeseries_client,
    )


def catalog_handler(request: httpx.Request) -> httpx.Response:
    if request.url.path == "/api/catalog/regions/EUROPE":
        return json_response(
            {
                "code": "EUROPE",
                "displayName": "Europe",
                "type": "CONTINENT",
                "countryCount": 2,
                "aggregateCount": 0,
            }
        )

    if request.url.path == "/api/catalog/countries":
        if request.url.params.get("regionCode") == "EUROPE":
            return json_response(
                {
                    "count": 2,
                    "items": [
                        {
                            "iso3": "FRA",
                            "iso2": "FR",
                            "displayName": "France",
                            "regionCode": "EUROPE",
                            "regionName": "Europe",
                            "subregionCode": "WESTERN_EUROPE",
                            "subregionName": "Western Europe",
                            "aggregate": False,
                            "active": True,
                        },
                        {
                            "iso3": "DEU",
                            "iso2": "DE",
                            "displayName": "Germany",
                            "regionCode": "EUROPE",
                            "regionName": "Europe",
                            "subregionCode": "WESTERN_EUROPE",
                            "subregionName": "Western Europe",
                            "aggregate": False,
                            "active": True,
                        },
                    ],
                }
            )

    if request.url.path == "/api/catalog/countries/FRA":
        return json_response(
            {
                "iso3": "FRA",
                "iso2": "FR",
                "displayName": "France",
                "regionCode": "EUROPE",
                "regionName": "Europe",
                "subregionCode": "WESTERN_EUROPE",
                "subregionName": "Western Europe",
                "worldBankIncomeGroup": "High income",
                "lendingType": "Not classified",
                "capitalCity": "Paris",
                "latitude": 48.8566,
                "longitude": 2.3522,
                "sovereignState": "France",
                "aggregate": False,
                "active": True,
                "dataQualityTier": 1,
            }
        )

    if request.url.path.startswith("/api/catalog/indicators/"):
        indicator_code = request.url.path.rsplit("/", 1)[-1]
        fixture = INDICATOR_FIXTURES.get(indicator_code)
        if fixture is None:
            raise AssertionError(f"Unexpected indicator code: {indicator_code}")
        return json_response({"code": indicator_code, **fixture})

    if request.url.path == "/api/catalog/sources/WORLD_BANK":
        return json_response(
            {
                "code": "WORLD_BANK",
                "displayName": "World Bank",
                "type": "OFFICIAL",
                "organizationName": "World Bank",
                "homepageUrl": "https://www.worldbank.org/",
                "documentationUrl": "https://example.org/worldbank",
                "accessModel": "OPEN",
                "licenseSummary": "Open access.",
                "geographicScope": "GLOBAL",
                "temporalGranularity": "COUNTRY",
                "updateCadence": "PERIODIC",
                "biasNotes": "Official publication lag can exist.",
                "qualityNotes": "Strong country comparability.",
                "enabled": True,
            }
        )

    if request.url.path == "/api/catalog/sources/IMF":
        return json_response(
            {
                "code": "IMF",
                "displayName": "International Monetary Fund",
                "type": "OFFICIAL",
                "organizationName": "International Monetary Fund",
                "homepageUrl": "https://www.imf.org/",
                "documentationUrl": "https://example.org/imf",
                "accessModel": "OPEN",
                "licenseSummary": "Open access.",
                "geographicScope": "GLOBAL",
                "temporalGranularity": "COUNTRY",
                "updateCadence": "PERIODIC",
                "biasNotes": "Revision windows can be significant.",
                "qualityNotes": "Strong macro coverage.",
                "enabled": True,
            }
        )

    if request.url.path == "/api/catalog/sources/ILOSTAT":
        return json_response(
            {
                "code": "ILOSTAT",
                "displayName": "ILOSTAT",
                "type": "OFFICIAL",
                "organizationName": "International Labour Organization",
                "homepageUrl": "https://ilostat.ilo.org/",
                "documentationUrl": "https://ilostat.ilo.org/data/bulk/",
                "accessModel": "OPEN",
                "licenseSummary": "Open access.",
                "geographicScope": "GLOBAL",
                "temporalGranularity": "COUNTRY",
                "updateCadence": "PERIODIC",
                "biasNotes": "Labour-force methodologies can still differ across national statistical systems.",
                "qualityNotes": "Direct labour-market source that complements macro publishers.",
                "enabled": True,
            }
        )

    if request.url.path == "/api/catalog/sources/OECD":
        return json_response(
            {
                "code": "OECD",
                "displayName": "OECD Data",
                "type": "OFFICIAL",
                "organizationName": "OECD",
                "homepageUrl": "https://www.oecd.org/",
                "documentationUrl": "https://www.oecd.org/en/data/insights/data-explainers/2024/09/api.html",
                "accessModel": "OPEN",
                "licenseSummary": "Open access.",
                "geographicScope": "MULTI_REGION",
                "temporalGranularity": "COUNTRY",
                "updateCadence": "PERIODIC",
                "biasNotes": "Coverage is stronger for OECD members and partner economies than for the full world.",
                "qualityNotes": "Strong thematic source for price-level and structural comparisons.",
                "enabled": True,
            }
        )

    if request.url.path == "/api/catalog/sources/WORLD_BANK/datasets/WDI":
        return json_response(
            {
                "sourceCode": "WORLD_BANK",
                "code": "WDI",
                "displayName": "World Development Indicators",
                "description": "Core World Bank macro indicators.",
                "category": "MACROECONOMIC",
                "defaultGranularity": "COUNTRY",
                "defaultFrequency": "ANNUAL",
                "documentationUrl": "https://example.org/wdi",
                "licenseSummary": "Open access.",
                "enabled": True,
            }
        )

    if request.url.path == "/api/catalog/sources/IMF/datasets/IMF_PUBLIC_DATA":
        return json_response(
            {
                "sourceCode": "IMF",
                "code": "IMF_PUBLIC_DATA",
                "displayName": "IMF Public Data",
                "description": "IMF macro datasets.",
                "category": "MACROECONOMIC",
                "defaultGranularity": "COUNTRY",
                "defaultFrequency": "ANNUAL",
                "documentationUrl": "https://example.org/imf-public-data",
                "licenseSummary": "Open access.",
                "enabled": True,
            }
        )

    if request.url.path == "/api/catalog/sources/ILOSTAT/datasets/ILOSTAT_BULK":
        return json_response(
            {
                "sourceCode": "ILOSTAT",
                "code": "ILOSTAT_BULK",
                "displayName": "ILOSTAT Bulk Data",
                "description": "ILOSTAT labor-market bulk downloads.",
                "category": "LABOR",
                "defaultGranularity": "COUNTRY",
                "defaultFrequency": "ANNUAL",
                "documentationUrl": "https://ilostat.ilo.org/data/bulk/",
                "licenseSummary": "Open access.",
                "enabled": True,
            }
        )

    if request.url.path == "/api/catalog/sources/OECD/datasets/OECD_PRICE_LEVELS":
        return json_response(
            {
                "sourceCode": "OECD",
                "code": "OECD_PRICE_LEVELS",
                "displayName": "OECD Price Level Indices",
                "description": "Comparative country price-level indices at GDP level with OECD = 100.",
                "category": "PRICES",
                "defaultGranularity": "COUNTRY",
                "defaultFrequency": "ANNUAL",
                "documentationUrl": "https://www.oecd.org/en/data/indicators/price-level-indices.html",
                "licenseSummary": "Open access.",
                "enabled": True,
            }
        )

    if request.url.path == "/api/catalog/sources/OECD/datasets/OECD_HOUSING_PRICES":
        return json_response(
            {
                "sourceCode": "OECD",
                "code": "OECD_HOUSING_PRICES",
                "displayName": "OECD Housing Prices",
                "description": "Quarterly real house-price indices with base year 2015 = 100.",
                "category": "HOUSING",
                "defaultGranularity": "COUNTRY",
                "defaultFrequency": "QUARTERLY",
                "documentationUrl": "https://www.oecd.org/en/data/indicators/housing-prices.html",
                "licenseSummary": "Open access.",
                "enabled": True,
            }
        )

    raise AssertionError(f"Unexpected catalog request: {request.method} {request.url}")


def _selected_country_sources(indicator_code: str, source_code: str | None, dataset_code: str | None) -> list[str]:
    if source_code is not None:
        return [source_code]
    if dataset_code == "WDI":
        return ["WORLD_BANK"]
    if dataset_code == "IMF_PUBLIC_DATA":
        return ["IMF"]
    if dataset_code == "ILOSTAT_BULK":
        return ["ILOSTAT"]
    if dataset_code == "OECD_PRICE_LEVELS":
        return ["OECD"]
    if dataset_code == "OECD_HOUSING_PRICES":
        return ["OECD"]
    return list(COUNTRY_TIME_SERIES_FIXTURES[indicator_code].keys())


def _country_source_metadata(indicator_code: str, source_code: str) -> dict[str, str]:
    if source_code == "WORLD_BANK":
        return {
            "sourceDisplayName": "World Bank",
            "datasetCode": "WDI",
            "datasetDisplayName": "World Development Indicators",
            "sourceRunKey": "wb_2024",
            "valueStatus": "OBSERVED",
            "sourcePublishedAt": "2026-03-01T00:00:00Z",
            "fetchedAtUtc": "2026-04-10T00:00:00Z",
        }
    if source_code == "IMF":
        return {
            "sourceDisplayName": "International Monetary Fund",
            "datasetCode": "IMF_PUBLIC_DATA",
            "datasetDisplayName": "IMF Public Data",
            "sourceRunKey": "imf_2024",
            "valueStatus": "ESTIMATED",
            "sourcePublishedAt": "2026-03-15T00:00:00Z",
            "fetchedAtUtc": "2026-04-10T00:05:00Z",
        }
    if source_code == "ILOSTAT":
        return {
            "sourceDisplayName": "ILOSTAT",
            "datasetCode": "ILOSTAT_BULK",
            "datasetDisplayName": "ILOSTAT Bulk Data",
            "sourceRunKey": "ilo_2024",
            "valueStatus": "OBSERVED",
            "sourcePublishedAt": None,
            "fetchedAtUtc": "2026-04-10T00:10:00Z",
        }
    if source_code == "OECD":
        if indicator_code == "WHV.HOUSING.PRICE.REAL.INDEX2015":
            return {
                "sourceDisplayName": "OECD Data",
                "datasetCode": "OECD_HOUSING_PRICES",
                "datasetDisplayName": "OECD Housing Prices",
                "sourceRunKey": "oecd_housing_2024q4",
                "valueStatus": "OBSERVED",
                "sourcePublishedAt": None,
                "fetchedAtUtc": "2026-04-10T00:20:00Z",
            }
        return {
            "sourceDisplayName": "OECD Data",
            "datasetCode": "OECD_PRICE_LEVELS",
            "datasetDisplayName": "OECD Price Level Indices",
            "sourceRunKey": "oecd_price_levels_2024",
            "valueStatus": "OBSERVED",
            "sourcePublishedAt": None,
            "fetchedAtUtc": "2026-04-10T00:15:00Z",
        }
    raise AssertionError(f"Unexpected country source: {source_code}")


def timeseries_handler(request: httpx.Request) -> httpx.Response:
    query = dict(request.url.params.multi_items())

    if request.url.path == "/api/timeseries/series/latest":
        assert query["countryIso3"] == "FRA"
        indicator_code = query["indicatorCode"]
        fixture = COUNTRY_TIME_SERIES_FIXTURES[indicator_code]
        items = []
        for source_code in _selected_country_sources(indicator_code, query.get("sourceCode"), query.get("datasetCode")):
            metadata = _country_source_metadata(indicator_code, source_code)
            items.append(
                {
                    "sourceCode": source_code,
                    "sourceDisplayName": metadata["sourceDisplayName"],
                    "datasetCode": metadata["datasetCode"],
                    "datasetDisplayName": metadata["datasetDisplayName"],
                    "sourceRunKey": metadata["sourceRunKey"],
                    "countryIso3": "FRA",
                    "countryDisplayName": "France",
                    "indicatorCode": indicator_code,
                    "indicatorDisplayName": INDICATOR_FIXTURES[indicator_code]["displayName"],
                    "periodGranularity": "QUARTERLY" if indicator_code == "WHV.HOUSING.PRICE.REAL.INDEX2015" else "ANNUAL",
                    "periodStart": "2024-10-01" if indicator_code == "WHV.HOUSING.PRICE.REAL.INDEX2015" else "2024-01-01",
                    "periodEnd": "2024-12-31",
                    "periodLabel": "2024-Q4" if indicator_code == "WHV.HOUSING.PRICE.REAL.INDEX2015" else "2024",
                    "numericValue": fixture[source_code]["latest"],
                    "textValue": None,
                    "valueStatus": metadata["valueStatus"],
                    "sourcePublishedAt": metadata["sourcePublishedAt"],
                    "fetchedAtUtc": metadata["fetchedAtUtc"],
                }
            )

        return json_response({"count": len(items), "items": items})

    if request.url.path == "/api/timeseries/series/availability":
        assert query["countryIso3"] == "FRA"
        indicator_code = query["indicatorCode"]
        fixture = COUNTRY_TIME_SERIES_FIXTURES[indicator_code]
        items = []
        for source_code in _selected_country_sources(indicator_code, query.get("sourceCode"), query.get("datasetCode")):
            metadata = _country_source_metadata(indicator_code, source_code)
            previous_value = fixture[source_code]["previous"]
            items.append(
                {
                    "sourceCode": source_code,
                    "sourceDisplayName": metadata["sourceDisplayName"],
                    "datasetCode": metadata["datasetCode"],
                    "datasetDisplayName": metadata["datasetDisplayName"],
                    "countryIso3": "FRA",
                    "countryDisplayName": "France",
                    "indicatorCode": indicator_code,
                    "indicatorDisplayName": INDICATOR_FIXTURES[indicator_code]["displayName"],
                    "periodGranularity": "QUARTERLY" if indicator_code == "WHV.HOUSING.PRICE.REAL.INDEX2015" else "ANNUAL",
                    "availableObservationCount": 2 if previous_value is not None else 1,
                    "observedObservationCount": 2 if previous_value is not None else (1 if source_code != "IMF" else 0),
                    "estimatedObservationCount": 1 if source_code == "IMF" else 0,
                    "suppressedObservationCount": 0,
                    "missingObservationCount": 0,
                    "firstPeriodStart": "2024-07-01" if indicator_code == "WHV.HOUSING.PRICE.REAL.INDEX2015" and previous_value is not None else ("2023-01-01" if previous_value is not None else "2024-01-01"),
                    "latestPeriodStart": "2024-10-01" if indicator_code == "WHV.HOUSING.PRICE.REAL.INDEX2015" else "2024-01-01",
                    "latestPeriodEnd": "2024-12-31",
                    "latestPeriodLabel": "2024-Q4" if indicator_code == "WHV.HOUSING.PRICE.REAL.INDEX2015" else "2024",
                    "latestNumericValue": fixture[source_code]["latest"],
                    "latestTextValue": None,
                    "latestValueStatus": metadata["valueStatus"],
                    "latestFetchedAtUtc": metadata["fetchedAtUtc"],
                }
            )

        return json_response({"count": len(items), "items": items})

    if request.url.path == "/api/timeseries/series":
        assert query["countryIso3"] == "FRA"
        indicator_code = query["indicatorCode"]
        fixture = COUNTRY_TIME_SERIES_FIXTURES[indicator_code]
        items = []
        for source_code in _selected_country_sources(indicator_code, query.get("sourceCode"), query.get("datasetCode")):
            metadata = _country_source_metadata(indicator_code, source_code)
            items.append(
                {
                    "sourceCode": source_code,
                    "sourceDisplayName": metadata["sourceDisplayName"],
                    "datasetCode": metadata["datasetCode"],
                    "datasetDisplayName": metadata["datasetDisplayName"],
                    "sourceRunKey": metadata["sourceRunKey"],
                    "countryIso3": "FRA",
                    "countryDisplayName": "France",
                    "indicatorCode": indicator_code,
                    "indicatorDisplayName": INDICATOR_FIXTURES[indicator_code]["displayName"],
                    "periodGranularity": "QUARTERLY" if indicator_code == "WHV.HOUSING.PRICE.REAL.INDEX2015" else "ANNUAL",
                    "periodStart": "2024-10-01" if indicator_code == "WHV.HOUSING.PRICE.REAL.INDEX2015" else "2024-01-01",
                    "periodEnd": "2024-12-31",
                    "periodLabel": "2024-Q4" if indicator_code == "WHV.HOUSING.PRICE.REAL.INDEX2015" else "2024",
                    "numericValue": fixture[source_code]["latest"],
                    "textValue": None,
                    "valueStatus": metadata["valueStatus"],
                    "sourcePublishedAt": metadata["sourcePublishedAt"],
                    "fetchedAtUtc": metadata["fetchedAtUtc"],
                }
            )
            previous_value = fixture[source_code]["previous"]
            if previous_value is not None:
                items.append(
                    {
                        "sourceCode": source_code,
                        "sourceDisplayName": metadata["sourceDisplayName"],
                        "datasetCode": metadata["datasetCode"],
                        "datasetDisplayName": metadata["datasetDisplayName"],
                        "sourceRunKey": "wb_2023" if source_code == "WORLD_BANK" else metadata["sourceRunKey"],
                        "countryIso3": "FRA",
                        "countryDisplayName": "France",
                        "indicatorCode": indicator_code,
                        "indicatorDisplayName": INDICATOR_FIXTURES[indicator_code]["displayName"],
                        "periodGranularity": "QUARTERLY" if indicator_code == "WHV.HOUSING.PRICE.REAL.INDEX2015" else "ANNUAL",
                        "periodStart": "2024-07-01" if indicator_code == "WHV.HOUSING.PRICE.REAL.INDEX2015" else "2023-01-01",
                        "periodEnd": "2024-09-30" if indicator_code == "WHV.HOUSING.PRICE.REAL.INDEX2015" else "2023-12-31",
                        "periodLabel": "2024-Q3" if indicator_code == "WHV.HOUSING.PRICE.REAL.INDEX2015" else "2023",
                        "numericValue": previous_value,
                        "textValue": None,
                        "valueStatus": "OBSERVED",
                        "sourcePublishedAt": "2025-03-01T00:00:00Z" if source_code == "WORLD_BANK" else None,
                        "fetchedAtUtc": "2025-04-10T00:00:00Z" if source_code == "WORLD_BANK" else metadata["fetchedAtUtc"],
                    }
                )

        return json_response({"count": len(items), "items": items})

    if request.url.path == "/api/timeseries/compare/countries/latest":
        params = request.url.params.get_list("countryIso3")
        assert params == ["FRA", "DEU"]
        source_code = request.url.params.get("sourceCode")
        indicator_code = request.url.params.get("indicatorCode")
        compare_fixture = REGIONAL_COMPARE_FIXTURES.get(indicator_code)
        if compare_fixture is None:
            raise AssertionError(f"Unexpected regional compare indicator: {indicator_code}")

        if source_code is not None:
            selected_sources = [source_code]
        else:
            selected_sources = list(compare_fixture.keys())
        items = []
        for selected_source in selected_sources:
            source_values = compare_fixture[selected_source]
            if selected_source == "WORLD_BANK":
                source_display_name = "World Bank"
                dataset_code = "WDI"
                dataset_display_name = "World Development Indicators"
                value_status = "OBSERVED"
                source_published_at = "2026-03-01T00:00:00Z"
                fetched_at_utc = "2026-04-10T00:00:00Z"
            elif selected_source == "IMF":
                source_display_name = "International Monetary Fund"
                dataset_code = "IMF_PUBLIC_DATA"
                dataset_display_name = "IMF Public Data"
                value_status = "ESTIMATED"
                source_published_at = "2026-03-15T00:00:00Z"
                fetched_at_utc = "2026-04-10T00:05:00Z"
            elif selected_source == "OECD":
                source_display_name = "OECD Data"
                if indicator_code == "WHV.HOUSING.PRICE.REAL.INDEX2015":
                    dataset_code = "OECD_HOUSING_PRICES"
                    dataset_display_name = "OECD Housing Prices"
                    fetched_at_utc = "2026-04-10T00:20:00Z"
                else:
                    dataset_code = "OECD_PRICE_LEVELS"
                    dataset_display_name = "OECD Price Level Indices"
                    fetched_at_utc = "2026-04-10T00:15:00Z"
                value_status = "OBSERVED"
                source_published_at = None
            else:
                source_display_name = "ILOSTAT"
                dataset_code = "ILOSTAT_BULK"
                dataset_display_name = "ILOSTAT Bulk Data"
                value_status = "OBSERVED"
                source_published_at = None
                fetched_at_utc = "2026-04-10T00:10:00Z"

            for country_iso3, country_display_name in [("FRA", "France"), ("DEU", "Germany")]:
                period_granularity = "QUARTERLY" if indicator_code == "WHV.HOUSING.PRICE.REAL.INDEX2015" else "ANNUAL"
                period_start = "2024-10-01" if indicator_code == "WHV.HOUSING.PRICE.REAL.INDEX2015" else "2024-01-01"
                period_end = "2024-12-31"
                period_label = "2024-Q4" if indicator_code == "WHV.HOUSING.PRICE.REAL.INDEX2015" else "2024"
                items.append(
                    {
                        "countryIso3": country_iso3,
                        "countryDisplayName": country_display_name,
                        "indicatorCode": indicator_code,
                        "indicatorDisplayName": INDICATOR_FIXTURES[indicator_code]["displayName"],
                        "sourceCode": selected_source,
                        "sourceDisplayName": source_display_name,
                        "datasetCode": dataset_code,
                        "datasetDisplayName": dataset_display_name,
                        "periodGranularity": period_granularity,
                        "periodStart": period_start,
                        "periodEnd": period_end,
                        "periodLabel": period_label,
                        "numericValue": source_values[country_iso3],
                        "textValue": None,
                        "valueStatus": value_status,
                        "sourcePublishedAt": source_published_at,
                        "fetchedAtUtc": fetched_at_utc,
                    }
                )

        return json_response({"count": len(items), "items": items})

    if request.url.path == "/api/timeseries/source-runs":
        if query["sourceCode"] == "WORLD_BANK":
            return json_response(
                {
                    "count": 1,
                    "items": [
                        {
                            "id": "50000000-0000-0000-0000-000000000001",
                            "sourceCode": "WORLD_BANK",
                            "sourceDisplayName": "World Bank",
                            "datasetCode": "WDI",
                            "datasetDisplayName": "World Development Indicators",
                            "runKey": "wb_2024",
                            "fetchedAtUtc": "2026-04-10T00:00:00Z",
                            "persistedAtUtc": "2026-04-10T00:01:00Z",
                            "recordCount": 3,
                            "status": "PERSISTED",
                        }
                    ],
                }
            )
        if query["sourceCode"] == "IMF":
            return json_response(
                {
                    "count": 1,
                    "items": [
                        {
                            "id": "50000000-0000-0000-0000-000000000002",
                            "sourceCode": "IMF",
                            "sourceDisplayName": "International Monetary Fund",
                            "datasetCode": "IMF_PUBLIC_DATA",
                            "datasetDisplayName": "IMF Public Data",
                            "runKey": "imf_2024",
                            "fetchedAtUtc": "2026-04-10T00:05:00Z",
                            "persistedAtUtc": "2026-04-10T00:06:00Z",
                            "recordCount": 1,
                            "status": "PERSISTED",
                        }
                    ],
                }
            )
        if query["sourceCode"] == "ILOSTAT":
            return json_response(
                {
                    "count": 1,
                    "items": [
                        {
                            "id": "50000000-0000-0000-0000-000000000003",
                            "sourceCode": "ILOSTAT",
                            "sourceDisplayName": "ILOSTAT",
                            "datasetCode": "ILOSTAT_BULK",
                            "datasetDisplayName": "ILOSTAT Bulk Data",
                            "runKey": "ilo_2024",
                            "fetchedAtUtc": "2026-04-10T00:10:00Z",
                            "persistedAtUtc": "2026-04-10T00:11:00Z",
                            "recordCount": 2,
                            "status": "PERSISTED",
                        }
                    ],
                }
            )
        if query["sourceCode"] == "OECD":
            dataset_code = query.get("datasetCode")
            if dataset_code == "OECD_HOUSING_PRICES":
                return json_response(
                    {
                        "count": 1,
                        "items": [
                            {
                                "id": "50000000-0000-0000-0000-000000000005",
                                "sourceCode": "OECD",
                                "sourceDisplayName": "OECD Data",
                                "datasetCode": "OECD_HOUSING_PRICES",
                                "datasetDisplayName": "OECD Housing Prices",
                                "runKey": "oecd_housing_2024q4",
                                "fetchedAtUtc": "2026-04-10T00:20:00Z",
                                "persistedAtUtc": "2026-04-10T00:21:00Z",
                                "recordCount": 2,
                                "status": "PERSISTED",
                            }
                        ],
                    }
                )
            return json_response(
                {
                    "count": 1,
                    "items": [
                        {
                            "id": "50000000-0000-0000-0000-000000000004",
                            "sourceCode": "OECD",
                            "sourceDisplayName": "OECD Data",
                            "datasetCode": "OECD_PRICE_LEVELS",
                            "datasetDisplayName": "OECD Price Level Indices",
                            "runKey": "oecd_price_levels_2024",
                            "fetchedAtUtc": "2026-04-10T00:15:00Z",
                            "persistedAtUtc": "2026-04-10T00:16:00Z",
                            "recordCount": 1,
                            "status": "PERSISTED",
                        }
                    ],
                }
            )

    raise AssertionError(f"Unexpected timeseries request: {request.method} {request.url}")


def json_response(payload: dict) -> httpx.Response:
    return httpx.Response(
        status_code=200,
        headers={"Content-Type": "application/json"},
        content=json.dumps(payload).encode("utf-8"),
    )
