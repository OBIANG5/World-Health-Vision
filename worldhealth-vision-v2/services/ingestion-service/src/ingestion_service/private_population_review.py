"""DATA-1B3: verified PRIVATE review of IBGE composite + one WDI byte revision.

Requires explicit source SHAs and existing successful acquisition events.
Writes a stable, content-addressed *methodology-only* receipt. No numerical
values, false disagreement or raw records appear in the returned receipt.
"""
from __future__ import annotations

from hashlib import sha256
import json
import os
from pathlib import Path
import re
import secrets

from ingestion_service.acquisition_journal import (
    AcquisitionJournal, _serialized, _sync_dir, _write_new,
)
from ingestion_service.models import IndicatorObservation
from ingestion_service.population_comparability import (
    PopulationMethod, PopulationSourceSpec, assess_population_comparability,
)
from ingestion_service.source_composite_receipt import IbgeCompositeReceiptStore
from ingestion_service.source_evidence_store import (
    EvidenceIntegrityError, QuarantinedJsonEvidenceStore,
)

_SHA = re.compile(r"^[0-9a-f]{64}$")
_REPORT_SCHEMA = "WORLD_VISION_PRIVATE_IBGE_WDI_POPULATION_COMPARISON_V1"
_IBGE_METHOD = "https://biblioteca.ibge.gov.br/visualizacao/livros/liv102011.pdf"
_WDI_METHOD = (
    "https://databank.worldbank.org/metadataglossary/"
    "world-development-indicators/series/SP.POP.TOTL"
)
_WDI_DATASET = "WDI_POP_TOTAL_BRA_2022"


def _private_integer(value: float | None) -> int:
    # Avoid float overflow, NaN, fractional, bool and unsupported population.
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise EvidenceIntegrityError("Missing source population observation")
    if not 100_000_000 <= value <= 400_000_000 or int(value) != value:
        raise EvidenceIntegrityError("Unexpected private population scale")
    return int(value)


class PrivatePopulationReviewStore:
    """Review with 2 source lineages; never an operational publication gate."""

    def __init__(self, bronze_root: Path):
        self._root = Path(bronze_root)
        self._revisions = QuarantinedJsonEvidenceStore(self._root)
        self._journal = AcquisitionJournal(self._root)
        self._ibge_composite = IbgeCompositeReceiptStore(self._root)

    def _reports(self) -> Path:
        parent = self._root / "ibge"
        path = parent / "_population_reviews"
        if any(p.is_symlink() for p in (self._root, parent, path)):
            raise EvidenceIntegrityError("Unsafe private comparison path")
        return path

    def _get_observation(self, source: str, dataset: str, digest: str) -> tuple[IndicatorObservation, dict]:
        manifest = self._revisions.verify(source, dataset, digest)
        if manifest.record_count != 1:
            raise EvidenceIntegrityError("Population comparison requires exactly one observation")
        if manifest.notes.get("countryIso3") != "BRA" or manifest.notes.get("referenceYear") != 2022:
            raise EvidenceIntegrityError("Population source scope must be BRA/2022")
        if (manifest.notes.get("licenseReviewStatus") != "REVIEW_REQUIRED"
            or manifest.notes.get("publicationStatus") != "BRONZE_ONLY_UNREVIEWED"
            or manifest.notes.get("timeseriesPublication") != "NOT_ATTEMPTED"):
            raise EvidenceIntegrityError("Private population source reuse gate weakened")
        try:
            record = json.loads(manifest.normalized_payload_path.read_text(encoding="utf-8"))
            obs = IndicatorObservation.model_validate(record)
        except (ValueError, UnicodeDecodeError) as exc:
            raise EvidenceIntegrityError("Normalized private observation is invalid") from exc
        if obs.country_iso3 != "BRA" or obs.period_label != "2022":
            raise EvidenceIntegrityError("Observation scope changed")
        _private_integer(obs.value)
        return obs, manifest.notes

    def evaluate(self, *, ibge_composite_sha256: str, wdi_response_sha256: str) -> dict:
        if not isinstance(ibge_composite_sha256, str) or not _SHA.fullmatch(ibge_composite_sha256):
            raise EvidenceIntegrityError("Exact existing IBGE composite SHA required")
        if not isinstance(wdi_response_sha256, str) or not _SHA.fullmatch(wdi_response_sha256):
            raise EvidenceIntegrityError("Exact existing WDI response SHA required")
        verified = self._ibge_composite.verify(ibge_composite_sha256)
        if verified["publicDisplayAuthorised"] is not False:
            raise EvidenceIntegrityError("IBGE rights gate changed")
        path = self._root / "ibge" / "_composite_receipts" / (ibge_composite_sha256 + ".json")
        body = path.read_bytes()
        if sha256(body).hexdigest() != ibge_composite_sha256:
            raise EvidenceIntegrityError("IBGE composite receipt changed during comparison")
        ibge_parts = json.loads(body)["evidenceParts"]
        if not isinstance(ibge_parts, list) or len(ibge_parts) != 3:
            raise EvidenceIntegrityError("Incomplete IBGE composite")
        population_digest = ibge_parts[0].get("responseSha256")
        ibge, ibge_notes = self._get_observation("IBGE", "CENSO2022_4714", population_digest)
        if (ibge.indicator_code != "IBGE.CENSUS2022.RESIDENT_POP"
            or ibge.value_status != "OBSERVED"
            or ibge.source_metadata.get("originalAggregateId") != "4714"
            or ibge.source_metadata.get("originalVariableId") != "93"):
            raise EvidenceIntegrityError("IBGE source is not the pinned resident census")
        wdi, wdi_notes = self._get_observation("WORLD_BANK", _WDI_DATASET, wdi_response_sha256)
        if (wdi.indicator_code != "SP.POP.TOTL"
            or wdi.value_status != "MIDYEAR_ESTIMATE"
            or wdi_notes.get("indicatorCode") != "SP.POP.TOTL"
            or wdi_notes.get("populationDefinition") != "DE_FACTO_MIDYEAR_ESTIMATE"
            or wdi.source_metadata.get("originalDatasetId") != "2"):
            raise EvidenceIntegrityError("WDI source is not pinned WDI Brazil 2022")
        audit = self._journal.audit("WORLD_BANK", _WDI_DATASET)
        wdi_event = next(
            (x for x in audit["versions"] if x["responseSha256"] == wdi_response_sha256),
            None,
        )
        if wdi_event is None or wdi_event["successfulFetchCount"] < 1:
            raise EvidenceIntegrityError("WDI must have a successful separately journaled fetch")
        national = PopulationSourceSpec(
            institution_code="IBGE", dataset_code="CENSO2022_4714",
            indicator_code=ibge.indicator_code, country_iso3="BRA", year=2022,
            unit="PERSONS", population_concept="RESIDENT_DE_JURE",
            method=PopulationMethod.NATIONAL_RESIDENT_CENSUS_WITH_IMPUTATION,
            reference_instant="2022-07-31_CENSUS",
            source_data_dependency="PRIMARY_FIELD_ENUMERATION_WITH_IMPUTATION",
            response_sha256=population_digest,
            evidence_level="VERIFIED_PRIVATE_BRONZE",
            rights_status="REVIEW_REQUIRED", method_document_url=_IBGE_METHOD,
            observation_value=_private_integer(ibge.value),
        )
        international = PopulationSourceSpec(
            institution_code="WORLD_BANK", dataset_code=_WDI_DATASET,
            indicator_code=wdi.indicator_code, country_iso3="BRA", year=2022,
            unit="PERSONS", population_concept="DE_FACTO_RESIDENT",
            method=PopulationMethod.INTERNATIONAL_DE_FACTO_MIDYEAR_ESTIMATE,
            reference_instant="2022_MIDYEAR_ESTIMATE",
            source_data_dependency="UNRESOLVED_NATIONAL_AND_UN_MODEL_INPUTS",
            response_sha256=wdi_response_sha256,
            evidence_level="VERIFIED_PRIVATE_BRONZE",
            rights_status="REVIEW_REQUIRED", method_document_url=_WDI_METHOD,
            observation_value=_private_integer(wdi.value),
        )
        assessment = assess_population_comparability(national, international)
        report = {
            "schema": _REPORT_SCHEMA,
            "status": "PRIVATE_METHODOLOGY_REVIEW_ONLY",
            "scope": {"countryIso3": "BRA", "year": 2022, "unit": "PERSONS"},
            "ibgeCompositeReceiptSha256": ibge_composite_sha256,
            "wdiResponseSha256": wdi_response_sha256,
            "ibgePopulationVersionSha256": population_digest,
            "sourceMetadataReferences": {
                "ibge": national.method_document_url,
                "worldBank": international.method_document_url,
            },
            # The Pydantic private numeric value has exclude=True. Even if a
            # future Pydantic version changes behavior, only APPROVED fields
            # from the assessment are projected into this private report.
            "assessment": assessment.model_dump(mode="json"),
            "sourceDependence": "NOT_PROVEN_INDEPENDENT",
            "ibgeDatasetRights": "NEEDS_PROVIDER_CLARIFICATION",
            "worldBankReUse": "SEPARATE_REVIEW_REQUIRED",
            "numericComparison": "NOT_COMPUTED",
            "publicDisplayAuthorised": False,
            "timeseriesPublication": "NOT_ATTEMPTED",
        }
        payload = _serialized(report)
        if b'"numeric_delta_persons":null' not in payload:
            raise EvidenceIntegrityError("No numerical comparison may be auto-authorized")
        digest = sha256(payload).hexdigest()
        parent = self._reports()
        parent.mkdir(parents=True, mode=0o700, exist_ok=True)
        os.chmod(parent, 0o700)
        destination = parent / (digest + ".json")
        if destination.is_symlink():
            raise EvidenceIntegrityError("Unsafe existing comparison receipt")
        if destination.exists():
            if destination.read_bytes() != payload:
                raise EvidenceIntegrityError("Existing comparison receipt modified")
        else:
            temp = parent / (".review-" + secrets.token_hex(16))
            try:
                _write_new(temp, payload)
                try:
                    os.link(temp, destination, follow_symlinks=False)
                    _sync_dir(parent)
                except FileExistsError:
                    if destination.is_symlink() or destination.read_bytes() != payload:
                        raise EvidenceIntegrityError("Concurrent comparison receipt conflict")
            finally:
                temp.unlink(missing_ok=True)
        return {
            "reviewReceiptSha256": digest,
            "relativePath": "ibge/_population_reviews/" + digest + ".json",
            "comparabilityStatus": assessment.status.value,
            "numericComparison": "NOT_COMPUTED",
            "publicDisplayAuthorised": False,
            "timeseriesPublication": "NOT_ATTEMPTED",
        }

    def verify(self, review_sha256: str) -> dict:
        if not isinstance(review_sha256, str) or not _SHA.fullmatch(review_sha256):
            raise EvidenceIntegrityError("Invalid method review receipt SHA")
        path = self._reports() / (review_sha256 + ".json")
        if not path.is_file() or path.is_symlink() or not 1 <= path.stat().st_size <= 16_384:
            raise EvidenceIntegrityError("Private methodology report missing or unsafe")
        data = path.read_bytes()
        if sha256(data).hexdigest() != review_sha256:
            raise EvidenceIntegrityError("Method comparison report changed")
        try:
            report = json.loads(data)
        except ValueError as exc:
            raise EvidenceIntegrityError("Invalid private comparison receipt") from exc
        if (report.get("schema") != _REPORT_SCHEMA
            or report.get("publicDisplayAuthorised") is not False
            or report.get("numericComparison") != "NOT_COMPUTED"
            or report.get("timeseriesPublication") != "NOT_ATTEMPTED"
            or report.get("sourceDependence") != "NOT_PROVEN_INDEPENDENT"
            or report.get("scope") != {"countryIso3": "BRA", "year": 2022, "unit": "PERSONS"}):
            raise EvidenceIntegrityError("Method report publishing or scope gate compromised")
        checked = self._ibge_composite.verify(report["ibgeCompositeReceiptSha256"])
        if checked["publicDisplayAuthorised"] is not False:
            raise EvidenceIntegrityError("Referenced IBGE composite unapproved")
        wdi = self._revisions.verify("WORLD_BANK", _WDI_DATASET, report["wdiResponseSha256"])
        if wdi.notes.get("publicationStatus") != "BRONZE_ONLY_UNREVIEWED":
            raise EvidenceIntegrityError("WDI source publication gate changed")
        audit = self._journal.audit("WORLD_BANK", _WDI_DATASET)
        if report["wdiResponseSha256"] not in {v["responseSha256"] for v in audit["versions"]}:
            raise EvidenceIntegrityError("WDI fetch proof missing")
        return {
            "reviewReceiptSha256": review_sha256,
            "sourceCount": 2, "numericComparison": "NOT_COMPUTED",
            "publicDisplayAuthorised": False,
        }
