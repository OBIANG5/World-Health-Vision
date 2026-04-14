from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="WHV_INGEST_", extra="ignore")

    service_port: int = 8000
    worldbank_base_url: str = "https://api.worldbank.org/v2"
    oecd_base_url: str = "https://sdmx.oecd.org/public/rest"
    unsd_sdg_base_url: str = "https://unstats.un.org/SDGAPI"
    unsd_sdg_request_timeout_seconds: int = 300
    unodc_homicide_download_url: str | None = None
    unodc_homicide_export_path: Path | None = None
    ilostat_indicator_url: str = "https://rplumber.ilo.org/data/indicator/"
    ilostat_dataset_code: str = "ILOSTAT_BULK"
    ilostat_dataset_label: str = "ILOSTAT Bulk Data"
    imf_weo_workbook_url: str = "https://data.imf.org/-/media/iData/External%20Storage/Documents/5661B7CB2FCC4A56866765D4281AEF01/en/WEOOct2025all"
    imf_weo_dataset_code: str = "IMF_PUBLIC_DATA"
    imf_weo_dataset_label: str = "World Economic Outlook"
    unodc_homicide_dataset_code: str = "UNODC_HOMICIDE"
    unodc_homicide_dataset_label: str = "UNODC Homicide Data"
    bronze_root: Path = Path("data/bronze")
    request_timeout_seconds: int = 120
    worldbank_page_size: int = 500
    unsd_sdg_page_size: int = 250
    publish_to_timeseries: bool = True
    timeseries_base_url: str = "http://localhost:8083"
    timeseries_request_timeout_seconds: int = 30


def get_settings() -> Settings:
    settings = Settings()
    if not settings.bronze_root.is_absolute():
        settings.bronze_root = Path.cwd() / settings.bronze_root
    if settings.unodc_homicide_export_path is not None and not settings.unodc_homicide_export_path.is_absolute():
        settings.unodc_homicide_export_path = Path.cwd() / settings.unodc_homicide_export_path
    return settings
