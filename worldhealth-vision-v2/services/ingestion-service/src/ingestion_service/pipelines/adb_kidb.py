"""ADB KIDB ingestion pipeline."""

from ingestion_service.connectors.adb_kidb_client import AdbKidbClient
from ingestion_service.models import GenericJsonIndicatorRegistryEntry
from ingestion_service.pipelines.generic_json import GenericJsonIngestionService


class AdbKidbIngestionService(GenericJsonIngestionService):
    SOURCE_CODE = "ADB_KIDB"

    def __init__(self, *, client: AdbKidbClient, **kwargs):
        super().__init__(**kwargs)
        self._client = client

    def _fetch_raw(self, entry: GenericJsonIndicatorRegistryEntry) -> list[tuple[str, int, float]]:
        return self._client.fetch_indicator(
            kidb_item_code=entry.source_indicator_id,
        )