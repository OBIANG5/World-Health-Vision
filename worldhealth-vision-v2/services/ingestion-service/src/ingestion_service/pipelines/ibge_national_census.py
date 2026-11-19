"""Source-to-Bronze pilot: no public Timeseries write and no inferred reuse grant."""
from __future__ import annotations

from ingestion_service.bronze_store import BronzeStore
from ingestion_service.connectors.ibge_national_census_client import (
    IBGE_POPULATION_DATASET,
    IBGE_POPULATION_INDICATOR,
    IBGE_BASE_URL,
    IBGE_DATA_PATH,
    IbgeNationalCensusClient,
)
from ingestion_service.models import IndicatorObservation


class IbgeNationalCensusPilot:
    def __init__(self, *, client: IbgeNationalCensusClient, bronze_store: BronzeStore):
        self._client = client
        self._bronze = bronze_store
        self._journal = bronze_store.private_acquisition_journal()

    def capture_population_2022(self):
        handle = self._journal.begin(
            source_code="IBGE", dataset_code=IBGE_POPULATION_DATASET,
            source_url=IBGE_BASE_URL + IBGE_DATA_PATH + "?localidades=N1%5Ball%5D",
        )
        try:
            item = self._client.fetch_population_2022()
            observation = IndicatorObservation.annual(
                country_iso3="BRA",
                indicator_code=IBGE_POPULATION_INDICATOR,
                year=2022,
                value=float(item.resident_population),
                value_status="OBSERVED",
                source_published_at=None,  # Never invent a publication date.
                source_metadata={
                    "officialSource": "IBGE",
                    "originalAggregateId": "4714",
                    "originalVariableId": "93",
                    "originalLocalityId": "1",
                    "originalUnit": item.source_unit_label,
                    "originalLabel": item.source_variable_label,
                    "sourceUrl": item.source_url,
                    "rawSha256": item.raw_sha256,
                    "httpBodySha256": item.http_body_sha256,
                    "referencePopulationType": "RESIDENT_CENSUS_POPULATION",
                    "reuseRights": "REVIEW_REQUIRED",
                },
                quality_flags=[
                    "CENSUS_2022_REFERENCE_NOT_CURRENT_ESTIMATE",
                    "SOURCE_REVISION_DATE_NOT_VERIFIED",
                    "REUSE_RIGHTS_REVIEW_REQUIRED",
                ],
            )
            receipt = self._bronze.persist_quarantined_json_evidence(
                source_code="IBGE",
                dataset_code=IBGE_POPULATION_DATASET,
                raw_response_bytes=item.raw_response_bytes,
                normalized_records=[observation.model_dump(mode="json")],
                notes={
                    "countryIso3": "BRA",
                    "sourceType": "NATIONAL_OFFICIAL",
                    "sourceUrl": item.source_url,
                    "rawSha256": item.raw_sha256,
                    "httpBodySha256": item.http_body_sha256,
                    "responseReceivedAtUtc": item.response_received_at_utc,
                    "observations": 1,
                    "referenceYear": 2022,
                    "sourceRevisionDate": None,
                    "licenseReviewStatus": "REVIEW_REQUIRED",
                    "publicationStatus": "BRONZE_ONLY_UNREVIEWED",
                    "timeseriesPublication": "NOT_ATTEMPTED",
                    "warning": "Raw verified shape is not equivalent to official rights approval or independent source corroboration.",
                },
            )
        except Exception as error:
            # Error-class only; provider bodies and values must never enter logs.
            self._journal.failure(handle, error=error)
            raise
        # The byte-version is verified before an immutable success event is
        # committed; repeated fetches append new events, not fake revisions.
        self._journal.success(
            handle, response_sha256=receipt.notes["httpBodySha256"],
            http_status=item.http_status or 200,
            etag=item.etag, last_modified=item.last_modified,
        )
        return receipt
