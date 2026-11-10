"""Official World Bank WDI JSON client with verified official CSV ZIP fallback.

The World Bank country/indicator JSON endpoint intermittently returns 502
even for one country (2026-11-10 GitHub Actions). The official *indicator*
CSV export remains available. The fallback never uses a third-party mirror.
"""

import csv
import io
import logging
import math
import zipfile
from typing import Any

import httpx

LOGGER = logging.getLogger(__name__)
MAX_WDI_BULK_ZIP_BYTES = 16_000_000
MAX_WDI_EXTRACTED_CSV_BYTES = 64_000_000
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential


class WorldBankClient:
    def __init__(self, base_url: str, timeout_seconds: int, page_size: int) -> None:
        self._base_url = base_url.rstrip("/")
        self._timeout_seconds = timeout_seconds
        self._page_size = page_size

    def fetch_countries(self) -> list[dict[str, Any]]:
        payload = self._get_json("/country", {"format": "json", "per_page": 400})
        return payload[1]

    def fetch_indicator_all_countries(
        self,
        indicator_code: str,
        source_id: str | None = None,
        country_iso3s: set[str] | None = None,
    ) -> list[dict[str, Any]]:
        # The World Bank API supports semicolon-separated countries.
        # Restricting an operational pilot avoids fetching every country
        # and the avoidable 502 failures on later pages.
        country_path = "all"
        if country_iso3s is not None:
            if not country_iso3s or any(len(code) != 3 or not code.isalpha() for code in country_iso3s):
                raise ValueError("World Bank country scope requires valid three-letter country codes")
            country_path = ";".join(sorted(code.upper() for code in country_iso3s))
        params: dict[str, Any] = {
            "format": "json",
            "per_page": self._page_size,
            "page": 1,
        }
        if source_id is not None:
            params["source"] = source_id

        try:
            first_page = self._get_json(
                f"/country/{country_path}/indicator/{indicator_code}",
                params,
            )
        except (httpx.TransportError, httpx.HTTPStatusError) as exc:
            # Fall back only when the official WDI query is temporarily
            # inaccessible. Invalid indicator/country requests remain errors.
            retryable = isinstance(exc, httpx.TransportError) or (
                isinstance(exc, httpx.HTTPStatusError)
                and exc.response.status_code in {429, 500, 502, 503, 504}
            )
            if retryable and source_id in {None, "2"} and country_iso3s is not None:
                LOGGER.warning(
                    "Official World Bank JSON endpoint unavailable (%s); "
                    "using official WDI CSV ZIP export for %s",
                    exc.__class__.__name__, indicator_code,
                )
                return self._get_official_wdi_csv_zip(indicator_code, country_iso3s)
            raise

        metadata = first_page[0]
        pages = int(metadata["pages"])
        rows = list(first_page[1])

        for page in range(2, pages + 1):
            page_params: dict[str, Any] = {
                "format": "json",
                "per_page": self._page_size,
                "page": page,
            }
            if source_id is not None:
                page_params["source"] = source_id
            page_payload = self._get_json(
                f"/country/{country_path}/indicator/{indicator_code}",
                page_params,
            )
            rows.extend(page_payload[1])

        return rows

    @retry(
        reraise=True,
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        retry=retry_if_exception_type(httpx.HTTPError),
    )
    def _download_official_wdi_zip(self, indicator_code: str) -> bytes:
        # Official World Bank document: the API's CSV downloadformat produces
        # a ZIP with data, country metadata and indicator metadata.
        url = f"{self._base_url}/en/indicator/{indicator_code}"
        with httpx.Client(timeout=self._timeout_seconds, follow_redirects=True) as client:
            response = client.get(url, params={"downloadformat": "csv"})
            response.raise_for_status()
            if len(response.content) > MAX_WDI_BULK_ZIP_BYTES:
                raise ValueError("World Bank indicator ZIP exceeds allowed size")
            if not response.content.startswith(b"PK"):
                raise ValueError("World Bank official CSV export is not a ZIP")
            return response.content

    def _get_official_wdi_csv_zip(
        self, indicator_code: str, country_iso3s: set[str]
    ) -> list[dict[str, Any]]:
        """Read selected ISO3 rows in the World Bank's published WDI CSV.

        Importantly the WDI CSV contains no per-observation status. Every
        returned row carries a quality flag so the UI can disclose this
        methodological limitation; a ZIP-only observation must not be
        presented as independently verified by a second service.
        """
        payload = self._download_official_wdi_zip(indicator_code)
        with zipfile.ZipFile(io.BytesIO(payload)) as archive:
            candidates = [
                info for info in archive.infolist()
                if info.filename.startswith(f"API_{indicator_code}_")
                and info.filename.endswith(".csv")
            ]
            if len(candidates) != 1:
                raise ValueError(f"Unexpected official WDI ZIP structure for {indicator_code}")
            member = candidates[0]
            if member.file_size > MAX_WDI_EXTRACTED_CSV_BYTES:
                raise ValueError("World Bank CSV exceeds allowed decompressed size")
            rows = csv.reader(io.StringIO(archive.read(member).decode("utf-8-sig")))

            last_updated = None
            header = None
            years: list[tuple[int, str]] = []
            data: list[dict[str, Any]] = []
            for row in rows:
                if len(row) > 1 and row[0] == "Last Updated Date":
                    last_updated = row[1]
                if header is None:
                    if row[:4] == [
                        "Country Name", "Country Code", "Indicator Name", "Indicator Code"
                    ]:
                        header = row
                        years = [
                            (index, cell) for index, cell in enumerate(header)
                            if len(cell) == 4 and cell.isdecimal()
                        ]
                    continue
                if len(row) < 4 or row[1] not in country_iso3s:
                    continue
                if row[3] != indicator_code:
                    raise ValueError("World Bank bulk CSV returned an unexpected indicator")
                for index, year in years:
                    if index >= len(row) or not row[index].strip():
                        continue
                    try:
                        number = float(row[index])
                    except ValueError as exc:
                        raise ValueError(
                            f"Malformed official WDI numeric value: {row[1]} {year}"
                        ) from exc
                    if not math.isfinite(number):
                        continue
                    data.append({
                        "countryiso3code": row[1],
                        "date": year,
                        "value": number,
                        "obs_status": "",
                        "_whv_official_bulk_export": True,
                        "_whv_bulk_export_last_updated": last_updated,
                    })
            if header is None or not years:
                raise ValueError("World Bank bulk CSV has no recognized annual time series")
            if not data:
                raise ValueError(
                    f"World Bank official CSV ZIP has no values for {sorted(country_iso3s)}"
                )
            return data

    @retry(
        reraise=True,
        stop=stop_after_attempt(4),
        wait=wait_exponential(multiplier=1, min=1, max=12),
        retry=retry_if_exception_type(httpx.HTTPError),
    )
    def _get_json(self, path: str, params: dict[str, Any]) -> list[dict[str, Any]]:
        timeout = httpx.Timeout(
            connect=min(self._timeout_seconds, 20.0),
            read=self._timeout_seconds,
            write=self._timeout_seconds,
            pool=self._timeout_seconds,
        )

        with httpx.Client(base_url=self._base_url, timeout=timeout) as client:
            response = client.get(path, params=params)
            response.raise_for_status()
            payload = response.json()
            if not isinstance(payload, list) or len(payload) < 2:
                raise ValueError(f"Unexpected World Bank payload for path={path}")
            return payload