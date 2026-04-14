import httpx

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

    async def aclose(self) -> None:
        await self._client.aclose()

    async def get_readiness(self) -> DependencyReadiness:
        response = await self._client.get("/api/catalog/readiness")
        response.raise_for_status()
        return DependencyReadiness(
            dependency="catalog-service",
            reachable=True,
            detail=response.json(),
        )

    async def get_country(self, country_iso3: str) -> CountryDetail:
        response = await self._client.get(f"/api/catalog/countries/{country_iso3}")
        response.raise_for_status()
        return CountryDetail.model_validate(response.json())

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

        response = await self._client.get("/api/catalog/countries", params=params)
        response.raise_for_status()
        payload = CatalogListEnvelope.model_validate(response.json())
        return [CountrySummary.model_validate(item) for item in payload.items]

    async def get_region(self, region_code: str) -> RegionDetail:
        response = await self._client.get(f"/api/catalog/regions/{region_code}")
        response.raise_for_status()
        return RegionDetail.model_validate(response.json())

    async def get_indicator(self, indicator_code: str) -> IndicatorDetail:
        response = await self._client.get(f"/api/catalog/indicators/{indicator_code}")
        response.raise_for_status()
        return IndicatorDetail.model_validate(response.json())

    async def list_core_indicators(self) -> list[IndicatorSummary]:
        response = await self._client.get("/api/catalog/indicators", params={"coreOnly": "true"})
        response.raise_for_status()
        payload = CatalogListEnvelope.model_validate(response.json())
        return [IndicatorSummary.model_validate(item) for item in payload.items]

    async def get_source(self, source_code: str) -> SourceDetail:
        response = await self._client.get(f"/api/catalog/sources/{source_code}")
        response.raise_for_status()
        return SourceDetail.model_validate(response.json())

    async def get_source_dataset(self, source_code: str, dataset_code: str) -> SourceDatasetDetail:
        response = await self._client.get(f"/api/catalog/sources/{source_code}/datasets/{dataset_code}")
        response.raise_for_status()
        return SourceDatasetDetail.model_validate(response.json())

    @staticmethod
    def unreachable(error: Exception) -> DependencyReadiness:
        return DependencyReadiness(
            dependency="catalog-service",
            reachable=False,
            detail={"error": str(error)},
        )
