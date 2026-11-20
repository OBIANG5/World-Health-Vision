# WORLD-VISION V2 — DATA-1C-A1 : droits, authentification interne et runs immuables

Date : 20 novembre 2026. Dépôt : OBIANG5/World-Health-Vision ; application canonique : worldhealth-vision-v2/.
Branche : data/v2-timeseries-rights-idempotence-2026-11-20.
Parent : PR DRAFT #81 (HEAD de départ f79635d2d5adf7fe42337c63df49fdcfaba8bfd7), après #78 DATA-1B2B, #73 DATA-1B2A, #70 DATA-1B1, #69 DATA-1A. Issue de pilotage : #82. AUCUNE fusion v2, aucun déploiement public, aucun nouveau VPS, aucune modification média/voix.

## 0. Priorité canonique — pas de dérive

L'utilisateur veut avancer utilement, sans remplacer la trajectoire annoncée par le dépannage d'un style d'accueil iPhone. Pipeline acquis dans les PR DRAFT : IBGE Censo 2022 → capture brute versionnée → historique des acquisitions → droits exacts non approuvés → WDI BRA/2022 capturée et comparaison des méthodes sans différence numérique trompeuse. À partir de cela, il faut transformer les preuves privées en publication seulement si juridiquement et opérationnellement autorisée, dans le Timeseries et Gateway existants.

La PR frontend #75, l'issue styles/Vercel #68 et l'issue de comparaison d'articles #76 restent CONSERVÉES mais ne remplacent pas les travaux DATA. Il faut considérer GDELT comme signal de découverte média, non preuve unique. Pour les données, comparer les perspectives des institutions locales, régionales et internationales avec historique et provenance.

## 1. Audit préalable des vrais fichiers

- TimeseriesService existe : Java 21, Spring Boot 3.3, Flyway, PostgreSQL, tests Testcontainers.
- timeseries.source_run a unique(source_code,dataset_code,run_key). JdbcTimeseriesRepository.upsertSourceRun ancien faisait UPDATE sur fetched_at_utc, notes, chemins et persisted_at_utc pour la même clé.
- timeseries.observation a unicité par source_run_id / indicateur / pays / granularité / période ; ancien ON CONFLICT DO UPDATE pouvait remplacer valeur, statut et ingested_at.
- La route POST /internal/timeseries/ingestion/observation-batches n'avait pas de secret d'authentification explicite dans son controller. Le mot « internal » n'est pas une protection.
- Le contrôle IBGE/WDI n'existait que du côté Python ; un appel HTTP direct pouvait contourner ce producteur.
- WDI SP.POP.TOTL est une ESTIMATION de population de mi-année, pas OBSERVED recensement direct. Le SQL autorise OBSERVED, ESTIMATED, MISSING, SUPPRESSED, mais PAS MIDYEAR_ESTIMATE.
- La vue latest_observation trie encore principalement fetched_at_utc, ce qui désigne la collecte et non la date de la révision fournisseur. Travail scientifique restant.
- On réutilise le TimeseriesService/TimeseriesClient existant. Pas de nouvelle base ni d'un nouveau moteur.

## 2. Ce qui est effectivement implémenté

### 2.1 Blocage juridique au RECEVEUR

Nouveaux fichiers ProtectedSourcePublicationGate.java et ProtectedResearchPublicationException.java :
- Refus de source IBGE et datasets de la famille CENSO2022_4714 / WDI_POP_TOTAL_BRA_2022.
- Refus de l'indicateur IBGE.CENSUS2022.RESIDENT_POP, même sous un autre code source.
- Refus de la cellule BRA / SP.POP.TOTL / 2022, même si le dataset est rebaptisé.
- Refus des notes de non-autorisation dont REVIEW_REQUIRED, BRONZE_ONLY_UNREVIEWED, NEEDS_PROVIDER_CLARIFICATION, NOT_ATTEMPTED, EXPIRED, REVOKED, DENIED et flags de réutilisation non revue.
- Le texte APPROVED fourni par un client ne peut jamais débloquer ce jeu protégé ; seule une future décision indépendante et authentifiée du serveur pourra accorder une opération spécifique.
- Rejet HTTP 403 AVANT toute écriture, sans exposer les chiffres du payload.

LIMITATION : ce garde négatif protège des jeux de recherche connus, il n'est PAS une validation universelle des droits de réutilisation sur les autres séries. Le futur DATA-1C-A2 doit apporter registre positif, révocation, dates, signature et permissions par opération pour le monde entier.

### 2.2 Authentification minimale, refus par défaut

TimeseriesInternalIngestionController requiert X-WHV-Ingestion-Key. Secret configuré côté serveur par WHV_TIMESERIES_INTERNAL_INGESTION_KEY, longueur minimale 32 caractères, sans valeur réelle par défaut. Aucun secret ou secret trop court = 503 (aucune écriture permise). Clé absente/fausse = 403. Comparaison à temps constant par MessageDigest.isEqual. La lecture des séries ne change pas.

Le producteur Python TimeseriesClient exige la même variable privée, refuse de publier sans elle, désactive les redirections et évite de retenter les réponses 403 ou 409. De plus, le client bloque la publication des jeux de recherche protégés même s'il possède une clé. Pour WDI SP.POP.TOTL, le producteur mappe une valeur de mi-année non qualifiée ou MIDYEAR_ESTIMATE en ESTIMATED ; il refuse de la prétendre OBSERVED.

ATTENTION : ce secret partagé n'est PAS un système d'identité interservices robuste, ne remplace ni TLS privé, ni mTLS/OIDC, rotation, coffre de secrets, ACL réseau ou permission métier. Aucun secret réel et aucune infrastructure n'ont été configurés dans ce chantier. C'est une protection de code candidate ; l'environnement en production sans secret refuserait intentionnellement les écritures. Le frontend ne doit JAMAIS obtenir la clé.

### 2.3 Immutabilité des réexécutions

Migration non destructive V3__source_run_immutable_batch_fingerprint.sql : ajoute canonical_batch_sha256 de 64 caractères à source_run, nullable pour les lignes préexistantes non attestées. Aucun backfill mensonger.

CanonicalIngestionFingerprint.java normalise et trie les observations par identité, trie les clés JSON et calcule SHA256 de toutes les informations du lot normalisé. Ce hash n'est NI signature de fournisseur, NI SHA du corps HTTP original ; il protège uniquement l'identité d'une requête d'ingestion.

TimeseriesRepository et JdbcTimeseriesRepository utilisent INSERT ... ON CONFLICT DO NOTHING RETURNING id sous transaction Spring.
- Nouvelle clé de run : insertion source_run + observations.
- Même clé et MÊME contenu canonique : 200, upsertedCount=0, même identifiant, **aucun UPDATE** de fetchedAt, persistedAt, notes, valeur ou ingestedAt.
- Même clé mais contenu différent : 409 et aucune modification.
- Ancien run sans empreinte : 409, ne pas lui inventer une provenance cryptographique.
- Requêtes concurrentes : l'unicité PostgreSQL arbitre l'unique insertion, les autres deviennent replays read-only.
- Échec d'une observation lors de l'insertion d'un nouveau lot : rollback attendu de la transaction Spring, à contrôler par les tests transactionnels.
- Une révision réelle doit avoir une identité de version distincte, et l'historique restera sous l'ancien runKey.

LIMITES : la preuve de lot ne relie pas encore chaque source_run à un événement acquisition, à chaque SHA du Bronze, au reçu composite, au dossier de droits validé et à une identité d'opérateur. La vue latest classe toujours selon les dates de récupération, non révision, et doit être corrigée scientifiquement en DATA-1C-B2.

## 3. Tests / preuve / limites

Les nouveaux tests TimeseriesSourceRunSafetyIntegrationTest.java utilisent des données SYNTHÉTIQUES de PIB de la France, jamais le chiffre officiel du Brésil : absence/fausse clé, source bloquée y compris payload rebaptisé, manifest non autorisé, replay inchangé, mutation avec même runKey rejetée, ancienne ligne SHA NULL, 5 replays concurrents. Les anciens TimeseriesControllerIntegrationTest ont été mis à jour avec une FAUSSE clé de test uniquement (test/resources/application.yml, non main).

Les tests Python dans test_timeseries_private_publication_gate.py couvrent l'absence de secret, la protection IBGE/WDI, WDI population ESTIMATED, l'en-tête hors JSON et absence de retry automatique 403/409. Le workflow whv-v2-data1c-timeseries-gates.yml compile Java 21, Testcontainers PostgreSQL16, Flyway et lance régressions Python 3.12, sans requête officielle externe.

Première validation Java Maven après changements : 10 tests Java/JDBC réussis et BUILD SUCCESS. Un contrôle statique supplémentaire a échoué pour cause de FAUX POSITIF : recherche de la séquence 123456789 dans une fausse clé de test. La vérification a été affinée pour chercher une valeur numérique JSON de population, pas une sous-chaîne de clé synthétique. Revérifier le HEAD final et les deux jobs (Java et Python) avant de considérer la PR terminée. Ne jamais déclarer qu'un test a passé sur un SHA non exécuté.

## 4. Travail restant et suite STRICTE

DATA-1C-A2 : registre centralisé des droits, vérification dataset / opération / juridiction / durée / révocation / relecteur, identity mTLS/OIDC et contrôle en transaction contre TOCTOU. Pas de publication IBGE 4714/93 tant que les droits commerciaux exacts restent NEEDS_PROVIDER_CLARIFICATION ; WDI doit être évalué séparément.

DATA-1C-B2 : lier SHA HTTP brut, normalized SHA, reçu composite, acquisition events et sign-off à source_run ; migrations non destructrices ; historique des revisions source et tri latest explicite selon la méthodologie, jamais fetchedAt comme substitute. Tester sources révisées avec collecte non chronologique, WDI estimations et données nationales originales.

DATA-1C-C : infrastructure réellement durable et privée, chiffrement, authentification, stockage sauvegardé de PostgreSQL ET Bronze/journaux/reçus, restauration documentée, objectifs RPO/RTO, rotation et coûts autorisés. Un runner GitHub temporaire réussi n'est PAS une solution 24/7. Pas de nouveau VPS payé sans accord.

DATA-1C-D : seulement après autorisation et persistance : séries visibles dans Gateway/Atlas avec méthodologie, droits, dates de mesure et source, gestion des pays non couverts, 217 entrées de registre ne signifiant pas 217 pays ayant des données. Ensuite le pilote Gabon INSTAT + BEAC, autres sources nationales, Watch persistant et autres Visions.

La comparaison précise des contributions amont WDI BRA/2022 reste une recherche méthodologique ouverte ; il ne faut pas inventer l'indépendance du recensement IBGE par rapport à WDI. La logique des articles multi-sources est conservée issue #76 mais n'est pas la priorité DATA actuelle.

## 5. Reprise inter-chats et dépendances

Branch HEAD à vérifier : data/v2-timeseries-rights-idempotence-2026-11-20, PR DRAFT DATA-1C-A1 basée sur PR #81, issue #82. Lire aussi docs/continuity/WORLD_VISION_DATA1B3_IBGE_WDI_COMPARABILITY_2026-11-19.md et docs/continuity/HANDOFF_CORE_F12B_2026-11-19.md sur cette branche. Lire les logs du DERNIER workflow et conserver les raisons exactes de tout test échoué. Prochaine implémentation : DATA-1C-A2, puis B2/C/D ; ne pas fusionner toute la pile sans QA et revue de droits. Ne jamais promettre qu'une PR DRAFT change le Vercel de l'iPhone.


## 6. Renforcement après la première CI (20 novembre 2026)

La suite de tests PostgreSQL a été étendue à trois scénarios supplémentaires : ordre différent des observations d'un même lot implique le même hash canonique et replay sans écriture ; double observation identique dans le même lot doit être refusée avant SQL ; échec d'une clé étrangère PostgreSQL doit déclencher un rollback de la source_run et ne laisser aucune ligne orpheline. La réponse à toutes les erreurs de parsing ou violation de contrainte est désormais GENERIQUE « Invalid Timeseries request or source constraint. » afin de ne pas renvoyer les détails de SQL, contenus/statistiques ni fragments secrets.

**Preuve du candidat après les 3 nouveaux tests Java, avant le changement de texte d'erreur :**
https://github.com/OBIANG5/World-Health-Vision/actions/runs/44704015448 — SUCCESS, **13 tests Java/PostgreSQL 16**, **11 tests Python ciblés**, **164 régressions Python**, Maven BUILD SUCCESS. Un run successeur a été déclenché automatiquement après l'assainissement des erreurs HTTP : vérifier sa réussite et le SHA de la tête réelle de PR #85. La précédente première preuve (10 Java, 11 Python, 164 régressions) reste https://github.com/OBIANG5/World-Health-Vision/actions/runs/44703340752 mais ne remplace pas la plus récente.

**Lien de PR** : https://github.com/OBIANG5/World-Health-Vision/pull/85, base #81, DRAFT. **Issue mère** : https://github.com/OBIANG5/World-Health-Vision/issues/82. Les changements restent en dehors de v2 et Vercel. La sécurité finale de production attend toujours le contrat de droits positif et la configuration authentifiée TLS/workload identity ; les tests de code ne garantissent pas un déploiement sécurisé.
