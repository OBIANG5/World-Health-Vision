"""IMF International Financial Statistics (IFS) ingestion pipeline."""

from datetime import UTC, datetime
import json
import logging
from pathlib import Path

from ingestion_service.bronze_store import BronzeStore
from ingestion_service.connectors.imf_ifs_client import ImfIfsClient
from ingestion_service.connectors.timeseries_client import TimeseriesClient
from ingestion_service.country_scope import filter_observations_to_country_scope
from ingestion_service.metrics import (
    INGESTION_RECORD_COUNTER,
    INGESTION_RUN_COUNTER,
    TIMESERIES_PUBLICATION_COUNTER,
)
from ingestion_service.models import ImfIfsIndicatorRegistryEntry, IndicatorObservation

LOGGER = logging.getLogger(__name__)


class ImfIfsIngestionService:
    """Ingests IMF IFS indicators (reserves, exchange rates, monetary data)."""

    SOURCE_CODE = "IMF_IFS"

    def __init__(
        self,
        *,
        client: ImfIfsClient,
        bronze_store: BronzeStore,
        indicator_registry_path: Path,
        timeseries_client: TimeseriesClient | None,
        allowed_country_iso3s: set[str] | None = None,
    ) -> None:
        self._client = client
        self._bronze_store = bronze_store
        self._indicator_registry_path = indicator_registry_path
        self._timeseries_client = timeseries_client
        self._allowed_country_iso3s = allowed_country_iso3s

    def fetch_core_indicators(self) -> list:
        entries = self._load_registry()
        manifests = []

        for entry in entries:
            run_id = self._run_id(entry.indicator_code)
            LOGGER.info("IMF IFS ingestion start — indicator=%s ifs_code=%s",
                        entry.indicator_code, entry.ifs_indicator_code)

            raw_tuples = self._client.fetch_indicator_all_countries(
                indicator_code=entry.ifs_indicator_code,
                frequency="A",
            )

            normalized_observations = [
                IndicatorObservation.annual(
                    country_iso3=iso3,
                    indicator_code=entry.indicator_code,
                    year=year,
                    value=round(value * entry.scale_multiplier, 6) if value is not None else None,
                )
                for iso3, year, value in raw_tuples
            ]

            normalized_observations, dropped = filter_observations_to_country_scope(
                normalized_observations, self._allowed_country_iso3s
            )
            if dropped:
                LOGGER.debug("IFS scope filter dropped %d obs for %s",
                             sum(dropped.values()), entry.indicator_code)

            normalized_rows = [obs.model_dump(mode="json") for obs in normalized_observations]

            manifest = self._bronze_store.persist_dataset(
                source_code=self.SOURCE_CODE,
                dataset_code=entry.dataset_code,
                run_id=run_id,
                raw_payload=raw_tuples,
                normalized_records=normalized_rows,
                notes={
                    "indicator_code": entry.indicator_code,
                    "ifs_indicator_code": entry.ifs_indicator_code,
                    "display_name": entry.display_name,
                    "record_type": "indicator-observations",
                },
            )

            INGESTION_RUN_COUNTER.labels(self.SOURCE_CODE, entry.dataset_code, "success").inc()
            INGESTION_RECORD_COUNTER.labels(self.SOURCE_CODE, entry.dataset_code).inc(
                len(normalized_rows)
            )

            if self._timeseries_client is not None and normalized_observations:
                try:
                    publication = self._timeseries_client.publish_indicator_observations(
                        source_code=self.SOURCE_CODE,
                        dataset_code=entry.dataset_code,
                        manifest=manifest,
                        observations=normalized_observations,
                    )
                except Exception:
                    TIMESERIES_PUBLICATION_COUNTER.labels(
                        self.SOURCE_CODE, entry.dataset_code, "failure"
                    ).inc()
                    raise
                manifest.notes["timeseriesPublication"] = publication
                self._bronze_store.save_manifest(manifest)
                TIMESERIES_PUBLICATION_COUNTER.labels(
                    self.SOURCE_CODE, entry.dataset_code, "success"
                ).inc()

            LOGGER.info("IMF IFS ingestion complete — indicator=%s records=%d",
                        entry.indicator_code, len(normalized_rows))
            manifests.append(manifest)

        return manifests

    def _load_registry(self) -> list[ImfIfsIndicatorRegistryEntry]:
        raw = json.loads(self._indicator_registry_path.read_text(encoding="utf-8"))
        return [ImfIfsIndicatorRegistryEntry.model_validate(item) for item in raw]

    def _run_id(self, suffix: str) -> str:
        timestamp = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
        safe = suffix.lower().replace(".", "_")
        return f"{timestamp}_{safe}"