# WORLD-VISION — COMMENCE ICI POUR REPRENDRE UN CHAT BLOQUÉ

## CORRECTION PRIORITAIRE DU PROPRIÉTAIRE — 19 NOV. 2026 (PREND PRÉSÉANCE)

La première décision du 19/11 imposant 11 « portes » éditoriales et Vivienne au pipeline a été explicitement **refusée et remplacée**. Les modules Python rigides ont été supprimés. **On fournit des scripts et des médias à World-Vision ; ChatGPT travaille la recherche/le récit dans cette conversation. Le logiciel excelle dans la direction artistique, les animations, le montage, la voix libre et la finition en réutilisant les meilleurs moteurs existants.** BAOCOM n'est ni connecté ni poussé, blog/GDELT attendent. Consulter le [nouveau cahier des charges](worldhealth-vision-v2/docs/media/WORLDVISION_CREATIVE_EDIT_HANDOFF_2026-11-19.md) (lien relatif depuis la racine) et la [PR #44](https://github.com/OBIANG5/World-Health-Vision/pull/44).

---

## NOUVELLE DÉCISION ACTIVE — 19 NOVEMBRE 2026 — PRIORITÉ ABSOLUE AUX VIDÉOS

**Le propriétaire maintient BAOCOM comme projet complètement indépendant.** Aucune migration BAOCOM vers GitHub, aucune API ou fusion BAOCOM → World-Vision. On garde seulement certaines idées : visualisation pédagogique des étapes, montage modifiable par scène, réutilisation de modèles graphiques professionnels.

**World-Vision média :** ChatGPT est le réalisateur/copilote éditorial ; les moteurs déjà présents servent à composer, synchroniser, monter et contrôler. Priorité aux reportages réellement excellents (image, motion design, narration Vivienne, sound design, authenticité), par **11 portes artistiques/techniques**, validées une par une : `research → script → treatment → voice → casting → layouts → motion → edit → sound → qa → delivery`. Aucun nouveau MP4 intégral sans planches et micro-animations acceptées. Aucun élément précédemment validé ne doit être modifié tacitement.

**À différer :** Content OS, blog multi-format et raccordement GDELT dans la partie médias jusqu'à l'intégration logicielle effective de GDELT ; ne pas rouvrir ces chantiers à ce stade.

**Nouveau travail vérifié :** branche `feature/worldvision-cinematic-director-gates-2026-11-19`, [PR #44 DRAFT](https://github.com/OBIANG5/World-Health-Vision/pull/44), [direction artistique et feuille de route](worldhealth-vision-v2/docs/media/WORLDVISION_CINEMATIC_DIRECTOR_PRODUCTION_V1_2026-11-19.md), code `worldhealth-vision-v2/services/media-renderer/cinematic/director_gate.py`, tests CI réalisés. **Le validateur est une fondation structurelle, pas une preuve de qualité cinéma, et aucune vidéo nouvelle n'est produite.** Prochain travail réel : artboards 9:16 d'un plan utile, micro-animation 3–6s et audition Vivienne de l'actualité choisie. Ne pas merger automatiquement.

---



## ACTUALITÉ EN PRÉPRODUCTION : BROOKLYN / EFFONDREMENT FLATBUSH — 14/11/2026

Le propriétaire a choisi **l'actualité n° 1 (Brooklyn, immeuble effondré)**. Nous sommes à l'étape **script + sélection des vrais rushes** et PAS ENCORE au montage FASTLANE. Un script V2 plus émotionnel a été proposé dans le chat, sans approbation mot par mot pour l'instant. Ne pas lancer de voix ni changer ce texte sans demander la validation éditoriale.

- Branche: feature/worldvision-brooklyn-editorial-pack-2026-11-14. [PR #31](https://github.com/OBIANG5/World-Health-Vision/pull/31).
- Pack: worldhealth-vision-v2/docs/media/episodes/2026-11-14_brooklyn_flatbush/STORYBOARD_PROPOSED_V2.json + EDITORIAL_SOURCES_AND_RIGHTS.md.
- Faits: 1321 Flatbush Avenue, Brooklyn, le 11 novembre 2026 à ~16:01, bâtiment de 3 étages effondré dans l'excavation du chantier 2625 Bedford Ave, huit morts dont deux enfants, 18 blessés, 250 secours. **Enquête, aucune causalité prouvée du chantier.**
- **Moment humain fort** : une femme enceinte extraite vivante après plus de deux heures, mari confirme le 13 novembre femme et bébé à naître vivants, femme grièvement blessée.
- Storyboard avec ~10 plans 48 s: globe très bref ~1,5 s puis vrai effondrement à l'image, destruction, vraie recherche, extraction, témoignage du mari, bilan, excavation, enquête et **vraie signature animée 3 s**.
- Vraies séquences trouvées: Storyful caméra de porte James A Williams https://video.storyful.com/record/41716 ; CBS sauvetage https://www.cbsnews.com/newyork/news/brooklyn-building-collapse-survivor-rescued/ ; WABC mari https://abc7ny.com/live-updates/brooklyn-building-collapse-live-updates-1-dead-flatbush/20034152/ ; Reuters Connect drone https://www.reutersconnect.com/item/drone-2-killed-several-injured-in-building-collapse-in-brooklyn-new-york/dGFnOnJldXRlcnMuY29tLDIwMjY6bmV3c21sX09XQU5BQ0VOMVJSV0MxTk1URlc4VllKUkFVQ1JVSlo .
- **BLOCAGE RÉEL** : ce sont des extraits de presse/surveillance avec droits de tiers. La visualisation sur une page ne constitue PAS une autorisation de téléchargement/republication. Pas de vraie licence / fichier exploitable à ce stade. Ne pas maquiller le blocage en montage rempli de stock footage présenté comme les scènes de Brooklyn.
- Référence vocale choisie: Vivienne C5.2 « impact média », **prise neuve pour ce sujet** à valider après le script, pas l'audio C5.2 qui dit les mots d'une autre actualité.
- Se souvenir du contrat FASTLANE : d'abord le storyboard et la voix validés, ensuite l'assemblage seulement, idéalement sous cinq minutes.


## NOUVELLE STRATÉGIE CONFIRMÉE — MONTAGE EN MOINS DE 5 MINUTES (14 NOVEMBRE 2026)

**Utilisateur :** voix Guinée trop lente et insatisfaisante ; ne plus consacrer une heure à refaire les mêmes images. Dorénavant nous préparons ENSEMBLE le sujet, l'angle, le script, toutes les vidéos/images, les animations utiles, la prise de voix et la fin. GitHub doit s'occuper UNIQUEMENT du **montage rapide de ces éléments déjà validés**, du globe de localisation, de la signature animée et des contrôles de sortie. Objectif <300 s **pour la seule étape d'assemblage**, pas pour le sourcing ni pour l'art vivant. Les clips non préparés ou sans droits bloquent le montage : ne jamais improviser des images génériques.

**Dernière référence vocale authentifiée retrouvée dans l'autre branche : VIVIENNE C5.2 — IMPACT MÉDIA.** Référence originale de 14,088 s, timbre fr-FR-VivienneMultilingualNeural, +8 %, voix enregistrée pour le reportage Nouvelle-Orléans seulement. Fichiers enregistrés sous la branche production/worldvision-vivienne-c52-voice-lock-2026-11-14 ; style sonore sélectionné, pas narration applicable à toutes les actualités. +6 % a été proposé pour une autre prise, non approuvé. Ne pas reprendre le trop lent montage Guinée ; ne pas remplacer le MP3 parlant du Mississippi pour narrer un nouveau sujet. Droits commerciaux d'Edge TTS non acquis.

**Nouveau code déjà enregistré :** branche feature/worldvision-fastlane-assembly-only-2026-11-14, assembleur de clips préparés avec SHA, voix à un seul tenant et signature vidéo 3 s : worldhealth-vision-v2/services/media-renderer/fastlane/assemble.py. Détails et protocole : worldhealth-vision-v2/docs/media/WORLDVISION_FASTLANE_MONTAGE_ONLY_2026-11-14.md. Tests techniques avec FFmpeg : fastlane/test_assemble.py. CI : .github/workflows/worldvision-fastlane.yml. Le montage prend un manifeste verrouillé et refuse tout scénario non approuvé. Les tests synthétiques sont techniques uniquement et ne deviennent jamais un reportage. Revue humaine de la qualité et des droits avant toute diffusion.

**Référence audio à écouter :** https://raw.githack.com/OBIANG5/World-Health-Vision/production/worldvision-vivienne-c52-voice-lock-2026-11-14/worldhealth-vision-v2/services/media-renderer/public/voice/vivienne-c52-impact-media-reference.mp3


## RETOUR APRÈS VISIONNAGE V3 GUINÉE — NOTE 6/10 + CORRECTIF SON, 14/11/2026

L'utilisateur a décidé de **publier la V3** mais la note **6/10**, jugeant la voix **trop basse** et le montage **pas assez émotionnel, vivant, animé** malgré les nouvelles photographies authentiques. Ne plus confondre 13 remplacements d'images ou un zoom sur photo avec un reportage poignant. Les critères des prochaines vidéos imposent de vrais gestes filmés pertinents, des variations fortes de plans, une mise en scène sémantique et des rythmes visuels au service des paroles. Pas de fausses violences ni de faux témoignages.

**Diagnostic du fichier réel** `worldvision-guinee-siguiri-v3-visuels-refaits-voix-identique.mp4` : **-16,40 LUFS et -1,99 dBTP**, souffle non suffisant sur smartphone. **Correction audio exportée et contrôlée** : `worldvision-guinee-siguiri-v3-son-clarifie-et-renforce.mp4`, 47,133s, **-13,67 LUFS, -1,38 dBTP**, soit +2,73 LU, H.264 inchangé exactement (video elementary stream SHA-256 `5518c8ebb75b71700a162cd467579758b9a04d680fc0c2b36a4407757f2a0da0` avant et après) ; SHA-256 du fichier local `c1e4865813013c45e35408bace3c96a7cc5a6b0cfd944e4ef54e259d01f73273`. Script et interprétation Vivienne non regénérés : simplement remaster audio doux. **Version avec son corrigé fournie au propriétaire dans le chat** ; CI GitHub ajoutée sur branche `feature/worldvision-guinee-siguiri-v3-authentic-visuals-2026-11-14` : `.github/workflows/worldvision-guinee-siguiri-v3-louder-audio.yml`, publiant une version son renforcé sans écraser l'original. Vérifier le résultat avant de déclarer le nouveau lecteur publié.

Conserver la note 6/10 dans le registre qualité du Media Studio. La nouvelle règle audio : contrôler le loudness ET l'écoute mobile avant livraison ; la nouvelle règle cinéma : une photo recadrée animée n'est pas une vidéo émotionnellement aboutie. La qualité artistique du propriétaire est distincte du succès du pipeline.


## MONTAGE GUINÉE V3 — REFONTE VISUELLE RÉELLE EN RÉPONSE AU REFUS DE LA V2

Le propriétaire reproche aux V1/V2 Guinée de ne changer pratiquement **aucune image** et de conserver des photographies et plans fades/génériques, malgré ses demandes répétées. **Il demande de terminer l'épisode en conservant EXACTEMENT la dernière voix Vivienne** — ne plus rouvrir le chantier de la voix — tout en refaisant les visuels faibles.

**Nouvelle réponse vérifiable :** branche `feature/worldvision-guinee-siguiri-v3-authentic-visuals-2026-11-14`, [PR #27](https://github.com/OBIANG5/World-Health-Vision/pull/27) brouillon. Script `worldhealth-vision-v2/services/media-renderer/scripts/worldvision_guinee_siguiri_v3_visual_editor.py`. Actions `.github/workflows/worldvision-guinee-siguiri-v3-real-guinea-images.yml`.

- **13 plans sur 16 remplacés** : conserve UNIQUEMENT 0 = globe initial que l'utilisateur aime, 12 = vraie vidéo homme au marteau que l'utilisateur aime, 15 = signature World-Vision bleue.
- **Audio source inchangé bit-à-bit** : le renderer prend le flux AAC de la V2 sans regénérer Vivienne, et teste l'identité binaire de ce flux. Texte choisi verrouillé SHA-256 `0d0e268a9f189b9ae4b1714e89dbd67872444340ebce9c64260ee3f440cde8ac`.
- **Nouvelles sources** : série authentique de 5 photos prises le 21 juillet 2024 en Guinée, `Les Orpailleurs du Quotidien 01–05`, auteur LincolnGN/Wikimedia Commons, **CC BY-SA 4.0** ([sources](https://commons.wikimedia.org/wiki/Category:Gold_panning_in_Guinea)). **Attention à l'attribution, aux transformations signalées, à l'obligation de partage dans les mêmes conditions selon la licence et à la revue juridique si publication**. Elles illustrent l'orpaillage antérieur, PAS les affrontements de 2026. Également, deux vraies pages du communiqué officiel guinéen du 12 novembre 2026 ([texte original](https://gouvernement.gov.gn/wp-content/uploads/2026/11/COMMUNIQUE-NA%C2%B0-008-MATD-CAB-2026-DU-GOUVERNEMENT-RELATIF-AUX-EVENEMENTS-SURVENUS-LE-11-NOVEMBRE-2026-A-BALATO-PREFECTURE-DE-KINTINIAN-DU-12112026.pdf)).
- **Design** : typographie Space Grotesk/DM Sans acceptée conservée, photographie plein cadre et déplacements lents, contenu unique à chaque scène, plus de pages noires vides ou d'incrustations techniques « ILLUSTRATION ». Communiqué mis en scène sans inventer de victimes ou de barricades.
- **QA obligatoire avant livrer** : inspection d'un contact sheet 16 photogrammes, vérification du changement effectif scène par scène (les premières captures montrent des différences visuelles de 42 à 97 niveaux de pixels pour les 13 scènes ; les 3 conservées ~0–1), conservation EXACTE du flux AAC, durée <60 secondes, contrôle des sources et droits. CI réussite n'implique PAS une approbation artistique.
- **Lecteur iPhone V3** : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/guinee-siguiri-v3-2026-11-14/index.html — ne le déclarer accessible qu'après l'exécution GH Actions validée.
- On ne doit plus faire de fausses améliorations cosmétiques à la place de la demande précise. **Les retours négatifs de l'utilisateur sont contractuels, pas de simples préférences.**


## GUINÉE/SIGUIRI — CORRECTIONS V2 APRÈS RETOUR UTILISATEUR (14/11/2026)

L'utilisateur a rejeté la V1 : **Vivienne trop lente, trop robotique et hachée**, blancs entre morceaux TTS, images trop statiques et peu parlantes, labels techniques « ILLUSTRATION »/« PHOTO USAID », logo blanc incongru à la fin. **Deux validations à préserver : la typographie Space Grotesk/DM Sans et le vrai plan vidéo de l'homme qui frappe/travaille dans la mine.**

### Version V2 vérifiée techniquement
- Branche dédiée : `feature/worldvision-guinee-siguiri-v2-voice-endcard-2026-11-14` et [PR #25](https://github.com/OBIANG5/World-Health-Vision/pull/25) (brouillon).
- Lecteur iPhone : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/guinee-siguiri-v2-2026-11-14/index.html
- MP4 **réel** : 47,133 secondes, 1080×1920, H.264/AAC ; SHA-256 `7fd2082b086f570c046d9595db2c0fc8e0705accb9177da71e7712b6504f39b2`. [CI réussi](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43610939312).
- **Script verrouillé inchangé** : SHA-256 `0d0e268a9f189b9ae4b1714e89dbd67872444340ebce9c64260ee3f440cde8ac`.
- Vivienne `fr-FR-VivienneMultilingualNeural` : **une prise intégrale** sans assemblage de phrases ; trois variantes A (148,11 mots/min), B (159,96), C (168,36), accessibles sur la page du lecteur. A utilisée par défaut, mais cela ne vaut pas approbation humaine définitive.
- Ancien carré blanc totalement supprimé, ainsi que les incrustations techniques. Police et homme au marteau préservés. Fin remplacée par une signature bleu cyan pleine hauteur.
- **Original de signature fourni par le propriétaire** : MP4 **3 sec / 512×910 / 30 fps**, SHA-256 `b1a875dd2611e2fc1e10f9f233b8e42d7065faacaecdc520c52af72c90e7d855`, **archivé dans Canva, asset vidéo `VAHa58Do0Cc`**. Important : le MP4 V2 GitHub utilise **une vidéo de trois secondes reconstruite à partir d'un photogramme de cette signature**, pas encore le mouvement exact des 90 images du MP4 original. Ne jamais prétendre le contraire. La version originale réencodée en 1080×1920 a également été générée dans le chat de l'utilisateur. À l'étape suivante, privilégier les octets de la vidéo originale pour l'export final, ne plus reconstruire de photo fixe.
- Les licences TTS commerciales `edge-tts` restent non confirmées. L'export V2 est une version de relecture, non une autorisation automatique de publier.

**Priorité artistique suivante :** davantage de rushes réels pertinents à la Guinée/Siguiri, mieux articuler les relances visuelles avec les faits et obtenir une narration réellement humaine. Le test technique vert ne signifie pas que l'utilisateur a aimé la vidéo. Ne jamais réduire ces critiques au seul débit.


## LIVRABLE VÉRIFIÉ — GUINÉE/SIGUIRI — VIDÉO 02 (14 NOVEMBRE 2026)

- **Vrai MP4 de relecture produit et accessible sur téléphone**, 51,733 secondes, vertical 1080×1920/30fps, H.264/AAC : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/guinee-siguiri-2026-11-14/index.html?revision=028ca808
- Hash du fichier effectivement rendu : `028ca808171133af83d37a9a66728c823e8173bf34d823dbc69e2b71b0a56d17`. [Exécution CI/QA réussie](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43607767094), y compris **validateur multi-épisodes**.
- Script **exactement celui choisi par l'utilisateur**, 10 paragraphes, SHA `0d0e268a9f189b9ae4b1714e89dbd67872444340ebce9c64260ee3f440cde8ac`; source dans `feature/worldvision-guinee-siguiri-v1-2026-11-14`, [PR #22](https://github.com/OBIANG5/World-Health-Vision/pull/22) en brouillon.
- Narration : **Vivienne** `fr-FR-VivienneMultilingualNeural`, débit **126,52 mots/minute**, sans accélération audio artificielle, pauses segmentées ; ce débit ne signifie pas que l'utilisateur a approuvé la naturalité vocale.
- **Quinze plans**, dont globe NASA animé vers la Guinée, deux plans de **vraie vidéo** libre Pexels de gestes miniers (illustrations tournées hors des affrontements), des photos d'archive USAID de Siguiri et des graphiques factuels. Une planche de **douze** photogrammes a été examinée dans les outils, avec vérification des deux plans vidéo. Le vrai lieu des images et licences est consigné dans `manifest.json`.
- Documentation transversale mise à jour : `worldhealth-vision-v2/docs/media/VOICE_REFERENCE.md` et `worldhealth-vision-v2/docs/media/EDITORIAL_VIDEO_QUALITY_GATES.md`. Le contrôle réutilisable `worldhealth-vision-v2/services/media-renderer/scripts/validate_worldvision_short.py` a été ajouté **à cette branche mère media-studio** pour toutes les futures vidéos. Bloque script modifié, master silencieux, vitesse hors plage, plans fixes trop longs, absence de sources et diffusion présumée sans licence.
- **Statut** : validé **techniquement**, encore **non validé artistiquement ni pour publication commerciale** ; ne pas écrire « version définitive approuvée ». Extraits Reuters/AP/TV5MONDE non copiés dans le MP4 car droits non établis. Les plans miniers Pexels sont des illustrations et non des images des morts de Balato.
- Future reprise ChatGPT : **ne pas refaire une production à zéro**, lire la PR #22 et les commentaires du propriétaire à venir ; reprendre ce moteur et ses 15 plans, améliorer ce qui ne convainc pas, sans jamais modifier le script à son insu.


## NOUVELLE VIDÉO EN COURS — GUINÉE / BALATO / SIGUIRI, 14 NOVEMBRE 2026

Le propriétaire a **choisi définitivement comme narration** le dernier script retravaillé de la version 2 sur les affrontements de Balato. **Ne pas réécrire.** Script exact : [SCRIPT_LOCK_V1.json](https://github.com/OBIANG5/World-Health-Vision/blob/feature/worldvision-guinee-siguiri-v1-2026-11-14/worldhealth-vision-v2/docs/media/episodes/2026-11-14_guinee_siguiri/SCRIPT_LOCK_V1.json), SHA-256 : `0d0e268a9f189b9ae4b1714e89dbd67872444340ebce9c64260ee3f440cde8ac`, 109 mots, dix segments. Ouverture exacte : « Dix morts. Treize blessés. En Guinée, une opération contre l’orpaillage illégal a tourné au drame. »

**Branche dédiée** : `feature/worldvision-guinee-siguiri-v1-2026-11-14` ; [PR #22](https://github.com/OBIANG5/World-Health-Vision/pull/22) en brouillon. Moteur Python : `worldhealth-vision-v2/services/media-renderer/scripts/worldvision_guinee_siguiri_v1.py`. CI : `.github/workflows/worldvision-guinee-siguiri-v1.yml`. Nouveau lecteur iPhone après succès : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/guinee-siguiri-2026-11-14/index.html . Toute vidéo créée pour revue uniquement, pas de licence commerciale voix acquise, pas de publication autorisée automatiquement.

**Retours auteur à appliquer obligatoirement :** précédente vidéo Soudan du Sud publiée notée 4–5/10 ; voix Vivienne **trop rapide, pas assez émotionnelle/humaine** ; photos peu parlantes, montage sans véritable accroche émotionnelle. Pour la Guinée : voix Vivienne plus lente avec pauses naturelles **sans accélération artificielle**, vrai globe NASA vers Balato/Siguiri dès l'ouverture, meilleurs plans réellement utiles aux phrases, image de Siguiri documentée USAID domaine public, illustrations extérieures aux événements clairement tracées, aucune fausse scène de violence. Le bilan de dix morts et treize blessés est **provisoire** et attribué aux autorités, cinq morts étrangers non identifiés ; enquête en cours.

Mise à jour de l'état du run et du MP4 **uniquement après vérification GitHub**. Les fichiers de preuve et crédits doivent rester dans le dossier de production. Ne pas modifier la vidéo Soudan du Sud et ne pas empiéter sur l'autre production Shenzhen.


## RETOUR APRÈS PUBLICATION — 14 NOVEMBRE 2026, À LIRE AVANT LA PROCHAINE VIDÉO

La vidéo Soudan du Sud V3 a **été publiée par le propriétaire** ; **note propriétaire 4–5/10** (l'ancienne mention « non publiée » n'est plus à jour). **Ne pas refaire l'épisode**, préparer un sujet différent choisi parmi la liste d'origine (notamment #9 Guinée/Siguiri, #8 Kenya/Syokimau, #6 Guinée équatoriale/Jesús Owono). Avant toute nouvelle production, **abandonner la cadence Vivienne trop rapide : viser une voix plus humaine, plus lente, plus expressive, sans compression artificielle, et mieux synchroniser émotion, preuve et image.** Les images de l'épisode précédent ont été jugées insuffisamment évocatrices. Choisir des images vérifiables, fortes, pertinentes et légalement réutilisables ; ne pas fabriquer de faux documents d'actualité. Un outil qui exporte un MP4 ne garantit pas un reportage regardable : validation artistique distincte.

La règle complète est dans `worldhealth-vision-v2/docs/media/EDITORIAL_VIDEO_QUALITY_GATES.md` sur `feature/worldvision-south-sudan-v3-locked-vivienne-2026-11-14`; consigner chaque nouvelle note dans l'[Issue #18](https://github.com/OBIANG5/World-Health-Vision/issues/18). La vidéo a été publiée par l'utilisateur mais **la situation des droits du test TTS Vivienne reste distincte** ; ne pas déduire une licence de cette publication.


## DERNIER RENDU DU SOUDAN DU SUD — V3 VIVIENNE (14/11/2026)
- **MP4 effectivement généré et accessible sur iPhone**, 22,367 secondes, H.264/AAC 1080×1920, 30 i/s : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/south-sudan-editorial-v3/index.html
- Le script original est **strictement verrouillé et vérifié en CI** (SHA `a5104cedab538771d1c649da242c7b32b4f438514a4230d3e5bb31628139afb9`). Voix **Vivienne** (`fr-FR-VivienneMultilingualNeural`). Globe géographique approuvé de la V2 intact, les 3 premières secondes.
- Une photo différente de la mère et de son enfant pendant l'indépendance à Juba en 2011 (USAID, domaine public) a remplacé le plan de drapeau répétitif à la fin. Le montage vidéo et les médias originaux générés restent distincts ; deux ressources créatives sont enregistrées dans Canva, dont `MAHa5OsUdj4`, mais ne sont **PAS automatiquement intégrées au MP4**.
- Vérification la plus récente du rendu : https://github.com/OBIANG5/World-Health-Vision/actions/runs/43598471386 — SUCCESS ; manifeste MP4 SHA256 `69c893be34941c418b695858dba78665265d03635dc70e84872b398de065579a` ; contact-sheet 9 images consulté ; revue artistique propriétaire **non validée**, publication **non autorisée**.
- Attention licence : la narration Edge Read Aloud via `edge-tts` ne vaut pas le droit de publier commercialement. Microsoft n'accorde explicitement l'usage commercial des voix prédéfinies qu'aux clients du [TTS payant d'Azure](https://www.microsoft.com/licensing/terms/en-US/product/MicrosoftAzure/all). Le master doit recevoir une piste valablement licenciée avant diffusion ; consulter `worldhealth-vision-v2/docs/media/VOICE_REFERENCE.md` sur branche V3.
- Historique de la refonte : [PR #19](https://github.com/OBIANG5/World-Health-Vision/pull/19) (brouillon), [Issue transversale #18](https://github.com/OBIANG5/World-Health-Vision/issues/18). **Ce travail ne doit PAS écraser la production Shenzhen d'une autre branche.**


## MISE À JOUR TRANSVERSALE — RETOURS AUDIOVISUELS DU 14 NOVEMBRE 2026 (TOUTES LES VIDÉOS)

**Ce bloc s'applique aussi au reportage Shenzhen et à tous les futurs épisodes, indépendamment de la branche de montage.** L'utilisateur a critiqué les montages précédents : le système doit mémoriser ses choix et ne plus changer silencieusement les scripts.

- **Voix préférée choisie par l'utilisateur : Vivienne** (identifiant de référence `fr-FR-VivienneMultilingualNeural`). La voix est une référence de direction vocale, **pas une licence de diffusion commerciale**. Kokoro `ff_siwis` et Remy ne sont plus des défauts acceptables. [Écouter l'échantillon Vivienne](https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/south-sudan-editorial-v2/voice-auditions/vivienne.mp3).
- **Soudan du Sud : le script V1 original est VERROUILLÉ mot pour mot**, SHA `a5104cedab538771d1c649da242c7b32b4f438514a4230d3e5bb31628139afb9`. Ne jamais remplacer par la réécriture V2. Toute modification requiert l'accord explicite du propriétaire.
- **Globe V2 réel validé** en ouverture 0–3 secondes : conserver ce clip géographique lors des prochains tests, sans refaire de CGI fictif. Pas de logo en cartouche blanc permanent, de grande date isolée sur beige, de polices arbitraires, ni de mentions techniques incrustées.
- **Documents canoniques sur branche V3** : [VOICE_REFERENCE.md](https://github.com/OBIANG5/World-Health-Vision/blob/feature/worldvision-south-sudan-v3-locked-vivienne-2026-11-14/worldhealth-vision-v2/docs/media/VOICE_REFERENCE.md) ; [EDITORIAL_VIDEO_QUALITY_GATES.md](https://github.com/OBIANG5/World-Health-Vision/blob/feature/worldvision-south-sudan-v3-locked-vivienne-2026-11-14/worldhealth-vision-v2/docs/media/EDITORIAL_VIDEO_QUALITY_GATES.md) ; [script gelé](https://github.com/OBIANG5/World-Health-Vision/blob/feature/worldvision-south-sudan-v3-locked-vivienne-2026-11-14/worldhealth-vision-v2/docs/media/episodes/2026-11-14_south_sudan_elections/SCRIPT_LOCK_V3.json).
- **Point d'entrée cross-branches permanent : [GitHub Issue #18](https://github.com/OBIANG5/World-Health-Vision/issues/18)**. V3 isolée en PR #19, pas de publication sans validation humaine ni licence voix.
- Pour les nouvelles productions Afrique : Guinée/Siguiri, Kenya/Syokimau, Guinée équatoriale/Jesús Owono : lire Issue #18 et le registre voix **avant** de commencer.


## PRIORITÉ ACTUELLE — S03 SHENZHEN V2 VÉRIFIÉ, ENCHAÎNEMENT À 43 S (14/11/2026)

**Commande utilisateur actuelle :** montage d'actualité premium **une vidéo courte à la fois**, et **chaque séquence autonome contrôlée avant assemblage**. Séquence dramatique obligatoire : **S01 vrais portraits Trump/Poutine/Xi → S02 image World-Vision D00-v6 ORIGINALE → S03 le globe tourne réellement depuis l'Afrique vers Shenzhen → S03b vrai visuel de la ville → reste du reportage sur le nucléaire/Iran/Ukraine → signature World-Vision**. Débit normal, 30 images/s, environ **43 secondes** AU TOTAL (surtout pas 3–4 minutes) ; pas de fausse conférence ou faux bâtiments.

**Faits revérifiés le 14 novembre 2026 :** la Maison-Blanche annonce la rencontre trilatérale le **jeudi 19 novembre 2026** en marge de l'APEC, et la diplomatie chinoise confirme l'APEC à **Shenzhen** les 18–19 novembre. **La salle/l'adresse précise de la rencontre ne sont PAS confirmées**. L'animation vise donc **le centre géographique de la ville (22.5431°N, 114.0579°E)**, pas un bâtiment inventé. Sources : https://www.fmprc.gov.cn/eng/xw/wsrc/202611/t20261113_12058556.html ; https://www.afp.com/en/trump-xi-putin-hold-historic-meeting-china-white-house-0.

**VRAIS LIVRABLES vérifiés, pas des promesses :**
1. **S01 HOOK** 4,5 s H264 1080×1920 : vrais portraits photographiques, logo G0 officiel, MP4 sur branche \`whv-media-studio-browser-preview/media-lab/summit-2026/hook-4p5s-preview.mp4\`. Sans narration, non approuvé définitivement.
2. **S02 D00-v6** 3,1 s H264 1080×1920, SHA-256 \`95c47d1a94a1d0487e5b8f2d4c622bedcf6bad980938947ac003be34a8f8ea2a\` ; VRAIE image originale D00-v6 non reconstruite (SHA-256 \`8d9a9d20f20fbf7757713b6f5eab06590f191166eb779865747f0f59683cfca2\`), mouvement de caméra sans rotation fictive, archivé Canva ID \`VAHa4ZT_ySo\`.
3. **S03 NASA véritable rotation vers Shenzhen V1** janvier 4,9 s, SHA-256 \`6bfb45a57794c7dbfc7dc9af9ddb818c67eae327f60216b46bf32f0afb7ba10e\`, QA passée, mais trop enneigé visuellement.
4. **S03 améliorée JULY V2** 4,9 s, **147 frames/30fps 1080×1920**, SHA-256 **\`1e49e5b6dc36c9dde2494253a8ee5c2b426863bed7fd33cd0cd24b4012be4558\`**, NASA July topo 5400×2700 SHA \`85a24885616097b5e06532b7d8e30fa5d749a782e70ea55971dd8539a0899206\`, Natural Earth GeoJSON SHA \`392a03db8aa3ba82c105852655620129b11182b95dfc34ef046827ea7d0e5b8c\`. **Run GitHub Actions #43582938864 = SUCCESS**. Quatre images de contrôle vraiment inspectées ; V2 donne une Eurasie plus verte et cohérente avec D00. **Canva archive média S03 V2 ID \`VAHa4gCj5SQ\`**, import vérifié. **ATTENTE validation artistique utilisateur**, aucun son encore, non publié.
5. Le **fichier exact du logo officiel G0** dans renderer Git blob \`bc80fa70cebd566768bfb1703a0f1f636a78c196\` est contrôlé et utilisé (jamais redessiné).

**LIENS :**
- Vidéo S03 V2 : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/summit-2026/segment03-shenzhen-july-v2-4p9s.mp4
- Contact sheet 4 photogrammes S03 V2 : https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-lab/summit-2026/review-s03-july-v2/contact-sheet.jpg
- Ancienne vidéo S03 V1 gardée sur branche preview pour comparaison ; ne pas effacer.
- Code source S03 : \`worldhealth-vision-v2/services/media-renderer/scripts/worldvision_segment03_shenzhen.py\`.
- Workflow de build/QA mobile : \`.github/workflows/whv-summit-shenzhen-s03.yml\`.
- Journal d'état 8 clips : \`docs/media/episodes/2026-11-14_trump_xi_putin_shenzhen/SEGMENT_LEDGER.json\` (v2 retenue comme candidate).
- **NOUVELLE EDL** \`docs/media/episodes/2026-11-14_trump_xi_putin_shenzhen/EDL_V2_FAST_GLOBE.md\` : S01 4,5s, **extrait S02 0,9s à 1×**, **extrait S03 4,4s à 1×**, futur vrai plan de Shenzhen 2,7s ; suite 12,5s–43s inchangée. **La source n'est pas accélérée, seulement recadrée temporellement.**
- Remotion master existant \`services/media-renderer/src/WorldVisionSummit2026.tsx\` et script \`render-summit-preview.mjs\` ont été raccordés aux **vraies vidéos S02 + S03 V2** avec empreintes SHA exigées ; pas de substitution de globe. La composition finale à ~43 s reste NON RENDUE, car fichiers source n'ont pas encore été installés en binaire dans le repo/renderer et **voix FR approuvée absente**.

**Prochain travail utile :** recueillir avis artistique sur S03 V2 et sur cohérence S02→S03 ; sélectionner vrai plan de Shenzhen 2,7s aux droits confirmés ; **produire le prochain clip autonome S04** (enjeux nucléaires) en motion design soigné ; préparer audition de voix française (2–3 voix) puis calage syllabique des 13 sous-titres ; exporter 43s seulement APRÈS ces validations. Ne pas coder un nouvel éditeur, ne pas réinventer une Terre, ne pas produire un clip sur une autre actualité sans accord.

**Ce qui manque honnêtement :** V2 non encore approuvée artistiquement par l'utilisateur, pas de voix/audio à écouter, pas de vidéo finale 43 s. L'original D00 existe en fichier chat et Canva ; son binaire original n'est pas committé dans GitHub. Les deux clips S02/S03 sont stockés dans Canva mais leur insertion en tant que fichiers locaux dans le renderer final devra être réalisée avant le master.

---


## 14 NOV 2026 — NOUVELLE MÉTHODE VALIDÉE : UN CLIP À LA FOIS, PUIS ASSEMBLAGE

**Instruction utilisateur prioritaire :** arrêter de vouloir tout rendre d'un seul bloc. Construire **huit petites vidéos indépendantes**, chacune très bien montée/contrôlée/revue, avec code ponctuel lorsque plus beau (sans réinventer le globe). **Assembler seulement les séquences validées.** La ligne éditoriale reste la vidéo approuvée dans le chat sur le sommet annoncé Trump–Poutine–Xi du 19 novembre 2026.

**Livrables concrets vérifiés cette session :**
- **S02 identité D00-v6 : film MP4 de 3,1 secondes, H.264 1080×1920, 30fps, 93 images, animé et non statique.** Image originale exactement conservée en entrée (SHA-256 `8d9a9d20f20fbf7757713b6f5eab06590f191166eb779865747f0f59683cfca2`). Mouvement caméra discret + respiration cyan, sans reconstruire la planète ni prétendre une rotation réelle. **MP4 SHA-256 `95c47d1a94a1d0487e5b8f2d4c622bedcf6bad980938947ac003be34a8f8ea2a` ; 2 688 754 octets**, vérifié par FFprobe et lecture 93 frames. Résultat visuel contrôlé sur contact-sheet 3 images.
- Code générateur autonome committé : `worldhealth-vision-v2/services/media-renderer/scripts/worldvision_segment02_globe.py` (exige SHA exact D00 original, produit vidéo MP4 + manifeste). **N'a pas besoin d'un nouvel éditeur** ; FFmpeg/OpenCV/Pillow.
- **Clip S02 archivé dans Canva utilisateur connecté** (véritable vidéo, media ID `VAHa4ZT_ySo`, nom `World-Vision — S02 D00-v6 globe cinématique original — 3,1 s`). L'image source D00 original est également dans Canva sous `MAHa4F1Owfk` et le logo officiel G0 sous `MAHa4H6Rel4`.
- Traçabilité de chaque plan : `docs/media/episodes/2026-11-14_trump_xi_putin_shenzhen/SEGMENT_LEDGER.json`, S01 hook 4,5 s déjà vérifié sur branche preview, S02 3,1 s créé localement+Canva, S03–S08 restent à produire, montage cible total **43 s**, les timecodes sont PROVISOIRES jusqu'à voix FR approuvée.

**Liens locaux pour ce chat** (peuvent ne pas survivre aux nouveaux chats ; Canva est l'archive persistante) :
- `sandbox:/mnt/data/WorldVision_S02_Globe_D00_3s.mp4`
- `sandbox:/mnt/data/WorldVision_S02_contact_sheet.jpg`
- `sandbox:/mnt/data/worldvision_segment02_globe.py`

**Qualité et limites :** le film est un plan original avec faible zoom, **PAS** une rotation géographique de la Terre, ni une simulation de trajet vers Shenzhen. Aucun son/voix dans le clip ; on synchronisera à la voix quand les huit vidéos seront faites. Le logo officiel se trouve déjà dans la composition générale et doit rester inchangé. S02 est **soumis à revue artistique utilisateur**, pas « approuvé pour publication ». **Le montage intégral et sa narration n'existent pas encore.**

**PROCHAIN CLIP S03 (7,6–12,5 s, 4,9 s)** : construire **une vraie localisation de Shenzhen en Chine avec une carte exacte** et typographie/motion design bleu nuit/cyan compatible World-Vision. Ne pas reprendre la vieille carte plate, les logos emoji ni une vidéo de ville non autorisée. Fournir un MP4 de 4,9 s, ses images de contrôle, le code GitHub et son état d'approbation. Ne pas démarrer autre chose avant de récolter une appréciation du clip S02, sauf si utilisateur demande explicitement de poursuivre.

---


## 14 NOVEMBRE 2026 — SOMMET TRUMP XI POUTINE : PREMIER HOOK EN VRAI MP4 ET MONTAGE 43 S CODÉ

**Instruction actuelle du propriétaire** : construire **un montage professionnel** basé sur le script accepté, pas seulement du texte ni un nouvel éditeur. Le style de marque doit reprendre le **PNG logo G0 officiel** exact et le visuel **D00-v6 original** pour une brève introduction. Le sommet du 19 novembre à Shenzhen **n'a pas encore eu lieu** ; utiliser des archives explicitement étiquetées, aucune fausse scène de sommet.

**Vrai code et premier artefact produit :**
- Composition Remotion professionnelle séparée `services/media-renderer/src/WorldVisionSummit2026.tsx` (8 plans, 43 secondes, 13 segments de sous-titres reprenant mot à mot le script, photos d'archives, typographie bleu nuit/cyan, zones sûres, logo exact ; **aucune couleur rose/orange de l'ancien template**).
- Entrée ajoutée à `services/media-renderer/src/Root.tsx` sans écraser l'ancien moteur.
- `services/media-renderer/render-summit-preview.mjs` (vidéo 1080×1920 à 30fps, vérification du Git blob du logo `bc80fa70cebd566768bfb1703a0f1f636a78c196`, SHA-256 D00 attendu `8d9a9d20f20fbf7757713b6f5eab06590f191166eb779865747f0f59683cfca2`, master complet bloqué si assets D00 originaux et voix WAV approuvée manquent).
- `.github/workflows/whv-summit-hook-preview.yml` (téléchargement des vrais portraits à licences vérifiées, build Remotion, 3 captures FFmpeg, publication même branche d'aperçu). **Hook corrigé et livré** via `media-lab/summit-2026/hook-4p5s-preview.mp4` sur `whv-media-studio-browser-preview`, MP4 de **4,5 s 1080×1920, sans voix**, SHA-256 `8e0975eb2fe66cb502271d23c542b120271f9b9d3df989306dd2840a1e1bf05a` au premier contrôle après correction des collisions. Capture `media-lab/summit-2026/review/contact-sheet.jpg`.
- Test de conservation **mot à mot du script** dans `summit-2026-contract.test.mjs`, comparé avec `docs/media/episodes/2026-11-14_trump_xi_putin_shenzhen/SCRIPT_V1.md` ; 13 segments, aucune coupure du texte, 43 secondes. Contrôle unitaire également ajouté au workflow ; les dernières exécutions doivent être vérifiées avant d'affirmer vert.
- SRT préparatoire `SOUS_TITRES_BROUILLON_43S.srt` sur le dossier d'épisode, **non encore aligné à une vraie voix**, 13 sous-titres.
- Import **sans redessin** dans Canva connecté : original globe D00-v6 Canva media `MAHa4F1Owfk`, logo officiel exact téléchargé depuis Github Canva media `MAHa4H6Rel4`. Importation GDrive depuis l'ancien file-ref non aboutie : ne pas prétendre D00 dans Drive ou en binaire dans Github.

**Preuves et limites** :
- Premier hook animé a été généré par l'action [#43579184494](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43579184494), statut **success** : trois images vérifiées avec logo officiel exact et portraits de Trump, Poutine et Xi ; collision texte/labels corrigée et rerendu par l'action [#43579354004](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43579354004) success.
- Le **master 43 s n'existe PAS** à ce stade : le rendu est volontairement bloqué tant que l'image D00 originale n'a pas été **copiée en tant que binaire exact dans l'asset du renderer**, et la vraie voix française choisie/validée n'est pas fournie.
- Photos Reuters/AP sous licence **non utilisées** dans le hook ; photos d'archives d'origine White House / Kremlin téléchargées par Github Action, attributions dans `MONTAGE_PLAN_V1.md`.
- L'audition/choix de voix française et l'alignement réel des sous-titres restent à faire. Aucun MP4 n'est approuvé pour publication.

**LIENS** :
- Vidéo hook https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/summit-2026/hook-4p5s-preview.mp4
- Dossier storyboard https://github.com/OBIANG5/World-Health-Vision/blob/feature/world-vision-media-studio/worldhealth-vision-v2/docs/media/episodes/2026-11-14_trump_xi_putin_shenzhen/MONTAGE_PLAN_V1.md

**Suite obligatoire (pas une autre refonte)** : revue qualitative du hook et correction ; intégrer le PNG D00-v6 ORIGINAL **une seule fois** au renderer, générer/tester une vraie voix française via outil Google accessible puis produire tout le master Remotion de 43 s, aligner SRT sur WAV, QA iPhone et rendre à l'utilisateur. **Ne jamais remplacer l'image par une reconstruction du globe.**

---

## PRIORITÉ ACTUELLE — MONTAGE D'UNE VIDÉO À LA FOIS (13/11/2026)

**Cette décision du propriétaire prévaut sur la priorité n8n/Shotstack et les pilotes refusés plus bas dans l'historique.** La recherche des nouvelles est **SÉPARÉE** du montage : tâche ChatGPT World-Vision existante (`6a9050fddd5c8191929b1f8cfa8d0f3e`) **réactivée**, horaire, filtrée pour actualités majeures et seules nouveautés significatives. L'utilisateur choisit le sujet et valide le script avec nous. **LE TRAVAIL PRINCIPAL DE CE PROJET EST LE MONTAGE PROFESSIONNEL À PARTIR DU SCRIPT APPROUVÉ**.

**Guide canonique à lire en premier pour le futur monteur** : [MONTAGE_ONLY_HANDOFF_2026-11-13.md](worldhealth-vision-v2/docs/media/MONTAGE_ONLY_HANDOFF_2026-11-13.md). Le dépôt possède **déjà** `services/media-renderer/src/WorldVisionShort.tsx` (Remotion : images, vidéos, audio, scènes, citations et logo), `services/media-renderer/server.mjs`, un PNG du logo officiel dans `services/media-renderer/public/brand/world-vision-official.png` ; ne pas reconstruire l'éditeur. Exploiter Google Flow pour les scènes d'ouverture à partir de la référence D00-v6 (après vérification du rendu) et Google Vids en français pour voix/retouches sur ordinateur, puis Remotion/FFmpeg pour le master MP4 9:16 et QA.

**G0 logo bleu officiel et D00-v6 concept du globe/œil : incontournables.** Le PNG original D00-v6 n'a pas encore ses octets dans GitHub ; son mouvement n'est pas encore validé : ne pas reprendre les CGI de démonstration comme intro finale. L'utilisateur n'a pas donné le prochain script approuvé. **Aucune nouvelle vidéo n'est déclarée finie.**

**n8n Radar JSON et étude Shotstack** restent archivés mais **hors chemin critique**. Aucun n8n à acheter ou ouvrir pour débuter ; la tâche ChatGPT couvre la veille horaire.

---

## DÉCISION PRIORITAIRE DU 13 NOVEMBRE — AUTOMATISATION ET IDENTITÉ, FIN DU PILOTE MANGROVES

**C'est désormais le point de reprise ACTUEL ; il annule les anciennes mentions « pilote mangroves actif » et « continuer à coder le globe » figurant plus bas dans l'historique.** L'utilisateur a **rejeté** l'actualité NASA mangroves comme insuffisamment marquante. Il exige : **(1)** sélection de **3 à 5 actualités mondiales majeures** avec classement/validation, **(2)** logo bleu œil-globe officiel et globe D00-v6 intégrés à chaque production pertinente, **(3)** **un centre de production automatisé**, sans ouvrir une multitude de sites, **(4)** usage des meilleurs logiciels existants au lieu de tout recoder.

**Livrables réellement nouveaux** : [AUTOMATION_COCKPIT](worldhealth-vision-v2/automation/WORLD_VISION_AUTOMATION_COCKPIT.md), [workflow n8n importable RADAR](worldhealth-vision-v2/automation/n8n/world-vision-radar-v1.n8n.json), [contrat de marque obligatoire](worldhealth-vision-v2/automation/brand/WORLD_VISION_BRAND_LOCK.json). Le workflow lit 4 flux RSS et classe des candidats toutes les heures ; **non importé/activé sur une instance n8n** faute de compte connecté. n8n est l'orchestrateur envisagé, Shotstack (ou Creatomate si meilleur test) le moteur vidéo à templates ; Google Drive conserve les assets, Gemini/API et TTS sont des intégrations à connecter séparément. Google Flow Pro **n'ouvre pas d'accès API inclus** et ne peut pas être annoncé comme automatisé.

**État actuel, sans surpromesse** : code de workflow/documentation versionné dans GitHub, **aucune plateforme n8n ni moteur Shotstack connecté**, aucun nouveau MP4. L'ancien pilote mangroves a été marqué **REFUSÉ** dans son dossier et ne doit pas être poursuivi. L'image D00-v6 (SHA-256 `8d9a9d20f20fbf7757713b6f5eab06590f191166eb779865747f0f59683cfca2`) existe en conversation et n'a pas encore ses octets committés à GitHub ; sa validation comme ouverture vidéo reste à obtenir.

**Prochaine action réelle** : l'utilisateur active/autorise une instance n8n Cloud d'essai, importe le workflow existant, vérifie les sources/classements puis connecte une file d'approbation. Ensuite un modèle vidéo World-Vision sous Shotstack/Creatomate avec assets de marque, voix, rendu, QA et permissions de publication.

---



## PILOTE REPORTAGE #001 — MANGROVES NASA, SCRIPT ET STORYBOARD (13 NOV 2026)

**La nouvelle méthode multi-outils a réellement démarré sur un sujet d'actualité vérifié.** Sélection : NASA Earth Observatory, 13 novembre 2026, « A Global Rebound for Mangroves ». La NASA compare deux images Landsat de la côte du Myanmar en 2010 et 2026 et résume la reprise mondiale depuis 2010, tout en signalant des pertes persistantes dans le delta du Niger. Recherche croisée avec Tulane University (4 juin 2026) et NOAA.

**Livrables GitHub** : [Dossier de production complet avec 6 plans, vrais médias NASA/NOAA, source fact-check, voix, scénarisation et choix outils](worldhealth-vision-v2/docs/media/episodes/2026-11-13_mangroves_nasa/PRODUCTION_PACK.md) ; [texte voix off FR V1](worldhealth-vision-v2/docs/media/episodes/2026-11-13_mangroves_nasa/voix_off_fr_v1.txt).

**Stade réel :** RADAR/VERIFY/SCORE terminés, script **provisoire** et storyboard terminés, liens vers assets authentiques identifiés ; **pas de vraie voix auditionnée, pas de montage Vids/CapCut, pas de MP4 de ce reportage et aucune publication**. Ne pas confondre avec le micro-clip technique Gabon D01. Pour cet épisode, **Google Flow volontairement écarté** : il y a déjà de vraies images NASA et le code de globe n'est pas nécessaire.

**Prochain livrable à réaliser :** audition voix FR sur le même extrait avec Google Vids si ordinateur, ou voie mobile accessible si iPhone seul ; enregistrer ensuite les deux JPEG originaux NASA (6,23 et 3,56 Mo), montage en six scènes et export complet. Le workflow général des 137 pages est dans [WORLD_VISION_PRODUCTION_CONDUCTOR_2026-11-13.md](worldhealth-vision-v2/docs/media/WORLD_VISION_PRODUCTION_CONDUCTOR_2026-11-13.md).

---


## 13 NOV 2026 — CONDUCTEUR MULTI-OUTILS PRIORITAIRE POUR LA PREMIÈRE VIDÉO COMPLÈTE

**Nouvelle décision stratégique :** le propriétaire ne veut plus de prototypes CGI isolés. Il demande un système fidèle au manuel original de 137 pages, utilisant les **meilleurs outils réellement accessibles** à chaque étape via **ChatGPT Plus + Google AI Pro** : choix d'un fait réel → script sourcé → storyboard → véritables rushes → voix française naturelle → plans illustratifs Flow si utiles → **montage complet dans Google Vids 9:16** → SRT/FFmpeg → contrôle iPhone → MP4 et archivage. **Ne pas passer du temps à réécrire un moteur de montage complet tant que cette filière suffit.**

**Guides canoniques créés :**
- [Conducteur complet multi-outils, 9 parties du PDF, 14 étapes de production, outils, critères, coûts, limites](worldhealth-vision-v2/docs/media/WORLD_VISION_PRODUCTION_CONDUCTOR_2026-11-13.md).
- [Modèle à dupliquer pour chaque nouvelle vidéo, script, storyboard, voix, preuves, médias et étapes](worldhealth-vision-v2/docs/media/WORLD_VISION_EPISODE_TEMPLATE.md).

**Capacités officiellement vérifiées, mais aucun accès personnel à supposer :** Google AI Pro inclut Google Vids avec voix IA FR et projets 9:16, Flow 1 000 crédits/mois (+ crédits quotidiens selon source Google), AI Studio Gemini indépendant pour API ; **ChatGPT Plus n'inclut pas automatiquement l'API OpenAI**. Google Vids s'exporte en MP4, mais **ses sous-titres automatiques documentés sont en anglais** ; pour le français, envisager SRT aligné par Whisper et QA. Ne pas imposer ElevenLabs payant à la première vidéo.

**Statut :** conducteur créé/archivé dans GitHub, **pas encore de reportage complet produit par ce processus**. La vidéo technique D01-Gabon existe mais n'a pas de faits, de voix, de montage ni d'approbation artistique. **Prochain vrai objectif : UN épisode d'actualité réel et complet de 40 à 50 s**. L'épisode commence avec son sujet sourcé et le montage papier ; l'intro 3D définitive n'est plus un blocage pour livrer une première vidéo journalistique.

---


## REPRISE PRIORITAIRE D01 — VRAI CLIP GABON 4S (13 novembre 2026)

**Dernier livrable vérifié** : véritable MP4 H.264 de 4 secondes, 1080×1920 à 24 fps (96 images), produit par WebGL NASA + moteur géographique, dirigé vers GABON (GAB) en démonstration. **Ne pas recommencer le moteur à zéro.**

- [MP4 technique dans GitHub](https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-lab/wv-d01-gab-technical-4s.mp4) — SHA-256 `17796338023f0ffd9732739390ac2535c816113baf8e6dd773879314604bb22a` ; [workflow de rendu réussi](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43466731755).
- [Trois vraies frames début/milieu/fin](https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-lab/review/contact-sheet.jpg) — [QA réussi](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43468666079), SHA et métadonnées vérifiés.
- [Documentation D01](worldhealth-vision-v2/docs/media/D01_GABON_MOTION_REVIEW_2026-11-13.md) ; lecteur D01 directement intégré dans `CinematicMotionReview.tsx/.css` du Media Studio, sans autoplay et sans diffusion.
- **Aucun D00-v6 / D01 approuvé artistiquement.** Le concept beau et réaliste reste référence prioritaire : globe détaillé, deux arcs d'œil, blanc pur, atmosphère cyan plus visible que les arcs, frontières exactes. La nouvelle vidéo est une **preuve de mouvement technique**, pas encore un générique achevé.
- Suite : corrections de fidélité artistique, D02 zoom vers un lieu vérifié, vraies images, audition voix, sous-titrage, montage Remotion/FFmpeg, QA, validation et publication éventuelle. Respecter le manuel original de 137 pages : `worldhealth-vision-v2/docs/media/AUDIOVISUAL_PRODUCTION_MASTER_PLAN_2026-11-13.md`.

---


## POINT PRIORITAIRE 13 NOVEMBRE — FILM CGI D01 DE 4S

**Cette mise à jour supplante les anciens paragraphes « pas de vidéo »** pour le prototype technique uniquement. Le nouveau moteur WebGL phototexturé NASA est codé dans `frontend/web-v2/src/media/CinematicEarth.tsx`; le ciblage géographique GeoJSON préexistant pilote son orientation, sans revenir au vieux globe plat. Une **vraie micro-vidéo H.264 4 secondes (1080×1920, 24 fps, 96 images)** a été rendue et archivée sur GitHub avec preuve FFprobe/sha256.

- [Regarder le MP4 technique GAB / 4s](https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/wv-d01-gab-technical-4s.mp4)
- [Manifest et SHA-256 du film](https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-lab/wv-d01-gab-technical-4s.json) : `17796338023f0ffd9732739390ac2535c816113baf8e6dd773879314604bb22a`
- [Workflow de rendu réussi #43466731755](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43466731755)
- [Documentation technique D01](worldhealth-vision-v2/docs/media/CINEMATIC_D01_MICROCLIP_2026-11-13.md) et [D00 CGI](worldhealth-vision-v2/docs/media/CINEMATIC_EARTH_D00_ENGINE_2026-11-13.md)

**Attention : prototype de rotation, NON approuvé artistiquement, sans actualité réelle Gabon, sans voix, sous-titres, montage documentaire ni diffusion réseaux.** La référence D00-v6 d'origine du chat **n'a pas été écrasée** et reste la boussole artistique (deux arcs, vraie sclère blanche, atmosphère lumineuse et frontières sahariennes très lisibles) ; son PNG original n'est pas encore dans GitHub, contrairement à son hash et à ses spécifications.

**Prochain travail :** comparer le vrai micro-clip/CGI à D00-v6, ajuster l'aspect jusqu'à qualité média, compléter ciblage événementiel avec lieu vérifié et construire une actualité pilote sourcée et montée : voix naturelles auditionnées, rushes véridiques et autorisés, scripts, sous-titres, QA et validation humaine, selon les 14 étapes et le manuel de 137 pages.

---



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
