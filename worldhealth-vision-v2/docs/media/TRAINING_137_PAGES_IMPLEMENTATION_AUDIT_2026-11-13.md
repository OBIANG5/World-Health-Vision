# World-Vision — audit de la formation « Monter et animer vos vidéos avec Claude »

**Date de lecture et croisement avec le projet : 13 novembre 2026.**  
**Fichier transmis par l'utilisateur :** `monter-et-animer-vos-videos-avec-claude-v2.pdf` ; **137 pages**. Ce document est une source de méthode et de choix techniques ; il ne donne pas accès au compte Claude ni à un moteur de création d'images. Le projet doit réaliser la même ambition **avec ChatGPT et le code GitHub**, sans prétendre que Claude est indispensable.

## Portée réelle de cet audit (mise au point 13 novembre)

Ce document est un **audit thématique** de plusieurs sections de la formation de 137 pages, et non une relecture certifiée de chaque ligne du PDF ni un audit intégral des fichiers du projet. La documentation du manuel a été extraite pour les chapitres moteur, design system, voix, motion, dérushage, studio, contrôle qualité et animations ; le code inspecté inclut `GeoGlobe.tsx`, `GlobeDirection.tsx`, `ReviewStudio.tsx`, `WorldVisionShort.tsx`, `WorldVisionFirstReport.tsx`, `media-renderer/server.mjs`, `media-service/voiceover.py` et leurs packages. D'autres fichiers et tests restent à examiner avant un avis d'implémentation complète.

**Écart concret :** les frames D00–D05 sont actuellement Canvas/React et ne sont **pas intégrées à une nouvelle composition Remotion animée**, alors que les compositions historiques de Remotion produisaient le premier MP4, rejeté. Le service vocal consulté fait appel à **OpenAI Realtime**, pas à ElevenLabs ou Gemini. Il ne faut pas déclarer ces dernières voix testées sur la base de leur existence dans le cours.

**Distinction éditoriale :** les cinq pays de la vidéo d'inspiration ne sont pas le modèle obligatoire. Le nouveau [contrat des formats de récit](art-direction/EDITORIAL_GLOBE_FORMATS_AND_REVIEW_CONTRACT_2026-11-13.md) définit **un seul pays pour une actualité localisée**, une relation à deux ou plusieurs lieux seulement si l'histoire le nécessite, et un vrai tour du monde seulement lorsqu'il s'agit de ce format.

**État du déploiement :** les CI sont des preuves de compilation/test, pas des confirmations d'un aperçu visible sur iPhone ni des validations artistiques. Il faut comparer le HEAD source au `source_commit` du manifeste de preview.

---

## Ce que la formation demande effectivement

| Pages | Méthode | Adaptation vérifiable pour World-Vision | État |
| --- | --- | --- | --- |
| 4–8 | Deux circuits : montage de vraies vidéos et motion design, combinables | Garder deux pistes distinctes `footage réel` et `graphismes/cartes déterministes` | Partiellement codé, qualité artistique à reconstruire |
| 23–29, 41–44 | Choisir un moteur vidéo et vérifier par essai | Remotion déjà installé : ne pas tout réécrire, mais mesurer qualité, temps de rendu et charge | Moteur présent, premier MP4 rejeté |
| 28–32, 42–45 | Whisper / ElevenLabs pour calage mot à mot | Évaluer la précision sur la narration française et les noms propres; ne pas faire défiler des mots avant transcription vérifiée | Intégration à revalider |
| 32–37, 50–55 | Plusieurs voix Gemini/ElevenLabs à écouter | 3 auditions de la même phrase, notes débit/diction/naturel, choix humain, aucun montant facturé sans accord | PAS fait pour la nouvelle vidéo |
| 41–55 | Prompt moteur, fichier mémoire, étapes une à une, secrets en `.env` | GitHub `docs/continuity/`, registre décision, issue/review liée à artefact, secret backend uniquement | Documentation en place; authentification avis encore manuelle |
| 59–69 | Sources/licences et design systems issus de références | Conserver le logo officiel bleu; créer un seul univers géographique original; ne pas copier les logos, textures, musiques des TikTok reçus | Direction D à juger, pas validée |
| 66–69 | Démo de chaque design system, 3 tableaux, grilles et marges | 6 plans D00–D05 fixes sur téléphone, captures 9:16, safe zones, titres lisibles | Implanté dans site; contrôle mobile CI à maintenir |
| 75–91 | Dérushage, tri, coupes, recadrage, colorimétrie, sous-titres, mixage | Cataloguer chaque clip réel (événement/date/lieu/licence) avant montage; équilibrer luminance et audio | ASSETS technique présent, validation créative insuffisante |
| 93–107 | Animer textes et médias en conservant cohérence | Prototype globe avec vraie géographie, puis court test contrôlé et verrouillé avant intégration | Globe en poses fixes **seulement** |
| 108–114 | Studio, image par image, planche, alertes de chevauchements, extrait court, aperçu téléphone, rendu final seulement après accord | Exiger captures 9:16 six poses, iPhone Playwright, revue humaine et tests automatisés ; ne plus sortir un MP4 complet tout d'un bloc | Tests et parcours en cours; aucune approbation finale |
| 124–132 | Catalogue d'effets, 3 secondes d'essai, un effet dominant et un accent | Globe→pays : mouvement géodésique doux, zoom contrôlé, sous-titres sobres, pas de trait de progression/HOOK public | À implémenter après validation des maquettes |

## Ce qui a été mal fait jusqu'à maintenant

- L'ancien premier reportage a été **encodé** avant qu'on valide le logo, le langage visuel, la voix et les plans. Il était techniquement réel et artistiquement **refusé 1/10**.
- Les trois premières maquettes **A/B/C ont été refusées** par le propriétaire, mais leur rejet n'avait pas été transcrit comme décision définitive dans le logiciel.
- Le moteur vidéo a privilégié des fonds sombres, graphismes répétés, faux habillages de production et une voix de substitution ; cela ne vaut pas direction artistique.
- La référence TikTok du globe a été analysée, mais la proposition D était restée **uniquement documentée**, sans vrais plans à évaluer.
- Le site statique ne sauvegarde pas directement les nouvelles notes dans GitHub sans intervention ; toute affirmation contraire serait trompeuse.
- Une API ou un forfait Google, n8n ou ElevenLabs ne peut pas être considéré comme **connecté** parce qu'il figure dans une brochure ou un abonnement personnel.

## Nouvelle organisation des compétences du projet

**Compétence 1 : sourcing vérifiable** — RADAR, événements, faits, pays, sources, droits.

**Compétence 2 : géographie cinématique** — sélectionner pays/coordonnées, dessiner le globe depuis GeoJSON, valider la première image, puis la rotation et le zoom.

**Compétence 3 : scénographie documentaire** — passer du lieu aux vrais rushes avec plan de coupe (jamais inventer de vidéo du terrain).

**Compétence 4 : narration humaine** — scripts versionnés, 3 voix auditionnées, diction des noms et synchronisation mot par mot.

**Compétence 5 : motion design et postproduction** — Remotion/FFmpeg, colorimétrie, son, transitions limitées, grammaire visuelle commune.

**Compétence 6 : QA et approbation** — captures des plans, 1–10 par aspect, statut bloquant, archive GitHub, restitution iPhone et rendu complet final uniquement si tout est approuvé.

Ces compétences sont des **modules de méthode et de code**. Leur existence documentaire ne doit jamais être annoncée comme « fonctionnalités de production prêtes ».

## Options de services externes (à configurer séparément)

- **Google Flow** : plans génératifs illustratifs quand ils sont pertinents et explicitement présentés comme tels ; les crédits d'application ne constituent pas une authentification API.
- **Gemini / ElevenLabs TTS** : pistes vocales candidates ; l'utilisateur compare de vrais fichiers audio avant choix, puis on valide commercialisation et coûts.
- **Whisper / ElevenLabs Forced Alignment** : calage des sous-titres sur un WAV réellement produit.
- **n8n ou Make** : automatisation de tâches, notifications et transcodages si un serveur et des credentials existent. **Les décisions de validation humaine ne doivent jamais être contournées.**
- **Remotion** : moteur de composition déjà utilisé et approprié pour une carte animée déterministe ; ajouter au besoin une couche 3D cohérente et testée, sans faire de la 3D un but en soi.

## Critères de qualité exigibles avant n'importe quel MP4 public

- Un vrai logo officiel sans altération.
- Images de terrain factuelles ou clairement signalées comme illustration, droits source inscrits.
- Texte principal lisible en 1080×1920 sur téléphone ; aucune ligne de texte technique de production.
- Pas de plan totalement vide, hors cadre, coupé ou superposé.
- Pour un sujet géographique : frontière, pays et ville vérifiés ; cartes sensibles non arbitraires.
- Voix naturelle validée à l'écoute, mixage au casque et au haut-parleur téléphone.
- QA image par image, artefacts SHA-256 et preuves de publication.
- **Décision explicite du propriétaire à chaque porte** ; jamais une approbation inventée par un score ou une CI verte.

**État actuel :** nous sommes encore au premier jalon artistique de la direction D ; ce document ne doit pas être pris pour un avis humain positif.
