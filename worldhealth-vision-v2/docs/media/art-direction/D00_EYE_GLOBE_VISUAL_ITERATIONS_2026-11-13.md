# World-Vision — D00 : œil géant, Terre, atmosphère et frontières

**Date : 13 novembre 2026**  
**État du jalon G1 / D00 : PROPOSITION VISUELLE EN COURS, NON APPROUVÉE.**  
**Source de la décision : corrections explicites de l'utilisateur dans le nouveau chat, après la reprise GitHub.**

## Intention générale — garder exactement cette direction

Une Terre immense, extrêmement belle et réaliste, presque à la largeur du cadre, doit être la **pupille** d'un œil monumental. La géométrie de l'œil vient du **véritable logo officiel** `frontend/web/src/assets/logo.png` (SHA Git `bc80fa70cebd566768bfb1703a0f1f636a78c196`) ; le PNG officiel lui-même n'est PAS modifié. L'illustration cinématographique est une adaptation de son langage visuel, pas un nouveau logo officiel.

**Œil : exactement DEUX arcs, un supérieur et un inférieur.** Ce sont des courbes de paupières **larges, oblongues et non circulaires** : elles entourent le globe comme un œil ouvert, jamais comme un anneau concentrique ni une ellipse presque fermée. Les extrémités des deux arcs s'étendent **au-delà des bords gauche/droit du cadre**, sans montrer de bouts ou points de fermeture. Ne jamais ajouter d'anneau supplémentaire, de petits traits décoratifs ou de troisième arc. Les arcs peuvent être fins, légèrement diffus et secondaires visuellement. **Ils ne doivent pas dominer la Terre.**

**Terre :** plus grande que sur les premiers essais, textures satellitaires détaillées, couleurs naturelles marines/continentales, relief et nuages situés **sur le globe seulement**, mais **aucune lumière nocturne de villes/pays**. Une couche atmosphérique bleu électrique/cyan enveloppe la sphère, avec diffusion lumineuse crédible autour de son bord (l'effet recherché est celui d'une atmosphère planétaire, désigné comme « couche d'ozone » par le propriétaire ; éviter d'affirmer que la mince ligne visible est réellement la couche d'ozone mesurable). **Les frontières de chaque pays visible doivent être clairement lisibles**, idéalement un overlay géographique calculé depuis une source vérifiable, et non des traits inventés par un générateur d'images.

**Environnement :** ciel spatial bleu marine très profond, quelques étoiles discrètes et petites, nettement moins nombreuses que l'amas brillant en haut à droite des premiers essais. **Pas de soleil ponctuel**, aucun rayon de soleil starburst, **aucun lit de nuages en bas/hors planète**, aucun rayon, halo ou trait superflu. La priorité visuelle absolue est à la Terre.

## Quatre images de conception produites dans le chat — historique des retours

Ces fichiers sont des **sorties d'images de conversation**. Les empreintes SHA-256 ci-dessous ont été calculées sur les fichiers effectivement présents dans la session de génération. **Les octets des PNG ne sont PAS, à ce stade, versés au dépôt GitHub** ; conserver les fichiers si une sauvegarde binaire devient possible. Ne pas prétendre qu'une image git est égale à un screenshot.

| Itération | Fichier de session | Dimensions | SHA-256 | Évaluation exprimée |
|---|---|---|---|---|
| D00-v1 | `l_œil_bleu_de_la_terre.png` | 941 × 1672 | `7b7f5b1a57c850e4c13dd08947604589cfe1e4cc20e5c2035acbdb0730f4d743` | Terre jugée belle ; œil incorrect, trop de traits, soleil et nuages au bas hors sujet |
| D00-v2 | `logo_spatial_world_vision_autour_de_la_terre.png` | 941 × 1672 | `ea3b5ef2ca433527851f2d69b7fd489748360cb9e5b0760944c9911c6e01e447` | Œil ressemblant presque à un cercle ; garder les deux arcs seulement, mieux intégrés |
| D00-v3 | `a_sleek_high_detail_cinematic_space_graphic_a_d.png` | 1086 × 1448 | `6dfca348e383b254628ebce585871dd4f9dcf143b39b4ba8cf6d79f37094b6f6` | Se rapproche, mais arcs trop visibles ; les sortir de la caméra et agrandir la Terre ; supprimer les lumières de villes et faire apparaître les frontières de pays |
| D00-v4, **nouvelle proposition** | `a_highly_detailed_cinematic_photorealistic_satell.png` | 1086 × 1448 | `5f97e5f0d29551e187b50106e0aaf2f00e700062a9a2f5845dbf9f9715b6a90e` | Image réalisée selon les dernières instructions ; **PAS encore notée, PAS encore approuvée** |

Le fichier v4 est une **concept image**, pas une source géographique fiable, un globe rotatif codé, une scène Remotion ou un véritable export 9:16. Les frontières synthétiques doivent être remplacées par des frontières calculées (GeoJSON exact, rendu 3D contrôlé). La composition proposée est en **1086 × 1448 (3:4)** ; le rendu audiovisuel final devra être construit/testé en **1080 × 1920 (9:16)**, sans déformer la Terre ni faire apparaître les extrémités des arcs.

## Contraintes visuelles / checklist du prochain rendu

- [ ] Terre dominante, largeur visée ~90–98 % du cadre (à ajuster lors du cadrage 9:16) ; détails nets sur continents, océans et nuages SUR Terre.
- [ ] Exactement deux arcs de paupière inspirés du logo officiel ; courbure NON circulaire, aucune terminaison visible sur les bords ; arcs plus larges que l'écran.
- [ ] Épaisseur/luminosité des arcs secondaire : finesse et léger halo, pas de grands rubans blancs, pas de cercle lumineux continu autour de l'œil.
- [ ] Atmosphère cyan/bleue visible sur le limbe terrestre, distincte des arcs, rendu volumétrique/plausible.
- [ ] Frontières nationales contrôlées par GeoJSON et projetées sur la surface 3D ; lisibilité et précision, gestion documentée des frontières contestées.
- [ ] Zéro lumière artificielle de villes, zéro source solaire visible, zéro nuage en décor extérieur au globe.
- [ ] Étoiles peu nombreuses, petites et discrètes.
- [ ] Prévisualisation vraie résolution verticale iPhone, capture contrôlée et note humaine explicite avant D01/D02.

## Préparation de la vidéo future — pas de rendu complet tant que D00 non validé

Architecture suggérée à étudier/benchmarker dans le code **existant**, pas à imposer sans test :
- **TypeScript + React + Remotion** : orchestration de timeline, sous-titres, transitions et exports (déjà présents dans `services/media-renderer`).
- **Three.js/WebGL ou Blender (Python pour pilotage)** : rendre un globe réellement 3D, texture terrestre licite, relief, éclairage, nuages atmosphériques et trajectoire caméra ; choisir après tests rendu/qualité/temps/ressources.
- **GeoJSON** : frontières vectorielles de pays (réutiliser la source V2 après audit des droits et précision).
- **FFmpeg** : composition, encodage, contrôle audio/vidéo et master vertical.
- **Animation** : rotation terrestre/caméra lente et crédible, puis zoom vers un seul lieu si l'actualité le justifie ; **seulement après validation de D00 fixe**, puis micro-clip 3–6 secondes.

## Politique de validation

L'utilisateur a exprimé une appréciation positive de la beauté du globe sur les propositions précédentes, mais **aucune validation finale de D00**, aucune note globale et aucune approbation pour produire une vidéo complète. Ne pas interpréter « ça se rapproche » ou « j'aime bien » comme un feu vert pour D01/D05 ou une production automatisée. La toute prochaine étape reste la revue de la proposition D00-v4, puis ses corrections éventuelles.

Voir aussi `WORLD_VISION_GLOBE_SIGNATURE_DIRECTIVE_2026-11-13.md`, `EDITORIAL_GLOBE_FORMATS_AND_REVIEW_CONTRACT_2026-11-13.md` et `../../continuity/CURRENT_STATE_AND_NEXT_STEP.md`.
