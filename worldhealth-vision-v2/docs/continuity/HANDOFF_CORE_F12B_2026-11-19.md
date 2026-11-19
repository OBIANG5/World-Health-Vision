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
