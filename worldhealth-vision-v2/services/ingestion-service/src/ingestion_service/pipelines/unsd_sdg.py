from datetime import UTC, datetime
import json
from pathlib import Path
import re
from typing import Any

import pycountry

from ingestion_service.bronze_store import BronzeStore
from ingestion_service.connectors.timeseries_client import TimeseriesClient
from ingestion_service.connectors.unsd_sdg_client import UnsdSdgClient
from ingestion_service.country_scope import filter_observations_to_country_scope
from ingestion_service.metrics import INGESTION_RECORD_COUNTER, INGESTION_RUN_COUNTER, TIMESERIES_PUBLICATION_COUNTER
from ingestion_service.models import IndicatorObservation, UnsdSdgIndicatorRegistryEntry


class UnsdSdgIngestionService:
    def __init__(
        self,
        *,
        client: UnsdSdgClient,
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
            raw_rows, source_descriptor = self._client.fetch_series_observations(
                series_code=entry.series_code,
                release_code=entry.release_code,
                time_period_start=entry.time_period_start,
                time_period_end=entry.time_period_end,
            )
            normalized_observations = self._normalize_indicator_rows(raw_rows, entry)
            normalized_observations, dropped_country_counts = filter_observations_to_country_scope(
                normalized_observations,
                self._allowed_country_iso3s,
            )
            normalized_rows = [item.model_dump(mode="json") for item in normalized_observations]

            manifest = self._bronze_store.persist_dataset(
                source_code="UNSD_SDG",
                dataset_code=entry.dataset_code,
                run_id=self._run_id(entry.indicator_code),
                raw_payload={
                    "source": source_descriptor,
                    "indicator": {
                        "indicatorCode": entry.indicator_code,
                        "seriesCode": entry.series_code,
                        "displayName": entry.display_name,
                        "releaseCode": entry.release_code,
                        "timePeriodStart": entry.time_period_start,
                        "timePeriodEnd": entry.time_period_end,
                    },
                    "items": raw_rows,
                },
                normalized_records=normalized_rows,
                notes={
                    "datasetLabel": entry.dataset_label,
                    "indicatorCode": entry.indicator_code,
                    "indicatorDisplayName": entry.display_name,
                    "seriesCode": entry.series_code,
                    "releaseCode": entry.release_code,
                    "timePeriodStart": entry.time_period_start,
                    "timePeriodEnd": entry.time_period_end,
                    "dimensionFilters": entry.dimension_filters,
                    "attributeFilters": entry.attribute_filters,
                    "downloadUrl": source_descriptor["dataUrl"],
                    "lastUpdatedAtUtc": source_descriptor["lastUpdatedAtUtc"],
                    "droppedCountryCounts": dropped_country_counts,
                },
            )
            manifests.append(manifest)
            INGESTION_RUN_COUNTER.labels("UNSD_SDG", entry.dataset_code, "success").inc()
            INGESTION_RECORD_COUNTER.labels("UNSD_SDG", entry.dataset_code).inc(len(normalized_rows))

            if self._timeseries_client is not None:
                try:
                    publication = self._timeseries_client.publish_indicator_observations(
                        source_code="UNSD_SDG",
                        dataset_code=entry.dataset_code,
                        manifest=manifest,
                        observations=normalized_observations,
                    )
                except Exception:
                    TIMESERIES_PUBLICATION_COUNTER.labels("UNSD_SDG", entry.dataset_code, "failure").inc()
                    raise

                manifest.notes["timeseriesPublication"] = publication
                self._bronze_store.save_manifest(manifest)
                TIMESERIES_PUBLICATION_COUNTER.labels("UNSD_SDG", entry.dataset_code, "success").inc()

        return manifests

    def _load_indicator_registry(self) -> list[UnsdSdgIndicatorRegistryEntry]:
        content = self._indicator_registry_path.read_text(encoding="utf-8")
        payload = json.loads(content)
        return [UnsdSdgIndicatorRegistryEntry.model_validate(item) for item in payload]

    def _normalize_indicator_rows(
        self,
        rows: list[dict[str, Any]],
        entry: UnsdSdgIndicatorRegistryEntry,
    ) -> list[IndicatorObservation]:
        observations: list[IndicatorObservation] = []

        for row in rows:
            if self._normalize_cell_to_text(row.get("series")) != entry.series_code:
                continue

            dimensions = self._normalize_mapping(row.get("dimensions"))
            attributes = self._normalize_mapping(row.get("attributes"))
            if not self._matches_filters(dimensions, entry.dimension_filters):
                continue
            if not self._matches_filters(attributes, entry.attribute_filters):
                continue

            country_iso3 = self._map_geo_area_to_iso3(row.get("geoAreaCode"), row.get("geoAreaName"))
            year = self._parse_year(row.get("timePeriodStart"))
            numeric_value = self._parse_optional_float(row.get("value"))
            if country_iso3 is None or year is None or numeric_value is None:
                continue

            nature = attributes.get("Nature")
            if nature in {"N", "NA", "_X"}:
                continue

            quality_flags = []
            for key, value in dimensions.items():
                if value:
                    quality_flags.append(f"UNSD_DIMENSION:{self._to_flag_token(key)}={self._to_flag_token(value)}")
            for key, value in attributes.items():
                if value:
                    quality_flags.append(f"UNSD_ATTRIBUTE:{self._to_flag_token(key)}={self._to_flag_token(value)}")

            observations.append(
                IndicatorObservation.annual(
                    country_iso3=country_iso3,
                    indicator_code=entry.indicator_code,
                    year=year,
                    value=numeric_value * entry.scale_multiplier,
                    value_status=self._map_value_status(nature),
                    source_metadata={
                        "seriesCode": entry.series_code,
                        "seriesDescription": self._normalize_cell_to_text(row.get("seriesDescription")),
                        "geoAreaCode": self._normalize_cell_to_text(row.get("geoAreaCode")),
                        "geoAreaName": self._normalize_cell_to_text(row.get("geoAreaName")),
                        "sourceAgency": self._normalize_cell_to_text(row.get("source")),
                        "valueType": self._normalize_cell_to_text(row.get("valueType")),
                        "timeCoverage": self._normalize_cell_to_text(row.get("timeCoverage")),
                        "dimensions": dimensions,
                        "attributes": attributes,
                        "footnotes": row.get("footnotes") if isinstance(row.get("footnotes"), list) else [],
                    },
                    quality_flags=quality_flags,
                )
            )

        return observations

    def _normalize_mapping(self, value: Any) -> dict[str, str]:
        if not isinstance(value, dict):
            return {}
        normalized: dict[str, str] = {}
        for key, item in value.items():
            normalized_key = self._normalize_cell_to_text(key)
            normalized_value = self._normalize_cell_to_text(item)
            if normalized_key and normalized_value:
                normalized[normalized_key] = normalized_value
        return normalized

    def _matches_filters(self, values: dict[str, str], expected_filters: dict[str, str]) -> bool:
        for key, expected_value in expected_filters.items():
            if values.get(key) != expected_value:
                return False
        return True

    def _map_geo_area_to_iso3(self, geo_area_code: Any, geo_area_name: Any) -> str | None:
        normalized_code = self._normalize_numeric_code(geo_area_code)
        if normalized_code is not None:
            country = pycountry.countries.get(numeric=normalized_code)
            if country is not None:
                return getattr(country, "alpha_3", None)

        normalized_name = self._normalize_cell_to_text(geo_area_name)
        if normalized_name is None:
            return None

        for candidate in (normalized_name, normalized_name.replace("Türkiye", "Turkey")):
            country = pycountry.countries.get(name=candidate)
            if country is not None:
                return getattr(country, "alpha_3", None)

        return None

    def _normalize_numeric_code(self, value: Any) -> str | None:
        if value is None:
            return None
        text = str(value).strip()
        if not text:
            return None
        try:
            numeric = int(float(text))
        except ValueError:
            return None
        return f"{numeric:03d}"

    def _parse_year(self, value: Any) -> int | None:
        if value is None:
            return None
        text = str(value).strip()
        if not text:
            return None
        match = re.search(r"(19|20)\d{2}", text)
        return int(match.group(0)) if match else None

    def _parse_optional_float(self, value: Any) -> float | None:
        if value is None:
            return None
        text = str(value).strip()
        if not text:
            return None
        return float(text)

    def _map_value_status(self, nature: str | None) -> str:
        if nature == "C":
            return "OBSERVED"
        if nature in {"CA", "E", "G", "M"}:
            return "ESTIMATED"
        return "OBSERVED"

    def _normalize_cell_to_text(self, value: Any) -> str | None:
        if value is None:
            return None
        cleaned = str(value).strip()
        return cleaned or None

    def _to_flag_token(self, value: str) -> str:
        return re.sub(r"[^A-Z0-9]+", "_", value.upper()).strip("_")

    def _run_id(self, suffix: str) -> str:
        timestamp = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
        safe_suffix = suffix.lower().replace(".", "_")
        return f"{timestamp}_{safe_suffix}"
