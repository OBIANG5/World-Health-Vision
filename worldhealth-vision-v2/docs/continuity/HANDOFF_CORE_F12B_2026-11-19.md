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


---

## 19. F1.2b.2d-2 — vrai profilage SQL/JDBC/Hikari : PR #58, résultats des deux essais

**Date : 19 novembre 2026.** Reprendre ici si le chat devient trop long. La branche `perf/v2-dense-batch-sql-hikari-profiling-2026-11-19` est basée **sur la PR #57** (qui est basée sur #55 → #53 → #51 → #50 → #49 → #47 → #46 → #45 → #41 → #40 → #39 → #38 → #36). PR #35 UI indépendante. Aucune PR de cette chaîne n'est fusionnée ici, et `v2`, Vercel, V0/V1, média/voix restent inchangés.

### Faits réellement vérifiés
- PR #57 (12 pays × 54 profils × 4 sources, 60 requêtes dans chacun de deux tests concurrents) : SHA final documentaire `aa243a48f438cbf9438cbc9aa2b8635d6d78bc8a` ; ses nouveaux workflows GitHub `44537028007` et `44537036980` ont été revérifiés **SUCCESS**. Fixture 124 416 observations **exclusivement synthétiques**.
- PR #58 : https://github.com/OBIANG5/World-Health-Vision/pull/58 ; commit de tests complet `2ea7b22a58c74c91691b63878f122b0f8695b351`. **Quatre exécutions SUCCESS sur le même SHA** : Java/Python/frontend et conteneurs `44540307785`, régression SQL et comparaison sémantique des 54 indicateurs `44540307910`, profils SQL/Hikari `44540308050` et `44540319995`.
- Artefacts profilage : run1 https://github.com/OBIANG5/World-Health-Vision/actions/runs/44540308050/artifacts/14537992115 ; run2 https://github.com/OBIANG5/World-Health-Vision/actions/runs/44540319995/artifacts/14538391627 .
- Source de la mesure SQL : les **trois vraies instructions Java** `listSeriesBatch`, `listLatestBySourceBatch`, `listSeriesAvailabilityBatch`, liées aux **54 codes institutionnels du logiciel**, exécutées **sans écriture** par `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` sur la seule fixture SYNTHÉTIQUE. SQL chaud, médiane n=5 : historique **50,489 / 51,648 ms**, latest **46,250 / 44,474 ms**, availability **57,068 / 53,048 ms** (run1/run2). Lignes finales FRA : 5002 / 216 / 216. Aucun tri disque dans les plans examinés. **Ces mesures SQL séquentielles ne sont PAS des temps SQL sous la charge concurrente.**
- Le nouveau timer Micrometer `whv.timeseries.batch.jdbc` est étiqueté seulement `operation=history|latest|availability`. Il mesure **acquisition JDBC + exécution SQL + mapping ResultSet**, pas JSON/HTTP/Python. Test Java contrôle étiquettes fixes. Pas de pays/source/utilisateur/texte SQL dans les labels.
- Observations Hikari via métriques Prometheus dans **le réseau Docker privé UNIQUEMENT** (overlay CI distinct). Le pool Timeseries est configuré max **20**. À 12 requêtes simultanées : run1 **20 connexions actives, 14 en attente** au maximum échantillonné, délai d'acquisition moyen **115,776 ms** ; run2 **10 actives, 0 en attente** maximum échantillonné, mais acquisition moyenne **85,331 ms**. Les échantillons n'observent pas tous les pics : **ne pas prétendre que les 20 connexions constituent toujours le facteur bloquant** ni augmenter arbitrairement le pool.
- Temps moyen JDBC total par batch au niveau 12 : historique **857,794 / 720,458 ms**, availability **942,953 / 806,328 ms**, latest **726,138 / 568,833 ms** (run1/run2). À 1 requête : historique **102,550 / 90,704 ms**, availability **104,800 / 80,798 ms**, latest **89,156 / 75,098 ms**. Les 12 pays réussissent à chaque palier, SHA256 du JSON complet de chaque pays inchangé d'un palier à l'autre. **120/120 requêtes HTTP 200 sur les deux runs.**
- À 12 en parallèle, Wall time des 12 pays **2339,760 / 1972,952 ms** et p50 individuel **2161,535 / 1783,961 ms** ; p95 estimé sur n=12 seulement. Les prélèvements Docker CPU/RAM sont rares et ne représentent pas les maxima garantis.
- Au démarrage, la CI a subi un correctif de ligne shell Compose `\)` puis a passé les tests. **Ne pas confondre les anciennes exécutions échouées et la validation sur SHA final.** PR #58 DRAFT et non fusionnée, flags historiques/catalog/latest/availability toujours OFF par défaut sur le vrai logiciel.

### Conclusion et suite la plus intelligente

1. **Goulet révélé :** sous concurrence, acquérir une connexion peut devenir coûteux et des requêtes JDBC groupées qui prennent 90–105 ms seules atteignent ~570–943 ms. Le réseau interne entre Timeseries et Analytics est également volumineux (~197 MB pour 61 snapshots dans l'essai de #57) ; il reste à isoler coût DB, acquittement des connexions, mapping et transmission. Le SQL froid/chaud seul ne justifie **pas** de modifier les index.
2. **F1.2b.2d-3**, sur une **nouvelle branche basée sur #58** : expérience de **backpressure/concurrence bornée** pour les lectures économiques coûteuses, flags OFF par défaut. Comparer planification de 3 batchs parallèles vs gestion bornée, notamment 4/8/12 utilisateurs sur la même DB, même code, même matériel et empreintes intégrales. Mesurer Hikari pending/active/acquire, p50/p95/p99, CPU/DB, temps total, retour 502/503 et preuve des 54 lenses. **Ne pas simplement augmenter `maximum-pool-size=20` à 40 ou promettre une latence globale.**
3. Après preuve, expérimenter **compression HTTP interne** des historiques volumineux (gain réseau versus CPU), limites en octets et défense contre énormes JSON, sans supprimer observations ni révisions.
4. **Issue #56** : ensuite 50 pays/datasets hétérogènes synthétiques avant 217, sources locales mono-pays, mensuel/annuel/journalier, missing/estimé/supprimé, périodes désalignées, pannes, quotas/ACL/mTLS et coût maîtrisé.
5. Premier produit réel : ingestion institutionnelle traçable et licenciée localement, comparaison nationale/régionale/internationale, puis moteur Watch persistant et verticales Money/Price/Travel/Trading/BRVM ; GDELT pour des mentions/signaux, **pas** pour des statistiques officielles. Conserver les deux documents maîtres de stratégie et revenus de la PR #41. Ne pas intégrer branches média/voix dans cette chaîne technique.

**Attention :** le présent commit documentaire change le SHA de #58 ; vérifier le résultat des CI sur son **nouveau SHA**, puis inscrire la preuve définitive en commentaire GitHub sans provoquer de nouveau commit inutile.


---

## 20. F1.2b.2d-3 — admission control économique 0/8/0, résultats A/B/A — 19/11/2026

**À lire en priorité pour reprendre le travail dans un autre chat.** Les deux documents maîtres restent la référence de la VISION et des REVENUS :
- `docs/product/STRATEGIE_INTERNATIONALE_WORLD_VISION_MASTER_2026-11-19.md`
- `docs/product/REGISTRE_PRODUITS_SOURCES_REVENUS_PRIORITES_2026-11-19.md`.
Ces documents sont des **projets/stratégies**, pas un inventaire de produits livrés. Ne pas les remplacer par un résumé technique. Le MEDIA/VOIX, V0 et V1 sont exclus de la présente chaîne backend mais leur stratégie/charte reste préservée.

### Dépendance exacte et état

PR **#59** https://github.com/OBIANG5/World-Health-Vision/pull/59, DRAFT, base #58 (`perf/v2-dense-batch-sql-hikari-profiling-2026-11-19`), laquelle dépend de #57 → #55 → #53 → #51 → #50 → #49 → #47 → #46 → #45 → #41 → #40 → #39 → #38 → #36 → branche `v2` ; PR #35 globe UI distincte. **Rien de tout cela n'a été fusionné/déployé sur le site public à cette étape.**

Dans Analytics : `WHV_ANALYTICS_ECONOMIC_TIMESERIES_BATCH_MAX_INFLIGHT` (**0 par défaut**, schéma Pydantic entre 0 et 64). Un `asyncio.Semaphore` partagé **par processus** peut borner ensemble les trois appels lourds `latest / availability / history` des snapshots économiques. Erreurs et annulations relâchent la place ; métriques `operation` fixe uniquement, sans pays/source/personne. **Ce n'est pas** un rate limiter universel, ni un mécanisme global multi-réplicas. Ne jamais appliquer la valeur 8 aux services publics sans tests supplémentaires.

### Preuve sur la même base de données, mêmes sources, et même code

CI **SUCCESS**, SHA exécutable `e716eb669a3f8d1757f9de089ffd9330502b0e25` :
https://github.com/OBIANG5/World-Health-Vision/actions/runs/44542527928
Artefact intégral : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44542527928/artifacts/14538393774

Le runner crée une base **ENTIÈREMENT SYNTHÉTIQUE** de 124 416 observations, 12 pays, 54 codes canoniques de profils, 4 sources fictives, 24 années et 2 révisions. Les quatre optimisations de batch sont ON **seulement dans ce runner** ; un redémarrage du seul Analytics change le cap **0 → 8 → 0**, PostgreSQL, Catalog et Timeseries ne sont PAS réinitialisés. Pour chaque configuration, 12 pays aux paliers concurrence 1/2/4/8/12 → **60 snapshots** ; 180/180 succès. Pour chacun des pays, SHA256 du **JSON entier hors generatedAtUtc** inchangé entre modes ; toujours 54 indicateurs, 200 comparaisons de sources, 270 preuves sur cette fixture. Aucune observation économique officielle et aucune donnée créée à partir de GDELT.

| Indicateur au palier 12 | Sans limite #1 | Limite 8 | Sans limite #2 |
|---|---:|---:|---:|
| Temps 12 pays (ms) | 2039,224 | **1861,472** | 2019,164 |
| Latence individuelle p50 (ms) | 1803,413 | **1466,674** | 1833,008 |
| Latence individuelle p95 (ms ; n=12) | 2034,339 | **1858,183** | 2014,862 |
| Hikari max active échantillonné | 20 | **6** | 20 |
| Hikari max attente échantillonnée | 3 | **0** | 16 |
| Attente acquisition moyenne (ms) | 89,212 | **0,275** | 69,626 |
| Temps JDBC batch historique moyen (ms) | 776,611 | **178,955** | 775,521 |
| Temps JDBC disponibilité moyen (ms) | 800,549 | **163,583** | 713,851 |
| Temps JDBC dernières valeurs moyen (ms) | 663,130 | **141,353** | 419,961 |

**Interprétation honnête :** le cap=8 a amélioré d'environ 8,7 % le temps total **dans CE run** et a déporté l'attente en amont d'Hikari. Il n'est PAS prouvé optimal ni sûr sous des milliers d'utilisateurs ; les échantillons Hikari ne constituent pas des maxima de production ; l'attente dans Analytics peut augmenter même quand Hikari diminue. Le tri par cache/réchauffage est partiellement atténué par A/B/A, pas éliminé. **Ne pas activer encore en production.**

### La suite technique à exécuter, dans l'ordre, sans moindre effort

1. Assurer **3 validations GitHub sur le SHA final de PR #59** : canonique Java/Python/frontend/Testcontainers, SQL dense et réponses économiques complètes, Gateway réel / panne et reprise (Analytics HTTP 503, Timeseries HTTP 502) avec cap 8 activé uniquement CI si cela ne change pas l'oracle. Corriger toute régression. Attention, l'ajout de ce handoff produit un nouveau SHA : les anciens runs green ne couvrent pas un nouveau commit.
2. Répéter des **contre-expériences bornées** (0/4/6/8/12, plusieurs répétitions, ordres randomisés ou alternés, froid/chaud, niveaux 1/2/4/8/12/plus selon coûts) et enregistrer en plus le **temps de file d'attente Analytics**. Comparer débit total et erreurs/timeouts, fairness entre utilisateurs, annulations pendant la queue, sémaphores multi-process et multi-réplicas. Décider cap ou rejet sur preuves, pas intuition.
3. Mesurer et borner **octets JSON/RAM** de `54 × 600`, tester compression interservices (CPU vs débit vs latence), éviter une allocation incontrôlée et un faux cache de chiffres périmés. Conserver preuves, révisions, MISSING/ESTIMATED/SUPPRESSED et années communes.
4. Issue **#56** (https://github.com/OBIANG5/World-Health-Vision/issues/56) : charge synthétique **hétérogène** sur ~50 pays avant dimensionnement 217 ; sources locales uniquement sur certains pays, périodes daily/monthly/annual, révisions, valeurs absentes, qualité, statistiques comparables, droits; coûts CPU/RSS/JDBC/SQL/Python. Aucune prétention de couverture officielle mondiale.
5. Avant staging public : identités interservices mTLS/scopes, quotas/anti-abus, ACL, backups+restauration, IPv6/routage, métriques privées sans PII, latences internet, pannes 502/503 et monitoring. Aucun achat ou déploiement sans validation du coût et des accès.
6. **Priorité produit par le document stratégique** : (0) Core V2 sûr, fiable et sourcé ; (1) une vraie observation d'une institution nationale **avec licence et période vérifiées**, chaîne source→ingestion→DB→API→globe ; (2) compte + WatchRule persistante, Observation, Evaluation, Outbox et Receipt, consentement/opt-out ; (3) Money-Vision/FX-Watch ; (4) Transport/Tourisme-Watch ; (5) Price/Panier ; (6) Trading ; (7) BRVM/B2B, tandis que Média + GDELT/EarlyForge avancent sur leur piste éditoriale **distincte**.
7. **Revenus prévus (NON réalisés, sans estimation fictive)** : gratuit utile ; affiliation transparente avec tarifs réellement réservables (voyage/transfert/prix) ; Premium alertes, historique et fonctionnalités ; B2B/API/export sous licence ; publicité secondaire ; partenariat média sous indépendance éditoriale. Les expérimentations commerciales sont décrites dans le second document maître avec formules trafic×conversion×commission nette, coûts cloud/API/notifications, rétention et consentements.
8. Conserver `SourceRegistry` et les états `DISCOVERED/CATALOGUED/ACCESS_APPROVED/CONNECTED/INGESTED/VERIFIED/DEGRADED/REVOKED`. **217 pays et 22 sources du registre ne signifient pas couverture réelle**. GDELT fournit des **mentions/signalements**, non de véritables observations statistiques. EarlyForge est un modèle de workflow à examiner, non un partenaire intégré.

**Interdits maintenus :** fusion des PR sans revue, modification `v2` publique, dépense/hébergement, réemploi des données synthétiques comme chiffres officiels, branches média/voix ou V0/V1, promesse de revenus ou d'API fournisseur sans contrat.


---

## 21. Reprise DATA-1B1 — original HTTP + révisions immuables (19/11/2026)

L'objectif produit a **progressé de F1.2b.2d vers de vraies données institutionnelles**, sans abandonner le backlog SQL/Hikari/performance issue #63. La source nationale IBGE/Censo 2022 a fait l'objet de la PR #69 et d'une première requête officielle réelle en CI. La PR DRAFT **#70** (base #69, sans merge) ajoute un archivage privé relecture/replay/évolution de version, empreinte des bytes HTTP et NDJSON, écriture atomique du dossier et contrôles de taille/corruption ; collecte LIVE en CI avec suppression éphémère et aucune publication.

**Document de reprise le plus récent (à lire avant de coder) :** docs/continuity/WORLD_VISION_DATA1B1_BYTE_EVIDENCE_2026-11-19.md sur branche data/v2-ibge-byte-evidence-revision-ledger-2026-11-19, PR https://github.com/OBIANG5/World-Health-Vision/pull/70 . Vérifier ses 2 workflows GitHub Actions sur le SHA final. Prochaine étape DATA-1B2 = https://github.com/OBIANG5/World-Health-Vision/issues/71, droits du dataset, métadonnées, suivi des révisions de source, conservation privée sur vrai volume durable et tests de récupération. Ne pas fusionner #70 en ignorant sa chaîne dépendante, ni mettre des données IBGE non autorisées dans le frontend public.

**Rappels de continuité** : UI #67→#64→#35 (Vercel issue #68), Core jusqu'à #59 en DRAFT, performance issue #63, 11 Visions (Atlas, Watch, Money, Transport, Tourism, Price, Panier, Trading, BRVM, Radar, Média) et documents stratégie/revenus. Média/voix ne sont PAS modifiés. **Aucune dépense ni déploiement payant ou production effectué.**


---

## 22. Reprise DATA-1B2A — métadonnées institutionnelles vérifiées et réutilisation BLOQUÉE (19/11/2026)

PR **#73** DRAFT : https://github.com/OBIANG5/World-Health-Vision/pull/73 (base PR #70 → #69 → Core #59). Deux endpoints officiels IBGE distincts : /api/v3/agregados/4714/metadados et /api/v3/agregados/4714/periodos, réponse live validée. Le champ fournisseur 'modificacao' n'est pas une date de publication vérifiée. Deux archives privées content-addressed, aucun service Timeseries public.

**Document exact de reprise pour le chat suivant :** docs/continuity/WORLD_VISION_DATA1B2A_METADATA_RIGHTS_2026-11-19.md sur branche data/v2-ibge-metadata-rights-gates-2026-11-19. Source/méthode/droits et risque juridique : IBGE politique générale ouverte ≠ autorisation spécifique SIDRA 4714/93. Dossier rights = NEEDS_PROVIDER_CLARIFICATION, publication commerciale BLOCKED. La consultation publique IBGE du 04/11 au 04/12/2026 prépare le prochain plan de données ouvertes, ce n'est PAS une licence. Ancien PDA 2024-2025 historique.

**Preuves CI initiales :** https://github.com/OBIANG5/World-Health-Vision/actions/runs/44617042088 et https://github.com/OBIANG5/World-Health-Vision/actions/runs/44617042183 étaient SUCCESS sur SHA 82723d41892594fbb5ffb49e71cbce035deeb248. Vérifier toujours le **SHA final** après tout nouveau commit. L'API live a été utilisée en CI temporaire privé, aucun payload stocké durablement ni publication. DATA-1B2B = issue #71 à poursuivre : journal append-only de captures, reçu composite, conditions exactes de droits, date de révision, volume durable privé et restauration avec budget approuvé. Puis DATA-1B3 comparabilité WDI, DATA-1C Atlas, Watch. Aucun changement aux branches média/voix ou site Vercel.


## 19 novembre 2026 — CORRECTION DE PRIORITÉ et suite effective DATA-1B2B

**Ne pas perdre le fil.** Suite canonique de la chaîne Core→DATA : #69 DATA-1A → #70 DATA-1B1 → #73 DATA-1B2A → **#78 DATA-1B2B (réalisée sur branche DRAFT)** → **#77 issue DATA-1B3 (prochaine PR)** → DATA-1C production sous droits et persistance. Ces PR sont empilées DRAFT, pas fusionnées dans v2, ni publiées dans Vercel. L'utilisateur a demandé de ne pas confondre un dépannage d'accueil mobile avec une réorientation générale du chantier. Les améliorations de styles/choix de sources PR #75 et le projet de comparaison des articles issue #76 sont enregistrés, mais ne remplacent pas DATA-1B3.

DATA-1B2B : **vraie implémentation**, pas juste feuille de route : acquisition_journal.py (chaque GET, START avant HTTP, SUCCESS/FAILED/STARTED, même SHA = plusieurs événements, ETag/Last-Modified uniquement si renvoyés, firstSeen/lastSeen, audit vérifiable), trois pipelines source IBGE, composite SourceEvidenceReceipt 3 versions explicites population/métadonnées/périodes + RightsReviewDossier, publication bloquée, CLI et tests adversariaux. Vérifications CI 70 tests ciblés/113 régressions vertes puis trois requêtes officielles réelles éphémères validées (première preuve : runs 44625785474 et 44626000686). **Toujours revérifier les CI sur le dernier commit de #78.** Documentation détaillée : docs/continuity/WORLD_VISION_DATA1B2B_ACQUISITION_COMPOSITE_2026-11-19.md. Contrat prochain : issue #77 DATA-1B3 IBGE Censo résident 2022 vs Banque mondiale WDI SP.POP.TOTL/2022 avec méthodes et non-comparabilité explicites. Droits commerciaux dataset exact IBGE encore NEEDS_PROVIDER_CLARIFICATION; aucune hypothèse de licence et aucun Atlas/Timeseries public. Résilience multi-hôte/backup chiffré en attente d'infrastructure et de budget décidés.


## 19 novembre 2026 — SUITE EFFECTIVE DATA-1B3, PAS UNE NOUVELLE PRIORITÉ UX

La priorité promise a été conservée et réellement implémentée : #69 DATA-1A → #70 DATA-1B1 → #73 DATA-1B2A → #78 DATA-1B2B → **#81 DATA-1B3 (PR DRAFT, basée sur #78)**. Aucune n'est fusionnée dans v2. Le problème ponctuel des styles du téléphone a été traité par PR #75 sans détourner cette chaîne; l'issue SOURCES #76 pour les articles et voix/média reste séparée.

**DATA-1B3 :** WDI SP.POP.TOTL BRA/2022 source id 2, acquise réellement avec les octets HTTP originaux et empreintes SHA dans un Bronze privé identique à l'IBGE, un nouveau journal WDI allowlisté sans refonte du système, et un reçu de comparaison méthodologique qui réunit le composite IBGE de trois ressources au WDI. Les définitions ne sont pas équivalentes : IBGE Censo résident date de référence 31 juillet/1er août 2022, avec imputations; WDI = estimation de population de facto à mi-année. Il n'est pas prouvé que les entrées WDI BRA/2022 soient indépendantes de celles de l'IBGE. **Le calcul de pourcentage, la conclusion accord/conflit, l'indépendance, l'autorisation commerciale et Timeseries demeurent BLOQUÉS.**

Tests officiels : CI 102 ciblés + 145 régressions ingestion réussis sur run 44630694152, puis **4 GETs réels officiels IBGE/WDI, journalisation, composite privé et revue SUCCESS** sur run 44630865356. **Toujours contrôler le HEAD final de #81 et sa CI** avant affirmation de validation finale. Documentation canonique : docs/continuity/WORLD_VISION_DATA1B3_IBGE_WDI_COMPARABILITY_2026-11-19.md, issue #77. Aucune valeur IBGE ou WDI officielle dans le dépôt, le reçu, les logs ou les artefacts; dossiers des GETs live supprimés à la fin.

**SUITE STRATÉGIQUE FIXÉE :** documenter la filiation précise BRA-2022 dans les sources WDI/ONU/IBGE, puis DATA-1C sécurisée avec revue des licences par dataset/opération, stockage privé durable chiffré et restaurations prouvées, transactions idempotentes Timeseries, Gateway/Atlas. Pas de nouveau VPS ou déploiement public sans approbation. Ensuite INSTAT Gabon/BEAC et extension internationale honnête, puis Watch/Money/etc. Ne jamais remplacer ce chemin critique par UX, articles ou voix sans décision explicite de priorité.


### Contrôle de continuité final DATA-1B3 et danger Timeseries existant

PR #81 DRAFT est le successeur direct de PR #78. Son moteur de comparaison scientifique privé sur les 4 ressources réelles IBGE/WDI est vérifié. Dernières preuves avant append documentaire : commit 0a0d761ef51b93121b6cbef1db156691c6123509, run 44631913321 SUCCESS (110 tests ciblés + 153 régressions ingestion) et run 44631913275 SUCCESS (3 IBGE + 1 WDI GET, dossiers éphémères supprimés). Renforcement : un reçu avec SHA valide mais conclusion/delta/droit falsifié est rejeté ; conservation des reçus après version révisée ou restauration prouvée. Le statut IBGE licence NEEDS_PROVIDER_CLARIFICATION et la non-comparabilité méthodologique demeurent. Ne pas fusionner ou présenter comme 217 pays réels.

**DATA-1C est l'issue #82** (https://github.com/OBIANG5/World-Health-Vision/issues/82) et la priorité suivante. Ne pas refaire Timeseries : réutiliser les schémas source_run / observation existants, MAIS corriger les mises à jour mutables lors du replay et le tri latest par date de récupération sans vraie révision source. Les états SQL n'acceptent pas MIDYEAR_ESTIMATE : traduire explicitement WDI en ESTIMATED après droits et méthode. Interdire toute écriture non autorisée via l'endpoint /internal/timeseries/ingestion/observation-batches. Droits par dataset/opération, backup/restore chiffrés et autorisation déploiement obligatoires. Aucun back-end réel n'a été publié sur Vercel; toute opération UX est suivie séparément par issue #68/PR #75, et presse multi-sources par issue #76.


## 20 novembre 2026 — DATA-1C-A1 RÉELLEMENT IMPLÉMENTÉE, ne pas revenir sur l'UX

Feuille de route canonique : PR DRAFT #69 DATA-1A → #70 DATA-1B1 → #73 DATA-1B2A → #78 DATA-1B2B → #81 DATA-1B3 → **#85 DATA-1C-A1**, base directe #81. Aucun merge v2, aucun changement du Vercel public, aucun média/voix modifié et aucune infrastructure achetée.

Le TimeseriesService existant a maintenant une première protection **receiver-side** : IBGE Censo2022 table4714/variable93, WDI_POP_TOTAL_BRA_2022 et BRA/SP.POP.TOTL/2022 toujours refusés (droits exacts IBGE non approuvés). L'ingestion interne refuse par défaut toute écriture sans clé serveur high-entropy fournie par WHV_TIMESERIES_INTERNAL_INGESTION_KEY (503 si absente, 403 si erronée). Le producteur Python utilise le même secret non committé, bloque les recherches et mappe WDI population mi-année vers ESTIMATED, jamais OBSERVED. Le secret partagé n'est pas mTLS/OIDC ni une décision juridique.

Flyway V3 ajoute canonical_batch_sha256 nullable pour les anciennes lignes. Même source/dataset/runKey + même requête canonique → no-op (upsertedCount=0) sans changer notes, valeur ou dates. Même clé + valeurs différentes ou SHA manquant historique → 409, pas de backfill fictif. Concurrence arbitré par PostgreSQL, rollback transactionnel, dédoublonnage de l'identité par indicateur/pays/granularité/période, tests de permutation d'ordre. Les erreurs SQL renvoient un message générique sans exposer le payload. AUCUNE donnée réelle IBGE/WDI incluse dans les tests ou mise en production.

**Validation provisoire de cette tranche :** run https://github.com/OBIANG5/World-Health-Vision/actions/runs/44704015448 SUCCESS (13 tests Java réels PostgreSQL Testcontainers, 11 tests Python ciblés, 164 régressions Python). Après l'ultime changement de message d'erreur et de documentation, contrôler le dernier workflow au HEAD de PR #85; ne pas citer les anciennes CI comme une validation d'un commit inconnu.

**Documentation intégrale :** docs/continuity/WORLD_VISION_DATA1C_A1_TIMESERIES_RIGHTS_IMMUTABLE_2026-11-20.md sur branche #85; issue #82 DATA-1C reste ouverte pour DATA-1C-A2 **registre de droits authentifié positif par dataset/opération + protection TOCTOU**, DATA-1C-B2 liaison à la version du fournisseur/tri latest, DATA-1C-C stockage chiffré durable/backup/restore/RPO-RTO, DATA-1C-D vrais Gateway/Atlas. Tous les chiffres non autorisés restent PRIVES. L'interface mobile PR #75 et les médias multi-sources issue #76 restent suivis en parallèle sans changer cet ordre.


## 20 novembre 2026 — DATA-1C-A2A SIGNED RIGHTS + PUBLIC REVOCATION réellement développée

**Ordre réel des PR empilées, toutes DRAFT/non fusionnées sur v2** : #69 DATA-1A → #70 DATA-1B1 → #73 DATA-1B2A → #78 DATA-1B2B → #81 DATA-1B3 → #85 DATA-1C-A1 → **#88 DATA-1C-A2A**, base directe #85. Vercel/site actuel, UI #75, médias/voix/issue #76, coûts VPS : INCHANGÉS.

Le code Timeseries Java 21/PG16/Flyway V4 (PR #88) introduit une **décision de droits signée Ed25519** par une clé privée HORS Timeseries : source,dataset,pays,indicateur,période,opération PUBLIC_API_INGEST,SHA HTTP original déclaré, licence/attribution, validité et deux approbateurs différents. Clé publique de confiance côté serveur WHV_RIGHTS_TRUST_PUBLIC_KEY_BASE64 ; aucune clé privée en prod ni dans GitHub ; zéro grant automatique migré pour les institutionnels. Contrôle positif sous transaction READ COMMITTED et verrous SELECT FOR UPDATE ; trigger PG des événements de révocation append-only prend le même verrou ; recontrôle avant commit et même après replay, 403 si absent/expiré/révoqué/falsifié/ambiguous. Liens immuables source_run→reviewer grant. La vue Timeseries latest_observation et les listes publiques source-runs **masquent immédiatement après révocation** les valeurs non autorisées tout en gardant les versions sources et historique d'audit en base. Les vieux runs V1 non attestés restent stockés mais masqués publiquement, ce qui requiert un audit de compatibilité AVANT tout déploiement.

**Validation de référence PR #88** : GitHub Actions https://github.com/OBIANG5/World-Health-Vision/actions/runs/44708660259 SUCCESS, commit 063307bf320c95e551e63304c990aaffc4b20510, 24 tests réels Java/PostgreSQL 16 (11 nouveaux tests A2 + 8 tests A1 + 5 E2E historiques), 164 régressions Python ingestion, signature CI Ed25519 éphémère RAM seulement, jamais licence institutionnelle réelle. Revérifier HEAD final après documentation. Documentation complète : docs/continuity/WORLD_VISION_DATA1C_A2A_SIGNED_RIGHTS_2026-11-20.md dans branche #88, issue maître #82 et sous-issue #86.

**LIMITE CRITIQUE et PROCHAINE IMPLÉMENTATION** : une grant signée prouve la signature du REVIEWER de la décision, pas les octets originaux eux-mêmes. Timeseries fait encore confiance au SHA HTTP original **déclaré** dans source_run.notes ; il DOIT être lié cryptographiquement au vrai QuarantinedJsonEvidenceStore / AcquisitionJournal en interservices avec signature de preuve et identité workload. C'est **DATA-1C-A2B issue #89** https://github.com/OBIANG5/World-Health-Vision/issues/89. Aucune valeur réelle IBGE Censo 4714/93 n'est autorisée/publiée (NEEDS_PROVIDER_CLARIFICATION) et la permission PUBLIC_API_INGEST n'approuve pas automatiquement l'exploitation commerciale. Puis source revision/latest DATA-1C-B2, sauvegardes privées/restore DATA-1C-C, Atlas/Gateway légaux DATA-1C-D et INSTAT/BEAC Gabon. Rester sur ce chemin critique au prochain chat ; ne pas repartir de zéro ni travailler seulement l'esthétique.


## 20 novembre 2026 — DATA-1C-A2B1 réellement codée, suite issue #92

**NE JAMAIS REPARTIR DE ZÉRO.** La suite stricte des PR toujours DRAFT empilées est #69 DATA-1A → #70 DATA-1B1 → #73 DATA-1B2A → #78 DATA-1B2B → #81 DATA-1B3 → #85 DATA-1C-A1 → #88 DATA-1C-A2A → **#91 DATA-1C-A2B1 (branche data/v2-bronze-evidence-attestation-2026-11-20)**. Aucune fusion dans v2 ni mise à jour du Vercel, aucun VPS acheté, aucun média/voix modifié. Le fil des UX #75 / Vercel #68 et médias/GDELT #76 est conservé séparément.

PR #91 relie maintenant les preuves aux valeurs, pas seulement une licence au SHA déclaré : PrivateBronzeWitness Python relit les raw HTTP bytes, normalized NDJSON, manifest et l'événement SUCCESS AcquisitionJournal exact dans Bronze privé AVANT de signer en Ed25519 une **preuve de recherche privée** ; le TimeseriesReceiver Java exige une SECONDE clé publique Ed25519 de témoin en plus de la clé de rights-reviewer #88 et recalcule un hash des observations envoyées incluant chiffres IEEE754, périodes, country, source metadata et flags. Le contrat de preuve expose originalHttp SHA, normalized SHA, manifest SHA, acquisitionEventId/outcome SHA, fetchedAt seconde/nano, runKey, timestamp de signature et expiration. Un client HTTP possédant seulement l'ancien secret de transport ne peut signer comme témoin. Les clés privées réelles n'ont PAS été configurées et les seules clés positives des tests sont synthétiques/éphémères. Python signe exclusivement PRIVATE_RESEARCH_VALIDATION pour les jeux actuels non licenciés, tandis que Java exige PUBLIC_API_INGEST : **aucune publication réelle débloquée**.

Flyway V5 (non destructive) ajoute SHA de témoin et SHA des valeurs calculés par le serveur sur source_run, NULL historique sans preuve ; la vue publique latest_observation et la liste source-runs exigent attestations ET grants signés non révoqués, sinon les anciennes valeurs sont masquées mais conservées physiquement. Les tokens de témoin éphémères peuvent être renouvelés sans modifier l'identité d'une version et sans réécrire une valeur antérieure. Régression PostgreSQL16/Flyway/Testcontainers et Python complète + vecteurs cryptographiques GOLDEN interlangages ; run de référence après E2E 44713068766 SUCCESS (31 Java/186 Python), puis run après vecteurs 44713366909 SUCCESS (32 Java/187 Python). **Vérifier le HEAD final de #91 après ajouts docs.**

**Dossier technique complet et preuves :** docs/continuity/WORLD_VISION_DATA1C_A2B1_BRONZE_WITNESS_2026-11-20.md sur branche #91 ; issue mère #89 et **nouvelle issue #92 DATA-1C-A2B2** https://github.com/OBIANG5/World-Health-Vision/issues/92. LIMITATION technique fondamentale : QuarantinedJsonEvidenceStore.verify contrôle la structure et les SHA d'une normalisation archivées, PAS encore que chaque valeur NDJSON résulte effectivement du bon parseur de la réponse officielle brute. Un faux NDJSON créé lors de l'acquisition avec hash cohérent serait encore signé comme preuve de cohérence BYTE. La PROCHAINE implémentation #92 doit reparser INDEPENDAMMENT raw→normalized pour IBGE table 4714/93 et WDI SP.POP.TOTL BRA/2022, comparer la sémantique des valeurs, unités, dates et statuts, versionner le parseur, auditer les opérations, puis gérer les clés/identités workload réelles et un émetteur PUBLIC uniquement pour un dataset LICENCIÉ. Aucune licence commerciale IBGE n'est obtenue, donc ne surtout pas court-circuiter les gates.

Suite après A2B2 : DATA-1C-B2 vraies révisions des séries/fetchedAt vs published, DATA-1C-C stockage chiffré et vraie restauration PostgreSQL + Bronze + journaux/droits, DATA-1C-D Gateway/Atlas source/territoire/droits réels, Gabon INSTAT/BEAC, extension institutionnelle mondiale. Documentation et tests sont préférables aux déploiements précipités mais ne pas stagner sur un sous-détail non bloquant.


### ADDENDUM : preuve officielle DATA-1C-A2B1 et prochaine tranche A2B2

Le code de #91 après ajout de deux vérificateurs Python/Java et des tests supplémentaires WDI/métadonnées est validé par **run 44714823320 SUCCESS : 32 Java/PostgreSQL16, 190 Python** sur SHA de code d3e842c756c1433b49d8bffa2cd1ae7fa016500b. Le flux officiel réel est testé par **run 44714823274 SUCCESS : 4 ressources IBGE/WDI BRA2022, 2 tokens Ed25519 RESEARCH ONLY sur les deux vraies valeurs institutionnelles, aucun nombre loggé/exports, répertoire privé temporaire effacé**. Métadonnées et périodes sont toujours des composants de reçu composite, pas des IndicatorObservation. Comme les commits documentaires changent ensuite la HEAD de #91, valider à nouveau le dernier job Python/Java sur la HEAD sans prétendre que la CI réelle doit repoller inutilement les fournisseurs.

**Prochaine issue DATA-1C-A2B2 #92** : https://github.com/OBIANG5/World-Health-Vision/issues/92. Il faut reparser les réponses officielles IBGE/WDI de façon indépendante pour comparer vraiment le raw HTTP aux valeurs normalisées, versionner les parseurs et leur méthode puis sécuriser signataires publics et droits commerciaux effectifs ; maintenir les hard gates sur IBGE 4714/93 tant que l'autorisation de redistribution commerciale n'est pas clarifiée. Les opérations de publication restent bloquées : le Python signe PRIVATE_RESEARCH_VALIDATION, le Java exige PUBLIC_API_INGEST. Continuer DATA-1C-B2/C/D ensuite, sans bifurquer vers les styles du téléphone. La version v2/Vercel reste non fusionnée.


## 20 novembre 2026 — SUITE RÉELLE DATA-1C-A2B2a, contrôle indépendant RAW → NDJSON

Après PR #91 (témoin BYTE Bronze) validée sur **7f34665d81218d5fc9995b1e5dcff033c1e73359** par 2 workflows (44715087036 : 32 Java/PostgreSQL et 190 Python ; 44714823274 sur code d3e842c : 4 GET officiels et 2 signatures recherche PRIVÉE), la nouvelle branche **data/v2-independent-semantic-replay-2026-11-20** empilée sur #91 implémente la suite SCIENTIFIQUE #92.

Le nouveau **semantic_source_replay.py** n'appelle PAS les parseurs originaux des connecteurs. Il reconstruit lui-même depuis les octets HTTP originaux le seul chiffre national IBGE Censo 2022 4714/93, ou l'observation WDI BRA 2022 SP.POP.TOTL midyear **ESTIMATED**, et toutes leurs métadonnées/unité/statut/dates/drapeaux méthodologiques. Il compare l'observation entière au NDJSON premièrement produit. PrivateBronzeWitness, toujours RECHERCHE PRIVÉE seulement, appelle désormais ce contradicteur AVANT de signer la preuve des octets. Un pipeline malveillant ou défectueux qui crée dès le départ un faux nombre ou de fausses métadonnées, tout en signant correctement son propre manifeste et événement SUCCESS, ne peut plus obtenir cette attestation. Les autres sources non validées sont refusées sans fallback.

Nouveaux tests **test_semantic_source_replay.py** : 2 vrais formats officiels synthétiques, 14 cas de falsification avec manifestes SHA + journaux SUCCESS pourtant cohérents, mauvaise année/pays/source, NDJSON à plusieurs lignes, ambiguïté JSON à clés dupliquées. CI offline 44716084775 SUCCESS **46 ciblés / 210 régressions Python** ; CI live 44716300302 SUCCESS sur données officielles IBGE + WDI originales, **2 GET dans TemporaryDirectory privé**, recomputation indépendante, deux attestations Ed25519 *PRIVATE_RESEARCH_VALIDATION*, sans écrire/afficher des chiffres réels ni toucher Timeseries/Atlas. Vérifier le HEAD final de cette branche après documentation ; les SHA des runs intermédiaires ne valent pas preuve d'un commit suivant.

**Document de reprise spécifique** : docs/continuity/WORLD_VISION_DATA1C_A2B2A_INDEPENDENT_SEMANTICS_2026-11-20.md sur cette branche. Une nouvelle PR DRAFT doit être empilée sur #91 ; issue #92 restera ouverte pour les étapes restantes. AUCUNE licence commerciale IBGE 4714/93 approuvée, aucune fusion v2 ni Vercel, aucun VPS.

**Prochaine marche technique A2B2b**, sans repartir du début : attester dans le payload Ed25519 le verifier_version / hash de spécification et code du contradicteur, vérifier version côté Java, empêcher qu'un changement silencieux de parser valide un vieux token ; audit et gouvernance de version, tests adversariaux de protocole. Ensuite DATA-1C-A2C identité de workload mTLS/OIDC, KMS/HSM, approbation revue et révocation de clés dans les lectures, PUBLIC_API_INGEST UNIQUEMENT sur sources réellement autorisées ; puis B2 (révisions provider), C (stockage chiffré/restores) et D (Atlas/Gateway), institutions Gabon INSTAT/BEAC puis extension mondiale. PR UX #75 et médias #76 restent inchangées.


## 20/11/2026 — PIVOT QUALITÉ/PRIX vers PRODUCT-P1 et STAGING, sans abandonner DATA-1C

**Décision stratégique vérifiée par le code** : les PR DRAFT #69→#93 produisent des tests rigoureux mais la valeur utilisateur reste limitée par l'absence d'un parcours Atlas + Gateway + données PUBLIABLES sur vrai STAGING. Le site Vercel public (issue #68) reste un ancien snapshot statique ; les 217 pays du catalogue ne sont PAS 217 connecteurs nationaux réellement actifs. Répartition indicative de travail : **45 % produit/usage**, **30 % sources réelles**, **15 % sécurité/infra bloquante**, **10 % tests/performance/docs**. Les licences, attestations et sécurité restent nécessaires avant diffusion.

**PRODUCT-P1 développé** sur branche product/v2-country-published-coverage-2026-11-20 (base stable PR #93 DATA-1C-A2B2a, héritière #91/#88/#85/#81/#78) : nouveau GET public /api/timeseries/countries/{iso3}/published-coverage, calculé **exclusivement sur timeseries.latest_observation** filtrée par droits/revocations/attestations, compte réellement disponibles OBSERVED / ESTIMATED / indicateurs / sources, et NON catalog.source ou runs bruts. Route Gateway précise GET seule ; rendu FR/EN dans CountryLocalEvidencePanel avec états présent, zéro dans CETTE base, chargement et backend non vérifiable. Aucune source réelle IBGE/WDI non autorisée ne devient publique. Test Java21 PostgreSQL16 + Gateway + build frontend TypeScript/Vite. **Premier run SUCCESS** https://github.com/OBIANG5/World-Health-Vision/actions/runs/44719277458 : 33 tests Timeseries, 46 Gateway, Vite build réussi ; confirmer dernière CI du HEAD après documentation.

**Handoff technique** : docs/continuity/WORLD_VISION_PRODUCT_P1_PUBLISHED_COVERAGE_2026-11-20.md sur cette branche. **Prochaine issue #96 PRODUCT-P2** https://github.com/OBIANG5/World-Health-Vision/issues/96 : réunir frontend/Gateway/Catalog/Analytics/Timeseries/PostgreSQL dans une preview STAGING, piloter parcours pays→sources→indicateurs→provenance/licence/méthode avec démo clairement synthétique, puis un dataset réel après revue de licence spécifique. Vercel production n'a PAS été touché, aucun VPS acheté.

L'algorithme scientifique DATA-1C-A2B2a PR #93 est validé ; le successeur parser-signature A2B2b (branche data/v2-semantic-parser-attestation-2026-11-20) a connu des échecs de CI Java/Python initialement, toujours revérifier son SHA avant une fusion. Ne pas accorder de droit IBGE sur la simple signature d'une réponse. Continuer la sécurité bloquante en PARALLÈLE du STAGING et au bon niveau d'effort, sans perdre GDELT/médias/audiovisuel, conservés séparément.

**Reprise prochain chat :** ouvrir la PR de product/v2-country-published-coverage-2026-11-20, vérifier HEAD et CI, lire ce handoff et l'issue #96. Prochaine valeur : STAGING pilotable, PAS un nouveau moteur de preuve.

---
## 20 novembre 2026 — PRODUCT-P2A : unification effective, continuer P2B
Base #97 bc0d4bd1, source UX #75 b650baed ; branche candidate product/v2-p2a-unified-atlas-ux-2026-11-20. Commits : f90ef5b0 (15 fichiers UX), 4b984d0f (fusion honnête du CountryLocalEvidencePanel), de1f6133 (test complet du backend + vrai frontend UX + quatre réponses couverture SYNTHÉTIQUES).
**CI CONFIRMÉE SUCCESS sur de1f6133** : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44726772494 ; recontrôler CI du HEAD ultérieur si docs/commits.
**Documentation de reprise exacte** : docs/continuity/WORLD_VISION_PRODUCT_P2A_UNIFIED_ATLAS_UX_2026-11-20.md.
Les anciennes branches UX, DATA, médias/voix, v2 et le Vercel public ne sont PAS fusionnés ou déployés. L'interface mobile et le composant réel de couverture coexistent, mais les navigateurs CI utilisent encore des fixtures pour le catalogue et des réponses SYNTHETIQUES pour les quatre tests de couverture. Prochain jalon : P2B — frontend connecté dans UN environnement CI aux six services Java/Python/PostgreSQL, test GAB/FRA/BRA, panne/révocation, puis P2C dataset autorisé et préproduction isolée. Sécurité DATA #95/#94 en parallèle. Aucun VPS sans décision.

---
## 20 novembre 2026 — PRODUCT-P2B : navigateur réel + pile six services
Nouvelle branche : product/v2-p2b-live-stack-gateway-2026-11-20, base P2A 9dd77445 PR #99. PR #100 DRAFT. Code 0682ec8c (proxy read-only loopback, navigateur GAB/FRA/BRA et outage/recovery) et 6a156101 (workflow six vrais services, sécurité Gateway, PostgreSQL16/Timescale, navigateur Chromium, benchmark p50/p95/p99). CI initiale https://github.com/OBIANG5/World-Health-Vision/actions/runs/44728620467 : **VÉRIFIER statut et HEAD FINAL** avant de déclarer le lot terminé.
Document complet : docs/continuity/WORLD_VISION_PRODUCT_P2B_REAL_GATEWAY_BROWSER_2026-11-20.md.
Contrairement à P2A, les pages de ce test utilisent réellement Gateway/Catalog/Timeseries et n'injectent AUCUNE donnée synthétique. La DB de test neuve doit montrer absence de valeurs publiables, pas inexistence de statistiques dans le pays. Aucune publication publique ni VPS. Prochaine priorité : P2C parcours de vraies observations avec droits/méthodes, démo synthétique isolée + licence légale vérifiée, puis STAGING URL privée et P3/P4. Protéger impérativement toutes les branches médias, voix, globe, UX, DATA #95/#94.

---
## 20/11/2026 — PRODUCT-P2B : CI de bout en bout CONFIRMÉE
PR #100 (DRAFT) : https://github.com/OBIANG5/World-Health-Vision/pull/100 ; branche `product/v2-p2b-live-stack-gateway-2026-11-20` sur PR #99/P2A, base P1 PR #97. **SHA testé `71130169de65954b407a3b365f03f58e61a7a4e8`**, run https://github.com/OBIANG5/World-Health-Vision/actions/runs/44729189035 **SUCCESS** : vrais six conteneurs, Gateway JWT, Catalog et Timeseries/DB ; Chromium mobile GAB/FRA/BRA ; arrêt et reprise Timeseries ; 36/36 GET coverage réussis. Latences p95 local CI : GAB 27,42 ms, FRA 21,10 ms, BRA 24,81 ms, 12 requêtes par pays ; non généralisables. Artefact test `14625631603`. Détails et limitations dans `docs/continuity/WORLD_VISION_PRODUCT_P2B_REAL_GATEWAY_BROWSER_2026-11-20.md`. **Aucun backend public**, source externe licenciée, migration de #95, fusion sur v2 ou dépense. Prochain P2C : pays→indicateur→valeur→source→licence→méthode, jeu synthétique étiqueté avec révocation vérifiée au navigateur, puis première source réellement autorisée et preview protégée. Ne pas oublier stratégie internationale, onze Visions, médias/GDELT et la qualité mobile.

---
## 20 novembre 2026 — P2C0 : lecture de comparaison publique sécurisée
PR #101 (DRAFT) sur PR #100 : https://github.com/OBIANG5/World-Health-Vision/pull/101.
Route GET publique `/api/timeseries/compare/countries/latest` identifiée comme lisant `timeseries.observation` brute au lieu de la vue légale `timeseries.latest_observation`. Risque de divulgation d'une ancienne observation non attestée ou révoquée. **Corrigé** en utilisant uniquement la vue filtrée avec sélection de dernière période par pays/source. Tests PostgreSQL16 confirment visible si autorisée, invisible après révocation, invisible sans attestation même en `includeMissing=true`. Code SHA `cf2cc0fa4ed8abe5d281f109c756fd827d5379c3` ; CI **SUCCESS** https://github.com/OBIANG5/World-Health-Vision/actions/runs/44730123897. Dossier de reprise : `docs/continuity/WORLD_VISION_PRODUCT_P2C0_PUBLIC_COMPARISONS_RIGHTS_2026-11-20.md`. Prochain P2C1 : parcours concret d'indicateurs publiables et valeur, source/méthode/droits, UX mobile et révocation reflétée dans l'interface ; P2C2 preuve DEMO synthétique de bout en bout, puis première donnée réellement sous licence. Ne pas merger #95/#94 automatiquement ; pas de déploiement Vercel.

---
## 20 novembre 2026 — PRODUCT-P2C1 : premier explorateur de vraies séries éligibles dans Atlas
PR #102 (DRAFT) https://github.com/OBIANG5/World-Health-Vision/pull/102, base PR #101→#100→#99→#97. Nouveau GET `/api/timeseries/countries/{iso3}/published-indicators`, uniquement sur latest_observation sous droits/Bronze, liste bornée d'indicateurs réellement publiables (observé/estimé/sources/date). Nouveau `PublishedIndicatorExplorer` dans CountryLocalEvidencePanel : sélection d'indicateur, derniers relevés par source via Timeseries non caché, unité et méthode Catalog, dates sourcePublishedAt/fetchedAtUtc, notices de droits sans prétendre à une licence de revente. Revalidation coverage et liste au retour focus/onglet, pas de stale sur une nouvelle réponse. **CI SUCCESS SHA `9b6a4dadce66b5d3afb02d5942f9e78e4be6a8e9`** https://github.com/OBIANG5/World-Health-Vision/actions/runs/44731981979 : 33 Timeseries+46 Gateway, build TypeScript/Vite/ESLint, Chromium 320px/iPhone/desktop PASS avec scénario synthétique de révocation, artefact 14626323587. PREUVE UI **SYNTHÉTIQUE**, pas de dataset public réel ni combinaison CI UI+ingestion signée dans la même stack. Document de reprise précis : `docs/continuity/WORLD_VISION_PRODUCT_P2C1_REAL_INDICATOR_EXPLORER_2026-11-20.md`. Prochain P2C2 : vrai jeu test-only signé et révoqué DANS PostgreSQL via six services, observer son apparition/disparition DANS le navigateur, puis P2C3 premier dataset fournisseur sous licence et URL staging privée. Déploiement Vercel inchangé, aucune fusion/dépense. Préserver #95/#94, GDELT/média et toutes les Visions.

---
## 20 novembre 2026 — PRODUCT-P2C2 (PR #106) : signatures + vraie stack, révocation iPhone
Branche `product/v2-p2c2-signed-live-atlas-revocation-2026-11-20`, base PR #102. Issue #103, puis #107 pour P2C3 source officielle.
Fichiers : `infra/tests/p2c2_signed_fixture.py` (2 clés privées indépendantes créées en mémoire, raw/normalized/manifest/journal SYNTHÉTIQUES avec SHA et item fingerprint ; signe le scope CI et le témoin distinct, pas de licence fournisseur), `infra/tests/compose.ci-synthetic-rights.yml` (trust public + token éphémère), `frontend/web-v2/p2c2-signed-live-browser.mjs` (même onglet iPhone avant/après vraie révocation en DB), `.github/workflows/whv-v2-p2c2-signed-live-atlas-e2e.yml`.
Code SHAs `e274c7e9`, `5546feda`, `49fe188c`, navigateur Chrome runner optimisé `49f45e89`.
Premier run https://github.com/OBIANG5/World-Health-Vision/actions/runs/44769022804 : signatures, 6 services, refus bad token et valeur altérée, vrai POST SYNTHETIC, Gateway renvoie 1 observation et 1 indicateur, source-runs HTTP401 = SUCCESS des étapes ; téléchargement Chromium ancien chemin lent, **conclusion navigateur À VÉRIFIER**.
Second run https://github.com/OBIANG5/World-Health-Vision/actions/runs/44770455822 : browser Chrome installé ou repli borné, **conclusion à vérifier** avant validation P2C2.
Handoff dédié : `docs/continuity/WORLD_VISION_PRODUCT_P2C2_SIGNED_LIVE_ATLAS_2026-11-20.md`.
PROCHAIN : finaliser CI de la révocation DANS le même navigateur ; P2C3 issue #107 candidat Insee Melodi sous Licence Ouverte avec dataset précis/méthode/quota/licence à vérifier, 1 série réelle avant staging privé. Ne rien déployer sur Vercel, ne jamais autoriser IBGE/WDI réel via des signatures CI, préserver 11 Visions/médias/GDELT.

---
## 20 novembre 2026 — PRODUCT-P2C2 FINI ET VALIDÉ en vraie stack (CI uniquement)
PR #106 DRAFT `product/v2-p2c2-signed-live-atlas-revocation-2026-11-20` ;
**code SHA `49f45e89af16f66131a925acb8a625218886dcdb`,
CI https://github.com/OBIANG5/World-Health-Vision/actions/runs/44770455822 SUCCESS**.
Démonstration avec deux signatures Ed25519 éphémères indépendantes sur des
octets/source/normalisés/manifest/journal **ENTIÈREMENT SYNTHÉTIQUES** ;
vraie ingestion private Timeseries acceptée (bad key et changement signé refusés),
6 services Compose, SQL latest_observation / Gateway, vrais Atlas navigateur
320px, iPhone390 et desktop1440 PASS ; révocation physique rights_revocation
pendant le même navigateur iPhone → disparition de valeur partout sur API
publique et UI PASS. Forensic : 1 raw observation conservée, 0 observation
publiable, 1 décision révoquée. Screenshots GitHub Actions artefact ID
`14647466570` (test-only, pas de vraies statistiques).
Documentation détaillée
`docs/continuity/WORLD_VISION_PRODUCT_P2C2_SIGNED_LIVE_ATLAS_2026-11-20.md`
section 8. Les précédents textes « CI en cours » sont historiques, **résultat
final SUCCESS confirmé**.
Aucun vrai droit fournisseur, ni chiffre INSEE/IBGE/WDI ou Gabon réel,
aucun merge, aucun Vercel nouveau, VPS, ni coût. **Prochain travail #107** :
première source réelle vérifiée juridiquement et scientifiquement, pilote
France INSEE Melodi (Licence Ouverte générale et 30 requêtes/minute, à
confirmer pour le dataset choisi), pipeline source→Bronze→witness/parseur/
revue droits→Timeseries→Atlas et PREVIEW privée, ne pas prétendre couvrir
217 pays en séries statistiques. #95/#94 doivent être examinés avant diffusion
commerciale. Conserver l'intégralité des onze Visions, média et GDELT.

---
## 20 novembre 2026 — PRODUCT-P2C3 PIlOTE INSEE : Quarantaine réelle prête, aucune série officielle publiée
Branche `product/v2-p2c3-insee-melodi-private-evidence-2026-11-20`, PR #108 DRAFT sur P2C2 PR #106, issue #107. Connecteur officiel Insee Melodi `DS_POPULATIONS_REFERENCE` + `GEO=FRANCE-F`, `POPREF_MEASURE=PTOT`, recherche sans réseau par défaut, parseur fail-closed avec allowlist HTTPS exacte et statuts, archive immuable `QuarantinedJsonEvidenceStore`, `PRIVATE_RESEARCH_VALIDATION` / `NOT_ATTEMPTED` uniquement. Pas de Timeseries ni signature de licence.
**Code SHA `3b0d3e8a70605ceb551a625494fc612d76a7fe42` ; CI `44772963402` SUCCESS**, 44 tests source/provenance/quarantaine + 27 régressions droits/Bronze, 71/71 PASS. Le job GET réel `optional-real-provider-read` a été SKIPPED volontairement (le workflow permet un `workflow_dispatch provider_network_probe=true` pour exactement un GET privé, aucun artefact source divulgué). Les chiffres des fixtures = exemple documentaire historique et NON donnée actuelle ou officielle ingérée. Les pages Insee annoncent Licence Ouverte générale et accès Melodi 30/min mais le droit/méthode précis d'une série reste EN REVUE. Aucune licence commerciale automatiquement accordée, aucune valeur sur Vercel public, aucune dépense.
Handoff complet : `docs/continuity/WORLD_VISION_PRODUCT_P2C3_INSEE_PRIVATE_AUDIT_2026-11-20.md`.
Prochain : premier GET source officiel privé, revue de shape/territoire (FRANCE-F != FRA sans validation), PTOT vs PMUN, périodes, unité, attribution et droits web/API/commercial ; dossier de licence distinct et reviewer signé ; PR #95/#94 comme gates avant ingestion institutionnelle, témoin Bronze indépendant puis une vraie série sous droits dans Atlas, et PREVIEW privée avec backup/restore/rollback. Preserve projet international, 11 Visions, sources locales INSTAT/BEAC, médias/GDELT.

---
## 20 novembre 2026 — PRODUCT-P2C3 PREMIÈRE VRAIE SOURCE INSEE : audit réel réussi, PAS de publication
PR #108 DRAFT sur P2C2 #106 : branche
`product/v2-p2c3-insee-melodi-private-evidence-2026-11-20`.
**Code final validé SHA `f21ccc0b2010175fe715ca8e61cfcf7734a766e2`**,
offline GitHub Actions https://github.com/OBIANG5/World-Health-Vision/actions/runs/44774479821
**SUCCESS 47 tests Insee + 27 régressions droits/Bronze = 74/74**.
**PREMIER GET RÉEL OFFICIEL INSEE RÉUSSI** en audit GitHub éphémère :
https://github.com/OBIANG5/World-Health-Vision/actions/runs/44774548064,
br. `audit/insee-melodi-one-time-final-schema-2026-11-20`.
Source HTTP GET uniquement `DS_POPULATIONS_REFERENCE?GEO=FRANCE-F&POPREF_MEASURE=PTOT&maxResult=20` ; réponse effective `GEO=2025-FRANCE-F` (VERSION géographique 2025) et `TIME_PERIOD=2023`, JSON float codant ENTIER exact. Le parseur a été corrigé sur preuve réelle, sans arrondir. La source a été vérifiée en **Bronze temporaire privé**, puis supprimée du runner ; AUCUN CHIFFRE affiché dans GitHub, AUCUN POST Timeseries et aucune licence/revue PUBLIC_API_INGEST accordée. Échecs intermédiaires utiles audités : 44773502271, 44773788927, 44774306006 ; diagnostic sans valeur 44773997299. La CI de code final et le GET réel sont SUCCESS. Les fixtures des tests NE SONT PAS des chiffres officiels actuels.
Documentation exhaustive : `worldhealth-vision-v2/docs/continuity/WORLD_VISION_PRODUCT_P2C3_INSEE_PRIVATE_AUDIT_2026-11-20.md` §8.
**Prochain travail** : première archive Bronze durable privée sous droits, dossier de licence du dataset précis (usage WEB/API/commercial, attribution, exceptions, méthodes), identité du parseur #95 / gouvernance #94, signature indépendante et vraie ingestion en PREVIEW protégée, puis promotion séparée. Les sources locales Gabon INSTAT/BEAC et l'internationalisation restent prioritaires ; préserver les onze Visions, média/GDELT, Watch/Money/Transport/Price et tous les anciens travaux GitHub.

---
## 20 novembre 2026 — PRODUCT-P2C3B : FEHM et double métadonnée réelles, sans fausse statistique nationale
**PR #111 DRAFT**, branche `product/v2-p2c3b-insee-metadata-geoscope-2026-11-20` base #108 (#106 P2C2). Audit catalogue officiel `DS_POPULATIONS_REFERENCE` https://github.com/OBIANG5/World-Health-Vision/actions/runs/44777513706 SUCCESS : `spatial.id=FEHM` = **France hors Mayotte**, `publisher.id=INSEE`, période statistique 2023, millésime géographique 2025, unité `Individu`, accès `Public`, confidentialité `Libre`, statut `publie`. La précédente inférence `countryIso3Candidate=FRA` était imprudente ; elle est désormais `null`, `NOT_MAPPED_TO_ISO3`.
Code : `services/ingestion-service/src/ingestion_service/connectors/insee_melodi_catalog_review.py` nouveau, vrai GET catalog en lecture seule, archive privée des bytes métadonnées en plus des bytes chiffre, lien SHA256, validation stricte des droits d'accès/statut/GEO FEHM et temporality ; `ProtectedSourcePublicationGate.java` **bloque en plus au RECEPTIONNAIRE** toute ingestion publique des datasets exacts `DS_POPULATIONS_REFERENCE` et `..._CATALOG` en attendant modèle de scope et deux décisions humaines.
Premier code SHA `29014f7267d637b86a22ff9ef58c04ddb3d1075f`, Python CI https://github.com/OBIANG5/World-Health-Vision/actions/runs/44778485343 : **117/117 PASS (43 nouveau +47 ancien +27 droits)**. Audit LIVE à deux GETs : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44778754616 SUCCESS, receipts métadonnées + données P2C3 dans même runner, FEHM/2023/2025 concordent, rien publié, bytes éphémères détruits. CI Java/Postgres lancée sur commit suivant : **à vérifier sur SHA FINAL**. Dossier GitHub `docs/continuity/WORLD_VISION_PRODUCT_P2C3B_INSEE_FEHM_METADATA_2026-11-20.md`.
**Prochaine valeur :** revue de droits précise du dataset Insee (Licence Ouverte 2.0 générale sauf exception ; attribution `Source : Insee`, mise à jour), décision signée par humains distincts, modèle territorial FEHM distinct de France entière/FRA, vrai archivage durable privé, #95/#94, puis une série statistique réelle sous contrôle dans staging privé avec mobile/rollback. Rien mergé, Vercel inchangé, aucune dépense ni donnée institutionnelle réellement mise en ligne. Préserver le globe, les 11 Visions, sources locales Gabon INSTAT/BEAC et toutes les branches média/GDELT.

---
## 20 novembre 2026 — P2C3B VALIDATION FINALE (suite de la note P2C3B précédente)
**PR #111 DRAFT**, code testé `1b6dd2eeaa2d395d9d8510fbc503e3e5fe1c1b77`.
GitHub Python https://github.com/OBIANG5/World-Health-Vision/actions/runs/44779490804 **SUCCESS 118 PASS (44+47+27)**.
Java/Flyway Postgres16 https://github.com/OBIANG5/World-Health-Vision/actions/runs/44779491144 **SUCCESS 33 PASS (0 échec)** ;
**151 tests réussis** en tout sur le même SHA. GET Insee catalogue réel 44777513706 et deux GET catalogue+valeur réels 44778754616 PASS, sans valeurs exposées ni artifact de source, pas de publication réelle. `spatial.id=FEHM` = « France hors Mayotte », pas la France entière/FRA ; correction Python `countryIso3Candidate=null`, lien SHA catalog, verrou Java `ProtectedSourcePublicationGate` pour datasets INSEE `DS_POPULATIONS_REFERENCE` et `..._CATALOG`, même avec source forgée.
Document complet : `docs/continuity/WORLD_VISION_PRODUCT_P2C3B_INSEE_FEHM_METADATA_2026-11-20.md` §8.
**Next** modèle international source-native geo scope (version, inclusions), licence dataset/signature humaine et attribuée, migration de comparaison/Atlas, stockage privé durable et staging HTTPS protégée. Ne pas confondre les 151 tests CI avec licence réelle, droits commercial ou publication. Aucun VPS/Vercel modifié.

---
## Suite à prendre après P2C3B : issue #112 (périmètres mondiaux / FEHM)
Créer une RFC puis implémenter sans casser la pile réussie le modèle
`geographicScopeId` source-native, version, inclusions/exclusions et
relation ISO3 uniquement après revue ; propagation en SQL comparaison,
Gateway et Atlas mobile, tests d'incompatibilité/droits. **Issue #112**
https://github.com/OBIANG5/World-Health-Vision/issues/112 .
Le premier pipeline de données réelles INSEE (P2C3B #111) est testé
**151 PASS + 2 vrais GETs source** mais AUCUN droit réutilisation
signé ni chiffre dans Atlas ou Vercel public. Les instructions de reprise
sont dans `docs/continuity/WORLD_VISION_PRODUCT_P2C3B_INSEE_FEHM_METADATA_2026-11-20.md`
§8–9, puis PR #108, #106, #95/issue #94 et issue #107.

---
## 2026-11-20 — P2C3C issue #112 : périmètres institutionnels MONDIAUX
PR #113 DRAFT (`product/v2-p2c3c-geographic-scope-foundation-2026-11-20`), base PR #111 (P2C3B) → #108 P2C3 → #106 P2C2. **Migration Flyway V6** ajoutant `timeseries.geographic_scope_registry` source-native/immutable, code/version géographique alphanumérique, année facultative, pays parent facultatif en transfrontalier, inclusions/exclusions, statut `RESEARCH_ONLY`, aucune équivalence ISO3 ni autorisation signée ; verrou dataset INSEE anti-source forgée et API nationale `latest_observation` + source-runs public rights-gated. Java bloque une revendication geo non revue avant ingestion ; DB aussi en trigger. **Aucun chiffre réel Insee publié, Vercel inchangé, aucun merge.**
CI fiable pour version enrichie `e500851ec44dce4607e334918779e22c2d30aee0` : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44784585785 **SUCCESS 42 Java/PostgreSQL16/Flyway**. CI additionnelle prouvant maintien V5 droits/révocation en cours sur SHA `2a35495f8673a54cbe44ef29be5c721da5b6aa3e` : vérifier le résultat final. Les échecs 44782942227 (import test) et 44783989398 /44784258639 (SQL régex tronquée) corrigés depuis commit V6 précédemment vert, pas maquillés. Dossier COMPLET `docs/continuity/WORLD_VISION_PRODUCT_P2C3C_NATIVE_GEOGRAPHY_FOUNDATION_2026-11-20.md`.
**À reprendre** : issue #112 tranche P2C3C2 : reviewer/countersigner SIGNÉS d'équivalence géo avec révocation (#94), parser attestation (#95), endpoint spécifique source-native sous droits distinct des comparaisons pays, UX Atlas explicite sans mensonge FEHM=FRA, premier vrai dataset attribué/licite en staging protégé, Bronze original DURABLE et sauvegardé. Après : sources locales de chaque pays, notamment Gabon INSTAT/BEAC ; média/GDELT et onze Visions préservés.
