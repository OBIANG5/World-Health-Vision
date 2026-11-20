# WORLD-VISION — UX-1B1 : accueil mobile et pluralité des sources

**Document de passation inter-chat, 19 novembre 2026.**
Dépôt canonique : OBIANG5/World-Health-Vision ; dossier logiciel : worldhealth-vision-v2/.
Branche candidate : product/world-vision-ux1b-source-choices-mobile-2026-11-19, basée sur PR #67 (UX-1A) puis PR #64 (UX-0) puis PR #35 (fondation mobile/globe). Pas de fusion dans v2, pas de déploiement sur l'alias Vercel, pas de changement média/voix/vidéo/V0/V1.

## 0. LE PROBLÈME CONCRET SIGNALÉ SUR IPHONE

L'utilisateur ne voyait pas les changements de style/navigation parce que GitHub et Vercel sont deux surfaces différentes.
- Projet Vercel existant : world-health-vision-v2, id prj_fHnsDAO3uqgmeGwezmbGah8CJZzF, équipe obiangabaghapresley-7609s-projects.
- Déploiement public vérifié : dpl_14j5vUmB1ZoDaMfBMxeFaEqZwEeS, READY mais ancien, source=redeploy, sans lien Git automatisé déclaré. Les PRs DRAFT ne mettent PAS à jour l'iPhone par magie.
- Tentative de créer une preview Vercel depuis le commit déjà compilé : échec HTTP 429 GitHub API rate limit exceeded. Aucune prod touchée. Suivi : https://github.com/OBIANG5/World-Health-Vision/issues/68.
- Le premier build UX-1A était déjà publié en **branche statique Git** : preview-worldvision-ux1-2026-11-19, commit bundle 1d4a6e392b6e102f3e6ea9a26b9c0cff4b4a311b, source commit UX-1A 677c8baa59d18c3ea2e8b31ee88b8c16582b023d.
- Lien du PREVIEW UX-1A réellement accessible sur Internet et testé par GitHub Actions depuis le réseau : https://raw.githack.com/OBIANG5/World-Health-Vision/1d4a6e392b6e102f3e6ea9a26b9c0cff4b4a311b/index.html
- Test de disponibilité HTML+JS+CSS et bootstrap de fixtures : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44619840614 (SUCCESS).
- Ce lien est une application React/Vite originale construite avec un catalogue en snapshot ; ce n'est PAS la production mondiale ni une API V2 connectée à Timeseries.

## 1. PRINCIPE FONDATEUR : PLUSIEURS SOURCES, CHOIX AU VISITEUR

World-Vision ne part jamais du principe qu'une unique source nationale, internationale, institutionnelle ou médiatique constitue automatiquement une vérité. L'application montre les sources et leur origine, respecte les différences locales/régionales et les divergences avec les agences et organismes internationaux, documente les méthodes, dates, langues, révisions, droits, définitions et niveaux de preuve. L'utilisateur choisit ce qu'il consulte et ce qu'il confronte.

Concrètement, séparer toujours :
- Organisation : institution publique nationale, régional, international, agence de presse, média local, plateforme, témoin/direct, document original, acteur commercial.
- Document : titre, URL d'origine, auteur/agence, langue, territoire, date de publication/vérification, état de licence, correction et version.
- Dépendances : ne jamais compter comme trois confirmations indépendantes trois titres recopiant la même dépêche sous licence de syndication.
- Assertion/fait : sujet, date/période, chiffre/unité, méthode/échantillon, citation et type d'énoncé (fait observé, estimation, déclaration, opinion, projection, rumeur).
- Comparaison : accords, contradictions, décalage d'année, divergence de définitions, statut de fraîcheur et données manquantes ; une majorité n'est pas la preuve de vérité.
- Choix utilisateur : plusieurs angles consultables, liens primaires visibles, pas de rang automatique fondé sur langue/pays/média ou pouvoir financier.
- Signal GDELT : mention/couverture à investiguer, PAS une statistique officielle, une dépêche authentifiée, une confirmation de fait ou une vérité éditoriale.
- Respect des droits : afficher une URL d'origine n'implique aucun droit de recopier le corps entier d'un article, de diffuser un flux commercial ou de revendre des données.
- Ne pas mélanger une fiche d'institution vérifiée avec un connecteur actif, ni une comparaison de MÉTADONNÉES d'organismes avec une vérification d'ARTICLE ou une comparaison statistique.

Les sources locales ont leur place et ne doivent pas être effacées par une source internationale. Les sources internationales non plus ne sont pas exclues ; l'objectif est la pluralité contrôlée, pas l'orientation de l'opinion.

## 2. CE LOT UTILISE LE CODE DÉJÀ EXISTANT : ZÉRO DEUXIÈME GLOBE, ZÉRO FAUX BACKEND

Avant UX-1B1, la V2 avait déjà les composants App, EyeMapFrame, CountryDrawer, CountryLocalEvidencePanel, SourceMethodologyModal, WorldDiscovery, VisionHub, sources de Catalog et contrats de comparaison nationaux. Ne pas les cloner. Les 217 pays du registre et 22 sources internationales référencées ne signifient jamais 217 observations nationales ingérées ou 22 fournisseurs pleinement connectés.

Modifications construites sur la BRANCHE UX, logiciel seulement :
- frontend/web-v2/src/App.tsx : un point d'entrée mobile visible « Ne vous arrêtez pas à une source » avec boutons réels « Sources du pays » (fiche du pays sélectionné) et « Sources mondiales » (répertoire et méthodologie existants). Desktop : équivalent compact. Navigation ?wv=sources utilise la route déjà codée, pas une fausse page.
- frontend/web-v2/src/components/country/CountryLocalEvidencePanel.tsx : cases à cocher pour choisir 0, 1 ou 2 SOURCES RÉELLEMENT CATALOGUÉES dans le pays. Rien n'est présélectionné. À deux, affichage côte à côte de type, état d'intégration, méthode, limites, droits et liens d'origine HTTPS. La troisième sélection est désactivée jusqu'à ce qu'une source soit décochée. Changement de pays indépendant.
- frontend/web-v2/src/styles/world-editorial.css et styles/country.css : styles ciblés, mobile 320px/390px et grille comparative une colonne au petit écran, écrans tablet/desktop, contrastes/focus et cible tactile; pas de refonte lourde du globe.
- L'intégralité du CountryDrawer, des neuf outils anciens et des onze Visions reste utilisable.

**IMPORTANT :** « comparer deux sources » dans ce lot = confronter les fiches de provenances/organismes; aucune IA n'analyse encore automatiquement deux articles, aucune comparaison de chiffres de recensement n'est présumée correcte. Le front le dit ouvertement.

## 3. GATES DE VALIDATION, CI, LIEN MOBILE

Le nouveau script frontend/web-v2/ux1b-sources-smoke.mjs exploite le vrai navigateur Chromium et les vrais composants V2 déjà construits, sur les résolutions 320x700, iPhone 390x844, tablette 820x1040, desktop 1440x900 :
- le globe reste interactif et unique;
- accès mobile source visible; source du pays et annuaire mondial ouvrent une page/action réellement existante;
- pays GAB déjà présent dans le catalogue archivistique avec trois sources de types variés, non live; cases à cocher 0/1/2, troisième désactivée, désélection réversible, limites visibles;
- liens originaux HTTPS, pas de faux consensus numérique, responsive sans dépassement horizontal, capture screenshot et absence d'erreurs JS.

Le workflow .github/workflows/whv-v2-ux1b-source-choices-publish-phone-preview.yml REUTILISE les tests Playwright existants :
- preview-smoke.mjs (globe, CountryDrawer, neuf outils, menus);
- vision-hub-smoke.mjs (11 Visions, outils, clavier);
- ux1-discovery-smoke.mjs (recherche, GAB, URL, historique, FR/EN);
- nouveau ux1b-sources-smoke.mjs.
Il contrôle TypeScript, lint des fichiers touchés et build Vite. Après toutes les validations, il crée une NOUVELLE branche statique isolée nommée preview-worldvision-ux1b-sources-2026-11-19, avec les 4 fichiers d'aperçu préexistants preview-countries.js, preview-sources.js, preview-local-catalog.js, preview-bootstrap.js, le globe et le CSS réellement compilés, et une mention noindex/offline. Il REFUSE d'écraser une preview existante et NE pousse rien sur Vercel/v2.

**Ne jamais déclarer le nouveau lien publié avant que le workflow soit vert et la branche contenant dist visible.** Après QA, récupérer son SHA exact et utiliser le lien GitHack correspondant. Toujours garder le premier preview UX-1A comme rollback.

## 4. SUITE INTERNATIONALE — LA VALEUR, PAS LES MAQUETTES

UX-1B2 : développer l'index de sources de contenu, et non seulement de métadonnées, en réutilisant CountryLocalContext, SourceMethodologyModal, les sources nationales de DATA, Global Radar et les références officielles. Contrat SourceInstitution, SourceDocument, ClaimEvidence, ContentDependency, ClaimComparison, RightsAssessment. Distinguer publications originales et reprises, citer dates, langues/traductions, limites et divergences. Comparer 2 à 4 points de vue POUR UN MÊME FAIT; si méthodologies incompatibles, l'indiquer au lieu de calculer une moyenne. Tout document sous URL d'origine, et pas de copie intégrale sans droit. La modération éditoriale du média reste sur ses branches propres; le logiciel expose le travail multi-sources.

UX-1B3 : accueil modulaire par tâches Atlas/Surveiller/Comparer/Marchés/Comprendre/Sources/Mon espace, avec états réellement utiles, FR/EN, recherche pays, sources par pays et institution, accessibilité, historique URL, vraie connexion à des données éprouvées. Issue #66 : https://github.com/OBIANG5/World-Health-Vision/issues/66.

DATA : suivre la chaîne de PRs #69 (source IBGE), #70 (octets et versions Bronze) et #73 (métadonnées et droits), toutes DRAFT, mais pas ouvrir automatiquement leurs données publiquement. Première licence/comparabilité réelle avant Atlas publié, puis pays tels que Gabon/INSTAT et sources régionales. Contrat GDELT distinct des statistiques. WATCH-1 persistant ensuite : WatchRule, Observation, Evaluation, Outbox, DeliveryReceipt, choix opt-in et antiflood. Puis Money (taux datés, frais nets), Transport, Prix/Panier, Trading/BRVM sous licences.

Backlog Core/performance international/SQL/Hikari/multi-réplicas et coût est conservé issue #63, design UX mobile issue #66, release Vercel issue #68. Aucune branche média, voix, production de vidéo ou style des carrousels TikTok n'a été modifiée ici.

## 5. RÈGLES DE REPRISE QUAND LE CHAT SE TERMINE

1. Lire cette note, PR UX-1B1, le SHA final, les logs de CI et les captures issues des artefacts Actions.
2. Vérifier nouveau preview UX-1B dans un navigateur public, distinct de l'alias Vercel et de la preview UX-1A. Ne pas prendre un statut d'un ancien SHA pour le nouveau.
3. Inspecter les quatre fichiers UI et la suite de tests et constater les vrais champs/source states. Ne pas inventer une licence ou un contenu sous prétexte que le catalogue sait les afficher.
4. Prioriser le vrai choix entre SOURCES pour des FAITS, la recherche institutionnelle et les parcours consultables; éviter de refaire un globe, un moteur de recherche ou une UI parallèle.
5. Documenter chaque paquet sur GitHub, garder PRs empilées DRAFT avant revue et respecter sécurité/licences/coûts, sans prod Vercel automatique.

**World-Vision : voir le monde, le comprendre — en donnant au public les différents angles et les preuves nécessaires pour former son propre jugement.**
