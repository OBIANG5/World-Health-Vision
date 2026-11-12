from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="WHV_MEDIA_", extra="ignore")

    service_port: int = 8000
    default_language: str = "fr"
    repository_backend: str = "memory"
    database_url: str = "postgresql://whv_user:whv_password@localhost:5432/whv"
    database_pool_min_size: int = 1
    database_pool_max_size: int = 5
    seed_demo_story: bool = True
    renderer_base_url: str = "http://localhost:8011"
    renderer_timeout_seconds: float = 10.0
    openai_api_key: str | None = None
    radar_model: str = "gpt-6-astra"
    radar_timeout_seconds: float = 120.0
    verification_model: str = "gpt-6-astra"
    verification_timeout_seconds: float = 120.0
    creative_model: str = "gpt-6-astra"
    creative_timeout_seconds: float = 60.0
    redis_url: str = "redis://localhost:6379/0"
    internal_api_base_url: str = "http://localhost:8000"
    catalog_base_url: str = "http://localhost:8082"
    catalog_timeout_seconds: float = 5.0
    radar_scheduler_enabled: bool = False
    radar_scheduler_interval_seconds: int = 300
    radar_scheduler_initial_delay_seconds: int = 20
    radar_scheduler_scan_hours: int = 3
    radar_scheduler_max_candidates: int = 12
    radar_scheduler_lock_ttl_seconds: int = 240
    radar_scheduler_heartbeat_ttl_seconds: int = 120


def get_settings() -> Settings:
    return Settings()
