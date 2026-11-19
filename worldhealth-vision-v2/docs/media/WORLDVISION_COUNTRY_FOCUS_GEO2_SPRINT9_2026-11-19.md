# World-Vision Media — Sprint 9 / GEO-2 country-focus multi-layer

**19 novembre 2026 — nouvelle branche de travail** : `feature/worldvision-country-focus-10m-multilayer-2026-11-19`.
**Base immuable à l'ouverture** : Sprint 8 / PR #72, commit `29ad06dbb98237e01a7b48c27b62cd00d0cdcd08`.
**Statut** : code dans une nouvelle branche, validation CI/visuelle à enregistrer au fil des preuves. **Aucun merge dans V2 ni déploiement**, aucun reportage réel créé ni publié.

## 1. Le WHY — ne pas confondre globe lumineux et objectif réel

Le propriétaire a donné deux vidéos de référence : finance/« Bourse Express » (94,57 s) et géopolitique (59,49 s), plus une image du globe-œil lumineux. La demande fondamentale est la capacité de transformer **une seule image / carte / photographie en scène avec des animations indépendantes chorégraphiées** : caméra, sujet, carte, silhouettes, marqueurs, texte, data, effets audio — les médias réels et les faits doivent rester exacts.

La PR #72 a installé la Terre NASA 3D, sa caméra et un contour Gabon 110m. L'audit visuel du Sprint 8 constate que le pays reste trop petit et presque noyé par le marqueur/halo. D'où un plan `country_focus` complètement distinct du `geo_story` d'introduction : une carte **agrandie dans son propre espace**, précision géographique adaptée, photo et données en couches superposées. C'est une réponse au problème observé, pas un effet décoratif isolé.

## 2. Implementation / fichiers

- `services/media-renderer/src/country-focus-geometry.mjs` et `.d.mts` : module réutilisable, extraction du **vrai polygone 10m**, contour de voisins **50m**, projection locale azimutale équivalente, ajustement d'emprise et validation d'appartenance géographique d'un marqueur.
- `services/media-renderer/src/CountryFocus.tsx` : nouvel écran de réalisation 1080×1920 30fps (même moteur Remotion pour Player et MP4). Huit couches indépendantes mais coordonnées : environnement, déplacement léger de caméra, contexte géographique 50m, pays 10m remplissage/stroke révélé, marqueur localisé si dans le pays, photographie/clip réellement fourni, détourage alpha externe facultatif, compteur et titres en beats.
- `services/media-renderer/src/CreativeEdit.tsx` : `country_focus` est un template officiel, sans supprimer aucun ancien plan ; fonctionne en film multi-plans / transitions et en preview d'un seul plan.
- `creative/validate-project.mjs` : obligation d'un ID 10m existant, titre bref, au moins 150 frames, exclusion des trajectoires de globe non applicables au pays isolé, coordonnées de marqueur **dans le pays** par `geoContains`, chiffre éditorial finite et explicitement fourni.
- `frontend/web-v2/src/media/CountrySelector10m.tsx` : sélection explicite dans l'atlas 10m, **chargement lazy** uniquement si ce module est utilisé afin de ne pas alourdir le socle du Studio.
- `frontend/web-v2/src/media/CinematicProductionBoard.tsx` : sélection du nouveau template, pays, coordonnées, chiffre et média fourni, pilotage par l'éditeur et export JSON identique au Player.
- `creative/build-ci-fixtures.mjs` : génère un projet Gabon purement **technique**, un paysage géométrique synthétique, son alpha-cutout synthétique, une valeur 42 fictive, aucune photographie d'actualité ni fausse source.
- `creative/validate-project.test.mjs` : géométries réelles 10m/50m, Gabon 266, point Gabon retenu, point Paris rejeté, ID inconnu rejeté, durée et dépendances.
- `creative-player-smoke.tsx` + `creative/test-player-browser.mjs` : vrai `@remotion/player` en Chromium à frames 0/60/115/155, vérification pays 10m, contexte 50m, marqueur, photo, compteur, trace camera et zones sûres sur 360px.
- `.github/workflows/worldvision-cinematic-director-gates.yml` : test Node, typecheck renderer, build du vrai front, master H.264 synthétique country focus, screenshots Player et artefacts.

## 3. Provenance / dimension internationale

Les deux atlas `world-atlas@2.0.2` sont des conversions TopoJSON du projet Natural Earth, édition **4.1.0**. Vérification publique : https://www.npmjs.com/package/world-atlas et https://github.com/topojson/world-atlas ; produit Natural Earth 1:10m : https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/ .
- Cette représentation est **cartographique et de facto**, non un jugement de souveraineté. Consulter https://www.naturalearthdata.com/about/disputed-boundaries-policy/ .
- Les ID numériques ne sont pas une liste exhaustive et incontestable des 217 pays/territoires World-Vision. Les petits territoires, îles séparées, métropoles et zones disputées exigent **une politique de cartographie et une revue**. Aucune carte ne doit être vendue comme frontière diplomatique officielle universelle.
- Les fichiers 10m sont plus lourds que les 110m. Sélecteur 10m chargé à la demande. **Le Player vidéo charge le moteur cartographique complet quand on ouvre l'aperçu Remotion : mesurer le temps d'ouverture**, tester iOS Safari et réviser le découpage bundle si nécessaire.
- Les sources des images/voix/audio restent choisies par journaliste/ChatGPT et leurs droits doivent être contrôlés ; le validateur ne délivre **pas** une licence de publication.
- Une photo de démonstration générée en CI ne doit pas être présentée comme une vraie image du Gabon. Aucune valeur 42 n'est une statistique.
- L'échelle 1:10m du polygone n'est pas une échelle effective de la photographie du fond, **qui est un graphisme d'ambiance**, pas une photo satellitaire.

## 4. Critères de certification, ne pas présumer

- [ ] Actions pour le **HEAD exact du Sprint 9** : tests Node, TypeScript renderer, build V2, rendu photo/alpha et du vrai MP4 country.
- [ ] Rapport MP4 : 1080×1920, H.264, 165 frames / 5,5 secondes et **deux fichiers synthétiques** sourcés, empreintes distinctes.
- [ ] Captures Chromium réellement obtenues 0/60/115/155 : 10m country path et 50m context non vides, zoom de caméra progressif, marqueur dans pays, photo importée, valeur, texte lisible et sans débordement TikTok.
- [ ] **Inspection visuelle réelle** du master 0/82/164 : pays visible et lisible à 360px, contraste maîtrisé, aucun masque/faux document, mouvements utiles ; comparer à l'exigence esthétique des références, pas uniquement au test automatique.
- [ ] Test iPhone Safari/Android sur plusieurs pays géographiques (petit archipel, pays allongé, pays multi-îles, État contesté) et polices multilingues ; si sans preuve, ne pas qualifier comme « validé mobile mondial ».
- [ ] Validation journalistique de l'événement, source originale, date et licence **avant** toute diffusion réelle.

Si échec : mentionner run, SHA, défaut et correction ; relancer, ne jamais effacer les logs.

## 5. Suite intelligente après GEO-2

1. **P0** terminer CI, corriger défauts TS, assertions géographiques et collisions sur mobile ; auditer réellement PNG/MP4.
2. **P0** concevoir la séquence `geo_story -> country_focus -> documentaire/photo` avec une vraie transition de continuité spatiale. Aucune fausse route et pas de carte 110m agrandie jusqu'à une ville.
3. **P1** optimiser la géométrie (index de pays, code splitting et cache par ID et version d'atlas), benchmark Safari/mobile, cas dateline/archipels/disputes et un registre territoire/point de vue. Évaluer l'opportunité d'une source Natural Earth plus récente avec provenance SHA et contrôles.
4. **P1 — la priorité artistique centrale** : pack **PHOTO multicouche** : avec UNE VRAIE photographie fournie, combiner 3–6 mouvements indépendants (caméra, cutout, profondeur, masque, highlights, titre, data) dans un même plan ; comparateur avant/après, montage en vrai MP4 et tests iPhone.
5. **P1** pack DATA de la référence finance : courbes, barres, heatmaps, classements, chiffres avec date/unité/provenance.
6. **P2** voix libre, musique, sous-titres véritablement calés, mastering et revue audio. 
7. **P3** stockage privé et Content OS audiovisuel uniquement quand la production le justifie ; pas de BAOCOM connecté, pas de GDELT/blog dans cette PR.

## 6. Passation hors chat

Dans un nouveau chat : lire `CONTINUITE_WORLD_VISION.md`, ce rapport, `WORLDVISION_GEO_DIRECTOR_SPRINT8_2026-11-19.md` et `WORLDVISION_CREATIVE_EDIT_HANDOFF_2026-11-19.md`. Reprendre **le HEAD exact et le dernier run Actions** ; vérifier la PR Sprint 9 et la PR #72 par ordre. Ne jamais fusionner en bloc dans `v2`. Ne pas sacrifier la continuité photo/data/audio ou les exigences d'un média international.
