# World-Vision — TRADING P1B1 : client privé, consentement explicite, séparation LOCAL / DISTANT
**21 novembre 2026 — journal de reprise. PR empilée DRAFT, non fusionnée, non déployée.**
**À METTRE À JOUR après les résultats CI du HEAD exact et avant de quitter ce chat.**

## 0. Chaîne canonique (NE JAMAIS reconstruire de zéro)
Repo `OBIANG5/World-Health-Vision`, code actif `worldhealth-vision-v2/`.

- PR #115 (Atlas / sources nationales signées et droits) — base active V2.
- PR #120 (Trading-Vision processus MTA et DataAnalyse : 7 étapes / source originale / historique d'annonce).
- PR #121 (bibliothèque locale multi-dossiers P0C : localStorage seulement, sans compte).
- PR #124 (service de dossiers privés P1A : Java21, JWT doublé, PG16, ETags, migrations, 2 titulaires, tests réels) — HEAD P1A `880f21ceeb6ef53833ec795615a2fca2951eed98`, CI verte [run 44901193280](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44901193280).
- **P1B1 actuel** : branche `product/v2-trading-private-client-p1b1-2026-11-21` **basée EXACTEMENT sur P1A** ; PR DRAFT à ouvrir / vérifier ; ne pas fusionner le graphe PR prématurément.

## 1. Décision produit et qualité
L'utilisateur souhaite un produit World-Vision international réellement utile, et un atelier Trading reproduisant le **processus** enseigné par le professeur dans MTA et observé dans ses documents DataAnalyse, sans copier ce contenu payant ni transformer l'outil en signaux automatiques.

**Aucun vrai fournisseur d'identité OIDC n'existe dans la V2**. Le composant `UserProfilePanel` enregistre seulement des préférences socioéconomiques; ne jamais s'en servir comme login ni confondre « profil » avec authentification. Acheter un abonnement d'authentification ou imposer un IdP maintenant sans vérifier compatibilité/coût international serait prématuré. L'approche correcte :
- **P1B1** un client REST et une interface d'opt-in contractuellement compatibles avec P1A; l'interface est **désactivée tant qu'aucun IdP réel et sûr n'est connecté**.
- **P1B2** sélectionner/configurer un IdP OIDC fiable et standard (autorisation code + PKCE, issuer HTTPS, JWKS, aud API, scopes, refresh/logout, protections CSRF et nonce), idéalement une bibliothèque éprouvée (ex. oidc-client-ts) **avec package-lock et audit**; jamais une implémentation JWT maison ni une clé cliente secrète dans JS.
- **P1B3** véritable parcours deux comptes / deux appareils dans staging privé HTTPS avec rôle PostgreSQL runtime limité, conflits d'ETags, consentement à migrer JSON et sauvegardes/effacement RGPD.

L'absence de fournisseur effectif n'est pas « résolue » par une interface de démonstration : aucun token fourni manuellement, aucun compte inventé, aucun transfert caché.

## 2. Fichiers implémentés P1B1
- `frontend/web-v2/src/auth/researchIdentity.ts` : capability `ResearchIdentity` fournisseur neutre (`accessToken(): Promise<string|null>`, `providerLabel`, `sessionInstanceId`). Export `researchIdentityNotConfigured = null`. Aucune persistance du token, aucune magie `X-User-ID`.
- `frontend/web-v2/src/trading/privateCaseApi.ts` : client même origine uniquement `/api/trading/cases`, Bearer obligatoire et récupéré de manière volatile auprès de l'identité, `redirect:error`, `credentials:omit`, `cache:no-store`, `referrerPolicy:no-referrer`; GET/list/read, POST/create, PUT avec `If-Match:"vN"`, DELETE avec ETag, GET/history. Valide UUID, plans, réponses Content-Type/ETag, taille et types, versions, statut 401/403/404/409/412/428 et refus d'auto-retry; AbortSignal pour abandon d'appels lors d'un changement de session. Pas d'owner/userId fourni par le navigateur.
- `frontend/web-v2/src/components/layout/TradingPrivateWorkspace.tsx` : section séparée du local; sans `ResearchIdentity` elle affiche explicitement « aucune connexion OIDC/PKCE » **sans bouton cloud actif**. Avec un adapter véritable: liste distante seulement sur clic, ouverture sous confirmation, création d'une copie **uniquement sur consentement**, sauvegarde avec version conditionnelle, suppression explicite et irréversible sur le serveur, mode détaché. Aucun transfert automatique des 30 dossiers locaux, aucun login fictif.
- `frontend/web-v2/src/components/layout/TradingProcessPanel.tsx` : panneau local et distant assemblés, associations séparées par remount/key afin d'éviter qu'une ouverture locale ne mette à jour un dossier distant sans intention et inversement.
- `frontend/web-v2/src/styles/trading-process.css` : contraste et responsive 320px/390px/desktop.
- `frontend/web-v2/scripts/test-private-case-api.mjs` : tests Node du code TS réel compilé in-memory et d'un faux HTTP transport. **Ne simulent PAS cryptographiquement le serveur**; ce rôle appartient aux tests Java P1A.
- `frontend/web-v2/scripts/trading-process-browser-smoke.mjs` : assertions P1B1 supplémentaires sur application React/Vite véritable : section distante explicite et **aucun bouton cloud** si login absent; test local précédent inchangé.
- `frontend/web-v2/package.json` `test:private-cases`, sans nouvelle dépendance ni nouvelle dépense.
- `.github/workflows/whv-v2-trading-private-client-p1b1.yml` : npm ci, tests domaine/local/API privée, lint fichiers touchés, TypeScript/Vite, Chromium Chrome/Playwright 320/390/1440, preuves screenshot **synthétiques uniquement**.

## 3. Choix de sécurité à préserver
- Le serveur P1A reste l'autorité : issuer + subject du JWT signé, vérifié au Gateway et par le service, scopes `trading:read`, `trading:write`, permissions DB. Le navigateur ne déduit jamais l'owner du texte, du nom ou de l'URL.
- Pas de token en localStorage, sessionStorage, console, URL, export JSON ou log. P1B2 doit examiner le stockage de session que choisirait un SDK OIDC et faire préférer un contexte mémoire / un BFF HTTPS selon modèle de risque. **Ne pas stocker de secret côté JS**.
- Aucune écriture HTTP si l'identité manque; aucune synchronisation implicite au chargement/fermeture; aucun remplacement silencieux après conflit 412.
- Un ancien dossier JSON peut être sensible. L'upload doit être déclenché par un clic + confirmation; le stockage local reste inchangé jusqu'à suppression volontaire.
- Aucun copy/paste du cours payant MTA/DataAnalyse dans le dépôt public, seulement les propres outils de recherche.
- Une preuve navigateur avec identité absente n'est pas une preuve de parcours OIDC fonctionnel, ne pas le présenter autrement.
- La suite doit vérifier migration du système local ancien, reprise de 2 appareils, logout/relogin et refus d'IDOR, revue OWASP/RFC9700, RGPD, quotas et rate limit.

## 4. Jalons de test et ordre de reprise exact
**En cours** : récupérer le HEAD exact P1B1, la nouvelle PR, et les runs du workflow `whv-v2-trading-private-client-p1b1.yml`. Compiler, corriger tout échec de TS/lint/test navigateur, documenter les SHA et URL **sur ce fichier et dans PR/issue #122**. Ne pas dire « CI verte » sans confirmation.

Puis :
1. Auditer le futur choix d'IdP et SDK OIDC avec la stratégie de déploiement réelle (public SPA vs BFF), vérifier tarifs **pay-per-use si disponibles**, région, résidence des données, login accessible internationalement, comptes test. Ne choisir aucun fournisseur au hasard; documenter la comparaison. Viser une solution standard OpenID Connect + Authorization Code/PKCE, issuer/JWKS/audience corrects.
2. Implementer le pont `ResearchIdentity` depuis le SDK audité **avec stockage de token acceptable** et vérification d'une session réelle; injection depuis le plus haut composant; changer le `key` d'identité à chaque login et logout.
3. Simuler un fournisseur OIDC signé indépendant en staging (PAS une identité de démonstration du site en prod) pour tests 2 utilisateurs/2 appareils : l'UI distante doit fonctionner sans modifier la bibliothèque locale, 401/403/412 conduisent à récupération explicite, non à une nouvelle écriture.
4. Provisionner un **véritable** runtime PostgreSQL sans droit de lecture du Catalog/Timeseries, migrateur distinct, sauvegarde chiffrée et drill de restauration.
5. Continuer l'atelier DataAnalyse/MTA : briefings pré-annonce, consensus point-in-time, thèses macro sur 8 devises et 28 paires, COT/retail sourcé, risques et journal, avec transparence sources/limites et sans ordres de courtier.

**Produits parallèles prioritaires** : Atlas (comparateur terrain/national/international et provenances), Global Radar/GDELT, Bourse Afrique, Money, Tourisme/Transport, Watch, UI utilisable. Price/Panier différés. Les travaux média restent sur leur branche/projet séparé.

## 5. Pointeur du dernier état avant suspension
Ne pas reprendre à `v2` ni reconstruire la PR #120 : P1B1 est au-dessus de #124. Vérifier le dernier SHA de `product/v2-trading-private-client-p1b1-2026-11-21` et les logs CI. Ce document doit recevoir un checkpoint final **avec état exact** avant clôture. Privilégier corrections réelles sur tests/produit plutôt qu'un nouveau rapport.
