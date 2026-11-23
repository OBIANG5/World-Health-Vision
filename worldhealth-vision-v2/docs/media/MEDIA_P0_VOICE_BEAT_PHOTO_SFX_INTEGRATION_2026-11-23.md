# MÉDIA — P0 produit : une relance de sens synchronise la voix, la PHOTO×DATA et le SFX réellement rendu
**23 novembre 2026 · PR #147 (DRAFT), branche produit dérivée de #138, pas de COP31 #142**

## Décision de priorité
Le produit n'est pas le reportage-test COP31 ni un laboratoire PHOTO isolé. World-Vision doit recevoir script, images, chiffres, sources, prise de voix et sons licites, et permettre à un réalisateur humain de produire un **film 1080×1920 réellement dynamique et synchronisé** avec le moins de manipulations possible, tout en gardant un contrôle journalistique et artistique. Le conducteur `directorBeats`, les mots `wordCaptions`, les pistes PHOTO et les `soundCues` existaient : leur décalage mutuel coûtait du temps. Cet incrément raccorde des moteurs EXISTANTS sans deuxième projet, TTS, reconnaissance vocale, nouvelle stack, ni génération de chiffres. Canon : `docs/media/MEDIA_CREATIVE_PRIORITY_CANON_2026-11-21.md`, issue #116.

## Ce qui est réellement codé

**Module isomorphe** `services/media-renderer/creative/voice-beat-motion-sync.mjs` (et types `.d.mts`) :
1. `alignBeatToSpokenWords(project, beatId)` prend une citation `spokenExcerpt` effectivement présente dans le **script approuvé** et l'aligne sur une occurrence **unique et entière dans le plan choisi** parmi les `wordCaptions` issus de la prise vocale fournie. Une phrase répétée ou partielle, une voix non sélectionnée, des timecodes non valides et un conflit avec un autre beat sont refusés : aucune approximation silencieuse. La fonction renvoie le nouveau tableau de beats, sans modifier les autres séquences ni le script/audio.
2. `snapPhotoTrackToBeat(project,beatId,track,layer)` déplace le **moment de démarrage** d'une piste PHOTO existante vers le beat dans le temps **local** du plan. Support : `comparison` (2 valeurs/domaine/date/source), `metric` (valeur source) ou `focus` (pixels du vrai visuel). Les autres pistes, les chiffres, les sources, les labels et la **durée de révélation** restent inchangés. L'entrée sous une transition et toute sortie masquée ou au-delà de la scène sont rejetées. Ce sont les mêmes données que l'actuel `PhotoMultilayer` et `photoComparisonPose` utilisent en Remotion Player et H.264.
3. `snapSoundCueToBeat(project,beatId,index)` déplace l'instant d'un **son déjà importé** sur le même beat sans en changer le fichier, le volume, la durée ni la narration. Refus si le son ne tient plus dans le film.

**Interface Studio** `frontend/web-v2/src/media/CinematicProductionBoard.tsx/.css` : dans chaque beat, boutons de calage sur la voix et sur la comparaison/chiffre/focus PHOTO réellement activés; chaque SFX possède une sélection explicite du beat à rejoindre. Les retours d'erreur restent visibles. L'extrait de script, la prise et la provenance restent sous contrôle de l'éditeur. Ces boutons **modifient de vrais paramètres de rendu**, pas seulement des notes `visualDirection`.

**Tests** `creative/voice-beat-motion-sync.test.mjs` : vérifient l'identité voix/script, l'ambiguïté, les conflits de beats, les transitions, la préservation des chiffres/sources, la pose graphique `photoComparisonPose` avant/après le déclenchement, et l'immuabilité du SFX. Exécutés par les workflows Studio rapide et rendu complet.

**Parcours Chromium 390 px** enrichi dans `creative/test-studio-reimport-browser.mjs` : vraie ouverture d'un projet PHOTO fictif, alignement d'une phrase sur les mots approuvés, action sur **comparaison PHOTO×DATA**, action sur SFX, export JSON puis vérification numérique exacte des `startFrame/endFrame`, valeurs, date/source, voix et durée sonore. Ouverture du vrai Player Remotion. Le tout avec une image et un WAV générés pour CI et des valeurs explicitement inventées comme fixtures, **jamais** utilisés comme actualité ni comme preuve d'alignement acoustique. Rapport et capture à l'artefact `studio-fast-synthetic-regression`.

**Vitesse de QA** : le workflow rapide `.github/workflows/worldvision-media-studio-fast-regression.yml` ne lance plus `apt-get install ffmpeg` pour une simple photo factice : sa fixture 1280×720 est un PNG de dégradé généré avec `python3` standard (`struct`, `zlib`), vérifié visuellement et par décodage. **Les vrais rendus H264 et analyses FFprobe restent intacts dans le workflow complet.**

## Résultats prouvés et limites
- Avant cet incrément, le HEAD `3a1fa31a` avait **7 workflows SUCCESS** ; c'était la référence de départ.
- Sur le code HEAD `b7e6b5c0a0785976d81e1037674b27eccf5bdc8b`, le contrôle ciblé [run #45222937715](https://github.com/OBIANG5/World-Health-Vision/actions/runs/45222937715) est **SUCCESS** : 62 tests unitaires, build TS/Vite, puis vraie manipulation mobile et export des effets dans le Studio. Le rapport JSON indique `actualPhotoComparisonAndSfxReframedToApprovedSpokenWord: true`. Screenshot physique : **390 × 8 547 pixels** (page complète).
- Au dernier relevé avant cette documentation, les runs P0.7 voix, audio-context, P0.6 document et P0.8 PHOTO×DATA étaient aussi SUCCESS sur ce code ; les runs cinématique hooks/GEO et master H264 complet étaient encore **in progress**. **Relever leurs conclusions avant de certifier 7/7**.
- Le test synthétique confirme le **comportement logiciel**, pas l'exactitude acoustique d'une vraie voix, les droits du média, la factualité des chiffres ni la qualité émotionnelle d'un master. Aucune vidéo éditoriale grand public n'est validée ici.

## Un vrai problème UX mis à jour par la capture mobile
La capture de la session à **390px de large affiche 8 547px de défilement**, car texte source, alignement, conducteur et nombreux réglages détaillés PHOTO sont empilés dans un long formulaire. Le contrôle est techniquement juste, mais ce n'est PAS une UX mobile internationale suffisamment rapide/intuitive. **Prochaine amélioration dominante** : hiérarchiser « 1. matière et voix ; 2. récit et beats ; 3. revue du film ; 4. réglages de pistes à la demande », compacter les réglages caméra/données/son dans des sections progressives conservant TOUTES leurs fonctions, améliorer textes et tailles tactiles, et mesurer moins de scroll/clics pour caler une relance. Ne pas rajouter un second panneau de 20 champs. Évaluer photographiquement le nouveau 390px et desktop, pas seulement par tests de structure.

## Reprise stricte / ordre d'exécution
1. Ouvrir [PR #147](https://github.com/OBIANG5/World-Health-Vision/pull/147), vérifier HEAD exact et les **7 conclusions Actions**. Si rouge, lire log et réparer SUR LA MÊME PR, ne jamais désactiver des tests pour obtenir un feu vert.
2. Lire le début de `CONTINUITE_WORLD_VISION.md`, ce fichier, `MEDIA_PRODUCT_WORD_ALIGNMENT_STUDIO_2026-11-23.md`, `MEDIA_CREATIVE_PRIORITY_CANON_2026-11-21.md` et issue #116. Le test COP31 #142 est en pause ; pas de recherche HD sans choix éditorial explicite.
3. **Prochain petit pas UX** : réduire le parcours mobile actuel (8 547px / 390px) par organisation progressive et mise en avant du conducteur/preview; re-tester export, mots/PHOTO/SFX et visuels. Ne pas dégrader le desktop, les médias ou les paramètres de réglage.
4. Ensuite, évaluer une production complète sur un sujet choisi, avec script/voix Vivienne C5.2 réellement adaptés, rushes autorisés, données/date vérifiées, droits, montage/révisions 3–5s et **écoute humaine du MP4 final**. Une fixture CI n'est ni ce film ni une publication.
5. Internationalisation/scalabilité selon `docs/media/ADR_MEDIA_SCALE_READINESS_2026-11-21.md` : mêmes outils TS/Remotion/FFmpeg pour créer le master; versions immuables et audits sources/licences; stockage objet/CDN pour des millions de visionnages; jobs de rendu durables/idempotents/quotas/workers isolés pour de multiples créateurs **au moment opportun**, pas un rendu par spectateur, ni une refonte Rust/Go sans mesures.

**Aucune fusion, aucun déploiement, publication ou achat en conséquence de cette PR.**

## Mise à jour UX mesurée — 23 novembre 2026, PR #147

### Ce que les vrais pixels ont révélé
La capture Chromium 390px du monteur avec un projet PHOTO + voix + comparaison + WAV faisait **8 547px de hauteur** avant ce changement, malgré le bon fonctionnement des calages. La hiérarchie ancienne faisait défiler chaque champ de direction et toutes les pistes photo.

### Amélioration effectivement codée
- Même Studio, même React/Remotion, **aucun changement de JSON**, chiffres, sources, WAV, images, voix ou code de rendu.
- Les scènes **PHOTO, DATA, GEO et PAYS** ont maintenant des sections natives `details/summary` repliables (accès clavier et focus), regroupant leurs contrôles experts sans les détruire. Le conducteur montre l'idée principale et l'état de sa preuve ; ses champs avancés se déplient à la demande.
- Les commandes **Caler à la voix / Caler PHOTO×DATA / Écouter en contexte** restent visibles et actionnables sans ouvrir les champs avancés. Typographie de la zone Studio orientée `DM Sans` avec fallbacks système.
- La même CI rapide ajoute des assertions E2E : section PHOTO/beat fermée par défaut, ouverture avec les vrais inputs source/provenance, fermeture sans perte, export JSON toujours exact, report de hauteur inférieur à l'ancienne version.

### Résultat vérifié (HEAD code `a580e2c1195bba573048c06de2bfc2a6156ccc26`)
Vraie capture Chromium **390×6 297 px** après changement, réduction de **2 250px = 26,3 %** versus 8 547px (même scénario CI synthétique). [GitHub Actions rapide #45225583035](https://github.com/OBIANG5/World-Health-Vision/actions/runs/45225583035) **SUCCESS**, rapport dans l'artefact `studio-fast-synthetic-regression`: `progressiveMobileDisclosureVerified:true` et `mobilePageHeightPixels:6297`. Captures inspectées, boutons de calage et preuves visibles ; la page demeure longue (6 297px) et la largeur réelle iPhone peut varier : **pas de validation complète UX/artistique**.

**Autres contrôles :** au dernier relevé les workflows de P0.7 voix, photo×data, re-hook GEO et audio-context sont success sur le SHA de code. Le workflow documentaire P0.6 et le long render MP4/Player sont encore en cours ; en vérifier les conclusions et corriger sur #147 en cas d'échec.

### Suite à forte valeur
Le problème restant majeur est la navigation : le conducteur et le film sont loin de la préparation des matériaux sur petit écran. Le prochain incrément doit mesurer le nombre de gestes pour rejoindre une relance, le Player et les modifications 3–5s, puis proposer des accès immédiats (navigation par étapes/onglets/ancres utiles) sans masquer les erreurs de provenance ni supprimer les fonctions. Ensuite un **vrai film sourcé/licencié avec prise Vivienne approuvée**, qualité à l'écran + écoute humaine, coûts et révisions. Ne pas refaire indéfiniment des microtests COP31.
