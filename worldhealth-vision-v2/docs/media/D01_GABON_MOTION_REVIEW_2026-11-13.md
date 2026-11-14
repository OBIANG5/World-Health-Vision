# World-Vision — D01, vrai micro-clip géociblé vers le Gabon

**Date : 13 novembre 2026. Statut : essai technique terminé, non approuvé artistiquement et non autorisé à la diffusion.**

## Livrable vérifié
- Source de la génération vidéo : `frontend/web-v2/render-cinematic-d01.mjs`, `src/media/CinematicCapture.tsx`, `src/media/CinematicEarth.tsx` et `geoTargeting.mjs`.
- Workflow de génération : [D01 CGI technical 4s motion #43466731755](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43466731755), **completed/success**.
- MP4 réellement créé et conservé dans la **même branche de preview permanente** `whv-media-studio-browser-preview` : [wv-d01-gab-technical-4s.mp4](https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-lab/wv-d01-gab-technical-4s.mp4).
- Métadonnées : `1080×1920`, `24 fps`, `96 frames`, `4.0 secondes`, `H.264/yuv420p`, audio/voix : absents. Taille actuelle du blob Git : `4 428 635 octets`, SHA du blob Git `8dd35afc5f5ef56eae1b40b72208dfc19380cb78`.
- **SHA-256 exact du film** consigné dans le manifeste généré par la CI : `17796338023f0ffd9732739390ac2535c816113baf8e6dd773879314604bb22a`, manifeste : [wv-d01-gab-technical-4s.json](https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-lab/wv-d01-gab-technical-4s.json).
- Texture : NASA Blue Marble Next Generation equirectangulaire de janvier, SHA-256 `9743175942473681d78838ca1042553dab4779cf957fb6d8f22a81fb796f7797` ; polygones pays V2 `countries.geojson` ; interpolation géographique sphérique de `geoTargeting.mjs`.
- Destination : `GAB`, point représentatif approximatif du **pays** calculé depuis le GeoJSON. **Ce n'est pas une coordonnée de ville ni un événement réel.**
- **ATTENTION** : aucune voix approuvée, aucun clip d'actualité authentique, aucune chaîne sociale publiée, aucune validation D00-v6 ou D01.

## QA supplémentaire et rendu visuel
Un premier workflow de revue a échoué parce que l'image runner n'incluait pas `ffprobe` ; **l'environnement a été corrigé** en installant `ffmpeg`/`ffprobe`. Son second passage a réussi :

- [QA du film D01 #43468666079](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43468666079), **completed/success**.
- Le MP4 a été re-vérifié par **SHA-256** contre le manifeste et par `ffprobe` : dimensions, fréquence, 96 images, durée 4 s.
- Vrais photogrammes extraits du MP4 (0 s, 2 s, 3,87 s) : [planche de contrôle](https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-lab/review/contact-sheet.jpg).
- Les 3 images sont **distinctes par leur SHA-256**, ce qui vérifie que le fichier n'est pas un arrêt sur image. Leur différence ne démontre pas une fluidité artistique parfaite ; cela nécessite un visionnage humain.
- [QA proof](https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-lab/review/qa-proof.json), code du workflow `.github/workflows/whv-d01-motion-qa.yml`.

## Intégration au site et sécurité des validations
Le Media Studio inclut désormais le composant `CinematicMotionReview.tsx/.css` :
- pas d'auto-lecture, lecteur HTML5 avec `controls`, `playsInline`, vignette tirée du film `frame-start.jpg` et accès au MP4/manifeste ;
- vérification préalable que le manifeste existe, indique `GAB`, le statut d'essai, un SHA-256 et `publication_authorized=false`/ `art_direction_approved=false` ;
- lien vers la planche début/milieu/fin ;
- absence de lecteur trompeur lorsque les fichiers n'existent pas dans l'archive.

Lien permanent : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/index.html?view=media&screen=review&gate=direction

**Ne pas déclarer ce clip conforme à l'esthétique D00-v6.** La capture montre une vraie Terre CGI avec relief et pays d'Afrique projetés, mais l'esthétique de la Terre, des arcs de l'œil, du blanc et de l'atmosphère reste à comparer au concept préféré du propriétaire. Ce travail prouve le **mouvement calculé et exporté**, pas la réussite finale du branding.

## Prochaine décision technique et créative
1. Montrer **le vrai MP4** et les 3 photogrammes au propriétaire sur iPhone et recueillir les remarques de qualité sur la rotation, la lisibilité des pays, les arcs et l'atmosphère. Ne pas attribuer de note à sa place.
2. Ajuster le moteur CGI pour se rapprocher du style artistique D00-v6, sans remplacer le globe satellite par un dessin plat.
3. Définir l'événement réel (pays et éventuellement coordonnées géocodées **vérifiées**), puis D02 zoom vers lieu ciblé et transition D03 vers des vraies images sourcées.
4. Conserver le pipeline du manuel : **auditions de trois voix françaises**, vérification prononciation, alignement mot-à-mot et sous-titres, montage Remotion/FFmpeg, QA sur smartphone et accord avant publication. Voir `AUDIOVISUAL_PRODUCTION_MASTER_PLAN_2026-11-13.md`.

**Discipline** : toute nouvelle version du film doit porter un ID, une SHA-256, une capture et un avis explicite. Aucun MP4 technique ne doit être présenté comme un reportage publié.
