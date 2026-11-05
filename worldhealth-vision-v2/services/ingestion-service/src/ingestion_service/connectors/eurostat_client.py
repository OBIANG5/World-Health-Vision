"""Eurostat JSON API (format 2.0) client.

Docs: https://wikis.ec.europa.eu/display/EUROSTATHELP/API+Statistics+-+data+query
Base URL: https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/
"""

from typing import Any

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential


# ---------------------------------------------------------------------------
# ISO 2 → ISO 3 mapping for Eurostat geo codes
# ---------------------------------------------------------------------------

_EUROSTAT_TO_ISO3: dict[str, str] = {
    # EU-27 member states
    "AT": "AUT", "BE": "BEL", "BG": "BGR", "CY": "CYP", "CZ": "CZE",
    "DE": "DEU", "DK": "DNK", "EE": "EST", "EL": "GRC", "ES": "ESP",
    "FI": "FIN", "FR": "FRA", "HR": "HRV", "HU": "HUN", "IE": "IRL",
    "IT": "ITA", "LT": "LTU", "LU": "LUX", "LV": "LVA", "MT": "MLT",
    "NL": "NLD", "PL": "POL", "PT": "PRT", "RO": "ROU", "SE": "SWE",
    "SI": "SVN", "SK": "SVK",
    # EEA / EFTA
    "IS": "ISL", "LI": "LIE", "NO": "NOR",
    # Candidate & neighbouring countries
    "AL": "ALB", "BA": "BIH", "ME": "MNE", "MK": "MKD", "RS": "SRB",
    "TR": "TUR", "CH": "CHE", "UK": "GBR", "MD": "MDA", "UA": "UKR",
    "GE": "GEO", "AM": "ARM", "AZ": "AZE", "BY": "BLR", "XK": "XKX",
    # Legacy / alternate codes
    "CS": "SRB",
}

# Aggregate / supra-national geo codes to skip entirely
_EUROSTAT_SKIP: frozenset[str] = frozenset({
    "EU27_2020", "EU28", "EU15", "EU25", "EU_27",
    "EA", "EA19", "EA20",
    "EEA", "EEA30", "EEA31", "EEA_EFTA_4", "EFTA4",
})


class EurostatClient:
    """Fetches datasets from the Eurostat JSON API (format 2.0).

    The Eurostat API returns a hypercube of values indexed by the Cartesian
    product of its dimensions.  Callers pass ``filter_params`` to pin all
    dimensions except ``geo`` and ``time`` to a single value, which reduces
    the cube to a 2-D geo × time matrix that this client then flattens into
    ``(iso3, year, value)`` tuples.

    Args:
        base_url: Root URL of the Eurostat dissemination API.
        timeout_seconds: HTTP read/connect timeout in seconds.
    """

    def __init__(
        self,
        base_url: str = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data",
        timeout_seconds: int = 90,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._timeout_seconds = timeout_seconds

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def fetch_dataset(
        self,
        dataset_id: str,
        filter_params: dict[str, str],
    ) -> list[tuple[str, int, float]]:
        """Fetch all geo×time observations for a filtered Eurostat dataset.

        Args:
            dataset_id: Eurostat dataset code, e.g. ``"une_rt_a"``.
            filter_params: Dimension filters that reduce the cube to a
                geo × time slice (e.g. ``{"unit": "PC_ACT", "sex": "T", ...}``).

        Returns:
            List of ``(iso3, year, value)`` tuples, excluding aggregate zones
            and geo codes absent from the ISO2→ISO3 mapping.
        """
        # Eurostat deprecated legacy params (format=JSON, lang=EN) — use raw filter params only
        params: dict[str, str] = {**filter_params}
        raw = self._get_json(f"{self._base_url}/{dataset_id}", params)
        return self._parse_response(raw)

    # ------------------------------------------------------------------
    # Response parsing
    # ------------------------------------------------------------------

    def _parse_response(self, raw: dict[str, Any]) -> list[tuple[str, int, float]]:
        """Parse a Eurostat JSON 2.0 response into (iso3, year, value) tuples.

        Eurostat encodes the value cube as a sparse dict whose keys are the
        *linearised* position in the Cartesian product of all dimension sizes.
        For example, with dimensions [freq(1), unit(1), geo(30), time(20)]:

            position = freq_idx * (1*30*20) + unit_idx * (30*20)
                       + geo_idx * 20 + time_idx

        Because freq and unit are pinned to a single category by the filter
        params, their indices are always 0, so:

            position = geo_idx * time_size + time_idx

        The general algorithm derives strides for *every* dimension from the
        ``size`` array, then recovers each dimension index from a given
        position.
        """
        dim_ids: list[str] = raw["id"]          # e.g. ["freq","unit","geo","time"]
        dim_sizes: list[int] = raw["size"]       # e.g. [1, 1, 30, 20]
        dimensions: dict[str, Any] = raw["dimension"]
        values: dict[str, Any] = raw.get("value", {})

        if not values:
            return []

        # Build index→label lookup for "geo" and "time" dimensions
        geo_dim_idx = dim_ids.index("geo")
        time_dim_idx = dim_ids.index("time")

        geo_index: dict[str, int] = dimensions["geo"]["category"]["index"]
        time_index: dict[str, int] = dimensions["time"]["category"]["index"]

        # Reverse lookup: numeric position → string label
        geo_by_pos: dict[int, str] = {v: k for k, v in geo_index.items()}
        time_by_pos: dict[int, str] = {v: k for k, v in time_index.items()}

        # Compute the stride for each dimension (row-major order).
        # stride[i] = product of all sizes to the right of dimension i.
        n_dims = len(dim_ids)
        strides: list[int] = [1] * n_dims
        for i in range(n_dims - 2, -1, -1):
            strides[i] = strides[i + 1] * dim_sizes[i + 1]

        geo_stride = strides[geo_dim_idx]
        geo_size = dim_sizes[geo_dim_idx]
        time_stride = strides[time_dim_idx]
        time_size = dim_sizes[time_dim_idx]

        results: list[tuple[str, int, float]] = []

        for pos_str, raw_value in values.items():
            if raw_value is None:
                continue

            pos = int(pos_str)

            # Recover per-dimension indices from the linearised position
            geo_pos = (pos // geo_stride) % geo_size
            time_pos = (pos // time_stride) % time_size

            geo_label = geo_by_pos.get(geo_pos)
            time_label = time_by_pos.get(time_pos)

            if geo_label is None or time_label is None:
                continue

            # Skip aggregate zones (e.g. EU27, EA19)
            if geo_label in _EUROSTAT_SKIP:
                continue

            # Map ISO2 → ISO3; skip unknown codes
            iso3 = _EUROSTAT_TO_ISO3.get(geo_label)
            if iso3 is None:
                continue

            # Parse year — Eurostat uses "2000", "2001", etc. for annual data
            try:
                year = int(time_label)
            except ValueError:
                continue

            try:
                value = float(raw_value)
            except (TypeError, ValueError):
                continue

            results.append((iso3, year, value))

        return results

    # ------------------------------------------------------------------
    # HTTP helper
    # ------------------------------------------------------------------

    @retry(
        reraise=True,
        stop=stop_after_attempt(4),
        wait=wait_exponential(multiplier=1, min=2, max=20),
        retry=retry_if_exception_type(httpx.HTTPError),
    )
    def _get_json(self, url: str, params: dict[str, str]) -> dict[str, Any]:
        timeout = httpx.Timeout(
            connect=min(self._timeout_seconds, 20.0),
            read=self._timeout_seconds,
            write=self._timeout_seconds,
            pool=self._timeout_seconds,
        )
        with httpx.Client(timeout=timeout) as client:
            response = client.get(url, params=params)
            response.raise_for_status()
            return response.json()