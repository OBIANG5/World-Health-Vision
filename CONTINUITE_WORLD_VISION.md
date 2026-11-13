# WORLD-VISION — COMMENCE ICI POUR REPRENDRE UN CHAT BLOQUÉ


## ALERTE DE REPRISE — NE PAS REMPLACER D00-v6 PAR LE GLOBE VECTORIEL

**13 novembre 2026.** Le propriétaire a clairement rejeté l'idée que le globe simplifié du laboratoire remplace la belle image cinématographique de référence. **Le Canvas GeoGlobe/GeoTargetingLab n'est qu'un prototype de rotation**, et non une direction artistique de rechange.

**Visuel artistique de référence en cours de validation** : `a_crisp_ultra_detailed_high_contrast_digital_ill.png`, PNG exact 1086×1448, SHA-256 `8d9a9d20f20fbf7757713b6f5eab06590f191166eb779865747f0f59683cfca2`. Le fichier a été retrouvé localement dans le chat ; ses **pixels ne sont pas encore importés dans GitHub**. Ne pas confondre une empreinte et un fichier sauvegardé. Préserver les détails photographiques, les frontières des pays du Sahara, le globe immense, les deux arcs de l'œil du vrai logo, le blanc pur et l'atmosphère cyan dominante ; G1 n'est pas encore validé.

**Changement de code** : `GlobeDirection.tsx` affiche un encadré `data-art-direction-ref="D00-v6"` et range la démonstration technique dans une section `<details id="wv-globe-tech">` fermée par défaut. Le test mobile `media-preview-smoke.mjs` vérifie le libellé et la fermeture avant d'ouvrir volontairement le simulateur. Détails dans `docs/continuity/CURRENT_STATE_AND_NEXT_STEP.md`, `docs/continuity/DECISION_REGISTER.md` et `docs/continuity/WORK_JOURNAL.md`.

**Objectif de l'incrément suivant** : récréer la qualité de D00-v6 en CGI 3D reproductible, coupler le mouvement géographique existant sans en reprendre l'apparence simplifiée, puis faire approuver séparément la belle frame 9:16 et le micro-clip. Les 137 pages de formation, la voix, les rushes, le montage, les sous-titres et la QA restent dans `worldhealth-vision-v2/docs/media/AUDIOVISUAL_PRODUCTION_MASTER_PLAN_2026-11-13.md`.

---


## REPRISE PRIORITAIRE — prototype de rotation vers les pays réellement livré (13/11/2026)

**Ne pas recommencer de zéro :** le laboratoire technique qui fait tourner la Terre vers un pays est **codé et accessible** dans le Media Studio. Il repose sur `geoTargeting.mjs` (SLERP, code ISO3, données GeoJSON), `GeoTargetingLab.tsx` et `GeoGlobe.tsx`; une actualité avec `country_iso3` exploitable présélectionne son pays, sinon aucun pays n'est inventé. Rotation manuelle sur 4 s, curseur et reset. **Il s'agit d'une carte Canvas 2.5D de laboratoire, pas de la future vidéo 3D professionnelle.**

**Preuve :** [workflow de preview mobile réussi](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43461296086) ; manifeste de site `source_commit=f0b281889676a20fbefba62fd45cf1fd5c2856ed` ; screenshots iPhone publiés dont [arrivée au Gabon](https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-globe-motion-arrival-gabon-iphone.png). [Lien Media Studio permanent](https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/index.html?view=media&screen=review&gate=direction), bouton « Tester le nouveau moteur : la Terre tourne vers un pays ».

**Les validations existantes ne changent pas :** G0 logo bleu officiel, D00-v6 concept art non approuvé, A/B/C rejetées, MP4 COP31 refusé, D01 seulement prototype technique. **Étape suivante :** obtenir le master D00 photoréaliste 3D en vrai 9:16 avec frontières Sahara fiables, halo atmosphérique cyan dominant, blanc d'œil pur et exactement deux arcs hors écran ; le faire approuver, puis le connecter à la rotation mathématique. Ensuite voix naturelle à auditionner, montage rushes authentiques, sous-titres, audio, QA, exports. Le PDF 137 pages et les 14 étapes du Media Studio restent documentés [dans le plan directeur](worldhealth-vision-v2/docs/media/AUDIOVISUAL_PRODUCTION_MASTER_PLAN_2026-11-13.md) et [l'audit d'ingénierie](worldhealth-vision-v2/docs/media/engineering/GEO_TARGETING_PROTOTYPE_2026-11-13.md).

---



## POINT ACTUEL — 13 NOVEMBRE, NOUVELLE IMAGE D00-v6 ET PLAN COMPLET

**Ce paragraphe est prioritaire sur les récapitulatifs antérieurs v4/D00 du fichier.** Le propriétaire aime la direction de D00-v5 mais a demandé blanc d'œil **pur**, diffusion atmosphérique **plus claire que les deux arcs** et **frontières des pays du Sahara** beaucoup plus lisibles. Une nouvelle **image fixe D00-v6** existe dans la conversation, SHA-256 `8d9a9d20f20fbf7757713b6f5eab06590f191166eb779865747f0f59683cfca2`. **Elle n'est pas encore validée et son binaire n'a pas été enregistré sur GitHub.**

**À LIRE pour reprendre sans perdre voix/montage/code :**
- [Plan directeur audiovisuel complet : manuel de 137 pages, pipeline, globe, voix, montage, QA](worldhealth-vision-v2/docs/media/AUDIOVISUAL_PRODUCTION_MASTER_PLAN_2026-11-13.md).
- [Contrat machine D00-v6, Géociblage futur](worldhealth-vision-v2/docs/media/art-direction/d00-eye-globe-visual-contract-v6.json).
- [Historique des six images et corrections](worldhealth-vision-v2/docs/media/art-direction/D00_EYE_GLOBE_VISUAL_ITERATIONS_2026-11-13.md).
- [Décisions humaines](worldhealth-vision-v2/docs/continuity/DECISION_REGISTER.md), [Journal](worldhealth-vision-v2/docs/continuity/WORK_JOURNAL.md), [État](worldhealth-vision-v2/docs/continuity/CURRENT_STATE_AND_NEXT_STEP.md).

**Prochaine production à entreprendre après validation humaine du visuel** : créer un globe 3D **qui tourne automatiquement vers le pays/localisation de chaque actualité**, en s'appuyant sur des coordonnées vérifiées, puis traiter chaque plan, les vraies images, trois auditions de voix, le calage/sous-titrage, le montage et les exports ; **pas de vidéo complète avant toutes validations**. Logo officiel discret en haut à gauche ou autre coin = **hypothèse de design non validée**. Ne pas supposer que les fichiers générés dans le chat ont été publiés sur le site statique.

---


> **Point d'entrée durable du dépôt GitHub.** Ce document permet de relancer la plateforme World Health Vision et le média World-Vision sans réinventer le code ni perdre les décisions utilisateurs.

**Entrée GitHub indépendante des branches :** [Issue #11 — START HERE : reprise World-Vision](https://github.com/OBIANG5/World-Health-Vision/issues/11). Ce ticket renvoie à tous les fichiers de continuité même si GitHub ouvre `main` par défaut.

## Décision artistique la plus récente (13 novembre 2026) — LIRE AVANT TOUTE ACTION

Le propriétaire a explicitement **rejeté les trois premières maquettes A/B/C** : elles sont jugées « moches », sans note chiffrée donnée individuellement. Ne jamais lui demander de les sélectionner à nouveau.

Nouvelle signature prioritaire : **« globe terrestre qui tourne vers le pays → zoom pays/ville → vrais médias de l'actualité vérifiée → information/contextualisation → transition »**. Les inspirations viennent de deux vidéos TikTok, dont une a été réellement réexpédiée et analysée (Focus Géopolitique, SHA `4e4e979144b59ee9359287c75773cfbbb5cefbd12d05f71ec9ba3bd66f3328bb`). **Le prompt exact disparu sous les deux vidéos reste introuvable** : ne pas en inventer la citation.

La formation `monter-et-animer-vos-videos-avec-claude-v2.pdf` de **137 pages** a été retrouvée et ses chapitres sur les designs, voix, skills, montage et contrôle qualité ont été lus. Elle doit guider l'implémentation **avec ChatGPT et le code GitHub**, sans prétendre que Claude est indispensable.

**Nouveau code visuel proposé :** `worldhealth-vision-v2/frontend/web-v2/src/media/GeoGlobe.tsx`, `GlobeDirection.tsx` + CSS, six poses fixes D00→D05, source `public/countries.geojson`. **Ce sont des maquettes vectorielles à évaluer, pas encore un globe photoréaliste en vidéo ni des plans réels de reportage.** Logo officiel bleu maintenu. Ancien COP31 MP4 rejeté 1/10. Ne pas lancer de rendu complet.

Lire impérativement :
- [Directive artistique complète](worldhealth-vision-v2/docs/media/art-direction/WORLD_VISION_GLOBE_SIGNATURE_DIRECTIVE_2026-11-13.md)
- [Audit d'application de la formation](worldhealth-vision-v2/docs/media/TRAINING_137_PAGES_IMPLEMENTATION_AUDIT_2026-11-13.md)
- [État actuel](worldhealth-vision-v2/docs/continuity/CURRENT_STATE_AND_NEXT_STEP.md)
- [Registre des décisions](worldhealth-vision-v2/docs/continuity/DECISION_REGISTER.md)

---
## Point de reprise prioritaire — message du 13 novembre 2026

**L'étape actuelle est l'identité audiovisuelle G1 : un globe géographique qui ouvre un reportage et converge vers le lieu concerné, puis de vraies images/vidéos et des explications.**

**Les anciennes maquettes A/B/C sont REFUSÉES. D00–D05 sont des prototypes d'images fixes non approuvés.**
Le propriétaire a corrigé explicitement toute généralisation : **une actualité peut concerner UN seul pays, et ne doit surtout pas en faire défiler plusieurs par défaut**. Plusieurs lieux seulement lorsqu'ils servent le sujet.

- [Contrat des formats : un lieu / relations géographiques / tour du monde](worldhealth-vision-v2/docs/media/art-direction/EDITORIAL_GLOBE_FORMATS_AND_REVIEW_CONTRACT_2026-11-13.md)
- [Audit partiel du manuel de 137 pages contre le code réel](worldhealth-vision-v2/docs/media/TRAINING_137_PAGES_IMPLEMENTATION_AUDIT_2026-11-13.md)
- [État et action suivante](worldhealth-vision-v2/docs/continuity/CURRENT_STATE_AND_NEXT_STEP.md)

Le logiciel et les docs ne prouvent pas une vidéo professionnelle finale, ni la connexion Google Flow/ElevenLabs/Gemini/n8n. Reprendre D00 avec inspection visuelle et notes, **sans faire de MP4 complet avant validation**.

---

## Le plus important, à lire en 60 secondes

- **Dépôt :** `OBIANG5/World-Health-Vision` ; **produit V2** sur `v2`, **Media Studio** sur `feature/world-vision-media-studio` ; PR [#5](https://github.com/OBIANG5/World-Health-Vision/pull/5) en draft, non fusionnée.
- **Lien permanent Media Studio :** https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/index.html?view=media
- **Lien direct aux maquettes actuelles :** https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/index.html?view=media&screen=review&gate=direction
- **Logo officiel actuel :** fichier original `frontend/web/src/assets/logo.png` (œil+globe bleu), **approuvé explicitement sans note** ; éventuel vert et multicolore seront étudiés plus tard.
- **Ancien premier MP4 COP31 :** vrai rendu technique, mais **REFUSÉ 1/10** sur quinze critères ; [Issue #9](https://github.com/OBIANG5/World-Health-Vision/issues/9). Ne pas publier ni traiter comme modèle accepté.
- **Jalon actif :** trois directions de l'ouverture A documentaire, B chiffres, C pédagogie ; **aucune sélection ni notation approuvée**. Les faire juger avant toute animation/voix/montage final.
- **Site statique :** le lien téléphone montre le vrai frontend compilé en mode **archive**, pas le backend live 24/7. L'envoi d'un avis sur GitHub requiert encore une confirmation de l'utilisateur sur GitHub.
- **Interdiction absolue :** ne pas fusionner `main`/`v2`/`feature` à l'aveugle, ne pas inventer des sources, scènes réelles, scores, validations, reçus de publication ou une connexion Gemini.

## Référence vidéo récemment récupérée (13 novembre 2026)

Une des deux vidéos TikTok auparavant signalées comme disparues a **été renvoyée et analysée image par image** : clip de ~64,9 s, globe satellitaire mobile, cinq rubriques géopolitiques, filigrane `@focus.geopolitique`. La direction visuelle candidate **D : « Globe → pays → information »** en est issue. **Aucune nouvelle direction n'est validée** pour autant.

- [Étude minutée de la vidéo réellement reçue](worldhealth-vision-v2/docs/media/references/2026-11-13-focus-geopolitique-video-reference.md)
- [Manifest JSON et SHA-256 exact](worldhealth-vision-v2/docs/media/references/2026-11-13-focus-geopolitique-video-reference.json)
- **Original MP4 :** reçu dans ChatGPT, mais **non versé sur GitHub**, car média tiers dont les droits ne sont pas vérifiés. Une sauvegarde privée est nécessaire pour conserver les octets originaux hors de ce chat.

## Lire les documents dans cet ordre

1. **[État du projet et prochaine décision](worldhealth-vision-v2/docs/continuity/CURRENT_STATE_AND_NEXT_STEP.md)** — ce qui est codé, déployé, refusé et en attente.
2. **[Prompt et procédure pour reprendre dans un nouveau chat](worldhealth-vision-v2/docs/continuity/NEW_CHAT_HANDOFF.md)** — texte à copier, vérifications GitHub et protocole.
3. **[Historique chronologique V0 → V2 → Media Studio](worldhealth-vision-v2/docs/continuity/PROJECT_TIMELINE.md)** — reconstitution sourcée, sans prétendre restituer les chats mot pour mot.
4. **[Registre de toutes les décisions validées/refusées](worldhealth-vision-v2/docs/continuity/DECISION_REGISTER.md)** — preuves et blocages humains.
5. **[Journal de travail à compléter à chaque session](worldhealth-vision-v2/docs/continuity/WORK_JOURNAL.md)** — commits, QA, preview, captures, erreurs, point de reprise.
6. **[Index des 586 commits d'ancêtres vérifiés](worldhealth-vision-v2/docs/continuity/COMMIT_HISTORY_INDEX.md)** — historique Git détaillé jusqu'au 13 novembre ; [historique Git natif dynamique](https://github.com/OBIANG5/World-Health-Vision/commits/feature/world-vision-media-studio/) pour toutes les modifications ultérieures.
7. **[Inventaire des 26 branches](worldhealth-vision-v2/docs/continuity/BRANCHES_SNAPSHOT_2026-11-13.md)** — retrouver V0/V1/V2, médias et branches de preview sans perdre les travaux parallèles.
8. **[Guide du cache et des mises à jour du lien permanent](worldhealth-vision-v2/docs/continuity/PREVIEW_RELEASES_AND_CACHE.md)** — version visible, tests, limites et nouveau lien de preview si nécessaire.

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
