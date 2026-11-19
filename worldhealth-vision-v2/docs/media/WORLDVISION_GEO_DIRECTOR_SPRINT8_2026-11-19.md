# WORLD-VISION MEDIA — Sprint 8 : GEO Director, country spotlight et bibliothèque de motion design

**Reprise du chat du 19 novembre 2026.** Dépôt : `OBIANG5/World-Health-Vision`.
**Branche autonome :** `feature/worldvision-geo-camera-country-spotlight-2026-11-19`, fondée sur la tête de `feature/worldvision-cinematic-director-gates-2026-11-19` / PR #44.
**Statut de ce document :** contrat, implémentation et protocole de contrôle. La réussite finale des CI et le jugement esthétique sur de véritables captures doivent être consignés *après observation*, jamais présumés. PR mère et branche Sprint 8 ne sont **pas déployées sur V2**.

## 0. Pourquoi nous sommes ici — décision humaine invariable

Le propriétaire a fourni **deux vidéos de référence** (~94,57 s « Bourse Express » à 512×910 et ~59,49 s de géopolitique/cartes à 512×910), plus une **image de globe lumineux dans l'œil World-Vision**. Leurs médias protégés ne sont pas redistribués dans GitHub. Ils sont des **références de niveau artistique, de lisibilité et de langage cinétique**, pas des jeux de données d'actualité ni des ressources à copier.

Le constat central est plus large que le globe : **une seule photographie, une seule carte ou un même plan doit pouvoir porter plusieurs mouvements indépendants mais chorégraphiés**, de façon riche, lisible et narrative : contexte géographique, zoom de caméra, détourage, halo, chiffres, légendes, sous-titres, son synchronisé. Les vidéos de référence constituent un **plancher d'ambition**, pas un plafond. World-Vision vise un média audiovisuel international sérieux et mémorable.

**Décision produit la plus récente (19 novembre)** : recherche/sources/script avec ChatGPT et utilisateur **dans la conversation** ; le logiciel orchestre script, rushes, photos, voix libre, animation, compositing, montage, QA et exports. Ne réinventer ni une IA vidéo ni After Effects/Fusion/Blender/DAW. **Vivienne est une référence, non une obligation de l'atelier. BAOCOM séparé et non publié. GDELT, blog et Content OS général différés ; Content OS audiovisuel seulement lorsqu'il sert le montage.** Pas de onze « gates » imposées dans l'interface.

Lire en premier le [handoff corrigé](WORLDVISION_CREATIVE_EDIT_HANDOFF_2026-11-19.md), [Sprint 6](WORLDVISION_GEO_MOTION_PACK_SPRINT6_2026-11-19.md), [Sprint 7](WORLDVISION_GEO_BLUE_MARBLE_SPRINT7_2026-11-19.md), et [PR #44](https://github.com/OBIANG5/World-Health-Vision/pull/44).

## 1. Héritage protégé des Sprints 1–7

La même composition `CreativeEdit.tsx` alimente **le Player Remotion V2 et le rendu MP4**. Elle reçoit des scripts fournis, médias réels ou synthétiques explicitement étiquetés, animations importées, voix/music au choix, multi-plans, transitions, focus 2,5D, document_focus sans faux OCR, atlas D3 et Terre `@remotion/three` / NASA Blue Marble juin **2004** (pas satellite live). Les tests de référence verts du 19 novembre précèdent Sprint 8, notamment Actions #44571939217 sur la tête de PR #44. Rien de cela ne vaut validation artistique pour une vidéo réelle.

**Antirégression majeure :** le mode photo NASA avait été caché par deux disques SVG cyan. En mode `photo`, conserver impérativement les bords lumineux `fill="none"`, le centre géométrique synchronisé, la texture source SHA-256 `dc059529b8ed1cfcdd59747a7c3f259c93c1322bf88ca1ec8bab1dd71fcc57f5`, l'œil blanc derrière le globe et des titres lisibles. Les sources de frontières Natural Earth 110m sont simplifiées ; ne jamais affirmer leur exactitude juridique universelle.

## 2. Sprint 8 effectivement implémenté dans une branche séparée

| Couche | Emplacement | Contrat concret |
| --- | --- | --- |
| Caméra géodésique réutilisable | `services/media-renderer/src/geo-motion-camera.mjs`, déclaration `.d.mts` | `geo.camera.to` coordonnées choisies, `startFrame`, `endFrame`, `zoom`. Interpolation D3 `geoInterpolate` sur grand cercle (anti-méridien compris), easing déterministe, arrivée maintenue sans dérive de rotation. |
| Globe et frontières synchronisés | `GeoStory.tsx` + `GeoPhotorealEarth.tsx` | même centre interpolé, angle de rotation et échelle pour projection D3, photo 3D NASA, marqueurs, routes et clip. Des attributs de contrôle rendent la pose inspectable dans Chromium. |
| Country spotlight | `GeoStory.tsx` | contour tracé depuis **l'objet original de World Atlas/Natural Earth**, via son ID numérique ISO à 3 chiffres ; lueur et accent modérés sur une véritable géométrie, pas une forme inventée. |
| Pilotage créatif | `frontend/web-v2/src/media/CinematicProductionBoard.tsx` | sélection explicite de l'arrivée longitude/latitude, beats de caméra en secondes, échelle d'approche 1–1,15, pays source via liste de l'atlas. Le JSON exporté a le même contenu que le Player. |
| Refus de données incorrectes | `creative/validate-project.mjs` | coordonnées finies et dans le monde, départ/arrivée avec au moins 30 frames de déplacement et 18 frames de maintien, zoom borné, ID national réellement présent dans la version d'atlas utilisée. |
| Couverture automatisée | `creative/validate-project.test.mjs`, `creative/test-player-browser.mjs`, `creative-player-smoke.tsx`, `geo-story.synthetic.example.json` | tests géodésiques traversant ±180°, tenue de la destination, refus d'un ID inventé, vraie scène Chromium avec contour, correspondance de zoom 3D/SVG, rendu vidéo test sans événement fabriqué. |

**Contrat exemple, strictement technique et NON journalistique** :
```json
{
  "geo": {
    "look": "photo",
    "center": {"lon":10, "lat":12},
    "spinDegrees": 12,
    "camera": {
      "to": {"lon":11.6, "lat":-0.7},
      "startFrame": 15,
      "endFrame": 102,
      "zoom": 1.10
    },
    "spotlight": {"countryId": "266"}
  }
}
```
Cette vignette technique choisit une géométrie d'atlas du Gabon et un point exemple. **Aucun événement gabonais, chiffre, mouvement humain, trajet ou reportage réel n'est affirmé par cet exemple.** Toutes les valeurs utilisées en reportage doivent être vérifiées et validées par l'éditeur.

**Limite assumée du Sprint 8 :** `zoom <=1.15` est une **approche optique à l'intérieur de l'œil**, PAS un zoom haute résolution jusqu'à une ville. Le futur pays/région zoom doit changer de niveau de détail et de cadrage scénique, vérifier les petits territoires, les frontières sensibles et les sources cartographiques 50m/10m. Aucune donnée réelle n'est inférée du titre ou d'une photo.

## 3. Méthode artistique — passer de « plusieurs effets » à une composition vivante

Pour chaque scène, le réalisateur décrit un **sujet principal** et les couches nécessaires au récit. Les animations doivent être indépendantes dans le moteur, mais **orchestrées en temps** : au moins un point de repos visuel, des priorités d'attention, des transitions motivées et une zone sûre TikTok. Le nombre de couches n'est pas un objectif automatique : une scène peut se simplifier quand le sujet le commande. La précision historique, géographique et journalistique prime sur l'effet visuel.

Architecture cible commune et réutilisable (schéma **NON implémenté dans son ensemble**) :

`CreativeProject -> CreativeShot -> Layer[] (background/photo/cutout/map/data/text/evidence) + MotionTrack[] (target/start/end/easing/constraints) + AudioCue[] + SourceRights[] -> shared Remotion Player/MP4 -> Pixel/Audio QA -> Human approval`.

Les mouvements qui partagent un objet (par exemple le globe 3D et ses frontières SVG) doivent consommer une **pose unique** à chaque frame ; jamais deux interpolations approximativement similaires. Les assets originaux et leurs SHA sont immuables. Toute modification doit rester localisable à un plan ou une couche.

## 4. Bibliothèque World-Vision Motion — ordre de spécialisation, sans perdre les autres packs

### GEO — signature différenciante, priorité P0

- **GEO-0 / acquis** : vrai globe texturé NASA 2004, œil cyan, frontières, route, marqueur, photo/vidéo, chiffre, titre et transitions sous une timeline.
- **GEO-1 / Sprint 8** : caméra interpolée sur grand cercle et contour de pays choisi par l'humain avec atlas source.
- **GEO-2 / suivant** : *country-focus* en plan distinct (silhouette, véritable zoom pays/région, géométrie 50m/10m, design de l'image du pays, safe areas, couverture des petits États et territoires).
- **GEO-3** : flux/liaisons vérifiés, trajectoires et comparaisons spatiales, aucun dessin de déplacement fictif présenté comme événement réel.
- **GEO-4** : transitions globe → carte → photographie/vidéo/document, mouvement de caméra coordonné et conservant les coordonnées géographiques.
- **GEO-5** : tests d'alignement 3D/D3 sur lieux réels, carte de controverses, compatibilité Safari WebGL et option de rendu alternatif explicitement nommée.

### DATA — priorité P1

- Compteur temporel typographique, séries historiques sourcées, barres et courbes qui se dessinent, sparkline, table de variation, top 3–5, heatmap, ticker et comparaison.
- Contrat strict : source + date + unité + période + valeur ; ne pas interpoler une hausse boursière ou un nombre de victimes fictif.
- Conception multi-couches : photographie en fond, chiffre/mini-courbe au premier plan, titre en séquence, annotations en tempo, effets audio soumis aux faits.

### PHOTO / IMAGE — priorité P1, coeur de la demande utilisateur

- Une **vraie image unique**, issue d'une source autorisée, avec 3–6 **pistes de mouvement utiles** : caméra/pan, découpe avant-plan transparente, profondeur 2,5D, masque de révélation, halo/focus, légende/chiffre.
- Tracking/détourage réalisés par des outils externes spécialisés lorsque plus fiables ; pas de silhouette fictive déguisée en photographie de crise.
- Entrées indépendantes réutilisables et réglables par plan ; débordement, occultation du visage et lisibilité mesurés sur iPhone, sans se satisfaire d'une jolie image isolée.

### EDITORIAL / TEXTE — priorité P2

- Kinetic typography, mots importants mis en évidence, reveal par sens, chapitrage court, accroche de trois secondes, sous-titres calés sur **l'audio effectivement audible** ; multilingue, accents et RTL testés.
- Anti-overlap systématique avec la plateforme, les informations primaires, les visages et les autres textes.

### DOCUMENTAIRE / EVIDENCE — priorité P2

- `document_focus` existant : image primaire inchangée, rectangle sélectionné, zoom sobre, aucune citation fabriquée.
- À construire : timeline de sources, comparaison de passages réellement présents, juxtaposition avant/après sous date et méthode, trace du correctif éditorial, licence/autorisation et captures associées.

### AUDIO / MONTAGE / PRODUCTION — priorité P2 puis P3

- Voix au choix, prise continue, alignement des sous-titres, loudness, ducking musical, sound cues justifiés, raccord image/son, pas de régénération cachée.
- Versions non destructives par couche et plan, SHA sur les assets, preview/cache ciblé, export 1080×1920, QA sur fichiers réels, comparaison artistique A/B.
- Plus tard seulement : stockage privé authentifié des rushes et Content OS audiovisuel (projets, assets, voix, retours, versions). **Pas de blog/GDELT/couplage BAOCOM dans la PR.**

## 5. Épreuves non négociables avant acceptation / merge

- [ ] Test unitaire Node sur `geoCameraPose` et validation JSON (anti-méridien, coordonnées, finitude, timings, ID Natural Earth).
- [ ] Build/typecheck réel du renderer et du frontend V2 ; pas de bundle dupliqué ou de dégradation de l'UI.
- [ ] MP4 H.264 **réel** d'un exemple **expressément synthétique** ; captures Player en frames 0/48/96/138 et prévisualisation du film entier.
- [ ] Trajectoire visible sans saut : position initiale, déplacement, arrivée, immobilité ; alignement observé des côtes NASA et frontières D3, même zoom de la sphère et des contours.
- [ ] Country spotlight effectivement visible sur vrai polygone ; marqueur caché sur la face arrière, texte et métrique sans collision.
- [ ] Contrôles sur iPhone Safari et au moins Android Chrome, avec masques TikTok ; vérifier FPS/lag mémoire et taille réelle, garder une solution de repli claire si WebGL non supporté.
- [ ] Aucun fond, marqueur, pays ou chiffre technique fictif dans un reportage publiable ; provenance, droits et dates exigés.
- [ ] Comparaison qualitative à la référence globe-œil **avec vraie revue humaine** ; pas d'affirmation « qualité mondiale » automatique.

**Aucun merge de PR #44 ou de cette branche dans `v2` tant que les preuves requises ne sont pas examinées. Aucun déploiement/Vercel/publication ni coût cloud déclenché.**

## 6. Passation au prochain chat — ordre exact

1. Lire ce fichier, le [handoff actuel](WORLDVISION_CREATIVE_EDIT_HANDOFF_2026-11-19.md), le [Sprint 7](WORLDVISION_GEO_BLUE_MARBLE_SPRINT7_2026-11-19.md), puis la PR #44 et la **PR du Sprint 8** si créée.
2. Vérifier les SHA HEAD de chaque branche ; ne jamais inventer une CI verte sur une autre révision. Inspecter Actions et les artefacts MP4/PNG.
3. Corriger d'abord tout échec technique sur Sprint 8 ; revoir ensuite les vrais pixels et comparer au globe de référence. Ne rien déclarer final sans cette revue.
4. Si Sprint 8 validé : GEO-2 country-focus avec échelles 50m/10m et cadrages réellement exploitables ; puis DATA + PHOTO multicouche, puis EDITORIAL/AUDIO.
5. Après chaque incrément : commit isolé, PR en draft, preuves CI, captures datées, mise à jour de ce registre et de `CONTINUITE_WORLD_VISION.md`, et distinction stricte entre code/test/art/publié.

## 7. Audit réel — Actions, MP4 et pixels inspectés le 19 novembre

**Code testé après correction JSX : commit `f34ae7c065cfb6ee25a979cd149f13e944583b92`.**
**GitHub Actions [#44615478166](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44615478166) : les deux jobs SUCCESS** (renderer + build véritable front V2).
- 16 tests Node, **16 réussis, 0 échec** ; caméra sur anti-méridien, durée, maintien, source atlas / ID Gabon 266 vérifiés.
- `geo-motion-intro.mp4` : **H.264, 1080×1920, 30 ips, 150 images / 5 s, 3 280 097 octets**. MP4 et rapport `ffprobe` examinés.
- Artefact GitHub **14573009991** (`worldvision-creative-compositor-demo`) téléchargé ; le document d'audit a examiné les **vrais screenshots Chromium** `player-geo-frame-0/48/96/138.png` à 360×640 ainsi que les stills réellement extraites du master à frames 0/74/149. Rapport navigateur : **0 erreur JS**, 4 PNG de SHA distincts, caméra arrivée et tenue, globe 3D et D3 à échelle concordante. Texture NASA officielle au SHA précité.
- Le premier CI Sprint 8 #44615289624 avait **échoué au parser TSX** en raison d'une fermeture `}` manquante après `spotlightPath`; le commit de correction `f34ae7c` a résolu le défaut. Conserver l'historique, ne pas supprimer cet échec de la chronologie.

### Observations VISUELLES indépendantes (pas seulement CI verte)

1. **Réussi sur la preuve de test** : Afrique, Europe, océans, Sahara et frontières Natural Earth sont visibles, couleur NASA plus riche que l'ancien globe cyan uniforme ; l'œil lumineux apparaît derrière la Terre ; l'arc, le marqueur, la photo synthétique, le nombre et les légendes se combinent effectivement dans une seule scène. Pas de frame noire dans les 4 captures navigateur consultées.
2. **Caméra** : sur ces coordonnées de démonstration le déplacement est **modéré** : latitude 12° → −0,7°, longitude 10° → 11,6°, optique 1 → 1,10 ; l'effet n'est pas comparable au zoom impressionnant vers une région dans les références. À ne pas présenter comme équivalent de GEO-2.
3. **Country spotlight** : la géométrie du Gabon est dessinée mais **reste trop discrète et presque absorbée par le marqueur** à taille iPhone. Un véritable plan pays isolé/agrandi à géométrie plus fine est indispensable. Le simple contrôle `countryPathLength > 15` ne constitue pas une évaluation artistique.
4. **Habillage** : sur les captures, l'œil blanc très intense et les anneaux cyan dominent parfois les frontières. Le bandeau supérieur est clair et lisible en 1080, mais les microtextes sur 360px doivent encore être hiérarchisés pour une vraie vidéo publiée. La mise en scène est encore une *démo technique*, pas un film journaliste performant.
5. **Référence** : cette démo ne contient ni véritable scène d'actualité, ni narration, ni photographie de presse sous licence, ni animation de données financière avancée. **Il reste impossible de valider « qualité mondiale » à partir de ces seules images**. La comparaison à l'image de globe fournie exige encore des itérations de lumière/atmosphère/frontières ; la comparaison aux vidéos finance/géopolitique exige des scènes multicouches de même complexité éditoriale et musicale.

### Verdict actuel

**Technique sur le code `f34ae7c` : CONFORME à son contrat de test.**
**Direction artistique / publication : NON VALIDÉE** ; PR #72 reste **DRAFT** et aucune V2 publique n'est modifiée.
**Lancement automatique des tests renforcé :** le commit `a149b225` ajoute les nouveaux fichiers `geo-motion-camera.mjs/.d.mts` aux filtres CI ; le workflow [#44616853136](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44616853136) a ensuite conclu **SUCCESS sur les deux jobs** au commit `a149b225`. Le code et les pixels de la démo sont inchangés ; seules les modifications documentaires ultérieures font évoluer le HEAD.

**Prochaine intervention créative à haute valeur :** ne pas allonger indéfiniment le travail sur un anneau blanc. Construire GEO-2 (vrai pays cadré, lisible et mis en valeur, carte 50m/10m + média authentique + texte/chiffres), puis une scène PHOTO multi-couches 3–6 mouvements indépendants et une scène DATA (courbe/heatmap/ranking). Ces éléments servent plus directement la comparaison aux vidéos originales que la retouche d'un effet isolé.
