# World-Vision — inventaire des branches GitHub

**Capture du 13 novembre 2026.** Ce fichier photographie la liste des branches à cette date et leurs HEADs ; les branches peuvent évoluer ensuite. **Ne fusionner ou supprimer aucune branche sans audit et validation.**

Objectif : empêcher qu'un nouveau chat reprenne la mauvaise version de V2 ou confonde code média et aperçu compilé.

**26 branches constatées.**

## Branches de base

| Branche | SHA constaté | Rôle / attention |
|---|---|---|
| [`main`](https://github.com/OBIANG5/World-Health-Vision/tree/main) | `f3e2089f7e314c58118b620ca42cabc354bdc187` | Principalement historique V0, **ne pas présumer que c'est V2** |
| [`release/V1`](https://github.com/OBIANG5/World-Health-Vision/tree/release%2FV1) | `2db2a8f7e59da401247620854da311535c42d019` | Historique / restauration, conserver |
| [`v0`](https://github.com/OBIANG5/World-Health-Vision/tree/v0) | `f3e2089f7e314c58118b620ca42cabc354bdc187` | Historique / restauration, conserver |
| [`v1`](https://github.com/OBIANG5/World-Health-Vision/tree/v1) | `2db2a8f7e59da401247620854da311535c42d019` | Historique / restauration, conserver |
| [`v2-rewrite`](https://github.com/OBIANG5/World-Health-Vision/tree/v2-rewrite) | `6d3db5b87bb81a54bffae15d1b3ee02a7111fa22` | Historique / restauration, conserver |
| [`v2`](https://github.com/OBIANG5/World-Health-Vision/tree/v2) | `2d8eb7cb74aed1d5b75396d3d25438c8473e891f` | **Version applicative V2**, vérifier avant développement |

## Média et prévisualisations

| Branche | SHA constaté | Rôle / attention |
|---|---|---|
| [`feature/world-vision-media-studio`](https://github.com/OBIANG5/World-Health-Vision/tree/feature%2Fworld-vision-media-studio) | `ab4a7410f89b7a19e2db652950e95e8036fcb7fb` | **Code Media Studio**, PR #5 draft |
| [`whv-media-studio-browser-preview`](https://github.com/OBIANG5/World-Health-Vision/tree/whv-media-studio-browser-preview) | `060362eb3f7dc14c6ee2e2aa6b99838612446f0f` | **Site compilé**, pas la branche source |
| [`whv-v2-browser-preview`](https://github.com/OBIANG5/World-Health-Vision/tree/whv-v2-browser-preview) | `ba78d300692bec894486899a1ee77d5bb96505b6` | Aperçu, vérifier le commit de compilation |

## Restauration, audits et sources V2

| Branche | SHA constaté | Rôle / attention |
|---|---|---|
| [`audit/whv-v2-integral-2026-11-10`](https://github.com/OBIANG5/World-Health-Vision/tree/audit%2Fwhv-v2-integral-2026-11-10) | `34ea9b30c78f6d696586e449e48582897e51c9e6` | Historique / restauration, conserver |
| [`feature/v2-interactive-globe-2026-11-12`](https://github.com/OBIANG5/World-Health-Vision/tree/feature%2Fv2-interactive-globe-2026-11-12) | `b71e764f7550dd2a155bf17e016cfae8fc745f24` | Travaux isolés, pas fusionnés par défaut |
| [`improve/v2-country-local-evidence-2026-11-12`](https://github.com/OBIANG5/World-Health-Vision/tree/improve%2Fv2-country-local-evidence-2026-11-12) | `57d9ae1cfe4d7f7cef66fd3f1c66bbe7db6613dd` | Travaux isolés, pas fusionnés par défaut |
| [`improve/v2-country-national-comparisons-2026-11-12`](https://github.com/OBIANG5/World-Health-Vision/tree/improve%2Fv2-country-national-comparisons-2026-11-12) | `1e35f27371fd9d9ac38b5c51fb459c2ae4d50c38` | Travaux isolés, pas fusionnés par défaut |
| [`improve/v2-country-source-coverage-and-regional-institutions-2026-11-12`](https://github.com/OBIANG5/World-Health-Vision/tree/improve%2Fv2-country-source-coverage-and-regional-institutions-2026-11-12) | `04314dad95d3ab8152d95cef6fa88d20411d8a0f` | Travaux isolés, pas fusionnés par défaut |
| [`improve/v2-first-load-speed-2026-11-13`](https://github.com/OBIANG5/World-Health-Vision/tree/improve%2Fv2-first-load-speed-2026-11-13) | `d5f391a433340b414156756b8ca615de67410f7a` | Travaux isolés, pas fusionnés par défaut |
| [`improve/v2-historical-source-alignment-2026-11-12`](https://github.com/OBIANG5/World-Health-Vision/tree/improve%2Fv2-historical-source-alignment-2026-11-12) | `123c311ae2054f842fbf91e5ac6e22ea74a2af17` | Travaux isolés, pas fusionnés par défaut |
| [`improve/v2-inflation-source-integrity-2026-11-10`](https://github.com/OBIANG5/World-Health-Vision/tree/improve%2Fv2-inflation-source-integrity-2026-11-10) | `b499e22ee5884dc01f14879c9a8cf94caec91990` | Travaux isolés, pas fusionnés par défaut |
| [`improve/v2-local-source-availability-audit-2026-11-12`](https://github.com/OBIANG5/World-Health-Vision/tree/improve%2Fv2-local-source-availability-audit-2026-11-12) | `fcfb253ec5d09425ca4f8e8f7390dba173a85d68` | Travaux isolés, pas fusionnés par défaut |
| [`improve/v2-source-data-transparency-2026-11-10`](https://github.com/OBIANG5/World-Health-Vision/tree/improve%2Fv2-source-data-transparency-2026-11-10) | `3e45611d2ce08fa86d03073d0bbabdd974e26c18` | Travaux isolés, pas fusionnés par défaut |
| [`probe/v2-official-inflation-downloads-2026-11-10`](https://github.com/OBIANG5/World-Health-Vision/tree/probe%2Fv2-official-inflation-downloads-2026-11-10) | `4bd15b0c80f9e162caf6d7ede546050cbbca8a97` | Historique / restauration, conserver |
| [`sync/onedrive-v2-2026-11-05`](https://github.com/OBIANG5/World-Health-Vision/tree/sync%2Fonedrive-v2-2026-11-05) | `293a441065ef5dc0ee66a921e38451faac0c281e` | Historique / restauration, conserver |

## Maintenance automatique

| Branche | SHA constaté | Rôle / attention |
|---|---|---|
| [`dependabot/npm_and_yarn/frontend/web/npm_and_yarn-49a8534fc7`](https://github.com/OBIANG5/World-Health-Vision/tree/dependabot%2Fnpm_and_yarn%2Ffrontend%2Fweb%2Fnpm_and_yarn-49a8534fc7) | `397e0ba72e92ab1858abb0ab764f9c5555dfed02` | Dépendances automatiques, hors tâche média |
| [`dependabot/npm_and_yarn/frontend/web/npm_and_yarn-74206fabdd`](https://github.com/OBIANG5/World-Health-Vision/tree/dependabot%2Fnpm_and_yarn%2Ffrontend%2Fweb%2Fnpm_and_yarn-74206fabdd) | `332a04410d192a0da0dfbc3746afb690badc9d49` | Dépendances automatiques, hors tâche média |

## Autres branches

| Branche | SHA |
|---|---|
| `improve/media-studio-mobile-preview-2026-11-12` | `ccaf1b503da35e49282e6dfd4dd47d3cc1193e68` |
| `preview/whv-v2-complete-current-2026-11-10` | `bb150f463dda49b41a9623fa994b52feb755445a` |
| `preview/whv-v2-iphone` | `04b432718ef5daa890285e2913fe8487707deaa2` |

## Règles de reprise

- Rechercher les derniers SHA au moment du nouveau chat, car cet inventaire est un instantané.
- Le commit de l'aperçu `whv-media-studio-browser-preview` n'est **pas** le commit de la source React : consulter `preview-deployment.json.source_commit`.
- Conserver les branches `v2` et `feature/world-vision-media-studio` séparées jusqu'à intégration/test explicite.
- Pour une histoire exhaustive de la branche Media Studio, voir [COMMIT_HISTORY_INDEX.md](COMMIT_HISTORY_INDEX.md) et l'historique Git natif.
