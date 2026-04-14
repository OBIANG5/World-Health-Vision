from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import Response
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

from analytics_service.metrics import observe_request
from analytics_service.runtime import build_analytics_service
from analytics_service.service import AnalyticsDependencyError, AnalyticsNotFoundError, AnalyticsService


@asynccontextmanager
async def lifespan(app: FastAPI):
    service = build_analytics_service()
    app.state.analytics_service = service
    try:
        yield
    finally:
        await service.aclose()


app = FastAPI(
    title="WorldHealth Vision Analytics Service",
    lifespan=lifespan,
)


def get_service(request: Request) -> AnalyticsService:
    return request.app.state.analytics_service


@app.get("/health")
async def health():
    return {"status": "ok", "service": "analytics-service"}


@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.get("/api/analytics/readiness")
async def readiness(request: Request):
    with observe_request("readiness"):
        return await get_service(request).get_readiness()


@app.get("/api/analytics/countries/{country_iso3}/overview")
async def country_overview(
    country_iso3: str,
    request: Request,
    indicatorCode: list[str] | None = Query(default=None),
    sourceCode: str | None = Query(default=None),
    datasetCode: str | None = Query(default=None),
    periodGranularity: str | None = Query(default=None),
    includeMissing: bool = Query(default=False),
    maxIndicators: int | None = Query(default=None, ge=1, le=20),
    seriesLimit: int | None = Query(default=None, ge=2, le=24),
):
    with observe_request("country_overview"):
        try:
            return await get_service(request).get_country_overview(
                country_iso3=country_iso3,
                indicator_codes=indicatorCode,
                source_code=sourceCode,
                dataset_code=datasetCode,
                period_granularity=periodGranularity,
                include_missing=includeMissing,
                max_indicators=maxIndicators,
                series_limit=seriesLimit,
            )
        except ValueError as exception:
            raise HTTPException(status_code=400, detail=str(exception)) from exception
        except AnalyticsNotFoundError as exception:
            raise HTTPException(status_code=404, detail=str(exception)) from exception
        except AnalyticsDependencyError as exception:
            raise HTTPException(status_code=502, detail=str(exception)) from exception


@app.get("/api/analytics/countries/{country_iso3}/economic-snapshot")
async def country_economic_snapshot(
    country_iso3: str,
    request: Request,
    sourceCode: str | None = Query(default=None),
    datasetCode: str | None = Query(default=None),
    periodGranularity: str | None = Query(default=None),
    includeMissing: bool = Query(default=False),
    seriesLimit: int | None = Query(default=None, ge=2, le=24),
):
    with observe_request("country_economic_snapshot"):
        try:
            return await get_service(request).get_country_economic_snapshot(
                country_iso3=country_iso3,
                source_code=sourceCode,
                dataset_code=datasetCode,
                period_granularity=periodGranularity,
                include_missing=includeMissing,
                series_limit=seriesLimit,
            )
        except ValueError as exception:
            raise HTTPException(status_code=400, detail=str(exception)) from exception
        except AnalyticsNotFoundError as exception:
            raise HTTPException(status_code=404, detail=str(exception)) from exception
        except AnalyticsDependencyError as exception:
            raise HTTPException(status_code=502, detail=str(exception)) from exception


@app.get("/api/analytics/countries/{country_iso3}/relative-cost-snapshot")
async def country_relative_cost_snapshot(
    country_iso3: str,
    request: Request,
    sourceCode: str | None = Query(default=None),
    datasetCode: str | None = Query(default=None),
    periodGranularity: str | None = Query(default=None),
    includeMissing: bool = Query(default=False),
    seriesLimit: int | None = Query(default=None, ge=2, le=24),
):
    with observe_request("country_relative_cost_snapshot"):
        try:
            return await get_service(request).get_country_relative_cost_snapshot(
                country_iso3=country_iso3,
                source_code=sourceCode,
                dataset_code=datasetCode,
                period_granularity=periodGranularity,
                include_missing=includeMissing,
                series_limit=seriesLimit,
            )
        except ValueError as exception:
            raise HTTPException(status_code=400, detail=str(exception)) from exception
        except AnalyticsNotFoundError as exception:
            raise HTTPException(status_code=404, detail=str(exception)) from exception
        except AnalyticsDependencyError as exception:
            raise HTTPException(status_code=502, detail=str(exception)) from exception


@app.get("/api/analytics/countries/{country_iso3}/indicators/{indicator_code}/overview")
async def country_indicator_overview(
    country_iso3: str,
    indicator_code: str,
    request: Request,
    sourceCode: str | None = Query(default=None),
    datasetCode: str | None = Query(default=None),
    periodGranularity: str | None = Query(default=None),
    includeMissing: bool = Query(default=False),
    seriesLimit: int | None = Query(default=None, ge=2, le=24),
):
    with observe_request("country_indicator_overview"):
        try:
            return await get_service(request).get_country_indicator_overview(
                country_iso3=country_iso3,
                indicator_code=indicator_code,
                source_code=sourceCode,
                dataset_code=datasetCode,
                period_granularity=periodGranularity,
                include_missing=includeMissing,
                series_limit=seriesLimit,
            )
        except ValueError as exception:
            raise HTTPException(status_code=400, detail=str(exception)) from exception
        except AnalyticsNotFoundError as exception:
            raise HTTPException(status_code=404, detail=str(exception)) from exception
        except AnalyticsDependencyError as exception:
            raise HTTPException(status_code=502, detail=str(exception)) from exception


@app.get("/api/analytics/countries/{country_iso3}/indicators/{indicator_code}/source-audit")
async def country_source_audit(
    country_iso3: str,
    indicator_code: str,
    request: Request,
    sourceCode: str | None = Query(default=None),
    datasetCode: str | None = Query(default=None),
    periodGranularity: str | None = Query(default=None),
    includeMissing: bool = Query(default=False),
    seriesLimit: int | None = Query(default=None, ge=2, le=24),
):
    with observe_request("country_source_audit"):
        try:
            return await get_service(request).get_country_source_audit(
                country_iso3=country_iso3,
                indicator_code=indicator_code,
                source_code=sourceCode,
                dataset_code=datasetCode,
                period_granularity=periodGranularity,
                include_missing=includeMissing,
                series_limit=seriesLimit,
            )
        except ValueError as exception:
            raise HTTPException(status_code=400, detail=str(exception)) from exception
        except AnalyticsNotFoundError as exception:
            raise HTTPException(status_code=404, detail=str(exception)) from exception
        except AnalyticsDependencyError as exception:
            raise HTTPException(status_code=502, detail=str(exception)) from exception


@app.get("/api/analytics/regions/{region_code}/overview")
async def region_overview(
    region_code: str,
    request: Request,
    indicatorCode: list[str] | None = Query(default=None),
    sourceCode: str | None = Query(default=None),
    datasetCode: str | None = Query(default=None),
    periodGranularity: str | None = Query(default=None),
    includeMissing: bool = Query(default=False),
    maxIndicators: int | None = Query(default=None, ge=1, le=20),
):
    with observe_request("region_overview"):
        try:
            return await get_service(request).get_region_overview(
                region_code=region_code,
                indicator_codes=indicatorCode,
                source_code=sourceCode,
                dataset_code=datasetCode,
                period_granularity=periodGranularity,
                include_missing=includeMissing,
                max_indicators=maxIndicators,
            )
        except ValueError as exception:
            raise HTTPException(status_code=400, detail=str(exception)) from exception
        except AnalyticsNotFoundError as exception:
            raise HTTPException(status_code=404, detail=str(exception)) from exception
        except AnalyticsDependencyError as exception:
            raise HTTPException(status_code=502, detail=str(exception)) from exception


@app.get("/api/analytics/regions/{region_code}/economic-snapshot")
async def region_economic_snapshot(
    region_code: str,
    request: Request,
    sourceCode: str | None = Query(default=None),
    datasetCode: str | None = Query(default=None),
    periodGranularity: str | None = Query(default=None),
    includeMissing: bool = Query(default=False),
):
    with observe_request("region_economic_snapshot"):
        try:
            return await get_service(request).get_region_economic_snapshot(
                region_code=region_code,
                source_code=sourceCode,
                dataset_code=datasetCode,
                period_granularity=periodGranularity,
                include_missing=includeMissing,
            )
        except ValueError as exception:
            raise HTTPException(status_code=400, detail=str(exception)) from exception
        except AnalyticsNotFoundError as exception:
            raise HTTPException(status_code=404, detail=str(exception)) from exception
        except AnalyticsDependencyError as exception:
            raise HTTPException(status_code=502, detail=str(exception)) from exception


@app.get("/api/analytics/regions/{region_code}/relative-cost-snapshot")
async def region_relative_cost_snapshot(
    region_code: str,
    request: Request,
    sourceCode: str | None = Query(default=None),
    datasetCode: str | None = Query(default=None),
    periodGranularity: str | None = Query(default=None),
    includeMissing: bool = Query(default=False),
):
    with observe_request("region_relative_cost_snapshot"):
        try:
            return await get_service(request).get_region_relative_cost_snapshot(
                region_code=region_code,
                source_code=sourceCode,
                dataset_code=datasetCode,
                period_granularity=periodGranularity,
                include_missing=includeMissing,
            )
        except ValueError as exception:
            raise HTTPException(status_code=400, detail=str(exception)) from exception
        except AnalyticsNotFoundError as exception:
            raise HTTPException(status_code=404, detail=str(exception)) from exception
        except AnalyticsDependencyError as exception:
            raise HTTPException(status_code=502, detail=str(exception)) from exception


@app.get("/api/analytics/regions/{region_code}/indicators/{indicator_code}/overview")
async def region_indicator_overview(
    region_code: str,
    indicator_code: str,
    request: Request,
    sourceCode: str | None = Query(default=None),
    datasetCode: str | None = Query(default=None),
    periodGranularity: str | None = Query(default=None),
    includeMissing: bool = Query(default=False),
):
    with observe_request("region_indicator_overview"):
        try:
            return await get_service(request).get_region_indicator_overview(
                region_code=region_code,
                indicator_code=indicator_code,
                source_code=sourceCode,
                dataset_code=datasetCode,
                period_granularity=periodGranularity,
                include_missing=includeMissing,
            )
        except ValueError as exception:
            raise HTTPException(status_code=400, detail=str(exception)) from exception
        except AnalyticsNotFoundError as exception:
            raise HTTPException(status_code=404, detail=str(exception)) from exception
        except AnalyticsDependencyError as exception:
            raise HTTPException(status_code=502, detail=str(exception)) from exception


@app.get("/api/analytics/regions/{region_code}/indicators/{indicator_code}/source-audit")
async def region_source_audit(
    region_code: str,
    indicator_code: str,
    request: Request,
    sourceCode: str | None = Query(default=None),
    datasetCode: str | None = Query(default=None),
    periodGranularity: str | None = Query(default=None),
    includeMissing: bool = Query(default=False),
):
    with observe_request("region_source_audit"):
        try:
            return await get_service(request).get_region_source_audit(
                region_code=region_code,
                indicator_code=indicator_code,
                source_code=sourceCode,
                dataset_code=datasetCode,
                period_granularity=periodGranularity,
                include_missing=includeMissing,
            )
        except ValueError as exception:
            raise HTTPException(status_code=400, detail=str(exception)) from exception
        except AnalyticsNotFoundError as exception:
            raise HTTPException(status_code=404, detail=str(exception)) from exception
        except AnalyticsDependencyError as exception:
            raise HTTPException(status_code=502, detail=str(exception)) from exception


@app.get("/api/analytics/continents/{continent_code}/overview")
async def continent_overview(
    continent_code: str,
    request: Request,
    indicatorCode: list[str] | None = Query(default=None),
    sourceCode: str | None = Query(default=None),
    datasetCode: str | None = Query(default=None),
    periodGranularity: str | None = Query(default=None),
    includeMissing: bool = Query(default=False),
    maxIndicators: int | None = Query(default=None, ge=1, le=20),
):
    with observe_request("continent_overview"):
        try:
            return await get_service(request).get_region_overview(
                region_code=continent_code,
                indicator_codes=indicatorCode,
                source_code=sourceCode,
                dataset_code=datasetCode,
                period_granularity=periodGranularity,
                include_missing=includeMissing,
                max_indicators=maxIndicators,
                expected_region_type="CONTINENT",
            )
        except ValueError as exception:
            raise HTTPException(status_code=400, detail=str(exception)) from exception
        except AnalyticsNotFoundError as exception:
            raise HTTPException(status_code=404, detail=str(exception)) from exception
        except AnalyticsDependencyError as exception:
            raise HTTPException(status_code=502, detail=str(exception)) from exception


@app.get("/api/analytics/continents/{continent_code}/economic-snapshot")
async def continent_economic_snapshot(
    continent_code: str,
    request: Request,
    sourceCode: str | None = Query(default=None),
    datasetCode: str | None = Query(default=None),
    periodGranularity: str | None = Query(default=None),
    includeMissing: bool = Query(default=False),
):
    with observe_request("continent_economic_snapshot"):
        try:
            return await get_service(request).get_region_economic_snapshot(
                region_code=continent_code,
                source_code=sourceCode,
                dataset_code=datasetCode,
                period_granularity=periodGranularity,
                include_missing=includeMissing,
                expected_region_type="CONTINENT",
            )
        except ValueError as exception:
            raise HTTPException(status_code=400, detail=str(exception)) from exception
        except AnalyticsNotFoundError as exception:
            raise HTTPException(status_code=404, detail=str(exception)) from exception
        except AnalyticsDependencyError as exception:
            raise HTTPException(status_code=502, detail=str(exception)) from exception


@app.get("/api/analytics/continents/{continent_code}/relative-cost-snapshot")
async def continent_relative_cost_snapshot(
    continent_code: str,
    request: Request,
    sourceCode: str | None = Query(default=None),
    datasetCode: str | None = Query(default=None),
    periodGranularity: str | None = Query(default=None),
    includeMissing: bool = Query(default=False),
):
    with observe_request("continent_relative_cost_snapshot"):
        try:
            return await get_service(request).get_region_relative_cost_snapshot(
                region_code=continent_code,
                source_code=sourceCode,
                dataset_code=datasetCode,
                period_granularity=periodGranularity,
                include_missing=includeMissing,
                expected_region_type="CONTINENT",
            )
        except ValueError as exception:
            raise HTTPException(status_code=400, detail=str(exception)) from exception
        except AnalyticsNotFoundError as exception:
            raise HTTPException(status_code=404, detail=str(exception)) from exception
        except AnalyticsDependencyError as exception:
            raise HTTPException(status_code=502, detail=str(exception)) from exception


@app.get("/api/analytics/continents/{continent_code}/indicators/{indicator_code}/overview")
async def continent_indicator_overview(
    continent_code: str,
    indicator_code: str,
    request: Request,
    sourceCode: str | None = Query(default=None),
    datasetCode: str | None = Query(default=None),
    periodGranularity: str | None = Query(default=None),
    includeMissing: bool = Query(default=False),
):
    with observe_request("continent_indicator_overview"):
        try:
            return await get_service(request).get_region_indicator_overview(
                region_code=continent_code,
                indicator_code=indicator_code,
                source_code=sourceCode,
                dataset_code=datasetCode,
                period_granularity=periodGranularity,
                include_missing=includeMissing,
                expected_region_type="CONTINENT",
            )
        except ValueError as exception:
            raise HTTPException(status_code=400, detail=str(exception)) from exception
        except AnalyticsNotFoundError as exception:
            raise HTTPException(status_code=404, detail=str(exception)) from exception
        except AnalyticsDependencyError as exception:
            raise HTTPException(status_code=502, detail=str(exception)) from exception


@app.get("/api/analytics/continents/{continent_code}/indicators/{indicator_code}/source-audit")
async def continent_source_audit(
    continent_code: str,
    indicator_code: str,
    request: Request,
    sourceCode: str | None = Query(default=None),
    datasetCode: str | None = Query(default=None),
    periodGranularity: str | None = Query(default=None),
    includeMissing: bool = Query(default=False),
):
    with observe_request("continent_source_audit"):
        try:
            return await get_service(request).get_region_source_audit(
                region_code=continent_code,
                indicator_code=indicator_code,
                source_code=sourceCode,
                dataset_code=datasetCode,
                period_granularity=periodGranularity,
                include_missing=includeMissing,
                expected_region_type="CONTINENT",
            )
        except ValueError as exception:
            raise HTTPException(status_code=400, detail=str(exception)) from exception
        except AnalyticsNotFoundError as exception:
            raise HTTPException(status_code=404, detail=str(exception)) from exception
        except AnalyticsDependencyError as exception:
            raise HTTPException(status_code=502, detail=str(exception)) from exception


@app.get("/api/analytics/compare/countries/latest")
async def compare_countries_latest(
    request: Request,
    countryIso3: list[str] = Query(..., min_length=1),
    indicatorCode: str = Query(...),
    sourceCode: str | None = Query(default=None),
    datasetCode: str | None = Query(default=None),
    periodGranularity: str | None = Query(default=None),
    includeMissing: bool = Query(default=False),
):
    with observe_request("compare_countries_latest"):
        try:
            return await get_service(request).compare_countries_latest(
                country_iso3=countryIso3,
                indicator_code=indicatorCode,
                source_code=sourceCode,
                dataset_code=datasetCode,
                period_granularity=periodGranularity,
                include_missing=includeMissing,
            )
        except ValueError as exception:
            raise HTTPException(status_code=400, detail=str(exception)) from exception
        except AnalyticsNotFoundError as exception:
            raise HTTPException(status_code=404, detail=str(exception)) from exception
        except AnalyticsDependencyError as exception:
            raise HTTPException(status_code=502, detail=str(exception)) from exception
