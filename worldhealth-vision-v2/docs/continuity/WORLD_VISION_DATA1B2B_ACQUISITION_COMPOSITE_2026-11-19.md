# WORLD-VISION — DATA-1B2B : journal de toutes les acquisitions et reçu composite privé

Date de chantier : 19 novembre 2026. Dépôt OBIANG5/World-Health-Vision.
Dossier logiciel canonique : worldhealth-vision-v2/.
Branche : data/v2-ibge-acquisition-journal-composite-2026-11-19.
Base immédiate : PR DRAFT #73 DATA-1B2A, elle-même basée sur PR #70 DATA-1B1 → PR #69 DATA-1A → pile backend PR #59. Toutes restent DRAFT, sans fusion dans v2. NE PAS toucher aux branches média, voix, montage vidéo ni à la branche de l'accueil UX. Pas d'infrastructure payante, publication Atlas, Timeseries, export ou hébergement ajouté.

## 0. PRIORITÉ CANONIQUE — NE PAS DÉRAILLER À CAUSE D'UNE CORRECTION VISUELLE

L'utilisateur a explicitement corrigé une dérive de pilotage : on avait annoncé DATA-1B2B, puis DATA-1B3, et une question sur la visibilité des styles sur iPhone avait fait passer le travail UX/SOURCES-1 à tort devant ces étapes. Cette confusion est désormais résolue.

ORDRE DE TRAVAIL RESTAURÉ :
1. DATA-1B2A : métadonnées officielles IBGE, périodes, vérification des réutilisations spécifiques — développé, PR #73, droits commerciaux toujours BLOQUÉS.
2. DATA-1B2B : événements de récupération append-only, firstSeen/lastSeen, réponses HTTP d'origine distinctes, statut et ETag/Last-Modified, reçu composite données+méta+périodes+review des droits, restore/test — objet de cette branche, indépendamment du frontend.
3. DATA-1B3 : comparabilité explicite recensement résident IBGE 2022 / indicateur estimé Banque mondiale WDI SP.POP.TOTL (définitions, méthode, époque, données réellement observées, statut et révisions). NE PAS faire de soustraction trompeuse de chiffres non comparables.
4. DATA-1C : stockage privé permanent, droits légaux sur table exacte, import idempotent Timeseries, Gateway, Atlas sourcé et navigable. La production est BLOQUÉE tant que les contrôles et autorisations ne sont pas réunis.
5. Extension INSTAT Gabon, BEAC/régional, autres pays, Watch Vision persistant, Money et autres Visions ; parallèlement les issues UX #66 / #68 et SOURCES #76 restent actives, mais leurs corrections ponctuelles ne changent jamais la priorité DATA.

## 1. ÉTAT EXACT DE LA CHAÎNE EXISTANTE

DATA-1A (PR #69) : appel officiel IBGE v3 https://servicodados.ibge.gov.br/api/v3/agregados/4714/periodos/2022/variaveis/93?localidades=N1%5Ball%5D, table 4714, variable 93, géographie BRA national N1, année Censo 2022, unité Pessoas. Ce n'est ni la population actuelle estimée ni une mesure d'une autre définition.

DATA-1B1 (PR #70) : archives privées, révisions immuables par SHA256 des octets HTTP originaux, SHA canonique JSON distinct, NDJSON normalisé, manifeste portable, validation d'intégrité et lecture après copie. L'horodatage fetched_at_utc d'une révision immuable correspond au PREMIER archivage de ces octets : on ne doit jamais le remplacer pour faire croire à une nouvelle récupération.

DATA-1B2A (PR #73) : deux endpoints officiels distincts /api/v3/agregados/4714/metadados et /api/v3/agregados/4714/periodos, captures indépendantes de leurs versions; variable, unité et niveau vérifiés. Le champ IBGE modificacao du listing des périodes est conservé sans prétendre en connaître les sémantiques. Dossier RightsReviewDossier de la table 4714/93 à statut NEEDS_PROVIDER_CLARIFICATION, revu historiquement au 19/11/2026. Politique générale IBGE ou API publique ne prouve pas une licence de redistribution commerciale spécifique. NO TIMESERIES.

## 2. CE QUI EST RÉELLEMENT IMPLÉMENTÉ DANS DATA-1B2B

### 2.1 Journal d'acquisition par ressource

Nouveau module services/ingestion-service/src/ingestion_service/acquisition_journal.py. Il crée pour chaque APPEL effectivement engagé un identifiant aléatoire cryptographique de 128 bits, indépendant du hash de réponse.

Structure locale :
  root/ibge/censo2022_4714/_acquisitions/EVENT_ID/started.json
  root/ibge/censo2022_4714/_acquisitions/EVENT_ID/outcome.json
  root/ibge/censo2022_4714_metadata/_acquisitions/EVENT_ID/started.json
  root/ibge/censo2022_4714_periods/_acquisitions/EVENT_ID/outcome.json

Le journal écrit et synchronise START AVANT la tentative HTTP. Il finalise par un SEUL outcome.json atomique et non remplaçable après la vérification du Bronze. Les issues admissibles sont SUCCESS, FAILED ou STARTED sans outcome après interruption ; un résultat interrompu n'est pas abusivement transformé en succès ou en échec.

Chaque événement contient :
- URL HTTPS de ressource OFFICIELLE exactement fixée par le contrat IBGE, pas de paramètres de requête arbitraires, aucune redirection acceptée par le client.
- date/heure UTC de début, fin si terminée, code HTTP si réellement accessible. Si code inconnu = null, jamais inventé.
- SUCCESS : SHA256 d'octets HTTP originaux d'une révision Bronze effectivement vérifiée, et uniquement les en-têtes ETag et Last-Modified RÉELLEMENT transmis par le serveur, sinon null.
- FAILED : classe d'erreur uniquement, jamais message d'exception non filtré, réponse brute, valeur statistique, secrets, requête utilisateur ou authentifiant.
- empreinte de START inclus dans le résultat, statuts BRONZE_ONLY_UNREVIEWED et NOT_ATTEMPTED.

Une même réponse reçue deux fois donne une seule VERSION source SHA256, mais DEUX événements d'acquisition. Le bilan audit expose nombre d'événements, succès, échecs, interruptions, versions, firstSeenAtUtc et lastSeenAtUtc par version à partir des réussites du journal. Les dates firstSeen/lastSeen ne sont pas présentées comme date de PREMIÈRE PUBLICATION ou de dernière RÉVISION du Censo 2022.

L'audit refuse ressources non connues, liens symboliques vers l'extérieur, identifiants corrompus, champs de provenance incohérents, fichiers modifiés, dépassement des tailles et versions brutes non vérifiables. Plafond 20 000 événements par ressource et refus explicite au-delà, avant création d'un mécanisme de pagination. Ce n'est PAS un registre WORM, une signature numérique tierce ni un consensus multi-hôte ; un acteur disposant de droits d'écriture sur tout le disque peut effacer l'historique sans ancrage extérieur. Il faudra chiffrer, sauvegarder et externaliser une empreinte de registre avant engagement de durabilité mondiale.

### 2.2 Intégration complète aux 3 vrais appels IBGE

- connectors/ibge_national_census_client.py : conserve response original bytes, et ajoute uniquement le statut HTTP et les en-têtes ETag / Last-Modified si reçus.
- connectors/ibge_census_metadata_client.py : sépare fetch_aggregate_metadata et fetch_official_periods, conserve la compatibilité de fetch_census2022_contract, et émet un type d'erreur HTTP borné donnant le statut exact sans fuite du corps.
- pipelines/ibge_national_census.py : begin avant GET, validation du schéma, écriture Bronze, finish success après vérification de la version; finish failure sur échec de requête ou de validation.
- pipelines/ibge_census_metadata.py : même parcours pour METADATA puis pour PERIODS, avec deux IDs et deux versions indépendantes. Si PERIODS échoue, le succès de METADATA persiste et le second échec est documenté. Pas de faux succès composite.
- bronze_store.py expose le journal privé de la racine existante ; aucune création de deuxième base ou de moteur d'ingestion parallèle.

### 2.3 Reçu composite explicite 3/3, toujours bloqué

Nouveau module services/ingestion-service/src/ingestion_service/source_composite_receipt.py.

La création exige les TROIS SHA256 explicites :
1. population brute nationale 2022 ;
2. métadonnées officielles de la table 4714 ;
3. liste officielle des périodes, contenant 2022.

Il n'y a JAMAIS de choix automatique de la dernière version. Chaque référence doit être compatible BRA/N1/2022/table 4714/var 93, disposer d'un manifeste Bronze intègre et d'au moins un événement SUCCESS réellement enregistré. Le reçu contient pour chaque ressource original SHA256, canonical JSON SHA, normalized NDJSON SHA, SHA du manifeste, URL officielle, firstSeen, lastSeen et compteur de récupérations au moment de la création, ainsi que l'empreinte de la revue de droits historique.

L'identité du reçu est le SHA256 du JSON canonique de son contenu. Deux assemblages identiques sans nouveaux événements convergent vers un seul reçu; une récupération supplémentaire de mêmes octets crée un nouveau reçu historique avec compteur d'événements actualisé, sans écraser l'ancien. Le fichier est privé, créé atomiquement et vérifiable après restauration sur une autre racine.

Contrats d'interdiction explicites : commercialReuseAdvice BLOCKED, publicDisplayAuthorised false, timeseriesPublication NOT_ATTEMPTED, sourceComparability NOT_YET_REVIEWED, simultaneousProviderSnapshot false. Le composite n'est PAS une photographie atomique fournie par l'IBGE ; un changement du fournisseur entre les trois GETs ne peut pas être exclu. Il ne contient ni licence implicite ni chiffre publiable et n'ouvre aucune API.

### 2.4 CLI privé, sans accès web public

Depuis services/ingestion-service, avec WHV_INGEST_BRONZE_ROOT pointant sur le volume privé :
  python -m ingestion_service.cli ibge capture-census-2022-population
  python -m ingestion_service.cli ibge capture-census-2022-metadata
  python -m ingestion_service.cli ibge audit-private-acquisitions
  python -m ingestion_service.cli ibge assemble-private-evidence-receipt --population-sha SHA --metadata-sha SHA --periods-sha SHA
  python -m ingestion_service.cli ibge verify-private-evidence-receipt --receipt-sha SHA
  python -m ingestion_service.cli ibge review-census-2022-rights

Ne PAS publier les sorties de commandes privées comme artefacts publics. Les tests CI n'utilisent aucun chiffre officiel dans les fixtures. Les sorties de CLI sont des traces de recherche, non une autorisation.

## 3. TESTS / PREUVES ET GARDES D'EXPLOITATION

Fichier tests/test_ibge_acquisition_composite.py :
- Même contenu deux fois : 1 révision, 2 événements, firstSeen/lastSeen distincts des dates source.
- HTTP 503 : événement FAILED avec vrai statut, aucune fausse version, aucun corps d'erreur journalisé.
- Deux ressources métadonnées et périodes distinctes, ETag présent seulement si retourné.
- Requête périodes en erreur après métadonnées en succès : résultat historique fidèle.
- Processus interrompu entre START et outcome : état STARTED, aucune confirmation fictive.
- Échec de double finalisation, tentative SUCCESS sans Bronze validé, URL détournée, chemin symbolique, événement et réponse corrompus.
- 12 événements concurrentiels au niveau processus local multithread, aucun écrasement d'identité.
- 3 versions contrôlées, reçu explicitement bloqué, identifiants de preuve inexacts refusés, mutation détectée.
- Sauvegarde/test par copie vers une racine différente, vérification du reçu, rejet d'une réponse corrompue.
- Reprise même SHA après création du reçu : nouveau reçu d'état, ancien immuable et toujours valide.

Le workflow .github/workflows/whv-v2-ibge-acquisition-composite-acceptance.yml valide Python 3.12, compilation, **70 tests ciblés et 113 tests de régression du service ingestion** sur commit 7fa62d286eb94011461246383c5d8d1a25bebc46 avec run GitHub Actions 44625785474 SUCCESS. Ne jamais réutiliser ce chiffre pour un SHA ultérieur non vérifié. Test network-only World Bank explicitement exclu de ce lot.

Un deuxième workflow whv-v2-ibge-acquisition-composite-live-evidence.yml effectue exactement trois GETs réels IBGE sur le commit candidate en temp privé éphémère, audite les trois événements, construit un reçu tripartite, vérifie BLOCKED, NE LOGUE PAS les chiffres, NE SAUVE PAS d'artefact et efface le répertoire à la fin. Son succès et son SHA doivent être constatés dans GitHub Actions avant toute affirmation de validation live.

## 4. LIMITES CONNUES ET TÂCHES RESTANTES, NON CAMOUFLÉES

1. La transaction entre les trois GETs n'est pas atomique côté IBGE ; une divergence de versions temporelles est POSSIBLE. La comparaison méthodologique et les scénarios de révision appartiennent à DATA-1B3.
2. Un simple disque local privé avec fsync/hardlinks fournit des garanties restreintes, pas un service 24/7 international, un journal multi-hôte ou un audit cryptographique garanti contre un administrateur. Toute future architecture durable exige chiffrement, accès minimaux, sauvegardes hors site, preuves de restauration, authentification, métriques RPO/RTO, gestion du stockage/rétention, permissions de collecte et quotas. Pas d'achat sans budget approuvé.
3. Une panne entre persistance d'une version brute et finalisation de l'événement laisse un événement STARTED; c'est une ambiguïté conservée honnêtement. Ne jamais inventer un succès en partant du fichier brut sans preuve d'exécution.
4. Dossier de droits exact IBGE 4714/93 toujours NEEDS_PROVIDER_CLARIFICATION. Pas de transfert à Timeseries, Atlas, commerce ou API Redistribuable autorisé.
5. Limitation du journal à un seul hôte et à 20 000 événements/dataset/audit. La pagination, rétention, archivage du journal, notarisation externe, rotation et monitoring attendent un besoin confirmé et l'infrastructure décidée.
6. Source actualité et comparaison de récits sont une problématique DISTINCTE : SOURCES-1 issue #76, sans supprimer les voix locales. Mais elle ne passe pas devant DATA-1B3 à cause d'une demande ponctuelle sur les styles.
7. Le Vercel public ancien n'a PAS été mis à jour par cette branche : issue #68 et aperçu UX-1B1 PR #75 sont séparés. Pas d'effet visuel attendu sur téléphone pour le backend DATA-1B2B.

## 5. SUITE PRIORITAIRE : DATA-1B3, PUIS DATA-1C

### DATA-1B3, contrat de comparabilité recensement/estimations

Faire la fiche de comparabilité **avant** les différences chiffrées :
- IBGE : Censo 2022, population résidente observée d'un recensement, géographie BRA/N1, référence 2022, tableau 4714/variable 93, unité Pessoas, statut de révision/publication NON DÉDUIT de modificacao.
- World Bank WDI : indicateur SP.POP.TOTL pour BRA en 2022, et méthode complète de constitution de la série (sources nationales, estimations/interpolations et révisions WDI), ne pas supposer que le sens est une observation directe IBGE.
- Deux provenances traçables distinctes, périodes et définitions résidents/nationaux, base démographique, date de révision, licences, méthode, disponibilité, qualité, présence/absence du WDI dans la BASE réelle du backend. Ne pas substituer un exemple synthétique à une donnée réelle.
- Le statut SAME_YEAR_DIFFERENT_METHOD ne suffit pas à calculer une différence pertinente. Exposer NON_COMPARABLE, COMPARABILITY_UNREVIEWED, ALIGNED_WITH_CAVEATS uniquement sur preuve. Aucune convergence ni contradiction de fait n'est présumée.
- Test IBGE modifié sans nouveau WDI, WDI révisé après IBGE, années décalées, territoires comparables/incomparables, valeur manquante, connecteur indisponible et série World Bank indirectement dérivée de l'IBGE (pas deux observations indépendantes).
- Éventuel prototype Gateway/Atlas sous permissions, après DatasetRights et persistance conforme.

### DATA-1C, production documentaire et statistique

Préparer le contrat d'import idempotent Timeseries avec transaction de source-run, rights gate revocable et versioning, puis service Gateway et UI Atlas indiquant institution, méthode, période, révision, qualité et limites. Déployer uniquement après décision de stockage privé sauvegardé et validation de la licence exacte, du coût et de l'exploitation. Puis pilote Gabon INSTAT et 217 pays/territoires avec statut de couverture RÉELLE, pas registre = collecte.

## 6. REPRISE INTER-CHATS : POINTS D'ANCRAGE

- PR #69 DATA-1A, #70 DATA-1B1, #73 DATA-1B2A, nouvelle PR DATA-1B2B de cette branche; base empilée, toutes DRAFT.
- Issue #71 suit le contrat IBGE complet, droits et durable. Docs précédentes : docs/continuity/WORLD_VISION_DATA1A_SOURCE_PILOT_2026-11-19.md ; WORLD_VISION_DATA1B1_BYTE_EVIDENCE_2026-11-19.md ; WORLD_VISION_DATA1B2A_METADATA_RIGHTS_2026-11-19.md ; HANDOFF_CORE_F12B_2026-11-19.md.
- Issues #66 (UX produit), #68 (Vercel ancien lien), #76 (articles multi-sources) ne modifient pas le chantier DATA ni les branches voix/média.
- Vérifier la dernière CI et le commit exact, droits officiels revus avant publication, ne pas promettre une persistance 24/7 ni un site live alimenté par les chiffres.
- Prochaine action principale : créer la PR DATA-1B3 sur la branche DATA-1B2B validée, en conservant ce document comme source de vérité, puis poursuivre DATA-1C et fonctionnalités réellement utiles.


## SUCCESSEUR IMPLÉMENTÉ — DATA-1B3 PR DRAFT #81

Le contrat déclaré « prochaine étape » dans ce document est désormais effectivement réalisé sur PR #81, base directe #78. WDI SP.POP.TOTL Brésil/2022 source id 2 est acquise de manière ciblée sur la même architecture Bronze SHA + journal que l'IBGE, sans modifier WorldBankClient global. Une revue privée vérifiée relie la version WDI à l'ancien reçu composite IBGE 3/3. Le moteur documentaire distingue concept de population, dates de référence (IBGE 31 juillet vs WDI mi-année), méthode recensement avec imputation vs estimation, source amont non prouvée indépendante, droits non approuvés, et refuse tout % ou titre de contradiction non normalisée. Tests 102 ciblés/145 régressions et 4 endpoints officiels IBGE/WDI SUCCESS sur premiers runs 44630694152 et 44630865356; contrôler dernière CI au HEAD de #81. Document complet : docs/continuity/WORLD_VISION_DATA1B3_IBGE_WDI_COMPARABILITY_2026-11-19.md. Suivantes : métadonnées de filiation WDI spécifique BRA/2022 puis DATA-1C — stockage durable sécurisé/droits/import/Atlas, et pays Gabon ensuite. L'accueil mobile #75 et l'issue médias #76 restent en dehors du chemin critique.
