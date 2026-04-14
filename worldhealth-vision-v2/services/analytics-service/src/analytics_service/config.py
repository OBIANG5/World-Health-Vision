from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="WHV_ANALYTICS_", extra="ignore")

    service_port: int = 8000
    request_timeout_seconds: int = 20
    catalog_base_url: str = "http://localhost:8082"
    timeseries_base_url: str = "http://localhost:8083"
    default_country_overview_indicator_limit: int = 5
    default_region_overview_indicator_limit: int = 5
    default_country_overview_series_limit: int = 6
    region_country_limit: int = 500
    flat_relative_change_threshold: float = 0.005
    freshness_fresh_days: int = 7
    freshness_aging_days: int = 45
    divergence_consistent_relative_threshold: float = 0.02
    divergence_mixed_relative_threshold: float = 0.08


def get_settings() -> Settings:
    return Settings()
