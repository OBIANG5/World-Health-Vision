# WORLD‑VISION / GEO MOTION LAB — SPRINT 6 (19 novembre 2026)

**Statut** : développement dans [PR #44](https://github.com/OBIANG5/World-Health-Vision/pull/44), branche `feature/worldvision-cinematic-director-gates-2026-11-19`. PR **DRAFT** ; aucune fusion ni déploiement.

**À lire avant** : [Sprint 5, document focus](WORLDVISION_DOCUMENT_FOCUS_SPRINT5_2026-11-19.md), [Sprint 4, vrai Player](WORLDVISION_FULL_FILM_PLAYER_SPRINT4_2026-11-19.md), [périmètre corrigé](WORLDVISION_CREATIVE_EDIT_HANDOFF_2026-11-19.md).

## 1. Mission durable — demande expresse du propriétaire

Ne pas perdre la finalité : créer une **capacité mondiale de réalisation audiovisuelle**, un résultat au moins aussi beau que les meilleures références envoyées, avec **plusieurs animations INDEPENDANTES dans un même plan**, pas seulement une image zoomée ou un texte qui monte. Il faut que ChatGPT puisse aider à concevoir/diriger les scènes, et que le code **assemble et synchronise** les meilleurs moteurs, au lieu de réinventer la génération vidéo, le TTS ou After Effects/Blender/DaVinci.

Recherche d'actualités, choix et script restent **dans la conversation ChatGPT**. World‑Vision reçoit le script et les sources fournies : photos, vidéos, enregistrements, choix de voix, données validées, plans. **Vivienne n'est pas obligatoire. BAOCOM reste indépendant, aucune publication de BAOCOM sur GitHub, aucun raccord.** Content OS blog global/GDELT différés jusqu'à intégration logicielle ; Content OS audiovisuel limité aux projets, scènes, médias, retours, rendus et versions.

## 2. Ce qui a été regardé dans les références vidéo de l'utilisateur

Les **fichiers fournis dans la conversation** sont des références audiovisuelles privées : **ne pas copier les MP4 dans GitHub** ni en réutiliser le branding, les images ou l'audio sans droits. Les informations suivantes proviennent de FFprobe et de visionnage par planches de frames, **pas d'une annotation manuelle exhaustive de chaque image** :

| Vidéo | Métriques du fichier fourni | Observations directes | Compétences à reproduire puis dépasser |
|---|---|---|---|
| `v26044gc0000dbqa3c7og65j2hu0cq00.mp4` | H.264/AAC, **94,57 s**, 512×910, 30 ips | Média financier « Bourse Express » : grand pourcentage, graphique de marché, comparaison DAX/Euro Stoxx/FTSE, palmarès hausses/baisses, heatmap de nombreuses valeurs, mini-courbes en cartes, bandeau ticker, sortie marque | Data choreography, compteurs, courbes et classements animés par couches indépendantes, palette/hiérarchie cohérentes et sensation de rigueur |
| `v26044gc0000db086nvog65qf70rgl80(1).mp4` | H.264/AAC, **59,49 s**, 512×910, 30 ips | Vidéo géopolitique : photographie satellite/carte en fond, recadrages géographiques entre régions, silhouette de pays avec drapeau, photographie d'événement ou de personne dans une carte au-dessus du lieu, mention de date, passes Iran/Inde/États-Unis/Éthiopie/Émirats/France | Geo localisation + caméra + pays + vrai média + ticker/caption synchronisés, sans images de crise attribuées incorrectement |
| Image de globe-œil fournie séparément | image verticale, **référence de style** | Europe/Afrique visibles, océans bleu profond, terres lumineuses, nombreuses frontières blanches, très forts arcs bleu-cyan en forme d'œil, rendu photographique stylisé | Terre photoréaliste brillante avec pays cliquables/animés, halo/anneaux cyan, caméra et zones surlignées, sans reproduire une fausse cartographie |

**Limitations de l'analyse** : les contact sheets ont été échantillonnées (~une frame toutes les 5–8 secondes) et une détection des coupes a été réalisée ; elles ne démontrent pas la trajectoire précise de chaque interpolation, effet sonore ni les techniques internes des auteurs. La carte montrée dans une référence est un graphisme, **pas une source de frontières officielles**. La qualité « mondiale » ne peut se décréter sans audition/visionnage sur un vrai reportage.

## 3. Décision d'architecture : NE PAS REFAIRE DES OUTILS EXISTANTS

| Besoin | Technologie appropriée | Pourquoi |
|---|---|---|
| Animation déterministe et montage, offline H.264 et Player web | **Remotion 4.0.542** déjà intégré dans `CreativeEdit.tsx` | Une seule source de vérité : render MP4 + preview web, `useCurrentFrame` |
| Géographie exacte des pays et tracés sur planète vectorielle | **D3 Geo** + **TopoJSON Client** + **World Atlas / Natural Earth** | Projection orthographique et frontières géographiques préexistantes, pas de continents dessinés à la main |
| Globe réellement texturé / matière terrestre / relief visuel premium | **`@remotion/three` + Three.js + `@react-three/fiber`**, à évaluer lors du prochain incrément, avec texture NASA Blue Marble explicite | Ne pas réinventer un moteur 3D/shader ou ajouter un faux « photoréalisme » ; préserver fallback 2D si WebGL/iOS/CI |
| Graphiques/valeurs | Data motion natif paramétrique, puis modules éprouvés (D3 charts, Remotion) | Réutiliser des transformations de données de qualité, pas coder 50 dashboards pauvres |
| Détourage, effets de tracking, génération des séquences complexes | Outils professionnels externes avec export PNG/WebP alpha, ProRes, MP4, etc. | Notre moteur assemble et synchronise ; il ne recrée pas un outil de segmentation ou de génération vidéo |
| Voix, mixage, loudness, silences | Outils de voix choisis par l'humain + **FFmpeg/FFprobe** déjà vérifiés ; DAW professionnel lorsque nécessaire | Ne pas coder un synthétiseur ni modifier une piste approuvée à son insu |

Documentations de référence :
- https://www.remotion.dev/docs/three
- https://www.remotion.dev/docs/three-canvas
- https://github.com/topojson/world-atlas
- https://science.nasa.gov/earth/earth-observatory/collections/blue-marble/
- https://science.nasa.gov/earth/earth-observatory/history-of-the-blue-marble/

**Géographie et autorité** : World Atlas 110 m est une **échelle d'aperçu planétaire**, PAS un registre de 217 pays/territoires ou la frontière juridiquement officielle de tous les États. Elle omet des petits territoires et simplifie des frontières sensibles. Pour zooms/pays/territoires, prévoir source haute résolution (50m/10m), styles de frontières et métadonnées des litiges, licences et dates par source. La présence d'un contour sur une carte ne doit pas constituer une déclaration politique.

**NASA** : l'image jointe est une référence créative, pas une texture autorisée automatiquement. L'étude ultérieure d'une texture NASA doit utiliser le fichier primaire et la politique de réutilisation, avec provenance, crédits, taille et droits tracés. Aucune image NASA n'est intégrée au code à ce stade.

## 4. Sprint 6 — première composition multi-couches codée

**Fichiers** :
- `services/media-renderer/src/GeoStory.tsx` : nouveau composant Remotion indépendant utilisant `geoOrthographic()`, `geoPath()`, `geoGraticule10()`, `geoInterpolate()`, `feature()`, `mesh()`, atlas réel `countries-110m.json`.
- `services/media-renderer/src/CreativeEdit.tsx` : nouveau template `geo_story`, props géographiques et inclusion dans la **même** source utilisée pour le rendu H.264 et le Player.
- `services/media-renderer/creative/render-project.mjs` : transmet les paramètres de géographie **sans réécriture** et n'ajoute pas de chiffres.
- `services/media-renderer/creative/validate-project.mjs` : limites lon [-180,180], lat [-85,85], durée [120,3600], spin [-360,360], métriques finies/étiquetées, route distincte.
- `frontend/web-v2/src/media/CinematicProductionBoard.tsx` : options réellement éditables pour centre, rotation, point d'intérêt, trajet, valeur et **média photo/clip facultatif** ; mêmes paramètres dans l'aperçu et le JSON exporté.
- `services/media-renderer/creative/geo-story.synthetic.example.json` : fixture de démo **fictive** ; aucune actualité réelle.
- Tests de contrat Node + test navigateur Chromium ajouté à `creative-player-smoke.tsx` et `creative/test-player-browser.mjs`.
- Les packages D3/Atlas sont installés dans renderer **et frontend**, avec type packages et lockfile V2 synchronisé.

### Les couches réellement animées en parallèle

1. **Rotation terrestre** : projection orthographique D3 et contours d'un atlas Natural Earth réel, recalculés au frame Remotion (pas un PNG du globe déplacé au hasard).
2. **Œil bleu-cyan** : anneaux concentriques, glow et pulsation indépendants inspirés de l'identité du média, sans copier le fichier envoyé.
3. **Frontières** : couches land, frontières intérieures, graticule et occlusion de l'hémisphère caché.
4. **Arc géographique** : ligne de grand cercle `geoInterpolate()`, révélée au cours du temps ; ne pas présenter ce chemin géométrique comme le trajet réel d'un avion, d'une attaque ou de personnes sans source.
5. **Localisation** : marqueur et halo pulsant à la latitude/longitude **fournie**, cachés derrière le globe si le point est invisible, étiquette fournie manuellement.
6. **Média d'événement fourni** : photographie ou clip dans un cadre indépendant ; une photo d'illustration doit être explicitement légendée comme telle dans une vraie production.
7. **Chiffre fourni** : compteur progressif d'une valeur **choisie et vérifiée** par l'humain, avec label et unité ; pas de récupération automatique de prix/données.
8. **Texte** : accroche, titre et contexte à des temps de lecture distincts, dans une zone à revoir sur TikTok réel.

Toutes les animations sont fonction du **numéro de frame**, sans animation basée sur `setTimeout`, `requestAnimationFrame` ou boucle système divergente entre navigateur et MP4.

## 5. Épreuves avant validation artistique

Les preuves demandées au workflow CI :
- `node --test creative/validate-project.test.mjs` : contrat geo, refus des valeurs fausses et coordonnées hors monde.
- `npm run typecheck` du renderer + `npm ci && npm run build` du Vite frontend, avec une seule copie des modules.
- `geo-motion-intro.mp4` : **150 images H.264** sans médias d'actualité ; vérification 1080×1920, empreintes des stills différentes et provenance d'un exemple fictif.
- `player-geo-frame-0/48/96/138.png` : captures du **vrai Remotion Player Chromium**, contrôle de l'existence de terres réelles projetées, frontières, trajet, point et image importée.
- **Revue visuelle humaine** des captures : globe réellement au centre, arcs lisibles, absence de clipping de chiffres/phrases, pas d'encombrement graphique ni d'image attribuée à une actualité.
- **Ne pas annoncer réussite tant que les CI n'ont pas passé et que les images n'ont pas été examinées.** Les échecs TS/CI sont les demandes de correction, pas des confirmations.

## 6. Critères de production mondiale et prochaine tranche

**P0 :** Rendre le nouveau plan stable (vrai MP4 + vrai Player) avec un comportement perceptible des couches. Corriger performances, types, lockfile, layouts et aperçu jusqu'à verdict vert. Documenter chaque échec.

**P1 — LOOK PREMIUM** : tester `@remotion/three` / Three.js, charger **NASA Blue Marble en source vérifiée**, atmosphère en couches, nuages avec provenance, lumière et shader, anneaux cyan, anti-aliasing, vraie rotation caméra sur 360°, profondeur et frontières alignées. Faire A/B visuel face à l'image de globe fournie. Garder les chemins vectoriels D3 utiles pour l'annotation et fallback géographique ; ne pas recréer WebGL maison.

**P2 — COUNTRY FOCUS** : arrivée caméra sur pays et projection qui suit une géolocalisation exacte, frontière à 50m/10m si nécessaire, extrémités d'arc, photos documentaires et labels non gênants, contrôle territorial/juridique.

**P3 — DATA MOTION** : compteurs, time series, bar charts, heatmap, classement, courbe type « Bourse Express », plusieurs couches visibles et cohérentes, animations d'entrée/sortie liées à la voix sans données inventées.

**P4 — PHOTO + GEO** : mise en scène d'une seule photo (masques / 2,5D / caméra / focus / texte / zoom pays), et combinaison d'une géographie + photo+ clip + chiffres en un seul plan, avec écoute de la voix choisie librement.

**P5 — DESIGN SYSTEM & QA** : profils TikTok/iOS/Android, comparaison taille réelle, polices multilingues, contraste, tests 0–2 secondes, cohérence du mouvement et limiter les effets gratuits ; métriques de réalisation, images de contrôle et revue humaine.

**P6 — PRODUCTION** : cache et versions des plans, fichiers importés en stockage privé/authentifié, droits, crédits, export reproductible, commentaires de correction dans le Content OS **audiovisuel uniquement**.

**P7 — VRAI REPORTAGE** : à partir d'un script et de sources autorisées, créer plusieurs versions cinématographiques, les regarder en MP4 et sur iPhone, écouter/finir l'audio, conserver seulement celles qui atteignent notre exigence. La viralité n'est ni garantie ni déduite de la beauté du globe.

## 7. Invariants de reprise pour tout nouveau chat

- Branche et PR #44 **isolées**, aucun merge/deploy/push BAOCOM.
- Scripts et recherche ici ; le logiciel orchestre **motion, assets, voix libres, mix, montage**.
- **Vérifier le HEAD et le dernier workflow CI** : ne pas croire un vieux verdict après nouveaux commits.
- Les MP4 fournis par l'utilisateur sont des références privées ; **ne pas les ajouter au dépôt ni inventer leur méthode de fabrication**.
- L'image œil/globe du propriétaire est une **référence de style** ; ne pas se contenter de faux continents, mais ne pas promettre un photoréalisme NASA si seule la composition D3 vectorielle existe.
- Documenter réalisations, erreurs, preuves, limites, prochaines tâches, sans « MVP minimal » au détriment de la qualité.
