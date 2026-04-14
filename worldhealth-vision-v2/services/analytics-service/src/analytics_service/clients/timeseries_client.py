import httpx

from analytics_service.models import (
    CountryLatestComparisonItem,
    DependencyReadiness,
    LatestSourceObservation,
    SeriesAvailability,
    SourceRunSummary,
    TimeseriesListEnvelope,
    TimeseriesObservation,
)


class TimeseriesClient:
    def __init__(
        self,
        base_url: str,
        timeout_seconds: int,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self._client = httpx.AsyncClient(
            base_url=base_url.rstrip("/"),
            timeout=timeout_seconds,
            transport=transport,
        )

    async def aclose(self) -> None:
        await self._client.aclose()

    async def get_readiness(self) -> DependencyReadiness:
        response = await self._client.get("/api/timeseries/readiness")
        response.raise_for_status()
        return DependencyReadiness(
            dependency="timeseries-service",
            reachable=True,
            detail=response.json(),
        )

    async def list_series(
        self,
        country_iso3: str,
        indicator_code: str,
        source_code: str | None,
        dataset_code: str | None,
        period_granularity: str | None,
        include_missing: bool,
        sort_direction: str,
        limit: int,
    ) -> list[TimeseriesObservation]:
        params = {
            "countryIso3": country_iso3,
            "indicatorCode": indicator_code,
            "includeMissing": str(include_missing).lower(),
            "sortDirection": sort_direction,
            "limit": str(limit),
        }
        if source_code:
            params["sourceCode"] = source_code
        if dataset_code:
            params["datasetCode"] = dataset_code
        if period_granularity:
            params["periodGranularity"] = period_granularity

        response = await self._client.get("/api/timeseries/series", params=params)
        response.raise_for_status()
        payload = TimeseriesListEnvelope.model_validate(response.json())
        return [TimeseriesObservation.model_validate(item) for item in payload.items]

    async def list_latest_by_source(
        self,
        country_iso3: str,
        indicator_code: str,
        source_code: str | None,
        dataset_code: str | None,
        period_granularity: str | None,
        include_missing: bool,
    ) -> list[LatestSourceObservation]:
        params = {
            "countryIso3": country_iso3,
            "indicatorCode": indicator_code,
            "includeMissing": str(include_missing).lower(),
        }
        if source_code:
            params["sourceCode"] = source_code
        if dataset_code:
            params["datasetCode"] = dataset_code
        if period_granularity:
            params["periodGranularity"] = period_granularity

        response = await self._client.get("/api/timeseries/series/latest", params=params)
        response.raise_for_status()
        payload = TimeseriesListEnvelope.model_validate(response.json())
        return [LatestSourceObservation.model_validate(item) for item in payload.items]

    async def list_series_availability(
        self,
        country_iso3: str,
        indicator_code: str,
        source_code: str | None,
        dataset_code: str | None,
        period_granularity: str | None,
        limit: int,
    ) -> list[SeriesAvailability]:
        params = {
            "countryIso3": country_iso3,
            "indicatorCode": indicator_code,
            "limit": str(limit),
        }
        if source_code:
            params["sourceCode"] = source_code
        if dataset_code:
            params["datasetCode"] = dataset_code
        if period_granularity:
            params["periodGranularity"] = period_granularity

        response = await self._client.get("/api/timeseries/series/availability", params=params)
        response.raise_for_status()
        payload = TimeseriesListEnvelope.model_validate(response.json())
        return [SeriesAvailability.model_validate(item) for item in payload.items]

    async def compare_countries_latest(
        self,
        country_iso3: list[str],
        indicator_code: str,
        source_code: str | None,
        dataset_code: str | None,
        period_granularity: str | None,
        include_missing: bool,
    ) -> list[CountryLatestComparisonItem]:
        params: list[tuple[str, str]] = [("countryIso3", item) for item in country_iso3]
        params.extend(
            [
                ("indicatorCode", indicator_code),
                ("includeMissing", str(include_missing).lower()),
            ]
        )
        if source_code:
            params.append(("sourceCode", source_code))
        if dataset_code:
            params.append(("datasetCode", dataset_code))
        if period_granularity:
            params.append(("periodGranularity", period_granularity))

        response = await self._client.get("/api/timeseries/compare/countries/latest", params=params)
        response.raise_for_status()
        payload = TimeseriesListEnvelope.model_validate(response.json())
        return [CountryLatestComparisonItem.model_validate(item) for item in payload.items]

    async def list_source_runs(
        self,
        source_code: str | None,
        dataset_code: str | None,
        status: str | None,
        limit: int,
    ) -> list[SourceRunSummary]:
        params = {"limit": str(limit)}
        if source_code:
            params["sourceCode"] = source_code
        if dataset_code:
            params["datasetCode"] = dataset_code
        if status:
            params["status"] = status

        response = await self._client.get("/api/timeseries/source-runs", params=params)
        response.raise_for_status()
        payload = TimeseriesListEnvelope.model_validate(response.json())
        return [SourceRunSummary.model_validate(item) for item in payload.items]

    @staticmethod
    def unreachable(error: Exception) -> DependencyReadiness:
        return DependencyReadiness(
            dependency="timeseries-service",
            reachable=False,
            detail={"error": str(error)},
        )
