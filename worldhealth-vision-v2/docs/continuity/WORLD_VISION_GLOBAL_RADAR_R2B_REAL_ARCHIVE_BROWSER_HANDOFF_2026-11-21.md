# World-Vision logiciel V2 — R2B : GDELT réel → archive datée → navigateur + premier dossier Gabon/FMI
**Continuité officielle inter-chats — 21 novembre 2026.**
**PR empilée #139 en DRAFT, jamais fusionnée ni déployée sur un domaine public dans ce lot.**

## 0. Quelle est la vraie priorité du propriétaire ? Ne pas perdre le fil
Lire d'abord [issue stratégique #133](https://github.com/OBIANG5/World-Health-Vision/issues/133). L'objectif est international, rigoureux et rentable, mais le rendement par heure d'ingénierie est plus important que des démos de sous-outils techniques. Le propriétaire a explicitement reproché de prolonger les fonctionnalités Trading isolées et les couches de sécurité/contrats au détriment de sources vérifiées, de Global Radar, de vrais parcours pays/actualité et de l'utilisation mobile. **R2B n'est pas un fin en soi** : ne pas refaire encore 15 sous-modules GDELT après. Priorité après tests : rendre utilisable un parcours pays/événement avec des originaux réellement accessibles et préparer un staging du produit existant, avant un nouveau dashboard Trading.

Chaîne GitHub **précise et jamais interchangeable** :
- Atlas/product source en [PR DRAFT #115](https://github.com/OBIANG5/World-Health-Vision/pull/115), branche `product/v2-p2c3c2-signed-scoped-public-read-2026-11-21`.
- Global Radar R1 = [PR DRAFT #134](https://github.com/OBIANG5/World-Health-Vision/pull/134), branche `product/v2-global-radar-gdelt-source-discovery-r1-2026-11-21`, basée sur #115. Déjà vraie interface React `?wv=radar` (recherche DOC API sur clic; provider 429 honnête), comparaison des **métadonnées** de 2 articles, pas des faits.
- GDELT Events static R2A = [PR DRAFT #136](https://github.com/OBIANG5/World-Health-Vision/pull/136), branche `product/v2-global-radar-gdelt-static-events-r2a-2026-11-21`, basée sur #134. Le vrai collecteur Python `services/ingestion-service/src/ingestion_service/connectors/gdelt_events_feed.py` lit UNE archive Export 15 minutes GDELT officielle (manifest 3 lignes export/mentions/gkg), taille ZIP bornée, empreinte MD5 vérifiée, 61 colonnes TSV, URLs d'origine canoniques et rejet SSRF/injections, aucun article téléchargé, 34 tests Python et 2 jobs GitHub verts sur SHA R2A exact `e26753494e306b7dcec0c6b3814e9c175347a71d` [run #44944032361](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44944032361).
- **R2B = [PR DRAFT #139](https://github.com/OBIANG5/World-Health-Vision/pull/139)**, branche `product/v2-global-radar-source-archive-preview-r2b-2026-11-21`, base **exactement** `product/v2-global-radar-gdelt-static-events-r2a-2026-11-21`. Pas de modifications Media, Trading ou PR base, aucun abonnement ni VPS demandé.

## 1. Nouveauté à meilleur ratio valeur/coût
**Avant R2B** : 619 événements GDELT vrais /120 URL HTTPS détectées/476 références répétées/23 URL invalides, mais visibles seulement dans les logs Python d'opérateur, tandis que l'interface V2 n'utilise que DOC API qui retourne 429 depuis GitHub. C'est un progrès d'ingénierie, pas encore un service utilisateur.
**R2B transforme le même outil en chaîne utilisable avec une preuve Chrome** :
1. Un appel volontaire à `lastupdate.txt` et un seul ZIP officiel Events via le parser existant R2A, pas de gros GKG, pas de doublon service.
2. `export_gdelt_radar_snapshot.py` produit atomiquement `frontend/web-v2/public/radar/global-latest.json` **UNIQUEMENT quand on l'invoque** pendant la compilation preview. Limite max 40 URLs admises (échantillon), fichier max 140KB, un même slot de batch 15 minutes, âge <=6h à la génération, jamais label « live ».
3. `gdeltStaticSnapshot.ts` valide à nouveau la structure et les droits avant toute UI : source de données GDELT, URL crédit GDELT, timestamps UTC, empreintes manifeste/ZIP, absence texte éditeur, `DISCOVERY_ONLY` et `eventFactsVerified=false`; chargement **same-origin uniquement**, pas de proxy CORS pour URL arbitraire, 404/HTML 200/5xx → `unavailable`, jamais « pas de nouvelles ».
4. `GlobalRadarStaticArchive.tsx` affiché à l'ouverture de `?wv=radar` : vrai état de publication du build, date GDELT, mention qu'il ne s'agit PAS du direct, statistiques, liste des domaines/URL origines, filtres par domaines et codes CAMEO/FIPS **sans les traduire faussement en lieu/pays**, sélection libre de deux liens, aucune inférence d'accord ni d'indépendance éditoriale, lien vers l'original éditeur, attribution GDELT.
5. Le moteur DOC API initial reste accessible par formulaire dans la même modale, mais peut répondre 429. La liste statique n'efface pas le constat de panne du fournisseur ; elle provient d'un autre transport.
6. **Dossier thématique concret** `editorialSourceCase.ts` + `GlobalRadarEditorialPilot.tsx` : démonstration originale datée **Gabon et FMI — discussions de programme, septembre à novembre 2026**, 3 liens authentiques contrôlés en recherche externe : AGP source presse gabonaise (25/09/2026, relayant un communiqué du gouvernement), FMI communication primaire (26/09/2026, discussions techniques), EcoMatin média économique Afrique centrale (20/11/2026, citant une interview Bloomberg du ministre sur objectif décembre). **Ces documents ne sont ni un seul « événement » ni une confirmation indépendante l'un de l'autre**; les descriptions ne sont que des paraphrases rédactionnelles issues d'extraits publics indexés, **les textes complets n'ont PAS été récupérés**. L'interface refuse donc les statuts « factual verified » ou « IMF programme approved », affiche le statut préliminaire, les dates, les dépendances éditoriales et le choix de 2 sources. Ne pas mettre le dossier à jour automatiquement sans relecture.
7. **Réutilisabilité** : un même pipeline source GDELT alimente Atlas/Global Radar et, plus tard, Media, Trading, Watch, BRVM, sans s'enfermer dans 8 devises/28 paires. Le dossier documentaire prépare une véritable comparaison de contenus, mais la version complète requiert contrôle des originaux, droit de citation et suivi des versions.

## 2. Politique de droits corrigée par recherche PRIMAIRE (important)
La source OFFICIELLE [The GDELT Story — Terms of Use](https://www.gdeltproject.org/about.html) affirme explicitement :
- Les **jeux de données distribués par GDELT** sont réutilisables sans frais pour usages académiques/commerciaux/gouvernementaux ; ils peuvent être redistribués SI attribution à **The GDELT Project** et lien vers `https://www.gdeltproject.org/`.
- Cela **n'accorde aucun droit autonome de recopier les articles, photographies, textes et titres complets des éditeurs tiers**. R2B republie **uniquement les URL/source codes/horodatages de provenance GDELT**; pas de plein texte ni de titre issu de l'article. Attribution visible dans l'interface et dans le JSON build.
- Ne PAS mélanger les termes de GDELT *Project raw datasets* et de « GDELT Cloud » (produit distinct avec règles spécifiques), ni les licences des contenus sources avec les données GDELT.
- Article externe = clic volontaire dans un nouvel onglet avec `rel=noopener noreferrer`. Ce clic peut conduire au paywall, suppression, correction ou origine non indépendante ; ne pas attribuer à World-Vision un droit de republication.

## 3. Fichiers exacts
**R2B, sans compter les ancêtres R1/R2A :**
- `worldhealth-vision-v2/services/ingestion-service/export_gdelt_radar_snapshot.py` — vraie génération du snapshot, date/âge, crédits, min rights, limite et écriture atomique; échec → pas de publication d'un snapshot caduc.
- `worldhealth-vision-v2/services/ingestion-service/tests/test_export_gdelt_radar_snapshot.py` — tests Python horodatages, renouvellement, droits et URLs, écriture atomique.
- `worldhealth-vision-v2/frontend/web-v2/src/radar/gdeltStaticSnapshot.ts` — contrat TypeScript protecteur, as-of UTC, validation source data et same-origin fetch.
- `worldhealth-vision-v2/frontend/web-v2/src/components/layout/GlobalRadarStaticArchive.tsx` — liste réelle/instantanée, 2 sources, filtrage et caveats.
- `worldhealth-vision-v2/frontend/web-v2/src/radar/editorialSourceCase.ts` — documents recherchés Gabon-FMI du 25/09, 26/09, 20/11 ; dépendances éditoriales et limitations conservées.
- `worldhealth-vision-v2/frontend/web-v2/src/components/layout/GlobalRadarEditorialPilot.tsx` — premier parcours de comparaison documentaire, 3 perspectives, ouverture à la demande, zero fake conclusion.
- `worldhealth-vision-v2/frontend/web-v2/src/components/layout/GlobalRadarPanel.tsx` — intégrer les deux nouveaux parcours dans la vraie UI déjà présente sans supprimer recherche DOC.
- `worldhealth-vision-v2/frontend/web-v2/src/styles/global-radar.css` — 320/390/1440 responsive.
- `worldhealth-vision-v2/frontend/web-v2/scripts/test-global-radar-static-snapshot.mjs` — vrai module TS, corruption/rights/dates/URLs/same-origin.
- `worldhealth-vision-v2/frontend/web-v2/scripts/test-global-radar-editorial-case.mjs` — 3 vraies sources + dépendances/faux fact-check rejetés.
- `worldhealth-vision-v2/frontend/web-v2/global-radar-real-archive-browser-smoke.mjs` — **vrai React + Chrome** 320/390/1440 en mode fixture et mode vrai GDELT, recherche initiale zéro requête DOC, dossier réel AGP/FMI/EcoMatin, paire libre, filtrage, absence de débordement.
- `.github/workflows/whv-v2-global-radar-real-browser-r2b.yml` — 2 jobs distincts et reproductibles.

## 4. Protocole de tests et point de reprise CI
### Job A — OFFLINE, must pass:
- Python3.12 `pytest tests/test_gdelt_events_feed.py tests/test_export_gdelt_radar_snapshot.py` avec ZIP synthétiques (adversarial).
- Node22 : `node --test scripts/test-global-radar-static-snapshot.mjs` et `test-global-radar-editorial-case.mjs` + tests R1 DOC.
- ESLint sur tous les fichiers et TypeScript6 strict + Vite production.
- Générer un snapshot clairement synthétique uniquement dans workspace de build CI, puis Chrome 320/390/1440 et screenshots **SYNTHETIC**. Ce job ne dit RIEN sur l'état de GDELT live.
### Job B — REAL fournisseur, fail-safe / non-gating:
- `GdeltStaticEventsClient.fetch_latest_events` vrai `data.gdeltproject.org` (manifest + 1 ZIP Events) ; vérification MD5 et horodatages.
- Générer le **véritable** `public/radar/global-latest.json` avec attribution GDELT et URLs sans texte puis **compiler l'interface V2**.
- Chrome réel 320/390/1440 **sur le build contenant cette archive réelle**, sans aucune interception de données. Échantillon correct (pas SHA `aaaa`/`bbbb` synthétique). Valider 2 origines et bouton choix + dossier Gabon, upload artifact `whv-radar-r2b-real-gdelt-archive-built-preview` contenant **dist et captures**. Ce fichier peut être déployé PLUS TARD comme preview, pas en production implicitement.
- Si GDELT down : le job réel échoue, on ne remplace JAMAIS par fake news; les tests offline restent verts. Un statut job "success" dû à `continue-on-error: true` ne prouve pas la réussite : vérifier les **steps exacts** et logs `ONE genuine official GDELT archive` et `Built real V2 browser`.

**Checkpoint vérifié AVANT AJOUT du dossier éditorial** : [Action #44946024672](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44946024672), code SHA `de10977af209c82563e58825a5784a3cbd416477`, job de sécurité et job de publication artefact réel (ci-dessus) ont été observés `completed/success` à la vérification. **Le nouveau dossier source AGP/FMI/EcoMatin et ses tests ont été codés ensuite** : CI sur SHA ultérieur obligatoire.

## 5. Étape suivante LA PLUS INTELLIGENTE — ne PAS rester dans un prototype
**Décision stratégique de valeur/effort** :
1. Vérifier la dernière CI sur le HEAD exact de la PR #139. Corriger les échecs Node/pytest/TS/ESLint/Chrome ou fichier réel; si passé, ne pas revenir refaire CSS du Radar sans défaut tangible. Documenter commit, runs, SHA, lien artifact et un exemple réel de logs (sans citation non autorisée).
2. Préparer une vraie **PR de release candidate staging V2** avec *l'existant Product/Atlas + Radar* et parcours iPhone, en **évitant de publier un dataset ancien comme du direct**. Le build affichera explicitement la date du snapshot; sans nouveau batch automatique, il vieillit. Demander un feu vert pour toute promotion publique, vérifier les droits originaux et utiliser les protections noindex/coûts.
3. Commencer une **vraie comparaison d'un sujet** : du dossier Gabon/FMI manuel, passer à une **page pays/événement réutilisable**, sources à jour, documents originaux réellement consultés, claims attribués, versions/corrections et droit citation. Le dossier thématique présent n'est qu'une preuve d'interaction, pas une preuve du statut juridique/économique final.
4. Décider ensuite où stocker les sources et les alertes : scheduler/idempotence/backoff/retention n'apportent de valeur QUE si la preview et le premier dossier ont été utilisés. Le Core Python ingestion existant (22 connecteurs) doit être réutilisé, pas microservice supplémentaire. Idéal : <24h de développement entre une découverte utile et son affichage vérifié, pas accumulation de modèles non visibles.
5. Trading-Vision, Bourse Afrique, Média ne doivent pas recopier ces connecteurs; la vraie vision du service Trading/DataAnalyse (160 publications étudiées) reste [#133](https://github.com/OBIANG5/World-Health-Vision/issues/133). Comparateur d'article #76 et staging #96 toujours non achevés.

## 6. Ne pas promettre ce qui n'a pas été fait
- R2B fournit un **pré-build statique**, pas encore un site hébergé/URL unique, backend permanent, notification Watch, Base SQL, collecte 15 min continue ni article journalistiquement vérifié. Les tests navigateur SYNTHETIC sont explicitement annoncés, le job réel distinct.
- Une URL de publication seule ne prouve pas son existence aujourd'hui; certains sites peuvent bloquer, corriger et retirer; les liens Gabon-FMI ont été repérés le 21/11/2026 dans des extraits de recherche publics et nécessitent relecture intégrale avant étiquetage FACT_CHECKED.
- Les codes GDELT FIPS ne sont pas des ISO3, les événements CAMEO ne sont pas des faits ou des « sujets » directement compris, et `DATEADDED` n'est pas le `published_at` de la presse.
- Pas de priorité automatique à Trading P1D #131, ni à l'auth/projections, avant le parcours source→preuve→comparaison→premier utilisateur réel.


---

## 7. POINT DE REPRISE R2B VÉRIFIÉ — code final d'interface et preuves réelles (21/11/2026)

**Commit code validé sur SHA EXACT `6b4521884cf07ce302beae1722a7781bd1960143`** :
- [CI R2B #44946513565](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44946513565) **completed/success**, SHA identique. Job `source-archive-contract` **136974927749 success** : Python parser R2A + exporter R2B tests, Node tests du vrai module TypeScript validant droits/fraîcheur/URLs et du **dossier réel AGP–FMI–EcoMatin**, ESLint ciblé, TypeScript6+Vite production et **vrai navigateur Chromium sur V2** 320px/390px/1440px avec fixtures explicitement SYNTHETIC.
- Job `real-source-to-browser-preview` **136975190678 success** : un vrai `lastupdate.txt` et **un seul ZIP Events officiel**, MD5 fournisseur validé, et génération `public/radar/global-latest.json` avec **URL/métadonnées seulement, pas de texte d'éditeur**. Puis vrai frontend Vite compilé avec CET instantané et **navigation Chrome non interceptée** sur 320/390/1440, états de provenance, GDELT credit, sources d'origine et choix de deux liens. Logs browser : `PASS R2B 320px REAL_PROVIDER`, `390px REAL_PROVIDER`, `1440px REAL_PROVIDER`. Ceci prouve un chemin end-to-end `GDELT réel → source normalisée → JSON statique → V2 compilée → Chrome`, PAS un événement vrai ou une donnée de marché.
- Observation GDELT réelle du job `136975190678` à `2026-11-21T20:30:22Z` : slot `2026-11-21T20:30:00Z`, **561 lignes automatiquement codées**, **89 URLs originales distinctes détectées**, **40 liens sélectionnés pour le preview** (limite), `providerMd5Verified=true`, SHA256 manifeste `5e2f94ee55a1cd7cb71db05f760256279a7e5ab6d5de480e4468cfc63edacf2f`, aucune publication/claim factuellement confirmé, pas de texte original copié.
- Capture et site compilé archive : artifact GitHub Actions `whv-radar-r2b-real-gdelt-archive-built-preview`, **1 289 820 octets** (ZIP d'artefact GitHub, pas lien Vercel). Captures tests synthétiques distinctes `whv-radar-r2b-synthetic-archive-browser`, **263 207 octets**. Le site V2 compilé peut être récupéré depuis cet artifact et déployé sur une preview isolée après revue, MAIS il n'est pas déjà hébergé.
- Runs supplémentaires sur ce même SHA [#44946517914](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44946517914) et [#44946517918](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44946517918) `completed/success`.
- Note sur la CI : les premiers runs suite à l'ajout du dossier source échouaient pour une assertion textuelle dans le test Chrome (« ne prouvent » vs « ne prouve »), et **non** pour un problème d'intégrité de la collecte, de Typescript ou de contenu. Le test a été aligné sur le contenu réel au commit `6b452188`, puis l'ensemble de la CI a réussi sur ce SHA; ne pas rejouer l'ancien échec comme si c'était l'état actuel.

### Situation réelle du déploiement et rapport qualité/prix
Consultation **LECTURE SEULE** du plugin Vercel le 21/11/2026 :
- Projet Vercel existant : `world-health-vision-v2`, id `prj_fHnsDAO3uqgmeGwezmbGah8CJZzF`, team Hobby. Des déploiements `READY` existent pour des builds précédents.
- L'état de `get_git_deployment_context` a renvoyé **`linkedProjects: []`** et **`originConnections: []`** sur ce team. Aucun lien Git automatique entre le nouveau repo/code branch #139 et le site Vercel n'est donc **démontré**. **Ne pas affirmer que pousser sur GitHub déploie R2B**, et ne pas manipuler une production existante par défaut.
- **Prochaine action au meilleur ROI** : mettre en place/valider **une preview V2 distincte et protégée** depuis le résultat testé, coût nul ou à la demande si possible, sans promouvoir la prod; puis faire une revue de 3 vrais documents originaux comparables et liaisons Atlas/Gabon. C'est plus utile maintenant qu'un nouvel éditeur Forex, un nouveau moteur de collecte ou une pile de 10 migrations de sécurité.
- Si un tiers veut un lien Vercel stable, il faut choisir un mécanisme autorisé de staging : projet/test team Git liée à ce repo (connection explicite utilisateur), ou déploiement d'artefact avec revue et secrets protégés, et état noindex/protection. Ne pas diffuser le dépôt privé, les secrets, ou un faux lien de preview. Ne pas activer Git auto-production accidentellement. La production visible aujourd'hui peut toujours servir d'ancien snapshot V2.
- **Honnêteté UX** : l'archive est **figée à l'heure du BUILD**. Elle peut dater de plusieurs jours dès que la preview ne se reconstruit pas; l'interface affiche « pas du direct » et une alerte d'ancienneté après 3 h. Pas de scheduler à 15 min, pas d'alerte Watch, pas de base persistante, pas de P2/Gateway complet; conserver ce périmètre transparent.

### Vérification HEAD documentaire
Ce checkpoint est ajouté **APRÈS** le SHA code réussi `6b452188...`, ce qui va créer une nouvelle empreinte HEAD documentaire. Vérifier la CI sur le HEAD de cette mise à jour avant de présenter le résultat comme « exact latest HEAD green »; ensuite mettre le SHA/les runs définitifs dans la description de PR #139 et commenter les issues #133/#135/#96/#76. Ne pas committer une infinité de micro-checkpoints après cela.


---

## 8. CORRECTION DU RAPPORT QUALITÉ/PRIX EN CI : PROBE GDELT DÉSORMAIS À LA DEMANDE

La première version du workflow R2B lançait un téléchargement réel d'archive GDELT **à chaque push**, y compris après des changements de simples commentaires/documentation. C'était un défaut concret de rendement en minutes CI et requêtes inutiles, signalé dans le travail de clôture le 21/11/2026. **Ce défaut de conception est désormais corrigé sur la même PR #139.**

`.github/workflows/whv-v2-global-radar-real-browser-r2b.yml` :
- `concurrency.group: whv-radar-r2b-${{ github.ref }}`, `cancel-in-progress: true` : les vieux runs sur la même ref sont annulés lorsqu'un commit plus récent les rend obsolètes.
- `source-archive-contract` reste exécuté à chaque push/PR pertinents : tests safety Python/TypeScript, compilation de production, **Chromium réel avec seulement des fixtures SYNTHETIC**, faible coût et reproductibilité.
- `real-source-to-browser-preview` est **OPT-IN** : déclenché uniquement par un `workflow_dispatch` manuel après intégration du workflow sur branche par défaut, ou un **commit de checkpoint révisé et explicite** dont le message contient `[radar-live-probe]`. Un simple commit de docs/UX n'interroge plus GDELT ni ne reconstruit 3 captures avec réseau externe.
- Après une vraie archive publique déjà validée, aucun motif de télécharger un nouveau batch à chaque changement de ligne de code; choisir une fréquence de rafraîchissement en fonction d'une future valeur utilisateur, d'un quota fournisseur et d'une règle de fraîcheur raisonnable, **pas arbitrairement toutes les 15 minutes**.
- Le présent commit **de clôture documentaire** contient volontairement `[radar-live-probe]` pour effectuer **UN contrôle complet sur le dernier HEAD** et attester que toutes les données (dont le dossier Gabon/FMI) restent correctement branchées. Vérifier dans GitHub Actions le succès du job réel et des 3 navigateurs, puis ne plus modifier du code ou de la documentation sans besoin.

**Roadmap REORDONNÉE après validation** : (1) rendre la version testée accessible sur une URL de PREVIEW stable, protégée et noindex après validation de l'utilisateur, plutôt que lancer un énième service backend; (2) aller au-delà des liens d'articles en vérifiant le CONTENU original et en mettant les désaccords/sources locales et internationales à disposition; (3) mutualiser SourceDocument/Watch/Trading/BRVM si ces parcours ont démontré leur valeur. Les autres travaux Atlas et sources officielles restent utiles mais doivent être *intégrés*, pas accumulés en PR DRAFT invisibles.


---

## 9. INCIDENT SOURCE RÉELLE ET CORRECTION D'EXPLOITATION (21/11/2026)

**Attention, éviter une interprétation trompeuse des runs :** la [CI sur SHA `f59acff` — #44946949626](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44946949626) affiche un état GLOBAL `success` car l'essai externe est `continue-on-error:true`, mais le job `real-source-to-browser-preview` n'a **PAS** réussi. Le job `source-archive-contract` (tests Python/TS/Eslint/build/Chrome synthétique) était vert, alors que la tentative de vraie acquisition au job `136976561832` a affiché `snapshotStatus=UNAVAILABLE, reason=provider_http_404` ; l'étape Chrome sur données réelles a été `skipped`. Il faut contrôler les **JOBS et les steps**, pas seulement le badge du workflow !

**Diagnostic concret :** manifeste GDELT reçu en HTTP 200, mais l'archive ZIP annoncée répondait ponctuellement 404. Une expérience précédente sur SHA `6b452188` avait réussi une vraie chaîne `GDELT → V2 → Chromium 320/390/1440`, donc **fournisseur non fiable à la seconde**, pas « l'ensemble du code est cassé ».

**Correction codée :**
- `services/ingestion-service/src/ingestion_service/connectors/gdelt_events_feed.py` : exclusivement pour le ZIP officiel épinglé `data.gdeltproject.org` annoncé dans le manifeste SHA/MD5 validé, **deux courtes rétentatives pour HTTP 404 seulement**, espacées de **5 s puis 10 s**. **Au maximum trois GET identiques** du ZIP pour UN manifest GET, jamais d'autre hôte, jamais de reprise de 429/403/500/503 et jamais de retour vers un ZIP arbitraire historique sans MD5. Si les trois essais sont encore 404, le résultat reste `UNAVAILABLE` et aucun JSON ne sera créé ou publié.
- `tests/test_gdelt_events_feed.py` : nouveaux cas avec `httpx.MockTransport` et injection de sleep sans attendre : deux 404 suivis de 200, trois 404, 403/429/500/503 non réessayés, MD5/longueur toujours vérifiés. Tests précédents sécurité/ZIP/CAMEO/URLs/rights inchangés.
- `.github/workflows/whv-v2-global-radar-real-browser-r2b.yml` : inclut désormais explicitement client R2A et tests associés dans les chemins de PR pour ne pas rater la CI après modifications de cette partie.
- L'essai GDELT reste opt-in sur commits marqués `[radar-live-probe]` (ou `workflow_dispatch`) pour limiter requêtes, temps de calcul et coûts, avec annulation des runs obsolètes. Un **seul** checkpoint de code + docs est déclenché ci-dessous. Ni cron 15 minutes, ni stockage, ni VPS.

**Reprise intelligente après vérification** :
1. **Lire CI sur le HEAD exact de ce document et inspecter 2 jobs distincts :** le job de contrat doit passer, et le job source réel doit aboutir pour prétendre démontrer *la disponibilité de ce batch précis*. Si vrai fournisseur 404 trois fois, noter « code et fallback validés, fournisseur indisponible à ce moment », sans boucle de relancement infinie.
2. Quand un vrai batch aboutit, retrouver dans le LOG 3 phrases `PASS R2B 320px REAL_PROVIDER`, `390px REAL_PROVIDER`, `1440px REAL_PROVIDER`, et contrôler la présence du site compilé dans l'artefact de preview. Les captures de fixtures SYNTHETIC ne remplacent PAS cette preuve.
3. Mettre à jour la **description de PR #139** (pas de nouveaux commits si seule la documentation d'une CI change) avec SHA exact, jobs et état réel du fournisseur.
4. **Le meilleur retour qualité/effort ensuite :** URL de PREVIEW autonome protégée/noindex à l'aide de l'artefact compilé et revue d'un dossier de sources locales/primaires/internationales réellement lisibles. Le Vercel actuel existe mais sa connexion Git auto n'est pas attestée; pas d'écrasement prod ni de coût récurrent sans décision. Éviter nouveau produit Trading isolé ou nouveau scheduler GDELT sans utilisateurs.


---

## 10. REPRISE DU 21/11 — DÉFAUT VISUEL CHROME CORRIGÉ, PREVIEW VERCEL BLOQUÉE PAR LA CONNEXION GIT, SOURCES AUDITÉES

**ATTENTION : cette section complète et supersède les indications « next step » des sections précédentes pour la tranche R2B. Ne pas repartir au début de l'intégration GDELT : les données réelles → V2 → Chrome sont déjà opérationnelles.**

### A. Défaut majeur que la première CI n'avait PAS détecté
Une inspection MANUELLE des captures mobile du véritable artifact #44947348978 (commit `8c967ea`) a révélé que Global Radar apparaissait **en HTML quasi brut sans design** malgré des tests de DOM, liens, pas de débordement et transactions « verts » ; ni `App.tsx` ni `GlobalRadarPanel.tsx` n'importaient `src/styles/global-radar.css`. **Ce n'était PAS un produit de qualité internationale.**
- Correction commit `96c2638f84e7ac398e49116918a00e8a82feea41` : `import "../../styles/global-radar.css";` dans `GlobalRadarPanel.tsx` lazy-loaded. Style chargé uniquement quand Radar s'ouvre, pas de dégradation globale du globe/Atlas.
- Correctif test commit `2aaae1db1a67e2a58e01d1b565b703166f3ad2b1` : le navigateur Chrome à 320, 390 et 1440px vérifie **les valeurs CSS calculées** `rgb(247, 251, 255)` pour la modale, `rgb(248, 252, 255)` pour l'archive, position `fixed`, bordure arrondie et sans overflow. Capture additionnelle au DÉBUT de la modale (dossier Gabon/FMI + éléments de design) et pendant le parcours de sources; tests visuels ne valident PLUS un simple HTML brut.
- **CI sur SHA exact `2aaae1...` = [#44947870340](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44947870340) `completed/success`**, job `source-archive-contract` avec TypeScript/Vite, Node et 3 navigateurs; artifact `whv-radar-r2b-synthetic-archive-browser`, **841225 octets**. Capture mobile 390px a été manuellement ouverte et montre une vraie interface blanche/bleue responsive, header/source disclosure, contrôles, dossier avec CTA. **Ces captures sont SYNTHETIC pour l'archive GDELT mais le dossier Gabon/FMI est fondé sur de vraies URLs recherchées.** L'ancienne capture HTML brut n'est plus représentative.

### B. Préproduction Vercel effectivement tentée — résultat HONNÊTE et sans effet production
Consultation Vercel CONNECTÉ en lecture puis tentative **unique de PREVIEW (pas production)** sur l'existant `world-health-vision-v2` :
- Projet `prj_fHnsDAO3uqgmeGwezmbGah8CJZzF`, équipe Hobby `team_IMgX20wpMDXdEtWinjaFIU0T`, protection SSO **preview** activée dans la configuration du projet. Production actuelle `dpl_14j5vUmB1ZoDaMfBMxeFaEqZwEeS` READY **non touchée**.
- Le 21/11, demande `create_deployment` avec GitHub private ref `product/v2-global-radar-source-archive-preview-r2b-2026-11-21`, commit `333b353dda01f50ada35d87f844edec2dca27928`, target preview implicite (`target=null`). Vercel a créé `dpl_9LY1gfbMEBvvGK9m7o6ZhX6DtiYz`, URL temporaire générée `world-health-vision-v2-c1fzgunl9.vercel.app` MAIS son statut définitif est **`ERROR`, `git_info_fail`**. **NE JAMAIS PRÉSENTER CETTE URL COMME SITE FONCTIONNEL.**
- Diagnostic complémentaire : `Vercel.get_git_deployment_context` retourne `linkedProjects: []`, `originConnections: []`; `Vercel.git_namespaces({provider: "github"})` retourne `[]`. Le GitHub connecté à ChatGPT **ne donne pas automatiquement au compte Vercel l'accès au dépôt privé OBIANG5/World-Health-Vision**.
- Ce blocage est **une permission interservices qui nécessite l'action explicite du propriétaire** : ouvrir Vercel, connecter GitHub au compte/équipe via les autorisations Vercel GitHub App, autoriser le dépôt privé exact `OBIANG5/World-Health-Vision`, et lier le projet Vercel depuis `Project Settings → Git` (si l'UI le propose) ou créer un projet de PREVIEW distinct protégé. Référence officielle : https://vercel.com/docs/git/vercel-for-github et https://vercel.com/docs/project-configuration/git-settings . Pour éviter les builds/coûts automatiques à chaque commit, décider de la stratégie de build et protection **avant de connecter l'autodéploiement**. Ne JAMAIS promouvoir une preview sur domaine public sans tests et accord.
- Puis retenter **UN seul déploiement preview** sur HEAD revu; pas de boucle infinie ni de création de plusieurs projets payants pour contourner une permission.

### C. Préparation pay-on-demand codée pour la future preview, SANS l'activer sur la prod
- `frontend/web-v2/scripts/build-radar-preview.sh` : script bash `set -euo pipefail`; source GDELT **opt-in seulement via `WHV_RADAR_PREVIEW_FETCH=1`**, utilise connector Python existant dans `services/ingestion-service`, installe si nécessaire `httpx==0.27.2` dans un répertoire local de build, télécharge un seul manifest et archive officielle avec contrôles MD5 et retries 404 bornés; snapshot supprimé pré-build et en cas de fournisseur indisponible; **build Vite fonctionne même si archive indisponible**, UI indique indisponibilité (pas de news inventées), aucun cron ni service acheté.
- `frontend/web-v2/vercel.json` : header `X-Robots-Tag: noindex, nofollow, noarchive` sur les routes de cette branche preview. Ajout du contrôle syntaxe `bash -n` et politique noindex + opt-in dans `.github/workflows/whv-v2-global-radar-real-browser-r2b.yml`. **Ce contrôle de configuration ne suffit PAS à prouver les headers HTTP d'une preview tant que Vercel Git est non autorisé.**
- Pour une future Vercel gitSource preview : root `worldhealth-vision-v2/frontend/web-v2`, `framework: vite`, Node 22, `installCommand: npm ci --no-audit --no-fund`, `buildCommand: WHV_RADAR_PREVIEW_FETCH=1 bash scripts/build-radar-preview.sh`, `outputDirectory: dist`, `sourceFilesOutsideRootDirectory: true` car le connector Python est sous `services/ingestion-service`. **Ne pas écraser les settings de production existants par accident** ; projet distinct preview préféré si auto-build indésirable.

### D. Revue des références éditoriales : source primaire FMI
Les trois références historiques du dossier `editorialSourceCase.ts` ont été retrouvées dans les index de recherche publics le 21/11 :
- AGP origine nationale : https://agpgabon.ga/gabon-fmi-vers-louverture-de-negociations-formelles-pour-un-nouveau-programme-economique/ , 25/09/2026.
- IMF publication primaire : **l'URL repérée dans l'index officiel est l'ANGLAISE** https://www.imf.org/en/news/articles/2026/09/26/pr2305-imf-staff-concludes-visit-to-gabon (l'ancien chemin `/fr/news/articles/...` n'est pas confirmé). Correction commit `4ac8158`, test de non-régression `1e6eabe`.
- EcoMatin média économique région Afrique centrale : https://ecomatin.net/le-gabon-vise-un-accord-avec-le-fmi-en-decembre-apres-une-revision-a-la-baisse-de-sa-dette ; article du 20/11/2026.
**Vérification document** : les URLs exactes remontent en recherche publique, mais leur page HTML intégrale a renvoyé `Cache miss` dans le lecteur web courant. Donc le statut reste `LINK_AND_INDEX_EXCERPT_RESEARCHED`, **pas original intégral lu, pas fact-check, pas accord du FMI approuvé, pas indépendance vérifiée**. Une meilleure prochaine tranche doit contrôler la page primaire, ses éventuelles rectifications et les citations autorisées pour chaque source avant d'affirmer un fait.

### E. Dernière étape de vérification de la tranche R2B
- À l'instant de rédaction, après les commits CSS, préparation Vercel et correction de référence IMF, HEAD de code `1e6eabe568cbc5ce70ba8cca59fb4f7c74733dab`. Vérifier sa CI et ne jamais extrapoler un statut vert d'un SHA précédent.
- **Ce commit documentaire de reprise porte volontairement le marqueur unique `[radar-live-probe]`** pour déclencher une dernière fois le job GDELT réel (archive/date/MD5), la construction Vite et Chrome 320/390/1440 avec la **CSS corrigée**, en plus des tests hors réseau. La génération temps réel peut échouer temporairement sur 404 archive CDN; inspecter step `ONE genuine ...` et `Built real V2 browser ... REAL_PROVIDER`, pas seulement badge global. Si elle réussit, télécharger/inspecter les nouvelles captures réelles.
- **Après succès et validation visuelle** : mettre à jour **DESCRIPTION de PR #139**, issues #133/#135/#96/#76 avec SHA final, runs, artifact et erreur Vercel, **sans nouveau commit de docs** (éviter un nouveau cycle CI). Si pas de permission Git Vercel, laisser état `preview blocked by GitHub authorization` et donner à l'utilisateur le pas UI précis. Aucune promotion ni merge.
- **PROCHAINE PRIORITÉ APRES DÉBLOCAGE VERCEL** : preview distincte utilisable sur iPhone avec parcours réel Gabon/AGP/FMI/EcoMatin et GDELT daté, mesurer onboarding/temps pour 1 source vérifiable. Puis source document originale et comparateur avec distinction reprises/indépendances, Atlas pays, média, puis Trading/DataAnalyse. Ne pas créer un nouveau système de 10 microservices ni refaire des panels Forex pendant ce blocage.

**En cas de nouveau « a cessé de réfléchir » : relire cette section, la PR #139 et le dernier workflow R2B, récupérer SHA/CI exact, reprendre à la première étape non terminée; ne jamais repartir de zéro ni inventer un déploiement.**
