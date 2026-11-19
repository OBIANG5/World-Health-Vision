# F1.2b.2c-2C — Single-flight de provenance, déduit du profilage SQL/HTTP

**Statut : PR #47 en brouillon, ne pas déclarer fusionné/déployé. 19/11/2026.**
Base #46 (fixture SQL), puis #45 (instruments), #41 (résilience HTTP 503), #40/#39/#38/#36. Version V2 canonique inchangée.

## 1. Cause réellement observée
Dans un snapshot économique, 54 indicateurs sont résolus en parallèle. Chacun déclenche trois GET Timeseries (162), puis interroge la provenance. Les métadonnées communes sont stockées dans `ResolutionCache` à la fin des appels, **pas pendant leur exécution**. Plusieurs coroutines peuvent lire simultanément un cache vide et refaire la même opération.

Sur fixture jetable (12 pays, 54 profils économiques authentiques, 4 sources, 24 années × 2 révisions, 124 416 observations **synthétiques**) :
- 1ère synthèse : 613 appels sortants ; 216 Catalog source, 144 Catalog dataset, 36 Timeseries source runs ; 2644,725 ms.
- 2ème : 345 appels ; 16 source, 48 dataset, 64 runs ; 1268,353 ms.
- Baseline CI : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44521843671 .
- Unique keys réellement présentes : 4 sources / 4 datasets / 4 runs. Une seule demande par clé donnerait 229 appels totaux (1 pays+54 indicateurs+162 Timeseries+12 provenance), au lieu des 613/345 observés.

## 2. Solution confinée à une requête
`ResolutionCache` conserve en plus des valeurs résolues trois maps de `asyncio.Task` `source_tasks`, `dataset_tasks`, `run_tasks`, indexées strictement par code source ou couple (source,dataset). `_shared_resolution` crée une tâche **sans await** entre recherche et insertion ; les autres coroutines attendent la même tâche protégée par `asyncio.shield`.

Contrat : chaque tâche est locale à un snapshot et n'est jamais conservée globalement ; elle renvoie la vraie réponse, `None` documenté ou **lève la véritable erreur** ; aucune statistique inventée, aucune requête de série supprimée, aucune source/année masquée, aucune confusion de compte ou d'utilisateur. Pas de nouveau cache TTL sur données économiques ou prix volatils.

## 3. Preuves obligatoires avant acceptation
1. Même fixture générée depuis les 54 profils économiques réels sur PR #46 et #47 (cadrage de 12 pays × quatre sources × 24 années × deux révisions).
2. Même hash SHA-256 du snapshot complet à l'exception de `generatedAtUtc` : valeurs, sources, périodes comparables, confidence/freshness, audit et narratifs conservés. Comparaison sur le **même jour** : des calculs d'âge de publication peuvent évoluer entre deux dates.
3. Compteurs HTTP de la PR candidate : source = 4, dataset = 4, source_runs = 4 pour chaque snapshot avec quatre pairs ; `latest_by_source`, `availability`, `series` = 54 chacun et Catalog indicators = 54.
4. Tests unitaires de concurrence, valeurs absentes, erreurs, annulation isolée ; aucune erreur absorbée.
5. Canonical V2 Java/Python/TypeScript/Docker, full-stack Gateway panne 503 et reprise, SQL/HTTP dense CI sur **SHA final**.
6. Pas de comparaison de latences non appariées comme une preuve de gain de performance mondiale. Les p95/p99 de 54 requêtes internes sont descriptifs, non des SLO.

## 4. Risques et travaux futurs (#42 toujours ouverte)
- Au-delà de quatre sources, le nombre de clés augmente ; mesurer des sources locales non homogènes, des révisions, des datasets sans accès et des échecs de provenance.
- Les appels Catalog indicators (54) et Timeseries (162) restent individuels. Étudier **batch par indicateur et provenance**, avec tri et LIMIT par indicateur (jamais global) et tests d'équivalence.
- Vérifier une fixture plus volumineuse (>12 pays et séries quotidiennes), EXPLAIN/Hikari sous charge concurrente réelle, pression mémoire/CPU et dégradation 503.
- Distinguer UI statique Vercel, CI jetable et backend réellement hébergé ; aucune intégration GDELT/prix commerciaux déclarée par ces changements.
- Conserver les documents stratégiques GDELT/EarlyForge/Watch/Money/Transport/Panier/Trading/BRVM/Média, licences et monétisation responsables de PR #41. Aucun hébergement ni coût engagé.
