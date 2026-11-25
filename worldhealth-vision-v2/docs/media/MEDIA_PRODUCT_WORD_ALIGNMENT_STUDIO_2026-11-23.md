# World-Vision média — P0 Studio : de la vraie voix aux mots synchronisés
**Date de décision : 23 novembre 2026 — PR produit #147 — aucun nouveau reportage de test**

## Pourquoi cette étape, à l'échelle du produit
La vision canonique reste `docs/media/MEDIA_CREATIVE_PRIORITY_CANON_2026-11-21.md` et issue #116. L'essai COP31 #142 est en pause. Le montage professionnel a besoin de répéter rapidement le cycle **script et médias approuvés → vraie voix → mots exactement minutés → re-hooks sémantiques → animation/son synchronisés → correction locale → master vérifié**. On ne remplace pas Remotion/TypeScript/FFmpeg ni n'ajoute une infrastructure millions inutile à ce stade.

## État de la branche et correctif confirmé
PR [#147](https://github.com/OBIANG5/World-Health-Vision/pull/147), base #138. L'ancien SHA `02b9c085` avait 5 workflows verts mais l'import JSON en navigateur échouait, car `creative/attention-cues.mjs` utilisait **`node:path.extname` dans Vite/Chromium**. Le correctif `613971982380f4f90af25539af764a8bc30d59fc` remplace seulement cette extraction d'extension par une vérification portable avec les mêmes règles de chemins sécurisés. Le **nouveau workflow ciblé** `.github/workflows/worldvision-media-studio-fast-regression.yml` a été validé **SUCCESS, run #45206146640**, avec la réouverture réelle d'un projet sur Chromium 390px, le conducteur, les SFX locaux, leur export exact, et tests Node/TS. Ce résultat ne dit rien sur l'écoute artistique d'une voix humaine. Ancien échec explicité dans PR #147 (commentaire de suivi).

## Intégration de la vraie transcription mot-à-mot dans le Studio
**Source de vérité :** projet `worldvision-creative-project-v1`, pas un second schéma. Le module existant `creative/import-word-cues.mjs` prend des `Caption[]` d'un aligneur extérieur (ex. Whisper.cpp), vérifie l'identité textuelle avec le script, le temps 30 ips, la voix fichier source et calcule ses SHA-256 en créant un **nouveau** projet et un rapport d'alignement. Il ne synthétise/transcrit aucun audio lui-même et exige une validation humaine.

**Nouvel incrément Studio :**
- `creative/word-caption-contract.mjs` : module isomorphe (sans `node:path`/`node:crypto`) qui impose **la même suite exacte de mots que le script approuvé** — casse, accent, apostrophes et ponctuation compris — et valide le calage originel, le non-chevauchement, l'absence de SRT concurrent, la voix importée et tous les champs. Aucune estimation temporelle.
- `studio-project-io.mjs/.d.mts` : `wordCaptions` facultatif, réouverture et export sans perte, refus des champs étrangers et des erreurs; le pipeline SRT précédent continue pour les projets sans alignement externe.
- `CinematicProductionBoard.tsx` : lecture du projet aligné, verrouillage du choix de prise audio et de la piste SRT pendant l'alignement (changer la voix invaliderait tous les temps), affichage **des mots du plan actuellement choisi uniquement**, mise en relief via bouton accessible `aria-pressed`. Éditer ce bouton ne modifie **jamais** le contenu ou le minutage d'un mot. Le même `CreativeEdit.wordCaptions` remplace visuellement les captions SRT dans `@remotion/player`, et le JSON exporté est destiné au rendu H264 existant. La voix, les sous-titres, les SFX et la synchronisation restent sur l'horloge originale.
- `CinematicProductionBoard.css` : navigation et lisibilité mobiles; le nombre de boutons dépend du plan actif, pas de la totalité des mots du film.
- Le mot mis en relief est une **vraie piste de rendu**. Une note `directorBeats.visualDirection` reste en revanche une **intention**, pas un effet exécuté automatiquement.

## Tests et réception
- `word-caption-contract.test.mjs` : identité texte, casse, ponctuation, mots perdus, timecodes décalés, SRT simultané et voix manquante.
- `studio-project-io.test.mjs` : véritable aller-retour des mots issus du script et de la voix de fichier, refus des champs et des recouvrements.
- `test-studio-reimport-browser.mjs` : second scénario strictement **SIMULATION CI** (oscillateur de test, aucune parole réelle) pour constater que le navigateur rouvre les mots, verrouille la voix, actionne un accent typographique, sauvegarde exactement les frames et charge le vrai Player; rejette une fausse version du script. **Ce test ne valide PAS la précision acoustique.**
- Le workflow rapide `worldvision-media-studio-fast-regression.yml` et l'ancien `worldvision-cinematic-director-gates.yml` exécutent ces tests. **Ne déclarer vert que le dernier HEAD et les runs réellement terminés**.
- Les chemins JS doivent demeurer **isomorphes** dans tout code partagé avec le navigateur, après l'incident `node:path`.

## Limites importantes / prochain petit pas
1. Ce Studio ne lit **pas directement des WAV pour transcrire**; importer d'abord un vrai alignement par la CLI existante, avec **la même prise** réellement sélectionnée. Sans WAV/script réels, pas de prétention à un reportage.
2. L'identité des mots en Studio ne certifie **ni l'exactitude acoustique du fichier**, ni la provenance réelle de `Caption[]`. Le rapport externe contient les SHA256 voix/script et l'avis `human_audio_visual_review=required_before_publication`; sa vérification humaine reste indispensable. Le simple nom de fichier voix n'est pas une preuve cryptographique de correspondance.
3. Le validateur générique côté serveur autorise encore certains `wordCaptions` techniques indépendamment de cette reprise stricte du Studio : **ne pas confondre contrôle d'édition avec approval de publication**, ni casser aveuglément les fixtures d'intégration historiques sans migration.
4. Le contrôle de synchronisation des mots, le Ducking voix/musique, la lisibilité 390px en vraie situation et la retouche de 3–5 secondes devront ensuite être évalués avec un **vrai film approuvé**; pas de nouveau marathon de sourcing COP31.
5. Prochaine étape utile si CI verte : **afficher explicitement la relation entre un mot aligné et le re-hook visuel qu'il déclenche** dans le Studio, mesurer la correction éditoriale en actions/temps, puis tester sur un vrai sujet sous droits avec nouvelle prise Vivienne C5.2 (+8%) si choisie. Adapter la durée des scènes à la voix, jamais raccourcir silencieusement le script.

## Stratégie millions (sans surarchitecture)
Se conformer à `docs/media/ADR_MEDIA_SCALE_READINESS_2026-11-21.md`: rendu ponctuel d'un master par version, diffusion de copies CDN/stockage objet à des millions de spectateurs; plus tard queues durables, leases/ACK, quotas, coûts et séparation multi-tenant pour plusieurs créateurs, **pas un rendu par spectateur**. Conserver projet et provenance versionnés. Aucune bascule de langage ni déploiement dans cette PR.

## Reprise sans perte
Ouvrir [#147](https://github.com/OBIANG5/World-Health-Vision/pull/147), le début de `CONTINUITE_WORLD_VISION.md` sur sa branche, le présent fichier, `MEDIA_PRODUCT_HOOKBEATS_AUDIO_CUES_HANDOFF_2026-11-22.md` et issue #116. Vérifier HEAD, exécutions du workflow rapide + principal; si échec, inspecter logs exacts et corriger sur cette branche. Seulement ensuite poursuivre l'automatisation guidée par des médias approuvés. #142 COP31 reste un test en pause; ne pas replanifier son sourcing.
