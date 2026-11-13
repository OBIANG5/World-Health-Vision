# World-Vision — moteur de Terre cinématographique D00 (première intégration CGI)

**13 novembre 2026.** Documentation de code et de preuve. **STATUT : prototype 3D phototexturé à revoir, pas D00 validé et pas un MP4 final.**

## Ce qui a changé réellement dans l'application

La maquette Canvas simplifiée reste disponible dans Git pour analyse technique, mais **l'affichage principal du nouvel essai et le globe de la démonstration pays utilisent désormais le nouveau composant CGI WebGL `CinematicEarth.tsx`**.

- `frontend/web-v2/src/media/CinematicEarth.tsx` : shader sphérique WebGL 1, calcul des normales/surfaces selon la longitude/latitude, interpolation visuelle phototexturée, océans bleu naturel, éclairage diurne, Fresnel atmosphérique cyan, projection et clipping des **vrais polygones** `countries.geojson` sur un canvas 2D superposé ; une seule orientation commandée par `centerLon/centerLat`, sans seconde implémentation du mouvement.
- `frontend/web-v2/src/media/CinematicEarth.css` : composition verticale 9:16, blanc `#ffffff` de l'œil, **exactement deux arcs** supérieurs/inférieurs prolongés hors cadre, pas d'anneau fermé, étoiles très discrètes. Atmosphère calculée autour du globe, distincte des arcs.
- `GeoTargetingLab.tsx` : utilise `CinematicEarth` au lieu de `GeoGlobe` pour l'affichage dynamique ; conserve les contrôles de pays ISO3, le `scrub` de rotation et l'interpolation sphérique testée du moteur `geoTargeting.mjs`.
- `GlobeDirection.tsx` : nouvelle zone visible « D00 / Terre CGI » **avant** les six maquettes vectorielles archivées ; l'original artistique D00-v6 reste sa référence de direction et n'est pas présenté comme approuvé.
- `.github/workflows/whv-media-studio-mobile-preview.yml` : téléchargement dans la build CI d'une texture NASA Blue Marble réelle, vérification type JPEG/taille, génération du fichier `earth/provenance.json` + SHA-256 et publication dans la même branche d'aperçu mobile.
- `media-preview-smoke.mjs` : téléchargement et contrôle du JPEG, attente du rendu WebGL, vraie capture iPhone `media-globe-cinematic-d00-candidate-iphone.png` ; la suite historique vérifie la rotation pays et ses captures.

## Texture source et droits/provenance

Source primaire : NASA Blue Marble Next Generation with Topography, January, equirectangular 5400×2700, **sans lumières nocturnes de villes**.

- Présentation NASA : https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-topography/
- Fichier NASA bundlé : `https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-topography/january/world.topo.200401.3x5400x2700.jpg`
- **SHA-256 de la texture effectivement publiée** : `9743175942473681d78838ca1042553dab4779cf957fb6d8f22a81fb796f7797`.
- Provenance vérifiée : branche `whv-media-studio-browser-preview`, fichier `earth/provenance.json`.
- Texture de projection redimensionnée **en mémoire GPU** à 2048×1024 pour limiter les problèmes sur smartphone. La source haute définition demeure séparée dans l'archive statique ; ne pas attribuer un fond de carte géographique inventé à NASA.

Les frontières sont **calculées depuis les données vectorielles déjà présentes dans la V2**, non tracées au hasard par l'image. Note : une frontière de pays n'est pas nécessairement un fait diplomatique neutre ; la politique de territoires contestés doit être vérifiée lors de la publication réelle.

## Preuves de réalisation et tests

- Dernier source du frontend **publié et vérifié** : `2f9fedd46ae2ee77e3984814b3d47710e0a25c27`.
- Workflow mobile : https://github.com/OBIANG5/World-Health-Vision/actions/runs/43464929633 — **completed / success**, incluant téléchargement NASA, test Playwright iPhone, test desktop, capture CGI et déploiement.
- Manifeste GitHub `preview-deployment.json` de la branche de preview : `source_commit=2f9fedd46ae2ee77e3984814b3d47710e0a25c27`.
- Capture iPhone du D00 CGI : https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-globe-cinematic-d00-candidate-iphone.png
- Lien permanent du site : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/index.html?view=media&screen=review&gate=direction
- Le test ne certifie **ni satisfaction artistique finale, ni performance réelle sur tous les iPhone, ni un film exporté avec FFmpeg**.
- **Rappel :** la vraie image de référence artistique D00-v6 d'origine générée dans le chat, identifiée par SHA-256 `8d9a9d20f20fbf7757713b6f5eab06590f191166eb779865747f0f59683cfca2`, est une **référence séparée** et **son PNG n'est toujours pas committé sur GitHub**. Ne pas substituer la capture CGI à ce PNG en prétendant que les deux sont la même image.

## Points techniques et éditoriaux à traiter ensuite

1. **Comparaison côte à côte** entre D00-v6 original et nouveau CGI sur une scène verticale pleine résolution 1080×1920 : les deux arcs, l'épaisseur du blanc, le relief, la taille des pays sahariens, la diffusion atmosphérique, l'absence de soleil et la lisibilité sur iPhone. Les ajustements doivent se faire dans les shaders/données, pas en improvisant une carte plate.
2. Validation **artistique explicite** avant de désigner D00 comme signé. Les maquettes D00–D05 plus anciennes ne sont pas interchangeables avec le nouveau CGI.
3. Prendre le moteur géographique `geoTargeting.mjs` comme base D01 : entrée par **pays ISO3** d'un dossier réel et si nécessaire coordonnées événementielles réellement vérifiées. Rendre au moins un **micro-clip 3–6 secondes**, puis proposer la revue de sa fluidité et du cadrage. Ne pas forcer plusieurs pays pour un seul fait.
4. Préparer une sortie Remotion/FFmpeg contrôlée **1080×1920 / 30fps** avec audio WAV et SRT uniquement après stabilisation des plans.
5. Conserver **les 14 étapes de production** : radar, vérification des informations, validation éditoriale, scripts, médias réels licites, voix naturelles auditionnées, alignement mot-à-mot, montage, étalonnage/mixage, QA, exports et publication sous autorisation. Voir `AUDIOVISUAL_PRODUCTION_MASTER_PLAN_2026-11-13.md` (les 9 parties du manuel original de 137 pages).

**Aucun backend 24/7 ni TikTok/WhatsApp automatiquement publié n'est prouvé par l'aperçu statique.**
