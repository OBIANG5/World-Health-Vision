# WORLD-VISION | FASTLANE — montage uniquement
14 novembre 2026. Nouvelle décision de production du propriétaire.

## La priorité confirmée : collaboration créative AVANT montage
Le sujet et l'angle, les faits, le script hook/re-hook, les vrais visuels,
les transitions, la voix et la direction émotionnelle se décident ensemble.
GitHub doit ensuite SEULEMENT assembler les clips approuvés, la voix approuvée,
le globe géographique et une véritable vidéo de signature World-Vision.
Ne plus improviser de nouveaux plans, raccourcir un texte, synthétiser
une autre voix ou choisir des images génériques pendant l'export.

Objectif : montage des médias DÉJÀ PRÉPARÉS en moins de 300 secondes.
Le temps de préparation, recherche, vérification des droits, téléchargement,
génération de la voix, préparation/normalisation des plans et démarrage GitHub
n'entre pas dans cette mesure. Le résultat artistique n'est pas garanti par la
rapidité et doit être accepté par le propriétaire sur téléphone.

## Retours des vidéos précédentes
- Soudan du Sud publié : note 4 à 5/10, voix et images trop faibles.
- Guinée Siguiri : note 6/10 malgré 13 nouveaux plans ; voix trop lente, images
  insuffisamment vivantes. La correction de volume a été nécessaire.
- La qualité cinématographique n'est pas une simple photo avec zoom. Exiger une
  vraie intention de mise en scène, actions réelles, plans humains et re-hooks.
- Le scénario et chaque image doivent avoir été validés avant l'assemblage.
  Ne pas utiliser de fausses images d'émeutes, de victimes ou d'autres événements.

## Résultat de l'audit de la dernière voix sur une autre branche
Nouvelle voix RETROUVÉE : Vivienne C5.2 « Impact média ».
- ID : fr-FR-VivienneMultilingualNeural.
- Enregistrement référence du 14/11/2026, 14,088s, débit +8%, pitch +0Hz.
- Branche canonique : production/worldvision-vivienne-c52-voice-lock-2026-11-14
- Fichier : worldhealth-vision-v2/services/media-renderer/public/voice/vivienne-c52-impact-media-reference.mp3
- Profil : worldhealth-vision-v2/services/media-renderer/nextgen/approved_voice_profile.json
- Passation : worldhealth-vision-v2/docs/media/WORLDVISION_C52_HANDOFF_2026-11-14.md
- URL d'écoute :
  https://raw.githack.com/OBIANG5/World-Health-Vision/production/worldvision-vivienne-c52-voice-lock-2026-11-14/worldhealth-vision-v2/services/media-renderer/public/voice/vivienne-c52-impact-media-reference.mp3
Cette voix était considérée comme légèrement trop rapide dans l'autre
production. Un essai à +6% a été PROPOSÉ, pas approuvé. Le timbre C5.2 constitue
notre nouvelle référence stylistique ; il ne faut jamais réutiliser son MP3
sur une autre actualité car il parle de La Nouvelle-Orléans. Toute nouvelle
actualité a sa propre prise Vivienne complète, approuvée après audition.
Edge TTS n'est pas par défaut une licence de publication commerciale.

## Phase 1 — Préproduction ensemble (hors chronomètre montage)
1. Choisir sujet et sources crédibles, puis angle/hook.
2. Valider le script mot pour mot et SHA256.
3. Choisir chaque vidéo/photo selon sa pertinence réelle et ses droits.
4. Préparer le globe réellement géographique et la version originale animée
   de la signature. La référence graphite G0 est ici :
   https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/nextgen/brand/worldvision-original-g0-graphite.mp4
   Si une autre signature a été expressément choisie pour un épisode, garder
   le vrai fichier vidéo, pas une capture figée ou un logo carré blanc.
5. Enregistrer une nouvelle prise complète Vivienne pour le NOUVEAU texte,
   inspirée du rythme C5.2 ; approuver naturel, débit et son sur iPhone.
6. Découper les plans à la voix. Préparer des segments sans piste son parasite
   en H.264, 1080x1920, 30fps, yuv420p, même profil et même timebase.
7. Verrouiller toutes les sources/empreintes SHA et le plan de montage.

## Phase 2 — Assemblage FASTLANE (<5min visés)
- Consommer le manifeste de l'épisode déjà LOCKED (modèle
  worldhealth-vision-v2/services/media-renderer/fastlane/episode.template.json).
- Refuser toute modification du script, de la voix, des fichiers, des timings
  ou des médias approuvés.
- Assembler les images sans réencodage vidéo ; voix continue et volume
  de diffusion contrôlé par le système, sans modifier débit ou intonation.
- Mesurer loudness voix pour mobile autour de -14 LUFS et vrai pic inférieur
  à -1 dBTP, sous réserve d'écoute humaine sur téléphone.
- Export MP4 vertical H.264/AAC et une planche issue des vraies images
  extraites du fichier final ; rapport des durées et du temps machine réel.
- Une CI verte ne vaut pas validation éditoriale ou droit de diffusion.

## Code
Branche : feature/worldvision-fastlane-assembly-only-2026-11-14
Moteur : worldhealth-vision-v2/services/media-renderer/fastlane/assemble.py
Tests : worldhealth-vision-v2/services/media-renderer/fastlane/test_assemble.py
GitHub Action : .github/workflows/worldvision-fastlane.yml
Exemple de manifeste : fastlane/episode.template.json

Après avoir préparé tous les fichiers, depuis services/media-renderer :

    python fastlane/assemble.py --manifest fastlane/episodes/WV003-news/episode.json --assets fastlane/episodes/WV003-news/assets --output output/fastlane/WV003-news

Les couleurs et tons du test automatique sont des fixtures TECHNIQUES,
jamais des images à proposer à un média d'actualité.

## Mesure honnête
L'assembleur consigne la durée mesurée du seul rendu. L'objectif sous
300 secondes n'est pas une garantie si les clips sont mal préparés, si le
runner GitHub démarre lentement ou si le téléchargement a lieu sur le moment.
Chaque échec devra être documenté et corrigé sans refaire les choix créatifs.
Pas de publication automatique sur TikTok.
