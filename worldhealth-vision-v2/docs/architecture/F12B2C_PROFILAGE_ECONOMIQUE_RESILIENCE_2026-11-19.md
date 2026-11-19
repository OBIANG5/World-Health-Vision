# F1.2b.2c — Profilage des synthèses, résilience du Gateway et garde-fous internationaux
**Démarrage : 19/11/2026.** Code sur `improve/v2-analytics-perf-and-global-vision-2026-11-19`, issue de PR #40 `d68bbc23140046026b18ad83a515e130787672fd`.
**Ce document distingue résultats observés, changements de code et tâches restantes.** Aucune mise en production ni acquisition payante.

## 1. Diagnostic reproductible avant optimisation

Source du benchmark de base : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44503503358 (six services en CI, 40 GET/chemin, quatre workers).
- Catalogue pays p50 **51,77 ms**, sources coverage p50 **37,90 ms**, synthèse économique FRA p50 **2491,09 ms** ; p95 FRA **2926,66 ms**.
- Analytics arrêté : catalogue reste 200, synthèse renvoyait 500 ; retour à 200 après redémarrage.
- Base de test avec peu d'observations : **ne pas extrapoler à la population réelle ni déclarer des chiffres institutionnels collectés**.

### Nouveau profilage par phase (réellement mesuré)

Source : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44507945357
Instrument ajouté : `analytics_service/metrics.py` et `AnalyticsService.get_country_economic_snapshot()`.
Seuls des noms de phases fixes sont utilisés comme labels Prometheus : **pas d'ISO3, d'identité, de fournisseur ou de requête utilisateur dans les métriques**.

| Phase interne | Moyenne 43 appels (ms) | Part du total |
|---|---:|---:|
| Pays | 57,04 | 3,9 % |
| 54 indicateurs économiques (catalogue) | 341,16 | 23,5 % |
| Séries + historique de provenance | **1051,31** | **72,5 %** |
| Total Analytics | **1450,07** | 100 % |

Benchmark Gateway (run différent, ne pas attribuer variation à notre instrumentation) : catalogue p50 27,35 ms, coverage 18,80 ms, FRA économique **1547,68 ms** p50 (p95 1922,72 ms). La variabilité de runners et caches interdit de dire que l'application a « gagné 38 % » après un simple ajout de métriques.

**Cause identifiée :** sous-ensemble le plus coûteux = résolution historique/provenance ; *la raison précise à l'intérieur* (SQL/index, nombre d'appels, contention des pools, parsing, métadonnées) reste à confirmer avec traces d'appels et `EXPLAIN ANALYZE`. Le code `_build_indicator_overview` lance actuellement trois lectures de Timeseries par indicateur (`latest_by_source`, `series_availability`, `series`), plus contexte source/dataset/runs ; 54 indicateurs peuvent entraîner un nombre élevé de requêtes. Ces informations ont été constatées dans `service.py`, mais le nombre exact d'appels d'un run dépend des données retournées.

**Ne pas « corriger » la lenteur en réduisant le nombre de sources, en tronquant l'historique en contradiction avec l'alignement des périodes, ou en mettant en cache les prix/événements comme des statistiques annuelles.**

## 2. Fiabilité du pipeline de tests : Docker/Testcontainers

Le workflow historique `WHV V2 canonical full-stack integration audit` échouait avec Testcontainers **1.20.1** et l'image Docker de GitHub : client API 1.32 refusé, minimum 1.40. Ce n'était pas une régression des services V2.
Correction du parent `pom.xml` vers Testcontainers **1.21.4** ; le contrôle complet Java/Python/Docker a ensuite réussi sur https://github.com/OBIANG5/World-Health-Vision/actions/runs/44507945551 .
Référence de compatibilité : https://github.com/testcontainers/testcontainers-java/issues/11210 et documentation https://java.testcontainers.org/.

## 3. HTTP 503 — contrat de panne sans mensonges

Fichiers candidats :
- `services/gateway-service/src/main/java/com/worldhealthvision/gateway/UpstreamUnavailableHandler.java`
- `services/gateway-service/src/test/java/com/worldhealthvision/gateway/UpstreamUnavailableHandlerTest.java`
- workflow `.github/workflows/whv-v2-gateway-load-resilience.yml`

Comportement voulu : lorsqu'une route **effectivement proxifiée** échoue par connexion/timeout (ex. Analytics arrêté), écrire **HTTP 503** JSON : `error=UPSTREAM_UNAVAILABLE`, `retryable=true`, `requestId`, `timestampUtc`, sans exposer les détails d'exception, et interdire le cache avec `Cache-Control: no-store`. Garder une erreur applicative réelle 400/404/500 distincte d'une panne réseau. Ne jamais substituer des chiffres factices.
Test : arrêter Analytics, GET catalogue doit rester 200, GET synthèse doit être **503 avec contrat**, puis repasser 200 au redémarrage.

**GO seulement si** les tests Java, les tests Python et le scénario de panne en six conteneurs passent sur le SHA final de cette PR. Si la couche Spring transforme une exception autrement, corriger le mécanisme et repasser la CI plutôt que déclarer terminé.

**Cause réelle détectée pendant les essais multi-runners :** l'arrêt d'Analytics peut produire soit une connexion refusée, soit `java.net.UnknownHostException` avec cause Netty `DnsErrorCauseException: SERVFAIL` (le conteneur arrêté n'est plus résolu par le DNS Docker). Le premier mapping ne reconnaissait que les refus de connexion/timeouts : sur un des jobs il a renvoyé 500, sur l'autre 503. L'implémentation candidate traite maintenant **explicitement UnknownHostException** comme une panne d'une route proxifiée, avec un test dédié contre les fuites de nom interne. **Cette correction doit repasser les deux pipelines sur le SHA final.**

## 4. Prochaines investigations pour une vraie baisse de latence (sous-étapes à traiter séparément)

### F1.2b.2c-2 : compter et profiler les dépendances

**Issue de suivi indépendante :** https://github.com/OBIANG5/World-Health-Vision/issues/42 — requêtes SQL, nombre d'appels, batch et équivalence sémantique.
- Instrumenter le nombre de requêtes timeseries/catalogue par type et leur durée, **labels limités** (endpoint canonique, status) ; ne pas capturer codes pays, utilisateur, jetons ni données statistiques dans la télémétrie.
- Vérifier DB `EXPLAIN (ANALYZE, BUFFERS)` avec jeu de données synthétique non trompeur, index sur `(country, indicator, period, source)` adaptés aux requêtes constatées.
- Comparer coûts de sérialisation, parsing JSON, contrôle de provenance, source metadata, série historique alignée.
- Construire un benchmark à froid/à chaud sur mêmes images/runner, multiple exécutions, débits p50/p95/p99, memory CPU, erreurs 429/502/503.

### F1.2b.2c-3 : optimiser sans changer le sens des données
Hypothèses à tester **une par une**, uniquement si les traces le justifient :
- Requêtes batch pour multi-indicateurs, plutôt que 54×3 appels HTTP.
- Préchargement/agrégation des métadonnées source/dataset/run partagées, avec déduplication de tâches concurrentes, puis cache court lié aux versions d'ingestion.
- Réduire la pression sur Hikari (connexion DB) en bornant la concurrence au bon niveau, *sans supposer qu'un sémaphore améliore forcément la latence*.
- Cache de réponses agrégées uniquement pour statistiques lentes/annuelles, avec `etag`, versions/revisions, TTL clair et invalidation aux nouvelles collectes ; jamais masquer une fraîcheur inconnue.
- Tests d'équivalence sémantique des résultats, provenance, alignement multi-sources et estimé/observé ; comparer snapshots par structure et valeurs pertinentes, pas `generatedAtUtc`.

### F1.2b.2c-4 : robustesse et quotas
- Réponses 503 et reprise, timeouts par route, retry conditionnel sans cascade de surcharges, `Retry-After` prudent.
- Rate limiting et coût par identité/IP/proxy de confiance, surtout Advisor/Watch, sans empêcher accès légitime aux données pays.
- Tests d'attaque de coût et concurrence bornée **sur stack jetable** uniquement.
- Observabilité interne, alertes d'échec et trace ID sans données sensibles.

## 5. Documentation stratégique internationale — point d'entrée permanent

**Deux nouveaux documents doivent accompagner ce lot et être conservés lors d'une reprise inter-chat :**
1. `docs/product/STRATEGIE_INTERNATIONALE_WORLD_VISION_MASTER_2026-11-19.md` : vision World-Vision au-delà d'un chatbot, GDELT, EarlyForge, institutions locales/internationales, Watch, Money/Travel/Price/Trading/BRVM/Media, priorités, architecture mondiale, qualité/identité.
2. `docs/product/REGISTRE_PRODUITS_SOURCES_REVENUS_PRIORITES_2026-11-19.md` : fonctionnalités vraiment utiles aux voyageurs, particuliers et traders, fournisseurs, incertitudes/licences, publicité, affiliation, abonnements, B2B, preuves nécessaires et seuils stop/go.

Leurs idées ne remplacent **pas** une demande de contrat à un fournisseur de données. Le projet ne doit jamais prétendre disposer de prix d'avion, prix supermarchés ou cours boursiers temps réel avant preuve de droits et branchement.

## 6. Ordre de travail et exploitation

- `v2` est branche de référence inchangée.
- PR #35 : rendu V2 & tests iPhone (indépendante).
- PR #36 → #38 → #39 → #40 : chaîne empilée infra sécurité → API publique → JWT → bench.
- Présente branche/PR : **issue de #40**, ne pas viser directement `v2` avant intégration de la chaîne.
- Garder branches média, notamment logo et voix Vivienne C5.2, en dehors des merges de backend ; ne pas abandonner les choix éditoriaux.
- Aucun déploiement public, frais d'hébergement, clés réelles ou autre externalité sans revue et décision.
- **Après** performance/fiabilité/quotas : F1.2b.3 infrastructure dimensionnée, authentification réelle, back-up off-site vérifiée, TLS/CORS ; F1.3 première vraie donnée officielle jusqu'au globe ; F1.4 comptes/Watch ; F1.5 premier Money-Vision, puis trajets surveillés et autres verticales.
