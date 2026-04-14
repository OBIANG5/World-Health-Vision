from datetime import UTC, datetime
import json
from pathlib import Path
import re

from ingestion_service.bronze_store import BronzeStore
from ingestion_service.country_scope import filter_observations_to_country_scope
from ingestion_service.connectors.timeseries_client import TimeseriesClient
from ingestion_service.connectors.unodc_tabular_client import UnodcTabularClient
from ingestion_service.metrics import INGESTION_RECORD_COUNTER, INGESTION_RUN_COUNTER, TIMESERIES_PUBLICATION_COUNTER
from ingestion_service.models import IndicatorObservation, RunManifest, UnodcIndicatorRegistryEntry


class UnodcIngestionService:
    def __init__(
        self,
        *,
        client: UnodcTabularClient,
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

    def fetch_homicide_baseline(self) -> list[RunManifest]:
        indicator_entries = self._load_indicator_registry()
        required_alias_groups = self._build_required_alias_groups(indicator_entries)
        raw_rows, source_descriptor = self._client.fetch_dataset(
            required_column_alias_groups=required_alias_groups,
        )

        manifests: list[RunManifest] = []
        for entry in indicator_entries:
            observations = self._normalize_indicator_rows(raw_rows, entry)
            observations, dropped_country_counts = filter_observations_to_country_scope(
                observations,
                self._allowed_country_iso3s,
            )
            normalized_rows = [item.model_dump(mode="json") for item in observations]
            manifest = self._bronze_store.persist_dataset(
                source_code="UNODC",
                dataset_code=entry.dataset_code,
                run_id=self._run_id(entry.indicator_code),
                raw_payload={
                    "source": source_descriptor,
                    "indicator": {
                        "indicatorCode": entry.indicator_code,
                        "displayName": entry.display_name,
                    },
                    "items": raw_rows,
                },
                normalized_records=normalized_rows,
                notes={
                    "datasetLabel": entry.dataset_label,
                    "indicatorCode": entry.indicator_code,
                    "indicatorDisplayName": entry.display_name,
                    "droppedCountryCounts": dropped_country_counts,
                },
            )
            manifests.append(manifest)
            INGESTION_RUN_COUNTER.labels("UNODC", entry.dataset_code, "success").inc()
            INGESTION_RECORD_COUNTER.labels("UNODC", entry.dataset_code).inc(len(normalized_rows))

            if self._timeseries_client is not None:
                try:
                    publication = self._timeseries_client.publish_indicator_observations(
                        source_code="UNODC",
                        dataset_code=entry.dataset_code,
                        manifest=manifest,
                        observations=observations,
                    )
                except Exception:
                    TIMESERIES_PUBLICATION_COUNTER.labels("UNODC", entry.dataset_code, "failure").inc()
                    raise

                manifest.notes["timeseriesPublication"] = publication
                self._bronze_store.save_manifest(manifest)
                TIMESERIES_PUBLICATION_COUNTER.labels("UNODC", entry.dataset_code, "success").inc()

        return manifests

    def _load_indicator_registry(self) -> list[UnodcIndicatorRegistryEntry]:
        content = self._indicator_registry_path.read_text(encoding="utf-8")
        payload = json.loads(content)
        return [UnodcIndicatorRegistryEntry.model_validate(item) for item in payload]

    def _build_required_alias_groups(
        self,
        entries: list[UnodcIndicatorRegistryEntry],
    ) -> list[list[str]]:
        country_aliases: set[str] = set()
        period_aliases: set[str] = set()
        value_aliases: set[str] = set()
        for entry in entries:
            country_aliases.update(entry.country_code_aliases)
            country_aliases.update(entry.country_name_aliases)
            period_aliases.update(entry.period_aliases)
            value_aliases.update(entry.value_aliases)
        return [sorted(country_aliases), sorted(period_aliases), sorted(value_aliases)]

    def _normalize_indicator_rows(
        self,
        rows: list[dict[str, str | None]],
        entry: UnodcIndicatorRegistryEntry,
    ) -> list[IndicatorObservation]:
        observations: list[IndicatorObservation] = []
        for row in rows:
            if not self._matches_filters(row, entry.filters):
                continue

            country_iso3 = self._extract_country_iso3(row, entry)
            year = self._extract_year(row, entry.period_aliases)
            numeric_value = self._extract_numeric_value(row, entry.value_aliases)
            if country_iso3 is None or year is None or numeric_value is None:
                continue

            country_name = self._extract_field(row, entry.country_name_aliases)
            observations.append(
                IndicatorObservation.annual(
                    country_iso3=country_iso3,
                    indicator_code=entry.indicator_code,
                    year=year,
                    value=numeric_value * entry.scale_multiplier,
                    value_status="OBSERVED",
                    source_metadata={
                        "countryName": country_name,
                        "rawPeriod": self._extract_field(row, entry.period_aliases),
                        "rawValue": self._extract_field(row, entry.value_aliases),
                    },
                )
            )
        return observations

    def _extract_country_iso3(
        self,
        row: dict[str, str | None],
        entry: UnodcIndicatorRegistryEntry,
    ) -> str | None:
        for candidate in (
            self._extract_field(row, entry.country_code_aliases),
            self._extract_field(row, entry.country_name_aliases),
        ):
            normalized = self._normalize_iso3(candidate)
            if normalized is not None:
                return normalized
        return None

    def _extract_year(self, row: dict[str, str | None], aliases: list[str]) -> int | None:
        raw_value = self._extract_field(row, aliases)
        if raw_value is None:
            return None
        match = re.search(r"(19|20)\d{2}", raw_value)
        return int(match.group(0)) if match else None

    def _extract_numeric_value(self, row: dict[str, str | None], aliases: list[str]) -> float | None:
        raw_value = self._extract_field(row, aliases)
        if raw_value is None:
            return None
        cleaned = raw_value.replace(",", "").strip()
        try:
            return float(cleaned)
        except ValueError:
            return None

    def _extract_field(self, row: dict[str, str | None], aliases: list[str]) -> str | None:
        normalized_map = {
            self._normalize_alias(key): value
            for key, value in row.items()
            if key
        }
        for alias in aliases:
            value = normalized_map.get(self._normalize_alias(alias))
            if value is not None and value.strip():
                return value.strip()
        return None

    def _normalize_iso3(self, value: str | None) -> str | None:
        if value is None:
            return None
        candidate = value.strip().upper()
        if len(candidate) == 3 and candidate.isalpha():
            return candidate
        match = re.search(r"\b([A-Z]{3})\b", candidate)
        if match:
            return match.group(1)
        return None

    def _matches_filters(self, row: dict[str, str | None], filters: dict[str, str]) -> bool:
        for key, expected_value in filters.items():
            value = self._extract_field(row, [key])
            if value != expected_value:
                return False
        return True

    def _normalize_alias(self, value: str) -> str:
        return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()

    def _run_id(self, suffix: str) -> str:
        timestamp = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
        safe_suffix = suffix.lower().replace(".", "_")
        return f"{timestamp}_{safe_suffix}"
