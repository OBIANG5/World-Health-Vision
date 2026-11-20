# World-Vision — Studio : réouverture contrôlée des projets (FILM-2C)

**20 novembre 2026.** Branche : `feature/worldvision-studio-project-roundtrip-2026-11-20`, enfant de FILM-2A `feature/worldvision-editorial-film2-captions-2026-11-20` (PR #98, CI `44729319744` certifiée, SHA `eb6bd7d`). Cette branche reste **DRAFT, non fusionnée, non déployée**, jusqu'aux preuves du nouveau HEAD.

## 1. Le goulot de productivité corrigé

Le Studio V2 exportait déjà un projet JSON `worldvision-creative-project-v1`, mais **ne savait pas le recharger**. Refaire manuellement à chaque session un sujet international comprenant dizaines de médias, courbes datées, carte, timings, crédits et sous-titres est un coût majeur. L'amélioration la plus rentable n'est donc pas un nouvel effet, mais le **roundtrip éditable** : exporter → sauvegarder localement → rouvrir → rattacher les mêmes médias → modifier un plan → réexporter, sans refaire les autres.

L'import **n'est pas un moteur de montage**, un nouveau format cloud, un service tiers, ni un système de stockage de médias. C'est la réutilisation stricte du JSON que World-Vision génère déjà. Nous gardons `CreativeEdit.tsx`, le même Remotion Player/MP4 et le moteur source/numérique/géographique de FILM-1. Pas de licence ou dépense supplémentaire.

## 2. Implémentation détaillée

- `services/media-renderer/creative/studio-project-io.mjs` + `.d.mts` : lecteur JSON restreint au format de l'atelier, contrôles déterministes, conversion `studioShotToEditor`, inventaire des références médias `studioAssetNames`, restitution des timecodes `frameCaptionsToSrt`.
- `frontend/web-v2/src/media/CinematicProductionBoard.tsx` : nouveau champ **ROUVRIR UN PROJET (.JSON)** et reconstitution de l'éditeur ; identifiant stable du projet maintenu même si le titre affiché diffère ; aucune modification sur échec d'import ; liste explicite des médias manquants, interdiction d'export tant qu'ils ne sont pas rattachés.
- Conservation des paramètres d'une prise de vue : type et durée de scène, textes, mouvement, transitions, coordonnées géographiques/country ID, contrôle de la caméra, GEO/PHOTO/DATA, séries chronologiques exactes, sources et axes, région d'un document, fichiers média, crédits et source `trimBefore` d'un clip.
- `captions` : les cues globaux sont rechargés avec leurs **positions par phrase** (haut/bas) et leurs numéros d'images exacts ; ils restent identiques jusqu'à la modification explicite du SRT ou du placement. L'affichage SRT est une aide lisible, mais les cues de la source JSON font foi à l'import.
- Photos, voix, musique, vidéo et éventuels détourages **restent dans l'ordinateur/navigateur de l'utilisateur**. Le JSON contient uniquement leurs noms de fichiers (pas de copies, URL distantes, données binaires ou téléversement GitHub). Les références absentes ne sont jamais remplacées par des sources inventées ni par des placeholders de production.
- Les crédits média, références de source et minutages importés sont conservés et réexportés pour préserver la traçabilité, **sans affirmer que ces crédits ou licences sont authentiques** : contrôle rédactionnel et légal distinct.

## 3. Règles de refus (fail closed)

Le parseur bloque notamment : JSON invalide ou supérieur à 2 Mo ; version/fps/aspect hors profil 9:16 30 fps ; scripts vides ou trop longs ; IDs incorrects/répétés ; media URLs et chemins `../` ; fichiers non pris en charge ; champs inconnus risquant une perte silencieuse ; transitions incohérentes ; captions en dehors de la durée film, chevauchées ou invalides ; style, volume audio, libellé de voix ou durée d'outro que l'atelier ne sait pas conserver strictement.

**Périmètre assumé** : seuls les JSON **exportés par la version actuelle de cet atelier** sont éligibles ; ce n'est pas un importeur de n'importe quel projet Remotion, After Effects ou d'un manifeste journalistique externe. L'atelier préserve le projet et donne une erreur explicite plutôt que transformer silencieusement un modèle non pris en charge. Les médias imbriqués dans des sous-dossiers sont encore du domaine du renderer CLI et demandent une future normalisation de références si nous étendons le Studio.

## 4. Tests conçus avant PR

1. **Node** : `creative/studio-project-io.test.mjs` — lecture du projet exemple existant ; crédits et point de coupe vidéo ; voix/musique ; deux sous-titres positions alternées ; DATA dates/valeurs/source/unité ; GEO caméra/pays/route ; PHOTO camera/masque/sujet ; refus chemin malicieux, champ inconnu, volume non conservable et captions incohérentes.
2. **Chromium vrai Studio 390 × 844** : nouvelle page CI locale `studio-project-smoke.html` monte réellement `CinematicProductionBoard`. Le test `creative/test-studio-reimport-browser.mjs` charge un projet avec photo initialement absente : l'export doit être bloqué et la source demandée. Après import de la photo synthétique existante, l'export doit devenir possible ; le JSON généré par le véritable bouton est inspecté : **même ID, texte, durée, crédit, fichier et deux cues avec positions différentes**. Un JSON invalide soumis ensuite ne doit pas écraser le projet ouvert.
3. **Non-régression** : `.github/workflows/worldvision-cinematic-director-gates.yml` conserve compilation V2, Node, Chromium Player, MP4 H.264/AAC et les cinq grammaires du film synthétique ; ajoute la preuve de réouverture dans son artefact. **Aucune ancienne protection n'a été supprimée**.
4. **Preuves à obtenir** : run réussi sur le **SHA exact** après ouverture PR, PNG `studio-reimport-mobile-390.png`, rapport JSON, comparaison du contenu exporté, contrôle visuel indépendant et vérification de l'absence d'upload distant. Tant que non achevé, état **CODE AJOUTÉ, NON CERTIFIÉ**.

## 5. Priorités stratégiques après certification

**La vraie suite est FILM-2B, un premier reportage premium basé sur des médias authentiques autorisés** : dossier `FILM2B_PREPROD_ARTEMIS2_IMPACT_FLASHES_2026-11-20.md` sur la branche mère et les précisions NASA / droits dans les commentaires PR #98. Le sujet : rapport NASA publié le 17 novembre 2026, consacré notamment aux cinq flashes d'impacts *rapportés* durant le survol d'avril ; ne pas présenter l'événement d'avril comme une breaking news du 20/11. Ne pas confondre photo lunaire et animation annotée, ni reprendre la musique Universal Production Music du clip NASA sans permission.

Prochaines phases :

- constituer 2–3 assets NASA **licites et attribués individuellement**, avec original, institution, crédit, droit d'utilisation, type « photo réelle » versus « visualisation scientifique », SHA et limites de diffusion ; stocker les binaires hors GitHub public ;
- sélectionner un script FR sourcé, une voix choisie/licenciée (aucun narrateur imposé), aligner l'audio final mot à mot puis caler nos captions globales, mesurer loudness et ducking sans dénaturer la narration ;
- créer **une vraie vidéo de 20–40 s**, uniquement les plans narrativement nécessaires ; essai A/B avec références Bourse Express et géopolitique, revue aux vrais pixels 360px avec overlays TikTok, iPhone et Android, éventuellement clips externes issus des meilleurs logiciels autorisés ;
- mesurer temps entre commande et premier master acceptable, temps d'une correction, coût par minute et score de qualité ; créer des presets uniquement à partir des scènes artistiquement approuvées ;
- préparer ensuite la convergence des PR empilées et intégration V2 **uniquement après validation humaine explicite**, audit droits, sécurité et performances. Ne pas détourner ce sprint vers GDELT, blog ou BAOCOM.

## 6. Contrat de reprise inter-chats

Toujours commencer par `CONTINUITE_WORLD_VISION.md` et vérifier la **PR actuelle / HEAD GitHub / CI du SHA final** avant toute affirmation. Documenter à la fin : SHA exact, PR, Actions, artefact, résultat Node/Chromium/MP4, défauts et tests non effectués. Ne pas mélanger compétences de l'agent, qualité du code, rendu réellement vu, autorisation journalistique et publication. Si une CI est en cours, **éviter les commits documentaires qui annulent les longs rendus** ; écrire les résultats dans un commentaire PR vérifiable.
