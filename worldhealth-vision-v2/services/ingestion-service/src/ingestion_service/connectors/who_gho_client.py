"""WHO Global Health Observatory (GHO) OData API client."""

from typing import Any

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

_GHO_BASE = "https://ghoapi.azureedge.net/api"


class WhoGhoClient:
    """Fetches indicator data from the WHO GHO OData v4 API.

    Docs: https://www.who.int/data/gho/info/gho-odata-api
    Base: https://ghoapi.azureedge.net/api/{INDICATOR_CODE}?$filter=...
    """

    def __init__(self, base_url: str = _GHO_BASE, timeout_seconds: int = 60) -> None:
        self._base_url = base_url.rstrip("/")
        self._timeout_seconds = timeout_seconds

    def fetch_indicator_all_countries(
        self,
        gho_indicator_id: str,
        sex_filter: str | None = None,
    ) -> list[dict[str, Any]]:
        """Fetch all country observations for a given GHO indicator.

        Args:
            gho_indicator_id: GHO indicator code (e.g., "WHOSIS_000001").
            sex_filter: Optional Dim1 sex filter (e.g., "BTSX" for both sexes).

        Returns:
            List of raw observation dicts from the OData 'value' array.
        """
        filters: list[str] = ["SpatialDimType eq 'COUNTRY'"]
        if sex_filter:
            filters.append(f"Dim1 eq '{sex_filter}'")

        params: dict[str, str] = {
            "$filter": " and ".join(filters),
            "$select": "SpatialDim,TimeDim,NumericValue,Low,High,Comments",
            "$orderby": "SpatialDim,TimeDim",
        }

        rows: list[dict[str, Any]] = []
        url: str | None = f"{self._base_url}/{gho_indicator_id}"

        while url:
            data = self._get_json(url, params if url == f"{self._base_url}/{gho_indicator_id}" else {})
            rows.extend(data.get("value", []))
            url = data.get("@odata.nextLink")

        return rows

    @retry(
        reraise=True,
        stop=stop_after_attempt(4),
        wait=wait_exponential(multiplier=1, min=2, max=20),
        retry=retry_if_exception_type(httpx.HTTPError),
    )
    def _get_json(self, url: str, params: dict[str, str]) -> dict[str, Any]:
        with httpx.Client(timeout=self._timeout_seconds) as client:
            response = client.get(url, params=params)
            response.raise_for_status()
            return response.json()