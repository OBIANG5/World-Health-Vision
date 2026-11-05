"""UNDP Human Development Report (HDR) ingestion pipeline.

Downloads the HDR composite-indices CSV and publishes normalised
IndicatorObservation records to the WHV timeseries store.
"""

from datetime import UTC, datetime
import json
import logging
from pathlib import Path

from ingestion_service.bronze_store import BronzeStore
from ingestion_service.connectors.timeseries_client import TimeseriesClient
from ingestion_service.connectors.undp_hdr_client import UndpHdrClient
from ingestion_service.country_scope import filter_observations_to_country_scope
from ingestion_service.metrics import (
    INGESTION_RECORD_COUNTER,
    INGESTION_RUN_COUNTER,
    TIMESERIES_PUBLICATION_COUNTER,
)
from ingestion_service.models import IndicatorObservation, UndpHdrIndicatorRegistryEntry

LOGGER = logging.getLogger(__name__)


class UndpHdrIngestionService:
    """Ingests UNDP Human Development Report composite indices.

    The HDR CSV contains one row per country with yearly columns for each
    composite index (hdi_1990 … hdi_2022, gii_2010 … gii_2022, etc.).

    For each registry entry the service:
    1. Fetches (or reuses) the downloaded HDR observation list from the client.
    2. Filters rows matching the entry's ``hdr_field_prefix`` (e.g. "hdi").
    3. Normalises to ``IndicatorObservation`` objects.
    4. Applies country-scope filtering.
    5. Persists raw + normalised data to the bronze store.
    6. Publishes to the timeseries service.
    """

    SOURCE_CODE = "UNDP_HDR"

    def __init__(
        self,
        *,
        client: UndpHdrClient,
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
        # Cache the raw observations so the CSV is only downloaded once per run
        self._raw_observations_cache: list[dict] | None = None

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def fetch_core_indicators(self) -> list:
        """Ingest all indicators defined in the UNDP HDR registry JSON.

        Returns:
            List of ``RunManifest`` objects produced for each indicator.
        """
        indicator_entries = self._load_indicator_registry()
        manifests = []

        # Download the CSV once and reuse across all registry entries
        raw_observations = self._get_raw_observations()

        for entry in indicator_entries:
            run_id = self._run_id(entry.indicator_code)

            LOGGER.info(
                "UNDP HDR ingestion start — indicator=%s prefix=%s",
                entry.indicator_code,
                entry.hdr_field_prefix,
            )

            # 1. Filter raw observations to this entry's field prefix
            relevant_obs = [
                obs for obs in raw_observations
                if obs["field_prefix"] == entry.hdr_field_prefix
            ]

            # 2. Normalise into IndicatorObservation objects
            normalized_observations = [
                IndicatorObservation.annual(
                    country_iso3=obs["iso3"],
                    indicator_code=entry.indicator_code,
                    year=obs["year"],
                    value=round(obs["value"] * entry.scale_multiplier, 6)
                    if obs["value"] is not None else None,
                )
                for obs in relevant_obs
                if obs.get("value") is not None
            ]

            # 3. Filter to allowed country scope
            normalized_observations, dropped = filter_observations_to_country_scope(
                normalized_observations,
                self._allowed_country_iso3s,
            )

            if dropped:
                LOGGER.debug(
                    "UNDP HDR country-scope filter dropped %d observations for indicator=%s",
                    sum(dropped.values()),
                    entry.indicator_code,
                )

            normalized_rows = [obs.model_dump(mode="json") for obs in normalized_observations]

            # 4. Persist to bronze store
            manifest = self._bronze_store.persist_dataset(
                source_code=self.SOURCE_CODE,
                dataset_code=entry.dataset_code,
                run_id=run_id,
                raw_payload=relevant_obs,
                normalized_records=normalized_rows,
                notes={
                    "indicator_code": entry.indicator_code,
                    "hdr_field_prefix": entry.hdr_field_prefix,
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
                "UNDP HDR ingestion complete — indicator=%s records=%d",
                entry.indicator_code,
                len(normalized_rows),
            )

            manifests.append(manifest)

        return manifests

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _get_raw_observations(self) -> list[dict]:
        """Download (and cache) the full HDR CSV observations list."""
        if self._raw_observations_cache is None:
            self._raw_observations_cache = self._client.fetch_hdi_timeseries()
        return self._raw_observations_cache

    def _load_indicator_registry(self) -> list[UndpHdrIndicatorRegistryEntry]:
        raw = json.loads(self._indicator_registry_path.read_text(encoding="utf-8"))
        return [UndpHdrIndicatorRegistryEntry.model_validate(item) for item in raw]

    def _run_id(self, suffix: str) -> str:
        timestamp = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
        safe = suffix.lower().replace(".", "_")
        return f"{timestamp}_{safe}"