import os
from typing import Any

import httpx
from tenacity import retry, retry_if_exception, stop_after_attempt, wait_exponential

from ingestion_service.models import IndicatorObservation, RunManifest


def _retry_transient(exc: BaseException) -> bool:
    if isinstance(exc, httpx.TransportError):
        return True
    return isinstance(exc, httpx.HTTPStatusError) and exc.response.status_code in (
        429, 500, 502, 503, 504
    )


class TimeseriesClient:
    def __init__(
        self, base_url: str, timeout_seconds: int, *,
        ingestion_key: str | None = None,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._timeout_seconds = timeout_seconds
        # Client-side key is provisioned via private environment, never a
        # repository default or an untrusted source data payload.
        self._ingestion_key = (
            ingestion_key if ingestion_key is not None
            else os.environ.get("WHV_TIMESERIES_INTERNAL_INGESTION_KEY")
        )

    @retry(
        reraise=True,
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        retry=retry_if_exception(_retry_transient),
    )
    def publish_indicator_observations(
        self,
        *,
        source_code: str,
        dataset_code: str,
        manifest: RunManifest,
        observations: list[IndicatorObservation],
    ) -> dict[str, Any]:
        # Producer-side defense in depth. Receiver-side Java gate independently
        # enforces these restrictions so an attacker cannot bypass using HTTP.
        src, ds = source_code.strip().upper(), dataset_code.strip().upper()
        if src == "IBGE" or ds.startswith(("CENSO2022_4714", "WDI_POP_TOTAL_BRA_2022")):
            raise PermissionError("Private research source has no reviewed Timeseries publication rights.")
        if any(
            obs.indicator_code.startswith("IBGE.CENSUS2022.RESIDENT_POP")
            or (obs.country_iso3 == "BRA" and obs.indicator_code == "SP.POP.TOTL"
                and obs.period_start.year <= 2022 <= obs.period_end.year)
            for obs in observations
        ):
            raise PermissionError("Protected national 2022 population observation cannot be published.")
        for marker in ("licenseReviewStatus", "rightsReviewStatus", "publicationStatus", "timeseriesPublication"):
            if str(manifest.notes.get(marker, "")).upper() in (
                "REVIEW_REQUIRED", "NEEDS_PROVIDER_CLARIFICATION",
                "BRONZE_ONLY_UNREVIEWED", "NOT_ATTEMPTED",
                "REVOKED", "DENIED", "EXPIRED",
            ):
                raise PermissionError("Unreviewed source manifest must remain private.")
        payload = {
            "sourceCode": source_code,
            "datasetCode": dataset_code,
            "runKey": manifest.run_id,
            "fetchedAtUtc": manifest.fetched_at_utc.isoformat(),
            "bronzeRawPayloadPath": str(manifest.raw_payload_path),
            "bronzeNormalizedPayloadPath": str(manifest.normalized_payload_path),
            "recordCount": manifest.record_count,
            "notes": manifest.notes,
            "items": [self._serialize_observation(item, source_code=src) for item in observations],
        }

        if not self._ingestion_key or len(self._ingestion_key) < 32:
            raise RuntimeError(
                "Private Timeseries ingestion key not configured; refusing publication."
            )
        with httpx.Client(
            base_url=self._base_url, timeout=self._timeout_seconds, follow_redirects=False,
        ) as client:
            response = client.post(
                "/internal/timeseries/ingestion/observation-batches",
                json=payload,
                headers={"X-WHV-Ingestion-Key": self._ingestion_key},
            )
            response.raise_for_status()
            return response.json()

    def _serialize_observation(
        self, observation: IndicatorObservation, *, source_code: str | None = None,
    ) -> dict[str, Any]:
        value_status = observation.value_status or ("OBSERVED" if observation.value is not None else "MISSING")
        if source_code == "WORLD_BANK" and observation.indicator_code == "SP.POP.TOTL":
            # WDI population is a demographic midyear ESTIMATE. Older generic
            # connector observations have no explicit status; they must not be
            # silently promoted to a direct field observation.
            if observation.value_status in (None, "MIDYEAR_ESTIMATE", "ESTIMATED"):
                value_status = "ESTIMATED" if observation.value is not None else "MISSING"
            elif observation.value_status == "OBSERVED":
                raise ValueError("WDI population estimate cannot be published as an observed census.")
        if value_status not in {"OBSERVED", "ESTIMATED", "MISSING", "SUPPRESSED"}:
            raise ValueError("Observation status unsupported by canonical Timeseries model.")

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