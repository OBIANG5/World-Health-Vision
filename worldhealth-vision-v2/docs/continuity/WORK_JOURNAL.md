# World-Vision — journal de travail évolutif

**Principe :** journal **append-only**. Ajouter une entrée par session ou incrément utile. **Ne pas effacer les entrées anciennes** au prochain chat. Chaque entrée distingue code, tests, déploiement et approbation humaine.

## 2026-11-13, 15 h 26 CET — alerte conversation expirée, état réel et correction du format

**Demande utilisateur explicite :** risque de perte du chat, priorité à la documentation GitHub ; préciser le jalon présent et l'état réel du comparatif du PDF de 137 pages, du code de montage, de Google Flow/Gemini, ElevenLabs, n8n et Make. **Rappel majeur :** la vidéo TikTok d'inspiration présentait plusieurs pays, mais World-Vision ne doit **pas** imposer plusieurs pays par vidéo.

**Constat vérifié dans les sources de code GitHub :**
- `GeoGlobe.tsx` : projection orthographique Canvas avec données pays GeoJSON ; maquettes fixes. Aucun moteur photo-satellite ni animation Remotion du nouveau globe dans ce module.
- `GlobeDirection.tsx` : six poses D00–D05 et notes par image, démonstration d'un **seul pays** (Turquie / Antalya).
- `WorldVisionFirstReport.tsx`, `WorldVisionShort.tsx` : compositions Remotion historiques ; le premier MP4 est rejeté artistiquement 1/10.
- `services/media-renderer/server.mjs` : capacité de rendu MP4/FFmpeg, normalisation audio, jobs et stockage ; infrastructure de rendu existante mais pas un nouvel épisode approuvé.
- `services/media-service/src/media_service/voiceover.py` : narration API **OpenAI Realtime** avec transcription/QA ; n'est PAS la voix Gemini/ElevenLabs choisie par l'utilisateur.
- `frontend/web-v2/package.json` : React/Vite, aucune dépendance de globe photoréaliste dans cette application.
- Des tests CI GitHub ont été verts précédemment, mais **aucun test ne remplace l'accord artistique du propriétaire**.

**Cours de 137 pages :** fichier retrouvé dans la Library `monter-et-animer-vos-videos-avec-claude-v2.pdf`, sections consultées sur workflow, choix de moteur, mémoire des décisions, design system, médias et droits, mixage, studio et QA. Le rapprochement partiel avec le code existe dans `docs/media/TRAINING_137_PAGES_IMPLEMENTATION_AUDIT_2026-11-13.md`. **Ne pas affirmer un audit exhaustif de chaque page et chaque ligne de code.**

**Recherche de faisabilité externe :** API de vidéo Gemini/Veo documentée par Google ; API ElevenLabs TTS et Forced Alignment documentées par ElevenLabs. Ces services sont disponibles comme options techniques *à qualifier*, mais **aucune authentification, quota, voix ni budget n'a été configuré ou approuvé** dans le repo. Les workflows n8n/Make restent des idées et non un moteur actif.
- https://ai.google.dev/gemini-api/docs/video
- https://elevenlabs.io/docs/overview/capabilities/text-to-speech
- https://elevenlabs.io/docs/overview/capabilities/forced-alignment

**Action réellement enregistrée dans GitHub :**
- Nouveau contrat `docs/media/art-direction/EDITORIAL_GLOBE_FORMATS_AND_REVIEW_CONTRACT_2026-11-13.md` détaillant `single_location` (un seul lieu), `related_locations` (relation justifiant plusieurs lieux) et `global_overview` (véritable tour du monde).
- Mise à jour `docs/continuity/CURRENT_STATE_AND_NEXT_STEP.md` : G1 en cours, code D00–D05 fixes, audit partiel, connecteurs non configurés.

**Statut :** logo validé ; anciennes A/B/C refusées ; D00–D05 non approuvées ; pas de voix candidate approuvée, pas de nouvelle animation vidéo, pas de publication.

**Prochain livrable :** inspection de la vraie capture D00, amélioration du cadrage/relief/luminosité si nécessaire, puis **évaluation du premier plan visuel**, pas d'assemblage final.

---

## 2026-11-13 — reprise de l'identité géographique après rejet d'A/B/C

**Demande de l'utilisateur :** continuer le logiciel sans perdre le fil ; les trois directions initiales A/B/C sont jugées « moches » et rejetées. Les deux anciennes vidéos TikTok inspiraient un globe terrestre tournant vers le pays de l'actualité, suivi du zoom et d'images/vidéos réelles. Les nouveaux rendus doivent être magnifiques, minutieux et évaluables à **chaque étape**, jamais entièrement montés d'un coup. Le prompt historique exact reste inaccessible, malgré la récupération du contexte.

**Source pédagogique retrouvée :** `monter-et-animer-vos-videos-avec-claude-v2.pdf`, **137 pages**. Chapitres sur design systems, outils, mémoire des décisions, motion design, dérushage, voix, alignement et QA consultés. L'adaptation technique est dans `docs/media/TRAINING_137_PAGES_IMPLEMENTATION_AUDIT_2026-11-13.md`.

**Code ajouté ou modifié :**
- `docs/media/art-direction/WORLD_VISION_GLOBE_SIGNATURE_DIRECTIVE_2026-11-13.md` : règles de la nouvelle identité, rejet A/B/C sans scores inventés, porte d'approbation.
- `frontend/web-v2/src/media/GeoGlobe.tsx` : projection géographique orthographique depuis `public/countries.geojson`, effet de lumière/atmosphère et ciblage Turquie/Antalya pour un exemple déjà sourcé.
- `frontend/web-v2/src/media/GlobeDirection.tsx` + CSS : six maquettes fixes D00–D05 avec contrôle individuel, note 1–10, commentaire et lien d'avis GitHub. Aucun nouveau MP4 généré.
- `CreativeDirections.tsx`, `ReviewStudio.tsx` : remplacement des anciennes propositions A/B/C par la direction globe ; scores anciens encore conservés dans le stockage local lorsqu'ils existent.
- `ProductionJourney.tsx`, `MediaStudio.tsx` : mise à jour de l'accès depuis le lien permanent pour montrer clairement le nouveau travail.
- `frontend/web-v2/media-preview-smoke.mjs` : tests iPhone sur les six plans, vraie source GeoJSON, persistance d'avis D00 et captures par plan.

**Observation technique et design des premières captures :**
- CI/frontend et preview iPhone ont passé les tests sur le commit `728b1a504581`.
- Les images initiales `style-frame-globe-d00.png`, `...d02.png`, `...d03.png` et `...d04.png` ont été inspectées : le globe est géographiquement lisible, mais la composition présentait un titre trop encombrant et des marqueurs techniques visibles dans le cadre. Correctifs : titre plus court, suppression des mentions de production à l'écran. Ces corrections sont en attente d'une nouvelle preview après les derniers commits documentaires.
- **Ce rendu vectoriel n'est pas encore le globe 3D/satellite premium demandé** et le plan D03 n'a pas encore d'extrait de reportage authentique licencié ; le site le signale honnêtement.
- La première voix Piper reste rejetée ; aucun accès API Gemini/ElevenLabs/Flow, n8n ou Make n'a été configuré.

**Droits et véracité :** ne pas rediffuser la vidéo TikTok de référence ni copier ses textures/audio. Cartes : fichiers géographiques intégrés à la V2. Sujet d'exemple : COP31/Antalya sourcé UNICEF/FAO. Les vrais plans de terrain devront être trouvés, autorisés et approuvés indépendamment.

**Statut de cette session :** logiciel modifié et documentation commitée ; nouvelle direction D **NON approuvée**. A/B/C sont refusées. Aucune publication.
**Action suivante :** vérifier le run de preview au dernier HEAD, les captures d'images D00–D05 sur téléphone, corriger toute faute de composition puis soumettre le plan D00 à l'utilisateur. Ne pas passer au court mouvement de 3–6 secondes avant validation du style correspondant.

---

## 2026-11-13 — vidéo géopolitique renvoyée, analyse réelle et traçabilité

**Entrée utilisateur :** une vidéo MP4 a été remise afin de retrouver l'inspiration pour la signature géographique World-Vision et d'éviter de perdre ce travail si le chat bloque.

**Preuves locales réellement vérifiées :**
- Fichier : `v26044gc0000dbrcrf7og65qnjb2qh6g(1).mp4`, 38 285 831 octets.
- SHA-256 : `4e4e979144b59ee9359287c75773cfbbb5cefbd12d05f71ec9ba3bd66f3328bb`.
- FFprobe : 64,921667 s, 512×910, H.264 ~30fps, stéréo HE-AAC 44,1 kHz.
- Inspection visuelle des captures à 2 s d'intervalle : intro globe; Mexique; Royaume-Uni; Riyad/Bruxelles; Soudan du Sud; Turquie/Chine, cadres géographiques, contours rouges, lignes pointillées, sous-titres blancs/jaunes.
- Filigrane visible : `@focus.geopolitique`. Source/usage commercial des graphismes, de la voix, de la musique et des textures **non autorisés** par défaut.
- Les **faits d'actualité narrés dans la vidéo tierce ne sont pas réputés vérifiés** par cette analyse technique.

**Modifications GitHub :**
- `docs/media/references/2026-11-13-focus-geopolitique-video-reference.md` — étude chronométrée, règles de design et proposition D.
- `docs/media/references/2026-11-13-focus-geopolitique-video-reference.json` — manifeste source avec SHA exact.
- `docs/continuity/RECOVERED_TIKTOK_VIDEO_REFERENCES_2026-11-13.md` — correction de l'ancien état « aucune vidéo retrouvée ».
- `docs/continuity/CURRENT_STATE_AND_NEXT_STEP.md` — état à jour avec référence D.
- La source originale **n'est PAS dans GitHub** : stockage séparé requis pour pérenniser les 38 Mo et droits tiers à clarifier.

**Décision artistique :** A/B/C restent non validées. D « Globe → pays → information vérifiée » est seulement une nouvelle piste étayée par une vidéo réellement examinée ; aucune note ni validation n'a été attribuée à D.

**Prochaine étape :** faire comparer au propriétaire une maquette fixe indépendante D à A/B/C, puis **seulement si validée**, prototype animé 3–6 s ; suivre ensuite le protocole d'évaluations.

**Tests :** métadonnées et hash calculés directement sur le MP4 ; documentation commise dans la branche média. Aucun CI d'application ni nouveau déploiement nécessaire pour cette étude documentaire.

---

## 2026-11-13 — livraison finale du lien et du dossier de reprise

- **Dernière UI réellement publiée :** code source `ab4a7410f89b7a19e2db652950e95e8036fcb7fb`, commit de la branche d'aperçu `596de0202df2c47909f1db13a9696074477e8565`.
- **Workflow iPhone/desktop :** [run #43436631737](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43436631737) = `completed / success`. Les contrôles incluent accès A/B/C depuis l'ancien lien, affichage de la version, 14 étapes, avis COP31 conservé, maquettes et sources.
- **Historique accessible depuis le site :** lien visible « Historique intégral & reprise du projet » vers [Issue #11](https://github.com/OBIANG5/World-Health-Vision/issues/11).
- **Documentation supplémentaire :** [inventaire 26 branches](BRANCHES_SNAPSHOT_2026-11-13.md), [guide de cache](PREVIEW_RELEASES_AND_CACHE.md), [index du projet](README.md), [décisions](DECISION_REGISTER.md), [état](CURRENT_STATE_AND_NEXT_STEP.md), [prompt nouveau chat](NEW_CHAT_HANDOFF.md) et [chronologie](PROJECT_TIMELINE.md).
- **Limite constatée :** RawGitHack garde des caches temporaires ; les fichiers et le build sont prouvés sur GitHub mais leur affichage instantané sur chaque navigateur n'est pas garanti.
- **Validation humaine encore attendue :** A/B/C ; aucune nouvelle animation/voix/vidéo finale ne doit être démarrée au simple prétexte que les tests sont verts.
- **Observation de prudence Vercel :** un projet existant `world-health-vision-v2` appartient à la plateforme globale ; **ne pas le réutiliser/écraser** pour Media Studio sans identifier et approuver explicitement le projet et les règles de déploiement. Aucun changement Vercel n'a été réalisé dans cette session.

---

## 2026-11-13 — session de continuité après question « Pourquoi le lien permanent n'est-il pas à jour ? »

**Demande utilisateur :** ne pas avoir à ouvrir plusieurs liens pour voir les nouveaux designs, garder **une URL permanente et mise à jour**, et sauvegarder dans GitHub l'historique depuis l'origine, avec instructions de reprise quand les chats ChatGPT se bloquent.

**Diagnostic vérifié :**
- Dernière preview vérifiée lors de l'examen : branche `whv-media-studio-browser-preview` HEAD `a7d991a1287485b22a1dce30bb00f5f501738f49`, manifeste `source_commit=95fafc93895b64f73724cb61b374a8f4d6a32e31`.
- Les images `style-frame-terrain.png`, `style-frame-chiffres.png`, `style-frame-pedagogie.png` et `editorial/harvey-rescue-2017.jpg` étaient **dans le dépôt de preview** ; dernier workflow de preview associé à `95fafc938` conclu `success`.
- Mais l'URL historique `?view=media` ouvrait toujours le parcours 14 étapes au lieu de l'écran G1, donc la dernière activité était **peu visible**.
- RawGitHack utilise du cache ; sur l'URL de développement d'une branche, de nouveaux commits peuvent n'être reflétés qu'après quelques minutes, voire jusqu'à une heure en fort trafic. **Le query string ne constitue pas une purge de cache fiable.**
- L'URL du site est différente d'une branche source : `feature/world-vision-media-studio` = code, `whv-media-studio-browser-preview` = fichiers compilés. Ne pas affirmer « le site est à jour » sur la seule base d'un push sur la branche source.

**Modifications de cette session :**
1. Ajout d'un bandeau « Les trois nouvelles ouvertures sont disponibles ici » sur la **page d'accueil Parcours vidéo**, avec bouton direct « Voir A, B et C · noter une proposition » vers G1 (sans modifier l'adresse du lien permanent).
2. Ajout d'une bande de provenance de version dans l'interface publique, lisant `preview-deployment.json` (12 premiers caractères du `source_commit`) et renvoyant à GitHub pour vérification.
3. Conservation de l'onglet « Noter & valider » et du parcours complet ; ne pas faire disparaître les avis utilisateur au changement de page.
4. Création d'un [index Git de 586 commits](COMMIT_HISTORY_INDEX.md), incluant les ancêtres de janvier 2026 à novembre 2026 ; les commits postérieurs à la date d'indexation restent accessibles dans l'historique natif.
5. Reconstitution chronologique de la V0, de la V2, de la restauration OneDrive, du Media Studio, des épisodes de rendu, des refus 1/10, du logo officiel confirmé et des maquettes A/B/C (voir [PROJECT_TIMELINE.md](PROJECT_TIMELINE.md)).
6. Création du [registre de décisions humaines](DECISION_REGISTER.md), de l'[état de reprise](CURRENT_STATE_AND_NEXT_STEP.md) et du [mode d'emploi pour un nouveau chat](NEW_CHAT_HANDOFF.md).
7. Mise en place d'une entrée de documentation à la racine du dépôt et d'un index de référence dans `docs/continuity/`.

**Validation humaine actuelle :** logo bleu approuvé sans note ; **aucune** direction A/B/C approuvée ; première vidéo COP31 refusée 1/10 ; **pas de nouveau MP4**.

**Contrôles réalisés avant clôture :**
- Source UI du déploiement : commit `8cb97eccded03d4dc066dcec55ea6efb026278ba`.
- Workflow mobile : [run #43435702707](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43435702707), **completed/success** avec test iPhone : l'ancien lien `?view=media` expose désormais un panneau A/B/C et le bouton ouvre les trois maquettes ; lecture du SHA de version testée.
- CI source même commit : [run #43435710013](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43435710013), **completed/success**.
- Branche de prévisualisation compilée lors du contrôle : commit `060362eb3f7dc14c6ee2e2aa6b99838612446f0f`. Son `preview-deployment.json` désigne bien `8cb97eccded0`.
- Lien GitHub grand public de reprise : [Issue #11 — START HERE](https://github.com/OBIANG5/World-Health-Vision/issues/11), créée pour rester accessible même lorsqu'un nouveau chat ne sélectionne pas la bonne branche.
- **Limite de vérification :** les tests ont vérifié le frontend réellement compilé et les fichiers poussés. Ils **ne prouvent pas** que le CDN RawGitHack a renouvelé son cache sur tous les iPhones au même instant. La bande de version rend ce décalage observable ; ne pas dire que le cache a été purgé.

**Test manuel utilisateur encore nécessaire :** regarder le panneau sur le lien permanent depuis son iPhone et choisir/noter A, B ou C.

**Prochaine décision utilisateur :** examiner les trois designs A/B/C et choisir/évaluer celui qui servira de direction de base. Si les trois sont refusés, corriger uniquement les maquettes, puis redemander notation.

---

## 2026-11-13 — décisions antérieures conservées

- Logo : PNG bleu œil+globe original confirmé comme identité actuelle ; variantes vertes et multicolores reportées.
- Premier MP4 COP31 généré et inspecté ; refus **1/10 partout**, [Issue #9](https://github.com/OBIANG5/World-Health-Vision/issues/9).
- Formulaire de notation : correctifs mobile, persistence local/session et archive GitHub ; confirmation manuelle toujours nécessaire pour les nouvelles Issues.
- Trois orientations 9:16 documentaires/chiffrées/pédagogiques avec logos officiels, faits sourcés UNICEF/FAO et photo archives U.S. Army/Houston 2017 ; tests de chargement JPEG et SHA-256.
- Aucune des propositions n'a été validée.

---

## 2026-11-12 — travaux antérieurs (synthèse, pas une transcription de chat)

- Construction du code Media Studio : RADAR, VERIFY, SCORE, approbation, CREATIVE, ASSETS, audio, Remotion, QA, manifests, différenciation TikTok/WhatsApp, reçus de publication, Control Room.
- Développement d'un aperçu statique compilé de V2 pour iPhone/desktop avec branche `whv-media-studio-browser-preview`.
- Six familles CI pour le moteur (frontend V2, service média, PostgreSQL, gateway, Compose, renderer) ; les résultats doivent être revérifiés au nouveau HEAD.
- [PR #5](https://github.com/OBIANG5/World-Health-Vision/pull/5) reste en draft vers `v2`.

---

## Depuis janvier 2026 — notes de source

L'historique technique antérieur est présent dans [COMMIT_HISTORY_INDEX.md](COMMIT_HISTORY_INDEX.md) et les documents `docs/media/REPRISE_PROJET_WORLD_VISION_2026-11-12.md`, `docs/architecture/*` et les branches `v0`, `v1`, `v2`. Il ne faut pas le réécrire à partir d'une supposition : lire les commits et notes datées.

## Modèle pour la prochaine entrée

```markdown
## AAAA-MM-JJ — [nom de l'incrément]
Objectif :
Faits/limitations vérifiés avant modification :
Fichiers et commits modifiés :
Tests (run URL + conclusion exacte) :
Aperçu téléphone (URL stable + source_commit affiché) :
Capture(s) / SHA médias :
Validation/refus de l'utilisateur :
Problèmes ouverts :
Prochaine action soumise à validation :
```

---

## 2026-11-13 — nouveau chat : lecture, vérification GitHub et audit de reprise

**Demande :** le propriétaire fournit la dernière réponse du chat bloqué et demande de relire tout le contexte accessible, la branche du média et le point d'arrêt réel. **Aucune nouvelle direction, voix, animation ou diffusion n'est validée dans cette session.**

**Travail vérifié :** lecture des références de continuité et décisions, de la documentation Media Studio/formation, de la directive géographique et de modules de code (frontend, API, Remotion/FFmpeg). Vérification réelle des branches, PR #5 (ouverte, draft), PR #6 (fusionnée), issues #8/#9/#11, SHAs et manifeste de preview ; la CI associée au SHA source initial `c422eafa1bbb...` est marquée success. L'aperçu pointe vers `e57207ba1b19...`, cinq commits documentaires avant ce SHA, sans modification du frontend entre ces points. Les 521 fichiers de la branche ont été inventoriés, **pas tous lus ligne par ligne**.

**Preuve durable créée :** [MEDIA_STUDIO_RECOVERY_AUDIT_2026-11-13.md](MEDIA_STUDIO_RECOVERY_AUDIT_2026-11-13.md) (audit détaillé avec liens et limites), commit `0a4a7495c7f21268fad377cfa77b7c385b55215f`.

**Décisions préservées :** G0 logo bleu approuvé ; MP4 COP31 1/10 refusé ; A/B/C refusées ; G1 direction D00–D05 fixes et non approuvées ; un seul pays si événement local ; services externes non prouvés connectés. **Aucun changement audiovisuel ou déploiement n'a été réalisé dans cette session de lecture.**

**Prochaine action maintenue :** inspecter la capture du D00 réellement publiée et améliorer seulement ce premier plan, montrer le rendu sur téléphone, recueillir l'avis explicite avant toute animation ou passage à D01–D05.


---

## 2026-11-13 — G1/D00, itérations du globe dans l'œil, nouvelle image et exigences

**Demande utilisateur :** construire minutieusement l'identité audiovisuelle World-Vision, avec globe géant tournant plus tard ; forme de l'œil tirée des **deux arcs du vrai logo**. Retours successifs : globe beau, mais arc/cercle trop visible ou incorrect ; garder exactement deux arcs fins non fermés, plus grands que le cadre, sans afficher leurs extrémités. Augmenter la taille de la Terre, conserver l'atmosphère bleue, rendre les frontières nationales très claires, éliminer les lumières nocturnes, le petit soleil, les nuages décoratifs hors planète et réduire les étoiles.

**Travail de cette session :** véritable logo PNG officiel lu dans GitHub et inspecté visuellement (SHA blob `bc80fa70cebd566768bfb1703a0f1f636a78c196`). Nouvelle proposition d'image fixe D00-v4 générée dans le chat ; dimensions 1086 × 1448, SHA-256 `5f97e5f0d29551e187b50106e0aaf2f00e700062a9a2f5845dbf9f9715b6a90e`. Elle n'est **pas validée** et n'est **pas encore un rendu 9:16, une géographie certifiée ou un film**.

**Éléments enregistrés sur GitHub :**
- [Historique précis des quatre images et des retours](../media/art-direction/D00_EYE_GLOBE_VISUAL_ITERATIONS_2026-11-13.md).
- [Contrat JSON exploitable pour le futur globe codé](../media/art-direction/d00-eye-globe-visual-contract-v4.json).
- Décisions de conception et corrections D-018 à D-022 ajoutées dans `DECISION_REGISTER.md`.
- État courant maintenu dans `CURRENT_STATE_AND_NEXT_STEP.md`.

**Limitation de sauvegarde :** le PNG D00-v4 est un fichier généré dans la session ChatGPT ; **son binaire n'a pas été envoyé sur GitHub**. Son hash et ses caractéristiques y sont inscrits pour éviter les confusions de version. Le PNG source officiel du logo reste inchangé. Aucun nouveau build du site d'aperçu, aucun MP4 et aucun rendu Three.js/Blender/Remotion n'ont été exécutés ici.

**Prochaine étape après avis humain :** corriger les défauts éventuels de cette proposition, puis réaliser un vrai globe 3D reproductible avec frontières GeoJSON, émission atmosphérique contrôlée et arcs paramétriques, d'abord en still vertical 1080×1920 ; ne passer aux mouvements caméra/globe de 3–6 s qu'après validation.


---

## 13 novembre 2026 — D00-v6 et conservation intégrale du parcours vidéo 137 pages

**Retour de l'utilisateur :** D00-v5 est jugée « très belle », mais il faut un **blanc d'œil réellement blanc**, une **lumière de l'atmosphère terrestre plus claire que les deux arcs**, et des **frontières nationales mieux tracées** (notamment Afrique/Sahara), sans changer la bonne taille actuelle de la Terre. L'étape suivante sera de **transformer le globe en vidéo** : le globe doit se tourner à chaque nouvelle pertinente vers **le pays** où se situe l'événement ; ce n'est pas toujours un format multi-pays. Le propriétaire rappelle de ne perdre **aucune** étape du PDF, en particulier les futures voix, le montage et l'habillage discret avec le véritable logo (éventuellement en haut à gauche, lieu non validé).

**Production réalisée dans le chat :** D00-v6, image de conception `a_crisp_ultra_detailed_high_contrast_digital_ill.png`, 1086×1448, 2 296 765 octets, hash réel SHA-256 `8d9a9d20f20fbf7757713b6f5eab06590f191166eb779865747f0f59683cfca2`. **Pas de retour utilisateur sur v6 à cette étape. Aucun MP4 codé, aucune vidéo animée, aucune validation D00.** Le concept image peut présenter des frontières de pays non exactes ; le moteur futur devra projeter de vrais polygones GIS. Les PNG originaux v5/v6 restent hors GitHub ; metadata et exigences enregistrées seulement.

**Vérification de la formation source :** fichier original `monter-et-animer-vos-videos-avec-claude-v2.pdf` retrouvé dans la Library (137 pages) ; texte des neuf parties consulté de la page 1 à 137. Accès au binaire intégral de la Library par materialize indisponible. Le document GitHub `TRAINING_137_PAGES_IMPLEMENTATION_AUDIT_2026-11-13.md` a été enrichi des sections et des quatre skills. **Cet examen du cours ne constitue pas un audit complet/exécuté de tout le code.**

**Nouveaux livrables GitHub :**
- `docs/media/AUDIOVISUAL_PRODUCTION_MASTER_PLAN_2026-11-13.md` : neuf parties du manuel, 14 étapes du produit, géociblage, test moteur 3D, trois voix, alignement, montage rushes, SRT, rendu long, position logo, qa et publications.
- `docs/media/art-direction/d00-eye-globe-visual-contract-v6.json` : contrat structuré pour le code futur, statut d'approbation et empreinte de la v6.
- `docs/media/art-direction/D00_EYE_GLOBE_VISUAL_ITERATIONS_2026-11-13.md` complété pour les images v5 et v6 avec retours exacts.
- `docs/continuity/DECISION_REGISTER.md` étendu avec D-023–D-026, `docs/media/TRAINING_137_PAGES_IMPLEMENTATION_AUDIT_2026-11-13.md` enrichi.

**Travail non réalisé :** pas de connexion Flow/ElevenLabs/Gemini/n8n/Make, pas de voix auditionnée, pas de scène de reportage intégrée, pas de rendu Remotion 3D/Blender, pas de nouvelle preview GitHack publiée et pas d'export TikTok/WhatsApp. **Ne pas fusionner la PR #5 ni publier un contenu.**

**Prochaine décision :** validation ou correction D00-v6 par le propriétaire. Ensuite image finale 9:16 calculée (atmosphère, frontières fiables, œil), QA mobile, puis D01 et micro-clip 3–6 s ; conserver les gates du PDF pour la voix et le montage.


### Complément — visibilité du plan sur le site (après le plan directeur D00-v6)

- **Code frontend modifié :** `ProductionJourney.tsx` (commit `fa26c788b463269f64afbb760a4099d8e2498f35`) et `ProductionJourney.css` (commit `00224feaaffb97c13a65e2518ee301d7aaefa910`). L'accueil du Media Studio montre un **statut D00-v6 non validé**, les prochaines étapes du parcours vidéo et un lien clair vers le plan directeur du manuel, en précisant que les six captures du laboratoire sont **plus anciennes**.
- **CI de compilation** pour le commit source `00224fea...` : succès [run #43457617960](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43457617960).
- **Workflow de preview** [run #43457606661](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43457606661), statut **in_progress** lors du contrôle initial. Ne pas prétendre à une livraison CDN réussie tant que le manifeste n'est pas actualisé et que le run n'est pas vert.
- **Image D00-v6** : toujours absente des fichiers publiés dans GitHack ; le site ne contient que le **statut et les instructions**, pas les pixels de ce visuel. Aucune vidéo CGI tournante n'a été produite.


### Confirmation de publication du panneau de continuité (13 novembre, contrôle final)

Le workflow [World-Vision Media Studio real-UI mobile preview #43457606661](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43457606661) est désormais **completed / success** (y compris build React, test Playwright iPhone/desktop, publication de la branche de preview). Branche de preview : HEAD `bdd6277fd88b9a5eebefe1e1737ac6ad19d31931`, manifeste `source_commit=00224feaaffb97c13a65e2518ee301d7aaefa910`. **Ce qu'il prouve** : le panneau « D00-v6 non encore validé » et la feuille de route sont intégrés au bundle statique. **Ce qu'il ne prouve pas** : synchronisation instantanée du cache RawGitHack, présence des pixels du concept D00-v6, moteur 3D fonctionnel, ou backend actif. Les captures anciennes du laboratoire restent explicitement distinguées de la nouvelle image dans l'UI.


---

## 2026-11-13 — récupération d'une réponse interrompue et vérification géociblage

Le propriétaire a signalé « A cessé de réfléchir » durant la construction du laboratoire géographique. **Code conservé dans GitHub** : `geoTargeting.mjs`, `geoTargeting.d.mts`, `geoTargeting.test.mjs`, `GeoTargetingLab.tsx/.css`, adaptation `GeoGlobe.tsx` et intégration `GlobeDirection` → `CreativeDirections` → `ReviewStudio`. Aucun reset, aucun abandon.

**Preuves techniques :** dernier run CI source observé `43460449189` → six jobs terminés avec succès, dont tests `node --test` des coordonnées et front TypeScript. Dernier run de site mobile observé `43460509829` → `completed/success` ; manifeste preview `source_commit=30f280b089148dd12768ce67d6bf7adea270419b` ; branche preview `08492abc9ab7ab55f2beebb4e0f1d268e8365765`. Capture Playwright `media-globe-motion-lab-iphone.png`, blob `a1dae4c14ab68e352cdcc21fda58deac7cc91fa4`. Le test vérifie la sélection Gabon, le mouvement, le reset, puis le Mali.

**Document de reprise détaillé :** `docs/media/GEO_TARGETING_MOTION_LAB_2026-11-13.md` (créé au commit `44045d957518a3e59da204714bd45ffe8d55ea57`). Code réellement interactif **Canvas/GeoJSON**, pas CGI satellite, pas MP4, pas de publication d'actualité et aucune approbation implicite de D00-v6.

**Suite** : retour utilisateur sur le prototype fonctionnel, puis master CGI 9:16 visuellement fidèle à la signature œil/globe validable (blanc pur, halo atmosphérique, frontières précises), puis micro-animation 3–6 s vers pays d'une nouvelle réelle ; continuer le pipeline voix, montage et QA du manuel de 137 pages.


---

## 13 novembre 2026, 17h (Europe/Paris) — PREMIER MOTEUR GÉOCIBLÉ CODÉ, TESTÉ ET PUBLIÉ SUR LE SITE

**Décision de travail :** développer la brique technique la plus utile avant une vidéo complète : faire **tourner le globe vers un pays du dossier médiatique**, avec géographie réelle vérifiable, sans supposer que la composition D00-v6 ou la voix/montage sont déjà validés. La directive G0 (logo bleu officiel) et l'historique D00-v1–v6 restent intacts.

**Source de vérité du code écrit :**
- `frontend/web-v2/src/media/geoTargeting.mjs` et `geoTargeting.d.mts` : calcul sans DOM (SLERP/easing, longitude/antiméridien, extraction de pays via GeoJSON, `MediaStory.country_iso3`).
- `geoTargeting.test.mjs` : tests Node, cas antipodal, longitude ±180°, Mali, Niger, Gabon, France, Japon, Fidji, cas sans destination. La géographie de base vient du **vrai** `public/countries.geojson` du projet, pas d'un croquis IA.
- `GeoGlobe.tsx` : refonte incrémentale (thème espace, halo bleu, vecteurs exacts sur face visible à l'arrivée). **Rendu Canvas 2.5D technique, PAS le master satellite CGI**.
- `GeoTargetingLab.tsx` et `GeoTargetingLab.css` : module interactif intégré par `GlobeDirection.tsx → CreativeDirections.tsx → ReviewStudio.tsx`. Contrôles de sélection pays, mouvement 4 s, curseur, reset, état sans ISO3, provenance et avertissement centre approximatif.
- `GlobeDirection.css` : raccourci visible vers le nouveau laboratoire depuis la page de revue, sans supprimer les **six images fixes historiques**.
- `media-preview-smoke.mjs` : Playwright iPhone sélectionne Gabon et Mali, vérifie que la rotation progresse, la réinitialisation, prend une capture **en cours** et une capture **à l'arrivée au Gabon**.
- CI: `.github/workflows/media-studio-ci.yml` et `whv-media-studio-mobile-preview.yml` exécutent `node --test src/media/geoTargeting.test.mjs` avant build/publication.

**Preuves réellement vérifiées :**
- `World-Vision Media Studio CI` (SHA `f0b281889676a20fbefba62fd45cf1fd5c2856ed`) : **success**.
- `World-Vision Media Studio real-UI mobile preview` [run #43461296086](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43461296086) : **completed/success**. Tests géographiques, build TypeScript/Vite, smoke iPhone/desktop et publication sur la **même branche de preview**.
- Manifeste réellement relu sous `whv-media-studio-browser-preview/preview-deployment.json` : `source_commit=f0b281889676a20fbefba62fd45cf1fd5c2856ed`, `backend_connected=false`, `channel_published=false`, `human_qa_completed=false`.
- Captures réelles sous `whv-media-studio-browser-preview/media-globe-motion-lab-iphone.png` (pendant la rotation) et `media-globe-motion-arrival-gabon-iphone.png` (à 100 %), **fichiers images réellement présents dans la branche preview**, inspection visuelle effectuée dans le chat. La capture finale montre le marqueur du Gabon et les frontières vectorielles renforcées.

**Lien permanent :** https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/index.html?view=media&screen=review&gate=direction — utiliser le bouton **« Tester le nouveau moteur : la Terre tourne vers un pays »**. Les caches CDN peuvent temporairement différer du manifeste GitHub, ne jamais inventer un SHA affiché par un appareil.

**État artistique :** D00-v6 reste **non encore approuvé**, concept PNG gardé seulement dans la conversation et documenté avec SHA-256 `8d9a9d20f20fbf7757713b6f5eab06590f191166eb779865747f0f59683cfca2`. Le moteur livré ici est une **preuve technique**, graphiquement moins ambitieuse que la cible ; ne pas présenter cette capture comme la future ouverture 3D ou comme une vidéo MP4.

**Aucun changement** : aucune vraie voix Gemini/ElevenLabs/OpenAI auditionnée pour la nouvelle identité, aucune vidéo du terrain inventée, aucun rendu Remotion de la nouvelle 3D, aucun montage complet, aucune API de publication, aucune PR fusionnée. Pour reprise, lire `docs/media/engineering/GEO_TARGETING_PROTOTYPE_2026-11-13.md`, `docs/media/AUDIOVISUAL_PRODUCTION_MASTER_PLAN_2026-11-13.md` et `docs/continuity/CURRENT_STATE_AND_NEXT_STEP.md`.

**Prochaine étape intelligente :** construire le master D00 **vraiment 3D, 9:16**, texture terrestre sous licence, précision GIS, atmosphère bleu/cyan plus forte que les deux arcs, vrai blanc de l'œil et contours du Sahara ; le montrer avant animation/final. Puis raccorder ce visuel au mouvement géographique déjà codé et produire un micro-test 3–6 s, puis seulement suite du workflow voix/montage.


---

## 2026-11-13 — correction de confusion entre « prototype géographique » et identité artistique

Le propriétaire a constaté que le globe simplifié sur le site ne ressemblait pas à la référence artistique D00-v6. Décision : **ne pas réduire la qualité visuelle de la Terre** ; préserver D00-v6, conserver la seule logique géographique du prototype et reconstruire l'esthétique en véritable CGI avant de parler de rendu audiovisuel.

La dernière image de référence **a été retrouvée dans le répertoire de cette conversation et ouverte visuellement**, `/mnt/data/a_crisp_ultra_detailed_high_contrast_digital_ill.png`, 1086×1448, SHA-256 `8d9a9d20f20fbf7757713b6f5eab06590f191166eb779865747f0f59683cfca2`. Ce chemin est **éphémère et non une URL GitHub** ; l'intégration binaire exacte dans le dépôt reste à réaliser.

**Correctifs réellement committés :** `GlobeDirection.tsx` (référence D00-v6 explicitement protégée, labo dans `<details>` replié), `GlobeDirection.css` (lisibilité de la distinction), `media-preview-smoke.mjs` (test automatisé : référence présente, labo replié initialement, ouverture volontaire puis rotation fonctionnelle). Ces changements ne modifient ni le code géographique, ni le logo officiel, ni le prototype de vidéo.

**Suite** : vérifier CI et preview GitHack après les correctifs ; travailler sur une vraie scène D00 photo-CGI 9:16 et non réintroduire le Canvas comme image finale. Lire le plan directeur du manuel de 137 pages pour conserver les futurs jalons voix, montage, vérification et publication.


### Sauvegarde locale exportable de l'original D00-v6

Le fichier PNG original (1086×1448, SHA-256 `8d9a9d20f20fbf7757713b6f5eab06590f191166eb779865747f0f59683cfca2`) a également été **copié sans modification des octets** dans une archive téléchargeable de la conversation, `World-Vision_D00-v6_reference_originale.zip`, avec manifeste de provenance et rappel de la non-validation. **Important** : cette archive est un artefact téléchargeable du chat, **pas encore un fichier committé sur GitHub** ; son lien `sandbox:` est spécifique à la conversation. Conserver/exporter ce ZIP avant de changer de chat si nécessaire.


---

## 13 novembre 2026 — premier incrément de Terre phototexturée CGI (retour aux vrais détails)

À la demande « arrête de perdre du temps, la suite intelligente pour le média », intervention effective dans le code : **nouveau renderer `CinematicEarth.tsx` avec shader sphérique WebGL, photo-texture equirectangulaire NASA Blue Marble, éclairage diurne, halo cyan, blancs purs dans l'œil à deux arcs et frontières nationales GeoJSON**. Le laboratoire géociblé utilise désormais ce globe ; le Media Studio l'affiche au-dessus des anciennes maquettes comme **candidat CGI à revoir**. Les six maquettes historiques sont conservées, et l'identité D00-v6 issue du chat demeure la référence de comparaison, **sans approbation automatique**.

Build GitHub Actions modifié pour embarquer une source NASA avec provenance, contrôle JPEG/taille et empreinte SHA-256. Source exacte téléchargée et vérifiée : `9743175942473681d78838ca1042553dab4779cf957fb6d8f22a81fb796f7797`. Nouveau test navigateur : texture obligatoire, shader WebGL actif, capture D00 9:16 sur iPhone.

**Preuves :** commit de source publié `2f9fedd46ae2ee77e3984814b3d47710e0a25c27`, workflow mobile https://github.com/OBIANG5/World-Health-Vision/actions/runs/43464929633 = **completed/success**. Manifeste de preview pointant ce même SHA ; screenshot `media-globe-cinematic-d00-candidate-iphone.png` dans `whv-media-studio-browser-preview` (SHA blob `1e1b718b3e010d065ec1ff3aef9da79711e48b9c`). Capture réellement consultée dans le chat : Terre bleue, relief et pays sahariens tracés, œil blanc et atmosphère apparents.

**Limites non masquées :** ce n'est pas une vidéo exportée, le design n'a pas encore la validation artistique du propriétaire et le PNG d'origine D00-v6 n'a pas été committé. L'outil est un premier CGI contrôlable. Ne pas substituer un dessin plat ni chercher à prétendre que la référence IA et le shader sont pixel-identiques.

**Reprise suivante :** inspection esthétique du CGI avec le propriétaire ; calage fidèle aux deux arcs/au halo du D00-v6 ; puis D01 au pays ciblé et micro-clip de 3–6 secondes, montage et voix selon `docs/media/AUDIOVISUAL_PRODUCTION_MASTER_PLAN_2026-11-13.md`. Document technique [CINEMATIC_EARTH_D00_ENGINE_2026-11-13.md](../media/CINEMATIC_EARTH_D00_ENGINE_2026-11-13.md).


---

## 13 novembre 2026 — Export CGI D01 / 4 s : image vers vidéo, sans perte du projet

**Développement effectif** : `CinematicCapture.tsx` (route de rendu plein écran et pilotage déterministe same-origin par frame), `render-cinematic-d01.mjs` (96 captures Playwright, vraie texture NASA, coordination avec interpolation sphérique, encodage FFmpeg H.264, vérification FFprobe) et `.github/workflows/whv-cinematic-motion-d01.yml` (build, tests, rendu, archivage artifact et GitHub Preview). `.github/workflows/whv-media-studio-mobile-preview.yml` modifié pour préserver `media-lab/` à chaque mise à jour.

**Résultat vérifié en ligne** : Workflow https://github.com/OBIANG5/World-Health-Vision/actions/runs/43466731755 completed/success ; manifest JSON déclare **GAB, 4 s, 24fps, 1080×1920, 96 frames**, technique non approuvée. SHA-256 du vrai MP4 `17796338023f0ffd9732739390ac2535c816113baf8e6dd773879314604bb22a`, blob Git `8dd35afc5f5ef56eae1b40b72208dfc19380cb78`. Lien durable : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/wv-d01-gab-technical-4s.mp4.

**Important** : cette réalisation n'est pas une nouvelle validation artistique de D00-v6 et n'est pas un film sur une véritable actualité du Gabon : ce pays sert de cible géographique d'essai. Voix, actualité sourcée, photos sous droits, sous-titres, montage et contrôles finaux restent à venir. **Ne pas publier sur un réseau social.** Plus de détails dans [CINEMATIC_D01_MICROCLIP_2026-11-13.md](../media/CINEMATIC_D01_MICROCLIP_2026-11-13.md). Reprendre la revue de la vidéo et de la fidélité à l'image D00-v6, puis le storyboard et la voix de qualité.

---


## 2026-11-13 — D01 export 4s, trois frames et lecteur mobile

**Continuité après la livraison CGI D00** : travail repris sur le code réellement présent, sans écraser `CinematicEarth`. La branche média disposait déjà d'un nouveau pipeline de capture déterministe `CinematicCapture.tsx`, de `render-cinematic-d01.mjs` et du workflow `.github/workflows/whv-cinematic-motion-d01.yml` ; exécution [#43466731755](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43466731755) terminée avec succès. Sortie `media-lab/wv-d01-gab-technical-4s.mp4`, SHA-256 `17796338023f0ffd9732739390ac2535c816113baf8e6dd773879314604bb22a`, 1080×1920, 24 fps, 96 photogrammes, quatre secondes. Pays de démonstration : Gabon (`GAB`) sans localisation inventée de l'actualité.

**Amélioration réalisée dans cette reprise :** création `CinematicMotionReview.tsx/.css`, intégration dans `GlobeDirection.tsx` : vrai lecteur iPhone HTML5 contrôlable et désactivé avant présence d'un manifeste valide, aucune lecture automatique. Ajout du poster de la première frame et du lien vers les trois photogrammes de contrôle. Test Playwright ajouté pour vérifier la présence du lecteur et l'absence d'autoplay. CI du commit visuel `94336393e7659303780c406bd30a8f3cba5ee5de` réussie.

**QA du film :** nouveau workflow `.github/workflows/whv-d01-motion-qa.yml`. Premier passage [#43468544350](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43468544350) échoué pour une **dépendance absente** (`ffprobe`) sur le runner, non pour le film ; installation explicite de FFmpeg/FFprobe ajoutée et reprise [#43468666079](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43468666079) **success**. Vidéo recontrôlée SHA-256 + métadonnées, trois vraies frames différentes archivées dans `media-lab/review/` sur la branche permanente, contact sheet `contact-sheet.jpg`. Inspection des frames dans le chat : mouvement de l'Europe/Afrique vers l'Afrique centrale visible ; l'avis esthétique humain reste à recueillir.

**Document canonique** : [D01_GABON_MOTION_REVIEW_2026-11-13.md](../media/D01_GABON_MOTION_REVIEW_2026-11-13.md). **Aucun faux contenu d'actualité, aucune approbation, aucune diffusion réseau social.**

**Suite intelligente :** consolider la fidélité des arcs/du blanc et de la diffusion atmosphérique à D00-v6, tester le film sur téléphone, puis D02 zoom vers un lieu seulement si coordonnées vérifiées ; viendront vidéos réelles sous licence, voix et montage avec toutes les validations du PDF de 137 pages.



---

## 13 novembre 2026 — système de vidéo complète multi-outils (suite du retour qualité)

L'utilisateur a demandé de transposer le manuel PDF original (137 pages) en un atelier professionnel qui **sélectionne l'outil le plus adapté à chaque étape**, en tenant compte de ChatGPT Plus et Google AI Pro, plutôt que de continuer exclusivement le développement CGI. Une recherche sur les documentations officielles a confirmé l'intérêt de **Google Vids** pour la voix off française, les éditions verticales 9:16 et l'export MP4 ; Flow pour plans illustratifs depuis image ; Gemini/ChatGPT pour script et vérification ; FFmpeg pour QA et sous-titres FR si nécessaires. Les API Google et OpenAI restent distinctes des abonnements, ElevenLabs est optionnel avec licence commerciale payante.

Livrables réellement écrits et committés :
- [WORLD_VISION_PRODUCTION_CONDUCTOR_2026-11-13.md](../media/WORLD_VISION_PRODUCTION_CONDUCTOR_2026-11-13.md), méthode complète mappant 9 parties de la formation + 14 étapes, outils/fallbacks, livrables, économie des crédits, montage, voix, sources, validations et droits.
- [WORLD_VISION_EPISODE_TEMPLATE.md](../media/WORLD_VISION_EPISODE_TEMPLATE.md), fiche duplicable par actualité avec dossier d'affirmations, script, storyboard minuté, voix, médias et licences, QA, hashes, états des 14 étapes.
- Mise à jour de `CONTINUITE_WORLD_VISION.md` et `CURRENT_STATE_AND_NEXT_STEP.md`.

**Ne pas surpromettre :** c'est un conducteur de travail versionné, pas un moteur Flow/Vids automatisé ni un premier reportage finalisé. Objectif réel suivant : mener **un reportage complet de 40–50 secondes** au bout (un sujet réellement sourcé, une vraie voix, un montage vérifié), sans laisser le CGI du globe bloquer la production.


---

## 13 novembre — premier épisode éditorial NASA mangroves (pilote de la méthode multi-outils)

Après bascule du projet vers un système de production basé sur le manuel 137 pages et sur les abonnements ChatGPT Plus / Google AI Pro, le **premier épisode réel est démarré**. Sujet : publication NASA Earth Observatory du 13 novembre 2026 sur la reprise des mangroves mondiales et comparaison de vraies images Landsat prises en 2010/2026 au Myanmar. Sources factuelles croisées avec la publication scientifique présentée par Tulane University et l'explication écologique NOAA.

**Éléments créés et versionnés dans GitHub** :
- `docs/media/episodes/2026-11-13_mangroves_nasa/voix_off_fr_v1.txt` (script narratif français exact, 112 mots environ, non approuvé et pas encore enregistré vocalement).
- `docs/media/episodes/2026-11-13_mangroves_nasa/PRODUCTION_PACK.md` (fact-check, sources et nuances, médias NASA haute définition à télécharger, licences, six plans chronométrés, texte exact, auditions voix, choix Vids sur PC ou CapCut sur iPhone, exports/QA, statut des 14 étapes).

**Décision outil économique :** ne pas utiliser Flow pour le pilote, car NASA met à disposition deux vraies photographies satellites et NOAA une photographie illustrative ; les zooms et transitions relèvent du montage. La prochaine action dépend des outils d'édition disponibles et doit porter sur **la voix puis le montage complet**, pas sur une autre animation de Terre codée.

**Limites vérifiées :** pas de vraie voix Google Vids auditionnée, pas de téléchargement des photos dans ce repo au moment de cette entrée, aucun MP4 complet ni diffusion. Chaque source et lieu doivent être crédités ; droits NASA et NOAA vérifiés à la source avant l'export final. Les chiffres mondiaux reposent sur 1984–2023 ; les photos locales sur 2010/2026.


---

## 13 novembre — correction stratégique du radar et de l'automatisation de toute la production

L'utilisateur a rejeté le pilote NASA mangroves : sujet jugé peu accrocheur, inadapté à la ligne de World-Vision. Il a aussi rappelé deux exigences fondamentales oubliées : **la vraie identité visuelle œil/globe/logo doit figurer dans le modèle de chaque reportage** et **l'objectif est une usine orchestrée par un seul endroit**, pas le passage manuel entre de multiples sites et pas la réécriture d'un logiciel vidéo.

**Actions réelles GitHub :**
- Pilot `docs/media/episodes/2026-11-13_mangroves_nasa/PRODUCTION_PACK.md` marqué `REFUSÉ / ARRÊTÉ`, sans effacer l'historique.
- `automation/n8n/world-vision-radar-v1.n8n.json` : **workflow n8n importable de 8 nœuds**, RSS (BBC World/Business/Technology + ONU), Schedule Trigger chaque heure, Merge, Code scoring/déduplication et sortie des candidats `TO_VERIFY`, **aucun déclencheur de publication ni achat/API**. Workflow `active:false`.
- Un test synthétique du nœud de classement a été exécuté sur le code extrait du fichier réel : **syntaxe JS valide**, 3 entrées de test → **2 sorties sans doublon**, séisme classé **95/100**, lifestyle **32/100**, toutes les sorties `TO_VERIFY`. Ce test **n'est pas un test des vrais flux RSS sur une instance n8n**.
- `automation/brand/WORLD_VISION_BRAND_LOCK.json` : logo bleu G0 officiel (SHA blob), D00-v6 concept (SHA-256), cahier de composition, assets obligatoires, garde-fous, blocage du master si identité non approuvée.
- `automation/WORLD_VISION_AUTOMATION_COCKPIT.md` : choix n8n + moteur à templates Shotstack, état des outils réellement connectés, limites API des abonnements, calendrier d'intégration, cycle éditorial et QA.
- Continuité racine, état courant et conducteur multi-outils mis à jour en tête pour qu'aucun futur chat ne reprenne le mauvais pilote.

**Investigation services** : n8n Cloud Starter 20 €/mois facturé annuellement, Community Edition auto-hébergée ; Make Free alternatif 1000 crédits mensuels et deux scénarios actifs ; Shotstack dispose d'une intégration n8n vérifiée avec modèles et rendu cloud ; Flow de Google AI Pro donne accès à l'application mais pas automatiquement à une API de rendu. Toutes les licences/quotas restant liés aux comptes réels et aux APIs doivent être contrôlés avant achat.

**Ce qui NE fonctionne PAS encore** : n8n non connecté à ce chat, workflow RADAR non exécuté sur flux réel depuis une instance, aucun tableau éditorial persistant connecté, Shotstack non connecté, modèle vidéo encore à créer une fois avec le vrai logo et la D00-v6, aucune TTS/API ni chaîne de diffusion intégrée, aucun MP4 complet automatisé. **Ne jamais écrire que le système est déjà en production.**

**La prochaine opération la plus utile** est l'activation d'une instance n8n (ou la voie moins chère Make si nécessaire), l'import et la mise en marche du radar après test; puis Google Drive + un seul modèle de rendu Shotstack/Creatomate et les gates humains.

---

## 13 novembre — recentrage définitif du travail sur le montage vidéo

Nouvelle instruction utilisateur : « une vidéo par une vidéo » ; ChatGPT doit chercher automatiquement les meilleures nouvelles chaque heure, mais le **travail à réaliser dans GitHub est uniquement le MONTAGE**, à partir d'un script dont le propriétaire aura validé le contenu. Refus explicite des chantiers techniques hors sujet et des passages obligatoires entre de nombreux sites.

**Action automatisation réelle :** tâche ChatGPT « World-Vision Breaking News » ID `6a9050fddd5c8191929b1f8cfa8d0f3e` retrouvée désactivée ; **modifiée et réactivée**, `RRULE:FREQ=HOURLY`, premiers contrôles avec utilisateur Europe/Paris, filtrage 3–5 sujets majeurs vérifiés, nouvelle notification seulement si développement significatif, aucun script/MP4/publication automatique. Pas de doublon de tâche créé.

**Audit du code existant :** `services/media-renderer/src/WorldVisionShort.tsx` supporte `<Video>`, `<Img>`, `<Audio>`, `<Sequence>`, attributions ; `services/media-renderer/src/types.ts` supporte `asset_url`, `asset_license`, `asset_attribution`. Logo original du renderer présent à `public/brand/world-vision-official.png`. Réutiliser plutôt que refaire le montage from scratch.

**Référence de méthode créée** : `docs/media/MONTAGE_ONLY_HANDOFF_2026-11-13.md` ; sélection de scènes, voix FR, Flow / Vids uniquement pour les plans concernés, Remotion/FFmpeg pour rendu et QA. **Aucune nouvelle vidéo produite dans ce tour**, car aucun nouveau script validé / aucun fichier sonore et visuel approuvé.

**Prochain acte concret** : sur réception du script approuvé, préparer le découpage précis, sélectionner des clips authentiques/licenciés, proposer les prompts Flow si nécessaire et lancer une production de film réel une fois les assets/voix accessibles, en préservant G0 et D00-v6.
