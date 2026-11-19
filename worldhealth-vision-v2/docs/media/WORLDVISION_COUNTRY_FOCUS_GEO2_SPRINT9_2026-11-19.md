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

## 7. Vérification CI + audit VISUEL réel du premier rendu, puis corrections

**Première exécution Sprint 9** : [GitHub Actions #44619873848](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44619873848) a échoué honnêtement : regex `/^\\d{3}$/` sur-échappée et alias Vite manquants 50m/10m. Les corrections ont été apportées ; **ne jamais effacer ces échecs du bilan**.

**Première CI verte du compositeur** : [#44620191019](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44620191019), deux jobs SUCCESS sur `47f90923`, 18 tests Node/18, rendu H.264 synthétique `country-focus-gabon-synthetic.mp4` **165 images, 1080×1920, 5,5 s**, vrai Player Chromium et aucune erreur JS. Tests pays/50m/10m, marker, photo, compteur et textes réussis. **Problème du workflow** : artefact GitHub 14576658977 omettait les fichiers CountryFocus malgré les tests réussis.

**Correction d'archivage** : commit `bce6aeb`, run [#44621299587](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44621299587) **SUCCESS**, artefact #14575734283 de 25 Mo téléchargé et inspecté : vrais screenshot Player `player-country-frame-0/60/115/155.png` en **360×640** et stills master `frame-01-at-0 / frame-02-at-82 / frame-03-at-164` en **1080×1920**. Les pixels inspectés, et non la compilation seule, ont révélé :

1. **Défaut A : ouverture insuffisante**. Le frame 0 était pratiquement un rectangle vide sombre ; titre et contour étaient invisibles à cet instant. Impropre pour un reportage accrocheur.
2. **Défaut B : cartographie couverte**. La carte allait jusqu'à ~y1094, tandis que la carte photo commençait à y900 et recouvrait le bas du pays. Un pays dont on ne voit pas l'ensemble n'est pas une bonne mise en scène de géographie.
3. **Qualités vérifiées :** vers frames 60–155, le contour Gabon 10m apparaît net et grand, la photo abstraite, le chiffre et les textes coexistent avec mouvements. Aucune image d'actualité réelle ni personne n'est représentée par le fixture.
4. **Dette de performance constatée :** contexte D3 50m = **709 064 caractères de tracé** sur ce cas, trop important pour viser un Player rapide sur iPhone. Atlas 10m dans un chunk lazy de **~3,66 Mo / ~986 Ko gzip**. Le simple build vert ne démontre pas la rapidité mobile.

**Corrections apportées après revue (pas une validation finale présumée)** :
- `mapBox` maintenant dans y356..838, bord du cadre y339..871, photo démarre y900 : le polygone est **censé rester visible intégralement** et la carte ne doit plus être couverte.
- Silhouette et contexte faiblement visibles dès frame 0 ; entrée des titres plus rapide, puis reveal détaillé et animations autonomes.
- Nouveau test Chromium aux frames 0/115 : le cadre pays doit être au moins 5 px au-dessus du média et le contour déjà visible.
- Rayon de voisinage géographique déduit de la **superficie réelle du polygone source** via `geoArea`, borné ~0,36–1,10 rad au lieu d'un cercle systématique de 1,25 rad; pas de réduction ni invention de la précision du pays 10m.
- Tests supplémentaires : rayon/contenu Gabon et deux géographies de contrôle, **Fidji (242)** et **Russie (643)**. Il s'agit d'épreuves de contrat, pas de validation artistique de toutes leurs projections.

**Dernière action CI de contrôle à lire :** [#44622728753](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44622728753), sur commit `ffa0c44a` au moment du lancement. **Consulter son statut effectif, télécharger les nouveaux 0/60/115/155 et MP4, comparer au premier rendu et consigner les écarts avant d'annoncer que les deux défauts sont corrigés visuellement.** Le travail reste en PR draft.

**Prochain verrou** : vraie photo d'actualité dont les droits sont prouvés, essai sur un petit territoire/archipel, benchmark du Player Safari et Android, et évaluation esthétique comparative avec les deux vidéos de référence, pas une seule image artistique.

## 8. Vérification finale de la géométrie et des pixels — 19 novembre

**Commit exact du CODE contrôlé :** `b553f7d38c4111ec8de02e43e1a2dbbf1f614c82`.
**Preuve : [GitHub Actions #44624747361](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44624747361)**, **deux jobs SUCCESS**, compilation et 19 tests Node (Gabon, Fidji et Russie), master réel country-focus H.264 1080×1920/165 frames, et captures du vrai Player Remotion Chrome. Artefact `worldvision-creative-compositor-demo` id **14578693543** (~25,1 Mo) effectivement téléchargé, extrait et revu. MP4 `country-focus-gabon-synthetic.mp4` (~940 Ko) et Player `player-country-frame-0/60/115/155.png` + master frames 0/82/164 tous présents, 0 erreur JavaScript.

**Régression puis correction :** le run [#44623703278](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44623703278) a délibérément échoué au seuil d'espacement titre/carte : seulement **3,8177 pixels** sur viewport mobile 360px; code et MP4 avaient pourtant été rendus sans incident. Après séparation verticale et nouveau code du commit `b553f7d`, le Player réel mesure **17,4844 pixels**, au-delà du seuil strict **12 pixels**. La carte finit à y305,3px; carte média commence à y330px en début de séquence (marge 24,7px) puis y315px après entrée (9,7px), sans occlusion du pays.

**Observations directes des sept frames** :
- Au frame 0, le pays n'est plus absent : base silhouette visible et titre déjà amorcé ; volontairement discret, mais intérêt initial peut être renforcé pour un montage final.
- Aux frames 60/115/155, la silhouette source Gabon est entière, suffisamment grande et animée avec contour cyan, marqueur, paysage de fixture, compteur fictif et sous-titre. Aucun recul vers l'ancienne maquette masquée.
- Le tracé 50m de voisinage sur ce cas est **84 114 caractères** à frame60 contre **709 064** avant rayon de proximité adaptatif (environ 88% de réduction sans déformer/simplifier le pays 10m).
- **Reste une dette ARTISTIQUE réelle** : une fraction importante du bas du 9:16 est inoccupée, le paysage de CI est abstrait, l'image n'est pas un vrai reportage, et ce montage isolé ne se compare pas encore favorablement aux vidéos de référence. L'espace libre peut protéger les commandes TikTok, mais dans la future vraie composition il devra être intentionnel (sous-titres, documentaire, shot plus ambitieux) plutôt qu'un vide par défaut.
- La vidéo est **un test synthétique** : aucune vérité d'actualité, licence photo réelle, réputation journalistique, performance iPhone Safari ou approbation utilisateur ne découle de cette CI.

**Verdict** : GEO-2 est **validé techniquement et les corrections de collision sont vérifiées sur pixels**, mais **pas encore approuvé artistiquement / publiable / intégré au site V2**. La PR #74 reste en brouillon empilée sur #72.

**Prochaine étape intelligente** : arrêtons les itérations sur des cadres GEO isolés ; construire **PHOTO MULTILAYER** à partir d'une vraie image fournie (caméra, masque/reveal, profondeur par alpha cutout, étiquettes et informations/synchronisation, composition non destructive), ensuite pack DATA et une séquence reportage complète globe→pays→photo, sous droits et voix libre. Optimiser le poids du bundle atlas 10m (3,66Mo JS, 986Ko gzip sur Vite) et tester sur iOS avant un vrai déploiement.

**Lecture prochaine session** : commencer par ce §8 et le HEAD PR #74, puis la nouvelle PR PHOTO si créée. Aucune fusion V2, ne pas forcer voix Vivienne, ne pas intégrer BAOCOM ou blog/GDELT dans l'atelier vidéo.
