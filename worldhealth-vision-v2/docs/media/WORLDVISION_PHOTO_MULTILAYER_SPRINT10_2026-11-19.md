# WORLD-VISION MÉDIA — Sprint 10 : PHOTO MULTILAYER / six pistes indépendantes
**Date : 19 novembre 2026. Branche :** `feature/worldvision-photo-multilayer-motion-tracks-2026-11-19`, **branche enfant de la PR #74 Sprint 9**. Première base garantie : `7e17dab2dae33572d99e37217a3b61ee1e8831fd`.

## 1. Les références et la véritable exigence créative

Le propriétaire a comparé deux vidéos verticales réelles : « Bourse Express » (~94,6 s, 512×910, data/finance) et digest géopolitique (~59,5 s, 512×910, cartes/pays/photos), plus image de globe lumineux. Elles ont révélé une différence fondamentale entre **slide animée** et **composition vivante multi-couches**. World-Vision doit pouvoir faire du motion design international de premier rang **à partir d'UNE seule photographie** quand aucun rush vidéo authentique n'est disponible.

La suite prioritaire validée : GEO (Sprints 7–9) → **PHOTO MULTILAYER** (ce Sprint 10) → DATA (charts/heatmaps/ranking, vrais nombres et sources) → EDITORIAL/AUDIO → séquences de reportage complet. Ne pas créer de fausse photographie de crise, de sujet artificiel ou de fausse citation. Pas de publication d'images sans licence. Les clips de référence ne sont pas redistribués dans le dépôt.

## 2. Contrat implémenté : `photo_story`

**Nouvelle scène** dans `CreativeEdit.tsx`, utilisée PAR LE MÊME composant Remotion pour le Player React et les MP4, sans approximation CSS ni reconstitution de contenu. `PhotoMultilayer.tsx` reçoit une image originalement fournie et six pistes chorégraphiées :

| Piste | Moteur et entrée | Ce qui est VRAIMENT animé |
|---|---|---|
| A Caméra | `photo.camera` | agrandissement déterministe + translation faible x/y; zoom suffisant pour empêcher bord noir |
| B Révélation originale | `photo.mask` | dévoile progressivement **le même fichier** sans invention de pixels, axe horizontal/vertical |
| C Sujet / premier plan | `photo.subject` + `shot.foreground` | détourage PNG/WebP alpha externe provenant de la même photo, puis déplacement et échelle indépendants |
| D Focus suivi | `photo.focus` | point de focus choisi humainement sur la zone visible, recomputé par **la pose exacte de la caméra** pour ne pas dériver |
| E Donnée & source | `photo.metric` | compteur sur une valeur **fournie**, texte, unité, attribution lisible et timeline séparée; aucune donnée calculée depuis l'image |
| F Typographie | `shot.title/subtitle/eyebrow` | entrées narrative sur des beats spécifiques, sans recouvrir le sujet ni la zone de description du mobile |

Source d'interpolation pure : `services/media-renderer/src/photo-motion-tracks.mjs` (+ `.d.mts`). `PhotoMultilayer.tsx` utilise `photoTrackPose(photo,frame,durationFrames)`. Aucune animation n'est soumise à un timer ou au réseau ; toutes sont déterministes pour le rendu par image.

## 3. Validation de projet et interface de montage

`creative/validate-project.mjs` refuse :
- photo absente ou vidéo à la place d'un still original;
- durée non adaptée (au moins 150 frames, maximum 3600), titre vide ou trop long;
- zoom/pan hors de la zone réellement couverte par l'image;
- pistes au-delà de la durée du plan ou à durée trop courte;
- parallaxe demandée sans vrai fichier transparent;
- focus en-dehors des limites utiles, rayon excessif;
- valeur non finie et **source de la métrique non renseignée**.

`frontend/web-v2/src/media/CinematicProductionBoard.tsx` expose le format PHOTO avec réglages réels et indépendants pour le mouvement caméra, masque, sujet, focus, donnée et temps en secondes. L'export JSON et les deux modes Player (plan + film complet) proviennent du même état. Les médias sont importés localement dans l'atelier ; pas de serveur de stockage privé/promesse de publication ici.

### Limites documentaires et droits
- Le compositing ne vérifie **ni la licence, ni l'authenticité d'une photographie, ni la transparence réelle du PNG**. Une validation humaine et un registre des droits restent exigés avant publication.
- Les métriques étiquetées en CI sont **fictives**. L'obligation d'une mention de source n'en garantit pas l'exactitude scientifique.
- Un focus sur un point de la photo est choisi selon les coordonnées visuelles 0–1 et suit le déplacement de l'image dans la scène; il ne réalise pas de suivi automatique d'objet hors de l'image.
- Le détourage externe représente le **même sujet réel** que l'original, pas une personne synthétique. Il doit être aligné et contrôlé indépendamment.
- Il ne s'agit pas encore d'un éditeur NLE avec timeline libre universelle, keyframes à la souris, motion blur avancé, rotoscopie ou calibrage colorimétrique complet ; ces modules doivent être comparés avec les meilleurs outils spécialisés plutôt que réinventés superficiellement.

## 4. Test de non-régression et preuves demandées

- `creative/validate-project.test.mjs` : motion tracks monotones, indépendants, caméra stabilisée, focus mathématiquement ancré, IDs d'actifs et refus de mauvaises sources.
- `creative/build-ci-fixtures.mjs` : un paysage **géométrique synthétique**, un détourage alpha synthétique et une valeur `42 TEST` fictive ; aucune actualité réelle.
- `creative/test-player-browser.mjs` : frames 0/40/85/145, masquage, parallax, focus, compteur+source et sous-titres. Vérifier la zone de sécurité 390×844 avec Player 360×640 et prévenir les sorties du bas.
- `.github/workflows/worldvision-cinematic-director-gates.yml` : tests Node, vrai typecheck Remotion, build V2, MP4 H.264 `photo-multilayer-six-tracks.mp4` (165 frames à 30fps), vrais snapshots enregistrés dans l'artefact CI.

**À vérifier sur le dernier HEAD** : CI complète, résultats distincts des deux jobs, MP4 physique et captures sans trous/noir/occlusions, empreintes distinctes des frames. **Ne jamais déclarer « validé » avant d'avoir vu les artefacts**.

## 5. Direction artistique pour le prochain incrément

Objectif de qualité : un plan photo authentique qui garde un sujet lisible, une hiérarchie mobile forte, un déclenchement rythmé des éléments et des respirations visuelles. Le nombre de pistes est une possibilité, **pas une obligation de saturer l'écran**. Comparaison A/B sur la vraie photo : sans détourage, avec détourages, puis mode actualités/géo/finance. Les deux vidéos de références sont le plancher de lisibilité/structure ; l'ambition reste supérieure.

**Après une CI réussie** : audit des vraies images; corriger seulement les défauts visuels constatés; mesurer temps d'ouverture mobile/footprint du bundle; enrichir PHOTO avec masques mieux pilotables / layout multiposition sans faux contenu; développer DATA Motion (courbes, classements, vraies dates et unités); composer un film cohérent `geo_story → country_focus → photo_story → data_story`.

## 6. Continuité / décisions inchangées

- Base documentaire : `CONTINUITE_WORLD_VISION.md` ; GEO-2 [Sprint 9](WORLDVISION_COUNTRY_FOCUS_GEO2_SPRINT9_2026-11-19.md), GEO-1 [Sprint 8](WORLDVISION_GEO_DIRECTOR_SPRINT8_2026-11-19.md), [handoff](WORLDVISION_CREATIVE_EDIT_HANDOFF_2026-11-19.md).
- PR #44 (atelier cinéma) → PR #72 (globe/contours) → PR #74 (country-focus) → **PR Sprint 10** (photo multi-tracks). Toujours des **drafts empilés**, non fusionnés sur `v2`.
- Recherche/source/script dans ChatGPT pour le moment; voix libre (Vivienne possible, non obligatoire); BAOCOM strictement indépendant; blog et GDELT hors de cette branche. Aucun hébergement/publication/autorisation de droits déclenché.
- Au prochain chat, **lire HEAD + dernier GitHub Actions + artefacts**, jamais présumer du succès d'une révision différente ; poursuivre les priorités PHOTO, puis DATA, puis montage journalistique complet.
