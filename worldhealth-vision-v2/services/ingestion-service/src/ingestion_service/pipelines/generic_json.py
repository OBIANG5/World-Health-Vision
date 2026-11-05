"""Generic JSON ingestion pipeline.

Shared base for sources whose connector returns (iso3, year, value) tuples
directly: ADB KIDB, UNAIDS, CEPAL, AfDB.
Each concrete pipeline subclass only defines SOURCE_CODE and _fetch_raw().
"""

from __future__ import annotations

from datetime import UTC, datetime
import json
import logging
from pathlib import Path

from ingestion_service.bronze_store import BronzeStore
from ingestion_service.connectors.timeseries_client import TimeseriesClient
from ingestion_service.country_scope import filter_observations_to_country_scope
from ingestion_service.metrics import (
    INGESTION_RECORD_COUNTER,
    INGESTION_RUN_COUNTER,
    TIMESERIES_PUBLICATION_COUNTER,
)
from ingestion_service.models import GenericJsonIndicatorRegistryEntry, IndicatorObservation

LOGGER = logging.getLogger(__name__)


class GenericJsonIngestionService:
    """Base ingestion pipeline for JSON REST sources.

    Concrete subclasses must:
    - Set ``SOURCE_CODE``
    - Implement ``_fetch_raw(entry)``
    """

    SOURCE_CODE: str = "GENERIC"

    def __init__(
        self,
        *,
        bronze_store: BronzeStore,
        indicator_registry_path: Path,
        timeseries_client: TimeseriesClient | None,
        allowed_country_iso3s: set[str] | None = None,
    ) -> None:
        self._bronze_store = bronze_store
        self._indicator_registry_path = indicator_registry_path
        self._timeseries_client = timeseries_client
        self._allowed_country_iso3s = allowed_country_iso3s

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def fetch_core_indicators(self) -> list:
        entries = self._load_registry()
        manifests = []

        for entry in entries:
            run_id = self._run_id(entry.indicator_code)
            LOGGER.info("%s ingestion start — indicator=%s",
                        self.SOURCE_CODE, entry.indicator_code)

            raw_tuples = self._fetch_raw(entry)

            if not raw_tuples:
                LOGGER.warning("%s: no data returned for indicator=%s",
                               self.SOURCE_CODE, entry.indicator_code)
                INGESTION_RUN_COUNTER.labels(
                    self.SOURCE_CODE, entry.dataset_code, "empty"
                ).inc()
                continue

            normalized_observations = [
                IndicatorObservation.annual(
                    country_iso3=iso3,
                    indicator_code=entry.indicator_code,
                    year=year,
                    value=round(value * entry.scale_multiplier, 6),
                )
                for iso3, year, value in raw_tuples
            ]

            normalized_observations, dropped = filter_observations_to_country_scope(
                normalized_observations, self._allowed_country_iso3s
            )
            if dropped:
                LOGGER.debug("%s scope filter dropped %d obs for %s",
                             self.SOURCE_CODE, sum(dropped.values()),
                             entry.indicator_code)

            normalized_rows = [obs.model_dump(mode="json") for obs in normalized_observations]

            manifest = self._bronze_store.persist_dataset(
                source_code=self.SOURCE_CODE,
                dataset_code=entry.dataset_code,
                run_id=run_id,
                raw_payload=raw_tuples,
                normalized_records=normalized_rows,
                notes={
                    "indicator_code": entry.indicator_code,
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

            LOGGER.info("%s ingestion complete — indicator=%s records=%d",
                        self.SOURCE_CODE, entry.indicator_code, len(normalized_rows))
            manifests.append(manifest)

        return manifests

    # ------------------------------------------------------------------
    # Subclass hooks
    # ------------------------------------------------------------------

    def _fetch_raw(
        self, entry: GenericJsonIndicatorRegistryEntry
    ) -> list[tuple[str, int, float]]:
        raise NotImplementedError

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _load_registry(self) -> list[GenericJsonIndicatorRegistryEntry]:
        raw = json.loads(self._indicator_registry_path.read_text(encoding="utf-8"))
        return [GenericJsonIndicatorRegistryEntry.model_validate(item) for item in raw]

    def _run_id(self, suffix: str) -> str:
        timestamp = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
        safe = suffix.lower().replace(".", "_")
        return f"{timestamp}_{safe}"