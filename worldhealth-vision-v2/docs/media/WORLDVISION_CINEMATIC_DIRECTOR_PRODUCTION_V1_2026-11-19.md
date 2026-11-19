# WORLD-VISION — Directeur audiovisuel : production par plans, sans compromis

**Décision du propriétaire : 19 novembre 2026.**
**Statut : méthode décidée + premier contrôle logiciel implémenté ; aucune nouvelle vidéo ni charte motion approuvée par cette livraison.**

## 0. Périmètre exact — ne pas dévier

- **BAOCOM est un projet distinct.** Ne pas le mettre sur GitHub, ne pas copier/synchroniser le code BAOCOM, ne pas appeler son API, ne pas fusionner ses modèles de données. S'inspirer seulement de ses bonnes idées : interface montrant le processus, scripts/étapes inspectables, modèles d'animation conçus avec soin, modification locale non destructive.
- **World-Vision : priorité exclusive à la qualité audiovisuelle pour le moment.** Le blog, le Content OS étendu, la distribution automatique et leur raccordement à GDELT attendent le chantier logiciel et l'intégration effective de GDELT ; ne pas dériver ce sprint.
- **ChatGPT reste le copilote créatif et éditorial.** Il aide à chercher/contradicter les sources, choisir l'information, écrire, découper, documenter, comparer et proposer des corrections. Le code sert à préparer les éléments, préserver les décisions, faire les calculs reproductibles, animer, synchroniser, assembler, contrôler. Ne pas imposer un service LLM externe ou une autre IA dans le backend.
- **Conserver le Media Studio existant**, sa branche `feature/world-vision-media-studio` et PR #5 (draft) ; aucun merge sur `v2`, aucune refonte de l'UI principale maintenant.
- **Aucune autorisation tacite** de voix, d'images, de coût API, de rendu long ou de publication.

## 1. Pourquoi les essais sont insuffisants

La technique de montage fonctionne partiellement ; cela ne fait pas de nous un média cinématographique. Les retours humains enregistrés priment sur les compteurs de réussite des CI :

- COP31 première composition : rejet 1/10. Faux globe graphique, titrage omniprésent, impression de diapositive.
- Soudan du Sud publié manuellement : environ 4–5/10. Vivienne trop rapide et mécanique, imagerie insuffisamment pertinente et prenante.
- Guinée Siguiri : environ 6/10. De nombreux plans ont été remplacés mais l'émotion/variation visuelle restent insuffisantes ; rééquilibrage audio nécessaire.
- WV002 et autres tests : fautes de durée, bandes techniques dans l'image, archives honnêtes mais non liées à l'événement lui-même, audio parfois régénéré ou mal segmenté. Les versions doivent rester traçables et ne pas être promues automatiquement.

**Causes transversales :** conception de chaque plan insuffisante, absence de maquettes examinées à la taille mobile avant animation, bruit graphique, recours à des images trop génériques, montage imposé par un minutage au lieu de la narration, TTS découpé ou accéléré, QA fondée sur des checks techniques et non sur les pixels/le son réellement ressentis.

**Ne pas confondre :** une vidéo légale, factuellement vérifiée et exportable peut être esthétiquement médiocre. La qualité documentaire est indispensable mais non suffisante.

## 2. Référentiel de direction artistique — à tester, pas encore validé

### 2.1 D'abord regarder et comprendre

Une scène doit transmettre quelque chose que le plan précédent ne transmettait pas : preuve, geste humain, lieu, conséquence, temporalité, proportion, comparaison, contradiction. Aucun plan « pour remplir ».

- Cadre portrait natif **1080×1920 à 30 ips**. Composer une image de cinéma documentaire, pas une diapositive PowerPoint.
- Construire la hiérarchie avec 1 message visuel dominant, puis éventuellement une ligne secondaire. Aucune plaque permanemment chargée de « World-Vision », numéro de plan, barre développeur ou badge technique.
- Contraster **la lumière et l'image de fond** plutôt que multiplier rectangles opaques, filets, pseudo-HUD et effet néon.
- Les transitions servent un changement d'idée, de lieu, de preuve ou de temporalité ; aucune transition par habitude.
- L'émotion provient de faits vrais, gestes, rapports d'échelle et respiration du récit ; pas de pathos trompeur, faux bruit de panique ni visage fabriqué.
- Les crédits/droits/archives et explications de provenance vivent dans le manifeste/publication selon leur forme adaptée ; ne pas faire passer des archives pour des prises du jour.
- Les animations ne doivent ni simuler un événement filmé, ni projeter de frontières non vérifiées, ni faire évoluer de chiffres sans raison factuelle.

### 2.2 Huit familles possibles de motion design, chacune à prototyper sur une vraie maquette

| Famille | Usage légitime | Réalisation proposée | Signal d'échec |
|---|---|---|---|
| **Documentary Cold Open** | Ouvrir sur une action/révélation réellement pertinente | Plan réel au premier cadre, apparition contrôlée de 4–8 mots si utile | Image hors sujet, gros bandeau qui cache l'action |
| **Geographic Reveal** | Comprendre un pays/lieu décisif | Terre NASA/Natural Earth et animation 3D/coordonnées géographiques exactes ; entrée brève uniquement si utile | Globe schématique, retard artificiel de l'information |
| **Evidence Focus** | Isoler la preuve dans un document officiel | Masquage, recadrage, zoom doux vers le passage réellement sourcé | Fausse une de journal, fausse citation, typographie gadget |
| **Editorial Kinetic Type** | Renforcer une affirmation importante | Animation soignée de typographie réelle, rythmes, lecture évidente | Mots qui bondissent sans lien avec la voix, surcharge |
| **Data in Context** | Donner le sens d'un chiffre vérifié | Graphique avec unités, dénominateurs, date et source disponibles dans le dossier | Chiffres impressionnants mais trompeurs ou sans échelle |
| **Timeline / Causality** | Expliquer une chronologie sans présumer de causalité | Séquence sobre d'événements datés ; marqueurs animés | Causalité inventée, design administratif illisible |
| **Human Consequences** | Faire comprendre les effets humains | Vidéo authentique, respiration, minimalisme typographique | Gens génériques jouant le rôle des victimes |
| **Signature G0** | Clôturer le média | Clip ORIGINAL verrouillé, version choisie, silencieux | Logo refait, rectangle blanc, voix lisant la signature |

**Méthode d'amélioration de ces familles** : pour chaque famille, construire une planche fixe 9:16, un micro-clip de 3–6 s, une revue mobile et éventuellement une contre-proposition A/B ; ne jamais produire quinze templates médiocres pour remplir une galerie. Le choix esthétique reste humain.

### 2.3 Conditions de rythme

- Hook factuel dès les premières secondes : il faut identifier le vrai sujet sans attendre un générique ; utiliser le globe dans 0–3 s **si** il ajoute une information et garde la voix audible.
- Les micro-transitions sont limitées à l'effet nécessaire ; exiger un point d'ancrage perceptuel (regard, direction de mouvement, contraste, continuité de sens).
- Ni plan décoratif sans signification, ni simple photo figée à zoom automatique appelée « motion design ».
- Les rythmes ne sont pas un nombre d'images uniforme. Décider les coupes après écoute de la voix continue et selon les mots/gestes importants.
- Une séquence « révélation » doit être liée à une vraie source ; sa dramatisation ne peut pas amplifier une certitude non acquise.

## 3. Onze portes de production — livrable visible à chaque étape

| Porte | Travail principal ChatGPT + humain | Travail code / outils | Livrable que l'on inspecte |
|---|---|---|---|
| **01 research** | Choisir l'actualité, vérifier chaque proposition, dater, détecter contradictions | Conserver les URL et ID d'affirmations | Evidence ledger |
| **02 script** | Rédiger accroche, progression, re-hook, chute ; valider mot à mot | SHA-256, version immuable | Script validé + dictionnaire des noms |
| **03 treatment** | Préciser émotion, informations, références de mouvement, principes de composition | Structurer le brief scène par scène | Note de réalisation |
| **04 voice** | Deux prises COMPLETES de **Vivienne** sur le MÊME script, écouter et comparer | Conserver fichiers/hash, alignement mots, mesure durée, détecter silences | Master de narration continu validé |
| **05 casting** | Rechercher vraiment les rushes, textes de preuve, archives et médias autorisés ; expliquer leur rôle | Ledger provenance/date/lieu/licence/SHA, rejet des incompatibles | Casting visuel de 4–7 plans pour 30s (adaptatif) |
| **06 layouts** | Examiner une composition **fixe** par plan sur iPhone | Rendu de chaque frame et collision/safe-zone | Planches 9:16 validées |
| **07 motion** | Chorégraphie : trajectoire, accélération, lumière, raccords | Prototype Remotion déterministe de 3–6s, frames et hash | **Micro-clips** à valider un par un |
| **08 edit** | Fixer coupes sur la prise vocale approuvée ; protéger le reste | EDL en frames, raccords, compositing, cache des plans gelés | Rough cut et diff des scènes |
| **09 sound** | Vérifier présence, musicalité, diction, mix sur smartphone | Niveau LUFS/true peak, normalisation, sous-titres à partir de la vraie piste | Master audio + écoute réelle |
| **10 qa** | Contrôle contradictoire image/voix/faits, écoute ET visualisation complètes | Détecter clipping, format, lip-sync approximatif, artefacts, sous-titres, debug text, hashes | Rapport par plan et MP4 exact |
| **11 delivery** | Autoriser explicitement un export/licence/publication, si applicable | Master 1080×1920 H.264/AAC, crédits, manifest, SHA, version téléphone | Fichier final et dossier de diffusion |

L'ordre de production peut comporter **du travail parallèle entre voix et casting**, mais aucune porte d'approbation dépendante ne peut être considérée franchie sur une simple supposition.

### 3.1 Mesure et révision non destructives

Chaque plan a un identifiant stable, une version et une empreinte :
`SH01`, `SH02`, etc. Les éléments acceptés ne changent pas après une correction localisée : l'IA prépare un **diff**, l'utilisateur approuve, puis seul le plan modifié est recalculé. Une variation de voix nécessite une nouvelle piste d'audition, jamais la copie de la référence C5.2 Nouvelle-Orléans dans une autre actualité.

### 3.2 La voix est un pilier, pas un accessoire

- Timbre retenu : `fr-FR-VivienneMultilingualNeural`.
- Référence de direction : C5.2 Impact Media, **référence de style seulement**. Son enregistrement parle d'une autre nouvelle ; ne jamais le réutiliser.
- Deux prises de narration **intégrales**, débit non forcé, pauses calées sur le sens, bonne diction des noms propres et chiffres ; pas de synthèse phrase par phrase à assembler.
- Le réglage +8% n'est **pas approuvé comme consigne universelle** ; +6% était une proposition, non un choix. Aucun preset n'est validé sans audition de la **prise complète**.
- La même piste doit survivre à toutes les corrections visuelles. Les coupes s'adaptent à l'audio, pas l'inverse.
- Mesurer LUFS/true peak, dynamique et écoute iPhone. La cible de preflight [-16,-11] LUFS est une enveloppe de contrôle large, **pas** une certification d'écoute ni une norme universelle ; viser une présence intelligible sans saturation, toujours comparer à une référence écoutée à même niveau.
- `edge-tts` historique n'est pas une preuve de droits de diffusion commerciale. Vérifier contrat du fournisseur vocal ou préférer une voix humaine autorisée si l'expressivité n'est pas assez bonne.

## 4. Premier livrable logiciel réalisé dans CET incrément

**Branche (basée sur la branche Media Studio, aucun merge)** : `feature/worldvision-cinematic-director-gates-2026-11-19`.

**Fichiers :**
- `services/media-renderer/cinematic/director_gate.py` : préflight JSON stdlib Python, défini par une suite de portes exigeant preuve/empreinte/validation ; vérité visuelle, audio continu, droits, types d'images, timecodes et revue mobile.
- `services/media-renderer/cinematic/test_director_gate.py` : tests de régression contre dérive du script, substitution Vivienne, fausses images d'événement, droits manquants, répétition de footage, trous de timeline, voix étirée, mix, approbation manquante.
- `services/media-renderer/cinematic/episode.template.json` : modèle **intentionnellement non validé**. Aucune actualité réelle n'y est inventée.
- `.github/workflows/worldvision-cinematic-director-gates.yml` : lint de compilation Python + tests indépendants des API commerciales.
- Ce document : décision de périmètre et plan de qualité.

**Exécution en local ou CI :**
```bash
cd worldhealth-vision-v2/services/media-renderer
python -m unittest discover -s cinematic -p 'test_*.py' -v
python cinematic/director_gate.py cinematic/episode.template.json --until casting --report cinematic/review.md
```
Le modèle vierge doit **échouer** : c'est voulu. Le rapport `review.md` rend explicites les éléments manquants. Ne pas appeler « ready » les documents non validés.

**Limites transparentes :** SHA-256 déclarés, preuves et droits doivent être confrontés aux fichiers/contrats réels par un outil complémentaire. Le validateur ne peut pas, sans ces octets ni revue humaine, certifier que les images sont belles, historiquement correctes ou publiables. Les tests unitaires utilisent des **données entièrement synthétiques** qui ne sont pas de vraies approbations. Aucun MP4 ni micro-animation artistique n'est créé par cet incrément.

## 5. Chantier suivant — VOUS NE DEVEZ PAS LE SAUTER

1. **Constituer une planche de références et un répertoire d'intentions de mouvement**, en distinguant les images inspirantes sous droit d'auteur des assets réutilisables.
2. **Développer un premier vrai prototype de motion design sur Remotion, sans histoire simulée** : utiliser une image de source vérifiée pour le reportage réel choisi par le propriétaire, ou des formes abstraites portant explicitement la mention « maquette technique » hors pixels de diffusion.
3. Préparer la **planche fixe** puis un micro-clip du plan le plus important, pas un long reportage complet. Comparer l'impact au meilleur document de référence, réviser jusqu'à validation.
4. Auditionner deux prises **Vivienne** pour le script validé de CETTE actualité ; ne jamais la remplacer silencieusement par une voix générique et ne pas publier sans licence.
5. Développer le **verrouillage / re-render sélectif** côté Remotion/FASTLANE avec références exactes d'assets et hash de rendu, en complément du préflight.
6. Améliorer l'interface Media Studio existante : **afficher** ce processus 11 portes, ses livrables et son statut réel ; ne pas créer un nouveau logiciel BAOCOM ou une seconde app média.
7. Seulement après un épisode réellement validé, capitaliser son modèle de composition et élargir la bibliothèque.

## 6. Critères d'acceptation de chaque séquence

L'humain examine et documente : information visible immédiatement ; exactitude et dates ; force/pertinence du plan ; photométrie et composition ; lisibilité iPhone ; typographie ; fluidité des animations ; sens du mouvement ; cohérence musique/voix ; rythme et absence de silences ; raccords ; cohérence émotionnelle ; non-tromperie ; droits.

**Le « beau » n'est pas un score automatique.** Un utilisateur peut noter une proposition, la rejeter, demander la reprise d'un plan isolé et préserver les parties réussies. Les seuils de qualité technique sont nécessaires mais jamais suffisants pour une prétendue note 9/10.

## 7. Continuité GitHub et non-régression

- Regarder la nouvelle branche + ce document et les vrais tests.
- Voir `docs/media/EDITORIAL_VIDEO_QUALITY_GATES.md`, `docs/media/VOICE_REFERENCE.md`, `docs/media/EDITORIAL_ON_SCREEN_RULES.md`.
- Voir `docs/media/WORLDVISION_FASTLANE_MONTAGE_ONLY_2026-11-14.md` **sur la branche FASTLANE** pour l'assembleur qui conserve les fichiers approuvés.
- Considérer les anciens choix d'outils dans `WORLD_VISION_PRODUCTION_CONDUCTOR_2026-11-13.md` comme l'historique : la décision récente remplace les fournisseurs imposés et garde **ChatGPT comme assistant principal**.
- Documentation du passé en `docs/media/audits/AUDIT_MEDIA_INTERNATIONAL_GDELT_2026-11-19.md` sur la branche audit séparée.
- Ne pas prétendre que les nouvelles portes sont déjà branchées dans l'interface ou dans le service de rendu. **Elles sont livrées comme un utilitaire autonome et testé.**
- Pour une nouvelle production : pas de sujet imposé ; ne pas reconstruire le reportage Soudan du Sud déjà diffusé ; ne pas remplacer une séquence acceptée.

**Décision centrale : sacrifier la vitesse plutôt que la vérité, la force visuelle ou la qualité vocale. La vitesse de rendu n'intervient qu'APRÈS avoir bien conçu les plans.**
