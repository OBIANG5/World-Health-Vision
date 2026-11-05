"""UNDP Human Development Report (HDR) composite indices CSV client.

The UNDP HDR publishes a complete time-series CSV of composite indices
(HDI, GII, IHDI, MPI, etc.) at:
    https://hdr.undp.org/sites/default/files/2023-24_HDR/HDR23-24_Composite_indices_complete_time_series.csv

Column naming convention in that CSV:
    iso3        — ISO 3166-1 alpha-3 country code
    country     — country display name
    hdicode     — HDI tier code (e.g. "VH", "H", "M", "L")
    region      — UNDP region label
    hdi_rank_YYYY — HDI rank for year YYYY
    hdi_YYYY      — HDI value for year YYYY  (e.g. hdi_1990, hdi_2022)
    gii_rank_YYYY — GII rank
    gii_YYYY      — GII value

This client downloads the CSV and returns a flat list of observation dicts.
"""

import csv
import io
import logging
from typing import Any

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

LOGGER = logging.getLogger(__name__)

# Default CSV URL for the 2023-24 HDR release
_DEFAULT_CSV_URL = (
    "https://hdr.undp.org/sites/default/files/2023-24_HDR/"
    "HDR23-24_Composite_indices_complete_time_series.csv"
)


class UndpHdrClient:
    """Downloads and parses the UNDP HDR composite-indices CSV.

    Args:
        base_url: Direct URL to the HDR composite indices CSV file.
        timeout_seconds: HTTP read/connect timeout in seconds.
    """

    def __init__(
        self,
        base_url: str = _DEFAULT_CSV_URL,
        timeout_seconds: int = 120,
    ) -> None:
        # For this client `base_url` IS the full CSV download URL (no path appended).
        self._csv_url = base_url.rstrip("/")
        self._timeout_seconds = timeout_seconds

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def fetch_hdi_timeseries(self) -> list[dict[str, Any]]:
        """Download the HDR CSV and return a list of observation dicts.

        Each dict has the form::

            {
                "iso3": "FRA",
                "field_prefix": "hdi",   # or "gii", "ihdi", etc.
                "year": 2022,
                "value": 0.903,
            }

        Rows for which ``iso3`` is blank or ``value`` is blank/non-numeric
        are silently skipped.

        Returns:
            Flat list of observation dicts across all countries and years.
        """
        csv_text = self._download_csv()
        return self._parse_csv(csv_text)

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _parse_csv(self, csv_text: str) -> list[dict[str, Any]]:
        """Parse the HDR composite-indices CSV into flat observation dicts.

        The CSV has one row per country.  Year-based values are encoded in
        columns named ``<prefix>_<year>`` (e.g. ``hdi_1990``, ``gii_2022``).
        Rank columns follow the pattern ``<prefix>_rank_<year>`` and are
        intentionally skipped.
        """
        reader = csv.DictReader(io.StringIO(csv_text))
        observations: list[dict[str, Any]] = []

        for row in reader:
            iso3 = row.get("iso3", "").strip().upper()
            if not iso3 or len(iso3) != 3:
                continue

            for col_name, raw_value in row.items():
                col = col_name.strip().lower()

                # Skip non-value columns: rank columns and metadata columns
                # Pattern we want: <prefix>_<4-digit-year>  (no "rank" in between)
                parts = col.split("_")
                if len(parts) < 2:
                    continue

                # The year token is always the last part
                year_token = parts[-1]
                if not year_token.isdigit() or len(year_token) != 4:
                    continue

                # Skip rank columns (e.g. hdi_rank_2022 → parts = ["hdi","rank","2022"])
                if "rank" in parts:
                    continue

                # The field prefix is everything before the year token
                field_prefix = "_".join(parts[:-1])
                if not field_prefix:
                    continue

                # Parse value
                raw_stripped = raw_value.strip() if raw_value else ""
                if not raw_stripped or raw_stripped in {"..", "—", "-", "NA", "N/A", ""}:
                    continue

                try:
                    value = float(raw_stripped)
                except ValueError:
                    continue

                observations.append({
                    "iso3": iso3,
                    "field_prefix": field_prefix,
                    "year": int(year_token),
                    "value": value,
                })

        LOGGER.info(
            "UndpHdrClient parsed %d observations from HDR CSV.",
            len(observations),
        )
        return observations

    @retry(
        reraise=True,
        stop=stop_after_attempt(4),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        retry=retry_if_exception_type(httpx.HTTPError),
    )
    def _download_csv(self) -> str:
        timeout = httpx.Timeout(
            connect=min(self._timeout_seconds, 30.0),
            read=self._timeout_seconds,
            write=self._timeout_seconds,
            pool=self._timeout_seconds,
        )
        with httpx.Client(timeout=timeout, follow_redirects=True) as client:
            response = client.get(self._csv_url)
            response.raise_for_status()
            # HDR CSVs are sometimes latin-1 despite the UTF-8-SIG BOM
            for enc in ("utf-8-sig", "utf-8", "latin-1", "cp1252"):
                try:
                    return response.content.decode(enc)
                except UnicodeDecodeError:
                    continue
            return response.content.decode("latin-1", errors="replace")