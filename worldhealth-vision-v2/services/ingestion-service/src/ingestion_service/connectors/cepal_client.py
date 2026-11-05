"""CEPAL/ECLAC CEPALSTAT API client.

Docs:  https://estadisticas.cepal.org/cepalstat/
API:   https://estadisticas.cepal.org/cepalstat/api/v1/
Format: JSON

Coverage: Latin America and the Caribbean (LAC) — 33 countries.
No API key required — public access.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

LOGGER = logging.getLogger(__name__)

# LAC countries covered by CEPAL
_LAC_ISO3 = [
    "ARG", "BOL", "BRA", "CHL", "COL", "CRI", "CUB", "DOM", "ECU", "SLV",
    "GTM", "HTI", "HND", "JAM", "MEX", "NIC", "PAN", "PRY", "PER", "TTO",
    "URY", "VEN", "BLZ", "GUY", "SUR", "BRB", "GRD", "ATG", "DMA", "LCA",
    "VCT", "KNA", "TTO",
]


class CepalClient:
    """Fetches statistical data from CEPAL/ECLAC CEPALSTAT.

    The CEPALSTAT API provides socioeconomic indicators for Latin America
    and the Caribbean, disaggregated by country and year.

    Args:
        base_url: CEPALSTAT API base URL.
        timeout_seconds: HTTP timeout.
    """

    DEFAULT_BASE_URL = "https://estadisticas.cepal.org/cepalstat/api/v1"

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
        cepal_indicator_id: str,
    ) -> list[tuple[str, int, float]]:
        """Fetch one CEPALSTAT indicator for all LAC countries.

        Args:
            cepal_indicator_id: CEPALSTAT indicator ID (numeric string).

        Returns:
            List of (iso3, year, value) tuples.
        """
        url = f"{self._base_url}/indicators/{cepal_indicator_id}/data"
        try:
            data = self._get_json(url)
            return self._parse_response(data)
        except Exception as exc:
            LOGGER.warning("CEPAL fetch failed for indicator %s: %s",
                           cepal_indicator_id, exc)
            return []

    # ------------------------------------------------------------------
    # Parser
    # ------------------------------------------------------------------

    def _parse_response(self, data: Any) -> list[tuple[str, int, float]]:
        results: list[tuple[str, int, float]] = []
        if not isinstance(data, (list, dict)):
            return results

        records = (
            data if isinstance(data, list)
            else (data.get("data") or data.get("results") or [])
        )

        for rec in records:
            if not isinstance(rec, dict):
                continue
            iso3 = (rec.get("iso3") or rec.get("countryIso3") or
                    rec.get("country_iso3") or rec.get("isoCode"))
            year_raw = rec.get("year") or rec.get("anio") or rec.get("Year")
            value_raw = rec.get("value") or rec.get("valor") or rec.get("Value")

            if not iso3 or year_raw is None or value_raw is None:
                continue
            try:
                year = int(year_raw)
                value = float(str(value_raw).replace(",", ""))
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
    def _get_json(self, url: str) -> Any:
        with httpx.Client(timeout=self._timeout) as client:
            resp = client.get(url, headers={"Accept": "application/json"})
            resp.raise_for_status()
            return resp.json()