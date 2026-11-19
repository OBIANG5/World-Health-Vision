"""DATA-1B3: private WDI 2022 BRA comparison evidence; never Timeseries."""
from __future__ import annotations

from ingestion_service.bronze_store import BronzeStore
from ingestion_service.connectors.worldbank_population_2022_research import (
    WDI_DATASET, WDI_INDICATOR, WDI_METHOD_URL, WDI_SOURCE, WDI_URL,
    WdiPopulation2022ResearchClient,
)
from ingestion_service.models import IndicatorObservation


class WdiPopulation2022ResearchPilot:
    """Reuses existing Bronze raw-version storage and DATA-1B2B attempt journal."""

    def __init__(self, *, client: WdiPopulation2022ResearchClient,
                 bronze_store: BronzeStore):
        self._client = client
        self._bronze = bronze_store
        self._journal = bronze_store.private_acquisition_journal()

    def capture(self):
        handle = self._journal.begin(
            source_code=WDI_SOURCE,
            dataset_code=WDI_DATASET,
            source_url=WDI_URL,
        )
        try:
            response = self._client.fetch_population_2022()
            observation = IndicatorObservation.annual(
                country_iso3="BRA",
                indicator_code=WDI_INDICATOR,
                year=2022,
                value=float(response.resident_midyear_estimate),
                value_status="MIDYEAR_ESTIMATE",
                source_published_at=None,
                source_metadata={
                    "officialSource": "WORLD_BANK_WDI",
                    "originalIndicatorCode": WDI_INDICATOR,
                    "originalDatasetId": "2",
                    "referenceTime": "MID_YEAR_ESTIMATE",
                    "referenceYear": 2022,
                    "originalUnitMeaning": "NUMBER_OF_PERSONS",
                    "providerObservationStatus": (
                        response.observed_status_from_provider
                        if response.observed_status_from_provider not in ("", None)
                        else "UNSPECIFIED"
                    ),
                    # Provider dataset-level update is not a statement about the
                    # revision date of THIS specific Brazil 2022 observation.
                    "providerDatasetUpdatedLabel": response.source_dataset_last_updated_label,
                    "providerObservationRevisedAt": None,
                    "methodologyUrl": WDI_METHOD_URL,
                    "sourceUrl": response.source_url,
                    "rawSha256": response.canonical_json_sha256,
                    "httpBodySha256": response.http_body_sha256,
                    "reuseRights": "REVIEW_REQUIRED",
                },
                quality_flags=[
                    "WDI_DE_FACTO_MIDYEAR_ESTIMATE_NOT_CENSUS_DAY_COUNT",
                    "SOURCE_INPUT_DEPENDENCE_UNVERIFIED",
                    "SOURCE_OBSERVATION_REVISION_NOT_VERIFIED",
                    "REUSE_RIGHTS_REVIEW_REQUIRED",
                ],
            )
            receipt = self._bronze.persist_quarantined_json_evidence(
                source_code=WDI_SOURCE,
                dataset_code=WDI_DATASET,
                raw_response_bytes=response.raw_response_bytes,
                normalized_records=[observation.model_dump(mode="json")],
                notes={
                    "sourceType": "INTERNATIONAL_OFFICIAL",
                    "sourceInstitution": "WORLD_BANK",
                    "countryIso3": "BRA",
                    "referenceYear": 2022,
                    "indicatorCode": WDI_INDICATOR,
                    "geographicLevel": "COUNTRY",
                    "populationDefinition": "DE_FACTO_MIDYEAR_ESTIMATE",
                    "methodologyUrl": WDI_METHOD_URL,
                    "sourceUrl": response.source_url,
                    "rawSha256": response.canonical_json_sha256,
                    "httpBodySha256": response.http_body_sha256,
                    "sourcePublishedAt": None,
                    "sourceRevisionAt": None,
                    "providerDatasetUpdatedLabel": response.source_dataset_last_updated_label,
                    "licenseReviewStatus": "REVIEW_REQUIRED",
                    "publicationStatus": "BRONZE_ONLY_UNREVIEWED",
                    "timeseriesPublication": "NOT_ATTEMPTED",
                },
            )
        except Exception as error:
            self._journal.failure(handle, error=error)
            raise
        self._journal.success(
            handle, response_sha256=receipt.notes["httpBodySha256"],
            etag=response.etag, last_modified=response.last_modified,
            http_status=200,
        )
        return receipt
