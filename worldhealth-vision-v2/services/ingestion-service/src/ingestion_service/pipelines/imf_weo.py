from datetime import UTC, datetime
import logging
import json
from pathlib import Path
import re

from ingestion_service.bronze_store import BronzeStore
from ingestion_service.country_scope import filter_observations_to_country_scope
from ingestion_service.connectors.imf_weo_client import ImfWeoClient
from ingestion_service.connectors.timeseries_client import TimeseriesClient
from ingestion_service.metrics import INGESTION_RECORD_COUNTER, INGESTION_RUN_COUNTER, TIMESERIES_PUBLICATION_COUNTER
from ingestion_service.models import IndicatorObservation, ImfWeoIndicatorRegistryEntry

LOGGER = logging.getLogger(__name__)


class ImfWeoIngestionService:
    def __init__(
        self,
        *,
        client: ImfWeoClient,
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

    def fetch_core_indicators(
        self,
        *,
        indicator_codes: set[str] | None = None,
        country_iso3s: set[str] | None = None,
    ):
        # A bounded operational pilot only fetches the requested indicators
        # and never stores unrelated countries in the raw bronze manifest.
        indicator_entries = self._load_indicator_registry()
        if indicator_codes is not None:
            indicator_entries = [entry for entry in indicator_entries if entry.indicator_code in indicator_codes]
            if len(indicator_entries) != len(indicator_codes):
                raise ValueError(f"Unsupported WEO indicators: {sorted(indicator_codes - {item.indicator_code for item in indicator_entries})}")
        if country_iso3s is not None:
            if not country_iso3s or any(len(code) != 3 or not code.isalpha() for code in country_iso3s):
                raise ValueError("country_iso3s must be non-empty ISO3 codes")
            country_iso3s = {code.upper() for code in country_iso3s}
        raw_rows = self._client.fetch_countries_sheet_rows()
        source_descriptor = self._client.describe_source()
        manifests = []

        for entry in indicator_entries:
            run_id = self._run_id(entry.imf_indicator_id)
            matching_rows = [
                row
                for row in raw_rows
                if self._normalize_cell_to_text(row.get("INDICATOR.ID")) == entry.imf_indicator_id
                and self._is_country_code(self._normalize_cell_to_text(row.get("COUNTRY.ID")))
                and (country_iso3s is None or self._normalize_cell_to_text(row.get("COUNTRY.ID")) in country_iso3s)
            ]
            normalized_observations = self._normalize_indicator_rows(matching_rows, entry)
            normalized_observations, dropped_country_counts = filter_observations_to_country_scope(
                normalized_observations,
                self._allowed_country_iso3s,
            )
            if not normalized_observations:
                raise ValueError(
                    f"IMF WEO returned no verifiable historical/one-year-estimate records for {entry.indicator_code}"
                )
            normalized_rows = [item.model_dump(mode="json") for item in normalized_observations]

            manifest = self._bronze_store.persist_dataset(
                source_code="IMF",
                dataset_code=self._dataset_code,
                run_id=run_id,
                raw_payload={
                    "source": source_descriptor,
                    "indicator": {
                        "indicatorCode": entry.indicator_code,
                        "imfIndicatorId": entry.imf_indicator_id,
                        "displayName": entry.display_name,
                    },
                    "items": matching_rows,
                },
                normalized_records=normalized_rows,
                notes={
                    "datasetLabel": self._dataset_label,
                    "indicatorCode": entry.indicator_code,
                    "imfIndicatorId": entry.imf_indicator_id,
                    "indicatorDisplayName": entry.display_name,
                    "workbookUrl": source_descriptor["workbookUrl"],
                    "downloadedAtUtc": source_descriptor["downloadedAtUtc"],
                    "droppedCountryCounts": dropped_country_counts,
                },
            )
            manifests.append(manifest)
            INGESTION_RUN_COUNTER.labels("IMF", self._dataset_code, "success").inc()
            INGESTION_RECORD_COUNTER.labels("IMF", self._dataset_code).inc(len(normalized_rows))

            if self._timeseries_client is not None:
                try:
                    publication = self._timeseries_client.publish_indicator_observations(
                        source_code="IMF",
                        dataset_code=self._dataset_code,
                        manifest=manifest,
                        observations=normalized_observations,
                    )
                except Exception:
                    TIMESERIES_PUBLICATION_COUNTER.labels("IMF", self._dataset_code, "failure").inc()
                    raise

                manifest.notes["timeseriesPublication"] = publication
                self._bronze_store.save_manifest(manifest)
                TIMESERIES_PUBLICATION_COUNTER.labels("IMF", self._dataset_code, "success").inc()

        return manifests

    def _load_indicator_registry(self) -> list[ImfWeoIndicatorRegistryEntry]:
        content = self._indicator_registry_path.read_text(encoding="utf-8")
        payload = json.loads(content)
        return [ImfWeoIndicatorRegistryEntry.model_validate(item) for item in payload]

    def _normalize_indicator_rows(
        self,
        rows: list[dict[str, object | None]],
        entry: ImfWeoIndicatorRegistryEntry,
    ) -> list[IndicatorObservation]:
        observations: list[IndicatorObservation] = []
        year_columns = [str(year) for year in range(1980, 2031)]

        for row in rows:
            country_iso3 = self._normalize_cell_to_text(row.get("COUNTRY.ID"))
            latest_actual_year = self._parse_optional_int(row.get("LATEST_ACTUAL_ANNUAL_DATA"))
            # A zero means the whole IMF WEO series is estimated. A missing
            # cutoff cannot justify assigning historical values OBSERVED.
            # Do not silently turn future WEO projections into actual data.
            if latest_actual_year is None or latest_actual_year < 1980:
                LOGGER.warning(
                    "Skipping WEO series without a verifiable latest-actual cutoff: country=%s indicator=%s raw=%r",
                    country_iso3, entry.imf_indicator_id, row.get("LATEST_ACTUAL_ANNUAL_DATA"),
                )
                continue
            source_published_at = self._parse_optional_datetime(row.get("PUBLICATION_DATE"))

            for year_label in year_columns:
                raw_value = row.get(year_label)
                numeric_value = self._parse_optional_float(raw_value)
                if numeric_value is None:
                    continue

                year = int(year_label)
                # Skip years too far in the future (beyond estimate horizon)
                if latest_actual_year is not None and year > latest_actual_year + 1:
                    continue

                # year == latest_actual_year + 1 → current-year IMF estimate (not yet "actual")
                if latest_actual_year is not None and year == latest_actual_year + 1:
                    obs_status = "ESTIMATED"
                else:
                    obs_status = "OBSERVED"

                scaled_value = numeric_value * entry.scale_multiplier
                observations.append(
                    IndicatorObservation.annual(
                        country_iso3=country_iso3,
                        indicator_code=entry.indicator_code,
                        year=year,
                        value=scaled_value,
                        value_status=obs_status,
                        source_published_at=source_published_at,
                        source_metadata={
                            "sourceIndicatorId": entry.imf_indicator_id,
                            "sourceSeriesCode": self._normalize_cell_to_text(row.get("SERIES_CODE")),
                            "sourceCountryName": self._normalize_cell_to_text(row.get("COUNTRY")),
                            "sourceIndicatorName": self._normalize_cell_to_text(row.get("INDICATOR")),
                            "sourceDataset": self._normalize_cell_to_text(row.get("DATASET")),
                            "publicationDate": source_published_at.isoformat() if source_published_at else None,
                            "latestActualAnnualData": latest_actual_year,
                            "unit": self._normalize_cell_to_text(row.get("UNIT")),
                            "scale": self._normalize_cell_to_text(row.get("SCALE")),
                        },
                        quality_flags=[],
                    )
                )

        return observations

    def _run_id(self, suffix: str) -> str:
        timestamp = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
        safe_suffix = suffix.lower().replace(".", "_")
        return f"{timestamp}_{safe_suffix}"

    def _is_country_code(self, value: str | None) -> bool:
        return value is not None and len(value) == 3 and value.isalpha()

    def _normalize_cell_to_text(self, value: object | None) -> str | None:
        if value is None:
            return None
        cleaned = str(value).strip()
        return cleaned or None

    def _parse_optional_int(self, value: object | None) -> int | None:
        if value is None or value == "":
            return None
        if isinstance(value, int):
            return value
        if isinstance(value, float):
            return int(value)
        cleaned = str(value).strip().upper()
        if cleaned.isdigit():
            return int(cleaned)

        match = re.search(r"(\d{4})(?:\s*/\s*(\d{2,4}))?", cleaned)
        if not match:
            raise ValueError(f"Unable to parse IMF year value: {value!r}")

        first_year = int(match.group(1))
        second_year = match.group(2)
        if second_year is None:
            return first_year
        if len(second_year) == 2:
            century = (first_year // 100) * 100
            return century + int(second_year)
        return int(second_year)

    def _parse_optional_float(self, value: object | None) -> float | None:
        if value is None or value == "":
            return None
        if isinstance(value, (int, float)):
            return float(value)
        return float(str(value).strip())

    def _parse_optional_datetime(self, value: object | None) -> datetime | None:
        if value is None or value == "":
            return None
        if isinstance(value, datetime):
            return value if value.tzinfo is not None else value.replace(tzinfo=UTC)
        parsed = datetime.fromisoformat(str(value).strip())
        return parsed if parsed.tzinfo is not None else parsed.replace(tzinfo=UTC)