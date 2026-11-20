"""DATA-1C-A/B1 — publisher must fail closed; SYNTHETIC numbers only.

These are NOT actual Brazilian or World Bank population statistics. No real
network calls, no production token, no actual Timeseries publication.
"""
from datetime import UTC, datetime
from pathlib import Path

import httpx
import pytest

from ingestion_service.connectors.timeseries_client import TimeseriesClient
from ingestion_service.models import IndicatorObservation, RunManifest


FAKE_SECRET = "synthetic-private-test-only-token-123abc456def789xyz"


def receipt(*, source="WORLD_BANK", dataset="WDI", notes=None):
    return RunManifest(
        source_code=source,
        dataset_code=dataset,
        run_id="synthetic_fra_2024_gdp",
        fetched_at_utc=datetime(2026, 11, 19, 20, tzinfo=UTC),
        record_count=1,
        manifest_path=Path("private/manifest.json"),
        raw_payload_path=Path("private/source.json"),
        normalized_payload_path=Path("private/observations.ndjson"),
        notes=notes or {"syntheticTestOnly": True},
    )


def observation(*, country="FRA", indicator="NY.GDP.MKTP.CD", year=2024,
                status=None):
    return IndicatorObservation.annual(
        country_iso3=country, indicator_code=indicator, year=year,
        value=100.0, value_status=status,
    )


def test_missing_private_key_blocks_all_network_writes(monkeypatch):
    monkeypatch.delenv("WHV_TIMESERIES_INTERNAL_INGESTION_KEY", raising=False)
    publisher = TimeseriesClient(base_url="https://timeseries.test", timeout_seconds=5)
    with pytest.raises(RuntimeError, match="key not configured"):
        publisher.publish_indicator_observations(
            source_code="WORLD_BANK", dataset_code="WDI",
            manifest=receipt(), observations=[observation()],
        )


@pytest.mark.parametrize("source,dataset,notes,obs", [
    ("IBGE", "CENSO2022_4714", {}, observation()),
    ("WORLD_BANK", "WDI_POP_TOTAL_BRA_2022", {}, observation()),
    ("WORLD_BANK", "WDI", {"licenseReviewStatus": "REVIEW_REQUIRED"}, observation()),
    ("WORLD_BANK", "WDI", {"publicationStatus": "BRONZE_ONLY_UNREVIEWED"}, observation()),
    ("WORLD_BANK", "WDI", {}, observation(country="BRA", indicator="SP.POP.TOTL", year=2022)),
    ("WORLD_BANK", "WDI", {}, observation(indicator="IBGE.CENSUS2022.RESIDENT_POP")),
])
def test_private_or_unreviewed_pilots_blocked_even_with_secret(source, dataset, notes, obs):
    publisher = TimeseriesClient(
        base_url="https://timeseries.test", timeout_seconds=5, ingestion_key=FAKE_SECRET,
    )
    with pytest.raises(PermissionError):
        publisher.publish_indicator_observations(
            source_code=source, dataset_code=dataset,
            manifest=receipt(source=source, dataset=dataset, notes=notes),
            observations=[obs],
        )


def test_generic_wdi_population_is_estimated_never_observed():
    client = TimeseriesClient(
        base_url="https://timeseries.test", timeout_seconds=5, ingestion_key=FAKE_SECRET,
    )
    pop = observation(country="FRA", indicator="SP.POP.TOTL", year=2023)
    assert client._serialize_observation(pop, source_code="WORLD_BANK")["valueStatus"] == "ESTIMATED"
    estimated = observation(country="FRA", indicator="SP.POP.TOTL", year=2023,
                            status="MIDYEAR_ESTIMATE")
    assert client._serialize_observation(estimated, source_code="WORLD_BANK")["valueStatus"] == "ESTIMATED"
    with pytest.raises(ValueError, match="cannot be published as an observed census"):
        client._serialize_observation(
            observation(country="FRA", indicator="SP.POP.TOTL", year=2023, status="OBSERVED"),
            source_code="WORLD_BANK",
        )


def test_authenticated_publisher_sends_secret_only_to_pinned_service_and_not_in_payload(monkeypatch):
    original_client = httpx.Client
    captured = []

    def handler(request):
        captured.append(request)
        assert request.url.host == "timeseries.test"
        assert request.headers["X-WHV-Ingestion-Key"] == FAKE_SECRET
        assert FAKE_SECRET.encode() not in request.content
        return httpx.Response(200, json={
            "sourceRunId": "d99f1eb2-39b4-4486-aa00-9c1f39ce392f",
            "itemCount": 1, "upsertedCount": 1,
        })

    monkeypatch.setattr(
        "ingestion_service.connectors.timeseries_client.httpx.Client",
        lambda *args, **kwargs: original_client(
            *args, transport=httpx.MockTransport(handler), **kwargs
        ),
    )
    client = TimeseriesClient(
        base_url="https://timeseries.test", timeout_seconds=5, ingestion_key=FAKE_SECRET,
    )
    data = client.publish_indicator_observations(
        source_code="WORLD_BANK", dataset_code="WDI",
        manifest=receipt(), observations=[observation()],
    )
    assert data["upsertedCount"] == 1
    assert len(captured) == 1


@pytest.mark.parametrize("status_code", [403, 409])
def test_deny_and_immutable_conflict_never_retried(monkeypatch, status_code):
    original_client = httpx.Client
    calls = []

    def handler(request):
        calls.append(request)
        return httpx.Response(status_code, json={"message": "private error"})

    monkeypatch.setattr(
        "ingestion_service.connectors.timeseries_client.httpx.Client",
        lambda *args, **kwargs: original_client(
            *args, transport=httpx.MockTransport(handler), **kwargs
        ),
    )
    publisher = TimeseriesClient(
        base_url="https://timeseries.test", timeout_seconds=5, ingestion_key=FAKE_SECRET,
    )
    with pytest.raises(httpx.HTTPStatusError):
        publisher.publish_indicator_observations(
            source_code="WORLD_BANK", dataset_code="WDI",
            manifest=receipt(), observations=[observation()],
        )
    assert len(calls) == 1, "Rights-denial or conflict must not be auto-retried"
