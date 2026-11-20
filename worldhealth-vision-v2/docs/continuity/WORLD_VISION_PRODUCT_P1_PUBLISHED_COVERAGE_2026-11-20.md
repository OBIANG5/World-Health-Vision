# World-Vision — PRODUCT-P1 : couverture réellement publiable d'un pays, de Timeseries à Atlas

Date : 20 novembre 2026. Dépôt : OBIANG5/World-Health-Vision.
Branche : product/v2-country-published-coverage-2026-11-20.
Base stable : PR #93 DATA-1C-A2B2a, e87c1b45c20e44df4e2d8a78aee946b6c0d6aa20. Ancêtres #91→#88→#85→#81→#78→#73→#70→#69. Projet canonique : worldhealth-vision-v2/.
IMPORTANT : aucune fusion dans v2, aucun déploiement sur Vercel public, aucun serveur acheté ni nouvelle licence obtenue, aucune donnée réelle IBGE/WDI republiée.

## 1. Décision métier : rééquilibrage QUALITÉ / COÛT / UTILITÉ

Le chantier DATA-1A/1B/1C a produit un véritable moteur de preuves, mais les nombreuses PR empilées et tests ne rendent PAS encore le site public Vercel plus utile. Le site reste un aperçu statique distinct du nouveau backend. Le registre de 217 pays n'implique pas 217 collecteurs institutionnels actifs. Le coût d'opportunité de continuer à polir la cryptographie sans parcours utilisateur réel est devenu trop élevé.

Répartition de travail proposée pour les prochaines séquences : **45 % parcours produit Atlas/pays/comparaisons**, **30 % sources et données réellement intégrées**, **15 % sécurité et infrastructure indispensables**, **10 % performance/tests/documentation**. Ces parts sont des objectifs de priorisation, pas un prétexte pour négliger un blocage légal ou une faille critique. Un développement doit franchir un jalon utilisateur mesurable avant de multiplier les raffinements de bas niveau.

## 2. Code produit implémenté — une tranche VERTICALE, sans nouveau moteur

L'objectif : quand quelqu'un choisit un pays, distinguer une institution uniquement RÉPERTORIÉE d'un indicateur réellement ACQUIS, vérifié et LÉGALEMENT publiable dans World-Vision. Ne jamais afficher un nombre de séries fictif, ni prétendre qu'un échec réseau signifie zéro source.

### Backend Timeseries existant
- api/dto/CountryPublishedCoverageResponse.java : countryIso3, coverageStatus, compte d'observations disponibles, mesures observées, mesures estimées, compte de codes indicateur et code source distincts, date de la dernière période publiée et de collecte.
- persistence/TimeseriesRepository.java, JdbcTimeseriesRepository.java : une requête SQL agrégée par ISO3 sur timeseries.latest_observation UNIQUEMENT. La vue applique déjà restrictions des signatures de droits, révocations et preuves Bronze. Il n'existe AUCUNE agrégation sur catalog.source, aucun compte fictif des lignes source_run, aucune lecture publique de observation brute. OBSERVED et ESTIMATED avec valeur réelle comptent séparément ; SUPPRESSED/MISSING/NULL ne comptent pas.
- TimeseriesQueryService.java : ISO3 normalisé, exactement trois lettres ; TimeseriesController.java : GET /api/timeseries/countries/{iso3}/published-coverage.
- coverageStatus : PUBLISHED_DATA_AVAILABLE ou NO_PUBLICLY_ELIGIBLE_DATA. Zéro signifie uniquement « zéro série actuellement autorisée et visible dans CETTE base », pas absence de chiffres dans le pays.

### Gateway / sécurité
- security/PublicReadRoutes.java : UNE URL de lecture GET autorisée publiquement ; aucune wildcard /api/**, aucune écriture interne exposée.
- GatewayPublicReadIntegrationTest.java : public GET accepté, endpoints opérationnels/écritures toujours refusés anonymes et connectés sans habilitation.

### Atlas web-v2 existant
- api/types.ts et api/whvApi.ts : DTO TypeScript, vérification de réponse et invariants cohérents, appel par ISO3, pas de cache des droits potentiellement révoqués.
- components/country/CountryLocalEvidencePanel.tsx : panneau de couverture accessible FR/EN : chargement ; valeurs vraiment autorisées + nombre d'indicateurs/sources et part OBSERVED/ESTIMATED ; aucune valeur autorisée dans la base ; ou service momentanément NON vérifiable. Le catalogue local et les publications documentées restent visibles indépendamment, sans les transformer en enregistrements Timeseries.
- Ne PAS afficher une valeur de population IBGE/WDI comme autorisée ; le code n'ajoute aucune licence ni un accès nouveau à des valeurs brutes.

## 3. Tests et acceptation

CI propre au chantier : .github/workflows/whv-v2-product-country-coverage.yml.
- Java 21, PostgreSQL16 Testcontainers/Flyway, tests existants Timeseries et Gateway.
- Un import sans attestation valide ne change pas le total. Un import synthétique avec 2 signatures indépendantes valides + permission fictive correcte ajoute une observation et un indicateur. ISO3 invalide → HTTP 400, pays sans valeur → zéro avec statut explicite.
- Une permission révoquée retire immédiatement l'observation de la couverture PUBLIQUE mais pas sa preuve stockée privée.
- La route /api/timeseries/countries/GAB/published-coverage passe la frontière Gateway publique en GET seulement. Les routes historiques privées ne sont pas rendues anonymes.
- Frontend npm ci + TypeScript + Vite build, et preuve de séparation absent / indisponible.
- Premier run réussi sur code avant documentation : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44719277458 — SUCCESS : **33 tests Timeseries**, **46 tests Gateway** et build frontend réussi. Commit contrôlé 8b0c4b34c2c6cb153a97c7e6b8042da2973cfbda. Tout HEAD ultérieur documentaire doit avoir sa propre CI contrôlée.
- CI utilise des licences/signatures exclusivement SYNTHÉTIQUES ; elle ne prouve aucune disponibilité réelle en production ni une licence fournisseur.

## 4. Prochaine valeur à livrer, PAS un nouveau prototype cryptographique

La priorité haute après cette PR est une **intégration préproduction verticale** : sélectionner 1 pays → ouvrir CountryDrawer → vérifier couverture réelle → consulter série publiée et sa provenance → comparer deux méthodes valides, et afficher explicitement les lacunes ; tester navigation tactile iPhone, FR/EN, indisponibilité des services et révocation.

L'issue #68 Vercel explique pourquoi la PROD publique reste l'ancien snapshot statique sans Git-link vérifié. Le frontend ne doit pas être déployé seul sur le domaine public avec zéro Gateway/DB ou avec des fixtures maquillées en données temps réel. Première étape : préparer un aperçu STAGING isolé, avec 6 services existants, Catalog/Timeseries/Gateway/Analytics et PostgreSQL, données synthétiques identifiées DEMO, URLs testées, rollback, noindex. Ne promouvoir qu'un ensemble complet vérifié.

Deuxième étape : premier jeu de données RÉELLEMENT licencié pour publication/usage prévu et entièrement tracé, choisi après revue des droits exacts. Les données IBGE 4714/93 restent NEEDS_PROVIDER_CLARIFICATION ; WDI BRA/2022 reste bloqué comme recherche privée. Ne jamais accorder les droits depuis le texte du client.

Troisième étape : résoudre la pile de PR empilées #69→#93 et la branche frontend/Gateway/performance distincte, dans une vraie release candidate STAGING, avec migrations compatibles et tests de rollback. Ne pas merger aveuglément. Les améliorations de séquences audiovisuelles / GDELT / voix suivent leurs branches séparées.

Sécurité résiduelle à traiter EN PARALLÈLE sans prolongation illimitée : DATA-1C-A2B2b validation d'identité du parseur V2 en cours sur branche data/v2-semantic-parser-attestation-2026-11-20 ; l'émission PUBLIC reste désactivée. Ensuite gouvernance des identités signataires et rotations, DATA-1C-B2 dates de révision vs récupération, DATA-1C-C stockage chiffré/backup/restore et DATA-1C-D Atlas. La sécurité et les droits restent non négociables avant exposition commerciale.

## 5. Reprise sans perdre le fil

1. Ouvrir la PR issue de cette branche, vérifier HEAD exact et CI PRODUCT (Java + Web).
2. Lire ce document, HANDOFF_CORE_F12B_2026-11-19.md, #68 release, #82 DATA, PR #93 (sémantique), PR #91 (témoignage Bronze).
3. Livrer une intégration STAGING tangible avec URL utilisable plutôt que plusieurs mois de nouveaux microservices de confiance.
4. Une source enregistrée et une vraie série disponible sont deux choses différentes. 217 pays géographiques != 217 sources actives.
5. Après le parcours pays→sources→série et un premier dataset autorisé, poursuivre les institutions locales gabonaises INSTAT/BEAC, puis pays du monde, et connecter GDELT/médias aux faits vérifiés.
6. Documenter SHA, tests, PR, incidents, réversibilité, coût mensuel estimé et prochaines étapes à chaque tranche. Pas de sortie en production au seul motif que CI est verte.

**Décision : la prochaine PR doit faire progresser la VISIBILITÉ effective du produit, pas recréer un moteur de preuve supplémentaire.**
