from __future__ import annotations

import logging

import httpx
from pydantic import BaseModel, ConfigDict, Field

from media_service.settings import Settings, get_settings


LOGGER = logging.getLogger("world-vision-media-catalog")


class CatalogLocalSource(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    country_iso3: str = Field(alias="countryIso3")
    source_code: str = Field(alias="sourceCode")
    display_name: str = Field(alias="displayName")
    organization_name: str = Field(alias="organizationName")
    source_role: str = Field(alias="sourceRole")
    source_type: str = Field(alias="sourceType")
    homepage_url: str = Field(alias="homepageUrl")
    evidence_url: str = Field(alias="evidenceUrl")
    verification_state: str = Field(alias="verificationState")
    last_reviewed_on: str = Field(alias="lastReviewedOn")
    methodology_caveat: str = Field(alias="methodologyCaveat")
    reuse_rights_note: str = Field(alias="reuseRightsNote")


class CatalogClient:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self.base_url = self.settings.catalog_base_url.rstrip("/")

    async def get_country_local_sources(
        self,
        country_iso3: str,
    ) -> list[CatalogLocalSource]:
        iso3 = country_iso3.strip().upper()
        if len(iso3) != 3:
            return []

        try:
            async with httpx.AsyncClient(
                timeout=self.settings.catalog_timeout_seconds
            ) as client:
                response = await client.get(
                    f"{self.base_url}/api/catalog/countries/{iso3}/local-context"
                )
                if response.status_code == 404:
                    return []
                response.raise_for_status()
        except httpx.HTTPError as exc:
            LOGGER.warning(
                "catalog-service local context unavailable for %s: %s",
                iso3,
                exc,
            )
            return []

        payload = response.json()
        raw_sources = payload.get("localSources", [])
        if not isinstance(raw_sources, list):
            return []

        sources: list[CatalogLocalSource] = []
        for raw in raw_sources:
            if not isinstance(raw, dict):
                continue
            try:
                sources.append(CatalogLocalSource.model_validate(raw))
            except Exception:
                LOGGER.warning(
                    "Ignoring invalid catalog local source for %s",
                    iso3,
                    exc_info=True,
                )
        return sources


CATALOG_CLIENT = CatalogClient()
