# World-Vision — registre canonique des décisions humaines

**Date d'ouverture : 13 novembre 2026.** Les décisions notées ici ont préséance sur les anciennes hypothèses des discussions, jamais sur les lois ou règles des plateformes.

## Décisions validées et preuves

| ID | Date | Domaine | Décision | État | Preuve |
|---|---|---|---|---|---|
| D-001 | 2026-11-12 | Architecture | Conserver la plateforme V2 en `v2`, Media Studio dans `feature/world-vision-media-studio`, PR #5 draft, pas de fusion automatique | ACTIVE | [PR #5](https://github.com/OBIANG5/World-Health-Vision/pull/5) |
| D-002 | 2026-11-12 | Diffusion | Publication TikTok/WhatsApp uniquement avec autorisations, manifestes et vrais reçus ; aucun faux statut `published` | ACTIVE | `docs/media/PUBLISHING_CONNECTORS.md` |
| D-003 | 2026-11-13 | Vidéo COP31 | **REFUS 1/10 SUR 15 CRITÈRES**, tous bloquants ; conserver les fichiers pour audit, ne pas diffuser ni prendre le montage comme modèle de qualité | ACTIVE | [Issue #9](https://github.com/OBIANG5/World-Health-Vision/issues/9) ; `docs/media/reviews/2026-11-13-cop31-video-5e62e2f0.json` |
| D-004 | 2026-11-13 | Processus créatif | Chaque composant est soumis séparément à l'humain, notation facultative 1–10 par critère et décision explicite ; pas de rendu intégral en bloc | ACTIVE | [Issue #8](https://github.com/OBIANG5/World-Health-Vision/issues/8), `docs/media/QUALITY_GATE_EDITORIAL_2026-11-13.md` |
| D-005 | 2026-11-13 | Logo officiel | **Le vrai logo bleu œil + globe existant est l'identité officielle actuelle**, sans note chiffrée ; conserver les pixels de l'original | VALIDÉ | `docs/media/approvals/2026-11-13-current-official-logo.json` |
| D-006 | 2026-11-13 | Logo futur | Continent vert et autres couleurs de la planète/multicolore envisagés **plus tard**, ne bloquent pas la production | REPORTÉ | même décision utilisateur que D-005 |
| D-007 | 2026-11-13 | Direction artistique | Les premières propositions A/B/C ont été explicitement jugées **« moches » et rejetées** par le propriétaire ; aucune note chiffrée individuelle | **REFUSÉ** | `docs/media/art-direction/WORLD_VISION_GLOBE_SIGNATURE_DIRECTIVE_2026-11-13.md` |
| D-008 | 2026-11-13 | Voix | Rejeter l'ancienne voix Piper comme référence professionnelle ; demander plus tard plusieurs auditions de voix naturelles avant montage | ACTIVE | Issue #9 et rapport QA |
| D-009 | 2026-11-13 | Persistances d'avis | Les avis humains liés à un SHA doivent être conservés ; le site statique ne peut ouvrir qu'un formulaire GitHub prérempli, pas écrire secrètement dans le dépôt | ACTIVE | `docs/media/REVIEW_AND_APPROVAL_WORKFLOW.md`, Issue #9 |
| D-010 | 2026-11-13 | Hébergement du preview | **Même lien permanent**, et les nouvelles étapes doivent être visibles depuis l'accueil avec identifiant de release. Reconnaître le cache RawGitHack | EN COURS | workflow `whv-media-studio-mobile-preview.yml`, `preview-deployment.json` |
| D-011 | 2026-11-13 | Continuité | Documenter décisions, preuves, code, branches, problèmes et point de reprise GitHub afin de survivre à un chat bloqué | ACTIVE | `docs/continuity/` et `CONTINUITE_WORLD_VISION.md` |
| D-012 | 2026-11-13 | Transparence média | Images historiques identifiées comme telles ; sources, droits, crédit, dates conservés ; ne jamais présenter illustration IA comme enregistrement d'un fait réel | ACTIVE | `docs/media/art-direction/cop31-opening-directions-v1.json` et manifeste photo |

## Nouvelle preuve audiovisuelle reçue (sans validation créative)

| ID | Date | Domaine | Observation et conséquence | État | Preuve |
|---|---|---|---|---|---|
| D-013 | 2026-11-13 | Référence tierce | Une vidéo TikTok géographique de 64,9 s a été effectivement reçue et analysée ; sa signature de déplacement « globe → pays → information » motive l'exploration d'une direction **D** distincte des 3 maquettes existantes | **RÉFÉRENCE ENREGISTRÉE, D NON VALIDÉE** | `docs/media/references/2026-11-13-focus-geopolitique-video-reference.md` ; SHA-256 `4e4e979144b59ee9359287c75773cfbbb5cefbd12d05f71ec9ba3bd66f3328bb` |

**Contrainte explicite :** cette ligne **ne signifie pas** que l'utilisateur a approuvé un design, une animation ou un nouveau reportage. La vidéo source n'est pas un asset libre de droits et n'a pas été dupliquée dans GitHub.

---

## Clarifications prioritaires du 13 novembre 2026

| ID | Date | Domaine | Décision / instruction | État | Preuve |
|---|---|---|---|---|---|
| D-014 | 2026-11-13 | Maquettes A/B/C | Ces premières propositions ont été rejetées esthétiquement ; ne plus demander de les choisir. Aucune note numérique inventée. | **REFUSÉ** | `docs/media/art-direction/WORLD_VISION_GLOBE_SIGNATURE_DIRECTIVE_2026-11-13.md` |
| D-015 | 2026-11-13 | Signature géographique | Explorer « Terre → pays → vraies images/vidéos → information → transition », avec approbation plan par plan. Nouveaux designs NON validés à ce jour. | **PROPOSITION PRIORITAIRE** | même directive et `frontend/web-v2/src/media/GlobeDirection.tsx` |
| D-016 | 2026-11-13 | Formation | Formation `monter-et-animer-vos-videos-avec-claude-v2.pdf` retrouvée, 137 pages. Adapter la méthode à ChatGPT, Remotion et outils accessibles, sans dépendance obligatoire à Claude. | **SOURCE MÉTHODOLOGIQUE** | `docs/media/TRAINING_137_PAGES_IMPLEMENTATION_AUDIT_2026-11-13.md` |
| D-017 | 2026-11-13 | Chat disparu | Le prompt original sous les deux vidéos n'a pas pu être retrouvé mot pour mot ; conserver la reformulation explicite actuelle du propriétaire. | **CONTEXTE RÉTABLI, PROMPT EXACT NON RETROUVÉ** | directive d'identité géographique |

---

## Ce qui n'a pas été approuvé

- La qualité visuelle/sonore de la vidéo COP31 initiale : **REFUS 1/10**.
- Le design typographique et le placement exact des nouvelles maquettes (seul le logo actuel est approuvé).
- Les trois versions A/B/C de l'ouverture (**propositions**, pas validations).
- Une voix Google/Gemini, OpenAI ou autre pour la version finale (pas d'audition approuvée).
- Une animation 3–6 secondes ou le montage d'une nouvelle vidéo complète.
- Un déclenchement automatique d'une création après une note.
- L'exploitation 24/7 du newsroom ou des publishers.
- L'autorisation de poster sur TikTok ou WhatsApp Channels.
- L'usage d'un compte Google AI personnel par API sans credentials/consentement et contrôle des coûts.

## Protocole pour toute décision future

Ajouter une entrée datée, avec :
1. l'identifiant de l'étape (G0/G1/etc.) et l'ID exact du livrable ou son hash ;
2. **l'acte explicite** du propriétaire (valide, refuse, à corriger, ou décision sans note) ;
3. la note 1–10 quand elle existe réellement, et **aucune note inventée** ;
4. les critères bloquants et priorités avec mots fidèles ;
5. les liens GitHub (Issue, fichier JSON, commit, capture, vidéo) ;
6. les conséquences sur ce qui est désormais autorisé ou interdit ;
7. les nouveaux tests et le plan de correction.

Ne jamais déduire une approbation de « continue », d'un build vert, d'une absence de réaction ou d'une bonne note isolée.

## Révision de décision

Une décision antérieure peut être supplantée par une décision plus récente explicite : exemple, l'idée d'un logo multicolore dans les premiers échanges a été suivie de **la confirmation explicite du logo bleu comme logo actuel**. Conserver les anciennes versions dans l'historique Git, mais faire figurer **la décision en vigueur** dans cet index.


---

## Corrections créatives récentes — D00 œil / globe (13 novembre 2026)

**Ces retours sont des exigences de correction ; ils ne constituent pas une validation de la maquette D00 ni du futur MP4.** Source primaire : messages explicites de l'utilisateur dans le nouveau chat. Référence versionnée : [D00_EYE_GLOBE_VISUAL_ITERATIONS_2026-11-13.md](../media/art-direction/D00_EYE_GLOBE_VISUAL_ITERATIONS_2026-11-13.md).

| ID | Statut | Retour/décision | Conséquence |
|---|---|---|---|
| D-018 | EXIGENCE ACTIVE | Le globe photographique est apprécié pour sa beauté, sa matière et son halo atmosphérique ; il doit rester l'élément principal et occuper plus d'écran. | D00 doit placer la Terre au centre et très grande ; pas d'œil dominant. |
| D-019 | EXIGENCE ACTIVE | L'œil des deux premières illustrations était incorrect, presque circulaire, avec des traits superflus. S'inspirer des deux arcs du vrai logo. | Exactement deux courbes de paupière, pas d'anneau/ellipse fermée ; arcs élargis hors cadre, aucune extrémité visible. |
| D-020 | EXIGENCE ACTIVE | Ne pas afficher lumières de villes/pays, ni soleil d'appoint, ni nuages décoratifs en bas. Montrer nettement les frontières de chaque pays visible. | Nécessité d'un overlay géographique fidèle en 3D ; pas de lumière nocturne ni décor solaire/cloud floor. |
| D-021 | EXIGENCE ACTIVE | Étoiles très peu nombreuses, petites et discrètes ; halo atmosphérique bleu/cyan lumineux conservé, distinct des deux arcs. | Espace sobre ; privilégier le globe et la couche atmosphérique. |
| D-022 | NON VALIDÉ | Quatrième concept image D00-v4 produit ; sa valeur esthétique reste soumise au jugement du propriétaire ; animation vidéo future prévue par code. | Ne pas marquer D00 validé ni passer à une production vidéo complète. |

Le rendu D00-v4 a été **généré en conversation seulement**, dimensions 1086 × 1448, empreinte SHA-256 `5f97e5f0d29551e187b50106e0aaf2f00e700062a9a2f5845dbf9f9715b6a90e`. Son **PNG n'a pas été importé sur GitHub** ; seuls les instructions, métadonnées, limites et choix de conception sont versionnés. Les images synthétiques ne constituent pas une preuve géographique : les futures frontières devront être calculées par données réelles. Contrat technique : `../media/art-direction/d00-eye-globe-visual-contract-v4.json`.


---

## 13 novembre 2026 — v5 appréciée, correction v6 et futur reportage (NOUVELLES DÉCISIONS)

| ID | Domaine | Retour utilisateur vérifié | État |
|---|---|---|---|
| **D-023** | D00-v5 / esthétique | L'utilisateur trouve le nouveau globe-œil **« très beau »**, mais demande que le blanc de l'œil soit **vraiment blanc**, pas seulement bleu-gris. | **APPRÉCIATION POSITIVE AVEC CORRECTIONS**, pas validation finale |
| **D-024** | D00 / atmosphère | La **lueur bleue de l'atmosphère terrestre** doit être plus claire et perceptuellement plus visible que les deux arcs de l'œil ; contours de pays plus marqués, surtout Sahara ; globe de taille déjà bonne. | **EXIGENCE ACTIVE** |
| **D-025** | Futur moteur vidéo | Après acceptation artistique, programmer un globe 3D qui tourne vers le **pays réel de chaque actualité** ; ne pas confondre les images de référence D00-v5/v6 avec une vidéo existante. | **OBJECTIF FUTUR, NON IMPLÉMENTÉ** |
| **D-026** | Branding & voix/montage | Envisager le **logo officiel discret en haut à gauche ou une autre zone sûre** des vidéos futures ; conserver intégralement les jalons voix, montage, sous-titres, QA et méthode du PDF de 137 pages. | **PLACEMENT NON VALIDÉ ; PARCOURS CONSERVÉ** |

**Artefact de revue en cours :** D00-v6, PNG de conversation `a_crisp_ultra_detailed_high_contrast_digital_ill.png`, SHA-256 des vrais octets `8d9a9d20f20fbf7757713b6f5eab06590f191166eb779865747f0f59683cfca2`, 1086×1448. **En attente de l'avis du propriétaire ; aucune vidéo ni photo-real globe programmable approuvée.**

Documents autoritaires actualisés : [plan directeur audiovisuel](../media/AUDIOVISUAL_PRODUCTION_MASTER_PLAN_2026-11-13.md), [historique D00](../media/art-direction/D00_EYE_GLOBE_VISUAL_ITERATIONS_2026-11-13.md) et [contrat technique D00-v6](../media/art-direction/d00-eye-globe-visual-contract-v6.json). Ne pas associer les anciennes mentions « v4 courante » à l'état actif : v6 remplace v4 comme **candidat** sans remplacer le statut « non approuvé ».


---

## D-027 — moteur de rotation pays par pays (13 novembre 2026)

**Statut : décision de conception et implémentation technique vérifiée, PAS validation artistique ni publication.** Sur instruction de continuer avec l'étape la plus utile, un **moteur géociblé** a été ajouté au code, sans attendre de reconstituer à l'aveugle un reportage complet. D'abord démontrer : présence du pays (`country_iso3`), calcul de sa destination depuis GeoJSON, trajet SLERP, rotation contrôlée, frontières géographiques et test mobile.

**Preuves de fonctionnement :** [workflow mobile #43461296086 réussi](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43461296086), version source `f0b281889676a20fbefba62fd45cf1fd5c2856ed`, capture réelle [Gabon 100 %](https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-globe-motion-arrival-gabon-iphone.png). Tests Node + Playwright mobile : Gabon, Mali, dateline, invalidités, captures.

**Nouveaux fichiers référents :** `frontend/web-v2/src/media/geoTargeting.mjs`, `geoTargeting.d.mts`, `geoTargeting.test.mjs`, `GeoTargetingLab.tsx`, `GeoTargetingLab.css` ; modifications `GeoGlobe.tsx`, `GlobeDirection.tsx`, `CreativeDirections.tsx`, `ReviewStudio.tsx` et workflows. [ADR détaillée](../media/engineering/GEO_TARGETING_PROTOTYPE_2026-11-13.md).

**Garde-fou :** cette démonstration est visuellement une **carte Canvas 2.5D**, pas le globe réaliste D00-v6, pas une vidéo, pas une voix approuvée. D00 reste non validé ; l'image concept D00-v6 ne figure pas dans GitHub au format PNG. Aucune diffusion sur réseau social. Ne plus repartir de zéro sur les mathématiques : les réutiliser pour la prochaine scène 3D après validation humaine.


---

## 13 novembre 2026 — séparation impérative image artistique et prototype de rotation

**Réaction explicite du propriétaire :** l'apparence schématique publiée dans le simulateur (carte vert pâle, océan uniforme, halo simple) ne ressemble pas à l'image qu'il a appréciée. **Ce n'est pas une nouvelle direction artistique approuvée.** Le prototype peut uniquement servir de mécanisme de ciblage géographique. **Ne jamais le substituer** au globe cinématographique de l'œil World-Vision.

**Référence conservée :** `D00-v6`, `a_crisp_ultra_detailed_high_contrast_digital_ill.png`, dimensions `1086×1448`, SHA-256 `8d9a9d20f20fbf7757713b6f5eab06590f191166eb779865747f0f59683cfca2`. Les octets ont été vérifiés dans le conteneur de conversation ; **le PNG original n'est pas encore versionné dans GitHub**, contrairement à ses spécifications et à son empreinte. Il reste une référence de conception soumise à validation humaine.

**Non négociable pour l'apparence finale :** globe très grand, textures continentales et océaniques réalistes, Sahara détaillé et pays nettement délimités par géodonnées exactes, blanc d'œil #FFFFFF, exactement deux arcs inspirés du vrai logo, extrémités hors caméra, halo atmosphérique cyan plus fort que les arcs, nuages légers et étoiles rares. **Ne pas convertir ce cahier des charges en simple carte vectorielle plate.**

**Code de protection :** `GlobeDirection.tsx` comporte un bloc `data-art-direction-ref="D00-v6"` expliquant le statut du visuel. Le laboratoire Canvas `GeoTargetingLab` est dorénavant **caché dans une section technique refermée par défaut**, volontairement distincte des maquettes et de la référence artistique. Le test navigateur doit vérifier explicitement cette séparation. Aucune autorisation de produire une vidéo finale ou de considérer G1 validé.
