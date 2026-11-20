# WORLD-VISION MEDIA — Sprint 12 / premier film éditorial intégré GEO→PAYS→PHOTO→DATA→DOCUMENT

**Date :** 20 novembre 2026. **Branche :** `feature/worldvision-editorial-film-five-scene-integration-2026-11-20`, enfant directe de la [PR #84 DATA](https://github.com/OBIANG5/World-Health-Vision/pull/84). **Aucune fusion `v2`, aucun déploiement, aucune publication.** Il s'agit d'un **essai technique intégralement synthétique**, pas d'un reportage.

## 1. Pourquoi cette étape est supérieure à cinq nouvelles fonctionnalités isolées

Le projet World-Vision vise un média international dont chaque vidéo peut mettre en mouvement simultanément des sources photographiques, des pays, des données, des documents et une bande-son, sans trahir les faits. Les références « Bourse Express » et vidéo géopolitique, et la direction Gabon déjà appréciée par le propriétaire, imposent une unité de réalisation. Après GEO (PR #72), PAYS 10m (PR #74), PHOTO multipistes (PR #80) et DATA (PR #84), la priorité est **un véritable film complet** : ordre, transitions, continuité éditoriale, audio, contrôle visuel au format 9:16.

La séquence doit réutiliser exactement les mêmes composants Remotion pour le lecteur et le MP4. Aucun cinquième moteur ad hoc et aucune fusion de prototypes en double.

## 2. Storyboard technique effectif et authentique sur les plans source

| Ordre | Scène | Rôle | Source et limites |
|---|---|---|---|
| 1 | `geo_story` / `film-world-overview` | Globe, caméra, position d'un pays sur atlas | Géométrie Natural Earth; centre national de test Gabon sans événement |
| 2 | `country_focus` / `film-territory-context` | Territoire 10m / contexte 50m, carte+source visuelle+typographie | Natural Earth; photographie de paysage géométrique **artificielle** |
| 3 | `photo_story` / `film-source-photo` | Une image, masque, premier plan alpha, caméra, focus, chiffre attribution | Même image artificielle + découpe transparente artificielle |
| 4 | `data_story` / `film-verified-data-contract` | Trois observations fictives ; vrai temps ISO, échelle, valeur, unité, source | Série entièrement inventée **et affichée comme telle**, jamais actualité financière |
| 5 | `document_focus` / `film-evidence-closing` | Inspection ciblée d'une page | Document de formes générées, **ni document officiel ni citation** |

Durées sources : `150 + 165 + 165 + 165 + 140 = 785 frames`. **Quatre vrais fondus de 10 frames** entre les cinq plans soustraient 40 frames. Le film obtenu doit avoir **745 frames à 30 fps = 24,833 s**, H.264 1080×1920. Le montage contient la bande originale **`synthetic-film-oscillator.wav`**, une onde de contrôle continue. Elle **n'est pas une voix, n'est pas une musique de reportage, n'est pas une locutrice** ; son nom est explicite dans le manifeste `voice.label`. Ce fichier n'a qu'une finalité : prouver que le mixeur remonte une piste audio jusqu'au bout du film en AAC.

## 3. Contrat temporel vérifiable

`creative/editorial-timeline.mjs` calcule un EDL (`editorial-film-five-scenes.timeline.json`) de plages d'images **[début, fin)** et les jonctions. Il garantit :
- début des plans : **0, 140, 295, 450, 605** ;
- fin des plans : **150, 305, 460, 615, 745** ;
- quatre jonctions `dissolve` sur les frames **140–149, 295–304, 450–459 et 605–614** ;
- pas de trou noir (0 plan) ni collision triple (3 plans) à aucune image ;
- ordre exact des cinq grammaires, sans recomposer le scénario côté Player.

Ne jamais confondre l'EDL de la composition avec une simple liste de diapos ou une galerie TikTok. Les transitions peuvent avoir un recouvrement, mais les textes doivent rester lisibles individuellement ; les photos/documents restent inchangés.

## 4. Fichiers et preuves demandées

- `creative/build-ci-fixtures.mjs` : création à partir des fixtures précédentes du manifeste `worldvision-integrated-film-five-scenes.json` et du WAV non-vocal pour 745 images.
- `frontend/web-v2/src/media/creative-player-smoke.tsx` : mode `?mode=editorial`, cinq scènes *réelles dans le même Player* ; le même script et les mêmes paramètres sont dérivés explicitement, pas d'images de presse.
- `creative/test-player-browser.mjs` : captures sur **11 images** `0,70,145,230,300,375,455,520,610,686,742`, donc ouvertures, quatre transitions et centres de plan, avec vérification des types rendus et de la présence de l'audio.
- `creative/editorial-timeline.test.mjs` : tests de durée, gap, double overlap, erreur de temporalité, ordre des plans.
- `.github/workflows/worldvision-cinematic-director-gates.yml` : rendu d'un **vrai MP4 final** `editorial-film-five-scenes.mp4`, validation du manifeste source, WAV/AAC, des 745 images et des empreintes des stills ; archive de l'EDL et des captures. Le pipeline doit encore rejouer toutes les régressions GEO/PHOTO/DATA.

### Ne jamais déclarer succès avant :
- [ ] Deux jobs verts **sur le SHA de code final**.
- [ ] Réel master 1080×1920 H264/AAC et inspection indépendante via FFprobe.
- [ ] 11 vrais screenshots Player + photogrammes du MP4 et comparaison des titres, chiffres, plans et transitions ; pas seulement un MP4 qui existe.
- [ ] Liste des 4 actifs sources et hashes, pas de média généré ou trouvé à l'insu de la rédaction.
- [ ] QA artistique critique : rythmes, contrastes, proportions, charge cognitive, 360px, superpositions TikTok ; résultat pas automatiquement digne d'une publication.

## 5. Exigences de qualité mondiale non résolues par le test synthétique

Ce sprint ne contient **aucune véritable actualité sourcée, aucun reportage licencié, aucune voix humaine, aucun sous-titrage de paroles, ni de bande-son commerciale**. L'utilisateur n'a pas validé le contenu ni autorisé un déploiement. Conserver la direction appréciée sur la vidéo Gabon, le bleu/cyan sans éclats dorés et les marges TikTok suffisamment économes. Les graphes doivent rester fidèles aux données et à leurs dates ; les cartes doivent distinguer point central de pays et lieu exact d'un événement.

Les étapes suivantes doivent produire un vrai test éditorial sous droits, puis :
1. Préparation du *manifest de production journalistique* : fiche sujet, fil narratif, sources primaires/secondaires, pays, dates, preuve et méthode, provenance du média/ayant droit, licence, autorisation de diffusion.
2. Montage sonore sérieux : prise de voix sélectionnée librement (Vivienne facultative), sous-titres réellement alignés, musique sous droits, mixage/ducking, LUFS/true peak, silences contrôlés.
3. Raccords créatifs entre les cinq grammaires (match cut / camera continuity), non simple fondus de démonstration, et revue qualitative face aux deux vidéos fournies.
4. Test de visualisation sur iPhone dans TikTok réel et Android, langues françaises/anglaises puis autres ; détection de collisions et colorimétrie/contraste accessible ; puis revue formelle propriétaire.
5. Performance et responsabilité internationale : changement de pays, métadonnées régionales, version des séries, comparaison explicite. **Ne jamais connecter automatiquement les valeurs de la branche DATA institutionnelle comme si elles étaient publiables** avant contrôle des droits, méthodes et versions.
6. Après validation : seulement alors décider l'intégration dans le site et la publication du média ; aucun merge automatique.

La PR #79 PHOTO est archivée, la PR #83 DATA est une alternative avec comparaison signée intéressante mais non validée. Les emprunts futurs doivent être ciblés, testés et converger vers **une seule solution canonique**, pas des templates doublons.

## 6. Reprise immédiate dans un autre chat

Lire d'abord `CONTINUITE_WORLD_VISION.md` à la racine de **cette branche**, ce rapport, puis les rapports [Sprint 11](WORLDVISION_DATA_MOTION_SPRINT11_2026-11-19.md) et [Sprint 10](WORLDVISION_PHOTO_MULTILAYER_SPRINT10_2026-11-19.md). Chercher le **dernier commit**, la PR Sprint 12 et les Actions associées. Si un test échoue, lire la première erreur réelle et conserver les preuves ; ne pas supprimer les tests pour obtenir du vert. Après QA du film, traiter prioritairement le raccord audiovisuel et les médias réels, pas les décorations secondaires.
