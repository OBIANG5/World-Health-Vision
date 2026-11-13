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
