"""Private DATA-1B2A IBGE source metadata evidence. Never publication."""
from __future__ import annotations

from dataclasses import dataclass

from ingestion_service.bronze_store import BronzeStore
from ingestion_service.connectors.ibge_census_metadata_client import IbgeCensusMetadataClient
from ingestion_service.models import RunManifest


@dataclass(frozen=True)
class IbgeMetadataCapture:
    aggregate_receipt: RunManifest
    periods_receipt: RunManifest


class IbgeCensusMetadataPilot:
    """Archive official metadata and official period listing as separate revisions."""

    def __init__(self, *, client: IbgeCensusMetadataClient, bronze_store: BronzeStore):
        self._client = client
        self._bronze = bronze_store

    def capture_census2022_contract(self) -> IbgeMetadataCapture:
        metadata = self._client.fetch_census2022_contract()
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
        source_aggregate = metadata.aggregate
        receipt_aggregate = self._bronze.persist_quarantined_json_evidence(
            source_code="IBGE",
            dataset_code="CENSO2022_4714_METADATA",
            raw_response_bytes=source_aggregate.raw_response_bytes,
            normalized_records=[{
                "sourceCode": "IBGE",
                "datasetCode": "CENSO2022_4714",
                "resource": "AGGREGATE_METADATA",
                "tableId": metadata.table_id,
                "variableId": metadata.variable_id,
                "countryIso3": metadata.country_iso3,
                "geographicLevel": metadata.geographic_level,
                "referenceYear": metadata.reference_year,
                "populationUnit": metadata.source_unit,
                "publicationDateStatus": "NOT_VERIFIED",
                "rightsStatus": "REVIEW_REQUIRED",
            }],
            notes={
                **shared,
                "resource": "AGGREGATE_METADATA",
                "sourceUrl": source_aggregate.source_url,
                "rawSha256": source_aggregate.canonical_json_sha256,
                "httpBodySha256": source_aggregate.http_body_sha256,
            },
        )
        source_periods = metadata.periods
        receipt_periods = self._bronze.persist_quarantined_json_evidence(
            source_code="IBGE",
            dataset_code="CENSO2022_4714_PERIODS",
            raw_response_bytes=source_periods.raw_response_bytes,
            normalized_records=[{
                "sourceCode": "IBGE",
                "datasetCode": "CENSO2022_4714",
                "resource": "OFFICIAL_PERIOD_LIST",
                "referenceYear": metadata.reference_year,
                "providerModificationFieldUninterpreted": metadata.provider_modification_field,
                "providerModificationStatus": "SEMANTICS_UNVERIFIED",
                "sourcePublishedAt": None,
                "sourceRevisionAt": None,
                "rightsStatus": "REVIEW_REQUIRED",
            }],
            notes={
                **shared,
                "resource": "OFFICIAL_PERIOD_LIST",
                "sourceUrl": source_periods.source_url,
                "rawSha256": source_periods.canonical_json_sha256,
                "httpBodySha256": source_periods.http_body_sha256,
            },
        )
        # Only return a complete pair when both receipts passed verification.
        return IbgeMetadataCapture(
            aggregate_receipt=receipt_aggregate,
            periods_receipt=receipt_periods,
        )
