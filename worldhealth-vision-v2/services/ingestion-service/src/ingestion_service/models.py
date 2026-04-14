from datetime import UTC, date, datetime
from pathlib import Path
from typing import Any, Literal

from pydantic import BaseModel, Field


class RunManifest(BaseModel):
    source_code: str
    dataset_code: str
    run_id: str
    fetched_at_utc: datetime = Field(default_factory=lambda: datetime.now(UTC))
    record_count: int
    manifest_path: Path
    raw_payload_path: Path
    normalized_payload_path: Path
    notes: dict[str, Any] = Field(default_factory=dict)


class WorldBankLabeledValue(BaseModel):
    id: str | None = None
    value: str | None = None


class WorldBankCountryRecord(BaseModel):
    id: str
    iso2Code: str
    name: str
    region: WorldBankLabeledValue
    adminregion: WorldBankLabeledValue
    incomeLevel: WorldBankLabeledValue
    lendingType: WorldBankLabeledValue
    capitalCity: str | None = None
    longitude: str | None = None
    latitude: str | None = None


class CountryRegistryRecord(BaseModel):
    iso3: str
    iso2: str | None
    display_name: str
    region_code: str | None
    region_name: str | None
    subregion_code: str | None
    subregion_name: str | None
    income_group: str | None
    lending_type: str | None
    capital_city: str | None
    latitude: float | None
    longitude: float | None
    is_aggregate: bool


class IndicatorRegistryEntry(BaseModel):
    code: str
    name: str


class ImfWeoIndicatorRegistryEntry(BaseModel):
    indicator_code: str
    imf_indicator_id: str
    display_name: str
    scale_multiplier: float = 1.0


class IloStatIndicatorRegistryEntry(BaseModel):
    indicator_code: str
    ilostat_download_id: str
    ilostat_series_code: str
    display_name: str
    scale_multiplier: float = 1.0
    filters: dict[str, str] = Field(default_factory=dict)


class OecdIndicatorRegistryEntry(BaseModel):
    indicator_code: str
    dataset_code: str
    dataset_label: str
    dataflow_agency: str
    dataflow_id: str
    data_query: str
    display_name: str
    period_granularity: Literal["DAILY", "MONTHLY", "QUARTERLY", "ANNUAL", "AD_HOC"] = "ANNUAL"
    scale_multiplier: float = 1.0
    filters: dict[str, str] = Field(default_factory=dict)


class UnodcIndicatorRegistryEntry(BaseModel):
    indicator_code: str
    dataset_code: str
    dataset_label: str
    display_name: str
    period_granularity: Literal["ANNUAL"] = "ANNUAL"
    country_code_aliases: list[str] = Field(default_factory=list)
    country_name_aliases: list[str] = Field(default_factory=list)
    period_aliases: list[str] = Field(default_factory=list)
    value_aliases: list[str] = Field(default_factory=list)
    scale_multiplier: float = 1.0
    filters: dict[str, str] = Field(default_factory=dict)


class UnsdSdgIndicatorRegistryEntry(BaseModel):
    indicator_code: str
    dataset_code: str
    dataset_label: str
    series_code: str
    display_name: str
    release_code: str | None = None
    time_period_start: int | None = None
    time_period_end: int | None = None
    period_granularity: Literal["ANNUAL"] = "ANNUAL"
    scale_multiplier: float = 1.0
    dimension_filters: dict[str, str] = Field(default_factory=dict)
    attribute_filters: dict[str, str] = Field(default_factory=dict)


class IndicatorObservation(BaseModel):
    country_iso3: str
    indicator_code: str
    period_granularity: Literal["DAILY", "MONTHLY", "QUARTERLY", "ANNUAL", "AD_HOC"] = "ANNUAL"
    period_start: date
    period_end: date
    period_label: str
    value: float | None
    value_status: str | None = None
    source_published_at: datetime | None = None
    source_metadata: dict[str, Any] = Field(default_factory=dict)
    quality_flags: list[str] = Field(default_factory=list)

    @classmethod
    def annual(
        cls,
        *,
        country_iso3: str,
        indicator_code: str,
        year: int,
        value: float | None,
        value_status: str | None = None,
        source_published_at: datetime | None = None,
        source_metadata: dict[str, Any] | None = None,
        quality_flags: list[str] | None = None,
    ) -> "IndicatorObservation":
        return cls(
            country_iso3=country_iso3,
            indicator_code=indicator_code,
            period_granularity="ANNUAL",
            period_start=date(year, 1, 1),
            period_end=date(year, 12, 31),
            period_label=str(year),
            value=value,
            value_status=value_status,
            source_published_at=source_published_at,
            source_metadata=source_metadata or {},
            quality_flags=quality_flags or [],
        )

    @property
    def year(self) -> int | None:
        if self.period_granularity != "ANNUAL":
            return None
        return self.period_start.year
