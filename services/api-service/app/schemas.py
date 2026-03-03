from pydantic import BaseModel
from typing import Optional, List, Literal, Dict, Any


class HealthResponse(BaseModel):
    status: str
    rows: int


class CountriesResponse(BaseModel):
    count: int
    countries: List[str]


class IndicatorsResponse(BaseModel):
    count: int
    indicators: List[str]


class Point(BaseModel):
    year: int
    value: float


class TrendResponse(BaseModel):
    trend: Literal["UP", "DOWN", "STABLE", "INSUFFICIENT_DATA"]
    window: Optional[int] = None
    points_used: int
    slope: Optional[float] = None
    slope_relative: Optional[float] = None
    threshold_relative: Optional[float] = None
    method: str


class SeriesResponse(BaseModel):
    country_iso3: str
    indicator: str
    from_year: Optional[int] = None
    to_year: Optional[int] = None
    points: int
    series: List[Point]

    # ✅ Ajout: tendance (optionnelle)
    trend: Optional[TrendResponse] = None


class CompareResponse(BaseModel):
    indicator: str
    countries: Dict[str, List[Point]]
