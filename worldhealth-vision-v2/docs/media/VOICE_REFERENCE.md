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


## Décision utilisateur renforcée — 14 novembre 2026, suite vidéo n°001

Cette décision supplante les expériences comparatives A/B/C où d'autres voix
avaient été suggérées à tort pour remplacer Vivienne.

- **AUCUN CHANGEMENT DE TIMBRE** : seul
  `fr-FR-VivienneMultilingualNeural` est autorisé pour les auditions Edge.
  Denise, Sylvie, Coralie, Remy et Henri ne sont pas candidats à la succession.
- Le test V2 Vivienne (13,4 secondes) semblait plus vivant mais les
  micro-blancs et l'impression de phrases collées ont été REJETÉS.
  Il retirait **2,008 secondes** de silences par montage sur la voix ;
  ne pas reproduire cette méthode agressive.
- Nouvelle expérimentation V3 sur la prochaine actualité :
  **quatre rédactions et rythmes, une seule synthèse continue par prise,
  aucune coupe de silence ni collage d'éléments vocaux**.
  Pipeline : `services/media-renderer/scripts/worldvision_vivienne_only_v3.py`.
  Les prises doivent être écoutées par une personne, aucune amélioration
  subjective garantie.
- Vivienne haute définition Azure DragonHD garde le personnage vocal Vivienne
  et peut être expérimentée séparément si un accès Azure Speech licite est
  configuré. Ne PAS le simuler via Edge ni affirmer que les essais V3 sont HD.
- Aucune publication automatique des voix de démonstration avant
  confirmation des droits et approbation artistique.

La signature G0 authentique, **fond acier clair**, a été validée
expressément par l'utilisateur comme signature de fin.
Garder l'oeil officiel, les continents et l'animation ; changer de
fond ou d'identité sans nouvelle décision est interdit.
Lien conservé :
https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/nextgen/brand/worldvision-original-g0-graphite.mp4

La vidéo déjà publiée de 33,7 secondes reste immuable ; pas de mise à jour
rétroactive. La vraie source d'évolution est la nouvelle branche
`improve/worldvision-vivienne-only-v3-editorial-2026-11-14`.
