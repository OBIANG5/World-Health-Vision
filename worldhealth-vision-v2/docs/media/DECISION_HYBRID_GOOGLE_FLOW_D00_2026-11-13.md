# World-Vision — correction du centrage et pivot hybride Google Flow + moteur géographique

**13 novembre 2026 — décision en discussion, aucune validation d'abandon ni nouveau film Flow produit.**

## Pourquoi le rendu actuel déçoit

Le MP4 D01-Gabon de 4 secondes a effectivement été généré, mais **il est seulement techniquement valide** (export H.264, trajectoire, frontières réelles). Son rendu n'est pas la même direction visuelle que la **référence originale D00-v6** :
- Un JPEG de topographie NASA projeté sur un shader sphérique WebGL n'est **pas** identique à l'image artistique développée dans le chat (saturation, nuages, contours, océan, composition œil, halo). Le rendu a été techniquement simplifié.
- Les deux paupières ont été **reconstruites arbitrairement en SVG**, au lieu d'être reproduites pixel à pixel ou tirées d'un asset vectoriel verrouillé ; leur finesse, forme et importance perçue restent à valider.
- **Défaut précis de centrage** : dans `CinematicEarth.tsx`, le WebGL `gl_FragCoord` a son origine **en bas**, donc `H*.48` représente une position visuelle à **52 % de la hauteur depuis le haut** ; les frontières Canvas étaient effectivement dessinées à **52 % du haut**. Ces deux centres **étaient alignés entre eux** (ne pas les déclarer comme deux défauts distincts !), **mais l'axe de symétrie de l'œil** se situait au niveau SVG y=875/1600 (puis viewport `meet`), légèrement plus bas. D'autres facteurs esthétiques accentuaient visuellement la dissymétrie.
- **Correctif source déjà appliqué** : centrer **tous les éléments sur 50 %** : WebGL `H*.5`, frontières `h*.5`, SVG œil centré en `y=800` (viewBox hauteur 1600), avec test navigateur contre la régression dans `media-preview-smoke.mjs`. Commits `9882b5d266af141410d20d4c48fa0dfdd6205386`, `14abd484e465bed7fc663d62c5addf3f266dc219`. Ne pas annoncer la version mise en ligne avant vérification du build/manifest.
- **Ce correctif de centrage ne restaure pas à lui seul la beauté artistique**. La géographie et l'apparence sont des problèmes distincts.

## Stratégie alternative, plus rapide à tester, sans repartir de zéro

**A. Un premier test de signature de 4–6 secondes dans Google Flow, en se basant sur l'image existante**, sans redessiner l'œil. On utilise l'option officielle **Frames → Start frame** (image D00-v6 originale, SHA-256 `8d9a9d20f20fbf7757713b6f5eab06590f191166eb779865747f0f59683cfca2`) pour animer *seulement* une respiration lumineuse de l'atmosphère et un micro-mouvement lent. L'œil garde deux arcs, blanc `#ffffff`, centrage strict, ciel sombre, étoiles rares. Exiger **aucun déplacement des lignes nationales**, aucun remodelage des continents, aucune inventivité documentaire, aucun soleil/nuage extérieur, pas d'ajout de texte/logo. **Risque avéré** : la génération Flow est *probabiliste* et peut modifier des frontières ; toute scène doit être revue image par image. Ce résultat n'est **pas** une preuve cartographique.

**B. Pour que la Terre tourne réellement vers le pays de la nouvelle**, conserver `geoTargeting.mjs` et les frontières vérifiées, idéalement **une scène séparée déterministe** (Blender ou Three.js/WebGL) au lieu de demander à Flow d'inventer une carte cohérente tout au long d'un travelling. On peut faire une transition stylisée de l'ouverture Flow à la caméra 3D, puis zoom vers la cible ; si les raccords ne sont pas convaincants, réviser le système visuel **avant** de monter davantage. Ne pas promettre qu'un mélange Flow + WebGL éliminera mécaniquement toutes différences de textures.

**C. Plus tard et sans sauter les étapes :** médias authentiques + sources et droits, script fact-checké, auditions de trois voix françaises, alignement, sous-titres SRT, montage Remotion/FFmpeg, QA iPhone, validation humaine, publication autorisée. Conserver la structure du manuel PDF de 137 pages et les 14 étapes Media Studio. Pas de nouvelle production longue avant démonstration cohérente.

## Accès Google et coûts à ne pas inventer

L'utilisateur indique disposer de Google AI Pro. Les pages publiques Google (13/11/2026) présentent **1 000 crédits Flow/mois** pour Google AI Pro, avec aussi des **50 crédits/jour** soumis à conditions, et des modèles Omni Flash/Veo et un mode Frames-to-video sur le Web. Voir :
- https://support.google.com/flow/answer/16526234?hl=fr
- https://support.google.com/flow/answer/16352836?hl=fr
- https://support.google.com/flow/answer/16353334

Ne **pas** supposer que ce forfait inclut une clé API vidéo, un accès direct Flow depuis ce chat ni l'utilisation sans coût. Vérifier dans son interface modèle, format, durée, crédit exact avant lancement ; une requête peut consommer plusieurs générations. L'utilisateur peut animer l'image dans son compte puis transférer le clip par fichier, Drive ou GitHub pour QA, versioning, montage.

## Prompt version 1 à essayer avec Frames → Start frame

> Use the exact uploaded first frame as the immutable visual reference. A huge detailed photographic Earth is perfectly centered inside a monumental eye shape formed by exactly two very wide upper and lower eyelid arcs. The sclera is pure bright white (#FFFFFF). The atmospheric cyan-blue light scattering on the Earth's rim is brighter and more visible than the eyelid arcs. Realistic Earth geography, especially Sahara and Sahel national borders, is absolutely stable: do not redraw, morph or invent coastlines, country boundaries or continents. For a single 5-second portrait shot, animate ONLY a slow subtle atmospheric glow pulse and near-imperceptible camera breathing. Keep Earth centered and the eye's two open arcs fixed off-frame. Minimal tiny stars in deep navy space. No city lights, no separate sun, no cloud banks outside Earth, no extra decorative rings, no captions, no watermark, no zoom to a city yet, no sound. Cinematic, premium international news identity, restrained and realistic. The first frame must match the uploaded source.

**Action immédiate concrète :** importer le PNG original D00-v6 dans Flow comme image de début, mode portrait, générer **une seule variante de 4–6 secondes**, inspecter l'image et sa stabilité, puis transmettre le MP4 afin d'en vérifier la fidélité sans coder un nouveau monde artificiel. **Ne pas lancer des générations multiples avant de vérifier la première**.

## Règles de reprise

- Le vrai PNG D00-v6 **existe comme fichier dans la conversation** et était déjà identifié par SHA-256, mais **n'a pas été binaire-committé sur la branche média** lors des audits précédents. Ne pas annoncer qu'une documentation ou une empreinte équivaut à l'archive des pixels. Sauvegarder le PNG original côté source avant modifications.
- Vidéo de démonstration D01/GAB techniquement réalisée et archivée ; elle **reste non validée artistiquement**, ne pas la diffuser comme vidéo World-Vision.
- Ne pas confondre mise au point du premier plan visuel, mouvement géographique, véritable reportage avec voix, et plateforme automatisée.
