# World-Vision — journal de travail évolutif

**Principe :** journal **append-only**. Ajouter une entrée par session ou incrément utile. **Ne pas effacer les entrées anciennes** au prochain chat. Chaque entrée distingue code, tests, déploiement et approbation humaine.

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
