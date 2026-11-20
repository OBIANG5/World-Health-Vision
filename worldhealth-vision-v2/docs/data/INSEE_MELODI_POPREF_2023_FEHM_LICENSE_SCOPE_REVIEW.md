# World-Vision — revue droits et méthode : INSEE / Melodi / PMUN 2023 / France hors Mayotte

**Statut : REVIEW_REQUIRED — AUCUNE AUTORISATION SIGNÉE DE PUBLICATION DANS TIMESERIES.**
Dossier élaboré le 20 novembre 2026. PR #109, issue #107.
Ne confondre ni avis de conformité opérationnelle avec conseil juridique,
ni Licence Ouverte générale avec la signature d'un reviewer indépendant.

## 1. Objet du dossier et échantillon exact
- Source / concédant : **Institut national de la statistique et des études économiques (Insee)**.
- Jeu : `DS_POPULATIONS_REFERENCE`, mesure `PMUN`, fréquence A,
  période **2023** ; population MUNICIPALE, personnes ; pas PTOT.
- Origine : `https://api.insee.fr/melodi/data/DS_POPULATIONS_REFERENCE?GEO=FRANCE-F&POPREF_MEASURE=PMUN&TIME_PERIOD=2023&maxResult=10`.
- Géographie technique `2025-FRANCE-F` ; champ **France hors Mayotte**,
  frontières communes au 1er janvier **2025** ; aucune assimilation à
  France entière, France métropolitaine, Occitanie ou à une agrégation d'états.
- Statistique : **2023** référence au 1er janvier, calcul officiel
  par procédure de recensement de population ; entrée en vigueur 2026.
  La date d'entrée en vigueur du texte n'est pas la période de mesure.
- Référence de cohérence du chiffre Insee : 68 094 280 personnes, PMUN
  France hors Mayotte 2023. Ce nombre ne doit pas devenir « population
  actuelle de la France » dans l'UI. La première réponse API vérifiée
  a une empreinte byte SHA256 `86e21971a8734eea9cba89fcee0cdf7d9b8f16f0c04a3a9384470c27cdf92927`
  (deux GETs identiques, run #44774203052), mais les octets sont
  temporairement effacés après la CI.
- À comparer uniquement à des valeurs portant explicitement la même
  unité, géographie, période, définition de PMUN et méthodes ;
  distinguer ONU/Banque mondiale estimations au milieu de l'année.

## 2. Sources publiques identifiées et portée exacte
1. Insee catalogue : https://www.insee.fr/fr/information/8184173 —
   les jeux du catalogue sont mis à disposition sous Licence Ouverte.
   **Constat général vérifié**.
2. Page API Melodi : https://www.insee.fr/fr/information/1302169?question=comment-utiliser-l-api-melodi
   — accès libre sans inscription, limite de **30 GET/minute** ;
   d'autres répertoires peuvent afficher des quotas différents,
   appliquer la borne plus prudente. **Constat vérifié**.
3. Publication et méthode de ce millésime :
   https://www.insee.fr/fr/statistiques/8681011 —
   champ, définitions PMUN/PTOT, date d'authentification et comparaison
   recensements (prudence 5 ans, 6 ans exceptionnellement pour 2023).
   **Constat vérifié**.
4. Description technique / documentation des codes :
   https://inseefrlab.github.io/melodi/reference/get_metadata.html
   https://inseefrlab.github.io/melodi/reference/get_range.html
   https://inseefrlab.github.io/melodi/reference/get_data.html
5. Licence Ouverte 2.0 officielle :
   https://www.data.gouv.fr/pages/legal/licences/etalab-2-0
   https://guides.data.gouv.fr/guides/guide-juridique/reutilisateurs-de-donnees/respecter-les-conditions-de-reutilisation
   Le texte autorise en principe reproduction, adaptation et usage
   commercial/non commercial SOUS attribution de la source ET
   date de dernière mise à jour, sans travestir la source ni suggérer
   une caution officielle. **Texte légal général vérifié**.

## 3. Registre d'habilitation par opération (AUCUN green-light signé)
| Opération | État du dossier | Gate avant déploiement |
|---|---|---|
| Consulter l'API officielle anonyme à titre de recherche | **CONFIRMÉ** par 2 GETs (CI éphémère) | Quota prudent ; URL fixe ; éviter la charge répétée |
| Conserver octets source en stockage privé | **TESTÉ** dans Bronze CI, ensuite supprimé | rétention durable, backup/restore, RBAC, journal complet |
| Afficher la valeur sur un site public | **À AUTORISER** | revue de la licence portée par ce dataset + attribution exacte + date MAJ |
| Servir cette valeur dans World-Vision API | **À AUTORISER** | droit de redistribution explicite + portée/licence + signature limitée et révocable |
| Inclusion dans offre commerciale | **À REVÉRIFIER** | appliquer Etalab 2.0 à ce dataset, vérifier exceptions et absence d'usage trompeur |
| Créer statistiques dérivées/comparaisons | **À REVÉRIFIER** | méthode, sources, attribution, dates, périmètre et comparaison scientifique |
| Signer `PUBLIC_API_INGEST` | **INTERDIT à cette étape** | décision documentée avec reviewer et contresignataire distincts, témoin source indépendant |
| Mettre à jour Vercel public | **NON PRÉVU** | P2C3B source réelle, staging privé, coûts et décision distincte |

## 4. Attribution à afficher si et seulement si publication autorisée
Exemple de champs de crédit (ne pas inventer la date d'actualisation) :
`Producteur : Insee` ;
`Donnée : population municipale de référence au 1er janvier 2023` ;
`Périmètre : France hors Mayotte (limites territoriales 01/01/2025)` ;
`Unité : personnes` ;
`Licence : Licence Ouverte / Open Licence 2.0 (à confirmer pour la ressource)` ;
`Mise à jour du dataset : [DATE_OFFICIELLE_VÉRIFIÉE]` ;
`Consultation World-Vision : [FETCHED_AT_UTC]` ;
`Source : [URL_OFFICIELLE]` ;
`Méthode et limites : [LIEN_INSEE_STATISTIQUES]`.
La date de publication du rapport ≠ date réelle de mise à jour
de l'observation ; aucune substitution automatique.
Ne pas apposer d'insigne donnant l'impression que l'Insee cautionne
World-Vision.

## 5. Conditions à remplir avant sortie de PRIVATE_RESEARCH_VALIDATION
- Identifier dans le **catalogue du jeu exact** la licence, d'éventuelles
  exceptions et la date de mise à jour. Sauvegarder les liens/preuves
  documentaires et procéder à une revue humaine des opérations.
- Durcir le témoin indépendant de vrais octets Bronze et la signature
  d'identité du parseur (PR #95) + clés/parseurs révocables (issue #94).
- Produire une décision signée scope source/dataset/pays/indicateur/
  HTTP SHA/période/opération avec deux personnes distinctes, authentiques,
  et sans clé privée dans la stack Timeseries ni dans GitHub.
- Assurer restauration du stockage privé, test de révocation de la licence,
  mise à jour de l'attribution et conservation forensique.
- Ne publier dans Atlas qu'un libellé pleinement qualitatif, avec le
  périmètre *France hors Mayotte* toujours visible. Toute page « population
  de la France » entière devra utiliser une autre série de même définition
  validée pour tout le territoire ou préciser son champ.

**Décision actuelle : recherches privées validées ; première acquisition
officielle vérifiée ; publication réelle bloquée en attente d'une revue
formelle et du circuit de provenance indépendamment attesté.**
