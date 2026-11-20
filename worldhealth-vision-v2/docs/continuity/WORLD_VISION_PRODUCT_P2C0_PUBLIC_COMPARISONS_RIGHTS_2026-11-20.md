# WORLD-VISION — P2C0 : fermeture d'une lecture publique non filtrée
20 novembre 2026. Dépôt OBIANG5/World-Health-Vision.
Branche product/v2-p2c0-rights-gated-comparisons-2026-11-20.
PR #101 DRAFT sur PR #100, héritant de PR #99 (UX unifiée) et #97 (publication Timeseries).
Aucune fusion dans v2, aucun déploiement Vercel, aucune nouvelle licence.

## 1. Cause racine et impact métier
En préparant P2C (pays→indicateur→valeur→source/méthode) nous avons audité les routes publiques.
Gateway autorise GET /api/timeseries/compare/countries/latest ; pourtant la méthode
JdbcTimeseriesRepository.listLatestCountryComparison scannait timeseries.observation
et timeseries.source_run directement, alors que le contrat P1 prévoit la vue
timeseries.latest_observation filtrant droits signés, révocations et preuves Bronze.
Une observation historique non attestée ou révoquée pouvait ainsi figurer dans
la réponse de comparaison publique, malgré un compteur de couverture nul.
C'est un problème de confidentialité/droits de redistribution ; protéger la
route est prioritaire pour rendre la comparaison internationale exploitable.

## 2. Correction réelle, minimale et réutilisable
- Java SQL : requête de comparaison reconstruite sur timeseries.latest_observation
  et l'ensemble des pays demandés. Plus de lecture de observation brute ni
  jointure source_run au sein de cette méthode. Déduplication par
  pays/source/dataset/granularité : période la plus récente, tie-break
  fetched_at_utc/period_end/run_key déterministe.
- Source code exacte : services/timeseries-service/src/main/java/com/worldhealthvision/timeseries/persistence/JdbcTimeseriesRepository.java.
- Pas de changement de migration Flyway, de permission signataire, de routes
  publiques/privées, de logique d'ingestion ni de nouveau service.
- Tests ajoutés au SignedRightsRegistryIntegrationTest :
  (a) observation autorisée visible dans comparaison ;
  (b) révocation → disparition immédiatement ;
  (c) V1 raw non attestée → invisible ;
  (d) includeMissing=true ne contourne pas le filtre.
- Test de régression statique de méthode SQL + contrôles Java21/PostgreSQL16/Flyway
  et Gateway existants dans .github/workflows/whv-v2-p2c0-public-comparison-rights.yml.

## 3. Vérification exacte
Code SHA cf2cc0fa4ed8abe5d281f109c756fd827d5379c3.
GitHub Actions https://github.com/OBIANG5/World-Health-Vision/actions/runs/44730123897
SUCCESS : job java-postgres-public-comparison completed success ; audit SQL PASS,
Maven Timeseries+Gateway PASS. Les données de test sont synthétiques ;
aucun dataset IBGE/WDI réel n'a été rendu publiable. Contrôler le dernier SHA
de la branche si des commits DOCUMENTAIRES ultérieurs déclenchent une nouvelle CI.

## 4. Limites, sécurité restante et qualité d'usage
- P2B validé sur code SHA 71130169, run https://github.com/OBIANG5/World-Health-Vision/actions/runs/44729189035,
  traversant vrai frontend→Gateway→six services→DB, zéro série publiable en CI.
- Le correctif P2C0 ne prouve pas encore l'affichage des valeurs détaillées depuis
  un navigateur, ni le test de révocation depuis React.
- Vérifier le reste des routes publiques et des caches frontend : overview,
  historiques et comparateurs mis en cache pourraient afficher des réponses
  devenues obsolètes après révocation. Une réponse réellement révoquée ne doit
  pas rester affichée comme nouvelle preuve autorisée.
- PR #95 identité du parseur V2 et #94 trust/revocation des clés restent séparées.
  Pas de contournement d'un blocage légal pour produire une démonstration.
- Aucun engagement d'hébergement ni déploiement, sauvegarde/offsite ou SLA mondial.

## 5. Prochaine valeur : P2C1, pas une nouvelle infrastructure
1. Réutiliser les API Catalog, Timeseries et Analytics existantes pour un
   parcours utilisateur pays→indicateur→observation→source/dataset→période,
   statut observé/estimé, unité, date de publication/collecte, méthode/limites.
   Si l'API ne permet pas de découvrir les indicateurs PUBLIABLES d'un pays,
   ajouter une lecture agrégée strictement à partir de latest_observation.
2. Aucun chiffre ne doit être affiché comme officiellement licencié sur la foi
   du seul catalogue : la licence de diffusion et la provenance doivent
   être attestées sur le serveur.
3. Mode DEMO éphémère avec preuve synthétique et révocation navigateur ;
   puis sélectionner une source réellement autorisée en droit et méthode.
4. Tester mobile FR/EN, panne ≠ absence, compare méthodologie non équivalente,
   filtrage des données révoquées, performance et documents.
5. Préproduction noindex protégée avec URL réelle seulement quand la stack
   est déployable et l'exploitation/rollback/couts approuvés. Préserver les
   branches World-Vision Média/GDELT, Money/Watch, et les onze Visions.

## 6. Reprise multi-chat
Lire ce fichier puis docs/continuity/WORLD_VISION_PRODUCT_P2B_REAL_GATEWAY_BROWSER_2026-11-20.md,
PR #101, PR #100, PR #99, PR #97, issue #96 et HANDOFF_CORE_F12B_2026-11-19.md,
PR #95/issue #94 pour conformité. Vérifier HEAD et CI avant fusion.
