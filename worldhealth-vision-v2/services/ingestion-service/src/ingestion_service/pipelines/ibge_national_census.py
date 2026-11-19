"""Source-to-Bronze pilot: no public Timeseries write and no inferred reuse grant."""
from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from ingestion_service.bronze_store import BronzeStore
from ingestion_service.connectors.ibge_national_census_client import (
    IBGE_POPULATION_DATASET,
    IBGE_POPULATION_INDICATOR,
    IbgeNationalCensusClient,
)
from ingestion_service.models import IndicatorObservation


class IbgeNationalCensusPilot:
    def __init__(self, *, client: IbgeNationalCensusClient, bronze_store: BronzeStore):
        self._client = client
        self._bronze = bronze_store

    def capture_population_2022(self):
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
                "referencePopulationType": "RESIDENT_CENSUS_POPULATION",
                "reuseRights": "REVIEW_REQUIRED",
            },
            quality_flags=[
                "CENSUS_2022_REFERENCE_NOT_CURRENT_ESTIMATE",
                "SOURCE_REVISION_DATE_NOT_VERIFIED",
                "REUSE_RIGHTS_REVIEW_REQUIRED",
            ],
        )
        run_id = f"ibge-census2022-bra-{datetime.now(UTC):%Y%m%dT%H%M%SZ}-{uuid4().hex[:12]}"
        return self._bronze.persist_dataset(
            source_code="IBGE",
            dataset_code=IBGE_POPULATION_DATASET,
            run_id=run_id,
            raw_payload=item.raw_payload,
            normalized_records=[observation.model_dump(mode="json")],
            notes={
                "countryIso3": "BRA",
                "sourceType": "NATIONAL_OFFICIAL",
                "sourceUrl": item.source_url,
                "rawSha256": item.raw_sha256,
                "observations": 1,
                "referenceYear": 2022,
                "sourceRevisionDate": None,
                "licenseReviewStatus": "REVIEW_REQUIRED",
                "publicationStatus": "BRONZE_ONLY_UNREVIEWED",
                "timeseriesPublication": "NOT_ATTEMPTED",
                "warning": "Raw verified shape is not equivalent to official rights approval or independent source corroboration.",
            },
        )
