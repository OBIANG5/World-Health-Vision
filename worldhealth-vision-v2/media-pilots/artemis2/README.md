## Audit réel du PREMIER master NASA — 20 novembre 2026

**Run initial [#44769402904](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44769402904) SUCCESS** sur SHA `f7bed7e6e180274749c8caf05bb28a2723f2d878` ; artefact `#14645664415` `worldvision-artemis2-internal-source-traced-film` ; fichier MP4 inspecté indépendamment : `1080×1920`, `H.264`, `750 images`, `30fps`, `25.000s`, **AUCUNE PISTE AUDIO**. SHA master `acded617779c7976ef807df088d30307d0d23170c938e9e3884e6f353f760b01`. Le **vrai film et 8 images à 360px** ont été visionnés.

**Original NASA Lune** `art002e009627` : `4eaed9058c6c414d4d8f18697eebd86220e8b05dd9b66fbcf48bd459f01659c0` (5568×3712). **Earthset** `art002e009288` : `1a172c85a5b7172cfffb7e3811056f22086b7dcfef56c369d5e6a66fb8a363ba` (5568×3712). **Visualisation annotée** `art002e016252_impactflash_annotation_cropped` : `57c1b522c587d2dd15f7713aaace2092deae59e24bd8ca29a8f671cbfd295e3b` (3840×2160). **Ces SHA sont désormais épinglés** dans `sources.json` et doivent être contrôlés avant copie, après rendu et dans les tests Node.

**Constat visuel vérifié**, sans survente :
- Photos NASA originales, géométrie spatiale crédible, bleu/cyan sobre et lisibilité des titres satisfaisante vers les frames suivantes.
- **Défaut important du frame 0** : photographie sans titre, mauvais pour le hook TikTok ; correction réutilisable ajoutée `titleFrameZero:true` au premier plan de `project.json`, prise en charge par `CreativeEdit.tsx`, `render-project.mjs`, validation et **Studio export/reimport** ; pas un effet ad hoc. Le nouveau MP4 **doit être revérifié**, ne pas déclarer correction validée à partir du seul code.
- **Plan documentaire trop peu lisible** à l'échelle mobile : petite image source paysagère encadrée, annotations difficiles à lire à 270–390px ; améliorer avec recadrage dirigé et magnification dont l'original reste toujours présent et jamais altéré, après revue du vrai script et de la durée de narration. Ne pas inventer de points ou attribuer une fausse séquence filmée aux impacts.
- **Titres/légendes dans la zone basse** : vérifier sous les contrôles TikTok. Un sous-titre global haut/bas additionnel peut entrer en conflit avec ces titres, à auditer lors du vrai alignement.
- Silence volontaire ; **aucun master publiable ni mix signé**, droits NASA/CSA et voix à auditer humainement.

**Suite immédiate et raisonnable** : vérifier GH Actions au nouveau HEAD **après pinning des SHA et hook frame 0**, télécharger le **nouveau** vrai MP4 et comparer l'image initiale à l'ancienne. Corriger seulement les défaillances réelles ; ensuite consacrer l'essentiel à la **voix FR sélectionnée, synchronisation SRT sur le master audio final, musique sous droits, ducking et loudness, composition des preuves et QA smartphone**, puis seulement apprendre des vrais retours pour les presets. **Éviter le piège de passer une journée à retoucher des fonds sans réelle information**.

---

# FILM-2B — Premier véritable film World-Vision à partir de photographies NASA originales

**Date du dossier : 20 novembre 2026.** **Branche active** : `feature/worldvision-film2b-artemis2-authentic-media-2026-11-20`, enfant de FILM-2C PR #104 (certifié techniquement sur `d9e5ba4`), elle-même fille de FILM-2A PR #98. Cette branche est un **film de revue interne, non publiable** : elle intègre enfin des originaux de mission vérifiables et non des photographies générées ou des figures inventées.

## Décision de réalisation : arrêter les abstractions, filmer des sources authentiques

Le moteur Remotion existant sait déjà animer des plans, lire un script éditorial fourni, assembler des photos authentiques, afficher un document et produire du H.264 1080×1920/30 fps. Le nouveau chantier crée seulement **un vrai conducteur de sujet, un registre de droits, un téléchargeur d'originaux NASA à confiance limitée, un contrôleur d'intégrité et une CI dédiée légère**, sans développer un deuxième moteur, sans nouveaux plugins et sans acheter un service.

Le film d'essai ne contient **aucune voix ou musique** : ce choix est délibéré. Une ancienne prise Vivienne C5.2 « Impact média » (+8 %), choisie comme voix de référence pour d'autres actualités, peut servir d'étalon de ton, **mais aucune voix n'est désormais imposée** et l'ancien enregistrement ne doit pas être remonté sous un sujet nouveau. Les droits de génération/diffusion commerciale d'une nouvelle prise sont à vérifier. Les sous-titres ne seront alignés qu'après enregistrement du nouvel audio final, conformément au moteur FILM-2A certifié.

## Événement journalistique : rigueur chronologique

**Nouveau fait publiable sous réserve de rédaction** : la NASA a publié le **17 novembre 2026** son *Artemis II Preliminary Lunar Science Report* :
https://science.nasa.gov/feature/artemis-ii-preliminary-lunar-science-report/

L'événement observé ne date pas d'aujourd'hui : pendant le **survol du 6 avril 2026**, l'équipage Artemis II a rapporté **cinq éclairs distincts**, pouvant correspondre à des impacts de petites particules rocheuses sur la Lune. Le communiqué immédiat d'avril évoquait des observations potentiellement plus nombreuses : éviter un traitement définitif « cinq collisions filmées » ou « cinq explosions nouvelles », et citer le statut d'**éclairs rapportés par l'équipage**. La NASA a publié une image de la Lune **simulée et annotée** par les astronautes pour marquer leurs observations : elle n'est PAS une image captant les éclairs réels.

Sources primaires :
- NASA Science, rapport préliminaire daté du 17/11 : https://science.nasa.gov/feature/artemis-ii-preliminary-lunar-science-report/
- NASA, photographie `art002e009627` de la Lune, 6/4 : https://www.nasa.gov/gallery/lunar-flyby/page/2 et https://images-assets.nasa.gov/image/art002e009627/art002e009627~orig.jpg
- NASA, `art002e009288`, Terre se couchant derrière la Lune (« Earthset ») : https://www.nasa.gov/image-article/earthset/ et https://images-assets.nasa.gov/image/art002e009288/art002e009288~orig.jpg
- NASA, `art002e016252` / `art002e016252_impactflash_annotation_cropped`, **visualisation et notes** : https://www.nasa.gov/image-article/artemis-ii-crew-moon-photo-annotations/ et https://images-assets.nasa.gov/image/art002e016252_impactflash_annotation_cropped/art002e016252_impactflash_annotation_cropped~orig.jpg
- NASA, conditions de réutilisation, crédits, marques/identifiants et droits de tiers : https://www.nasa.gov/nasa-brand-center/images-and-media/

Attention au **faux bon raccourci** : NASA Scientific Visualization Studio `15103` dispose d'une vidéo 1080×1920 et de son SRT officiel, mais sa musique « Bio Rhythms » est créditée **Universal Production Music** : https://svs.gsfc.nasa.gov/15103/. Ne PAS réutiliser sa bande-son ni supposer une licence libre du fichier mixé. Ce film original NASA reste un **benchmark de montage**, pas notre master ou une ressource sans conditions.

## Film réel : quatre séquences nécessaires (pas cinq grammaires obligatoires)

Le fichier `project.json` contient **750 images = 25 secondes** à 30 fps, avec 3 fondus de 10 images :

| Frames locaux | Grammaire réutilisée | Média original | Sens et fidélité |
|---|---|---|---|
| 165 | `documentary` | Lune / Orientale `art002e009627` | Hook « 5 éclairs sur la Lune », nouveau rapport du 17/11, crédit photo NASA |
| 195 | `focus_reveal` | Earthset `art002e009288` | Contexte 6 avril, survol caché d'Orion ; Terre réelle, sans animation géographique terrestre hors sujet |
| 225 | `document_focus` | Capture d'annotations `art002e016252` | Une annotation de points observés, explicitement légendée « PAS une photo des impacts » |
| 195 | `documentary` | Lune / Orientale réutilisée | Pourquoi les données importent pour les futures missions |

**Aucune série chiffrée inventée**, aucune fausse vidéo d'éclairs, aucune carte PAYS de la Terre hors sujet. Le mouvement est le vocabulaire déjà développé et testé, non un nouvel effet. Le film est un **animatic audiovisuel professionnel en devenir**, muet à ce stade, pas une vidéo éditoriale achevée. Revoir immédiatement le problème des **titres tardifs à frame 0** constaté sur de précédents tests, sans sacrifier les images originales.

## Architecture d'acquisition sûre et reproductible

- `sources.json` contient les **trois URI de téléchargement NASA originales** approuvées comme *candidats source*, leurs pages de preuve, légendes exactes, crédits à afficher, niveau de droits encore `OPEN` et blocage `publication_approved=false`.
- `prepare-assets.mjs /tmp/worldvision-artemis2-originals` ne télécharge **que du JPEG original sous `images-assets.nasa.gov`**, refuse le changement de domaine, le HTML, les petites images, les dépassements de taille et les extensions non prévues. Il calcule SHA-256 et dimensions par `ffprobe` et écrit `nasa-asset-ledger.json` **hors Git**. Un téléchargement échoué bloque le film, plutôt que d'inventer ou remplacer un asset.
- `validate-pilot.mjs` refuse les scènes hors storyboard, les assertions journalistiques incorrectes, le remplacement d'une photo source par une image anonyme ou toute simulation non divulguée. `pilot.test.mjs` en teste le contrat avec la validation originale du renderer.
- `qa-video.mjs` vérifie indépendamment MP4 **H.264 1080×1920 30fps**, durée/frames réels, absence de voix fallacieuse et concordance exacte des SHA entre les images NASA téléchargées et les entrées consignées par `render-project.mjs`. Deux niveaux de SHA : **médias entrants** et **master effectivement encodé**.
- `.github/workflows/worldvision-film2b-authentic-pilot.yml` est un **workflow ciblé**, indépendant des régressions lourdes du moteur : tests de sources → téléchargements NASA → rendu Remotion existant → rapport H.264/empreintes → **planche de 8 véritables frames du film** → artefact GitHub temporaire 7 jours. Aucune photo source n'est ajoutée au dépôt public ; un rapport sans droits n'autorise pas publication.

**Limite intégrité** : au premier lancement, le registre capture les SHA obtenus mais n'a pas encore de **SHA épinglés historiques**. Après une première acquisition vérifiée, épingler les 3 SHA dans `sources.json`, comparer au téléchargement à chaque montage ultérieur, et refuser les dérives de média sans revue. Le premier run peut échouer si le CDN ne renvoie pas les originaux déclarés — vérifier l'URL NASA officielle plutôt que substituer des fichiers tiers.

## Définition de « bon » / contrôle humain

Pour certifier **étape FILM-2B1 = premier film d'images réelles**, il faut :
- workflow sur **HEAD exact** entièrement vert ;
- réel MP4 et 8 images inspectés visuellement, en zoom smartphone et avec calque d'interface TikTok ;
- fichiers réels NASA visibles et identifiables, pas un montage d'essais synthétiques ;
- attribution NASA visible, distinction photo/illustration visible, pas de superposition citation et légende ;
- pas de coûts ni médias propriétaires tiers oubliés.

**La vraie version FILM-2B2 publiable** requiert de plus :
- scénarisation revue et datée, choix libre et nouvelle prise voix FR avec licence commerciale ; Vivienne C5.2 est une référence, pas obligation ;
- alignement SRT sur voix finale, revue des prononciations et des temps de pause ;
- bande-son originale ou sous licence exploitable mondialement, mixage mesuré LUFS/true-peak et ducking réel par narration ;
- direction PHOTO/document qui utilise toute la surface utile sans abîmer les annotations, images à 360px sous overlays TikTok ;
- validation d'usage de chaque photo/capture, crédit/présentation ne suggérant pas approbation NASA/CSA ;
- contrôles humains iPhone / Android puis autorisation explicite pour publication.

Ne pas résoudre l'absence de voix en inventant une lecture « professionnelle ». Ne pas fabriquer des images ou des faits. La direction World-Vision reste cyan/bleu, photojournalisme, globe seulement quand le sujet le justifie, lisibilité réelle, pas de dorures ni de décor gratuit.

## Continuité et suite la plus utile

À chaque chat, ouvrir en priorité `CONTINUITE_WORLD_VISION.md` puis **PR de FILM-2B** ; lire le dernier run GitHub sur son HEAD, télécharger son artefact et inspecter les images avant certification. Après cette étape, attaquer le vrai **montage narré premium** ; ne pas stagner de nouveau sur des titres, des palettes ou un effet secondaire. Faire une mesure de coût : temps pour créer un film puis temps pour remplacer un média ou corriger 5 secondes, qualité du rendu à 360px, conformité sources/droits. Documenter tout sur GitHub et garder #98/#104 en DRAFT, sans fusion/déploiement/publication automatique.

**Mémoire** : FILM-2A #98 `eb6bd7d`, Actions `44729319744`, réussite captions ; FILM-2C #104 `d9e5ba4`, Actions `44734012708`, réussite roundtrip Studio ; cette branche FILM-2B est fille de #104, sans remplacer les travaux antérieurs.
