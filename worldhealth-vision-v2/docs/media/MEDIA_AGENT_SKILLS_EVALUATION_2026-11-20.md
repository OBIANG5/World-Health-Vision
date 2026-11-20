# World-Vision Media : étude contradictoire des skills vidéo 2026, compatibilité Claude/Codex et plan d'adoption

**Date de vérification : 20 novembre 2026.** Branche isolée `feature/worldvision-media-agent-skills-2026-11-20`, empilée sur le film intégré [PR #87](https://github.com/OBIANG5/World-Health-Vision/pull/87). Les URL d'origine ont été examinées sur les sites éditeurs et les `SKILL.md` lisibles. **Il ne s'agit pas d'un classement universel de popularité** ni d'un audit de sécurité exhaustif des fichiers/scripts. Les tendances sociales, vues et installations ne sont pas une preuve de qualité, de droits ni de pérennité.

## 1. Le résultat le plus important : ne pas réinventer les savoir-faire, ne pas dupliquer les moteurs

Un *Agent Skill* est un dossier de consignes/références/scripts avec entrée `SKILL.md` ; il donne des méthodes à Claude Code, Codex, Cursor ou agents compatibles mais **ne transforme pas à lui seul une vidéo en un reportage professionnel**. Un pack peut aussi ajouter des scripts, dépendances, hébergement, API externes et/ou une facturation distincte.

Le bon principe de World-Vision :

- Garder **Remotion + React** comme moteur final de montage pour les scènes GEO, PAYS, PHOTO, DATA, DOCUMENT, son et sous-titres.
- Réutiliser les **skills officiels de Remotion** plutôt que coder les animations en ignorant les API et les conventions déjà conçues pour elles.
- Prendre **claude-motion** comme inspiration technique pour une réalisation *storyboard → motion → contact sheets/auto-critique → sound design*.
- Explorer **HyperFrames** pour son vocabulaire réutilisable de motions et de transitions **sans migrer le moteur**, sauf si un test contradictoire établit un avantage décisif sur un cas ciblé.
- Partir d'**un skill World-Vision propre** pour les exigences non négociables d'un média international : vérité, droits, géographie, échelles, dates, attribution, identité visuelle, lisibilité mobile et sécurité des installations.

Un skill arbitraire « viral sur TikTok » peut décrire un rendu spectaculaire sur son seul clip. **La preuve valable pour le projet** est une confrontation mesurée avec la même actualité, les mêmes vrais médias autorisés et la même durée, puis contrôle du film final à 360 px / en application TikTok.

## 2. Comparaison priorisée pour World-Vision

| Priorité | Source (primaire) et skills | Apport immédiat | Limite / risque | Décision actuelle |
|---|---|---|---|---|
| **P0** | [Remotion officiel](https://www.remotion.dev/docs/ai/skills) / [remotion-dev/skills](https://github.com/remotion-dev/skills) : `remotion-markup`, `remotion-render`, `remotion-maps`, `remotion-captions`, `remotion-interactivity`, `remotion-multimedia` | Références natives du moteur actuel, architecture multi-scènes, typographie, animations de cartes, piste audio, tests de vidéo, captations, interactivité | Ce sont des bonnes pratiques, **pas des vidéos finies**. Installer une version compatible avec notre Remotion, sans update aveugle. | **À adopter en premier**, sous contrôle de compatibilité et permissions |
| **P0** | [whaleyxbt/claude-motion](https://github.com/whaleyxbt/claude-motion), [motion-design](https://github.com/whaleyxbt/claude-motion/blob/main/.claude/skills/motion-design/SKILL.md), [review-loop](https://github.com/whaleyxbt/claude-motion/blob/main/.claude/skills/review-loop/SKILL.md), [sound-design](https://github.com/whaleyxbt/claude-motion/blob/main/.claude/skills/sound-design/SKILL.md) | Storyboard numérique, principes de rythme, échelles et espaces utiles, visionnage de planches de contact, corrections, cues sonores alignés sur timeline, vérification du loudness | Le code du moteur sonore est un composant tiers à auditer ; son cible LUFS n'est pas automatiquement une règle universelle TikTok / voix d'information | **Adopter la méthode de revue**, étudier moteur SFX de façon isolée |
| **P1** | [HeyGen HyperFrames](https://github.com/heygen-com/hyperframes), [registry](https://github.com/heygen-com/hyperframes/blob/main/skills/hyperframes-registry/SKILL.md), [motion-graphics](https://github.com/heygen-com/hyperframes/blob/main/skills/motion-graphics/SKILL.md) | Catalogue annoncé d'environ 450 modules/blocks : kinetic type, chart, maps, focus caméra, lower thirds, wipes, textures, captions et overlays ; utile pour éviter la réécriture d'effets | **Autre runtime HTML/GSAP** : migrer Remotion casserait la parité Player/MP4 et augmenterait la maintenance. Certaines commandes déclenchent télémétrie ; installer peut exécuter des scripts ou télécharger des packages. | **Bibliothèque de référence et prototype A/B isolé**, pas un remplacement automatique |
| **P1** | [charlie947/motion-graphics-skills](https://github.com/charlie947/motion-graphics-skills) : `brand-intake`, `motion-brief-writer`, `vox-explainer`, `animated-chart`, `reel-export` | Grammaires de vidéo explicative, briefing de marque, vidéo finance, scripts courts, graphiques et formats verticaux | Templates de présentation parfois centrés promo, pas journalismes ; marque, faits et licences à contrôler ; ne pas imiter visuellement une marque de presse spécifique | **S'inspirer des briefs et chart QA**, port ciblé éventuel |
| **P1** | [HyperFrames reverse-any-video](https://github.com/heygen-com/hyperframes/blob/main/skills/reverse-any-video/SKILL.md) | Identifier cuts exacts, durées, layers, timbrage, mouvements, comparer original et reconstruction, idéal pour **étudier** les deux références de l'utilisateur | Fonctionnalité **Pro**, coût/identification/exécution distants ; recommandations de reconstitution ne valent pas autorisation de copier les rushes, logos, voix ou images | **Méthode d'analyse seulement pour l'instant**, jamais payer/charger les vidéos hors environnement sans accord |
| **P2** | [HyperFrames style-sampling](https://github.com/heygen-com/hyperframes/blob/main/skills/style-sampling/SKILL.md) | Cinq familles annoncées dont Finance Explainer et Collage Explainer ; variantes d'esthétique à comparer | **Pro** ; modèles de voix/visages parfois nécessaires ; danger de copier l'apparence éditoriale d'un tiers | **Pas d'intégration maintenant** ; World-Vision doit garder sa signature |
| **P2** | [Anthropic frontend-design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md) | Design tokens, rythme d'interface, contraste, traitement de la typographie dans le Studio, non-généricité | Cible plutôt UI que montage ; n'apporte pas seul le rendu H.264 | **Pertinent pour le Studio**, secondaire face à motion/audio |
| **Sécurité P0** | [NVIDIA SkillSpector](https://github.com/NVIDIA/skillspector) | Scanner des skills pour exfiltration, prompt injection, scripts dangereux, permissions excessives, dépendances | Un scan ne garantit pas la sécurité ; la résolution de ses alertes demande revue humaine et isolement | **Exiger audit avant exécution de code tiers** ; outil non encore exécuté ici |

**Ce qui a été fait dans cette PR :** création de `worldvision-media-director` en **deux dossiers standards** `.agents/skills` (Codex) et `.claude/skills` (Claude Code), avec exactement le même contenu et des règles de non-invention, droits, qualité 360px et contrôle GitHub. Il n'y a **pas eu installation automatique des projets tiers** : le guide officialise comment les sélectionner puis les auditer séparément. Nous n'affirmons ni qu'une licence tierce a été achetée, ni qu'un binaire extérieur a été validé par la CI.

## 3. Application aux deux références vidéo que l'utilisateur a fournies

**Référence 1 — vidéo finance « Bourse Express », verticale ~94,6 s (512×910 dans la première analyse).** Son efficacité vient des chiffres visibles très tôt, des courbes/rankings/heatmaps, du ticker et du montage modulaire. Le saut de qualité World-Vision doit intégrer plusieurs motions simultanées qui *servent* le récit, sans saturer la lecture. Couplage ciblé : `remotion-markup` pour les pistes, `animated-chart` pour comparer des transitions de graphes, HyperFrames Registry pour étudier les variations de comptage et tableaux, et `review-loop` pour réduire les collisions. **Notre DATA (PR #84) a déjà des contraintes de véracité** : échelle explicite, dates proportionnelles, source affichée, ex æquo. Ne jamais substituer un composant qui altère la comparaison ni inventer des variations financières.

**Référence 2 — vidéo géopolitique/carte, verticale ~59,5 s (512×910).** Elle situe d'abord puis montre pays/photo/date. Couplage ciblé : `remotion-maps` + atlas Natural Earth déjà utilisé, contrôles de pays 1:10m, trajectoires contrôlées, caméra, split-country/media. La sophistication doit venir de la géographie qui raconte, des halos dosés et de la parallax multi-couches, pas d'un décor qui efface l'événement. Les frontières et les points doivent être publiables et vérifiables.

**Référence visuelle œil + globe lumineux, et vidéo Gabon GEO appréciée.** Ce sont des contraintes de direction artistique, non des licences de réutilisation d'une photo externe. Le film Sprint12 [PR #87](https://github.com/OBIANG5/World-Health-Vision/pull/87) montre déjà un globe visuellement fort mais un reste du film beaucoup plus plat (pays/photo/data/document à l'heure actuelle). **Écart artistique majeur :** créer une continuité de composition et de lumière/typo/échelle entre les cinq langages, plutôt que rajouter des micro-motions sans utilité. Les fonds vides restent importants dans plusieurs plans ; exploiter mieux la surface utile tout en préservant les zones TikTok.

**Aucune de ces références n'autorise automatiquement l'import de sa bande-son, ses logos, personnages, rushes ou textes.** Référence de mouvement = analyse et création originale avec marque World-Vision.

## 4. Architecture de skills pour fonctionner avec Claude Code, Codex et ChatGPT

- **Codex en repo :** `.agents/skills/worldvision-media-director/SKILL.md`
- **Claude Code en repo :** `.claude/skills/worldvision-media-director/SKILL.md`
- **Cette conversation ChatGPT connectée à GitHub :** les skill files dans le dépôt sont un **manuel consultable** via GitHub ; leur présence dans le dépôt n'installe pas automatiquement un moteur d'exécution ou un plugin dans tous les chats. En appelant explicitement GitHub, un agent peut les lire et appliquer leur contenu.
- **Portable :** le format `SKILL.md` et son frontmatter sont les mêmes. Les chemins de découverte, la permission d'exécuter du code et les outils disponibles dépendent de l'environnement. Un skill qui demande `npx`, un terminal, un service cloud, une clé API ou un serveur MCP ne peut pas les créer tout seul.

Les fichiers ont été **rédigés pour ce projet** et reprennent les principes observés, **sans recopier les skills tiers**. Ils doivent rester byte-identical : une vérification automatisée séparée est ajoutée pour bloquer toute divergence au fil des sprints.

## 5. Matrice de décision « adapter, utiliser, construire »

| Besoin World-Vision | Premier essai | Quand adapter du tiers | Critère de réception |
|---|---|---|---|
| Globe/atlas d'ouverture | GEO actuel + règles Remotion/maps | Approfondir caméra 3D seulement si vitesse/rendu gagnent | Pays exact, géométrie, luminosité, 360px, temps d'export |
| Country focus | PAYS 10m + PHOTO actuel | Effet de contour, insertion d'image sous marque originale | Pays vrai, pas de fausse localisation, texte lisible |
| Une image → plusieurs motions | PHOTO actuel + `remotion-markup` | Mouvement/masques du registry si licence compatible | ≥3 pistes réellement indépendantes, sans surcharge |
| Courbes de finance | DATA actuel + `animated-chart` | Interpolation de barres / reveal pro sans altérer la donnée | Valeurs/dates/source/unité/axes égaux à la vérité |
| Texte/captions | Remotion captions et typo | Packs text reveal après tests 360px | Voix transcrite et timecodée, pas de double titre |
| Audio | Remotion Audio + `claude-motion sound-design` | Intégrer cues WAV originaux seulement après contrôle licence et loudness | Voix intelligible, normalisation, audio non écrêté |
| Video QA | contact sheets réels et `review-loop` | Auditeur de pixels automatisé, détection de vide/freeze | Images de tous les raccords + tests navigateur + jugement visuel |
| Style documentaire | direction World-Vision + étude des références | `vox-explainer` comme vocabulaire narratif, **pas copie du média** | Sourcing, lisibilité, crédibilité, originalité |

## 6. Scorecard A/B à appliquer avant toute dépendance externe

Pour un même **brief éditorial sourcé** et les mêmes fichiers autorisés, rendre A = moteur World-Vision et B = module candidat dans une branche isolée. Toujours choisir un seul changement par A/B. Évaluer :
1. **Vérité et preuves (bloquant)** : localisation, dates, chiffres, durée et licences.
2. **Clarté mobile (bloquant)** : hook visible frame 0, taille réelle, lisibilité des noms, marges TikTok, collision lors des transitions.
3. **Réalisation (30%)** : hiérarchie, profondeur, lumière, caméra, continuité, cadence, professionnalisme sans imitation générique.
4. **Son (20%)** : timing voix/texte/sfx, ducking, intelligibilité, LUFS/true peak mesurés selon cible de diffusion.
5. **Réutilisabilité (25%)** : config explicite, tests Node/Chromium/MP4, rendu déterministe, API stable, conformité aux contrôles existants.
6. **Maintenabilité/coût/licences (25%)** : propriétaire du code, mise à jour, packages, performance, licences, frais API/Pro, droits et dépendances.

Les sous-scores ne s'appliquent **qu'après** les deux critères bloquants. Ne pas substituer étoiles GitHub, vues TikTok ou installation à des épreuves. Toute conclusion devra pointer vers **les deux vrais MP4**, captures, métriques et SHA GitHub.

## 7. Sécurité d'installation : consignes concrètes

**Aucun `curl | bash`, aucun install global et aucun `npx skills add --all` en aveugle.** Pour un skill sélectionné :
1. Identifier propriétaire, repo source et **SHA exact** ; inspecter `SKILL.md` et tous `scripts/`, `hooks/`, `package.json`, manifests, sous-modules, sous-processus et références exécutées.
2. Vérifier LICENSE, facturation/propriété des médias, politique de télémétrie, destinations réseau, lecture des secrets et droits d'écriture. Les skills HyperFrames observés mentionnent explicitement une commande de *usage beacon* ; ne pas l'exécuter sans intérêt et autorisation claire.
3. Scanner en lecture isolée avec SkillSpector (outil pertinent à tester, non exécuté par défaut), puis interpréter le résultat ; si fail ou permissions imprévues : **bloquer l'installation**.
4. Tester uniquement dans **branche/worktree sandbox** sans clés, ni compte réel, ni médias sous droits. Installer des versions explicites et garder un manifeste avec sources, SHA, licences, tests et désinstallation.
5. Fusionner seulement le composant réellement utile après test A/B, pas tout un framework HTML dans un moteur React existant.

**Point légal :** vérifier aussi la [licence Remotion](https://www.remotion.dev/docs/license/pricing) au moment où la structure média s'étend : la page officielle indique la gratuité commerciale pour les individus et petites organisations jusqu'à trois personnes, avec conditions pour les structures plus grandes. Cela ne dispense pas de vérifier la licence des photos, clips, musiques, voix ou templates.

## 8. Stratégie après cette PR, dans l'ordre le plus utile

**Étape A, immédiate** : sécuriser/documenter le film intégré sur PR #87 (Actions [#44710009215](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44710009215), 31 tests et 11 Player). Les vrais stills corrigés ont été extraits : titres non concurrents aux raccords 145/300/455. Le film demeure synthétique ; **pas de publication**.

**Étape B, premier vrai reportage test** : choisir une actualité vérifiée + visuels licites et sources datées ; établir les fiches de plans + voix sélectionnée + sous-titres et mix ; réutiliser le même pipeline GEO/PAYS/PHOTO/DATA/DOC, sans obliger cinq scènes si la narration n'en a pas besoin.

**Étape C, adoption progressive des skills** : installer officiellement les guides `remotion-markup`, `remotion-maps` et `remotion-captions` dans un environnement de code contrôlé ; appliquer d'abord les compétences de `review-loop` et les règles de temps/audio. Démontrer un avant/après à 360px sur une même composition. Ne pas exiger une installation externe pour continuer la production.

**Étape D, benchmark expérimental** : évaluer HyperFrames Registry, `animated-chart`, `vox-explainer`, `reverse-any-video` sur une copie d'essai autorisée seulement, sans upgrade payant automatique, nouvelles dépendances imposées, et sans utiliser d'images/vidéos protégées comme actifs World-Vision.

**Étape E, production internationale** : profils pays/langues, chaîne source→droits→script→voix→vidéo→publication, pack audio et accessible, signatures visuelles contrôlées, revue TikTok réelle iPhone/Android, SLA de veille, flux GDELT vérifié **séparé du moteur de rendu**. Le projet BAOCOM et le Content OS restent indépendants tant qu'un contrat d'intégration n'est pas explicitement défini.

## 9. Passation sans perte de fil

Au prochain chat : ouvrir `CONTINUITE_WORLD_VISION.md`, la PR #87 et **cette branche**, comparer HEAD de l'une et l'autre ; lire le rapport Sprint12, cette évaluation de skills, puis `.agents/skills/worldvision-media-director/SKILL.md`. Ne pas retester une idée déjà validée sous prétexte qu'un influenceur la présente comme une nouveauté. **But immédiat : vrai reportage sous droits, voix/captions et son, pas recréer un autre studio.**
