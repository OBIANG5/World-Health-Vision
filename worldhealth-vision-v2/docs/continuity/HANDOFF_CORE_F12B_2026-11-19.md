# WORLD-VISION — REPRISE INTÉGRALE DU PROJET TECHNIQUE ET COMMERCIAL
**Mise à jour : 19 novembre 2026 — branche candidate F1.2b.1.**
**Ce fichier est le point d'entrée recommandé pour reprendre dans un autre chat.**

## 0. Comment retrouver le travail sans confusion

Dépôt officiel : https://github.com/OBIANG5/World-Health-Vision
Code source **canonique** : `worldhealth-vision-v2/`. Écarter intégralement V0/V1 et les anciens fichiers à la racine.
Branche publique de référence : `v2` (SHA au début de cette reprise : `37aa828163f77f77600a12361ec2ffbb8176b6d9`).
Vercel : projet `world-health-vision-v2`, aperçu statique ; **aucun backend de production validé**.

### Chaîne de PR (toutes en brouillon, NE PAS les fusionner automatiquement)
1. **#35** https://github.com/OBIANG5/World-Health-Vision/pull/35 — branche `feature/v2-foundation-quality-gates-2026-11-19`, base `v2`. Tests de globe, iPhone, navigation, contraste favoris. PR GitHub Actions verte.
2. **#36** https://github.com/OBIANG5/World-Health-Vision/pull/36 — branche `security/v2-secure-staging-2026-11-19`, base `v2`. Compose sécurisé, secrets, ports, runtime non-root, sauvegarde/restauration testée, contrôle d'hôte. Actions vertes sur SHA final `c9275c7602c29cfb74ff9ada54123bbbdeefdc64`.
3. **#38** https://github.com/OBIANG5/World-Health-Vision/pull/38 — branche `feature/v2-gateway-public-private-contract-2026-11-19`, **base de PR #36, PAS v2**. Contrat international d'accès anonyme GET/JWT/futur private, secure-by-default et audit explicite des chemins. Actions finales à consulter sur la PR.
4. **#37 (issue)** https://github.com/OBIANG5/World-Health-Vision/issues/37 — backlog technique F1.2b (charges, hébergement, OIDC, chiffrement, déploiement).

L'ordre de fusion doit respecter les dépendances, après revue explicite du propriétaire : #35, #36, puis #38 (adapter #38 pour cibler `v2` lorsque #36 est effectivement fusionnée). Vérifier les diffs et workflows sur les SHA finaux et conserver les variantes média/design non fusionnées.

## 1. Vision produit internationale — ne jamais la perdre

World-Vision : « Voir le monde, le comprendre. » La planète/globe interactif et les fiches de 217 pays/territoires forment le référentiel géographique commun, mais ne suffisent pas à eux seuls pour fidéliser et monétiser.

Une seule infrastructure / plusieurs produits orientés usages :
- **Money-Vision** : conversion, frais réels, comparateur de transferts, seuils de change ; meilleur premier pilote de `Watch` car du code de conversion existe déjà.
- **Tourisme-/Transport-Vision** : surveiller vols, trains, bus, hôtels, toutes taxes et bagages inclus ; alertes de billets moins chers sous contraintes, disponibilité à revérifier.
- **Price-/Panier-Vision** : suivi des prix e-commerce et paniers alimentaires par magasin, distance, unité, date et disponibilité.
- **Trading-Vision** : calendrier économique, 8 grandes devises, 28 paires Forex, banques centrales, corrélations, gestion du risque, journal, future concurrence fonctionnelle à certaines fonctionnalités TradingView ; préserver OBATRADING comme recherche/méthode distincte.
- **Bourse Afrique Vision** : BRVM et marchés régionaux avec données sous licence, dividendes et portefeuille ; attention à la marque BRVM et au droit de redistribution.
- **World-Vision Média** : newsroom, radar mondial, scripts, voix Vivienne C5.2 et vidéo sur branches médias existantes ; ne pas fusionner ses centaines de commits en bloc.

Modèle économique exploré : outils gratuits très utiles + publicité conforme et proportionnée + affiliation de services réellement pertinents + abonnements premium ciblés et API B2B à terme. Ne pas créer des pages génériques qui remplacent simplement une réponse ChatGPT.

### Apprentissage GDELT / EarlyForge
GDELT = radar de *signaux/mentions* d'actualité mondiale ; EarlyForge = inspiration pour regroupement, chronologie, vitesse de propagation et workflows éditoriaux. Une mention n'est ni une donnée statistique officielle ni une preuve indépendante. Associer les signaux aux fiches pays et vérifier par institutions/médias crédibles, avec droits d'utilisation contrôlés.

## 2. Réalité du code (ne pas déclarer fini ce qui est seulement prévu)

La V2 contient catalogue géographique, sources et connecteurs institutionnels, TimescaleDB, services Java/Python, analyses, visualisations, simulateurs, globe, convertisseur de change et écrans de navigation. Mais :
- les 22 sources internationales sont d'abord des **entrées de catalogue**, pas des données toutes connectées et ingérées ;
- les sources locales par pays sont très partiellement couvertes (exemple Gabon, France, USA) ;
- `AlertsPanel.tsx` et `TravelPanel.tsx` sont encore des panneaux non opérationnels ;
- les API du Vercel public n'ont pas été démontrées sur le domaine ;
- la V2 publique n'a pas de moteur Watch persistant, de comptes synchronisés ni de recherche réelle de billets de transports ;
- les parties média et variantes de globe plus récentes sont conservées dans d'autres branches à examiner sans les fusionner à l'aveugle.

## 3. Travaux réels faits en F1.2b.1

### Gateway international
Fichiers :
- `services/gateway-service/src/main/java/com/worldhealthvision/gateway/security/PublicReadRoutes.java`
- `.../security/GatewaySecurityConfiguration.java`
- `.../security/GatewaySecurityProperties.java`
- `services/gateway-service/src/main/resources/application.yml`
- `services/gateway-service/src/test/java/com/worldhealthvision/gateway/GatewayPublicReadIntegrationTest.java`
- `services/gateway-service/src/test/java/com/worldhealthvision/gateway/GatewayRoutingIntegrationTest.java`
- `infra/docker-compose.yml` et `infra/compose.secure-staging.yml`
- `.github/workflows/whv-v2-gateway-access-contract.yml`

Politique de sécurité :
- JWT **activé par défaut** : `WHV_SECURITY_ENABLED=true` si variable absente.
- Développement local : désactivation **explicite** `WHV_SECURITY_ENABLED=false`, infrastructure liée à `127.0.0.1`.
- Staging : JWT obligatoire ; `WHV_PUBLIC_READ_ENABLED=false`.
- Produit public futur : flag true autorise exactement **57 routes GET publiques** décrites explicitement. Aucune route personnelle/opérateur/publiée après le changement ne devient publique automatiquement.
- POST Advisor requiert JWT, mutations et routes inconnues refusées même avec JWT ; `/actuator/prometheus` et `/actuator/info` fermés à l'edge. `/actuator/health` est ouvert avec détails et composants masqués.
- Tests de réponse : 401 sans jeton quand accès interdit, 403 avec JWT quand accès interdit.
- Toutes les sources commerciales, prix d'avion, bourse et flux externes doivent faire l'objet d'une vérification contractuelle/licence avant diffusion.

### Tests
Workflow `WHV V2 - international API gateway access contract`, Java 21/Maven, tests unitaires/intégration, rapports JUnit.
Première erreur détectée : assertions de test exigeaient 403 pour les appels anonymes, alors que Spring Security répond 401 ; corrigée.
Vérification du nouveau health minimal et des tests finaux à consulter sur la PR #38 après la dernière modification.

**Ce lot n'active aucun nouveau service Internet.** La suite (OIDC réel, JWT signé, CORS, quotas, WAF, TLS, charge, qualité d'usage, RGPD) reste ouverte.

## 4. Hébergement, prix et statut financier

Les quatre comptes Vercel consultables incluent le projet frontend `world-health-vision-v2`. Les connexions Railway examinées n'ont pas de projet déployé. Aucun abonnement ni VPS nouveau commandé durant ces travaux.

Premiers prix publics vérifiés au 19/11/2026 (sans engagement, vérifier devis au moment du choix) :
- OVHcloud VPS-2 : 4 vCores, 8 Go RAM, 75 Go à partir de 7,21 € HT/mois.
- OVHcloud VPS-3 : 6 vCores, 12 Go RAM, 100 Go à partir de 10,40 € HT/mois.
- Hetzner CX33 : 4 vCPU, 8 Go, 80 Go, disponibilité variables selon région.
- Railway Hobby : $5/mois incluant du crédit d'usage, facturation au-delà ; n'est pas un prix fixe pour cinq services 24h/24.
- Vercel Hobby : **usage personnel non commercial uniquement** ; anticiper plan autorisé dès monétisation.

Attention : tarifs de base hors backups offsite, capacité de stockage brut, email de notifications, frais d'API de voyage/FX/BRVM, domaine, réseau, TVA et supervision. Une machine unique UE est plausible pour un pilote, mais n'est PAS une architecture haute disponibilité internationale.

## 5. Les étapes exactes à poursuivre — ne pas sauter

### F1.2b.1 (présente PR #38)
- [ ] Vérifier GitHub Actions **vertes sur le SHA final**, y compris test health public minimal.
- [ ] Consigner preuves et risques dans #38 et #37.
- [ ] Examiner diff et décision humaine de fusion — aucun déploiement automatique.

### F1.2b.2 (prochaine branche/PR après la présente)
- [ ] JWT réel signé + rejet de jetons altérés/expirés et contrôle d'issuer/audience ; tests avec JWKS local en CI avant choix OIDC commercial.
- [ ] Gateway réel dans Compose de staging, derrière OIDC local de test isolé, sans ouvrir la base ; mesure RAM/CPU/latence p50/p95/p99.
- [ ] Charge multi-utilisateurs et dégradation (services arrêtés, réponse 502/503, timeout) ; pas de données imaginaires.
- [ ] Protection de débit, en particulier Advisor, futurs prix et opérations générant des coûts ; origin/CORS explicites ou proxy same-origin.
- [ ] Revue de l'image Docker, secret, réseau, audits de vulnérabilité, tests complémentaires.
- [ ] Compléter chiffrage TCO et décision de fournisseur, sans création de coût non autorisé.

### F1.2b.3 et F1.3
- [ ] Offre serveur approuvée et preuves de TLS/identité/sauvegardes hors site ; récupération d'un schéma complet Flyway + Timescale hypertables, pas juste une table témoin.
- [ ] Un connecteur officiel prend une **vraie** série, la stocke et la rend accessible dans le frontend Vercel avec source, date de référence, collecte et statut.
- [ ] N'activer les flux GDELT, voyages, prix commerciaux et marché qu'après provenance et droits documentés.

### F1.4 / F1.5
- [ ] Un compte utilisateur et un moteur Watch persistants, idempotents, notifications consenties ; premier pilote Money-Vision, puis Transport/Price, puis Trading.
- [ ] Expérience mobile accessible pour chacun, mesures de rétention et coûts avant monétisation.
- [ ] Préservation du globe et des branches Media Studio, leurs règles graphiques et éditoriales existantes.

## 6. Instruction pour un autre chat

1. Ouvrir cette documentation sur la branche `feature/v2-gateway-public-private-contract-2026-11-19`.
2. Examiner le statut actuel des PR #35, #36, #38, issue #37 et du SHA `v2`.
3. Lire l'état de la CI et corriger avant toute fusion ; ne jamais inventer « terminé ».
4. Créer une branche de travail distincte pour le prochain jalon, avec tests, captures/logs/provenance et documentation à jour.
5. Ne jamais toucher au déploiement Vercel public ni engager une dépense avant une décision explicitement assumée.

## 7. Références

- Sécurité staging : `docs/architecture/SECURE_STAGING_F12_2026-11-19.md` (PR #36)
- Politique d'accès et hébergement : `docs/architecture/F12B_INTERNATIONAL_PUBLIC_PRIVATE_GATEWAY_2026-11-19.md` (PR #38)
- Fondation/critères : `docs/architecture/FOUNDATION_RELEASE_GATES_2026-11-19.md` (PR #35)
- Issues de planification : https://github.com/OBIANG5/World-Health-Vision/issues/37


---

## 8. Ajout de continuité — F1.2b.2a JWT signé (19/11/2026)

### Branche et dépendances
- PR #39 : https://github.com/OBIANG5/World-Health-Vision/pull/39
- Branche : `security/v2-jwt-signature-audience-scopes-2026-11-19`.
- **BASE #39 = branche #38** : `feature/v2-gateway-public-private-contract-2026-11-19`. La PR #38 dépend elle-même de #36, qui cible `v2`. Ne pas fusionner #39 directement dans `v2`.
- La PR #35 (qualité visuelle) est indépendante. Aucun changement de production, aucune dépense.

### Ce qui existe dans le code
- `services/gateway-service/src/main/java/com/worldhealthvision/gateway/security/GatewayJwtDecoderConfiguration.java` : vrai décodeur Spring Security de JWT RSA signé via JWKS HTTPS, contrôle issuer, audience, expiration et nbf. Démarrage fail-closed sans issuer/JWKS/audience.
- `GatewaySecurityConfiguration.java` : POST Advisor exige le scope signé `advisor:invoke`, GET publics opt-in et routes inconnues interdites.
- `services/gateway-service/src/main/resources/application.yml` : aucun issuer local par défaut ; toutes les variables obligatoires sont explicites.
- `infra/compose.secure-staging.yml` + `infra/ops/preflight-host.sh` + `infra/tests/verify_secure_staging.py` : JWKS HTTPS, audience, blocage du mode de test HTTP en staging.
- `GatewaySignedJwtIntegrationTest.java` : vraie paire RSA éphémère, fausse signature, mauvaise audience/issuer, jeton expiré/non encore actif, `alg=none`, scopes et refus des routes internes ; aucun JWT de test conservé dans le dépôt.
- `GatewayJwtDecoderConfigurationTest.java` : contrôles négatifs de configuration et HTTPS.
- `GatewayPublicReadIntegrationTest.java` et `GatewaySecurityIntegrationTest.java` : anciens décodeurs fictifs supprimés ; mockJwt seulement pour les tests d'autorisation.
- Workflows `.github/workflows/whv-v2-signed-jwt-contract.yml` et `whv-v2-secure-staging-contract.yml`.

### Résultats à vérifier impérativement
- Premier test avec erreur de compilation Java : corrigé.
- Deuxième test : incompatibilité des anciens décodeurs simulés avec le nouveau mode fail-closed : corrigée par suppression des faux décodeurs.
- Première exécution correcte : **36/36 tests Java réussis**, dont **10 tests de signature/claims réels**.
- 5 tests supplémentaires de configuration fail-closed ajoutés. Voir les preuves **sur le SHA final** dans PR #39 avant de déclarer terminé.
- La CI de staging continuera de tester sauvegarde/restore et démarrage du cœur V2 ; elle requiert maintenant cinq variables obligatoires.

### Documentation détaillée de ce lot
`worldhealth-vision-v2/docs/architecture/F12B2A_SIGNED_JWT_AND_SCOPE_SECURITY_2026-11-19.md`.

### Limites restantes et GO / NO-GO
Ne pas prétendre que ce lot a déployé un fournisseur OIDC réel. Il manque encore HTTPS public, émission/révocation, quotas, contrôles CORS/trusted proxy, caches, protection abus, gestion des comptes RGPD, tests de charge, backups offsite et API de production. Les identifiants des 217 pays / 22 sources ne constituent pas une couverture réellement ingérée.

**La prochaine branche F1.2b.2b** doit tester Gateway + catalog + timeseries + analytics + ingestion + TimescaleDB *ensemble* en CI, collecter latence p50/p95/p99, RAM/CPU/concurrence et pannes/reprise, sans données inventées ni dépense. Puis documenter le dimensionnement et choisir le fournisseur avant F1.3.

### Pour le prochain chat : procédure exacte
1. Lire ce fichier dans la branche #39 et le document `F12B2A_SIGNED_JWT_AND_SCOPE_SECURITY_2026-11-19.md`.
2. Inspecter les états GitHub actuels de PR **#35, #36, #38, #39**, de l'issue **#37** et de la branche `v2`. Ne pas présumer qu'une PR brouillon a été fusionnée.
3. Vérifier les GitHub Actions du **SHA final de #39**, puis consigner les résultats et les limites.
4. Ne pas changer la V2 publique, les branches média/design, ni engager un coût sans décision.
5. Créer la branche suivante sur le SHA approuvé de #39 (PR empilée) ou sur `v2` si la chaîne a été fusionnée entre-temps ; documenter chaque PR et la continuité.


---

## 9. État réel de F1.2b.2b — six services et benchmark Gateway (19/11/2026)

**Branche candidate :** `test/v2-fullstack-gateway-load-resilience-2026-11-19`, créée depuis le SHA validé de la PR #39 `75f4b72b41a276bbbcb6b4d3ce694be31f39435d`.
**Ordre de dépendance :** PR #36 → PR #38 → PR #39 → branche/PR F1.2b.2b. PR #35 qualité UI séparée. Branche canonique `v2` inchangée et site Vercel public inchangé.

### Travail réalisé et prouvé
- Compose de staging + overlay CI uniquement : Gateway, catalog, timeseries, analytics, ingestion et TimescaleDB ont démarré ENSEMBLE.
- Premier essai échoué pendant le build Maven dans l'image Java (wget ne récupérait pas Maven) : run https://github.com/OBIANG5/World-Health-Vision/actions/runs/44503007006.
- Correctif `infra/docker/java-service.Dockerfile` : utilisation image Maven 3.9.9/Java 21 officielle déjà outillée au lieu d'un wrapper à téléchargement fragile ; digest de production encore à verrouiller.
- Deuxième essai VERT : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44503503358 ; archive JSON https://github.com/OBIANG5/World-Health-Vision/actions/runs/44503503358/artifacts/14518816427.
- 120/120 requêtes GET réussies, quatre travailleurs ; p50 catalogue 51,77 ms, sources coverage 37,90 ms, snapshot économique France **2491,09 ms** ; p95 snapshot France **2926,66 ms**.
- Six conteneurs : ~984,15 MiB RAM rapportée au repos, sans OS et sans charge réelle.
- Arrêt contrôlé d'Analytics : catalogue HTTP 200, synthèse économique HTTP 500 (pas de fausse donnée) ; redémarrage et reprise HTTP 200. Ne prétendre ni HA mondiale ni SLO 24h/24.

### Fichier à lire impérativement pour ce chantier
`docs/architecture/F12B2B_GATEWAY_LOAD_RESILIENCE_2026-11-19.md` — détails, preuve, mesures, limites et suite. Code : `infra/tests/benchmark_gateway.py`, `infra/tests/compose.ci-public-read.yml`, `.github/workflows/whv-v2-gateway-load-resilience.yml`.

### Travail NON terminé et prochain jalon F1.2b.2c
1. Profiler et accélérer la synthèse économique France sans dégrader l'exactitude ni la traçabilité des données.
2. Dégradation contractuelle en 503 JSON au lieu de l'actuel 500 générique.
3. Tests de concurrence graduée et limites de requêtes, quotas advisor et alertes, politique proxy/CORS.
4. Auditer images, TLS, egress et source juridique des données ; dimensionner l'hébergement sur mesures réelles et budget validé.
5. Backend de staging réel avec véritable OIDC/JWT, sauvegarde hors hôte ; F1.3 donnée institutionnelle réellement ingérée jusqu'au frontend.
6. Jamais inventer les sources ni annoncer que GDELT ou les billets sont connectés ; préserver vision internationale et futures verticales de produit.

**Point de contrôle :** vérifier le statut de la PR F1.2b.2b et de son dernier SHA sur GitHub ; ce texte n'est pas une autorisation de fusion ni de déploiement. Aucune dépense autorisée.


---

## 10. REPRISE STRATÉGIQUE INTERNATIONALE + F1.2b.2c (19/11/2026)

**NOUVEAU : ne pas perdre le contenu fondateur de nos échanges depuis GDELT/EarlyForge.** Les deux dossiers maîtres ci-dessous regroupent les idées pertinentes, les distinctions réel/à construire, les sources, la monétisation, la méthode d'investissement et les limites juridiques :
- `docs/product/STRATEGIE_INTERNATIONALE_WORLD_VISION_MASTER_2026-11-19.md`
- `docs/product/REGISTRE_PRODUITS_SOURCES_REVENUS_PRIORITES_2026-11-19.md`

### Vision à préserver de façon permanente
World-Vision = **noyau international de données, événements, prix, comptes et Watch**, avec des produits de grande utilité récurrente : Money-Vision (change/frais net), Transport/Tourisme-Vision (trajets multi-modes, prix surveillés, droits du voyageur), Price/Panier-Vision (prix de magasins, code-barres, livraison/quantité), Trading-Vision (calendrier Forex, contrôle risque, indices devise et journal), BRVM/Bourse Afrique Vision (sous licence), Atlas pays avec institutions locales vs internationales et Média World-Vision (veille, images/voix Vidéo, validation humaine).
GDELT = mentions/signaux (pas vérité statistique) ; EarlyForge = inspiration de regroupement/scoring/chronologie/rédaction et validation. L'IA résume les preuves, mais la vraie valeur est **surveillance et action persistantes**, pas une réponse générique façon ChatGPT.
Monétisation **à tester** : publicité mesurée et non envahissante, affiliation voyageurs/commerces/transferts transparente, Premium alertes, API B2B et partenariats ; aucune estimation de revenu fictive, aucun lien partenaire ou fournisseur déclaré intégré sans contrat.

### F1.2b.2c — branche actuelle et dépendances
Branche `improve/v2-analytics-perf-and-global-vision-2026-11-19`, créée depuis le SHA final de PR #40 `d68bbc23140046026b18ad83a515e130787672fd`.
Chaîne : PR #36 → #38 → #39 → #40 → PR de ce chantier (ouvrir en draft), et PR #35 UI indépendante. Aucune fusion vers `v2` ni sur Vercel sans revue.
Document technique de détail :
`docs/architecture/F12B2C_PROFILAGE_ECONOMIQUE_RESILIENCE_2026-11-19.md`.

### Observations techniques vérifiées (pas une promesse de production)
- Profilage Analytics économique sous CI, 43 requêtes : pays **57,04 ms**, indicateurs **341,16 ms**, séries/provenance **1051,31 ms**, total **1450,07 ms** (moyennes). Le traitement des séries/provenances pèse environ **72,5 %**, priorité de profilage SQL/interservices.
- Run complet mesuré : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44507945357 . Les résultats du benchmark Gateway dépendent des runners, ne pas prétendre un gain définitif à partir de deux jobs différents.
- Le workflow historique avait une incompatibilité Testcontainers 1.20.1/Docker API 1.32 ; correctif de dépendance à **1.21.4**, tests Python, Java et Docker réussis lors de la première validation sur https://github.com/OBIANG5/World-Health-Vision/actions/runs/44507945551 .
- `UpstreamUnavailableHandler.java` distingue panne de route proxifiée et erreur applicative. Deux modes de panne Docker sont observés : `ConnectException` et `UnknownHostException` (Netty DNS SERVFAIL). La seconde cause, initialement non reconnue, entraînait un 500 intermittent ; ajout d'un mapping 503 explicite et d'un test de non-fuite du nom interne. **Ne pas annoncer la correction validée avant CI push + PR sur le SHA final.**
- Les labels de métriques ne contiennent **ni pays ni utilisateur**, uniquement les quatre phases internes.

### Ce qui reste immédiatement à faire
1. Vérifier **workflow Java + Docker + benchmark** sur le SHA exact de la PR candidate ; consulter logs des 503 et corriger toute régression.
2. Ouvrir/mettre à jour PR brouillon empilée sur #40 et documenter les preuves.
3. **F1.2b.2c-2 : analyse détaillée Timeseries/SQL** (nombre d'appels, Hikari, requêtes historiques, cache de provenance), équivalence des séries, sans tronquer périodes ni inventer données. **Issue #42 :** https://github.com/OBIANG5/World-Health-Vision/issues/42 .
4. **F1.2b.2c-3 : optimisation mesurée** (batch/metadata, concurrence, indexes) sur au moins plusieurs essais CI comparables, avec p50/p95/p99 et invariants statistiques.
5. **F1.2b.2c-4 : quotas, limites et protection des fonctions coûteuses**, sans bloquer arbitrairement l'accès mondial légitime.
6. **F1.2b.3** : dimensionnement TCO, TLS, vrai OIDC, backup hors-site, restauration schéma V2 complet, région de lancement avec droits des données.
7. **F1.3** : vraie source officielle dans la DB et API Vercel, puis **F1.4 Watch** (persistance + idempotence), et premiers services Money/Transport/Price ; éventuellement GDELT radar après validation juridique.

### Instruction impérative du chat suivant
Lire CE HANDOFF puis les deux `docs/product/*`, `F12B2C_PROFILAGE_ECONOMIQUE_RESILIENCE_2026-11-19.md`, statuts PR #35/#36/#38/#39/#40 et de la présente PR, ainsi que l'issue #37. Conserver V2, identité visuelle du globe, média/voix Vivienne, décisions de validation humaine et toute la documentation. **Aucune dépense, aucun déploiement, aucune fusion sans revue.**

---

## 11. Reprise suivante — F1.2b.2c-2A (profilage HTTP, PR #45)

**Développement du 19/11/2026, état de validation à vérifier sur le SHA final.**
PR brouillon : https://github.com/OBIANG5/World-Health-Vision/pull/45 .
Branche : `improve/v2-analytics-perf-and-global-vision-sql-profiling-2026-11-19`.
Base **directe #41**, SHA `114342fa7ea6dd34e174b5aece8ac66938826060`, et non directement `v2`.
La chaîne initiale #36 → #38 → #39 → #40 → #41 reste **ouverte et non fusionnée** ; #35 UI reste indépendante.
Issue SQL/performance **#42** toujours ouverte : https://github.com/OBIANG5/World-Health-Vision/issues/42 .

### Faits prouvés sur le SHA de référence #41

Deux GitHub Actions ont réellement conclu SUCCESS le 19/11/2026 sur `114342fa` :
- https://github.com/OBIANG5/World-Health-Vision/actions/runs/44510932342 — CI canonique.
- https://github.com/OBIANG5/World-Health-Vision/actions/runs/44510947429 — six conteneurs, 120/120 GET, HTTP 503 en panne et reprise après redémarrage.

Benchmark p50 dans cette CI : catalogue 38,67 ms, couverture 35,00 ms, synthèse économique France 2 055,50 ms ; ne pas assimiler à un service mondial en production.

### Ce que la PR #45 vient d'ajouter (ne pas présumer CI verte)

- Nouvelle instrumentation des opérations HTTP sortantes Catalog et Timeseries (labels bornés, sans pays/source/utilisateur), sans changement des calculs de données.
- 54 profils économiques × 3 appels de séries = **162 GET Timeseries structurels par snapshot**, plus lectures du catalogue et provenance conditionnelle.
- Rapport JSON agrégé sous artefacts de CI, avec contrôle de couverture et de non-fuite de labels ; tests succès/HTTP erreur/transport erreur et tests du parseur.
- Documentation d'audit détaillée : `docs/architecture/F12B2C2_DEPENDENCY_PROFILING_ET_SQL_2026-11-19.md`.
- SQL identifié : `timeseries.latest_observation` est une vue classant les révisions (window function), utilisée trois fois par indicateur. Les index actuels ne sont pas une preuve qu'ils sont les bons pour ce parcours.

### Instruction concrète de reprise

1. Lire PR #45 et les logs **du dernier SHA** ; si échec, corriger et repasser les deux workflows avant toute validation.
2. Examiner l'artéfact `analytics-dependency-http-summary.json` pour compte/durée et succès/erreurs **par opération** ; mesurer l'effet de concurrence et les métadonnées en doublon sans spéculer.
3. Ne pas fermer #42 sur ce seul lot : ensuite fixture SQL dense, `EXPLAIN (ANALYZE, BUFFERS)`, télémétrie Java/DB et coût de parsing Pydantic.
4. N'optimiser batch, index ou cache qu'après preuves ; conserver les 54 indicateurs, les années communes, les dernières révisions, les statuts observés/estimés et toutes les sources.
5. Maintenir les deux documents maîtres GDELT/EarlyForge/produits/revenus, respecter les exclus V0/V1 et les branches média/voix.
6. Aucun changement de Vercel, aucun achat de données/hébergement, aucune fusion de la chaîne sans revue explicite.

**État de travail : diagnostic et instrumentation proposés en PR brouillon ; la vitesse n'est pas encore améliorée ni validée sur base dense.**

### Premières mesures en CI désormais vérifiées

Sur le SHA `842a9fb78eaa69443cbf722adf2441b252ce85cf`, les deux pipelines complets étaient **SUCCESS** :
- Canonique : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44517342567
- Six conteneurs, panne/reprise et bench : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44517344444
- Artefact : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44517344444/artifacts/14526058478

**43 synthèses**, 54 indicateurs chacune → 2 322 GET Catalog indicators, 2 322 GET par type de lecture Timeseries (latest, availability, series), donc **6 966 Timeseries GET** et 9 288 GET sur les quatre opérations. Durées HTTP moyennes respectives : Catalog indicators 143,089 ms ; Timeseries latest 537,724 ms, availability 518,842 ms, series 545,522 ms. Compteurs zéro erreur. Ces valeurs incluent les attentes de concurrence, **pas uniquement SQL**, et le jeu CI n'est **pas** représentatif d'une ingestion dense. Benchmark p50 FRA ≈ 1 559,75 ms sur ce runner, **non comparable directement au run de référence #41**.

Le premier workflow échoué avait mis à jour une faiblesse du parseur de labels de métrologie : un nom `country_iso3` mal reconnu pouvait échapper au contrôle. Le parseur exige maintenant des labels intégralement reconnus et aucune étiquette inconnue. Les 4 tests dédiés ont ensuite réussi et les six services ont passé les tests.

**ATTENTION :** les deux preuves ci-dessus sont sur `842a9fb` ; toute modification documentaire ultérieure (dont cette section) produit un **nouveau SHA** et impose de revérifier la CI sur le dernier commit. Conserver #42 ouverte pour le vrai profilage SQL + fixture dense et la décision d'optimisation.


---

## 12. Étape isolée — F1.2b.2c-2B / 2C — SQL dense et déduplication de provenance (19/11/2026)

### Chaîne de PRs à respecter

- PR #45 : instrumentation HTTP et rapport de 54×3 appels Timeseries — https://github.com/OBIANG5/World-Health-Vision/pull/45
- PR #46 : **profilage SQL dense**, basée sur #45 — https://github.com/OBIANG5/World-Health-Vision/pull/46
- PR #47 : **single-flight des métadonnées de provenance**, basée sur #46 — https://github.com/OBIANG5/World-Health-Vision/pull/47
- Dépendances complètes : #36 → #38 → #39 → #40 → #41 → #45 → #46 → #47. PR #35 interface indépendante. `v2` ne doit pas recevoir la dernière PR hors séquence.

### Base SQL réellement profilée sur CI jetable

Fixture générée depuis **les 54 véritables profils économiques d'Analytics** : 12 pays, quatre sources avec datasets identifiés, 24 années, deux révisions de collecte, **124 416 observations synthétiques**, **62 208 dernières observations**. Aucune donnée économique nationale réelle n'est fabriquée ni publiée ; les lignes portent un marqueur `WHV_SQL_PROFILE_SYNTHETIC`, la DB n'a pas de port hôte et est détruite après le test.

- Profilage initial du JDBC SQL réel par `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`, une première exécution + cinq répétitions, sur les requêtes séries, latest par source, availability.
- Run vert initial : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44520132376.
- Run avec **les 54 profils canoniques** et matrice HTTP interne : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44521226362.
- Pour ce dernier : SQL isolé série médiane **1,140 ms**, latest **0,924 ms**, disponibilité **1,158 ms** ; aucune lecture disque ni tri externe observé sur ce jeu, sans conclusion de déploiement.
- Mesure des 162 HTTP internes sur la même fixture : 1 requête active **1116,833 ms** de temps total ; 4 actives **595,005 ms** ; 16 actives **447,870 ms** ; 54 actives **419,778 ms**. Tous les GET ont réussi, mais le p95 individuel augmente fortement avec la concurrence. **Ne pas prétendre qu'un plafonnement aveugle est la solution.**

### Preuve d'une inefficacité structurelle plus coûteuse

Dans `ResolutionCache`, le dictionnaire des valeurs terminées était partagé entre les 54 `_build_indicator_overview`, mais **aucune demande en cours n'était partagée**. Les 54 calculs pouvaient simultanément voir la clé absente et déclencher les mêmes appels.
Run de référence : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44521843671 ; artefact `14528038732`.
- 1er snapshot complet : **613 appels HTTP**, dont 216 informations de source, 144 informations de dataset et 36 historiques source, durée **2644,725 ms**.
- 2e snapshot : **345 appels**, dont respectivement 16, 48 et 64, durée **1268,353 ms**.
- Cible logique sur cette fixture : 1 pays + 54 indicateurs + 54×3 lectures Timeseries + **4+4+4** métadonnées = **229 HTTP** (si chaque paire source/dataset n'est chargée qu'une fois).
- Le caractère variable des doublons sous concurrence est précisément la raison de mesurer et corriger. Ne pas soustraire des moyennes de différents runners pour annoncer une accélération.

### Ce que fait la branche candidate PR #47

La fonction `_shared_resolution` maintient des tâches `asyncio` par clé dans un cache limité à **un seul snapshot** : quatre sources, quatre datasets, quatre runs de la fixture ne devraient être demandés qu'une fois, même avec 54 profils parallèles. `None` est conservé pour une absence documentée, les exceptions réseau demeurent des exceptions et un lecteur annulé ne doit pas tuer la tâche partagée. Rien n'est conservé d'un utilisateur ou d'une ingestion à l'autre.

Tests unitaires : 54 lectures concurrentes, clé absente, échec, annulation, clés source/dataset/run. La CI de la PR candidate inclut les workflows canonique, six services Gateway/503/récupération et fixture SQL dense + deux snapshots.

**Validation finale impérative :** comparer l'empreinte SHA-256 de l'intégralité des 54 lenses (en retirant uniquement `generatedAtUtc`) entre le même fixture et les deux branches #46/#47. Les niveaux de sourceAudit, la période comparable, la fraîcheur, le statut OBSERVED/ESTIMATED et les preuves doivent être inchangés. La mesure chiffrée et les workflows doivent être verts sur **le SHA final** ; la PR demeure brouillon et non fusionnée tant que la revue n'est pas effectuée.

### Ce qu'il reste après #47

#42 reste ouverte : mesurer les SQL sur volumes supérieurs/données non uniformes, comparer batch **par indicateur** des trois lectures Timeseries, API Catalog indicateurs en groupe, p50/p95/p99 même runner et concurrence de plusieurs utilisateurs, charge d'ingestion, indices/plan SQL à plus grande échelle, quotas et sécurité. Ensuite F1.2b.3 hébergement validé, F1.3 données institutionnelles réellement ingérées, F1.4 Watch, et verticales utiles (Money/Transport/Price/Trading/BRVM) ; radar GDELT seulement si sources et droits vérifiés. Préserver les documents maîtres de stratégie internationale et revenus de #41, les branches médias/voix et V0/V1 exclus. **Aucun achat, Vercel inchangé, aucune fusion automatique.**


### Mesure comparative démontrée par PR #46 / #47 et prochaine issue #48

**Même date, même fixture synthétique 124 416 observations / 54 profils / 4 sources.**
Baseline PR #46 : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44522730822 (SUCCESS) ; 1er/2e snapshot : **557/317 GET** (source 216/12, dataset 76/32, runs 48/56), **1513,684/839,379 ms**.
Candidate PR #47 (SHA `7a19a3fe`) : trois workflows SUCCESS (canonique `44523204620`, Gateway/503 `44523204307`, dense `44523204585`). Snapshots : **229/229 GET**, source **4/4**, dataset **4/4**, runs **4/4**, **665,957/515,832 ms**.
**Identité sémantique démontrée** : les deux versions donnent le même SHA-256 `31799cc0c650a5d1c6f0e3fdbf5ffdb859374a4790f6a54922e7b1b005489c38` (tout le JSON sauf `generatedAtUtc`), 54 indicateurs, 200 comparaisons et 270 éléments de preuve. Les pourcentages de vitesse ne sont pas garantis hors CI.
Document de preuve : `docs/architecture/F12B2C3_PROVENANCE_SINGLEFLIGHT_2026-11-19.md`.

**Issue d'étape suivante créée** : https://github.com/OBIANG5/World-Health-Vision/issues/48 . Les appels **54 Catalog indicateurs et 162 Timeseries** demeurent ; proposer puis tester des batchs, index SQL seulement si justifiés, limites PAR indicateur, p50/p95/p99, concurrence multi-utilisateurs, très gros jeux de données, coût DB, sécurité. Issue globale #42 reste ouverte.

**Alerte de continuité** : ces éléments documentaires/contrôles constituent un nouveau commit après `7a19a3fe`. Avant fusion, vérifier la CI **du nouveau SHA final** sur PR #47 ; conserver brouillon, chaînage PR, Vercel public inchangé et zéro coût engagé.


---

## 13. F1.2b.2c-3A — premier batch d'indicateurs (19/11/2026)

**PR candidate en branche** `perf/v2-batch-catalog-indicators-2026-11-19`, créée directement sur le SHA validé PR #47 `b9b051a722c59624be89823a9ea4de034c055819`. Ne pas fusionner sur `v2` directement. Issue directrice : https://github.com/OBIANG5/World-Health-Vision/issues/48 . Les deux documents maîtres GDELT/EarlyForge/revenus de PR #41 restent immuables.

### Pourquoi cette étape est prioritaire
Le snapshot économique contient **54** profils. Après la déduplication de provenance #47, un snapshot sur fixture synthétique coûtait exactement **229 appels HTTP** = 1 Catalog pays + 54 Catalog indicateurs + 162 Timeseries (3×54) + 4 Catalog sources + 4 Catalog datasets + 4 Timeseries source runs. Les 54 appels Catalog indicateurs sont groupables indépendamment des algorithmes statistiques. Les 162 appels Timeseries nécessitent une conception distincte avec `LIMIT`/historique par indicateur.

### Code candidat et contrat
- `POST /internal/catalog/indicators/batch`, **réseau interne uniquement**, non routé par Gateway : n'accepte qu'une liste de 1 à 128 codes, chiffres/lettres/points/underscores, valide normalisation, rejette les doublons (400), inconnus (404 global, jamais réponse partielle), charge les détails complets par **une requête JDBC IN paramétrée**, rétablit l'ordre demandé.
- `CatalogClient.get_indicators_batch` vérifie le compte et l'ordre des réponses, refuse une réponse incomplète ou déformée au lieu d'assigner le mauvais indicateur au profil ; compteur `catalog.indicators_batch` sans labels sensibles.
- `WHV_ANALYTICS_CATALOG_INDICATOR_BATCH_ENABLED` (**false par défaut**) active explicitement la lecture groupée uniquement pour les 54 profils économiques ; autres endpoints inchangés. Aucune activation de production.
- Tests Java Testcontainers : équivalence de tous les champs à deux GET existants, codes inversés et minuscules, valeurs manquantes, entrées invalides, collisions, 129 codes. Tests Python : MockTransport, conservation des métadonnées et des erreurs.
- Protocole CI A/B à corpus constant : six snapshots sur données SYNTHÉTIQUES, France et Gabon, parcours ancien / nouveau, comparaison SHA256 de la **réponse entière sauf generatedAtUtc**, 54 profils, 200 comparaisons, 270 éléments de preuve, appels HTTP attendus 229 / **176**. Durées descriptives, pas de promesse p99 ni de vitesse mondiale.
- Trois workflows de preuves sur SHA final : audit Java/Python/frontend, Gateway 503 et retour, SQL dense + A/B. **Ne déclarer aucun gain validé avant succès des trois**.
- V0/V1, média/voix, Vercel et fournisseurs externes ne sont pas modifiés. Pas de dépense.

### Suite après la PR 3A
Issue #48 reste ouverte. F1.2b.2c-3B : batched `latest_by_source` dans Timeseries ; 3C : `availability` et séries historiques (LIMIT PAR INDICATEUR, jamais global), et parités de provenance/révisions. Puis charge grand volume, Hikari/SQL, quotas et F1.3 réelle.


---

## 14. F1.2b.2c-3B — batch Timeseries latest-by-source (19 novembre 2026)

### Preuve validée de l'étape précédente
PR #49, sha final **`941f0157b7c439bc6613e3be82ed66bac5c21c38`** — les TROIS pipelines `SUCCESS` :
- https://github.com/OBIANG5/World-Health-Vision/actions/runs/44526200023 — audit Java/Python/frontend + conteneurs.
- https://github.com/OBIANG5/World-Health-Vision/actions/runs/44526200126 — Gateway panne 503 structurée/récupération.
- https://github.com/OBIANG5/World-Health-Vision/actions/runs/44526200178 — SQL dense + A/B catalogue.
- Artefact : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44526200178/artifacts/14530265656 .
- Six snapshots SYNTHÉTIQUES (FRA + GAB), même base/runner, 54 indicateurs, 200 comparaisons et 270 preuves par snapshot. Baseline **229 GET** → Catalog batch **176 HTTP** (53 appels de moins ; 23,1 %). Les empreintes complètes des résultats (sauf generatedAtUtc) restent égales pour chaque pays.
- France : 811,498 ms (baseline) versus 639,466 ms (batch), deuxième mesure 647,836 versus 563,176 ms ; Gabon 625,445 versus 545,338 ms. **Ne pas extrapoler ces six mesures comme un SLO de production mondiale.** Test initial de formatage JSON corrigé avant sha final.
- PR #49 **DRAFT et NON fusionnée**, flag `WHV_ANALYTICS_CATALOG_INDICATOR_BATCH_ENABLED=false` par défaut. Commentaire de preuve inscrit dans PR #49.

### Chantier nouvellement créé, sous-phase 3B
Branche `perf/v2-batch-timeseries-latest-2026-11-19`, **basée directement sur la PR #49**, et NON sur `v2`. Issue #48 supervise toujours, le reste #42 ouvert.
- SQL Timeseries en une requête : `POST /internal/timeseries/series/latest/batch` avec `indicatorCodes` (1–128 validés), pays et filtres identiques à l'API existante ; le classement porte **obligatoirement sur (indicator_code, source_code, dataset_code, period_granularity)**, puis par date et fetched_at. Aucune limite globale, aucune valeur synthétique réelle.
- L'API regroupe le résultat en ordre de codes demandé, 0 ligne si une source ou un indicateur manque (comme le GET d'origine), préserve les valeurs estimées, observées, timestamps, run key et provenance.
- Client Python `list_latest_by_source_batch` vérifie compte, ordre, indicateur de chacune des observations ; erreur réseau/API conservée, jamais transformée en valeur fictive.
- Activation candidate **explicite** `WHV_ANALYTICS_TIMESERIES_LATEST_BATCH_ENABLED=true`, désactivée par défaut. Cette option concerne uniquement la synthèse économique ; les aperçus individuels et autres verticales ne sont pas modifiés.
- Tests unitaires et intégration Java/Python : exactitude objet par objet, filtres de sources, cas vides, entrées invalides, 129 codes et réponses déformées.
- Une nouvelle CI A/B sur le même dataset dense de 124 416 observations synthétiques, 54 vrais codes d'indicateurs, quatre sources, 24 années et deux révisions doit démontrer **176 HTTP (catalog batch seul) → 123 HTTP (catalog batch + latest Timeseries)**, pour FRA et GAB. L'empreinte SHA256 du JSON complet (sauf generatedAtUtc), 54 indicateurs, 200 comparaisons et 270 preuves doivent rester identiques.
- Trois pipelines complets (canonical, Gateway 503, SQL dense A/B) obligatoires sur le SHA final. En cas d'échec, corriger et documenter avant de prétendre validation.

### Après 3B
- #48 sous-phase 3C : batch `series/availability` et séries historiques. **LIMIT individuel PAR indicateur**, pas de limite globale ; conservation des périodes communes, estimés/observés/manquants et des révisions.
- #42 : charge 217 pays sur fixtures **explicitement synthétiques** et distribution de sources hétérogène, métriques DB/JDBC/Hikari, CPU/RAM, p50/p95/p99 sur plusieurs workers, résilience et cost-control.
- Puis quota/anti-abus, staging approuvé, véritables statistiques institutionnelles locales par pays, Watch, Money/Price/Tourisme/Trading/BRVM et GDELT avec droits, traçabilité et fact-check. Garder la grande vision et les deux stratégies produit/revenus enregistrées PR #41, ne jamais toucher aux branches média/voix, ni V0/V1 ; **aucune fusion/déploiement/achat sans décision**.


---

## 15. F1.2b.2c-3C1 — batch des disponibilités Timeseries, avec limite PAR indicateur

### Chaîne de validation exacte
- La PR #50 `perf/v2-batch-timeseries-latest-2026-11-19`, SHA `044592b6c062e5a34e9c631150e58c79a0f6eb61`, a passé **trois GitHub Actions SUCCESS sur le SHA final** :
  - Audit Java/Python/frontend : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44528125121
  - Gateway panne 503 et reprise : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44528124691
  - SQL dense/A-B : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44528124671
- France + Gabon : même SHA256 JSON entier hors `generatedAtUtc`, 54 indicateurs, 200 comparaisons, 270 preuves ; **176 → 123 appels HTTP** par snapshot grâce au batch latest-by-source (−53 appels). Ce n'est pas une performance de production internationale.
- PR #50 reste brouillon et NON fusionnée ; flag `WHV_ANALYTICS_TIMESERIES_LATEST_BATCH_ENABLED=false` par défaut. Le rapport de validation a été ajouté directement à la conversation de la PR #50 (sans nouveau commit).

### Nouveau lot candidate 3C1
Branche `perf/v2-batch-timeseries-availability-2026-11-19`, créée au-dessus de #50. **Ne pas fusionner directement sur v2, ne pas déployer.**
- `POST /internal/timeseries/series/availability/batch` : code pays ISO3, indicateurs (1–128) et filtres, `limitPerIndicator` 1–500, budget maximum **10 000 lignes** théoriques par batch.
- SQL en une lecture de `timeseries.latest_observation` pour les indicateurs demandés : conserve la même agrégation `available/observed/estimated/suppressed/missing`, première et dernière période, valeur latest, run metadata et source. Ajoute le classement `row_number() partition by indicator_code order by source_code, dataset_code, granularity` pour **limiter chaque indicateur séparément**, jamais globalement.
- Code Python `list_series_availability_batch` contrôle compte, ordre, codes de groupes et données de chaque ligne. Pas de fallback silencieux.
- Activation candidate par `WHV_ANALYTICS_TIMESERIES_AVAILABILITY_BATCH_ENABLED=true` (**false par défaut**), uniquement dans les snapshots économiques, le batch latest par source et Catalog batch restant indépendants. En cas d'activation conjointe, les deux requêtes batch sont lancées en parallèle.
- Tests Java/MockTransport Python : parité complète avec GET historique, filtre IMF, statut estimé/manquant et compte, groupe vide, limitPerIndicator=1, duplications, 129+ codes et plafond de 10 000 lignes.
- Benchmark A/B sur **même fixture synthétique 124 416 observations, mêmes 54 profils réels** : Catalog batch + latest batch restent activés des deux côtés ; disponibilité 54 GET (123 HTTP global) versus **1 POST (70 HTTP global)**. Six snapshots FRA/GAB, SHA256 de la réponse entière hors generatedAtUtc, 54 lenses, 200 comparaisons, 270 preuves.
- Trois workflows sur SHA final (canonique, Gateway 503/recovery, SQL/HTTP dense A-B) obligatoires. Ne déclarer le succès ou un gain de latence **qu'après preuve réelle**.

### Puis F1.2b.2c-3C2 : séries historiques
Ce sera la partie la plus risquée, car la limite de préchargement historique `min(600,max(96,seriesLimit*10))` doit rester **une limite PAR INDICATEUR** et non une limite totale. Il faudra conserver des années communes entre éditeurs, latest run avec révisions, statuts estimés/manquants, périodes disjointes, et comparer intégralement `sourceAudit`, tendance et divergence. #48 et #42 restent ouvertes jusqu'aux validations. Ensuite sécurité, anti-abus, vraie ingestion locale/internationale, Watch, plateformes Money/Price/Tourisme/Trading/BRVM et radar GDELT avec licences. Documents maîtres de stratégie internationale et monétisation PR #41 préservés. Aucune dépense, déploiement, fusion ni changement aux branches média/voix ou V0/V1.


---

## 16. F1.2b.2c-3C2 — historique Timeseries groupé, limites et années communes (19/11/2026)

### Situation de référence, vérifiée sur GitHub

- La PR **#51** (`perf/v2-batch-timeseries-availability-2026-11-19`) reste DRAFT et non fusionnée. SHA final testé `b49ef19888c17bc8c1cc48641373873a1751d4c2`.
- **Trois pipelines SUCCESS sur ce SHA** : canonique https://github.com/OBIANG5/World-Health-Vision/actions/runs/44529625537 ; Gateway panne HTTP 503/récupération https://github.com/OBIANG5/World-Health-Vision/actions/runs/44529625541 ; SQL + diff complet https://github.com/OBIANG5/World-Health-Vision/actions/runs/44529625579 .
- Artefact SQL/HTTP `14533650211` : 54 indicateurs × quatre sources sur données 100 % SYNTHÉTIQUES ; disponibilité regroupée 54 GET → 1 POST, pour **123 → 70 appels HTTP**. SHA-256 du JSON économique entier hors seul `generatedAtUtc` identique, 200 comparaisons et 270 éléments de preuve pour FRA/GAB.
- Décomptage à ce stade : Catalog pays **1**, Catalog 54 indicateurs groupés **1**, latest-by-source **1**, availability **1**, séries historiques **54**, provenance source/dataset/run **12** = **70**.
- Chaîne de branches NON fusionnées : #36 → #38 → #39 → #40 → #41 → #45 → #46 → #47 → #49 → #50 → #51. PR #35 UI indépendante. Les références stratégiques GDELT/EarlyForge/produits/revenus restent celles de #41 ; ne les supprimer ni les remplacer.

### Sous-étape candidate 3C2

- Branche : `perf/v2-batch-timeseries-historical-2026-11-19`, **basée sur le SHA final de #51**, jamais directement `v2`.
- Endpoint POST **PRIVÉ** : `/internal/timeseries/series/history/batch` ; JSON `countryIso3`, `indicatorCodes`, filtres source/dataset/granularité/périodes, `includeMissing`, `sortDirection` ASC/DESC, `limitPerIndicator`.
- JDBC : **une requête** sur `timeseries.latest_observation`, qui conserve les révisions, statuts, valeurs nulles, années et métadonnées. `row_number() OVER (PARTITION BY indicator_code ORDER BY period_start,source_code,dataset_code,...)` puis limite **PAR indicateur**, jamais globale. Le GET historique reçoit le même tie-break déterministe `period_granularity, period_end, run_key` pour dates égales, autrement l'ordre de deux fréquences un même premier janvier était ambigu.
- Bornes : 1–128 codes distincts et validés, `limitPerIndicator` 1–1000, `n_codes * limitPerIndicator <= 40000`, dates ordonnées, sort direction validée ; un indicateur absent retourne une liste vide sans inventer zéro statistique.
- Python : `TimeseriesClient.list_series_history_batch` refuse toute réponse mal ordonnée, incomplète, hors budget, et toute observation portant le code d'un autre indicateur. Erreurs HTTP conservées (pas de repli silencieux).
- Activation candidate : `WHV_ANALYTICS_TIMESERIES_HISTORY_BATCH_ENABLED=true` ; **false par défaut**. Les flags Catalog/Latest/Availability restent indépendants et **désactivés par défaut hors CI**. L'API publique existante n'est pas remplacée.
- `get_country_economic_snapshot` charge Catalog/latest/availability/historique groupés en parallèle seulement avec les flags CI ; le préchargement `min(600,max(96,series_limit*10))` reste **individualisé à chaque indicateur** pour ne pas masquer l'année commune entre pays/éditeurs.
- Attente structurelle : **70 → 17 appels HTTP** (1+1+1+1+1+12) pour 54 indicateurs / quatre sources, soit 53 appels de moins ; la preuve dépend de la CI. Il s'agit d'appels interservices, **pas** d'une réduction promise du temps SQL ni du coût total.
- Tests Java supplémentaires : données hétérogènes OBSERVED/ESTIMATED/MISSING, annual/monthly même période, 2 indicateurs simultanément remplis, code réellement vide, inclMissing true/false, ASC/DESC, `limitPerIndicator` 1/2/5, filtre IMF et dates ; parité champ-à-champ ancien GET/batch. Tests Python : dates, statut manquant, source run, réponse mal ordonnée/hors budget, erreurs 503.
- Benchmark 12 snapshots FRA/GAB sur fixture SYNTHÉTIQUE (12 pays, 54 codes institutionnels du produit, 4 sources, 24 périodes annuelles, 2 révisions, 124 416 lignes), cas normal, includeMissing, sériesLimit 2/12/24, filtre source IMF. Empreinte complète du snapshot **sauf generatedAtUtc** et mêmes preuves entre ancien/nouveau.

### Validation / suite à ne PAS oublier

1. Lire les résultats des **trois CI sur le SHA final** de la nouvelle PR ; réparer tous les échecs de compilation, test, SQL, JSON, sécurité et panne 503/récupération. Si un commit documentaire est ajouté, vérifier encore la CI sur ce dernier commit.
2. Ne déclarer 17 appels ou gain démontré qu'après affichage du rapport et des compteurs. Conserver **la PR en DRAFT**, non fusionnée, sans modification du site Vercel ni des branches média/voix/V0/V1.
3. Préserver l'artefact JSON complet des tests différentiel sans exporter les valeurs synthétiques comme statistiques réelles.
4. Ne pas fermer #42 ou #48 sur une fixture de seulement quatre sources. Ensuite **stress test international** : 217 pays/territoires SYNTHÉTIQUES, géographies locales incomplètes, millions de révisions, daily/monthly, Hikari JDBC/pool/SQL, CPU/RAM, largeur JSON, réseau inter-régions, montée en charge concurrente, quotas/anti-abus et 503/récupération. Étudier aussi une API paginée/streaming si le POST de 54 × 600 lignes dépasse les budgets.
5. Véritables ingestions institutionnelles F1.3 seulement une fois provenance, licences, source locale et fraîcheur vérifiées. GDELT n'est pas source de chiffres officiels ; radar de mentions et contrôle factuel séparés des véritables valeurs économiques.
6. Maintenir la vision produit internationale : Atlas et pays, Watch, Money-Vision, Price/Panier-Vision, Tourisme/Transport-Vision, Trading-Vision, BRVM-Vision, média et monétisation Pub/Affiliation/Premium/B2B (droits/qualité d'abord). Documenter chaque étape sur GitHub, sans acheter ni déployer de backend externe sans décision.


---

## 17. F1.2b.2c-3D — quatre batchs actifs à travers le vrai Gateway, double panne et reprise

**Reprise établie le 19/11/2026. Dernier état technique vérifié directement sur GitHub.**
- PR #53 historique `perf/v2-batch-timeseries-historical-2026-11-19` : SHA `d72e1f2a91ac21f489d9147dc01dedd3308715a2` ; trois CI **SUCCESS** sur ce SHA (canonique `44532155659`, SQL dense/12 scénarios A/B `44532155678`, Gateway panne 503 `44532155721`). Sur **124 416 observations synthétiques**, quatre sources, 54 vrais codes profils, **70 → 17 HTTP** par synthèse quand le batch historique est activé ; SHA-256 du JSON économique entier sauf `generatedAtUtc` inchangé entre les méthodes. Les six chargements normalisés et filtrés FRA/GAB, includeMissing, sériesLimit 2/8/12/24, source IMF sont couverts. PR #53 **DRAFT / non fusionnée**.
- PR #55 (branche `test/v2-optimized-batches-e2e-resilience-2026-11-19`) : https://github.com/OBIANG5/World-Health-Vision/pull/55, basée **directement sur #53**, et NON `v2`. Elle prouve ce qui manquait : *vrai* FastAPI + Gateway avec **les quatre flags ON simultanément**, sans réécrire la configuration de production.
- GitHub Actions #55 : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44533729210 ; **SUCCESS attempt 2** sur `72cd8753fb51402c0bc3b6a75f075577b895258f`. Artefact `14535467010` (métriques CPU/RAM + latences et rapports des opérations HTTP).
- L'échec initial provient d'une indentation de code dans le nouveau workflow CI : réparée. L'autre échec provenait du téléchargement externe indisponible de la dépendance Maven Spring Boot 3.3.2 : relance du job sur **le même SHA**, succès en attempt 2. Il ne faut **pas attribuer cette erreur réseau à l'optimisation SQL**.

### Validation réelle du mode optimisé

- Overlay GitHub CI `infra/tests/compose.ci-batch-optimized.yml` : quatre flags Analytics tous `true` seulement dans des conteneurs jetables, et `false` par défaut dans `config.py`. Le Gateway JWT et la protection des routes privées sont conservés, seul le Gateway est publié sur `127.0.0.1:18080`; DB/Catalog/Timeseries/Analytics sans port hôte.
- 40 GET/route et 4 workers : Catalogue pays **40/40**, p50 32,14 ms/p95 47,02 ; couverture des sources **40/40**, p50 28,85/p95 51,32 ; synthèse économique France **40/40**, p50 **122,17 ms**, p95 **172,25**, p99 **174,63**. **ATTENTION : ce test Gateway est sur base économique presque vide, pas la fixture dense. Il ne prouve aucun SLA international.**
- Compteurs sur les 43 appels économiques (40+3 warmups) : `catalog.indicators_batch` **43**, `timeseries.latest_batch` **43**, `timeseries.availability_batch` **43**, `timeseries.series_batch` **43**, tous succès ; le rapport exige zéro ancien appel N+1. Métriques à labels bornés, sans pays, utilisateur ou source.
- **Analytics arrêté** : Catalogue continue 200 ; Gateway économique renvoie **503 JSON structuré**, `UPSTREAM_UNAVAILABLE` et `retryable=true`, sans chiffres inventés. Reprise 200 après redémarrage.
- **Timeseries arrêté, Analytics actif** : Catalogue continue 200 ; économie renvoie **502 JSON**, sans chiffres économiques fabriqués. Reprise 200 après redémarrage. **Ne pas confondre 502 et 503** : l'harmonisation future de l'erreur dépend du contrat Gateway/Analytics.
- Le POST `/internal/timeseries/series/history/batch` ne s'ouvre pas depuis le Gateway public ; cette absence de route **ne remplace PAS mTLS, identité machine, ACL et quotas nécessaires à la production**.

### Chaîne exacte, choses non faites, décision suivante

- Dépendances PR non fusionnées : **#36 → #38 → #39 → #40 → #41 → #45 → #46 → #47 → #49 → #50 → #51 → #53 → #55** ; #35 qualité UI indépendante. #42 et #48 continuent le suivi de performance ; aucune fusion de toute cette chaîne sans revue, rebase et preuve sur SHA final.
- **Issue prioritaire #56** : https://github.com/OBIANG5/World-Health-Vision/issues/56 — capacité internationale réelle sur volumes/densité/sources hétérogènes, budgets de bytes/CPU/RAM/Hikari, p50/p95/p99 sous utilisateurs concurrents, sauvegarde, auth interne, anti-abus, source locale vérifiée et consentement. Le moteur 17 HTTP doit rester exact **quand la volumétrie augmente**, sans surcharge DB ni disparition d'années communes.
- Distinction constante : référentiel des 217 pays/territoires ≠ données réellement ingérées, et données synthétiques de test ≠ chiffres officiels. Chaque valeur réelle doit avoir source primaire locale, période, unité, révision, date de collecte, licence et historique ; GDELT ne fournit que mentions/signalements, pas preuve statistique.
- Préserver les documents maîtres `docs/product/STRATEGIE_INTERNATIONALE_WORLD_VISION_MASTER_2026-11-19.md` et `REGISTRE_PRODUITS_SOURCES_REVENUS_PRIORITES_2026-11-19.md` : World-Vision Core + Atlas, Watch, Money, Price/Panier, Tourisme/Transport, Trading, BRVM, Radar/GDELT et média éditorial. Revenus Pub/Affiliation/Premium/B2B ne sont que des hypothèses, pas du chiffre d'affaires réalisé.
- **Interdits toujours en vigueur** : toucher V0/V1, fusionner les branches média/voix, déployer Vercel/site public sans accord, acheter données/VPS, annoncer backend international en production, supprimer ou masquer absence/estimations/statuts.
- **Si le présent ajout documentaire modifie le SHA de #55, vérifier à nouveau la CI sur le NOUVEAU SHA**, pas seulement sur le SHA `72cd8753` démontré précédemment.


---

## 18. F1.2b.2d-1 — vraie concurrence sur 12 pays / base dense, coût mémoire, PR #57

**Date : 19 novembre 2026.** La PR #55 a d'abord démontré les 4 batchs ON dans le vrai Gateway (et HTTP 503 pour panne Analytics, HTTP 502 pour panne Timeseries). SHA après mise à jour documentaire de #55 : `80e25d27b888437938df95b8e438c20d28d73e22`, nouveau run GitHub `44535058808` **SUCCESS**. La branche `v2` et le site public restent inchangés.

**Nouvelle PR #57** : https://github.com/OBIANG5/World-Health-Vision/pull/57 ; branche `test/v2-optimized-dense-concurrency-2026-11-19`, base directe #55, **DRAFT et NON fusionnée**. Les deux exécutions du SHA de référence `e8bd5b174384e09de19189d31ef11cb1378f8a9e` ont conclu SUCCESS :
- https://github.com/OBIANG5/World-Health-Vision/actions/runs/44535824959 et artefact `14536631372`
- https://github.com/OBIANG5/World-Health-Vision/actions/runs/44536007880 et artefact `14535358789`.

### Preuves expérimentales

Fixture strictement **SYNTHÉTIQUE**, réutilisant le script SQL de #46 : 12 pays (FRA,GAB,CIV,DEU,USA,BRA,IND,CHN,JPN,ZAF,AUS,CAN), 54 profils économiques réels du code (non des chiffres officiels), quatre sources, 24 années, deux versions = **124 416 observations brutes et 62 208 latest**. Quatre batch flags ON dans vrai FastAPI ; aucune DB/service interne exposé sur le host. **60 snapshots par run** : les 12 pays chacun à 1,2,4,8,12 requêtes simultanées. Total **120/120 HTTP 200 sur les deux runs**. Pour chaque pays, empreinte SHA256 du JSON complet hors generatedAtUtc invariable entre charges ; 54 indicateurs/200 comparaisons/270 preuves maintenus sur cette fixture.

| Simultané | Wall 12 pays run 44535824959 | Wall run 44536007880 | p50 individuel run 1 / run 2 |
| ---: | ---: | ---: | ---: |
| 1 | 3536,127 ms | 4136,893 ms | 286,699 / 312,868 ms |
| 2 | 2789,512 | 3284,259 | 458,709 / 537,527 |
| 4 | 2640,095 | 3075,782 | 833,637 / 918,503 |
| 8 | 2636,088 | 3015,370 | 1675,106 / 1667,071 |
| 12 | 2668,125 | 3092,240 | 2426,658 / 2811,259 |

**Interprétation importante :** sous ces contraintes, le débit de 12 snapshots plafonne vers 4–8 tâches concurrentes et les latences individuelles augmentent. Les p95 sur 12 échantillons par palier ne sont **pas des SLO/p95 de production** et les deux runners montrent une variabilité notable. Ne pas prétendre « la DB seule est cause » : instrumenter Hikari, SQL, attentes HTTP, CPU et parsing avant de fixer les limites.

- Taille moyenne JSON par snapshot : **174 440,5 octets**, maximum **174 766 octets** sur chaque run ; sans compression observée, taille réseau et capacité de parsing devront être testées avec 4→10→50 sources.
- Compteurs privés run 1 : `catalog.indicators_batch=61`, `timeseries.latest_batch=61`, `availability_batch=61`, `series_batch=61` ; `catalog.source=244`, `catalog.dataset=244`, `timeseries.source_runs=244`, `catalog.country=61` ; **61×17=1037 opérations** liées au parcours 60+warmup. Les anciens appels N+1 ne passent pas le contrôle.
- Échantillons **docker stats non exhaustifs** (6 instantanés par service run 1 ; 7 run 2), maximum observé CPU/RAM : Analytics **69,1 % / 174,5 MiB** (run 1), **95,8 % / 184,3 MiB** (run 2) ; Catalog **31,8 % / 294,6 MiB**, **62,3 % / 320,6 MiB** ; Timeseries **226,2 % / 347,7 MiB**, **239,1 % / 392,0 MiB** ; Timescale/PostgreSQL **241,7 % / 350,9 MiB**, **224,0 % / 344,6 MiB**. CPU peut dépasser 100 % sur plusieurs cœurs ; ces quelques relevés ne sont **pas un pic certifié, une réservation mémoire ni un diagnostic de goulet causal**.

### Priorité critique et reprise prochaine

1. **Issue #56** : https://github.com/OBIANG5/World-Health-Vision/issues/56 . Commencer par instrumenter JDBC/Hikari **dans les trois batchs Timeseries** (pool active/idle/pending/acquire, DB query only + mapping SQL/JSON) avec labels bornés, et comparer les paliers sur même fixture et même runner. Dans l'attente, ne pas hausser le parallélisme.
2. Introduire une fixture hétérogène (des sources locales mono-pays, révisions non alignées, OBSERVED/ESTIMATED/MISSING/SUPPRESSED, annuel/mensuel/journalier, calendriers différents), d'abord **50 pays au plus** sous coûts CPU/RAM maîtrisés, puis dimensionner 217 pays sans prétendre ingérer leurs valeurs officielles.
3. Mesurer payloads max 54×600 et effets sous concurrence ; batch de 40 000 lignes est un budget de lignes mais **pas de bytes**. Prévoir limites du nombre d'octets et de coût CPU, pagination/réponse chunkée selon preuves. Maintenir les périodes communes et la provenance.
4. Audit sécurité avant tout staging réel : authentification service à service, ACL/egress, quotas, anti-abus, sauvegarde et restauration, échec et reprise 502/503, contrôle PII, coût par pays et source. Adapter aux RGPD/juridictions.
5. Privilégier la première ingestion institutionnelle locale/source internationale licenciée et traçable puis Watch; respecter les deux docs maîtres GDELT/EarlyForge/produits/revenus. Ne pas toucher V0/V1, branches média/voix ni site Vercel.

**NOTE GitHub :** le présent ajout de documentation fait changer le SHA de #57 ; les deux runs verts mentionnés ci-dessus portent sur `e8bd5b1`. Il faut revalider le workflow sur le **dernier SHA** avant de déclarer la PR #57 elle-même validée et prête à revue.
