# World-Vision — montage « 3 dirigeants → Terre originale → globe qui tourne → Shenzhen »

**Date : 14 novembre 2026.** **Statut : conducteur de montage proposé et codage des plans S01/S02/S03 ; PAS de master final, PAS de voix validée.**

## Décision de réalisation

Le propriétaire veut un reportage **court** (ordre de grandeur 43 s, surtout pas plusieurs minutes), rythmé à vitesse naturelle, avec un enchaînement fluide :

**Portraits des trois chefs d'État (archives réelles) → une apparition BRÈVE de l'illustration World-Vision D00-v6 EXACTE → une Terre en rotation géographiquement réelle et colorée comme notre identité → repère Shenzhen (ville) → retour au reportage.**

- **D00-v6 originale** : image fixe approuvée comme référence artistique ; aucun faux déplacement de frontières à partir d'un seul PNG. Son plan S02 a déjà été **réellement créé**, 3,1 s, SHA-256 `95c47d1a94a1d0487e5b8f2d4c622bedcf6bad980938947ac003be34a8f8ea2a`, archivé dans Canva `VAHa4ZT_ySo`.
- **Rotation S03** : vidéo distincte **géoréférencée** produite avec NASA Blue Marble et frontières Natural Earth, Afrique (12°N,14°E) → Shenzhen (22.5431°N,114.0579°E). Le repère cible est un centre-ville de référence **et NON l'adresse de la salle de réunion**. La Maison-Blanche annonce une rencontre le 19 novembre en marge de l'APEC ; le ministère chinois confirme Shenzhen pour l'APEC 18–19 novembre. Vérification officielle : https://www.fmprc.gov.cn/eng/xw/wsrc/202611/t20261113_12058556.html ; AFP https://www.afp.com/en/trump-xi-putin-hold-historic-meeting-china-white-house-0
- **Logo G0** : toujours le vrai fichier `services/media-renderer/public/brand/world-vision-official.png`, Git blob `bc80fa70cebd566768bfb1703a0f1f636a78c196`; ne jamais le reconstruire par dessin ou emoji.
- **Extraits vidéo** : **lecture normale 1,0×** ; pour tenir 43 secondes on **coupe les secondes superflues**, on n'accélère pas la voix ni les vidéos.

## EDL — « Edit Decision List » proposée, 30 fps, 9:16

| Horodatage master | Durée | Vidéo/plan source | Décision |
|---|---:|---|---|
| 00:00.00–00:04.50 | 4,5 s | S01, vrais portraits Trump / Poutine / Xi | Hook trois portraits qui se révèlent, logo officiel |
| 00:04.50–00:05.40 | 0,9 s | **S02 ORIGINAL D00-v6**, première tranche 0–0,9 s de son MP4 de 3,1 s | Intro signature courte, même visuel que l'image utilisateur ; pas de reconstruction |
| 00:05.40–00:09.80 | 4,4 s | **S03 NASA+Natural Earth**, première tranche 0–4,4 s de son MP4 de 4,9 s | L'Afrique pivote à l'est en ~2,1 s, puis marque Shenzhen, label discret |
| 00:09.80–00:12.50 | 2,7 s | **S03B à sélectionner : vraie vue documentée de Shenzhen** | À condition de disposer de photo/vidéo autorisée ; aucun faux sommet |
| 00:12.50–00:20.40 | 7,9 s | S04 enjeux nucléaires | New START, arsenaux, typographie animée sobre |
| 00:20.40–00:26.60 | 6,2 s | S05 Chine / Xi | Vrai portrait, réticence de Pékin |
| 00:26.60–00:33.80 | 7,2 s | S06 Iran / Ukraine | Distinguer les sujets prévus selon Washington, pas de fausse attaque montrée |
| 00:33.80–00:40.00 | 6,2 s | S07 aucun accord attendu | Contraste diplomatique, conclusion interrogative |
| 00:40.00–00:43.00 | 3,0 s | S08 signature G0 + D00-v6 | Slogan « Voir le monde, le comprendre. » |

**Total : 43,0 secondes, à reviser UNIQUEMENT après réception de la vraie voix.** Le découpage original `SEGMENT_LEDGER.json` conserve les sources intégrales S02/S03 et les premiers timings. Les extraits EDL ci-dessus sont une PROPOSITION d'assemblage : **le master n'est pas encore exporté**.

## Cinématique S03 et critique visuelle

### V1, réellement rendue et inspectée

- [MP4 4,9 s S03 V1 NASA JANVIER](https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/summit-2026/segment03-shenzhen-4p9s.mp4)
- [4 photogrammes QA](https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-lab/summit-2026/review-s03/contact-sheet.jpg)
- GitHub Actions [#43582303226](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43582303226) **success**. SHA-256 vidéo `6bfb45a57794c7dbfc7dc9af9ddb818c67eae327f60216b46bf32f0afb7ba10e`.
- **Observation qualité** : géométrie et transition correctes ; janvier montre l'Asie septentrionale très enneigée, donc éloignée de la palette vive de D00-v6. **Ne pas sur-vendre comme qualité finale.**

### V2 NASA JUILLET, alternative esthétique en cours de rendu

- Source NASA https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-topography/ → July global 5400×2700, pour une Eurasie plus verte, sans déformer la géographie.
- Workflow `.github/workflows/whv-summit-shenzhen-s03.yml` produit `segment03-shenzhen-july-v2-4p9s.mp4` et `review-s03-july-v2/contact-sheet.jpg` sur la même branche mobile permanente.
- **Statut actuel : en cours / À VÉRIFIER**, ne remplacer la V1 dans le montage final que **si** la V2 est rendue, QA et visuellement plus cohérente. Ne pas inventer un SHA avant le résultat.
- Le code source commun : `services/media-renderer/scripts/worldvision_segment03_shenzhen.py`. Géographie orbitale véritable avec coordonnées, animation quintique, 147 images H264 1080×1920 @30fps, halo cyan, titre normal et logo G0 exact.

## Synchronisation et mixage

- Les images doivent **aller au rythme du vrai texte français approuvé**, pas forcer la voix à correspondre à des timecodes arbitraires.
- Aucun master ne sort tant que la voix française naturelle n'a pas été **auditionnée**, que les phrases n'ont pas été calées à l'image et que les 13 sous-titres ne sont pas réalignés sur le fichier vocal.
- S03 et S02 sont pour l'instant **SANS PISTE AUDIO** ; ne jamais écrire « son vérifié » ou « voix terminée ».
- Faire un unique traitement d'ambiance sonore lors de l'assemblage : bruitage léger du passage du globe, accent de localisation, narration PRIORITAIRE ; musique sous droits, contrôle écoute réelle sur iPhone.
- Les photos d'archives doivent rester explicitement distinctes d'une réunion future ; aucune vidéo générée ne peut être présentée comme captation du sommet.

## Accès et reprise

- `SEGMENT_LEDGER.json` : liste des 8 sources documentées et SHA.
- `WORLD_VISION_PRODUCTION_CONDUCTOR_2026-11-13.md` : processus global, mais ici notre objectif est **uniquement MONTAGE**.
- `CONTINUITE_WORLD_VISION.md` et `docs/continuity/CURRENT_STATE_AND_NEXT_STEP.md` : point de reprise quand le chat est long.

**Prochaines étapes concrètes** : inspecter contact sheet V2 → retenir meilleure variante S03 → écouter/choisir voix FR → découper fidèlement phrase par phrase → sélectionner un plan authentique S03B (Shenzhen) → produire S04 autonome → tests visuels et sonores → assembler uniquement les séquences approuvées.
