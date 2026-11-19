import httpx

from analytics_service.metrics import timed_dependency_http

from analytics_service.models import (
    CountryLatestComparisonItem,
    DependencyReadiness,
    LatestSourceObservation,
    SeriesAvailability,
    SourceRunSummary,
    TimeseriesListEnvelope,
    TimeseriesObservation,
)


class TimeseriesClient:
    def __init__(
        self,
        base_url: str,
        timeout_seconds: int,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self._client = httpx.AsyncClient(
            base_url=base_url.rstrip("/"),
            timeout=timeout_seconds,
            transport=transport,
        )

    async def _get(self, operation: str, path: str, *, params=None) -> httpx.Response:
        # Only internal reviewed operation names reach the fixed-cardinality metrics.
        with timed_dependency_http("timeseries", operation):
            response = await self._client.get(path, params=params)
            response.raise_for_status()
        return response

    async def _post(self, operation: str, path: str, *, json: dict) -> httpx.Response:
        with timed_dependency_http("timeseries", operation):
            response = await self._client.post(path, json=json)
            response.raise_for_status()
        return response

    async def aclose(self) -> None:
        await self._client.aclose()

    async def get_readiness(self) -> DependencyReadiness:
        response = await self._get("readiness", "/api/timeseries/readiness")
        return DependencyReadiness(
            dependency="timeseries-service",
            reachable=True,
            detail=response.json(),
        )

    async def list_series(
        self,
        country_iso3: str,
        indicator_code: str,
        source_code: str | None,
        dataset_code: str | None,
        period_granularity: str | None,
        include_missing: bool,
        sort_direction: str,
        limit: int,
    ) -> list[TimeseriesObservation]:
        params = {
            "countryIso3": country_iso3,
            "indicatorCode": indicator_code,
            "includeMissing": str(include_missing).lower(),
            "sortDirection": sort_direction,
            "limit": str(limit),
        }
        if source_code:
            params["sourceCode"] = source_code
        if dataset_code:
            params["datasetCode"] = dataset_code
        if period_granularity:
            params["periodGranularity"] = period_granularity

        response = await self._get("series", "/api/timeseries/series", params=params)
        payload = TimeseriesListEnvelope.model_validate(response.json())
        return [TimeseriesObservation.model_validate(item) for item in payload.items]

    async def list_series_history_batch(
        self,
        country_iso3: str,
        indicator_codes: list[str],
        source_code: str | None,
        dataset_code: str | None,
        period_granularity: str | None,
        from_period_start: str | None,
        to_period_start: str | None,
        include_missing: bool,
        sort_direction: str,
        limit_per_indicator: int,
    ) -> dict[str, list[TimeseriesObservation]]:
        """Request-bounded per-indicator historical rows, not a global LIMIT.

        Missing observations remain missing; a missing code has an empty list.
        Wrong counts, code cross-contamination and response size fail closed.
        """
        if (not 1 <= len(indicator_codes) <= 128 or
                len(set(indicator_codes)) != len(indicator_codes) or
                not 1 <= limit_per_indicator <= 1000 or
                len(indicator_codes) * limit_per_indicator > 40_000 or
                sort_direction not in {"ASC", "DESC"}):
            raise ValueError("Invalid or unbounded historical indicator batch.")
        response = await self._post(
            "series_batch", "/internal/timeseries/series/history/batch",
            json={
                "countryIso3": country_iso3,
                "indicatorCodes": indicator_codes,
                "sourceCode": source_code,
                "datasetCode": dataset_code,
                "periodGranularity": period_granularity,
                "fromPeriodStart": from_period_start,
                "toPeriodStart": to_period_start,
                "includeMissing": include_missing,
                "sortDirection": sort_direction,
                "limitPerIndicator": limit_per_indicator,
            },
        )
        payload = response.json()
        if (not isinstance(payload, dict) or
                type(payload.get("count")) is not int or
                payload["count"] != len(indicator_codes) or
                not isinstance(payload.get("items"), list) or
                len(payload["items"]) != len(indicator_codes)):
            raise httpx.RemoteProtocolError("Wrong historical batch response envelope.")
        grouped: dict[str, list[TimeseriesObservation]] = {}
        for code, group in zip(indicator_codes, payload["items"], strict=True):
            if not isinstance(group, dict) or group.get("indicatorCode") != code:
                raise httpx.RemoteProtocolError("Misordered historical series group.")
            raw = group.get("items")
            if (not isinstance(raw, list) or type(group.get("count")) is not int or
                    group["count"] != len(raw) or len(raw) > limit_per_indicator):
                raise httpx.RemoteProtocolError("Over-limit or incomplete historical series group.")
            models = [TimeseriesObservation.model_validate(item) for item in raw]
            if any(row.indicatorCode != code for row in models):
                raise httpx.RemoteProtocolError("Cross-indicator historical series contamination.")
            grouped[code] = models
        return grouped

    async def list_latest_by_source(
        self,
        country_iso3: str,
        indicator_code: str,
        source_code: str | None,
        dataset_code: str | None,
        period_granularity: str | None,
        include_missing: bool,
    ) -> list[LatestSourceObservation]:
        params = {
            "countryIso3": country_iso3,
            "indicatorCode": indicator_code,
            "includeMissing": str(include_missing).lower(),
        }
        if source_code:
            params["sourceCode"] = source_code
        if dataset_code:
            params["datasetCode"] = dataset_code
        if period_granularity:
            params["periodGranularity"] = period_granularity

        response = await self._get("latest_by_source", "/api/timeseries/series/latest", params=params)
        payload = TimeseriesListEnvelope.model_validate(response.json())
        return [LatestSourceObservation.model_validate(item) for item in payload.items]

    async def list_latest_by_source_batch(
        self,
        country_iso3: str,
        indicator_codes: list[str],
        source_code: str | None,
        dataset_code: str | None,
        period_granularity: str | None,
        include_missing: bool,
    ) -> dict[str, list[LatestSourceObservation]]:
        """Same per-code source order as individual GET, with no shared rank or limit."""
        if not (1 <= len(indicator_codes) <= 128) or len(set(indicator_codes)) != len(indicator_codes):
            raise ValueError("Latest batch requires 1-128 unique indicator codes.")
        body = {
            "countryIso3": country_iso3,
            "indicatorCodes": indicator_codes,
            "sourceCode": source_code,
            "datasetCode": dataset_code,
            "periodGranularity": period_granularity,
            "includeMissing": include_missing,
        }
        response = await self._post(
            "latest_batch", "/internal/timeseries/series/latest/batch", json=body
        )
        document = response.json()
        if (not isinstance(document, dict) or
                document.get("count") != len(indicator_codes) or
                not isinstance(document.get("items"), list) or
                len(document["items"]) != len(indicator_codes)):
            raise httpx.RemoteProtocolError("Invalid latest-per-source batch envelope.")
        results: dict[str, list[LatestSourceObservation]] = {}
        for expected, group in zip(indicator_codes, document["items"], strict=True):
            if not isinstance(group, dict) or group.get("indicatorCode") != expected:
                raise httpx.RemoteProtocolError("Latest batch indicator order mismatch.")
            raw_items = group.get("items")
            if (not isinstance(raw_items, list) or
                    type(group.get("count")) is not int or group["count"] != len(raw_items)):
                raise httpx.RemoteProtocolError("Latest batch group count mismatch.")
            models = [LatestSourceObservation.model_validate(item) for item in raw_items]
            if any(item.indicatorCode != expected for item in models):
                raise httpx.RemoteProtocolError("Cross-indicator observation contamination.")
            results[expected] = models
        return results

    async def list_series_availability(
        self,
        country_iso3: str,
        indicator_code: str,
        source_code: str | None,
        dataset_code: str | None,
        period_granularity: str | None,
        limit: int,
    ) -> list[SeriesAvailability]:
        params = {
            "countryIso3": country_iso3,
            "indicatorCode": indicator_code,
            "limit": str(limit),
        }
        if source_code:
            params["sourceCode"] = source_code
        if dataset_code:
            params["datasetCode"] = dataset_code
        if period_granularity:
            params["periodGranularity"] = period_granularity

        response = await self._get("availability", "/api/timeseries/series/availability", params=params)
        payload = TimeseriesListEnvelope.model_validate(response.json())
        return [SeriesAvailability.model_validate(item) for item in payload.items]

    async def list_series_availability_batch(
        self,
        country_iso3: str,
        indicator_codes: list[str],
        source_code: str | None,
        dataset_code: str | None,
        period_granularity: str | None,
        limit_per_indicator: int,
    ) -> dict[str, list[SeriesAvailability]]:
        if (not 1 <= len(indicator_codes) <= 128 or
                len(set(indicator_codes)) != len(indicator_codes) or
                not 1 <= limit_per_indicator <= 500 or
                len(indicator_codes) * limit_per_indicator > 10000):
            raise ValueError("Unbounded or duplicate availability batch.")
        response = await self._post(
            "availability_batch", "/internal/timeseries/series/availability/batch",
            json={
                "countryIso3": country_iso3,
                "indicatorCodes": indicator_codes,
                "sourceCode": source_code,
                "datasetCode": dataset_code,
                "periodGranularity": period_granularity,
                "limitPerIndicator": limit_per_indicator,
            },
        )
        data = response.json()
        if (not isinstance(data, dict) or data.get("count") != len(indicator_codes) or
                not isinstance(data.get("items"), list) or
                len(data["items"]) != len(indicator_codes)):
            raise httpx.RemoteProtocolError("Malformed per-indicator availability batch envelope.")
        result: dict[str, list[SeriesAvailability]] = {}
        for code, group in zip(indicator_codes, data["items"], strict=True):
            if not isinstance(group, dict) or group.get("indicatorCode") != code:
                raise httpx.RemoteProtocolError("Availability batch returned misplaced indicator.")
            items = group.get("items")
            if not isinstance(items, list) or type(group.get("count")) is not int or group["count"] != len(items):
                raise httpx.RemoteProtocolError("Availability batch group count mismatch.")
            models = [SeriesAvailability.model_validate(item) for item in items]
            if any(row.indicatorCode != code for row in models):
                raise httpx.RemoteProtocolError("Availability batch crossed indicator boundaries.")
            result[code] = models
        return result

    async def compare_countries_latest(
        self,
        country_iso3: list[str],
        indicator_code: str,
        source_code: str | None,
        dataset_code: str | None,
        period_granularity: str | None,
        include_missing: bool,
    ) -> list[CountryLatestComparisonItem]:
        params: list[tuple[str, str]] = [("countryIso3", item) for item in country_iso3]
        params.extend(
            [
                ("indicatorCode", indicator_code),
                ("includeMissing", str(include_missing).lower()),
            ]
        )
        if source_code:
            params.append(("sourceCode", source_code))
        if dataset_code:
            params.append(("datasetCode", dataset_code))
        if period_granularity:
            params.append(("periodGranularity", period_granularity))

        response = await self._get("country_comparison", "/api/timeseries/compare/countries/latest", params=params)
        payload = TimeseriesListEnvelope.model_validate(response.json())
        return [CountryLatestComparisonItem.model_validate(item) for item in payload.items]

    async def list_source_runs(
        self,
        source_code: str | None,
        dataset_code: str | None,
        status: str | None,
        limit: int,
    ) -> list[SourceRunSummary]:
        params = {"limit": str(limit)}
        if source_code:
            params["sourceCode"] = source_code
        if dataset_code:
            params["datasetCode"] = dataset_code
        if status:
            params["status"] = status

        response = await self._get("source_runs", "/api/timeseries/source-runs", params=params)
        payload = TimeseriesListEnvelope.model_validate(response.json())
        return [SourceRunSummary.model_validate(item) for item in payload.items]

    @staticmethod
    def unreachable(error: Exception) -> DependencyReadiness:
        return DependencyReadiness(
            dependency="timeseries-service",
            reachable=False,
            detail={"error": str(error)},
        )