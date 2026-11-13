# WORLD-VISION — plan directeur de production audiovisuelle (après D00)
  
**Établi le 13 novembre 2026, à partir du dépôt, du chat et du manuel original de 137 pages.**  
**État : conception documentée ; nouvelle image D00-v6 non encore validée, aucune vidéo de cette direction créée.**

> Ce document doit survivre aux limites de longueur des chats. Il préserve non seulement l'esthétique du globe, mais **la totalité du parcours de travail prévu : repérage → faits → géographie → voix → montage → contrôle → validation → diffusion**. Lire en même temps le registre des décisions et le journal GitHub. **Ne pas déduire qu'une fonctionnalité est implémentée du seul fait qu'elle figure dans ce plan.**

## 1. Références canoniques et état humain

- **Dépôt** : `OBIANG5/World-Health-Vision`, **branche de travail** `feature/world-vision-media-studio`, PR #5 en brouillon contre `v2`; ne pas confondre avec `main` (ancien produit).
- **Logo G0** : PNG œil-globe bleu **officiel actuel déjà accepté**, fichier source exact `frontend/web/src/assets/logo.png` ; ne pas le redessiner. Son placement discret **en haut à gauche OU un autre coin** du futur reportage est une **proposition à comparer sur de vrais photogrammes**, pas une décision approuvée.
- **Direction G1** : A/B/C refusées ; D00 « planète dans les deux arcs d'œil » en correction après plusieurs images fixes ; D01–D05 restent des poses vectorielles de laboratoire, PAS un plan complet validé.
- **Première vidéo COP31** : vrai MP4 technique mais **REFUS 1/10** sur quinze critères, issue #9 ; conserver comme preuve, ne jamais la republier ni la traiter comme style accepté.
- **Une seule nouvelle localisée** doit généralement cibler **un seul pays/lieu**. Plusieurs pays uniquement si la géographie du fait l'exige ; un fait sans pays pertinent peut omettre le zoom. C'est un moteur adaptatif, jamais un montage forcé à cinq pays.
- **Source de formation originale** : `monter-et-animer-vos-videos-avec-claude-v2.pdf`, 137 pages, retrouvée dans la Library utilisateur le 13/11. Consultation textuelle des chapitres répartis sur les pages 1–137 via fichiers indexés. **Il ne s'agit pas d'une certification ligne à ligne de chaque prescription ni d'une copie du PDF dans GitHub.** Adaptation à **ChatGPT + notre code**, sans dépendance imposée à Claude.
- **Références de reprise** : `CONTINUITE_WORLD_VISION.md`, `docs/continuity/CURRENT_STATE_AND_NEXT_STEP.md`, `DECISION_REGISTER.md`, `WORK_JOURNAL.md`, `docs/media/TRAINING_137_PAGES_IMPLEMENTATION_AUDIT_2026-11-13.md`, `docs/media/art-direction/D00_EYE_GLOBE_VISUAL_ITERATIONS_2026-11-13.md`.

## 2. D00-v6 : cahier de revue de la nouvelle image

**Chronologie confirmée :**

- **D00-v4** : le globe géographique et les deux arcs ont progressé, mais il manque du « blanc de l'œil » ; zones désertiques et frontières trop peu lisibles ; nuages légèrement trop présents ; atmosphère à éclaircir.
- **D00-v5** : image de globe dans l'œil, zones claires apparues ; commentaire humain **« yes, très beau »**, avec **corrections restantes** : blanc insuffisamment blanc, halo de la planète moins dominant que les arcs et frontières encore trop faibles. **Ce n'est pas une validation finale.**
- **D00-v6** : nouvelle image générée dans la session courante pour réponse au dernier message. **En attente de retour humain** ; elle constitue un **concept art**, pas encore une frame CGI reproductible ni une vraie vidéo.

**Contraintes désormais prioritaires :**

1. **Blanc de l'œil** : vrai blanc opaque proche de #FFFFFF, **uniquement à l'intérieur des deux arcs et à l'extérieur du disque terrestre** ; conserver la séparation avec le limbe atmosphérique de la Terre.
2. **Deux arcs d'œil** : exactement deux, inspirés de la forme de l'œil du logo, larges et étendus **hors champ**, sans extrémités visibles, **pas d'anneau circulaire fermé ni d'autres traits décoratifs** ; ils ne doivent pas prendre le pas sur la Terre ni sur son atmosphère.
3. **Atmosphère** : lueur cyan/bleu propre **immédiatement sur le contour de la Terre**, plus évidente qu'un simple liseré ; l'intensité perceptuelle de cette couche doit être **supérieure** à celle des arcs. La « couche d'ozone » est une dénomination visuelle du propriétaire ; techniquement il faut simuler la **diffusion de lumière dans l'atmosphère**, et non présenter le halo comme une mesure physique de l'ozone.
4. **Pays** : lignes de frontières *exactes* et lisibles à taille mobile, **en particulier dans le Sahara / Sahel** où les teintes de désert ont une faible variation. Prévoir une bordure à contraste adaptatif, largeur contrôlée, sans inventer les frontières ; documenter les territoires disputés et la source.
5. **Globe** : taille et centre de D00-v5 appréciés ; ne pas le rapetisser pour ajouter de l'habillage ; jour, couleurs naturelles, relief et océans détaillés, pas de points lumineux de villes ; un peu moins de nuages **SUR la Terre**, aucune banque de nuages hors planète.
6. **Fond** : espace marine profond, très peu de petites étoiles, aucun soleil visible, pas d'étincelles dorées, pas de textes/compteurs techniques dans la vidéo publique.
7. **Dimension finale à réaliser** : `1080×1920, 9:16, 30 fps`, espace sûr mobile. Les concept images D00-v5/v6 générées ici sont `1086×1448` (3:4) et **n'ont pas été composées en vrai 9:16 validé**.

**Important :** les frontières dessinées par un générateur d'images peuvent être inexactes ; le futur moteur 3D doit fournir un **overlay construit géométriquement depuis des polygones vérifiables**, et garder lisibles pays/îles/lignes près des zones lumineuses.

## 3. Moteur universel de rotation géographique — objectif, NON codé à ce stade

### Contrat éditorial attendu

Entrée par épisode `story_id`, horodatage, `country_iso3` (si connu), nom localisé, `target.lat` / `target.lon` géocodés et vérifiés, précision (pays / région / ville), liste `related_targets` seulement si le fait le justifie, mode `single_location | related_locations | global_overview | no_specific_geography`, pays contestés et justification du cadrage.

Séquence du moteur :

1. D00 : planète presque entière + œil + atmosphère, photographie de référence 3D.
2. D01 : interpolation **déterministe** de l'orientation du globe/caméra vers le centre du pays (rotation quaternion/slerp ou trajectoire 3D avec easing régulier) ; éviter rotations arbitraires, sauts et renversements des pôles.
3. D02 : réduction progressive du champ de vue ou approche de caméra vers région/ville **si utile** ; silhouette/frontière du pays calculée depuis une couche GIS cohérente et non de la génération libre ; le marqueur pays/ville ne doit pas masquer l'info.
4. D03 : **raccord vers des images/vidéos réelles sous droits autorisés et datées** ; si absent, basculer sur un document primaire ou graphique clairement présenté, jamais fabriquer un reportage filmé inexistant.
5. D04 : explication, sources et chiffres contrôlés ; titres et sous-titres à la voix, avec contraste et zones sûres.
6. D05 : sortie sobre. Pour un sujet unique, conclure ; ne passer à un autre pays **que si son rôle est justifié par l'actualité**.

### Implémentation technique à tester avant choix définitif

- **Remotion + React + TypeScript** (existe) : orchestration des compositions, scènes, synchronisation, rendus versionnés.
- **Three.js/WebGL/GLSL** (candidat) : globe dynamique, shaders atmosphériques, projections géographiques ; tester la compatibilité du rendu image par image, la stabilité GPU et l'export via Chromium/Remotion.
- **Blender + Python** (candidat hors ligne) : globe photo/CGI avec diffusion atmosphérique, lumière, textures sous licence, pré-rendu déterministe et qualité photoréaliste ; **comparer la qualité et le temps de rendu** avec la piste WebGL, pas installer Blender d'office comme dépendance serveur.
- **Sources géo vérifiables** : GeoJSON V2 existant (`frontend/web-v2/public/countries.geojson`) à auditer avant emploi, projection correcte à l'horizon (pas de traits sur la face cachée), précision des îles et des frontières, politique des frontières contestées, coordonnées de centres. Ce n'est pas à un modèle image de géocoder les pays.
- **Textures** : carte jour/relief/nuages avec droits de réutilisation documentés, enregistrement du hash et des crédits.
- **FFmpeg / ffprobe** (existe) : séquences, H.264/AAC 48 kHz, loudness et rapports, intégrité des octets, SHA-256 du MP4.

**Tests à écrire** : cibles Europe, Afrique, Asie et Amériques ; dateline ±180°, hautes latitudes, géographie sans cible, transitions inter-pays justifiées, géométrie de l'arc, contrôle des masques blanc/atmosphère, stabilité de 3 à 6 secondes, reproductibilité sur deux rendus du même job, performance et absence de collision UI.

**Ordre de validation :** image fixe D00 9:16 → avis humain → D01 début/fin → avis → **micro-clip 3–6 s** → avis → D02 → transitions D03 → ne pas générer de nouveau long MP4 automatiquement.

## 4. Parcours complet de production déjà défini par les 14 étapes

Le frontend `ProductionJourney.tsx` contient les étapes : `01 RADAR → 02 VERIFY → 03 SCORE → 04 APPROVAL → 05 CREATIVE → 06 ASSETS → 07 STORYBOARD → 08 AUDIO → 09 REMOTION → 10 PREVIEW → 11 QA → 12 PACKAGE → 13 TIKTOK CLEAN → 14 PUBLISH`.

**États prouvés au niveau code (pas forcément actifs en production) :** `services/media-service/` dispose des modules `radar.py`, `verification.py`, `scoring.py`, `editorial_creative.py`, `asset_workflow.py`, `wikimedia_assets.py`, `voiceover.py`, `qa.py`, `publication.py` et planificateur Redis conditionnel. `services/media-renderer/` contient Remotion + FFmpeg. L'archive GitHack est **statique**, non connectée au backend live : ne jamais la présenter comme un moteur de veille ou de publication 24 h/24. Aucune automatisation de TikTok/WhatsApp n'est autorisée à publier sans reçu et approbation.

## 5. Adaptation des NEUF parties du manuel de 137 pages

| Partie du manuel original | Pages | À conserver dans notre méthode | État/point de travail World-Vision |
|---|---:|---|---|
| 01 Comprendre | 4–11 | Deux filières : rushes documentaires + motion design ; rôles « décider / produire / valider » | Vision conservée ; former l'équipe et empêcher le rendu prématuré |
| 02 Préparer l'environnement | 12–22 | Inventaire matériel, fichiers, Node, outils, cache, rendus sobres et sérialisés | Backend/renderer existants ; benchmark serveur/ressources encore à mener |
| 03 Choisir les outils | 23–40 | Comparer moteur, transcription / alignement et voix sur de vrais extraits, coûts et droits | Remotion existant ; benchmark 3D et nouvelle voix/alignement encore à faire |
| 04 Prompt moteur et mémoire | 41–58 | Préférences durables, secrets serveur, état des décisions, essais, compétences réutilisables | `docs/continuity` et skill média existants ; vérifier/compléter après chaque session |
| 05 Construire son univers | 59–74 | Licences, ressources, design system, banque d'idées, styles par catégorie | Logo accepté ; D00 reste en revue, banque de médias vérifiables à développer |
| 06 Monter des rushes | 75–91 | Ingest/ffprobe, dérushage/transcription, montage papier, plans de coupe, recadrage, étalonnage, sous-titres, mixage | Pipeline ASSETS partiel ; workflow exhaustif de rushes réels non approuvé |
| 07 Spécialisation motion design | 93–107 | Script vérifié et validé → voix et calage → storyboard → animations → raccords vers rushes | D00 fixe actuel ; globe 3D/mouvement non encore validé |
| 08 Contrôler et livrer | 108–114 | Studio léger, aperçu image/son sur téléphone, test court, QA par frame, rendu final après accord, rangement | Certains tests + rendu historique existent ; renforcer la QA artistique/audio |
| 09 Aller plus loin | 115–137 | Prompts réutilisables, erreurs et corrections, coûts, transitions, techniques son, glossaire, crédits | Catalogue et règles à adapter, jamais supposer coûts/API historiques toujours valides |

### Quatre compétences de montage décrites par le manuel

Ne pas confondre leur description dans le cours avec une implémentation déjà effective dans le dépôt. Un `skills/world-vision-media-director/SKILL.md` existe comme guide interne, mais ces **quatre compétences spécifiques doivent être auditées / développées et testées** :

1. **`montage-rushes`** : inventaire média/codec/VFR/HDR, copies sans altérer originaux ; transcription temporelle, montage papier, coupes aux mots, silences/hésitations, choix des meilleures prises et raccords validés.
2. **`habillage-ecran`** : masquer informations personnelles visibles dans les captures d'écran, cadres, chapitres, pauses explicatives, transitions accessibles et composition mobile.
3. **`sous-titres-srt`** : transcription et alignement précis, noms propres, horodatages, fichier SRT séparé, captions incrustées optionnelles et contrôle du calage sur début/milieu/fin (viser ≤0,3 seconde).
4. **`rendu-long`** : tests de performance, découpage en segments contrôlables/reprenables, contrôle du nombre d'images et des durées audio, concaténation vérifiée, une seule production lourde simultanément. Le manuel cite `-14 LUFS` comme référence de sa méthode, à adapter selon le canal et la version de diffusion.

## 6. Voix off : validation séparée, non commencée pour cette identité

**Rappel impératif :** l'ancienne voix **Piper a été rejetée** comme référence professionnelle ; le code `media-service/voiceover.py` utilise **OpenAI Realtime** mais cela ne veut pas dire que la voix finale est approuvée. Gemini TTS et ElevenLabs sont des **candidats à auditionner**, non des comptes/API actuellement configurés.

Processus demandé :

1. Script du reportage avec affirmations réellement sourcées ; noms et chiffres vérifiés ; **texte verrouillé** avant génération de la voix.
2. Auditionner **trois extraits français de la même phrase** (environ 15 secondes), normalisés à volume comparable, après vérification des frais/quotas réels et consentement. Critères : clarté, diction des noms propres/africains/étrangers, chaleur, rythme, naturel, émotion sobre, fatigue auditive.
3. Choisir un seul profil de voix après **accord explicite**. Conserver un lexique de prononciation (orthographe d'écran intacte, phonétique vocale séparée).
4. Aligner script et WAV **mot à mot** avec un moteur validé (Whisper ou ElevenLabs Forced Alignment), vérifier le décalage des sous-titres sur début, milieu et fin ; **ne pas accélérer artificiellement la parole** pour respecter une durée arbitraire, raccourcir uniquement les pauses quand c'est pertinent.
5. Mixer musique/effets de façon qu'aucun lit musical ne couvre la voix, vérifier au casque ET au haut-parleur iPhone, puis mesure loudness/peak selon les plateformes.
6. Enregistrer script exact, version voix, WAV/PCM, transcription de QA, prononciation corrigée, coût éventuel, SHA, écoute humaine et décision.

## 7. Montage documentaire, habillage, narration

- Collecter des **photos et vidéos authentiques de l'événement** (lieu, date, auteur, licence, crédit, URL). Un stock vidéo générique ou une séquence générée ne doit jamais être présentée comme prise sur le terrain.
- Le script doit commencer par une accroche factuelle qui donne envie de poursuivre, non un titre `HOOK` affiché au spectateur. Conserver logique : **voir le monde, le comprendre**.
- Écrire un **montage papier** montrant chaque plan, sa durée, les assertions/voix, les médias et les sources. Valider avant montage lourd.
- 9:16, 1080×1920, 30 fps, sous-titres synchronisés, typographie lisible, photographie et couleurs cohérentes ; attention safe zones de TikTok, YouTube Shorts et WhatsApp.
- **Logo éditorial** : essayer un discret logo officiel en haut à gauche, puis éventuellement haut à droite/autre zone sûre en comparaison 9:16. Tester contraste sur ciel, mer, désert, vidéos de terrain, sous-titres et UI de plateforme. **Le positionnement précis n'est pas validé.** Pour l'API TikTok, distinguer une identité média éditoriale des filigranes/overlays promotionnels interdits ; contrôler la politique officielle au moment de diffusion et produire le profil de canal approprié.
- Synchronisation image/voix et transitions : globe → cible → images réelles → décryptage → sortie ; mouvement géographique original, pas copie de la vidéo TikTok `@focus.geopolitique`.
- Éviter suranimation, rayons de soleil, énormes fonds sombres, codes scène `D00/01`, barres de progression, répétition de mêmes 7 plans et éclats dorés.

## 8. Validation et traçabilité — preuves obligatoires

**Gates humains (distincts des 14 étapes du pipeline) :** G0 logo ✅ ; G1 ouverture D00-v6 **non encore validée** ; D01/D02 caméra; D03 vrai visuel; D04 décryptage; D05 sortie; voix; prototype animé; montage candidat; QA; export de diffusion **soumis à avis séparés**.

Pour **chaque** étape :
- version immuable, ID de scène, sources/licences et SHA de l'asset réel ;
- captures ou micro-fichiers qui se voient/s'écoutent sur téléphone ;
- note par critère 1–10 **uniquement si donnée**, « à corriger / refusé / validé », commentaire et bloqueurs ;
- corrigé → nouveau SHA ; **pas de score inventé ni d'approbation par inférence** ;
- test technique + revue humaine ne sont pas interchangeables ;
- GitHub commit sur branche média + WORK_JOURNAL + CURRENT_STATE + DECISION_REGISTER ;
- publication de l'aperçu statique avec `source_commit` exact, vérification du cache CDN, **le même lien permanent** ;
- MP4 final uniquement lorsque composants et voix approuvés ; publication externe uniquement après validation + permissions + reçus réels.

**Note de conservation binaire** : les images D00-v5/v6 générées dans les chats n'ont **pas** été importées comme PNG dans GitHub via le connecteur au moment de cette documentation. Leurs empreintes et caractéristiques sont enregistrées, **pas leurs pixels** ; les fichiers originaux doivent être conservés/exportés séparément avant une éventuelle disparition de conversation.

## 9. Action strictement suivante

**Obtenir un retour sur l'image fixe D00-v6**. Si correction, produire v7 à partir de la direction acceptée (pas refaire tout le style). Si le style est explicitement approuvé, créer un **rendu programmable et vérifiable de D00 en 1080×1920**, géographie GIS et atmosphère, inspecter sur téléphone ; ensuite seulement tester la rotation (D01) et un micro-clip 3–6 s ciblant un pays. Le placement du logo dans les futurs reportages et le casting voix se jugeront plus tard comme étapes **distinctes**, sans perdre les exigences décrites ci-dessus.
