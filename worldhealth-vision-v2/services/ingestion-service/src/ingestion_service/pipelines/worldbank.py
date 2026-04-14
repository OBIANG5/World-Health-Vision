from datetime import UTC, datetime
import json
from pathlib import Path

from ingestion_service.bronze_store import BronzeStore
from ingestion_service.connectors.timeseries_client import TimeseriesClient
from ingestion_service.connectors.worldbank_client import WorldBankClient
from ingestion_service.metrics import INGESTION_RECORD_COUNTER, INGESTION_RUN_COUNTER, TIMESERIES_PUBLICATION_COUNTER
from ingestion_service.models import CountryRegistryRecord, IndicatorObservation, IndicatorRegistryEntry, WorldBankCountryRecord


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

    def fetch_core_indicators(self):
        indicator_entries = self._load_indicator_registry()
        manifests = []

        for entry in indicator_entries:
            run_id = self._run_id(entry.code)
            raw_rows = self._client.fetch_indicator_all_countries(entry.code)
            normalized_observations = [
                self._normalize_indicator_row(row, entry.code)
                for row in raw_rows
                if row.get("countryiso3code") and row.get("date")
            ]
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
