import json

import respx
from httpx import Response

from ingestion_service.connectors.unsd_sdg_client import UnsdSdgClient
from ingestion_service.models import UnsdSdgIndicatorRegistryEntry
from ingestion_service.pipelines.unsd_sdg import UnsdSdgIngestionService


@respx.mock
def test_unsd_sdg_client_fetches_paginated_series_data():
    client = UnsdSdgClient(
        base_url="https://unstats.un.org/SDGAPI",
        timeout_seconds=20,
        page_size=2,
    )
    last_updated_route = respx.get("https://unstats.un.org/SDGAPI/v1/sdg/Series/LastUpdated").mock(
        return_value=Response(200, json="2026-04-12T00:00:00Z")
    )
    page_one_route = respx.get("https://unstats.un.org/SDGAPI/v1/sdg/Series/Data").mock(
        side_effect=[
            Response(
                200,
                json={
                    "pageNumber": 1,
                    "totalPages": 2,
                    "data": [
                        {"series": "VC_IHR_PSRC", "geoAreaCode": "4", "timePeriodStart": 2020, "value": "6.1"},
                        {"series": "VC_IHR_PSRC", "geoAreaCode": "8", "timePeriodStart": 2020, "value": "2.3"},
                    ],
                },
            ),
            Response(
                200,
                json={
                    "pageNumber": 2,
                    "totalPages": 2,
                    "data": [
                        {"series": "VC_IHR_PSRC", "geoAreaCode": "12", "timePeriodStart": 2020, "value": "1.4"},
                    ],
                },
            ),
        ]
    )

    rows, descriptor = client.fetch_series_observations(series_code="VC_IHR_PSRC", time_period_start=2015)

    assert last_updated_route.called is True
    assert page_one_route.call_count == 2
    assert len(rows) == 3
    assert descriptor["seriesCode"] == "VC_IHR_PSRC"
    assert descriptor["lastUpdatedAtUtc"] == "2026-04-12T00:00:00Z"
    assert "seriesCode=VC_IHR_PSRC" in descriptor["dataUrl"]
    assert "timePeriodStart=2015" in descriptor["dataUrl"]


@respx.mock
def test_unsd_sdg_client_tolerates_last_updated_failure():
    client = UnsdSdgClient(
        base_url="https://unstats.un.org/SDGAPI",
        timeout_seconds=20,
        page_size=100,
    )
    respx.get("https://unstats.un.org/SDGAPI/v1/sdg/Series/LastUpdated").mock(
        return_value=Response(502, text="Bad Gateway")
    )
    data_route = respx.get("https://unstats.un.org/SDGAPI/v1/sdg/Series/Data").mock(
        return_value=Response(
            200,
            json={
                "pageNumber": 1,
                "totalPages": 1,
                "data": [{"series": "VC_IHR_PSRC", "geoAreaCode": "4", "timePeriodStart": 2020, "value": "6.1"}],
            },
        )
    )

    rows, descriptor = client.fetch_series_observations(series_code="VC_IHR_PSRC")

    assert data_route.called is True
    assert len(rows) == 1
    assert descriptor["lastUpdatedAtUtc"] is None


def test_normalize_unsd_homicide_rows_maps_m49_to_iso3_and_filters_both_sexes():
    service = UnsdSdgIngestionService.__new__(UnsdSdgIngestionService)
    entry = UnsdSdgIndicatorRegistryEntry(
        indicator_code="WHV.SAFETY.HOMICIDE.RATE.P100K",
        dataset_code="UNSD_SDG_GLOBAL_DATA",
        dataset_label="UNSD SDG API",
        series_code="VC_IHR_PSRC",
        display_name="Intentional homicide victims (per 100,000 people)",
        dimension_filters={"Sex": "BOTHSEX"},
        attribute_filters={"Units": "PER_100000_POP"},
    )

    observations = service._normalize_indicator_rows(
        rows=[
            {
                "series": "VC_IHR_PSRC",
                "seriesDescription": "Number of victims of intentional homicide per 100,000 population, by sex",
                "geoAreaCode": "4",
                "geoAreaName": "Afghanistan",
                "timePeriodStart": 2020.0,
                "value": "6.1",
                "source": "National Statistical Office",
                "valueType": "Float",
                "footnotes": [""],
                "dimensions": {"Sex": "BOTHSEX", "Reporting Type": "G"},
                "attributes": {"Nature": "C", "Units": "PER_100000_POP"},
            },
            {
                "series": "VC_IHR_PSRC",
                "seriesDescription": "Number of victims of intentional homicide per 100,000 population, by sex",
                "geoAreaCode": "4",
                "geoAreaName": "Afghanistan",
                "timePeriodStart": 2020.0,
                "value": "1.2",
                "source": "National Statistical Office",
                "valueType": "Float",
                "footnotes": [""],
                "dimensions": {"Sex": "FEMALE", "Reporting Type": "G"},
                "attributes": {"Nature": "C", "Units": "PER_100000_POP"},
            },
            {
                "series": "VC_IHR_PSRC",
                "seriesDescription": "Number of victims of intentional homicide per 100,000 population, by sex",
                "geoAreaCode": "8",
                "geoAreaName": "Albania",
                "timePeriodStart": 2021.0,
                "value": "2.3",
                "source": "National Statistical Office",
                "valueType": "Float",
                "footnotes": [],
                "dimensions": {"Sex": "BOTHSEX", "Reporting Type": "G"},
                "attributes": {"Nature": "CA", "Units": "PER_100000_POP"},
            },
        ],
        entry=entry,
    )

    assert len(observations) == 2
    assert observations[0].country_iso3 == "AFG"
    assert observations[0].year == 2020
    assert observations[0].value == 6.1
    assert observations[0].value_status == "OBSERVED"
    assert observations[1].country_iso3 == "ALB"
    assert observations[1].year == 2021
    assert observations[1].value_status == "ESTIMATED"
    assert observations[1].source_metadata["attributes"]["Nature"] == "CA"
