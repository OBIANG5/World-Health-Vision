import json
import logging
from collections import Counter
from pathlib import Path

from ingestion_service.models import IndicatorObservation

LOGGER = logging.getLogger(__name__)


def load_published_country_iso3s(bronze_root: Path) -> set[str] | None:
    dataset_dir = bronze_root / "world_bank" / "countries"
    manifests = sorted(dataset_dir.glob("*.manifest.json"))
    if not manifests:
        LOGGER.warning(
            "No published World Bank country registry manifest found under %s; country-scope filtering is disabled.",
            dataset_dir,
        )
        return None

    latest_manifest_path = manifests[-1]
    manifest = json.loads(latest_manifest_path.read_text(encoding="utf-8"))
    normalized_payload_path = Path(manifest["normalized_payload_path"])
    if not normalized_payload_path.is_absolute():
        normalized_payload_path = (latest_manifest_path.parent / normalized_payload_path).resolve()

    allowed_country_iso3s: set[str] = set()
    for line in normalized_payload_path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        record = json.loads(line)
        iso3 = str(record.get("iso3", "")).strip().upper()
        if len(iso3) == 3 and iso3.isalpha():
            allowed_country_iso3s.add(iso3)

    LOGGER.info(
        "Loaded %s canonical ISO3 codes from %s for ingestion country-scope validation.",
        len(allowed_country_iso3s),
        latest_manifest_path,
    )
    return allowed_country_iso3s


def filter_observations_to_country_scope(
    observations: list[IndicatorObservation],
    allowed_country_iso3s: set[str] | None,
) -> tuple[list[IndicatorObservation], dict[str, int]]:
    if not allowed_country_iso3s:
        return observations, {}

    filtered: list[IndicatorObservation] = []
    dropped = Counter[str]()

    for observation in observations:
        if observation.country_iso3 in allowed_country_iso3s:
            filtered.append(observation)
            continue
        dropped[observation.country_iso3] += 1

    return filtered, dict(sorted(dropped.items()))
