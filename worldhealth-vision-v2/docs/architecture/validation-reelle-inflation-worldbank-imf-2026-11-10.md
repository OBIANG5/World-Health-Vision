# WorldHealth Vision V2 — preuve d'ingestion officielle de l'inflation

**Date de validation :** 10 novembre 2026.  
**Périmètre :** `worldhealth-vision-v2/` exclusivement.  
**Statut :** **réussi dans l'environnement Docker éphémère de GitHub Actions ; PAS de base permanente déployée.**

## Pourquoi ce jalon est indispensable

WorldHealth Vision ne doit pas présenter les valeurs de deux organismes
comme une contradiction ou une confirmation avant d'avoir vérifié leur
**période de référence**, leur **statut** (OBSERVED/ESTIMATED) et leur
**provenance**. Deux publications peuvent partager les mêmes statistiques
nationales et ne constituent pas forcément deux mesures indépendantes.

## Résultat reproductible de bout en bout

Exécution de référence :
[GitHub Actions — ingestion FMI + Banque mondiale, 2026-11-10](https://github.com/OBIANG5/World-Health-Vision/actions/runs/42879287668).

Cette exécution a :
1. démarré la passerelle, le catalogue, les séries temporelles, l'analyse et l'ingestion V2, ainsi que PostgreSQL/TimescaleDB ;
2. appelé réellement les deux fournisseurs officiels pour `FP.CPI.TOTL.ZG` et `PCPIPCH` ;
3. téléchargé l'indicateur Banque mondiale depuis l'archive ZIP **officielle** WDI lorsque l'API JSON des séries répondait 502 ;
4. téléchargé le classeur IMF *World Economic Outlook*, édition **octobre 2026** ;
5. publié les observations par `TimeseriesClient` avec leurs codes source/jeu de données, période, année et run ;
6. relu les séries stockées via `/api/timeseries/series` et la couverture `/api/timeseries/sources/coverage` ;
7. vérifié le contrat `/api/product/countries/FRA/indicators/FP.CPI.TOTL.ZG/overview` à travers la gateway ;
8. généré un rapport JSON et détruit ensuite **volontairement** la base de test.

### Dernière année **observée** présente dans les deux sources

| Pays | Année alignée | Écart absolu des taux publiés |
| --- | --- | ---: |
| France (`FRA`) | 2025 | 0,017825 point de pourcentage |
| Gabon (`GAB`) | 2025 | 0,001666 point de pourcentage |
| États-Unis (`USA`) | 2024 | 0,002475 point de pourcentage |

Ces nombres sont les **écarts calculés** par le job à partir des
observations effectivement ingérées, non des valeurs inventées. Les deux
séries peuvent partager des sources nationales primaires et leur accord
apparent ne prouve pas une absence de biais.

La méthode de comparaison utilise l'année commune la plus récente avec
deux valeurs `OBSERVED`, plutôt que la dernière année disponible de
chaque éditeur séparément. Les données FMI `ESTIMATED` restent dans le
stock mais sont **exclues du consensus observé**. Une source ne compte pas
deux fois si elle publie plusieurs jeux de données.

Les rapports JSON complets sont accessibles dans les *artifacts* du job
(temps de conservation GitHub Actions : 14 jours).

## Correctifs validés dans le code

- `ingestion_service/connectors/worldbank_client.py` : requête
  pays ciblés et repli vérifié sur le ZIP officiel
  `https://api.worldbank.org/v2/en/indicator/FP.CPI.TOTL.ZG?downloadformat=csv`.
- `ingestion_service/pipelines/worldbank.py` : périmètre pays/indicateur
  explicite, refus d'une ingestion vide, qualité signalée lorsque l'archive
  CSV ne fournit pas de statut par observation.
- `ingestion_service/settings.py` et `connectors/imf_weo_client.py` :
  classeur officiel WEO d'octobre 2026.
- `ingestion_service/pipelines/imf_weo.py` : année de dernier chiffre
  réel vérifiée ; projections futures non publiées en `OBSERVED`.
- `ingestion_service/pilots/inflation.py` et
  `ingestion_service/cli.py` : pilote limité à un indicateur et trois pays,
  exigeant une vraie écriture canonique puis une relecture.
- `analytics_service/models.py` : aucune comparaison directe de
  valeurs prises à des années différentes. Attention : l'API principale
  doit encore sélectionner le **dernier millésime commun disponible dans
  l'historique**, même lorsque le dernier chiffre de chaque source est
  d'une année différente (voir travaux ultérieurs).

## Contrôles

[Audit strict V2 correspondant](https://github.com/OBIANG5/World-Health-Vision/actions/runs/42879287686) :

- 27 tests Java réussis ;
- 34 tests Python Analytics réussis ;
- 29 tests Python Ingestion réussis ;
- validation TypeScript/Vite et cinq services Docker sans redémarrage ;
- test réel de collecte et de lecture API ci-dessus.

## Refaire le test

Sur un environnement de travail disposant de Docker :

```bash
docker compose -f worldhealth-vision-v2/infra/docker-compose.yml up --build -d \
  gateway-service catalog-service timeseries-service analytics-service ingestion-service

docker compose -f worldhealth-vision-v2/infra/docker-compose.yml exec -T ingestion-service \
  python -m ingestion_service.cli pilot inflation

curl -fsS http://localhost:8080/api/timeseries/sources/coverage
curl -fsS http://localhost:8080/api/product/countries/FRA/indicators/FP.CPI.TOTL.ZG/overview
```

Une option plus reproductible sans machine locale est d'exécuter le workflow
`.github/workflows/whv-v2-live-inflation-pilot.yml` et de récupérer les
rapports JSON. Le déclenchement automatique de ce pilote d'intégration
**ne doit pas être confondu avec une actualisation de production**.

## Limites et prochaines conditions de sortie

1. Aucun hébergement backend permanent ni base durable : l'exécution
   détruit PostgreSQL de test à la fin.
2. Le ZIP officiel WDI n'inclut pas de statut par observation :
   `WDI_BULK_CSV_OBS_STATUS_NOT_INCLUDED` est conservé en qualité/provenance.
3. L'alignement sur une année ne prouve pas une comparabilité
   méthodologique parfaite : ne pas calculer une moyenne universelle opaque.
4. Le rendu des valeurs *réelles* n'a pas été vérifié en navigateur sur un
   frontend connecté à un backend persistant.
5. La passerelle analytics affiche encore, pour certains pays, le dernier
   chiffre de chaque source plutôt que le dernier millésime réellement commun.
6. Avant mise en production : secrets, licences d'utilisation, fréquence de
   rafraîchissement, surveillance d'échecs et stockage persistant.

**Jalon atteint :** ingestion multi-sources réelles, stockage canonique,
relecture et comparaison historique contrôlée pour 3 pays.

**Jalon suivant :** comparaison historique canonique dans l'API produit,
interface pays réellement connectée, puis persistance et rafraîchissement
automatique des données.
