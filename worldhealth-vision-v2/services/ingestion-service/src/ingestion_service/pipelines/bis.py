"""BIS (Bank for International Settlements) ingestion pipeline.

Fetches central bank policy rates and private-sector credit-to-GDP from the
BIS SDMX REST API and publishes to the WHV timeseries store.
"""

from datetime import UTC, datetime
import logging
from pathlib import Path

from ingestion_service.bronze_store import BronzeStore
from ingestion_service.connectors.bis_client import BisClient
from ingestion_service.connectors.timeseries_client import TimeseriesClient
from ingestion_service.country_scope import filter_observations_to_country_scope
from ingestion_service.metrics import (
    INGESTION_RECORD_COUNTER,
    INGESTION_RUN_COUNTER,
    TIMESERIES_PUBLICATION_COUNTER,
)
from ingestion_service.models import BisIndicatorRegistryEntry, IndicatorObservation

LOGGER = logging.getLogger(__name__)


class BisIngestionService:
    """Ingests BIS statistical indicators.

    Each registry entry specifies which BIS fetch method to call
    (``fetch_method``: "policy_rates" | "private_credit_gdp").
    """

    SOURCE_CODE = "BIS"

    def __init__(
        self,
        *,
        client: BisClient,
        bronze_store: BronzeStore,
        indicator_registry: list[BisIndicatorRegistryEntry],
        timeseries_client: TimeseriesClient | None,
        allowed_country_iso3s: set[str] | None = None,
    ) -> None:
        self._client = client
        self._bronze_store = bronze_store
        self._indicator_registry = indicator_registry
        self._timeseries_client = timeseries_client
        self._allowed_country_iso3s = allowed_country_iso3s
        self._cache: dict[str, list[tuple[str, int, float]]] = {}

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def fetch_core_indicators(self) -> list:
        manifests = []
        for entry in self._indicator_registry:
            run_id = self._run_id(entry.indicator_code)
            LOGGER.info("BIS ingestion start — indicator=%s method=%s",
                        entry.indicator_code, entry.fetch_method)

            raw_tuples = self._fetch_raw(entry.fetch_method)

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
                LOGGER.debug("BIS scope filter dropped %d obs for %s",
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
                    "fetch_method": entry.fetch_method,
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

            LOGGER.info("BIS ingestion complete — indicator=%s records=%d",
                        entry.indicator_code, len(normalized_rows))
            manifests.append(manifest)

        return manifests

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _fetch_raw(self, fetch_method: str) -> list[tuple[str, int, float]]:
        if fetch_method not in self._cache:
            if fetch_method == "policy_rates":
                self._cache[fetch_method] = self._client.fetch_policy_rates_annual()
            elif fetch_method == "private_credit_gdp":
                self._cache[fetch_method] = self._client.fetch_private_credit_gdp_annual()
            else:
                raise ValueError(f"Unknown BIS fetch_method: {fetch_method!r}")
        return self._cache[fetch_method]

    def _run_id(self, suffix: str) -> str:
        timestamp = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
        safe = suffix.lower().replace(".", "_")
        return f"{timestamp}_{safe}"