# World-Vision V2 — TRADING P1B2A : rôles OIDC signés, contrôle de projet, Gateway + backend
**21 novembre 2026. Document de continuité, PR DRAFT — NON FUSIONNÉ / NON DÉPLOYÉ.**
**ÉTAT : à compléter avec SHA final et tests CI sur ce même SHA.**

## 0. Chaîne de travail — ne pas reconstruire depuis main
Dépôt `OBIANG5/World-Health-Vision`, application `worldhealth-vision-v2/`.

- PR #115 : socle produit et sources Atlas.
- PR #120 : processus MTA/DataAnalyse Trading 7 étapes, sources contradictoires, thèses et préparations macro, sans recommandation ni courtier.
- PR #121 : P0C dossiers locaux multiples, strictement navigateur, sans sync.
- PR #124 : P1A backend Trading **privé** PostgreSQL, vérification JWT signée Gateway ET research-workspace, ownership `(iss, sub)`, version ETag/If-Match, refus cross-user. CI P1A [run #44901193280](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44901193280) sur `880f21ce`.
- PR #125 : P1B1 client HTTP strict et UI distante opt-in, mais **identité absente donc cloud désactivé**. CI P1B1 [run #44902232350](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44902232350) sur `a752e2cdd64f4e459fdb0e8f7b953c999fc140fb`.
- **P1B2A maintenant** : branche `product/v2-trading-oidc-project-roles-p1b2a-2026-11-21`, basée EXACTEMENT sur la branche de PR #125. Nouvelle PR DRAFT à ouvrir/vérifier.

## 1. Ce qui a été découvert dans les sources officielles
**Le futur fournisseur n'est PAS encore configuré, pas de compte créé, pas de nouveau coût.**

- [Supabase OAuth 2.1 / Authorization Code PKCE](https://supabase.com/docs/guides/auth/oauth-server/oauth-flows) : serveur OIDC maintenant disponible (documentation 18/11/2026), mais **custom scopes actuellement non pris en charge** et seulement `openid email profile phone` disponibles. Son `aud` peut être changé via un Access Token Hook, mais cela NE crée PAS les permissions `trading:read/write`. Le design P1A n'est donc pas compatible en l'état avec un simple login Supabase ; exiger un nouveau mécanisme de vérification avant de l'adopter.
- [ZITADEL project audience](https://zitadel.com/docs/apis/openidoauth/scopes) : l'ID de projet est placé dans `aud` en demandant `urn:zitadel:iam:org:project:id:{projectid}:aud`; [rôles et grants](https://zitadel.com/docs/guides/integrate/retrieve-user-roles) dans le claim `urn:zitadel:iam:org:project:roles` avec par rôle une map d'organisations. **La présence de l'audience de projet ne prouve PAS un grant utilisateur**. ZITADEL avertit [explicitement](https://help.zitadel.com/security-best-practices-validating-audience-aud-claims-in-zitadel-access-tokens) que le scope d'audience peut être demandé sans prouver les droits.
- **Priorité de pilote** : ZITADEL Cloud, uniquement si vrai token **JWT signé**, `aud=project-id` et claim de rôle utilisateur effectivement vérifiables par les deux services. La tarification/DAU/zone de traitement doit être recontrôlée avant contrat. **Aucune inscription effectuée**.
- Vercel connecté indique un projet `world-health-vision-v2`, mais rien ne prouve qu'un service privé PostgreSQL ou le Gateway soit actuellement déployé derrière son domaine. Ne jamais présenter Vercel static comme hosting du backend.

## 2. Changement technique P1B2A (autorisation optionnelle, PAS un login)
- `libs/whv-common-java/.../security/OidcProjectRolePermissions.java` : petite politique pure Java, **sans fournisseur réseau** et sans dépendance Spring. Exige `aud` contenant EXACTEMENT le projet OIDC autorisé et un claim de rôle de l'utilisateur sous la forme `{readRole: {orgId: orgDomain}}`. Mapping vers `trading:read` ou `trading:write` uniquement avec map d'organisation valide, sans héritage de write→read. Ni nom de rôle seul ni audience seule ne donnent de droits.
- `gateway-service/.../GatewayProjectRoleAuthorities.java` : convertisseur Spring WebFlux **conditionnel** par `whv.security.oidc-project-roles.enabled=true`; **désactivé par défaut**. Exige configuration `project-audience == whv.security.audience` pour empêcher audience divergente. Ajoute seulement deux autorités `SCOPE_trading:read`, `SCOPE_trading:write` pour grants valides. Preserve la conversion classique des scopes pour les autres IdP, sans modifier les règles existantes `GatewaySecurityConfiguration`.
- `research-workspace-service/.../ResearchProjectRoleAuthorities.java` : vérification **INDÉPENDANTE** en Spring MVC au niveau du backend privé. Le JWT est toujours vérifié cryptographiquement avant le convertisseur.
- `GatewaySecurityConfiguration.java`, `ResearchJwtSecurity.java` : injection d'un convertisseur seulement quand l'option est activée; aucun accès élargi en mode par défaut. Les règles `anyExchange().denyAll`/ `anyRequest().denyAll` restent actives et les chemins de recherche personnelle ne vont pas dans `PublicReadRoutes`.
- `services/.../application.yml` : **option OFF** par défaut, valeurs projet/rôles vides tant qu'aucun IdP n'est configuré.
- `research-workspace-service/pom.xml` dépend du module partagé `whv-common-java` (Maven reactor).
- Tests réels de sécurité **en création** :
  - `GatewayProjectRoleSignedJwtIntegrationTest` : RSA signé par clé test locale, JWKS local, faux service privé interne, rôle read ≠ write, aucun rôle ≠ accès, audience seule 403, faux JWT/mauvais issuer/aud/expiry 401, chemins inconnus 403, scope traditionnel toujours supporté;
  - `ResearchProjectRoleSignedJwtIntegrationTest` : RSA/JWKS local signé + PostgreSQL 16/Flyway Testcontainers, 2 propriétaires réels isolés par `iss+sub`, rôle read/write distinct, jeton forgé/mauvais aud/issuer refusé, no-role 403;
  - `OidcProjectRolePermissionsTest` : contrôle positif/négatif pur Java, config ambiguë rejetée.
- Workflow `.github/workflows/whv-v2-trading-oidc-project-roles-p1b2a.yml` pour Maven Java21, Docker, JUnit. **Aucun compte IdP ni secret dans GitHub**.

## 3. Configuration et conditions bloquantes de staging (ne PAS exécuter en prod)
Les **deux processus** Gateway + Workspace doivent recevoir, sur un staging isolé, la **même** configuration :
```text
WHV_SECURITY_ENABLED=true
WHV_SECURITY_ISSUER_URI=https://<real-trusted-idp-issuer>
WHV_SECURITY_JWK_SET_URI=https://<real-trusted-idp-jwks>
WHV_SECURITY_AUDIENCE=<REAL_PROJECT_ID>
WHV_SECURITY_OIDC_PROJECT_ROLES_ENABLED=true
WHV_SECURITY_OIDC_PROJECT_AUDIENCE=<SAME_REAL_PROJECT_ID>
WHV_SECURITY_OIDC_TRADING_READ_ROLE=trading_reader
WHV_SECURITY_OIDC_TRADING_WRITE_ROLE=trading_writer
WHV_SECURITY_ALLOW_INSECURE_LOOPBACK_JWKS_FOR_TESTS=false
```
`<...>` ci-dessus = **exemples à remplacer, jamais des credentials**. Il faut que ZITADEL délivre effectivement un **access token JWT** (pas un ID token ni un jeton opaque), signé par les JWKS configurés, contenant le rôle et l'audience attendue. Les rôles doivent être attribués via une politique d'inscription/gestion des permissions contrôlée, **pas auto-attribués comme privilèges d'administration**. Réutilisation World-Vision/ABAA demande clients/audiences séparés, données séparées.

**Pas de migration des anciens propriétaires** : un changement d'issuer `iss` modifie l'identité propriétaire `iss+sub`; migration seulement avec comptes vérifiés et consentement. Ne jamais faire correspondre deux comptes sur le seul email.

## 4. Points d'arrêt à valider avant P1B2B/P1B3
- CI du **HEAD exact** de P1B2A verte. Si échec, analyser le job GitHub et corriger en conservant signature/JWKS/issuer/audience/scopes.
- Le bridge de rôles est **uniquement** une traduction sécurisée de permissions sur JWT émis par un fournisseur crédible ; il ne gère ni login, ni refresh, ni PKCE, ni mobile, ni session.
- P1B2B doit choisir une véritable **stratégie de session** avant intégration : SPA standard PKCE et tokens volatiles, ou BFF avec cookies HttpOnly/SameSite+CSRF et session state robuste. Le frontend Vercel statique ne peut pas héberger seul un BFF persistant. Un vrai IdP demande inscription/provisionnement par le titulaire du projet, donc **aucun test sur vrais comptes n'est possible avant ce prérequis**.
- Les erreurs 401/403 n'autorisent **jamais** le fallback vers une identité locale ou un JWT généré par l'application.
- P1B3 doit tester deux comptes + deux appareils, mise à jour versionnelle 412, consentement au transfert local vers serveur, expiration/reconnexion, supression/export, staging HTTPS avec rôle DB runtime sans accès au catalogue ni aux timeseries et sauvegarde restaurée.
- Suivant produit : atelier DataAnalyse réel (sans reproduction de contenu payant), Atlas sources contradictoires vérifiées, Global Radar, Bourse Afrique, Watch, Money et Voyage; **ne pas prolonger inutilement l'auth** tant qu'un IdP n'est pas provisionné.

## 5. Reprise exacte dans un autre chat
**Toujours** partir de `product/v2-trading-oidc-project-roles-p1b2a-2026-11-21`, lire cette page + la PR DRAFT + workflow/CI sur HEAD exact, puis issue #122. Ne jamais remplacer la chaîne #115→#120→#121→#124→#125→P1B2A par un développement depuis `main`. Si CI verte, ne pas annoncer une synchronisation : suivre le vrai login OIDC/PKCE ou bien avancer sur le Workbench macro pendant que l'identité externalisée attend ses comptes. Chaque nouveau lot doit avoir son propre handoff avec SHAs et tests exacts.
