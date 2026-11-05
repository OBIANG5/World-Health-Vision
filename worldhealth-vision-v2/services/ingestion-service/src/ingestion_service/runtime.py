from importlib.resources import files

from ingestion_service.bronze_store import BronzeStore
from ingestion_service.country_scope import load_published_country_iso3s
from ingestion_service.settings import get_settings
from ingestion_service.connectors.ilostat_client import IloStatClient
from ingestion_service.connectors.imf_weo_client import ImfWeoClient
from ingestion_service.connectors.numbeo_client import NumbeoApiClient
from ingestion_service.connectors.oecd_sdmx_client import OecdSdmxCsvClient
from ingestion_service.connectors.timeseries_client import TimeseriesClient
from ingestion_service.connectors.unodc_tabular_client import UnodcTabularClient
from ingestion_service.connectors.unsd_sdg_client import UnsdSdgClient
from ingestion_service.connectors.eurostat_client import EurostatClient
from ingestion_service.connectors.undp_hdr_client import UndpHdrClient
from ingestion_service.connectors.who_gho_client import WhoGhoClient
from ingestion_service.connectors.bis_client import BisClient
from ingestion_service.connectors.imf_ifs_client import ImfIfsClient
from ingestion_service.connectors.adb_kidb_client import AdbKidbClient
from ingestion_service.connectors.unaids_client import UnaidsClient
from ingestion_service.connectors.cepal_client import CepalClient
from ingestion_service.connectors.afdb_client import AfdbClient
from ingestion_service.connectors.ecb_client import EcbClient
from ingestion_service.connectors.unctad_client import UntctadClient
from ingestion_service.connectors.unescouis_client import UnescoUisClient
from ingestion_service.connectors.worldbank_client import WorldBankClient
from ingestion_service.pipelines.adb_kidb import AdbKidbIngestionService
from ingestion_service.pipelines.afdb import AfdbIngestionService
from ingestion_service.pipelines.bis import BisIngestionService
from ingestion_service.pipelines.ecb import EcbIngestionService
from ingestion_service.pipelines.unctad import UntctadIngestionService
from ingestion_service.pipelines.unescouis import UnescoUisIngestionService
from ingestion_service.pipelines.cepal import CepalIngestionService
from ingestion_service.pipelines.eurostat import EurostatIngestionService
from ingestion_service.pipelines.ilostat import IloStatIngestionService
from ingestion_service.pipelines.imf_ifs import ImfIfsIngestionService
from ingestion_service.pipelines.unaids import UnaidsIngestionService
from ingestion_service.pipelines.imf_weo import ImfWeoIngestionService
from ingestion_service.pipelines.numbeo import NumbeoIngestionService
from ingestion_service.pipelines.oecd import OecdIngestionService
from ingestion_service.pipelines.undp_hdr import UndpHdrIngestionService
from ingestion_service.pipelines.unodc import UnodcIngestionService
from ingestion_service.pipelines.unsd_sdg import UnsdSdgIngestionService
from ingestion_service.pipelines.who_gho import WhoGhoIngestionService
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


def build_numbeo_service() -> NumbeoIngestionService:
    settings = get_settings()
    if not settings.numbeo_api_key:
        raise ValueError(
            "WHV_INGEST_NUMBEO_API_KEY est requis pour l'ingestion Numbeo. "
            "Obtenir une clé sur https://www.numbeo.com/api/register.jsp"
        )
    client = NumbeoApiClient(
        base_url=settings.numbeo_base_url,
        api_key=settings.numbeo_api_key,
        timeout_seconds=settings.request_timeout_seconds,
    )
    bronze_store = BronzeStore(settings.bronze_root)
    allowed_country_iso3s = load_published_country_iso3s(settings.bronze_root)
    indicator_registry_path = files("ingestion_service.config").joinpath("numbeo_core_indicators.json")
    timeseries_client = None

    if settings.publish_to_timeseries:
        timeseries_client = TimeseriesClient(
            base_url=settings.timeseries_base_url,
            timeout_seconds=settings.timeseries_request_timeout_seconds,
        )

    return NumbeoIngestionService(
        client=client,
        bronze_store=bronze_store,
        indicator_registry_path=indicator_registry_path,
        timeseries_client=timeseries_client,
        allowed_country_iso3s=allowed_country_iso3s,
    )


def build_eurostat_service() -> EurostatIngestionService:
    settings = get_settings()
    client = EurostatClient(
        base_url=settings.eurostat_base_url,
        timeout_seconds=settings.request_timeout_seconds,
    )
    bronze_store = BronzeStore(settings.bronze_root)
    allowed_country_iso3s = load_published_country_iso3s(settings.bronze_root)
    indicator_registry_path = files("ingestion_service.config").joinpath("eurostat_core_indicators.json")
    timeseries_client = None

    if settings.publish_to_timeseries:
        timeseries_client = TimeseriesClient(
            base_url=settings.timeseries_base_url,
            timeout_seconds=settings.timeseries_request_timeout_seconds,
        )

    return EurostatIngestionService(
        client=client,
        bronze_store=bronze_store,
        indicator_registry_path=indicator_registry_path,
        timeseries_client=timeseries_client,
        allowed_country_iso3s=allowed_country_iso3s,
    )


def build_undp_hdr_service() -> UndpHdrIngestionService:
    settings = get_settings()
    client = UndpHdrClient(
        base_url=settings.undp_hdr_base_url,
        timeout_seconds=settings.request_timeout_seconds,
    )
    bronze_store = BronzeStore(settings.bronze_root)
    allowed_country_iso3s = load_published_country_iso3s(settings.bronze_root)
    indicator_registry_path = files("ingestion_service.config").joinpath("undp_hdr_core_indicators.json")
    timeseries_client = None

    if settings.publish_to_timeseries:
        timeseries_client = TimeseriesClient(
            base_url=settings.timeseries_base_url,
            timeout_seconds=settings.timeseries_request_timeout_seconds,
        )

    return UndpHdrIngestionService(
        client=client,
        bronze_store=bronze_store,
        indicator_registry_path=indicator_registry_path,
        timeseries_client=timeseries_client,
        allowed_country_iso3s=allowed_country_iso3s,
    )


def build_who_gho_service() -> WhoGhoIngestionService:
    settings = get_settings()
    client = WhoGhoClient(
        base_url=settings.who_gho_base_url,
        timeout_seconds=settings.request_timeout_seconds,
    )
    bronze_store = BronzeStore(settings.bronze_root)
    allowed_country_iso3s = load_published_country_iso3s(settings.bronze_root)
    indicator_registry_path = files("ingestion_service.config").joinpath("who_gho_core_indicators.json")
    timeseries_client = None

    if settings.publish_to_timeseries:
        timeseries_client = TimeseriesClient(
            base_url=settings.timeseries_base_url,
            timeout_seconds=settings.timeseries_request_timeout_seconds,
        )

    return WhoGhoIngestionService(
        client=client,
        bronze_store=bronze_store,
        indicator_registry_path=indicator_registry_path,
        timeseries_client=timeseries_client,
        allowed_country_iso3s=allowed_country_iso3s,
    )


def build_bis_service() -> BisIngestionService:
    import json as _json
    from ingestion_service.models import BisIndicatorRegistryEntry
    settings = get_settings()
    client = BisClient(base_url=settings.bis_base_url, timeout_seconds=settings.request_timeout_seconds)
    bronze_store = BronzeStore(settings.bronze_root)
    allowed_country_iso3s = load_published_country_iso3s(settings.bronze_root)
    registry_path = files("ingestion_service.config").joinpath("bis_core_indicators.json")
    raw = _json.loads(registry_path.read_text(encoding="utf-8"))
    registry = [BisIndicatorRegistryEntry.model_validate(item) for item in raw]
    timeseries_client = None
    if settings.publish_to_timeseries:
        timeseries_client = TimeseriesClient(
            base_url=settings.timeseries_base_url,
            timeout_seconds=settings.timeseries_request_timeout_seconds,
        )
    return BisIngestionService(
        client=client,
        bronze_store=bronze_store,
        indicator_registry=registry,
        timeseries_client=timeseries_client,
        allowed_country_iso3s=allowed_country_iso3s,
    )


def build_imf_ifs_service() -> ImfIfsIngestionService:
    settings = get_settings()
    client = ImfIfsClient(base_url=settings.imf_ifs_base_url, timeout_seconds=settings.request_timeout_seconds)
    bronze_store = BronzeStore(settings.bronze_root)
    allowed_country_iso3s = load_published_country_iso3s(settings.bronze_root)
    indicator_registry_path = files("ingestion_service.config").joinpath("imf_ifs_core_indicators.json")
    timeseries_client = None
    if settings.publish_to_timeseries:
        timeseries_client = TimeseriesClient(
            base_url=settings.timeseries_base_url,
            timeout_seconds=settings.timeseries_request_timeout_seconds,
        )
    return ImfIfsIngestionService(
        client=client,
        bronze_store=bronze_store,
        indicator_registry_path=indicator_registry_path,
        timeseries_client=timeseries_client,
        allowed_country_iso3s=allowed_country_iso3s,
    )


def build_adb_kidb_service() -> AdbKidbIngestionService:
    settings = get_settings()
    client = AdbKidbClient(base_url=settings.adb_kidb_base_url, timeout_seconds=settings.request_timeout_seconds)
    bronze_store = BronzeStore(settings.bronze_root)
    allowed_country_iso3s = load_published_country_iso3s(settings.bronze_root)
    indicator_registry_path = files("ingestion_service.config").joinpath("adb_kidb_core_indicators.json")
    timeseries_client = None
    if settings.publish_to_timeseries:
        timeseries_client = TimeseriesClient(
            base_url=settings.timeseries_base_url,
            timeout_seconds=settings.timeseries_request_timeout_seconds,
        )
    return AdbKidbIngestionService(
        client=client,
        bronze_store=bronze_store,
        indicator_registry_path=indicator_registry_path,
        timeseries_client=timeseries_client,
        allowed_country_iso3s=allowed_country_iso3s,
    )


def build_unaids_service() -> UnaidsIngestionService:
    settings = get_settings()
    client = UnaidsClient(base_url=settings.unaids_base_url, timeout_seconds=settings.request_timeout_seconds)
    bronze_store = BronzeStore(settings.bronze_root)
    allowed_country_iso3s = load_published_country_iso3s(settings.bronze_root)
    indicator_registry_path = files("ingestion_service.config").joinpath("unaids_core_indicators.json")
    timeseries_client = None
    if settings.publish_to_timeseries:
        timeseries_client = TimeseriesClient(
            base_url=settings.timeseries_base_url,
            timeout_seconds=settings.timeseries_request_timeout_seconds,
        )
    return UnaidsIngestionService(
        client=client,
        bronze_store=bronze_store,
        indicator_registry_path=indicator_registry_path,
        timeseries_client=timeseries_client,
        allowed_country_iso3s=allowed_country_iso3s,
    )


def build_cepal_service() -> CepalIngestionService:
    settings = get_settings()
    client = CepalClient(base_url=settings.cepal_base_url, timeout_seconds=settings.request_timeout_seconds)
    bronze_store = BronzeStore(settings.bronze_root)
    allowed_country_iso3s = load_published_country_iso3s(settings.bronze_root)
    indicator_registry_path = files("ingestion_service.config").joinpath("cepal_core_indicators.json")
    timeseries_client = None
    if settings.publish_to_timeseries:
        timeseries_client = TimeseriesClient(
            base_url=settings.timeseries_base_url,
            timeout_seconds=settings.timeseries_request_timeout_seconds,
        )
    return CepalIngestionService(
        client=client,
        bronze_store=bronze_store,
        indicator_registry_path=indicator_registry_path,
        timeseries_client=timeseries_client,
        allowed_country_iso3s=allowed_country_iso3s,
    )


def build_afdb_service() -> AfdbIngestionService:
    settings = get_settings()
    client = AfdbClient(base_url=settings.afdb_base_url, timeout_seconds=settings.request_timeout_seconds)
    bronze_store = BronzeStore(settings.bronze_root)
    allowed_country_iso3s = load_published_country_iso3s(settings.bronze_root)
    indicator_registry_path = files("ingestion_service.config").joinpath("afdb_core_indicators.json")
    timeseries_client = None
    if settings.publish_to_timeseries:
        timeseries_client = TimeseriesClient(
            base_url=settings.timeseries_base_url,
            timeout_seconds=settings.timeseries_request_timeout_seconds,
        )
    return AfdbIngestionService(
        client=client,
        bronze_store=bronze_store,
        indicator_registry_path=indicator_registry_path,
        timeseries_client=timeseries_client,
        allowed_country_iso3s=allowed_country_iso3s,
    )


def build_ecb_service() -> EcbIngestionService:
    import json as _json
    settings = get_settings()
    client = EcbClient(base_url=settings.ecb_base_url, timeout_seconds=settings.request_timeout_seconds)
    bronze_store = BronzeStore(settings.bronze_root)
    allowed_country_iso3s = load_published_country_iso3s(settings.bronze_root)
    registry_path = files("ingestion_service.config").joinpath("ecb_core_indicators.json")
    from ingestion_service.models import BisIndicatorRegistryEntry
    raw = _json.loads(registry_path.read_text(encoding="utf-8"))
    registry = [BisIndicatorRegistryEntry.model_validate(item) for item in raw]
    timeseries_client = None
    if settings.publish_to_timeseries:
        timeseries_client = TimeseriesClient(
            base_url=settings.timeseries_base_url,
            timeout_seconds=settings.timeseries_request_timeout_seconds,
        )
    return EcbIngestionService(
        client=client,
        bronze_store=bronze_store,
        indicator_registry=registry,
        timeseries_client=timeseries_client,
        allowed_country_iso3s=allowed_country_iso3s,
    )


def build_unctad_service() -> UntctadIngestionService:
    settings = get_settings()
    client = UntctadClient(base_url=settings.unctad_base_url, timeout_seconds=settings.request_timeout_seconds)
    bronze_store = BronzeStore(settings.bronze_root)
    allowed_country_iso3s = load_published_country_iso3s(settings.bronze_root)
    indicator_registry_path = files("ingestion_service.config").joinpath("unctad_core_indicators.json")
    timeseries_client = None
    if settings.publish_to_timeseries:
        timeseries_client = TimeseriesClient(
            base_url=settings.timeseries_base_url,
            timeout_seconds=settings.timeseries_request_timeout_seconds,
        )
    return UntctadIngestionService(
        client=client,
        bronze_store=bronze_store,
        indicator_registry_path=indicator_registry_path,
        timeseries_client=timeseries_client,
        allowed_country_iso3s=allowed_country_iso3s,
    )


def build_unescouis_service() -> UnescoUisIngestionService:
    settings = get_settings()
    client = UnescoUisClient(
        base_url=settings.unescouis_base_url,
        api_key=settings.unescouis_api_key,
        timeout_seconds=settings.request_timeout_seconds,
    )
    bronze_store = BronzeStore(settings.bronze_root)
    allowed_country_iso3s = load_published_country_iso3s(settings.bronze_root)
    indicator_registry_path = files("ingestion_service.config").joinpath("unescouis_core_indicators.json")
    timeseries_client = None
    if settings.publish_to_timeseries:
        timeseries_client = TimeseriesClient(
            base_url=settings.timeseries_base_url,
            timeout_seconds=settings.timeseries_request_timeout_seconds,
        )
    return UnescoUisIngestionService(
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