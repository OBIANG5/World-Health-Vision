# WorldHealth Vision V2 — couverture nationale : sources, méthodes, monitoring

**Date d'initialisation :** 12 novembre 2026.
**Périmètre :** logiciel économique d'abord ; même source registry à terme
pour le média World-Vision, sous validation éditoriale humaine.

## Ce que signifie « connaître la réalité de chaque pays »

Une statistique économique doit être comprise *dans son contexte
national*, y compris lorsqu'un organisme mondial publie un chiffre
plus ancien ou suit une autre méthode. Inversement, une institution locale
peut avoir des lacunes, être influencée par sa tutelle, utiliser des
concepts propres ou corriger ses chiffres après coup.

La plateforme ne choisit **aucun gagnant automatique**. Elle conserve :
provenance première, pays concerné, territoire/zone monétaire, méthode,
période, statut observé/estimé, date de publication et révisions, droits,
qualité, possibilité d'usage dans un média.

### Trois niveaux à ne jamais confondre

1. **Institution référencée** : identité, fonction, URL officielle et
   date de vérification. Ce n'est pas une donnée ni une connexion active.
2. **Publication documentée** : œuvre originale identifiée, chiffres
   contextualisés, statut préliminaire/définitif, auteur et éventuelle
   reprise journalistique. Ce n'est pas une observation ingérée.
3. **Série effectivement intégrée** : connecteur testé, licence vérifiée,
   valeur chiffrée écrite dans le moteur canonique, millésime, statut,
   révisions conservées, provenance auditable. Cette validation doit être
   démontrée techniquement sur une base persistante avant toute promesse
   de monitoring 24 h/24.

Le nouveau champ `connectionState` vaut `CATALOG_ONLY` tant que la
collecte locale n'est pas validée ; le catalogue mondial des 22+ sources
internationales est un référentiel **distinct**.

## Particularités transfrontalières

**La BEAC est la banque centrale commune de six pays** : Cameroun
(`CMR`), République centrafricaine (`CAF`), Congo (`COG`), Gabon
(`GAB`), Guinée équatoriale (`GNQ`) et Tchad (`TCD`).
Son mandat concerne la politique monétaire et les données financières
de la CEMAC ; les chiffres communs à cette zone ne sont pas toujours
des statistiques gabonaises ou camerounaises.

Le catalogue déclare `sourceType=REGIONAL_OFFICIAL` et
`geographicScopeKind=REGIONAL_SHARED` pour BEAC. Un pays dont **seule**
la BEAC figure au catalogue est signalé `REGIONAL_REFERENCE_ONLY`,
pas « pays documenté localement ».

## Premiers pays : recherches partielles, pas couverture complète

| Code | Institutions / organismes documentés | Statut |
| --- | --- | --- |
| GAB | INSTAT Gabon ; AGP (média local) ; BEAC partagée | Recherche nationale partielle |
| FRA | Insee ; Banque de France | Recherche nationale partielle |
| NGA | National Bureau of Statistics ; Central Bank of Nigeria | Recherche nationale partielle |
| USA | U.S. Census Bureau ; Bureau of Economic Analysis | Recherche nationale partielle |
| CMR, CAF, COG, GNQ, TCD | BEAC — référence régionale seulement | Recherche nationale non réalisée |

**Aucune** des nouvelles institutions n'est à ce stade un
connecteur local opérationnel. Les chiffres WDI du Gabon ont été
**réellement ingérés dans un test éphémère séparé** ; ce sont des
observations Banque mondiale, **pas** une collecte automatique du
recensement INSTAT.

### Sources de référence des autorités elles-mêmes

- INSTAT Gabon : https://new.instatgabon.org/fr
- RGPL provisoire : https://rgplprovisoire.instatgabon.org/
- BEAC, membres et mandat : https://www.beac.int/beac/la-beac/
- BEAC, statistiques monétaires nationales : https://www.beac.int/economie-stats/statistiques-monetaires/
- Insee, catalogue de données : https://www.insee.fr/fr/information/8184146
- Banque de France, portail statistique : https://webstat.banque-france.fr/fr/
- NBS Nigeria : https://www.nigerianstat.gov.ng/
- Central Bank of Nigeria : https://www.cbn.gov.ng/rates/
- U.S. Census Bureau, API / jeux de données : https://www.census.gov/data/developers/data-sets.html
- U.S. BEA, GDP : https://www.bea.gov/itable/national-gdp-and-personal-income

**Risques déjà repérés** :
- Le NBS Nigeria a signalé le rebasage de son PIB et de l'indice CPI
  en 2025 : vérifier période de base et pondération avant de rapprocher
  les séries historiques de celles du FMI.
- L'API du Census Bureau ne couvre pas forcément **les dernières
  estimations de population** : privilégier la source/fichier
  officiel réellement disponible avant d'écrire un connecteur.
- Les séries Banque de France peuvent reprendre des chiffres BCE :
  éviter de compter deux fois la même mesure.

## API de recherche et transparence

`GET /api/catalog/local-sources/coverage?limit=500`

Parcours du registre des pays et territoires actifs hors agrégats
(pour ce jalon, le snapshot Banque mondiale comprend 217 entrées).
Résultats :
- `NOT_RESEARCHED` — aucune institution propre au pays référencée ;
- `REGIONAL_REFERENCE_ONLY` — une institution supranationale
  applicable est identifiée, mais la recherche nationale reste à faire ;
- `PARTIAL_CATALOGUED` — première liste locale commencée, **jamais
  synonymie de couverture exhaustive**.

Les paramètres `regionCode`, `onlyWithoutLocalSources`, `limit`,
`offset` permettent le suivi. Les compteurs incluent les absences
(zéro), les avis de révision en retard et les sources réellement
marquées `INGESTION_VERIFIED`. La page Sources et Méthodologie
présente ces métriques uniquement si le backend est disponible.
Un aperçu statique ne doit jamais prétendre en connaître les valeurs.

### Procédure obligatoire pour chaque nouvelle institution

1. Établir le **pays ou ensemble de pays compétents** (institution
   nationale, régionale, banque centrale commune, sous-national).
2. Vérifier l'identité, l'URL et la **source primaire** auprès de
   l'institution elle-même ; noter date et preuve.
3. Répertorier instituts statistiques, banque centrale, autorités de
   santé/économie/justice, médias locaux crédibles, société civile,
   travaux universitaires et recherches de terrain.
4. Décrire politiques de publication, conflits d'intérêts possibles,
   limites d'échantillonnage, langues, divisions administratives,
   calendrier de révision, concepts et périmètre géographique.
5. Qualifier **droits de réutilisation**, robots, limite de fréquence
   et formats/API. Les sites en HTTPS ne signifient pas autorisation
   de scraper ou republier un article.
6. Relier publications et indicateurs seulement après validation.
   Documenter originaux et reprises : **deux articles dérivés d'un
   même recensement ne comptent pas comme deux mesures indépendantes**.
7. Exécuter les tests réels sur environnement éphémère avant
   d'activer un connecteur, puis demander une preuve d'observation
   dans un environnement permanent avant toute promesse 24/7.
8. Faire réviser régulièrement les entrées `lastReviewedOn` selon
   `reviewIntervalDays`. La date de revue est **une échéance
   éditoriale**, pas la fréquence de disponibilité des données.
9. Pour le média : revue humaine des écarts, des interprétations,
   des droits, du contexte et des allégations avant publication.

## Livrables de ce jalon

- Migration `V26` : sources institutionnelles vérifiées, portée
  régionale, état de connexion et calendrier de revue.
- Service Catalogue : listes par pays + panorama de recherche
  sur l'ensemble du registre réel.
- Fiche pays : affiche le rôle régional/national, « référencée
  seulement », les limites et licences.
- Modal Sources : montre les lacunes de recherche par pays,
  n'affiche aucune couverture inventée en mode aperçu.
- Tests Java/Testcontainers, route HTTP et build TypeScript/Vite.

## Ce qui manque encore — ordre de travail recommandé

1. Premier **connecteur statistique local** officiel (p. ex. source
   INSEE ou NBS avec flux utilisable, contrat réutilisable et séries
   comparables), sans inventer la disponibilité.
2. Suivi des nouvelles publications et révisions, avec provenance,
   journal d'exécution, contrôles de volume, erreurs visibles,
   non-régression et revue humaine des divergences.
3. Infrastructure durable : stockage des versions, sauvegarde,
   monitoring, sécurité, accès par rôles, gestion des secrets,
   tâches planifiées, conditions de service.
4. Couverture pays progressive selon une grille de recherche
   complète, y compris langues et médias locaux ; audit contradictoire
   régulier avant diffusion médiatique.
