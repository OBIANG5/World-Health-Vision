# WORLD-VISION — PRODUCT-P2C2 : ingestion SYNTHETIQUE signée dans les vrais six services et Atlas
20 novembre 2026. Branche `product/v2-p2c2-signed-live-atlas-revocation-2026-11-20`.
Dépôt `OBIANG5/World-Health-Vision`, racine canonique `worldhealth-vision-v2/`.
PR #106 DRAFT https://github.com/OBIANG5/World-Health-Vision/pull/106, issue #103.
Base PR #102/P2C1 → #101/P2C0 → #100/P2B → #99/P2A → #97/P1.
**Aucun merge v2/main, aucun déploiement Vercel, aucun VPS ou coût d'hébergement approuvé.**

## 1. Objectif PRODUCT : au-delà de tests isolés
Faire fonctionner, dans UNE SEULE exécution GitHub Actions : deux signataires d'une
preuve de source SYNTHETIQUE, un droit restreint et révocable, le serveur
Timeseries d'ingestion sécurisé, PostgreSQL16/TimescaleDB, la Gateway GET
publique filtrée, le catalogue et le vrai frontend React/Atlas sur iPhone.
Puis retirer le droit EN BASE pendant que le même navigateur est ouvert et
vérifier que la valeur disparaît des APIs publiques et de l'interface.
Cela fait progresser le produit international par un parcours utile, sans
réécrire les moteurs déjà avancés.

## 2. Code exact et provenance
- `infra/tests/p2c2_signed_fixture.py` : générateur test-only exécuté dans
  le runner CI avec `cryptography` et la projection de source existante
  `ingestion_service.evidence_items_fingerprint.items_sha256`.
  Crée DEUX clés Ed25519 distinctes EN MEMOIRE (reviewer et témoin Bronze) ;
  ne sauvegarde JAMAIS les clés privées, seulement leurs DER publics.
  Produit des octets raw, normalized, manifest, journal exclusivement
  synthétiques ; vérifie correspondance raw→normalized, empreintes SHA256,
  empreinte typée de la valeur/métadonnées/flags Python↔Java et signatures
  via une seconde invocation `verify`.
- Les décisions `PUBLIC_API_INGEST` sont **artificielles, limitées au dossier
  CI**, signées cryptographiquement mais ne sont NI un droit de fournisseur
  NI une revue humaine indépendante autorisant une donnée commerciale.
- Source `WHV_SYNTHETIC_QA`, dataset `WHV_CI_DEMO`, indicateur
  `SYNTH.P2C2.QA`, pays d'essai GAB, valeur fictive 17.0 « CI test units »
  de la période 2024, citation et méthode explicitement NON OFFICIELLES.
  Les enregistrements Catalog sont insérés UNIQUEMENT dans une DB de CI jetable
  via SQL, mais l'observation canonique doit être insérée UNIQUEMENT par la
  véritable API privée d'ingestion avec signatures valides.
- `infra/tests/compose.ci-synthetic-rights.yml` complète les DEUX overlays
  existants avec clés PUBLIQUES de confiance et token privé éphémère.
  Compose conserve JWT activé, Gateway uniquement 127.0.0.1, PostgreSQL et
  services internes sans ports publiés. Token transport masqué GitHub Actions,
  aucun secret dans le navigateur, README, les commits ou artifacts.
- `frontend/web-v2/p2c2-signed-live-browser.mjs` vérifie le vrai Atlas compilé
  SANS interception de fetch, SANS fixture de catalogue : indicateur choisi
  volontairement, unité/valeur/période/source/conditions de CI, iPhone 320 et
  390 px + desktop 1440 px. Vérifie Gateway `published-coverage`,
  `published-indicators`, `series/latest`, `compare/countries/latest`,
  source-runs anonyme 401, FRA/BRA absentes de CETTE BASE de test.
  Révoque via `docker compose exec ... psql` en dehors de React, puis attend
  la disparition effective dans le même onglet iPhone. Vérifie enfin que
  l'observation brute RESTE conservée (forensic), contrairement à la vue publique.
- Workflow : `.github/workflows/whv-v2-p2c2-signed-live-atlas-e2e.yml`.
  GitHub Actions : compilation frontend, génération test-only des clés,
  vérification du manifeste/test witness, 6 services + Flyway, prépublication
  vide, droits synthétiques, tests négatifs clé incorrecte et contenu altéré,
  POST vrai et réponses Gateway, browser avant/après retrait, nettoyage
  conteneurs/volumes et destruction de toutes les preuves temporaires.
- Commit initial `e274c7e96a96717ee7a9591917a97ba627a5711f` signer + overlay,
  `5546fedacc1f499e7a62376fdc10ac0fc30b78a3` navigateur,
  `49fe188c530d59f796eae1117cf4bb39d5ad39bf` workflow complet,
  `49f45e89af16f66131a925acb8a625218886dcdb` robustesse Chrome.

## 3. Preuve GitHub Actions : marquer le statut EXACT
- Premier run : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44769022804
  sur code SHA `49fe188c`. **Étapes vérifiées SUCCESS** :
  génération/relecture deux clés, build frontend, 6 services/port isolation,
  zéro avant, insert du reviewer CI en DB, refus mauvais token, refus valeur
  signée altérée, POST accepté par vrai serveur Timeseries, lecture de UNE
  observation SYNTHÉTIQUE via Gateway, source-runs privé refusé 401.
  Le téléchargement initial du navigateur Chromium s'est montré très lent ;
  **ne pas conclure l'E2E navigateur tant que le job ne termine pas**.
- Second run (optimisé) :
  https://github.com/OBIANG5/World-Health-Vision/actions/runs/44770455822,
  code SHA `49f45e89`. Le runner utilise Chrome système s'il est utilisable,
  sinon un headless-shell Playwright dont le téléchargement est borné à 240 s.
  Vérifier la CONCLUSION FINALE et les étapes `same iPhone`, `forensic`,
  screenshots avant toute mention de réussite intégrale.
- L'outillage browser peut être indisponible temporairement et cela ne doit
  ni masquer les vérifications backend ni entraîner une simulation de la DB.
  Si fail : obtenir journaux post-exécution, corriger proprement et redémarrer
  la CI. Il est INTERDIT de remplacer les réponses par des mocks pour faire
  croire que la révocation réelle a passé.

## 4. Portée et garde-fous explicites
- Test signé ≠ preuve de licence réelle ; le générateur « public » CI n'a pas
  de contrôle externe de fournisseur ni de séparation organisationnelle.
  `private_bronze_witness.py` prévu pour les recherches IBGE/WDI reste
  `PRIVATE_RESEARCH_VALIDATION` ; il n'a PAS été modifié, étendu ou contourné.
- Numéro 17.0 fictif et source WHV_SYNTHETIC_QA non officielle ; jamais exportée
  en production ni utilisée pour inférer la démographie du Gabon.
- PR #95 (attestation identité du parseur Ed25519 V2) et issue #94
  (trust registry et révocation des clés/parseurs) non fusionnées ;
  juger ce qui bloque impérativement le premier dataset REAL avant release.
- P2C1 Explorer reste non-caché pour les droits, mais les autres panneaux
  historiques/Analytics utilisent parfois des caches : auditer ces chemins
  avant de promettre une révocation globale instantanée sur tout le logiciel.
- Les 217 pays du globe ne sont PAS 217 pays de données statistiques actives.
  Médias, GDELT, Watch, Money, transport/tourisme, Price et Trading/BRVM
  restent branches/visions du projet ; ne pas fusionner sans revue.

## 5. P2C3 : première vraie série sous droits
Issue #107 : https://github.com/OBIANG5/World-Health-Vision/issues/107 .
Candidat **à auditer, PAS encore ingéré ou licencié spécifiquement** :
Insee / API Melodi. Source officielle :
https://www.insee.fr/fr/information/8184173 et
https://www.insee.fr/fr/information/1302169?question=comment-utiliser-l-api-melodi .
L'Insee décrit le catalogue statistique sous Licence Ouverte et une API
accessible sans souscription, quota anonyme 30 requêtes/minute. Mais pour
`DS_POPULATIONS_REFERENCE` : confirmer l'URL et les filtres réels, la période,
la définition de GEO `FRANCE-F`/FRA, la méthode, le statut de confidentialité,
l'unité, l'attribution, les exceptions et les opérations autorisées (affichage
Web, API, redistribution, dérivés, commercial) ; ne pas déclarer qu'une page
générale autorise une statistique particulière sans revue humaine.
Pas de publication avant attestation de vraies preuves Bronze et revue
spécifique signée, version du parseur, politique d'expiration/révocation.

## 6. Prochaines étapes intelligentes
1. FINALISER le test vrai iPhone→Gateway→DB et la révocation (SUCCESS du SHA
   exact, captures et logs, ou bug clairement documenté).
2. Introduire **un seul jeu de données officiel** sous droit analysé
   précisément, pas une centaine de connecteurs fictifs.
3. Vérifier le pipeline réel HTTP→raw Bronze→parser revu→témoignage
   indépendant→review licence→Timeseries→Atlas ; méthode/unité/date
   visibles, comparabilité scientifique sans faux classement.
4. Traiter la révocation des clés/parseurs et caches sur tous les panneaux,
   sauvegarde-restauration, changements de schémas et reprise d'incident.
5. STAGING privé/noindex, HTTPS, auth, secrets hors Git, coût mensuel chiffré
   avant toute ressource payante, URL vérifiée sur iPhone/Safari/Chrome ;
   jamais l'ancien Vercel READY comme preuve du backend connecté.
6. Revue et consolidation de la pile de PR DRAFT par lots sûrs, puis
   publication publique sur décision distincte et extension pays par pays
   selon données vérifiées/permises. Ne jamais sacrifier médias et Visions.

## 7. Reprise dans un nouveau chat
Lire dans cet ordre : ce document, PR #106, runs #44769022804/#44770455822,
issue #103, issue #107, PR #102/#101/#100/#99/#97, HANDOFF_CORE,
PR #95/issue #94 et issue #68 Vercel. Contrôler la dernière CI et SHA.
Ne pas confondre « source catalogue », « données présentes », « droits
PUBLIC_API_INGEST synthétiques CI », « licence institutionnelle réelle »,
« environnement CI » et « site public international ».
