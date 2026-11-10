"""Official WDI path and clear error contract for a bounded CPI pilot."""

import json
from pathlib import Path
from unittest.mock import Mock

import httpx
import pytest

from ingestion_service.bronze_store import BronzeStore
from ingestion_service.connectors.worldbank_client import WorldBankClient
from ingestion_service.pipelines.worldbank import WorldBankIngestionService


def test_multi_country_api_restricts_upstream_scope():
    client = WorldBankClient("https://api.worldbank.org/v2", 15, 500)
    client._get_json = Mock(side_effect=[
        [
            {"pages": 1},
            [{"countryiso3code": "FRA", "date": "2024", "value": 2.0}],
        ]
    ])
    rows = client.fetch_indicator_all_countries(
        "FP.CPI.TOTL.ZG", country_iso3s={"USA", "FRA", "GAB"}
    )
    assert rows[0]["countryiso3code"] == "FRA"
    client._get_json.assert_called_once()
    path, params = client._get_json.call_args.args
    assert path == "/country/FRA;GAB;USA/indicator/FP.CPI.TOTL.ZG"
    assert params["page"] == 1
    assert params["per_page"] == 500


def test_pilot_does_not_store_worldbank_forecast_as_observed(tmp_path: Path):
    registry = tmp_path / "indicators.json"
    registry.write_text(json.dumps([{"code": "FP.CPI.TOTL.ZG", "name": "Inflation"}]))
    client = Mock()
    client.fetch_indicator_all_countries.return_value = [
        {"countryiso3code": "FRA", "date": "2024", "value": 2.1, "obs_status": ""},
        {"countryiso3code": "FRA", "date": "2025", "value": 2.7, "obs_status": "F"},
        {"countryiso3code": "DEU", "date": "2024", "value": 2.9, "obs_status": ""},
    ]
    service = WorldBankIngestionService(
        client=client,
        bronze_store=BronzeStore(tmp_path / "bronze"),
        indicator_registry_path=registry,
        timeseries_client=None,
    )
    manifests = service.fetch_core_indicators(
        indicator_codes={"FP.CPI.TOTL.ZG"},
        country_iso3s={"FRA", "GAB", "USA"},
    )
    assert len(manifests) == 1
    assert manifests[0].record_count == 1
    contents = [
        json.loads(line)
        for line in manifests[0].normalized_payload_path.read_text().splitlines()
    ]
    assert contents[0]["country_iso3"] == "FRA"
    assert contents[0]["period_label"] == "2024"


def test_requested_worldbank_indicator_failure_is_not_silenced(tmp_path: Path):
    registry = tmp_path / "indicators.json"
    registry.write_text(json.dumps([{"code": "FP.CPI.TOTL.ZG", "name": "Inflation"}]))
    client = Mock()
    client.fetch_indicator_all_countries.side_effect = httpx.HTTPStatusError(
        "Upstream 502",
        request=httpx.Request("GET", "https://api.worldbank.org/v2"),
        response=httpx.Response(502),
    )
    service = WorldBankIngestionService(
        client=client,
        bronze_store=BronzeStore(tmp_path / "bronze"),
        indicator_registry_path=registry,
        timeseries_client=None,
    )
    with pytest.raises(RuntimeError, match="requested indicator"):
        service.fetch_core_indicators(indicator_codes={"FP.CPI.TOTL.ZG"})
