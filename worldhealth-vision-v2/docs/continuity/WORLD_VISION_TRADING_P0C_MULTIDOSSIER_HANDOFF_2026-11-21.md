# World-Vision V2 — TRADING-MTA P0C : checkpoint précis, non fusionné
**21 novembre 2026, 12 h (Europe/Paris).** Ce checkpoint est un état à **vérifier sur le SHA de HEAD** et non une promesse de livraison.
**Ligne de développement** : `v2` → PR #115 (Atlas source-native signé) → PR #120 (Trading-MTA P0/P0B) → **P0C, branche `product/v2-trading-mta-case-library-v1-2026-11-21`**.
**Ne pas fusionner dans main ni exposer publiquement le logiciel sur la base des tests synthétiques seuls.**

## 1. Pourquoi ce chantier, et pourquoi le découper ?
Le propriétaire a précisé explicitement que « trading service » signifie **les outils du cours et du service DataAnalyse du professeur, reproduisant tout le processus de décision**, pas seulement un tableau de bord Forex. Le produit doit être international, pluraliste quant aux sources, vérifiable, et utile aux traders dans chaque étape. Cours MTA et analyses DataAnalyse sont des **références privées** : NE JAMAIS recopier leurs PDF/captures/vidéos/analyses payantes dans ce dépôt public ou attribuer nos fonctionnalités au professeur sans preuve.

Le module P0/P0B de #120 comportait déjà :
- Processus d'analyse en 7 étapes avec exception technique, price action, R max monétaire et ratio directionnel, registre de sources ; route `?wv=trading`.
- **Suivi longitudinal des thèses** : snapshots des hypothèses/prix/attentes au moment de la note, motif, révision, acceptation du non-trade.
- **Annonce économique avant/après** : attentes originales datées et sourcées, prévision ex ante vs reconstruction rétrospective clairement différenciées, résultats et réaction saisies par l'utilisateur, delta numérique **seulement après confirmation de comparabilité** (mêmes indicateur, territoire, période, unité, définition).
- FR/EN, responsive 320/390/1440, JSON, test réel Chromium, sans prix live ni exécution.
- **PREUVE** : les deux workflows du commit `a6fcbb83c60d3a8f3ce9c27e61c97653ae007d49` PASS, dont https://github.com/OBIANG5/World-Health-Vision/actions/runs/44898653080 (Node tests, lint des changements, TS/Vite, vrai Chromium 320/390/1440). Captures de test SYNTHÉTIQUES conservées en artifact `trading-mta-synthetic-browser-evidence` (255209 octets), pas données utilisateurs.

## 2. P0C — plusieurs thèses au lieu d'un seul brouillon
Un trader suit simultanément plusieurs paires/actifs, plusieurs scénarios et plusieurs annonces. L'ancienne sauvegarde `localStorage[world-vision:trading-mta-process:v1]` écrasait systématiquement le dossier précédent. **C'est un obstacle concret à l'utilisation**, avant même toute intégration de marché.

P0C travaille sur branche séparée et **PR empilée sur #120**, pour préserver un jalon vert.
- `src/trading/tradeCaseLibrary.ts` : bibliothèque locale v2 versionnée, `SavedTradeCase` {id, titre, createdAt, updatedAt, plan}, import strict, origine et dates de sources, 30 dossiers max, plafond par import 250k caractères et bibliothèque 1,8M caractères, refus de corruption / IDs doublons / réécriture de date de création / capacité; aucune suppression automatique.
- `src/components/layout/TradingCaseLibrary.tsx` : **enregistrement manuel** avec titre, bibliothèque sur action, ouvrir, dupliquer, supprimer avec confirmation, nouveau dossier, importer/exporter JSON, récupérer l'ancien brouillon **uniquement sur clic** et sans effacer son original, gérer conflit de version externe et stockage corrompu (export des octets bruts avant réinitialisation volontaire). Détecter les changements entre onglets. Aucune auto-charge au démarrage.
- `src/components/layout/TradingProcessPanel.tsx` : remplacement de l'ancienne zone « brouillon unique » par la bibliothèque intégrée à la fenêtre existante, sans briser navigation ni parcours.
- `src/styles/trading-process.css` : affichage responsive.
- `scripts/test-trade-library.mjs` : tests de séparation des dossiers, import legacy, rejet URLs dangereuses/corpus malformé, capacité, écriture isolée.
- `scripts/trading-process-browser-smoke.mjs` : parcours navigateur P0B préservé, étendu à la création/enregistrement de deux thèses, reload sans lecture implicite, ouverture de la première avec historique/annonces, duplication et vérification de 3 dossiers indépendants.
- `package.json` : `npm run test:cases`; `.github/workflows/whv-v2-trading-mta-process.yml` étendu au pattern `product/v2-trading-mta-*`, avec tests métier + bibliothèque, eslint de tous les nouveaux fichiers, compilation, Chromium et artifacts.

### Limites qu'il ne faut JAMAIS masquer
- `localStorage` reste non chiffré et local à l'appareil, effaçable par le navigateur, non synchronisé, non garanti entre navigateurs. Conserver des données financières personnelles/confidentielles y est déconseillé. Aucune identité, compte, authentification, alerte push, historique serveur ou conformité broker.
- Les horodatages sont issus de l'horloge locale du navigateur. Ils structurent le travail mais ne prouvent ni le `known_at` historique ni la diffusion véritable d'une annonce. L'utilisateur choisit et saisit les sources ; l'outil ne les certifie pas.
- Nombre de producteurs originaux indiqués dans le registre ≠ indépendance réellement vérifiée ; consensus déclaré ≠ vérité ; pas de flux d'actualité/cours sous licence.
- `npm run lint` global du frontend a **28 erreurs héritées** dans d'autres modules. Gate bloquant lint des nouveaux fichiers, tests et build ; dette globale doit être résolue dans chantier distinct.
- Ancien brouillon v1 n'est **ni écrasé ni supprimé** par P0C. Seul l'utilisateur peut importer/sauvegarder dans la bibliothèque.
- Les progrès P0C ne valent **pas une preuve de production**. Aucun achat VPS, données, partenariat, publication, merge ou Vercel.

## 3. ACTION IMMÉDIATE SI CETTE CONVERSATION BLOQUE
1. Ouvrir les PR **#120** et **P0C** (numéro dans la PR créée après ce document), lire les commits HEAD exacts. Si P0C n'a pas encore de PR, la créer **en DRAFT avec base `product/v2-trading-mta-datanalyse-process-v1-2026-11-21`**, pas `v2`.
2. Lire l'issue **#119**, décision multi-sources **#117** et `docs/product/TRADING_VISION_MTA_DATANALYSE_PROCESS_PRODUCT_HANDOFF_2026-11-21.md`.
3. Inspecter `GET /actions/runs?branch=product/v2-trading-mta-case-library-v1-2026-11-21`. **Ne pas confondre succès du commit P0B avec celui du commit P0C**. Télécharger les logs du job raté si échec ; corriger les fichiers et les tests jusqu'au workflow vert sur HEAD.
4. Vérifier le **vrai navigateur** 320 / 390 / 1440 : ajout sources, risque 3:1, 2 thèses, dossier #1 qui conserve historique et résultat daté, duplicata #3, JSON import/export, sauvegarde volontaire et absence d'autocharge après reload. Vérifier import legacy v1, stockage corrompu et suppression sur cas tests.
5. **Compléter ici le SHA HEAD final + les URLs des runs après succès**, actualiser l'issue #119 et la PR. Documenter les limitations/échecs sans les cacher.
6. Garder P0C en DRAFT tant que #120 et #115 ne sont pas passés par revue, integration RC et staging. **Ne pas fusionner des centaines de commits aveuglément.**

## 4. Suite la plus intelligente après P0C
**P1 : persistance versionnée par utilisateur sur backend V2** (API, JWT scopes, multi-tenant, migrations, sauvegarde, RGPD, droit à l'effacement/export, contrôle des concurrents, secrets, journal append-only, retention). Ne pas inventer un 7e microservice : étudier Catalog/Timeseries/Analytics/Gateway et l'auth existante, puis architecturer le domaine TradeThesis/Revision/EventExpectation avec validation. Démonstration : deux appareils reconnectent au même compte et voient la même thèse, un autre compte ne peut pas la consulter.

**P2 : vrais outils DataAnalyse-style originaux** — briefing journalier/hebdo/mensuel, calendrier macro avec consensus **historisé avant** publication, annonce/révision/surprise, huit économies et 28 paires, thèse et scénario consultables. Sources officielles et analyses divergentes, licences préalables; les exemples historiques restent historiques.

**P3 : outils complets du cours** — graphiques multi-timeframes à données datées/licenciées, interconnexions, rendements/indices, retail/COT avec périodes, risque sous contrat broker exact, gestion, journal R évolutif. **P4 : Watch** transversal durable. **P5 : backtest sans futur ni ordres fantômes**, compte démo avec autorisation/risque avant toute perspective d'ordre réel. Price/Panier non prioritaires, préserver la feuille de route internationale Atlas, Money, Tourisme, Global Radar et BRVM.

## 5. Pointeurs rapides
- Branche P0C : https://github.com/OBIANG5/World-Health-Vision/tree/product/v2-trading-mta-case-library-v1-2026-11-21
- PR P0/P0B (verte et DRAFT) : https://github.com/OBIANG5/World-Health-Vision/pull/120
- Issue métier : https://github.com/OBIANG5/World-Health-Vision/issues/119
- Handoff complet : `worldhealth-vision-v2/docs/product/TRADING_VISION_MTA_DATANALYSE_PROCESS_PRODUCT_HANDOFF_2026-11-21.md`
- Workflow : `.github/workflows/whv-v2-trading-mta-process.yml`


---

## 6. Validation complète du lot P0C — première preuve sur SHA exact

**Commit vérifié (avant le présent ajout documentaire)** : `bb981ee8fbdca598cc98aef0f3a408fcc84bdfd8`.
**CI** : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44899312628 — **SUCCESS**, GitHub Actions entièrement terminé. 
Même commit sur le workflow push #44899285669 : vérifier la conclusion indépendamment, ne pas la supposer à partir de l'autre run.
**PR empilée** : [#121](https://github.com/OBIANG5/World-Health-Vision/pull/121), DRAFT basée sur [#120](https://github.com/OBIANG5/World-Health-Vision/pull/120) (elle-même DRAFT, base #115). **ZÉRO fusion, ZÉRO déploiement public**.

Sur ce SHA :
- `npm run test:trading` — PASS ;
- `npm run test:cases` — PASS ;
- ESLint ciblé sur les sources TS/JS du lot — PASS (lint **global** toujours en dette) ;
- `npm run build` TypeScript strict/Vite — PASS ;
- vrai Chromium sur **320/390/1440 px** — PASS : parcours initial MTA/risque/sources/annonces, sauvegarde de deux dossiers indépendants, reload **sans autochargement**, ouverture d'un dossier conservant ses révisions/annonces, duplication indépendante d'un troisième dossier, export JSON et fermeture de la route.
- Captures synthétiques sans données fournisseur ni contenus payants dans l'artifact Actions `trading-mta-synthetic-browser-evidence` (**238 396 octets** au run 44899312628).

**Attention au SHA** : toute nouvelle modification, y compris ce paragraphe, génère un NOUVEAU commit et doit être évaluée à part. Ne jamais écrire « CI verte sur le HEAD final » avant d'avoir consulté le dernier workflow correspondant.

## 7. P1 — contrat de produit : recherche privée synchronisée par compte

### 7.1 Audit de l'architecture existante vérifié sur cette branche
- `services/gateway-service/.../security/GatewaySecurityConfiguration.java` : en mode sécurisé, les routes anonymes sont expressément filtrées et **toutes les routes non listées sont `denyAll()`**. Seule la requête privée `POST /api/analytics/advisor/chat` dispose d'une règle `SCOPE_advisor:invoke`. Donc **un nouveau endpoint privé Trading ne fonctionne pas automatiquement, même avec un JWT signé**.
- `services/gateway-service/.../security/PublicReadRoutes.java` : uniquement une liste explicite de GET publics Atlas, stats/analytics/produit. **Ne jamais y ajouter `/api/trading/**`**, même une liste de dossiers : les métadonnées sont privées.
- `services/analytics-service/src/analytics_service/runtime.py` : l'Analytics Python connu est construit autour des clients Catalog/Timeseries ; **ne prétendre ni qu'il possède un stockage de dossiers, ni qu'il a déjà une isolation multi-tenant**.
- L'interface `UserProfileContext` actuelle ne constitue **pas** une authentification unifiée : le navigateur P0C ne se connecte à aucun backend pour ses dossiers.

**Décision P1** : avant tout nouveau backend, auditer quelles capacités existantes permettent la lecture/écriture privée et l'identité bout-en-bout. Comparer l'extension d'un service approprié (avec schéma **strictement privé**) à un service « Research Workspace » dédié ; **ne pas décider d'un 7e service par inertie**, ni mettre les dossiers dans les tables d'observations publiques de Timeseries. Le bon critère est la sécurité prouvée et le coût opérationnel mesuré, pas le nombre de services.

### 7.2 API contractuelle à construire puis revoir
Propositions de routes réservées au Gateway sécurisé, non encore implémentées :
- `GET /api/trading/cases?cursor=...&limit=...` : dossiers **du principal authentifié**, pagination et filtres autorisés.
- `POST /api/trading/cases` : création, idempotence, quotas et validation métier, jamais d'owner ID dicté par le client.
- `GET /api/trading/cases/{caseId}` : document privé; une autre identité reçoit 404 (pas de leak).
- `PUT /api/trading/cases/{caseId}` : `If-Match`/version obligatoire, sinon 428; version obsolète 412/409 sans écrasement.
- `GET /api/trading/cases/{caseId}/history` : révisions append-only et snapshots; distinguer temps de saisie (client) et timestamp serveur.
- `DELETE /api/trading/cases/{caseId}` : export préalable proposé, effacement effectif selon politique, contrôle d'accès.
- `POST /api/trading/cases/import` : migration **sur demande uniquement** depuis JSON P0C, détection conflits et duplications, aucune ingestion des cours payants.

JWT : identité dérivée des **claims authentifiés** (`iss`/`sub`/`aud` et permissions serveur), pas d'un header client arbitraire ni d'un champ `owner` posté ; Gateway doit vérifier signature et audience. Décider explicitement d'une portée `SCOPE_trading:read` / `SCOPE_trading:write`, tests négatifs systématiques. Ne jamais faire confiance au frontend pour empêcher l'accès aux ressources d'un autre utilisateur.

Stockage : schéma isolé du catalogue/Timeseries public ; tables `trade_case`, `thesis_revision`, `event_preparation`, `event_outcome`, `evidence_reference` et `user_data_export` selon découpage vérifié. Index par principal et dossier, séquences transactionnelles, cap des annexes/sources, migrations et rollback, sauvegarde chiffrée/restauration vérifiée. Refuser les vues/liaisons accidentelles permettant de publier `trade_case` comme une statistique publique.

### 7.3 Critères de sortie bloquants P1
- Deux **principaux distincts** avec JWT valides et deux appareils : A crée, A récupère après reconnexion; B ne voit ni dossier ni existence ni historique de A.
- 401 sans token, 403 sans scope, 404 cross-tenant, requête sans version rejetée, conflit de révision rejeté; `PublicReadRoutes` ne change pas, aucune ouverture anonyme via configuration.
- Portabilité : import du JSON local v1/v2 et export réversible avec données/horodatages et étiquettes de provenance; migration explicite/consentie, contrôle des collisions; ancien stockage local intact jusqu'au choix de l'utilisateur.
- Limitation : quota par utilisateur, pagination, entrées volumineuses, absence de copies/licences DataAnalyse, pas de secrets en logs. Audit de sécurité RGPD, droit d'effacement/retention et sécurité de transport HTTPS.
- Validation sur vrai PostgreSQL avec migrations + tests Gateway JWT + tests navigateurs, puis **staging privé HTTPS**. Une suite entièrement verte sur fixture synthétique ne prouve pas la sécurité d'un déploiement réel.
- Watch/alertes ne commencent qu'après durabilité compte + source et consentement. Paiement/abonnements et exécution de trading ne font PAS partie de P1.

### 7.4 Produit et impact mesurables
Mesurer activation « premier dossier complété et sauvegardé », retour « reprise de la même thèse et modification motivée », fiabilité « aucun dossier perdu/écrasé », adoption « plusieurs analyses par utilisateur »; ne jamais afficher des « profits » ou taux de réussite inventés. En lien avec la monétisation internationale, un service premium n'est justifié que par ce gain de travail réel, pas par une interface avec de faux cours.

**Reprise après interruption :** valider l'état du nouveau commit documentaire, créer/relier une issue dédiée P1, puis faire un audit de code sécurité et la première tranche backend de persistance sans fusionner #115/#120/#121 aveuglément. Ne pas recommencer les réglages du formulaire ou la littérature générale sur le trading.
