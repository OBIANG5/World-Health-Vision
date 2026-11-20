# WORLD-VISION — PRODUCT-P2C1 : exploration réelle des indicateurs publiables
Date : 20 novembre 2026. Dépôt : OBIANG5/World-Health-Vision.
Branche : product/v2-p2c1-published-indicator-discovery-2026-11-20.
PR #102 DRAFT sur #101, puis #100 P2B, #99 P2A et #97 P1.
Code source canonique worldhealth-vision-v2/. NE PAS TOUCHER main/V0/V1 ni merger par lot.

## 1. Décision métier et valeur internationale
P1 montrait combien d'observations existent réellement dans une base, sans permettre
au visiteur de voir les indicateurs publiables. P2C1 ferme cet écart : dans Atlas,
choisir pays → voir UNIQUEMENT les indicateurs réellement éligibles à la lecture
publique → en choisir un → vérifier les dernières observations PAR SOURCE, avec
unité/période/mesure-vs-estimation/date et informations de méthode/licence.
Les 217 pays géographiques et les sources du catalogue ne sont PAS 217 pays de données
vivantes. Bilingue FR/EN et lisible depuis un iPhone. Conserver globe et onze Visions.

Cette tranche n'exige aucun nouveau microservice, aucune source commerciale ni VPS.
Elle réutilise Timeseries/latest_observation, Catalog, Gateway et le frontend existant.
Ratio stratégique : parcours utiles 45 %, données/sources 30 %, sécurité/infra
bloquante 15 %, QA/performance/docs 10 % (objectifs, pas exemptions légales).

## 2. Livrables exactement codés
A. **Java + PostgreSQL + Gateway** :
- Nouveau GET /api/timeseries/countries/{iso3}/published-indicators?limit=100.
- DTO CountryPublishedIndicatorResponse : code, libellé, compte d'observations
  réellement publiables, observed/estimated séparés, nombre de sources,
  dernière période de référence.
- Requête JDBC UNIQUEMENT sur timeseries.latest_observation filtrée par droits
  signés, révocations et témoins Bronze ; jamais compter catalog.indicator seul,
  ni observation brute, ni source_run.record_count. Filtre OBSERVED/ESTIMATED
  et valeur numérique ou textuelle non NULL.
- LIMIT paramétré borné 1–500 ; ordre période décroissante/code déterministe.
  Un nombre de résultats limité n'est PAS la couverture totale ; la couverture
  totale est exposée séparément par P1.
- Validation ISO3 via service, nouvelle route GET précise dans PublicReadRoutes.
  Aucun élargissement de wildcard ou écriture publique.

B. **Frontend React/Vite Atlas** :
- PublishedIndicatorExplorer.tsx monté seulement lorsque la couverture
  PUBLISHED_DATA_AVAILABLE (vraie réponse serveur) est confirmée.
- Liste d'indicateurs réels, sélection VOLONTAIRE d'un indicateur, puis GET
  /api/timeseries/series/latest (pas de cache), GET Catalogue indicateur
  (unité et note méthodologique) et source sélectionnée sur demande
  (licence NOTÉE AU CATALOGUE, limites, qualité et URL HTTPS documentaire).
- Dates sourcePublishedAt et fetchedAtUtc conservées séparées, OBSERVED/ESTIMATED
  non confondus, nombre de sources réellement comptées.
- Défaillance d'un service = indisponible/non vérifiable, JAMAIS zéro inventé.
  Pas de source ni d'indicateur présélectionné, contrôle des codes/structures
  JSON côté frontend et exclusion des SUPPRESSED/MISSING/null.
- CountryLocalEvidencePanel rafraîchit la couverture sur focus et
  visibilitychange ; l'explorateur rafraîchit sa liste et ses détails
  sans garder les anciennes valeurs pendant une revalidation. L'utilisateur
  dispose également d'une action explicite pour revérifier.
- CSS mobile accessible avec focus visible, largeur 320px, retours à la ligne,
  label source/méthode lisibles, respect de la navigation Atlas et du choix
  des sources nationales UX-1B1.
- Les précautions affichent clairement qu'une licence mentionnée au catalogue
  N'EST PAS une autorisation de revente, de redistribution ou d'exploitation
  commerciale universelle.

## 3. Commits, code et régressions
- 8197704ce7b7cac6592d184b57a389e00c2c037f : route API, DTO, SQL,
  service et Gateway.
- 031cf09c2e06626658be83ebf1ee486a98d22355 : tests droits, révocation,
  V1 non attesté, limite, ISO3, Gateway et workflow Java.
- 85bfe759d1fc816cf854502abecde845dac42dce : explorateur réel, API TypeScript,
  styles et connexion dans le panneau national.
- e96cb6af2035bf86f65bc1ca99b3057ee5c926e2 : CI frontend strict.
- 9036756af361cae6c87a15654b81bcb5d2c35801 : révalidation couverture au focus.
- 55d41c86b392a595cf4254224bb546ea15069ba0 : test navigateur SYNTHETIQUE
  (sélection, unités, dates, limites, disparition après révocation simulée).
- 9b6a4dadce66b5d3afb02d5942f9e78e4be6a8e9 : CI navigateur 320/iPhone/desktop
  et artefacts, SANS publication de fixtures.

## 4. Preuve vérifiée sur le HEAD de CODE
GitHub Actions https://github.com/OBIANG5/World-Health-Vision/actions/runs/44731981979
sur SHA 9b6a4dadce66b5d3afb02d5942f9e78e4be6a8e9 : **SUCCESS**.
Java21/Flyway/PG16 : 33 tests Timeseries PASS, 46 Gateway PASS.
Frontend : TypeScript, Vite production, ESLint des fichiers changés PASS.
Chromium : PASS "small-mobile" 320px, "iphone" 390px et "desktop" 1440px ;
valeur DEMO choisie, unité/méthodologie/source/licence cataloguée,
disparition de la valeur après relecture d'une révocation SYNTHÉTIQUE.
Artefact QA `worldvision-p2c1-synthetic-indicator-mobile-qa` id
14626323587 : six captures (avant et après pour trois écrans).

**Ne pas confondre preuves :** le backend Java/PostgreSQL teste droits signés
et révocations réelles dans DB de CI ; le navigateur QA injecte sa valeur
synthetique UNIQUEMENT à la frontière fetch pour contrôler l'interface.
Il n'existe PAS ENCORE un test UNIQUE navigateur→Gateway→grant/signature→
observation→revocation. C'est précisément PRODUCT-P2C2.

## 5. Points critiques, non réalisés, pas de fausses victoires
- Pas de donnée fournisseur IBGE/WDI autorisée à la publication commerciale,
  pas de licence nouvelle, pas de chiffre Gabon réel injecté par le test.
- Pas de staging Internet, aucun Vercel public modifié, aucun achat ou compte
  créé, aucune fusion v2. Le site public existant est un ancien snapshot ;
  issue #68.
- Des vues Analytics existantes utilisent encore des caches frontend courts
  (histoires, overviews, rangs), séparés de cet explorateur sans cache.
  Auditer leur politique de révocation avant de considérer tout le site comme
  garanti à l'instant T ; faire converger sans dégrader les performances.
- PR #95 (signature de l'identité du parseur V2) et issue #94 (gouvernance
  des clés/revocation) restent NON fusionnées. Ne pas attribuer un statut
  commercial sur la foi d'un test synthétique.
- Tester aussi la comparabilité scientifique : recensements et estimations
  même année ≠ deux preuves indépendantes ni deux périmètres équivalents.

## 6. Reprise exacte — P2C2 puis P2C3
**PRODUCT-P2C2 (prochain chantier à valeur maximale)**
1. Sur branche issue de la PR #102, créer un test éphémère et STRICTEMENT
   synthétique dans la vraie stack : fixture source/évidence Bronze, empreintes,
   preuve Ed25519 indépendante test-only, revue de permission publique
   synthétique, ingestion en base (aucun droit IBGE/WDI).
2. Démarrer la pile existante de six services + vrai frontend via proxy
   same-origin CI (héritage P2B) ; voir le nouvel indicateur/valeur dans
   CountryPublishedCoverage et PublishedIndicatorExplorer sur navigateur réel.
3. Révoquer la permission EN BASE pendant le test ; vérifier dans le même
   navigateur que couverture, liste, dernière valeur et comparaison publique
   redeviennent absentes/indisponibles sans données obsolètes.
4. Tester erreurs 401/403/503, migration Flyway, méthode/limites,
   FR/EN, 320 px iPhone, source non privilégiée, mesure performance réelle,
   références SHA/captures. Aucun simulateur à la place de la DB.
5. Examiner les migrations et contrats de PR #95/#94 pour bloquants
   strictement nécessaires avant mise en ligne ; ne pas prolonger
   inutilement une nouvelle sous-architecture de preuves.

**PRODUCT-P2C3 / staging privé**
6. Choisir une vraie source dont les opérations prévues sont explicitement
   permises, provenance et méthode tracées ; une seule première série
   légitimement exploitable d'abord, puis INSTAT/BEAC Gabon et corridors mondiaux.
7. Préproduction HTTPS privée noindex avec identité, secret hors GitHub,
   backup/restore, observabilité, coût détaillé, URL et rollback.
8. Revoir les PR empilées par dépendances, ne PAS merger médias/voix/GDELT
   mécaniquement. Préserver onze Visions, Money/Watch, tourisme/transport,
   Price, Trading/BRVM, stratégie de revenus et déploiement iPhone.
9. Promotion du site Vercel public seulement après validation et décision
   spécifique ; `READY` sur le vieux frontend ne signifie pas backend live.

## 7. Point de reprise multi-chat
Lire d'abord ce document, PR #102, son HEAD/CI, issue #96, PR #101 (sécurité
des comparaisons), PR #100 (six services + vraie UI), PR #99, PR #97, le document
HANDOFF_CORE_F12B_2026-11-19.md, PR #95/issue #94, issue #68 Vercel.
Chaque étape doit conserver preuves, limites, coûts, SHA, décisions, réversibilité.
