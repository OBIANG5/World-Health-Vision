# World-Vision — historique chronologique du projet (reconstitution vérifiable)

**Dernière reconstruction : 13 novembre 2026.** Périmètre : **World Health Vision (plateforme mondiale)** et **World-Vision (média d'actualité / Media Studio)**, distincts mais hébergés dans le même dépôt.

> Règle de vérité : cette chronologie croise les commits présents dans GitHub, les documents du dépôt et les éléments connus des précédents échanges ChatGPT. **Elle ne prétend pas reproduire mot pour mot les anciens chats bloqués.** Une intention utilisateur n'est pas un module implémenté ; un commit n'est pas une réussite artistique ; un test CI n'est pas un déploiement permanent.

## 1. Vision initiale et objectifs

- **Vision produit** : éclairer le monde grâce à la comparaison de données publiques, cartes, fiches pays, sources fiables, évolutions chronologiques et analyses intelligibles. Éviter un tableau de bord générique qui ne présente que de jolies cartes sans utilité.
- **Vision média** : « World-Vision », marque œil + Terre, slogan de référence **« Voir le monde, le comprendre. »** Le média produit des informations courtes, sourcées et visuellement accrocheuses pour WhatsApp puis TikTok/vidéos verticales.
- **Pédagogie** : expliquer les mécanismes au public, contextualiser les chiffres, signaler l'incertitude et éviter l'automatisation de fausses nouvelles.
- **Cadence ambitionnelle** : d'abord plusieurs visuels par jour (ex. 6 h, 12 h, 18 h et 21 h), puis veille horaire et idéal d'une vidéo de qualité par heure. **Cible, non preuve de fonctionnement 24/7.**
- **Formats** : 9:16 téléphone, histoire courte par vidéo, hook immédiat, 10–30 secondes typiques selon le sujet, possibilité de vraies vidéos témoins *avec droits vérifiés*.
- **Interdits visuels répétitifs** : trop sombre, rendu IA caricatural, peinture/éclats dorés superflus, trop de texte, faux habillage professionnel, barres de scène, logos de réseaux non utilisés et voix trop robotique.
- **Exigence du propriétaire** : développer étape par étape au niveau professionnel le plus élevé raisonnablement possible ; chaque brique peut prendre du temps mais doit être démontrée, testée et **notée/validée par l'humain avant la suivante** ; fournir un lien consultable sur téléphone après les incréments visuels ; documenter toutes les décisions.

## 2. Janvier–avril 2026 : la plateforme mondiale V0/V1/V2

### 2 janvier 2026 — structure V0
Commit [`b36b3570f`](https://github.com/OBIANG5/World-Health-Vision/commit/b36b3570f85e7c01865dcfb2aa17cb5df5d92c54) : services, data layers Bronze/Silver/Gold, frontend et infrastructure. Développement local Windows/PowerShell. Source : historique Git.

### 5–13 janvier 2026 — premières ingestions et design cible (échanges historiques)
La V0 exploite des indicateurs World Bank WDI (pays, séries temporelles, FastAPI, frontend React/Vite, carte et graphiques). Le parcours souhaité : carte mondiale lisible en premier, courbes et drawer pays, grands arcs ouverts inspirés de la forme œil, catégories bien rangées. Les volumes d'ingestion cités dans d'anciens échanges ne sont **pas une mesure actualisée**.

### 21 février–3 mars 2026 — consolidation V0
Commits [`5f94b45c`](https://github.com/OBIANG5/World-Health-Vision/commit/5f94b45cd), [`237c9949`](https://github.com/OBIANG5/World-Health-Vision/commit/237c9949d) et [`f3e2089f`](https://github.com/OBIANG5/World-Health-Vision/commit/f3e2089f7) : frontend V0, API, scripts ingestion, Docker, données Bronze/Silver, mise en forme initiale.

### 14 avril 2026 — première V2 dans GitHub
Commit [`ad0d0f262`](https://github.com/OBIANG5/World-Health-Vision/commit/ad0d0f262) « Add worldhealth-vision-v2 platform », puis nettoyage caches/build. La V2 contient frontend `frontend/web-v2`, plusieurs services, documentation et infrastructure. La V1 a également des branches historiques `v1` et `release/V1` ; ne pas lui attribuer des fonctions sans examiner ces sources.

## 3. Août–octobre 2026 : naissance de la ligne média

### 26–27 août 2026 — « grosse actu mondiale » / World-Vision
Dans les échanges consacrés aux actualités, distinction progressive entre **média World-Vision** (actualité très visuelle et rapide) et outil d'intelligence mondiale de données. Logo œil + Terre, slogan, choix de sujets surprenants et à fort impact. Importance des agences Reuters, AP/AFP/BBC, sources primaires et journalistes locaux. Une information = un angle clair = un visuel ou une courte vidéo. Ne pas déduire de cette intention qu'un moteur automatique existait déjà.

### Septembre–octobre 2026 — habitudes éditoriales
Exemples de sujets explorés dans les conversations : catastrophes en Asie, Ukraine, Haïti, technologies IA, pays en développement, santé mondiale et sécurité informatique. Ces exemples sont des pistes historiques, **pas des dépêches actuelles**. Les discussions ont porté sur la différence entre contenu « viral » et contenu vraiment pertinent, sur les sources, la lisibilité mobile, les logos, les cadences (4 créneaux puis horaire), les WhatsApp posts et les TikTok reels.

### 25 octobre 2026 — référence OneDrive
Dossier projet signalé dans OneDrive/Bureau : `World-Health-Vision`, avec V0 et V2, code, données et documentation. OneDrive peut contenir de grandes données, assets et archives **absents de GitHub**. Ne pas déclarer une synchronisation exhaustive sans audit des deux côtés.

## 4. Novembre 2026 : restauration du vrai projet et Media Studio

### 5 novembre — reprise GitHub V2
Série de commits `sync(v2)` et commit [`293a441`](https://github.com/OBIANG5/World-Health-Vision/commit/293a44106) : transfert/actualisation de services, frontend, sources d'ingestion, architecture, Compose, tests. Les données volumineuses, caches et environnements ne sont pas entièrement dans GitHub. `main` reste principalement l'ancienne V0 ; la branche active V2 est `v2`.

### 10–12 novembre — qualité plateforme V2
Travaux supplémentaires sur l'intégrité des sources, les chiffres d'inflation, comparaisons nationales/internationales, alignement temporel, données locales et optimisation du chargement. Plusieurs branches de travail `improve/v2-*` et aperçu `whv-v2-browser-preview`. Elles ne sont pas automatiquement fusionnées dans `feature/world-vision-media-studio`.

### 12 novembre — Media Studio autonome
Création/extension de `feature/world-vision-media-studio`, PR [#5](https://github.com/OBIANG5/World-Health-Vision/pull/5) (**draft**, base `v2`, non fusionnée). Un premier parcours vertical a été codé et progressivement enrichi :

```text
RADAR → VERIFY → SCORE → APPROVAL → CREATIVE → ASSETS
→ STORYBOARD / VideoDraft → AUDIO → Remotion / FFmpeg
→ PREVIEW → QA → Publication Package
→ exports TikTok/WhatsApp → reçus → published
```

Implémentations de code : FastAPI media-service, stockage PostgreSQL, scheduler Redis conditionnel, recherche web et catalogues de sources, vérification factuelle, scoring, sélection de médias Wikimedia/licences, script et scènes, audio synthétique et contrôles, Remotion, QA, pack de publication, SHA-256, modèle de reçus. **La présence du code ne démontre pas que tous ces modules sont actuellement exécutés sur un serveur public.**

L'aperçu du vrai frontend compilé a été isolé via PR [#6](https://github.com/OBIANG5/World-Health-Vision/pull/6), fusionnée seulement dans la branche média, puis publié sous `whv-media-studio-browser-preview`. C'est un **site statique en lecture seule**, pas la rédaction live complète.

### 13 novembre, matin — première vidéo réelle COP31
Première chaîne de rendu pour un sujet officiel ONU/UNICEF/FAO sur une plateforme de financement de risque en amont des crises. MP4 H.264/AAC réel généré, de l'ordre de 36 secondes, conservé dans l'aperçu avec manifestes et SHA-256 :
`5e62e2f0f65e1335c67a3ac3cac70b827b2d676111309f3b151528bdc8440cfd`.

L'utilisateur a **refusé le résultat artistiquement (1/10 sur 15 critères ; tous bloquants)**. Problèmes confirmés : mauvais logo SVG, trop de bleu-noir/vide, textes type `HOOK`, `01/07`, bandeau et progression, montage répétitif, voix Piper robotique, manque de plans pertinents. Cette vidéo n'est **ni validée ni publiée**. Avis durable : [GitHub Issue #9](https://github.com/OBIANG5/World-Health-Vision/issues/9) + fichier `docs/media/reviews/2026-11-13-cop31-video-5e62e2f0.json`.

### 13 novembre — protocole de validation 1 à 10
Création de l'onglet « Noter & valider » : notes globales et par critère, bloqueurs, commentaires, décision « À corriger / Refusé / Je valide ». Brouillon stocké côté navigateur (local/sessionStorage) ; l'enregistrement **sur GitHub exige la confirmation de l'Issue dans GitHub**. Bugs mobile corrigés : refus sans commentaire autorisé, lien direct GitHub plus robuste, récupération du refus 1/10 depuis archive GitHub. L'intégration directe backend authentifié des notes n'est **pas faite**.

### 13 novembre — logo actuel officiellement confirmé
Après hésitations historiques sur une version multicolore, l'utilisateur a confirmé **l'œil-globe bleu original comme logo OFFICIEL ACTUEL**, sans attribuer de note numérique. Fichier binaire source : `frontend/web/src/assets/logo.png`, Git blob `bc80fa70cebd566768bfb1703a0f1f636a78c196`, recopié à l'identique sous `frontend/web-v2/public/brand/world-vision-official.png` et `services/media-renderer/public/brand/world-vision-official.png`. Les continents verts et couleurs du monde sont reportés, pas bloquants. Validation : `docs/media/approvals/2026-11-13-current-official-logo.json`.

### 13 novembre — trois directions visuelles A/B/C (aucune validée)
Trois **frames fixes verticales 9:16** codées pour l'ouverture de ce sujet :
- **A « Le terrain d'abord »** : photographie d'archives U.S. Army / Houston 2017, explicitement datée et non assimilée à la COP31 ;
- **B « L'information par les chiffres »** : présentation très claire de l'objectif de 3 milliards $ et 75 millions de personnes d'ici 2030 ; objectifs, **pas sommes déjà versées** ;
- **C « Comprendre le mécanisme »** : trois étapes d'anticipation, alerte → financement préparé → intervention précoce.

Une image documentaire distante n'avait d'abord pas chargé ; corrigé par un JPEG bundlé, contrôlé via SHA-256 `58bc6d400c6d264465d2f0a1962b07e298371c01fe0527f743fd0b7d2068c8ec`, crédit et manifeste `editorial/harvey-rescue-2017.provenance.json`. Captures : `style-frame-terrain.png`, `style-frame-chiffres.png`, `style-frame-pedagogie.png` sur la branche de preview.

**État final :** choix de direction **toujours en attente** ; pas de nouvelle voix, pas de nouvelle animation, pas de nouvel assemblage complet ni diffusion.

### 13 novembre — défaut de visibilité du « lien permanent »
Le lien avec `?view=media` arrive par défaut sur « Parcours vidéo » alors que A/B/C sont sous « Noter & valider » → « Direction artistique ». RawGitHack met aussi temporairement en cache les fichiers de branche. Correction demandée : nouvel accès A/B/C visible sur l'accueil et affichage du SHA de version de la preview, sans changer le lien permanent.

### 13 novembre — récupération effective d'une référence vidéo géographique

Le propriétaire a réexpédié **un vrai MP4 de 64,921667 s** (SHA-256 `4e4e979144b59ee9359287c75773cfbbb5cefbd12d05f71ec9ba3bd66f3328bb`). Le contenu visible est une vidéo TikTok géopolitique qui montre la Terre, des zooms géographiques, des contours nationaux, des drapeaux et des connexions spatiales pour cinq nouvelles. L'analyse chronométrée par captures, les droits non établis et une proposition **D « Le globe raconte l'actualité »** ont été enregistrés dans `docs/media/references/`.

**La vidéo a été analysée, mais le MP4 tiers n'a PAS été ajouté au dépôt**, et cette étude n'autorise pas à copier le travail du créateur ou à sauter les validations. A/B/C sont toujours non approuvées, D est une piste à maquetter, pas un rendu validé. Le texte exact du prompt historique disparu demeure inconnu.

## 5. État de code versus état de production

**Produit V2** : du code applicatif de fond et des branches de preview existent ; il faut vérifier séparément les déploiements backend et la fraîcheur des données avant d'affirmer qu'il fonctionne 24/7.

**Media Studio** : processus, code et véritables prototypes existent ; l'aperçu permanent est une archive statique en lecture seule. RADAR toutes les cinq minutes est un paramétrage de logiciel lorsque l'infra tourne, **pas une preuve de surveillance en continu**. Le premier MP4 existe mais a été rejeté ; aucune publication externe n'a été faite.

**Google/Gemini/Flow, n8n/Make** : pistes d'intégration envisagées, sans compte Google AI personnel relié directement au backend ni clé API Gemini configurée dans cette branche selon les éléments vérifiés. Ne jamais exposer de secret dans le frontend. Les abonnements aux applications Google ne sont pas les mêmes autorisations que les APIs.

## 6. Preuves supplémentaires et complétude

- **586 commits d'ancêtres** (au moment de l'indexation) documentés individuellement dans [COMMIT_HISTORY_INDEX.md](COMMIT_HISTORY_INDEX.md), datés de janvier à novembre 2026. GitHub reste l'historique précis de *ce qui a été commité*.
- Tous les chemins, différences et travaux de **branches parallèles** ne sont pas inclus automatiquement : examiner la liste des branches GitHub, en particulier `v2`, `preview/*`, `improve/v2-*`, `feature/v2-interactive-globe-2026-11-12`.
- Les discussions ChatGPT passées constituent de l'intention et du retour utilisateur, mais certaines ne sont plus intégralement accessibles. Cette synthèse n'est **pas** une transcription exhaustive.
- Source complémentaire à conserver : `docs/media/REPRISE_PROJET_WORLD_VISION_2026-11-12.md` (snapshot historique daté, inclut des statuts dépassés par les travaux du 13 novembre).
