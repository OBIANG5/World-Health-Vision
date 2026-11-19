# World-Vision V2 — F1.2b.2b : Gateway complet, charge et reprise après panne
Date d'audit : **19 novembre 2026**. Statut : **tests éphémères réussis ; aucun hébergement public**.
Branche : `test/v2-fullstack-gateway-load-resilience-2026-11-19`.
Dépendance : PR **#39** (`security/v2-jwt-signature-audience-scopes-2026-11-19`) ; auparavant PR #38 puis #36. PR #35 (qualité UX) indépendante. **V2 seulement, jamais V0/V1.**

## 1. Ce qui a été réellement développé

- `infra/tests/compose.ci-public-read.yml` : overlay de TEST uniquement, qui active les 57 GET explicitement publics sur une stack isolée ; JWT reste obligatoire pour les routes privées. Aucun service métier ou DB ne publie un port. Gateway sur `127.0.0.1:18080`.
- `infra/tests/benchmark_gateway.py` : benchmark reproductible et volontairement borné à `http://127.0.0.1:18080`, 400 requêtes max par route, 12 travailleurs max, six chemins max. Mesures min, moyenne, p50, p95, p99, max, codes HTTP et échecs. Aucun objectif SLA inventé.
- `.github/workflows/whv-v2-gateway-load-resilience.yml` : construction et démarrage éphémère de Gateway, catalog, timeseries, analytics, ingestion et TimescaleDB, vérification d'accès, requêtes concurrentes, panne provoquée d'Analytics, observation du catalogue et reprise après redémarrage ; archivage JSON des métriques. Destruction des volumes et secrets en fin de CI.
- `infra/docker/java-service.Dockerfile` : build Java Maven 3.9.9 avec image officielle Maven/Temurin 21. Le précédent Dockerfile utilisait `mvnw` à l'intérieur d'une image JDK sans Maven installé ; l'installation du wrapper dépendait d'un téléchargement de Maven qui échouait. La correction a permis le build complet en CI. **Le tag d'image mutable devra être épinglé par digest après revue d'image pour le déploiement réel.**

## 2. Preuves, échecs et corrections

- **Premier essai échoué** (avant le démarrage Java) : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44503007006 . Raison exacte : `wget: Failed to fetch ... apache-maven-3.9.9-bin.tar.gz` pendant l'exécution `./mvnw` dans les étapes du Dockerfile Java. Ce n'était PAS un échec de performance.
- **Essai corrigé entièrement vert** : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44503503358 , SHA `5105d3ff1ba5b43b899b8f2afc3d4f3da68e286c`.
- GitHub Actions : compilation et démarrage des **six conteneurs** réussis ; `/actuator/health` disponible, GET catalogue public 200, GET privé `source-runs` 401, POST conseiller anonyme 401.
- **Archive de mesures** (JSON bruts, 2126 octets) : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44503503358/artifacts/14518816427 .
- Suite de tests : **120/120 requêtes HTTP 200** ; 40 par chemin ; 4 requêtes simultanées ; environ trois échauffements par chemin. Une seule exécution par runner, sans qualification de disponibilité internationale.

### Mesures de latence — benchmark localhost CI, pas trafic réel

| GET testé | HTTP 200 | p50 (ms) | p95 (ms) | p99 (ms) |
|---|---:|---:|---:|---:|
| `/api/catalog/countries?limit=2` | 40/40 | 51,77 | 79,82 | 90,89 |
| `/api/timeseries/sources/coverage` | 40/40 | 37,90 | 65,88 | 81,51 |
| `/api/product/countries/FRA/economic-snapshot` | 40/40 | 2 491,09 | 2 926,66 | 2 973,60 |

**Interprétation :** la synthèse économique est nettement plus lente que le catalogue ou le taux de couverture. Il faut profiler les accès aux données, l'éventuel calcul à la volée et les caches avant d'émettre une estimation d'hébergement. Ne pas affirmer que ces chiffres représenteraient les temps de réponse depuis l'Afrique, l'Asie ou l'Océanie.

### Consommation mémoire à vide initiale, six conteneurs (échantillon unique `docker stats`)

| Conteneur | Mémoire mesurée |
|---|---:|
| Gateway | 270,2 MiB |
| Catalog | 238,3 MiB |
| Timeseries | 235,4 MiB |
| Analytics | 46,43 MiB |
| Ingestion | 50,62 MiB |
| TimescaleDB | 143,2 MiB |
| **Total simple des valeurs rapportées** | **984,15 MiB** |

Le total n'est **pas** une estimation complète : il exclut mémoire du système, cache OS, pics d'ingestion, charges simultanées importantes, backups, proxy TLS, OIDC, observabilité, stockage des données et croissance.

### Test de panne et récupération (terminé)

1. Arrêt d'Analytics en conservant Gateway, DB, catalogue et autres services.
2. GET `/api/catalog/countries?limit=2` resté à **200**.
3. GET `/api/product/countries/FRA/economic-snapshot` a répondu **500** ; erreur réelle, sans donnée de substitution inventée. Une réponse plus explicite type **503 Service Unavailable** serait préférable pour les clients et caches.
4. Redémarrage d'Analytics, puis GET économique repassé à **200**.
5. CI a nettoyé ses volumes et son secret de test.

**Attention :** cette preuve concerne seulement UNE panne d'Analytics, sans pression réseau externe ni base pleine. Ce n'est ni une haute disponibilité ni un test de reprise multi-zone.

## 3. Limites et risques à ne jamais masquer

- Chiffres économiques : la base est de démonstration/test ; **ces tests ne prouvent pas que des valeurs officielles fraîches sont réellement collectées**.
- OIDC/JWKS : cette CI utilise des URL fictives HTTPS et uniquement des requêtes anonymes/privées sans bearer ; les **signatures RSA et les claims ont été testés séparément en F1.2b.2a (#39)**. Nous n'avons pas encore intégré un fournisseur OIDC externe réellement exploitable en staging public.
- Aucune sauvegarde complète contenant l'ensemble des migrations/hypertables, aucune conservation chiffrée hors hôte et aucune garantie de RPO/RTO de production.
- Une seule CI, au même endroit, sans utilisateurs finaux, ni accès à l'échelle internationale, ni simulation de dizaines de milliers de profils ou d'alertes.
- Le script de benchmark mesure les latences **à chaud** après trois requêtes ; il faut distinguer cold start et warm path.
- Aucun budget engagé ; aucune mise en production Vercel ou backend ; PR à laisser en brouillon.

## 4. Critères de sortie et travaux suivants

### F1.2b.2b — fin de ce lot
- [x] Une stack complète de 6 conteneurs démarre et répond au Gateway en CI.
- [x] Les routes protégées sont interdites aux utilisateurs non authentifiés.
- [x] Des p50/p95/p99 sont mesurés, avec archive brute GitHub.
- [x] Un backend Analytics tombe sans interrompre le catalogue ; retour à la normale testé.
- [x] Build Java réparé après échec documenté.
- [ ] Revue du diff, tests sur SHA final et PR en brouillon.
- [ ] Aucune activation/dépense sans décision humaine.

### F1.2b.2c — étape prioritaire suivante, **pas encore réalisée**
1. **Profilage Analytics** de la synthèse France (requêtes SQL, appels interservices, boucles, payload et cache). Mesures reproductibles p50/p95 à froid et à chaud ; objectif de performance défini sur preuve et sans résultats fictifs.
2. **Dégradation HTTP contractuelle** : renvoyer une réponse 503 structurée avec `requestId`, `service`, `retryable`, éviter d'inclure des secrets/données personnelles. Ne jamais « inventer » une statistique pour masquer un backend indisponible.
3. **Tests de charge gradués** : plusieurs paliers contrôlés en CI, métriques CPU/RAM, timeout, percentiles, amplification des requêtes et récupérations. Garder un plafond de requêtes pour ne jamais attaquer un service tiers.
4. **Protection anti-abus** : quota pour advisor et futures alertes Watch, rate limiting fiable par clé/identité/IP derrière proxy de confiance, CSRF/CORS/same-origin selon architecture retenue.
5. **Internationalisation des performances** : instrumentation de provenance/cache, choix des régions utilisateur et CDN, temps de réponse mesurés en réseaux variés après autorisation d'hébergement.

### F1.2b.3 / F1.3 — après cela
- Comparer VPS géré / PaaS / database managée sur coût TOTAL sous charge : stockage, bande passante, logs, sauvegarde, CPU, rétentions, DNS, email, licences données, RGPD.
- Valider TLS, identité réelle, images épinglées, réseau egress, récupération sur vrai schéma V2 et sauvegardes chiffrées offsite.
- **F1.3 : preuve d'une donnée officielle réelle** depuis son institution d'origine jusqu'à la carte V2 Vercel avec pays ISO3, unité, devise, date de référence, date de collecte et source.
- Ne lancer Money-Vision/Travel/Trading-Vision/Price-Vision qu'avec données légalement redistribuables et moteur Watch durable, sans remplacer l'utilité produit par de simples réponses d'IA.

## 5. Reprise dans un autre chat

Lire d'abord `docs/continuity/HANDOFF_CORE_F12B_2026-11-19.md` de cette branche, puis vérifier le SHA et les statuts des PR #35, #36, #38, #39 et de cette PR de charge. Consulter le run CI et l'archive ci-dessus. **Ne pas traiter ce document comme un accord de fusion** et ne jamais travailler dans V0/V1.
