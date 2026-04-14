from calendar import monthrange
from datetime import UTC, date, datetime
import json
from pathlib import Path

from ingestion_service.bronze_store import BronzeStore
from ingestion_service.country_scope import filter_observations_to_country_scope
from ingestion_service.connectors.oecd_sdmx_client import OecdSdmxCsvClient
from ingestion_service.connectors.timeseries_client import TimeseriesClient
from ingestion_service.metrics import INGESTION_RECORD_COUNTER, INGESTION_RUN_COUNTER, TIMESERIES_PUBLICATION_COUNTER
from ingestion_service.models import IndicatorObservation, OecdIndicatorRegistryEntry


class OecdIngestionService:
    def __init__(
        self,
        *,
        client: OecdSdmxCsvClient,
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
        raw_download_cache: dict[tuple[str, str, str], list[dict[str, str]]] = {}
        manifests = []

        for entry in indicator_entries:
            cache_key = (entry.dataflow_agency, entry.dataflow_id, entry.data_query)
            if cache_key not in raw_download_cache:
                raw_download_cache[cache_key] = self._client.fetch_data_rows(
                    dataflow_agency=entry.dataflow_agency,
                    dataflow_id=entry.dataflow_id,
                    data_query=entry.data_query,
                )

            raw_rows = raw_download_cache[cache_key]
            source_descriptor = self._client.describe_source(
                dataflow_agency=entry.dataflow_agency,
                dataflow_id=entry.dataflow_id,
                data_query=entry.data_query,
            )
            normalized_observations = self._normalize_indicator_rows(raw_rows, entry)
            normalized_observations, dropped_country_counts = filter_observations_to_country_scope(
                normalized_observations,
                self._allowed_country_iso3s,
            )
            normalized_rows = [item.model_dump(mode="json") for item in normalized_observations]

            manifest = self._bronze_store.persist_dataset(
                source_code="OECD",
                dataset_code=entry.dataset_code,
                run_id=self._run_id(entry.indicator_code),
                raw_payload={
                    "source": source_descriptor,
                    "indicator": {
                        "indicatorCode": entry.indicator_code,
                        "dataflowAgency": entry.dataflow_agency,
                        "dataflowId": entry.dataflow_id,
                        "dataQuery": entry.data_query,
                        "displayName": entry.display_name,
                    },
                    "items": raw_rows,
                },
                normalized_records=normalized_rows,
                notes={
                    "datasetLabel": entry.dataset_label,
                    "indicatorCode": entry.indicator_code,
                    "indicatorDisplayName": entry.display_name,
                    "dataflowAgency": entry.dataflow_agency,
                    "dataflowId": entry.dataflow_id,
                    "dataQuery": entry.data_query,
                    "downloadUrl": source_descriptor["downloadUrl"],
                    "droppedCountryCounts": dropped_country_counts,
                },
            )
            manifests.append(manifest)
            INGESTION_RUN_COUNTER.labels("OECD", entry.dataset_code, "success").inc()
            INGESTION_RECORD_COUNTER.labels("OECD", entry.dataset_code).inc(len(normalized_rows))

            if self._timeseries_client is not None:
                try:
                    publication = self._timeseries_client.publish_indicator_observations(
                        source_code="OECD",
                        dataset_code=entry.dataset_code,
                        manifest=manifest,
                        observations=normalized_observations,
                    )
                except Exception:
                    TIMESERIES_PUBLICATION_COUNTER.labels("OECD", entry.dataset_code, "failure").inc()
                    raise

                manifest.notes["timeseriesPublication"] = publication
                self._bronze_store.save_manifest(manifest)
                TIMESERIES_PUBLICATION_COUNTER.labels("OECD", entry.dataset_code, "success").inc()

        return manifests

    def _load_indicator_registry(self) -> list[OecdIndicatorRegistryEntry]:
        content = self._indicator_registry_path.read_text(encoding="utf-8")
        payload = json.loads(content)
        return [OecdIndicatorRegistryEntry.model_validate(item) for item in payload]

    def _normalize_indicator_rows(
        self,
        rows: list[dict[str, str]],
        entry: OecdIndicatorRegistryEntry,
    ) -> list[IndicatorObservation]:
        observations: list[IndicatorObservation] = []

        for row in rows:
            if not self._matches_filters(row, entry.filters):
                continue

            country_iso3 = self._normalize_cell_to_text(row.get("REF_AREA"))
            if not self._is_country_code(country_iso3):
                continue

            numeric_value = self._parse_optional_float(row.get("OBS_VALUE"))
            period = self._parse_period(
                self._normalize_cell_to_text(row.get("TIME_PERIOD")),
                entry.period_granularity,
            )
            if numeric_value is None or period is None:
                continue

            obs_status = self._normalize_cell_to_text(row.get("OBS_STATUS"))
            observations.append(
                IndicatorObservation(
                    country_iso3=country_iso3,
                    indicator_code=entry.indicator_code,
                    period_granularity=entry.period_granularity,
                    period_start=period["period_start"],
                    period_end=period["period_end"],
                    period_label=period["period_label"],
                    value=numeric_value * entry.scale_multiplier,
                    value_status="OBSERVED",
                    source_metadata={
                        "dataflow": self._normalize_cell_to_text(row.get("DATAFLOW")),
                        "measure": self._normalize_cell_to_text(row.get("MEASURE")),
                        "frequency": self._normalize_cell_to_text(row.get("FREQ")),
                        "analyticalCategories": self._normalize_cell_to_text(row.get("ANALYTICAL_CATEGORIES")),
                        "unitMeasure": self._normalize_cell_to_text(row.get("UNIT_MEASURE")),
                        "baseRefArea": self._normalize_cell_to_text(row.get("BASE_REF_AREA")),
                        "counterpartArea": self._normalize_cell_to_text(row.get("COUNTERPART_AREA")),
                        "adjustment": self._normalize_cell_to_text(row.get("ADJUSTMENT")),
                        "basePeriod": self._normalize_cell_to_text(row.get("BASE_PER")),
                        "unitMult": self._normalize_cell_to_text(row.get("UNIT_MULT")),
                        "obsStatus": obs_status,
                    },
                    quality_flags=[f"OECD_OBS_STATUS:{obs_status}"] if obs_status else [],
                )
            )

        return observations

    def _matches_filters(self, row: dict[str, str], filters: dict[str, str]) -> bool:
        for key, expected_value in filters.items():
            if self._normalize_cell_to_text(row.get(key)) != expected_value:
                return False
        return True

    def _parse_period(
        self,
        raw_period: str | None,
        period_granularity: str,
    ) -> dict[str, date | str] | None:
        if raw_period is None:
            return None

        if period_granularity == "ANNUAL":
            year = int(raw_period)
            return {
                "period_start": date(year, 1, 1),
                "period_end": date(year, 12, 31),
                "period_label": raw_period,
            }

        if period_granularity == "QUARTERLY":
            year_text, quarter_text = raw_period.split("-Q", maxsplit=1)
            year = int(year_text)
            quarter = int(quarter_text)
            month = ((quarter - 1) * 3) + 1
            period_start = date(year, month, 1)
            end_month = month + 2
            return {
                "period_start": period_start,
                "period_end": date(year, end_month, monthrange(year, end_month)[1]),
                "period_label": raw_period,
            }

        if period_granularity == "MONTHLY":
            year_text, month_text = raw_period.split("-", maxsplit=1)
            year = int(year_text)
            month = int(month_text)
            return {
                "period_start": date(year, month, 1),
                "period_end": date(year, month, monthrange(year, month)[1]),
                "period_label": raw_period,
            }

        if period_granularity == "DAILY":
            period_start = date.fromisoformat(raw_period)
            return {
                "period_start": period_start,
                "period_end": period_start,
                "period_label": raw_period,
            }

        if period_granularity == "AD_HOC":
            parsed = date.fromisoformat(raw_period)
            return {
                "period_start": parsed,
                "period_end": parsed,
                "period_label": raw_period,
            }

        raise ValueError(f"Unsupported OECD period granularity: {period_granularity}")

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

    def _parse_optional_float(self, value: str | None) -> float | None:
        cleaned = self._normalize_cell_to_text(value)
        return float(cleaned) if cleaned is not None else None
