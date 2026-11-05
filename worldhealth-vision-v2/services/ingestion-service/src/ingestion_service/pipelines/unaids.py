"""UNAIDS AIDSinfo ingestion pipeline."""

from ingestion_service.connectors.unaids_client import UnaidsClient
from ingestion_service.models import GenericJsonIndicatorRegistryEntry
from ingestion_service.pipelines.generic_json import GenericJsonIngestionService


class UnaidsIngestionService(GenericJsonIngestionService):
    SOURCE_CODE = "UNAIDS"

    def __init__(self, *, client: UnaidsClient, **kwargs):
        super().__init__(**kwargs)
        self._client = client

    def _fetch_raw(self, entry: GenericJsonIndicatorRegistryEntry) -> list[tuple[str, int, float]]:
        return self._client.fetch_indicator(
            indicator_id=entry.source_indicator_id,
        )