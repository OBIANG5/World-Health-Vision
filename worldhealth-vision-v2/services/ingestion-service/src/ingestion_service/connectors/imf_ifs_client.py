"""IMF International Financial Statistics (IFS) JSON API client.

Docs:  https://datahelp.imf.org/knowledgebase/articles/838041
Base:  https://dataservices.imf.org/REST/SDMX_JSON.svc/
Format: SDMX Compact JSON (different from SDMX JSON 2.1)

No API key required — public access.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

LOGGER = logging.getLogger(__name__)

# IMF IFS uses ISO2 codes for most countries, with a few exceptions.
_IFS_ISO2_TO_ISO3: dict[str, str] = {
    "AF": "AFG", "AL": "ALB", "DZ": "DZA", "AO": "AGO", "AR": "ARG",
    "AM": "ARM", "AU": "AUS", "AT": "AUT", "AZ": "AZE", "BH": "BHR",
    "BD": "BGD", "BY": "BLR", "BE": "BEL", "BZ": "BLZ", "BJ": "BEN",
    "BO": "BOL", "BA": "BIH", "BW": "BWA", "BR": "BRA", "BN": "BRN",
    "BG": "BGR", "BF": "BFA", "BI": "BDI", "CV": "CPV", "KH": "KHM",
    "CM": "CMR", "CA": "CAN", "CF": "CAF", "TD": "TCD", "CL": "CHL",
    "CN": "CHN", "CO": "COL", "KM": "COM", "CG": "COG", "CD": "COD",
    "CR": "CRI", "CI": "CIV", "HR": "HRV", "CY": "CYP", "CZ": "CZE",
    "DK": "DNK", "DJ": "DJI", "DO": "DOM", "EC": "ECU", "EG": "EGY",
    "SV": "SLV", "GQ": "GNQ", "ER": "ERI", "EE": "EST", "SZ": "SWZ",
    "ET": "ETH", "FJ": "FJI", "FI": "FIN", "FR": "FRA", "GA": "GAB",
    "GM": "GMB", "GE": "GEO", "DE": "DEU", "GH": "GHA", "GR": "GRC",
    "GT": "GTM", "GN": "GIN", "GW": "GNB", "GY": "GUY", "HT": "HTI",
    "HN": "HND", "HK": "HKG", "HU": "HUN", "IS": "ISL", "IN": "IND",
    "ID": "IDN", "IR": "IRN", "IQ": "IRQ", "IE": "IRL", "IL": "ISR",
    "IT": "ITA", "JM": "JAM", "JP": "JPN", "JO": "JOR", "KZ": "KAZ",
    "KE": "KEN", "KI": "KIR", "KW": "KWT", "KG": "KGZ", "LA": "LAO",
    "LV": "LVA", "LB": "LBN", "LS": "LSO", "LR": "LBR", "LY": "LBY",
    "LT": "LTU", "LU": "LUX", "MG": "MDG", "MW": "MWI", "MY": "MYS",
    "MV": "MDV", "ML": "MLI", "MT": "MLT", "MR": "MRT", "MU": "MUS",
    "MX": "MEX", "MD": "MDA", "MN": "MNG", "ME": "MNE", "MA": "MAR",
    "MZ": "MOZ", "MM": "MMR", "NA": "NAM", "NP": "NPL", "NL": "NLD",
    "NZ": "NZL", "NI": "NIC", "NE": "NER", "NG": "NGA", "MK": "MKD",
    "NO": "NOR", "OM": "OMN", "PK": "PAK", "PA": "PAN", "PG": "PNG",
    "PY": "PRY", "PE": "PER", "PH": "PHL", "PL": "POL", "PT": "PRT",
    "QA": "QAT", "RO": "ROU", "RU": "RUS", "RW": "RWA", "WS": "WSM",
    "SA": "SAU", "SN": "SEN", "RS": "SRB", "SL": "SLE", "SG": "SGP",
    "SK": "SVK", "SI": "SVN", "SB": "SLB", "SO": "SOM", "ZA": "ZAF",
    "SS": "SSD", "ES": "ESP", "LK": "LKA", "SD": "SDN", "SR": "SUR",
    "SE": "SWE", "CH": "CHE", "SY": "SYR", "TW": "TWN", "TJ": "TJK",
    "TZ": "TZA", "TH": "THA", "TL": "TLS", "TG": "TGO", "TO": "TON",
    "TT": "TTO", "TN": "TUN", "TR": "TUR", "TM": "TKM", "UG": "UGA",
    "UA": "UKR", "AE": "ARE", "GB": "GBR", "US": "USA", "UY": "URY",
    "UZ": "UZB", "VU": "VUT", "VE": "VEN", "VN": "VNM", "YE": "YEM",
    "ZM": "ZMB", "ZW": "ZWE",
}

# IMF area codes that are aggregates — skip them
_IFS_SKIP_AREAS: frozenset[str] = frozenset({
    "001", "110", "111", "119", "163", "200", "205", "400", "405",
    "505", "510", "603", "606", "612", "614", "616", "618", "622",
    "694", "700", "701", "703", "706", "711", "714", "718", "722",
    "724", "728", "733", "738", "743", "744", "745", "746", "748",
    "750", "759", "761", "762", "763", "764", "765", "766", "767",
    "768", "769", "770", "771", "772", "773", "774", "775", "776",
    "777", "778", "779", "780", "781", "782", "783", "784", "785",
    "001", "W00", "WLD",
})


class ImfIfsClient:
    """Fetches data from the IMF International Financial Statistics API.

    The IFS API returns SDMX Compact JSON: a list of ``Series`` objects
    each with an ``Obs`` array of time-period/value pairs.

    Args:
        base_url: IFS CompactData base URL.
        timeout_seconds: HTTP timeout.
    """

    DEFAULT_BASE_URL = "https://dataservices.imf.org/REST/SDMX_JSON.svc"

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

    def fetch_indicator_all_countries(
        self,
        indicator_code: str,
        frequency: str = "A",
        start_year: int = 1990,
    ) -> list[tuple[str, int, float]]:
        """Fetch one IFS indicator for all countries.

        Args:
            indicator_code: IFS indicator code (e.g., ``"RAXG_USD"``).
            frequency: "A" annual, "M" monthly (we always request A here).
            start_year: First year to fetch.

        Returns:
            List of (iso3, year, value) tuples.
        """
        url = (
            f"{self._base_url}/CompactData/IFS"
            f"/{frequency}..{indicator_code}"
            f"?startPeriod={start_year}"
        )
        data = self._get_json(url)
        return self._parse_compact_data(data, indicator_code)

    # ------------------------------------------------------------------
    # Parser
    # ------------------------------------------------------------------

    def _parse_compact_data(
        self,
        data: dict[str, Any],
        indicator_code: str,
    ) -> list[tuple[str, int, float]]:
        """Parse IMF SDMX Compact JSON response."""
        try:
            dataset = data["CompactData"]["DataSet"]
        except (KeyError, TypeError):
            LOGGER.warning("IFS: unexpected response structure for %s", indicator_code)
            return []

        series_list = dataset.get("Series", [])
        # The API returns either a list or a single dict when there's one series
        if isinstance(series_list, dict):
            series_list = [series_list]

        results: list[tuple[str, int, float]] = []

        for series in series_list:
            ref_area = series.get("@REF_AREA", "")

            # Skip aggregate areas (numeric codes like "001", "200" etc.)
            if ref_area in _IFS_SKIP_AREAS:
                continue

            # Convert ISO2 → ISO3
            iso3 = _IFS_ISO2_TO_ISO3.get(ref_area)
            if not iso3:
                # Some IFS codes are already 3-char or numeric; skip unknown
                continue

            obs_list = series.get("Obs", [])
            if isinstance(obs_list, dict):
                obs_list = [obs_list]

            for obs in obs_list:
                time_period = obs.get("@TIME_PERIOD", "")
                obs_value = obs.get("@OBS_VALUE")
                if obs_value is None:
                    continue
                try:
                    year = int(str(time_period)[:4])
                    value = float(obs_value)
                except (ValueError, TypeError):
                    continue
                results.append((iso3, year, value))

        return results

    @retry(
        reraise=True,
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=3, max=30),
        retry=retry_if_exception_type(httpx.HTTPError),
    )
    def _get_json(self, url: str) -> dict[str, Any]:
        with httpx.Client(timeout=self._timeout) as client:
            resp = client.get(url, headers={"Accept": "application/json"})
            resp.raise_for_status()
            return resp.json()