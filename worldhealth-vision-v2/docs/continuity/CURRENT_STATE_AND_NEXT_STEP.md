# World-Vision — état actuel, blocages et prochaine action

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
