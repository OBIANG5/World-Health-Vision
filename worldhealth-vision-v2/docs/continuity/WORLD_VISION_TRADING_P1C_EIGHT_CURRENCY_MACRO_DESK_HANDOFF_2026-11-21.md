# World-Vision V2 — Trading-Vision P1C : poste de travail FX macro, 8 économies, 28 paires
**21 novembre 2026 — DOCUMENT DE REPRISE OBLIGATOIRE. PR DRAFT, non fusionnée, non déployée.**
**État CI : à compléter avec SHA final + logs réels, ne pas revendiquer tests verts avant la preuve.**

## 0. Chaîne GitHub canonique — ne pas perdre l'historique
Dépôt `OBIANG5/World-Health-Vision`, sous-répertoire logiciel `worldhealth-vision-v2/`. **NE PAS toucher aux projets média**.

| Tranche | Branche/PR, état et rôle |
| --- | --- |
| #115 | Atlas, sources nationales, accès signés en lecture (base empilée) |
| #120 | MTA Trading processus 7 étapes, hypothèse/fondamentaux/technique/risque/participants/gestion/exécution |
| #121 | P0C bibliothèque dossiers utilisateur, sauvegarde locale explicite, jamais chiffrée ni synchronisée |
| #124 | P1A backend privé Postgres16/Flyway, ETag, 2 propriétaires, JWT doublement signé, CI [44901193280](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44901193280), non déployé |
| #125 | P1B1 interface et client privé, OIDC impossible à simuler => désactivé; CI [44902232350](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44902232350) |
| #127 | P1B2A adaptateur de rôles projets JWT **désactivé par défaut**, signed scope sans rôle → 403, 73 tests Java dont Postgres16, CI [44903281732](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44903281732); head `47614b4dfd234d3e5d80d35edded1e1958f225e2`, non déployé |
| **P1C présent** | **branche `product/v2-trading-macro-desk-8ccy-28pairs-p1c-2026-11-21` empilée EXACTEMENT sur #127**, PR DRAFT à ouvrir/vérifier. |

**Pourquoi ce choix de priorités :** l'authentification P1B2B nécessite un fournisseur OIDC réellement provisionné, des utilisateurs, des secrets et un staging HTTPS. Aucun de ceux-ci ne doit être inventé. L'utilisateur veut surtout des fonctionnalités concrètes professionnelles à forte valeur : travailler sur le **Macro Desk** plutôt que continuer à aménager un login vide. L'auth sécurisée reste documentée (issue #122) mais n'empêche PAS la progression produit.

## 1. Produit livré P1C — aucune source ni cours commercial répliqués
Le projet doit rivaliser en *processus pédagogique et outils originaux* avec une recherche MTA/DataAnalyse, mais **sans copie des fiches, contenus ni publications payantes du professeur** et sans conseil financier.

**Couverture :**
- 8 devises : EUR, GBP, AUD, NZD, USD, CAD, CHF, JPY.
- **28 paires non orientées uniques** à convention de marché usuelle (ex. EURUSD, GBPUSD, AUDUSD, NZDUSD, USDJPY, USDCHF, USDCAD, EURGBP, CADJPY, CHFJPY).
- Pas de classement, score de devise, bull/bear signal, flux temps réel ou appel à API caché. Une paire 2/2 signifie seulement **les deux économies documentées**, pas une opportunité.
- Pour chaque devise, une recherche **saisie par l'utilisateur** : thème de politique monétaire, attentes ex-ante décrites, prochain catalyseur, contradictions, point de vue humain qualitatif `unclear/resilient/fragile/mixed`, date **as-of** déclarée.
- Au moins 1 et jusqu'à 4 références originales HTTPS avec titre, éditeur déclaré, date de publication **≤ as-of**, perspective locale/nationale/régionale/internationale/terrain/média/marché, rôle argumentaire supports/challenges/context, observation; jamais supposer que deux noms d'éditeurs signifient indépendance.
- Historique **append-only** : 8 versions max **par devise**, chacune avec `recordedAt` **horloge navigateur seulement**, jamais serveur certifié. Versions passées jamais écrasées ou supprimées automatiquement.
- Mode **LOCAL** sur clé indépendante `world-vision:trading-macro-desk:v1`, lecture et écriture **strictement sur clic** ; pas de synchronisation OIDC, ni chiffrement local. Détection de changements d'autres onglets, refus d'écriture stale. JSON export, import JSON **uniquement en bibliothèque vide** sous confirmation pour empêcher la perte d'une collection; format inconnu/corrupt bloqué avec export brut et réparation volontaire.
- Mode **pair** : comparaison visuelle côte-à-côte, transparence des deux dates as-of (différences explicitement signalées), sources/contre-arguments. **Seule action créant un dossier** : confirmation avant la création d'un NOUVEAU `TradePlan` schemaVersion 1, `instrument=EURGBP`, `instrumentKind=spot`, `direction=undecided`, `orderType=wait` ; les deux notes et URLs originales sont COPIÉES vers les champs de thèse et `plan.evidence`. Pas de broker, ordre, prix/stop/cible, conclusion d'exécution. L'ancien dossier ouvert n'est jamais sauvegardé implicitement. Les bindings ID locaux et ETags distants sont REMONTÉS (reset) pour éviter tout écrasement d'une ancienne recherche.

## 2. Fichiers P1C et invariants de sécurité / contrat
- `frontend/web-v2/src/trading/fxMacroDesk.ts` : domaine pur TypeScript versionné; fonctions `FX_PAIRS`, `validFxSource`, `validFxSnapshot`, `parseMacroDesk`, `appendMacroSnapshot`, `pairCoverage`, `newResearchFromMacroPair`.
- `frontend/web-v2/src/components/layout/TradingMacroDesk.tsx` : interface EN/FR 8 cartes devises, 28 boutons paires, notes et sources originales, version historique, import/export local. Aucun fetch réseau ni lecture de localStorage avant click.
- `frontend/web-v2/src/components/layout/TradingProcessPanel.tsx` : dixième onglet du dialogue existant (7 étapes MTA + registre preuves + journal événements + Macro Desk), transition vers **nouveau** plan MTA avec réinitialisation `localReset` et `remoteReset`; sauvegarde MTA reste action explicite.
- `frontend/web-v2/src/styles/trading-process.css` : CSS responsive 320px, 390px, 1440px, grille 28 paires lisible, contenu mobile sans déborder.
- `frontend/web-v2/scripts/test-fx-macro-desk.mjs` : tests Node des VRAIS modèles TS compilés à la volée : huit devises/28 uniques, dates et URL malveillantes, immutabilité, as-of sans hindsight, limites, corruption, copie vers nouveau TradePlan, aucun signal.
- `frontend/web-v2/scripts/trading-process-browser-smoke.mjs` : tests véritables Chromium/React 320/390/1440 étendus **après la suite P0C** : aucune lecture/écriture à l'ouverture, notes EUR et GBP fictives, sources HTTPS, 28 paires et couverture, séparation historique/devise, nouveau dossier MTA et non-écrasement de 3 dossiers locaux existants, enregistrement manuel du 4e.
- `frontend/web-v2/package.json` : `npm run test:macro` (aucune dépendance npm ajoutée).
- `.github/workflows/whv-v2-trading-macro-desk-p1c.yml` : npm ci, 4 tests domaine/stockage/client, lint nouveaux fichiers, build TypeScript 6/Vite, Playwright/Chrome réel 320/390/1440, captures SYNTHÉTIQUES seulement.

## 3. Dangers volontairement traités
- **Données vérifiables ou non :** un texte saisi dans le formulaire ne prouve pas sa véracité; la date navigateur peut être fausse. Les badges 1/2 ou 2/2 ne sont que le **niveau de documentation**, pas une certitude ni un score.
- **Biais rétrospectif :** une source publiée après la date as-of est rejetée; une version datée après l'as-of reste néanmoins **reconstitution rétrospective** tant qu'aucune attestation externe du contexte n'existe. Les comparaisons de deux dates as-of différentes sont explicitement signalées.
- **Sécurité des liens :** URLs `https:` seulement, sans utilisateur/mot de passe/fragment; rendu par React avec rel=noopener/noreferrer. Jamais faire d'extraction automatique de ressources sur sites inconnus.
- **Confidentialité :** localStorage NON chiffré et effaçable par navigateur; export JSON contient des notes sensibles, ne pas le publier; jamais envoyer à un serveur sans confirmation et login réel. Aucune fuite de tokens.
- **Pas de fusion implicite :** import source JSON dans bibliothèque non vide est REFUSÉ, pas merge "best effort" ni écrasement. Conflits autre onglet bloquent le commit jusqu'à reload volontaire.
- **Compatibilité backend privé P1A :** l'objet injecté est le `TradePlan` v1 existant, `plan.fields` simple map de chaînes, `evidence[]` validable par le serveur. Le **Macro Desk entier** n'est ni stocké dans Postgres ni synchronisé; seule la copie des deux lectures courantes va dans un nouveau dossier MTA.
- **Contrôle d'ordre :** aucun ordre réel, aucune connexion de courtier, aucune taille de position ou conclusion long/short automatique.
- **International :** origine nationale/terrain et provenance d'une source reconnues au même niveau épistémique que médias internationaux; indépendance et contradictions doivent être examinées humainement.

## 4. État de la livraison
**À vérifier avant toute conclusion** : SHA HEAD exact du branch P1C, PR DRAFT, runs `WHV V2 Trading Macro Desk P1C` et workflow non-régression `WHV V2 Trading MTA process`. Lire et corriger tout échec de TypeScript/eslint, Node ou vrai Chromium, ne pas maquiller un run en succès. Documenter le SHA du code vert ET celui de tout commit documentaire ultérieur, puis commenter PR/issue #122 avec les preuves vérifiées.

## 5. Suite qui optimise qualité et utilité
**P1D — poste de travail macro maturité** : alimenter les huit devises par sources publiques légitimes (banques centrales, autorités statistiques nationales, calendriers de publication officiels), en **séparant acquisition/sources brutes/revue humaine**, avec dates et unités, erreurs/retards et contradictions multi-sources; ne pas inventer consensus historiques. Réutiliser le registre de sources World-Vision pour les fiches pays; tenir compte des pays couverts et des obligations de licence/réutilisation. Ajouter éventuellement validation des révisions du Macro Desk sur stockage serveur privé lorsque l'auth P1B2B est réelle. Évaluer également automatisation des alertes d'annonces seulement après preuve de fiabilité temporelle et de coût.

**P1B2B/P1B3** : compte OIDC seulement avec ZITADEL/Supabase réellement configuré et identité signée conforme aud/roles (via P1B2A) + staging HTTPS et PostgreSQL least privilege; vrais tests A/B + deux appareils; sécurité/session/RGPD/restore/effacement. Ne pas ralentir les produits Atlas, comparaison des données nationales/terrain, Global Radar/GDELT, Bourse Afrique, Money et Tourisme-Transport.

**Ne jamais faire de PR brouillon sur main ; toujours garder la chaîne #115 → #120 → #121 → #124 → #125 → #127 → P1C.** Si un chat se bloque, lire en premier cette page, le HEAD P1C, les CI et les commentaires PR, puis reprendre la toute première étape non faite. Écrire un nouveau handoff à chaque lot important.
