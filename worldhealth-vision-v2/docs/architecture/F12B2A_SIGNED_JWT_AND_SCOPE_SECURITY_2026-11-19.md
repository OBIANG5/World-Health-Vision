# WORLD-VISION V2 — F1.2b.2a : JWT signé, audience et droits métier
**Date : 19 novembre 2026.** Branche candidate `security/v2-jwt-signature-audience-scopes-2026-11-19`.
**Portée :** V2 exclusivement ; V0/V1 exclus. **Aucune production modifiée, aucun coût engagé.**

## 1. Justification produit : une plateforme internationale

World-Vision n'est pas un simple média : nous construisons un système mondial de données de pays et de services Money-Vision, Tourisme/Transport-Vision, Price/Panier-Vision, Trading-Vision, BRVM/Bourse Afrique Vision et World-Vision Média. Ces verticales pourront partager compte, provenance, séries et alertes, mais chacune doit posséder des autorisations métier distinctes.

La précédente étape F1.2b.1 (PR #38) a fixé **57 chemins GET de données publiques opt-in** et refusé les opérations personnelles/opérateur inconnues. Cette étape protège cryptographiquement l'identité du client, puis le droit d'invoquer une fonctionnalité à coût potentiel (le conseiller). Ne jamais croire qu'« authentifié » signifie « tout autorisé » ou qu'« utilisateur » équivaut à « administrateur ».

## 2. Chaîne GitHub et dépendances

- `v2` reste canonique, non modifiée par ce chantier.
- PR #35 : contrôles visuels/globe et accessibilité V2, indépendante.
- PR #36 : socle de staging sécurisé, secrets, réseau et sauvegarde réellement restaurée.
- PR #38 : politique publique/privée de Gateway, **basée sur #36**.
- La présente branche F1.2b.2a est **basée sur le dernier SHA #38** (`c93eb27356987b8194a70c5929c5cca4c9d00e04`). Sa PR devra cibler `feature/v2-gateway-public-private-contract-2026-11-19`, pas `v2` directement.
- Issue de continuité : https://github.com/OBIANG5/World-Health-Vision/issues/37.
- Handoff principal : `docs/continuity/HANDOFF_CORE_F12B_2026-11-19.md`, à actualiser sur cette branche.

## 3. Sécurité implémentée

### Configuration
`services/gateway-service/src/main/java/com/worldhealthvision/gateway/security/GatewayJwtDecoderConfiguration.java`

- **JWT signé vérifié** contre les clés publiques JWKS d'un émetteur configuré ; le décodage réel utilise `NimbusReactiveJwtDecoder`.
- La validation des claims requiert **émetteur (`iss`)**, **audience (`aud`)**, **dates de validité** (timestamp validator de Spring), sans remplacer le contrôle de signature.
- Pour protéger la configuration : `WHV_SECURITY_ISSUER_URI`, `WHV_SECURITY_JWK_SET_URI`, `WHV_SECURITY_AUDIENCE` sont obligatoires en mode sécurisé. La configuration échoue au démarrage si elles manquent.
- Issuer/JWKS en **HTTPS** obligatoires. `WHV_SECURITY_ALLOW_INSECURE_LOOPBACK_JWKS_FOR_TESTS=true` peut autoriser HTTP uniquement sur une boucle locale en tests ; le précontrôle d'hôte et le Compose staging le refusent.
- Suppression du fallback implicite ancien `http://localhost:8081/realms/worldhealth-vision` : aucun émetteur fictif ne devient identité par défaut.
- Droit Advisor : `POST /api/analytics/advisor/chat` exige `SCOPE_advisor:invoke`, en plus d'un JWT valide. Le scope doit être délivré par le fournisseur OIDC sur règles serveur, jamais choisi librement par le navigateur.
- Les 57 GET de la PR #38 restent publics uniquement sous le flag correspondant ; les opérations non listées restent `denyAll`.

### Déploiement staging
`infra/compose.secure-staging.yml`, `infra/.env.secure-staging.example`, `infra/ops/preflight-host.sh` et `infra/tests/verify_secure_staging.py`

- L'émetteur OIDC, le JWKS HTTPS et l'audience sont explicites ; pas d'accès sans ces informations.
- Le Gateway n'expose que `127.0.0.1` sur la machine ; DB/ingestion ne publient aucun port.
- Un jeton JWT signé n'autorise pas les requêtes internes d'ingestion, métriques opérateur ni futurs comptes.
- Les variables de CI et clés RSA générées pour les tests sont **éphémères**, pas des clés de production.

## 4. Tests réalisés et ce qu'ils prouvent

`GatewaySignedJwtIntegrationTest.java` monte un serveur local JWKS avec une **vraie paire RSA 2048 bits** générée par le runner ; pas de `mockJwt()` dans cette suite. Elle vérifie :
1. JWT signé valide, audience et émetteur corrects → accès autorisé.
2. Mauvaise audience → 401 et aucune requête proxy.
3. Mauvais émetteur → 401.
4. JWT expiré → 401.
5. JWT non encore valide → 401.
6. Signature forgée avec un autre secret RSA et le même `kid` → 401.
7. Jetons mal formés ou `alg=none` → refus.
8. Scope `read` valide mais Advisor → 403 ; scope `advisor:invoke` signé → accepté.
9. Même JWT privilégié → pas d'accès `source-runs` ni `users/me`.
10. Lecture publique des pays anonyme, Advisor anonyme refusé.

`GatewayJwtDecoderConfigurationTest.java` contrôle également les erreurs de configuration : issuer/JWKS/audience manquants, HTTP distant, loopback HTTP sans flag explicite, URI ambiguës et HTTPS correct.

Les tests hérités `GatewayPublicReadIntegrationTest`, `GatewaySecurityIntegrationTest` et `GatewayRoutingIntegrationTest` sont conservés. Les deux premières suites n'installent plus de décodeur unsigned fictif : elles utilisent `mockJwt()` uniquement pour tester la **politique d'accès**, pas la signature.

`whv-v2-signed-jwt-contract.yml` exécute Maven/Java 21 sur le **SHA candidat**, archive les rapports JUnit et vérifie la présence de la politique d'audience.
`whv-v2-secure-staging-contract.yml` valide à nouveau réseau, secrets, ports, migrations de configuration, sauvegarde/restauration et démarrage des services privés.

**Attention :** ces tests ne prouvent PAS une connexion à un fournisseur OIDC réel, la gestion des comptes, les refresh tokens, la révocation immédiate, le chiffrement TLS public ni la résistance aux attaques de charge. Ils ne prouvent pas non plus une disponibilité internationale 24h/24.

## 5. Décisions sécurité sans raccourci

- **Pas de token longue durée** côté navigateur : à définir via OIDC Authorization Code + PKCE, cookies adaptés au BFF ou autre architecture auditée. Éviter de garder des jetons dans localStorage sans analyse des risques.
- **Clés privées hors Git**, jamais dans Vercel public, jamais dans une capture ou le journal des erreurs. Le Gateway ne possède que des clés publiques JWKS.
- Rotation JWKS, compromission de clés et révocation d'accès doivent être gérées par le fournisseur d'identité et une stratégie cohérente d'expiration/introspection.
- Les scopes de paiement, profil, journal, Watch et back-office nécessiteront des règles de permission **distinctes**. Un scope Advisor ne permet jamais de modifier une ingestion.
- Séparer lecture statistique publique, données sous licence, données personnelles et opérations coûteuses.
- L'exposition anonyme des observations restera soumise à provenance, droits de redistribution, cache, rate limiting, WAF et règles légales des pays concernés.
- Les services internes ne doivent pas faire confiance aux headers utilisateur arbitraires ; protections réseau et identités service-to-service à étudier avant opérations privées.

## 6. Critères GO/NO-GO F1.2b.2a

- [ ] Tous les tests Java (y compris JWT RSA) sont **verts sur le SHA final** et rapports JUnit archivés.
- [ ] Le Compose sécurisé est validé avec **les cinq variables obligatoires** et l'audience ; tests DB/backup/restauration restent verts.
- [ ] Aucun JWT de test accepté sur environnement public ; switch HTTP loopback non activé sur l'hôte.
- [ ] Toute régression est bloquante, y compris les anciens endpoints.
- [ ] PR encore brouillon et décision de fusion explicite ; #36 puis #38 puis présente PR.
- [ ] Documentation de continuité tenue à jour.

## 7. Suite exacte (F1.2b.2b → F1.3)

1. **Gateway exécuté en CI avec les quatre applications et la DB** en réseau de staging ; JWKS de test isolé et requêtes GET publiques, mesure latence p50/p95/p99, mémoire et CPU, avec faible puis moyenne concurrence.
2. **Dégradation/résilience :** couper temporairement un backend sans perdre le catalogue ; vérifier codes d'erreur et récupération, sans annoncer des SLO fictifs.
3. **Quota et CORS :** politiques adaptées aux routes anonymes et au conseiller coûteux, trusted-proxy, limites par identité/IP, observabilité privée.
4. **Choix de l'hôte :** taille réelle sous charge, coûts TCO, image Docker soutenue, TLS, backups offsite chiffrées, PRA sur vrais schémas Flyway/Timescale, politique RGPD.
5. **Staging réel** seulement avec accord de budget ; vrai OIDC/JWKS, rejets et journaux d'audit testés sans données sensibles.
6. **F1.3** : une donnée économique réellement collectée d'une institution reconnue et affichée via API/Vercel avec source, période, statut ; GDELT / billets / trading viennent APRÈS contrats de données et infrastructure Watch.

Aucun nouveau service payant n'est autorisé ni commandé par ce document.

Référence Spring Security consultée : https://docs.spring.io/spring-security/reference/6.5/reactive/oauth2/resource-server/jwt.html
