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


## Verdict fondé sur les véritables rendus (mise à jour, 19 novembre)

- [PR #79, run #44627040808](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44627040808) : 2 jobs SUCCESS, MP4 réel animé et vrais captures 0/50/115/150. L'œil attire surtout l'attention sur la lumière et le titre, dont la hiérarchie concurrence un rond clair. Le `photo_layers` est une expérience utile mais ne bénéficie pas d'une pose de caméra partagée et indépendante ni d'une obligation claire d'attribuer le chiffre.
- [PR #80, run #44629579242](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44629579242) : SUCCESS sur commit `3df37e5b54fde78ce5b6155ffc90eac0c49c883d`, 2 jobs, 21/21 tests Node, sept parcours Chromium, H.264 de 165 images à 1080×1920. Les trois photogrammes réels (0/82/164) ont des SHA distincts. L'ouverture contient le titre, la source chiffrée est lisible à ~12,8 px de haut dans le vrai Player 360×640, et les éléments ne débordent pas la zone basse contrôlée. Artefact GitHub #14580713542 inspecté directement.
- Une **régression véritable** avait été capturée sur PR #80 dans le run #44627516211 (MP4 statique malgré Player animé) : elle venait de `render-project.mjs` qui omettait `shot.photo`. Le correctif `7fa3d73` a rendu le master animé ; les tests exigent des SHA distincts et ne seront pas désactivés.

**Décision d'architecture de travail : retenir `photo_story` de la PR #80 comme candidat canonique pour les prochains packs, ne pas fusionner `photo_layers` de la PR #79 parallèlement.** Cette préférence tient au moteur pur `photoTrackPose`, aux pistes distinctes et modifiables depuis l'atelier, à l'ancrage du focus dans le mouvement de caméra et à l'attribution `sourceLabel`. Ne pas fermer/effacer #79 avant une vraie revue finale ; sa variante visuelle et ses décisions demeurent comparables.

**Dernier HEAD de la PR #80 susceptible d'avoir évolué après `3df37e5`** : de nouvelles améliorations ajoutent masque du sujet seulement quand la piste correspondante est activée et un contrôle du vrai titre dès frame zéro. Lire le dernier SHA et le statut Actions exact avant de dire que cette nouvelle révision a été validée. Ce document ne certifie que le run cité.

**Qualité artistique :** les deux films testent un paysage *synthétique*, sans narration authentique. Ils prouvent le mécanisme multi-pistes et la lisibilité de l'éditeur, pas un reportage de niveau mondial. Reprendre avec un vrai média licite et comparer à la vidéo de référence sur iPhone. Le rendu du Gabon GEO-2 a, lui, reçu un retour humain positif ; ne pas casser cette direction graphique lors du raccord PHOTO.
