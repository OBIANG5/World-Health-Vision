"""UNCTAD (United Nations Conference on Trade and Development) API client.

Docs:  https://unctadstat.unctad.org/EN/APIGuide.html
Base:  https://unctadstat-api.unctad.org/api/v2.0/
Format: JSON

No API key required — public access to aggregated trade and FDI statistics.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

LOGGER = logging.getLogger(__name__)


class UntctadClient:
    """Fetches trade and FDI statistics from the UNCTAD API.

    The UNCTAD API provides country-level data on FDI flows, trade,
    merchandise and services exports/imports via a REST-JSON interface.

    Args:
        base_url: UNCTAD API base.
        timeout_seconds: HTTP timeout.
    """

    DEFAULT_BASE_URL = "https://unctadstat-api.unctad.org/api/v2.0"

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

    def fetch_fdi_inflows(
        self,
        start_year: int = 1990,
    ) -> list[tuple[str, int, float]]:
        """Fetch FDI inflows (USD millions) for all countries.

        Dataset: US_FdiFlowsCountry
        Economy: all, Indicator: inward FDI flows

        Returns:
            List of (iso3, year, usd_millions) tuples.
        """
        return self._fetch_dataset(
            dataset_code="US_FdiFlowsCountry",
            extra_params={"indicator": "FdiFlowsInw", "frequency": "A"},
            start_year=start_year,
        )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _fetch_dataset(
        self,
        dataset_code: str,
        extra_params: dict[str, str] | None = None,
        start_year: int = 1990,
    ) -> list[tuple[str, int, float]]:
        params: dict[str, Any] = {
            "startPeriod": str(start_year),
            **(extra_params or {}),
        }
        try:
            data = self._get_json(f"{self._base_url}/data/{dataset_code}", params=params)
            return self._parse_response(data)
        except Exception as exc:
            LOGGER.warning("UNCTAD fetch failed for %s: %s", dataset_code, exc)
            return []

    def _parse_response(self, data: Any) -> list[tuple[str, int, float]]:
        """Parse UNCTAD REST JSON response (flexible field names)."""
        results: list[tuple[str, int, float]] = []
        if not isinstance(data, (list, dict)):
            return results

        records: list[Any] = (
            data
            if isinstance(data, list)
            else (
                data.get("data")
                or data.get("records")
                or data.get("items")
                or data.get("Data")
                or []
            )
        )

        for rec in records:
            if not isinstance(rec, dict):
                continue
            # UNCTAD field names vary across dataset versions
            iso3 = (
                rec.get("economyIso3")
                or rec.get("iso3")
                or rec.get("CountryISO3")
                or rec.get("reporter")
                or rec.get("Economy")
            )
            year_raw = (
                rec.get("year")
                or rec.get("Year")
                or rec.get("period")
                or rec.get("Time")
            )
            value_raw = (
                rec.get("value")
                or rec.get("Value")
                or rec.get("obs_value")
            )

            if not iso3 or year_raw is None or value_raw is None:
                continue
            try:
                year = int(str(year_raw)[:4])
                value = float(str(value_raw).replace(",", "").replace(" ", ""))
            except (ValueError, TypeError):
                continue

            if len(str(iso3)) == 3 and str(value_raw) not in ("", "N/A", ".."):
                results.append((str(iso3).upper(), year, value))

        return results

    @retry(
        reraise=True,
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=30),
        retry=retry_if_exception_type(httpx.HTTPError),
    )
    def _get_json(self, url: str, params: dict[str, Any] | None = None) -> Any:
        with httpx.Client(timeout=self._timeout) as client:
            resp = client.get(url, params=params, headers={"Accept": "application/json"})
            resp.raise_for_status()
            return resp.json()