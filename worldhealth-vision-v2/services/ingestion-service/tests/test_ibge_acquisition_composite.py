"""DATA-1B2B adversarial local-only journal/composite tests. NO real population.

All example data below are deliberately SYNTHETIC. No provider requests and
no public Timeseries or Atlas writes in these tests.
"""
from concurrent.futures import ThreadPoolExecutor
from hashlib import sha256
import json
from pathlib import Path

import httpx
import pytest

from ingestion_service.acquisition_journal import AcquisitionJournal
from ingestion_service.bronze_store import BronzeStore
from ingestion_service.connectors.ibge_census_metadata_client import (
    IBGE_METADATA_URL, IBGE_PERIODS_URL, IbgeCensusMetadataClient,
)
from ingestion_service.connectors.ibge_national_census_client import (
    IBGE_BASE_URL, IBGE_DATA_PATH, IbgeNationalCensusClient,
)
from ingestion_service.pipelines.ibge_census_metadata import IbgeCensusMetadataPilot
from ingestion_service.pipelines.ibge_national_census import IbgeNationalCensusPilot
from ingestion_service.source_composite_receipt import IbgeCompositeReceiptStore
from ingestion_service.source_evidence_store import EvidenceIntegrityError

_P_URL = IBGE_BASE_URL + IBGE_DATA_PATH + "?localidades=N1%5Ball%5D"


def fake_population():
    # Deliberately FAKE Brazil-sized number; never identify as IBGE output.
    return [{
        "id": "93", "variavel": "População residente", "unidade": "Pessoas",
        "resultados": [{
            "classificacoes": [],
            "series": [{
                "localidade": {"id": "1", "nivel": {"id": "N1", "nome": "Brasil"},
                               "nome": "Brasil"},
                "serie": {"2022": "123456789"},
            }],
        }],
    }]


def fake_metadata():
    return {
        "id": 4714, "nome": "População residente, área territorial e densidade demográfica",
        "pesquisa": "Censo Demográfico",
        "variaveis": [{"id": 93, "nome": "População residente", "unidade": "Pessoas"}],
        "nivelTerritorial": {"Administrativo": ["N1", "N2"]},
    }


def fake_periods():
    return [{"id": "2022", "literals": ["Censo 2022"],
             "modificacao": "provider-field-meaning-unknown"}]


def population_transport(*, status=200, etag=None, last_modified=None):
    def handler(request):
        assert request.url.path == IBGE_DATA_PATH
        headers = {"content-type": "application/json"}
        if etag is not None:
            headers["etag"] = etag
        if last_modified is not None:
            headers["last-modified"] = last_modified
        return httpx.Response(
            status, content=json.dumps(fake_population(), ensure_ascii=False).encode(),
            headers=headers,
        )
    return httpx.MockTransport(handler)


def metadata_transport(*, periods_status=200, bad_periods=False):
    def handler(request):
        assert request.url.host == "servicodados.ibge.gov.br"
        if request.url.path.endswith("/metadados"):
            payload = fake_metadata()
            headers = {"content-type": "application/json", "etag": '"official-synthetic-metadata"'}
            status = 200
        elif request.url.path.endswith("/periodos"):
            payload = [] if bad_periods else fake_periods()
            headers = {"content-type": "application/json"}
            status = periods_status
        else:
            raise AssertionError("Unexpected path in pinned official-source client")
        return httpx.Response(
            status, stream=httpx.ByteStream(json.dumps(payload, ensure_ascii=False).encode()),
            headers=headers,
        )
    return httpx.MockTransport(handler)


def capture_population(root, transport=None):
    return IbgeNationalCensusPilot(
        client=IbgeNationalCensusClient(
            transport=transport if transport is not None else population_transport()
        ), bronze_store=BronzeStore(root),
    ).capture_population_2022()


def capture_metadata(root, transport=None):
    return IbgeCensusMetadataPilot(
        client=IbgeCensusMetadataClient(
            transport=transport if transport is not None else metadata_transport()
        ), bronze_store=BronzeStore(root),
    ).capture_census2022_contract()


def test_same_bytes_repeated_fetch_is_one_version_but_multiple_events(tmp_path):
    first = capture_population(tmp_path, population_transport(
        etag='"synthetic-v1"', last_modified="Thu, 19 Nov 2026 00:00:00 GMT"
    ))
    second = capture_population(tmp_path, population_transport(
        etag='"synthetic-v1"', last_modified="Thu, 19 Nov 2026 00:00:00 GMT"
    ))
    assert first.run_id == second.run_id
    assert first.fetched_at_utc == second.fetched_at_utc
    journal = AcquisitionJournal(tmp_path)
    audit = journal.audit("IBGE", "CENSO2022_4714")
    assert audit["eventCount"] == 2
    assert audit["successCount"] == 2
    assert audit["failureCount"] == audit["interruptedCount"] == 0
    assert audit["versionCount"] == 1
    assert audit["versions"][0]["successfulFetchCount"] == 2
    assert audit["versions"][0]["firstSeenAtUtc"] <= audit["versions"][0]["lastSeenAtUtc"]
    events = list((tmp_path / "ibge" / "censo2022_4714" / "_acquisitions").glob("*/outcome.json"))
    assert len(events) == 2
    for file in events:
        record = json.loads(file.read_text())
        assert record["etag"] == '"synthetic-v1"'
        assert record["lastModified"] == "Thu, 19 Nov 2026 00:00:00 GMT"
        assert record["responseSha256"] == first.notes["httpBodySha256"]
        assert record["httpStatus"] == 200
        assert record["kind"] == "SUCCESS"
        assert "123456789" not in file.read_text()
    assert len(list(tmp_path.rglob("manifest.json"))) == 1


def test_http_error_is_a_failure_event_not_a_new_source_version(tmp_path):
    with pytest.raises(httpx.HTTPStatusError):
        capture_population(tmp_path, population_transport(status=503))
    audit = AcquisitionJournal(tmp_path).audit("IBGE", "CENSO2022_4714")
    assert audit["failureCount"] == 1
    assert audit["eventCount"] == 1
    assert audit["successCount"] == audit["versionCount"] == 0
    assert not list(tmp_path.rglob("manifest.json"))
    outcome = next(tmp_path.rglob("outcome.json"))
    data = json.loads(outcome.read_text())
    assert data["httpStatus"] == 503
    assert data["etag"] is None and data["responseSha256"] is None
    assert "message" not in data and "rawResponse" not in data


def test_metadata_and_periods_keep_independent_fetch_counts_and_headers(tmp_path):
    first = capture_metadata(tmp_path)
    second = capture_metadata(tmp_path)
    assert first.aggregate_receipt.run_id == second.aggregate_receipt.run_id
    assert first.periods_receipt.run_id == second.periods_receipt.run_id
    journal = AcquisitionJournal(tmp_path)
    for dataset, etag in [
        ("CENSO2022_4714_METADATA", '"official-synthetic-metadata"'),
        ("CENSO2022_4714_PERIODS", None),
    ]:
        audit = journal.audit("IBGE", dataset)
        assert audit["eventCount"] == 2 and audit["versionCount"] == 1
        assert audit["versions"][0]["successfulFetchCount"] == 2
        event = next((tmp_path / "ibge" / dataset.lower() / "_acquisitions").glob("*/outcome.json"))
        assert json.loads(event.read_text())["etag"] == etag
    assert not list(tmp_path.rglob("timeseries"))


def test_second_metadata_resource_fails_without_erasing_first_success(tmp_path):
    with pytest.raises(ValueError):
        capture_metadata(tmp_path, metadata_transport(periods_status=503))
    journal = AcquisitionJournal(tmp_path)
    assert journal.audit("IBGE", "CENSO2022_4714_METADATA")["successCount"] == 1
    failed = journal.audit("IBGE", "CENSO2022_4714_PERIODS")
    assert failed["failureCount"] == 1 and failed["versionCount"] == 0
    assert json.loads(next(
        (tmp_path/"ibge"/"censo2022_4714_periods"/"_acquisitions").glob("*/outcome.json")
    ).read_text())["httpStatus"] == 503
    assert len(list(tmp_path.rglob("manifest.json"))) == 1


def test_interrupt_is_not_mislabelled_as_success_or_failure(tmp_path):
    journal = AcquisitionJournal(tmp_path)
    journal.begin(source_code="IBGE", dataset_code="CENSO2022_4714",
                  source_url=_P_URL)
    state = journal.audit("IBGE", "CENSO2022_4714")
    assert state["interruptedCount"] == 1 and state["eventCount"] == 1
    assert state["successCount"] == state["failureCount"] == 0


def test_unverified_success_and_double_finish_fail_closed(tmp_path):
    journal = AcquisitionJournal(tmp_path)
    handle = journal.begin(source_code="IBGE", dataset_code="CENSO2022_4714",
                           source_url=_P_URL)
    with pytest.raises(EvidenceIntegrityError):
        journal.success(handle, response_sha256="a" * 64)
    journal.failure(handle, error=ValueError("private token XYZ, never persist me"))
    assert journal.audit("IBGE", "CENSO2022_4714")["failureCount"] == 1
    with pytest.raises(EvidenceIntegrityError):
        journal.failure(handle, error=RuntimeError("must not overwrite"))
    assert "private token XYZ" not in next(tmp_path.rglob("outcome.json")).read_text()


def test_tampered_start_or_outcome_is_rejected(tmp_path):
    receipt = capture_population(tmp_path)
    journal = AcquisitionJournal(tmp_path)
    start = next(tmp_path.rglob("started.json"))
    original = start.read_text()
    start.write_text(original.replace('"kind":"STARTED"', '"kind":"SUCCESS"'))
    with pytest.raises(EvidenceIntegrityError):
        journal.audit("IBGE", "CENSO2022_4714")
    start.write_text(original)
    outcome = next(tmp_path.rglob("outcome.json"))
    content = outcome.read_text()
    outcome.write_text(content.replace(receipt.notes["httpBodySha256"], "0" * 64))
    with pytest.raises(EvidenceIntegrityError):
        journal.audit("IBGE", "CENSO2022_4714")


def test_pinned_ibge_url_and_symlink_protections(tmp_path):
    journal = AcquisitionJournal(tmp_path)
    for invalid in (
        "http://servicodados.ibge.gov.br/api/v3/agregados/4714/metadados",
        "https://evil.example/api/v3/agregados/4714/metadados",
        IBGE_METADATA_URL + "?token=secret",
        "https://servicodados.ibge.gov.br/api/v3/agregados/999/metadados",
    ):
        with pytest.raises(EvidenceIntegrityError):
            journal.begin(source_code="IBGE", dataset_code="CENSO2022_4714_METADATA",
                          source_url=invalid)
    other = tmp_path / "elsewhere"
    other.mkdir()
    (tmp_path / "ibge").symlink_to(other, target_is_directory=True)
    with pytest.raises(EvidenceIntegrityError):
        journal.begin(source_code="IBGE", dataset_code="CENSO2022_4714",
                      source_url=_P_URL)


def test_parallel_acquisition_ids_are_unique_and_no_event_overwritten(tmp_path):
    def one(_):
        journal = AcquisitionJournal(tmp_path)
        handle = journal.begin(source_code="IBGE", dataset_code="CENSO2022_4714",
                               source_url=_P_URL)
        journal.failure(handle, error=ValueError("synthetic"))
        return handle.event_id
    with ThreadPoolExecutor(max_workers=5) as pool:
        ids = list(pool.map(one, range(12)))
    assert len(set(ids)) == 12
    audit = AcquisitionJournal(tmp_path).audit("IBGE", "CENSO2022_4714")
    assert audit["eventCount"] == audit["failureCount"] == 12


def test_full_three_part_receipt_blocked_and_repeatable(tmp_path):
    pop = capture_population(tmp_path)
    meta = capture_metadata(tmp_path)
    store = IbgeCompositeReceiptStore(tmp_path)
    req = {
        "population_sha256": pop.notes["httpBodySha256"],
        "metadata_sha256": meta.aggregate_receipt.notes["httpBodySha256"],
        "periods_sha256": meta.periods_receipt.notes["httpBodySha256"],
    }
    result = store.create(**req)
    again = store.create(**req)
    assert result == again
    assert result["publicationStatus"].startswith("BLOCKED")
    verified = store.verify(result["receiptSha256"])
    assert verified["linkedEvidenceCount"] == 3
    assert verified["commercialReuseAdvice"] == "BLOCKED"
    path = tmp_path / result["relativePath"]
    saved = json.loads(path.read_text())
    assert saved["simultaneousProviderSnapshot"] is False
    assert saved["publicDisplayAuthorised"] is False
    assert saved["sourceComparability"] == "NOT_YET_REVIEWED"
    assert len(saved["evidenceParts"]) == 3
    assert all(part["successfulFetchCountAtReceipt"] == 1 for part in saved["evidenceParts"])
    assert not list(tmp_path.rglob("timeseries"))


def test_composite_requires_all_three_events_and_refuses_tamper(tmp_path):
    pop = capture_population(tmp_path)
    meta = capture_metadata(tmp_path)
    store = IbgeCompositeReceiptStore(tmp_path)
    valid = {
        "population_sha256": pop.notes["httpBodySha256"],
        "metadata_sha256": meta.aggregate_receipt.notes["httpBodySha256"],
        "periods_sha256": meta.periods_receipt.notes["httpBodySha256"],
    }
    with pytest.raises(EvidenceIntegrityError):
        store.create(**{**valid, "metadata_sha256": "0" * 64})
    receipt = store.create(**valid)
    proof = tmp_path / receipt["relativePath"]
    proof.write_text(proof.read_text().replace(
        '"publicDisplayAuthorised":false', '"publicDisplayAuthorised":true'
    ))
    with pytest.raises(EvidenceIntegrityError):
        store.verify(receipt["receiptSha256"])


def test_composite_does_not_consider_unfetched_legacy_data_a_complete_receipt(tmp_path):
    capture_population(tmp_path)
    store = IbgeCompositeReceiptStore(tmp_path)
    with pytest.raises(EvidenceIntegrityError):
        store.create(
            population_sha256=next(
                (tmp_path/"ibge"/"censo2022_4714"/"revisions").iterdir()
            ).name,
            metadata_sha256="f" * 64, periods_sha256="e" * 64,
        )
