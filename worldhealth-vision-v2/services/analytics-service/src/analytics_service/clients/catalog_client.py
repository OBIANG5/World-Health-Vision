import httpx

from analytics_service.metrics import timed_dependency_http

from analytics_service.national_comparisons import LocalCatalogResponse

from analytics_service.models import (
    CatalogListEnvelope,
    CountrySummary,
    CountryDetail,
    DependencyReadiness,
    IndicatorDetail,
    IndicatorSummary,
    RegionDetail,
    SourceDatasetDetail,
    SourceDetail,
)


class CatalogClient:
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

    async def _get(self, operation: str, path: str, *, params=None) -> httpx.Response:
        # Only internal reviewed operation names reach the fixed-cardinality metrics.
        with timed_dependency_http("catalog", operation):
            response = await self._client.get(path, params=params)
            response.raise_for_status()
        return response

    async def _post(self, operation: str, path: str, *, json: dict) -> httpx.Response:
        with timed_dependency_http("catalog", operation):
            response = await self._client.post(path, json=json)
            response.raise_for_status()
        return response

    async def aclose(self) -> None:
        await self._client.aclose()

    async def get_readiness(self) -> DependencyReadiness:
        response = await self._get("readiness", "/api/catalog/readiness")
        return DependencyReadiness(
            dependency="catalog-service",
            reachable=True,
            detail=response.json(),
        )

    async def get_country(self, country_iso3: str) -> CountryDetail:
        response = await self._get("country", f"/api/catalog/countries/{country_iso3}")
        return CountryDetail.model_validate(response.json())

    async def get_country_local_context(self, country_iso3: str) -> LocalCatalogResponse:
        """Read verified national institutions and published releases from the catalog.

        A documented release is NOT automatically a canonical observation.
        The catalog responds 404 when the ISO3 country is unknown.
        """
        response = await self._get("local_context", 
            f"/api/catalog/countries/{country_iso3}/local-context"
        )
        return LocalCatalogResponse.model_validate(response.json())

    async def list_countries(
        self,
        include_aggregates: bool,
        active_only: bool,
        region_code: str | None,
        limit: int,
    ) -> list[CountrySummary]:
        params = {
            "includeAggregates": str(include_aggregates).lower(),
            "activeOnly": str(active_only).lower(),
            "limit": str(limit),
        }
        if region_code:
            params["regionCode"] = region_code

        response = await self._get("countries", "/api/catalog/countries", params=params)
        payload = CatalogListEnvelope.model_validate(response.json())
        return [CountrySummary.model_validate(item) for item in payload.items]

    async def get_region(self, region_code: str) -> RegionDetail:
        response = await self._get("region", f"/api/catalog/regions/{region_code}")
        return RegionDetail.model_validate(response.json())

    async def get_indicator(self, indicator_code: str) -> IndicatorDetail:
        response = await self._get("indicator", f"/api/catalog/indicators/{indicator_code}")
        return IndicatorDetail.model_validate(response.json())

    async def get_indicators_batch(self, codes: list[str]) -> list[IndicatorDetail]:
        """Private batch. Wrong count/order is a dependency contract failure.

        Do not mask omitted indicators, reorder profiles or silently fall back
        on fictitious records. The caller decides whether this path is enabled.
        """
        if not (1 <= len(codes) <= 128) or len(set(codes)) != len(codes):
            raise ValueError("Indicator batch must have 1 to 128 unique codes.")
        response = await self._post(
            "indicators_batch", "/internal/catalog/indicators/batch", json={"codes": codes}
        )
        payload = CatalogListEnvelope.model_validate(response.json())
        details = [IndicatorDetail.model_validate(item) for item in payload.items]
        if payload.count != len(codes) or len(details) != len(codes) or [
            item.code for item in details
        ] != codes:
            raise httpx.RemoteProtocolError("Invalid internal Catalog indicator batch response.")
        return details

    async def list_core_indicators(self) -> list[IndicatorSummary]:
        response = await self._get("indicators", "/api/catalog/indicators", params={"coreOnly": "true"})
        payload = CatalogListEnvelope.model_validate(response.json())
        return [IndicatorSummary.model_validate(item) for item in payload.items]

    async def get_source(self, source_code: str) -> SourceDetail:
        response = await self._get("source", f"/api/catalog/sources/{source_code}")
        return SourceDetail.model_validate(response.json())

    async def get_source_dataset(self, source_code: str, dataset_code: str) -> SourceDatasetDetail:
        response = await self._get("dataset", f"/api/catalog/sources/{source_code}/datasets/{dataset_code}")
        return SourceDatasetDetail.model_validate(response.json())

    @staticmethod
    def unreachable(error: Exception) -> DependencyReadiness:
        return DependencyReadiness(
            dependency="catalog-service",
            reachable=False,
            detail={"error": str(error)},
        )