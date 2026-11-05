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
    numbeo_api_key: str | None = None
    numbeo_base_url: str = "https://www.numbeo.com/api"
    numbeo_dataset_code: str = "NUMBEO_INDICES"
    numbeo_dataset_label: str = "Numbeo Cost of Living Indices"
    who_gho_base_url: str = "https://ghoapi.azureedge.net/api"
    eurostat_base_url: str = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data"
    undp_hdr_base_url: str = "https://hdr.undp.org/sites/default/files/2023-24_HDR/HDR23-24_Composite_indices_complete_time_series.csv"
    bis_base_url: str = "https://stats.bis.org/api/v2"
    imf_ifs_base_url: str = "https://dataservices.imf.org/REST/SDMX_JSON.svc"
    adb_kidb_base_url: str = "https://kidb.adb.org/api/v2"
    unaids_base_url: str = "https://aidsinfo.unaids.org/public-api/v1.0"
    cepal_base_url: str = "https://estadisticas.cepal.org/cepalstat/api/v1"
    afdb_base_url: str = "https://dataportal.opendataforafrica.org/api/1.0"
    ecb_base_url: str = "https://data-api.ecb.europa.eu/service"
    unctad_base_url: str = "https://unctadstat-api.unctad.org/api/v2.0"
    unescouis_base_url: str = "https://api.uis.unesco.org/api/public/sdmx/1.0/rest"
    unescouis_api_key: str | None = None


def get_settings() -> Settings:
    settings = Settings()
    if not settings.bronze_root.is_absolute():
        settings.bronze_root = Path.cwd() / settings.bronze_root
    if settings.unodc_homicide_export_path is not None and not settings.unodc_homicide_export_path.is_absolute():
        settings.unodc_homicide_export_path = Path.cwd() / settings.unodc_homicide_export_path
    return settings