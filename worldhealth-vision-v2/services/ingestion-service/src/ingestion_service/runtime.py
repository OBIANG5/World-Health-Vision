from importlib.resources import files

from ingestion_service.bronze_store import BronzeStore
from ingestion_service.country_scope import load_published_country_iso3s
from ingestion_service.settings import get_settings
from ingestion_service.connectors.ilostat_client import IloStatClient
from ingestion_service.connectors.imf_weo_client import ImfWeoClient
from ingestion_service.connectors.oecd_sdmx_client import OecdSdmxCsvClient
from ingestion_service.connectors.timeseries_client import TimeseriesClient
from ingestion_service.connectors.unodc_tabular_client import UnodcTabularClient
from ingestion_service.connectors.unsd_sdg_client import UnsdSdgClient
from ingestion_service.connectors.worldbank_client import WorldBankClient
from ingestion_service.pipelines.ilostat import IloStatIngestionService
from ingestion_service.pipelines.imf_weo import ImfWeoIngestionService
from ingestion_service.pipelines.oecd import OecdIngestionService
from ingestion_service.pipelines.unodc import UnodcIngestionService
from ingestion_service.pipelines.unsd_sdg import UnsdSdgIngestionService
from ingestion_service.pipelines.worldbank import WorldBankIngestionService


def build_worldbank_service() -> WorldBankIngestionService:
    settings = get_settings()
    client = WorldBankClient(
        base_url=settings.worldbank_base_url,
        timeout_seconds=settings.request_timeout_seconds,
        page_size=settings.worldbank_page_size,
    )
    bronze_store = BronzeStore(settings.bronze_root)
    indicator_registry_path = files("ingestion_service.config").joinpath("worldbank_core_indicators.json")
    timeseries_client = None

    if settings.publish_to_timeseries:
        timeseries_client = TimeseriesClient(
            base_url=settings.timeseries_base_url,
            timeout_seconds=settings.timeseries_request_timeout_seconds,
        )

    return WorldBankIngestionService(
        client=client,
        bronze_store=bronze_store,
        indicator_registry_path=indicator_registry_path,
        timeseries_client=timeseries_client,
    )


def build_imf_weo_service() -> ImfWeoIngestionService:
    settings = get_settings()
    client = ImfWeoClient(
        workbook_url=settings.imf_weo_workbook_url,
        timeout_seconds=settings.request_timeout_seconds,
    )
    bronze_store = BronzeStore(settings.bronze_root)
    allowed_country_iso3s = load_published_country_iso3s(settings.bronze_root)
    indicator_registry_path = files("ingestion_service.config").joinpath("imf_weo_core_indicators.json")
    timeseries_client = None

    if settings.publish_to_timeseries:
        timeseries_client = TimeseriesClient(
            base_url=settings.timeseries_base_url,
            timeout_seconds=settings.timeseries_request_timeout_seconds,
        )

    return ImfWeoIngestionService(
        client=client,
        bronze_store=bronze_store,
        indicator_registry_path=indicator_registry_path,
        dataset_code=settings.imf_weo_dataset_code,
        dataset_label=settings.imf_weo_dataset_label,
        timeseries_client=timeseries_client,
        allowed_country_iso3s=allowed_country_iso3s,
    )


def build_ilostat_service() -> IloStatIngestionService:
    settings = get_settings()
    client = IloStatClient(
        base_url=settings.ilostat_indicator_url,
        timeout_seconds=settings.request_timeout_seconds,
    )
    bronze_store = BronzeStore(settings.bronze_root)
    allowed_country_iso3s = load_published_country_iso3s(settings.bronze_root)
    indicator_registry_path = files("ingestion_service.config").joinpath("ilostat_core_indicators.json")
    timeseries_client = None

    if settings.publish_to_timeseries:
        timeseries_client = TimeseriesClient(
            base_url=settings.timeseries_base_url,
            timeout_seconds=settings.timeseries_request_timeout_seconds,
        )

    return IloStatIngestionService(
        client=client,
        bronze_store=bronze_store,
        indicator_registry_path=indicator_registry_path,
        dataset_code=settings.ilostat_dataset_code,
        dataset_label=settings.ilostat_dataset_label,
        timeseries_client=timeseries_client,
        allowed_country_iso3s=allowed_country_iso3s,
    )


def build_oecd_service() -> OecdIngestionService:
    settings = get_settings()
    client = OecdSdmxCsvClient(
        base_url=settings.oecd_base_url,
        timeout_seconds=settings.request_timeout_seconds,
    )
    bronze_store = BronzeStore(settings.bronze_root)
    allowed_country_iso3s = load_published_country_iso3s(settings.bronze_root)
    indicator_registry_path = files("ingestion_service.config").joinpath("oecd_core_indicators.json")
    timeseries_client = None

    if settings.publish_to_timeseries:
        timeseries_client = TimeseriesClient(
            base_url=settings.timeseries_base_url,
            timeout_seconds=settings.timeseries_request_timeout_seconds,
        )

    return OecdIngestionService(
        client=client,
        bronze_store=bronze_store,
        indicator_registry_path=indicator_registry_path,
        timeseries_client=timeseries_client,
        allowed_country_iso3s=allowed_country_iso3s,
    )


def build_unodc_service() -> UnodcIngestionService:
    settings = get_settings()
    client = UnodcTabularClient(
        download_url=settings.unodc_homicide_download_url,
        local_export_path=settings.unodc_homicide_export_path,
        timeout_seconds=settings.request_timeout_seconds,
    )
    bronze_store = BronzeStore(settings.bronze_root)
    allowed_country_iso3s = load_published_country_iso3s(settings.bronze_root)
    indicator_registry_path = files("ingestion_service.config").joinpath("unodc_core_indicators.json")
    timeseries_client = None

    if settings.publish_to_timeseries:
        timeseries_client = TimeseriesClient(
            base_url=settings.timeseries_base_url,
            timeout_seconds=settings.timeseries_request_timeout_seconds,
        )

    return UnodcIngestionService(
        client=client,
        bronze_store=bronze_store,
        indicator_registry_path=indicator_registry_path,
        timeseries_client=timeseries_client,
        allowed_country_iso3s=allowed_country_iso3s,
    )


def build_unsd_sdg_service() -> UnsdSdgIngestionService:
    settings = get_settings()
    client = UnsdSdgClient(
        base_url=settings.unsd_sdg_base_url,
        timeout_seconds=settings.unsd_sdg_request_timeout_seconds,
        page_size=settings.unsd_sdg_page_size,
    )
    bronze_store = BronzeStore(settings.bronze_root)
    allowed_country_iso3s = load_published_country_iso3s(settings.bronze_root)
    indicator_registry_path = files("ingestion_service.config").joinpath("unsd_sdg_core_indicators.json")
    timeseries_client = None

    if settings.publish_to_timeseries:
        timeseries_client = TimeseriesClient(
            base_url=settings.timeseries_base_url,
            timeout_seconds=settings.timeseries_request_timeout_seconds,
        )

    return UnsdSdgIngestionService(
        client=client,
        bronze_store=bronze_store,
        indicator_registry_path=indicator_registry_path,
        timeseries_client=timeseries_client,
        allowed_country_iso3s=allowed_country_iso3s,
    )
