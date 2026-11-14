# World-Vision — voix d'abord, identité ensuite (audit du 14 novembre 2026)

## Périmètre

Le reportage Trump/Poutine/Xi de 33,7 secondes est déjà publié. Ne JAMAIS
modifier, écraser ou republier cet épisode. Cette branche améliore uniquement
les OUTILS des reportages suivants. Aucun sujet de l'actualité n'est simulé
comme vrai dans les exemples.

Branche : improve/worldvision-voice-first-pipeline-2026-11-14
Base : rebuild/editorial-v2-quality-gates

## Véritable audit du MP4 téléversé par le propriétaire

Fichier visible : 33,700 secondes, 512x910 (copie pour TikTok), 30 fps,
H.264 et AAC 44,1 kHz stéréo. Loudness : environ -16,37 LUFS,
peak -4,47 dBTP, LRA 2,20 LU.
17 pauses internes > 0,22 s dans la narration des 30,7 premières secondes
au seuil -38 dB : moyenne 0,379 s et maximum 0,478 s.
Ces mesures ne démontrent pas l'humanité ni la qualité artistique d'une voix.

Défauts visuels observés :
- vignette du logo officiel avec bloc blanc/beige visible au header et en fin;
- marque finale trop petite, centrage perçu déséquilibré;
- images génériques de bâtiments pour IRAN et UKRAINE sans pertinence
  directe suffisante avec le récit;
- titres répétitifs en grandes capitales et typographie Barlow Condensed brute;
- absence de variations d'animations et de raccords signifiants;
- titres déjà inscrits dans les plans qui se heurtent aux sous-titres;
- libellé « LE MONDE • LOCALISATION » supprimé des futures conventions.

## AUDIO: nouvelle priorité, sans prétendre pouvoir créer une émotion artificielle

La voix reste fr-FR-VivienneMultilingualNeural.
Avant : un texte monolithique généré au débit +11%, pitch +0 Hz.
Après (auditions isolées, pas masters) : deux variantes comparables.
- conversational : base 0%, modulation entre blocs limitée à ±8 points.
- focused : base +5%, même limite, même timbre.
- 2 blocs TTS en parallèle, WordBoundary réellement enregistré;
- intent éditorial visible dans le fichier d'entrée; micro-pauses de 60–220 ms;
- écrêtage/égalisation prudents et mesure de pauses, LUFS, LRA et true peak;
- aucune altération magique de l'émotion par la compression/normalisation;
- raccords entre blocs potentiellement artificiels à ÉCOUTER réellement.

Vigilance : une voix fragmentée peut être pire qu'une prise continue.
Un humain choisit, rejette ou demande une nouvelle prise. Les scripts créent
des candidats seulement et ne déclarent jamais une voix « humaine ».
Si les essais restent trop mécaniques : évaluer Vivienne Dragon HD chez Azure
sous réserve des droits et de la disponibilité, voire une vraie narration
humaine. Ne pas inventer un style SSML « newscast » supporté par Vivienne.

Le service Edge TTS ne prouve pas une licence de diffusion commerciale.
Vérifier les droits contractuels avant de diffuser un nouveau reportage.

### Commandes

Lancer depuis worldhealth-vision-v2/services/media-renderer.

Audio : python3 scripts/worldvision_voice_lab.py audit --audio VIDEO.mp4
 --narration-end 30.7 --report output/nextgen/audit.json

Auditions (Edge TTS installé et réseau disponible) :
 python3 scripts/worldvision_voice_lab.py audition
 --brief nextgen/audition_demo.json --variant conversational
 --out-dir output/nextgen/voice

Idem pour --variant focused. Le script de démonstration n'affirme aucune
nouvelle de l'actualité; il sert exclusivement à comparer la diction.

## Identité, montage et typographie

- L'oeil/monde seul, sans rectangle blanc ni tuile beige; privilégier un
  original avec vrai canal alpha. Le SVG créé ici est une PROPOSITION, et
  non une reproduction autorisée ou identique de la marque d'origine.
- Axe optique commun pour l'oeil, WORLD-VISION, puis le slogan. Le bandeau
  de signature reste visuel et silencieux.
- En tête d'images : petite marque transparente discrète, voire aucune
  durant les plans de reportage marquants.
- Choisir les couleurs pour le contraste, non pour embellir artificiellement.
  Titrages plus courts et rythme typographique varié, moins de grandes capitales.
- Remotion : vrai mouvement de caméra, parallax doux, géographie exacte,
  graphiques et transitions qui RACONTENT quelque chose; pas de motion
  gratuite. Aucun plan « guerre » inventé ou faux photojournalisme.
- Chaque photo documentaire a date, source, droits et description de ce qui
  est réellement visible; une photo générique de bâtiment ne suffit pas.
- Les sous-titres doivent disposer de leurs propres zones dans la
  composition, sans chevauchement avec les gros titres.
- Le test d'habillage détecte rectangles non alignés, collisions, tailles
  et bordure opaque du fichier du logo. Ce test ne peut PAS savoir si une
  photo représente l'événement raconté; validation humaine indispensable.

## Chemin de production plus rapide

1. En parallèle : vérification factuelle, recherche de vrais visuels
   licenciés, découpage des beats, plan de motion.
2. Deux auditions Vivienne A/B sur de petits blocs, en parallèle.
3. Approbation d'une prise audio. Ne pas lancer un montage de 30–40 s avant.
4. Rendu PILOTE de 4–6 s pour contrôler le hook, logo, type et composition.
5. Rendu complet, contrôle automatique audio + géométrie + provenance.
6. Visionnage intégral sur iPhone, évaluation artistique et fact-check du jour.
7. Autorisation manuelle explicite pour les futures publications.

Les tests à chaque push restent courts et n'ont besoin d'aucune synthèse TTS.
Le rendu de marque candidat 3 secondes est indépendant des films existants.
Les candidats voix sont sauvegardés comme artefacts d'audition, jamais
publiés automatiquement sur TikTok. Plus tard, une matrice d'épisodes
indépendants permettra plusieurs productions en parallèle, mais seulement
après stabilisation de la qualité et des droits.

Limite fondamentale : tests « verts » ne signifient pas vidéo 8/10.
Tout candidat reste DRAFT jusqu'à validation visuelle, écoute complète,
crédits/licences et contrôle journalistique.


## Résultats réels — CI indépendante du 14 novembre 2026

Run GitHub Actions : https://github.com/OBIANG5/World-Health-Vision/actions/runs/43603667229

Tous les jobs du run ont réussi (4/4):
- contrôle rapide et tests hors réseau;
- audition Vivienne conversational;
- audition Vivienne focused;
- compilation TypeScript / Remotion, rendu du candidat et push dans la branche de prévisualisation.

MP3 conversationnel : 15,595 secondes analysées, LRA 1,9 LU, 7 pauses > 220 ms.
MP3 focused : 14,779 secondes analysées, LRA 1,3 LU, 7 pauses > 220 ms.
Les deux MP3 sont accessibles comme artefacts non commerciaux dans le run.
**Ces résultats ne prouvent aucune amélioration de l'intonation par rapport au MP4
d'origine (LRA ~2,2 LU); il serait mensonger de valider la voix à ce stade.**

Candidat eye-only outro : 1080×1920, 30 fps, 90 images, 3 secondes,
rendu H.264 réellement produit, sans piste vocale. Ce n'est PAS l'ancien logo
officiel restauré, mais une variante vectorielle pour examen graphique.
Aperçu iPhone :
https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/nextgen/brand/worldvision-eye-only-outro-candidate.mp4

La V3 Shenzhen, ses archives et ses sous-titres restent intacts.
Nouveau média recommandé (non sélectionné, non rendu) : manœuvres militaires
chinoises non annoncées autour de Taïwan, informations Reuters 13/11/2026.
Avant toute prise de voix réelle : vérifier les faits et les droits des images.
