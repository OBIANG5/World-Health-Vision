# World-Vision — état actuel, blocages et prochaine action


## POINT DE REPRISE LE PLUS RÉCENT — moteur de rotation géographique codé et visible

**Le code a changé, pas l'approbation artistique.** Le 13 novembre 2026, un premier moteur de **rotation vers le pays de l'actualité** a été développé dans `frontend/web-v2/src/media/geoTargeting.mjs` avec les types, le laboratoire React et les tests, basé sur le GeoJSON du produit et le `country_iso3` du dossier. Il est intégré sous la direction artistique des six étapes. Le labo permet de choisir le Gabon/Mali ou d'autres pays, faire tourner le globe en 4 s, ajuster la progression, et revenir au départ. Le rendu est une **simulation technique Canvas/2.5D**, pas la Terre photographique D00-v6 ni une vidéo.

**Preuves officielles de livraison :** [GitHub Actions preview #43461296086](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43461296086) **success**, tests Node/TypeScript/Playwright sur iPhone/desktop, manifeste de preview `source_commit=f0b281889676a20fbefba62fd45cf1fd5c2856ed`, captures réelles `media-globe-motion-lab-iphone.png` et `media-globe-motion-arrival-gabon-iphone.png`. `backend_connected=false` et `channel_published=false` restent vrais.

**Lien utilisable :** https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/index.html?view=media&screen=review&gate=direction → bouton **« Tester le nouveau moteur : la Terre tourne vers un pays »**. Il ne remplace pas les frames originales D00–D05 ni leurs avis.

**Le statut d'approbation reste :** G0 logo bleu approuvé ; MP4 COP31 refusé 1/10 ; A/B/C refusées ; D00-v5 appréciée avec corrections ; D00-v6 image **non encore approuvée**, PNG non commité ; 3D photoréaliste, scène Remotion, voix et montage final non réalisés. Préserver toute la formation originale de 137 pages dans le [plan directeur](../media/AUDIOVISUAL_PRODUCTION_MASTER_PLAN_2026-11-13.md) et l'[audit de géociblage](../media/engineering/GEO_TARGETING_PROTOTYPE_2026-11-13.md).

**Action de développement suivante, sans revenir en arrière :** master artistique D00 reproductible en **vraie 3D 1080×1920** (frontières géographiques exactes, atmosphère cyan, deux arcs et vrai blanc d'œil, textures sous droits vérifiés), test image sur iPhone et avis humain. Le **mouvement géographique existe** désormais en code et doit être réutilisé, puis raccordé à la 3D et testé 3–6 s. Ne pas sauter auditions de voix, alignement, montage des vrais plans et QA. Chaque itération : code GitHub, tests, SHA preview, journal et décision.

---



## POINT ACTIF — D00-v6 après retour positif conditionnel sur v5 (13 novembre 2026)

**NOUVELLE RÉFÉRENCE (priorité sur les anciennes sections v4) :** l'utilisateur a trouvé **très belle** D00-v5 mais demandé vrai blanc de l'œil (#FFFFFF), halo atmosphérique bleu plus lumineux que les deux arcs et frontières nationales (notamment Sahara) plus marquées ; conserver la taille de Terre. Une image **D00-v6 a été créée**, `a_crisp_ultra_detailed_high_contrast_digital_ill.png`, SHA-256 `8d9a9d20f20fbf7757713b6f5eab06590f191166eb779865747f0f59683cfca2`, 1086×1448, **EN ATTENTE DE L'AVIS HUMAIN, PAS ENCORE UNE VIDÉO**. Les bytes du PNG ne sont **pas versés à GitHub**, seul le contrat et son empreinte y figurent. Ne pas prétendre qu'un aperçu du site montre v6 : le build statique n'a pas été relancé dans cette session.

**Plan exhaustif du pipeline à conserver :** [AUDIOVISUAL_PRODUCTION_MASTER_PLAN_2026-11-13.md](../media/AUDIOVISUAL_PRODUCTION_MASTER_PLAN_2026-11-13.md) — neuf parties du PDF de 137 pages, 14 étapes du Media Studio, quatre compétences de montage, sélection voix à l'aveugle sur la même phrase, alignement, scènes réelles, montage, exports/QA et preuves. **Contrat D00-v6 :** [d00-eye-globe-visual-contract-v6.json](../media/art-direction/d00-eye-globe-visual-contract-v6.json).

**Prochaine étape après approbation de D00** : reconstruire fidèlement l'image en **3D programmatique** 1080×1920 avec frontières GIS exactes, blanc de l'œil et atmosphère séparés ; comparer moteur Three.js/Blender piloté par Remotion/FFmpeg. Puis rotation géographique vers `lat/lon` du **pays de l'actualité**, avec validation D01 et micro-clip 3–6 s avant D02/D03/D04/D05. Ne jamais forcer plusieurs pays. Tester **logo officiel discret en coin** plus tard ; place non validée, respecter les règles du canal. Voix et montage ne sont pas oubliés : ce sont des jalons ultérieurs distincts, pas du travail déjà terminé.

---


## 13 NOVEMBRE — DERNIÈRE DIRECTION D00 ŒIL / GLOBE (PRIORITÉ ACTUELLE)

**Nouvelle proposition fixe générée, NON APPROUVÉE :** D00-v4, Terre presque plein cadre, **exactement deux arcs d'œil non circulaires** inspirés du logo officiel (arcs au-delà des bords gauche et droit, extrémités invisibles), halo atmosphérique bleu/cyan, continents naturels, **frontières nationales visibles**, aucun éclairage nocturne urbain, soleil ou nuages décoratifs hors planète, étoiles très discrètes. Dimensions du fichier image de conversation : 1086 × 1448 (donc **pas encore 9:16**) ; SHA-256 `5f97e5f0d29551e187b50106e0aaf2f00e700062a9a2f5845dbf9f9715b6a90e`.

**Sources impératives :** [historique des quatre visuels + corrections humaines](../media/art-direction/D00_EYE_GLOBE_VISUAL_ITERATIONS_2026-11-13.md), [contrat JSON v4](../media/art-direction/d00-eye-globe-visual-contract-v4.json), `DECISION_REGISTER.md` D-018–D-022, et `WORK_JOURNAL.md`. La Terre est la pupille ; les deux arcs sont des paupières secondaires, **pas deux anneaux formant un cercle**. Ne pas recréer ou modifier le logo bleu PNG officiel.

**Prochaine opération :** attendre le retour sur D00-v4 et corriger si nécessaire. Avant toute vidéo, réaliser/évaluer un vrai **D00 3D vertical 1080×1920** avec géographie tracée depuis données fiables, atmosphère simulée et arcs paramétriques. Puis micro-animation 3–6 secondes sur validation explicite ; D01–D05 et montage complet restent ultérieurs. **Image générée dans le chat, binaire non archivé sur GitHub** ; seule sa trace et son cahier des charges sont versionnés. Aucun nouveau build de l'aperçu statique n'est revendiqué pour cette révision.

---

## NOUVELLE REPRISE DU 13 NOVEMBRE — AUDIT DU CHAT BLOQUÉ (SANS NOUVELLE VALIDATION)

Le propriétaire a fourni une capture du dernier message du chat précédent et demandé la vérification de l'historique et du dépôt. Rapport de lecture détaillé : [MEDIA_STUDIO_RECOVERY_AUDIT_2026-11-13.md](MEDIA_STUDIO_RECOVERY_AUDIT_2026-11-13.md). Le journal de travail est complété.

**Preuves au démarrage de la reprise :** code média HEAD `c422eafa1bbbe47f427057ba4ce2bb1c54612e06` ; preview HEAD `824bd847a8c0a0703f507cb85e7d25cbff1bd0ba` ; manifeste `source_commit=e57207ba1b19add8649f39511eda0984798afb78`, `backend_connected=false`, `channel_published=false`, `human_qa_completed=false`. Entre le code de la preview et le HEAD média initial, **cinq commits purement documentaires**, pas de modification de l'UI. Les commits ajoutés depuis cette lecture concernent seulement la documentation de reprise. CI média du HEAD initial signalée successful ; ce n'est pas une validation créative.

**Statut inchangé :** G0 logo bleu validé ; MP4 COP31 refusé 1/10 ; A/B/C refusées ; G1 direction géographique D00–D05 **frames fixes non approuvées**. **Priorité immédiate D00**, image du globe réellement convaincante, présentation dans le chat/site mobile et jugement humain avant mouvement. Un événement localisé n'impose pas plusieurs pays. La formation de 137 pages n'a qu'un audit thématique ; Gemini/Flow, ElevenLabs et n8n/Make non prouvés intégrés.

**Limite de la récupération :** ancien chat non disponible intégralement mot pour mot ; son dernier message et les traces GitHub/contextuelles ont été croisés. Aucune nouvelle image, voix ou vidéo n'a été produite pendant cette session d'audit.

---


**Date de rédaction : 13 novembre 2026.** Ce document est un **état de reprise vivant**, à actualiser après chaque incrément. Les preuves de changement et les dates des commits sont dans [COMMIT_HISTORY_INDEX.md](COMMIT_HISTORY_INDEX.md).

## POINT DE REPRISE IMMÉDIAT — clarification du propriétaire (13 novembre, ~15 h 26 CET)

**Cette entrée est prioritaire sur les passages plus anciens du document.**

- Le propriétaire a signalé un nouveau risque de blocage du chat et exige la conservation des avancées dans GitHub après chaque étape.
- **Notre jalon est G1 : validation de l'identité audiovisuelle géographique**, PAS réimplémentation d'un nouveau dashboard ni finalisation d'une vidéo.
- **Anciennes directions A/B/C : refusées explicitement**, sans scores inventés ; ancien MP4 COP31 : refusé 1/10 ; **logo bleu original : validé sans note**.
- Des compositions **D00–D05** ont déjà été codées pour montrer le globe → le pays → les preuves → l'explication → la sortie, mais **ce ne sont que des frames Canvas/React fixes et non approuvées**, pas le globe satellite premium final.
- **Correction impérative : un reportage ne doit PAS forcément traiter plusieurs pays.** Une actualité sur un pays = un seul pays dans la vidéo si le récit l'impose ; deux pays si une relation est pertinente ; plusieurs pour un véritable tour du monde seulement. Les cinq pays du clip TikTok étaient une référence de technique visuelle, pas un moule de format.
- **Spécification canonique mise à jour :** [contrat des formats et approbations](../media/art-direction/EDITORIAL_GLOBE_FORMATS_AND_REVIEW_CONTRACT_2026-11-13.md).
- **Audit du PDF / code : PARTIEL, NON terminé**. Formation 137 pages accessible et sections essentielles extraites, code de `GeoGlobe`, `GlobeDirection`, `ReviewStudio`, `WorldVisionFirstReport`, `WorldVisionShort`, `media-renderer/server.mjs`, `media-service/voiceover.py` et package Remotion examinés. **Pas de certification complète du code ligne par ligne, ni de validation artistique.** Voir `docs/media/TRAINING_137_PAGES_IMPLEMENTATION_AUDIT_2026-11-13.md`.
- **Fait technique important :** la narration dans le service média utilise OpenAI Realtime avec contrôle de transcription ; ce n'est PAS une intégration Gemini/ElevenLabs. Le moteur Remotion existe mais les écrans D00–D05 ne sont pas encore branchés à une composition animée validée. La vidéo initiale contient encore des signes de l'ancien style refusé : ne pas la rediffuser.
- **Google Flow / Gemini vidéo, ElevenLabs TTS/alignement, n8n/Make : non connectés à ce jour selon le code inspecté.** Le fait de posséder un abonnement Google n'implique pas une autorisation API.
- **Prochaine action artistique :** relire la capture réelle **D00**, proposer une image du globe plus convaincante et expliciter les critères de notation ; faire valider son style **avant tout rendu de 3–6 secondes**, puis seulement poursuivre D01 → D05 avec de vrais médias autorisés.

**Ne pas confondre documentation des intentions, code présent, CI technique et rendu professionnel approuvé.**

---

## Dernière décision de direction créative (13 novembre 2026) — PRIORITÉ ACTUELLE

**Ne pas se tromper de jalon.** La plateforme World Health Vision V2 et le Media Studio existent toujours. Dans Media Studio, le propriétaire était en train d'évaluer l'identité visuelle, et **a rejeté les trois anciennes maquettes A/B/C** pour leur manque de qualité. Aucun score chiffré individuel n'a été attribué à A/B/C.

**Nouveau chemin demandé :** géolocalisation cinématique « Terre entière → pays ciblé → région/ville → médias véritables vérifiés → explication → transition ». Le logo officiel bleu est conservé. Développement **plan par plan**, aperçus au téléphone, notes 1–10, refus/corrections et validation explicite à chaque jalon. **Ne pas relancer un MP4 final.**

**Code de la nouvelle étude :** `frontend/web-v2/src/media/GeoGlobe.tsx`, `GlobeDirection.tsx` et `GlobeDirection.css`. Six poses D00–D05 s'appuient sur le GeoJSON des pays déjà présent dans le projet. **Ce sont des maquettes fixes vectorielles et lumineuses, pas encore une sphère satellite 3D photoréaliste ni un film animé.** L'évaluation doit aussi déterminer si leur rendu est assez professionnel ; ne pas déclarer la direction validée sous prétexte que les tests passent.

**Formation retrouvée et étudiée :** `monter-et-animer-vos-videos-avec-claude-v2.pdf` de 137 pages. Voir `docs/media/TRAINING_137_PAGES_IMPLEMENTATION_AUDIT_2026-11-13.md` pour une comparaison honnête avec les fonctions actuelles et les manques, notamment voix, dérushage, compétences et QA.

**Rappel sur les deux vidéos perdues :** une vidéo géopolitique de ~65 s a été renvoyée et réellement examinée ; l'autre et le texte exact du prompt historique n'ont pas été retrouvés. Ne pas attribuer des détails inventés à cette deuxième référence.

**État des validations :** logo bleu actuel APPROUVÉ sans note ; ancien MP4 COP31 REFUSÉ 1/10 ; anciennes A/B/C REFUSÉES sans score ; **D00–D05 proposés seulement, pas approuvés**. Ne pas publier ni fusionner la branche média dans `v2` sans autorisation.

**Liens utiles :**
- [Directive artistique à respecter](../media/art-direction/WORLD_VISION_GLOBE_SIGNATURE_DIRECTIVE_2026-11-13.md)
- [Audit de la formation](../media/TRAINING_137_PAGES_IMPLEMENTATION_AUDIT_2026-11-13.md)
- [Registre de décisions](DECISION_REGISTER.md)
- Media Studio : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/index.html?view=media&screen=review&gate=direction

---

## Nouvel élément confirmé le 13 novembre 2026 : référence vidéo originale réexpédiée

Une des deux vidéos TikTok mentionnées dans la conversation disparue vient d'être **réellement reçue et inspectée**. Il s'agit d'une vidéo de ~64,9 s en 512×910 H.264 avec globe terrestre et cinq sujets géographiques (Mexique, Royaume-Uni, Riyad/Bruxelles, Soudan du Sud, Turquie/Chine), filigrane `@focus.geopolitique`.

- **Analyse vérifiée et chronométrée :** `docs/media/references/2026-11-13-focus-geopolitique-video-reference.md`
- **JSON de preuve :** `docs/media/references/2026-11-13-focus-geopolitique-video-reference.json`
- **Empreinte du MP4 remis :** `4e4e979144b59ee9359287c75773cfbbb5cefbd12d05f71ec9ba3bd66f3328bb`
- **Conservation :** les observations/empreintes sont commités dans GitHub ; le **fichier vidéo tiers n'a pas été ajouté au dépôt** et reste une pièce reçue en conversation. Droits de rediffusion non établis.
- **Nouvelle piste G1 :** **D — « Le globe raconte l'actualité »** (globe → zoom pays → marqueur/contour → vraie information). **CONCEPT PROPOSÉ, PAS une maquette réalisée, PAS une validation utilisateur.** Les directions A/B/C précédentes restent non approuvées.
- **Aucun changement automatique de montage :** conserver l'exigence de validation de l'ouverture avant animation 3–6 s, puis de la voix et du montage.

Ce nouvel élément documentaire **complète**, mais ne supprime pas, la priorité de l'avis humain G1. La seconde vidéo évoquée précédemment n'a pas été remise dans ce tour.

---

## Ce qu'il faut ouvrir d'abord

| Rôle | Référence |
| --- | --- |
| Dépôt canonique | `OBIANG5/World-Health-Vision` |
| Branche plateforme V2 | `v2` |
| Branche Media Studio (code source) | `feature/world-vision-media-studio` |
| PR Media Studio, non fusionnée | [PR #5](https://github.com/OBIANG5/World-Health-Vision/pull/5), base `v2`, **draft** |
| Branche d'aperçu compilé | `whv-media-studio-browser-preview` |
| Lien d'aperçu permanent | https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/index.html?view=media |
| Lien direct vers le travail en cours | https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/index.html?view=media&screen=review&gate=direction |
| Manifeste du déploiement statique | `preview-deployment.json` à la racine de la branche de preview |
| Vidéo rejetée / vraie preuve | `media-pilots/cop31-risk-finance-2026-11-12/world-vision-cop31-master.mp4` dans la branche de preview |
| Refus 1/10 | [Issue #9](https://github.com/OBIANG5/World-Health-Vision/issues/9) |
| Programme qualité | [Issue #8](https://github.com/OBIANG5/World-Health-Vision/issues/8) |

## Milestones avec décisions exactes

| Gate | Objet | État actuel | Preuve |
| --- | --- | --- | --- |
| G0 | Logo officiel actuel œil-globe bleu | **VALIDÉ sans note numérique** | `docs/media/approvals/2026-11-13-current-official-logo.json` |
| G1 | Direction artistique d'ouverture A/B/C | **Trois propositions produites, AUCUNE validée** | `docs/media/art-direction/cop31-opening-directions-v1.json` et `style-frame-*.png` |
| G2 | Médias sous licence et illustrations réelles | À confirmer par séquence, pas validation finale | Licence/photo historique documentée, `editorial/harvey-rescue-2017.provenance.json` |
| G3 | Script, narration et vérification phrase par phrase | Pilote existant, nouvelle revue requise | `docs/media/pilots/cop31-risk-finance-2026-11-12.json` |
| G4 | Casting de voix françaises naturelles | **Non validé** (Piper rejeté) | Issue #9 |
| G5 | Animation d'un extrait 3–6 secondes | **Non créée** après approbation du nouveau style | A/B/C en attente |
| G6 | Montage final complet | **NON AUTORISÉ pour l'instant** | MP4 COP31 original rejeté |
| G7 | QA visuelle/audio humaine + automatisée | Non validée sur une nouvelle version | Rapport qualité actuel |
| G8 | Exports et publication TikTok/WhatsApp | Non autorisés | `docs/media/PUBLISHING_CONNECTORS.md` |

> Les libellés G0–G8 sont les **jalons humains** ; ils coexistent avec les **14 étapes techniques** du parcours RADAR→PUBLISH. Ne pas confondre ces deux taxonomies.

## Statuts à ne jamais confondre

### Ce qui existe réellement
- Le vrai frontend V2 Media Studio, son parcours interactif de 14 étapes, un Control Room et l'onglet d'évaluation.
- Code FastAPI media-service/PostgreSQL, Redis scheduler conditionnel, VERIFY, scoring, CREATIVE, ASSETS, audio, Remotion, QA, manifests et reçus (état exact à vérifier dans le code au HEAD du jour).
- Un vrai MP4 COP31 encodé H.264/AAC avec un SHA-256 `5e62e2f0f65e1335c67a3ac3cac70b827b2d676111309f3b151528bdc8440cfd` ; **refusé 1/10 par l'utilisateur**.
- Trois frames visuelles A/B/C avec le bon logo actuel, des faits sourcés et une photo d'archive de 2017 clairement distinguée de la COP31 2026.
- Enregistrement de l'avis 1/10 dans GitHub et restauration sur le site, sauvegarde locale/session des nouveaux brouillons.

### Ce qui n'existe PAS encore en production démontrée
- Hébergement permanent d'un backend Media Studio avec une veille et génération 24 h/24.
- Transfert automatique et authentifié d'une note utilisateur depuis le site statique jusqu'à GitHub **sans confirmation GitHub**.
- Voix approuvée et animation approuvée pour un nouveau reportage.
- Un nouveau montage complet approuvé et diffusé publiquement.
- Publication automatique WhatsApp Channels, TikTok Direct Post autorisé, comptes OAuth validés.
- Connexion effective du compte Gemini/Google AI personnel au renderer ou à n8n/Make.
- Une garantie de rafraîchissement instantané via RawGitHack.

### Cache / version
- Le lien `?view=media` ouvre historiquement **Parcours vidéo**, pas directement les nouvelles directions. Utiliser `screen=review&gate=direction` pour A/B/C.
- Les changements sont sur la branche compilée `whv-media-studio-browser-preview`. Dans l'interface, la **bande de version** doit montrer les 12 premiers caractères de `source_commit`, obtenus depuis `preview-deployment.json`.
- RawGitHack est une **passerelle de fichiers avec cache**, pas une plateforme de déploiement applicatif temps réel. Les fichiers peuvent rester en cache pendant plusieurs minutes, parfois davantage avec du trafic. Ajouter un `?v=...` arbitraire **ne garantit pas de purger le CDN**.
- Pour déboguer, comparer le SHA de la bande du site, `preview-deployment.json` dans la branche d'aperçu, le dernier run `World-Vision Media Studio real-UI mobile preview` et le dernier commit de la branche source. Ne pas déclarer un problème résolu uniquement parce que le workflow GitHub a été vert.
- Une version **immuable** peut se consulter via `https://rawcdn.githack.com/OBIANG5/World-Health-Vision/<SHA-40-DE-LA-BRANCHE-PREVIEW>/index.html?view=media&screen=review&gate=direction` ; son URL change à chaque release, contrairement au lien permanent en dev.

## Prochaine action NON négociable

1. **Faire examiner l'écran exact des trois propositions A/B/C sur téléphone**, avec le logo bleu actuel officiel et la photo d'archives chargée.
2. L'utilisateur **choisit une proposition** et la note aspect par aspect ; les refus/points bloquants restent enregistrés dans GitHub. Il peut ne valider aucune proposition : dans ce cas, on itère les trois images fixes.
3. **Ne pas faire d'animation, de nouvel MP4 ou de voix définitive** avant cette étape. Une fois la direction validée, préparer un micro-clip de 3–6 secondes puis le faire noter.
4. Ensuite seulement auditionner plusieurs voix naturelles, créer le montage, inspecter les pixels et le son, conserver les preuves, demander approbation humaine finale.

## Discipline de reprise

- Commencer chaque session par vérifier le HEAD de la branche Media Studio **et** celui de `v2`, l'état de PR #5, l'Issue #9 et les derniers runs CI / preview.
- Ne pas fusionner `feature/world-vision-media-studio` dans `v2` par défaut. L'intégration doit être préparée et testée.
- À la fin de chaque modification : preuves, tests, capture mobile quand utile, date de release, statut validé/refusé, mise à jour de ce document et de [WORK_JOURNAL.md](WORK_JOURNAL.md).
- Consigner toute restriction, correction, crédit/licence, statut authentique/fictif, SHA-256, URL du média ou de sa publication **dans le dépôt**, pas seulement dans ChatGPT.

### Site Media Studio — état technique après l'ajout du panneau de continuité

Le frontend `frontend/web-v2/src/media/ProductionJourney.tsx` et `ProductionJourney.css` a été **réellement modifié** : la page du parcours (lien stable `?view=media`) indique D00-v6 en attente de revue, avertit que les six images du laboratoire sont des **frames plus anciennes**, et résume le futur globe ciblé, médias réels, voix, montage et QA ; elle propose aussi un lien vers le **plan directeur complet**. **Cela ne téléverse pas l'image D00-v6 au site.**

Commits source UI : `fa26c788b463269f64afbb760a4099d8e2498f35` (interface) et `00224feaaffb97c13a65e2518ee301d7aaefa910` (styles). CI média associée au commit CSS : **success** [run #43457617960](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43457617960). Workflow de publication statique [#43457606661](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43457606661) **encore in_progress lors de la première vérification** : tant que son statut et `preview-deployment.json` ne sont pas confirmés, ne pas affirmer que le lien public affiche ce nouveau panneau. La preview précédente était `source_commit=e57207ba1b19add8649f39511eda0984798afb78`.

**Aucune modification du renderer globe animée, de la voix finale ni des APIs de publication.**


### Confirmation de publication du panneau de continuité (13 novembre, contrôle final)

Le workflow [World-Vision Media Studio real-UI mobile preview #43457606661](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43457606661) est désormais **completed / success** (y compris build React, test Playwright iPhone/desktop, publication de la branche de preview). Branche de preview : HEAD `bdd6277fd88b9a5eebefe1e1737ac6ad19d31931`, manifeste `source_commit=00224feaaffb97c13a65e2518ee301d7aaefa910`. **Ce qu'il prouve** : le panneau « D00-v6 non encore validé » et la feuille de route sont intégrés au bundle statique. **Ce qu'il ne prouve pas** : synchronisation instantanée du cache RawGitHack, présence des pixels du concept D00-v6, moteur 3D fonctionnel, ou backend actif. Les captures anciennes du laboratoire restent explicitement distinguées de la nouvelle image dans l'UI.


---

## MISE À JOUR APRÈS INTERRUPTION — GÉOCIBLAGE INTERACTIF VALIDÉ TECHNIQUEMENT (13/11/2026)

**Priorité de reprise récente (supplante les anciennes indications « pas de rotation ») :** la rotation **technique** du globe est bien développée sur la branche média et testée dans le site mobile. **Elle n'est pas le rendu photo/CGI du plan D00-v6 et ne vaut pas validation de la direction artistique.**

**Architecture** : `frontend/web-v2/src/media/geoTargeting.mjs`, `geoTargeting.d.mts`, `geoTargeting.test.mjs`, `GeoTargetingLab.tsx/.css`, `GeoGlobe.tsx`, intégration au parcours `ReviewStudio` et six maquettes anciennes via `GlobeDirection`. Pays identifiés par ISO3 du dossier d'actualité ou sélection de test manuelle ; mouvement sphérique lissé, frontière GeoJSON, contrôles iPhone. Pas de zoom dans une ville imaginaire ni de diffusion automatique.

**Preuves** : CI `43460449189` = six jobs verts ; workflow mobile `43460509829` = `completed/success`, GitHack manifest `source_commit=30f280b089148dd12768ce67d6bf7adea270419b`, preview HEAD `08492abc9ab7ab55f2beebb4e0f1d268e8365765` ; capture `media-globe-motion-lab-iphone.png` existe sur la branche preview et a été inspectée. Voir [GEO_TARGETING_MOTION_LAB_2026-11-13.md](../media/GEO_TARGETING_MOTION_LAB_2026-11-13.md).

**Lien permanent de démonstration** : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/index.html?view=media&screen=review&gate=direction . Faire défiler après les six images D00–D05 pour trouver « Une actualité. Un pays. La Terre s'oriente. ».

**Prochaine étape intelligente** : utiliser ce moteur comme **moteur de géographie pour une future vraie 3D**, mais reconstruire le plan D00 selon la charte toujours en cours de validation (Terre immense, frontières sahariennes exactes, blanc pur dans l'œil à deux arcs, atmosphère cyan mieux éclairée). Livrer le prototype CGI 1080×1920 et obtenir validation humaine avant micro-clip 3–6 s, voix, montage complet. Se référer aux 9 parties du manuel de 137 pages sauvegardées dans `AUDIOVISUAL_PRODUCTION_MASTER_PLAN_2026-11-13.md`.

