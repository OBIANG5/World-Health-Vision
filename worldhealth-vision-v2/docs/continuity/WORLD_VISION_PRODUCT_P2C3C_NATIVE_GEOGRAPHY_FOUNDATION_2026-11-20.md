# WORLD-VISION — Product P2C3C / issue #112
## Registre géographique institutionnel international et protection des comparaisons nationales

**Date :** 20 novembre 2026.  
**Repo :** OBIANG5/World-Health-Vision.  
**Produit :** worldhealth-vision-v2/.  
**Branche :** product/v2-p2c3c-geographic-scope-foundation-2026-11-20.  
**PR :** #113 **DRAFT** sur branche P2C3B de #111 ; dépend de #108 P2C3, #106 P2C2 et de la chaîne V2 antérieure.  
**Traçabilité :** issue #112, dossier P2C3B et HANDOFF_CORE_F12B.  
**Environnement :** tests réels PostgreSQL 16/Flyway et Java 21 dans GitHub Actions ; ni production, ni Vercel, ni données institutionnelles publiées, ni frais VPS.

### 1. Pourquoi cette tranche est prioritaire pour World-Vision
Auparavant, les observations de Timeseries utilisaient `country_iso3` comme
attribut obligatoire et les comparaisons mondiales lisaient
`timeseries.latest_observation`. Une population institutionnelle dont
le champ était limité à une partie du territoire pouvait donc risquer
d'être présentée comme un TOTAL national complet.

**Preuve institutionnelle vérifiée le 20 novembre 2026 :** la réponse
Insee `GEO=2025-FRANCE-F`, `TIME_PERIOD=2023`, `PTOT` doit se lire
avec le catalogue officiel `DS_POPULATIONS_REFERENCE`, lequel déclare
`spatial.id=FEHM`, c'est-à-dire « France hors Mayotte ».
`2025` est le millésime géographique de cet objet, distinct de `2023`
année de référence de la population. Il est non scientifique de
remplacer automatiquement ce périmètre par `FRA` entier ou de mélanger
une population légale PTOT avec une estimation WDI de milieu d'année.

**Preuve CI source réelle réutilisable** :
https://github.com/OBIANG5/World-Health-Vision/actions/runs/44778754616
— deux GETs institutionnels source+catalogue, concordants et archivés
seulement de manière éphémère/privée, jamais publiés ni imprimés.

### 2. Choix d'architecture — ni hardcode français, ni fausse qualité mondiale
Le modèle doit fonctionner pour le Gabon, le Brésil, des États insulaires,
des subdivisions, des zones transfrontalières et des institutions qui
définissent leurs versions géographiques par autre chose qu'une année.

Enregistrement SOURCE-NATIF :
- `source_code`, `dataset_code` : émetteur et jeu de données ;
- `native_geo_code` : identité officielle du territoire dans l'API ;
- `native_geo_version` : release **alphanumérique** de ce référentiel,
  par exemple `2025-A` ou `ADMIN_2026Q4` ;
- `geo_reference_year` : année FACULTATIVE, distincte de la version
  native et de la période statistique ;
- `country_iso3` : pays **parent facultatif**, nul en contexte
  transfrontalier/inconnu. Cela N'EST JAMAIS une équivalence nationale ;
- `coverage_kind` : `PARTIAL_COUNTRY`, `SUBNATIONAL`,
  `MULTINATIONAL`, `UNKNOWN` ou
  `FULL_COUNTRY_CLAIM_UNREVIEWED` (un libellé « full » n'est pas une
  décision de publication) ;
- `territorial_inclusions`/`territorial_exclusions` :
  listes JSONB explicites, non une étiquette de drapeau ;
- `source_metadata_url`, `source_metadata_sha256` :
  revendication de provenance à vérifier avec les octets Bronze privés ;
- `review_status=RESEARCH_ONLY` : statut UNIQUE de cette migration ;
  aucune valeur de table ne peut créer de permission ou de signature.

**Différence cruciale** : une source locale « connectée » ou
« cataloguée » n'est ni une observation réelle ni un droit de diffusion.
Le globe représente les pays ; la géographie statistique représente
les CHAMPS des données de chaque institution.

### 3. Changements réellement présents dans le code
1. **Migration Flyway V6**, chemin
   `services/timeseries-service/src/main/resources/db/migration/V6__source_native_geography_scope_and_national_read_gate.sql`.
   Ajout non destructif de `timeseries.geographic_scope_registry` et
   `timeseries.geographic_dataset_policy` avec triggers append-only.
   Ajout nullable `timeseries.observation.geographic_scope_id`
   sans backfill ; les anciens historiques restent physiquement
   intacts et ne reçoivent AUCUNE approbation nouvelle.
2. **Règle institutionnelle zéro équivalence implicite** :
   la table de politique est SEEDÉE avec exactement deux HOLDs de
   recherche, `DS_POPULATIONS_REFERENCE` et
   `DS_POPULATIONS_REFERENCE_CATALOG`, avec
   `source_code='*'` pour refuser un code source frauduleux.
   ZÉRO ligne de registre Insee inventée, ZÉRO signature officielle
   et ZÉRO nombre réel Insee en SQL.
3. **Trigger DB `bind_source_native_geographic_scope`** :
   lorsque `source_metadata` contient une revendication géographique,
   le traitement requiert `sourceNativeGeographyCode`,
   `geographicVersion`, et si nécessaire
   `geographicReferenceYear` de manière cohérente avec une entrée
   de registre indépendante et le pays parent. Si l'année, version,
   source, dataset ou pays ne concordent pas : **SQL REJECT**.
   Les métadonnées de la réponse et du pays ne peuvent PAS lier
   un UUID géographique arbitraire.
4. **Vue nationale conservant droits et révocation** :
   `timeseries.latest_observation` réutilise les contrôles V5
   (`PUBLIC_API_INGEST` indépendant, validité, révocation,
   empreinte Bronze originale, signed witness et items SHA) et
   ajoute UNE condition restrictive
   `national_scope_read_eligible(...)`. Toute observation avec
   périmètre source natif documenté, non revu, ou dataset sous HOLD
   disparaît des lectures de données nationales. Elle reste
   disponible physiquement pour la forensic privée.
5. **Route source-runs publique** : dans
   `JdbcTimeseriesRepository.java`, la liste des runs applique
   également `national_scope_read_eligible` ;
   une source mise en quarantaine ne doit pas passer pour
   une source publique nationale.
6. **Barrière Java avant écriture** : dans
   `ProtectedSourcePublicationGate.java`, toute nouvelle
   revendication `sourceNativeGeographyCode`,
   `geographicVersion`, `geographicReferenceYear`,
   `geographicScopeId`, `geoFilter` ou
   `countryIso3Candidate` est refusée à HTTP 403 AVANT
   toute écriture d'une observation ou source-run.
   Ce refus est PROVISOIRE jusqu'au modèle de droits
   géographiques signé ; il est plus sûr que de publier une
   population nationale trompeuse. La DB possède son propre
   verrou indépendant.

### 4. Non-régressions réelles, avec toutes les erreurs rapportées
Workflows :
`.github/workflows/whv-v2-p2c3c-geographic-scope-national-denial.yml`
et suites
`GeographicScopeNationalReadIntegrationTest.java`.

**Première tranche V6** :
- Run https://github.com/OBIANG5/World-Health-Vision/actions/runs/44782942227 :
  échec compilation du nouveau test Java (import Spring incorrect),
  corrigé sans changer de signature/droit.
- Run https://github.com/OBIANG5/World-Health-Vision/actions/runs/44783228088 :
  **SUCCESS 39/39 tests Java et V6 Flyway**, première version
  validée de la couche stricte.
- Runs https://github.com/OBIANG5/World-Health-Vision/actions/runs/44783989398
  et https://github.com/OBIANG5/World-Health-Vision/actions/runs/44784258639 :
  échec SQL dans une généralisation automatique : regex `$` tronquée,
  migration refusée par PostgreSQL, rollback Flyway effectué, aucune
  base de production touchée. Correction en **reconstruisant V6 depuis
  le commit déjà vert** et en effectuant les remplacements sans
  interprétation des caractères `$`.
- **Code reconstruit et testé** :
  `e500851ec44dce4607e334918779e22c2d30aee0`,
  CI https://github.com/OBIANG5/World-Health-Vision/actions/runs/44784585785
  **SUCCESS : 42 tests Java/PostgreSQL16 + Flyway V6, 0 failure,
  0 error, 0 skipped, BUILD SUCCESS** :
  9 nouveaux tests géographiques et 33 tests antérieurs couvrant
  TimeseriesController, droits signés, révocation,
  attestation et fingerprints. Tests adversariaux :
  source-code forgée, aucun grant Insee, scope absent,
  vintage/version falsifiés, pays DEU vs FRA, registre append-only,
  revendication FULL_COUNTRY sans droit, zone transfrontalière
  sans pays, suppression de la lecture publique et conservation
  de l'observation privée.
- **Protection CI additionnelle** sur commit suivant :
  vérifier que la vue V6, une fois retirée la seule condition
  géographique ajoutée, est exactement égale à la vue V5 ;
  cela garantit qu'aucune exigence de droits signés, de
  révocation ou de témoin Bronze n'a été effacée.
  Réexécuter la CI du SHA exact avant déclaration finale.

### 5. Ce qui n'a PAS été fait / ne doit pas être prétendu
- Aucun dataset Insee réel publié dans Atlas ;
- aucune équivalence `FEHM=FRA` enregistrée ;
- aucune source reconnue sous réutilisation commerciale du jeu
  précis, aucun reviewer/countersigner institutionnel réel ;
- pas de `PUBLIC_API_INGEST` institutionnel signé,
  pas de changement dans PR #95/issue #94 ;
- pas de preview réelle HTTPS, pas de mobile avec vraies valeurs,
  pas de stockage Bronze original durable privé ni sauvegarde/restore ;
- pas de migration sur site public Vercel, ni VPS, ni merge
  automatique de la chaîne DRAFT ;
- pas de couverture de données réelles des 217 pays ;
- la table `geographic_scope_registry` n'est PAS
  une autorité cryptographique ou une validation humaine.

### 6. Suite la plus intelligente — opérationnelle, pas cosmétique
**P2C3C2 (issue #112, tranche suivante) :**
A. RFC de permission **géographique indépendante** :
   statut parent ISO3 ≠ NATIONAL_EQUIVALENT ; reviewer/countersigner
   humains distincts, preuve cryptographique signée, identité
   du parseur (PR #95), révocation de la décision et clés (#94).
B. Construire un **endpoint source-native / scoped-data** sous droits
   réels vérifiés, **différent** des routes nationales comparables ;
   jamais contourner la view `latest_observation` pour exposer une
   donnée de recherche.
C. UX Atlas mobile 320/390/1440 :
   distinguer valeurs comparables pays complets et « France hors
   Mayotte — population totale de référence 2023 — géographie 2025 »,
   afficher méthode PTOT, unité, date/attribution, caveats ;
   tant que droits réels non signés, un état vide véridique.
D. Affiner les décisions data : institutions locales Gabon INSTAT,
   DGSEE/BEAC et autres pays selon la même politique géographique.
E. Première seule série réelle, licite, attribuée, versionnée,
   audit original durable privé, sauvegarde/restore et rollback,
   **staging authentifié** puis revue séparée de promotion Vercel
   et coûts. Aucun achat d'infrastructure sans autorisation.

**Architecture générale** : médias et GDELT, publications visuelles,
World Watch/Money/Trading/Price et toutes les autres Visions doivent
partager la qualité de provenance, mais on ne confond pas la veille
éditoriale avec l'autorisation de redistribution d'une série de données.

### 7. Handoff inter-chat, ordre de lecture
1. Cette note, PR #113, le dernier run V6 au SHA exact, issue #112 ;
2. P2C3B PR #111 et dossier
   `WORLD_VISION_PRODUCT_P2C3B_INSEE_FEHM_METADATA_2026-11-20.md` ;
3. P2C3 PR #108 et premier double GET officiel ;
4. P2C2 PR #106 signed-to-browser synthetic et révocation ;
5. PR #95 parser identity/issue #94 key policy ;
6. issue #107 première série légale, #68 site public Vercel ;
7. `HANDOFF_CORE_F12B_2026-11-19.md` ;
8. respect de l'empilement DRAFT #113→#111→#108→#106→#102→#101→#100→#99→#97 et du reste historique.

### 8. CI FINAL VERIFIÉE et passage vers le produit (2026-11-20)
**Code validé EXACT** : `2a35495f8673a54cbe44ef29be5c721da5b6aa3e`.
Run : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44784951860
**SUCCESS**, journal vérifié :
- `PASS: V6 national view = exact V5 signed public view + one restrictive geography predicate`. La vue publique V6 a gardé toutes les garanties antérieures
  de preuve Bronze, SHA des items, droits signés, validité et révocation ;
  seul un prédicat **RESTRICTIF** sur les périmètres géographiques est ajouté.
- `PASS: geographic scope history is append-only and no country equivalence is auto-granted` ;
  aucune validation automatique de correspondance ISO3.
- `Tests run: 42, Failures: 0, Errors: 0, Skipped: 0`,
  `BUILD SUCCESS` sur Java 21 + PostgreSQL 16 + toutes les
  migrations Flyway incluant V6.
- Les trois tests additionnels de ce SHA couvrent vrai changement de
  version/release, fausse année, un pays FRA vs DEU, faux libellé full-country
  et zone transfrontalière à millésime administratif alphanumérique.
- Le **SHA documentaire** est postérieur au SHA de code et porte
  `[skip ci]` ; ne pas les confondre. Le code effectivement testé
  ne change pas lors de la rédaction du présent dossier.

**Prochaine issue préparée** :
https://github.com/OBIANG5/World-Health-Vision/issues/114
= P2C3C2, une vraie valeur institutionnelle géographiquement exacte,
sous droits signés, sur un Atlas de staging authentifié ; chemin critique
sans nouvelle stagnation sur une série de détails de catalogue. Cette
issue inclut source-native read API séparée des comparaisons nationales,
droits et méthodologie de CE dataset, sécurité/compatibilité mobile,
et stockage Bronze privé DURABLE.

**État au handoff** :
P2C3C — REGISTER+NATIONAL DENY **TESTED** ;
P2C3C2 — SCOPE GRANT+PUBLISHED STAGING **NOT IMPLEMENTED**.
Le blocage `DS_POPULATIONS_REFERENCE` reste entièrement actif.
N'afficher aucune statistique réelle INSEE comme déjà publiée
ou accessible dans Vercel ; le site public existant reste déconnecté.
