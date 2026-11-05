"""CEPAL/ECLAC CEPALSTAT ingestion pipeline."""

from ingestion_service.connectors.cepal_client import CepalClient
from ingestion_service.models import GenericJsonIndicatorRegistryEntry
from ingestion_service.pipelines.generic_json import GenericJsonIngestionService


class CepalIngestionService(GenericJsonIngestionService):
    SOURCE_CODE = "CEPAL"

    def __init__(self, *, client: CepalClient, **kwargs):
        super().__init__(**kwargs)
        self._client = client

    def _fetch_raw(self, entry: GenericJsonIndicatorRegistryEntry) -> list[tuple[str, int, float]]:
        return self._client.fetch_indicator(
            cepal_indicator_id=entry.source_indicator_id,
        )