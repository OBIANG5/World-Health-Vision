from ingestion_service.models import IloStatIndicatorRegistryEntry
from ingestion_service.country_scope import filter_observations_to_country_scope
from ingestion_service.pipelines.ilostat import IloStatIngestionService


def test_normalize_indicator_rows_filters_total_population_and_keeps_country_series():
    service = IloStatIngestionService.__new__(IloStatIngestionService)
    entry = IloStatIndicatorRegistryEntry(
        indicator_code="SL.UEM.TOTL.ZS",
        ilostat_download_id="UNE_DEAP_SEX_AGE_RT_A",
        ilostat_series_code="UNE_DEAP_SEX_AGE_RT",
        display_name="Unemployment rate by sex and age (%)",
        filters={
            "sex": "SEX_T",
            "classif1": "AGE_YTHADULT_YGE15",
        },
    )

    observations = service._normalize_indicator_rows(
        rows=[
            {
                "ref_area": "FRA",
                "source": "BA:829",
                "indicator": "UNE_DEAP_SEX_AGE_RT",
                "sex": "SEX_T",
                "classif1": "AGE_YTHADULT_YGE15",
                "time": "2024",
                "obs_value": "7.1",
                "obs_status": "",
                "note_classif": "",
                "note_indicator": "",
                "note_source": "",
            },
            {
                "ref_area": "FRA",
                "source": "BA:829",
                "indicator": "UNE_DEAP_SEX_AGE_RT",
                "sex": "SEX_M",
                "classif1": "AGE_YTHADULT_YGE15",
                "time": "2024",
                "obs_value": "7.4",
                "obs_status": "",
                "note_classif": "",
                "note_indicator": "",
                "note_source": "",
            },
            {
                "ref_area": "EUROPE",
                "source": "BA:829",
                "indicator": "UNE_DEAP_SEX_AGE_RT",
                "sex": "SEX_T",
                "classif1": "AGE_YTHADULT_YGE15",
                "time": "2024",
                "obs_value": "6.2",
                "obs_status": "",
                "note_classif": "",
                "note_indicator": "",
                "note_source": "",
            },
        ],
        entry=entry,
    )

    assert len(observations) == 1
    observation = observations[0]
    assert observation.country_iso3 == "FRA"
    assert observation.indicator_code == "SL.UEM.TOTL.ZS"
    assert observation.year == 2024
    assert observation.value == 7.1
    assert observation.value_status == "OBSERVED"
    assert observation.source_metadata["sourceIndicatorId"] == "UNE_DEAP_SEX_AGE_RT"
    assert observation.source_metadata["sex"] == "SEX_T"
    assert observation.source_metadata["classif1"] == "AGE_YTHADULT_YGE15"


def test_normalized_ilostat_rows_can_be_filtered_to_canonical_country_scope():
    service = IloStatIngestionService.__new__(IloStatIngestionService)
    entry = IloStatIndicatorRegistryEntry(
        indicator_code="SL.UEM.TOTL.ZS",
        ilostat_download_id="UNE_DEAP_SEX_AGE_RT_A",
        ilostat_series_code="UNE_DEAP_SEX_AGE_RT",
        display_name="Unemployment rate by sex and age (%)",
        filters={
            "sex": "SEX_T",
            "classif1": "AGE_YTHADULT_YGE15",
        },
    )

    observations = service._normalize_indicator_rows(
        rows=[
            {
                "ref_area": "FRA",
                "source": "BA:829",
                "indicator": "UNE_DEAP_SEX_AGE_RT",
                "sex": "SEX_T",
                "classif1": "AGE_YTHADULT_YGE15",
                "time": "2024",
                "obs_value": "7.1",
                "obs_status": "",
                "note_classif": "",
                "note_indicator": "",
                "note_source": "",
            },
            {
                "ref_area": "AIA",
                "source": "BA:840",
                "indicator": "UNE_DEAP_SEX_AGE_RT",
                "sex": "SEX_T",
                "classif1": "AGE_YTHADULT_YGE15",
                "time": "2002",
                "obs_value": "7.801",
                "obs_status": "",
                "note_classif": "",
                "note_indicator": "",
                "note_source": "S3:18",
            },
        ],
        entry=entry,
    )

    filtered, dropped = filter_observations_to_country_scope(observations, {"FRA"})

    assert len(filtered) == 1
    assert filtered[0].country_iso3 == "FRA"
    assert dropped == {"AIA": 1}
