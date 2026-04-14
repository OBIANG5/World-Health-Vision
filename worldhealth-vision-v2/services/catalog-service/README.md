# catalog-service

Premier service metier de `worldhealth-vision-v2`.

## Role

Ce service devient la source de verite du referentiel backend V2 :

- pays
- regions
- indicateurs
- sources
- datasets

## Pourquoi commencer par lui ?

Parce que le reste du backend depend de lui :

- `ingestion-service` doit savoir vers quels codes normaliser
- `timeseries-service` doit exposer des identifiants metier stables
- `analytics-service` doit connaitre les metadonnees et la provenance
- `gateway-service` doit router vers une API de reference propre

## Ce qui existe dans cette premiere etape

- structure Spring Boot
- persistence JDBC explicite
- migrations Flyway
- seeds initiaux de sources et d'indicateurs
- endpoints de lecture de base
- test d'integration PostgreSQL avec Testcontainers

## Ce qui viendra juste apres

- chargement des pays et regions completes
- enrichissement des datasets
- rattachement plus fin des indicateurs a plusieurs familles de sources
- exposition via le gateway
