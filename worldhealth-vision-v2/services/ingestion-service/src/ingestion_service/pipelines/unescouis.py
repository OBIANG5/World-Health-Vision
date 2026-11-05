"""UNESCO UIS (Institute for Statistics) ingestion pipeline."""

from __future__ import annotations

import logging

from ingestion_service.connectors.unescouis_client import UnescoUisClient
from ingestion_service.models import GenericJsonIndicatorRegistryEntry
from ingestion_service.pipelines.generic_json import GenericJsonIngestionService

LOGGER = logging.getLogger(__name__)


class UnescoUisIngestionService(GenericJsonIngestionService):
    """Ingests UNESCO UIS education statistics."""

    SOURCE_CODE = "UNESCO_UIS"

    def __init__(self, *, client: UnescoUisClient, **kwargs) -> None:  # type: ignore[override]
        super().__init__(**kwargs)
        self._client = client

    def _fetch_raw(
        self, entry: GenericJsonIndicatorRegistryEntry
    ) -> list[tuple[str, int, float]]:
        method = entry.source_indicator_id
        if method == "oos_primary":
            return self._client.fetch_out_of_school_rate_primary()
        if method == "literacy_adult":
            return self._client.fetch_literacy_rate_adult()
        LOGGER.warning("UNESCO UIS: unknown source_indicator_id=%s", method)
        return []