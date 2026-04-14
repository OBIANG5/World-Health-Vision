import json
from datetime import date, datetime
from pathlib import Path
from typing import Any, Iterable

from ingestion_service.models import RunManifest


class BronzeStore:
    def __init__(self, bronze_root: Path) -> None:
        self._bronze_root = bronze_root

    def persist_dataset(
        self,
        *,
        source_code: str,
        dataset_code: str,
        run_id: str,
        raw_payload: Any,
        normalized_records: Iterable[dict[str, Any]],
        notes: dict[str, Any] | None = None,
    ) -> RunManifest:
        dataset_dir = self._bronze_root / source_code.lower() / dataset_code.lower()
        dataset_dir.mkdir(parents=True, exist_ok=True)

        raw_payload_path = dataset_dir / f"{run_id}.raw.json"
        normalized_payload_path = dataset_dir / f"{run_id}.normalized.ndjson"
        manifest_path = dataset_dir / f"{run_id}.manifest.json"

        normalized_list = list(normalized_records)

        raw_payload_path.write_text(
            json.dumps(raw_payload, ensure_ascii=False, indent=2, default=self._json_default),
            encoding="utf-8",
        )
        normalized_payload_path.write_text(
            "\n".join(
                json.dumps(record, ensure_ascii=False, default=self._json_default)
                for record in normalized_list
            )
            + ("\n" if normalized_list else ""),
            encoding="utf-8",
        )

        manifest = RunManifest(
            source_code=source_code,
            dataset_code=dataset_code,
            run_id=run_id,
            record_count=len(normalized_list),
            manifest_path=manifest_path,
            raw_payload_path=raw_payload_path,
            normalized_payload_path=normalized_payload_path,
            notes=notes or {},
        )

        manifest_path.write_text(
            manifest.model_dump_json(indent=2),
            encoding="utf-8",
        )

        return manifest

    def save_manifest(self, manifest: RunManifest) -> None:
        manifest.manifest_path.write_text(
            manifest.model_dump_json(indent=2),
            encoding="utf-8",
        )

    def _json_default(self, value: Any) -> str:
        if isinstance(value, datetime):
            return value.isoformat()
        if isinstance(value, date):
            return value.isoformat()
        if isinstance(value, Path):
            return str(value)
        raise TypeError(f"Object of type {value.__class__.__name__} is not JSON serializable")
