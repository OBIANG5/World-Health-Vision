"""Adversarial DATA-1A tests, deterministic API-shaped payload, never live stats."""
import copy
import json
from pathlib import Path

import httpx
import pytest

from ingestion_service.bronze_store import BronzeStore
from ingestion_service.connectors.ibge_national_census_client import (
    IBGE_DATA_PATH,
    IBGE_POPULATION_INDICATOR,
    IbgeNationalCensusClient,
    parse_ibge_national_population,
)
from ingestion_service.pipelines.ibge_national_census import IbgeNationalCensusPilot


# SYNTHETIC FIXTURE matching documented IBGE aggregate v3 shape.
# Value 123456789 is DELIBERATELY FAKE; never present as a real Brazil census figure.
def fake_response():
    return [{
        "id": "93",
        "variavel": "População residente",
        "unidade": "Pessoas",
        "resultados": [{
            "classificacoes": [],
            "series": [{
                "localidade": {
                    "id": "1",
                    "nivel": {"id": "N1", "nome": "Brasil"},
                    "nome": "Brasil",
                },
                "serie": {"2022": "123456789"},
            }],
        }],
    }]


def transport_for(payload=None, status=200, ctype="application/json"):
    content = json.dumps(fake_response() if payload is None else payload).encode()
    def handler(request: httpx.Request):
        assert request.url.host == "servicodados.ibge.gov.br"
        assert request.url.path == IBGE_DATA_PATH
        assert request.url.params["localidades"] == "N1[all]"
        return httpx.Response(status, content=content, headers={"content-type": ctype})
    return httpx.MockTransport(handler)


def test_explicitly_synthetic_shape_rejects_subnational_ambiguity():
    record = parse_ibge_national_population(fake_response())
    assert record.resident_population == 123456789
    assert record.source_url.startswith("https://servicodados.ibge.gov.br/")
    assert len(record.raw_sha256) == 64
    assert record.source_unit_label == "Pessoas"


@pytest.mark.parametrize("mutator", [
    lambda p: p[0].update({"id": "6318"}),
    lambda p: p[0].update({"unidade": "Mil pessoas"}),
    lambda p: p[0].update({"variavel": "Densidade demográfica"}),
    lambda p: p[0]["resultados"][0].update({"classificacoes": [{"id": "2"}]}),
    lambda p: p[0]["resultados"][0]["series"][0]["localidade"].update({"id": "33"}),
    lambda p: p[0]["resultados"][0]["series"][0]["localidade"]["nivel"].update({"id": "N3"}),
    lambda p: p[0]["resultados"][0]["series"][0].update({"serie": {"2021": "123456789"}}),
    lambda p: p[0]["resultados"][0]["series"][0].update({"serie": {"2022": ".."}}),
    lambda p: p[0]["resultados"][0]["series"][0].update({"serie": {"2022": "1.2"}}),
    lambda p: p[0]["resultados"][0]["series"][0].update({"serie": {"2022": "0"}}),
    lambda p: p[0]["resultados"][0]["series"][0].update({"serie": {"2022": None}}),
    lambda p: p[0]["resultados"][0]["series"].append(copy.deepcopy(p[0]["resultados"][0]["series"][0])),
])
def test_national_population_fails_closed_on_mismatch(mutator):
    p = fake_response()
    mutator(p)
    with pytest.raises(ValueError):
        parse_ibge_national_population(p)


@pytest.mark.parametrize("invalid", [None, {}, [], [fake_response()[0], fake_response()[0]]])
def test_missing_or_multi_variable_response_cannot_be_ingested(invalid):
    with pytest.raises(ValueError):
        parse_ibge_national_population(invalid)


def test_http_failure_or_non_json_never_generates_bronze(tmp_path: Path):
    for status, ctype in ((503, "application/json"), (200, "text/html")):
        client = IbgeNationalCensusClient(transport=transport_for(status=status, ctype=ctype))
        pilot = IbgeNationalCensusPilot(client=client, bronze_store=BronzeStore(tmp_path))
        with pytest.raises((httpx.HTTPStatusError, ValueError)):
            pilot.capture_population_2022()
    # A failed request is now deliberately journaled; no RAW VERSION may exist.
    assert not list(tmp_path.rglob("manifest.json"))
    from ingestion_service.acquisition_journal import AcquisitionJournal
    audit = AcquisitionJournal(tmp_path).audit("IBGE", "CENSO2022_4714")
    assert audit["failureCount"] == 2
    assert audit["successCount"] == 0


def test_invalid_json_or_large_payload_fails_before_persistence(tmp_path: Path):
    def invalid(request):
        return httpx.Response(200, content=b"not JSON", headers={"content-type": "application/json"})
    with pytest.raises(ValueError):
        IbgeNationalCensusClient(transport=httpx.MockTransport(invalid)).fetch_population_2022()

    def oversized(request):
        return httpx.Response(200, content=b"[" + b" " * 1_000_001 + b"]",
                              headers={"content-type": "application/json"})
    with pytest.raises(ValueError, match="size"):
        IbgeNationalCensusClient(transport=httpx.MockTransport(oversized)).fetch_population_2022()


def test_captured_official_shape_is_bronze_only_never_published(tmp_path: Path):
    pilot = IbgeNationalCensusPilot(
        client=IbgeNationalCensusClient(transport=transport_for()),
        bronze_store=BronzeStore(tmp_path),
    )
    manifest = pilot.capture_population_2022()
    assert manifest.source_code == "IBGE"
    assert manifest.dataset_code == "CENSO2022_4714"
    assert manifest.record_count == 1
    assert manifest.notes["publicationStatus"] == "BRONZE_ONLY_UNREVIEWED"
    assert manifest.notes["licenseReviewStatus"] == "REVIEW_REQUIRED"
    assert manifest.notes["timeseriesPublication"] == "NOT_ATTEMPTED"
    assert manifest.notes["sourceRevisionDate"] is None
    assert manifest.raw_payload_path.is_file()
    records = [
        json.loads(line) for line in manifest.normalized_payload_path.read_text().splitlines()
    ]
    assert len(records) == 1
    record = records[0]
    assert record["country_iso3"] == "BRA"
    assert record["indicator_code"] == IBGE_POPULATION_INDICATOR
    assert record["value"] == 123456789.0
    assert record["value_status"] == "OBSERVED"
    assert record["period_label"] == "2022"
    assert record["source_published_at"] is None
    assert "REUSE_RIGHTS_REVIEW_REQUIRED" in record["quality_flags"]
    assert record["source_metadata"]["rawSha256"] == manifest.notes["rawSha256"]
    assert not (tmp_path/"timeseries").exists()


def test_invalid_timeout_blocks_resource_exhaustion():
    for value in (-1, 0, 61, 99999):
        with pytest.raises(ValueError):
            IbgeNationalCensusClient(timeout_seconds=value)
