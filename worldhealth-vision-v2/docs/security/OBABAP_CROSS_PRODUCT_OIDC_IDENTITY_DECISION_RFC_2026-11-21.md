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
