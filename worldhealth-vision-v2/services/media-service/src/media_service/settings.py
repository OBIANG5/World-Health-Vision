from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="WHV_MEDIA_", extra="ignore")

    service_port: int = 8000
    default_language: str = "fr"
    repository_backend: str = "memory"
    renderer_base_url: str = "http://localhost:8011"
    renderer_timeout_seconds: float = 10.0
    openai_api_key: str | None = None
    radar_model: str = "gpt-6-astra"
    radar_timeout_seconds: float = 120.0


def get_settings() -> Settings:
    return Settings()
