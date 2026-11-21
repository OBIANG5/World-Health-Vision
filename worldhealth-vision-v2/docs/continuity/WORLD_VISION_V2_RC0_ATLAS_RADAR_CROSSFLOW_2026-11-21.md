# World-Vision V2 — RC0 Atlas/Sources/Global Radar : validation transversale et passage à l'échelle
**Date : 21 novembre 2026. Statut : branche de qualité candidate, aucun déploiement ni fusion.**

## 0. REPRENDRE ICI EN CAS DE CHAT INTERROMPU
- Dépôt : `OBIANG5/World-Health-Vision`. **Software ONLY** sous `worldhealth-vision-v2/`, jamais V0/V1, `main` (README V0), ni branches/artefacts de montage MEDIA.
- Base immuable : PR DRAFT [#140](https://github.com/OBIANG5/World-Health-Vision/pull/140), branche `product/v2-radar-gabon-imf-claims-evidence-r2c-2026-11-21`, HEAD initial exact `7c3c43fbe47525c2224b6543369e2577a6b4679b`. Ascendance source/Produit : #115 → #134 → #136 → #139 → #140.
- **Cette branche de validation** : `qa/v2-radar-ux-crossflow-rc0-2026-11-21`, créée depuis ce SHA R2C sans changer les PR existantes.
- **Aucune production ni hébergement backend prouvés**. Blocage Git/Vercel et danger `main` = V0 documentés dans [#96](https://github.com/OBIANG5/World-Health-Vision/issues/96#issuecomment-7069672433). Première revue d'originalité du dossier Gabon–FMI dans [#76](https://github.com/OBIANG5/World-Health-Vision/issues/76#issuecomment-7069676946). Graphe d'intégration dans [#133](https://github.com/OBIANG5/World-Health-Vision/issues/133#issuecomment-7069694308).
- **Ce document n'est pas un rapport de CI réussie** : vérifier le dernier SHA de la future PR et les **jobs réels** avant de valider le lot. Même build V2 ne signifie PAS même base backend en préproduction ni Safari réel.

## 1. Pourquoi ce lot est nécessaire
L'objectif n'est pas de faire une énième modal, un second moteur de sources ou un nouveau dashboard Trading. La V2 possède déjà :
- Atlas/globe et catalogue de 217 pays/territoires (registre ≠ données toutes connectées).
- UX-1B : accès pays/mondes, choix manuel de deux institutions, vérification de provenance mais pas de faits.
- Global Radar R1/R2A/R2B : découverte GDELT sur clic et archive Events officielle correctement attribuée, uniquement **candidats de liens**, 40 maximum en aperçu.
- R2C : quatre questions documentaires Gabon–FMI clairement attribuées. Les textes originaux entiers, corrections, audit gouvernemental et interview Bloomberg **ne sont pas encore entièrement revus**.
Les derniers tests UX-1B et Radar ont été validés dans des workflows distincts : une même release candidate doit **prouver que les parcours coexistent sur le même code compilé**, y compris tablette, avant tout déploiement. Les résultats du moteur de données et du frontend sont des preuves de nature différente.

## 2. Changements ciblés — pas de nouvelle fonctionnalité
1. `frontend/web-v2/ux1b-sources-smoke.mjs` : reprendre le canal Chromium choisi par le workflow (`WHV_BROWSER_CHANNEL`), comme le smoke Radar. Reste un vrai navigateur piloté, pas un faux DOM.
2. `.github/workflows/whv-v2-global-radar-real-browser-r2b.yml` : déclencher également sur cette branche ; inclure le test UX dans lint/path filters ; exécuter `node ux1b-sources-smoke.mjs` **sur le même `dist/` déjà construit** que le smoke Global Radar ; conserver les captures des deux parcours dans le même artefact synthétique, sans ajouter d'appel GDELT réel.
3. Documentation de transmission et critères de succès. **Ne pas toucher aux composants React, aux modèles de preuve, aux bases ou au média.**

## 3. Contrat de réussite observable
- Build TypeScript 6 + Vite avec lockfile, lint des chemins touchés, tests Node et Python du moteur GDELT, test Chromium Radar sur **320 / 390 / 1440 px**; GDELT archive synthétique en CI clairement marquée, pas réseau fournisseur par défaut.
- Sur ce **même build et SHA** : test UX-1B sur **320 / 390 / 820 / 1440 px** : globe unique, liens « Sources du pays / mondiales » actifs, sélection GAB de deux sources, pas de faux accord, aucune source présélectionnée, 3e source bloquée quand 2 choisies, retrait et remplacement possibles, URL HTTPS originale, absence de débordement et d'erreur runtime.
- Le smoke Radar existant doit prouver 3 origines du dossier Gabon/FMI et 4 questions R2C avec leurs limites, CSS réellement chargé, restrictions de droits, dates et lien original; et archive `DISCOVERY_ONLY`. Une requête externe 429 n'est PAS une absence d'événement.
- Séparation SEO : `npm run build` normal demeure indexable; script d'aperçu uniquement applique `noindex,nofollow,noarchive`; pas d'envoi GDELT non sollicité. Pas de `git_info_fail` confondu avec le succès CI.
- Si un test échoue : **signaler quel parcours a régressé**, corriger uniquement dans la branche de qualité, rerun sur nouveau SHA, ne jamais éditer le parent R2C green ni désactiver une assertion pour « faire vert ».
- **Exclusions connues** : Safari/iPhone physique non encore testé; accessibilité complète/FR-EN tous parcours non garantie par ces seuls tests; Atlas→Gateway→PostgreSQL en staging et révocation source en condition live non démontrés; zéro mesure de capacité à 1 million d'utilisateurs.

## 4. La vocation internationale, sans faux « prêt pour des millions »
**Ce qui a du sens tout de suite : concevoir des contrats et frontières qui s'étendent sans réécriture ; dimensionner par mesures plus tard.** Un million d'inscrits n'est pas un million de requêtes concurrentes. Les profils de charge, la répartition horaire, la taille des réponses, les coûts de fournisseurs, les droits et le taux d'erreur détermineront le dimensionnement.

### Choix technologiques existants, à conserver tant qu'ils tiennent les tests
- **React + TypeScript/Vite** pour un client responsive contrôlable par navigateur ; typage du contrat `DISCOVERY_ONLY` et états loading/unauthorized/unavailable. CDN et cache versionné pour assets publics, jamais données privées ou licences révoquées sans validation.
- **Java / Spring / Gateway / Catalog / Timeseries / Analytics** pour les contrats métier et services persistants, authentification signée, transactions, backpressure, observabilité. Ne pas réécrire en Rust/Go sur intuition : mesurer un point chaud réel et coût/complexité avant de décider.
- **Python** pour les connecteurs sources/GDELT, contrôle ZIP, dates, licences et transformations reproductibles, isolés en jobs à cadence contrôlée. Plus tard file de travail/worker et checkpoints si usage réel le nécessite, pas de cron public payant sans besoin.
- **PostgreSQL + TimescaleDB** pour provenance, séries temporelles et droits/révocations, transactions/migrations vérifiées. Index/perf/partitionnement d'abord mesurés, jamais devinés. Conserver séparation SourceDocument/ClaimEvidence/EventSignal/StatisticalObservation/PriceOffer.
- Séparer la lecture publique cacheable de l'espace privé (thèses, Watch, historiques) ; politique de cache cohérente avec les révocations, version de source, `asOf` et user scope. La donnée de marché redistribuable et la statistique institutionnelle ont des licences distinctes.

### Contrats à verrouiller pour scale mondial (sans ouvrir aujourd'hui de chantier infra)
1. **Qualité des preuves et droits** : provenance/URL canonique, publication vs découverte vs collecte, langages, territoire réel et exclusions, corrections, syndication, attribution, licences par opération, audit et retrait idempotent. Pas de mention GDELT transformée en événement vérifié ni trois republications en trois corroborations.
2. **SLO par parcours** : Atlas statique cachable, source originale, Radar découverte, données publiques autorisées, états privé/Watch et Trading : latences et fraîcheur différentes. Définir p95/p99, disponibilité et budgets d'erreurs **après baselines**, pas de chiffres fictifs.
3. **Ingestion contrôlée** : quotas fournisseurs, `429/Retry-After`, backoff/jitter bornés, mécanisme de non-répétition, DLQ/replay si charge le justifie, revue des robots et des licences. Ne pas crawler les URL arbitraires GDELT (SSRF et copyright).
4. **Données** : écriture immuable Bronze/provenance, normalisation avec empreintes et versions, dédoublonnage et idempotence, révisions/historique, comparaisons géographiques/horodatages compatibles, stockage de preuves proportionné.
5. **Service & sécurité** : JWT/OIDC réels, séparation identité/permissions, liste blanche Gateway, service-to-service auth et egress, chiffrement, RGPD, demande de suppression, secrets hors dépôt, sauvegarde restaurable, rollback prouvé.
6. **Observabilité & coût** : métriques requêtes, taille, mémoire/CPU/pool JDBC, 429/502/503, latence source→découverte→revue→écran, taux de source accessible, coûts par 1 000 découvertes et par dossier utile. Aucune étiquette PII inutile.
7. **Tests de charge représentatifs** : 1→2→4→8→12→24 utilisateurs dans CI/staging comme prévu dans [#63](https://github.com/OBIANG5/World-Health-Vision/issues/63), puis paliers et profils mondiaux mesurés, cache froid/chaud, erreurs, saturation, réplicas, budget et droit des données. La CI connue sur 12 pays/54 indicateurs et 124 416 observations **SYNTHETIC** est utile, mais ne prouve pas une capacité millions.
8. **Expérience internationale** : pays, régions, devises, fuseaux et DST corrects, interfaces FR/EN puis langues priorisées par utilisateurs, accessibilité WCAG mesurée, réseaux mobiles lents et hors ligne, bascules explicites données absentes vs fournisseur HS vs interdites de publication.

### Priorités de réalisation (ratio valeur/risque)
**RC0** : même code, smoke UX+Radar+source et succès CI réel.
**RC1** : prévisualisation séparée, authentifiée et réellement consultable. Vercel existant `world-health-vision-v2` ; GitHub `main` = V0 : **ne jamais connecter/déployer aveuglément `main`**. L'accès GitHub Vercel est à confirmer dans `Settings → Git` de l'équipe propriétaire.
**RC2** : parcours Atlas GAB/FRA/BRA + Gateway/Timeseries sur staging isolé, données publiables si droits humains signés et sources réellement attestées ; sinon absence honnête, 401/403/503, révocation et restauration.
**SOURCES-1** : dossier original Gabon–FMI revu légalement, un second pilote pays/région seulement après protocole de correction, independence et comparabilité éprouvé.
**SCALE-1** : mesurer vraie charge représentative, fixer SLO/coût, durcir la plateforme en fonction d'un goulot identifié ; Watch/Trading/BRVM consomment le Core, sans duplication ni dépense anticipée.

## 5. Vercel — liens exacts et état du blocage
- Projet existant : https://vercel.com/obiangabaghapresley-7609s-projects/world-health-vision-v2
- Paramètres Git : https://vercel.com/obiangabaghapresley-7609s-projects/world-health-vision-v2/settings/git
- Applications GitHub installées : https://github.com/settings/installations
- À la reprise, GitHub `visibility=public`, `default_branch=main` (V0) ; Vercel `git_namespaces(github)=[]`, `linkedProjects=[]`, dernier déploiement preview `git_info_fail`. Les anciens textes parlant de dépôt privé étaient périmés ; absence de connexion Git observable ≠ preuve de déconnexion volontaire.
- La connexion du dépôt à **l'actuel projet Vercel** nécessite l'interface Vercel/GitHub ; l'action disponible `create_git_project` ne reconnecte pas le projet existant. L'utilisateur doit choisir/autoriser le repo dans GitHub App et contrôler la branche de prod AVANT d'activer l'auto-déploiement. Aucune identité/token demandés dans le chat.

## 6. Journal exact et plan de reprise
- 21/11 : identifié réutilisation des composants UX1B déjà présents sur R2C malgré divergence Git ; styles `world-editorial.css`, `country.css`, VisionHub et smoke UX ont les mêmes blob SHA ; App et CountryLocalEvidencePanel diffèrent.
- 21/11 : créé branche `qa/v2-radar-ux-crossflow-rc0-2026-11-21` depuis `7c3c43f...`, corrigé canal Chromium smoke UX puis branché UX1B dans workflow Radar avec captures communes. Aucune nouvelle source/pseudo-fait ni UI.
- **À faire IMMEDIATEMENT après ce commit documentaire** : créer PR DRAFT sur R2C, contrôler HEAD exact et runs/jobs ; si échec, diagnostiquer logs+capture et corriger, re-vérifier. Ajouter ici le SHA et l'URL du run final, sans prétendre green avant preuve.
- **À faire APRÈS** : traiter blocage Vercel avec l'utilisateur en conservant prod V0/V2 existante et contrôles sécurité/noindex; pas de double projet lancé. En parallèle rechercher les originaux du dossier Gabon–FMI ; toute source non lue reste marquée non revue.
- **Jamais** : fusion automatique vers `v2`/`main`, modification branches MEDIA/V0/V1, nouveau VPS/abonnement sans GO, déclaration « un million d'utilisateurs supportés » sans test, suppression des inconnues pour simplifier le tableau.

## 7. Incident réel découvert au premier test croisé — et correction du HARNESS
**Run exact échoué :** https://github.com/OBIANG5/World-Health-Vision/actions/runs/44953826166 (PR #143, SHA `d306453822e2e0fbbb8a19f86d7e69a5502bbf70`). Python, TS, Vite, Chrome Radar ont réussi ; l'étape intégrée UX-1B a échoué sur `.whv-national-evidence-source` jamais présent, au **premier viewport de 320 px**.

**Diagnostic de cause, vérifié dans le code/les workflows existants** : `fetchCountryLocalContext(GAB)` appelle réellement `/api/catalog/countries/GAB/local-context`. Le build statique Radar n'intègre ni backend ni catalogue local en snapshot. Le composant `CountryLocalEvidencePanel` refuse alors correctement de fabriquer des fiches et affiche « Sources locales non vérifiables ». Le workflow historique [PR #75](https://github.com/OBIANG5/World-Health-Vision/pull/75) fournissait explicitement **4 archives de registre** depuis `whv-v2-browser-preview` et un bootstrap de simulation du Catalog, ce que le premier test intégré avait omis. **Ce n'était pas une preuve d'une régression produit** ; c'était un mauvais prérequis de test. Ne pas prétendre davantage avant la seconde CI.

### Correction en deux preuves complémentaires
- Nouveau `ux1b-no-backend-smoke.mjs` : même vrai build Vite, sans backend et sans fixture Catalog. Doit vérifier au téléphone 320 et 390 px **source UNKNOWN et couverture Timeseries UNKNOWN**, pas zéro et pas institutions inventées.
- CI après ce contrôle : checkout read-only de la branche historique `whv-v2-browser-preview` en dossier `archived-ux-fixtures`, **empreinte Git de chacun des quatre fichiers vérifiée en Python avec header Git blob + NUL réel** avant copie uniquement dans `dist/`. Les blobs attendus sont `609e94c49c7ea6ae72a9f6c365b2fd244effcd7c` (countries), `2523123fb83b84bdae9f00f6f8c948979f760fdb` (sources), `05a277ea1d19008d3f05962bd35e26eee0ff11ec` (local catalog), `51870b4ba981831bbd6bc711173f453445131303` (bootstrap). Aucun changement de données de production ni `public/`.
- Le **même bundle TypeScript/Vite** que le Radar est donc exercé **sans backend**, puis avec **catalogue archivé explicitement étiqueté**. Les deux tests ont des conditions de données différentes ; la CI ne prétend PAS avoir exécuté un backend Timeseries réel. L'ancien test UX1B doit alors prouver la sélection de deux sources et les liens sur **320/390/820/1440**.
- Les captures « no backend » et « archive fixture » restent en artefact CI; le pipeline de publication est absent, le job GDELT réel demeure opt-in/skip. La comparaison de l'ensemble est un **test d'intégration du FRONT**, pas une preuve de staging complet.

**Point de reprise actualisé :** PR #143, branche `qa/v2-radar-ux-crossflow-rc0-2026-11-21`, derniers fichiers modifiés = workflow Radar, `ux1b-sources-smoke.mjs` (canal Chrome), `ux1b-no-backend-smoke.mjs`, ce handoff. Vérifier la CI du dernier HEAD (après la présente modification), corriger tout vrai échec ou marquer le lot non validé ; ne pas déclencher production ni Vercel auto-branch. Ensuite le prochain gate métier reste preview protégée et expérience mobile réelle.
