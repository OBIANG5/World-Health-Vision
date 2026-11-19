"""DATA-1B2B: journal each official IBGE metadata fetch, then private Bronze only.

Aggregate metadata and period listing are distinct resources. One successful
resource never silently certifies the other; no dates of provider publication
or dataset rights are inferred from the period "modificacao" field.
"""
from __future__ import annotations

from dataclasses import dataclass

from ingestion_service.bronze_store import BronzeStore
from ingestion_service.connectors.ibge_census_metadata_client import (
    IBGE_METADATA_URL, IBGE_PERIODS_URL, IbgeCensusMetadataClient,
    validate_aggregate_metadata, validate_aggregate_periods,
)
from ingestion_service.models import RunManifest


@dataclass(frozen=True)
class IbgeMetadataCapture:
    aggregate_receipt: RunManifest
    periods_receipt: RunManifest


class IbgeCensusMetadataPilot:
    """Archive two official HTTP resources with separate immutable attempts."""

    def __init__(self, *, client: IbgeCensusMetadataClient, bronze_store: BronzeStore):
        self._client = client
        self._bronze = bronze_store
        self._journal = bronze_store.private_acquisition_journal()

    def capture_census2022_contract(self) -> IbgeMetadataCapture:
        shared = {
            "sourceType": "NATIONAL_OFFICIAL",
            "sourceInstitution": "IBGE",
            "tableId": "4714",
            "variableId": "93",
            "countryIso3": "BRA",
            "geographicLevel": "N1",
            "referenceYear": 2022,
            "publicationStatus": "BRONZE_ONLY_UNREVIEWED",
            "timeseriesPublication": "NOT_ATTEMPTED",
            "licenseReviewStatus": "REVIEW_REQUIRED",
            "sourcePublishedAt": None,
            "sourceRevisionAt": None,
            "rightsDossier": "IBGE:CENSO2022_4714:REVIEW_REQUIRED",
        }
        aggregate_dataset = "CENSO2022_4714_METADATA"
        aggregate_event = self._journal.begin(
            source_code="IBGE", dataset_code=aggregate_dataset,
            source_url=IBGE_METADATA_URL,
        )
        try:
            aggregate = self._client.fetch_aggregate_metadata()
            population_variable = validate_aggregate_metadata(aggregate.payload)
            aggregate_receipt = self._bronze.persist_quarantined_json_evidence(
                source_code="IBGE", dataset_code=aggregate_dataset,
                raw_response_bytes=aggregate.raw_response_bytes,
                normalized_records=[{
                    "sourceCode": "IBGE",
                    "datasetCode": "CENSO2022_4714",
                    "resource": "AGGREGATE_METADATA",
                    "tableId": "4714", "variableId": "93",
                    "countryIso3": "BRA", "geographicLevel": "N1",
                    "referenceYear": 2022,
                    "populationUnit": population_variable["unidade"],
                    "publicationDateStatus": "NOT_VERIFIED",
                    "rightsStatus": "REVIEW_REQUIRED",
                }],
                notes={
                    **shared, "resource": "AGGREGATE_METADATA",
                    "sourceUrl": aggregate.source_url,
                    "rawSha256": aggregate.canonical_json_sha256,
                    "httpBodySha256": aggregate.http_body_sha256,
                },
            )
        except Exception as error:
            self._journal.failure(aggregate_event, error=error)
            raise
        self._journal.success(
            aggregate_event,
            response_sha256=aggregate_receipt.notes["httpBodySha256"],
            http_status=aggregate.http_status,
            etag=aggregate.etag, last_modified=aggregate.last_modified,
        )

        # Even if a period request fails, the FIRST acquisition remains an
        # honest, independently recorded successful fetch and immutable version.
        periods_dataset = "CENSO2022_4714_PERIODS"
        periods_event = self._journal.begin(
            source_code="IBGE", dataset_code=periods_dataset,
            source_url=IBGE_PERIODS_URL,
        )
        try:
            periods = self._client.fetch_official_periods()
            period_2022 = validate_aggregate_periods(periods.payload)
            periods_receipt = self._bronze.persist_quarantined_json_evidence(
                source_code="IBGE", dataset_code=periods_dataset,
                raw_response_bytes=periods.raw_response_bytes,
                normalized_records=[{
                    "sourceCode": "IBGE",
                    "datasetCode": "CENSO2022_4714",
                    "resource": "OFFICIAL_PERIOD_LIST",
                    "referenceYear": 2022,
                    "providerModificationFieldUninterpreted": period_2022.get("modificacao"),
                    "providerModificationStatus": "SEMANTICS_UNVERIFIED",
                    "sourcePublishedAt": None,
                    "sourceRevisionAt": None,
                    "rightsStatus": "REVIEW_REQUIRED",
                }],
                notes={
                    **shared, "resource": "OFFICIAL_PERIOD_LIST",
                    "sourceUrl": periods.source_url,
                    "rawSha256": periods.canonical_json_sha256,
                    "httpBodySha256": periods.http_body_sha256,
                },
            )
        except Exception as error:
            self._journal.failure(periods_event, error=error)
            raise
        self._journal.success(
            periods_event,
            response_sha256=periods_receipt.notes["httpBodySha256"],
            http_status=periods.http_status,
            etag=periods.etag, last_modified=periods.last_modified,
        )
        return IbgeMetadataCapture(
            aggregate_receipt=aggregate_receipt,
            periods_receipt=periods_receipt,
        )
