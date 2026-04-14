from typing import Any

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from ingestion_service.models import IndicatorObservation, RunManifest


class TimeseriesClient:
    def __init__(self, base_url: str, timeout_seconds: int) -> None:
        self._base_url = base_url.rstrip("/")
        self._timeout_seconds = timeout_seconds

    @retry(
        reraise=True,
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        retry=retry_if_exception_type(httpx.HTTPError),
    )
    def publish_indicator_observations(
        self,
        *,
        source_code: str,
        dataset_code: str,
        manifest: RunManifest,
        observations: list[IndicatorObservation],
    ) -> dict[str, Any]:
        payload = {
            "sourceCode": source_code,
            "datasetCode": dataset_code,
            "runKey": manifest.run_id,
            "fetchedAtUtc": manifest.fetched_at_utc.isoformat(),
            "bronzeRawPayloadPath": str(manifest.raw_payload_path),
            "bronzeNormalizedPayloadPath": str(manifest.normalized_payload_path),
            "recordCount": manifest.record_count,
            "notes": manifest.notes,
            "items": [self._serialize_observation(item) for item in observations],
        }

        with httpx.Client(base_url=self._base_url, timeout=self._timeout_seconds) as client:
            response = client.post("/internal/timeseries/ingestion/observation-batches", json=payload)
            response.raise_for_status()
            return response.json()

    def _serialize_observation(self, observation: IndicatorObservation) -> dict[str, Any]:
        value_status = observation.value_status or ("OBSERVED" if observation.value is not None else "MISSING")

        return {
            "indicatorCode": observation.indicator_code,
            "countryIso3": observation.country_iso3,
            "periodGranularity": observation.period_granularity,
            "periodStart": observation.period_start.isoformat(),
            "periodEnd": observation.period_end.isoformat(),
            "periodLabel": observation.period_label,
            "numericValue": observation.value,
            "valueStatus": value_status,
            "sourcePublishedAt": observation.source_published_at.isoformat() if observation.source_published_at is not None else None,
            "sourceMetadata": {
                "sourcePeriodLabel": observation.period_label,
                "sourceYear": str(observation.period_start.year),
                **observation.source_metadata,
            },
            "qualityFlags": observation.quality_flags,
        }
