"""UNESCO Institute for Statistics (UIS) SDMX API client.

Docs:  https://apiportal.uis.unesco.org/
Base:  https://api.uis.unesco.org/api/public/sdmx/1.0/rest/data/UIS,{dataflow}
Format: SDMX-JSON (similar to ECB 1.0)

API key required — obtain at: https://apiportal.uis.unesco.org/
Set env var: WHV_INGEST_UNESCOUIS_API_KEY
"""

from __future__ import annotations

import logging
from typing import Any

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

LOGGER = logging.getLogger(__name__)

# UNESCO UIS uses ISO3 codes directly in most dataflows
# Aggregate codes to skip
_UIS_SKIP: frozenset[str] = frozenset({
    "WORLD", "WLD", "LDC", "SSA", "LAC", "EAP", "SAS", "MENA", "ECA",
    "NAC", "WB_LI", "WB_LMI", "WB_UMI", "WB_HI",
})


class UnescoUisClient:
    """Fetches education statistics from the UNESCO Institute for Statistics SDMX API.

    The UIS API uses SDMX-JSON format (similar to ECB 1.0) with REF_AREA
    dimension containing ISO3 country codes.

    Args:
        base_url: UNESCO UIS SDMX API base.
        api_key: UIS API subscription key.
        timeout_seconds: HTTP timeout.
    """

    DEFAULT_BASE_URL = "https://api.uis.unesco.org/api/public/sdmx/1.0/rest"

    def __init__(
        self,
        base_url: str = DEFAULT_BASE_URL,
        api_key: str | None = None,
        timeout_seconds: int = 120,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._api_key = api_key
        self._timeout = timeout_seconds

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def fetch_out_of_school_rate_primary(
        self,
        start_year: int = 2000,
    ) -> list[tuple[str, int, float]]:
        """Fetch out-of-school rate for primary education (ROFST).

        Dataflow: UIS,ROFST,1.0
        Dimension key: A.PT.L1.ROFST.........._T..... (annual, all countries,
                        primary, ROFST indicator, total gender)

        Returns:
            List of (iso3, year, pct_out_of_school) tuples.
        """
        return self._fetch_sdmx(
            dataflow="ROFST",
            version="1.0",
            key=f"A..L1.ROFST._T..",
            start_year=start_year,
        )

    def fetch_literacy_rate_adult(
        self,
        start_year: int = 1990,
    ) -> list[tuple[str, int, float]]:
        """Fetch adult literacy rate (15+) from UNESCO UIS.

        Dataflow: UIS,LITERACY,1.0

        Returns:
            List of (iso3, year, pct_literate) tuples.
        """
        return self._fetch_sdmx(
            dataflow="LITERACY",
            version="1.0",
            key="A.._T.15PLUS.LITERACY_RATE..",
            start_year=start_year,
        )

    # ------------------------------------------------------------------
    # SDMX-JSON parser (reuses ECB 1.0 format logic)
    # ------------------------------------------------------------------

    def _fetch_sdmx(
        self,
        dataflow: str,
        version: str,
        key: str,
        start_year: int,
    ) -> list[tuple[str, int, float]]:
        url = (
            f"{self._base_url}/data/UIS,{dataflow},{version}"
            f"/{key}"
            f"?format=jsondata&startPeriod={start_year}"
        )
        try:
            data = self._get_json(url)
            return self._parse_sdmx(data)
        except Exception as exc:
            LOGGER.warning("UNESCO UIS fetch failed for %s: %s", dataflow, exc)
            return []

    def _parse_sdmx(self, data: dict[str, Any]) -> list[tuple[str, int, float]]:
        """Parse SDMX-JSON 1.0 response from UNESCO UIS."""
        try:
            structure = data["structure"]
            dataset = data["dataSets"][0]
        except (KeyError, IndexError):
            LOGGER.warning("UNESCO UIS: unexpected SDMX response structure")
            return []

        series_dims: list[dict] = structure.get("dimensions", {}).get("series", [])
        obs_dims: list[dict] = structure.get("dimensions", {}).get("observation", [])

        ref_area_idx = next(
            (i for i, d in enumerate(series_dims) if d.get("id") == "REF_AREA"),
            None,
        )
        if ref_area_idx is None:
            LOGGER.warning("UNESCO UIS: REF_AREA dimension not found")
            return []

        ref_area_values: list[dict] = series_dims[ref_area_idx].get("values", [])
        time_values: list[dict] = obs_dims[0].get("values", []) if obs_dims else []

        results: list[tuple[str, int, float]] = []

        for series_key, series_data in dataset.get("series", {}).items():
            parts = series_key.split(":")
            try:
                area_code: str = ref_area_values[int(parts[ref_area_idx])]["id"]
            except (IndexError, ValueError, KeyError):
                continue

            if area_code in _UIS_SKIP or len(area_code) != 3:
                continue

            for obs_idx_str, obs_vals in series_data.get("observations", {}).items():
                if not obs_vals or obs_vals[0] is None:
                    continue
                try:
                    time_id: str = time_values[int(obs_idx_str)]["id"]
                    year = int(str(time_id)[:4])
                    value = float(obs_vals[0])
                except (IndexError, ValueError, KeyError):
                    continue
                results.append((area_code.upper(), year, round(value, 4)))

        return results

    @retry(
        reraise=True,
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=3, max=30),
        retry=retry_if_exception_type(httpx.HTTPError),
    )
    def _get_json(self, url: str) -> dict[str, Any]:
        headers: dict[str, str] = {
            "Accept": "application/vnd.sdmx.data+json;version=1.0.0-wd",
        }
        if self._api_key:
            headers["Ocp-Apim-Subscription-Key"] = self._api_key
        with httpx.Client(timeout=self._timeout) as client:
            resp = client.get(url, headers=headers)
            resp.raise_for_status()
            return resp.json()