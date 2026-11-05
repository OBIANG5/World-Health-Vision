from fastapi import FastAPI
from fastapi.responses import Response
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

from ingestion_service.runtime import (
    build_adb_kidb_service,
    build_afdb_service,
    build_bis_service,
    build_cepal_service,
    build_ecb_service,
    build_eurostat_service,
    build_ilostat_service,
    build_imf_ifs_service,
    build_imf_weo_service,
    build_oecd_service,
    build_unsd_sdg_service,
    build_undp_hdr_service,
    build_unaids_service,
    build_unctad_service,
    build_unescouis_service,
    build_unodc_service,
    build_who_gho_service,
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


@app.post("/runs/who-gho/core-indicators")
def run_who_gho_core_indicators():
    service = build_who_gho_service()
    manifests = service.fetch_core_indicators()
    return {
        "count": len(manifests),
        "items": [manifest.model_dump(mode="json") for manifest in manifests],
    }


@app.post("/runs/eurostat/core-indicators")
def run_eurostat_core_indicators():
    service = build_eurostat_service()
    manifests = service.fetch_core_indicators()
    return {
        "count": len(manifests),
        "items": [manifest.model_dump(mode="json") for manifest in manifests],
    }


@app.post("/runs/undp-hdr/core-indicators")
def run_undp_hdr_core_indicators():
    service = build_undp_hdr_service()
    manifests = service.fetch_core_indicators()
    return {
        "count": len(manifests),
        "items": [manifest.model_dump(mode="json") for manifest in manifests],
    }


@app.post("/runs/bis/core-indicators")
def run_bis_core_indicators():
    service = build_bis_service()
    manifests = service.fetch_core_indicators()
    return {
        "count": len(manifests),
        "items": [manifest.model_dump(mode="json") for manifest in manifests],
    }


@app.post("/runs/imf-ifs/core-indicators")
def run_imf_ifs_core_indicators():
    service = build_imf_ifs_service()
    manifests = service.fetch_core_indicators()
    return {
        "count": len(manifests),
        "items": [manifest.model_dump(mode="json") for manifest in manifests],
    }


@app.post("/runs/adb-kidb/core-indicators")
def run_adb_kidb_core_indicators():
    service = build_adb_kidb_service()
    manifests = service.fetch_core_indicators()
    return {
        "count": len(manifests),
        "items": [manifest.model_dump(mode="json") for manifest in manifests],
    }


@app.post("/runs/unaids/core-indicators")
def run_unaids_core_indicators():
    service = build_unaids_service()
    manifests = service.fetch_core_indicators()
    return {
        "count": len(manifests),
        "items": [manifest.model_dump(mode="json") for manifest in manifests],
    }


@app.post("/runs/cepal/core-indicators")
def run_cepal_core_indicators():
    service = build_cepal_service()
    manifests = service.fetch_core_indicators()
    return {
        "count": len(manifests),
        "items": [manifest.model_dump(mode="json") for manifest in manifests],
    }


@app.post("/runs/afdb/core-indicators")
def run_afdb_core_indicators():
    service = build_afdb_service()
    manifests = service.fetch_core_indicators()
    return {
        "count": len(manifests),
        "items": [manifest.model_dump(mode="json") for manifest in manifests],
    }


@app.post("/runs/ecb/core-indicators")
def run_ecb_core_indicators():
    service = build_ecb_service()
    manifests = service.fetch_core_indicators()
    return {
        "count": len(manifests),
        "items": [manifest.model_dump(mode="json") for manifest in manifests],
    }


@app.post("/runs/unctad/core-indicators")
def run_unctad_core_indicators():
    service = build_unctad_service()
    manifests = service.fetch_core_indicators()
    return {
        "count": len(manifests),
        "items": [manifest.model_dump(mode="json") for manifest in manifests],
    }


@app.post("/runs/unescouis/core-indicators")
def run_unescouis_core_indicators():
    service = build_unescouis_service()
    manifests = service.fetch_core_indicators()
    return {
        "count": len(manifests),
        "items": [manifest.model_dump(mode="json") for manifest in manifests],
    }