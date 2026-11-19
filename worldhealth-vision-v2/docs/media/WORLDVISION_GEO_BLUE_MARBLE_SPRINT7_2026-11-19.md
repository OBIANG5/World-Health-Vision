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


## 8. Premier audit de pixels 3D — détection d'un vrai problème de rendu et correction

**Première CI NASA réellement réussie :** [GitHub Actions #44567135931](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44567135931), **deux jobs SUCCESS**, compilation Studio V2, **14 tests Node, 0 échec**, rendu H.264 1080×1920 et test Chromium des cinq chemins. Artefact `worldvision-creative-compositor-demo`, id **14553635432**, téléchargé, extrait, revu visuellement. **SHA NASA mesuré** : `dc059529b8ed1cfcdd59747a7c3f259c93c1322bf88ca1ec8bab1dd71fcc57f5`, 1 692 239 octets, image officielle 5400×2700. Ce SHA est désormais **pinné dans `prepare-earth-texture.mjs`** pour éviter un remplacement non contrôlé de source.

**Défaut artistique majeur objectivement détecté** sur `player-geo-frame-96.png` : la Terre apparaissait comme un **disque bleu cyan presque uniforme**, malgré le vrai modèle 3D et la présence de la texture NASA. Causes identifiées dans `GeoStory.tsx` : les deux **anciens cercles de fond SVG du mode vectoriel** (`r=418` cyan 35 % et `r=405` cyan 70 %, floutés) étaient encore peints **PAR-DESSUS la Terre 3D**. L'ancien code cachait donc les vrais déserts, forêts et océans ! Un test de présence de `<canvas>` ne détectait pas cette erreur : la revue des vrais pixels était nécessaire.

**Correction en code** : en mode `geo.look="photo"`, les anciens disques SVG sont désormais **`fill="none"`** et deviennent seulement des **liserés lumineux** avec `stroke`, tandis que les formes D3 des pays ne repeignent pas les textures NASA. L'aperture de l'œil blanc/cyan se situe derrière la sphère. Les contours, marqueurs, trajets et valeurs gardent leurs animations indépendantes.

**Deuxième correction artistique** : la Terre photographique et la carte D3 sont agrandies de **r=399 à r=463** et recentrées à **(540,690)** ; `GeoPhotorealEarth.tsx` et tous les tracés de `GeoStory.tsx` utilisent les mêmes nouvelles dimensions. Les ellipses bleu-cyan sont également redimensionnées pour approcher le globe-œil de la référence et remplir beaucoup mieux la largeur 9:16, sans avoir recours à une fausse perspective.

**Limite critique** : ce correctif est codé mais **la nouvelle sortie 3D doit encore être reconstruite et visuellement revue** (source, profil colorimétrique, qualité des océans, alignement NASA-D3, cadrage des textes, occultation du globe, performance). Ne pas déclarer le rendu photoréaliste final accepté tant que les nouvelles captures ne le prouvent pas. Les tests art automatisés vérifieront encore la présence 3D, mais la *justesse esthétique* nécessite aussi un jugement sur les pixels.

**Définitions de qualité non négociables** : pas de fausse image d'événement, pas de chiffres supposés, pas de données actuelles présentées comme issues d'une NASA 2004 ; couleurs lumineuses et relief lisible avec géographie réelle ; titres lisibles à la taille réelle iPhone, sans masques de plateformes ; un seul code Remotion partagé pour Player & MP4 ; BAOCOM indépendant, aucune voix imposée.



## 9. Vérification réelle du 19/11 : troisième passe artistique (photo, contraste, cadrage)

**Preuve réellement inspectée : [CI #44570563468](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44570563468), deux jobs SUCCESS, 14 tests Node passés (0 échec), MP4 H.264, Player Chromium sur vrai WebGL.** L'artefact `worldvision-creative-compositor-demo` ID **14554203898** a été téléchargé et décompressé. Les captures `player-geo-frame-96.png` et `geo-motion-intro.mp4.stills/frame-03-at-149.png` ont été ouvertes et comparées au globe-œil de référence de l'utilisateur.

**Résultat constaté sur les VRAIS pixels, pas simplement la compilation :**
- La photo NASA apparaît nettement : terres du Sahara, Europe, Afrique subsaharienne, mers et grands contours. Les anciens disques cyan qui la masquaient n'ont pas réapparu.
- La planète est plus grande et recentrée, tout en gardant l’œil blanc/cyan et son contour lumineux derrière la sphère.
- Le **bandeau supérieur** auparavant blanc/illisible sur l'aperture de l'œil est maintenant présenté dans un **rectangle sombre semi-transparent et contrasté**.
- Le **compteur** auparavant visible en cyan clair sur une zone blanche est maintenant situé dans un **cartouche en verre sombre**, avec valeurs lisibles et bord cyan, sans empiéter sur le titre. Si un vrai média importé occupe la carte de gauche, le compteur reste dans cette carte et n'utilise pas le cartouche additionnel.
- La matière NASA subit un **étalonnage artistique paramétrique contrôlé** (gamma léger et saturation) par le StandardMaterial de Three, sans modifier le JPG officiel sur disque ni inventer de continent. L'esthétique est plus vibrante, mais ne doit **pas** être revendiquée comme une colorimétrie scientifique.
- Le titre « LE MONDE EN MOUVEMENT » reste lisible sous le globe. Les extraits de démo « VALEUR FICTIVE/POINT FICTIF » sont explicitement non journalistiques.

**Limites constatées** : ce n'est pas encore une réplique exacte du globe fourni. Il manque en particulier des **nuages correctement sourcés**, des contrastes océaniques aussi profonds et certaines finitions photographiques. Pas de promesse de « meilleur motion design mondial » sur la seule base du test. Les frontières 110m sont simplifiées et ne valent pas des frontières officielles pour tous les territoires. La vidéo test ne contient ni narration ni prise de parole, puisque l'utilisateur choisira ses voix.

**Correction finale de géométrie postérieure au rendu** : une ancienne interpolation de halo gardait `translate(-540 -747)` alors que le centre avait été déplacé à `[540,690]`. Le code a été corrigé pour centrer le halo exactement sur le globe. Les deux cercles de lumière portent désormais `data-wv-geo-rim` et `data-wv-geo-neon-rim`, et le test Chromium bloque tout retour de remplissages opaques `fill != none` ou de centre erroné.

**Dernier contrôle après cette correction** : [GitHub Actions #44571505052](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44571505052) lancé sur le nouveau code. **Vérifier les conclusions des deux jobs et télécharger la dernière preuve avant de déclarer le HEAD totalement validé.**

**Productivité de la revue créative** : un workflow spécialisé `.github/workflows/worldvision-geo-art-review.yml` rend désormais directement le globe NASA de 150 frames, vérifie le SHA officiel et conserve MP4/stills, au lieu de devoir attendre TOUS les tests multimédias à chaque ajustement de lumière. Le workflow historique demeure la preuve d'intégration globale Remotion/Player.

### Suivi audiovisuel qui ne doit PAS être perdu

Rien n'a été supprimé de la PR #44 : scripts fournis par ChatGPT/utilisateur, prises photo/vidéo, découpage non destructif, contrôle des visuels et titres, voix optionnelles et audition A/B, `focus_reveal` 2,5D, `document_focus`, `CreativeEdit` et `CreativeCompositionPreview` **partagés**, rendu de film complet, transitions, FFmpeg et audit audio, qualité par séquence. Après certification du globe, les **prochaines tâches artistiques** sont : météo/clouds uniquement avec source et date claires, *country zoom*, une photo avec plusieurs couches indépendantes, animations data/économie, audio/mastering, plusieurs montages d'un vrai reportage et contrôle iPhone/TikTok. **Content OS audiovisuel uniquement**, pas de BAOCOM intégré, pas de GDELT/blog global.

