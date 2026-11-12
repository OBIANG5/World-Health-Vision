from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="WHV_MEDIA_", extra="ignore")

    service_port: int = 8000
    default_language: str = "fr"
    repository_backend: str = "memory"


def get_settings() -> Settings:
    return Settings()
