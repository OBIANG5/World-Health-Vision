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


def _official_wdi_zip_bytes():
    import io
    import zipfile
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, mode="w") as archive:
        archive.writestr(
            "API_FP.CPI.TOTL.ZG_DS2_en_csv_v2_1.csv",
            'Data Source,World Development Indicators,\n'
            '\n'
            'Last Updated Date,2026-10-08,\n'
            '\n'
            'Country Name,Country Code,Indicator Name,Indicator Code,2023,2024,2025,\n'
            'France,FRA,"Inflation, consumer prices (annual %)",FP.CPI.TOTL.ZG,4.8,1.9974,0.94,\n'
            'Gabon,GAB,"Inflation, consumer prices (annual %)",FP.CPI.TOTL.ZG,3.6,1.17,1.76,\n'
            'Germany,DEU,"Inflation, consumer prices (annual %)",FP.CPI.TOTL.ZG,5.9,2.26,2.0,\n',
        )
    return buffer.getvalue()


def test_official_wdi_zip_fallback_reads_only_requested_countries_when_json_returns_502():
    client = WorldBankClient("https://api.worldbank.org/v2", 15, 500)
    client._get_json = Mock(side_effect=httpx.HTTPStatusError(
        "World Bank JSON down",
        request=httpx.Request("GET", "https://api.worldbank.org/v2"),
        response=httpx.Response(502),
    ))
    client._download_official_wdi_zip = Mock(return_value=_official_wdi_zip_bytes())
    rows = client.fetch_indicator_all_countries(
        "FP.CPI.TOTL.ZG", country_iso3s={"FRA", "GAB"}
    )
    assert len(rows) == 6
    assert {row["countryiso3code"] for row in rows} == {"FRA", "GAB"}
    assert all(row["_whv_bulk_export_last_updated"] == "2026-10-08" for row in rows)
    assert next(row for row in rows if row["countryiso3code"] == "FRA" and row["date"] == "2024")["value"] == 1.9974
    client._download_official_wdi_zip.assert_called_once_with("FP.CPI.TOTL.ZG")


def test_official_zip_does_not_override_non_wdi_source_id():
    client = WorldBankClient("https://api.worldbank.org/v2", 15, 500)
    upstream = httpx.HTTPStatusError(
        "World Bank JSON down",
        request=httpx.Request("GET", "https://api.worldbank.org/v2"),
        response=httpx.Response(502),
    )
    client._get_json = Mock(side_effect=upstream)
    client._download_official_wdi_zip = Mock()
    with pytest.raises(httpx.HTTPStatusError):
        client.fetch_indicator_all_countries("GOV_WGI_RL.EST", source_id="3", country_iso3s={"FRA"})
    client._download_official_wdi_zip.assert_not_called()


def test_official_csv_provenance_is_not_lost_during_normalization():
    service = WorldBankIngestionService.__new__(WorldBankIngestionService)
    row = {
        "countryiso3code": "FRA",
        "date": "2024",
        "value": 1.9974,
        "_whv_official_bulk_export": True,
        "_whv_bulk_export_last_updated": "2026-10-08",
    }
    observation = service._normalize_indicator_row(row, "FP.CPI.TOTL.ZG")
    assert observation.source_metadata["acquisitionFormat"] == "OFFICIAL_WDI_CSV_ZIP"
    assert observation.source_metadata["datasetLastUpdated"] == "2026-10-08"
    assert "WDI_BULK_CSV_OBS_STATUS_NOT_INCLUDED" in observation.quality_flags
