# World-Vision — modèle de dossier pour UNE vidéo complète

Dupliquer ce modèle dans `docs/media/episodes/YYYY-MM-DD_sujet.md` au début de **chaque** actualité. Ne jamais cocher « validé » sans décision ou preuve. Ce fichier doit être lisible par un nouveau chat **sans avoir besoin de retrouver l'ancien fil**.

**Protocole :** [WORLD_VISION_PRODUCTION_CONDUCTOR_2026-11-13.md](WORLD_VISION_PRODUCTION_CONDUCTOR_2026-11-13.md).

## 0. Fiche épisode
- ID :
- Titre :
- Date de publication prévue :
- Pays ISO3 / ville / coordonnées si vérifiés :
- Type : un pays / plusieurs pays justifiés / mondial / sans géographie utile
- Durée cible : 40–50 s par défaut
- Format : vertical 9:16, mp4 ; qualité conseillée 1080×1920
- Éditorial : angle, ce que le public doit apprendre, lien à « Voir le monde, le comprendre »
- Statut général : `NOT_STARTED`
- Script gelé : NON
- Voix choisie : NON
- Autorisation de publication : NON

## 1. Tableau des preuves

| ID | Affirmation à raconter | Source primaire URL | Source indépendante URL | Date / heure de l'information | Vérifié ? | Réserve |
|---|---|---|---|---|---|---|
| F01 | | | | | NON | |
| F02 | | | | | NON | |
| F03 | | | | | NON | |

## 2. Script — voix off

**Hook 0–3 s :**  
[une phrase factuelle forte]

**Localisation 3–7 s :**  
[si géographie utile ; sinon poursuivre l'histoire]

**Faits 7–19 s :**  
[affirmations sourcées]

**Décryptage 19–34 s :**  
[chiffres, causalités soigneusement distinguées des hypothèses]

**Implications 34–44 s :**  
[ce qu'on sait / ce qu'on ne sait pas]

**Conclusion 44–50 s :**  
[une information utile et une fin sobre]

**Script exact approuvé (copier intégralement ici une fois gelé) :**  
À APPROUVER.

## 3. Storyboard (montage papier)

| Temps | Voix dite exactement | Image/vidéo (vraie/illustration) | Fichier/URL et droit | Habillage/texte | Mouvement | Responsable / outil | État |
|---|---|---|---|---|---|---|---|
| 00–03 | | | | | | ChatGPT/Vids | NOT_STARTED |
| 03–07 | | | | | | Flow / GIS (si justifié) | NOT_STARTED |
| 07–19 | | | | | | Vids | NOT_STARTED |
| 19–34 | | | | | | Vids/FFmpeg | NOT_STARTED |
| 34–44 | | | | | | Vids | NOT_STARTED |
| 44–50 | | | | | | Vids | NOT_STARTED |

## 4. Médias et licences

| Fichier / URL | Authentique ou illustration IA | Auteur/source, lieu/date | Droit de réutilisation COMMERCIALE vérifié ? | Attribution nécessaire | Image validée ? |
|---|---|---|---|---|---|
| | | | NON | | NON |

**Ne pas faire :** récupérer une vidéo TikTok/Reuters/AFP/YouTube et la republier sans droit, utiliser un clip généré par IA comme « images de l'événement », inventer des frontières ou logos.

## 5. Voix et calage

- Première audition : Google Vids (voix off française disponible sous Google AI Pro sous réserve de visibilité dans le compte).
- Voix candidate A : / impression / prononciation / coût
- Voix candidate B : / impression / prononciation / coût
- Voix candidate C, si disponible : / impression / prononciation / coût
- Voix approuvée par l'humain : NON.
- Dictionnaire `mot → phonétique de prononciation` :
- Audio master :
- Alignement mot à mot : réalisé / non réalisé ; **contrôle** au début/milieu/fin, cible < 0,3 s.
- Sous-titres FR : produire un SRT vérifié manuellement avec Whisper/FFmpeg si nécessaire. **Ne pas présumer que Google Vids génère automatiquement des sous-titres français** ; sa documentation mentionne l'automatique pour l'anglais.
- Niveau sonore, intelligibilité iPhone : non contrôlés.

## 6. Plans illustratifs (Flow)

- Prompt exact :
- Image(s) de référence validées et SHA :
- Modèle Flow, crédits affichés AVANT génération, nombre de sorties :
- Lien / fichier produit, hash et durée :
- Écart avec image de référence :
- Géographie réelle respectée ? (Flow peut inventer ; ne pas utiliser sans vérification)
- Publication étiquetée `illustration IA` si risque de confusion : NON/À PRÉVOIR

## 7. Montage et contrôle qualité

- Éditeur principal : **Google Vids 9:16** ; projet :
- Tous plans authentiques sourcés : NON
- Script identique à la voix : NON
- Musique licenciée / droits commercial : NON
- Logo officiel discret et non masqué par interface : NON
- Sous-titres français lisibles et alignés : NON
- Extraits de 3–5 s inspectés : NON
- Master entier sur téléphone écouté avec et sans casque : NON
- Fichier MP4 final : INEXISTANT
- Durée/Dimensions/FPS/Codec/Audio via ffprobe :
- SHA-256 :
- Captures début/milieu/fin :
- Décision humaine : EN ATTENTE

## 8. Étapes 01–14 et leur état

| Numéro | Étape | Outil choisi et justification | Statut | Preuve/lien |
|---:|---|---|---|---|
| 01 | RADAR | ChatGPT + presse officielle | NOT_STARTED | |
| 02 | VERIFY | ChatGPT + Gemini contre-lecture | NOT_STARTED | |
| 03 | SCORE | ChatGPT | NOT_STARTED | |
| 04 | APPROVAL | humain | NOT_STARTED | |
| 05 | CREATIVE / SCRIPT | ChatGPT | NOT_STARTED | |
| 06 | ASSETS | Google Drive + sources licenciées | NOT_STARTED | |
| 07 | STORYBOARD | ChatGPT | NOT_STARTED | |
| 08 | AUDIO | Google Vids FR | NOT_STARTED | |
| 09 | VISUALS / MOTION | Flow si utile ; géociblage code si précis | NOT_STARTED | |
| 10 | EDIT / PREVIEW | Google Vids + FFmpeg ciblé | NOT_STARTED | |
| 11 | QA | ChatGPT + humain + ffprobe | NOT_STARTED | |
| 12 | PACKAGE | Vids MP4 + crédit + SRT | NOT_STARTED | |
| 13 | TIKTOK CLEAN | téléphone + zones sûres | NOT_STARTED | |
| 14 | PUBLISH | humain ; aucun automatisme implicite | NOT_STARTED | |

## 9. Règles d'un assistant qui reprend le travail

1. Lire le point `CURRENT_STATE_AND_NEXT_STEP.md` et **cette** fiche ; identifier les étapes finies, celles bloquées, les fichiers réellement présents.
2. Ne pas repartir de zéro, ne pas fabriquer de preuves, ne jamais remplacer l'identité World-Vision G0 ou le concept D00-v6 par une simple maquette.
3. Toujours fournir de vrais **livrables par étape** : script, voix testée, plan vidéo, captures, prévisualisation mobile, MP4 final.
4. Recommander le meilleur outil parmi ceux déjà payés : Vids/Flow/Gemini/ChatGPT, puis code seulement lorsque nécessaire.
5. Les images d'actualités et affirmations doivent rester **vraies**. Les scènes synthétiques doivent être clairement distinctes.
6. Ne jamais présenter une publication ou un export comme réalisé sans preuve et autorisation.
7. Mettre à jour ce fichier et le `WORK_JOURNAL.md` après chaque vraie décision et chaque production vérifiée.
