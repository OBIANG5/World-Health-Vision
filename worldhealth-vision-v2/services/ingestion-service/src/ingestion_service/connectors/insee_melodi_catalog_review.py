"""P2C3B: fail-closed verification of official INSEE Melodi dataset metadata.

NOT a commercial rights issuer and NOT permission to publish. The license
general policy is a HUMAN REVIEW input, never an auto-grant. The reason for
this mandatory parallel evidence: the real Melodi catalog specifies spatial
FEHM = "France hors Mayotte" even when data URL is GEO=FRANCE-F.
No model can safely map that row to ISO3=FRA without a signed human decision.

Official read-only endpoint and dataset are pinned and cannot be user-supplied.
No data API, POST, Timeseries, raw institutional figures, or private key here.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, UTC
from hashlib import sha256
import json
import re
from typing import Any

import httpx

from ingestion_service.connectors.insee_melodi_reference_client import (
    DATASET_CODE, InseeMelodiReferenceResearchClient,
    MelodiPopulationEvidence, _unique_key_pairs, _reject_nonfinite,
)
from ingestion_service.source_evidence_store import (
    EvidenceIntegrityError, QuarantinedJsonEvidenceStore, _canonical_hash,
)

CATALOG_URL = "https://api.insee.fr/melodi/catalog/DS_POPULATIONS_REFERENCE"
CATALOG_PATH = "/melodi/catalog/DS_POPULATIONS_REFERENCE"
CATALOG_DATASET_CODE = "DS_POPULATIONS_REFERENCE_CATALOG"
CATALOG_MAX_BYTES = 500_000

SPATIAL_SCOPE_ID = "FEHM"  # France hors Mayotte. NOT ISO3 FRA.
SPATIAL_SCOPE_LABEL_FR = "France hors Mayotte"
PUBLISHER_ID = "INSEE"
PERIODICITY_FR = "Annuel"
DSD = "DSD_POPULATIONS_REFERENCE"
ACCESS_FR = "Public"
CONFIDENTIALITY_FR = "Libre"
PUBLISHER_STATUS = "publie"
UNIT_FR = "Individu"


@dataclass(frozen=True)
class InseePopulationCatalogEvidence:
    """Verifiable source metadata; no observation values and NO reuse grant."""
    original_metadata_bytes: bytes
    original_http_sha256: str
    metadata_source_url: str
    dataset_code: str
    publisher_id: str
    spatial_code: str
    spatial_label_fr: str
    geographic_vintage: int
    observation_period: int
    modified_at: str
    issued_at: str
    access_status_fr: str
    confidentiality_status_fr: str
    publication_state: str
    statistical_unit_fr: str
    data_reuse_review: str = "REVIEW_REQUIRED"
    public_api_ingest: str = "NOT_GRANTED"


def _object(data: dict[str, Any], key: str) -> dict[str, Any]:
    value = data.get(key)
    if not isinstance(value, dict):
        raise EvidenceIntegrityError("Missing or changed Insee catalog object " + key)
    return value


def _text(value: Any, key: str, limit: int = 256) -> str:
    if not isinstance(value, str) or not 1 <= len(value) <= limit:
        raise EvidenceIntegrityError("Invalid Insee catalog text " + key)
    return value


def _localized(data: dict[str, Any], key: str, lang: str = "fr") -> str:
    value = data.get(key)
    if not isinstance(value, list) or not 1 <= len(value) <= 12:
        raise EvidenceIntegrityError("Unreviewed localization format " + key)
    translated = [
        row.get("content") for row in value
        if isinstance(row, dict) and row.get("lang") == lang
    ]
    if len(translated) != 1:
        raise EvidenceIntegrityError("Missing or conflicting Insee catalog locale " + key)
    return _text(translated[0], key)


def _parse_catalog_date(value: Any, key: str) -> str:
    label = _text(value, key)
    if not re.fullmatch(r"\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,9})?(?:Z|[+-]\d\d:\d\d)?", label):
        raise EvidenceIntegrityError("Malformed metadata timestamp " + key)
    try:
        # Insee metadata timestamps may have nine decimal digits (nano)
        dt = datetime.fromisoformat(label.replace("Z", "+00:00"))
        # Date-only and nonsensical future-dated catalogs may not be considered
        # operationally current; note that timestamps do not prove license.
        if dt.year < 2000 or dt.year > datetime.now(UTC).year + 1:
            raise EvidenceIntegrityError("Implausible metadata timestamp " + key)
    except ValueError as err:
        raise EvidenceIntegrityError("Invalid metadata timestamp " + key) from err
    return label


def _year_at_start(value: Any, key: str) -> int:
    label = _text(value, key)
    if not re.fullmatch(r"(20\d{2})-01-01T\d\d:\d\d:\d\d(?:\.\d+)?", label):
        raise EvidenceIntegrityError("Unexpected official metadata year encoding " + key)
    return int(label[:4])


def parse_insee_reference_catalog(body: bytes, *, source_url: str = CATALOG_URL) -> InseePopulationCatalogEvidence:
    """Only a narrowed, independently verifiable official-source shape.

    Strictly refuse shifts in territorial scope, year, unit, provider or
    statistical status; require a fresh human re-evaluation before a new
    snapshot/version. Never interpret Public/Libre as commercial permission.
    """
    if source_url != CATALOG_URL:
        raise EvidenceIntegrityError("Unreviewed catalog URL")
    if not isinstance(body, bytes) or not 1 <= len(body) <= CATALOG_MAX_BYTES:
        raise EvidenceIntegrityError("Missing or oversized original catalog bytes")
    try:
        data = json.loads(body.decode("utf-8"), object_pairs_hook=_unique_key_pairs,
                          parse_constant=_reject_nonfinite)
    except (UnicodeDecodeError, ValueError) as err:
        raise EvidenceIntegrityError("Malformed or ambiguous catalog JSON") from err
    if not isinstance(data, dict):
        raise EvidenceIntegrityError("Insee catalog top-level object required")
    if data.get("identifier") != DATASET_CODE:
        raise EvidenceIntegrityError("Dataset identity changed")
    if _object(data, "publisher").get("id") != PUBLISHER_ID:
        raise EvidenceIntegrityError("Publisher not validated")
    spatial = _object(data, "spatial")
    if spatial.get("id") != SPATIAL_SCOPE_ID:
        raise EvidenceIntegrityError("Geographic scope changed; ISO3 mapping requires review")
    if _localized(spatial, "label") != SPATIAL_SCOPE_LABEL_FR:
        raise EvidenceIntegrityError("Geographic scope label changed")
    if _object(data, "status").get("id") != PUBLISHER_STATUS:
        raise EvidenceIntegrityError("Dataset not officially published")
    access = _localized(data, "accessRights")
    if access != ACCESS_FR:
        raise EvidenceIntegrityError("Unreviewed dataset access status")
    confidentiality = _localized(data, "confidentialityStatus")
    if confidentiality != CONFIDENTIALITY_FR:
        raise EvidenceIntegrityError("Dataset confidentiality changed")
    periodicity = _localized(_object(data, "accrualPeriodicity"), "label")
    if periodicity != PERIODICITY_FR:
        raise EvidenceIntegrityError("Insee data are not annual")
    if _object(data, "structure").get("dsd") != DSD:
        raise EvidenceIntegrityError("Unreviewed Melodi Data Structure Definition")
    units = data.get("statisticalUnit")
    if not isinstance(units, list) or len(units) != 1 or not isinstance(units[0], dict):
        raise EvidenceIntegrityError("Unreviewed dataset unit")
    unit_fr = _localized(units[0], "label")
    if unit_fr != UNIT_FR:
        raise EvidenceIntegrityError("Unit changed from individuals")
    temporal = _object(data, "temporal")
    start = _year_at_start(temporal.get("startPeriod"), "temporal.startPeriod")
    end = _year_at_start(temporal.get("endPeriod"), "temporal.endPeriod")
    # The P2C3 connector is *one* observation 2023 with 2025 geography;
    # broader/superseding periods need explicit new review and tests.
    if start != 2023 or end != 2023:
        raise EvidenceIntegrityError("Catalog period changed or expanded")
    geo_vintage = _year_at_start(data.get("spatialTemporal"), "spatialTemporal")
    if geo_vintage != 2025:
        raise EvidenceIntegrityError("Geographic reference vintage changed")
    issued = _parse_catalog_date(data.get("issued"), "issued")
    modified = _parse_catalog_date(data.get("modified"), "modified")
    if _parse_catalog_date(modified, "modified") < issued:
        raise EvidenceIntegrityError("Metadata modified before issued")
    return InseePopulationCatalogEvidence(
        original_metadata_bytes=body, original_http_sha256=sha256(body).hexdigest(),
        metadata_source_url=source_url,
        dataset_code=DATASET_CODE, publisher_id=PUBLISHER_ID,
        spatial_code=SPATIAL_SCOPE_ID, spatial_label_fr=SPATIAL_SCOPE_LABEL_FR,
        geographic_vintage=geo_vintage, observation_period=start,
        issued_at=issued, modified_at=modified,
        access_status_fr=access, confidentiality_status_fr=confidentiality,
        publication_state=PUBLISHER_STATUS, statistical_unit_fr=unit_fr,
    )


class InseeMelodiCatalogResearchClient:
    """Read-only metadata GET. Disabled by default; no redirects or retries."""
    def __init__(self, *, allow_live: bool = False, timeout_seconds: float = 15.0,
                 transport: httpx.BaseTransport | None = None) -> None:
        if not 1 <= timeout_seconds <= 30:
            raise ValueError("Catalog timeout must be bounded")
        self._live = allow_live
        self._timeout = timeout_seconds
        self._transport = transport

    def fetch(self) -> InseePopulationCatalogEvidence:
        if not self._live:
            raise PermissionError("Institutional catalog request requires explicit private review")
        with httpx.Client(base_url="https://api.insee.fr", timeout=self._timeout,
                          follow_redirects=False, transport=self._transport,
                          headers={"Accept": "application/json",
                                   "User-Agent": "World-Vision-Metadata-Research-Only/1"}) as client:
            resp = client.get(CATALOG_PATH)
            if resp.status_code != 200:
                raise EvidenceIntegrityError("Insee catalog HTTP status " + str(resp.status_code))
            if resp.headers.get("Content-Type", "").split(";", 1)[0].strip().lower() != "application/json":
                raise EvidenceIntegrityError("Unreviewed official metadata content type")
            if len(resp.content) > CATALOG_MAX_BYTES or str(resp.request.url) != CATALOG_URL:
                raise EvidenceIntegrityError("Catalog response size or source URL changed")
            return parse_insee_reference_catalog(resp.content, source_url=CATALOG_URL)


def validate_population_and_metadata(
    rows: list[MelodiPopulationEvidence],
    metadata: InseePopulationCatalogEvidence,
) -> None:
    """Independent scope, period and source identity barrier; never publish."""
    if not rows or len(rows) != 1:
        raise EvidenceIntegrityError("A single official reference population scope is required")
    for row in rows:
        if not isinstance(row, MelodiPopulationEvidence):
            raise EvidenceIntegrityError("Invalid population evidence")
        if row.dataset_code != metadata.dataset_code or row.measure_code != "PTOT":
            raise EvidenceIntegrityError("Incompatible population dataset or measure")
        if row.year != metadata.observation_period:
            raise EvidenceIntegrityError("Population year differs from catalog coverage")
        if row.geo_reference != str(metadata.geographic_vintage):
            raise EvidenceIntegrityError("Population geographic vintage differs from catalog")
        if row.geo_filter != "FRANCE-F":
            raise EvidenceIntegrityError("Population source geography differs from catalog request")
    if metadata.spatial_code != "FEHM" or metadata.publisher_id != "INSEE":
        raise EvidenceIntegrityError("Unverified institutional metadata cannot corroborate the observation")
    # Explicitly NO automatic ISO3 map. Catalog scope is France HORS MAYOTTE.


def capture_private_insee_catalog(
    *, root, metadata: InseePopulationCatalogEvidence,
):
    """Content-addressed private official catalog bytes; research-only."""
    # Revalidate all bytes, not just dataclass claims.
    checked = parse_insee_reference_catalog(
        metadata.original_metadata_bytes, source_url=metadata.metadata_source_url)
    if checked != metadata:
        raise EvidenceIntegrityError("Metadata object differs from original authoritative bytes")
    return QuarantinedJsonEvidenceStore(root).capture(
        source_code="INSEE", dataset_code=CATALOG_DATASET_CODE,
        raw_response_bytes=metadata.original_metadata_bytes,
        normalized_records=[{
            "datasetCode": checked.dataset_code, "publisherId": checked.publisher_id,
            "geographicScopeId": checked.spatial_code,
            "geographicScopeLabelFr": checked.spatial_label_fr,
            "geographicVintage": checked.geographic_vintage,
            "observationPeriod": checked.observation_period,
            "metadataIssued": checked.issued_at, "metadataModified": checked.modified_at,
            "unit": checked.statistical_unit_fr, "reuseRights": "REVIEW_REQUIRED",
            "publicApiIngest": "NOT_GRANTED",
        }],
        notes={
            "rawSha256": _canonical_hash(metadata.original_metadata_bytes),
            "metadataSourceUrl": checked.metadata_source_url,
            "httpBodySha256": checked.original_http_sha256,
            "licenseReviewStatus": "REVIEW_REQUIRED",
            "publicationStatus": "BRONZE_ONLY_UNREVIEWED",
            "timeseriesPublication": "NOT_ATTEMPTED",
            "sourceStatus": "PRIVATE_RESEARCH_VALIDATION",
            "geographicScopeStatus": "FEHM_VERIFIED_NOT_FRA",
            "providerLicense": "NOT_GRANTED",
        }
    )
