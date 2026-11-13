# Reprendre World-Vision dans un nouveau chat ChatGPT — sans repartir de zéro

> **Mode d'emploi :** ouvrir ce fichier depuis GitHub et le transmettre à un nouveau chat. Lire également les fichiers liés ci-dessous. Ce document est la **consigne de reprise**, non une demande de reconstruire le projet.

## MAJ impérative du 13 novembre 2026 — décision en cours

L'ancienne mention « A/B/C à choisir » dans les documents historiques est désormais **périmée** : le propriétaire a **refusé ces trois premières propositions esthétiquement**. Il a précisé son idée forte : **Terre qui se tourne vers le pays → zoom → vraies images ou séquences autorisées → explication → transition**. Aucun nouveau design final n'est encore approuvé.

Les fichiers de mise en œuvre **déjà codés** se trouvent sous `frontend/web-v2/src/media/GeoGlobe.tsx`, `GlobeDirection.tsx` et `GlobeDirection.css`, avec **six poses fixes D00–D05** fondées sur le GeoJSON des pays. Ne pas confondre ce premier laboratoire vectoriel avec une Terre satellite photoréaliste ou une animation finale. Le propriétaire doit les noter **un par un** avant de poursuivre.

Formation récupérée : `monter-et-animer-vos-videos-avec-claude-v2.pdf`, **137 pages**, audit ici :
`worldhealth-vision-v2/docs/media/TRAINING_137_PAGES_IMPLEMENTATION_AUDIT_2026-11-13.md`.

Directive exacte en vigueur :
`worldhealth-vision-v2/docs/media/art-direction/WORLD_VISION_GLOBE_SIGNATURE_DIRECTIVE_2026-11-13.md`.

Les anciens deux fichiers TikTok et le texte historique exact du prompt ne sont PAS tous deux disponibles ; une vidéo a été examinée, l'autre non. Ne jamais inventer leurs détails.

---
## Contexte incontestable

Le dépôt est `OBIANG5/World-Health-Vision`.

Il contient **deux produits liés mais distincts** :
1. **World Health Vision V2** : la plateforme mondiale d'intelligence, données pays/régions et indicateurs, branche principale de travail `v2`, code sous `worldhealth-vision-v2/`.
2. **World-Vision Media Studio** : la chaîne de création de vidéos d'actualité francophone, développement isolé sur `feature/world-vision-media-studio`, PR [#5](https://github.com/OBIANG5/World-Health-Vision/pull/5) en draft vers `v2`, non fusionnée.

**Ne jamais écraser V2 par V0 ni fusionner la branche média par commodité.** La branche `main` n'est pas la référence fonctionnelle de la V2.

L'identité officielle actuelle est le vrai PNG **œil-globe bleu** d'origine ; le propriétaire l'a explicitement confirmé sans note sur 10 (13/11/2026). Ne pas redessiner un logo. Les couleurs vertes/multicolores du globe sont **un projet futur**, pas un obstacle à la création.

Le **premier MP4 COP31 existe techniquement mais est REFUSÉ 1/10 sur 15 critères** : Issue [#9](https://github.com/OBIANG5/World-Health-Vision/issues/9), SHA-256 exact `5e62e2f0f65e1335c67a3ac3cac70b827b2d676111309f3b151528bdc8440cfd`. Ne le diffuser sous aucun prétexte. Le conserver pour audit.

**Prochaine étape : la validation de la DIRECTION ARTISTIQUE de l'ouverture.** Trois compositions *fixes* en format 9:16 existent :
- A documentaire (photo authentique de Houston 2017 avec crédit/archive),
- B centrée sur les chiffres,
- C pédagogie en trois étapes.

Le choix et la notation 1–10 du propriétaire sont **encore attendus**. Ne **pas** fabriquer le prochain MP4, les voix définitives ou des animations de 30 secondes avant cette décision. Après approbation d'un style : **un seul micro-clip animé 3–6 secondes**, puis notation, puis auditions vocales indépendantes.

## Nouvelle référence audiovisuelle concrète (mise à jour du 13 novembre)

L'utilisateur a renvoyé **une des vidéos TikTok disparues**, et son contenu a été réellement inspecté : environ 65 s, filigrane `@focus.geopolitique`, globe satellitaire qui transite entre les pays pour raconter cinq faits. **Ne pas revenir à la déclaration périmée « aucune vidéo récupérée ».**

**Lire en priorité :** `worldhealth-vision-v2/docs/media/references/2026-11-13-focus-geopolitique-video-reference.md` et le JSON voisin, hash MP4 `4e4e979144b59ee9359287c75773cfbbb5cefbd12d05f71ec9ba3bd66f3328bb`.

**Direction candidate ajoutée :** D « Le globe raconte l'actualité », inspirée du principe géographique, pas du média sous droits lui-même. D n'a pas encore de maquette finale ni d'approbation ; le prochain livrable devrait être une **maquette de direction D** à comparer aux propositions A/B/C. Pas de vidéo complète automatiquement.

Le MP4 original de la référence est toujours **uniquement fourni dans le chat**, non archivé dans le repo. Pour garantir l'accès après disparition du chat, une sauvegarde du binaire dans un espace privé sera nécessaire.

---

## Liens incontournables

- Dossier de continuité : [README.md](README.md)
- Situation réelle : [CURRENT_STATE_AND_NEXT_STEP.md](CURRENT_STATE_AND_NEXT_STEP.md)
- Historique de janvier à novembre 2026 : [PROJECT_TIMELINE.md](PROJECT_TIMELINE.md)
- **Index de 586 commits source** (snapshot daté) : [COMMIT_HISTORY_INDEX.md](COMMIT_HISTORY_INDEX.md)
- Registre de décisions humaines : [DECISION_REGISTER.md](DECISION_REGISTER.md)
- Journal de travail récent : [WORK_JOURNAL.md](WORK_JOURNAL.md)
- Media Studio architecture : [../media/WORLD_VISION_MEDIA_STUDIO.md](../media/WORLD_VISION_MEDIA_STUDIO.md)
- Rapport qualité COP31 : [../media/QUALITY_GATE_EDITORIAL_2026-11-13.md](../media/QUALITY_GATE_EDITORIAL_2026-11-13.md)
- Système de notation : [../media/REVIEW_AND_APPROVAL_WORKFLOW.md](../media/REVIEW_AND_APPROVAL_WORKFLOW.md)
- Aperçu à URL stable : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/index.html?view=media
- Direction artistique A/B/C : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/index.html?view=media&screen=review&gate=direction
- Historique GitHub dynamique : https://github.com/OBIANG5/World-Health-Vision/commits/feature/world-vision-media-studio/
- Runs CI : https://github.com/OBIANG5/World-Health-Vision/actions
- Source technique Media : `worldhealth-vision-v2/services/media-service/`, `services/media-renderer/`, `frontend/web-v2/src/media/`, `.github/workflows/whv-media-studio-mobile-preview.yml`.

## Vérifications obligatoires AVANT de toucher le code

1. Lire le dernier `CURRENT_STATE_AND_NEXT_STEP.md`, puis la timeline et le registre de décisions ; **ne pas s'appuyer uniquement sur le résumé d'un ancien chat**.
2. Via GitHub connecté, inspecter **HEAD actuel** des branches `v2`, `feature/world-vision-media-studio` et `whv-media-studio-browser-preview` ; vérifier le statut PR #5 et les dernières CI. Les SHA de ce document sont des preuves historiques et peuvent être dépassés.
3. Lire `preview-deployment.json` sur la branche d'aperçu, comparer son `source_commit` au dernier commit ayant déclenché l'action de déploiement. L'ancienne URL peut conserver une version en cache temporairement.
4. Comprendre l'état réel : le site RawGitHack est un **snapshot statique**, qui ne peut ni enregistrer un avis directement dans GitHub sans confirmation utilisateur ni faire tourner une rédaction 24/7. Le backend code existe mais n'est pas prouvé déployé publiquement.
5. Vérifier que toute nouvelle image est réellement de son événement, ou la dater explicitement si c'est une archive ; stocker auteurs/licences/URLs et preuves.
6. Consulter l'Issue #9 avant toute réutilisation de l'ancien premier reportage ; le label « MP4 réel » ne veut pas dire « approuvé ».
7. Respecter la règle utilisateur : **max de qualité et d'utilité**, parcours très pédagogique, design lumineux et professionnel, pas de rendu générique, validation/notes à chaque étape, ne jamais inventer une validation.

## Cas de reprise — texte à coller dans le nouveau chat

```text
Reprends mon projet World-Vision / World Health Vision sans recommencer de zéro.
Dépôt GitHub : OBIANG5/World-Health-Vision.

Lis AVANT toute action :
- branche feature/world-vision-media-studio :
  worldhealth-vision-v2/docs/continuity/README.md
  worldhealth-vision-v2/docs/continuity/CURRENT_STATE_AND_NEXT_STEP.md
  worldhealth-vision-v2/docs/continuity/PROJECT_TIMELINE.md
  worldhealth-vision-v2/docs/continuity/DECISION_REGISTER.md
  worldhealth-vision-v2/docs/continuity/NEW_CHAT_HANDOFF.md
  worldhealth-vision-v2/docs/continuity/WORK_JOURNAL.md
- worldhealth-vision-v2/docs/media/QUALITY_GATE_EDITORIAL_2026-11-13.md
- worldhealth-vision-v2/docs/media/WORLD_VISION_MEDIA_STUDIO.md
- GitHub Issue #9 (COP31 1/10 REFUSÉ) et PR #5.

Compare ensuite la réalité des branches et des GitHub Actions ; ne prends pas un document ancien pour l'état actuel.
L'œil-globe bleu d'origine est mon LOGO OFFICIEL ACTUEL, validé sans note.
Les 3 propositions de direction A/B/C existent mais je dois encore les juger.
NE PAS lancer un nouveau MP4 final, ni fusionner main/v2, ni publier sur TikTok/WhatsApp
sans validation humaine. Conserve l'historique et mets à jour les docs GitHub après chaque incrément.
Je veux des résultats professionnels, utiles, intègre les véritables preuves, et donne-moi le même lien
permanent consultable sur mon téléphone, avec la nouvelle version et sa capture.
```

## Comment documenter chaque travail dans un nouveau chat

Mettre à jour :
1. [WORK_JOURNAL.md](WORK_JOURNAL.md) : date, objectifs, commits, tests, liens/versions, problèmes, prochaine action.
2. [CURRENT_STATE_AND_NEXT_STEP.md](CURRENT_STATE_AND_NEXT_STEP.md) : l'état *maintenant*, sans promesses prématurées.
3. [DECISION_REGISTER.md](DECISION_REGISTER.md) + fichiers de preuves JSON si validation/refus utilisateur.
4. [PROJECT_TIMELINE.md](PROJECT_TIMELINE.md) si jalon important ou changement d'architecture.
5. [COMMIT_HISTORY_INDEX.md](COMMIT_HISTORY_INDEX.md) si réindexation du passé ; **l'historique Git natif** reste la source vivante complète.
6. Sur le site, afficher le SHA du build visible et le prochain jalon à noter.

Ce protocole s'applique également si la conversation devient trop longue ou que ChatGPT cesse d'accepter les messages.
