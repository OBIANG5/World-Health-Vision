from analytics_service.clients.catalog_client import CatalogClient
from analytics_service.clients.timeseries_client import TimeseriesClient
from analytics_service.config import Settings, get_settings
from analytics_service.service import AnalyticsService


def build_analytics_service(settings: Settings | None = None) -> AnalyticsService:
    resolved_settings = settings or get_settings()
    return AnalyticsService(
        settings=resolved_settings,
        catalog_client=CatalogClient(
            base_url=resolved_settings.catalog_base_url,
            timeout_seconds=resolved_settings.request_timeout_seconds,
        ),
        timeseries_client=TimeseriesClient(
            base_url=resolved_settings.timeseries_base_url,
            timeout_seconds=resolved_settings.request_timeout_seconds,
        ),
    )
