# Local Run Without Docker

## Goal

This document defines the preferred local development flow for `worldhealth-vision-v2`
when Docker is intentionally disabled.

Use this mode when:

- you want faster feedback loops
- you want to see endpoint results directly in the terminal
- you want to work on the frontend and backend together without Compose

## What still needs to exist locally

This mode avoids Docker, but it does **not** remove the need for a database.

You need a local PostgreSQL instance reachable at:

- host: `localhost`
- port: `5432`
- database: `whv`
- username: `whv_user`
- password: `whv_password`

If your local PostgreSQL uses different values, override the matching environment
variables before starting the Java services:

- `WHV_DB_URL`
- `WHV_DB_USERNAME`
- `WHV_DB_PASSWORD`

## Required Tooling

- Java `21`
- Python `3.12`
- Node.js `20.19+` or `22.12+`
- npm

Maven should be launched with the wrapper already present in the repo:

- `services/gateway-service/mvnw.cmd`

## Default Ports

- `gateway-service`: `8080`
- `catalog-service`: `8082`
- `timeseries-service`: `8083`
- `analytics-service`: `8000`
- `ingestion-service`: `8001` in local manual mode
- `frontend/web-v2` (Vite): `5173`

`analytics-service` and `ingestion-service` both default to `8000` in their own
packages. In local manual mode, keep `analytics-service` on `8000` and launch
`ingestion-service` explicitly on `8001`.

## Recommended Startup Order

1. local PostgreSQL
2. `catalog-service`
3. `timeseries-service`
4. `analytics-service`
5. `gateway-service`
6. `ingestion-service` only when you need to load or refresh source data
7. `frontend/web-v2`

This order matters because:

- `analytics-service` depends on `catalog-service` and `timeseries-service`
- `gateway-service` depends on `catalog-service`, `timeseries-service`, and `analytics-service`
- `ingestion-service` publishes into `timeseries-service`

## Terminal 1 - catalog-service

From `worldhealth-vision-v2`:

```powershell
.\services\gateway-service\mvnw.cmd -f pom.xml -pl services/catalog-service -am spring-boot:run
```

Readiness check:

```powershell
curl.exe http://localhost:8082/api/catalog/readiness
```

Useful endpoint checks:

```powershell
curl.exe "http://localhost:8082/api/catalog/countries?includeAggregates=false&activeOnly=true&limit=20"
curl.exe http://localhost:8082/api/catalog/countries/FRA
curl.exe "http://localhost:8082/api/catalog/currencies?activeOnly=true&limit=20"
```

## Terminal 2 - timeseries-service

From `worldhealth-vision-v2`:

```powershell
.\services\gateway-service\mvnw.cmd -f pom.xml -pl services/timeseries-service -am spring-boot:run
```

Readiness check:

```powershell
curl.exe http://localhost:8083/api/timeseries/readiness
```

Useful endpoint checks:

```powershell
curl.exe "http://localhost:8083/api/timeseries/series/latest?indicatorCode=FP.CPI.TOTL.ZG&countryIso3=FRA"
curl.exe "http://localhost:8083/api/timeseries/series/availability?indicatorCode=FP.CPI.TOTL.ZG&countryIso3=FRA"
```

## Terminal 3 - analytics-service

From `worldhealth-vision-v2/services/analytics-service`:

```powershell
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -e .[dev]
python -m uvicorn analytics_service.api:app --host 127.0.0.1 --port 8000
```

Readiness check:

```powershell
curl.exe http://localhost:8000/api/analytics/readiness
```

Useful endpoint checks:

```powershell
curl.exe http://localhost:8000/api/analytics/countries/FRA/economic-snapshot
curl.exe http://localhost:8000/api/analytics/countries/FRA/relative-cost-snapshot
curl.exe http://localhost:8000/api/analytics/countries/FRA/indicators/FP.CPI.TOTL.ZG/source-audit
```

## Terminal 4 - gateway-service

From `worldhealth-vision-v2`:

```powershell
$env:WHV_SECURITY_ENABLED="false"
.\services\gateway-service\mvnw.cmd -f pom.xml -pl services/gateway-service -am spring-boot:run
```

Readiness check:

```powershell
curl.exe http://localhost:8080/actuator/health
```

Useful product-level endpoint checks:

```powershell
curl.exe http://localhost:8080/api/product/countries/FRA/economic-snapshot
curl.exe http://localhost:8080/api/product/countries/FRA/relative-cost-snapshot
curl.exe "http://localhost:8080/api/product/compare/countries/latest?countryIso3=FRA&countryIso3=DEU&indicatorCode=FP.CPI.TOTL.ZG"
```

## Terminal 5 - ingestion-service

Run this only when you want to load or refresh source data.

From `worldhealth-vision-v2/services/ingestion-service`:

```powershell
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -e .[dev]
python -m uvicorn ingestion_service.api:app --host 127.0.0.1 --port 8001
```

Health check:

```powershell
curl.exe http://localhost:8001/health
```

Initial useful runs:

```powershell
curl.exe -X POST http://localhost:8001/runs/worldbank/countries
curl.exe -X POST http://localhost:8001/runs/worldbank/core-indicators
curl.exe -X POST http://localhost:8001/runs/imf/weo-core-indicators
curl.exe -X POST http://localhost:8001/runs/ilostat/core-indicators
curl.exe -X POST http://localhost:8001/runs/oecd/core-indicators
curl.exe -X POST http://localhost:8001/runs/unsd-sdg/core-indicators
```

For `UNODC`, you still need one of:

- `WHV_INGEST_UNODC_HOMICIDE_EXPORT_PATH`
- `WHV_INGEST_UNODC_HOMICIDE_DOWNLOAD_URL`

Then:

```powershell
curl.exe -X POST http://localhost:8001/runs/unodc/homicide-baseline
```

## Terminal 6 - frontend/web-v2

From `worldhealth-vision-v2/frontend/web-v2`:

```powershell
npm install
npm run dev
```

Open the app at:

```text
http://localhost:5173
```

The Vite dev server should proxy `/api/*` requests to `gateway-service`.
That keeps the frontend simple and avoids browser CORS issues in local mode.

## Fast Failure Checks

If the frontend opens but no data appears, test these in order:

```powershell
curl.exe http://localhost:8082/api/catalog/readiness
curl.exe http://localhost:8083/api/timeseries/readiness
curl.exe http://localhost:8000/api/analytics/readiness
curl.exe http://localhost:8080/api/product/countries/FRA/economic-snapshot
```

Interpretation:

- if `catalog-service` fails, country metadata will be missing
- if `timeseries-service` fails, analytics will degrade or return empty data
- if `analytics-service` fails, product snapshots will fail
- if `gateway-service` fails, the frontend will not see the product APIs

## Practical Working Mode

For day-to-day progress, prefer this loop:

1. keep `catalog-service`, `timeseries-service`, `analytics-service`, and `gateway-service` running
2. launch `ingestion-service` only when you need to refresh data
3. work on `frontend/web-v2` against real gateway endpoints
4. delay Docker validation until the end of a coherent feature slice