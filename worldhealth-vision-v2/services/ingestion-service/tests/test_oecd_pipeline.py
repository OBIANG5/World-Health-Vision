import respx
from httpx import Response

from ingestion_service.connectors.oecd_sdmx_client import OecdSdmxCsvClient
from ingestion_service.models import OecdIndicatorRegistryEntry
from ingestion_service.pipelines.oecd import OecdIngestionService


@respx.mock
def test_oecd_client_fetches_sdmx_csv_rows():
    client = OecdSdmxCsvClient(
        base_url="https://sdmx.oecd.org/public/rest",
        timeout_seconds=20,
    )
    route = respx.get(
        "https://sdmx.oecd.org/public/rest/data/OECD.SDD.TPS,DSD_PPP@DF_PPP/.A.PL.A0.IX.OECD"
    ).mock(
        return_value=Response(
            200,
            text=(
                "DATAFLOW,REF_AREA,FREQ,MEASURE,ANALYTICAL_CATEGORIES,UNIT_MEASURE,BASE_REF_AREA,TIME_PERIOD,OBS_VALUE,OBS_STATUS,UNIT_MULT\n"
                "OECD.SDD.TPS:DSD_PPP@DF_PPP(1.1),FRA,A,PL,A0,IX,OECD,2024,98.3,,0\n"
            ),
        )
    )

    rows = client.fetch_data_rows(
        dataflow_agency="OECD.SDD.TPS",
        dataflow_id="DSD_PPP@DF_PPP",
        data_query=".A.PL.A0.IX.OECD",
    )

    assert route.called is True
    assert route.calls.last.request.url.params["format"] == "csvfile"
    assert route.calls.last.request.headers["user-agent"].startswith("Mozilla/5.0")
    assert rows == [
        {
            "DATAFLOW": "OECD.SDD.TPS:DSD_PPP@DF_PPP(1.1)",
            "REF_AREA": "FRA",
            "FREQ": "A",
            "MEASURE": "PL",
            "ANALYTICAL_CATEGORIES": "A0",
            "UNIT_MEASURE": "IX",
            "BASE_REF_AREA": "OECD",
            "TIME_PERIOD": "2024",
            "OBS_VALUE": "98.3",
            "OBS_STATUS": "",
            "UNIT_MULT": "0",
        }
    ]


def test_normalize_oecd_price_level_rows_keeps_country_series_and_uses_annual_periods():
    service = OecdIngestionService.__new__(OecdIngestionService)
    entry = OecdIndicatorRegistryEntry(
        indicator_code="WHV.PRICE.LEVEL.GDP.OECD100",
        dataset_code="OECD_PRICE_LEVELS",
        dataset_label="OECD Price Level Indices",
        dataflow_agency="OECD.SDD.TPS",
        dataflow_id="DSD_PPP@DF_PPP",
        data_query=".A.PL.A0.IX.OECD",
        display_name="Price level indices, GDP level (OECD = 100)",
        filters={
            "FREQ": "A",
            "MEASURE": "PL",
            "ANALYTICAL_CATEGORIES": "A0",
            "UNIT_MEASURE": "IX",
            "BASE_REF_AREA": "OECD",
        },
    )

    observations = service._normalize_indicator_rows(
        rows=[
            {
                "DATAFLOW": "OECD.SDD.TPS:DSD_PPP@DF_PPP(1.1)",
                "REF_AREA": "FRA",
                "FREQ": "A",
                "MEASURE": "PL",
                "ANALYTICAL_CATEGORIES": "A0",
                "UNIT_MEASURE": "IX",
                "BASE_REF_AREA": "OECD",
                "TIME_PERIOD": "2024",
                "OBS_VALUE": "98.3",
                "OBS_STATUS": "",
                "UNIT_MULT": "0",
            },
            {
                "DATAFLOW": "OECD.SDD.TPS:DSD_PPP@DF_PPP(1.1)",
                "REF_AREA": "OECD",
                "FREQ": "A",
                "MEASURE": "PL",
                "ANALYTICAL_CATEGORIES": "A0",
                "UNIT_MEASURE": "IX",
                "BASE_REF_AREA": "OECD",
                "TIME_PERIOD": "2024",
                "OBS_VALUE": "100",
                "OBS_STATUS": "",
                "UNIT_MULT": "0",
            },
            {
                "DATAFLOW": "OECD.SDD.TPS:DSD_PPP@DF_PPP(1.1)",
                "REF_AREA": "FRA",
                "FREQ": "A",
                "MEASURE": "PPP",
                "ANALYTICAL_CATEGORIES": "A0",
                "UNIT_MEASURE": "NAT",
                "BASE_REF_AREA": "OECD",
                "TIME_PERIOD": "2024",
                "OBS_VALUE": "0.87",
                "OBS_STATUS": "",
                "UNIT_MULT": "0",
            },
        ],
        entry=entry,
    )

    assert len(observations) == 1
    observation = observations[0]
    assert observation.country_iso3 == "FRA"
    assert observation.indicator_code == "WHV.PRICE.LEVEL.GDP.OECD100"
    assert observation.period_granularity == "ANNUAL"
    assert observation.period_label == "2024"
    assert observation.year == 2024
    assert observation.value == 98.3
    assert observation.source_metadata["measure"] == "PL"
    assert observation.source_metadata["baseRefArea"] == "OECD"


def test_parse_quarterly_period_for_future_oecd_housing_support():
    service = OecdIngestionService.__new__(OecdIngestionService)

    parsed = service._parse_period("2025-Q3", "QUARTERLY")

    assert parsed is not None
    assert parsed["period_label"] == "2025-Q3"
    assert parsed["period_start"].isoformat() == "2025-07-01"
    assert parsed["period_end"].isoformat() == "2025-09-30"


def test_normalize_oecd_housing_rows_keeps_quarterly_country_series():
    service = OecdIngestionService.__new__(OecdIngestionService)
    entry = OecdIndicatorRegistryEntry(
        indicator_code="WHV.HOUSING.PRICE.REAL.INDEX2015",
        dataset_code="OECD_HOUSING_PRICES",
        dataset_label="OECD Housing Prices",
        dataflow_agency="OECD.ECO.MPD",
        dataflow_id="DSD_AN_HOUSE_PRICES@DF_HOUSE_PRICES",
        data_query=".Q.RHP.IX",
        display_name="Real house price index (2015 = 100)",
        period_granularity="QUARTERLY",
        filters={
            "FREQ": "Q",
            "MEASURE": "RHP",
            "UNIT_MEASURE": "IX",
            "ADJUSTMENT": "S",
            "BASE_PER": "2015",
        },
    )

    observations = service._normalize_indicator_rows(
        rows=[
            {
                "DATAFLOW": "OECD.ECO.MPD:DSD_AN_HOUSE_PRICES@DF_HOUSE_PRICES(1.0)",
                "REF_AREA": "FRA",
                "FREQ": "Q",
                "MEASURE": "RHP",
                "UNIT_MEASURE": "IX",
                "TIME_PERIOD": "2024-Q4",
                "OBS_VALUE": "121.5",
                "OBS_STATUS": "A",
                "UNIT_MULT": "0",
                "ADJUSTMENT": "S",
                "DECIMALS": "1",
                "BASE_PER": "2015",
            },
            {
                "DATAFLOW": "OECD.ECO.MPD:DSD_AN_HOUSE_PRICES@DF_HOUSE_PRICES(1.0)",
                "REF_AREA": "OECD",
                "FREQ": "Q",
                "MEASURE": "RHP",
                "UNIT_MEASURE": "IX",
                "TIME_PERIOD": "2024-Q4",
                "OBS_VALUE": "118.2",
                "OBS_STATUS": "A",
                "UNIT_MULT": "0",
                "ADJUSTMENT": "S",
                "DECIMALS": "1",
                "BASE_PER": "2015",
            },
            {
                "DATAFLOW": "OECD.ECO.MPD:DSD_AN_HOUSE_PRICES@DF_HOUSE_PRICES(1.0)",
                "REF_AREA": "FRA",
                "FREQ": "Q",
                "MEASURE": "RHP",
                "UNIT_MEASURE": "IX",
                "TIME_PERIOD": "2024-Q4",
                "OBS_VALUE": "121.5",
                "OBS_STATUS": "A",
                "UNIT_MULT": "0",
                "ADJUSTMENT": "NSA",
                "DECIMALS": "1",
                "BASE_PER": "2015",
            },
        ],
        entry=entry,
    )

    assert len(observations) == 1
    observation = observations[0]
    assert observation.country_iso3 == "FRA"
    assert observation.indicator_code == "WHV.HOUSING.PRICE.REAL.INDEX2015"
    assert observation.period_granularity == "QUARTERLY"
    assert observation.period_label == "2024-Q4"
    assert observation.period_start.isoformat() == "2024-10-01"
    assert observation.period_end.isoformat() == "2024-12-31"
    assert observation.value == 121.5
    assert observation.source_metadata["adjustment"] == "S"
    assert observation.source_metadata["basePeriod"] == "2015"
