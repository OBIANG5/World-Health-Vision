"""P2C3A, official INSEE read-only pilot using existing immutable Bronze+audit.

Never sends data to Timeseries, signs rights, endorses commercial reuse, or
presents the scoped INSEE "France hors Mayotte" as all of France.
"""
from __future__ import annotations

from ingestion_service.bronze_store import BronzeStore
from ingestion_service.connectors.insee_melodi_population_research import (
    DATASET, SOURCE, SOURCE_URL, GEO_SCOPE, PINNED_GEO,
    InseePrivatePopulationClient,
)
from ingestion_service.models import IndicatorObservation

# This indicator does not yet exist in public catalog or canonical Timeseries.
PRIVATE_INDICATOR = "INSEE.POPREF.PMUN.FEHM.2023"


class InseePrivatePopulationPilot:
    def __init__(self, *, client: InseePrivatePopulationClient,
                 bronze_store: BronzeStore):
        self._client = client
        self._bronze = bronze_store
        self._journal = bronze_store.private_acquisition_journal()

    def capture(self):
        # START is immutable BEFORE the HTTP request. Failed requests retain an
        # honest FAILED event; successful replay does not rewrite a source body.
        handle = self._journal.begin(
            source_code=SOURCE, dataset_code=DATASET, source_url=SOURCE_URL,
        )
        try:
            result = self._client.fetch()
            observation = IndicatorObservation.annual(
                country_iso3="FRA",
                indicator_code=PRIVATE_INDICATOR,
                year=result.reference_year,
                value=float(result.municipal_population),
                value_status="OFFICIAL_REFERENCE_COUNT_CALCULATED",
                source_published_at=None,  # A dataset issue date != row revision date.
                source_metadata={
                    "officialInstitution": "INSEE",
                    "originalDatasetCode": DATASET,
                    "originalMeasure": result.source_measure,
                    "originalGeo": PINNED_GEO,
                    "geographicScope": GEO_SCOPE,
                    "sourceUrl": result.source_url,
                    "methodologyUrl": "https://www.insee.fr/fr/statistiques/8681011",
                    "sourceStatisticalReferenceDate": "2023-01-01",
                    "sourceGeographicBoundariesDate": "2025-01-01",
                    "referenceCountNotMidYearEstimate": True,
                    "sourceRevisionDate": None,
                    "httpBodySha256": result.raw_sha256,
                    "reuseRights": "REVIEW_REQUIRED",
                },
                quality_flags=[
                    "INSEE_MUNICIPAL_NOT_TOTAL",
                    "FRANCE_HORS_MAYOTTE_NOT_FULL_FRA",
                    "SOURCE_GEOGRAPHY_BOUNDARIES_2025",
                    "PUBLISHED_REFERENCE_CALCULATED_FROM_CENSUS_PROCESS",
                    "CANNOT_COMPARE_ADJACENT_CENSUS_YEARS_DIRECTLY",
                    "SOURCE_ROW_REVISION_DATE_UNVERIFIED",
                    "REUSE_RIGHTS_REVIEW_REQUIRED",
                ],
            )
            receipt = self._bronze.persist_quarantined_json_evidence(
                source_code=SOURCE,
                dataset_code=DATASET,
                raw_response_bytes=result.raw_bytes,
                normalized_records=[observation.model_dump(mode="json")],
                notes={
                    "countryIso3": "FRA",
                    "officialInstitution": "INSEE",
                    "sourceType": "NATIONAL_OFFICIAL",
                    "originalMeasure": result.source_measure,
                    "sourceUrl": result.source_url,
                    "sourceGeography": result.source_geo,
                    "geographicScope": GEO_SCOPE,
                    "referenceYear": result.reference_year,
                    "sourceGeographicBoundariesYear": 2025,
                    "originalUnit": "persons",
                    "rawSha256": result.canonical_sha256,
                    "httpBodySha256": result.raw_sha256,
                    "sourceFetchedAtUtc": result.fetched_at_utc,
                    "sourcePublishedAtUtc": None,
                    "sourceRevisionAtUtc": None,
                    "licenseDocumentationUrl": "https://www.insee.fr/fr/information/8184173",
                    "statisticalDocumentationUrl": "https://www.insee.fr/fr/statistiques/8681011",
                    "methodologyComparability": "2023 vs earlier 2017 or older; six-year methodological caution",
                    "licenseReviewStatus": "REVIEW_REQUIRED",
                    "publicationStatus": "BRONZE_ONLY_UNREVIEWED",
                    "timeseriesPublication": "NOT_ATTEMPTED",
                    "warning": "Private institutional evidence does NOT imply reusable signed API publication rights",
                },
            )
        except Exception as error:
            self._journal.failure(handle, error=error)
            raise
        self._journal.success(
            handle,
            response_sha256=receipt.notes["httpBodySha256"],
            http_status=200, etag=result.etag, last_modified=result.last_modified,
        )
        return receipt
