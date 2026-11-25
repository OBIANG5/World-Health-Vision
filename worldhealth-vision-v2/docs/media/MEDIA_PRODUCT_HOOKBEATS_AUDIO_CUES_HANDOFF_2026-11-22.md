# WORLD-VISION MÉDIA — P0 PRODUIT : direction sémantique, audition contextualisée et accents sonores réels
## Point de continuité du 22 novembre 2026 — PR #147

**Autorisée par la priorité canonique et [issue #116](https://github.com/OBIANG5/World-Health-Vision/issues/116). Ne pas reprendre le sourcing COP31 PR #142 comme activité par défaut.** La vidéo COP31 est un test en pause, les sources sont préservées. **Branch source : PR #147 sur #138**, indépendante de #142. Pas de fusion, de déploiement, de publication, de facturation ni de nouveau fournisseur IA.

## 1. Le problème réellement traité

Le Studio pouvait composer de vraies scènes Remotion (PHOTO/GEO/DATA/DOC), importer des médias, écouter une voix et prévisualiser le film. Le mode « Plan animé » perdait le contexte sonore; l'éditeur devait chercher lui-même dans la timeline le mot et le re-hook. Le moteur avait déjà `reviewFrameRange` et `soundCues` / `wordCaptions`, mais **le Studio ne proposait pas de direction sémantique sauvegardée ni d'édition de ponctuation sonore réutilisant le même projet**.

**But de cet incrément** : l'utilisateur choisit une scène, décrit ce que chaque nouveau tournant apporte au spectateur, peut écouter directement ce passage dans le film complet, et ponctuer avec de vrais fichiers audio importés, à des timecodes conservés en JSON/Remotion/MP4. Tout travail reste récupérable après la session via le JSON existant.

## 2. Contrat produit codé (attention aux distinctions)

### Commande « Revoir ce plan avec son contexte » (préalablement développée, déjà CI verte sur SHA 90f2025c)

- `frontend/web-v2/src/media/CinematicProductionBoard.tsx` : sélection de plan -> `reviewFrameRange`, cible originale quinze images avant l'entrée du plan; un clic revient au Player complet, un second écoute à nouveau.
- `CreativeCompositionPreview.tsx` : `PlayerRef.pause()`/`seekTo()` du composant Remotion existant, **pas** un deuxième éditeur ni un re-rendu H264. Les pistes importées restent dans le film complet, sans changement du script ni des actifs.
- Les 4 workflows sur l'ancien HEAD `90f2025c` ont été observés **success**; cela ne certifie pas le nouveau HEAD.

### Nouvel objet facultatif `directorBeats` dans `worldvision-creative-project-v1`

Chaque beat (maximum 120 par projet) : `id` stable, `shotId`, `startFrame/endFrame` **globaux** au film original, `intent` = `hook|explain|rehook|reveal|impact|payoff`, `idea` (fait/contraste appris), `spokenExcerpt` (sous-chaîne **exacte** du script approuvé, ou vide si silence), `proofNote` (note de provenance/source à contrôler), `visualDirection` (intention d'animation des pistes existantes), `audioDirection` (note de direction sonore).

**Source unique** : le projet JSON existant, **PAS un deuxième format de storyboard**. `director-beats.mjs` contrôle chronologie, chevauchements, limites, appartenance au bon shot sur la vraie timeline avec transitions, 6+ frames, rôle connu, phrase exacte, texte sûr, preuve non vide pour re-hook/révélation/conséquence, champs inconnus interdits. Il ne déclare **ni vérité de la source**, ni existence des effets, ni synchronisation acoustique validée.

La conduite est modifiable et visible **dans l'interface**, plusieurs beats dans un même plan si le récit l'exige; bouton « Écouter en contexte » pour chaque beat; les beats et les assets survivent à `parseStudioProject` / `studio-project-io.d.mts` / export JSON. Supprimer un plan avec beats attachés est refusé tant que les décisions ne sont pas retirées explicitement. Déplacer un plan ne change jamais silencieusement des timecodes approuvés : une incohérence doit être corrigée par l'éditeur.

**Important :** `visualDirection` est une directive éditoriale, **pas un effet joué par magie**. Les vrais mouvements sont les pistes existantes (caméra, PHOTO, comparaison DATA, GEO, focus document, texte) que le monteur doit encore régler. Ne pas vendre un champ de texte comme « agent réalisateur automatique ».

### Vrais `soundCues` audibles, déjà supportés par le renderer

- Le Studio accepte le choix **explicite** d'un fichier audio local importé, puis le début en frames sur la timeline, la durée (4–450 frames), le volume 0–0,8 et un libellé. La preuve de droits commerciaux n'est **pas automatisée**.
- Ce tableau `soundCues` est enregistré **dans le même JSON**; lecture sans altération par `studio-project-io.mjs`, `studioAssetNames` et le validateur `attentionCueIssues`. Fichiers manquants = export / aperçu film bloqués, jamais substitution audio.
- `CreativeEdit.tsx` a **déjà** un rendu audio via `<Sequence><Audio...>` et `creative/render-project.mjs` sait **déjà** stage/sha et mixer ces cues en H264/AAC. Les modifications de Studio alimentent ce moteur existant dans le Player, via URLs de fichiers locaux. Aucun nouveau TTS, codec ou librairie.
- La note `audioDirection` **ne joue pas de son**; seuls les `soundCues` explicitement liés à des fichiers jouent. Un son ambiant artificiel ne doit jamais être présenté comme capté lors d'un événement réel.

## 3. Tests déjà écrits — STATUT DES EXÉCUTIONS À VÉRIFIER AU HEAD

- `creative/director-beats.test.mjs` : source immutable, vrais temps de raccord, phrases absentes, géométrie de beats, hors-clips/roles interdits, sources requises et champs inconnus.
- `creative/validate-project.test.mjs` : intégration du contrat dans le validateur Remotion existant.
- `creative/studio-project-io.test.mjs` : relecture exacte d'un projet complet contenant plusieurs re-hooks; refus de perte silencieuse; relecture des vrais SFX et blocage de chemins extérieurs, gains >0,8, durées impossibles, champs étrangers.
- Workflow `.github/workflows/worldvision-cinematic-director-gates.yml` exécutera le nouveau test de beats aux côtés des tests de reimport existants.
- `creative/test-studio-reimport-browser.mjs` enrichi : sur **Chromium 390 px**, JSON avec 1 beat de démonstration, vraie image de fixture et **WAV PCM entièrement synthétique généré localement** (pas de copyright); vérifier fichiers manquants, reconnecter les deux, export JSON **identique** de `directorBeats` et `soundCues`, cliquer `Écouter en contexte` et vérifier l'ouverture du vrai Player Remotion, résister à l'import hostile. Ce test ne mesure **pas** une qualité artistique, des droits ou une voix choisie.
- **À réception** : vérifier les runs et logs du **dernier HEAD #147**, pas le succès historique `90f2025c`. En cas de test rouge, réparer dans la même PR et documenter l'erreur réelle.

## 4. Limites encore ouvertes, sans biais d'avancement

1. **Synchronisation mot-à-mot** : le moteur supporte `wordCaptions` sourcés et `@remotion/captions` mais **le Studio ne sait pas encore les éditer/réimporter**; la saisie manuelle de `spokenExcerpt` n'est PAS un alignement d'horodatage de vrais mots. Ne jamais inventer un ASR.
2. **Interaction son** : les accents sonores sont ajoutés aux frames globaux et exportés; leur audition qualitative et le mix/ducking mobile avec **véritable narration** nécessitent un test acoustique humain et la voix approuvée.
3. **Direction auto** : pas de modèle décisionnel pour déduire les hooks/motions d'un script. Un programme de beat éditorial est une *structure d'entrée/supervision*, pas une preuve que le monteur déduit déjà tout automatiquement.
4. **Plan/beat et UX** : un long texte de direction pourrait devenir trop manuel. **Mesurer** le nombre de manipulations et la rapidité de correction sur un vrai film, réduire les champs/automatiser l'inférence **fiable** à partir de contenus approuvés, ne jamais ajouter des formulaires pour le plaisir.
5. **Echelle** : architecture millions présente dans `docs/media/ADR_MEDIA_SCALE_READINESS_2026-11-21.md` : masters immuables, objets/CDN pour millions de LECTURES, files durables/isolations/quotas pour beaucoup de RENDUS simultanés. **Cette PR n'est pas la plateforme multi-tenant**.

## 5. Suite à valeur dominante — une chose à la fois

**Immédiat :** lire HEAD #147 et exécutions Actions. Corriger jusqu'aux tests Node/TS + 390 px réels sans tricher en désactivant des tests. **Ne pas ajouter un autre film d'exemple pour les faire passer.**

**Ensuite :** rendre `wordCaptions` **éditables/importables par fichier d'alignement approuvé** (du texte exact, de la voix sélectionnée, jamais le SRT inventé); vrai mot pivot synchronisé aux hooks, relié à `directorBeats` et aux `soundCues` de la même horloge. Privilégier une interface de contrôle efficace plutôt que 80 champs manuels. Puis mesurer sur un film réel le temps du script et assets APPROUVÉS jusqu'à master ACCEPTÉ et la durée d'une retouche 3–5 s.

**Pas de nouveau sourcing COP31**, pas de nouvelle voix par défaut, pas de changement de langage pour la mode, pas de PR/branche éphémère si #147 couvre la fonctionnalité.

## 6. Reprise exacte après interruption

1. [PR #147](https://github.com/OBIANG5/World-Health-Vision/pull/147) — `feature/worldvision-media-product-contextual-beat-review-2026-11-21`, base #138. Lire sa HEAD et Actions.
2. **Première section de `CONTINUITE_WORLD_VISION.md` sur cette branche**, présent fichier, `MEDIA_PRODUCT_CONTEXTUAL_BEAT_REVIEW_2026-11-21.md`, `MEDIA_CREATIVE_PRIORITY_CANON_2026-11-21.md`, [issue #116](https://github.com/OBIANG5/World-Health-Vision/issues/116).
3. Code réellement changé : `creative/director-beats.mjs/.d.mts/.test.mjs`, `validate-project.mjs`, `studio-project-io.mjs/.d.mts/.test.mjs`, `CinematicProductionBoard.tsx/.css`, `CreativeCompositionPreview.tsx`, `creative/render-project.mjs`, `creative/test-studio-reimport-browser.mjs`, CI workflow; revoir les diffs avant modification.
4. **Si CI casse : corriger avant toute autre nouvelle fonctionnalité.** Si CI verte : faire un test UI réel/audit artistique, puis incrément mot-à-mot. Ne jamais revendiquer une vidéo grand public complète ou des droits prouvés.
