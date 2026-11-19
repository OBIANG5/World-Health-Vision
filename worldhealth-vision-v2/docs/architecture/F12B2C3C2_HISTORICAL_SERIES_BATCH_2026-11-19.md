# F1.2b.2c-3C2 — historique économique multi-indicateurs sans perte de sources

**19 novembre 2026.** Branche `perf/v2-batch-timeseries-historical-2026-11-19` ; PR DRAFT basée sur #51. Aucune fusion, aucun changement du site public et aucun coût engagé.

## 1. Pourquoi ce chantier : la sémantique, pas seulement le nombre d'HTTP

Le moteur compare 54 indicateurs économiques et les dernières valeurs provenant de quatre sources dans la fixture reproductible. Après #47, #49, #50, #51, le moteur effectue encore 54 lectures historiques individuelles, qui alimentent les **années réellement comparables**, les tendances, la divergence, la confiance et le registre `sourceAudit`. Une simple concaténation avec `LIMIT 600` global aurait la capacité de faire disparaître les observations des derniers indicateurs et de fausser une année de comparaison : **interdit**.

Le code existant précharge `min(600, max(96, seriesLimit*10))` observations **par indicateur**, dans l'ordre date décroissante, source puis dataset, pour retrouver des années communes éventuellement anciennes. Il faut conserver chaque historique, même si une année récente n'est disponible que chez une source.

## 2. Contrat technique proposé

- Endpoint interne `POST /internal/timeseries/series/history/batch`. Il n'est pas routé par le Gateway public. Ce seul choix de route n'est PAS une authentification interservices ; ACL/mTLS et autorisations de production restent nécessaires.
- Requête `{"countryIso3":"FRA","indicatorCodes":["NY.GDP.MKTP.CD","FP.CPI.TOTL.ZG"],"sourceCode":null,"datasetCode":null,"periodGranularity":null,"fromPeriodStart":null,"toPeriodStart":null,"includeMissing":false,"sortDirection":"DESC","limitPerIndicator":120}`.
- Réponse : objet `count` et liste de groupes `{indicatorCode,count,items}`, **dans l'ordre exact de la requête**. Chaque observation a tous les champs de l'ancienne API : pays, source, dataset, clé de run, période, valeur nullable, OBSERVED/ESTIMATED/MISSING/SUPPRESSED, publié/récupéré.
- SQL JDBC paramétré, une lecture sur `timeseries.latest_observation`. CTE `matching` avec tous les filtres antérieurs, puis `row_number() OVER (PARTITION BY indicator_code ORDER BY period_start DESC|ASC, source_code ASC, dataset_code ASC, period_granularity ASC, period_end ASC, run_key ASC)`. Seules les lignes `per_indicator_rank <= limitPerIndicator` passent. Le classement de date est piloté par un choix **serveur ASC ou DESC** (pas d'injection SQL).
- L'ancien GET de séries reçoit également les trois tie-breakers explicites `period_granularity`, `period_end`, `run_key` ; cela stabilise le tri des séries de fréquences différentes qui commencent le même jour. Les tests doivent valider la parité, notamment ANNUAL/MONTHLY à même `periodStart`.
- Bornes d'entrée : 1–128 codes validés/dédupliqués après normalisation, pays ISO3, date de début <= date de fin, direction ASC/DESC, `limitPerIndicator` 1–1000, **budget de 40 000 observations maximum** (nombre de codes × limite). Même sous ce budget, la taille JSON et la RAM doivent être mesurées, pas supposées faibles.
- Un code sans observation = groupe `[]`, aucune statistique de substitution. `includeMissing=false` filtre les valeurs MISSING sans confondre avec la quantité zéro. `includeMissing=true` conserve les nulls MISSING.
- Les exceptions de dépendance ne sont pas transformées en résultats inventés. Métriques strictement bornées `timeseries.series_batch`, **aucun code pays, source ou utilisateur dans les labels**.
- Activation `WHV_ANALYTICS_TIMESERIES_HISTORY_BATCH_ENABLED=false` par défaut. Seul le snapshot économique 54 profils utilise l'option ; les autres APIs et verticales continuent avec leurs appels existants.

## 3. Preuves exigées avant « validé en CI »

1. **Java/Testcontainers :** second indicateur alimenté en données synthétiques (2022 OBSERVED, 2023 ESTIMATED, 2024 MISSING et 2024-01 MONTHLY OBSERVED), tandis que GDP est alimenté depuis WORLD_BANK et IMF. Comparer ancien GET à nouveau POST **champ à champ** pour ASC/DESC, includeMissing true/false, `limit` 1/2/5, source IMF, granul. MONTHLY, plages de dates et code vide. Rejeter doublon, null, SQL injection, 128×600 lignes, invalid ISO3/direction/dates.
2. **Python :** modèle typé, run ID, dates et statuts, groupe absent/incorrect, 503, groupe dépassant son limit, budget.
3. **A/B sur la même DB et le même code :** historique individuel 54 GET (**70 HTTP**) contre historique batch 1 POST (**17 HTTP**) avec Catalog/latest/availability déjà groupés **des deux côtés**. Cas FRA/GAB, variations includeMissing et sériesLimit, filtres IMF. Réponse économique entière **même SHA256 hors seul `generatedAtUtc`**, comprenant observations, périodes communes, narratifs, divergence, fraîcheur, décisions, 54 lenses et toute la provenance.
4. **Trois workflows SUCCESS sur SHA final** : audit canonique Java/Python/TypeScript, Gateway 503/récupération, SQL dense + diffs. Archiver le JSON de mesure et les plans. La réduction de 53 appels est structurelle et doit être démontrée ; une diminution de temps de bout en bout sur six essais reste descriptive seulement.
5. Prendre en compte une limite actuelle de la fixture : quatre sources, 24 années, un seul type de fréquence majoritaire. Ce n'est pas un environnement réellement international, aucun chiffre officiel, aucune garantie SLO. Charger des scénarios hétérogènes/denses avant d'envisager la production.

## 4. Risques connus et suite la plus intelligente

- Le service Java matérialise potentiellement jusqu'à 40 000 observations par batch et Python les valide avec Pydantic. Profilage CPU/RAM, taille de réponse, timeouts, Hikari et coût PostgreSQL sous plusieurs snapshots concurrents, puis pagination/streaming/batchs plus petits si nécessaire.
- Tester dates de révision non alignées, suppressions, multi-fréquences, sources locales rares, plusieurs géographies, et exactitude des calculs même quand aucune source n'a d'année commune.
- Réaliser un **stress test international synthétique**, en distinct des véritables ingestions, et un contrat de sécurité interservices/quotas/observabilité (aucune donnée personnelle en métrique).
- Puis F1.2b.3 staging sûr et approuvé, F1.3 données institutionnelles réelles vérifiées (pays et institutions locales), F1.4 Watch, produits Vision, GDELT/EarlyForge et workflows média séparés. Ne jamais confondre 217 pays listés et 217 pays avec des statistiques officielles ingérées.
- **Toute validation/documentation doit rester traçable sur GitHub**. Préserver les documents maîtres sur la stratégie internationale, les licences, les produits et les revenus de la PR #41. Les branches V0/V1, média et voix sont exclues ; aucun déploiement ni dépense.
