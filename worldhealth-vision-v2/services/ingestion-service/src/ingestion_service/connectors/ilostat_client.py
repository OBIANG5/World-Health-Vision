import csv
import io
from typing import Any

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential


class IloStatClient:
    def __init__(self, base_url: str, timeout_seconds: int) -> None:
        self._base_url = base_url.rstrip("/")
        self._timeout_seconds = timeout_seconds
        self._headers = {
            "User-Agent": "Mozilla/5.0 (compatible; WorldHealthVision/0.1; +https://worldhealthvision.local)",
            "Accept": "text/csv,application/json;q=0.9,*/*;q=0.8",
        }

    @retry(
        reraise=True,
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        retry=retry_if_exception_type(httpx.HTTPError),
    )
    def fetch_indicator_rows(self, download_id: str) -> list[dict[str, str]]:
        params = {
            "format": ".csv",
            "id": download_id,
            "lang": "en",
            "type": "code",
        }

        with httpx.Client(timeout=self._timeout_seconds, headers=self._headers, follow_redirects=True) as client:
            response = client.get(self._base_url, params=params)
            response.raise_for_status()

        reader = csv.DictReader(io.StringIO(response.text.lstrip("\ufeff")))
        return [self._normalize_row(row) for row in reader]

    def describe_source(self, download_id: str) -> dict[str, Any]:
        return {
            "downloadUrl": f"{self._base_url}?format=.csv&id={download_id}&lang=en&type=code",
            "downloadId": download_id,
        }

    def _normalize_row(self, row: dict[str, str | None]) -> dict[str, str]:
        return {
            key: (value.strip() if value is not None else "")
            for key, value in row.items()
        }
