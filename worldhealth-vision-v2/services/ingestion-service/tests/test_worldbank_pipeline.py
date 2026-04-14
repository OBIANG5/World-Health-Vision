from ingestion_service.models import WorldBankCountryRecord
from ingestion_service.pipelines.worldbank import WorldBankIngestionService


def test_normalize_country_record_marks_aggregates():
    service = WorldBankIngestionService.__new__(WorldBankIngestionService)
    raw = WorldBankCountryRecord.model_validate(
        {
            "id": "AFE",
            "iso2Code": "ZH",
            "name": "Africa Eastern and Southern",
            "region": {"id": "NA", "value": "Aggregates"},
            "adminregion": {"id": "", "value": ""},
            "incomeLevel": {"id": "NA", "value": "Aggregates"},
            "lendingType": {"id": "", "value": "Aggregates"},
            "capitalCity": "",
            "longitude": "",
            "latitude": "",
        }
    )

    normalized = service._normalize_country_record(raw)

    assert normalized.is_aggregate is True
    assert normalized.region_code is None
    assert normalized.iso3 == "AFE"
