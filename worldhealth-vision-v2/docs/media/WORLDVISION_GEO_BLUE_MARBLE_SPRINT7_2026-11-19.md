# WORLD‑VISION — Sprint 7 : Globe photo NASA, lumière, profondeur et continuité des autres motions

**Date :** 19 novembre 2026. **GitHub :** `OBIANG5/World-Health-Vision`, [PR #44](https://github.com/OBIANG5/World-Health-Vision/pull/44), branche `feature/worldvision-cinematic-director-gates-2026-11-19`. PR en brouillon, **aucune fusion / aucun déploiement public**.

## 1. Pourquoi ce sprint existe

Le propriétaire a jugé le premier `geo_story` **beaucoup trop « light »**, et la critique est exacte. Le renderer Sprint 6 prouvait rotation D3, frontières, routes, chiffres, typographie, image/vidéo synchronisés, mais utilisait des continents **remplis par un dégradé vert/jaune purement vectoriel**. Ce rendu **ne reproduisait absolument pas** les océans/reliefs/rivages photographiques, la luminosité cyan extrême, l'aperture de l'œil blanc et le réalisme du globe de la référence **fournie** (`144876CC-3A4C-4214-8995-440697A47FC1(2).jpeg`). Ne pas republier le rendu Sprint 6 en le qualifiant de photoréaliste.

Conserver le projet initial ! L'effort ne se limite PAS à une « animation de globe » : recherche et script font partie des tâches de **ChatGPT ici**. Le studio utilise la narration choisie librement (Vivienne optionnelle), images/vidéos sous droits, et orchestre montage, motion design photo/texte/chiffres/documents, transitions, vrais sons, QA. **BAOCOM est indépendant, pas de fusion GitHub, Content OS global/blog/GDELT attendent.**

## 2. Source autorisée, précision et garde-fous

**Image de Terre** : NASA Earth Observatory, *Blue Marble: Next Generation*, composition saisonnière juin **2004**, **5400×2700**, origine officielle :
https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-base/june/world.200406.3x5400x2700.jpg

Page NASA :
https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-map/

Guide NASA :
https://www.nasa.gov/nasa-brand-center/images-and-media/

- Une saison ancienne illustrant la Terre, **pas une image satellite temps réel**, ni une carte juridique à elle seule.
- `creative/prepare-earth-texture.mjs` **télécharge et authentifie le format/résolution**, copie l'image dans les deux `public/geo` (Remotion et Vite), inscrit son SHA-256 et son crédit dans `.source.json`.
- Pas de reprise de l'image de référence utilisateur comme une fausse texture equirectangulaire ; l'image source reste une **cible esthétique**, non une carte géographique.
- **À faire avant production commerciale stable** : relever le SHA NASA sur le run vert, l'épingler explicitement dans le script d'import et auditer les règles de la NASA (pas de faux partenariat ou logotype NASA).
- Les frontières Natural Earth du `world-atlas/countries-110m` sont **simplifiées** : ne pas présenter des contours politiques controversés comme arbitraires ou pleinement officiels, et ne pas les confondre avec la cartographie de précision 10m.

## 3. Architecture — réutiliser les vrais moteurs, pas reprogrammer une IA

**Avant** : `GeoStory.tsx` utilisait la projection `d3-geo` sur un globe rempli par un simple dégradé. Le même composant servait au Player et au MP4.

**Après** : le nouvel `GeoPhotorealEarth.tsx` affiche **une vraie sphère 3D** texturée NASA, avec :
- `@remotion/three@4.0.542` → `ThreeCanvas` synchronisé à `useCurrentFrame` ;
- `@react-three/fiber@9.4.0`, `three@0.180.0` → géométrie sphérique existante, UV, couleurs, lumière, atmosphère cyan additive ; aucun mini-moteur 3D inventé ;
- Terre orientée à partir des **mêmes longitudes, latitudes et angles de rotation** que le D3 orthographique (alignement exact à **contrôler sur capture**, pas encore un résultat approuvé) ;
- `GeoStory.tsx` garde la projection D3 pour le tracé des frontières réelles, les arcs de grands cercles, marqueurs, chiffres et légendes ; l'image NASA remplace **le remplissage synthétique des terres/océans**, pas les autres couches ;
- une **aperture blanche de l'œil**, entourée de halos bleu-cyan, est maintenant placée *derrière* la planète, conformément à la référence ;
- un voile sombre sous la zone titre évite le texte blanc sur l'aperture claire, tout en conservant le globe lumineux.

Le contract `geo.look` contient `photo` ou `vector`. **Photo est le choix privilégié** et requiert l'image officielle préparée. Vector est une **alternative explicitement choisie**, et non un faux fallback silencieux si l'image NASA manque.

Les dépendances sont épinglées et `frontend/web-v2/package-lock.json` contient l'arbre précis enregistré. La CI utilise ensuite `npm ci` et télécharge la texture dans les deux emplacements pour tests de rendu. Cela reste en branche : **aucune mise à jour du site public**.

## 4. Éléments conservés de tous les sprints précédents

- **Sprint 1** : prise en charge script, images, MP4 externes, audio libre, montage Remotion, JSON export non destructif.
- **Sprint 2** : focus reveal, cadrage, effets 2,5D, mesure typographie, rendu d'un plan seul, audit voix via FFmpeg.
- **Sprint 3** : vrai Player V2, même composant que le MP4, test Chromium, pas de lecteur CSS séparé.
- **Sprint 4** : Player film entier avec succession de plans, transitions et pistes audio, corrections de chevauchement des titres.
- **Sprint 5** : inspection d'une image documentaire réellement fournie, zone géométrique pilotée, pas de faux texte/OCR, premiers contrôles spatiaux des légendes.
- **Sprint 6** : géographie Natural Earth/D3, globe vectoriel, routes, pays, chiffres, médias et titrages multi-couches ; architecture conservée et améliorée.
- **Sprint 7** : matérialité/photo NASA/3D, atmosphère, véritable œil lumineux, réalisme international — encore à éprouver sur des captures et vraies données fournies.

## 5. État de tests — règles strictes

**Anciens runs :** [#44558611669](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44558611669) a conclu SUCCESS pour le sprint vectoriel et son UI ; il ne valide **pas** le nouveau globe NASA. Le premier run d'intégration NASA #44567135931 a validé le build frontend, puis entrepris le MP4 3D et le test Chromium. **Le HEAD actuel doit être vérifié séparément**.

**Vérifications requises avant annonce de réussite** :
1. `npm ci && npm run typecheck` renderer et frontend.
2. `creative/prepare-earth-texture.mjs` retourne un JPG NASA officiel 5400×2700 avec `source_url`, SHA-256, attribution, réplicas dans le renderer + frontend, sans téléchargement d'image aléatoire.
3. MP4 H.264 réel du `geo_story` en 1080×1920, 150 frames, sans remplacer subrepticement la texture.
4. Chromium Player réel (`player-geo-frame-0/48/96/138`) avec **`<canvas>` Three.js présent**, D3 land/borders/routes, marqueur, média, chiffre, titre, sans erreur JS.
5. **Inspection humaine des PNG** : comparer la planète à la photo de référence : continents réels au bon endroit, bord lumineux mais non surexposé, œil visible derrière, relief et couleurs naturels mais vibrants, pas de texte caché par l'œil, cartes photo et chiffres non collisionnants.
6. **Contrôle NASA UV vs D3** : suivre un lieu ou un pays identifiable (Afrique et Europe au centre), vérifier les frontières alignées avec les côtes en tournant.
7. **Dynamique/performance** : deux images différentes ne suffisent pas ; 5–10 images dans la séquence et le MP4 doivent être réellement examinées ; QA Safari/mobile et export H.264 nécessaires avant toute diffusion.

Si un test échoue, noter le message, corriger la cause et re-exécuter. **Une compilation qui passe ne prouve pas le look recherché**.

## 6. Suite intelligente après la photographie NASA

1. **P0** : terminer les tests CI du vrai globe 3D, inspecter le vrai MP4 et corriger sans concession les erreurs visibles (UV, frontières, ombre, halos, ouverture, safe zones, fluidité).
2. **P1** : look de référence : améliorer contraste des océans bleu profond / terres vert/sable / nuages correctement sourcés, atmosphère, reflets, antialias, lumière et taille de globe. Ne pas sacrifier la géographie pour le spectacle.
3. **P2** : geo camera : vrai zoom pays/ville, frontière adaptée au zoom, trajectoire géodésique, relier carte/portrait/texte/numérique.
4. **P3** : scènes photo avec multi-animations simultanées : détourage externe, profondeur 2,5D, zoom/masques/micro-animations, titre/chiffre/carte sur une seule photo.
5. **P4** : data motion inspiré des vidéos de finance : compteur, bar charts, classement, courbes, heatmaps, ticker, graphisme plus travaillé que la référence.
6. **P5** : direction vocal/musique/sound design professionnels avec **voix libre** et mix à l'écoute ; essais de master sans pause artificielle.
7. **P6** : vrai reportage avec **script fourni ici par l'utilisateur/ChatGPT**, images authentiques sous droits, variantes créatives A/B et critique des MP4 sur smartphone.
8. **P7** : retouches non destructives, empreinte et versions par plan, Content OS de **production audiovisuelle seulement**, pas GDELT/blog/BAOCOM.

## 7. Consignes de passation

Dans tout nouveau chat, ouvrir la PR #44 et ce fichier puis examiner **le HEAD**, les résultats CI et les captures. Ne pas repartir de zéro. Ne pas confondre une démonstration cartographique avec un vrai reportage. Ne pas adopter automatiquement une voix, une IA narrative ou une version de globe plus faible sans le dire. Garder le niveau cible **international** : esthétique exigeante, journalistes et sources authentiques, vidéos où plusieurs animations coexistent dans le même plan.

**Aucune promesse de résultat « meilleur au monde » sans comparaison visuelle et sonore effective.**
