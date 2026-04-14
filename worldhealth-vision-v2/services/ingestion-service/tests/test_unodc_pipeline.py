from pathlib import Path

import respx
from httpx import Response
from openpyxl import Workbook

from ingestion_service.connectors.unodc_tabular_client import UnodcTabularClient
from ingestion_service.models import UnodcIndicatorRegistryEntry
from ingestion_service.pipelines.unodc import UnodcIngestionService


def test_unodc_client_reads_local_workbook_and_detects_header_row(tmp_path: Path):
    workbook_path = tmp_path / "homicide_export.xlsx"
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Country Data"
    sheet.append(["UNODC Intentional Homicide Export"])
    sheet.append(
        [
            "Country Code",
            "Country",
            "Year",
            "Victims of intentional homicide per 100,000 population",
        ]
    )
    sheet.append(["FRA", "France", 2024, 1.3])
    workbook.save(workbook_path)

    client = UnodcTabularClient(
        download_url=None,
        local_export_path=workbook_path,
        timeout_seconds=20,
    )

    rows, descriptor = client.fetch_dataset(
        required_column_alias_groups=[
            ["Country Code", "Country"],
            ["Year"],
            ["Victims of intentional homicide per 100,000 population"],
        ]
    )

    assert descriptor["mode"] == "LOCAL_EXPORT"
    assert descriptor["resolvedFormat"] == "xlsx"
    assert rows == [
        {
            "Country Code": "FRA",
            "Country": "France",
            "Year": "2024",
            "Victims of intentional homicide per 100,000 population": "1.3",
        }
    ]


@respx.mock
def test_unodc_client_rejects_html_response_from_portal():
    route = respx.get("https://dataunodc.un.org/example/homicide.xlsx").mock(
        return_value=Response(
            200,
            text="<!DOCTYPE html><html><body>portal</body></html>",
            headers={"Content-Type": "text/html; charset=UTF-8"},
        )
    )
    client = UnodcTabularClient(
        download_url="https://dataunodc.un.org/example/homicide.xlsx",
        local_export_path=None,
        timeout_seconds=20,
    )

    try:
        client.fetch_dataset(
            required_column_alias_groups=[
                ["Country Code"],
                ["Year"],
                ["Rate"],
            ]
        )
    except ValueError as exception:
        assert "returned HTML instead of a downloadable data file" in str(exception)
    else:
        raise AssertionError("Expected UNODC HTML fallback to raise a ValueError.")

    assert route.called is True


def test_normalize_unodc_homicide_rows_keeps_country_rate_series():
    service = UnodcIngestionService.__new__(UnodcIngestionService)
    entry = UnodcIndicatorRegistryEntry(
        indicator_code="WHV.SAFETY.HOMICIDE.RATE.P100K",
        dataset_code="UNODC_HOMICIDE",
        dataset_label="UNODC Homicide Data",
        display_name="Intentional homicide victims (per 100,000 people)",
        country_code_aliases=["Country Code"],
        country_name_aliases=["Country"],
        period_aliases=["Year"],
        value_aliases=["Victims of intentional homicide per 100,000 population"],
    )

    observations = service._normalize_indicator_rows(
        rows=[
            {
                "Country Code": "FRA",
                "Country": "France",
                "Year": "2024",
                "Victims of intentional homicide per 100,000 population": "1.3",
            },
            {
                "Country": "Germany (DEU)",
                "Year": "2023",
                "Victims of intentional homicide per 100,000 population": "0.8",
            },
            {
                "Country Code": "OECD",
                "Country": "OECD aggregate",
                "Year": "2024",
                "Victims of intentional homicide per 100,000 population": "3.0",
            },
        ],
        entry=entry,
    )

    assert len(observations) == 2
    assert observations[0].country_iso3 == "FRA"
    assert observations[0].indicator_code == "WHV.SAFETY.HOMICIDE.RATE.P100K"
    assert observations[0].year == 2024
    assert observations[0].value == 1.3
    assert observations[0].source_metadata["countryName"] == "France"
    assert observations[1].country_iso3 == "DEU"
    assert observations[1].year == 2023
