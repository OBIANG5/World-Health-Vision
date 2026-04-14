# timeseries-service

Service proprietaire du schema canonique des observations multi-sources.

Responsabilites:
- stocker les runs de collecte publies par ingestion-service
- stocker les observations normalisees et versionnees par source
- exposer des lectures metier stables pour le backend V2
- garder la provenance des observations exploitable par les futurs services analytics

Ce service ne remplace pas le bronze:
- le bronze reste la trace immuable des payloads source
- timeseries-service porte la representation canonique exploitable
