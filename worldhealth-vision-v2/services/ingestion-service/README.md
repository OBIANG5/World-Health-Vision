## ingestion-service

Service Python V2 charge de l'acquisition et du premier stockage brut des
sources ouvertes.

## Role

- appeler les sources ouvertes documentees
- historiser le brut en `bronze`
- produire un premier niveau de normalisation simple
- preparer la suite pour `catalog-service` et `timeseries-service`

## Premiere source prise en charge

- World Bank API

## Commandes prevues

- `python -m ingestion_service.cli worldbank fetch-countries`
- `python -m ingestion_service.cli worldbank fetch-core-indicators`

## API interne

- `GET /health`
- `GET /metrics`
- `POST /runs/worldbank/countries`
- `POST /runs/worldbank/core-indicators`
