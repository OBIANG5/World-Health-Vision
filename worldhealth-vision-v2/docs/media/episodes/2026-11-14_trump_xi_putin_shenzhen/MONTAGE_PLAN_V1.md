# WORLD-VISION — SOMMET ANNONCÉ TRUMP, POUTINE, XI · MONTAGE V1

**Date : 14 novembre 2026.**  
**Statut : nouvelle composition Remotion codée, script utilisateur accepté, hook 4,5 s en rendu de contrôle, MASTER 43 s NON encore livré.**

## 1. Finalité

Créer le montage vertical professionnel du **script aimé par l'utilisateur**, sans refaire un éditeur. Le media-renderer Remotion existant du dépôt est réutilisé. **Le sommet est annoncé pour le 19 novembre, pas encore tenu**. Pas de fausse vidéo de trois dirigeants réunis, images d'archives explicitement signalées.

## 2. Où est le code exactement ?

- `services/media-renderer/src/WorldVisionSummit2026.tsx` : **nouvelle composition d'épisode** (8 scènes ; cadrages, colorimétrie bleu nuit/cyan, compositions visuelles, transitions, sous-titres *pré-synchronisés* couvrant le script, logo officiel G0 par `staticFile`).
- `services/media-renderer/src/Root.tsx` : composition `WorldVisionSummit2026`, **en plus** des compositions existantes, sans supprimer le travail historique.
- `services/media-renderer/render-summit-preview.mjs` : rendu MP4 9:16, mode `hook` 4,5 s / `full` 43 s, garde-fous d'actifs et SHA, rapport FFprobe.
- `.github/workflows/whv-summit-hook-preview.yml` : installation des dépendances du renderer existant, acquisition de **vrais portraits d'archives**, rendu du hook, capture de trois images, vérification de l'animation et publication **sur la même branche permanente** `whv-media-studio-browser-preview`. Ne présumer la réussite que si le run est **completed/success**, la vidéo existe et le manifeste correspond.

**État pour la voix :** pas de voiceover `WAV` approuvé en repo. Le mode `full` refuse de rendre comme publication avant réception de `voice-fr-approved.wav`.

## 3. Identité — ne pas modifier ces références

- **Logo G0 officiel** : `services/media-renderer/public/brand/world-vision-official.png` (Git blob `bc80fa70cebd566768bfb1703a0f1f636a78c196`). Affiché comme **fichier image original** dans les 8 plans, et non dessiné/recréé. Garde-fou Git hash dans le render script.
- **Image D00-v6 originale** : image `a_crisp_ultra_detailed_high_contrast_digital_ill.png`, SHA-256 **`8d9a9d20f20fbf7757713b6f5eab06590f191166eb779865747f0f59683cfca2`**, 1086×1448. Elle est disponible dans le chat **et a été importée dans le Canva connecté** sous le nom `World-Vision D00-v6 — reference artistique originale` (Canva media ID `MAHa4F1Owfk`) sans être redessinée. **Ne pas confondre cet import avec un commit du PNG original sur GitHub.**
- **Logo officiel copié aussi vers Canva** directement depuis le PNG GitHub, media ID `MAHa4H6Rel4`. Utilisable dans les montages manuels Google/Canva si besoin.
- **Position du logo** : coin haut gauche, dans zone de sécurité, petite plaque claire neutre pour éviter les pertes de contraste. Pas de faux logo/emoji.
- **Globe D00** : 3 secondes (4,5 à 7,6) et outro (40–43) **utilisant les mêmes octets d'image originale**, simplement des mouvements de caméra/éclairage non destructifs. **Ne pas remplacer par l'ancien CGI ou la carte plate.**
- **Pour le master Remotion** le PNG exact sera nécessaire en `services/media-renderer/public/episodes/summit-2026/eye-earth-d00-v6.png` et son SHA-256 sera comparé avant tout rendu. Ce fichier **n'est pas encore committé en tant que binaire dans le dépôt**, donc rendu complet **bloqué, honnêtement**, tant qu'il manque.

## 4. Séquences

| Temps de vidéo (indicatif tant que voix non alignée) | Voix/script | Direction visuelle/motion |
|---|---|---|
| 00:00–00:04.5 | « Trois puissances nucléaires... rencontre inédite. » | Trois **vrais** portraits d'archives (Trump / Poutine / Xi) surgissent, grand hook typographique, cyan, montage rythmique |
| 00:04.5–00:07.6 | « Jeudi 19 novembre ... » | **D00-v6 original** en mouvement caméra discret, aucun redessin |
| 00:07.6–00:12.5 | « ... doivent se réunir à Shenzhen, en Chine. » | Photo authentique de Shenzhen, 19 novembre, titre géographique clair |
| 00:12.5–00:20.4 | « ... réduire les arsenaux ... expiré en février. » | Motion design typographique nucléaire, traité New START, agenda officiel, **aucune simulation d'explosion** |
| 00:20.4–00:26.6 | « Trump veut ... Pékin, qui reste réticent. » | Portrait Xi, zoom lent, texte de contexte et label d'archive |
| 00:26.6–00:33.8 | « La guerre en Iran ... pas celle en Ukraine. » | Deux cartes textuelles sobres IRAN / UKRAINE, distinction « selon Washington » |
| 00:33.8–00:40 | « Aucun accord... démonstration de puissance ? » | Portrait Trump + contraste accent « AUCUN ACCORD ATTENDU », question |
| 00:40–00:43 | « World-Vision. Voir le monde, le comprendre. » | Image D00-v6 originale, signature et logo officiel |

**Les sous-titres actuels sont des blocs temporisés éditorialement**, basés sur le script, mais **ne sont PAS alignés à une voix réellement enregistrée** : recaler les timecodes avec une voix audio finale et vérifier chaque mot.

## 5. Sources des médias/autorisation

Aucun montage ne doit prétendre montrer les trois dirigeants ensemble dans cette réunion qui n'a pas encore eu lieu.

- **Portrait Trump (2025)** : `Official Presidential Portrait of President Donald J. Trump (2025).jpg`, domaine public gouvernement des États-Unis / Daniel Torok. https://commons.wikimedia.org/wiki/File:Official_Presidential_Portrait_of_President_Donald_J._Trump_(2025).jpg
- **Portrait Poutine (source Kremlin)** : `Vladimir Putin official portrait.jpg`, Kremlin.ru, **CC BY 4.0** et/ou 3.0, crédit obligatoire. https://commons.wikimedia.org/wiki/File:Vladimir_Putin_official_portrait.jpg
- **Portrait Xi (2024)** : `Xi Jinping (November 2024) 01.jpg`, photo Maison-Blanche/POTUS pendant APEC 2024, **domaine public américain**. https://commons.wikimedia.org/wiki/File:Xi_Jinping_(November_2024)_01.jpg
- **Shenzhen, Chine (vue d'archives)** : `Shenzhen Skyline At Night (214551663).jpeg`, Andreas Bunen, **CC BY 3.0**, crédit. https://commons.wikimedia.org/wiki/File:Shenzhen_Skyline_At_Night_(214551663).jpeg
- **Faits** : Maison-Blanche relayée par Reuters, AP, AFP 13–14 novembre 2026 ; Xi/présence APEC annoncée par ministère des Affaires étrangères chinois 13 novembre. Sources dans `SCRIPT_V1.md`. Pas de scènes Reuters/AP redistribuées sans droits.

**À vérifier avant diffusion commerciale :** licences et métadonnées exactes des fichiers effectivement téléchargés (hashs dans le rendu). Les images d'archives doivent porter une attribution lisible.

## 6. Qualité et portes de validation

1. **Hook réel** : rendu MP4 vérifié sur Github (non déclaré livré tant que l'action est en cours ou en échec). Ce premier test juge uniquement l'animation, la typographie et le logo.
2. **Photogrammes** : extraire image début/milieu/fin, vérifier image non vide, contraste, portraits, pas de visages coupés.
3. **Voix française** : audition 2–3 timbres chez Google Vids/Gemini, puis récupérer un **WAV autorisé** ; éviter le monologue robotique. Le forfait Google Pro dans l'app ne signifie pas accès à un endpoint TTS gratuit.
4. **D00-v6** : convertir l'asset Canva original en fichier exact du rendu, **sans le reconstruire**, et vérifier SHA-256. Une copie JPEG compressée ou une simulation SVG n'est pas acceptable.
5. **Exporter master** : FFprobe 1080×1920 30fps, vidéo H.264/AAC, audio présent, pic/volume, sous-titres correctement alignés, logo fidèle, zones UI TikTok libres.
6. **Pas de publication sans relecture et accord explicite** du propriétaire, même si les tests réussissent.

## 7. Statut actuel à inscrire dans chaque reprise

**Faits vérifiés, script V1 apprécié, design Remotion implémenté et compilé, logo original & D00 original conservés dans Canva.** Reste : premier vrai rendu hook, revue visuelle, voix, transfert binaire D00 en pipeline GitHub, rendu des 43 secondes, QA audio-visuelle, approbation.

*NE PAS DIRE* « vidéo finie », « voix approuvée », « portrait téléchargé » tant que les preuves techniques manquent.
