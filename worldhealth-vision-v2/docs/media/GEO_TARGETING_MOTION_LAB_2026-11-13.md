# World-Vision — laboratoire de rotation géographique (reprise après coupure du chat)

**Date : 13 novembre 2026.**  
**Branche canonique :** `feature/world-vision-media-studio` ; PR média #5 (brouillon, non fusionnée).  
**Statut du livrable :** prototype **Canvas 2.5D interactif, orientable par pays**, connecté à un identifiant ISO3 d'actualité quand disponible. **Ni CGI satellite 3D validée, ni vidéo MP4, ni émission mise en ligne.**

## Pourquoi ce jalon est le bon suivant

La création de belles images D00-v5/v6 a établi une direction esthétique intéressante, mais une image fixe générée n'offre **aucun contrôle rigoureux de la rotation**, de la carte et des frontières. Il faut un moteur déterministe qui sait associer *une actualité → une destination géographique*, avant de remplacer son dessin vectoriel par le globe cinématographique de production.

**Ne pas effacer le travail précédent :** G0 logo bleu officiel validé ; G1 D00-v6 encore en revue ; anciennes variantes A/B/C refusées ; MP4 COP31 refusé 1/10 ; six maquettes D00–D05 fixes restent une archive comparative et ne deviennent pas subitement approuvées.

## Code implémenté

| Chemin (relatif à `frontend/web-v2`) | Rôle |
|---|---|
| `src/media/geoTargeting.mjs` | Fonctions pures : normalisation des longitudes, vérification latitude/longitude, easing cinématique, interpolation sphérique (grand cercle) avec cas particuliers anti-méridien et antipodes, ciblage depuis le fichier GeoJSON national |
| `src/media/geoTargeting.d.mts` | Déclarations TypeScript pour réutiliser exactement les fonctions pures dans React et un futur outil de composition |
| `src/media/geoTargeting.test.mjs` | Tests Node sur la carte réelle, ISO3 Gabon/Mali/Niger/Japon/Fidji, dateline, antipodes, géographie manquante, erreurs fail-closed |
| `src/media/GeoGlobe.tsx` | Support de l'orientation `centerLon/centerLat`, mode espace, atmosphère lumineuse et **vrais polygones de frontières** réprojetés depuis `countries.geojson`; la signature artistique officielle D00 reste distincte |
| `src/media/GeoTargetingLab.tsx` / `.css` | Laboratoire 9:16 tactile : pays ISO3, bouton de rotation, scrub manuel, recentrage, précisions scientifiques et état du dossier réel |
| `src/media/GlobeDirection.tsx` | Intègre le laboratoire **sous** les six maquettes d'étude ; passage `story` depuis `CreativeDirections` et `ReviewStudio` |
| `media-preview-smoke.mjs` | Test sur navigateur iPhone : charger >190 destinations GeoJSON, Gabon, mouvement progressif, redémarrage, Mali, captures PNG spécifiques |
| `.github/workflows/media-studio-ci.yml` | Exécute les tests du ciblage `node --test src/media/geoTargeting.test.mjs`, la compilation TypeScript/React et les autres suites média |

### Contrat actuel

Entrée : `story.country_iso3` valide et présent dans le GeoJSON local (`GAB`, `MLI`, etc.). Sans pays valide, **pas de destination inventée**, et l'utilisateur peut choisir un pays d'**essai**. Sélectionner un pays à la main n'altère pas le dossier éditorial réel.

Données : `frontend/web-v2/public/countries.geojson`, fichier V2 du projet. Les noms et polygones sont des **références cartographiques de démonstration**, avec certains territoires et limites disputés ; elles ne constituent pas une déclaration diplomatique. Les pays non pris en charge restent absents de la liste.

Mouvement : `interpolateGlobe(START_POSE,target,progress)` suit une interpolation sur la sphère, avec easing quintique ; le `requestAnimationFrame` du laboratoire n'exécute un rendu que si demandé. Une nouvelle actualité stoppe le mouvement précédent. Les `reduced-motion` permettent de manipuler une position manuellement.

**Précision spatiale :** la destination `lon/lat` est actuellement un point géométrique représentatif **approximatif** du pays, pas le lieu événementiel ni une ville géocodée/confirmée. Les prochains développements doivent pouvoir prendre un `event.lat/event.lon` de source vérifiée, et ne jamais fabriquer la ville ou le quartier.

**Limitation performance :** le globe de démonstration Canvas reprojecte des pixels, et les frontières vectorielles complètes sont tracées près de l'arrivée pour préserver la fluidité. Ce n'est pas la solution définitive de rendu photo/vidéo ; mesurer et remplacer par un pipeline de rendu géométrique/GLSL/Blender benchmarké.

## Conditions de tests / preuve

- CI média `World-Vision Media Studio CI` : compilation React TypeScript, `node --test` géographie et autres six jobs média ; vérifier le résultat du dernier HEAD avant de parler d'un statut vert.
- Preview : workflow `World-Vision Media Studio real-UI mobile preview` **build React**, test Playwright iPhone et desktop, capture `media-globe-motion-lab-iphone.png` et publication sur la **même branche permanente** `whv-media-studio-browser-preview`. Toujours contrôler `preview-deployment.json.source_commit` ainsi que le résultat du run avant de déclarer l'aperçu synchronisé.
- L'aperçu est **statique et en lecture seule**. Aucun backend de surveillance des actualités, aucun service voix et aucune publication réseau n'est hébergé dans ce site GitHack.

## Étapes à réaliser ensuite, dans cet ordre

1. Faire essayer la sélection et la rotation dans le **laboratoire mobile** ; tenir compte des corrections, en particulier lisibilité des pays sahariens, effet atmosphérique et fluidité des appareils modestes.
2. **G1 D00** : transformer la belle image conceptuelle en un **master 1080×1920 reproductible en CGI** : Terre fidèle, blancs de l'œil `#FFFFFF`, deux arcs correspondant au vrai logo, halo cyan atmosphérique plus visible, frontières GIS fiables, couvert nuageux allégé. D00 reste non validé tant que l'utilisateur ne l'a pas expressément approuvé.
3. Remplacer le `GeoGlobe` du laboratoire par un moteur 3D rendu par **Three.js/WebGL ou Blender**, mesuré et testé avec Remotion. **Ne pas choisir simplement le plus spectaculaire sur papier**, vérifier le rendu exact, les droits des textures et le temps.
4. D01 : poser deux frames et un micro-clip **3–6 s** du globe tournant vers le pays d'une actualité, sans saut, sans fausse frontière ni apparition d'un second pays arbitraire ; demander approbation humaine.
5. D02–D05 : zoom approprié (pays/ville si vérifié), passage aux **vraies images sous droits**, décryptage et sortie. Prendre le mode `single_location` par défaut ; `related_locations` et `global_overview` uniquement si le récit le justifie.
6. Ensuite, audition de **trois voix naturelles** sur le même texte français, choix humain, diction, alignement mot à mot, voix off, sous-titres, banque de rushes, montage Remotion/FFmpeg et normalisation sonore.
7. Logo officiel discret à positionner en comparaison (haut gauche candidat, pas encore approuvé), contrôles iPhone, QA image/son, packaging, approbation et diffusion officielle avec preuves.

**Document de référence exhaustif :** [AUDIOVISUAL_PRODUCTION_MASTER_PLAN_2026-11-13.md](AUDIOVISUAL_PRODUCTION_MASTER_PLAN_2026-11-13.md), qui conserve les **9 parties du PDF original de 137 pages**, les 14 étapes du logiciel et les 4 compétences de montage.

## Points non déclarés comme terminés

Aucune nouvelle vidéo cinématographique ni 3D temps réel WebGL, aucune validation esthétique D00, aucune émission générée à partir d'une source en direct, aucune voix naturelle auditionnée, aucun backend TikTok/WhatsApp connecté. Les bords nationaux du prototype doivent encore recevoir un audit géographique plus poussé, notamment sur les frontières disputées.

**Reprise après conversation saturée :** lire ce fichier, `docs/continuity/CURRENT_STATE_AND_NEXT_STEP.md`, `WORK_JOURNAL.md`, `DECISION_REGISTER.md`, puis vérifier les commits CI et le manifeste de preview. Ne jamais recommencer de zéro ni valider un plan automatiquement.
