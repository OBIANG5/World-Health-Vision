"""ADB Key Indicators Database (KIDB) client.

Docs:  https://kidb.adb.org/kidb/
API:   https://kidb.adb.org/api/v2/fetch
Format: JSON

Country identification: ISO3 codes (economy parameter).
No API key required — public access.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

LOGGER = logging.getLogger(__name__)

# Asia-Pacific ISO3 codes covered by ADB
_ADB_ECONOMIES = [
    "AFG", "ARM", "AZE", "BGD", "BHU", "BRN", "KHM", "CHN", "COK", "FJI",
    "GEO", "IND", "IDN", "KAZ", "KIR", "KGZ", "LAO", "MYS", "MDV", "MHL",
    "FSM", "MNG", "MMR", "NRU", "NPL", "PAK", "PLW", "PNG", "PHL", "WSM",
    "SLB", "LKA", "TJK", "TLS", "TON", "TKM", "TUV", "UZB", "VUT", "VNM",
]


class AdbKidbClient:
    """Fetches development indicators from the ADB KIDB API.

    The KIDB API endpoint accepts ISO3 economy codes and returns
    time-series data in JSON format.

    Args:
        base_url: KIDB API base URL.
        timeout_seconds: HTTP timeout.
    """

    DEFAULT_BASE_URL = "https://kidb.adb.org/api/v2"

    def __init__(
        self,
        base_url: str = DEFAULT_BASE_URL,
        timeout_seconds: int = 120,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout_seconds

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def fetch_indicator(
        self,
        kidb_item_code: str,
        start_year: int = 1990,
        end_year: int = 2024,
    ) -> list[tuple[str, int, float]]:
        """Fetch one KIDB indicator for all ADB economies.

        Args:
            kidb_item_code: KIDB item code (e.g., ``"GDP0000"``).
            start_year: First year.
            end_year: Last year.

        Returns:
            List of (iso3, year, value) tuples.
        """
        years = ",".join(str(y) for y in range(start_year, end_year + 1))
        economies = ",".join(_ADB_ECONOMIES)

        params = {
            "items": kidb_item_code,
            "years": years,
            "economies": economies,
        }

        try:
            data = self._get_json(f"{self._base_url}/fetch", params=params)
            return self._parse_response(data)
        except Exception as exc:
            LOGGER.warning("ADB KIDB fetch failed for %s: %s", kidb_item_code, exc)
            return []

    # ------------------------------------------------------------------
    # Parser
    # ------------------------------------------------------------------

    def _parse_response(self, data: Any) -> list[tuple[str, int, float]]:
        """Parse ADB KIDB JSON response into (iso3, year, value) tuples."""
        results: list[tuple[str, int, float]] = []

        if not isinstance(data, (list, dict)):
            return results

        # The KIDB API returns a list of records
        records = data if isinstance(data, list) else data.get("data", [])

        for record in records:
            if not isinstance(record, dict):
                continue
            # Typical fields: economy, year, value (or similar)
            economy = record.get("economy") or record.get("Economy") or record.get("iso3")
            year_raw = record.get("year") or record.get("Year")
            value_raw = record.get("value") or record.get("Value")

            if not economy or year_raw is None or value_raw is None:
                continue
            try:
                year = int(year_raw)
                value = float(value_raw)
            except (ValueError, TypeError):
                continue

            # Economy field should already be ISO3
            if len(str(economy)) == 3:
                results.append((str(economy).upper(), year, value))

        return results

    @retry(
        reraise=True,
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=3, max=30),
        retry=retry_if_exception_type(httpx.HTTPError),
    )
    def _get_json(self, url: str, params: dict[str, str] | None = None) -> Any:
        with httpx.Client(timeout=self._timeout) as client:
            resp = client.get(url, params=params)
            resp.raise_for_status()
            return resp.json()