# DÉCISION VOCALE LA PLUS RÉCENTE — 21 NOVEMBRE 2026 (PRIORITAIRE SUR LES ARCHIVES CI-DESSOUS)

**VOIX CHOISIE PAR LE PROPRIÉTAIRE POUR LES PROCHAINES VIDÉOS QU'IL DOIT ÉCOUTER : Vivienne C5.2 — Impact média.** Ne pas utiliser Kokoro, Remy, Henri, C5.1 ou l'ancienne Vivienne à +11% pour lui montrer un nouveau résultat. **Ne rien produire maintenant au titre du retour utilisateur du 21/11 ; respecter ce choix lors de la PROCHAINE production réelle.**

**Provenance réellement retrouvée dans GitHub (pas seulement de mémoire) :**
- Identifiant du modèle vocal : `fr-FR-VivienneMultilingualNeural`. Audition C5.2 **MÉDIA**, fichier `media-lab/nextgen/vivienne-c5-linked/c5_broadcast-review-only.mp3` sur branche `whv-media-studio-browser-preview`.
- Débit enregistré pour C5.2 : **`+8%`**. Durée audio de relecture : **14,088 s** (rapport de la même branche `media-lab/nextgen/vivienne-c5-linked/c5_broadcast-report.json`). **Pas +11%** : ce dernier est un ancien essai et NE DOIT PAS se substituer au dernier choix.
- Échantillon exact de comparaison (Git SHA-1 d'objet blob) : `cd2254c1557b815fd63a4861af9086d26d960da6`, 338733 octets. Brut de la même audition : `c5_broadcast-raw-service.mp3`, blob `b36aca061d634e68be464e805284d3aa1735a5f6`, 84384 octets.
- Rapport complet : <https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-lab/nextgen/vivienne-c5-linked/c5_broadcast-report.json>. Écoute de comparaison historique : <https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-lab/nextgen/vivienne-c5-linked/index.html>.
- **Attention :** ces 14 secondes prononcent un texte sur une collision fluviale à La Nouvelle-Orléans. C'est une **RÉFÉRENCE DE TIMBRE ET D'INTENTION**, pas une prise à coller sur un autre reportage. La prise dédiée au prochain film doit prononcer **exactement son script validé**, conserver le même profil C5.2 et être écoutée et évaluée avant approbation. Les droits de synthèse/distribution commerciale et les images ne sont PAS certifiés par l'essai.
- **Retour propriétaire du 21/11 :** la succession de previews NASA avec la voix d'essai Kokoro était une erreur de réalisation, même étiquetée interne. **Aucun film montré comme résultat destiné au jugement du propriétaire ne doit utiliser une voix de test non choisie**, et aucune voix de remplacement ne doit être inventée faute d'accès au modèle. S'il manque une prise C5.2 conforme au script, préparer storyboard / repérage / montage muet ou indiquer explicitement que le film sonore destiné à la relecture est BLOQUÉ, plutôt que substituer.
- **Développement technique :** `services/media-renderer/creative/owner-review-voice-gate.mjs` et `--owner-review-voice-manifest` dans `creative/render-project.mjs` : pour marquer un MP4 comme `owner_audiovisual_review_not_publication`, imposer métadonnées du profil C5.2, script du même film, **empreinte des vrais octets voix** et fichier non repris de l'audition C5.2. Sans manifeste, tout rendu est seulement `internal_technical_qa_only` : il n'a pas vocation à être montré comme livraison artistique. Le contrôle de provenance est documentaire, PAS une reconnaissance de locuteur par IA ; l'écoute humaine et les droits restent indispensables.

Les références anciennes du 14/11 à `+11%`, les candidatures intermédiaires, les exemples et les audits historiques sont conservés **ci-dessous à titre chronologique**, mais ne peuvent plus rétablir un vieux choix de voix.

---

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
