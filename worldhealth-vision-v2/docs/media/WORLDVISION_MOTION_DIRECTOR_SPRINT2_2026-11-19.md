# World‑Vision — Motion Director / Sprint 2 (19 novembre 2026)

## 0. Validation finale de l'incrément — 19 novembre 2026

**CI du HEAD technique contrôlée : [Actions #44530170278](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44530170278) : 2 jobs SUCCÈS (rendu Remotion, tests import/voix, build frontend V2).**

Détails vérifiés depuis **les vrais artefacts du run**, sans imaginer des résultats :
- Trois MP4 H.264 de test : `example.mp4`, `with-imported-media.mp4` et `focus-reveal-only.mp4`, plus PNG exacts des frames 0/52/104 et rapports SHA-256.
- `audit-voice.json` sur un WAV synthétique continu de **5,2 secondes** : `flags: []`, `input_unmodified: true`.
- `audit-with-gap.json` sur le même WAV contenant une interruption volontaire : **silence détecté de 2,000 à 3,300 secondes, 1,301 seconde** ; `long_pause_for_listening_review` émis ; original SHA inchangé. Ceci est un **test négatif réel**, pas une affirmation que le détecteur fonctionne sans contre-exemple.
- Le premier appel au détecteur Remotion avait échoué sur WAV ; la solution actuelle **réutilise `ffprobe` et `ffmpeg silencedetect`** déjà utilisés dans l'environnement de production, sans DSP maison ni mutation automatique du signal.
- **Correction sonore supplémentaire** dans `CreativeEdit.tsx` : la musique d'ambiance est limitée au documentaire, s'ouvre et se ferme en fondu bref, pour **ne pas couvrir l'outro officiel G0 silencieux**. La narration facultative reste une piste séparée, fournisseur libre.
- La vidéo demeure un **prototype visuel avec paysage abstrait synthétique et détourage de test**, et **NE DOIT PAS** être présentée comme vidéo d'actualité, motion design de niveau mondial ou travail artistique validé.

**Artifact GitHub :** `worldvision-creative-compositor-demo`, ID `14532099664`, run ci-dessus. Il est temporaire ; le code, les preuves et la documentation resteront dans GitHub. Pour reprendre : obtenir une image/document/reportage réel avec droits, réaliser une véritable séquence, puis comparer et corriger.

**État fusion/publication :** PR #44 **draft**, non fusionnée, aucune modification du site V2 déployé ; BAOCOM reste totalement indépendant.

---


**STATUT : incrément fonctionnel en PR #44 brouillon ; aucun merge, déploiement ni publication.**
**Source de vérité initiale :** [WORLDVISION_CREATIVE_EDIT_HANDOFF_2026-11-19.md](WORLDVISION_CREATIVE_EDIT_HANDOFF_2026-11-19.md).
Ce document est un incrément de continuité, pas un changement de la stratégie éditoriale.

## 1. Décisions non négociables

1. ChatGPT et l'utilisateur, dans la conversation, assurent pour le moment **la recherche, la sélection des sujets et le script**. Le logiciel média **reçoit le script**, il ne doit pas obliger une vérification ni écrire le texte en cachette.
2. L'utilisateur fournit parfois des photographies, petits clips, animations réalisées ailleurs, de la musique ou des prises vocales. Le studio **fabrique un montage formidable à partir de ces éléments**, complète intelligemment ce qui manque avec des outils existants sous contrôle et ne représente jamais une archive/illustration comme de vraies images de l'événement.
3. Toute voix est permise si autorisée et approuvée ; **Vivienne n'est pas verrouillée**. Les traitements audio ne doivent pas modifier la piste approuvée en silence.
4. **BAOCOM reste séparé**, aucun push de ses sources sur GitHub, aucun raccord. Seulement les idées d'interface utiles sont inspirantes. Blog, Content OS global et intégration GDELT côté média **restent différés**.
5. Notre code doit **orchestrer** Remotion, FFmpeg, de vrais outils spécialisés de création/génération/détourage/TTS/finition ; ne pas réinventer un concurrent de logiciels professionnels ou des meilleurs modèles IA. Les comptes fournisseurs sont à confirmer et aucun abonnement ou coût n'est présumé.
6. L'objectif est international : le français n'est qu'une première langue ; anticiper langues et typographies RTL/LTR, formats verticaux/horizontaux, fuseaux, droits internationaux, performance, observabilité et modules interchangeables **sans introduire une usine à gaz prématurée**.

## 2. Pourquoi le premier compositeur n'était pas suffisant

Le premier MP4 valide de la PR #44 prouvait la chaîne d'assemblage, **pas la beauté d'une vraie vidéo**. Ses animations étaient surtout de la typographie simple sur fond sombre ; les métriques H.264 et 1080x1920 ne signifient pas un niveau de motion design professionnel. Par défaut, les mouvements étaient des zooms génériques, les titres avaient une taille inférée de leur longueur et le lecteur ne montrait que le média source. Il fallait progresser sur la **composition réelle, la direction du regard, la lisibilité mobile et les révisions locales**.

## 3. Sprint 2 — code réellement ajouté sur la branche

### A. `focus_reveal`, une *famille de composition* cinématographique

**Fichier** : `services/media-renderer/src/CreativeEdit.tsx`.

- Départ : image/vidéo réelle **fournie** dans un cadre portrait interne ; expansion progressive vers le plein écran.
- Le média reste le média fourni (pas de faux « plan d'événement ») ; underlay discret, traitement de lumière sobre, **absence de fausses données**.
- Décomposition motion en temps de film : expansion du cadre, puis contexte/eyebrow, puis titre, ensuite sous-titre ; les mouvements sont à des temps différents pour gérer l'attention.
- Refonte du layout pour éviter les zones UI TikTok (haut, colonne droite, bas), tout en gardant une image suffisamment grande. Ces marges sont **une hypothèse technique de départ**, pas une validation sur tous les iPhone, résolutions et versions TikTok.
- **`@remotion/layout-utils` utilisé** pour mesurer réellement le texte et le faire tenir sur 2–3 lignes, au lieu d'estimer selon le seul nombre de caractères. Partage de la capacité avec les autres templates Remotion. Direction textuelle auto là où applicable ; **pas encore une couverture complète de toutes les écritures/langues du monde**.
- Type `focus_reveal` dans le validateur (média source obligatoire, plan ≥ 3 s, titre bref et fourni) et dans le sélecteur UI.
- Ces animations sont codées localement parce que ce sont des **compositions éditoriales paramétriques** ; elles ne remplacent ni les rendus 3D poussés, ni les générateurs de vidéos IA externes, ni une motion-graphiste.

### B. Superposition 2,5D, facultative

**Fichiers** : `CreativeEdit.tsx`, `creative/validate-project.mjs`, `creative/render-project.mjs`, UI.

- Un premier plan transparent PNG/WebP découpé **ailleurs** (Adobe, Fusion, outil de segmentation professionnel, ou matériau déjà reçu) peut être superposé au média d'origine.
- Plans arrière et avant ont des déplacements d'optique différents, produisant une profondeur **2,5D**. Ne pas appeler cela une reconstruction 3D ou la preuve visuelle d'un événement.
- Le fichier transparent est **facultatif**, vérifié comme chemin local et enregistré avec empreinte de contenu ; pas de détourage généré en quelques lignes dans notre moteur.
- Lors d'une revue, examiner soigneusement halos, masques des cheveux, mains, contours, ombres, perspective et choix de trajectoires ; ces défauts sont le principal signal d'un détourage de mauvaise qualité.
- L'interface permet de sélectionner la couche transparente de la scène, sans prétendre qu'elle garantit les droits ou la qualité.

### C. Placement intelligent décidé par la personne, pas par hasard

**UI** : `frontend/web-v2/src/media/CinematicProductionBoard.tsx/.css`.

- Chaque plan mémorise un **point d'intérêt x/y dans [0,1]**, indépendant des autres plans.
- Deux curseurs contrôlent la place du sujet pour le recadrage vertical natif ; le projet exporté porte `focus:{x,y}`.
- Aperçu commutable **source originale** / **recadrage 9:16 source**, explicitement identifié comme un aperçu de cadrage et pas l'animation finale. Pas de mensonge sur l'existence d'un rendu côté navigateur.
- Le choix du modèle `focus_reveal` évite une durée inférieure aux 90 images requises, et interdit l'export si le plan manque de photo/clip ou de titre bref.

### D. Micro-rendu non destructif et vrais plans de contrôle

**CLI** : `services/media-renderer/creative/render-project.mjs`.

- `--shot plan-01` produit **uniquement** le plan sélectionné depuis une copie en mémoire du JSON d'origine, sans changer le dossier ni régénérer la voix/master/outro du film ; c'est un **rendu de révision isolé**.
- Après rendu MP4, `renderStill()` officiel de Remotion produit trois images **réelles** (première, médiane, dernière frame), exportées dans `<mp4>.stills/`, avec hash et frame index dans le rapport `<mp4>.report.json`.
- Les rapports précisent `full_film` ou `single_shot_preview`, ID de plan, SHA du manifeste source, inventaire médias importés et durée du plan.
- Aucune opération ne modifie les MP4 déjà approuvés. **Le réemploi automatique de plans en cache, l'assemblage de fragments gelés et un système de versioning d'avis ne sont PAS encore implémentés** ; c'est la priorité d'ingénierie suivante.
- Le moteur nettoie ses médias temporaires après export ; les rushes restent dans le dossier source. L'import n'est pas un système d'upload cloud exposable tel quel : ne pas ouvrir le dossier de staging aux visiteurs externes.

### E. Preuves techniques et visuelles

**Workflow** : `.github/workflows/worldvision-cinematic-director-gates.yml`, conservé sous son nom historique.

- `npm run typecheck` du vrai renderer et build du frontend V2.
- Test projet fourni, voix arbitraire, clips MP4 externes, sécurité des chemins/symlinks, sécurité des transitions, première couche alpha et contrat du focus-reveal.
- Montage MP4 avec média synthétique image/video/audio. Rendu du `focus_reveal` seul, comparaison de hashes de captures de frames (assure que l'image **évolue**, pas que l'esthétique est excellente).
- Média de test : paysage abstrait **créé procéduralement dans le test**, et alpha-matte synthétique. Il n'est **pas** une véritable image documentaire ni un modèle de qualité mondiale. Test reproductible sans appel d'IA externe/stock sous licence.
- Sorties CI conservées temporairement comme artifacts GitHub (`example.mp4`, `with-imported-media.mp4`, `focus-reveal-only.mp4`, trois PNG, rapports). Elles ne sont pas publiées sur un canal média.
- Inspecter le **dernier run** associé au HEAD de PR #44 avant de déclarer un état « vert » : plusieurs validations précédentes ont réussi, mais chaque nouvelle modification réclame sa propre CI.

**Commandes de reprise local** :
```bash
cd worldhealth-vision-v2/services/media-renderer
npm install --no-audit --no-fund
npm run typecheck
node --test creative/validate-project.test.mjs
node creative/render-project.mjs \
  --project creative/project.example.json \
  --assets /dossier/assets \
  --output output/creative/exemple.mp4

# Un plan isolé dans un vrai projet utilisateur :
node creative/render-project.mjs \
  --project /dossier/projet.json \
  --assets /dossier/assets \
  --shot plan-01 \
  --output /dossier/previews/plan-01.mp4
```
**Important** : l'exemple JSON sans média ne contient pas la version test du focus-reveal ; celle-ci est fabriquée dans le workflow CI par `creative/build-ci-fixtures.mjs`.

### F. Voix libre : audition A/B + diagnostic technique sans TTS maison

- `frontend/web-v2/src/media/CinematicProductionBoard.tsx` affiche deux lecteurs audio **réels** pour comparer deux prises externes du même texte. La piste A est celle qui sera enregistrée dans le projet de montage ; la piste B n'est qu'un comparateur et ne remplace rien automatiquement.
- `services/media-renderer/creative/audit-voice.mjs` réutilise désormais **les binaires FFmpeg/FFprobe déjà installés dans le Dockerfile du Media Renderer** pour mesurer durée, silences, pauses longues et écarts avec le film, sans toucher à la narration ni à son SHA. Il ne génère aucune voix et ne raccourcit aucune pause. **Échec documenté** : un premier essai de `getSilentParts()` de Remotion a renvoyé `Compositor error: Invalid argument` sur la piste WAV d'essai (Actions #44528053736). Plutôt que programmer un DSP maison ou ignorer ce défaut, on a remplacé l'analyse par `silencedetect` standard FFmpeg (prévu pour tous les formats lus par FFmpeg) et ajouté un test byte-for-byte de non-modification. Vérifier le nouveau workflow avant de déclarer ce contrôle validé.
- Les pauses marquées peuvent être volontaires ; seules les écoutes et corrections humaines décident. Ce contrôle n'évalue ni le naturel d'une synthèse, ni la prononciation, ni le ton, ni les droits commerciaux. **La vraie amélioration sonore** nécessite ensuite un traitement de mix/master avec les outils professionnels existants et validation au casque + téléphone.
- Exemple :

```bash
node creative/audit-voice.mjs /chemin/absolu/ma-narration.wav 30
```

Cette commande sert à **inspecter une prise que l'utilisateur a déjà choisie**, jamais à décider à sa place quelle IA doit la lire.

## 4. Analyse artistique exigeante et limites

Le rendu d'essai antérieur, examiné image par image, montre un départ en visuel encadré, une extension fluide, puis une accroche qui apparaît plus bas. Cela prouve la chorégraphie des couches. Son arrière-plan synthétique reste très **simple**, et n'établit aucune supériorité face aux meilleurs motion designers.

Le rendu de qualité mondiale demandera **un vrai cas** apporté par le propriétaire : script + photo/vidéo documentaire + éventuellement narration ou prises vocales candidates. Il faut confronter la composition dans la situation où les défauts se voient : peau, cheveux, mouvement, contraste, richesse de texture, informations, reflets, source, place de la voix. La mission n'est pas d'impressionner avec des mots ou une durée de compilation, mais de rendre un film que le propriétaire accepte.

### Critères de revue pour chaque plan (pas de score automatique inventé)

- **0–2 secondes** : sujet compris, image forte, personne ne doit attendre un générique sans intérêt.
- **Pertinence** : chaque image montre exactement ce que le script dit, ou est identifiée comme illustration/archives.
- **Cadrage et lisibilité** : sujet non coupé, 9:16 natif, contrastes adaptés aux vraies surfaces iPhone et aux overlays TikTok.
- **Motion** : vitesse/accélération cohérentes, aucune oscillation gratuite, pas de zoom générique systématique, animation et coupe justifiées.
- **Texte** : concis, sans collision, pas plus de 2–3 niveaux visuels, lectures possibles en mouvement.
- **Voix** : aucune voix imposée, récit émotionnel mais naturel, bonne diction des noms/chiffres, possibilité de reprendre l'audition sans changer les images.
- **Son** : équilibre voix/musique, sonorisation utile et autorisée, pas de silences numériques, de clipping ou d'accélérations de voix.
- **Image** : étalonnage, cohérence du grain, sources réelles, droits de réemploi et absence d'artefacts d'IA qui tromperaient un média.
- **Diffusion** : signature authentique, liens/sources, version prévue, autorisation humaine et vrai statut, sans faux publication receipt.

## 5. Suite à faire — concrète et priorisée

**P1 — Regarder le MP4, pas seulement un build.** Télécharger la dernière artifact PR #44, comparer les trois PNG de `focus_reveal`, vérifier si le masque est crédible, la disposition top/bottom et la durée. Corriger jusqu'à qualité acceptable. Puis réaliser un prototype sur **une image réelle choisie et autorisée**.

**P2 — Le plus grand trou UX : prévisualisation vraie dans le Studio.** L'écran possède un aperçu des fichiers d'entrée et un cadrage source, mais pas encore de vrai Player Remotion intégré ni d'aperçus générés sur le serveur. **Ne pas simuler un rendu** : réutiliser `@remotion/player` avec une composition *partagée* et ses props sérialisées, sans installer une copie incompatible de React/Remotion ; et/ou servir des previews MP4 sécurisés via le media renderer existant. Éviter les chemins publics temporaires.

**P3 — Assets et versions de production.** Upload authentifié et stockage durable des médias (éventuellement objets externes), ledger de provenance/rights, groupes projet/plan, meilleure gestion des très gros médias (pas tous en mémoire iOS). Calcul d'un fingerprint du plan `SHA(script + shotProps + assetHashes + versionRenderer)`, cache de previews/diff de scène, concat de plans gelés, approbations explicites.

**P4 — Voix et son pro.** Comparateur de deux à trois interprétations sur la même phrase complète (notamment Vivienne si souhaitée), choix indépendant du fournisseur ; vérifier licences, prononciation, intelligibilité, silences, sous-titres temporisés sur l'audio réel. Réutiliser FFmpeg/FFprobe `silencedetect`, `loudnorm`, `sidechaincompress`/outils DAW ou mixeur du media renderer, pas écrire un DSP naïf. Les réglages de diffusion ne doivent pas empêcher de conserver la source audio.

**P5 — Un vrai kit motion design évolutif, pas 50 templates pauvres.** Prototypes art-dirigés `focus_reveal`, `document_evidence`, `data_scale`, et `human_context`. Visuels créés ailleurs possibles par MP4/WebM avec transparence selon provenance. Tester After Effects/Fusion/Blender/Runway/ElevenLabs selon budget, droit, API, accès et gains réels. N'écrire du code maison que pour les compositions éditoriales reproductibles.

**P6 — Formats, langues et équipes internationaux.** Profils de safe zone par plateforme, automatisation test iPhone/Android, fontes réellement chargées (pas seulement direction texte), logique RTL, multilignes et diacritiques, performances, rôles, stockage et gouvernance des droits. Préparer en avance sans arrêter la production vidéo.

**P7 — Content OS audiovisuel limité.** Bibliothèque projets, média, scènes, versions, retours, aperçu, export ; **pas** le blog global, ni GDELT ni l'ancienne application BAOCOM.

## 6. Repères pour poursuivre dans un nouveau chat

- Repo : `OBIANG5/World-Health-Vision`.
- PR : [#44, brouillon, NON MERGÉE](https://github.com/OBIANG5/World-Health-Vision/pull/44).
- Branche : `feature/worldvision-cinematic-director-gates-2026-11-19` (nom historique : n'indique plus les anciennes portes obligatoires).
- Base : `feature/world-vision-media-studio` et PR #5 séparée ; plateforme V2 canonique en `v2`.
- Source principale : ce document et `WORLDVISION_CREATIVE_EDIT_HANDOFF_2026-11-19.md`.
- Tests : consulter le run CI le plus récent, source_sha du HEAD, artifacts, rapports MP4.
- **Ne jamais faire une fusion ou un déploiement public au motif que les tests sont verts.** Les validations artistiques sont humaines.
- BAOCOM : aucun push, aucun connecteur ; voix Vivienne non obligatoire ; pas de script auto; pas de GDELT/blog à ce stade.
- Les artefacts et images d'archives dans GitHub sont les références, **pas les appréciations vagues d'un ancien chat**.

## 7. Contrôle final repris après interruption — VALIDÉ

**Date : 19 novembre 2026 ; dernière preuve CI sur code : [GitHub Actions #44530170278](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44530170278), commit `04399843d2af6106d7158b7ffa33652dd960a693`.**

- Job `Actual Remotion MP4 and user-project validation` : **SUCCESS**. **11 tests Node réussis, 0 échec** ; rendu H.264 1080×1920, images et MP4 de scène isolée, composition 2,5D depuis détourage synthétique, audio externe importé, rapports SHA et captures de vrais pixels.
- Job `Real V2 mobile content workbench build` : **SUCCESS**. L'interface V2 compile.
- **Contrôle positif voix** : audio WAV de 5,2 s contrôlé par `ffprobe` et `ffmpeg silencedetect` ; empreinte SHA du fichier source identique avant/après.
- **Contrôle négatif voix** : WAV de synthèse avec **1,3 seconde de silence introduit volontairement** ; le test a confirmé `long_pause_for_listening_review` d'une durée supérieure ou égale à une seconde. La sortie prouve que le détecteur peut réellement signaler un défaut, et pas seulement accepter n'importe quelle piste.
- **Cause et correction** : premier essai d'analyse `getSilentParts()` : `Compositor error: Invalid argument` sur WAV. Remplacé par l'outil éprouvé FFmpeg existant. Le remplacement est implémenté, testé et documenté ; aucun DSP de substitution maison.
- **Limites** : audio d'essai synthétique, pas un jugement sur la diction/expressivité d'une vraie narration. Rendu cinématographique techniquement valide, mais démonstration graphique abstraite encore très loin d'une publication artistique de référence. Pas de source réelle, de droits licenciés, de voix humaine professionnelle ni d'export mobile à partir de l'interface web. Aucune publicité ni diffusion.
- **État GitHub** : [PR #44](https://github.com/OBIANG5/World-Health-Vision/pull/44) encore **DRAFT**, base `feature/world-vision-media-studio` ; **aucune fusion dans `v2`**, aucun déploiement Vercel, aucun push ni connexion BAOCOM.

### Prochain travail prioritaire au prochain chat

1. **Véritable prévisualisation de composition dans le Studio** : ne plus se limiter au fichier source ; relier le frontend au rendu Remotion de la scène en gardant son identité et un protocole d'upload sécurisé. Vérifier l'existence et les licences de `@remotion/player` avant d'installer quoi que ce soit. Protéger les ressources des utilisateurs.
2. **Art direction réelle** : demander au propriétaire un script + 1–2 images/vidéos authentiques ou autorisées ; construire **une** ouverture de qualité supérieure et comparer A/B les compositions. Un test noir/abstrait n'est pas la cible esthétique.
3. **Correction non destructive** : empreintes stables par scène, réemploi/cache des plans déjà approuvés, rendu ciblé et capacité à remplacer seulement un fragment sans redégrader l'ensemble.
4. **Voix et sound design** : audition de prises A/B, alignement parole/image et mix sur l'audio réellement reçu, avec outil existant ; aucun fournisseur obligatoire.
5. **Content OS de production audiovisuelle seulement** : dossiers / médias / plans / versions / commentaires / exports ; pas de raccord GDELT ou blog global. BAOCOM complètement indépendant.

**NE PAS déclarer le projet « terminé »** : ce jalon technique est terminé, mais la qualité visuelle de classe internationale exige encore les étapes ci-dessus, la revue humaine des véritables médias et la comparaison avec les meilleurs reportages.

