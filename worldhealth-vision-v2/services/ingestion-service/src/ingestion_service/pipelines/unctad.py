"""UNCTAD (United Nations Conference on Trade and Development) ingestion pipeline."""

from __future__ import annotations

import logging

from ingestion_service.connectors.unctad_client import UntctadClient
from ingestion_service.models import GenericJsonIndicatorRegistryEntry
from ingestion_service.pipelines.generic_json import GenericJsonIngestionService

LOGGER = logging.getLogger(__name__)


class UntctadIngestionService(GenericJsonIngestionService):
    """Ingests UNCTAD trade and FDI statistics."""

    SOURCE_CODE = "UNCTAD"

    def __init__(self, *, client: UntctadClient, **kwargs) -> None:  # type: ignore[override]
        super().__init__(**kwargs)
        self._client = client

    def _fetch_raw(
        self, entry: GenericJsonIndicatorRegistryEntry
    ) -> list[tuple[str, int, float]]:
        method = entry.source_indicator_id
        if method == "fdi_inflows":
            return self._client.fetch_fdi_inflows()
        LOGGER.warning("UNCTAD: unknown source_indicator_id=%s", method)
        return []