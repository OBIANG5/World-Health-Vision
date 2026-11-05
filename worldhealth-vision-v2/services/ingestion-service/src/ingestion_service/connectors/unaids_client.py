"""UNAIDS AIDSinfo public data API client.

Docs:  https://aidsinfo.unaids.org/
API:   https://aidsinfo.unaids.org/public-api/v1.0/
Format: JSON

No API key required — public access to aggregated HIV statistics.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

LOGGER = logging.getLogger(__name__)


class UnaidsClient:
    """Fetches HIV/AIDS statistics from the UNAIDS AIDSinfo API.

    The AIDSinfo API provides aggregated statistics on HIV prevalence,
    people living with HIV, and ART coverage for UN member states.

    Args:
        base_url: AIDSinfo API base.
        timeout_seconds: HTTP timeout.
    """

    DEFAULT_BASE_URL = "https://aidsinfo.unaids.org/public-api/v1.0"

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
        indicator_id: str,
        gender: str = "All",
        age_group: str = "All ages",
    ) -> list[tuple[str, int, float]]:
        """Fetch one AIDSinfo indicator for all countries.

        Args:
            indicator_id: AIDSinfo indicator identifier (e.g., ``"1"`` for prevalence).
            gender: Gender filter (``"All"``, ``"Male"``, ``"Female"``).
            age_group: Age group filter.

        Returns:
            List of (iso3, year, value) tuples.
        """
        params = {
            "indicatorId": indicator_id,
            "gender": gender,
            "ageGroup": age_group,
        }
        try:
            data = self._get_json(f"{self._base_url}/indicators/data", params=params)
            return self._parse_response(data)
        except Exception as exc:
            LOGGER.warning("UNAIDS fetch failed for indicator %s: %s", indicator_id, exc)
            return []

    # ------------------------------------------------------------------
    # Parser
    # ------------------------------------------------------------------

    def _parse_response(self, data: Any) -> list[tuple[str, int, float]]:
        results: list[tuple[str, int, float]] = []
        if not isinstance(data, (list, dict)):
            return results

        records = data if isinstance(data, list) else (
            data.get("data") or data.get("results") or data.get("items") or []
        )

        for rec in records:
            if not isinstance(rec, dict):
                continue
            # Field names vary by API version
            iso3 = (rec.get("iso3") or rec.get("countryIso3") or
                    rec.get("country_iso3") or rec.get("ISO3"))
            year_raw = rec.get("year") or rec.get("Year")
            value_raw = (rec.get("value") or rec.get("Value") or
                         rec.get("estimate") or rec.get("Estimate"))
            if not iso3 or year_raw is None or value_raw is None:
                continue
            try:
                year = int(year_raw)
                value = float(str(value_raw).replace(",", "").replace("%", ""))
            except (ValueError, TypeError):
                continue
            if len(str(iso3)) == 3:
                results.append((str(iso3).upper(), year, value))

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