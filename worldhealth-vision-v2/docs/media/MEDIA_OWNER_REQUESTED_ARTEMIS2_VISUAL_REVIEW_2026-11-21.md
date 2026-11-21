# Ajout vérifié — film de revue interne ARTEMIS II finalement livré depuis GitHub Actions (21/11/2026)

**PR effective : #141 DRAFT** https://github.com/OBIANG5/World-Health-Vision/pull/141 (ne pas se tromper avec #139). **Le film a bien été reconstitué et inspecté, pas seulement promis.**

- CI originale #44950437870 **FAIL** à l'étape outils système (un runner n'avait pas ffmpeg/ffprobe en PATH), cause analysée puis installation explicite.
- CI corrigée #44950644176 **SUCCESS** ; vrai MP4, 247 frames, H264/AAC, zéro ancienne voix audio, six images 390px.
- **CI finale**, meilleure courbe sonore : [#44950928858](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44950928858) **SUCCESS** sur commit de CODE `0abb1729782ef2f5e18caa6390ebe0637a34f38c`. Fichier de vidéo livré dans le chat : `/mnt/data/WorldVision-ArtemisII-revue-visuelle-finale.mp4`, SHA256 **dbb3cdd2e01cec74afc8827900b0e7e515ebe9a96a548638cf2eb600086595f4** ; fichier GH artifact `artemis2-no-narrator-visual.mp4`, EXACTEMENT même SHA. Artifact **14725466993**, nom `worldvision-artemis2-owner-visual-only-NO-VOICE`, expiration **28/11/2026 21:19:56 UTC**. Rapport dans l'artifact valide `original_audio_explicitly_discarded=true`, `contains_previous_kokoro_narration=false`, `contains_new_vivienne_c52_narration=false`, `publication_authorized=false`. Entrée NASA P0.6 SHA256 **dec6af52661fdd45c879406c11d0a438455ffa884658dd0cb739dc134572880c**.
- Qualité audio interne : la première bande mathématique faisait environ **−31 LUFS** et était presque inaudible sur téléphone; le script applique maintenant `loudnorm=I=-20:TP=-2:LRA=11` UNIQUEMENT sur l'audio nouvellement généré. **Loudness mesurée sur la vraie sortie AAC finale : −21,0 LUFS**. Ne pas décrire ces synthèses non diégétiques comme des sons enregistrés de la Lune.
- Audits visuels : six images du VRAI fichier de l'artifact observées à **390×693 px**, frames **0,42,87,138,191,246**. Hook initial et deux re-hooks visibles; labels/source de l'annotation lunaire restent petits et pas assez lisibles pour une vidéo finie. C'est un **contrôle visuel, pas un audit de rétention ni une validation artistique internationale**.
- Compétence reconstruite : pipeline Python/FFmpeg avec entrée vidéo H264 source sans recompression, nouvelle piste sonore AAC originale, manifeste SHA et 6 PNG. Pas de TTS exécuté dans ce workflow. Aucun octet de source contenant Kokoro n'est contenu dans l'artifact de sortie.
- Enregistrement de voix choisi **Vivienne C5.2 — Impact média +8% pour ce même script** manque toujours. Compte/licence Azure non disponible, ne pas contourner un service Edge non contractuel ni recycler le vieil MP3 Mississippi ; tout rendu avec C5.2 sera une nouvelle prise, retiming et approbation.
- **Statut produit** : utilisateur autorisé à regarder, pas autorisé à publier. Prochaine étape à forte valeur : obtenir son retour sur le clip, puis à partir du script réellement retenu créer la version C5.2 réellement narrée. Retour à la priorité long terme : hooks/re-hooks narratifs, multicouches, montage international plutôt que laboratoires NASA. Aucun merge/deploy/achat/publication.

---

# World-Vision MEDIA — DÉMONSTRATION ARTEMIS II EXPLICITEMENT AUTORISÉE (21 novembre 2026)

**État : FICHIER MP4 DE REVUE VISUELLE EFFECTIVEMENT PRODUIT. Pas de vraie narration C5.2, pas de master publiable, pas de décision de publication.** Cette page prime sur tous les anciens résumés laissant croire que l'utilisateur demandait d'ABANDONNER la vidéo test NASA. À l'inverse, elle ne transforme pas NASA en priorité produit dominante.

## 1. CLARIFICATION UTILISATEUR — ne pas perdre le fil

Le 21 novembre, le propriétaire a explicitement précisé, en substance : « Quand je t'avais dit que j'ai l'impression que tu ne fais pas la bonne priorité, je t'avais néanmoins dit que tu pouvais **faire la vidéo que tu voulais faire là pour que je voie**. Ne l'oublie pas. » Le bon sens à retenir :

- **Oui :** achever la vidéo prévue pour que le propriétaire puisse apprécier la réalisation.
- **Non :** confondre cette permission de revue avec une approbation du thème NASA comme stratégie permanente, ou avec une licence et publication.
- **Non :** remplacer automatiquement ce film prévu par un nouveau sujet financier/COP31/armes autonomes. Ces pistes restent uniquement des propositions pour d'autres reportages.
- **Non :** enchaîner dix micro-chantiers NASA alors que la vraie priorité est **hook/re-hook porteur de sens, motion design multicouche simultané, voix et son, montage complet, vitesse de production et corrections**, comme établi dans `MEDIA_CREATIVE_PRIORITY_CANON_2026-11-21.md`.

La recherche de contexte personnel et les preuves des anciens commits retrouvent **sans ambiguïté le film annoncé** : microfilm interne **Artemis II / 5 éclairs lunaires**, court format 8–12 s, trois temps visuels. Cette référence n'est pas un sujet nouveau choisi par ChatGPT au hasard.

## 2. DÉMONSTRATION EXISTANTE — RÉELLE, PAS THÉORIQUE

**Film exact :** trois temps 9:16 à 30fps, **247 images et 8,235 s**.

1. **HOOK** : « 5 ÉCLAIRS SIGNALÉS » ; photo réelle de la Lune, identifiant NASA `art002e009627`.
2. **RE-HOOK 1** : « DERRIÈRE LA LUNE » ; vraie photo Earthset NASA/Artemis II `art002e009288`.
3. **RE-HOOK 2** : « LE RAPPORT DE LA NASA » ; vrai visuel `art002e016252`, **annotations d'astronautes SUR UNE SIMULATION**, PAS photographie de cinq impacts.

Les deux premières phrases historiques strictement réutilisées dans les captions du montage préparatoire sont :
> « Cinq éclairs sur la face cachée de la Lune. Dans son rapport du dix-sept novembre, la NASA revient sur la mission Artémis deux. »

**Chronologie vérifiée :** observation du 6 avril 2026 ; rapport préliminaire NASA Science publié le **17 novembre 2026**. Ne pas décrire les impacts comme photographiés, ni parler de cinq météorites directement vérifiées.

Références : https://science.nasa.gov/feature/artemis-ii-preliminary-lunar-science-report/ ;
https://www.nasa.gov/image-article/artemis-ii-crew-moon-photo-annotations/ ;
https://www.nasa.gov/nasa-brand-center/images-and-media/ ;
`worldhealth-vision-v2/media-pilots/artemis2/sources.json` contient les vrais SHA256 originaux et les droits à examiner.

## 3. Ce qui a été livré dans CE CHAT, et ce qu'il reste à faire

**Fichier réel généré localement :**
- `/mnt/data/WorldVision-ArtemisII-demonstration-visuelle.mp4`, vidéo H264 1080×1920 247 frames, AAC 48kHz, 8,235 s, SHA256 **78ab47faaf8757f74df09c59420047452f43d85e8c5b6cf66db0f8565516c617** ; source d'une archive P0.6 antérieure, voix Kokoro **entièrement retirée**. Le lien `sandbox:/mnt/data/...` est UNIQUEMENT accessible dans ce chat, pas une URL stable utilisable dans d'autres chats.
- **Version révisée avec la dernière fixture P0.6 de GitHub :** `/mnt/data/WorldVision-ArtemisII-demonstration-visuelle-v2.mp4`, SHA256 **8656b8987cc17e3b4c85c3ee513cb9b63128eb31ed9b114bc35fc980882f4f46**, H264 1080×1920, **247 images**, 30fps, AAC 48kHz, 8,235 s. Source P0.6 #44948838931, artifact #14724572702, film SHA256 **dec6af52661fdd45c879406c11d0a438455ffa884658dd0cb739dc134572880c**. La version locale fut créée avec un script Python numpy/soundfile, des sons originaux calculés, et un **mapping explicite 0:v:0 + 1:a:0**, donc **AUCUN son Kokoro conservé**. Les images et les sous-titres proviennent du vrai master NASA antérieur ; les timings des captions ne sont PAS certifiés pour une future prise C5.2.
- Le script durable `media-voice-pilots/artemis2/export-visual-only.py` réimplémente le procédé avec entrée/sortie, SHA d'entrée obligatoire, contrôles FFprobe/247 frames/30fps et rapport JSON. Il ne dépend pas d'un service TTS ni d'une voix d'emprunt. Les octets audio générés et le SHA final peuvent différer des deux exports du chat, selon version et chemin d'exécution : ne jamais afficher leur SHA comme preuve de la sortie CI sans les avoir comparés.
- Le workflow `.github/workflows/worldvision-media-artemis2-owner-visual-only.yml` télécharge l'artefact source P0.6 **sur SHA connu**, supprime l'ancienne voix et archive uniquement le **nouveau film de revue VISUELLE** + vrai rapport et six petites images 390px. GITHUB ACTIONS peut expirer après 7 jours : pour refaire ensuite, réexécuter la recette P0.6 source épinglée plutôt que prétendre que l'artefact existe.

**Limite majeure : l'utilisateur attend sa voix choisie sur la PROCHAINE vraie vidéo à juger.** Celle-ci est uniquement un **aperçu de montage visuel avec ambiance/SFX originaux sans parole**. Ne pas prétendre que cette contrainte est satisfaite. Le choix réel de voix est **Vivienne C5.2 — Impact média**, ID Microsoft `fr-FR-VivienneMultilingualNeural`, **+8%**. Le MP3 historique de l'accident sur le Mississippi n'a PAS été réutilisé. Il manque une **NOUVELLE** synthèse ou prise C5.2 prononçant EXACTEMENT les deux phrases NASA, sous droits vérifiés. Pour diffusion commerciale, vérifier **un abonnement / compte Azure AI Speech autorisé**, ses conditions et la licence des audios. Aucun compte, clé, accès payant ni fournisseur tiers n'a été connecté ici. Ne PAS utiliser un service Microsoft Edge non contractuel en le faisant passer pour Azure sous licence. Les précédents essais Kokoro ne constituent pas une meilleure alternative pour le propriétaire.

**Le contenu visuel déjà livré ne prouve PAS que le montage soit internationalement excellent** : certaines attributions fines et les animations sur l'image annotée restent à contrôler en mobile réel; le microfilm 8,235 s n'est pas un reportage complet. Les images NASA et droits doivent rester examinés asset par asset avant publication.

## 4. Métrologie et qualité d'exécution

- Source vidéo technique P0.6 **H264/AAC**, image 1080×1920/30fps ; le nouveau remux **copie le flux vidéo H264**, donc ne recomprime ni les images NASA ni les textes.
- **Suppression volontaire de la piste parole Kokoro** via FFmpeg : `-map 0:v:0 -map 1:a:0` avec un NOUVEAU WAV calculé localement, puis AAC 48kHz. Ce ne sont pas des bruits d'impacts NASA, uniquement du sound design non diégétique.
- Sous-titres visibles = témoins éditoriaux d'une narration *non présente* ; aucune prétention d'alignement mot-à-mot ou de voix de remplacement.
- Manifeste local accompagne le fichier : `/mnt/data/WorldVision-ArtemisII-demonstration-visuelle-v2-manifest.json`, statut `INTERNAL_VISUAL_REVIEW_NOT_PUBLICATION`, `source_narration_removed=true`, `new_narration_present=false`.
- Il est interdit de publier, de fusionner ou de déployer sans une décision explicite, vérification éditoriale et des droits.

## 5. REPRISE EXACTE DANS UN AUTRE CHAT

1. Dépôt `OBIANG5/World-Health-Vision`. Ouvrir **PR #141** (draft) / branche `feature/worldvision-media-artemis2-visual-review-without-kokoro-2026-11-21`, fille de PR #138 et #137, ne pas fusionner.
2. Lire la **TOUTE PREMIÈRE SECTION** de `CONTINUITE_WORLD_VISION.md`, ce document, `MEDIA_CREATIVE_PRIORITY_CANON_2026-11-21.md`, `MEDIA_P0_7_VIVIENNE_C52_OWNER_REVIEW_2026-11-21.md` et le commentaire PR/issue #116.
3. Vérifier le HEAD SHA et les Actions `worldvision-media-artemis2-owner-visual-only`; inspecter les logs ET l'artefact MP4 + PNG réels ; vérifier la source `dec6af...`, la voix exclue et la présence du rapport; corriger les erreurs sur la même PR, sans prétendre à des résultats non exécutés.
4. **NE PAS ABANDONNER la vidéo en prétendant que l'utilisateur ne l'a pas autorisée.** Il a au contraire autorisé le test pour la voir. Ne pas considérer le film sans voix comme un master.
5. Pour une prochaine version **narrée et complète**, obtenir une NOUVELLE Vivienne C5.2 +8% prononçant le texte NASA exactement, écouter et faire l'alignement P0.3 sur CE signal, corriger la synchronisation visuelle et sonore, contrôler la lisibilité 390px, envoyer à l'utilisateur pour revue. Respecter sources/droits et sa décision éditoriale. Aucune voix Kokoro substituée.
6. Sur le moyen terme, quitter les micro-sprints NASA et développer la vraie grammaire **hook / re-hook sémantique / motion multi-couches / montage rapide** pour tous les sujets, avec un vrai film entier choisi, sans imposer la Terre/GEO.

**Point d'arrêt technique :** MP4 de revue visuelle déjà produit dans le chat, branche #139 créée, script et workflow de reconstruction ajoutés, nouvelle CI et validations à vérifier, sans aucun merge/publication/dépense.
