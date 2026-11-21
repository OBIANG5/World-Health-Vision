# WORLD-VISION MEDIA — P0.4 / correction locale d'un re-hook
Date : 21 novembre 2026. Exclusivement la réalisation audiovisuelle, pas le logiciel Atlas.

## Objectif et valeur
La priorité est un film vraiment captivant avec hook, deux re-hooks sémantiques, montage d'images vraies, typographie synchronisée à une voix choisie, son professionnel et corrections rapides. Les cartes/pays existent déjà : les utiliser seulement si le récit le justifie. Ne pas reconstruire un moteur vidéo, connecter des comptes ou acheter des outils sans bénéfice prouvé.

Parent certifié : PR #126, média P0.3, commit 2b44a3e2a22e63c0ceccc678945a0da53dae4da2. Nouvelle branche P0.4 : feature/worldvision-media-surgical-beat-revision-2026-11-21. Ne pas fusionner ni publier sans décision.

## Implémentation, spécification du patch
- creative/surgical-revision.mjs : une modification explicite sur un seul shot, associée au SHA256 EXACT du fichier de projet source. Champs autorisés : title, subtitle, eyebrow, footnote, motion, accent, titleTreatment, titleFrameZero, focus, media et foreground. Les autres sont rejetés, particulièrement script, voice, music, durée, ordre et transitions.
- word_emphasis : changement d'accent de mots déjà minutés, par indice existant, sans modification des mots ou de leurs horaires.
- sound_volume : réglage du volume d'un SFX existant sans changer sa source ni son temps.
- sound_add : insertion contrôlée d'un SFX local explicitement fourni, avec heure, longueur, volume et label. L'existence du fichier ne prouve pas sa licence.
- Pour les mots/SFX, seul l'intervalle strictement non chevauché par une transition est éligible ; les fondus partagés doivent être revus comme un montage à deux plans.
- creative/revise-shot.mjs : entrée --project SOURCE.json --patch EDIT.json --assets ASSETS_DIR --output NEW.json. Le JSON source et l'ensemble des fichiers source restent inchangés, et aucun résultat existant n'est écrasé. Le programme valide le projet avant/après, refuse un SHA obsolète, vérifie les fichiers du projet et produit NEW.json.revision-review.json avec empreintes SHA des éléments et autorisation humaine encore requise.
- Aperçu réel : node creative/render-project.mjs --project NEW.json --assets ASSETS_DIR --review-shot SHOT_ID --output NEW.mp4. Même piste voix, ambiance et captions sur les vrais timecodes source, 15 frames de contexte quand disponibles.

Format exact du patch :
schema_version = worldvision-shot-revision-v1
source_project_sha256 = sha256 du fichier source original (octets, pas JSON normalisé)
shot_id = identifiant de plan existant
reason = justification éditoriale de 8 à 500 caractères
set = objet de changements d'habillage du plan (optionnel)
word_emphasis = tableau d'objets {index, emphasis} (optionnel)
sound_volume = tableau d'objets {index, volume} (optionnel)
sound_add = tableau de cues {file,startFrame,durationFrames,volume,label} (optionnel)

**Ne jamais inventer une citation, une donnée, un moment de parole ou une licence**. La validation JSON est purement technique ; l'éditeur doit valider l'idée, les images, le sound design, les droits et le rendu mobile avant publication.

## Vérification CI
Workflow dédié : .github/workflows/worldvision-media-surgical-revision.yml. Contrat prévu :
1. Tests Node : autre plan intact, script/audio intacts, SHA source obligatoire, refus d'injection de champs, de mots/SFX hors plan, de doublons et d'assets absents.
2. Quatre WAV oscillateurs de test ; ils ne simulent AUCUN reportage ni une voix humaine.
3. Générer un projet retouché sans réécrire le fichier original ; rapport SHA des assets et corrections.
4. Deux vrais MP4 Remotion H264/AAC 1080x1920/30fps, même timeline source 52–150 (99 frames) ; frame 52 (plan précédent) identique, frame 101 (plan retouché) différente, piste voix et durée source identiques.
5. Artefact de QA interne conservé sept jours. **N'annoncer SUCCESS qu'après vérification du HEAD exact.** Un test vert ne démontre ni excellence artistique ni gain de temps sur un vrai reportage.

## Travail restant et ordre intelligent
1. Regarder résultat Actions sur HEAD, corriger UNIQUEMENT les défauts vérifiés. Examiner les pixels et écouter les MP4, faire un vrai contrôle à taille 390px.
2. Dès qu'un script exact choisi par le propriétaire, sa voix nouvellement enregistrée et des images/vidéos sous droits existent : importer l'alignement des mots via P0.3 sans réinventer l'ASR, monter 8–12 s avec hook + deux re-hooks qui représentent véritablement les idées, SFX audibles et bien intégrés. Le globe n'est pas obligatoire.
3. Tester une modification ciblée de 3–5 s sans dégrader les raccords ni remplacer la voix. Mesurer temps complet jusqu'au master artistiquement accepté, coûts et modifications utiles (pas seulement rapidité de CI).
4. Comparer les composants Remotion Word Highlight/Popping avec HyperFrames/claude-motion seulement si le temps, la qualité, les licences et le rendu sont réellement meilleurs ; ajouter les composants gagnants au moteur unique.
5. Décliner après approbation sur humains, géopolitique et finance. L'ancien logo G0 à fond blanc ne doit être remplacé que par le vrai logo transparent validé.
6. Conserver la continuité en tête de CONTINUITE_WORLD_VISION.md, le rapport de PR et issue #116 : HEAD SHA, CI, artefact réel, lacunes et prochaine action. Aucun merge, diffusion ou achat automatique.

**Important :** cette tranche est une capacité de correction non destructive, PAS la preuve d'un film journalistique premium. Les médias et voix réels approuvés manquent encore pour certifier le niveau artistique international.
