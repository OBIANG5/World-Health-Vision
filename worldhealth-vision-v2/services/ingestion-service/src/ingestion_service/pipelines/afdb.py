"""African Development Bank (AfDB) Open Data ingestion pipeline."""

from ingestion_service.connectors.afdb_client import AfdbClient
from ingestion_service.models import AfdbIndicatorRegistryEntry
from ingestion_service.pipelines.generic_json import GenericJsonIngestionService
from ingestion_service.models import GenericJsonIndicatorRegistryEntry


class AfdbIngestionService(GenericJsonIngestionService):
    SOURCE_CODE = "AFDB"

    def __init__(self, *, client: AfdbClient, **kwargs):
        super().__init__(**kwargs)
        self._client = client

    def _fetch_raw(self, entry: GenericJsonIndicatorRegistryEntry) -> list[tuple[str, int, float]]:
        # source_indicator_id format: "DATASET_ID:VARIABLE_ID"
        if ":" in entry.source_indicator_id:
            dataset_id, variable_id = entry.source_indicator_id.split(":", 1)
        else:
            dataset_id = entry.source_indicator_id
            variable_id = ""
        return self._client.fetch_dataset(
            dataset_id=dataset_id,
            variable_id=variable_id,
        )