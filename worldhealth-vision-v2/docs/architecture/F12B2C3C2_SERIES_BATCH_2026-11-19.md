# F1.2b.2c-3C2 — lecture historique batchée sans perte d'année commune

**19 novembre 2026 — chantier en branche candidate, PR brouillon et non déployé.**
**Dépendances :** #36→#38→#39→#40→#41→#45→#46→#47→#49→#50→#51→3C2. V0/V1, média/voix et UI #35 distincts. Issue #48 et #42 ouvertes.

## Problème
Même après 3C1, chaque synthèse des 54 indicateurs exige 54 GET historiques. Ces observations alimentent le calcul de **la dernière année réellement commune** entre sources, la divergence inter-éditeurs, la tendance, la sélection de preuves et les statuts affichés. Réduire arbitrairement la fenêtre ou appliquer un LIMIT global créerait de fausses comparaisons.

## Contrat SQL/HTTP candidat
- `POST /internal/timeseries/series/history/batch` non routé par le Gateway public. Pays ISO3, liste unique validée 1–128, source/dataset/granularité, bornes dates optionnelles, includeMissing, sortDirection ASC/DESC et `limitPerIndicator` de 1 à 1000.
- SQL JDBC paramétré, fenêtre `row_number() over (partition by indicator_code order by period_start [ASC|DESC],source_code,dataset_code,period_granularity,period_end DESC,run_key)` ; chaque groupe est limité par sa propre position (pas une limite sur tous les 54). Les lignes conservent exactement les champs source run, fetch, publication, dates, valeurs, statuts observé/estimé/manquant/supprimé et descriptions.
- Ex-aequo multi-granularité : ancien GET n'explicitait pas les critères de départage au-delà de (date,source,dataset). Ajout volontaire d'un ordre déterministe identique dans les deux chemins, évitant des différences de preview selon le plan SQL. Ce changement doit être examiné car il définit les ex-aequo auparavant non spécifiés.
- Limites de protection : au plus 10 000 lignes *potentielles* par réponse. Client Python découpe automatiquement, par exemple 54 codes × 120 lignes (preview 12) en un lot ; 54 codes × 240 lignes (preview 24) en deux lots ; 54 × 600 en quatre lots. **Chaque indicateur conserve son entière fenêtre individuellement demandée** et les groupes reviennent dans l'ordre original, sans repli sur 0 ou données synthétiques. L'existence d'une marque source n'est jamais assimilée à des observations réelles.
- Activation explicite `WHV_ANALYTICS_TIMESERIES_SERIES_BATCH_ENABLED=true` uniquement en CI A/B ; valeur **false par défaut** en production/branche. Nouveau `timeseries.series_batch` dans métriques fixes. Aucun pays, utilisateur ou source dans les labels.
- Toutes les requêtes internes de batch sont concurrentes au maximum 3 sur 54 codes / preview normal : ne pas ouvrir une nouvelle route publique POST. Authentification et contrôle de réseau privés restent à valider en vrai staging.

## Preuves nécessaires
1. Java Testcontainers : GET unique et groupe batch **octet logique par octet logique** avec même filtre, DESC limit=2, IMF source et ASC avec bornes, groupes vides, erreurs 400/429? Ici seules 400 sont définies ; ne pas inventer un 429.
2. Python MockTransport : preservation status MISSING/ESTIMATED, période et run, erreurs, rejet résultats mal groupés, lots multiples (54 indicateurs ×600 =>4 POST).
3. Test direct dans CI : 54 GET exacts vs POST groupé, LIMIT 1 DESC, LIMIT 5 ASC+missing, IMF, périodes 2010–2015. Comparer JSON complet de chaque indicateur, pas seulement sommes ou hashes.
4. 10 snapshots économiques FRA/GAB sur même fixture **synthétique** 12 pays ×54 indicateurs ×4 sources ×24 années ×2 révisions =124 416 observations : ancien vs nouveau `seriesLimit=12` et `24`, SHA256 de tout le JSON hors `generatedAtUtc` identique. Nombre de 54 lenses, 200 comparaisons et 270 preuves inchangé.
5. Compteurs : toutes les autres optimisations identiques dans les bras, ancien **70 HTTP** ; nouveau **17** (120 lignes/code) ou **18** (240 lignes/code). L'efficacité réelle en CPU/RAM et latence doit être mesurée, ne pas extrapoler globalement.
6. Trois CI indépendantes (Java/Python/frontend, six services HTTP 503/reprise, SQL dense/profiling). **Toutes SUCCESS sur SHA final** avant toute déclaration «validé». PR demeure draft/non fusionnée après CI, sauf revue humaine.

## Risques et phases futures
- SQL dense uniforme/annuel ne suffit pas. Ajouter profils hétérogènes, centaines de pays/territoires, fréquences mensuelles, révisions asynchrones, fenêtres longues, sources avec licences différentes et volumes / pics d'ingestion.
- Vérifier coûts du tri sur données non tenues en cache et concurrency/capacité Hikari. Tester first-touch, steady-state, p50/p95/p99, saturation, coût financier et des API sous une orchestration réelle.
- Séparer fonctionnalités institutionnelles publiques des flux GDELT (détection de mentions), des prix commerciaux et des médias : modèles temporels, confiance, droits, granularité et provenance distincts. Respecter local institutions pour chaque pays ; un registre de 217 pays n'est **pas** 217 connecteurs actifs.
- Après performance et sécurité : vraie ingestion, Watch, verticales Money/Price/Transport/Trading/BRVM, contenu média, monétisation publicitaire/affiliation/B2B/Premium seulement après valeur démontrée et conformité. Stratégies maîtres PR #41 intactes.
- Documenter chaque test, décision et limite sur GitHub. Aucun achat ni fusion/déploiement sur `v2`, Vercel public, V0/V1 ou branches média/voix.
