# World-Vision MÉDIA — le TEST reste un test, retour au produit : audition contextualisée P0 (21 novembre 2026)

> **Point de décision du propriétaire** : le sujet COP31 est devenu un goulet d'étranglement. Un épisode-test sert à valider les capacités déjà construites, PAS à immobiliser des heures de développement sur l'approvisionnement de rushes d'une actualité évolutive. Le travail principal doit construire un **réalisateur/monteur réutilisable**, rapide, sophistiqué et humainement contrôlable.
>
> **Ce document est un journal de PRODUIT**. Il ne prétend ni livrer une vidéo journalistique ni redéfinir la rédaction de la COP31.

## 1. Autorité et non-objectifs

- **Référence canonique** : `docs/media/MEDIA_CREATIVE_PRIORITY_CANON_2026-11-21.md`, [issue #116](https://github.com/OBIANG5/World-Health-Vision/issues/116), `WORLDVISION_CREATIVE_EDIT_HANDOFF_2026-11-19.md`.
- **PR produit** : [#147](https://github.com/OBIANG5/World-Health-Vision/pull/147), branche `feature/worldvision-media-product-contextual-beat-review-2026-11-21` **DIRECTEMENT à partir de #138** (PHOTO×DATA); cette branche NE DÉPEND PAS de #142. Ainsi une décision ou un fichier COP31 ne bloque pas le produit.
- **PR #142** est un **test documentaire en PAUSE** (sources 16/19/21, aperçu statique, pas de voix C5.2, pas de master). Reprendre ses droits/HD uniquement quand un vrai épisode choisi en a besoin, pas pour « finir le test » artificiellement. La branche documentaire demeure intègre et consultable, pas à fusionner automatiquement dans la branche produit.
- **Hors scope** : nouveau langage ou moteur, infra millions, Atlas, découverte GDELT, photothèque globale, Netflix/After Effects maison, nouvelles voix, création d'épisodes NASA, génération d'une autre démo autonome, publication/deploy/merge.

## 2. Pourquoi ce petit changement produit vaut la peine

**Déficit préexistant** : `CinematicProductionBoard` propose « Plan animé » (une scène isolée) et « Film entier » (à chercher manuellement). Le mode plan isolé supprimait la narration et les raccords des autres plans; l'éditeur ne pouvait donc pas ressentir immédiatement un re-hook comme le spectateur, au bon moment, avec musique, voix, sous-titres et transition. **Le moteur sait déjà** calculer un segment original via `creative/review-range.mjs` (PR #118) mais le Studio n'en avait pas une commande directe.

**Changement réellement codé** :
1. `CinematicProductionBoard.tsx` : depuis chaque plan, bouton **« ▶ Revoir ce plan avec son contexte »**. Si le film est valide, obtenir `reviewFrameRange({shots}, selectedId)`, afficher le **film complet** et seek au premier frame du contexte (par défaut 15 images / 0,5 seconde avant le début du plan), avec transitions et sous-titres conservés. Recliquer le même plan réinitialise l'audition; le bouton « Film entier » retourne à la frame 0. Le repère a une ID et un compteur de requête en mémoire seulement; aucun changement de JSON ou de médias.
2. `CreativeCompositionPreview.tsx` : utiliser les interfaces **officielles** `PlayerRef.pause()` / `PlayerRef.seekTo(frame)` et `initialFrame` pour se déplacer sur la timeline *originale*, sans recomposer un clip local et sans régénérer la voix.
3. `creative/review-range.d.mts` : déclaration TS minimale du moteur mjs **déjà existant et testé**, évitant les clocks divergentes.
4. `CinematicProductionBoard.css` : contrôle discret, accessible au clavier et adaptable téléphone. Même Remotion Player/MP4, pas de faux preview CSS.
5. Le bouton est désactivé si `fullFilmCanRender` est faux. Une piste vocale absente **reste absente**, jamais remplacée par Kokoro ou par un ancien MP3 sans rapport avec le texte.

**Vérification de la surface** : seules deux petites commandes et des types front ont changé. `worldvision-creative-project-v1`, import/export JSON, validateur média, composants de rendu, pipeline FFmpeg, voix et morceaux source restent inchangés. La fonction pure `reviewFrameRange` était déjà couverte par 5 tests Node : horloge origine, overlaps, première/dernière scène, non-destruction et invalides. Ne pas présenter ces tests historiques comme une validation du nouveau bouton UI.

## 3. Critères de réception, sans faux certificat

- TypeScript + build Vite de `frontend/web-v2` sur **le HEAD de #147**, pas le HEAD de #138.
- Tests existants de `creative/review-range.test.mjs` sur le même HEAD ; workflow PR si présent.
- **Encore non vérifié humainement** : clic sur plan 2 (transition overlap), réécoute à même frame, retour « Film entier » à zéro, écoute de l'audio effectivement importé et présence des captions à ce moment, iPhone. Sans cela **aucune approbation UX/son**.
- Le Player reste entier : il n'effectue pas un export « 3–5 s » ni un cache/partial render. C'est **une navigation d'édition**, pas un algorithme d'animation ou de planification du rythme. Ne pas vendre cela comme un réalisateur automatique.
- Seuls le texte et les fichiers réellement fournis par l'utilisateur sont affichés. Pas de certification des droits ou de la voix par simples étiquettes.

## 4. Suite intelligente du PRODUIT : petit pas qui change la valeur

**Le prochain goulet n'est PAS COP31 ni un nouveau modèle.** C'est le **brief de réalisation beat-par-beat** :

1. **HookBeatSheet éditable dans le Studio actuel, par intervalle sur la timeline originale.** Par beat : `idea` (ce qui est appris), `attention_intent` (hook/re-hook/révélation/explication/conséquence), `proof_ref` (vrai média/source), `hero_word` lié à `wordCaptions` existants, `motion` (une ou plusieurs pistes utiles), `sound_cue` lié à `soundCues` existants, `shotId`. Aucun re-hook artificiel généré par cadence.
2. **Compatibilité avant code** : inspecter les schémas actuels `worldvision-creative-project-v1` et `parseStudioProject` pour ne PAS ajouter un deuxième format. Faire évoluer le contrat avec versionnement et aller-retour exact, dégradations interdites. Préserver mot-à-mot le script et le WAV approuvés.
3. **Représentation claire dans l'interface** : conducteur compact, vrai timecode, seul point focal par plan, rappels des preuves manquantes, un clic de lecture contextuelle par beat. Le producteur peut modifier seulement un instant sans défaire tout le montage.
4. **Vérifier la finalité** sur un même matériel source : comparer nombre de clics, temps pour corriger un re-hook et défauts constatés; ensuite vrai film sous licence/voix choisie quand les fichiers existent. Ne pas repartir dans 4 micro-laboratoires.

**Ordre permanent** : 1) hooks/re-hooks de sens avec mouvements simultanés, 2) voix/son/caption exacts, 3) correction/revue ciblées et production rapide, 4) finalisation et revue d'un vrai master ; GEO au service du récit; infra de distribution et internationalisation selon ADR, à activer au moment utile.

## 5. Millions d'utilisateurs : décision technique stable

`ADR_MEDIA_SCALE_READINESS_2026-11-21.md` est la référence : Remotion/TypeScript/React+FFmpeg sont une base pertinente de calcul de master; **ne jamais rendre une vidéo pour chaque spectateur**. Stockage objet, CDN, manifests de version et droits, contrôle de coûts/quotas, jobs idempotents + claim/ACK, backpressure et isolation des workers quand la création multi-tenant sera ouverte. Pas de réécriture Rust/Go/propriétaire sans mesure; le défi de CE sprint est un outil qui réalise mieux/faster, pas un cluster.

## 6. Reprise exacte si chat interrompu

- **Ouvrir #147**, base #138, lire la première section `CONTINUITE_WORLD_VISION.md` sur cette branche et ce document.
- Lire la vision canonique, issue #116, `creative/review-range.mjs`, `CinematicProductionBoard.tsx`, `CreativeCompositionPreview.tsx` et tests.
- Relever HEAD exact et statut des Actions ; **ne pas confondre CI en cours et CI verte** ; si fail, corriger sur **même branche #147** avant d'élargir le périmètre.
- Si CI OK, constater que cela valide seulement la navigation/timecode, pas l'art ni les vrais sons. Ensuite poursuivre **HookBeatSheet intégré au Studio**, non le sourcing COP31.
- Ne jamais confondre #142 (test COP31) et #147 (produit). Pas de merge/deploy/publication automatiques.
