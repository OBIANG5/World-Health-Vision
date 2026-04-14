from fastapi import FastAPI
from fastapi.responses import Response
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

from ingestion_service.runtime import (
    build_ilostat_service,
    build_imf_weo_service,
    build_oecd_service,
    build_unsd_sdg_service,
    build_unodc_service,
    build_worldbank_service,
)

app = FastAPI(title="WorldHealth Vision Ingestion Service")


@app.get("/health")
def health():
    return {"status": "ok", "service": "ingestion-service"}


@app.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.post("/runs/worldbank/countries")
def run_worldbank_countries():
    service = build_worldbank_service()
    manifest = service.fetch_country_registry()
    return manifest.model_dump(mode="json")


@app.post("/runs/worldbank/core-indicators")
def run_worldbank_core_indicators():
    service = build_worldbank_service()
    manifests = service.fetch_core_indicators()
    return {
        "count": len(manifests),
        "items": [manifest.model_dump(mode="json") for manifest in manifests],
    }


@app.post("/runs/imf/weo-core-indicators")
def run_imf_weo_core_indicators():
    service = build_imf_weo_service()
    manifests = service.fetch_core_indicators()
    return {
        "count": len(manifests),
        "items": [manifest.model_dump(mode="json") for manifest in manifests],
    }


@app.post("/runs/ilostat/core-indicators")
def run_ilostat_core_indicators():
    service = build_ilostat_service()
    manifests = service.fetch_core_indicators()
    return {
        "count": len(manifests),
        "items": [manifest.model_dump(mode="json") for manifest in manifests],
    }


@app.post("/runs/oecd/core-indicators")
def run_oecd_core_indicators():
    service = build_oecd_service()
    manifests = service.fetch_core_indicators()
    return {
        "count": len(manifests),
        "items": [manifest.model_dump(mode="json") for manifest in manifests],
    }


@app.post("/runs/unodc/homicide-baseline")
def run_unodc_homicide_baseline():
    service = build_unodc_service()
    manifests = service.fetch_homicide_baseline()
    return {
        "count": len(manifests),
        "items": [manifest.model_dump(mode="json") for manifest in manifests],
    }


@app.post("/runs/unsd-sdg/core-indicators")
def run_unsd_sdg_core_indicators():
    service = build_unsd_sdg_service()
    manifests = service.fetch_core_indicators()
    return {
        "count": len(manifests),
        "items": [manifest.model_dump(mode="json") for manifest in manifests],
    }
