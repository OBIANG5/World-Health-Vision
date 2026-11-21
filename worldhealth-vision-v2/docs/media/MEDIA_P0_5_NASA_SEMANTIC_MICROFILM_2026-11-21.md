# World-Vision MEDIA P0.5 — vraie source NASA, microfilm trois relances (21/11/2026)

**Périmètre : réalisation audiovisuelle uniquement, pas Atlas/logiciel.**

PR : #130, branche feature/worldvision-media-artemis2-semantic-microfilm-2026-11-21, enfant de PR #128 P0.4. Les sujets, scripts et voix finaux restent choisis et approuvés par le propriétaire. Le sujet NASA Artemis II est un banc d'essai interne préexistant, PAS une actualité nouvellement approuvée pour diffusion.

## Audit artistique réel du pilote précédent

Le master NASA de FILM-2B2 (#110) a été téléchargé depuis l'artefact GitHub #14650480879 et ses octets analysés :
- MP4 H264/AAC 48 kHz, 1080×1920, 33,045 s, 991 frames, SHA256 6023978c79db8ebadbfdcda64eba91be6275ee9ba28dfa198a60b8defe46ed97.
- Vraie piste AAC, loudness mesurée −16,31 LUFS, true peak −4,48 dBTP selon audit.
- Huit photogrammes réels inspectés. Ouverture très statique : image lunaire presque identique sur les premières secondes ; énorme bloc de sous-titres en haut, titre et crédits faibles en bas ; visuel document NASA trop petit pour comprendre les annotations ; répétition photographique sans vraie relance narrative. Le code fonctionne mais la qualité artistique internationale n'est pas certifiée.
- Trois images originales NASA épinglées par SHA256 dans media-pilots/artemis2/sources.json : lunar-orientale.jpg, earthset.jpg et impact-annotations.jpg. La troisième est une image de SIMULATION annotée par l'équipage, jamais une photo des impacts.
- Source institutionnelle du 17 novembre 2026 : https://science.nasa.gov/feature/artemis-ii-preliminary-lunar-science-report/ ; NASA annotations https://www.nasa.gov/image-article/artemis-ii-crew-moon-photo-annotations/ ; droits https://www.nasa.gov/nasa-brand-center/images-and-media/.

## Objectif testé

Sur les deux premières phrases EXACTES de l'audition historique NASA, produire un microfilm 8–12 s avec trois gestes de réalisation :
1. Hook dès la première image : « 5 éclairs signalés », photographie lunaire originale.
2. Première relance : « derrière la Lune », vraie photo Earthset montrant le contexte du survol.
3. Deuxième relance : « rapport NASA », vrai screenshot des annotations sur visualisation, clairement présenté comme simulation (jamais une captation d'impacts).

Audio : même prise d'essai Kokoro ff_siwis, issue du modèle open-weight original déjà utilisé dans #110, conservant exactement les mots de ces deux phrases et mesurant leurs vraies bornes PCM ; extrait coupé après la seconde phrase, sans accélérer. Deux courts bruits de transition créés localement : NON DIÉGÉTIQUES, absolument pas des sons d'impacts enregistrés. Sous-titres à la phrase seulement, aucune prétention d'alignement mot-à-mot. Pas de logo G0 historique à fond blanc ni invention du nouveau logo transparent.

## Code et workflow

Nouveau script : worldhealth-vision-v2/media-voice-pilots/artemis2/build-semantic-microfilm.mjs.
Il vérifie les sept phrases originales de la narration, l'empreinte de la voix WAV et les trois JPEG NASA, puis dérive une courte timeline à partir des débuts de phrases mesurés. Première relance = choix éditorial visuel dans la première phrase, pas horodatage prétendument obtenu par ASR ; deuxième relance = véritable début de phrase mesuré. Les images, les captions, le script et les transitions du nouveau projet sont validés par le moteur worldvision-creative-project-v1 EXISTANT.

Workflow : .github/workflows/worldvision-media-semantic-microfilm.yml.
Il réutilise le générateur de voix original et la préparation NASA épinglée, puis le moteur Remotion/FFmpeg existant pour un VRAI H264/AAC vertical. Il contrôle le script, les 3 scènes, les 2 SFX, les 2 phrases, les sources par hash et la durée de 8–12s ; capture quatre véritables images de chaque relance, crée une planche à taille 390px et mesure la bande sonore AAC. Artefact interne Actions, sept jours.

**Attention :** Aucune CI ne prouve à elle seule l'excellence artistique ni les droits. Le timbre Kokoro reste NON APPROUVÉ pour diffusion : la référence préférée du propriétaire reste Vivienne C5.2 Impact média, sans réutilisation d'un MP3 d'une autre actualité.

## Reprise exacte

1. Consulter le HEAD de PR #130 et son workflow, corriger la cause réelle en cas d'échec, sans changer les sources/narrations. Enregistrer SHA, Actions, logs et artefacts.
2. Télécharger le MP4 du vrai microfilm + sa planche 390px, voir les vrais pixels et écouter la voix + SFX ; juger la clarté des trois idées et les défauts de captions, crédits, images et transition. Ne pas noter artificiellement 10/10.
3. Corriger la faiblesse artistique principale en réemployant P0.4 pour une retouche locale, sans régénérer la voix ni modifier les autres scènes.
4. Réaliser ensuite un vrai sujet/script expressément choisi par le propriétaire avec une nouvelle voix et des visuels authentiques sous droits ; utiliser P0.3 pour l'alignement réel des mots. Ne jamais transformer ce pilote non approuvé en publication.
5. Mesurer temps total vers master acceptÉ, fréquence des reprises, droits et qualité mobile, puis capitaliser seulement les effets approuvés pour humain/géopolitique/finance. GEO reste une petite priorité secondaire. Aucun merge, déploiement, achat ou publication automatique.

Source de vision continue : issue #116, PRs #118 #123 #126 #128 puis PR #130. Lire la nouvelle première section de CONTINUITE_WORLD_VISION.md à chaque reprise.
