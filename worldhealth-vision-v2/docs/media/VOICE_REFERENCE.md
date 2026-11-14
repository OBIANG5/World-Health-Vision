# World-Vision — référence vocale canonique

**Décision utilisateur confirmée le 14 novembre 2026 : choisir Vivienne pour le Media Studio, y compris le reportage World-Vision n°001 consacré à la rencontre annoncée à Shenzhen.**

## Référence vérifiée et traçable

- Voix : **Vivienne Multilingual Neural** (féminine, français France)
- ID Microsoft : `fr-FR-VivienneMultilingualNeural`
- Paramètres de l'audition effectivement retrouvée sur GitHub : `rate="+11%"`, `pitch="+0Hz"`, volume normalisé `loudnorm=I=-16:TP=-2:LRA=7`.
- Audition choisie : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/south-sudan-editorial-v2/voice-auditions/vivienne.mp3
- Manifeste original comparatif : https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-lab/south-sudan-editorial-v2/voice-auditions/manifest.json
- Source historique de la décision : branche `feature/worldvision-south-sudan-v3-locked-vivienne-2026-11-14`, fichier `worldhealth-vision-v2/docs/media/VOICE_REFERENCE.md`.
- Autres timbres essayés A/B/C : Remy Multilingual Neural (A), Vivienne (B), Henri Neural (C). **Vivienne préférée** et retenue comme candidate par l'utilisateur ; ne pas remplacer par Henri, Remy ou Kokoro sans nouveau choix explicite.

## Usage pour le reportage Shenzhen — Editorial V2

1. Le script accepté `SCRIPT_V1.md` reste la source éditoriale. Seule la **signature finale** « World-Vision. Voir le monde, le comprendre. » est RETIRÉE du texte prononcé à la demande explicite de l'utilisateur : elle reste visible et SILENCIEUSE pendant les trois dernières secondes.
2. Narration `fr-FR-VivienneMultilingualNeural`, débit de départ `+11%`, prononciation et pauses contrôlées. Essai audio **continu**, sans `apad`/remplissage `atrim` des paragraphes, sans imposer aveuglément 43 secondes. Si la durée dépasse le montage visuel (39,1 s de voix au maximum), *signaler l'écart* et revoir l'édition, ne pas accélérer artificiellement les syllabes.
3. `edge-tts` est uniquement autorisé pour un **test / une audition** ; ses appels ne démontrent pas un droit de publication commerciale. La production destinée à diffusion devra utiliser un moyen contractuellement autorisé (p. ex. Microsoft Azure Speech sous les termes applicables à confirmer) et la même voix.
4. Le choix de Vivienne ne signifie pas que **la prise entière a déjà été écoutée et approuvée** : conserver `voice_approved_for_final=false` jusqu'à audition.
5. Vérifier les blancs par analyse acoustique de la voix seule, la diction du français et des trois noms propres, puis synchroniser les sous-titres *sur les vrais mots entendus*, jamais selon une grille arbitraire.
6. Ne jamais créer ou réutiliser d'imitation de voix d'un journaliste connu.

Cette référence doit être lue au début de tout nouveau chat qui poursuit World-Vision. Les nouvelles branches doivent la reprendre explicitement ; ne pas choisir de voix de secours par habitude.


## NOUVEAU RETOUR APRÈS DIFFUSION — AUDIO 4–5/10 / GUI NÉE-SIGUIRI (14/11/2026)
Le réglage historique `rate="+11%"` ci-dessus documente l'essai A/B/C ; **il n'est plus un réglage de production recommandé**. Le propriétaire a trouvé la voix Soudan du Sud trop rapide, plate, insuffisamment humaine, émotionnelle ou expressive malgré son timbre Vivienne préféré.

**Nouveau rendu de recherche Guinée Siguiri** : `fr-FR-VivienneMultilingualNeural`, prises courtes sans compression a posteriori, pauses liées au sens, **126,52 mots/minute réels**, vidéo de 51,733 secondes pour les dix paragraphes du script. La nouvelle voix est une **candidate à écouter**, pas une preuve de naturel ou une licence commerciale. 

Références : [GitHub run contrôlé](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43607767094) · [MP4 de relecture](https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/guinee-siguiri-2026-11-14/index.html) · [conditions qualité transversales](EDITORIAL_VIDEO_QUALITY_GATES.md).

**Méthode durable :** faire auditionner le master complet, comparer l'intonation réelle à une interprétation humaine, adapter la narration au sens sans la rechronométrer en force, puis obtenir une licence de synthèse vocale autorisant l'usage prévu ou une narratrice autorisée avant diffusion. Ne pas réutiliser l'ancien preset rapide pour les autres épisodes.
