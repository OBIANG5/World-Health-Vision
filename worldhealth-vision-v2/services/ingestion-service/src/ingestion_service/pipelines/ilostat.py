from datetime import UTC, datetime
import json
from pathlib import Path

from ingestion_service.bronze_store import BronzeStore
from ingestion_service.country_scope import filter_observations_to_country_scope
from ingestion_service.connectors.ilostat_client import IloStatClient
from ingestion_service.connectors.timeseries_client import TimeseriesClient
from ingestion_service.metrics import INGESTION_RECORD_COUNTER, INGESTION_RUN_COUNTER, TIMESERIES_PUBLICATION_COUNTER
from ingestion_service.models import IloStatIndicatorRegistryEntry, IndicatorObservation


class IloStatIngestionService:
    def __init__(
        self,
        *,
        client: IloStatClient,
        bronze_store: BronzeStore,
        indicator_registry_path: Path,
        dataset_code: str,
        dataset_label: str,
        timeseries_client: TimeseriesClient | None,
        allowed_country_iso3s: set[str] | None = None,
    ) -> None:
        self._client = client
        self._bronze_store = bronze_store
        self._indicator_registry_path = indicator_registry_path
        self._dataset_code = dataset_code
        self._dataset_label = dataset_label
        self._timeseries_client = timeseries_client
        self._allowed_country_iso3s = allowed_country_iso3s

    def fetch_core_indicators(self):
        indicator_entries = self._load_indicator_registry()
        raw_download_cache: dict[str, list[dict[str, str]]] = {}
        manifests = []

        for entry in indicator_entries:
            if entry.ilostat_download_id not in raw_download_cache:
                raw_download_cache[entry.ilostat_download_id] = self._client.fetch_indicator_rows(entry.ilostat_download_id)

            raw_rows = raw_download_cache[entry.ilostat_download_id]
            source_descriptor = self._client.describe_source(entry.ilostat_download_id)
            normalized_observations = self._normalize_indicator_rows(raw_rows, entry)
            normalized_observations, dropped_country_counts = filter_observations_to_country_scope(
                normalized_observations,
                self._allowed_country_iso3s,
            )
            normalized_rows = [item.model_dump(mode="json") for item in normalized_observations]

            manifest = self._bronze_store.persist_dataset(
                source_code="ILOSTAT",
                dataset_code=self._dataset_code,
                run_id=self._run_id(entry.indicator_code),
                raw_payload={
                    "source": source_descriptor,
                    "indicator": {
                        "indicatorCode": entry.indicator_code,
                        "downloadId": entry.ilostat_download_id,
                        "seriesCode": entry.ilostat_series_code,
                        "displayName": entry.display_name,
                    },
                    "items": raw_rows,
                },
                normalized_records=normalized_rows,
                notes={
                    "datasetLabel": self._dataset_label,
                    "indicatorCode": entry.indicator_code,
                    "downloadId": entry.ilostat_download_id,
                    "seriesCode": entry.ilostat_series_code,
                    "indicatorDisplayName": entry.display_name,
                    "filters": entry.filters,
                    "downloadUrl": source_descriptor["downloadUrl"],
                    "droppedCountryCounts": dropped_country_counts,
                },
            )
            manifests.append(manifest)
            INGESTION_RUN_COUNTER.labels("ILOSTAT", self._dataset_code, "success").inc()
            INGESTION_RECORD_COUNTER.labels("ILOSTAT", self._dataset_code).inc(len(normalized_rows))

            if self._timeseries_client is not None:
                try:
                    publication = self._timeseries_client.publish_indicator_observations(
                        source_code="ILOSTAT",
                        dataset_code=self._dataset_code,
                        manifest=manifest,
                        observations=normalized_observations,
                    )
                except Exception:
                    TIMESERIES_PUBLICATION_COUNTER.labels("ILOSTAT", self._dataset_code, "failure").inc()
                    raise

                manifest.notes["timeseriesPublication"] = publication
                self._bronze_store.save_manifest(manifest)
                TIMESERIES_PUBLICATION_COUNTER.labels("ILOSTAT", self._dataset_code, "success").inc()

        return manifests

    def _load_indicator_registry(self) -> list[IloStatIndicatorRegistryEntry]:
        content = self._indicator_registry_path.read_text(encoding="utf-8")
        payload = json.loads(content)
        return [IloStatIndicatorRegistryEntry.model_validate(item) for item in payload]

    def _normalize_indicator_rows(
        self,
        rows: list[dict[str, str]],
        entry: IloStatIndicatorRegistryEntry,
    ) -> list[IndicatorObservation]:
        observations: list[IndicatorObservation] = []

        for row in rows:
            if row.get("indicator") != entry.ilostat_series_code:
                continue
            if not self._matches_filters(row, entry.filters):
                continue

            country_iso3 = row.get("ref_area")
            if not self._is_country_code(country_iso3):
                continue

            year = self._parse_optional_int(row.get("time"))
            numeric_value = self._parse_optional_float(row.get("obs_value"))
            if year is None or numeric_value is None:
                continue

            obs_status = self._normalize_cell_to_text(row.get("obs_status"))
            observations.append(
                IndicatorObservation.annual(
                    country_iso3=country_iso3,
                    indicator_code=entry.indicator_code,
                    year=year,
                    value=numeric_value * entry.scale_multiplier,
                    value_status="OBSERVED",
                    source_metadata={
                        "sourceIndicatorId": entry.ilostat_series_code,
                        "downloadId": entry.ilostat_download_id,
                        "sourceId": self._normalize_cell_to_text(row.get("source")),
                        "sex": self._normalize_cell_to_text(row.get("sex")),
                        "classif1": self._normalize_cell_to_text(row.get("classif1")),
                        "obsStatus": obs_status,
                        "noteClassif": self._normalize_cell_to_text(row.get("note_classif")),
                        "noteIndicator": self._normalize_cell_to_text(row.get("note_indicator")),
                        "noteSource": self._normalize_cell_to_text(row.get("note_source")),
                    },
                    quality_flags=[f"ILOSTAT_OBS_STATUS:{obs_status}"] if obs_status else [],
                )
            )

        return observations

    def _matches_filters(self, row: dict[str, str], filters: dict[str, str]) -> bool:
        for key, expected_value in filters.items():
            if self._normalize_cell_to_text(row.get(key)) != expected_value:
                return False
        return True

    def _run_id(self, suffix: str) -> str:
        timestamp = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
        safe_suffix = suffix.lower().replace(".", "_")
        return f"{timestamp}_{safe_suffix}"

    def _is_country_code(self, value: str | None) -> bool:
        return value is not None and len(value) == 3 and value.isalpha()

    def _normalize_cell_to_text(self, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None

    def _parse_optional_int(self, value: str | None) -> int | None:
        cleaned = self._normalize_cell_to_text(value)
        return int(cleaned) if cleaned is not None else None

    def _parse_optional_float(self, value: str | None) -> float | None:
        cleaned = self._normalize_cell_to_text(value)
        return float(cleaned) if cleaned is not None else None
