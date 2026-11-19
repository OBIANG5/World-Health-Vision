# World-Vision MEDIA — Sprint 10 / audit et rapprochement de deux PR PHOTO concurrentes
**19 novembre 2026 — ne pas perdre ce constat lors d'un changement de chat.**

Deux branches ont été créées presque simultanément, toutes deux basées sur la **PR #74 GEO-2**. Il ne faut **pas fusionner côte à côte deux templates différents** pour un besoin fonctionnel identique.

| Branche | PR et implémentation | État prouvé |
| --- | --- | --- |
| `feature/worldvision-photo-multilayer-director-2026-11-19` | [#79](https://github.com/OBIANG5/World-Health-Vision/pull/79), template `photo_layers`, `PhotoLayers.tsx` intégré ; timelines dans la composition, halo radial, masques, détourage, chiffre, titre | [Actions #44627040808](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44627040808) **SUCCESS** (2 jobs). Véritable MP4 et photogrammes exportés, source synthétique seulement. |
| `feature/worldvision-photo-multilayer-motion-tracks-2026-11-19` | [#80](https://github.com/OBIANG5/World-Health-Vision/pull/80), template `photo_story`, `PhotoMultilayer.tsx`, **`photo-motion-tracks.mjs` pur et réutilisable**, signature de type, focus attaché mathématiquement à la caméra, `sourceLabel` numérique obligatoire, timeline éditable par piste | [Actions #44627516211](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44627516211) **FAILED** à juste titre : trois images MP4 ayant le même SHA. La passerelle serveur ne transmettait pas `shot.photo`. Correctif précis commit `7fa3d73b92a784665e11c3059b446e10999d3529`, nouveau contrôle [#44628224032](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44628224032) en attente de résultat. |

## Évaluation de maturité, pas compétition d'ego

La PR #79 a prouvé un vrai film animé. Ses captures synthétiques révèlent aussi un titre parfois placé sur un élément circulaire lumineux ; l'illustration abstraite ne prouve pas la qualité journalistique. Elle est simple et rendue.

La PR #80 propose un **contrat d'ingénierie plus facilement réutilisable** : chaque piste a sa propre phase déterministe dans une fonction testable; la région du focus accompagne le zoom/pan au lieu de rester à une position écran approximative; une donnée chiffrée doit afficher une mention de source. **Elle ne devient pas la branche préférée avant sa preuve MP4 réelle, sa CI et sa revue sur pixels.**

### Convergence à décider après preuves, pas avant

1. Vérifier séparément les SHA de CI et **les vraies images** des deux candidats aux frames d'entrée, milieu et fin. Les codes verts ne donnent pas le niveau esthétique mondial.
2. Comparer la hiérarchie (photo sujet visible, titre sans occlusion, chiffres lisibles), les mouvements simultanés et la concordance Player/H264.
3. Préférer **un seul template public** ; conserver l'autre comme prototype historique avec un statut explicite, sans le fusionner tel quel dans V2. Si une version a le meilleur rendu et l'autre le meilleur contrat, porter sélectivement les éléments, avec tests supplémentaires, dans une seule PR.
4. Distinguer la vraie photo sous licence des fixtures synthétiques et faire auditer la publication séparément. Pas de vraie vidéo d'actualité validée dans ce sprint.
5. Ensuite DATA Motion (séries sourcées, courbes, classements, heatmaps), transitions GEO→PHOTO→DATA, son/voix/sous-titres; le chantier ne doit pas stagner éternellement sur des anneaux/effets.

**Décisions inchangées** : PR #44→#72→#74→Sprint10 restent empilées et DRAFT, aucun déploiement V2 ; recherche et scripts dans ChatGPT, voix interchangeable, BAOCOM indépendant et non publié, blog/GDELT hors périmètre.
