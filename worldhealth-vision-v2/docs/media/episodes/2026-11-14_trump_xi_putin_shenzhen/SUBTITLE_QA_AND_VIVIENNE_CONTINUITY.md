# World-Vision — continuité éditoriale Vivienne, sous-titres et absence de remplissage

**14 novembre 2026 — suite du chat World-Vision, après interruption de réflexion.**

## Source exacte et choix du propriétaire

L'utilisateur a explicitement demandé de reprendre la vidéo de Trump, Poutine et Xi Jinping avec la voix féminine **Vivienne** trouvée dans un autre chat. Son identité a été confirmée depuis GitHub dans `worldhealth-vision-v2/docs/media/VOICE_REFERENCE.md` et la branche `feature/worldvision-south-sudan-v3-locked-vivienne-2026-11-14`.

Voice ID : `fr-FR-VivienneMultilingualNeural`, démonstration Edge TTS à débit +11 %, tonalité +0 Hz. **Choix de voix préféré**, mais la prise finale n'est pas approuvée ni licenciée pour publication commerciale.

## Ce qui a déjà été réellement produit

- **Image/son V3** : 33,7 s / 1011 images / 1080×1920, vrai globe conservé à vitesse 1×, voix Vivienne continue, fin de narration à 30,597 s, signature G0 silencieuse 30,7–33,7 s.
- Fichier V3 réel : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/summit-2026/editorial-v2/full-vivienne-v3/full-vivienne-review-33p7s-v3.mp4
- Source voice SHA256 : `96b8ebf4a2692ad67170b98e66144784508a0ca29e6884a65c1b2882db858b7b` ; source vidéo V3 SHA256 `208f897eb84528025a0e9aee5104bebdb01e82de52735a6485ef631eedeb4b66`.
- Les anciens montages 42,1/43s avec Henri, logo de remplissage et sous-titres illisibles restent REJETÉS.
- Script accepté resté intact hors la signature finale, volontairement **non prononcée**.

## Défaut réellement observé dans les sous-titres V3/V4/V5

Les métadonnées JSON issues des tests présentent des **intersections de 20 millisecondes** entre certains sous-titres : une réplique commence avant que la précédente ne se termine. Des groupes tels que « Au cœur des discussions réduire... » coupent aussi des expressions grammaticales à de mauvais endroits malgré des tailles de police correctes. Le rendu H.264 valide ces vidéos, mais ne les rend pas éditorialement acceptables.

## Correction isolée et vérifiable

Une branche expérimentale distincte `refine/worldvision-shenzhen-vivienne-v4-captions` a été créée à partir de la reconstruction, afin de ne pas écraser V3 ou V5.

- `scripts/worldvision_vivienne_subtitles_v4.py` : 25 micro-phrases éditoriales explicites, les mots et ponctuations du script sont préservés à l'identique. Alignement obligatoire sur les **86 vrais événements WordBoundary** Vivienne. Le texte ne peut pas être réécrit silencieusement.
- Police DM Sans à 78 px, maximum deux lignes, mesure réelle des glyphes via Pillow, largeur visuelle maximum 760 px pour éviter l'interface mobile. Les phrases trop grandes font échouer le workflow avant diffusion.
- Chaque sous-titre s'arrête **au moins 25 ms avant le suivant**, pas de chevauchement accidentel. Rien ne subsiste après le début de la signature visuelle 30,7 s.
- `quality/caption_nonoverlap_gate.py` : contrôle générique destiné à toutes les prochaines vidéos, refuse aussi les omissions ou substitutions de mots. On ne se contente plus d'un codec réussi.
- Workflow `.github/workflows/whv-vivienne-semantic-phrase-audit.yml`, exécution GitHub avec vérification de l'empreinte source et nouvelle vidéo de comparaison isolée.
- L'ancien essai de 23 segments a été **bloqué correctement** car une phrase longue dépassait la largeur mobile. Il a été remplacé par **25 segments** sans accélérer ni modifier la voix.

## Priorités absolues inchangées

1. Le globe géoréférencé reste à sa vitesse naturelle, sans carte inventée.
2. Aucune carte-logo au milieu du reportage, aucun compteur/progress bar, aucune mention de production dans l'image.
3. La signature World-Vision et le slogan sont seulement affichés, jamais lus à voix haute.
4. Aucune musique ou voix ne doit être déclarée autorisée pour publication sans droits vérifiés.
5. Le nouvel aperçu doit être **écouté intégralement et examiné artistiquement par une personne**, indépendamment de toute QA technique.
6. Pas de version finale publiée avant vérification factuelle et approbation utilisateur.

## Résultat effectif après exécution

- GitHub Actions : [#43598690740](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43598690740) — **success** après révision d'une phrase refusée car trop large.
- Nouvelle vidéo 33,7 s (1011 images) : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/summit-2026/editorial-v2/semantic-phrase-audit/33p7s-vivienne-semantic-phrase-audit.mp4
- MP4 SHA256 : `2da048ad9970e3e6aadf721dcdc32669fe99aa5a7ef5a2870699cad466a86ddd` ; 13 706 800 octets.
- Planche de comparaison réelle : https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-lab/summit-2026/editorial-v2/semantic-phrase-audit/frames/contact-sheet.jpg
- Métadonnées exactes : https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-lab/summit-2026/editorial-v2/semantic-phrase-audit/report.json
- **25 sous-titres non superposés**, tous testés par la vérification indépendante `quality/caption_nonoverlap_gate.py`, 86 événements vocaux, source de parole non altérée, police DM Sans 78px, largeur ≤760px, deux lignes maximum, fin des sous-titres à 30,7 secondes.
- Durée de l'image, voix, globe et cadence **inchangées** par rapport au MP4 V3 ; seule la composition des sous-titres diffère.
- Statut : **TECHNIQUE RÉUSSIE / VALIDATION ARTISTIQUE ET LICENCE COMMERCIALE DE LA VOIX EN ATTENTE**. Ne pas présenter comme master publiable.

La version V5 concurrente est restée en archive pour comparaison; ses métadonnées montraient encore des chevauchements de quelques centièmes de seconde. L'expérience indépendante ne doit pas écraser V3/V5.

**Statut initial de ce document :** exécution des 25 segments terminée avec succès sur GitHub. Ce document est un registre de continuité, et non une déclaration de qualité artistique ou d'export final.
