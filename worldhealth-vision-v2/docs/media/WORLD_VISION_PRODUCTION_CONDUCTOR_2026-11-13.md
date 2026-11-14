# WORLD-VISION — Conducteur de production multi-outils, du sujet au MP4 complet

## RECTIFICATION PRIORITAIRE — PILOTAGE AUTOMATISÉ ET IDENTITÉ AVANT UNE VIDÉO

Le passage historique du présent document recommandant « une vidéo avant toute automatisation » est **remplacé par le choix du propriétaire** : une **chaîne de production cohérente et automatisable d'abord**, avec ses capacités et frais clairement établis ; **pas d'actualité imposée** ni de montage sans notre identité visuelle. Lire [`../../automation/WORLD_VISION_AUTOMATION_COCKPIT.md`](../../automation/WORLD_VISION_AUTOMATION_COCKPIT.md).

Le sujet NASA mangroves a été rejeté et le document d'épisode a été marqué refusé. Le nouveau pilote doit être choisi à partir d'un petit classement d'actualités **majeures**, en expliquant les effets concrets, l'intérêt public, les sources et la pertinence visuelle. Un **vrai compte n8n** n'est pas encore connecté ; le fichier workflow Radar dans GitHub est une configuration importable et non un service actif. Aucun achat/API n'est présumé.

---

**Version : 1.0 — 13 novembre 2026.** Décision de méthode après retour utilisateur sur les limitations du rendu D00/D01. **Statut : workflow formalisé, NON encore exécuté de bout en bout sur une nouvelle actualité.**

> Objectif : produire des reportages vidéo crédibles, courts et professionnels en français en utilisant le meilleur outil **déjà accessible** par étape, plutôt que de tout coder. Appliquer ce guide en parallèle du manuel original de 137 pages, conserver les 14 étapes Media Studio, les décisions humaines et les preuves dans GitHub. L'outil le plus complexe n'est pas automatiquement le meilleur. La vérification journalistique et la qualité du montage comptent plus que les prouesses graphiques.

## 1. Ressources confirmées, conditions et limitations

| Ressource | Usage choisi | Abonnement/accès |
|---|---|---|
| ChatGPT Plus (ce chat) | chef d'orchestre éditorial ; recherche et vérification des sources ; script FR ; découpage temporel ; storyboard ; prompts pour chaque outil ; QA des médias reçus ; journalisation GitHub | Abonnement utilisateur déclaré. **Pas** d'accès automatique à un compte Google Flow ni d'abonnement OpenAI API inclus |
| Gemini / Google AI Pro | relecture indépendante du script, recherches complémentaires, prompts/variantes de scènes, aide de production | Plan AI Pro déclaré. Les noms, modèles, quotas personnels et variantes doivent être vérifiés dans l'interface de l'utilisateur |
| Google Flow (https://flow.google.com/) | générer **uniquement** les plans d'illustration impossibles à tourner (ex. ouverture World-Vision), à partir des images approuvées ; transitions visuelles | L'AI Pro reçoit 1 000 crédits Flow/mois ; 50 crédits/jour selon aide Google. Les coûts dépendent du modèle/durée/résolution et peuvent compter plusieurs générations par demande ; toujours vérifier avant lancer. Source https://support.google.com/flow/answer/16526234?hl=fr |
| Google Vids (https://vids.google.com/) | **éditeur principal par défaut**, montage sur timeline portrait 9:16, voix off françaises, assemblage et prévisualisation de l'épisode | Google AI Pro prend en charge l'IA dans Vids, dont voix off ; vérifier la fonctionnalité réellement présente dans le compte ; sources https://support.google.com/docs/answer/15609411?hl=fr et https://support.google.com/docs/answer/16545758?hl=fr |
| ChatGPT Image Generation / images Gemini | ajuster identité visuelle, arrière-plans et illustrations explicitement étiquetées, pas produire de faux événements | Capacité de création d'images selon l'app et limites de plan |
| Google Drive | dossiers des sources, masters, fichiers voix, licences, rendus intermédiaires, exports finaux | Accès Google Drive déjà connecté séparément. Ne pas supposer que les fichiers Flow y sont automatiquement synchronisés |
| GitHub `OBIANG5/World-Health-Vision` | scripts, briefs, manifests, hashes, décisions, commits, prototypes et pipeline réutilisable | Branch `feature/world-vision-media-studio`. Ne pas réécrire l'historique ni fusionner sans vérification |
| FFmpeg / ffprobe / Remotion | jobs techniques ciblés : compatibilité vidéo, SRT, coupes, assemblage répétable, loudness, format final, géociblage exact si nécessaire | Code du projet existant. À employer seulement lorsqu'il évite un travail manuel ou résout un problème identifié |
| DaVinci Resolve gratuit (option de secours) | finition vidéo/audio professionnelle quand Vids ne suffit pas | Logiciel supplémentaire gratuit, **pas** un abonnement détenu ni une étape imposée ; https://www.blackmagicdesign.com/products/davinciresolve |
| ElevenLabs (option **facultative**) | tester ultérieurement si les voix Google Vids n'atteignent pas la qualité attendue | NON inclus dans Google AI Pro. Licence commerciale sur formule payante selon offre : https://elevenlabs.io/pricing |
| API OpenAI ou Gemini | automatisation serveur éventuelle après validation du pilote | **Facturation/quotas séparés** des abonnements conversationnels. Ne jamais demander de clé privée dans le chat. Sources https://help.openai.com/en/articles/9039756 et https://ai.google.dev/gemini-api/docs/billing |

**Ne pas promettre :** opérations directes sur Google Flow depuis ce chat, crédits disponibles exacts du compte, voix finale approuvée, génération automatique d'un reportage authentique, ou autorisation de publier.

## 2. Les neuf parties de la formation : quelle place dans notre atelier ?

Le PDF source `monter-et-animer-vos-videos-avec-claude-v2.pdf` (137 pages) est conservé dans la Library utilisateur. Nous réemployons sa pédagogie et ses étapes en remplaçant le fournisseur Claude par des outils existants et une orchestration ChatGPT.

| Partie | Pages | Correspondance World-Vision |
|---|---:|---|
| 1 — Comprendre | 4–11 | Distinguer montage de **rushes réels** et motion design **illustratif** ; vidéo journalistique hybride |
| 2 — Préparer l'environnement | 12–22 | Drive, GitHub, Flow, Vids, outils de QA FFmpeg, noms de fichiers et droits d'accès |
| 3 — Choisir les outils | 23–40 | Matrice ressources ci-dessus ; auditionner voix et vérifier formats et coût **avant** génération |
| 4 — Prompt moteur et mémoire | 41–58 | Conducteur présent, épisodes indépendants, statut durable, prompts versionnés, refus des validations inventées |
| 5 — Construire son univers | 59–74 | Identité World-Vision G0, D00-v6 référence visuelle, logo discret à tester, palette et ressources sourcées |
| 6 — Monter des rushes | 75–91 | Collecte/licences, inventaire et inspection média, transcription, montage papier, plans de coupe, cadrage, sous-titres et son |
| 7 — Motion design | 92–107 | Script → voix → calage → storyboard → intro Flow et cartes GIS → assemblage |
| 8 — Contrôler et livrer | 108–114 | prévisualisation 3–5 s, QA frame/son, iPhone, export 9:16, archivage et validation humaine |
| 9 — Aller plus loin | 115–137 | compétences réutilisables, dictionnaire de noms, formats sociaux, gestion des coûts, corrections et FAQ |

**Les quatre compétences décrites par le manuel** restent l'objectif : `montage-rushes`, `habillage-ecran`, `sous-titres-srt`, `rendu-long`. Ne pas annoncer leurs implémentations complètes tant que code, tests et démonstrations ne les prouvent pas.

## 3. Conducteur par épisode — quatorze étapes, outil et livrable

| Étape | Responsable / outil prioritaire | Preuve exigée avant de continuer |
|---|---|---|
| 01 RADAR — identifier un sujet | ChatGPT + sources officielles / presse accessible | Sujet daté, 2–3 sources identifiées ; priorité éditoriale |
| 02 VERIFY — vérifier les faits | ChatGPT et contre-lecture Gemini, **sources originales** | fiche : affirmation → source/date/URL → incertitude ; pas d'invention |
| 03 SCORE — décider si ça vaut une vidéo | ChatGPT / humain | pertinence public, nouveauté, intérêt visuel, intérêt pédagogique |
| 04 APPROVAL — feu vert éditorial | humain | sujet, angle, ton, durée et pays validés |
| 05 CREATIVE — écrire le script | ChatGPT principal ; Gemini contre-lecture | texte FR final horodaté + hook factuel + dictionnaire noms propres |
| 06 ASSETS — rassembler vrais plans / licences | sources vérifiables, Drive, recherche médias | tableau media, auteur, URL, licence/autorisation, date/lieu, statut `authentique` ou `illustration` |
| 07 STORYBOARD — montage papier | ChatGPT | séquence par seconde : narration, images, textes, transitions, placement logo, crédits |
| 08 AUDIO — auditionner une voix | **Google Vids voix off FR** en premier ; voix humaine en option ; ElevenLabs seulement si besoin et licence | 2–3 extraits égaux de 12–15 s, volume comparable, une voix choisie ; prononciation vérifiée |
| 09 VISUALS / MOTION — produire seulement les plans manquants | **Google Flow** à partir de la meilleure image source ; GIS/Remotion uniquement pour géographie exacte | clip court, comparaison à l'image, absence de carte inventée, coût consigné, approbation visuelle |
| 10 EDIT / PREVIEW — monter la vidéo complète | **Google Vids 9:16** ; FFmpeg pour tâches ciblées | montage intégral avec voix, vraie imagerie, sous-titres et bande-son ; aperçu iPhone |
| 11 QA — contrôle contradictoire | ChatGPT sur exports + contrôles humains + ffprobe | vérification citations, géographie, sous-titres (écart cible <0,3 s), droits, volume, lisibilité mobile, image par image si nécessaire |
| 12 PACKAGE — exporter les variantes | Google Vids, FFmpeg si besoin | master MP4 H.264/AAC ou paramètres supportés, 9:16, SRT, vignette, métadonnées, crédits, hash |
| 13 TIKTOK CLEAN — vérifier la version par canal | ChatGPT + vrai aperçu TikTok/WhatsApp/Shorts | zones UI libres, logo discret, sous-titres visibles, lien/source correctement attribués |
| 14 PUBLISH — publier seulement après accord | utilisateur et canal officiel | APPROUVÉ explicitement ; URL/lien effectif, heure, version et accusé de publication |

**Une étape = un livrable visible.** Dans le chat, répondre avec : `Étape N/14 — outil utilisé — ce qui a été réalisé — fichier/aperçu — problème éventuel — prochaine étape`. Ne jamais commencer l'étape suivante comme si une précédente était validée sans preuve. Pour les contrôles purement techniques, enchaîner sans bloquer sur des validations humaines inutiles ; les choix éditoriaux/artistiques/publication nécessitent validation.

## 4. Répartition proposée de la durée : une première vidéo COMPLÈTE de 40 à 50 s

Structure de **départ ajustable** — pas un script d'actualité fictif :

- **00:00–00:03** : hook factuel puissant, voix déjà audible, visuel pertinent — **l'ouverture globe n'est pas obligatoire** si elle ralentit le sujet.
- **00:03–00:07** : localisation visuelle avec globe World-Vision si la géographie le justifie ; pas de zoom inventé.
- **00:07–00:19** : qu'est-ce qui s'est passé ? images authentiques / sources officielles.
- **00:19–00:34** : pourquoi cela compte ? 1–2 chiffres ou données vérifiées, décryptage.
- **00:34–00:44** : ce que l'on sait / ce qui reste incertain et conséquences.
- **00:44–00:50** : conclusion sobre, marque et source, sans faux appel dramatique.

**Voix :** environ 90–120 mots pour 45–50 s selon diction, à chronométrer avec la vraie voix, jamais supposer une durée parfaite à partir du texte. **Contenu authentique** : jamais présenter une vidéo générée IA comme filmée sur place ; le déclarer clairement dans les métadonnées et l'étiqueter si elle peut tromper.

## 5. Critères éditoriaux, artistiques, sonores et techniques

**G0 :** logo officiel œil-globe bleu, préservé. **G1 :** D00-v6 reste un concept approuvé partiellement, **pas la vidéo finale approuvée** : Terre réaliste dominante, frontières du Sahara lisibles, atmosphère cyan plus claire que les deux arcs, blanc d'œil #FFFFFF, arcs hors champ, étoiles rares, pas de faux soleil ni lumière nocturne. Chaque plan CGI doit se comparer à cette référence.

**Niveau professionnel :** source primaire pour tout chiffre, contexte, citations et dates ; aucun fait inventé. Photographies et rushes identifiés et autorisés, aucune génération IA trompeuse. Voix naturelle et diction respectueuse des noms, musique avec droits vérifiés, loudness et intelligibilité. Premier aperçu en petit, puis MP4 complet 1080×1920 recommandé (ou export équivalent du logiciel) et vraie inspection téléphone ; safe zones pour boutons TikTok. Associer un SHA à tout export validé.

**Défauts bloquants :** mauvaise localisation, graphique trompeur, faux reportage, absence de licence commerciale, audio non intelligible, texte coupé, rendu vertical déformé, logo non conforme, image/voix désynchronisés, pas de preuve de source.

## 6. Principes d'économie de temps et de crédits

1. **Une seule vidéo pilote complète avant toute automatisation**, plutôt qu'une suite d'introductions CGI isolées.
2. Choisir les médias authentiques **avant** d'acheter des rendus Flow. N'utiliser Flow que pour les plans dont l'animation apporte une réelle valeur ; une intro statique légèrement animée peut suffire.
3. Pour Flow : prévisualiser d'abord une image ou un clip court, puis **une génération** sur un modèle abordable ; confirmer crédits affichés dans l'app avant envoi. Ne pas commander automatiquement quatre variantes.
4. Voix Google Vids FR **avant** ElevenLabs : AI Pro inclut l'accès indiqué dans la documentation Google, sans achat séparé d'ElevenLabs. Comparer réellement 2–3 échantillons.
5. Faire le montage dans **un seul éditeur**, Google Vids par défaut. Ne passer à DaVinci Resolve que s'il manque une fonction nécessaire, et à FFmpeg/Remotion uniquement pour répétabilité/QA géographique ou sous-titres.
6. Le logo de reportage doit rester discret et validé sur les vidéos réelles ; ne pas rajouter par réflexe des éléments décoratifs qui cachent le sujet.
7. Conserver le code du globe géographique D01 comme une ressource, mais **ne pas en faire le chemin critique** du premier reportage complet.

## 7. Fichiers à produire pour CHAQUE épisode

Racine logique `episodes/YYYY-MM-DD_slug/` (Drive pour les binaires, GitHub pour les documents et hashes) :

- `brief.md` sujet et date, angle, pays/lieu vérifié, type d'images, public, durée ;
- `sources.csv` faits & liens & dates & droits/licences ;
- `script-v1.md` et `script-approved.md` ;
- `storyboard.csv` : `time_in,time_out,voice_text,visual,source,asset_path,overlay,transition,qa` ;
- `voice-candidates/` avec extraits, voix choisie, lexique de noms ;
- `assets-originals/` et `prepares/` (NE PAS MODIFIER les fichiers originaux) ;
- `flow-prompts.md` / `generated-visuals/` avec marqueurs `illustration synthétique` ;
- `subtitles.srt`, `music-licenses.md` et `credits.md` ;
- `previews/` et `master-portrait.mp4` (après approbation) ;
- `qa-report.md`, `manifest.json` avec SHA-256, `publication-receipt.md` seulement en cas de publication réelle.

**Statut par étape :** `NOT_STARTED`, `IN_PROGRESS`, `WAITING_FOR_USER`, `APPROVED`, `FAILED`, `SKIPPED_WITH_REASON`. Le script ne change pas silencieusement une fois la voix approuvée.

## 8. Exécution d'une demande « Fais la vidéo World-Vision sur [sujet] »

1. Détecter le sujet/la source/le pays déjà connu. Ne pas redemander des informations déjà données.
2. Produire tout de suite la **fiche de vérification, l'angle et un script provisoire complet**, puis une proposition de montage papier. Ne pas répondre uniquement par une liste de questions.
3. Identifier pour **chaque plan** : existe-t-il une source réelle ? une image déjà fournie ? l'accès Flow est-il utile ? quel outil est le moins cher et le plus fiable ?
4. Donner un paquet directement utilisable : **script de voix, storyboard avec timecodes, prompts Flow, choix de voix Google Vids FR, consignes de montage, sous-titres, crédits**.
5. En présence de résultats générés ou importés, **inspecter les vrais fichiers** : rejeter les faux détails, corriger et conserver la trace/version.
6. Guider l'action utilisateur dans les applications non connectées (Flow/Vids) avec **une seule action concrète à la fois**, puis reprendre quand le résultat a été fourni. En l'absence d'accès externe, ne pas prétendre avoir généré le média.
7. Faire contrôler automatiquement tout fichier reçu, puis produire une version MP4 complète **si l'outil et les ressources nécessaires sont réellement disponibles**, sinon décrire avec précision ce qui doit être exporté dans Vids.
8. Archiver l'état de l'épisode dans le dépôt après toute décision importante pour survivre à un chat saturé.

## 9. Références et suite

- Le [plan directeur précédent](AUDIOVISUAL_PRODUCTION_MASTER_PLAN_2026-11-13.md) détaille le code historique et l'audit des 9 parties du PDF ; le présent document **ne remplace ni ne supprime** cette recherche.
- Le [diagnostic D00 et option Flow](DECISION_HYBRID_GOOGLE_FLOW_D00_2026-11-13.md) demeure valable ; ce nouveau conducteur l'élargit à **tout le reportage**.
- Le tout premier pilote doit aboutir à un **reportage court complet** avec narration, vrais plans et montage, même si le globe cinématographique final nécessite encore des corrections.
- **Aucune licence Flow/API supplémentaire ni abonnement ElevenLabs requis pour lancer le pilote avec l'outillage déclaré**, sous réserve de confirmer les options d'interface Vids/Flow et les droits des images retenues.


## 10. Deux chemins de montage selon le matériel réellement disponible

**Point découvert après vérification officielle : Google Vids nécessite un ordinateur/navigateur compatible pour la création et le montage ; son visionnage sur téléphone ne signifie pas montage possible sur iPhone.** Source https://support.google.com/a/users/answer/15599399?hl=en. **Ne pas envoyer l'utilisateur dans une impasse mobile.**

| Configuration de l'utilisateur le jour de production | Outil retenu | Conséquence |
|---|---|---|
| Ordinateur Windows/Mac utilisable | **Google Vids 9:16** pour montage/voix off en français ; Flow pour plans IA ciblés ; exporter MP4 (https://support.google.com/docs/answer/49114?hl=en) | **Choix privilégié** car inclus dans Google AI Pro, adapté au workflow complet |
| Seulement un iPhone disponible | **CapCut iPhone** (application gratuite avec achats intégrés ; les fonctions premium ne sont pas présumées gratuites), Google Flow via Web selon accès ; voix enregistrée sur iPhone OU voix TTS externe avec droits/export vérifiés | Route **mobile**. CapCut supporte 9:16 et montage/titres/sons : https://www.capcut.com/fr-fr/resource/how-to-edit-vertical-videos ; https://apps.apple.com/fr/app/capcut-%C3%A9diteur-vid%C3%A9o-photo/id1500855883 |
| Ordinateur assez puissant et besoin de finition avancée | DaVinci Resolve gratuit, puis FFmpeg pour QA automatisée | **Option**, pas prérequis du premier reportage |
| Voix Gemini TTS via AI Studio | possible selon modèle et quota du projet | **Alternative distincte** de l'abonnement Google AI Pro : l'API et sa facturation sont séparées, https://ai.google.dev/gemini-api/docs/billing |

**Sous-titres** : la voix française peut provenir de Google Vids, mais Google documente surtout les sous-titres auto de Vids sur l'**anglais** ; pour une sortie française professionnelle, aligner et contrôler le SRT avec Whisper/outil spécialisé, importer/incruster selon l'éditeur. Ne jamais supposer que toutes les fonctionnalités CapCut Pro sont gratuites.

**Règle du chef d'orchestre** : en début d'épisode, choisir la filière ordinateur ou iPhone **à partir du matériel réellement disponible**, puis **rester sur la même** pour le montage au lieu d'imposer plusieurs logiciels. Toute modification de cette filière est documentée dans la fiche épisode.

