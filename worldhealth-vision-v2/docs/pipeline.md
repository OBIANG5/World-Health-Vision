# Pipeline de données WHV — Guide des commandes

Ce document recense toutes les commandes CLI et appels API nécessaires pour alimenter
la base de données WHV V2. À utiliser de **bas en haut** : ingestion → timeseries → catalog → analytics.

---

## 1. Démarrage des services

Chaque service se lance dans son propre terminal depuis son répertoire.
**Prérequis** : PostgreSQL (+ TimescaleDB pour timeseries) actif sur localhost.

```powershell
# --- Gateway (port 8080) ---
cd services/gateway-service
./mvnw spring-boot:run

# --- Catalog (port 8082) ---
cd services/catalog-service
./mvnw spring-boot:run

# --- Timeseries (port 8083) ---
cd services/timeseries-service
./mvnw spring-boot:run

# --- Analytics (port 8000) ---
cd services/analytics-service
pip install -e ".[dev]"
uvicorn analytics_service.api:app --port 8000 --reload

# --- Ingestion (port 8001) ---
cd services/ingestion-service
pip install -e ".[dev]"
uvicorn ingestion_service.api:app --port 8001 --reload

# --- Frontend (port 5173) ---
cd frontend/web-v2
npm install
npm run dev
```

---

## 2. Vérification santé

```powershell
curl http://localhost:8080/actuator/health    # gateway
curl http://localhost:8082/actuator/health    # catalog
curl http://localhost:8083/actuator/health    # timeseries
curl http://localhost:8000/health              # analytics
curl http://localhost:8001/health              # ingestion
```

---

## 3. Jobs d'ingestion — CLI (ingestion-service)

Exécuter depuis `services/ingestion-service/` avec le virtualenv actif.

### 3a. World Bank — Pays & Indicateurs (OBLIGATOIRE EN PREMIER)

```powershell
# Seed du catalogue pays (mandatory first)
python -m ingestion_service.cli worldbank fetch-countries

# Indicateurs macro : PIB, inflation, chômage, balance courante, population, espérance de vie
python -m ingestion_service.cli worldbank fetch-core-indicators
```

**Durée estimée** : ~5-10 min selon débit réseau (World Bank API paginée).
**Données publiées** : `data/bronze/worldbank/` + push vers timeseries-service (port 8083).

---

### 3b. UNODC — Homicides (données sécurité)

**Option A** — Fichier local exporté :
```powershell
$env:WHV_INGEST_UNODC_HOMICIDE_EXPORT_PATH = "C:\chemin\vers\homicides.xlsx"
python -m ingestion_service.cli unodc fetch-homicide-baseline
```

**Option B** — Téléchargement automatique :
```powershell
$env:WHV_INGEST_UNODC_HOMICIDE_DOWNLOAD_URL = "https://dataunodc.un.org/..."
python -m ingestion_service.cli unodc fetch-homicide-baseline
```

**Source du fichier** : [dataunodc.un.org](https://dataunodc.un.org/dp-intentional-homicide-victims)
Exporter en Excel ou CSV depuis le bouton "Export data".

---

### 3c. Numbeo — Indices coût de la vie (nécessite clé API)

```powershell
$env:WHV_INGEST_NUMBEO_API_KEY = "VOTRE_CLE_API"
python -m ingestion_service.cli numbeo fetch-country-indices
```

**Obtenir une clé** : [numbeo.com/api/register.jsp](https://www.numbeo.com/api/register.jsp)
**Indicateurs** : coût de la vie, loyers, alimentation, restaurants, pouvoir d'achat.

---

## 4. Jobs d'ingestion — HTTP API

Pour les sources sans commande CLI dédiée, appeler le service d'ingestion via HTTP.

```powershell
# IMF WEO — PIB FMI, inflation, projections (téléchargement du classeur Excel IMF)
Invoke-WebRequest -Method POST http://localhost:8001/runs/imf/weo-core-indicators

# ILOStat — Taux d'activité, emploi (fetch API en ligne)
Invoke-WebRequest -Method POST http://localhost:8001/runs/ilostat/core-indicators

# OCDE — Niveaux de prix (Price Level Index, OECD=100)
Invoke-WebRequest -Method POST http://localhost:8001/runs/oecd/core-indicators

# UNSD SDG — Indicateurs objectifs développement durable
Invoke-WebRequest -Method POST http://localhost:8001/runs/unsd-sdg/core-indicators
```

**Durée estimée** :
- IMF WEO : 2-3 min (télécharge un classeur Excel de ~12 MB)
- ILOStat : 5-15 min (bulk data, timeout configuré à 300s)
- OECD : 3-5 min
- UNSD SDG : 3-10 min

---

## 5. Ordre recommandé pour un premier lancement complet

```
1. worldbank fetch-countries          (seed catalogue)
2. worldbank fetch-core-indicators    (macro de base)
3. POST /runs/oecd/core-indicators    (niveaux de prix)
4. POST /runs/imf/weo-core-indicators (projections FMI)
5. POST /runs/ilostat/core-indicators (marché du travail)
6. POST /runs/unsd-sdg/core-indicators (SDG)
7. unodc fetch-homicide-baseline      (sécurité — optionnel)
8. numbeo fetch-country-indices       (coût de la vie — clé requise)
```

Après chaque step, vérifier que les données apparaissent via :
```powershell
curl "http://localhost:8082/api/catalog/countries?limit=5"
curl "http://localhost:8083/api/timeseries/series?countryIso3=FRA&indicatorCode=NY.GDP.MKTP.CD"
curl "http://localhost:8000/api/analytics/countries/FRA/economic-snapshot"
```

---

## 6. Variables d'environnement de l'ingestion

| Variable | Valeur par défaut | Description |
|----------|-------------------|-------------|
| `WHV_INGEST_SERVICE_PORT` | `8001` | Port du service |
| `WHV_INGEST_TIMESERIES_BASE_URL` | `http://localhost:8083` | URL timeseries |
| `WHV_INGEST_PUBLISH_TO_TIMESERIES` | `true` | Push auto vers timeseries |
| `WHV_INGEST_BRONZE_ROOT` | `data/bronze` | Stockage brut local |
| `WHV_INGEST_REQUEST_TIMEOUT_SECONDS` | `120` | Timeout requêtes API |
| `WHV_INGEST_NUMBEO_API_KEY` | *(requis)* | Clé API Numbeo |
| `WHV_INGEST_UNODC_HOMICIDE_EXPORT_PATH` | *(optionnel)* | Chemin fichier Excel UNODC |
| `WHV_INGEST_UNODC_HOMICIDE_DOWNLOAD_URL` | *(optionnel)* | URL alternative UNODC |
| `WHV_INGEST_IMF_WEO_WORKBOOK_URL` | URL IMF publique | URL classeur WEO |

---

## 7. Métriques et logs

```powershell
# Métriques Prometheus (ingestion)
curl http://localhost:8001/metrics

# Métriques Prometheus (analytics)
curl http://localhost:8000/metrics

# Logs Spring Boot (catalog/timeseries) : directement dans le terminal du service
```

---

## 8. Réinitialisation des données (dev uniquement)

```sql
-- Vider les séries timeseries pour repartir propre
TRUNCATE timeseries.observation CASCADE;
TRUNCATE timeseries.series CASCADE;

-- Vider le catalogue
TRUNCATE catalog.country CASCADE;
TRUNCATE catalog.region CASCADE;
```

Puis relancer le pipeline depuis le step 1.