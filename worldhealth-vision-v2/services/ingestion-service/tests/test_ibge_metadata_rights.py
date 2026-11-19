"""DATA-1B2A synthetic adversarial evidence and rights tests; NO real figures."""
from datetime import UTC, datetime, timedelta
from hashlib import sha256
import json

import httpx
import pytest
from pydantic import ValidationError

from ingestion_service.bronze_store import BronzeStore
from ingestion_service.connectors.ibge_census_metadata_client import (
    IbgeCensusMetadataClient,
    validate_aggregate_metadata,
    validate_aggregate_periods,
)
from ingestion_service.pipelines.ibge_census_metadata import IbgeCensusMetadataPilot
from ingestion_service.source_evidence_store import QuarantinedJsonEvidenceStore, EvidenceIntegrityError
from ingestion_service.source_rights_review import (
    EvidenceApplicability,
    ReviewStatus,
    ReviewedRight,
    RightsEvidence,
    RightsReviewDossier,
    ibge_census_4714_initial_review,
    inspect_reuse_claim,
)


def metadata():
    return {
        "id": 4714,
        "nome": "População residente, área territorial e densidade demográfica",
        "pesquisa": "Censo Demográfico",
        "variaveis": [
            {"id": 93, "nome": "População residente", "unidade": "Pessoas", "sumarizacao": []},
            {"id": 1000, "nome": "Área territorial", "unidade": "km²"},
            {"id": 1001, "nome": "Densidade demográfica", "unidade": "hab/km²"},
        ],
        "nivelTerritorial": {"Administrativo": ["N1", "N2", "N3"], "Especial": [], "IBGE": []},
        "periodicidade": "Decenal",
        "URL": "https://sidra.ibge.gov.br/tabela/4714",
        "classificacoes": [],
        "assunto": [],
    }


def periods():
    return [{"id": "2022", "literals": ["Censo 2022"], "modificacao": "unverified-provider-field"}]


def transport_for(*, meta=None, years=None, status=200, ctype="application/json",
                  encoding="identity"):
    def respond(request):
        assert request.url.host == "servicodados.ibge.gov.br"
        assert request.method == "GET"
        if request.url.path.endswith("/metadados"):
            body = metadata() if meta is None else meta
        elif request.url.path.endswith("/periodos"):
            body = periods() if years is None else years
        else:
            raise AssertionError("Unexpected external source path")
        return httpx.Response(
            status_code=status,
            stream=httpx.ByteStream(json.dumps(body, ensure_ascii=False, indent=2).encode("utf-8")),
            headers={"content-type": ctype, "content-encoding": encoding},
        )
    return httpx.MockTransport(respond)


def capture(tmp_path, transport=None):
    return IbgeCensusMetadataPilot(
        client=IbgeCensusMetadataClient(transport=transport or transport_for()),
        bronze_store=BronzeStore(tmp_path),
    ).capture_census2022_contract()


def test_metadata_and_periods_captured_as_two_private_versions(tmp_path):
    result = capture(tmp_path)
    a, p = result.aggregate_receipt, result.periods_receipt
    assert a.dataset_code == "CENSO2022_4714_METADATA"
    assert p.dataset_code == "CENSO2022_4714_PERIODS"
    assert a.record_count == p.record_count == 1
    assert a.notes["rawSha256"] != a.notes["httpBodySha256"]
    assert a.notes["publicationStatus"] == "BRONZE_ONLY_UNREVIEWED"
    assert p.notes["licenseReviewStatus"] == "REVIEW_REQUIRED"
    assert p.notes["timeseriesPublication"] == "NOT_ATTEMPTED"
    assert a.notes["sourcePublishedAt"] is None
    assert p.notes["sourceRevisionAt"] is None
    rows = [json.loads(line) for line in p.normalized_payload_path.read_text().splitlines()]
    assert rows[0]["providerModificationFieldUninterpreted"] == "unverified-provider-field"
    assert rows[0]["providerModificationStatus"] == "SEMANTICS_UNVERIFIED"
    assert rows[0]["sourceRevisionAt"] is None
    store = QuarantinedJsonEvidenceStore(tmp_path)
    for receipt in (a, p):
        assert sha256(receipt.raw_payload_path.read_bytes()).hexdigest() == receipt.notes["httpBodySha256"]
        store.verify("IBGE", receipt.dataset_code, receipt.notes["httpBodySha256"])
    assert not list(tmp_path.glob("**/timeseries/**"))


def test_replay_same_source_metadata_does_not_overwrite(tmp_path):
    first = capture(tmp_path)
    second = capture(tmp_path)
    assert first.aggregate_receipt.run_id == second.aggregate_receipt.run_id
    assert first.periods_receipt.run_id == second.periods_receipt.run_id
    assert first.aggregate_receipt.fetched_at_utc == second.aggregate_receipt.fetched_at_utc
    assert len(list(tmp_path.rglob("manifest.json"))) == 2


def test_provider_period_modification_change_is_historical_new_revision(tmp_path):
    first = capture(tmp_path)
    second = capture(tmp_path, transport_for(years=[{
        "id": "2022", "literals": ["Censo 2022"], "modificacao": "changed-provider-field"
    }]))
    assert first.aggregate_receipt.run_id == second.aggregate_receipt.run_id
    assert first.periods_receipt.run_id != second.periods_receipt.run_id
    source = QuarantinedJsonEvidenceStore(tmp_path)
    assert len(source.list_verified_revisions("IBGE", "CENSO2022_4714_METADATA")) == 1
    assert len(source.list_verified_revisions("IBGE", "CENSO2022_4714_PERIODS")) == 2


@pytest.mark.parametrize("wrong", [
    {"id": 9999},
    {"id": 4714, "variaveis": []},
    {"id": 4714, "variaveis": [{"id": 93, "nome": "População", "unidade": "milhares de pessoas"}]},
])
def test_wrong_metadata_never_archived(tmp_path, wrong):
    with pytest.raises(ValueError):
        capture(tmp_path, transport_for(meta=wrong))
    assert not list(tmp_path.rglob("manifest.json"))


def test_unknown_geography_and_duplicate_population_rejected():
    m = metadata()
    m["nivelTerritorial"]["Administrativo"] = ["N2", "N3"]
    with pytest.raises(ValueError):
        validate_aggregate_metadata(m)
    m = metadata()
    m["variaveis"].append(m["variaveis"][0])
    with pytest.raises(ValueError):
        validate_aggregate_metadata(m)


@pytest.mark.parametrize("bad", [[], {}, [{"id": "2021"}], [{"id": "2022"}, {"id": "2022"}]])
def test_invalid_or_ambiguous_periods_rejected(bad):
    with pytest.raises(ValueError):
        validate_aggregate_periods(bad)


@pytest.mark.parametrize("status,ctype,encoding", [
    (503, "application/json", "identity"),
    (302, "application/json", "identity"),
    (200, "text/html", "identity"),
    (200, "application/json", "gzip"),
])
def test_transport_failure_before_archive(tmp_path, status, ctype, encoding):
    with pytest.raises(ValueError):
        capture(tmp_path, transport_for(status=status, ctype=ctype, encoding=encoding))
    assert not list(tmp_path.rglob("manifest.json"))


def test_default_rights_snapshot_is_historical_not_silently_refreshed():
    dossier = ibge_census_4714_initial_review()
    assert dossier.evaluated_at_utc.date().isoformat() == "2026-11-19"
    assert dossier.review_status is ReviewStatus.NEEDS_PROVIDER_CLARIFICATION


def test_rights_general_policy_and_api_docs_never_approve_table():
    at = datetime(2026, 11, 19, tzinfo=UTC)
    review = ibge_census_4714_initial_review(observed_at=at)
    assert review.review_status is ReviewStatus.NEEDS_PROVIDER_CLARIFICATION
    assert all(ev.applicability is EvidenceApplicability.GENERAL_CONTEXT_ONLY for ev in review.evidence)
    decision = inspect_reuse_claim(
        review, institution_code="IBGE", dataset_code="CENSO2022_4714",
        jurisdiction_iso3="BRA", operation=ReviewedRight.PUBLIC_COMMERCIAL_DISPLAY,
        evaluated_at=at + timedelta(days=1),
    )
    assert decision.status == "BLOCKED"
    assert "DATASET_REUSE_NOT_APPROVED" in decision.reasons


def test_approval_requires_specific_terms_reviewer_and_expiry():
    at = datetime(2026, 11, 19, tzinfo=UTC)
    with pytest.raises(ValidationError):
        RightsReviewDossier(
            institution_code="IBGE", dataset_code="CENSO2022_4714",
            jurisdiction_iso3="BRA",
            review_status=ReviewStatus.APPROVED_WITH_CONDITIONS,
            evaluated_at_utc=at,
            evaluator_id="reviewer", valid_until_utc=at + timedelta(days=3),
            reviewed_rights=frozenset({ReviewedRight.PUBLIC_DISPLAY}),
            attribution_instructions="IBGE",
            evidence=ibge_census_4714_initial_review(observed_at=at).evidence,
        )


def test_even_dataset_specific_signed_off_review_does_not_authorize_gateway():
    at = datetime(2026, 11, 19, tzinfo=UTC)
    evidence = RightsEvidence(
        reference_url="https://www.ibge.gov.br/acesso-informacao/dados-abertos.html",
        applicability=EvidenceApplicability.DATASET_SPECIFIC_TERMS,
        document_title="Synthetic authorization fixture, NOT a real IBGE grant",
        observed_at_utc=at,
        applicable_dataset_code="CENSO2022_4714",
        caveat="A synthetic test only; do not configure production from this fixture.",
    )
    dossier = RightsReviewDossier(
        institution_code="IBGE", dataset_code="CENSO2022_4714",
        jurisdiction_iso3="BRA",
        review_status=ReviewStatus.APPROVED_WITH_CONDITIONS,
        evaluated_at_utc=at, evaluator_id="synthetic-reviewer",
        valid_until_utc=at + timedelta(days=3),
        reviewed_rights=frozenset({ReviewedRight.PUBLIC_DISPLAY}),
        evidence=(evidence,),
        attribution_instructions="synthetic: full attribution",
    )
    decision = inspect_reuse_claim(
        dossier, institution_code="IBGE", dataset_code="CENSO2022_4714",
        jurisdiction_iso3="BRA", operation=ReviewedRight.PUBLIC_DISPLAY,
        evaluated_at=at + timedelta(days=1),
    )
    assert decision.status == "REVIEWED_CONDITIONS_RECORDED"
    assert "HUMAN_REVIEW_ALONE_DOES_NOT_AUTHORIZE_PRODUCTION_PUBLICATION" in decision.reasons
    expired = inspect_reuse_claim(
        dossier, institution_code="IBGE", dataset_code="CENSO2022_4714",
        jurisdiction_iso3="BRA", operation=ReviewedRight.PUBLIC_DISPLAY,
        evaluated_at=at + timedelta(days=4),
    )
    assert expired.status == "BLOCKED"
    mismatch = inspect_reuse_claim(
        dossier, institution_code="IBGE", dataset_code="CENSO2022_4714",
        jurisdiction_iso3="GAB", operation=ReviewedRight.PUBLIC_DISPLAY,
        evaluated_at=at + timedelta(days=1),
    )
    assert mismatch.status == "BLOCKED"
    other_operation = inspect_reuse_claim(
        dossier, institution_code="IBGE", dataset_code="CENSO2022_4714",
        jurisdiction_iso3="BRA", operation=ReviewedRight.API_REDISTRIBUTION,
        evaluated_at=at + timedelta(days=1),
    )
    assert other_operation.status == "BLOCKED"
