# RFC — identité OBABAP partagée, données isolées (World-Vision / ABAA-Lingo / AI Lab)
**21 novembre 2026 — décision d'architecture à valider, NON déployée.**
**Ce document ne signifie pas qu'un fournisseur OIDC, un compte utilisateur ou une synchronisation ont été installés.**

## Problème réel
World-Vision a des données publiques (Atlas/sources) et des données **privées** (dossiers de recherche Trading, Watch, futurs favoris). ABAA-Lingo/AI Lab auront des contenus linguistiques, progressions pédagogiques, modèles et historiques d'apprentissage. L'utilisateur veut mutualiser les dépenses utiles à **plusieurs projets**, éviter des abonnements récurrents inutiles, préserver une qualité internationale.

**Séparer deux notions** : un fournisseur d'identité commun permet un **SSO** entre applications sans garantir un même `sub` au sein de chacune (les sujets OIDC pairwise peuvent différer); il ne signifie JAMAIS que les dossiers Trading sont visibles par ABAA-Lingo. Une connexion unique n'autorise aucune réutilisation de données sans base légale et action explicite.

## Invariants communs
1. **Fournisseur OIDC standard unique si pertinent pour les coûts**, capable d'émettre des tokens à audience/émetteur vérifiables et de gérer email/passkeys/MFA, inscription internationale, connexion, désinscription et gestion de sessions. Éviter une dépendance rigide à un fournisseur propriétaire si les besoins n'en justifient pas le coût.
2. **Clients OAuth distincts par application et environnement** : `world-vision-web`, `abaa-lingo-web`, éventuel `abaa-lingo-mobile`, et clients staging séparés. Redirect URIs exactes, PKCE obligatoire, aucun client_secret dans navigateur ni applications mobiles.
3. **Audiences et scopes propres aux API** : un token `aud=worldvision-api`, `scope=trading:read` n'autorise pas l'API de cours ABAA-Lingo; pour chaque API valider `iss`, `aud`, `exp`, signature JWKS, scopes, sujets réels. L'identité n'accorde pas un droit métier sans autorisation dédiée.
4. **Propriétés de compte séparées** : Trading `(iss, sub)`, langue/favoris et données scolaires ABAA-Lingo dans leur schéma/DB. Ne pas déduire un identifiant universel stable si `pairwise sub` diffère; lier volontairement les comptes sous politique de consentement et identifiants vérifiés.
5. **Choix de stratégie de session** : (A) BFF avec cookies `HttpOnly`, `Secure`, `SameSite` + CSRF et tokens côté serveur ; (B) navigateur SPA avec une bibliothèque OIDC reconnue (`oidc-client-ts`) et tokens de courte durée gardés en mémoire avec surfaces XSS auditées. Pour les notes Trading confidentielles, **BFF est a priori préférable** pour limiter l'exposition des bearer tokens au JS, mais il nécessite une vraie infrastructure HTTPS, une politique de cookies, une propagation contrôlée du token au Gateway et tests spécifiques. Ne pas faire semblant qu'un SDK seul suffit.
6. **Périmètre d'hébergement** : World-Vision peut garder son frontend public sur Vercel tandis que le BFF/API reste privé et une origine HTTPS fixe/gateway assure l'accès; prévoir cookies domaine, CORS ou proxy même origine, protection CSRF, rotation des sessions. Un simple site statique ne peut pas héberger les sessions serveur.
7. **Confidentialité et RGPD** : consentement séparé pour usage de données Trading et apprentissage, export, effacement, retention, chiffrement des backups et restauration testée, pays/région de résidence, sous-traitance et DPA; pas de trading research dans les logs d'auth, pas de vidéos/audio linguistiques dans la base d'identités.

## Facteurs de coût / fournisseur à évaluer avant de choisir
- Paiement **à l'usage** (MAU, authentifications, SMS/MFA, consommation, stockage) vs minimum fixe mensuel, free tier et risque de coût à l'international.
- Support OIDC/JWKS/issuer et **custom API audience/scopes** sans formule entreprise onéreuse.
- Réussite de connexion depuis Afrique/Europe/Amériques/Asie, latence, blocage pays, téléphone facultatif, passkeys et accessibilité.
- Possibilité de sortir les utilisateurs: export identifiants/profils sous droits, portabilité, conformité RGPD, rotation secrets et migration de l'émetteur (attention : changer `iss` affecte la clé propriétaire `iss+sub`; prévoir migration contrôlée, jamais automatique).
- App web et mobile (Authorization Code + PKCE, external system browser sur mobile), compatibilité Vercel/staging privé.
- Coût d'exploitation de Keycloak auto-hébergé (pas de licence, mais mises à jour, sauvegardes, sécurité, uptime et VPS permanent) vs fournisseur managé facturé à l'usage. Ne pas choisir automatiquement « gratuit = meilleur ».
- Gestion des pannes : statut offline clair et mode local P0C inchangé, aucun upload implicite à la reconnexion.

## Ordre de preuve pour P1B2 et P1B3
1. Lister le vrai hébergement et l'origine du frontend, les régions cibles, les obligations RGPD, la topologie Gateway/BFF. Comparer au moins 2 options fournisseur et 2 architectures (SPA/BFF) avec coût réaliste, sécurité et migration ; choix documenté.
2. Créer des clients **staging** et un jeu de test de deux comptes via le fournisseur choisi, sans secrets dans GitHub. Déployer JWKS/issuer/audience contrôlés.
3. Implémenter login + logout/expiration/renouvellement de session avec bibliothèque éprouvée et lockfile, configuration fail-closed, audience strictement vérifiée. Aucun token loggué.
4. Raccorder la capacité `ResearchIdentity` au client P1B1 sans changer la sémantique d'opt-in; `sessionInstanceId` doit varier à chaque connexion pour remonter le composant et effacer les dossiers privés affichés avant changement de compte.
5. Test **deux comptes** A/B, mêmes UUID non accessibles, deux appareils A1/A2, writes ETag et conflit 412, token de mauvaise audience rejeté, session expirée/revocation, première migration locale uniquement après consentement, export/effacement.
6. Exercices de déploiement : rôle DB runtime `whv_research_runtime` seulement, migrations Flyway séparées; backups chiffrés et suppression des historiques; supervision sans données privées. Ne pas ouvrir la route hors Gateway.

## Ce qui existe aujourd'hui (factuel)
- **P1A PR #124** backend PostgreSQL privé et JWT doublé, tests vrais signés et DB, non déployé.
- **P1B1 PR #125** contrat de client HTTP et UI consentement, `researchIdentityNotConfigured=null`. En l'absence d'IdP réel, **aucune opération distante ne peut être déclenchée dans la production frontend**.
- **Pas** de compte ou session OIDC, de SSO inter-applications, ni de transfert de fichiers en production.

À la prochaine reprise, lire `docs/continuity/WORLD_VISION_TRADING_P1B1_PRIVATE_CLIENT_HANDOFF_2026-11-21.md` puis cette RFC et issue #122. Avancer sur l'identité choisie et le parcours testé, ne pas refaire P1A.


---

## Étude de solutions managées — sources officielles consultées 21/11/2026
**Ce n'est PAS un achat ni une sélection d'IdP.** Les prix, fonctionnalités, exclusions et territoires doivent être vérifiés à la signature. Ne pas confondre OAuth/OIDC « se connecter avec X » avec « être fournisseur OIDC pour nos propres API ».

| Candidat | Ce qui est vérifié | Limite / question bloquante | Priorité P1B2 |
|---|---|---|---|
| **ZITADEL Cloud** | [Tarifs officiels](https://zitadel.com/pricing) : formule gratuite avec quota annoncé de 25 000 DAU (consulter la définition de comptage DAU et surconsommation). [Guide du flux PKCE](https://zitadel.com/docs/guides/integrate/login/oidc/oauth-recommended-flows), [API audience/claims](https://zitadel.com/docs/guides/solution-scenarios/frontend-calling-backend-API). OpenID Connect natif, web/mobile. | L'audience JWT peut nécessiter le scope propre au projet `urn:zitadel:iam:org:project:id:<PROJECT_ID>:aud`, **pas** l'audience arbitraire `worldvision-api` choisie dans le Gateway actuel. Tester vraies valeurs `aud`, scopes, claims et les deux validateurs Java **AVANT** l'intégration. Hébergement, région, durée et capacité de l'offre à confirmer. | **Pilote privilégié sans coût**, si les exigences Spring JWT sont satisfaites. |
| **Supabase Auth** | [Tarifs officiels](https://supabase.com/pricing) : 50 000 MAU de base sur Free. **Documentation actualisée le 18 novembre 2026** : [Supabase OAuth 2.1 Server](https://supabase.com/docs/guides/auth/oauth-server) peut agir comme **fournisseur OpenID Connect** (pas seulement comme receveur de login); [flux PKCE + discovery endpoint](https://supabase.com/docs/guides/auth/oauth-server/oauth-flows). | Fonction IdP très récemment documentée. Tester si les jetons d'API satisfont notre `aud`, `scope=trading:read/write`, `iss`, jwks et rotation, ainsi que les conditions de multi-apps/production; quota/hibernation/free tier et prix Pro mensuel (ne pas acheter). | **Second pilote sans coût** et comparaison réelle avec ZITADEL. |
| **Auth0** | [Grille officielle](https://auth0.com/pricing) : Free pour démarrer (jusqu'à 25 000 MAU selon documentation 2026). | La rubrique **Cross APP SSO** du tableau tarifaire n'est pas incluse dans les premières formules. Si elle exige Professional ou autre supplément, c'est un mauvais premier choix pour identité mutualisée. | Réserve, seulement si coût réel et accès inter-apps compétitifs. |
| **Clerk** | [Offre officielle](https://clerk.com/pricing) : 50 000 Monthly Retained Users gratuits, mais MRU ≠ MAU. | Certaines fonctions de production/SSO et plans sont payants, seuils et coûts par projet/organisation à confirmer. Éviter lock-in frontend tant que le besoin principal est JWT signé réutilisable Java/Spring. | Réserve, pas de décision sans comparaison. |
| **Keycloak** | [Documentation officielle](https://www.keycloak.org/securing-apps/overview) : fournisseur OIDC/SAML extensible et installable soi-même. | Licence de logiciel sans coût ≠ service gratuit : VPS allumé, mises à jour et patchs de sécurité, sauvegardes, disponibilité internationale, compte admin 24/7 et rotation certificats. | Option à reconsidérer si un VPS mutualisé déjà administré rend le coût total avantageux. |

### Recommandation P1B2 provisoire, orientée valeur/coût
**Pas d'abonnement mensuel maintenant**. Réaliser d'abord un **POC gratuit ZITADEL Cloud vs Supabase Auth** sur les vrais points d'échec potentiels de P1A : (1) enregistrement client SPA/BFF + PKCE/nonce/state, (2) édition d'un JWT signé pour audience dédiée au Gateway et réutilisable entre deux API Java avec scopes différents, (3) révocation/expiry, (4) séparation `iss+sub` A/B et SSO, (5) contrôles RGPD, pays Afrique/Europe, (6) plafond et surprises de facturation.

La **décision finale** doit être fondée sur ces tests : le backend P1A actuel ne doit **pas** changer ses conditions JWT pour s'adapter à une promesse marketing d'IdP. Si le fournisseur a un schéma d'audience différent, ajuster explicitement l'**audience configurée** des deux validateurs après test et gérer plusieurs APIs avec identifiants distincts; ne jamais ignorer la vérification `aud`.

**Donnée à jour de sûreté** : la solution doit préserver les enregistrements Trading existants lors d'une migration d'issuer (clé d'appartenance composite), sans transfert automatique ni correspondance sur simple email. L'IdP pour ABAA reste une cible d'architecture; son application actuelle n'est pas modifiée dans cette PR.
