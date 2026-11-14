# Dossier de continuité — World-Vision & World Health Vision V2

> **Référence principale pour travailler depuis un nouveau chat ChatGPT.** Ce dossier est dans la branche `feature/world-vision-media-studio`. Point d'entrée depuis la racine : [CONTINUITE_WORLD_VISION.md](../../../CONTINUITE_WORLD_VISION.md).

## Documents maintenus

| Document | Objet | Mise à jour |
|---|---|---|
| [CURRENT_STATE_AND_NEXT_STEP.md](CURRENT_STATE_AND_NEXT_STEP.md) | État actuel prouvé, statuts, liens, branche, prochaine décision | **À chaque session** |
| [NEW_CHAT_HANDOFF.md](NEW_CHAT_HANDOFF.md) | Instructions exactes et prompt pour reprise | À chaque changement stratégique/architecture |
| [PROJECT_TIMELINE.md](PROJECT_TIMELINE.md) | Frise chronologique des travaux depuis V0 de janvier 2026 | Pour chaque jalon important |
| [DECISION_REGISTER.md](DECISION_REGISTER.md) | Registre des validations, refus, interdictions et décisions | **À chaque décision humaine** |
| [WORK_JOURNAL.md](WORK_JOURNAL.md) | Journal append-only des modifications, tests, erreurs et preuves | **À chaque incrément de code ou de média** |
| [COMMIT_HISTORY_INDEX.md](COMMIT_HISTORY_INDEX.md) | Snapshot de **586 commits vérifiés** de la branche (au moment de l'indexation) | Au besoin ; historique Git natif reste vivant |
| [BRANCHES_SNAPSHOT_2026-11-13.md](BRANCHES_SNAPSHOT_2026-11-13.md) | Inventaire de **26 branches** au 13 novembre (source, V2, previews, audits) | À chaque changement important de branches |
| [PREVIEW_RELEASES_AND_CACHE.md](PREVIEW_RELEASES_AND_CACHE.md) | Pourquoi le lien permanent peut paraître ancien et comment prouver le SHA réellement publié | À chaque changement d'hébergement |

## Comment savoir si l'information est fiable

**Niveaux de preuve** :
- **HUMAINE** : message explicite du propriétaire (logo actuellement approuvé, première vidéo refusée, notation). Conserver la formulation, la date, la note si existante, le hash du rendu et la preuve dans GitHub.
- **DÉPÔT** : code/fichiers/commits ; la présence de code **ne prouve pas l'exploitation live**.
- **CI** : test automatisé réussi ; **ne prouve pas** la qualité artistique ou qu'un service est connecté au cloud.
- **PREVIEW** : fichier statique compilé réellement publié, SHA `source_commit` dans `preview-deployment.json`. Sa fraîcheur peut être limitée par le cache de RawGitHack.
- **PUBLICATION** : reçu réel de canal et URL publiquement vérifiée ; aucune publication sans validation finale.

## À chaque travail futur : protocole non négociable

1. Rechercher le **véritable HEAD** GitHub de la branche et examiner le diff pertinent, pas seulement l'ancien résumé.
2. Préserver les décisions déjà prises (Issue #9 **1/10 refusé**, logo bleu actuel accepté, A/B/C non approuvés).
3. Modifier **une fonctionnalité cohérente**, avec tests réels, audit ergonomique iPhone/desktop et exemples visuels ou sonores quand nécessaires.
4. Si le travail touche au design/à la voix/au montage : soumettre un **livrable intermédiaire** et **attendre la validation** avant l'étape suivante.
5. Avant de terminer la réponse, commiter la nouvelle entrée dans `WORK_JOURNAL.md`, mettre à jour `CURRENT_STATE_AND_NEXT_STEP.md`, et, si décision ou jalon important, les registres correspondants.
6. Décrire précisément la **source** : branche source, branche de preview, GitHub Actions run, captures, fichiers, SHAs, limites, échec éventuel.
7. Conserver la **même URL permanente** lorsque cela reste possible, mais vérifier le cache et afficher la version réellement servie. Ne pas prétendre une actualisation instantanée si RawGitHack sert encore l'ancien snapshot.
8. Si le chat se bloque, transmettre `CONTINUITE_WORLD_VISION.md` et `NEW_CHAT_HANDOFF.md` au nouveau chat au lieu de recommencer.

## Ce que la continuité **ne peut pas garantir**

- Les **anciens chats ChatGPT complets** ne sont pas intégralement présents dans ce dépôt ; leur reconstruction est partielle et basée sur messages accessibles et traces vérifiables.
- GitHub ne contient pas automatiquement les grandes archives OneDrive, toutes les images et les vidéos sources ni le navigateur de l'utilisateur.
- Aucune documentation statique ne prouve qu'un service est resté opérationnel 24 h/24 depuis sa rédaction.
- Le snapshot des 586 commits couvre ses ancêtres **à la date de sa création**, pas automatiquement tous les nouveaux commits ou branches parallèles. Utiliser l'[historique GitHub natif](https://github.com/OBIANG5/World-Health-Vision/commits/feature/world-vision-media-studio/) comme registre complet dynamique.

## Outils et projets à préserver

`worldhealth-vision-v2/frontend/web-v2/` : application React/Vite et interfaces pays/régions/Media Studio.  
`worldhealth-vision-v2/services/media-service/` : API, sourcing, vérification, rédaction, validations et modèles.  
`worldhealth-vision-v2/services/media-renderer/` : Remotion, scripts de rendu et archivage MP4.  
`worldhealth-vision-v2/infra/` : Compose, base de données, jobs et observabilité.  
`.github/workflows/whv-media-studio-mobile-preview.yml` : build et smoke test iPhone, publication d'archive.
