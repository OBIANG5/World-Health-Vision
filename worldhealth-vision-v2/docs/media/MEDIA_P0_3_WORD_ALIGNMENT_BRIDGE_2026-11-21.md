# World-Vision MEDIA — P0.3 : importer un minutage de mots existant, sans inventer de voix

**21 novembre 2026 — branche** `feature/worldvision-media-voice-word-alignment-adapter-2026-11-21` **sur P0.2 PR #123, elle-même sur P0.1 PR #118**.

## Pourquoi ce sprint est réellement utile
L'objectif principal du propriétaire n'est **pas** la découverte d'idées d'actualité : il conserve les idées et fournit le script, les médias et la voix ou sa référence. World-Vision doit réaliser **rapidement le meilleur montage possible** : hooks, re-hooks sémantiques, typographie cinétique, photos et chiffres qui montrent exactement l'idée, SFX et musique bien synchronisés, correction non destructive. **GEO et les pays sont une petite priorité secondaire**, intégrée au montage seulement lorsque le sens le justifie ; ne pas refaire le globe déjà présent.

Le moteur P0.2 existant sait animer un mot fourni à un `startFrame/endFrame` exact, mais **l'écriture manuelle de tous les timecodes** est une perte de temps majeure. Plutôt que d'inventer un ASR/fine-tuning/TTS, utiliser le format **`Caption[]` officiel de Remotion**, que peuvent fournir Whisper.cpp, Whisper WebGPU ou un alignement externe corrigé. Référence : https://www.remotion.dev/docs/captions/transcribing et https://www.remotion.dev/docs/install-whisper-cpp/to-captions .

## Livré sur cette branche (non finalisé avant CI)
- `creative/word-alignment-import.mjs` : convertit un vrai tableau existant de tokens `Caption[]` (`text,startMs,endMs`) en `wordCaptions` du moteur World-Vision ; aucun audio synthétisé ni nouvelle reconnaissance vocale codée.
- **Sécurité script-lock** : le nombre de mots et leur ordre doivent correspondre au script approuvé (casse, accents/ponctuation mineure tolérés en comparaison uniquement). Le **texte affiché** est le mot du script original et non une réécriture automatique de l'ASR. Un mot manquant, inventé, interverti ou chronométré au mauvais endroit est rejeté. Les langues sans frontières d'espaces et les divergences orales doivent faire l'objet d'un alignement/contrôle spécifique : **pas de promesse de couverture universelle à ce stade**.
- Les mots importants `emphasis` sont choisis explicitement par l'éditeur, jamais générés aléatoirement. Un mot à souligner non présent est rejeté. Il n'y a **aucune coupe ni effet automatique toutes les 2 secondes**.
- `creative/import-word-cues.mjs` : CLI avec `--project`, `--assets`, `--captions`, `--output`, options `--emphasis-file` et `--voice-offset-frames`. Refuse d'écraser un projet existant, vérifie le vrai chemin et SHA256 de l'enregistrement original fourni, laisse le script/voix/plan/sources inchangés et produit un **nouveau projet JSON + `.alignment-review.json`**. Refuse les projets comportant déjà des sous-titres pour prévenir une substitution silencieuse.
- `creative/word-alignment-import.test.mjs` : 5 tests Node vérifient ponctuation/accents script, refus de mots inventés/supprimés, refus de dépassement/overlaps en 30 fps, offset explicitement renseigné, et emphase approuvée.
- CI `.github/workflows/worldvision-media-word-alignment.yml` : test unitaire + test CLI sur un projet et une voix WAV **techniques synthétiques**, provenance SHA, refus d'un mot ASR inventé, sans TTS/Whisper payé ni publication. **Le test de CI ne démontre PAS l'exactitude temporelle d'une vraie voix humaine.**

## Procédure d'utilisation lorsque le propriétaire fournira sa vraie narration

D'abord produire **séparément** un fichier de mots réellement horodatés depuis cette même voix : sortie `Caption[]` ou objet `{"captions":[...]}` d'un aligner officiel/local ; revérifier manuellement l'exactitude des paroles et des temps. Aucun nouveau fournisseur de voix n'est activé : référence historique Vivienne C5.2 — Impact média si prise approuvée/licenciée pour le texte exact.

```sh
node creative/import-word-cues.mjs \
  --project /work/storyboard-approved.json \
  --assets /work/assets \
  --captions /work/voice-captions-from-existing-aligner.json \
  --emphasis-file /work/hook-keywords-approved.json \
  --output /work/storyboard-with-word-times.json
```

Le fichier facultatif `hook-keywords-approved.json` est un tableau de mots exactement présents dans le script, par exemple `["MONDE","RÉVÉLATION"]`. Un alignement est **une hypothèse de minutage**, pas une preuve que la voix a prononcé exactement au bon centième : écouter et contrôler à la waveform et sur les vrais pixels de la vidéo. La validation finale doit passer les contrôles média/droits et l'approbation humaine.

## Statut et qualification honnêtes
- **5/5 tests purs en Node 22 réussis localement** dans la session de création ; l'intégration au vrai schéma de projet et le workflow GitHub doivent être vérifiés sur le SHA exact de la PR enfant.
- **P0.2 parent certifié techniquement** au SHA `b25c0a95d63d43cf763475ae153f1a78b27b116c` : [hooks/SFX/GEO](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44901041750), [audio-context](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44901041766), [renderer+Studio web](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44901041754) tous `success`. **Ne pas confondre avec la validation du présent P0.3.**
- Aucune narration approuvée disponible pour **ce** script de test, aucun nouveau film d'actualité réel, aucune évaluation de rétention, aucune publication, aucun compte connecté, aucun achat et aucun merge.

## Point de reprise obligatoire après une interruption

1. Ouvrir la PR enfant P0.3 et vérifier **les Actions sur son HEAD SHA exact**, corriger tout échec du test CLI et ajouter le rapport SHA/run dans un **commentaire de PR** (éviter d'ouvrir de nouvelles branches pour une erreur de test). Ne déclarer réussite que si la CI est verte.
2. Tester ce pont avec **une nouvelle prise vocale qui correspond exactement au sujet choisi par le propriétaire**, et un alignement réellement vérifié ; ne jamais réemployer un ancien MP3 d'une autre actu, ne jamais modifier la voix ou inventer les timecodes.
3. Puis livrer **une scène de 8–12 s à véritable hook + deux re-hooks sémantiques** avec son de qualité et médias authentiques, choisir les meilleurs FX existants (Remotion officiel/HyperFrames/claude-motion) au coût/temps/qualité mesurés. Le globe existe et ne doit intervenir que si le sens l'exige.
4. Réviser un passage court sans altérer le reste, évaluer à **390 px TikTok** ; mesurer temps script+assets approuvés → film approuvé, correction, coût et note humaine ; bâtir ensuite une petite bibliothèque de séquences réellement acceptées.
5. Se référer à [issue #116](https://github.com/OBIANG5/World-Health-Vision/issues/116), [PR #123](https://github.com/OBIANG5/World-Health-Vision/pull/123), [PR #118](https://github.com/OBIANG5/World-Health-Vision/pull/118) et `CONTINUITE_WORLD_VISION.md` sur la branche active. Ne pas toucher au logiciel Atlas de l'autre conversation.
