# World‑Vision — Sprint 5 : inspection cinématographique d'un document réel

**Date** : 19 novembre 2026 (chantier de branche, non déployé).  
**Repo** : `OBIANG5/World-Health-Vision`, **PR #44 brouillon**.  
**Branche** : `feature/worldvision-cinematic-director-gates-2026-11-19`.  
**À lire avant** : [Sprint 4, film entier](WORLDVISION_FULL_FILM_PLAYER_SPRINT4_2026-11-19.md), [Sprint 3, lecteur réel](WORLDVISION_CREATIVE_PLAYER_SPRINT3_2026-11-19.md), [périmètre exact](WORLDVISION_CREATIVE_EDIT_HANDOFF_2026-11-19.md).

## 1. Rappel de mission — ne jamais réintroduire les erreurs précédentes

L'utilisateur et ChatGPT, **ici dans la conversation**, choisissent pour le moment les sujets et les médias authentiques, vérifient les faits et rédigent le script. Le logiciel World‑Vision reçoit **ce script** et les fichiers réellement fournis, et excelle dans leur mise en scène audiovisuelle, la direction graphique, l'animation, les raccords, la voix choisie librement, le mixage et les exports.

Il ne doit pas réinventer un modèle d'IA vidéo, un moteur TTS ou un logiciel professionnel de motion design existant. Utiliser Remotion et FFmpeg pour l'assemblage paramétrique, puis les moteurs professionnels, générateurs vidéo ou TTS connectés explicitement lorsque leur qualité est meilleure. **Vivienne est une voix possible, non imposée**. **BAOCOM reste strictement indépendant et n'est pas poussé sur GitHub**. GDELT, blog et Content OS global sont différés ; seul le flux média intervient ici.

## 2. Problème journalistique et créatif

Les premiers templates présentaient des animations sur fonds sombres et une ligne de décoration « evidence », mais **ne permettaient pas d'examiner réellement un passage de source primaire**. Reconstituer une citation de mémoire, taper à nouveau des nombres ou générer une capture « ressemblante » serait dangereux pour la crédibilité internationale du média.

Décision : créer une seule famille d'animation **spécialisée** `document_focus`, avec **les pixels d'une image source fournie** et une zone choisie explicitement par le rédacteur. **Aucun OCR, aucun résumé, aucun faux tampon de vérification, aucun texte de document fabriqué.**

### Le plan audiovisuel se décompose en mouvements motivés

1. **Arrivée du document** : vue de la page complète dans un cadre portrait.
2. **Repérage du passage** : une région bleue/cyan est mise en lumière, l'extérieur est atténué. Le rédacteur choisit x/y/largeur/hauteur en observant le vrai document.
3. **Approche caméra mesurée** : zoom modéré sur ce passage (pas de grossissement qui prétend recréer des pixels absents), caméra et encadré animés à partir d'images réelles.
4. **Mise en contexte** : titre et sous-titre **fournis** entrent sur un rythme séparé. La preuve originale n'est ni réécrite ni inventée.
5. **Raccord** : mêmes règles d'introduction/atténuation des titres que les autres scènes du film. Le fondu d'image peut continuer sans collision des légendes.

Cette animation est intégrée au **même composant Remotion `CreativeEdit.tsx`** que la prévisualisation V2 et le rendu MP4. Pas de deuxième montage CSS prétendument identique.

## 3. Implémentation exacte sur PR #44

### Contrat `worldvision-creative-project-v1` (inchangé)

```json
{
  "id": "document-01",
  "template": "document_focus",
  "durationFrames": 140,
  "title": "Titre rédigé par le journaliste",
  "subtitle": "Contexte rédigé ici, à partir des faits vérifiés",
  "eyebrow": "Provenance réelle, si connue",
  "media": {
    "kind": "image",
    "file": "documents/capture-autorisee.png"
  },
  "documentRegion": {"x": 0.30, "y": 0.40, "width": 0.45, "height": 0.20},
  "motion": "locked",
  "transitionAfter": "cut",
  "transitionFrames": 0
}
```

*Le bloc ci-dessus est un exemple de scène, non un projet complet. Le nom de fichier est fictif, aucune prétention de source existante.*

**Cadre géométrique** : le rectangle `documentRegion` est exprimé dans le **cadre où la page complète est affichée avec `object-fit:contain`**, et non dans les pixels de la source brute. Il faut bien inspecter la mise au point visuellement ; la zone peut englober du blanc autour d'un document paysage. Le HTML n'effectue pas automatiquement de reconnaissance de texte.

**Contrôles** :
- Image source réelle fournie, format image, et durée ≥ **115 images** pour cette chorégraphie ; pas de substitution vidéo ou de générateur stock.
- Titre rédigé (≤ 90 caractères), sous-titre limité pour la lecture mobile.
- Coordonnées x/y/width/height numériques et finies, x/y ≥ 0, largeur **12–85 %**, hauteur **8–80 %**, le rectangle entièrement dans le cadre source.
- Le validateur n'accorde **aucune licence, aucune certification de vérité, aucune approbation de publication** ; ces contrôles appartiennent à l'humain et aux données de provenance.

### Fichiers réellement modifiés

- `services/media-renderer/src/CreativeEdit.tsx` : `DocumentFocus`, rectangle mis en évidence, composition de l'image source sans réécriture, mouvement optique limité et titres non chevauchants.
- `services/media-renderer/creative/validate-project.mjs` : famille acceptée et exigences strictes.
- `services/media-renderer/creative/render-project.mjs` : passage de `documentRegion` sans modification de l'image source ; empreintes SHA des médias stagés et master.
- `frontend/web-v2/src/media/CinematicProductionBoard.tsx` : famille sélectionnable, quatre curseurs coordonnés (x/y/w/h), titre source, carte de l'image originale, contrat JSON et vérification de la disponibilité de l'image.
- `frontend/web-v2/src/media/CinematicProductionBoard.css` : aperçu **non animé** de la page originale et du rectangle dans la géométrie correspondant au cadre Remotion. Le vrai mouvement s'affiche dans `@remotion/player`.
- `creative/validate-project.test.mjs` : refus des sources vidéo, rectangles absents/hors cadre/trop petits et des durées/titres inadaptés.
- `creative/build-ci-fixtures.mjs` : image abstraite représentant **seulement des lignes géométriques**, aucune nouvelle ni citation ; production d'un projet JSON de test reproductible.
- `frontend/web-v2/src/media/creative-player-smoke.tsx` : test direct du Player sur cette image de test.
- `creative/test-player-browser.mjs` : vérifie l'affichage du document, du rectangle à l'instant 40, le mouvement à 68 et le titre à 102, et conserve les captures `0/40/68/102`.
- `.github/workflows/worldvision-cinematic-director-gates.yml` : tests unitaires + renderer MP4 H.264 `document-focus-only.mp4` + vraies captures Chromium, rapports de SHA et artefacts.

### Test réel — statut et discipline

L'implémentation a déclenché un test GitHub Actions :
[**#44544197428 — contrôler les conclusions réelles**](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44544197428).

**Ce numéro est le run du code ; son succès ne doit pas être présumé avant inspection des deux jobs, des erreurs et des captures.** En cas d'échec, corriger puis consigner le run véritablement validé. Le test final doit attester que le titre est lisible à l'écran et qu'un zoom change réellement les pixels visibles. Un `npm run build` vert ne constitue pas une preuve de direction artistique réussie.

## 4. Limites et revue de qualité obligatoire

- La feuille d'essai n'a **aucune valeur de reportage**. Elle ne peut être publiée comme preuve ni servir de comparaison de référence face à de vrais documentaires.
- Le style actuel n'est **pas automatiquement du niveau des meilleures réalisations au monde**. Il doit être confronté aux images, titres, chiffres, polices, rythmes et sons d'une véritable production, notamment sur iPhone avec l'interface TikTok.
- Une zone sélectionnée manuellement peut pointer vers une phrase hors contexte ; aucune méthode de détection de désinformation n'est implémentée par cette animation.
- Les captures zoomées peuvent paraître floues si le document fourni est en basse résolution ; il faut revenir au fichier original ou importer une nouvelle capture en meilleure qualité, pas halluciner une ligne de texte.
- La licence du document et des images, la source, la date et les restrictions de réutilisation doivent être explicites dans la production finale ; aucun champ de provenance complet n'est encore imposé par ce premier moteur.
- La typographie n'est pas actuellement un moteur universel de multilinguisme : les langues et polices RTL et CJK nécessitent des essais et des fontes adaptées (sans distribution de fichiers de police non autorisés).

## 5. Suite intelligente à forte valeur ajoutée

**D1 — Revue de rendu et corrections** : ouvrir les PNG du véritable Player et `document-focus-only.mp4`. Mesurer si la zone correspond bien au contenu, si l'ombre ou le zoom masquent trop la source, si les citations restent exactes et si la mise en page respecte le téléphone. Corriger avec preuve avant de multiplier les modèles.

**D2 — Scène documentaire réelle** : à partir d'un **script fourni par l'utilisateur** et d'une photo ou capture authentique légalement réutilisable, préparer deux versions d'ouverture et un plan d'inspection du document ; écouter la voix réellement choisie et regarder le MP4 dans l'app TikTok pour ajuster la taille des textes.

**D3 — Contrôle de lisibilité automatique** : géométrie des textes dans les zones sûres, superposition éventuelle des captions, captures au milieu des transitions, avertissement si recadrage coupe le sujet ou si des caractères accentués débordent.

**D4 — Non-destructivité par empreintes** : fingerprint par plan incluant hash des assets, version de composition, voix et bande-son, cache de previews et catalogue des versions approuvées ; un changement sur un plan ne doit pas altérer les autres.

**D5 — Film de niveau professionnel** : mastering/dynamique de la voix, ambiances sous licence, transitions motivées par le script, vrais b-roll professionnels, outils After Effects/Fusion/Blender/API externes selon avantage vérifié — **jamais recréer ces moteurs dans notre code**.

**D6 — Production internationale** : source & droits par média, métadonnées territoire/langue, sources d'actualité réelles, tests Safari et Android, quotas de fichiers, stockage sécurisé, traçabilité, versions 9:16 et autres formats nécessaires après validation.

**D7 — Content OS audiovisuel** : dossiers production, projets, variantes, plans, assets, auditions, remarques datées, export ; pas de blog/GDELT ni de lien BAOCOM à ce stade.

## 6. Consignes précises pour reprendre dans un autre chat

1. Partir de [PR #44](https://github.com/OBIANG5/World-Health-Vision/pull/44), encore **DRAFT**, base `feature/world-vision-media-studio`.
2. Revenir à ce fichier et aux trois précédents ; **ne pas demander à nouveau** qui prépare la recherche et les scripts.
3. Ouvrir la CI du HEAD le plus récent, ne pas inventer un statut vert. Inspecter les fichiers de preview `document-focus-only.mp4`, `player-document-frame-0/40/68/102.png` et `player-document-smoke.report.json` et corriger si nécessaire.
4. Ne pas ouvrir un serveur de stockage de médias publics, ne pas publier les rushes privés dans GitHub, ne pas imposer Vivienne, ne pas copier ou brancher BAOCOM.
5. Pour une vraie vidéo du média, **l'utilisateur fournit le script et potentiellement les médias**. Les recherches éditoriales demeurent dans cette conversation ; le logiciel orchestre les meilleurs moteurs de création/montage disponibles.
6. Documenter les bugs constatés, les tests réels, les compromis techniques, les choix créatifs et les actions à reprendre ; pas de fusion vers `v2` ni de déploiement public à ce stade.

**Le succès d'une mise en scène de document authentique doit être jugé dans le film réel, pas déduit du nombre de lignes de code.**


## 7. Revue humaine des quatre images — défauts détectés et corrigés

**Premier rendu : [GitHub Actions #44544197428](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44544197428) — SUCCESS**, deux jobs verts, maintenant **12 tests Node réussis**, 0 erreur de navigateur, vrai `document-focus-only.mp4` de 140 frames et captures Chromium `0/40/68/102` issues d'une source *strictement synthétique*. L'artefact initial `14541110191` a été téléchargé et les quatre images ont été **visuellement inspectées**.

La revue visuelle a identifié deux problèmes qui ne sont PAS des erreurs de compilation :
1. **Image d'ouverture vide** : à `frame 0`, le document était presque complètement invisible (`opacity=0`). Inacceptable pour un premier instant censé accrocher le public.
2. **Titre sur la page** : à `frame 68/102`, le cartouche de titre couvrait la partie inférieure du document synthétique, rendant sa lecture difficile. Le passage sélectionné était néanmoins visible ; le résultat restait visuellement trop amateur.

**Correction en code** : `CreativeEdit.tsx` rend immédiatement visible l'image source (`opacity` initiale ≥ 0,93), ajuste son entrée et place le document dans un cadre plus court, tandis que le cartouche des légendes se situe dans le tiers inférieur avec un fond de contraste. `CinematicProductionBoard.css` reproduit la nouvelle géométrie dans l'aperçu de positionnement de la zone. Le titre entre plus tard pour laisser le temps d'inspecter la zone mise en évidence.

**Nouveaux critères CI dans `test-player-browser.mjs`** :
- image source perceptible dès **frame 0** : opacité ≥ 0,90 et dimensions suffisantes ;
- fenêtre de sélection effectivement visible à **frame 40** ;
- caméra en mouvement sur l'extrait à **frame 68** ;
- titre visible à **frame 102** ;
- au moment du titre, bloc de texte **sans recouvrir la carte du document**, ni descendre dans la zone jugée dangereuse pour les overlays des plateformes.

**Nouvelle vérification** : [GitHub Actions #44545458500](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44545458500) — **vérifier les deux jobs et inspecter les captures après exécution**. Ne pas inventer un succès avant le résultat. Un test de géométrie ne garantit pas la beauté ; les photos authentiques et les plateformes de diffusion restent le juge final.



## 8. Échec utile du nouveau contrôle géométrique — corriger, ne pas masquer

Le second contrôle [#44545458500](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44545458500) a détecté un **vrai défaut de composition** :
- Builder V2 : **SUCCESS**.
- Tests de contrat, rendu MP4 du document et détection des pauses : réussis jusqu'au test navigateur.
- Test Chromium documentaire : **FAILURE** car `cardBottom=420px` mais `captionTop=406.53px` dans l'aperçu 360×640, soit environ **13,5 pixels de recouvrement** du document par le bloc de texte. `captionBottom=498.33px` restait pourtant sous le seuil du bas de l'écran (`514.2px`).
- Le contrôle du plan initial visible et celui du cadre surligné à frame 40 passaient.

**Correction justifiée par les mesures, pas par un nombre arbitraire de lignes de code :** conserver la position du bloc de texte (pour ne pas dépasser les marges inférieures TikTok) et diminuer la hauteur du cadre documentaire de 900 à **830 images-pixels Remotion**. Mettre à jour en même temps l'aperçu du document dans `CinematicProductionBoard.css` afin d'éviter un décalage UI/master. La CI doit désormais vérifier le nouveau rendu, puis les PNG doivent être comparés visuellement.

**Ne jamais qualifier ce deuxième contrôle d'échec mineur à ignorer** : il prouve que la prévisualisation et le test de lecture sont utiles à notre direction artistique.



## 9. Clôture de l'incrément technique après nouvelle revue visuelle — VALIDÉ, non publié

**Run de référence vérifié : [GitHub Actions #44546198363](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44546198363)**, lancé sur le code incluant la hauteur documentaire de **830 px**. **Les deux jobs sont SUCCESS**. Le frontend V2 compile, **12 tests Node passent, 0 échec**, le vrai MP4 `document-focus-only.mp4` de **140 frames** est produit, et les **quatre modes** de test Player Chromium (plan, film entier, vidéo MP4 importée, document) terminent sans erreur JavaScript.

**Artefact de preuve** : `worldvision-creative-compositor-demo`, GitHub artifact **`14540488994`** ; fichiers clés :
- `document-focus-only.mp4` et `.report.json` : source synthétique d'essai, image originale enregistrée par SHA et export H.264 ;
- `player-document-frame-0.png` : page visible **dès la première image** (plus de grand écran noir) ;
- `player-document-frame-40.png` : région source effectivement sélectionnée, fond extérieur légèrement atténué ;
- `player-document-frame-68.png` : la zone sélectionnée grossit avec une caméra en approche ;
- `player-document-frame-102.png` : contexte lisible dans un cartouche **séparé de la page**, sans masquer le passage ;
- `player-document-smoke.report.json` : absence d'erreur navigateur et SHA différents pour les quatre captures.

**Preuve géométrique réelle dans Chrome sur scène 360×640** :
- `cardBottom = 396,67 px`
- `captionTop = 406,53 px`
- **marge entre les deux ≈ 9,86 px**
- `captionBottom = 498,33 px` et seuil inférieur de test `514,2 px` ; **marge basse ≈ 15,87 px**

Les quatre captures de cet artefact ont été **ouvertes et inspectées réellement**. Les deux défauts qui avaient provoqué les itérations — ouverture noire et chevauchement document/titre — ont disparu sur cet exemple. Le contenu source est un **dessin géométrique abstrait**, jamais une fausse capture d'actualité. La qualité finale du graphisme est encore trop élémentaire pour comparer World‑Vision aux meilleurs studios de motion design ; le gain principal est la capacité contrôlée à examiner un **vrai passage fourni**, sans en inventer le texte.

**État du produit :** PR #44 toujours DRAFT et non fusionnée, aucun changement Vercel public, aucun raccord BAOCOM, aucune voix imposée, aucune diffusion réelle. Ce n'est PAS une validation d'exploitation commerciale/éditoriale ou d'affichage iOS/TikTok réel.

### Étape prioritaire après ce jalon

Passer **de l'illustration synthétique à un film réel autorisé** : script d'actualité rédigé ici, 1–2 photographies/vidéos autorisées et éventuellement une source documentaire primaire, puis une narration librement choisie. Comparer les premières secondes avec plusieurs références audiovisuelles professionnelles et produire au moins deux variantes créatives complètes pour décider visuellement. Ensuite réutiliser les mêmes plans dans la timeline, affiner la direction artistique, le sound design et le mastering, puis ajouter versioning/cache par séquence et le Content OS audiovisuel. La phase documentaire ne doit pas devenir un prétexte pour multiplier 50 templates médiocres.

