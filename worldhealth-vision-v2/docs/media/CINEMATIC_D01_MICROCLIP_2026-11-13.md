# World-Vision — premier moteur d'export D01 (4 secondes), depuis le même globe CGI

**13 novembre 2026 — prototype vidéo technique à contrôler, sans diffusion éditoriale.**

## Ce qui est effectivement codé

- `frontend/web-v2/src/media/CinematicCapture.tsx` : route de capture `?view=media&screen=review&gate=direction&cinema_only=1&iso3=GAB`, affichage plein écran 9:16, contrôlé par message de rendu **same-origin** `WV_CINEMATIC_FRAME_V1`. Les poses sont issues exclusivement de `geoTargeting.mjs` (easing quintique + grand cercle), même shader `CinematicEarth.tsx` et même GeoJSON que le Media Studio.
- `frontend/web-v2/render-cinematic-d01.mjs` : serveur local sans exposition réseau externe, navigateur Chromium Playwright, 96 prises de vue pour **4 secondes à 24 ips**, capture 540×960 CSS à densité 2 pour obtenir **1080×1920**, puis assemblage via **FFmpeg H.264 / yuv420p**, vérification via FFprobe (dimensions, durée), empreinte SHA-256 et manifeste JSON.
- `.github/workflows/whv-cinematic-motion-d01.yml` : workflow GitHub Actions contenant installation exacte, tests géographiques, build React, archive éditoriale en lecture seule, texture NASA vérifiée, Chrome/FFmpeg, capture, upload artifact GitHub, copie de l'essai fini sur la **même branche preview**, dans `media-lab/` sans toucher aux vidéos historiques.
- `.github/workflows/whv-media-studio-mobile-preview.yml` : la routine standard préserve désormais `media-lab/` lors des mises à jour ultérieures du frontend, pour que l'URL du micro-clip ne disparaisse pas.

## Caractéristiques et limites

- Sujet DEMO uniquement : géociblage `GAB` (Gabon) à partir d'un centre géométrique national dérivé du GeoJSON, **pas une localisation d'un événement précis**, ni une véritable actualité filmée.
- Textures : NASA Blue Marble Next Generation janvier, données source et SHA dans `earth/provenance.json`.
- Le fichier ne comprend **pas encore** de voix, de texte de reportage, de sous-titres, d'images tournées sur place ou de bande-son. Ce sont des étapes éditoriales ultérieures basées sur le manuel de 137 pages.
- **Ne pas distribuer sur TikTok/WhatsApp** : rendu technique non approuvé (D00/G1 non encore validé).
- Le résultat doit être inspecté et noté visuellement et techniquement. **Une automatisation qui tourne n'est pas une preuve de réussite** ; vérifier avant toute affirmation le statut de workflow, le SHA du MP4 et la présence du fichier dans la branche de preview.

## Preuves à renseigner après l'export

Workflow : https://github.com/OBIANG5/World-Health-Vision/actions/workflows/whv-cinematic-motion-d01.yml

Chemin attendu seulement si le workflow est terminé avec succès :
`whv-media-studio-browser-preview/media-lab/wv-d01-gab-technical-4s.mp4`

Manifeste attendu :
`whv-media-studio-browser-preview/media-lab/wv-d01-gab-technical-4s.json`.

**Ne pas prendre un chemin attendu pour un fichier présent avant contrôle GitHub.**

## Suite

1. Valider qualitativement le master D00 CGI (deux arcs, Terre réaliste, sclère blanche, atmosphère plus forte que les arcs, détails géographiques en Afrique) par comparaison au PNG concept D00-v6.
2. Examiner le micro-clip D01 si sa génération réussit, relever défauts de mouvement et de cadrage ; améliorer les courbes caméra en fonction du pays réel.
3. Étendre à un dossier d'actualité sourcé, avec `event.lat` et `event.lon` confirmés (pas le seul centre du pays) et politiques sur frontières contestées.
4. Préparer le montage Remotion existant (script, scènes, véritables images autorisées, 3 voix à auditionner, alignement des mots, sous-titres, QA et exports), **après approbation humaine des étapes**.


## Résultat effectif — rendu et archivage RÉUSSIS

**Workflow du vrai rendu** : [run #43466731755](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43466731755), **completed / success**. Toutes les étapes ont passé, y compris capture des 96 photogrammes, FFmpeg, validation FFprobe, artifact GitHub et push du MP4 sur la branche d'aperçu.

**Fichier vérifié dans GitHub** : `whv-media-studio-browser-preview/media-lab/wv-d01-gab-technical-4s.mp4` ; blob Git `8dd35afc5f5ef56eae1b40b72208dfc19380cb78`. **SHA-256 réel du MP4** `17796338023f0ffd9732739390ac2535c816113baf8e6dd773879314604bb22a`. Durée **4 s**, **1080×1920**, **24 i/s**, **96 images**, sortie H.264. Branche preview HEAD après publication du film : `e6022b36c4bcdc368fae71d52f92a817a21ca3cb`.

- Vidéo : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/wv-d01-gab-technical-4s.mp4
- Manifest JSON exact : https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-lab/wv-d01-gab-technical-4s.json
- Page GitHub du MP4 : https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-lab/wv-d01-gab-technical-4s.mp4

**Statut éditorial exact :** micro-clip technique pour jugement humain, **non approuvé**, sans voix/sous-titres/images d'actualité et **non publié sur réseau social**. La réussite des validations vidéo ne juge pas la qualité artistique.
