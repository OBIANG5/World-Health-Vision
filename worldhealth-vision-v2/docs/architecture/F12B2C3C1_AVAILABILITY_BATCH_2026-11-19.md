# F1.2b.2c-3C1 — disponibilité des séries en batch par indicateur

**Chantier isolé (19/11/2026). PR en brouillon basée sur #50, ne pas fusionner ni déployer.**

## Diagnostic confirmé
Après PR #49 (54 Catalog GET → 1 POST) et #50 (54 latest GET → 1 POST), le snapshot garde 54 GET `/api/timeseries/series/availability` et 54 GET séries historiques. Le contrat `SeriesAvailabilityResponse` compte les valeurs disponibles, OBSERVED, ESTIMATED, SUPPRESSED, MISSING ; expose première/dernière période et dernière valeur/récupération. **Ces informations sont essentielles à la transparence** sur la fraîcheur, les indicateurs non observés et la comparaison intersources.

## Contrat exact de 3C1
1. `POST /internal/timeseries/series/availability/batch`, non routé par Gateway public. JSON : `{"countryIso3":"FRA","indicatorCodes":["NY.GDP.MKTP.CD","FP.CPI.TOTL.ZG"],"sourceCode":null,"datasetCode":null,"periodGranularity":null,"limitPerIndicator":100}`.
2. Validation en couches Java et Python : 1–128 codes alphanumériques à point/underscore, codes distincts après normalisation ; pays ISO3 ; 1–500 `limitPerIndicator` et budget `nombreDeCodes * limitPerIndicator <= 10000`. Pas d'injection, pas de réponse partielle à entrée invalide.
3. Requête JDBC paramétrée avec `lo.indicator_code IN (:indicatorCodes)`, utilisant la même vue latest révisée et la même agrégation du GET individuel. Classement final `row_number() OVER (PARTITION BY indicator_code ORDER BY source_code,dataset_code,period_granularity)` puis `group_rank <= limitPerIndicator`. **Jamais de LIMIT global** qui masquerait les données du 54e indicateur.
4. Chaque groupe est identifié par son code, dans l'ordre demandé. Un indicateur sans observation répond `[]` (absence de preuve), jamais 0 numérique ou estimation inventée. Champs JSON complets et valeurs/provenances inchangés.
5. Client refuse ordre, compte, groupe ou code de ligne incorrect ; les vraies erreurs réseau restent des erreurs. Activation `WHV_ANALYTICS_TIMESERIES_AVAILABILITY_BATCH_ENABLED=false` par défaut.
6. Le parcours économique `get_country_economic_snapshot` peut lancer latest batch et availability batch en parallèle, puis charge chaque série historique individuellement ; l'API publique et les autres parcours sont inchangés.

## Validation à exiger
- Test Java Testcontainers (parité avec GET, limite=1, données manquantes et source IMF), tests Python MockTransport, contrôles de 400.
- Benchmark six snapshots (FRA/GAB) sur même DB **100 % SYNTHÉTIQUE** : 12 pays, 54 profils réels du code, 4 sources, 24 ans, 2 révisions = 124 416 observations et 62 208 dernières révisions. Catalog + latest batch actifs dans les deux cas. Avant : **123 appels HTTP**, après : **70** ; exactement 53 appels gagnés.
- Empreinte SHA-256 du JSON entier hors `generatedAtUtc` identique ancien/nouveau ; toutes les 54 lenses, **200 comparaisons et 270 éléments de preuve** ; niveau de confiance/fraîcheur et statut inclus dans le hash.
- Trois pipelines SUCCESS sur SHA final : Java/Python/frontend, six conteneurs panne 503/récupération, SQL/HTTP dense. Aucune performance internationale revendiquée sur de seuls runners CI. Audit des routes internes, pas d'ouverture du POST Gateway.

## 3C2 et suite internationale
Ensuite batch séries historiques, nécessairement avec `LIMIT` par indicateur et conservation de la période commune réelle entre éditeurs, des estimations, absences, divergences et révisions ; comparer les plans SQL, coût Hikari et p95/p99 sur volumes hétérogènes. Garder #42/#48 ouverts jusqu'à la preuve. Les services Vision (Watch, Atlas, Money, Price, Travel, Trading, BRVM et média) reposent sur une base institutionnelle traçable, pas sur de faux indicateurs mondiaux ; GDELT = détection de mentions, non source statistique. Les sources locales doivent être réellement ingérées par pays après vérification des droits. Pas de V0/V1, média/voix, Vercel, fusion ni dépense.
