# WORLD-VISION / World Health Vision V2 — PRODUCT-P2C3B
## Métadonnées Insee réelles, territoire FEHM et interdiction des fausses séries nationales
**Date :** vendredi 20 novembre 2026.
**Dépôt :** `OBIANG5/World-Health-Vision`.
**Branche actuelle :** `product/v2-p2c3b-insee-metadata-geoscope-2026-11-20`.
**PR :** #111 DRAFT, empilée sur #108 P2C3 (elle-même sur #106 P2C2).
**Racine :** `worldhealth-vision-v2/`.
**Issue de pilotage :** #107, PRODUCT-P2C3.
**Aucun merge automatique dans `v2`/`main`, aucun nouveau déploiement Vercel,
aucun coût serveur, aucune statistique institutionnelle publiée dans Atlas.**

### 1. Problème critique découvert grâce à la source primaire
Le GET réel de l'API Melodi `/data/DS_POPULATIONS_REFERENCE` renvoie :
- Requête : `GEO=FRANCE-F&POPREF_MEASURE=PTOT&maxResult=20`.
- Observation : `GEO=2025-FRANCE-F`, `FREQ=A`, `TIME_PERIOD=2023`, `POPREF_MEASURE=PTOT`.
- `2025` est **l'année du référentiel géographique**, pas l'année statistique `2023`.
- Les tests P2C3 antérieurs conservaient `countryIso3Candidate="FRA"`, avec
  l'avertissement `countryMappingStatus=REVIEW_REQUIRED`. Cela pouvait
  favoriser une publication trompeuse plus tard.

**Le catalogue institutionnel DU MEME JEU apporte l'information décisive :
`spatial.id = FEHM` signifie `France hors Mayotte`.** Ce périmètre est
différent de l'ISO3 `FRA` présenté sans restriction dans un Atlas mondial.
Le blocage serait important même si le chiffre PTOT était techniquement valide
et sous Licence Ouverte.

### 2. Preuves réellement vérifiées le 20/11/2026
- Insee : https://www.insee.fr/fr/information/2008466
  « Sauf mention contraire », Licence Ouverte / Open Licence **2.0** ;
  réutilisation y compris commerciale, obligation de nommer
  **Source : Insee**, date de dernière mise à jour si connue, pas
  d'altération trompeuse du sens. Cette politique générale n'est PAS une
  décision World-Vision `PUBLIC_API_INGEST`.
- Insee : https://www.insee.fr/fr/information/8184173
  Catalogue Melodi (données ET métadonnées), accès ouvert et
  quota annoncé 30 requêtes/minute sans souscription.
- Documentation du package InseeFrLab :
  https://inseefrlab.github.io/melodi/reference/get_metadata.html
  et https://inseefrlab.github.io/melodi/reference/get_data.html.
- Métadonnées de l'API OFFICIELLE
  `https://api.insee.fr/melodi/catalog/DS_POPULATIONS_REFERENCE`
  **lues une fois** dans GitHub Actions :
  https://github.com/OBIANG5/World-Health-Vision/actions/runs/44777513706 — **SUCCESS**, aucun chiffre/statistique affiché.
  Champs observés directement : `identifier=DS_POPULATIONS_REFERENCE`,
  `publisher.id=INSEE`, `spatial.id=FEHM`, `accessRights=Public`,
  `confidentialityStatus=Libre`, `status.id=publie`,
  `temporal=2023`, `spatialTemporal=2025`,
  `statisticalUnit=Individu`,
  `structure.dsd=DSD_POPULATIONS_REFERENCE`,
  `issued=2025-12-17...` et `modified=2025-12-18...`.
- Méthode Insee : https://www.insee.fr/fr/metadonnees/definition/c2339 .
  `PTOT` = population TOTALE (municipale + comptée à part),
  distincte de `PMUN` utilisée à des fins statistiques.
- Publication Insee 2023 :
  https://www.insee.fr/fr/statistiques/8681011 et
  https://www.insee.fr/fr/statistiques/8680659 .
  La statistique de référence à **01/01/2023** s'applique en géographie
  **01/01/2025** ; entrée en vigueur **01/01/2026**.
  Champs France métropolitaine et DOM hors Mayotte explicités par l'Insee.
  Ne pas fusionner FEHM avec une projection WDI au 1er juillet, ni confondre
  les estimations démographiques et les populations légales.

### 3. Code implémenté — source metadata comme preuve, jamais comme autorisation
- `services/ingestion-service/src/ingestion_service/connectors/insee_melodi_catalog_review.py` :
  **nouveau contrôleur de provenance** avec un seul endpoint HTTPS Insee
  `/melodi/catalog/DS_POPULATIONS_REFERENCE`, réseau OFF par défaut,
  aucun redirect, pas de retry sur 429, limite 500KB.
  Décode JSON UTF-8 sans clés doubles / NaN ; impose identifier, INSEE,
  **FEHM/France hors Mayotte**, date, unité `Individu`,
  `Annuel`, statut `publie`, confidentialité `Libre`,
  droits d'accès `Public` et schéma DSD. Rejette changement de scope,
  période, publisher, unité, méthode et date incohérente.
  `Public/Libre` sont une preuve d'état **d'accès**, non une licence de
  redistribution automatiquement signée.
- `validate_population_and_metadata(...)` vérifie les DEUX preuves
  INDEPENDANTES, obligatoirement même jeu/éditeur,
  année statistique `2023`, version géographique `2025`, PTOT.
  **N'effectue pas** de transcodage FEHM→FRA.
- `capture_private_insee_catalog(...)` archive les VRAIS OCTETS de
  métadonnées par SHA256 dans l'EXISTANT `QuarantinedJsonEvidenceStore`,
  indépendamment de la réponse de statistiques.
- `insee_melodi_reference_client.py` :
  `countryIso3Candidate = null` (même lorsque les données sont lues),
  `countryMappingStatus = NOT_MAPPED_TO_ISO3`.
  Si le catalogue est fourni, valide la cohérence, archive deux révisions
  privées immuables liées par le SHA des bytes du catalogue, classe le
  territoire `geographicScopeId=FEHM`,
  `geographicScopeStatus=FEHM_VERIFIED_NOT_FRA`.
  Par défaut, en l'absence du catalogue, conserve
  `geographicScopeStatus=REVIEW_REQUIRED`. Ne produit aucune permission
  commerciale, signature reviewer ni insertion Timeseries.
- **Barrière récepteur autonome** dans
  `services/timeseries-service/src/main/java/com/worldhealthvision/timeseries/service/ProtectedSourcePublicationGate.java` :
  datasets exacts `DS_POPULATIONS_REFERENCE` et
  `DS_POPULATIONS_REFERENCE_CATALOG` interdits à la publication,
  même avec notes ou source renvoyant une valeur ; ne retirer ce verrou
  qu'après modèle géographique explicite, droits signés, suivi de
  provenance/couverture et revue humaine. Il préserve les interdictions
  préexistantes IBGE et BRA/WDI research.
- `tests/test_insee_melodi_catalog_review.py` : nouveaux tests adversariaux
  FEHM/éditeur/années/version/période/unité/date/URL/HTTP, et preuve
  d'archives doubles privées. Tests d'origine
  `test_insee_melodi_reference_research.py` corrigés pour rendre le pays
  `null` et ne pas exagérer `FRA`.
- Tests Java modifiés dans
  `TimeseriesSourceRunSafetyIntegrationTest.java` : tentatives
  de contournement avec code source INSEE, dataset INSEE dissimulé sous
  WORLD_BANK, metadata CATALOG, signatures de fixtures uniquement
  SYNTHÉTIQUES.

### 4. CI et contrôles — l'état exact est déterminé par le SHA de code
Workflow Python :
`.github/workflows/whv-v2-p2c3b-insee-metadata-geoscope.yml` ;
il lance 3 suites : nouveau catalogue, ancien connecteur et droits/Bronze.
Run de code `29014f7267d637b86a22ff9ef58c04ddb3d1075f` :
https://github.com/OBIANG5/World-Health-Vision/actions/runs/44778485343
**SUCCESS** : 43 nouveaux + 47 anciens + 27 régressions = 117 PASS.
Après correction d'ordre chronologique (comparaison timestamps UTC, pas
simple tri de chaînes) et barrière récepteur Java, relire la CI sur le
**dernier SHA** avant d'affirmer que ces changements aussi ont passé.
Workflow Java :
`.github/workflows/whv-v2-p2c3b-insee-receiver-geography-gate.yml` ;
exécute Maven Java21/Testcontainers Postgres16/Flyway sur vrai backend ;
la conclusion du run doit être vérifiée et liée dans le commentaire PR.

Workflow REAL PROVIDER dans une branche audit isolée :
https://github.com/OBIANG5/World-Health-Vision/actions/runs/44778754616 —
**SUCCESS** : 2 GET HTTPS officiels, métadonnées + chiffres, deux
receipts de bytes source distincts en quarantaine SHA256, contrôle
`FEHM`, période 2023 et millésime géographique 2025,
`Individu`, `publisher=INSEE`, et vérification des fichiers relus.
**Aucune valeur chiffrée n'a été imprimée ni intégrée dans le site public**.
Les fichiers ont été détruits du runner à la fin ; ce n'est pas un stockage
d'audit **durable**.

### 5. Les décisions GO/NO-GO restantes
**NO-GO publication de toute observation INSEE DS_POPULATIONS_REFERENCE**
tant que l'une de ces conditions manque :
1. Modèle de référence territoriale international (source-native code FEHM,
   pays ISO3, inclusions/exclusions, version du référentiel, date statistique,
   unités, échelles et statut d'estimation), sans fausse équivalence avec la
   population nationale entière.
2. Dossier détaillé de licence de CE JEU, page officielle et version de la
   licence, droits de copie/API/publication et réemploi commercial,
   attribution et date modif, éventuelle exception, qualité, révocation
   et deux contrôles humains indépendants. La licence générale est un
   point de départ, pas une signature reviewer.
3. Signature indépendante `PUBLIC_API_INGEST` scope-limited avec version
   du parseur (PR #95) et révocation des clefs (issue #94),
   témoin raw→normalized et revue de toutes transformations.
4. Ingestion d'UNE vraie mesure démontrée en staging privé, données
   exactes/méthode/unité/couverture visibles ; même contrôle de révocation
   au navigateur sur le vrai backend, sauvegarde et restauration des
   preuves Bronze, logs de provenance/corrections.
5. PREVIEW réelle HTTPS protégée noindex avec authentification et secrets
   hors dépôt, budget de fonctionnement et plan de rollback ; décider
   séparément du site public et de l'hébergement.

### 6. Principe mondial à appliquer aux 217 pays/territoires
La cartographie d'un pays **n'est pas** la définition précise du champ
d'une série. Les sources officielles de chaque pays peuvent diffuser
des statistiques excluant ou incluant des territoires, des résidents
particuliers, des estimations provisoires ou des populations de droit.
Ne JAMAIS afficher un total national ou déclarer deux méthodes
équivalentes sans :
- code territoire **source**, version géographique et champ d'inclusion ;
- unité/méthode/statut/année réelle de référence ;
- droits d'affichage et attribution juridiquement vérifiés ;
- métadonnées officielles raw archivées **avec** les valeurs ;
- comparabilité explicitement approuvée et limites visibles.

**Médias / GDELT / onze Visions :** rien de détruit. Le moteur GEO,
l'Atlas, la découverte des sources, les branches audiovisuelles et les
Watch/Money/Transport/Price/Trading doivent reprendre ce même contrôle
de provenance plutôt que reproduire une confusion entre pays et champ
statistique.

### 7. Reprise fiable dans le prochain chat
1. Lire ce document, PR **#111** et ses derniers runs CI, issue #107.
2. Lire PR **#108** (P2C3 source Insee), dossier P2C3 ;
   PR **#106** (preuve P2C2 Signatures→Timeseries→Atlas→révocation),
   dossier P2C2.
3. Lire `docs/continuity/HANDOFF_CORE_F12B_2026-11-19.md`, 
   PR #95, issue #94, issue #68 Vercel et l'ordre PR #102/#101/#100/#99/#97.
4. Contrôler le SHA final + tests Java/Postgres et Python ; corriger
   les erreurs éventuelles. Ne JAMAIS confondre code poussé,
   CI verte, license de données validée, série publieable,
   site public opérationnel ou couverture mondiale réelle.
5. Priorité produit suivante : **dossier de revue, modèle de périmètre
   et première série légale correctement attribuée**, plutôt que
   multiplier les connecteurs fictifs ; ensuite vrai staging/mobile
   et davantage de pays via sources locales vérifiées (Gabon
   INSTAT/BEAC en priorité).
