"""European Central Bank (ECB) Statistical Data Warehouse API client.

Docs:  https://data-api.ecb.europa.eu/
Base:  https://data-api.ecb.europa.eu/service/data/{flowRef}/{key}
Format: SDMX-JSON 1.0 (top-level 'structure' + 'dataSets')

No API key required — public access.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

LOGGER = logging.getLogger(__name__)

# ECB ISO2 → ISO3 mapping (EU/EEA + candidate countries)
_ECB_TO_ISO3: dict[str, str] = {
    "AT": "AUT", "BE": "BEL", "BG": "BGR", "CY": "CYP", "CZ": "CZE",
    "DE": "DEU", "DK": "DNK", "EE": "EST", "ES": "ESP", "FI": "FIN",
    "FR": "FRA", "GR": "GRC", "HR": "HRV", "HU": "HUN", "IE": "IRL",
    "IS": "ISL", "IT": "ITA", "LT": "LTU", "LU": "LUX", "LV": "LVA",
    "MT": "MLT", "NL": "NLD", "NO": "NOR", "PL": "POL", "PT": "PRT",
    "RO": "ROU", "SE": "SWE", "SI": "SVN", "SK": "SVK", "GB": "GBR",
    "CH": "CHE", "RS": "SRB", "MK": "MKD", "AL": "ALB", "ME": "MNE",
    "BA": "BIH", "TR": "TUR", "UA": "UKR",
}

# Aggregate / supra-national ECB codes to skip
_ECB_SKIP: frozenset[str] = frozenset({
    "U2", "U4", "D5", "D6", "EU", "I9", "OE", "XM", "X0",
})


class EcbClient:
    """Fetches statistical data from the ECB Statistical Data Warehouse.

    The ECB API returns SDMX-JSON 1.0 with top-level 'structure' and
    'dataSets' keys (different from SDMX-JSON 2.1 used by BIS).

    Args:
        base_url: ECB SDW API service base.
        timeout_seconds: HTTP timeout.
    """

    DEFAULT_BASE_URL = "https://data-api.ecb.europa.eu/service"

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

    # ECB API does not support wildcard * for REF_AREA — must list country codes explicitly
    _COUNTRY_CODES: str = "+".join(sorted(_ECB_TO_ISO3.keys()))

    def fetch_hicp_annual(self) -> list[tuple[str, int, float]]:
        """Fetch HICP inflation — annual average of monthly rates."""
        url = (
            f"{self._base_url}/data/ICP"
            f"/M.{self._COUNTRY_CODES}.N.000000.4.ANR"
            "?startPeriod=1990-01"
        )
        raw = self._get_json(url)
        return self._parse_monthly_to_annual(raw)

    def fetch_long_term_rates_annual(self) -> list[tuple[str, int, float]]:
        """Fetch long-term government bond yields (10Y) — annual average."""
        url = (
            f"{self._base_url}/data/IRS"
            f"/M.{self._COUNTRY_CODES}.L.L40.CI.0.EUR.N.Z"
            "?startPeriod=1990-01"
        )
        raw = self._get_json(url)
        return self._parse_monthly_to_annual(raw)

    # ------------------------------------------------------------------
    # SDMX-JSON 1.0 parser (ECB format)
    # ------------------------------------------------------------------

    def _parse_monthly_to_annual(
        self,
        data: dict[str, Any],
        country_dim_id: str = "REF_AREA",
    ) -> list[tuple[str, int, float]]:
        """Parse ECB SDMX-JSON 1.0 monthly series → annual averages.

        ECB 1.0 structure differs from BIS 2.1:
        - Top-level 'structure' (not nested under 'data')
        - Top-level 'dataSets' list
        """
        try:
            structure = data["structure"]
            dataset = data["dataSets"][0]
        except (KeyError, IndexError):
            LOGGER.warning("ECB: unexpected SDMX-JSON structure (missing keys)")
            return []

        series_dims: list[dict] = (
            structure.get("dimensions", {}).get("series", [])
        )
        obs_dims: list[dict] = (
            structure.get("dimensions", {}).get("observation", [])
        )

        ref_area_idx = next(
            (i for i, d in enumerate(series_dims) if d.get("id") == country_dim_id),
            None,
        )
        if ref_area_idx is None:
            LOGGER.warning("ECB: %s dimension not found in series dimensions", country_dim_id)
            return []

        ref_area_values: list[dict] = series_dims[ref_area_idx].get("values", [])
        time_values: list[dict] = obs_dims[0].get("values", []) if obs_dims else []

        year_acc: dict[tuple[str, int], list[float]] = {}

        for series_key, series_data in dataset.get("series", {}).items():
            parts = series_key.split(":")
            try:
                area_code: str = ref_area_values[int(parts[ref_area_idx])]["id"]
            except (IndexError, ValueError, KeyError):
                continue

            if area_code in _ECB_SKIP:
                continue
            iso3 = _ECB_TO_ISO3.get(area_code)
            if not iso3:
                continue

            for obs_idx_str, obs_vals in series_data.get("observations", {}).items():
                if not obs_vals or obs_vals[0] is None:
                    continue
                try:
                    time_id: str = time_values[int(obs_idx_str)]["id"]  # "2023-06"
                    year = int(time_id[:4])
                    value = float(obs_vals[0])
                except (IndexError, ValueError, KeyError):
                    continue
                year_acc.setdefault((iso3, year), []).append(value)

        results: list[tuple[str, int, float]] = []
        for (iso3, year), vals in year_acc.items():
            results.append((iso3, year, round(sum(vals) / len(vals), 4)))
        return results

    @retry(
        reraise=True,
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=3, max=30),
        retry=retry_if_exception_type(httpx.HTTPError),
    )
    def _get_json(self, url: str) -> dict[str, Any]:
        with httpx.Client(timeout=self._timeout) as client:
            resp = client.get(
                url,
                headers={
                    "Accept": "application/vnd.sdmx.data+json",
                    "User-Agent": "WorldHealthVision/2.0",
                },
            )
            resp.raise_for_status()
            return resp.json()