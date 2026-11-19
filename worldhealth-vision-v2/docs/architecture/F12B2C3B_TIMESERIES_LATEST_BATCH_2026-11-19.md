# F1.2b.2c-3B — Dernière observation par source : batch SQL Timeseries

**État : chantier en PR brouillon, démarré 19/11/2026, non fusionné.** PR #49 (Catalog batch, 3 CI verts) → ce chantier. Issue #48 ouverte.

## Pourquoi
Le snapshot économique de 54 indicateurs conservait 54 GET `/api/timeseries/series/latest`, même après single-flight de provenance et Catalog batch. Dernières valeurs doivent être établies par **indicateur, source, dataset et granularité** et non par une date globale pouvant masquer les divergences ou les dernières années d'un indicateur plus ancien.

## Changement précis proposé
- Nouvelle lecture interne `POST /internal/timeseries/series/latest/batch`. Requête JSON : `{"countryIso3":"FRA","indicatorCodes":["NY.GDP.MKTP.CD","FP.CPI.TOTL.ZG"],"sourceCode":null,"datasetCode":null,"periodGranularity":null,"includeMissing":false}`.
- Liste bornée de 1–128 codes (format/longeur/doublons/ISO3 validés), réponse de 1 groupe par code dans l'ordre initial, chaque groupe contenant **tous** les objets déjà présents dans l'endpoint GET historique.
- Unique SELECT JDBC paramétré avec `lo.indicator_code IN (:indicatorCodes)`. La fenêtre SQL classe `PARTITION BY lo.indicator_code, lo.source_code, lo.dataset_code, lo.period_granularity ORDER BY lo.period_start DESC,lo.fetched_at_utc DESC`. La vue `timeseries.latest_observation` conserve le choix de la dernière révision publiée avant ce classement.
- Une ligne absente reste absente (`[]`), sans statistiques créées ni statut MISSING réinterprété. `includeMissing=false` est volontairement conservé pour latest dans la synthèse économique (même si le preview de série a son autre flag).
- La route interne n'est PAS exposée par le Gateway public ; **ne constitue pas en elle-même un contrôle d'authentification des services en production**.
- `WHV_ANALYTICS_TIMESERIES_LATEST_BATCH_ENABLED=false` par défaut, activable ponctuellement uniquement dans la CI A/B pour les 54 profils économiques. Le nouveau client refuse réponse mal formée/mélangée/incomplète et conserve les erreurs HTTP.
- Métriques fixes `timeseries.latest_batch`, sans pays/identité/source dans des labels.

## Tests et garde-fous
- Java Testcontainers : comparaison stricte des champs JSON de GET individuel à POST batch ; sources WORLD_BANK/IMF, valeur estimée, période et provenance, filtre IMF et indicateur vide ; 400 duplications, invalides, >128.
- Python : MockTransport et modèle `LatestSourceObservation`, ordre strict, groupe vide, contenu impossible à affecter au mauvais indicateur, erreurs HTTP 503, test de sécurité.
- Benchmark A/B **même DB / même code / même fixture**, Catalog batch actif dans les deux bras, Timeseries latest batch éteint / allumé. France ordre baseline→batch→batch→baseline et Gabon batch→baseline : six appels descriptifs.
- Critère de réussite : chaque synthèse passe de 176 HTTP à **123** (1 Catalog pays + 1 Catalog batch + 54 availability + 54 series + 1 latest batch + 12 source/dataset/run), identiques **54 lenses, 200 comparaisons, 270 preuves**, même SHA256 JSON complet hors seul `generatedAtUtc`.
- Trois pipelines verts au commit final : canonical Java/Python/frontend, Gateway panne 503/récupération, SQL dense + A/B. La latence varie avec CI et n'est pas un engagement mondial.
- Ne pas fermer #48 : la moitié restante des coûts Timeseries (54 availability + 54 series) dépend d'un classement et d'une limite **PAR INDICATEUR** plus difficile.

## Travail suivant 3C et mise à l'échelle
1. Établir le contrat de séries historiques sur années communes et sources hétérogènes (révisions, statistiques manquantes/estimées, fréquences annuelles/mensuelles, dates et décalages de publications).
2. Prototyper SQL de disponibilité en batch, classement par indicateur et source, puis séries historiques en batch avec `ROW_NUMBER ... PARTITION BY indicator_code ORDER BY...` et LIMIT individuel, **pas global**.
3. Comparer JSON complet et p50/p95/p99 sur fixtures plus grandes, coût Hikari/SQL, concurrence inter-pays, pannes/recovery. Ne pas créer une base de statistiques officielles fictives.
4. Gérer quotas/anti-abus, isolation de confiance et authentification interne avant production, puis ingestion réelle des sources locales et internationales et toutes les plateformes Vision prévues.
5. Documenter sur GitHub tous les résultats et limites pour reprise dans un autre chat. Aucun merge ou déploiement, aucun changement V0/V1/média/voix, ni achat d'abonnement ou VPS.
