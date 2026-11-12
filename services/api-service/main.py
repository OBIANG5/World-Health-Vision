from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from app.data_loader import load_silver_df
from app.schemas import HealthResponse
from app.routers.worldbank import router as worldbank_router, set_dataframe
from app.utils.trend import compute_trend_from_df

app = FastAPI(title="WorldHealth Vision API - V0")

# CORS (V0)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Charger Silver au démarrage (1 seule fois)
DF = load_silver_df()
set_dataframe(DF)


@app.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(status="ok", rows=int(len(DF)))


# Brancher les routes WorldBank
app.include_router(worldbank_router)


@app.get("/trend/country/{country_iso3}/indicator/{indicator}")
def get_trend(
    country_iso3: str,
    indicator: str,
    from_year: int | None = Query(default=None),
    to_year: int | None = Query(default=None),
    window: int = Query(default=10, ge=3, le=30),
):
    """
    Retourne une tendance simple (UP/DOWN/STABLE) basée sur une régression linéaire
    sur les N dernières années disponibles (window).
    """
    iso3 = country_iso3.upper()

    d = DF[(DF["country_iso3"] == iso3) & (DF["indicator"] == indicator)].copy()

    if from_year is not None:
        d = d[d["year"] >= from_year]
    if to_year is not None:
        d = d[d["year"] <= to_year]

    trend_info = compute_trend_from_df(d, window=window)

    return {
        "country_iso3": iso3,
        "indicator": indicator,
        "from_year": from_year,
        "to_year": to_year,
        **trend_info,
    }
