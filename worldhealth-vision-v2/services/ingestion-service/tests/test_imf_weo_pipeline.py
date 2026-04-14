from ingestion_service.models import ImfWeoIndicatorRegistryEntry
from ingestion_service.pipelines.imf_weo import ImfWeoIngestionService


def test_normalize_indicator_rows_scales_values_and_excludes_forecasts():
    service = ImfWeoIngestionService.__new__(ImfWeoIngestionService)
    entry = ImfWeoIndicatorRegistryEntry(
        indicator_code="NY.GDP.MKTP.CD",
        imf_indicator_id="NGDPD",
        display_name="GDP (current US$)",
        scale_multiplier=1_000_000_000.0,
    )

    observations = service._normalize_indicator_rows(
        rows=[
            {
                "COUNTRY.ID": "FRA",
                "COUNTRY": "France",
                "SERIES_CODE": "WEO:NGDPD",
                "INDICATOR": "Gross domestic product, current prices",
                "DATASET": "WEO",
                "PUBLICATION_DATE": "2025-10-01T00:00:00",
                "LATEST_ACTUAL_ANNUAL_DATA": 2024,
                "UNIT": "U.S. dollars",
                "SCALE": "Billions",
                "2024": 3_137.0,
                "2025": 3_220.0,
            }
        ],
        entry=entry,
    )

    assert len(observations) == 1
    observation = observations[0]
    assert observation.country_iso3 == "FRA"
    assert observation.indicator_code == "NY.GDP.MKTP.CD"
    assert observation.year == 2024
    assert observation.value == 3_137_000_000_000.0
    assert observation.value_status == "OBSERVED"
    assert observation.source_metadata["sourceIndicatorId"] == "NGDPD"
    assert observation.source_metadata["latestActualAnnualData"] == 2024
    assert observation.source_metadata["scale"] == "Billions"
    assert observation.source_published_at is not None


def test_parse_optional_int_supports_fiscal_year_notation():
    service = ImfWeoIngestionService.__new__(ImfWeoIngestionService)

    assert service._parse_optional_int("FY2023/24") == 2024
    assert service._parse_optional_int("2022") == 2022
