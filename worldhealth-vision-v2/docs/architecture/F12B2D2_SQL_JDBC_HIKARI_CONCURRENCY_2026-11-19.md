# World-Vision F1.2b.2d-2 — où est réellement passé le temps ?

**Date : 19/11/2026.** PR #58, **DRAFT**, fondée sur la PR #57. Aucun déploiement, aucun merge, aucune extension V0/V1/média/voix. Fixture **100 % SYNTHÉTIQUE** de 12 pays, 54 codes d'indicateurs économiques, quatre sources, 24 années, 2 révisions = **124 416 observations**.

## Expérience rigoureuse : trois niveaux différents, ne pas les additionner

1. `EXPLAIN ANALYZE BUFFERS` : SQL **pur**, instructions SELECT extraites de `JdbcTimeseriesRepository.java`, avec 54 codes récupérés de `ECONOMIC_LENS_PROFILES`, 1 froid + 5 chauds par instruction. Medians/rows/buffers/disk spills. **Pas un temps SQL sous concurrence**.
2. Timer `whv.timeseries.batch.jdbc{operation=history|latest|availability}` : depuis Java, acquisition de connexion et SQL **plus** conversion des lignes en objets. Étiquettes FIXES sans pays, dataset, source, profil, utilisateur ou SQL. **Pas HTTP ni Python**.
3. Metrics Hikari `connections_active/idle/pending/max`, `connections_acquire_seconds`, prélevées toutes les 250 ms depuis Analytics sur `timeseries-service:8080/actuator/prometheus` **sur réseau privé de conteneurs CI uniquement**. Il n'y a pas d'accès depuis Gateway public ni de métrique activée sur un déploiement.
4. Benchmark complet dans le vrai FastAPI pour tous les 12 pays, niveaux 1/2/4/8/12, 60 requêtes/run ×2. Égalité des empreintes JSON complètes hors generatedAtUtc, 54 indicateurs, 200 comparaisons, 270 preuves, aucun HTTP échoué ou batch ancien N+1.

## SQL : 2 observations indépendantes

| PostgreSQL | Cold run 1 | Médiane chaud run 1 (n=5) | Médiane chaud run 2 (n=5) | Lignes FRA retournées | Tri disque |
| --- | ---: | ---: | ---: | ---: | --- |
| Historique | 47,978 ms | 50,489 ms | 51,648 ms | 5 002 | non |
| Dernière source | 37,857 ms | 46,250 ms | 44,474 ms | 216 | non |
| Disponibilité | 44,382 ms | 57,068 ms | 53,048 ms | 216 | non |

Plans : `timeseries.observation` ~10 368 lignes lues pour FRA incluant deux versions; `latest_observation` trie/réconcilie les révisions et rangs avant de grouper les 54 profils. Le fait qu'un SELECT isolé dure ~50 ms **ne prouve pas** la même durée sous compétition et ne permet PAS de calculer « HTTP moins SQL = délai réseau ».

## Hikari/JDBC : le résultat qui change les priorités

| Simultané | Run1 pool active max | Run1 pending max | Run1 checkout moyen | Run2 pool active max | Run2 pending max | Run2 checkout moyen |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 0* | 0 | 0,075 ms | 3 | 0 | 0,141 ms |
| 2 | 5 | 0 | 0,073 | 6 | 0 | 0,394 |
| 4 | 5 | 0 | 9,142 | 8 | 0 | 7,119 |
| 8 | 16 | 0 | 44,038 | 8 | 0 | 38,838 |
| 12 | 20 | 14 | 115,776 | 10 | 0 | 85,331 |

*La jauge sous charge 1 a été prélevée hors des très courtes occupations ; une valeur zéro ne signifie pas que le pool n'a pas été utilisé. Les maxima reflètent des **prélèvements**, pas tous les pics. Le pool maximum configuré est 20.

| JDBC total moyen | Concurrence 1, run1/run2 | Concurrence 12, run1/run2 |
| --- | --- | --- |
| Historique | 102,550 / 90,704 ms | 857,794 / 720,458 ms |
| Disponibilité | 104,800 / 80,798 ms | 942,953 / 806,328 ms |
| Dernière valeur | 89,156 / 75,098 ms | 726,138 / 568,833 ms |

Aucun indicateur n'a disparu, toutes les empreintes restent stables ; les 3 batchs appellent chaque fois leurs procédures. La différence de pool entre runs interdit d'annoncer la saturation permanente. Les mesures révèlent toutefois une importante augmentation du coût d'une requête sous charge, dont la compétition SQL + Hikari + mapping peut être co-responsable.

## GitHub : reproduire et continuer

- Exécutions même commit `2ea7b22a58c74c91691b63878f122b0f8695b351` :
  - Canonique Java/Python/Frontend/Testcontainers : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44540307785
  - SQL dense + équivalence des résultats : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44540307910
  - SQL + Hikari run 1 : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44540308050/artifacts/14537992115
  - SQL + Hikari run 2 : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44540319995/artifacts/14538391627
- Fichiers principaux : `infra/tests/generate_batch_jdbc_explain.py`, `analyze_batch_jdbc_plans.py`, `benchmark_optimized_dense_concurrency.py --profile-timeseries-jdbc`, overlay `compose.ci-private-timeseries-metrics.yml`, workflow `.github/workflows/whv-v2-sql-hikari-profile.yml`. Java `JdbcTimeseriesRepository` et test `TimeseriesControllerIntegrationTest` contrôlent les timers fixes.
- Pour la **prochaine phase #56**, proposer une expérience A/B sans changement des chiffres : protéger les lectures SQL coûteuses par une gestion explicite de la concurrence et comparer au mode parallèle actuel. On ne décide pas d'une limite de concurrence avant d'observer latence/throughput/équivalence et erreurs. Tester compression/bytes et hétérogénéité en lots séparés.
- **Aucune conclusion SLO production**, aucun achat/fusion/déploiement. Document maître de reprise : `docs/continuity/HANDOFF_CORE_F12B_2026-11-19.md` ; garder GDELT/EarlyForge/Watch/verticales et revenus futurs correctement distingués des fonctionnalités réelles.
