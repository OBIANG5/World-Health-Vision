# WORLD-VISION — PRODUCT-P2C3C2 / Issue #114
## Première lecture d'une statistique à périmètre territorial précis — Trois attestations indépendantes

**Date :** samedi 21 novembre 2026.  
**Dépôt :** OBIANG5/World-Health-Vision.  
**Racine canonique :** `worldhealth-vision-v2/`.  
**Branche :** `product/v2-p2c3c2-signed-scoped-public-read-2026-11-21`.  
**PR :** #115 **DRAFT**, basée sur #113 P2C3C. Dépendances historiques #111, #108, #106, #102, #101, #100, #99 et pile produit V2.  
**État :** fonctionnalité implémentée et testée avec chiffres **SYNTHETIQUES**. Aucune donnée Insee réelle présentée. Aucun merge, déploiement Vercel ou frais VPS.  
**Droits :** aucune approbation institutionnelle ni licence commerciale/redistribution signée. Les clés Ed25519 de test sont générées uniquement en mémoire dans GitHub Actions.

### 1. Pourquoi cette tranche et pourquoi maintenant ?
P2C3 : le vrai GET de l'Insee sur `DS_POPULATIONS_REFERENCE` présente
`GEO=2025-FRANCE-F`, mesure de référence `PTOT` pour période `2023`.
P2C3B : le catalogue institutionnel officiel du même jeu indique
`spatial.id=FEHM`, à savoir **France hors Mayotte**, non équivalent à
l'intégralité du territoire `FRA`. La double lecture réelle en CI
est https://github.com/OBIANG5/World-Health-Vision/actions/runs/44778754616 .
P2C3C / PR #113 a livré la migration V6 avec registre géographique source-native,
version alphanumérique, année facultative et exclusions, conservant
**strictement** les droits signés/attestations/revocations V5 dans la
vue nationale. Tests 42/42 SUCCESS :
https://github.com/OBIANG5/World-Health-Vision/actions/runs/44784951860 .

**L'objectif produit de P2C3C2** est différent : permettre de consulter
une statistique sur son **périmètre réel** sans lui conférer une fausse
comparabilité dans les totaux nationaux, et maintenir la certitude
cryptographique du droit et de la valeur affichée.

### 2. Architecture — trois indépendances fondamentales
1. **DROITS SOURCE :** permission `PUBLIC_API_INGEST` de
   `timeseries.rights_decision` signée Ed25519 par clé externe ;
   explicitement liée à source/dataset/pays/indicateur,
   original HTTP SHA, intervalle des données, date de validité,
   licence/attribution, reviewer/countersigner distincts ;
   toujours révocable par `rights_revocation`.
2. **BRONZE ORIGINAL :** attestation indépendante Ed25519 du témoin
   original `source_run.notes.evidenceAttestation`, avec items SHA,
   normalisé SHA, manifest SHA, acquisition event + outcome.
   **À chaque GET SCOPED**, le serveur reconstruit **TOUTES**
   les observations physiquement stockées pour le source-run,
   recalcule leur empreinte binaire typée (valeurs, dates,
   méthode, drapeaux de qualité), puis revalide la signature
   authentique du témoin. Un changement silencieux du chiffre
   ou de méthode ne peut PAS rendre la valeur publiable.
   L'expiration de la fenêtre d'INGESTION historique n'annule pas
   la signature d'une archive acceptée ; révocation du serveur
   et statut courant sont vérifiés indépendamment. Absence de
   clé de témoin = refus, pas de fail-open.
3. **RECONNAISSANCE GÉOGRAPHIQUE :** troisième clé Ed25519
   externe `WHV_SCOPE_TRUST_PUBLIC_KEY_BASE64`, distincte
   de la licence et du témoin Bronze. Décision signée
   `PUBLIC_SCOPED_WEB_DISPLAY` avec numéro de source-run,
   items SHA, code source-native de territoire, release
   géographique, parent ISO3, libellé, URL+SHA de la page
   métadonnées, méthode, unité, période,
   émetteur/reviewer/countersigner distincts et validité.
   **Aucune équivalence nationale n'est accordée** par ce
   consentement de visualisation propre à un territoire.

Ces permissions ne sont PAS interchangeables. La validation de
l'une ne remplace jamais une autre. Aucune de ces attestations
n'existe pour une VRAIE statistique Insee dans le dépôt.

### 3. Modifications exactes
#### PostgreSQL/Flyway, migration V7
`services/timeseries-service/src/main/resources/db/migration/V7__signed_scoped_read_decisions_and_revocations.sql` :
- `timeseries.scoped_publication_decision` append-only.
- `timeseries.scoped_publication_revocation` append-only.
- Verification de cohérence `geographic_scope_registry` :
  source, dataset, native code et version, parent pays, type
  géographique partiel/infranational, libellé, URL officielle,
  SHA des métadonnées.
- Lien précis à `timeseries.source_run` et empreinte
  `attested_items_sha256` déjà vérifiée/attestée.
- Rejet des deux jeux Insee sous `SCOPE_REVIEW_HOLD`
  même si le source_code est usurpé.
- Aucune approbation/donnée numérique/parsing Insee seedée,
  aucune modification de la V6 `latest_observation` :
  les comparaisons nationales restent exclusivement les
  valeurs compatibles et sous droits.

#### Java/Gateway
- `service/SignedScopedPublicationDecision.java` : payload signé
  non ambigu avec préfixe de domaine, champs en UTF-8
  préfixés par longueur, identité de la source et du périmètre.
- `service/ScopedPublicationSignatureVerifier.java` :
  clé Ed25519 **PUBLIQUE** injectée uniquement par
  `WHV_SCOPE_TRUST_PUBLIC_KEY_BASE64` ; aucun secret
  de signature en code ou dans le navigateur.
- `service/EvidenceAttestationVerifier.java` :
  vérification signée de **l'archive existante**,
  distincte de la courte fenêtre d'acceptation d'un
  nouveau lot d'ingestion.
- `service/ScopedPublishedValuesService.java` :
  requête limitée à 50 résultats, sélection physique
  **uniquement** pour cette API (la vue nationale interdit
  les géographies partielles), joints sur source/rights/
  scope/droits actuels/témoins et SHA.
  Révocation/surdate revérifiées en SQL après signature ;
  refus si double autorisation ambiguë. Aucune liste de
  source-runs privée diffusée. Tous les résultats portent
  `SOURCE_SCOPED_NOT_COUNTRY_EQUIVALENT`.
- `api/ScopedPublishedValuesController.java` :
  `GET /api/timeseries/countries/{iso3}/scoped-values`,
  `Cache-Control: no-store`, paramètre limite `1..50`,
  indicateur en filtre optionnel.
- `api/TimeseriesExceptionHandler.java` :
  `403` si permission géographique/valeur non vérifiable,
  sans renvoyer des octets de source/secrets.
- `services/gateway-service/.../security/PublicReadRoutes.java` :
  allowlist explicite de CETTE route uniquement ;
  aucun wildcard générique `/api/**`.

#### React/Atlas
- `src/api/types.ts` : `ScopedPublishedValue`
  **distinct** de `CountryPublishedIndicator`.
- `src/api/whvApi.ts` : 
  `fetchCountryScopedPublishedValues()`, sans cache,
  vérifie forme du JSON, code source, méthode, indicateur,
  unités, valeurs finies, URL HTTPS, libellé scope,
  limites des exclusions, statut de non-comparabilité ;
  refuse au lieu de présenter une fausse valeur.
- `src/components/country/ScopedValueExplorer.tsx` :
  panneau pays dédié, contenu français/anglais, lecture
  lazy uniquement lorsque le visiteur l'ouvre,
  rafraîchissement manuel et lors du retour en focus,
  aucune ancienne valeur affichée pendant une nouvelle
  vérification, mention claire du périmètre/année/version,
  exclusions, source, date de valeur, méthode, unité,
  attribution et lien documentaire.
- `src/styles/scoped-explorer.css` : lecture adaptative
  320px, 390px, tablette/desktop, contraste et focus.
- `CountryLocalEvidencePanel.tsx` : panneau inséré À CÔTÉ
  de l'explorateur national et du catalogue des organismes.
  Il n'alimente jamais les classements, comparateurs ou
  compteurs de pays complets.

### 4. Tests et preuves précises
- Trois clés Ed25519 privées **uniquement CI en mémoire** :
  droits, témoin et géographie (différentes).
- Nouveau fixture `SignedScopedTestFixture.java` :
  `WORLD_BANK/WDI` **fictif**, valeur `17.0` uniquement QA,
  `SYNTHETIC_QA_METHOD`, `TEST_UNITS`,
  `FICTIONAL_TEST_REGION`, aucune licence World Bank,
  Insee, Gabon ou autre fournisseur réel.
- Test `ScopedPublicationIntegrationTest.java` :
  vrai PostgreSQL16/Flyway et MockMvc HTTP ;
  positif 1 valeur visible sur la route territoriale,
  zéro sur les comparateurs nationaux, mauvais pays
  et aucune signature => 0 ou 403,
  révocation licence OU territoire => résultat supprimé
  au GET suivant, source physique conservée ;
  fausse signature, mutation numérique, drapeaux qualité,
  source-run SHA différent, doubles droits et
  append-only => blocage démontré.
- Le lot source de test est inséré par SQL direct
  dans un **conteneur PostgreSQL jetable**, signé par
  les fixtures de test. C'EST DÉLIBÉRÉ :
  la V6 bloque encore l'ingestion HTTP de ces périmètres,
  et l'ouverture d'un chemin réel nécessite une procédure
  d'autorisation et un témoin Bronze d'originaux durables.
  Ne JAMAIS présenter ces fixtures comme une
  ingestion source institutionnelle réellement autorisée.
- Run backend validé sur SHA
  `034e290222d8fd34ec04050d6231c61dc0656b75` :
  https://github.com/OBIANG5/World-Health-Vision/actions/runs/44891123071
  **SUCCESS 52 Timeseries + 46 Gateway = 98 PASS**,
  zéro échec/erreur/skip ; protections antérieures V6
  et V5 conservées.
- Nouvelle CI frontend
  `.github/workflows/whv-v2-p2c3c2-scoped-signed-revocable-read.yml`
  effectue `npm ci`, ESLint et `npm run build`
  avec TypeScript/Vite ; consulter le run final du SHA exact.
  Un échec initial d'assertion statique UI sur
  `SUBNATIONAL` a été corrigé par affichage explicite
  des catégories PARTIAL_COUNTRY vs SUBNATIONAL.
- Journal honnête des premières corrections :
  1. assertion statique zéro-grant CI inexacte ;
  2. migration V7 tronquée par substitution littérale
     au caractère `$` — **reconstruite sur original intact**
     et rejouée Flyway ;
  3. service transactionnel final et controller method
     validation final non compatibles proxy Spring CGLIB ;
  4. catégorisation UI SUBNATIONAL pas assez explicite.
  Aucun de ces échecs n'a altéré une base réelle ;
  les tests échoués sont traçables dans Actions.

### 5. NON-OBJECTIFS / no-go de sécurité et promesse produit
- Aucune mesure réelle de l'Insee publiée dans Vercel,
  une API publique effective, une vraie préproduction
  connectée ou un média vidéo.
- Aucune licence exacte de jeu Insee ni permission
  commerciale enregistrée et doublement signée par
  un reviewer humain authentique dans la base.
- Aucun archivage Bronze institutionnel durable en
  stockage privé avec sauvegarde et restauration ;
  les fichiers sources réels lus dans P2C3B ont
  été détruits par le runner à la fin du test.
- Aucune rotation/révocation des clés de confiance
  #94 ni identité du parseur attestée #95 effectivement
  intégrées à une vraie source.
- Aucun navigateur réel connecté à la nouvelle route
  testant une révocation en direct **tant que ce test
  supplémentaire n'est pas effectivement exécuté**.
  Ne pas confondre avec le P2C2 mobile réel prouvé auparavant
  pour l'ancienne route nationale.
- Aucun merge de DRAFT PR, déploiement public, dépense
  VPS, modification d'URL utilisateur, ni revendication
  d'alimentation statistique des 217 pays et territoires.

### 6. Prochaine tranche à plus forte valeur après les tests CI
**A. Tester la vraie UX mobile et la révocation via Gateway** :
Chrome 320/390/1440 sous vraie DB et nouvelle route signée,
aucun fixture de GET dans le navigateur ; capture explicitement
SYNTHETIC ONLY et fermeture au nouveau droit révoqué.

**B. Vérifier dossier précis de licence du dataset Insee** :
page du jeu `DS_POPULATIONS_REFERENCE`, politique
`https://www.insee.fr/fr/information/2008466`,
éventuelles exceptions, attribution « Source : Insee »
et date réelle, périodes PTOT/PMUN, géographie FEHM,
licéité de redistribution API/web, signatures humaines
distinctes et journal de décision. Une licence générale
open-data ne constitue pas une signature de la politique
interne de World-Vision.

**C. Installer un journal d'archivage privé DURABLE**
des OCTETS originaux des deux GET Insee (stat + catalog),
immutabilité, sauvegarde et restore, clefs hors GitHub ;
éviter de publier les données ou des sources dans les
logs, issues ou artefacts public GitHub.

**D. Débloquer très étroitement l'INGESTION sous droits** :
ne pas contourner la V6 `ProtectedSourcePublicationGate`.
Permettre seulement un lot réel scope-aware source-verified
sur staging HTTPS authentifié après A/B/C,
avec rollback, revocation DB + DOM Chrome,
puis revue séparée de promotion vers le site public.
Aucun coût d'infrastructure non approuvé.

**E. Ensuite** internationalisation : contrat similaire
sources nationales Gabon INSTAT/BEAC, puis Afrique,
Europe, Asie, Amériques, Océanie. Médias, GDELT,
onze Visions, Watch/Money/Trading/Price/Tourisme
restent dans le plan général sans perdre le fil.

### 7. Pour reprendre immédiatement dans un nouveau chat
1. Lire cette note et PR #115, vérifier ses tout derniers
   runs `whv-v2-p2c3c2-scoped-signed-revocable-read.yml`.
2. Lire issue #114, issue #112, PR #113 + rapport P2C3C.
3. Lire PR #111 dossier Insee FEHM, PR #108 Insee original
   recherche privée, PR #106 signature navigateur P2C2.
4. Lire PR #95 (parseur) et issue #94 (clefs et révocation).
5. Lire `HANDOFF_CORE_F12B_2026-11-19.md` et issue
   #68 (site public Vercel déconnecté).
6. Ne pas confondre code commit, test vert, licence
   fournisseur, signature humaine, valeur réellement
   publiée, préproduction authentifiée et déploiement public.
