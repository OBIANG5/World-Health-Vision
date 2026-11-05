"""Eurostat ingestion pipeline.

Fetches statistical datasets from the Eurostat JSON API (format 2.0) and
publishes normalised IndicatorObservation records to the WHV timeseries store.
"""

from datetime import UTC, datetime
import json
import logging
from pathlib import Path

from ingestion_service.bronze_store import BronzeStore
from ingestion_service.connectors.eurostat_client import EurostatClient
from ingestion_service.connectors.timeseries_client import TimeseriesClient
from ingestion_service.country_scope import filter_observations_to_country_scope
from ingestion_service.metrics import (
    INGESTION_RECORD_COUNTER,
    INGESTION_RUN_COUNTER,
    TIMESERIES_PUBLICATION_COUNTER,
)
from ingestion_service.models import EurostatIndicatorRegistryEntry, IndicatorObservation

LOGGER = logging.getLogger(__name__)


class EurostatIngestionService:
    """Ingests economic and social indicators from the Eurostat API.

    For each registry entry the service:
    1. Calls the Eurostat JSON API to fetch the geo×time cube.
    2. Normalises the raw tuples into ``IndicatorObservation`` objects.
    3. Filters observations to the allowed country scope.
    4. Persists the raw + normalised payloads to the bronze store.
    5. Publishes the observations to the timeseries service.
    """

    SOURCE_CODE = "EUROSTAT"

    def __init__(
        self,
        *,
        client: EurostatClient,
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

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def fetch_core_indicators(self) -> list:
        """Ingest all indicators defined in the Eurostat registry JSON.

        Returns:
            List of ``RunManifest`` objects produced for each indicator.
        """
        indicator_entries = self._load_indicator_registry()
        manifests = []

        for entry in indicator_entries:
            run_id = self._run_id(entry.indicator_code)

            LOGGER.info(
                "Eurostat ingestion start — indicator=%s dataset=%s",
                entry.indicator_code,
                entry.eurostat_dataset_id,
            )

            # 1. Fetch raw tuples from Eurostat API
            raw_tuples = self._client.fetch_dataset(
                dataset_id=entry.eurostat_dataset_id,
                filter_params=entry.filter_params,
            )

            # 2. Normalise into IndicatorObservation objects
            normalized_observations = [
                IndicatorObservation.annual(
                    country_iso3=iso3,
                    indicator_code=entry.indicator_code,
                    year=year,
                    value=round(value * entry.scale_multiplier, 6) if value is not None else None,
                )
                for iso3, year, value in raw_tuples
            ]

            # 3. Filter to allowed country scope
            normalized_observations, dropped = filter_observations_to_country_scope(
                normalized_observations,
                self._allowed_country_iso3s,
            )

            if dropped:
                LOGGER.debug(
                    "Eurostat country-scope filter dropped %d observations for indicator=%s",
                    sum(dropped.values()),
                    entry.indicator_code,
                )

            normalized_rows = [obs.model_dump(mode="json") for obs in normalized_observations]

            # 4. Persist to bronze store
            manifest = self._bronze_store.persist_dataset(
                source_code=self.SOURCE_CODE,
                dataset_code=entry.dataset_code,
                run_id=run_id,
                raw_payload=raw_tuples,
                normalized_records=normalized_rows,
                notes={
                    "indicator_code": entry.indicator_code,
                    "eurostat_dataset_id": entry.eurostat_dataset_id,
                    "filter_params": entry.filter_params,
                    "display_name": entry.display_name,
                    "record_type": "indicator-observations",
                },
            )

            INGESTION_RUN_COUNTER.labels(self.SOURCE_CODE, entry.dataset_code, "success").inc()
            INGESTION_RECORD_COUNTER.labels(self.SOURCE_CODE, entry.dataset_code).inc(
                len(normalized_rows)
            )

            # 5. Publish to timeseries service
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

            LOGGER.info(
                "Eurostat ingestion complete — indicator=%s records=%d",
                entry.indicator_code,
                len(normalized_rows),
            )

            manifests.append(manifest)

        return manifests

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _load_indicator_registry(self) -> list[EurostatIndicatorRegistryEntry]:
        raw = json.loads(self._indicator_registry_path.read_text(encoding="utf-8"))
        return [EurostatIndicatorRegistryEntry.model_validate(item) for item in raw]

    def _run_id(self, suffix: str) -> str:
        timestamp = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
        safe = suffix.lower().replace(".", "_")
        return f"{timestamp}_{safe}"