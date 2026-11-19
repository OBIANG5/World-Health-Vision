# World-Vision — F1.2b.2c-3A : batch Catalog 54 indicateurs

**Date : 19 novembre 2026 — PR candidate en brouillon, sans fusion ni déploiement.**
**Dépendances :** PR #47 single-flight → #46 profilage SQL dense → #45 métriques → #41 fiabilité → #40 → #39 → #38 → #36 → `v2`. Interface #35 indépendante.
**Issue d'ensemble :** https://github.com/OBIANG5/World-Health-Vision/issues/48 .

## Objectif mesurable
Sur la base jetable de 124 416 observations synthétiques, le snapshot économique requiert 54 indicateurs par GET indépendants, soit 54 voyages réseau Catalog. Ce lot regroupe **seulement** cette résolution en un POST **interne**, pour obtenir 229 − 54 + 1 = **176 HTTP** par snapshot, sans changer la résolution des 54×3 séries ni les 4+4+4 clés de provenance.

## Choix de conception / sécurité
- API ajoutée au service Catalog uniquement : `POST /internal/catalog/indicators/batch`. Ne figure pas parmi les routes `GET /api/catalog/**` du Gateway, et le Gateway ne route pas les POST arbitraires de catalogue.
- Les services Catalog/Analytics restent sur le réseau interne privé de la CI. **Ce n'est pas une authentification interservices ni un firewall : pour une production réelle, protéger réseau et identité des services.**
- Paramètre JSON : `{"codes": ["NY.GDP.MKTP.CD","FP.CPI.TOTL.ZG"]}`. Liste de 1 à 128 codes ; validation format et longueur, normalisation `Locale.ROOT`, détection des doublons même en casse différente.
- 404 si un seul code demandé n'existe pas (aucune réponse partielle). 400 si doublon, taille excessive, code invalide/mal formé. 500 uniquement pour une véritable erreur non prévue.
- SQL paramétré `IN (:codes)`, jointure de détail catalogue identique à l'ancien GET, projection complète, **ordre de sortie identique à l'ordre d'entrée**. Client Python refuse les counts, ordres ou codes incohérents.
- Activation graduée par `WHV_ANALYTICS_CATALOG_INDICATOR_BATCH_ENABLED`, désactivée par défaut. Ce lot n'active rien sur Vercel, ni sur `v2`.
- Le modèle analytique continue de calculer les mêmes alignements d'années, tendances, statut observé/estimé, sourceAudit, comparabilité et éléments de preuve.
- Observabilité à étiquettes bornées : `catalog.indicators_batch`, jamais pays, utilisateur, indicateur ni identifiant de source.

## Contrôle A/B et limites d'interprétation
- Réutilise **exactement** la fixture SQL de PR #46 : 12 pays, 54 codes réels du produit, 4 couples source/dataset, 24 périodes annuelles, deux révisions, valeurs artificielles étiquetées `SYNTHETIC`.
- Même logiciel & même base : deux modes dans le même job et le même jour. Séquences FRA baseline→batch→batch→baseline, GAB batch→baseline (réduit les effets d'ordre de cache, sans les éliminer).
- Six empreintes de la réponse complète (hors seul `generatedAtUtc`) doivent être identiques pour le même pays. 54 lenses, 200 comparaisons et 270 preuves dans cette fixture : critères stricts.
- Compteurs HTTP attendus : ancienne voie 1+54+162+12=229 ; batch 1+1+162+12=176. Contrôle aussi qu'aucun GET indicateur individuel n'est fait dans le mode batch.
- Tests d'erreur (404, 400, réponse batch mal ordonnée/partielle) et ensemble des tests Java/Python, Gateway 503/reprise, SQL dense.
- Les chiffres de latence de six appels **ne constituent pas des p95/p99**, ni une promesse en production internationale. Coût mémoire/CPU et grandeurs 217 pays sont à mesurer séparément.

## Travail suivant obligatoire
1. Attendre les trois CI **SUCCESS sur le SHA final** de la PR candidate ; corriger toute régression avant d'annoncer validation.
2. Conserver la PR en brouillon et commenter preuves/limites sur GitHub. Aucun merge par défaut.
3. #48 / phase B : concevoir batch Timeseries **latest-by-source** à classement `indicator` + source/dataset/granularity, comparé aux sorties JDBC individuelles.
4. #48 / phase C : batch `availability` et `series`, avec **LIMIT par indicateur** et toutes les années permettant l'alignement des sources ; tests de révisions et statuts manquants/estimés.
5. Expérimentations plus larges sur mêmes datasets, instrumentation Hikari + Java/SQL/parse Python, p50/p95/p99 et contraintes CPU/RAM, sous concurrence multi-utilisateurs.
6. Puis F1.2b.2c-4 quotas/anti-abus, staging sécurisé F1.2b.3, véritable ingestion institutionnelle F1.3, Watch, Money/Transport/Price/Trading/BRVM et radar GDELT sous licences. Les deux documents maîtres GDELT/EarlyForge/revenus du noyau World-Vision doivent rester intacts.

**Interdits permanents :** données officielles synthétisées, source inventée, suppression de preuves, fusion d'anciennes V0/V1, changement média/voix/Vercel, acquisition payante ou déploiement sans décision.
