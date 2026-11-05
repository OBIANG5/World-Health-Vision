# WorldHealthVision V2 — NumbeoIngestionService
# Pipeline d'ingestion des indices coût de la vie Numbeo.
# Source MARKET (crowd-sourcé) — nécessite une clé API Numbeo payante.

import json
import logging
from datetime import UTC, datetime
from pathlib import Path

import pycountry

from ingestion_service.bronze_store import BronzeStore
from ingestion_service.connectors.numbeo_client import NumbeoApiClient
from ingestion_service.connectors.timeseries_client import TimeseriesClient
from ingestion_service.country_scope import filter_observations_to_country_scope
from ingestion_service.metrics import (
    INGESTION_RECORD_COUNTER,
    INGESTION_RUN_COUNTER,
    TIMESERIES_PUBLICATION_COUNTER,
)
from ingestion_service.models import IndicatorObservation, NumbeoIndicatorRegistryEntry, RunManifest

LOGGER = logging.getLogger(__name__)

# Noms Numbeo qui ne correspondent pas directement à un enregistrement pycountry
_NUMBEO_NAME_OVERRIDES: dict[str, str] = {
    "Russia": "RUS",
    "South Korea": "KOR",
    "North Korea": "PRK",
    "Taiwan": "TWN",
    "Hong Kong": "HKG",
    "Macau": "MAC",
    "Macao": "MAC",
    "Czech Republic": "CZE",
    "Czechia": "CZE",
    "United States": "USA",
    "Bosnia And Herzegovina": "BIH",
    "Kosovo (Disputed Territory)": "XKX",
    "Republic of Moldova": "MDA",
    "Moldova": "MDA",
    "Ivory Coast": "CIV",
    "Palestine": "PSE",
    "Syria": "SYR",
    "Vietnam": "VNM",
    "Iran": "IRN",
    "South Africa": "ZAF",
    "Tanzania": "TZA",
    "Bolivia": "BOL",
    "Venezuela": "VEN",
    "Brunei": "BRN",
    "Laos": "LAO",
    "Reunion Island": "REU",
    "Puerto Rico": "PRI",
    "Virgin Islands": "VIR",
    "Micronesia": "FSM",
    "Netherlands Antilles": "ANT",
    "Democratic Republic of the Congo": "COD",
    "Congo": "COG",
}


class NumbeoIngestionService:
    def __init__(
        self,
        *,
        client: NumbeoApiClient,
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

    def fetch_cost_of_living_indices(self) -> list[RunManifest]:
        """Télécharge et ingère tous les indices Numbeo pour l'année courante."""
        indicator_entries = self._load_indicator_registry()
        current_year = datetime.now(UTC).year

        LOGGER.info("Numbeo : téléchargement des indices pays...")
        raw_country_rows = self._client.fetch_country_indices()
        LOGGER.info("Numbeo : %d lignes pays reçues.", len(raw_country_rows))

        manifests: list[RunManifest] = []

        for entry in indicator_entries:
            observations = self._build_observations(raw_country_rows, entry, current_year)
            observations, dropped_country_counts = filter_observations_to_country_scope(
                observations,
                self._allowed_country_iso3s,
            )
            normalized_rows = [item.model_dump(mode="json") for item in observations]

            manifest = self._bronze_store.persist_dataset(
                source_code="NUMBEO",
                dataset_code=entry.dataset_code,
                run_id=self._run_id(entry.indicator_code),
                raw_payload={
                    "source": {"name": "Numbeo", "endpoint": "indices"},
                    "indicator": {
                        "indicatorCode": entry.indicator_code,
                        "displayName": entry.display_name,
                        "numbeoField": entry.numbeo_field,
                        "year": current_year,
                    },
                    "items": raw_country_rows,
                },
                normalized_records=normalized_rows,
                notes={
                    "indicatorCode": entry.indicator_code,
                    "indicatorDisplayName": entry.display_name,
                    "year": current_year,
                    "droppedCountryCounts": dropped_country_counts,
                },
            )
            manifests.append(manifest)

            INGESTION_RUN_COUNTER.labels("NUMBEO", entry.dataset_code, "success").inc()
            INGESTION_RECORD_COUNTER.labels("NUMBEO", entry.dataset_code).inc(len(normalized_rows))

            if self._timeseries_client is not None:
                try:
                    publication = self._timeseries_client.publish_indicator_observations(
                        source_code="NUMBEO",
                        dataset_code=entry.dataset_code,
                        manifest=manifest,
                        observations=observations,
                    )
                    manifest.notes["timeseriesPublication"] = publication
                    self._bronze_store.save_manifest(manifest)
                    TIMESERIES_PUBLICATION_COUNTER.labels("NUMBEO", entry.dataset_code, "success").inc()
                except Exception:
                    TIMESERIES_PUBLICATION_COUNTER.labels("NUMBEO", entry.dataset_code, "failure").inc()
                    raise

            LOGGER.info(
                "Numbeo : indicateur %s — %d observations publiées.",
                entry.indicator_code,
                len(normalized_rows),
            )

        return manifests

    # -------------------------------------------------------------------------
    # Privé
    # -------------------------------------------------------------------------

    def _build_observations(
        self,
        rows: list[dict],
        entry: NumbeoIndicatorRegistryEntry,
        year: int,
    ) -> list[IndicatorObservation]:
        observations: list[IndicatorObservation] = []
        skipped = 0

        for row in rows:
            country_name: str = row.get("country", "")
            iso3 = self._resolve_iso3(country_name)
            if iso3 is None:
                LOGGER.debug("Numbeo : pays non résolu — %r", country_name)
                skipped += 1
                continue

            raw_value = row.get(entry.numbeo_field)
            if raw_value is None:
                continue

            try:
                value = float(raw_value) * entry.scale_multiplier
            except (ValueError, TypeError):
                LOGGER.debug("Numbeo : valeur non numérique pour %r — %r", entry.numbeo_field, raw_value)
                continue

            observations.append(
                IndicatorObservation.annual(
                    country_iso3=iso3,
                    indicator_code=entry.indicator_code,
                    year=year,
                    value=value,
                    value_status="OBSERVED",
                    source_metadata={
                        "countryName": country_name,
                        "numbeoField": entry.numbeo_field,
                    },
                )
            )

        if skipped > 0:
            LOGGER.warning("Numbeo : %d pays non résolus en ISO3.", skipped)

        return observations

    @staticmethod
    def _resolve_iso3(country_name: str) -> str | None:
        """Résout un nom de pays Numbeo vers un code ISO3."""
        if not country_name:
            return None

        # Table d'exceptions Numbeo → ISO3
        if country_name in _NUMBEO_NAME_OVERRIDES:
            return _NUMBEO_NAME_OVERRIDES[country_name]

        # Lookup pycountry
        try:
            result = pycountry.countries.lookup(country_name)
            return result.alpha_3
        except LookupError:
            return None

    def _load_indicator_registry(self) -> list[NumbeoIndicatorRegistryEntry]:
        content = self._indicator_registry_path.read_text(encoding="utf-8")
        payload = json.loads(content)
        return [NumbeoIndicatorRegistryEntry.model_validate(item) for item in payload]

    @staticmethod
    def _run_id(suffix: str) -> str:
        timestamp = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
        safe_suffix = suffix.lower().replace(".", "_")
        return f"{timestamp}_{safe_suffix}"