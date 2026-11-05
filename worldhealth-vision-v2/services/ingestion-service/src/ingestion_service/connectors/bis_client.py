"""Bank for International Settlements (BIS) SDMX REST API client.

Docs:  https://stats.bis.org/api/v2/
Base:  https://stats.bis.org/api/v2/data/{agency},{dataflow},{version}/{key}
Format: SDMX JSON 2.1 (jsondata)

No API key required — public access.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

LOGGER = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# BIS country code → ISO3 mapping
# BIS uses ISO 3166-1 alpha-2 codes for most countries.
# A few aggregate / supra-national codes are skipped.
# ---------------------------------------------------------------------------

_BIS_TO_ISO3: dict[str, str] = {
    # Americas
    "US": "USA", "CA": "CAN", "MX": "MEX", "BR": "BRA", "AR": "ARG",
    "CL": "CHL", "CO": "COL", "PE": "PER",
    # Europe
    "AT": "AUT", "BE": "BEL", "CH": "CHE", "CZ": "CZE", "DE": "DEU",
    "DK": "DNK", "ES": "ESP", "FI": "FIN", "FR": "FRA", "GB": "GBR",
    "GR": "GRC", "HU": "HUN", "IE": "IRL", "IS": "ISL", "IT": "ITA",
    "LU": "LUX", "NL": "NLD", "NO": "NOR", "PL": "POL", "PT": "PRT",
    "RO": "ROU", "RU": "RUS", "SE": "SWE", "SK": "SVK", "TR": "TUR",
    "BG": "BGR", "HR": "HRV", "EE": "EST", "LT": "LTU", "LV": "LVA",
    "SI": "SVN", "CY": "CYP", "MT": "MLT",
    # Asia-Pacific
    "JP": "JPN", "CN": "CHN", "KR": "KOR", "IN": "IND", "AU": "AUS",
    "NZ": "NZL", "HK": "HKG", "SG": "SGP", "TH": "THA", "ID": "IDN",
    "MY": "MYS", "PH": "PHL", "TW": "TWN",
    # Middle East / Africa
    "SA": "SAU", "AE": "ARE", "ZA": "ZAF", "NG": "NGA", "EG": "EGY",
    "IL": "ISR",
}

# Aggregate codes to skip
_BIS_SKIP: frozenset[str] = frozenset({
    "XM",   # Euro area
    "XS",   # BIS reporting area
    "5J",   # All countries
    "A1",   # OECD member countries
    "B0",   # Major advanced economies (G7)
    "G5",   # G5
    "G10",  # G10
    "G20",  # G20
    "EU",   # European Union
})


class BisClient:
    """Fetches statistical datasets from the BIS SDMX REST API v2.

    The BIS API returns SDMX JSON 2.1 with series keyed by dimension-index
    combinations.  This client flattens the cube into
    ``(iso3, year, value)`` tuples, averaging monthly/quarterly obs to annual.

    Args:
        base_url: BIS SDMX API base (default: https://stats.bis.org/api/v2).
        timeout_seconds: HTTP timeout.
    """

    DEFAULT_BASE_URL = "https://stats.bis.org/api/v2"

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

    def fetch_policy_rates_annual(self) -> list[tuple[str, int, float]]:
        """Fetch central bank policy rates (annual average from monthly).

        Dataset: WS_CBPOL_D  (SDMX flow: BIS,WS_CBPOL_D,1.0)
        Dimension key: M.. (monthly, all countries, all instruments)

        Returns:
            List of (iso3, year, annual_average_pct) tuples.
        """
        url = (
            f"{self._base_url}/data/BIS,WS_CBPOL_D,1.0"
            "/M../?"
            "format=jsondata&startPeriod=1990-01"
        )
        raw = self._get_json(url)
        return self._parse_monthly_to_annual(raw)

    def fetch_private_credit_gdp_annual(self) -> list[tuple[str, int, float]]:
        """Fetch total credit to private non-financial sector (% of GDP).

        Dataset: WS_TC_Q  Dimensions: FREQ / BORROWER_CTY / LENDER_CTY /
                           ARENA / UNIT_TYPE / UNIT_EXP

        Key: Q.P.770.A.P.A  →  Quarterly, Private sector, All countries,
                                All lenders, % GDP, Adjusted

        Returns:
            List of (iso3, year, pct_gdp) tuples (Q4 value per year).
        """
        url = (
            f"{self._base_url}/data/BIS,WS_TC_Q,1.0"
            "/Q.P.770.A.P.A/?"
            "format=jsondata&startPeriod=1990-Q1"
        )
        raw = self._get_json(url)
        return self._parse_quarterly_to_annual(raw)

    # ------------------------------------------------------------------
    # SDMX JSON 2.1 parsers
    # ------------------------------------------------------------------

    def _parse_monthly_to_annual(
        self, data: dict[str, Any]
    ) -> list[tuple[str, int, float]]:
        """Parse SDMX JSON 2.1 — monthly series → annual averages."""
        try:
            structure = data["data"]["structures"][0]
            dataset = data["data"]["dataSets"][0]
        except (KeyError, IndexError):
            LOGGER.warning("BIS: unexpected SDMX JSON structure")
            return []

        # Build dimension value lists
        series_dims = structure["dimensions"]["series"]
        obs_dims = structure["dimensions"]["observation"]

        # Find REF_AREA dimension index
        ref_area_idx = next(
            (i for i, d in enumerate(series_dims) if d["id"] == "REF_AREA"),
            None,
        )
        if ref_area_idx is None:
            LOGGER.warning("BIS: REF_AREA dimension not found")
            return []

        ref_area_values = series_dims[ref_area_idx]["values"]

        # Time period values
        time_values = obs_dims[0]["values"] if obs_dims else []

        results: list[tuple[str, int, float]] = []
        year_acc: dict[tuple[str, int], list[float]] = {}

        for series_key, series_data in dataset["series"].items():
            parts = series_key.split(":")
            try:
                area_code = ref_area_values[int(parts[ref_area_idx])]["id"]
            except (IndexError, ValueError, KeyError):
                continue

            if area_code in _BIS_SKIP:
                continue
            iso3 = _BIS_TO_ISO3.get(area_code)
            if not iso3:
                continue

            observations = series_data.get("observations", {})
            for obs_idx_str, obs_vals in observations.items():
                if not obs_vals or obs_vals[0] is None:
                    continue
                try:
                    time_id = time_values[int(obs_idx_str)]["id"]  # e.g. "2023-06"
                    year = int(time_id[:4])
                    value = float(obs_vals[0])
                except (IndexError, ValueError, KeyError):
                    continue
                year_acc.setdefault((iso3, year), []).append(value)

        for (iso3, year), vals in year_acc.items():
            avg = sum(vals) / len(vals)
            results.append((iso3, year, round(avg, 4)))

        return results

    def _parse_quarterly_to_annual(
        self, data: dict[str, Any]
    ) -> list[tuple[str, int, float]]:
        """Parse SDMX JSON 2.1 — quarterly series → annual (Q4 value)."""
        try:
            structure = data["data"]["structures"][0]
            dataset = data["data"]["dataSets"][0]
        except (KeyError, IndexError):
            LOGGER.warning("BIS: unexpected SDMX JSON structure (quarterly)")
            return []

        series_dims = structure["dimensions"]["series"]
        obs_dims = structure["dimensions"]["observation"]

        # Find BORROWER_CTY or REF_AREA
        country_dim_idx = next(
            (i for i, d in enumerate(series_dims)
             if d["id"] in ("BORROWER_CTY", "REF_AREA")),
            None,
        )
        if country_dim_idx is None:
            LOGGER.warning("BIS: country dimension not found in quarterly dataset")
            return []

        country_values = series_dims[country_dim_idx]["values"]
        time_values = obs_dims[0]["values"] if obs_dims else []

        results: list[tuple[str, int, float]] = []
        q4_values: dict[tuple[str, int], float] = {}

        for series_key, series_data in dataset["series"].items():
            parts = series_key.split(":")
            try:
                area_code = country_values[int(parts[country_dim_idx])]["id"]
            except (IndexError, ValueError, KeyError):
                continue

            if area_code in _BIS_SKIP:
                continue
            iso3 = _BIS_TO_ISO3.get(area_code)
            if not iso3:
                continue

            observations = series_data.get("observations", {})
            for obs_idx_str, obs_vals in observations.items():
                if not obs_vals or obs_vals[0] is None:
                    continue
                try:
                    time_id = time_values[int(obs_idx_str)]["id"]  # e.g. "2023-Q4"
                    year = int(time_id[:4])
                    quarter = time_id[-2:]  # "Q4"
                    value = float(obs_vals[0])
                except (IndexError, ValueError, KeyError):
                    continue

                # Prefer Q4; if no Q4 exists yet, accept any quarter
                if quarter == "Q4":
                    q4_values[(iso3, year)] = value
                elif (iso3, year) not in q4_values:
                    q4_values[(iso3, year)] = value

        for (iso3, year), val in q4_values.items():
            results.append((iso3, year, round(val, 4)))

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
                    "Accept": "application/vnd.sdmx.data+json;version=2.1, application/json;q=0.5",
                    "User-Agent": "WorldHealthVision/2.0 (+https://worldhealthvision.com)",
                },
            )
            resp.raise_for_status()
            return resp.json()