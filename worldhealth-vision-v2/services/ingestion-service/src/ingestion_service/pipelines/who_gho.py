"""WHO Global Health Observatory (GHO) ingestion pipeline."""

from datetime import UTC, datetime
import json
from pathlib import Path

from ingestion_service.bronze_store import BronzeStore
from ingestion_service.country_scope import filter_observations_to_country_scope
from ingestion_service.connectors.who_gho_client import WhoGhoClient
from ingestion_service.connectors.timeseries_client import TimeseriesClient
from ingestion_service.metrics import INGESTION_RECORD_COUNTER, INGESTION_RUN_COUNTER, TIMESERIES_PUBLICATION_COUNTER
from ingestion_service.models import WhoGhoIndicatorRegistryEntry, IndicatorObservation


# GHO uses ISO3 country codes in SpatialDim — a small set of non-standard mappings
# e.g. "COD" is used for Democratic Republic of Congo, "PRK" for North Korea, etc.
# The bulk are standard ISO3 — no mapping needed for most cases.
_GHO_ISO3_OVERRIDES: dict[str, str] = {
    "ZAFR": "ZAF",  # South Africa (some GHO endpoints use old code)
}


class WhoGhoIngestionService:
    """Ingests health indicators from the WHO Global Health Observatory OData API.

    The GHO API returns OData JSON with country observations indexed by SpatialDim
    (ISO3 country code) and TimeDim (year). This service normalises those into
    WHV IndicatorObservation objects and publishes them to the timeseries store.
    """

    SOURCE_CODE = "WHO_GHO"

    def __init__(
        self,
        *,
        client: WhoGhoClient,
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

    def fetch_core_indicators(self):
        indicator_entries = self._load_indicator_registry()
        manifests = []

        for entry in indicator_entries:
            run_id = self._run_id(entry.indicator_code)

            raw_rows = self._client.fetch_indicator_all_countries(
                gho_indicator_id=entry.gho_indicator_id,
                sex_filter=entry.sex_filter,
            )

            normalized_observations = [
                self._normalize_row(row, entry)
                for row in raw_rows
                if self._is_valid_row(row)
            ]

            normalized_observations, _ = filter_observations_to_country_scope(
                normalized_observations,
                self._allowed_country_iso3s,
            )

            normalized_rows = [obs.model_dump(mode="json") for obs in normalized_observations]

            manifest = self._bronze_store.persist_dataset(
                source_code=self.SOURCE_CODE,
                dataset_code=entry.dataset_code,
                run_id=run_id,
                raw_payload=raw_rows,
                normalized_records=normalized_rows,
                notes={
                    "indicator_code": entry.indicator_code,
                    "gho_indicator_id": entry.gho_indicator_id,
                    "record_type": "indicator-observations",
                    "methodology_note": entry.methodology_note,
                },
            )

            INGESTION_RUN_COUNTER.labels(self.SOURCE_CODE, entry.dataset_code, "success").inc()
            INGESTION_RECORD_COUNTER.labels(self.SOURCE_CODE, entry.dataset_code).inc(len(normalized_rows))

            if self._timeseries_client and normalized_observations:
                try:
                    self._timeseries_client.publish_indicator_observations(
                        source_code=self.SOURCE_CODE,
                        dataset_code=entry.dataset_code,
                        manifest=manifest,
                        observations=normalized_observations,
                    )
                except Exception:
                    TIMESERIES_PUBLICATION_COUNTER.labels(self.SOURCE_CODE, entry.dataset_code, "failure").inc()
                    raise
                TIMESERIES_PUBLICATION_COUNTER.labels(self.SOURCE_CODE, entry.dataset_code, "success").inc()

            manifests.append(manifest)

        return manifests

    # ------------------------------------------------------------------
    # private helpers
    # ------------------------------------------------------------------

    def _is_valid_row(self, row: dict) -> bool:
        return bool(
            row.get("SpatialDim")
            and row.get("TimeDim") is not None
            and row.get("NumericValue") is not None
        )

    def _normalize_row(self, row: dict, entry: WhoGhoIndicatorRegistryEntry) -> IndicatorObservation:
        raw_iso3 = str(row["SpatialDim"]).strip().upper()
        iso3 = _GHO_ISO3_OVERRIDES.get(raw_iso3, raw_iso3)
        year = int(row["TimeDim"])
        value = float(row["NumericValue"]) * entry.scale_multiplier

        return IndicatorObservation.annual(
            country_iso3=iso3,
            indicator_code=entry.indicator_code,
            year=year,
            value=value,
        )

    def _load_indicator_registry(self) -> list[WhoGhoIndicatorRegistryEntry]:
        raw = json.loads(self._indicator_registry_path.read_text(encoding="utf-8"))
        return [WhoGhoIndicatorRegistryEntry.model_validate(item) for item in raw]

    def _run_id(self, suffix: str) -> str:
        timestamp = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
        safe = suffix.lower().replace(".", "_")
        return f"{timestamp}_{safe}"