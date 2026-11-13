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
| D-007 | 2026-11-13 | Direction artistique | Trois directions fixes A documentaire, B chiffres, C pédagogie à comparer ; **aucune sélection ni validation** à ce jour | EN ATTENTE | `docs/media/art-direction/cop31-opening-directions-v1.json` |
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
