"""African Development Bank (AfDB) Open Data client.

Docs:  https://dataportal.opendataforafrica.org/
API:   https://dataportal.opendataforafrica.org/api/1.0/
Format: JSON (Knoema-compatible API)

Coverage: 54 African countries.
No API key required — public access.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

LOGGER = logging.getLogger(__name__)

# African countries ISO3 list
_AFRICA_ISO3 = [
    "DZA", "AGO", "BEN", "BWA", "BFA", "BDI", "CPV", "CMR", "CAF", "TCD",
    "COM", "COD", "COG", "CIV", "DJI", "EGY", "GNQ", "ERI", "SWZ", "ETH",
    "GAB", "GMB", "GHA", "GIN", "GNB", "KEN", "LSO", "LBR", "LBY", "MDG",
    "MWI", "MLI", "MRT", "MUS", "MAR", "MOZ", "NAM", "NER", "NGA", "RWA",
    "STP", "SEN", "SLE", "SOM", "ZAF", "SSD", "SDN", "TZA", "TGO", "TUN",
    "UGA", "ZMB", "ZWE",
]


class AfdbClient:
    """Fetches development indicators from the AfDB Open Data Portal.

    The portal uses a Knoema-compatible REST API.

    Args:
        base_url: AfDB open data portal API base.
        timeout_seconds: HTTP timeout.
    """

    DEFAULT_BASE_URL = "https://dataportal.opendataforafrica.org/api/1.0"

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

    def fetch_dataset(
        self,
        dataset_id: str,
        variable_id: str,
    ) -> list[tuple[str, int, float]]:
        """Fetch one variable from an AfDB Open Data dataset.

        Args:
            dataset_id: Knoema/AfDB dataset ID (e.g., ``"AFDBNAIGEG2019"``).
            variable_id: Variable/series code within the dataset.

        Returns:
            List of (iso3, year, value) tuples for African countries.
        """
        url = f"{self._base_url}/data/{dataset_id}"
        params = {
            "variable": variable_id,
            "countries": ",".join(_AFRICA_ISO3),
        }
        try:
            data = self._get_json(url, params=params)
            return self._parse_knoema_response(data)
        except Exception as exc:
            LOGGER.warning("AfDB fetch failed for %s/%s: %s",
                           dataset_id, variable_id, exc)
            return []

    # ------------------------------------------------------------------
    # Parser (Knoema-style response)
    # ------------------------------------------------------------------

    def _parse_knoema_response(self, data: Any) -> list[tuple[str, int, float]]:
        results: list[tuple[str, int, float]] = []
        if not isinstance(data, (list, dict)):
            return results

        records = (
            data if isinstance(data, list)
            else (data.get("data") or data.get("records") or [])
        )

        for rec in records:
            if not isinstance(rec, dict):
                continue
            # Knoema typically provides: Country, Time, Value
            country = (rec.get("country") or rec.get("Country") or
                       rec.get("geo") or rec.get("Geo") or "")
            year_raw = rec.get("time") or rec.get("Time") or rec.get("year")
            value_raw = rec.get("value") or rec.get("Value")

            if not country or year_raw is None or value_raw is None:
                continue
            try:
                year = int(str(year_raw)[:4])
                value = float(value_raw)
            except (ValueError, TypeError):
                continue

            # Country may be ISO3 or ISO2 or name — keep ISO3 only
            if len(str(country)) == 3:
                results.append((str(country).upper(), year, value))

        return results

    @retry(
        reraise=True,
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=3, max=30),
        retry=retry_if_exception_type(httpx.HTTPError),
    )
    def _get_json(self, url: str, params: dict[str, str] | None = None) -> Any:
        with httpx.Client(timeout=self._timeout) as client:
            resp = client.get(url, params=params, headers={"Accept": "application/json"})
            resp.raise_for_status()
            return resp.json()