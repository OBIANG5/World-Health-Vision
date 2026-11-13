# WORLD-VISION — COMMENCE ICI POUR REPRENDRE UN CHAT BLOQUÉ

> **Point d'entrée durable du dépôt GitHub.** Ce document permet de relancer la plateforme World Health Vision et le média World-Vision sans réinventer le code ni perdre les décisions utilisateurs.

## Le plus important, à lire en 60 secondes

- **Dépôt :** `OBIANG5/World-Health-Vision` ; **produit V2** sur `v2`, **Media Studio** sur `feature/world-vision-media-studio` ; PR [#5](https://github.com/OBIANG5/World-Health-Vision/pull/5) en draft, non fusionnée.
- **Lien permanent Media Studio :** https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/index.html?view=media
- **Lien direct aux maquettes actuelles :** https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/index.html?view=media&screen=review&gate=direction
- **Logo officiel actuel :** fichier original `frontend/web/src/assets/logo.png` (œil+globe bleu), **approuvé explicitement sans note** ; éventuel vert et multicolore seront étudiés plus tard.
- **Ancien premier MP4 COP31 :** vrai rendu technique, mais **REFUSÉ 1/10** sur quinze critères ; [Issue #9](https://github.com/OBIANG5/World-Health-Vision/issues/9). Ne pas publier ni traiter comme modèle accepté.
- **Jalon actif :** trois directions de l'ouverture A documentaire, B chiffres, C pédagogie ; **aucune sélection ni notation approuvée**. Les faire juger avant toute animation/voix/montage final.
- **Site statique :** le lien téléphone montre le vrai frontend compilé en mode **archive**, pas le backend live 24/7. L'envoi d'un avis sur GitHub requiert encore une confirmation de l'utilisateur sur GitHub.
- **Interdiction absolue :** ne pas fusionner `main`/`v2`/`feature` à l'aveugle, ne pas inventer des sources, scènes réelles, scores, validations, reçus de publication ou une connexion Gemini.

## Lire les documents dans cet ordre

1. **[État du projet et prochaine décision](worldhealth-vision-v2/docs/continuity/CURRENT_STATE_AND_NEXT_STEP.md)** — ce qui est codé, déployé, refusé et en attente.
2. **[Prompt et procédure pour reprendre dans un nouveau chat](worldhealth-vision-v2/docs/continuity/NEW_CHAT_HANDOFF.md)** — texte à copier, vérifications GitHub et protocole.
3. **[Historique chronologique V0 → V2 → Media Studio](worldhealth-vision-v2/docs/continuity/PROJECT_TIMELINE.md)** — reconstitution sourcée, sans prétendre restituer les chats mot pour mot.
4. **[Registre de toutes les décisions validées/refusées](worldhealth-vision-v2/docs/continuity/DECISION_REGISTER.md)** — preuves et blocages humains.
5. **[Journal de travail à compléter à chaque session](worldhealth-vision-v2/docs/continuity/WORK_JOURNAL.md)** — commits, QA, preview, captures, erreurs, point de reprise.
6. **[Index des 586 commits d'ancêtres vérifiés](worldhealth-vision-v2/docs/continuity/COMMIT_HISTORY_INDEX.md)** — historique Git détaillé jusqu'au 13 novembre ; [historique Git natif dynamique](https://github.com/OBIANG5/World-Health-Vision/commits/feature/world-vision-media-studio/) pour toutes les modifications ultérieures.

## Compléments techniques

- [Architecture du Media Studio](worldhealth-vision-v2/docs/media/WORLD_VISION_MEDIA_STUDIO.md)
- [Audit artistique et méthodologie d'approbation](worldhealth-vision-v2/docs/media/QUALITY_GATE_EDITORIAL_2026-11-13.md)
- [Contrat du formulaire de notation](worldhealth-vision-v2/docs/media/REVIEW_AND_APPROVAL_WORKFLOW.md)
- [Limites de publication TikTok et WhatsApp](worldhealth-vision-v2/docs/media/PUBLISHING_CONNECTORS.md)
- [Historique des échanges et travaux antérieurs au 13 novembre](worldhealth-vision-v2/docs/media/REPRISE_PROJET_WORLD_VISION_2026-11-12.md) — document d'époque à relire avec attention : certains états sont dépassés.
- [Règles de documentation à respecter](worldhealth-vision-v2/docs/continuity/README.md)

## Discipline à imposer à tout nouveau chat ChatGPT

1. **Lire GitHub AVANT de coder** : sources, dernière branche, PR, CI, publications, fichiers sauvegardés.
2. **Compléter la documentation APRÈS chaque incrément** (pas seulement à la fin du projet).
3. **Montrer les rendus réellement produits**, identifier les maquettes versus MP4, fournir le lien du site mis à jour sur iPhone et vérifier le `source_commit` affiché.
4. **Demander l'approbation du propriétaire à chaque jalon créatif** ; un « continue » est une demande de progression réfléchie, pas une validation rétroactive d'un rendu insuffisant.
5. Garder les sources, crédits, licences, métadonnées, empreintes et retours notés ; ne pas produire des faux éléments d'actualité.
6. **Reconnaître les limites** des données historiques : le journal Git enregistre le code, pas toutes les paroles échangées. Compléter par le propriétaire quand une décision manque.

**Ce fichier se trouve volontairement à la racine de la branche Media Studio.** Il reste accessible indépendamment de la longueur du chat actuel.
