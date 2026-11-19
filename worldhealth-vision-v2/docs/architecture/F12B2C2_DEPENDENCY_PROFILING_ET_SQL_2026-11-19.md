# F1.2b.2c-2 — mesurer les dépendances avant d'optimiser SQL/Timeseries

**19 novembre 2026 — diagnostic instrumental en branche candidate, non déployée.**
Branche : `improve/v2-analytics-perf-and-global-vision-sql-profiling-2026-11-19`.
Base : PR #41, SHA `114342fa7ea6dd34e174b5aece8ac66938826060`.
Dépendance : #41 → #40 → #39 → #38 → #36 → `v2` ; #35 qualité visuelle indépendante.
Suivi : https://github.com/OBIANG5/World-Health-Vision/issues/42 .
**Ne pas fusionner cette branche directement sur v2. Aucun déploiement, changement Vercel ou achat.**

## 1. État réellement démontré AVANT ce lot

- PR #41, SHA `114342fa` : deux runs verts sur le même SHA, canonique `44510932342` et six conteneurs `44510947429`.
- 40 GET par route / 4 workers / 120 succès dans le dernier benchmark jetable : p50 catalogue 38,67 ms, couverture 35 ms, synthèse FRA **2 055,50 ms** (p95 2 554,01 ms).
- Le retour structuré 503 pendant une panne Analytics puis la récupération a été prouvé dans cette CI, pas en production.
- Profilage interne sur le dernier runner : 43 synthèses économiques ; phases moyennes pays 70,14 ms, catalogue indicateurs 454,86 ms, séries/provenance **1 473,20 ms**, total 1 998,85 ms.
- Une autre exécution produisait 1 051,31 ms pour séries/provenance et 1 450,07 ms total : **runners/caches différents, aucune accélération mesurée comparable**.
- CI avec jeu de données clairsemé et catalogue fixe ; **ce n'est ni une base de 217 pays effectivement peuplée ni un test de volume de production.**

## 2. Graphe exact du parcours économique (inspection du code)

Dans `analytics_service/service.py::get_country_economic_snapshot` :

1. Une lecture de pays dans Catalog.
2. Un `asyncio.gather` de **54 appels** `catalog_client.get_indicator` (un par profil économique).
3. Un `asyncio.gather` de 54 `_build_indicator_overview`.
4. Pour CHACUN : **3 GET Timeseries distincts** :
   - `list_latest_by_source` → `/api/timeseries/series/latest`
   - `list_series_availability` → `/api/timeseries/series/availability`
   - `list_series` → `/api/timeseries/series` avec limite de préchargement `min(600,max(96,series_limit*10))` pour préserver les années comparables entre éditeurs.
5. Au minimum **162 appels HTTP Timeseries par synthèse** (hors provenance), suivis des résolutions de source, dataset et source runs seulement pour les couples effectivement rencontrés.
6. Les résultats alimentent la comparaison de périodes, divergence, fraîcheur, confiance, sourceAudit et preuves ; **aucun de ces calculs ne doit être supprimé pour afficher une page rapide**.

`ResolutionCache` mutualise les dictionnaires sources/datasets/runs **dans une requête de snapshot** ; il n'a pas de verrou explicite pendant les recherches concurrentes de clés manquantes. Les doublons éventuels doivent être **comptés** avant de proposer déduplication `single-flight`. Il existe des caches TTL pour les scans de rang pays, mais **ne pas les confondre avec un cache de synthèses économiques**.

## 3. SQL et structures réellement inspectés

- `timeseries.latest_observation` est une **vue SQL** construite sur `timeseries.observation` + `timeseries.source_run` avec `row_number() over (partition by source/dataset/indicator/country/granularity/period order by fetched_at, persisted_at, ingested_at, id)`. Ce mécanisme applique la dernière révision sans jeter l'historique.
- `JdbcTimeseriesRepository.listSeries` consulte cette vue avec jointures d'affichage catalogue, filtres country+indicator, ordre temporel et limite.
- `listLatestBySource` ajoute une deuxième fenêtre par source/dataset/granularity (dernière période pertinente).
- `listSeriesAvailability` réutilise la vue avec agrégation/statuts + fenêtre de dernière période.
- Index existants : `observation(country_iso3,indicator_code,period_granularity,period_start desc)`, `observation(source_code,dataset_code,indicator_code,country_iso3,period_granularity,period_start desc)` et `observation(indicator_code,country_iso3,period_granularity,period_start desc)`. Le dernier avait amélioré un autre parcours *ranking*, **pas automatiquement le snapshot économique**.
- Hypothèses ouvertes : fan-out 162 GET, pool JDBC et file de connexions, répétition du classement des révisions, jointures/tri, modèles Python, duplication de métadonnées. **Aucune n'est encore une cause SQL prouvée par EXPLAIN.**

## 4. Code ajouté dans ce lot — OBSERVABILITÉ, pas optimisation des valeurs

- `analytics_service/metrics.py` : histogramme `whv_analytics_upstream_http_latency_seconds` et compteur `whv_analytics_upstream_http_requests_total`. Labels autorisés : `dependency`, `operation`, `outcome` (compteur) ; histogramme sans outcome. Valeurs d'opérations dans une allowlist bornée Catalog/Timeseries.
- `CatalogClient` et `TimeseriesClient` : enveloppe de chaque GET, du réseau jusqu'au `raise_for_status`. Les erreurs HTTP, transport et client ne sont jamais reformulées silencieusement.
- **La mesure inclut le temps HTTP et le statut, mais pas la validation Pydantic ni le temps SQL isolé.** Aucune inférence SQL à partir du seul temps HTTP.
- `infra/tests/report_upstream_metrics.py` : lit uniquement l'export Prometheus privé du conteneur, rejette labels non prévus, écrit `analytics-dependency-http-summary.json` sous les artefacts de CI. Aucun ISO3, URL, jeton, utilisateur, source réelle ou valeur économique dans les labels.
- Tests Python : succès / 404 / erreur réseau / rejet des labels dynamiques + tests du rapport et de la preuve d'au moins 54 GET réussis par opération économique fondamentale.
- Workflow des six services : conserve benchmark, collecte les métriques, vérifie les appels économiques réels et archive le rapport ; n'accède pas à un domaine public.

## 5. Travail encore requis pour terminer honnêtement l'issue #42

### Étape B — SQL/DB sur données synthétiques suffisamment denses
- Construire une **fixture reproductible dense** (nombre pays, indicateurs, sources, runs, périodes, estimations et révisions connu), distinguer volontairement données synthétiques/institutionnelles.
- Exécuter `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` en environnement jetable sur **les trois requêtes**, avec paramètres réels simulés et mêmes index. Archiver plans, lignes scannées, sorts, temps, lectures et Hikari pool.
- Mesurer le temps côté Java repository (DB only) et le délai Python de décodage Pydantic, pour attribuer correctement le coût (HTTP ≠ SQL ≠ parsing).
- Comparer froid/chaud dans le **même runner/dataset**, plusieurs répétitions, concurrence graduée p50/p95/p99 et coût CPU/RAM.

### Étape C — optimisations isolées ET équivalence
- Étudier batch multi-indicateurs avec **limite PAR indicateur**, jamais une limite globale qui écarte certaines sources ou années.
- Regrouper les métadonnées source/dataset/run et dédupliquer les demandes simultanées avec les bonnes clés.
- Ajuster au besoin les indexes et la taille/concurrence du pool après `EXPLAIN`, pas sur intuition.
- Comparer ancien/nouveau JSON logique (hors `generatedAtUtc`) sur observations avec révisions, estimés, manquants, périodes non alignées et divergences. Ne pas introduire de cache sans invalidation liée aux ingestions.
- Repasser tests complets, benchmark et scénario 503/reprise, et consigner les cas où la performance **ne s'améliore pas**.

## 6. Continuité internationale

Conserver intacts `docs/product/STRATEGIE_INTERNATIONALE_WORLD_VISION_MASTER_2026-11-19.md` et `REGISTRE_PRODUITS_SOURCES_REVENUS_PRIORITES_2026-11-19.md`.
GDELT = détection de mentions, jamais preuve statistique ; EarlyForge = inspiration de workflow. Les statistiques officielles, événements et prix commerciaux ont schémas, fraîcheur et licences distincts.
World-Vision Core doit rester partagé pour Atlas pays, institutions locales, Money, Transport/Tourisme, Panier/Price, Trading, Bourse Afrique, Watch et média, tout en **gardant V2 logicielle isolée des branches de production média/voix**.
Le passage aux recettes Pub/Affiliation/Premium/B2B exige une vraie fonctionnalité utile, des droits, une collecte éprouvée et des métriques économiques, pas 30 écrans non fonctionnels.

## 7. Critère de validation de CE lot

Ne passer l'instrumentation en « validée CI » que si les tests Python, la CI canonique et la CI six conteneurs sont **verts sur le SHA final de la PR**, que le rapport d'appels est archivé et que la panne Analytics renvoie encore HTTP 503. Même dans ce cas, **l'issue #42 SQL/performance reste OUVERTE** tant que les étapes B/C ne sont pas prouvées ; aucun nouveau gain de latence ne peut être annoncé.
