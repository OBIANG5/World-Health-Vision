# World-Vision — géociblage d'actualités et prototype de rotation (13 novembre 2026)

**Statut : module technique écrit, tests en CI, validation esthétique séparée.**  
**Branche :** `feature/world-vision-media-studio`.  
**Périmètre :** la brique `D01 — orienter la Terre vers le lieu de l'actualité`, développée **en laboratoire** sans brûler le jalon G1/D00 artistique encore non approuvé.

## Pourquoi cette étape maintenant ?

La demande récurrente du propriétaire est de produire des vidéos dans lesquelles **la Terre se tourne vers le pays concerné par l'information**, et non un générique figé qui montre cinq pays arbitrairement. Avant le rendu 3D final, le trajet, le pays et les frontières doivent être reproductibles, contrôlables et intégrés dans le code. Un fichier vidéo improvisé ne résoudrait pas ce besoin.

Le *design master* du globe dans l'œil provient de l'évolution **D00-v1 à D00-v6** (blanc pur, deux arcs hors champ, halo atmosphérique cyan dominant, pays Sahara lisibles). Ce master n'est **pas remplacé** par l'étude technique ci-dessous, ni validé automatiquement.

## Ce qui est désormais écrit

| Source | Fonction réelle | Limite |
|---|---|---|
| `frontend/web-v2/src/media/geoTargeting.mjs` | Calcul géographique **pur** indépendant de React, normalisation des longitudes, easing quintique, interpolation sphérique par SLERP, construction de points représentatifs par pays à partir des polygones V2, lookup par code ISO3 présent dans un `MediaStory` | Pas encore caméra Three.js, Blender ni trajectoire géodésique de ville |
| `geoTargeting.d.mts` | Contrat TypeScript de ces fonctions pour le client actuel et de futurs rendus | Type statique, pas une API réseau |
| `geoTargeting.test.mjs` | Tests sur interpolation, endpoints, passage par l'antiméridien, cas antipodal, invalidités, **véritables pays** (Mali, Niger, Gabon, France, Japon, Fidji), non-invention d'une cible en l'absence d'ISO3 | Tests géographiques non équivalents à un audit international exhaustif des frontières |
| `GeoGlobe.tsx` | Réutilise le GeoJSON V2; variante bleu espace, atmosphère plus claire, **tracés vectoriels reprojetés sur l'hémisphère visible**, cible ISO3. Les maquettes fixes existantes gardent leur style propre | Canvas rasterisé et projection orthographique, donc **2.5D technique**, pas CGI photo-réaliste ni shader d'ozone |
| `GeoTargetingLab.tsx/.css` | Laboratoire React mobile : le pays du dossier (s'il existe) initialise le sélecteur, choix manuel parmi les pays disponibles, rotation de 4 s, lecture/arrêt/réinitialisation et curseur de progression, indication d'approximation du centre | Ne pilote pas encore un nouveau job Remotion/MP4 ni un serveur permanent |
| `GlobeDirection.tsx` → `CreativeDirections.tsx` → `ReviewStudio.tsx` | Intégration du laboratoire à la page réelle de validation, en conservant **les six anciens plans D00–D05 et leurs avis** | Anciennes poses statiques toujours présentes ; tous leurs textes sont des exemples du sujet COP31 |

## Contrat géographique réellement connecté au type de dossier

Le dossier médiatique `MediaStory` dans `frontend/web-v2/src/media/types.ts` contient déjà `country_iso3` et `country_name`. Le laboratoire compare ce code à la couche `countries.geojson` :
- **ISO3 existant et accepté** : sélection initiale du pays du dossier, puis option de modifier en mode **démonstration** ;
- **ISO3 absent, non standard ou introuvable** : globe neutre, **aucun pays inventé** ;
- **pays à plusieurs territoires** : point intérieur représentatif du **plus grand polygone extérieur** pour éviter qu'un petit territoire d'outre-mer supplante la masse principale ;
- **frontière de la date** : longitude normalisée et interpolation sphérique la plus courte ; antipodes traités sans NaN ;
- **destination d'une actualité réelle** : les **coordonnées précises du lieu de l'événement devront venir d'une source vérifiée**. Le centroïde calculé ici **n'est pas** l'emplacement certifié d'un événement ni la capitale.

**Architecture future recommandée :**
```text
Actualité vérifiée (story_id, pays ISO3, date/heure, sources)
     ↓
Cible éditoriale géographique (country_iso3, lat, lon, précision, provenance)
     ↓
Calcul géodésique déterministe (début / cible / easing / durée)
     ↓
Caméra/globe 3D (shader atmosphère + textures autorisées + limites pays GIS)
     ↓
Remotion (D00 → D01 → D02 → images réelles D03 → explication D04 → D05)
     ↓
Voix approuvée, transcription/calage, sous-titres, mixage, QA, MP4 hashé
```

**Ce schéma est une cible d'architecture, pas une annonce que tous ses composants tournent.**

## Vérifications à exiger

1. CI Node teste la géométrie sans navigateur : `node --test src/media/geoTargeting.test.mjs`.
2. Le build TypeScript/Vite compile les trois composants et leur contrat de types.
3. Le test Playwright iPhone charge la **vraie couche géographique** du projet, voit plus de 190 destinations ISO3, sélectionne le **Gabon**, démarre le mouvement, prend une capture de globe, réinitialise, puis sélectionne le **Mali**.
4. Le même lien permanent `https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/index.html?view=media` est réutilisé pour la publication statique, sans nouveau dashboard générique ; le manifeste `preview-deployment.json` doit afficher le SHA source effectif.
5. La validation utilisateur des six frames et du master 3D reste **distincte**. Ne pas confondre réussite de tests, démonstration de rotation et approbation artistique ou droit de diffusion.

## Limites de qualité et de conformité

- La texture du laboratoire est un coloriage vectoriel issu du GeoJSON, **pas une image satellite NASA**.
- Les frontières du GeoJSON reflètent une **source et une granularité** ; elles peuvent contenir des omissions, des géométries contestées, des îles/small states difficiles à lire et une politique diplomatique implicite. Un audit des droits, de la résolution, des conventions de frontière et des divergences d'affichage devra précéder un reportage international.
- Le point du pays est un centre géométrique calculé, **pas une localisation de l'événement**. Pour un ouragan ou une ville, remplacer ce centre par la position du fait vérifiée et documenter le degré de précision.
- La **lueur atmosphérique** du prototype est une approximation 2D. Le rendu final devra simuler la diffusion dans l'atmosphère (et non confondre visuellement ce halo avec une observation scientifique directe de la couche d'ozone).
- Le globe D00-v6 a été généré dans la conversation ; **son PNG n'est pas dans GitHub** et n'est pas la texture de cette démonstration.
- **Aucune** voix OpenAI, Gemini ou ElevenLabs n'a été auditionnée ici ; **aucun** rendu cinématographique 3D/MP4 n'a été produit ; **aucune** publication TikTok/WhatsApp n'a été déclenchée.
- Aucun rendu local ne doit supposer une machine GPU puissante disponible ; choisir les techniques 3D après essais de performance en lien avec Remotion/FFmpeg.

## Prochain incrément professionnel suggéré

Avant le montage complet, mettre au point un **D00 réellement calculé en 1080×1920** (modèle sphérique, textures jour autorisées, frontières ISO3, deux courbes d'œil et blanc pur séparés, halo atmosphérique lumineux et lisible) ; évaluer sa qualité sur iPhone et le corriger. Puis connecter cette scène au mouvement du moteur `geoTargeting` pour un test **de 3–6 secondes**, sans voix ni source factice. Les étapes de voix, dérushage, sous-titres et mixage restent fixées par `AUDIOVISUAL_PRODUCTION_MASTER_PLAN_2026-11-13.md` et la formation de 137 pages, sans étape sautée.

**Règle permanente :** codes source et commits GitHub, tests CI, capture iPhone, état d'approbation explicite, journal et fichier de reprise après **chaque** incrément ; pas de « fait » sans preuve.


## Confirmation de QA et livraison de l'incrément

**Vérification finale du 13 novembre 2026** :
- `World-Vision Media Studio real-UI mobile preview` [run #43461296086](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43461296086) **completed/success** sur `f0b281889676a20fbefba62fd45cf1fd5c2856ed`.
- Le run confirme les étapes : test Node geotarget, build TypeScript/Vite, test Playwright iPhone et desktop, mise à jour effective de la même branche de preview.
- `whv-media-studio-browser-preview/preview-deployment.json` contient exactement `source_commit=f0b281889676a20fbefba62fd45cf1fd5c2856ed`, `backend_connected=false`, `channel_published=false`, `human_qa_completed=false`.
- [Capture **pendant la rotation**](https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-globe-motion-lab-iphone.png) : nom de destination Gabon, progression, Terre.
- [Capture **à l'arrivée**](https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-globe-motion-arrival-gabon-iphone.png) : pays ciblé, contours vectoriels renforcés, halo ; l'image reste explicitement un **prototype 2.5D**.
- Le raccourci **« Tester le nouveau moteur : la Terre tourne vers un pays »** est visible en haut de `GlobeDirection.tsx` sur l'aperçu du vrai Media Studio.

**Résultat qualité artistique :** cette géométrie technique est **fonctionnelle et vérifiée**, mais encore très éloignée du concept visuel approuvé partiellement (Terre détaillée, blanc pur, deux arcs, atmosphère). Ne jamais faire noter ce prototype comme s'il était la version D00-v6 elle-même. Toute note utilisateur doit être liée à son **artefact et à sa version**.
