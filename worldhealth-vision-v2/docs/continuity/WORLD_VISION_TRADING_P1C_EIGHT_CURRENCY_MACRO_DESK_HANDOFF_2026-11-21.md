# World-Vision V2 — Trading-Vision P1C : poste de travail FX macro, 8 économies, 28 paires
**21 novembre 2026 — DOCUMENT DE REPRISE OBLIGATOIRE. PR DRAFT, non fusionnée, non déployée.**
**État CI : P1C code + source directory + documentation vérifiés sur SHA `02f95c1b72936ffd572d2aa08c17b703d971a6bb`, run #44904719506 `completed/success`. Le checkpoint ajouté ici constitue un commit documentaire ultérieur : vérifier son run sur le nouveau HEAD avant de conclure.**

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


---

## 6. Revue produit complémentaire : liens institutionnels vérifiés et citations consultables

**Amélioration après la première CI verte** : le Macro Desk affiche désormais, pour chaque économie, deux liens institutionnels dédiés à la recherche de publications originales : banque centrale et institut statistique. Dans chaque paire, on peut ouvrir directement les URLs HTTPS des références individuelles déjà saisies avec **date, éditeur, perspective et rôle**. Cela améliore l'utilité sans injecter des chiffres non vérifiés ni s'approprier des dépêches.

**Répertoire statique institutionnel (`FX_OFFICIAL_RESEARCH_STARTS`)** :
| Devise | Source monétaire | Source statistique |
| --- | --- | --- |
| EUR | [Banque centrale européenne](https://www.ecb.europa.eu/) | [Eurostat](https://ec.europa.eu/eurostat) |
| GBP | [Bank of England](https://www.bankofengland.co.uk/) | [Office for National Statistics](https://www.ons.gov.uk/) |
| AUD | [Reserve Bank of Australia](https://www.rba.gov.au/) | [Australian Bureau of Statistics](https://www.abs.gov.au/) |
| NZD | [Reserve Bank of New Zealand](https://www.rbnz.govt.nz/) | [Stats NZ](https://www.stats.govt.nz/) |
| USD | [Federal Reserve](https://www.federalreserve.gov/) | [Bureau of Labor Statistics](https://www.bls.gov/) |
| CAD | [Bank of Canada](https://www.bankofcanada.ca/) | [Statistics Canada](https://www.statcan.gc.ca/) |
| CHF | [Swiss National Bank](https://www.snb.ch/en) | [Office fédéral de la statistique suisse](https://www.bfs.admin.ch/bfs/en/home.html) |
| JPY | [Bank of Japan](https://www.boj.or.jp/en/) | [Statistics Bureau of Japan](https://www.stat.go.jp/english/) |

Les domaines des banques centrales ont été croisés avec les [liens répertoriés par le UK Debt Management Office](https://www.dmo.gov.uk/help/useful-links/links/) et les liens des instituts avec les [répertoires Eurostat](https://ec.europa.eu/eurostat/documents/3217494/10934584/KS-EX-20-001-EN-N.pdf/8ac3b640-0c7e-65e2-9f79-d03f00169e17?t=159093668) et les [sources listées par la RBA](https://www.rba.gov.au/statistics/other-data-sources.html) au 21/11/2026. **Ce sont des pages institutionnelles générales, PAS les articles/communiqués précis : l'utilisateur doit sélectionner et enregistrer le lien d'une publication datée. Aucun prix, taux, calendrier ou consensus n'est prérempli.** Le répertoire est du code utilitaire, pas un connecteur.

### Risques de perte de brouillon corrigés
- Une citation saisie partiellement mais pas encore ajoutée est désormais reconnue comme **donnée non sauvegardée**. Relire le stockage, changer de devise et créer un nouveau dossier MTA doivent avertir/obtenir confirmation avant d'abandonner ces champs; importer une bibliothèque en présence d'un brouillon est refusé.
- Enregistrer une version pendant qu'une citation est en cours de saisie est refusé jusqu'à l'ajout ou l'effacement de la citation pour éviter les références omises involontairement.
- Les copies de sources de Macro Desk vers les dossiers MTA conservent leurs **URLs précises et observations d'origine**. Les versions historiques sont append-only dans l'interface, **pas cryptographiquement scellées** contre l'édition manuelle du localStorage.

### Limites explicites à corriger dans P1D
- Calendriers économiques et prévisions sont encore saisis manuellement; données officielles futures doivent passer par provenance/horodatage/licence et être testées.
- `asOf` est une date (pas une heure) et l'horloge est celle du navigateur; on ne peut pas prouver qu'une information était connue avant la publication du résultat le même jour. **Ne pas affirmer une chronologie ex-ante vérifiée** sur ce fondement.
- La divergence d'horizon et d'unité entre deux économies n'est pas automatiquement résolue par le simple fait qu'elles possèdent chacune une publication. Les dates distinctes sont signalées; besoin futur d'analyses de comparabilité, pas de scores.
- La bibliothèque locale ne se synchronise pas; 8 versions maximum par devise et taille limitée. Export/backup/merge de versions entre appareils nécessitent un choix explicite. Aucune fusion automatique sur import non vide.


---

## 7. CHECKPOINT CI P1C — PREUVE VÉRIFIÉE et point d'arrêt réel

**Fonctionnalités + 16 liens institutionnels + tests + corps initial de ce handoff vérifiés sur commit exact `02f95c1b72936ffd572d2aa08c17b703d971a6bb`.**

**[GitHub Actions #44904719506](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44904719506) : `completed / success`** sur ce même SHA. Job `136847723367` :
- Reproductibilité `npm ci` : **success** ;
- `npm run test:trading`, `test:cases`, `test:private-cases`, `test:macro` : **success** ;
- lint de tous les fichiers TS/TSX/JS touchés : **success**, sans prétendre corriger la dette de lint non pertinente du repo entier ;
- `npm run build` TypeScript strict + Vite production : **success** ;
- vrai Chromium/React **320px, 390px, 1440px** : **success**. Le test contient des données **strictement fictives**, sans publication économique ni prix de marché téléchargé. Il vérifie 8 devises, 28 paires, absence de lecture/écriture avant accord, deux fiches datées EUR/GBP, lien publication originale, source inachevée sauvegardée lors du refus de changer de devise, archive locale v1, transfert de deux sources au dossier MTA v1, `direction=undecided`, aucun ordre, aucun écrasement de l'ancienne bibliothèque de dossiers et création du quatrième uniquement sur clic.
- Artefact Chrome `trading-macro-p1c-synthetic-browser-evidence` sauvegardé : **270 612 octets** (captures fictives seulement).
- [Workflow non-régression Trading #44904724137](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44904724137) **success** sur le même SHA.

La première version de la PR a eu des erreurs ESLint mineures (deux constantes dérivées non utilisées), **corrigées** sans désactiver la règle ni supprimer les tests. Les runs verts ci-dessus prouvent la version corrigée avec répertoire officiel et tests des sources.

**Ce paragraphe est un nouveau commit strictement documentaire après `02f95c1`. Vérifier son HEAD via GitHub et la CI avant d'affirmer « SHA final validé » ; inscrire la preuve dans le corps de la PR #129 et l'issue #122** pour que les chats futurs ne dépendent pas de la mémoire du modèle.

### Prochaine tranche la plus utile P1D (ne pas repartir dans l'auth OIDC sans vrai fournisseur)
1. **Relier le Macro Desk à des publications officielles réelles** avec provenance et droits de réutilisation : communiqués des 8 banques centrales, calendrier de décisions et données de statistiques nationales. Chaque observation doit avoir `originalPublisher`, URL spécifique, `asOf`, unité, période/économie et indicateur, et statut réussi/indisponible ; privilégier réutilisation du moteur d'ingestion et de comparaison World-Vision, ne pas coder 8 fetchs sans source registry.
2. **Analyses ex-ante / ex-post** : sur chaque événement, geler le consensus AVANT la publication (si provenance et horodatage le permettent), puis montrer la différence avec le chiffre publié et la réaction observée (PAS signal), différences d'unités et saisonnalité et révisions. Le journal `tradeResearch.ts` existe déjà, le relier méthodiquement et ne pas doubler les données.
3. **Harmoniser Atlas, source nationale et GDELT** pour couvrir pays majeurs et économies africaines : la force internationale du produit vient de la pluralité et de la comparabilité, pas des 8 devises à elles seules. Bourse Afrique/BRVM, Money et Tourisme restent dans la feuille de route.
4. **Confidentialité/compte** : ne brancher le Macro Desk sur Postgres et OIDC que lorsqu'un vrai IdP avec JWT issuer/aud/role, staging HTTPS, comptes de test A/B, RGPD, backup restore, et runtime least privilege existent. La PR #127 ne prouve que la sécurité d'un **token de test signé**, pas un accès utilisateur en production.
5. **Capacité** : pour durablement dépasser huit versions par devise, concevoir un journal append-only serveur réel, source timestamps, pagination et stockage privé, **sans éviction silencieuse**. Le plafond actuel protège le quota local et l'utilisateur peut exporter JSON.

**STATUS PRODUCTION : NON déployé, NON fusionné ; les PR #115/#120/#121/#124/#125/#127 et #129 restent une chaîne de brouillons. Aucun frais, abonnement, données payantes importées, courtier ou faux flux de marché.**
