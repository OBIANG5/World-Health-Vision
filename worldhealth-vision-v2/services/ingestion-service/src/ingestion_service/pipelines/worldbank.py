from datetime import UTC, datetime
import json
import logging
from pathlib import Path

from ingestion_service.bronze_store import BronzeStore
from ingestion_service.connectors.timeseries_client import TimeseriesClient
from ingestion_service.connectors.worldbank_client import WorldBankClient
from ingestion_service.metrics import INGESTION_RECORD_COUNTER, INGESTION_RUN_COUNTER, TIMESERIES_PUBLICATION_COUNTER
from ingestion_service.models import CountryRegistryRecord, IndicatorObservation, IndicatorRegistryEntry, WorldBankCountryRecord

LOGGER = logging.getLogger(__name__)


class WorldBankIngestionService:
    def __init__(
        self,
        *,
        client: WorldBankClient,
        bronze_store: BronzeStore,
        indicator_registry_path: Path,
        timeseries_client: TimeseriesClient | None,
    ) -> None:
        self._client = client
        self._bronze_store = bronze_store
        self._indicator_registry_path = indicator_registry_path
        self._timeseries_client = timeseries_client

    def fetch_country_registry(self):
        run_id = self._run_id("worldbank-countries")
        raw_records = self._client.fetch_countries()
        normalized_records = [
            self._normalize_country_record(WorldBankCountryRecord.model_validate(record)).model_dump()
            for record in raw_records
        ]

        manifest = self._bronze_store.persist_dataset(
            source_code="WORLD_BANK",
            dataset_code="COUNTRIES",
            run_id=run_id,
            raw_payload=raw_records,
            normalized_records=normalized_records,
            notes={"record_type": "country-registry"},
        )

        INGESTION_RUN_COUNTER.labels("WORLD_BANK", "COUNTRIES", "success").inc()
        INGESTION_RECORD_COUNTER.labels("WORLD_BANK", "COUNTRIES").inc(len(normalized_records))
        return manifest

    def fetch_core_indicators(
        self,
        *,
        indicator_codes: set[str] | None = None,
        country_iso3s: set[str] | None = None,
    ):
        indicator_entries = self._load_indicator_registry()
        if indicator_codes is not None:
            indicator_entries = [entry for entry in indicator_entries if entry.code in indicator_codes]
            if len(indicator_entries) != len(indicator_codes):
                raise ValueError(f"Unsupported World Bank indicators: {sorted(indicator_codes - {e.code for e in indicator_entries})}")
        if country_iso3s is not None:
            if not country_iso3s or any(len(code) != 3 or not code.isalpha() for code in country_iso3s):
                raise ValueError("country_iso3s must be non-empty ISO3 codes")
            country_iso3s = {code.upper() for code in country_iso3s}
        manifests = []

        for entry in indicator_entries:
            # WGI and similar indicators may use a different API code (fetch_code)
            # but must be stored under the canonical analytics code (entry.code).
            api_code = entry.fetch_code or entry.code
            run_id = self._run_id(entry.code)
            try:
                raw_rows = self._client.fetch_indicator_all_countries(api_code, source_id=entry.source_id)
            except Exception as exc:
                LOGGER.warning("WB indicator fetch failed, skipping — code=%s error=%s", entry.code, exc)
                INGESTION_RUN_COUNTER.labels("WORLD_BANK", "WDI", "failure").inc()
                continue

            normalized_observations = [
                self._normalize_indicator_row(row, entry.code)
                for row in raw_rows
                if row.get("countryiso3code") and row.get("date")
                and (country_iso3s is None or row["countryiso3code"].upper() in country_iso3s)
            ]
            if not normalized_observations or not any(item.value is not None for item in normalized_observations):
                raise ValueError(
                    f"World Bank provided no usable observations for indicator {entry.code} "
                    f"in selected country scope; refusing an empty successful ingestion"
                )
            normalized_rows = [item.model_dump() for item in normalized_observations]

            manifest = self._bronze_store.persist_dataset(
                source_code="WORLD_BANK",
                dataset_code="WDI",
                run_id=run_id,
                raw_payload=raw_rows,
                normalized_records=normalized_rows,
                notes={"indicatorCode": entry.code, "indicatorName": entry.name},
            )
            manifests.append(manifest)
            INGESTION_RUN_COUNTER.labels("WORLD_BANK", "WDI", "success").inc()
            INGESTION_RECORD_COUNTER.labels("WORLD_BANK", "WDI").inc(len(normalized_rows))

            if self._timeseries_client is not None:
                try:
                    publication = self._timeseries_client.publish_indicator_observations(
                        source_code="WORLD_BANK",
                        dataset_code="WDI",
                        manifest=manifest,
                        observations=normalized_observations,
                    )
                except Exception:
                    TIMESERIES_PUBLICATION_COUNTER.labels("WORLD_BANK", "WDI", "failure").inc()
                    raise

                manifest.notes["timeseriesPublication"] = publication
                self._bronze_store.save_manifest(manifest)
                TIMESERIES_PUBLICATION_COUNTER.labels("WORLD_BANK", "WDI", "success").inc()

        return manifests

    def _load_indicator_registry(self) -> list[IndicatorRegistryEntry]:
        content = self._indicator_registry_path.read_text(encoding="utf-8")
        payload = json.loads(content)
        return [IndicatorRegistryEntry.model_validate(item) for item in payload]

    def _normalize_country_record(self, record: WorldBankCountryRecord) -> CountryRegistryRecord:
        region_code = self._clean_code(record.region.id)
        region_name = self._clean_value(record.region.value)
        is_aggregate = region_code == "NA" or region_name == "Aggregates"

        return CountryRegistryRecord(
            iso3=record.id.strip(),
            iso2=self._clean_code(record.iso2Code),
            display_name=record.name.strip(),
            region_code=None if is_aggregate else region_code,
            region_name=None if is_aggregate else region_name,
            subregion_code=self._clean_code(record.adminregion.id),
            subregion_name=self._clean_value(record.adminregion.value),
            income_group=self._clean_value(record.incomeLevel.value),
            lending_type=self._clean_value(record.lendingType.value),
            capital_city=self._clean_value(record.capitalCity),
            latitude=self._parse_optional_float(record.latitude),
            longitude=self._parse_optional_float(record.longitude),
            is_aggregate=is_aggregate,
        )

    def _normalize_indicator_row(self, row: dict, indicator_code: str) -> IndicatorObservation:
        return IndicatorObservation.annual(
            country_iso3=row["countryiso3code"].strip(),
            indicator_code=indicator_code,
            year=int(row["date"]),
            value=float(row["value"]) if row["value"] is not None else None,
        )

    def _run_id(self, suffix: str) -> str:
        timestamp = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
        safe_suffix = suffix.lower().replace(".", "_")
        return f"{timestamp}_{safe_suffix}"

    def _clean_code(self, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None

    def _clean_value(self, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None

    def _parse_optional_float(self, value: str | None) -> float | None:
        cleaned = self._clean_value(value)
        return float(cleaned) if cleaned is not None else None