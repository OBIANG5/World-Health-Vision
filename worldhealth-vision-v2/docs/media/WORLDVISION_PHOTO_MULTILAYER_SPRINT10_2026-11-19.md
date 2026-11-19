# WORLD-VISION MEDIA — Sprint 10 / PHOTO MULTILAYER DIRECTOR

Date de reprise : 19 novembre 2026. Branche séparée : `feature/worldvision-photo-multilayer-director-2026-11-19`.
**Base** : travail GEO-2 dans PR #74, PR #72 puis PR #44. Nouveau travail **en DRAFT, non fusionné/non déployé**, sans usage de comptes payants, sans images de presse ni publication.

## 0. Définition de la vraie demande — ce qui ne doit jamais se perdre

Le propriétaire a envoyé **deux références vidéo** : une séquence finance (~94,57 s « Bourse Express » : courbes, chiffres, podiums, heatmaps et ticker) et une séquence géopolitique (~59,49 s : cartes, pays, portraits/photos, lieux, dates), ainsi qu'une image du globe dans un œil lumineux. Il veut un **saut majeur dans la qualité du motion design**, surtout la possibilité de produire une vidéo sophistiquée à partir d'UNE image immobile, où la photographie, le premier plan, les effets, la typographie, les chiffres et la bande-son sont choreographiés ensemble mais animés indépendamment.

**Décision active** : ChatGPT+utilisateur recherchent et vérifient les sujets, rédigent les scripts et choisissent les médias pour le moment. Le logiciel reçoit leurs fichiers et orchestre des **outils professionnels existants** (Remotion/FFmpeg, detourage et animations spécialisés externes), ne réinvente ni IA de synthèse, ni After Effects/Fusion, ni voix obligatoire. Vivienne est une option, pas un verrou. **BAOCOM reste indépendant**, pas de publication de son code ; GDELT/blog global attendent. Une référence vidéo n'est pas une ressource sous licence automatique, ne pas la pousser dans GitHub.

## 1. Pourquoi ce sprint a une grande valeur ajoutée

Le Sprint 9 GEO-2 a été **validé techniquement** sur [Actions #44624747361](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44624747361) après revue de sept vraies images. Son référentiel 10m+50m donne un pays exploitable, mais **ce n'est pas à lui seul une réalisation haut de gamme** : photo synthétique et moitié inférieure du 9:16 trop vide. La qualité mondiale ne viendra pas de retouches infinies de cyan, mais de **scènes qui exploitent les vrais médias visuellement**.

Le template historique `focus_reveal` permettait déjà zoom simple, premier plan détouré optionnel et texte, mais ne proposait **pas de contrôle indépendant de plusieurs pistes de réalisation**. Ici chaque piste possède des paramètres/horodatages, et la composition reste la même dans le vrai Player navigateur et dans le MP4.

## 2. Code du Sprint 10

- `services/media-renderer/src/PhotoLayers.tsx` : composant original `photo_layers` à **six pistes distinctes**, chacune déterministe via `useCurrentFrame`, pas CSS autonome. 1) travelling/scale de la vraie image source, 2) masque de révélation conservant les mêmes pixels, 3) PNG/WebP transparent facultatif préparé par un outil professionnel à partir de la même photo, 4) halo/focus d'illustration à coordonnées fournies, 5) compteur de valeur `metric` fournie (aucune recherche automatique), 6) grands titres/sous-titres éditoriaux en beats distincts. Aucun faux événement, visage, chiffre ou crédit n'est inventé par le renderer.
- `CreativeEdit.tsx` : template officiel `photo_layers` dans le même moteur que `focus_reveal`, `document_focus`, `geo_story`, `country_focus` et tout le film.
- `creative/validate-project.mjs` : image originale obligatoire, paramètres de caméra bornés (échelles contrôlées, panoramique +/-120px), reveal dir left/right/up, fenêtres en frames entières cohérentes et dans la scène, halo/focus normalisé et valeur numérique réelle si fournie ; rejette `NaN`, infini, visuel manquant ou vidéo prétendant être une photo.
- `creative/render-project.mjs` : passe le contrat `photo` sans le réécrire dans la vraie sortie Remotion H264.
- `frontend/web-v2/src/media/CinematicProductionBoard.tsx` : choix de photo, détourage alpha facultatif, contrôles indépendants des axes zoom/pan, début/fin, masque et sa direction, position/intensité du halo, libellé/valeur/temps du compteur. Même donnée dans Player réel et JSON d'export.
- `creative/build-ci-fixtures.mjs` : un seul paysage abstrait + découpe alpha synthétique, chiffre fictif 42, aucun événement et aucune photographie journalistique.
- `creative/validate-project.test.mjs` : refus des fausses valeurs/durées et des médias manquants ; anciens templates conservés.
- `frontend/web-v2/src/media/creative-player-smoke.tsx`, `creative/test-player-browser.mjs` : 4 temps du vrai Player à frames 0/50/115/150, mesure effective de l'effet photo, cutout, caméra, reveal, halo, métrique, typographie et captions mobiles.
- `.github/workflows/worldvision-cinematic-director-gates.yml` : exécute tous les anciens scénarios + un vrai MP4 Remotion 1080x1920/165 frames avec média synthétique et archives PNG, MP4, rapports pour revue artistique.

**Contrat de base de la scène :**
```json
{
  "template":"photo_layers",
  "durationFrames":165,
  "media":{"kind":"image","file":"vraie-photo-autorisee.jpg"},
  "foreground":{"file":"meme-photo-detourage-alpha.png"},
  "photo":{
    "camera":{"scaleStart":1.02,"scaleEnd":1.11,"panX":-22,"panY":-8,
      "startFrame":0,"endFrame":130},
    "reveal":{"startFrame":3,"endFrame":68,"direction":"left"},
    "highlight":{"x":0.56,"y":0.44,"radius":0.28,
      "startFrame":38,"endFrame":99},
    "metric":{"label":"CHIFFRE VERIFIE PAR EDITEUR","value":42,"unit":"",
      "precision":0,"startFrame":68,"endFrame":122}
  }
}
```
**Exemple contractuel illustratif seulement :** le fichier et le chiffre sont des placeholders du schéma, pas un événement documenté. Ne pas prendre `42` comme une vraie statistique.

## 3. Garde-fous journalistiques et artistiques

1. L'image source doit être **authentique, identifiée, datée, localisée et sous droits utilisables** avant tout reportage. Les métadonnées de licence et le lien de provenance doivent être intégrés dans le futur Content OS audiovisuel ; le composant graphique ne sait pas prouver qu'une photo relate les événements.
2. Le détourage alpha doit provenir de **la même source** et ne pas représenter une autre personne ou catastrophe. Le validateur contrôle seulement le type PNG/WebP et la présence du fond, PAS l'identité du sujet ni le vrai canal alpha ; une vérification par échantillonnage et un contrôle de provenance restent à réaliser.
3. Le focus lumineux représente **une direction de lecture**, pas un cercle de vérification ou une preuve scientifique.
4. Un compteur interpolé entre 0 et la valeur vérifiée est une **animation graphique**, pas une série temporelle ou une courbe économique réelle. Ne jamais suggérer par effet une évolution sur la période sans données.
5. Police/RTL/CJK, lisibilité TikTok sur écran iPhone et Android, recadrage des visages, accessibilité de contrastes, licence de musique/voix, et mouvements contre le mal de transport sont **des gates humaines** à tester, pas acquis.
6. Une scène n'a pas besoin de six animations systématiquement. Le réalisateur doit sélectionner seulement les pistes qui aident à comprendre et réserver des temps de repos perceptuel.

## 4. Plan d'évaluation avant toute approbation

- [ ] Dernier HEAD PR Sprint 10 : test Node, typecheck renderer, build V2, MP4 H264 et réel Player Chromium, six scénarios historiques + photo.
- [ ] **Vérifier les vrais images** Player 0/50/115/150 et master 0/82/164 ; vérifier intérêt des changements visibles, regard sur sujet, pas de masque qui fait disparaître une preuve, titre, chiffres et sous-titres sans collision.
- [ ] Mesurer au pixel les safe zones (360px iPhone, TikTok) et les limites de texte à plusieurs langues.
- [ ] Faire ensuite un **premier reportage réel** avec photo sous droits, script vérifié, photo/cutout préparés et voix libre ; proposer deux directions artistiques, visionner sur téléphone et comparer au format géopolitique de référence.
- [ ] Contrôler vidéo H264 audio/loudness/voix/captions, empreinte des fichiers, aucun média source modifié.
- [ ] QA mobile Safari/Android, latence du Player, taille de bundle et cas paysages/portraits, différents ratios/visages avant toute production publique.
- [ ] Verrouiller stockage privé et licences avant tout import serveur ou déploiement.

**Statuts à distinguer** : idée → code committé → CI technique verte → MP4 et pixels inspectés → jugement artistique humain → usage/déploiement. Ne jamais annoncer le dernier état à partir du premier.

## 5. Après PHOTO : DATA et première réalisation complète

- **Sprint 11 DATA** : courbes vraiment sourcées, bar charts, top gagnants/perdants, sparkline, rang/heatmap, ticker et comparatifs à partir des données du script ; période/unité/source visibles, contrairement à une fausse courbe créée pour embellir.
- **Reportage unifié** : `geo_story` (vrai globe) → `country_focus` (vrai pays 10m) → `photo_layers` (vraie image multitrack) → `document_focus` (preuve primaire) → conclusion, synchronisation voix/music et véritables raccords; pas de carte sur tous les plans par obligation.
- **Qualité mondiale** : comparaison humaine documentée aux références finance/géopolitique, principes de reportage, montage professionnel, révisions non destructives, caches par scène et gestion de droits/provenance.
- **Risque principal** : un test entièrement synthétique vert ne veut pas dire que World-Vision sait encore produire un film comparable aux meilleures rédactions. Les essais vrais sont indispensables.

## 6. Passation pour le prochain chat

Ouvrir la PR Sprint 10 si créée, son dernier HEAD, le workflow exact et les artefacts MP4/PNG. Lire ce document, le [Sprint 9 GEO-2 §8](WORLDVISION_COUNTRY_FOCUS_GEO2_SPRINT9_2026-11-19.md) et [Handoff du périmètre](WORLDVISION_CREATIVE_EDIT_HANDOFF_2026-11-19.md), puis `CONTINUITE_WORLD_VISION.md`. Ne jamais perdre la direction initiale ni réintroduire voix Vivienne obligatoire/11 étapes imposées. **BAOCOM indépendant ; GDELT/blog différés**. Garder la PR en brouillon sans fusion/deploiement avant les tests et la revue.
