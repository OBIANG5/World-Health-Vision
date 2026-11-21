# World-Vision — checkpoint TRADING P1A : dossiers privés PostgreSQL, JWT et isolation multi-utilisateurs
**21 novembre 2026 — document de reprise intermédiaire, à compléter avec le SHA final et résultats CI.**
**PR stack** : `v2` ← PR #115 (source-signed Atlas) ← PR #120 (processus Trading 7 étapes, DataAnalyse) ← PR #121 (bibliothèque locale multi-dossiers) ← **P1A** `product/v2-trading-private-workspace-p1a-2026-11-21` (cette branche; PR DRAFT après publication).
**Statut tant que CI n'est pas constatée : CODE EN COURS, NON VALIDÉ, NON DEPLOYÉ, NON FUSIONNÉ.**

## 0 — Pourquoi ce chantier est prioritaire
L'utilisateur veut reproduire les **outils et toutes les étapes de décision enseignées par son professeur (MTA/DataAnalyse)**, pas un dashboard Forex générique. P0/P0B gèrent la réflexion et les faits contradictoires; P0C préserve plusieurs thèses, mais **stocke uniquement en localStorage non chiffré**. Pour une expérience internationale réelle, l'étape suivante la plus utile est de permettre un jour à un compte de retrouver des dossiers sur plusieurs appareils, de façon sûre, sans lire les notes de quelqu'un d'autre. **P1A est un backend fondation, il ne réalise pas encore cette synchronisation navigateur, car aucun compte OIDC frontend n'est branché.**

## 1 — Architecture existante auditée AVANT de coder
- Backend V2 parent Maven Java 21/Spring Boot 3.3.2, modules Gateway, Catalog et Timeseries; Analytics/ingestion Python; PG16 et migrations Flyway pour Catalog/Timeseries.
- `gateway-service/security/GatewaySecurityConfiguration.java` : JWT sécurisé avec défaut `denyAll()`; `PublicReadRoutes` = lecture publique des pays/indicateurs seulement, aucune route personnelle. `GatewayJwtDecoderConfiguration.java` valide signature JWKS, `iss`, `aud`, dates.
- `catalog-service` expose des référentiels et preuves institutionnelles publiques ; `timeseries-service` expose des observations publiées filtrées par droits. **Mélanger des dossiers personnels avec ces tables publiques serait une frontière de sécurité fragile.**
- **Décision explicite** : créer `research-workspace-service` comme domaine privé **séparé**, réutilisant la même infrastructure PG mais via un **compte et des droits DB distincts** en staging ultérieur. Cet isolement de données est le bénéfice de la nouvelle unité de déploiement, justifiant le coût d'un service supplémentaire. Pas de nouvelle API de marché.
- Aucune identité mondiale/SSO OIDC réelle n'a été fournie. Refuser tout déploiement Internet avant un émetteur/audience JWKS sûrs, comptes, quotas, sauvegardes, RGPD et certificat HTTPS.

## 2 — Implémentation P1A sur branche
- `pom.xml` parent : module Maven `research-workspace-service`.
- `services/research-workspace-service/pom.xml`, application, YAML : Spring Web + OAuth2 resource-server + JDBC/Flyway Postgres, JWT **vérifié indépendamment du Gateway**, issuer/JWKS/audience obligatoires, JWKS HTTPS sauf boucle locale test-only; default fail-closed. Pas d'identité via header arbitraire.
- `db/migration/V1__private_trade_case_and_revisions.sql` : `trading_private.trade_case`, `trade_case_revision` append-only transactionnel, `(principal_issuer, principal_subject)`, index privé; DELETE cascade explicite. La DB doit être provisionnée avec rôle limité, sans accès aux schémas de statistiques publiques. Aucune RLS activée à ce stade; les contrôles métier imposent les clés d'appartenance.
- `api/ResearchPlanValidation.java` : limites de taille ~200Ko par dossier, schéma v1, champs, statut, sources HTTPS originales datées, catégories, historiques bornés, titre valide. Échec 400 sur contenu invalide.
- `repository/TradeCaseRepository.java` : chaque SELECT/UPDATE/DELETE est limité par **issuer+sub authentifiés**. Identifiants UUID attribués côté serveur. Nombre maximal de dossiers 30, limité par lock transactionnel PG sur identité, historique 200 versions et snapshot pour chaque changement. Règle version `If-Match: "vN"`, refus 428 sans en-tête, 412 pour ancienne version; 404 identique pour dossier inexistant ou autre utilisateur, sans fuite.
- `api/TradeCaseController.java` : routes privées `GET/POST /api/trading/cases`, `GET/PUT/DELETE /api/trading/cases/{id}`, `GET /api/trading/cases/{id}/history`, ETags, pas d'owner fourni par navigateur.
- `gateway-service` : allowlist explicite des routes personnelles JWT scope read/write, **hors PublicReadRoutes**, proxy limité vers `WHV_RESEARCH_BASE_URL`; le bearer est relayé et revalidé en amont.
- **Aucun** service public Vercel/Atlas, paiement, courtier, ordre, cotation, article professionnel ou cours payant touché.

### Sécurité et contrat réels
**P1A n'égale PAS une authentification navigateur complète** :
- identité = tuple (issuer vérifié, subject vérifié), jamais identifiant tiré de `title`, du paramètre URL, d'un body `owner` ou d'un header personnalisé;
- lecture exige `SCOPE_trading:read` ; écriture `SCOPE_trading:write` **au Gateway ET au Workspace**; JWT signé et bon `aud` obligatoire aux deux frontières;
- l'accès sur réseau interne seul ne donne aucun droit, le nouveau service ne fait pas confiance à un pseudo-header issu du Gateway;
- pas d'API `POST import` ni de migration automatique des dossiers P0C : ceci attend P1B et un vrai compte client;
- pas d'accès anonymous à des dossiers, même quand `whv.security.public-read-enabled=true` ;
- l'application frontend P0C continue d'être locale; aucun faux badge « cloud synced »;
- aucune écriture dans `catalog` / `timeseries`, aucune statistique publiée dérivée du contenu privé, aucun secret dans le dépôt.

## 3 — Tests prévus et à vérifier sur SHA EXACT
Workflow `.github/workflows/whv-v2-private-workspace-p1a.yml` :
`mvn -B -ntp -f worldhealth-vision-v2/pom.xml -pl services/gateway-service,services/research-workspace-service -am test` (JDK21 + Docker + PostgreSQL16 Testcontainers).
- `ResearchWorkspacePostgresIntegrationTest` : 2 identités distinctes, sauvegarde isolée, B ne voit ni liste ni ID/historique/modification/suppression A, no-token 401, mauvais scope 403, historique réellement append-only, ETag 428/412, suppression RGPD du contenu et de son historique, rejet URLs javascript/mauvais schema; santé minimale.
- `GatewaySignedJwtIntegrationTest` : RSA/JWKS en boucle locale, vrais JWT signés, bon/mauvais scope, JWT forgé ou mauvaise audience rejetée, transmission bearer au service; tous les chemins non autorisés restent bloqués.
- les tests P0C de navigateur restent prouvés par [run 44899547713](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44899547713) (HEAD `8dd39ebac8a2ae442c1a5ca869e459ccc8fd78eb`).
**NE PAS revendiquer la réussite de P1A avant le retour des tests GitHub.** Corriger tous échecs, faire CI verte sur HEAD et consigner URL/SHA ici.

## 4 — Suite ordonnée P1B à P3, valeur et prérequis
1. **Terminer la preuve backend P1A** (compiler, Testcontainers, vrai JWT Gateway, 2 identités, cas malformés, revue sécurité). Vérifier absence de privilèges DB par défaut sur schémas publics et définir rôle SQL séparé en staging isolé. **Ne pas déployer tant que l'environnement sécurisé et les rôles ne sont pas prouvés.**
2. **P1B : identité de l'utilisateur et synchronisation véritable**. Choisir/configurer un fournisseur OIDC international avec login standard (Authorization Code + PKCE, gestion refresh/session), consentement, sécurité tokens, UI d'état connecté/non connecté. Intégrer P0C à l'API privée, migration JSON **sur clic** avec résolution des conflits entre 2 appareils. Tests de navigation multi-user/2 appareils et perte de réseau, export/suppression RGPD, aucune écriture silencieuse.
3. **P1C : protections d'exploitation**. Quotas rate-limiting au Gateway, rôles DB limités, chiffrement/transit, backups chiffrés testés, restauration, gestion de versions, rotation clés, limitation des historiques/retention, monitoring sans fuite; staging privé HTTPS. Test indépendant d'IDOR, CSRF/authorization, double contrôle du scope; plan de gestion incident.
4. **P2 : DataAnalyse Workbench original** : briefings jour/semaine/mois, consensus historique avant publication, résultats/révisions vs attentes, suivi versionné de thèses sur huit économies/28 paires, sources critiques plurielles, pas de copie de fiches payantes. Données licenciées et horodatées.
5. **P3 : outils du cours** : graphes W/D/H4/H1/M15 sous droits, macro des deux jambes, corrélations, COT/retail sourcés, calculateur risque selon contrat exact, journal et Watch; pas d'exécution sans analyse de conformité et tests fidélité market/limit/stop.

## 5 — Reprise exacte dans un nouveau chat
1. Lire ce fichier et [l'issue #122](https://github.com/OBIANG5/World-Health-Vision/issues/122), puis [handoff P0C](https://github.com/OBIANG5/World-Health-Vision/blob/product/v2-trading-mta-case-library-v1-2026-11-21/worldhealth-vision-v2/docs/continuity/WORLD_VISION_TRADING_P0C_MULTIDOSSIER_HANDOFF_2026-11-21.md).
2. Lire HEAD de `product/v2-trading-private-workspace-p1a-2026-11-21`, la PR DRAFT P1A s'il y en a une, et `.github/workflows/whv-v2-private-workspace-p1a.yml` ; vérifier les exécutions exactes. **Ne jamais repartir de main ni créer un autre backend sans regarder cette branche.**
3. Si compilation/CI échoue, analyser les logs et corriger sans contourner l'authentification. Si vert, vérifier les limites des tests et reprendre P1B.
4. Conserver la séparation PR #115 → #120 → #121 → P1A, ne jamais fusionner d'un coup les branches média ou une ancienne V1.
5. Continuer en parallèle Atlas sources nationales/internationales, Global Radar/GDELT, Bourse Afrique, Money, sécurité pays, Transport/Tourisme; Price/Panier restent différés.
