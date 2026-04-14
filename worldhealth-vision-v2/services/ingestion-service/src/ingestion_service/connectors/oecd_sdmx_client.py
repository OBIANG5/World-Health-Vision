import csv
import io
from datetime import UTC, datetime

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential


class OecdSdmxCsvClient:
    def __init__(self, base_url: str, timeout_seconds: int) -> None:
        self._base_url = base_url.rstrip("/")
        self._timeout_seconds = timeout_seconds

    @retry(
        reraise=True,
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        retry=retry_if_exception_type(httpx.HTTPError),
    )
    def fetch_data_rows(
        self,
        *,
        dataflow_agency: str,
        dataflow_id: str,
        data_query: str,
    ) -> list[dict[str, str]]:
        with httpx.Client(
            base_url=self._base_url,
            timeout=self._timeout_seconds,
            follow_redirects=True,
            headers=self._default_headers(),
        ) as client:
            response = client.get(
                f"/data/{dataflow_agency},{dataflow_id}/{data_query}",
                params={"format": "csvfile"},
            )
            response.raise_for_status()
            payload = response.text

        return list(csv.DictReader(io.StringIO(payload)))

    def describe_source(
        self,
        *,
        dataflow_agency: str,
        dataflow_id: str,
        data_query: str,
    ) -> dict[str, object]:
        return {
            "dataflowAgency": dataflow_agency,
            "dataflowId": dataflow_id,
            "dataQuery": data_query,
            "downloadUrl": (
                f"{self._base_url}/data/{dataflow_agency},{dataflow_id}/{data_query}?format=csvfile"
            ),
            "downloadedAtUtc": datetime.now(UTC).isoformat(),
        }

    def _default_headers(self) -> dict[str, str]:
        return {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/135.0.0.0 Safari/537.36"
            ),
            "Accept": "text/csv,application/json;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }
