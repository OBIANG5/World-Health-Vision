# F1.2b.2c-3D — validation réelle des quatre batchs avec Gateway et pannes

**19/11/2026.** PR #55 basée sur #53 (historique source-économique). Changements sur l'architecture CI, **pas de production**. Documentation de reprise centrale : `docs/continuity/HANDOFF_CORE_F12B_2026-11-19.md`.

## Pourquoi l'essai précédent ne suffisait pas

PR #53 démontre une très forte réduction du fan-out interservices (de 70 à 17 appels HTTP) sur la fixture de **124 416 lignes 100 % SYNTHÉTIQUES**. Elle compare les réponses complètes et garde les périodes communes, statuts et preuves. Mais ces A/B activaient les flags au moment de construire directement un `AnalyticsService` dans le conteneur, alors que les tests Gateway historiques exécutaient le service sans ces flags. Un **test de bout en bout avec flags ON dans le vrai processus** était nécessaire avant un éventuel staging.

## Isolation et contrôles de sécurité en CI

- Fichier `infra/tests/compose.ci-batch-optimized.yml` : active `WHV_ANALYTICS_CATALOG_INDICATOR_BATCH_ENABLED`, `WHV_ANALYTICS_TIMESERIES_LATEST_BATCH_ENABLED`, `WHV_ANALYTICS_TIMESERIES_AVAILABILITY_BATCH_ENABLED`, `WHV_ANALYTICS_TIMESERIES_HISTORY_BATCH_ENABLED` à `true` uniquement dans la CI jetable.
- Les quatre paramètres dans `analytics_service/config.py` restent **false par défaut**. Aucun flag n'est activé sur Vercel ni sur un backend public.
- Base sécurisée `compose.secure-staging.yml` + overlay de GET publics CI + overlay batch de test. PostgreSQL, Catalog, Timeseries, Analytics et Ingestion ne publient pas de port ; seul le Gateway écoute sur le loopback du runner. JWT actif ; `source-runs` et Advisor refusés sans identité ; `/internal/timeseries/series/history/batch` non accessible depuis le Gateway public.
- **Limite** : être absent de la route Gateway n'est pas une authentification du service. mTLS/ACL/services permissions et contrôle de charge demeurent un préalable au staging exposé.

## Preuves observées (pas estimations)

- Workflow indépendant : `.github/workflows/whv-v2-optimized-batch-e2e.yml`.
- Exécution : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44533729210 **SUCCESS attempt 2**, commit exact `72cd8753fb51402c0bc3b6a75f075577b895258f`.
- Artefact GitHub : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44533729210/artifacts/14535467010 .
- Benchmark public Gateway, quatre workers, 40 GET par route :
  - `/api/catalog/countries?limit=2` : 40/40 succès, p50 32,14 ms ; p95 47,02 ; p99 56,86.
  - `/api/timeseries/sources/coverage` : 40/40, p50 28,85 ; p95 51,32 ; p99 57,42.
  - `/api/product/countries/FRA/economic-snapshot` : 40/40, p50 **122,17** ; p95 **172,25** ; p99 **174,63**.
- **IMPORTANT** : base économique vide/catalogue de référence, **pas la fixture 124 416 observations**. C'est un test de connectivité, latence et robustesse, pas une preuve SQL mondiale ni un SLO reproductible en production.
- Profil HTTP privé, 43 snapshots (40+3 warmups) : exactement **43 GET internes réussis** pour chacune des quatre opérations groupées (une par snapshot) : `catalog.indicators_batch`, `timeseries.latest_batch`, `timeseries.availability_batch`, `timeseries.series_batch`. Le parseur CI rejette un N+1 historique silencieux, les labels inattendus et les dimensions pays/source/utilisateur.
- Panne d'Analytics : catalogue HTTP 200, économie HTTP **503 JSON** (`UPSTREAM_UNAVAILABLE`, `retryable=true`, sans statistiques), puis retour 200 après restart.
- Panne de Timeseries alors qu'Analytics est vivant : catalogue 200, économie HTTP **502 JSON** sans valeur inventée, puis retour 200 après restart.
- Le workflow a d'abord échoué à cause d'une indentation de code Python dans l'étape d'inspection Compose ; correction enregistrée. Ensuite le build Maven a subi un défaut de résolution transitoire du parent Spring Boot depuis Maven Central ; le job relancé sans changer le SHA a réussi. Ne pas confondre une panne de fournisseur Maven et une régression World-Vision.

## Ce qui est démontré et ce qui ne l'est PAS

**Démontré :** configuration de test réellement appliquée ; quatre routes batch utilisées dans le processus ; aucune vieille lecture N+1 dans ces 43 opérations ; vrais services Gateway/Analytics/Catalog/Timeseries ; confidentialité des routes internes vis-à-vis du Gateway ; dégradation et reprise contrôlées ; documentation des métriques et du matériel jetable.

**Non démontré :** performances sous sources réelles et volumétrie de dizaines de millions de périodes, concurrence de milliers d'utilisateurs, coûts de réseau inter-régions, disponibilité 24/7, vraie identité OIDC pour des utilisateurs et entre services, droits de redistribution, ingestion nationale de 217 pays, alertes Watch persistantes ou recettes commerciales.

## Décision suivante : issue #56

Issue https://github.com/OBIANG5/World-Health-Vision/issues/56 : tests gradués sur données SYNTHÉTIQUES et hétérogènes ; 12 → 50 pays → dimensionnement 217 **avec autorisation de ressources** ; mesure SQL/Hikari/CPU/RSS/bytes à charge 1/4/8/12, p50/p95/p99 sur mêmes fixtures et tests 502/503 ; quotas et auth machine ; puis première statistique nationale réelle traçable et sous licence. Préférer sources réellement fiables, aucune donnée inventée ni cache aveugle.

La stratégie internationale, GDELT comme radar de mentions, EarlyForge comme inspiration de workflow, World-Vision Core et les verticales Money/Price/Transport/Tourisme/Trading/BRVM/Watch/média restent documentés dans les deux fichiers maîtres du produit. Aucune fusion ni déploiement, V0/V1 et branches média/voix exclues.
