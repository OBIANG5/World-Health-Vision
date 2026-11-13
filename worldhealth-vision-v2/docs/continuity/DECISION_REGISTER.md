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
