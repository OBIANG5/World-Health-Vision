# WORLD-VISION — PRODUCT-P2B : le vrai frontend dans la pile existante
20 novembre 2026. Branche : product/v2-p2b-live-stack-gateway-2026-11-20.
Dépôt : OBIANG5/World-Health-Vision. Cette branche est empilée sur PRODUCT-P2A (#99), puis PRODUCT-P1 (#97). Aucun déploiement public, aucune licence accordée, aucune fusion de v2.

## 1. Pourquoi maintenant
Le travail précédent a prouvé indépendamment le frontend et Timeseries/Gateway, mais sans prouver le parcours réseau navigateur→Gateway→services→PostgreSQL. P2B exploite les services EXISTANTS sans achat ni nouveau microservice. Valeur utilisateur : le visiteur doit savoir si un pays est catalogué, si une observation est publiable, et si une absence de réponse est une PANNE. Vérifier l'expérience réelle sur iPhone avec Gabon, France, Brésil ; préserver le globe, l'interface UX1B, les 11 Visions et le choix multiple des sources.

## 2. Exactes bases et changements de code
- P2A commit 9dd7744501765ba43127124efa7ff8ad724bc236 : branche produit UX+P1, PR #99 DRAFT. CI finale SUCCESS https://github.com/OBIANG5/World-Health-Vision/actions/runs/44727566544.
- P2B commit 0682ec8cd7a8f6d50714710f40ea2880bcf1ffba : infra/tests/p2b_same_origin_preview.py, test CI en lecture seule. Sert le véritable dist Vite compilé, reverse-proxy uniquement GET /api/* vers 127.0.0.1:18080 ; n'ajoute ni observation ni licence ; renvoie les erreurs HTTP sources et 503 pour un problème de transport.
- P2B même commit : frontend/web-v2/p2b-live-stack-smoke.mjs, Chromium iPhone connecté à Catalog/Timeseries réels ; GAB/FRA/BRA, catalogue local, compte de sources réel, sélection de deux fiches, pays invalide ZZZ, accès privé 401. Modes baseline / outage / recovery ; une panne ne doit jamais s'afficher comme « zéro autorisé ».
- P2B commit 6a1561018b4f0d73ec52965d565daf67adc2d9df : .github/workflows/whv-v2-product-p2b-real-gateway-browser.yml. Sur GitHub Actions Ubuntu : compilation frontend sans fixtures, six services existants via infra/compose.secure-staging.yml + infra/tests/compose.ci-public-read.yml, vrai PostgreSQL16/Timescale, migrations, JWT actif, Gateway seule sur 127.0.0.1, certificats de test non atteignables pour aucune authentification privée. Aucun secret durable ; JWT protège les routes internes. Les GET publics sont déclarés explicitement dans la gateway.
- Le workflow vérifie en direct la couverture publiée des pays GAB/FRA/BRA, Catalog local, deny 401 de source-runs et Advisor, puis test mobile, arrêt/rétablissement du vrai service Timeseries, réexécution du navigateur, 12 requêtes bornées/pays pour p50/p95/p99 et mémoire CPU. Supprime le volume DB temporaire et le mot de passe CI en fin de job. Aucun script ne pousse de branche preview ou produit un contenu destiné au public.

## 3. Différences strictes entre VRAI et SYNTHÉTIQUE
PRODUCT-P2A browser QA : données de catalogue en archive OFFLINE et quatre valeurs de couverture fabriquées seulement dans un test Playwright, clairement étiquetées SYNTHETIC. Utile pour mesurer les états UI mais pas un parcours réseau réel.

PRODUCT-P2B browser QA : aucun preview-bootstrap.js, aucune fixture archivale, aucune couverture synthétique, compilation normale du frontend ; Gateway, Catalog, Analytics, Timeseries, Ingestion et DB doivent tourner ensemble. Les métadonnées institutionnelles du Catalog proviennent des migrations du dépôt (donc documentées, pas acquis dynamiquement chez chaque fournisseur) ; la DB de test neuve n'a aucune observation institutionnelle autorisée. Un zéro issu de latest_observation est un fait limité à CETTE BASE et ne prouve pas que les organismes réels n'ont pas de chiffres.

Ces deux validations sont complémentaires, ni l'une ni l'autre ne constitue une production ou une licence fournisseur.

## 4. Première exécution, statut et limites
Run initial : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44728620467, code SHA 6a1561018b4f0d73ec52965d565daf67adc2d9df. VÉRIFIER EN DIRECT conclusion, logs, captures et bilan du dernier SHA avant d'annoncer SUCCESS ; ce document ne suppose pas une CI terminée. Si le browser n'ouvre pas un pays, corriger le vrai code ou le test de manière motivée, sans simuler une réponse de production.

Limites non masquées : l'environnement CI est éphémère, sur loopback ; il n'existe pas encore une URL de préproduction durable ou une haute disponibilité internationale. Les contrôles de droits Ed25519 et témoins Bronze sont hérités du code P1 ; PR #95 code du vérificateur sémantique V2 est encore séparée, et la révocation des clés/parseurs reste issue #94. Le contrat de lecture des valeurs/méthodes/version et la première ingestion réellement licenciée restent à faire. Ne pas mettre IBGE 4714/93 ou WDI BRA/2022 en PUBLIC_API_INGEST par raccourci.

## 5. Prochaine séquence PRODUCT-P2C
1. Vérifier CI de P2B sur dernier commit, résoudre tout échec. Garder les tests négatifs 401, 503, absence de donnée et source utilisateur jamais privilégiée.
2. Réutiliser les API existantes pour un vrai parcours indicateur→observation→unité→date/période→source et dataset→méthode→limites→droits. Séparer données effectivement stockées, catalogue statique et signaux GDELT.
3. Créer en environnement privé CI un jeu SYNTHÉTIQUE expressément marqué DEMO avec permissions de test éphémères, passage attesté Source→Bronze→signature→Timeseries→Gateway→Atlas ; révoquer le grant et constater disparition depuis navigateur (pas uniquement Java). Ne pas l'afficher sur la production.
4. Paralléliser la revue du contrat #95 puis #94 (révocation des clés/parseurs, réduction des privilèges DB et identité workload). Toute migration doit être testée, pas fusionnée au hasard.
5. Sélectionner une seule vraie source dont licence et opérations exactes autorisent la diffusion prévue, traiter ses révisions et méthode avant publier. Ensuite étendre par pays/corridors utiles, en priorité Gabon INSTAT/BEAC et autres sources documentées, sans prétendre couvrir 217 pays en données.
6. STAGING privé : URL réelle, auth/noindex, secrets hors GitHub, TLS, coûts mensuels, observabilité, récupération PostgreSQL/Bronze et rollback. Publication sur Vercel UNIQUEMENT après validation du parcours sur smartphone et décision distincte.
7. Réduire les longues chaînes de PR brouillon en lots revus, maintenir docs/continuity et issue #96 pour reprise multi-chat. Conserver les branches médias/voix/audiovisuel, GEO, Radar GDELT, Money/Watch, tourisme/transport, panier, Trading/BRVM, sans recréer des plateformes isolées.

## 6. Reprise dans un autre chat
Lire en priorité cette note, PR #100, son dernier commit et GitHub Actions, puis PR #99/ #97/ #75, issue #96, le grand HANDOFF_CORE_F12B et document P2A, #95/#94, #68 déploiement Vercel. Ne pas confondre le test e2e local, une licence de données, une architecture de production et un produit mondial réellement opérationnel.
