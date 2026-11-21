# World-Vision MEDIA — COP31 négociations / étape 2A : PHOTOS AUTHENTIQUES ET QA DE COMPOSITION

**21 novembre 2026 ; résultat RÉEL OBSERVÉ. Statut : REPÉRAGE ET ÉPREUVE VISUELLE RÉUSSIS, MAIS PAS MÉDIAS DU MASTER.** PR #142, branche `feature/worldvision-media-cop31-primary-evidence-director-lock-2026-11-21`. Ancienne NASA PR #141 FERMÉE. Ne pas confondre avec COP31 du 12/11 (rejetée 1/10).

## Réalisation concrète — ce qui est devenu reproductible

- Registre strict `worldhealth-vision-v2/media-pilots/cop31-negotiations/reference-assets.json`. Chaque URL est une VRAIE URL officielle ouverte et vue, non reconstruite au hasard.
- Script `worldhealth-vision-v2/media-pilots/cop31-negotiations/build-reference-boards.py` : téléchargement par URLs exactes et domaines autorisés, validation des octets PDF/JPEG, dimensions, SHA256, chargement des deux textes originaux CCNUCC, extraction PIXELS réels du document 16/11 p.8, composition **deux cadres 1080×1920** et contact sheet à **390×693**. Des explications du média sont des calques séparés et identifiés; **jamais un faux extrait officiel du projet**. Zéro IA génératrice de portraits, pas de voix, pas de mise en ligne.
- Workflow `.github/workflows/worldvision-media-cop31-authentic-reference-boards.yml`. **1er rendu** [#44954020678](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44954020678) **SUCCESS** : 2 vrais cadres + 390px téléchargés depuis GitHub et inspectés. Le texte d'origine était trop petit pour un visionnage sans pause.
- **Correction sur le même code** `46dba606da61927da9c5951061c9b62b9e1eaea6` : calque éditorial français « sortie des énergies fossiles » indépendant du PDF non modifié; information principale beaucoup plus lisible à 390px. Deuxième cadre en 2 couches de photos **vraies** : délégations dont Wopke Hoekstra et salle de négociation, dates non faussement attribuées.
- **Dernier vrai rendu** [#44954190598](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44954190598) **SUCCESS**, artifact **14727236027**, nom `worldvision-media-cop31-primary-evidence-static-review-NOT-PUBLIC`, expire le **24 novembre 2026 à 21:57:41 UTC**. L'artefact a été téléchargé puis **le vrai contact sheet ouvert visuellement**. Version du film final ? **NON**. Artifacts temporaires; le workflow/code restent dans GitHub.

## Inventaire réel des JPEG officiellement identifiés et octets SHA256 contrôlés

| Rôle | Identifiant exact de la photo UE | Lien média en contexte | Octets + dimensions de l'aperçu vérifié | SHA256 |
|---|---|---|---|---|
| Salle de négociations — contexte réel | `P-070944_00-163_03-MED-275144.jpg` | https://ec.europa.eu/avservices/repository/photo/07/09/44/P-070944_00-163_03-MED-275144.jpg | 155 188 octets · **800×533** | `24f65314e3cfef4f14efc6ef981c1ec14d8e048ae5a68ef0b3a21d6881e0e7da` |
| Délégations / Wopke Hoekstra en réunion | `P-070944_00-162_03-MED-376154.jpg` | https://ec.europa.eu/avservices/repository/photo/07/09/44/P-070944_00-162_03-MED-376154.jpg | 157 670 octets · **800×533** | `c8beff2dd537ae5ae363f1049af24ab889044f9926ccfa689e22f09364f053a5` |
| Signalétique authentique COP31 Antalya (repérage) | `P-071004_00-16_03-MED-36834.jpg` | https://ec.europa.eu/avservices/repository/photo/07/10/04/P-071004_00-16_03-MED-36834.jpg | 140 449 octets · **799×533** | `7e0bb18d2b41775b6c759b4b65e14d37f64aa0cf80b50b4cb98315b1ebbf70c6` |

Les collections officielles sont https://audiovisual.ec.europa.eu/en/media/photo/P-070944 (**date de collection 16/11–22/11**) et https://audiovisual.ec.europa.eu/en/media/photo/P-071004 (**14/11**). La date EXACTE de prise de vue n'a PAS été individualisée dans les notices consultables : **ne jamais titrer ces photos « prises samedi 21 »**.

**Important — pas de fausse assurance juridique :** la règle du Service audiovisuel EU prévoit **CC BY 4.0 pour les contenus que l'UE possède sauf exceptions et conditions propres à chaque fichier**, crédits/modifications et absence de déformation. Exceptions personnalité, vie privée, marques, tiers. https://audiovisual.ec.europa.eu/en/conditions-of-use . Les trois JPEG sont des **aperçus MED** de repérage. **Source originale haute résolution MANQUANTE**; crédit photographe individuel/manifeste de droits spécifique **EN ATTENTE**. **INTERDICTION de les présenter comme assets master validés**.

## Empreintes officielles des deux PDF originaux réellement téléchargés par le workflow

- **C16**, https://unfccc.int/sites/default/files/resource/dt_cop31_cover_decision.pdf ; 303311 octets, 18 pages, SHA256 `d09a11e0ae6f61c9e332d6c7d160f6f11c43a6f37fdabb6917f92c9593fe9b2f`.
- **C19**, https://unfccc.int/sites/default/files/resource/Upload_dt_cop31_cover_decision.pdf ; 241889 octets, 9 pages, SHA256 `3d1de9327bfde5d94e4c32a78f04c5690169343b6e0ea091af8e719a59ca6201`.
- Ces deux documents sont des **PROJETS**, pas un accord final signé. Voir étape 1A : C16 mentionne fossiles ; C19 ne reprend pas cette formulation ; le chiffre 120 Md pour adaptation a été ôté **mais** un AUTRE chiffre de 120 Md pour banques multilatérales reste au §54 du second document.

## Frames de la DERNIÈRE version ouverte et examinée à 390px

| Fichier (artifact) | SHA256 réellement contrôlé |
|---|---|
| `direction-a-hook-1080x1920.png` | `802b48f0d128629edc2bfb8c15a0afe3f6ad95cfb57c961f0affbe3ac84b510b` |
| `direction-b-negotiation-1080x1920.png` | `43adeae83173b93f7c2e859af4ba3803c89ff33a72fd43060ab4cd6eeb0cade6` |
| `contact-sheet-390px.png` | `c84d4cc082d004ba3e2d6526102fb203ceeae8f8a847f02231ed3cbffd881508` |

**Décision artistique réelle :** l'ouverture Direction A a progressé : hook et paraphrase sont lus d'un regard au format 390px, mais le **PDF d'origine reste trop fin pour une lecture intégrale**. En film, effectuer un plan PREUVE distinct avec zoom sur une phrase réelle, pas une miniature fixe supposément « lisible ». Direction B fonctionne mieux comme re-hook humain, avec deux photos réellement contextualisées, MAIS les deux aperçus de faible définition et le mélange des époques exigent revue de provenance complète. Le nombre de couches ne prouve pas à lui seul l'impact artistique. Typographie actuelle des maquettes = **DejaVu Sans pour le test** : remplacer par DM Sans dans le rendu Remotion, ne pas présenter le dummy comme identité définitive. Aucun logo inventé.

**Fichier temporaire livré dans le chat actuel :** `/mnt/data/cop31-review/action-v2/contact-sheet-390px.png`. C'est un chemin **éphémère propre à CE chat**, pas un lien GitHub permanent. La CI et les SHA permettent de régénérer les vrais pixels.

## Verrous restants et prochaine bonne étape

1. **Récupérer les ORIGINAUX HAUTE DÉFINITION** des deux plans EU retenus (pas un upscaling artificiel) et la fiche de droits individuelle, date de prise de vue, photographe et exclusions tiers; ces fichiers n'ont PAS été obtenus ici. Si impossible, choisir autre source réellement licenciable.
2. Revalider statut du **21/11 soirée / 22/11** avant de verrouiller le script : de nouvelles dépêches peuvent changer « prolongation » en « accord signé » ou « absence d'accord ». Les cadres présents ne certifient pas une situation perpétuelle.
3. Verrouiller le script et obtenir **UNE NOUVELLE voix Vivienne C5.2 Impact média +8% prononçant CE script**, sous droits. Pas de substitution Kokoro et pas de recyclage de l'échantillon Mississippi.
4. Reprendre la grammaire existante Remotion PHOTO/DOCUMENT/typographie + SFX pour UN vrai film complet, alignement sur narration réelle, audit iPhone 390px + écoute, corrections de segments et validation responsable. Ni usine NASA ni « vidéo produite » avant le master.
5. Respecter le projet international et les millions de spectateurs par un pipeline de production et une distribution évolutifs (voir **ADR_MEDIA_SCALE_READINESS_2026-11-21.md**), SANS réécrire prématurément les langages existants.

**Aucune fusion, publication, déploiement, achat, connexion de fournisseur ou modification d'un autre projet n'a eu lieu.**
