from typing import Any

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential


class WorldBankClient:
    def __init__(self, base_url: str, timeout_seconds: int, page_size: int) -> None:
        self._base_url = base_url.rstrip("/")
        self._timeout_seconds = timeout_seconds
        self._page_size = page_size

    def fetch_countries(self) -> list[dict[str, Any]]:
        payload = self._get_json("/country", {"format": "json", "per_page": 400})
        return payload[1]

    def fetch_indicator_all_countries(
        self,
        indicator_code: str,
        source_id: str | None = None,
        country_iso3s: set[str] | None = None,
    ) -> list[dict[str, Any]]:
        # The World Bank API supports semicolon-separated countries.
        # Restricting an operational pilot avoids fetching every country
        # and the avoidable 502 failures on later pages.
        country_path = "all"
        if country_iso3s is not None:
            if not country_iso3s or any(len(code) != 3 or not code.isalpha() for code in country_iso3s):
                raise ValueError("World Bank country scope requires valid three-letter country codes")
            country_path = ";".join(sorted(code.upper() for code in country_iso3s))
        params: dict[str, Any] = {
            "format": "json",
            "per_page": self._page_size,
            "page": 1,
        }
        if source_id is not None:
            params["source"] = source_id

        first_page = self._get_json(
            f"/country/{country_path}/indicator/{indicator_code}",
            params,
        )

        metadata = first_page[0]
        pages = int(metadata["pages"])
        rows = list(first_page[1])

        for page in range(2, pages + 1):
            page_params: dict[str, Any] = {
                "format": "json",
                "per_page": self._page_size,
                "page": page,
            }
            if source_id is not None:
                page_params["source"] = source_id
            page_payload = self._get_json(
                f"/country/{country_path}/indicator/{indicator_code}",
                page_params,
            )
            rows.extend(page_payload[1])

        return rows

    @retry(
        reraise=True,
        stop=stop_after_attempt(4),
        wait=wait_exponential(multiplier=1, min=1, max=12),
        retry=retry_if_exception_type(httpx.HTTPError),
    )
    def _get_json(self, path: str, params: dict[str, Any]) -> list[dict[str, Any]]:
        timeout = httpx.Timeout(
            connect=min(self._timeout_seconds, 20.0),
            read=self._timeout_seconds,
            write=self._timeout_seconds,
            pool=self._timeout_seconds,
        )

        with httpx.Client(base_url=self._base_url, timeout=timeout) as client:
            response = client.get(path, params=params)
            response.raise_for_status()
            payload = response.json()
            if not isinstance(payload, list) or len(payload) < 2:
                raise ValueError(f"Unexpected World Bank payload for path={path}")
            return payload