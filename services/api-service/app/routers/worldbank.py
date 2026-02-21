from fastapi import APIRouter, HTTPException
from functools import lru_cache
from typing import Optional

from app.schemas import CountriesResponse, IndicatorsResponse, SeriesResponse, Point
from app.utils.trend import compute_trend_from_df

router = APIRouter(tags=["worldbank"])

# DF sera injecté depuis main.py (proprement)
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
):
    iso3 = iso3.upper()

    # Série
    series = cached_series(iso3, code, from_year, to_year)

    if not series:
        raise HTTPException(status_code=404, detail=f"No data for country={iso3}, indicator={code}")

    # Trend (calculé sur le même subset de données)
    trend_info = None
    if include_trend:
        df_subset = DF[(DF["country_iso3"] == iso3) & (DF["indicator"] == code)].copy()
        if from_year is not None:
            df_subset = df_subset[df_subset["year"] >= from_year]
        if to_year is not None:
            df_subset = df_subset[df_subset["year"] <= to_year]

        trend_info = compute_trend_from_df(df_subset, window=trend_window)

    return SeriesResponse(
        country_iso3=iso3,
        indicator=code,
        from_year=from_year,
        to_year=to_year,
        points=len(series),
        series=series,
        trend=trend_info,  # ✅ ajouté ici
    )
