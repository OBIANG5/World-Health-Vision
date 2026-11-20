# WORLD-VISION — PRODUCT-P2A, intégration UX et Atlas sous droits
Date : 20 novembre 2026. Dépôt : OBIANG5/World-Health-Vision.
Branche : product/v2-p2a-unified-atlas-ux-2026-11-20.
Projet canonique : worldhealth-vision-v2/. AUCUN déploiement, fusion sur v2, abonnement ou permission de publication réelle.

## 1. Contexte et arbitrage international
World-Vision doit devenir une plateforme internationale réellement exploitable : globe, pays, institutions locales, séries et méthodes, recherche, onze Visions, actualité/GDELT comme signal non probant, Watch, Money, voyages, prix et médias. Préserver intégralement cet objectif et les travaux des autres branches. Les 217 pays/territoires géographiques et organismes catalogués ne signifient pas 217 pays statistiquement alimentés. Le site Vercel actuel est une ancienne archive, pas la preuve du backend P1.

Le nouvel ordre de priorité adopté reste : 45 % parcours utiles, 30 % vraies sources/données, 15 % sécurité/infrastructure bloquante, 10 % performances/tests/docs. Ne pas sacrifier droits, sécurité ou précision à cette répartition. Livrer des parcours traversants visibles au lieu d'une nouvelle couche de contrats isolés.

## 2. Bases, provenance et non-fusions
- PR #97 PRODUCT-P1 : bc0d4bd1ad4eff81adb976f6e7f4406c14876ff2, issue #96, base de cette branche P2A. Les ancêtres #93/#91/#88/#85/#81/#78 fournissent droits signés, témoin Bronze, refus de données privées, SQL Timeseries, Gateway.
- PR #75 UX-1B1 : b650baed9003a012f8e8cef79751b5e8636cb99f, héritière de #67/#64/#35, source des éléments UX portés.
- Le diff contre v2 contient 25 fichiers UX et 205 fichiers côté P1. Le seul chemin d'application en collision est CountryLocalEvidencePanel.tsx ; il a été fusionné manuellement par fonctionnalités, aucun merge Git automatique.
- PR #95 A2B2b : f6c71bf41811ad4c747f6b2fa3f9992753da890c, branche soeur de P1 sur #93 ; NON incorporée. Les révocations de clés et parseurs restent issue #94.
- v2 de référence : 37aa828163f77f77600a12361ec2ffbb8176b6d9. PR et branches source conservées, aucune promotion.

## 3. Livrable concret PRODUCT-P2A
- Commit f90ef5b0a980895d62f5c8eb0e9c1ebaa28c33bf : copie précise de 15 fichiers UX depuis #75 (App, EyeLayout, VisionHub, WorldDiscovery, worldRoute, visionProducts, cinq fichiers de style, quatre tests navigateur). Les API P1 et le backend restent intacts.
- Commit 4b984d0fcac4ee06ae9c8acd24d4349c37537653 : unification de CountryLocalEvidencePanel. Le pays sélectionné peut consulter des sources locales, choisir deux fiches à comparer, afficher connexion/méthode/droits sans corroboration artificielle ET voir une couverture publique strictement issue de Timeseries.latest_observation via GET P1.
- UI bilingue FR/EN, aucune source sélectionnée d'office, aucune observation IBGE/WDI en recherche ne devient publique. Quand Timeseries échoue, on annonce « non vérifiable » plutôt que « zéro », indépendamment de Catalog/Analytics ; réponse scellée à l'ISO3 choisi. Aucun cache pour un grant révocable.
- Commit de1f6133b0458c668c4e9740045e9f8947aed956 : workflow d'acceptation backend et browser + Playwright p2a-coverage-smoke.mjs. Pas de permission GitHub d'écriture, pas de push automatique vers une branche de preview ni déploiement Vercel.

## 4. Preuve CI du code (et ce qu'elle NE prouve pas)
Premier succès exact sur de1f6133 :
https://github.com/OBIANG5/World-Health-Vision/actions/runs/44726772494
Deux jobs SUCCESS : backend Maven Java21, PostgreSQL16 et Gateway ; frontend npm CI, ESLint, TypeScript/Vite, tests navigateur du globe, des 11 Visions, recherche, mobile, source-choice et quatre modes Timeseries.

Les quatre couvertures du test sont exclusivement SYNTHÉTIQUES (disponible, vide, panne 503, réponse incohérente). Le navigateur intercepte ce seul endpoint durant le test ; les autres données du catalogue proviennent de whv-v2-browser-preview, ancien snapshot hors ligne. Rien de cela ne crée une permission fournisseur ou une observation mondiale en production. Captures GitHub Actions = pièces de QA, pas captures d'un backend public réel.

Après le commit documentaire, vérifier la CI sur le NOUVEAU SHA avant de conclure qu'il reste vert.

## 5. Limites / décisions de sécurité
- Aucune route d'ingestion ouverte au public ; l'allowlist Gateway de P1 reste stricte.
- Aucun dataset IBGE 4714/93 ou WDI BRA/2022 transféré sous statut PUBLIC_API_INGEST ; droits et méthodologies encore en revue, chiffres de test ne constituent pas une licence.
- PR #95 et issue #94 (identité et révocation de clés/parseurs), révisions historiques et sauvegardes complètes doivent être examinées avant promotion commerciale.
- Aucun backend public 24/7, aucun domaine Vercel modifié, pas de nouvelle URL STAGING permanente ; issue #68 encore ouverte.
- La vraie continuité navigateur→Gateway→Catalog/Timeseries/Analytics→DB n'est PAS prouvée par la seule compilation et les tests séparés. Il manque le parcours indicateur→valeur→source originale→méthode/conditions sur une série réelle autorisée.

## 6. PRODUCT-P2B : prochain ordre de travail INTELLIGENT
1. Revérifier HEAD de P2A, GitHub Actions et captures. Corriger toute nouvelle régression de compilation, accessibilité ou données incohérentes.
2. Réutiliser la pile existante Compose de six services dans GitHub Actions (Gateway, Catalog, Timeseries, Analytics, Ingestion, TimescaleDB), PAS de microservices nouveaux ; build frontend exact SHA, API via même origine/proxy.
3. Tester dans un même job les navigateurs réel iPhone/desktop avec GAB, FRA et BRA ; distinguer catalogue répertorié, couverture autorisée dans Timeseries et absence de statistiques ; panne serveur, 401/403, droits révoqués, compatibilité versions/migrations.
4. Produire des mesures : latences p50/p95, navigateur première interaction, RAM/CPU, coût d'hébergement potentiel ; vérifier les erreurs et capture hors secrets. Faire passer la vraie série seulement si approuvée.
5. Intégrer #95 de façon revue et testée pour les opérations exigeant l'identité approuvée du reparseur, puis fermer les failles de révocation bloquantes (#94), sans retarder une démo purement synthétique légalement isolée.

## 7. PRODUCT-P2C/P3 : suite sans perte de vision
6. Parcours complet pays→indicateur→source→valeur→unité→période→méthode→comparabilité→droits. D'abord DEMO synthétique explicitement libellée, puis premier dataset réellement licencié pour la diffusion choisie.
7. STAGING privé et noindex sur infrastructure existante ou explicitement approuvée, secret hors Git, TLS, auth, rollback, vraie URL vérifiée iPhone/desktop, chiffrage mensuel précis. Ne JAMAIS déclarer l'ancien Vercel connecté par simple statut READY.
8. Réduction de la pile de PR draft par lots de dépendances et CI sur SHA finaux, aucune fusion du moteur média/voix sans revue.
9. Extension INSTAT/BEAC Gabon puis sources France/Brésil et autres pays par disponibilité VÉRIFIÉE, Radar GDELT et médias, Watch/Money/Price/Transport/Trading/BRVM et revenus à mesure de parcours utiles. L'internationalisation, le globe bleu/cyan, les règles de sources locales et l'honnêteté méthodologique restent non négociables.

## 8. Reprise multi-chat, ordre de lecture
Ce fichier, HANDOFF_CORE_F12B_2026-11-19.md, issue #96, PR #97 et #75, PR #95, issue #94, issue #68. Rechercher la dernière CI sur la branche product/v2-p2a-unified-atlas-ux-2026-11-20 avant une action. Ne jamais confondre essai synthétique, licence fournisseur, frontend compilé et publication d'un produit international.
