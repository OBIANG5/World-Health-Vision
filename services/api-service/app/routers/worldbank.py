from functools import lru_cache
from statistics import mean, median
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.schemas import CompareResponse, CountriesResponse, IndicatorsResponse, Point, SeriesResponse
from app.utils.trend import compute_trend_from_df

router = APIRouter(tags=["worldbank"])

# Dataframe global injecte depuis main.py au demarrage.
DF = None


def set_dataframe(df):
    global DF
    DF = df


@lru_cache(maxsize=512)
def cached_series(iso3: str, code: str, from_year: Optional[int], to_year: Optional[int]):
    if DF is None:
        raise RuntimeError("DataFrame not initialized")

    df2 = DF[(DF["country_iso3"] == iso3) & (DF["indicator"] == code)].copy()

    if from_year is not None:
        df2 = df2[df2["year"] >= from_year]
    if to_year is not None:
        df2 = df2[df2["year"] <= to_year]

    df2 = df2.sort_values("year")
    return [Point(year=int(y), value=float(v)) for y, v in zip(df2["year"], df2["value"])]


def parse_countries_csv(countries: str) -> list[str]:
    # Nettoie FRA,DEU,USA -> ["FRA", "DEU", "USA"] + dedup en conservant l'ordre.
    raw = [item.strip().upper() for item in countries.split(",") if item.strip()]
    if not raw:
        return []
    return list(dict.fromkeys(raw))


def compute_descriptive_stats(series: list[Point]) -> dict[str, float] | None:
    if not series:
        return None
    values = [float(p.value) for p in series]
    return {
        "mean": float(mean(values)),
        "median": float(median(values)),
        "min": float(min(values)),
        "max": float(max(values)),
    }


@router.get("/countries", response_model=CountriesResponse)
def list_countries():
    countries = sorted(DF["country_iso3"].dropna().unique().tolist())
    return CountriesResponse(count=len(countries), countries=countries)


@router.get("/indicators", response_model=IndicatorsResponse)
def list_indicators():
    indicators = sorted(DF["indicator"].dropna().unique().tolist())
    return IndicatorsResponse(count=len(indicators), indicators=indicators)


@router.get("/country/{iso3}/indicator/{code}", response_model=SeriesResponse)
def get_country_indicator_series(
    iso3: str,
    code: str,
    from_year: Optional[int] = None,
    to_year: Optional[int] = None,
    include_trend: bool = True,
    trend_window: int = 10,
    include_stats: bool = True,
):
    iso3 = iso3.upper()

    series = cached_series(iso3, code, from_year, to_year)
    if not series:
        raise HTTPException(status_code=404, detail=f"No data for country={iso3}, indicator={code}")

    trend_info = None
    if include_trend:
        df_subset = DF[(DF["country_iso3"] == iso3) & (DF["indicator"] == code)].copy()
        if from_year is not None:
            df_subset = df_subset[df_subset["year"] >= from_year]
        if to_year is not None:
            df_subset = df_subset[df_subset["year"] <= to_year]
        trend_info = compute_trend_from_df(df_subset, window=trend_window)

    stats_info = compute_descriptive_stats(series) if include_stats else None

    return SeriesResponse(
        country_iso3=iso3,
        indicator=code,
        from_year=from_year,
        to_year=to_year,
        points=len(series),
        series=series,
        trend=trend_info,
        stats=stats_info,
    )


@router.get("/compare", response_model=CompareResponse)
def compare_countries(
    countries: str = Query(..., description="ISO3 separes par virgule, ex: FRA,DEU,USA"),
    indicator: str = Query(..., description="Code indicateur World Bank"),
    from_year: Optional[int] = Query(default=None),
    to_year: Optional[int] = Query(default=None),
):
    iso_list = parse_countries_csv(countries)
    if not iso_list:
        raise HTTPException(status_code=400, detail="countries must contain at least one ISO3 code")

    result: dict[str, list[Point]] = {}
    for iso in iso_list:
        result[iso] = cached_series(iso, indicator, from_year, to_year)

    if not any(len(series) > 0 for series in result.values()):
        raise HTTPException(
            status_code=404,
            detail=f"No data for countries={','.join(iso_list)}, indicator={indicator}",
        )

    return CompareResponse(indicator=indicator, countries=result)
