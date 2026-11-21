# Research Workspace — gates de sécurité AVANT staging/Internet
**21 novembre 2026, état : environnement non provisionné, déploiement NON autorisé.**

## Intention
Les analyses Trading/MTA sont des **notes privées d'utilisateurs**, pas des sources d'Atlas. La V2 étant internationale, elles ne doivent pas partager des permissions avec les statistiques publiques ni être accessibles à un autre titulaire. Même si les tests de développement sont verts, le service privé ne devient pas un environnement exploitable par une configuration Docker permissive.

## Deux identités de base de données, distinctes
**Migration/deploy** : rôle DBA à durée de vie limitée exécutant les migrations Flyway `trading_private`. Le propriétaire des tables et de `research_flyway_history` doit être ce rôle de migration (ou un propriétaire de schéma dédié), jamais l'utilisateur HTTP de production.
**Runtime** : LOGIN dédié à Research Workspace, membre uniquement du rôle `whv_research_runtime` créé par `infra/ops/provision-private-research-runtime-grants.sql`. Ce rôle a USAGE du schéma, SELECT/INSERT/UPDATE/DELETE uniquement sur les tables `trade_case` et `trade_case_revision`. **Pas** CREATE, pas de SELECT sur catalog/timeseries/ingestion/identités/monitoring et pas de droits Flyway.

Ordre d'opération obligatoire : migrer avec rôle de migration → appliquer/contrôler les grants avec DBA → créer login runtime via coffre secret (mot de passe hors Git) → démarrer avec `WHV_RESEARCH_MIGRATIONS_ENABLED=false`, `WHV_RESEARCH_DB_URL`, `WHV_RESEARCH_DB_USERNAME`, `WHV_RESEARCH_DB_PASSWORD` injectés par le gestionnaire de secrets. **Ne jamais utiliser le superuser `whv_user` ni la configuration permissive `infra/docker-compose.yml` en staging Internet.**

Vérifier avec le LOGIN réel (`SET ROLE` si permis) qu'il peut lire/insérer **seulement ses tables** et **ne peut pas** lire catalogue privé, mesures Timeseries brutes, tables de sources internes, schémas des autres services, supprimer un schéma, créer des objets ni accéder à `research_flyway_history`. Valider également ses capacités de gestion de données personnelles (droit d'export/suppression, backups, purge/retention).

## Deux vérifications JWT (strictes)
Gateway : `WHV_SECURITY_ISSUER_URI`, `WHV_SECURITY_JWK_SET_URI`, `WHV_SECURITY_AUDIENCE` de **l'IdP authentique choisi**, HTTPS; `allow-insecure-loopback-jwks-for-tests=false`; des scopes `trading:read` et `trading:write` exigés sur les routes privées.
Workspace : mêmes `issuer`, `JWKS`, `audience`, validées une **deuxième fois**, avec dates, `iss`, `sub`; pas de `X-User-ID` comme autorité. Les routes inconnues, le monitoring autre que /actuator/health et l'accès anonyme sont refusés.

**Tests de non-régression** : `GatewaySignedJwtIntegrationTest` (RSA/OWASP signature), `ResearchIndependentJwtSignatureTest` (JWKS/iss/aud/sub/temps côté workspace), `ResearchWorkspacePostgresIntegrationTest` (PostgreSQL réel, 2 sujets + 2 émetteurs, 401/403/404/412/428, versionnement et suppression).

Un token signé n'est **pas** une session utilisateur à lui seul : P1B doit choisir un fournisseur OIDC, Authorization Code + PKCE, temps de session/refresh/revocation, consentement et gestion des appareils. Ne pas accepter un issuer CI/loopback en public.

## Réseaux et exposition
- Le port du Research Workspace **ne doit pas être publié sur le réseau public**. Le Gateway signé doit être la seule voie d'entrée de l'app; le service révalide même si une requête arrive depuis le réseau interne.
- Le Gateway est attaché au réseau privé et à l'IdP HTTPS nécessaire au JWKS. Contrôler egress/issuer, ne pas exposer Redis/DB.
- TLS public, HTTPS entre composants selon modèle de menace; respect CORS même origine; aucune autorisation HTTP de provenance fondée sur en-tête forgeable.
- Les bases contiennent des thèses privées : logs sans payload ni bearer, métriques sans IDs/dossiers/tokens, backups chiffrés et restauration testée, suppression de toutes les révisions lors de DELETE, rotation des secrets.
- Limites et attaques : 200KiB/dossier, 30 dossiers/titulaire, 200 versions/dossier, prévention de collisions de versions, refus d'URLs non HTTPS. Ces limites d'application n'équivalent pas à un vrai rate-limiter Gateway. Tester plusieurs créations concurrentes et abus réseau avant ouverture Internet.

## Frontend et migration P1B non réalisés
`TradingCaseLibrary` P0C reste en localStorage non chiffré, charge les dossiers **uniquement à la demande**, et ne communique **pas** avec ce backend P1A. Aucun bouton « synchronisé » tant que le compte utilisateur et le connecteur HTTPS à auth réelle ne sont pas prêts. La future migration v1/v2 JSON doit être sur consentement explicite, avec vérification et traitement des conflits par `If-Match`, sinon risque de perte de données.

## Pas de prématurité commerciale
Ce service n'émet ni ordres, ni recommandations de trading, ni cotations temps réel, ni copies de cours payants DataAnalyse/MTA. Ne promettre ni rentabilité ni affinité institutionnelle. Les sources contradictoires et les données historiques sont datées et comparées seulement si méthodologiquement compatibles.

**Références** : [PR #124](https://github.com/OBIANG5/World-Health-Vision/pull/124), [issue #122](https://github.com/OBIANG5/World-Health-Vision/issues/122), `docs/continuity/WORLD_VISION_TRADING_P1A_PRIVATE_WORKSPACE_HANDOFF_2026-11-21.md`. Aucun déploiement ni merge dans ce lot.
