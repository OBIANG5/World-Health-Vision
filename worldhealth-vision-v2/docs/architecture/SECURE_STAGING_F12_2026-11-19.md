# World-Vision V2 — F1.2 : socle de préproduction sécurisé (19 novembre 2026)

**Périmètre :** `worldhealth-vision-v2/`, jamais les racines V0/V1.
**État :** code de staging isolé, tests CI ; **ce n'est pas un déploiement public**.
**Dépendance :** F1.1 PR #35, validée en CI, encore en brouillon et non fusionnée.
**Contrat :** aucune création d'infrastructure payante et aucune fusion automatique.

## 1. Pourquoi cette étape est indispensable

Le fichier `infra/docker-compose.yml` est un outil de développement qui contenait des mots de passe connus et exposait DB/Redis/Keycloak/Grafana/Loki/Prometheus sur toutes les interfaces. Son usage sur un serveur Internet constituerait un risque élevé. Tous ses ports ont été restreints à `127.0.0.1` pour prévenir les expositions accidentelles. Cela ne transforme PAS ses mots de passe de démonstration en secrets sécurisés.

La vraie V2 dispose de cinq services métier exploitables : catalog (Java), timeseries (Java), analytics (Python), ingestion (Python), gateway (Java). Son site Vercel public présente toujours un aperçu statique tant que le backend et les routes API ne sont pas reliés et prouvés.

Nous avons isolé une topologie de staging **sans Keycloak dev, Redis non indispensable, base exposée, Grafana public ou identité fictive**. Cette topologie sert à éprouver les données persistantes et le réseau avant de choisir un hébergement définitif.

## 2. Fichiers livrés

- `infra/compose.secure-staging.yml` : définition autonome et privée, **ne pas combiner** avec `docker-compose.yml` (les ports et configurations seraient fusionnés).
- `infra/.env.secure-staging.example` : noms de variables uniquement ; jamais le véritable fichier de configuration.
- `infra/tests/verify_secure_staging.py` : vérification de la configuration Docker Compose **résolue**.
- `infra/ops/backup-db.sh` : archive logique atomique au format personnalisé, checksum SHA-256 et test de lisibilité.
- `infra/ops/restore-drill.sh` : restauration dans une base temporaire, Timescale `pre_restore/post_restore`, puis suppression de cette base temporaire.
- `.github/workflows/whv-v2-secure-staging-contract.yml` : tests de secrets absents, ports, réseau, runtime non-root et restauration réelle.
- Dockerfiles Java et Python : identité d'exécution `10001:10001` sans privilèges.

## 3. Topologie (préproduction privée)

```text
                machine hôte (127.0.0.1:18080 seulement)
                             |
                      gateway-service -- OIDC HTTPS externe
                             |
                      [core_private, internal]
                      /          |         \
               catalog      timeseries    analytics
                    \         / 
                     TimescaleDB (aucun port hôte)
                             ^
                        ingestion-service -- Internet des sources officielles
```

Réseau `core_private` : les bases et les services internes n'ont aucune liaison directe avec l'hôte autre que le Gateway sur loopback. `internet_egress` : uniquement gateway et ingestion disposent d'une route sortante. **Attention : c'est un bridge Docker, pas une liste de destinations autorisées.** Une politique firewall/egress réelle reste à mettre en place.

Toute exposition publique future devra passer par un proxy TLS et une authentification/rate limiting contrôlés. Le Gateway, en mode staging, a `WHV_SECURITY_ENABLED=true` : toutes les routes API GET réclament un JWT valide (ce n'est PAS encore adapté aux tableaux statistiques publics anonymes).

## 4. Secrets et fichiers de configuration

Le mot de passe PostgreSQL n'apparaît pas dans la définition de staging ni dans le bloc `environment` des services Java : PostgreSQL lit `POSTGRES_PASSWORD_FILE`, tandis que les services Java lisent le fichier à l'exécution et exportent le mot de passe uniquement pour leur processus.

Préparer un **fichier secret unique hors dépôt**. Sur Linux, il doit être lisible par l'utilisateur non privilégié `10001` des services Java ; par exemple groupe propriétaire `10001`, propriétaire `root` et mode `0440`. Vérifier ces permissions sur le type de moteur Docker utilisé : les montages `file:` de Docker Compose ne garantissent pas toujours l'application des champs `uid/gid/mode`. Ne jamais rendre le secret publiquement accessible pour contourner un défaut d'autorisations.

Les variables exigées sont `WHV_DB_PASSWORD_FILE`, `WHV_OIDC_ISSUER_URI`, `WHV_TIMESCALE_IMAGE` (référence d'image maintenue, approuvée et immuable `@sha256:` pour tout déploiement réel). `WHV_GATEWAY_HOST_PORT` vaut 18080 si absent ; rester sur loopback. `WHV_BACKUP_DIR` doit viser un emplacement absolu hors Git.

**Ne pas utiliser l'issuer d'exemple du workflow ni la version d'image figée utilisée comme fixture CI** sur un serveur réel. La CI peut employer ces références pour une base de test jetable ; aucune preuve de support, de correctifs de sécurité ou de droits de production n'est ainsi acquise.

## 5. Procédure opérateur (staging seulement)

Les commandes suivantes supposent que les secrets, l'image approuvée et un OIDC réellement utilisable ont été préparés *hors de Git*. Elles ne doivent pas être exécutées automatiquement par une PR.

```bash
# Depuis la racine du dépôt :
cd worldhealth-vision-v2
# Le fichier privé ne doit pas entrer dans Git et doit être protégé (0600).
docker compose --env-file /etc/worldvision/staging.env \
  -f infra/compose.secure-staging.yml config --quiet

# Pour un premier test limité, lancer d'abord la DB :
docker compose --env-file /etc/worldvision/staging.env \
  -f infra/compose.secure-staging.yml up -d --wait whv-timescaledb

# N'ajouter les services Java/Python qu'après les tests CI et un contrôle
# des permissions réelles du secret sur l'hôte choisi.
docker compose --env-file /etc/worldvision/staging.env \
  -f infra/compose.secure-staging.yml up -d --build --wait \
  catalog-service timeseries-service analytics-service ingestion-service

# Lancer le gateway APRÈS avoir vérifié le vrai fournisseur OIDC :
docker compose --env-file /etc/worldvision/staging.env \
  -f infra/compose.secure-staging.yml up -d --build --wait gateway-service
```

Un premier contrôle `GET http://127.0.0.1:18080/actuator/health` pourra alors tester le Gateway. Une requête anonyme `GET /api/catalog/countries?limit=1` doit retourner **401** en mode JWT, sauf évolution volontaire et testée de la politique de routes. La collecte ne doit pas se déclencher automatiquement à la mise en service : il faut un contrôle de chaque connecteur et de ses quotas.

## 6. Sauvegarde, restauration et limites

Pour les commandes suivantes, exporter le même environnement de staging dans le shell **sans afficher le mot de passe**. Les scripts attendent `WHV_BACKUP_DIR` hors Git et le mot de passe disponible via le fichier secret.

```bash
bash infra/ops/backup-db.sh
bash infra/ops/restore-drill.sh /chemin/vers/whv_YYYYMMDDTHHMMSSZ_PID.dump
```

- La sauvegarde utilise `pg_dump -Fc`, produit un fichier temporaire avant renommage final, vérifie `pg_restore --list`, puis génère un SHA-256.
- Le **restore drill** vérifie la somme SHA-256, crée une base `whv_restore_drill_...`, exécute les fonctions de restauration TimescaleDB et la supprime. Il ne touche jamais la base `whv` de production.
- En CI, un marqueur d'une ligne est inséré, sauvegardé et restauré, puis la base originale est vérifiée intacte.
- **Ce test simple ne prouve pas encore la restauration d'une vraie base V2 avec toutes les migrations, hypertables, données et permissions.** Un exercice de migration/volumétrie doit suivre.
- Le backup local n'est **pas** chiffré automatiquement : une vraie exploitation exige copie chiffrée hors de l'hôte, planification, supervision des échecs, rotation des fichiers, vérification de restauration périodique et définition d'objectifs RPO/RTO. Les volumes bruts de la collecte et les secrets OIDC ont des plans distincts.

Documentation technique : https://www.tigerdata.com/docs/deploy/self-hosted/backup-and-restore/logical-backup et https://docs.docker.com/compose/how-tos/use-secrets/.

## 7. Critères de sortie F1.2

### F1.2a — Sécurisation de base et reprise testable

- [ ] Configuration effective de staging contrôlée par CI, variables indispensables obligatoires.
- [ ] Ports de développement limités au localhost.
- [ ] DB invisible depuis le réseau hôte ; seuls Gateway et ingestion ont un réseau egress.
- [ ] Services Java/Python non root avec racine en lecture seule et données dans les volumes prévus.
- [ ] Archive PostgreSQL générée, son contenu restauré dans une base distincte, source intacte après exercice.
- [ ] Captures des rapports de CI et revue du diff, puis décision humaine de fusion.

### F1.2b — Hébergement et sécurité d'exploitation (non inclus dans F1.2a)

- [ ] Choix documenté d'une infrastructure et estimation de coûts **réels** (stockage, CPU, RAM, sauvegardes, sortie réseau, API).
- [ ] Audit d'images Docker et dépendances, versions soutenues et verrouillage par digest.
- [ ] Authentification OIDC choisie, testée ; droits publics/privés et limitation des abus définis.
- [ ] Authentification et autorisations par route, pas de données privées sans contrôle tenant/user.
- [ ] TLS, domaines, CORS, rate limits, observabilité non publique, pare-feu et sorties réseau.
- [ ] Sauvegardes chiffrées hors site, **restauration complète d'une base V2** et reprise après incident.
- [ ] Monitoring des erreurs, redémarrage sûr, déploiement progressif/rollback.
- [ ] Preuve de disponibilité durable et contrôle de coûts sur une période de fonctionnement réelle.
- [ ] Aucun vrai secret dans l'historique Git, les logs, les captures ou les réponses HTTP.

### F1.3 — Première donnée internationale réelle visible (à suivre)

Un chemin vérifiable : institution autorisée → ingestion → TimescaleDB → APIs V2 → Vercel. L'interface doit montrer une source, une date de collecte, une période de référence et un statut de disponibilité sans inventer de chiffres.

## 8. Ce que nous refusons comme raccourcis

- Déployer le `docker-compose.yml` local sur un VPS « pour voir ».
- Ouvrir `5432`, `6379`, `8081`, `3000`, `9090` et les exporters sur Internet.
- Réutiliser `admin_admin_change_me`, `whv_password` ou une connexion JWT désactivée.
- Afficher une API locale de CI comme backend permanent.
- Affirmer que les 22 sources sont intégrées automatiquement parce que le catalogue les connaît.
- Confondre `preproduction sécurisée` et application publique monétisable.
- Introduire GDELT, des APIs de réservation ou un terminal Forex avant d'avoir le contrôle de leur collecte et de leur licence.

**Décision :** conserver `v2` et Vercel inchangés jusqu'à approbation de la PR et preuves vérifiables. La prochaine tranche F1.2b doit être autorisée seulement après une revue de l'hébergement cible, des coûts et de la gestion d'identités.
