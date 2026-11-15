# World-Vision V2 — Œil lumineux + Terre interactive, référence du 15 novembre 2026

**Objet.** Réalisation demandée par le propriétaire à partir de son image portrait :
une Terre saturée (mers bleu royal, Afrique centrale vert foncé, Europe vert vif,
Sahara et péninsule Arabique orange/ocre, bordures nationales blanches),
entourée d'un liseré atmosphérique cyan, dans un **œil à sclère blanche et deux grands
arcs bleu néon** sur fond bleu nuit.

## Source de vérité

- Dépôt : `OBIANG5/World-Health-Vision`.
- Branche source canonique : `v2` au commit `37aa828163f77f77600a12361ec2ffbb8176b6d9`.
- Branche de travail : `design/v2-photographic-eye-globe-2026-11-15`.
- Aperçu isolé : `whv-v2-reference-eye-browser-preview`.
- URL de prévisualisation : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-v2-reference-eye-browser-preview/index.html
- URL de production stable (non modifiée par cette branche) :
  https://world-health-vision-v2.vercel.app

**Ne pas mélanger cette branche avec `design/v2-global-intelligence-editorial-2026-11-14`**
(refonte générale rejetée par l'utilisateur), ni avec le média audiovisuel.
On conserve exactement les fonctionnalités de la V2 Electric Earth.

## Détails du rendu

### 1. `src/components/map/earthVisualTexture.ts`

- Génère **localement** une carte de masque des terres à partir du même GeoJSON
  que la sélection des pays. Les polygones traversant l'antiméridien sont
  dessinés avec répétition sur trois copies pour éviter les bandes parasites.
- Produit une texture equirectangulaire déterministe de `1152 × 576` pixels
  utilisant des variations procédurales, avec nuances géographiques simples
  pour forêt tropicale, savane, Sahara, Arabie, Afrique australe et chaînes
  montagneuses. **Il s'agit d'une interprétation graphique et non d'une image
  NASA, d'une carte météo ou d'une mesure climatique.**
- Echantillonne cette texture à chaque dessin sur une **sphère orthographique**
  en utilisant l'inverse géométrique lié à la pose courante de la Terre.
  La texture tourne **avec** la planète ; il ne s'agit pas d'un calque figé.
- Lumière centrale et bord sombre pour donner l'illusion de volume. Aucun
  réseau externe, cookie, tracking ni API météo ajoutés.
- Valeurs visuelles calibrées sur l'image : océan autour de `#002063` / `#0348a0`,
  Congo autour de `#0d7a25`, Sahara autour de `#f29b35`, atmosphère
  `#05eaff`, sclère `#fff`, espace `#00051e`.

### 2. `src/components/map/GlobeMap.tsx`

- Remplace uniquement les fonctions de dessin, pas le modèle géographique.
- Trace la sclère blanche et deux rubans indépendants courbes, remplis d'un
  dégradé électrique cyan/bleu, bords lumineux et halo.
- Place ensuite la Terre texturée au-dessus du blanc, dessine les mêmes polygones
  avec bordures blanches et surbrillance sélection/hover, puis le liseré atmosphérique.
- Position initiale conservée : `lon:12, lat:8` (Afrique/Europe/Moyen-Orient).
- Interaction conservée sans adaptation : toucher un pays, sélectionner,
  glisser pour tourner, pincer/zoomer, clavier, auto-rotation temporisée et
  respect de `prefers-reduced-motion`.
- Rayon adapté au ratio de l'image : `min(width×0.435, height×0.405)`
  (également appliqué à l'inverse-projection des clics).

### 3. `src/styles/reference-eye.css`

- Style dédié **après** les thèmes V2, sans changer le reste du front.
- Agrandit la fenêtre de globe portrait sur mobile à
  `clamp(314px,104vw,430px)`, puis recalcule la position du panneau mobile.
- Variante pour les écrans de faible hauteur afin de préserver l'accès aux outils.
- Améliore les commandes de zoom, les indications discrètes et le contraste du halo.

### 4. Vérifications

- CI `.github/workflows/whv-v2-photographic-reference-eye.yml` :
  `npm ci`, `tsc -b`, `vite build --base=./`, Chromium,
  `globe-smoke.mjs`, `reference-eye-smoke.mjs`.
- Vérifie sur iPhone 390px, iPhone 320px, tablette 820px, desktop 1440px :
  blanc, bleu profond, cyan, vert, sable, nuit ; vraie géométrie, un seul globe,
  sélection de pays, rotation, zoom et captures réelles.
- Publication de la prévisualisation uniquement **après succès des tests**
  sur une branche propre, sans modifier `main`, `v2` ni Vercel production.
- Les fichiers `preview-mobile-reference-eye.png` et
  `preview-desktop-reference-eye.png` constituent des captures du navigateur,
  pas des maquettes inventées.

## Limites honnêtes et étapes ultérieures

La source utilisateur est une illustration à fort détail photographique.
La texture actuelle est **procédurale**, fidèle à sa palette et à sa composition,
mais ne peut pas prétendre reproduire pixel pour pixel les véritables reliefs,
nuages et sols. Pour atteindre une fidélité photographique supplémentaire,
il faudra une texture terrestre mondiale de référence officiellement réutilisable
(NASA Blue Marble/Natural Earth avec attribution et contrôle de licence) et
une projection GPU/optimisation thermique iPhone si la rotation devient lente.

Avant fusion ou mise en production : regarder réellement le rendu sur iPhone,
contrôler la position et les dimensions de l'œil, le défilement des raccourcis,
les coordonnées et le toucher dans plusieurs pays. **Aucune approbation
graphique ou connexion aux données live n'est présumée par les tests verts.**
