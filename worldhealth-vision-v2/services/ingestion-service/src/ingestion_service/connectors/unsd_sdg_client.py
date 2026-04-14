from datetime import UTC, datetime
from typing import Any
from urllib.parse import urlencode

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential


class UnsdSdgClient:
    def __init__(
        self,
        *,
        base_url: str,
        timeout_seconds: int,
        page_size: int,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._timeout_seconds = timeout_seconds
        self._page_size = page_size

    @retry(
        reraise=True,
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        retry=retry_if_exception_type(httpx.HTTPError),
    )
    def fetch_series_observations(
        self,
        *,
        series_code: str,
        release_code: str | None = None,
        time_period_start: int | None = None,
        time_period_end: int | None = None,
    ) -> tuple[list[dict[str, Any]], dict[str, Any]]:
        observations: list[dict[str, Any]] = []
        page_number = 1
        total_pages = 1
        last_updated = self._fetch_last_updated()

        with httpx.Client(base_url=self._base_url, timeout=self._timeout_seconds, follow_redirects=True) as client:
            while page_number <= total_pages:
                params = {
                    "seriesCode": series_code,
                    "page": page_number,
                    "pageSize": self._page_size,
                }
                if release_code is not None:
                    params["releaseCode"] = release_code
                if time_period_start is not None:
                    params["timePeriodStart"] = time_period_start
                if time_period_end is not None:
                    params["timePeriodEnd"] = time_period_end

                response = client.get("/v1/sdg/Series/Data", params=params)
                response.raise_for_status()
                payload = response.json()
                observations.extend(payload.get("data", []))

                total_pages = int(payload.get("totalPages") or 0) or 1
                page_number += 1

        descriptor = {
            "baseUrl": self._base_url,
            "seriesCode": series_code,
            "releaseCode": release_code,
            "pageSize": self._page_size,
            "lastUpdatedAtUtc": last_updated,
            "downloadedAtUtc": datetime.now(UTC).isoformat(),
            "dataUrl": self._build_data_url(
                series_code=series_code,
                release_code=release_code,
                time_period_start=time_period_start,
                time_period_end=time_period_end,
            ),
        }
        return observations, descriptor

    def _fetch_last_updated(self) -> str | None:
        try:
            with httpx.Client(base_url=self._base_url, timeout=self._timeout_seconds, follow_redirects=True) as client:
                response = client.get("/v1/sdg/Series/LastUpdated")
                response.raise_for_status()
                payload = response.json()
        except httpx.HTTPError:
            return None

        return payload if isinstance(payload, str) and payload.strip() else None

    def _build_data_url(
        self,
        *,
        series_code: str,
        release_code: str | None,
        time_period_start: int | None,
        time_period_end: int | None,
    ) -> str:
        params: list[tuple[str, str]] = [("seriesCode", series_code)]
        if release_code is not None:
            params.append(("releaseCode", release_code))
        if time_period_start is not None:
            params.append(("timePeriodStart", str(time_period_start)))
        if time_period_end is not None:
            params.append(("timePeriodEnd", str(time_period_end)))
        params.append(("pageSize", str(self._page_size)))
        return f"{self._base_url}/v1/sdg/Series/Data?{urlencode(params)}"
