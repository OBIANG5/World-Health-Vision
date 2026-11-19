# WORLD-VISION — SPRINT 11 / DATA MOTION DESIGN SOURCE-LOCKED
**19 novembre 2026 — branche indépendante** : `feature/worldvision-data-motion-sourced-2026-11-19`, empilée sur Sprint 10 PHOTO, PR #80 HEAD initial `22d108fdd4e1694975b73146aa15a7325ac04065`.
**Pas de merge V2, pas de déploiement, pas d'actualité publiée ni de chiffre journalistique inventé.**

## 0. Pourquoi — conserver les références créatives et les décisions humaines

Deux vidéos de référence : finance « Bourse Express » (~94,6 s : classements, courbes, nombres, heatmaps) et géopolitique (~59,5 s : pays/cartes/photos), plus globe dans l'œil lumineux. Le propriétaire demande **un média audiovisuel international, un montage vivant avec plusieurs animations simultanées sur le même plan**. Il a explicitement apprécié le rendu GEO-2 Gabon : **« La vidéo du Gabon est belle, très belle. »** Ne pas dégrader cette esthétique acquise. Le moteur PHOTO du Sprint 10 doit rester la base des plans à partir d'une seule image réelle.

Le pack DATA ne doit pas être un gadget financier : il doit représenter de vraies statistiques d'économie, santé, démographie, géopolitique et science avec **méthode, source et unités**, sans fausse précision. La forme de la vidéo « Bourse Express » n'autorise ni ses données, ni ses éléments protégés, ni son logo.

## 1. Architecture effectivement ajoutée

| Composant | Rôle |
|---|---|
| `src/data-motion-core.mjs`, `.d.mts` | Géométrie numérique déterministe, axes à zéro, dates ISO à distances calendaires exactes, phases d'animation séparées, formatage localisé. Aucun smoothing des chiffres. |
| `src/DataMotionStory.tsx` | Quatre compositions vraiment différentes : `trend` (courbe temporelle ou catégorielle), `comparison` (barres positives/négatives, vraie origine zéro), `ranking` (ordre fourni descendant), `heatmap` (matrice 2D et légende numérique min/max explicitement définies). Animation indépendante des courbes/barres, annotations, titre, source et texte explicatif. |
| `src/CreativeEdit.tsx` | Template officiel `data_story` dans la **même** composition Remotion utilisée par Player et MP4. Anciennes scènes GEO/PHOTO inchangées. |
| `creative/validate-project.mjs` | Validation stricte, pas de valeur non finie/absente, date impossible ou non chronologique, classement truqué, matrice incohérente ou échelle de couleur auto inventée, source/définition manquante. |
| `frontend/web-v2/src/media/CinematicProductionBoard.tsx` | Auteur visuel pilotable : choix de graphique, ajout/retrait de mesures, négatifs, axes exacts, saisie matrice par cellule, unité, précision, institution, série, date ISO, méthodologie et URL. **Champs initiaux vides** pour ne pas inventer de statistique par défaut. JSON exporté équivaut à Player. |
| `creative/render-project.mjs` | Transmet `shot.data` au rendu H.264 ; ne pas reproduire le bug du Sprint 10, où les animations PHOTO étaient visibles au navigateur et figées dans le MP4 par oubli de prop. |
| `creative/validate-project.test.mjs` | Refus de données trompeuses + vérification que les dates 1er/3/7 novembre ne soient pas dessinées en positions équidistantes. |
| `creative/build-ci-fixtures.mjs` | Quatre jeux synthétiques clairement qualifiés « DEMONSTRATION FICTIVE », valeurs sans réalité statistique et aucune photographie d'actualité. |
| `creative-player-smoke.tsx`, `test-player-browser.mjs` | Quatre chemins Chromium réels, frames 0/70/140, tracé, barres, cellules, source visible et légende hors surcharges TikTok. |
| `.github/workflows/worldvision-cinematic-director-gates.yml` | Typecheck frontend+renderer, tests Node, 2 véritables vidéos H.264 (courbe et matrice) et 12 captures Chromium, archivées en preuves récupérables. |

## 2. Contrat de vérité et visualisation

`data_story` porte `data:{kind,unit,precision,xMode?,points?,matrix?,source,synthetic?}`.

**Source obligatoire** : `publisher` (éditeur), `dataset` (jeu ou rapport précis), `asOf` (date ISO), `methodology` (définition de l'indicateur), `url` HTTPS facultative. Le fait d'écrire ces champs **ne valide pas une donnée**, ses droits ni la fiabilité de son éditeur. Avant reportage : vérification humaine des chiffres, périodes, définitions, incertitudes, licences et contrôles contradictoires de plusieurs sources.

**Courbe** : `xMode=date` exige de vraies dates ISO calendaires et un placement **proportionnel au temps réellement écoulé** ; `xMode=category` implique des catégories équidistantes sans prétendre à l'écoulement du temps. Les observations sont reliées par segments bruts ; ne jamais inventer les données entre les points ni nommer cela une estimation.

**Comparaisons / ranking** : même unité et méthode présumées pour tous les points (doivent être vérifiées éditorialement), barres partant de zéro et négatifs conservés. Le moteur refuse un classement fourni dans un ordre incompatible avec « rang » au lieu de le reclasser silencieusement.

**Heatmap** : valeurs par rangées et colonnes, légende min/max fournie, toutes les cellules dans l'intervalle. C'est une matrice numérique ; ne pas l'annoncer comme carte géographique.

**Typographie** : titre présent dès l'ouverture, chiffre et source en zones sûres, sous-titre après la narration graphique. Plusieurs couches peuvent s'animer en parallèle, mais aucune surcharge automatique pour atteindre un nombre d'effets.

## 3. Test et limites — contrôler le HEAD exact

**Premier run lancé** : [Actions #44631915738](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44631915738) sur commit `7fa0a917046c521e7e049ac26e14c636136e7b47` ; statut **à consulter après exécution**, ne jamais le qualifier vert sans l'avoir vu. Un commit ultérieur changera le HEAD et nécessitera un run sur ce HEAD.

Checklist de certification :
- [ ] Tests numériques/dates/validation réellement passés.
- [ ] Build TypeScript V2 et Remotion réussi, aucune dégradation du Studio / imports.
- [ ] Vidéos H.264 réelles de `trend` et `heatmap` : 1080×1920, 165 images, SHA de stills distincts.
- [ ] Chromium : quatre modes `data-trend`, `data-comparison`, `data-ranking`, `data-heatmap`, captures frames 0/70/140 et aucune erreur JS.
- [ ] **Inspection réelle des pixels** : lisibilité à 360×640, titre, source, valeurs et contraste ; rien ne recouvre les textes ni ne sort des zones TikTok ; comparer à la grammaire DATA de la vidéo de référence.
- [ ] Essais iPhone Safari/Android Chrome, internationalisation, typographies RTL, nombres très longs/négatifs et très petits, dates non régulièrement espacées.
- [ ] Vraie série statistique autorisée et approuvée par une rédaction, avant de dire que le module sert en reportage réel.

**Limites de ce Sprint** : pas de flux de données live, pas de trading signal, pas d'API externe, pas de vérification automatique d'un chiffre, pas de géocodage, pas de génération journalistique ; scripts/actualités/sources restent ChatGPT + humain pour le moment. Pas de visuels de presse sans droits. BAOCOM indépendant, GDELT et blog différés.

## 4. La suite la plus intelligente, et la passation inter-chat

1. **Résoudre tous les échecs de CI du Sprint 11**, sans prétendre qu'ils n'ont pas existé ; contrôler les vidéos et screenshots source par source.
2. **Finir les vérifications Sprint 10 PHOTO** sur sa dernière révision, converger les PR photo #79/#80 en **un seul template actif** (actuellement #80 a le contrat pur et l'attribution numérique ; #79 est l'alternative historique). Ne fusionner aucune PR avant validation.
3. Corriger les défauts visuels réellement observés de DATA, pas multiplier arbitrairement les effets.
4. Construire **un film narratif complet GEO → PAYS → PHOTO → DATA → DOCUMENT → VOIX**. Le script doit être approuvé et chaque élément réel/voix/licence traçable. Vérifier raccords, bruitages, ducking musical, loudness, sous-titres synchronisés et qualité mobile.
5. Puis pack Audio/Editorial, profils multi-format (TikTok/Reels/YouTube/Blog vidéo) et Content OS audiovisuel seulement quand il apporte de la valeur au montage.
6. Toute reprise doit lire `CONTINUITE_WORLD_VISION.md`, ce document, [Sprint 10](WORLDVISION_PHOTO_MULTILAYER_SPRINT10_2026-11-19.md), [Sprint 9](WORLDVISION_COUNTRY_FOCUS_GEO2_SPRINT9_2026-11-19.md), les PR #44/#72/#74/#80 et le **dernier HEAD GitHub Actions**. Ne jamais supposer un déploiement public.

**Ordre de priorité retenu :** qualité journalistique → qualité art/son → rendu réutilisable → fiabilité de sources → performance mobile → automatisation industrialisée.
