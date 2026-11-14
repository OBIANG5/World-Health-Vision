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

## Décision utilisateur — Vivienne C Impact retenue (14/11/2026)

La version C Impact des quatre voix A/B/C/D est retenue comme référence.
La seule voix autorisée est fr-FR-VivienneMultilingualNeural.
La signature visuelle officielle G0 sur fond acier clair reste validée.

Défauts à corriger sans changer de timbre ni coller de fragments :
- fin de Mississippi suivie de la phrase suivante trop robotique ;
- fin de à l'hôpital dans la phrase des trente-deux personnes trop artificielle ;
- intonation encore trop mécanique malgré une meilleure énergie.

Le script C V3 utilisait les segments « sur le Mississippi. Trente-deux
personnes » et « à l'hôpital. Aucun blessé » : le point provoque
une fin de phrase puis une reprise prosodique par la synthèse.

Travaux réalisés sur la branche improve/worldvision-vivienne-impact-c4-natural-flow-2026-11-14 :
- C4 : quatre prises complètes où les mots sensibles sont suivis d'une
  virgule et d'une proposition liée. Pauses mesurées après les mots
  approximativement entre 0,25 et 0,38 seconde.
- C5 : deux prises complètes sans aucune ponctuation immédiatement après
  Mississippi ou hôpital, au même débit +8% que la C de référence.
- Enregistrements d'origine et versions égalisées sauvegardés ; aucune
  coupe de silence, aucun collage de phrases et pas de nouvelle narratrice.

Ces métriques ne prouvent pas que l'effet robotique a disparu. La validation
doit venir de l'écoute sur téléphone, en contexte de reportage.
Ne jamais revendiquer une voix 100% humaine ni des droits de diffusion
commerciale par défaut. Ne pas toucher au reportage déjà publié.

### Mesures V4-C5 réalisées en production — liaisons phonétiques ciblées

Workflow réel : https://github.com/OBIANG5/World-Health-Vision/actions/runs/43610885694
Source audit : nextgen/vivienne_c5_linked_brief.json
Lecteur stable : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/nextgen/vivienne-c5-linked/index.html

Deux prises complètes de Vivienne C Impact au même débit +8%, sans remplacement
de voix ni opération de découpage audio :
- C5.1 linked, 15,192 s : Mississippi → où, écart WordBoundary 0,000 s ;
  l'hôpital → et, écart 0,001 s ; aucune pause acoustique >120 ms près de ces mots.
- C5.2 broadcast, 14,088 s : Mississippi → que, écart 0,001 s ;
  l'hôpital → pour, écart 0,000 s ; aucune pause acoustique >120 ms près de ces mots.

Comparaison C4 après ponctuation : écarts locaux WordBoundary ~0,258–0,353 s,
avec silences détectés autour des mêmes mots. Les écarts C5 ont été réduits
par la syntaxe sans ponctuation après les deux mots, et NON par une coupe.

IMPORTANT : ce succès est UNIQUEMENT technique. Les repères de mots et
le détecteur de silence ne jugent pas le réalisme des voyelles, des finales
ou l'humanité de l'interprétation. Les deux prises nécessitent une
écoute perceptuelle en contexte ; aucune version n'est encore autorisée
comme master final sans validation du propriétaire et des droits commerciaux.

Règle d'édition pérenne : tester la syntaxe autour des mots difficiles
avant d'éditer des pauses ou de changer la vitesse, puis vérifier les
deux métriques (écart de repères et silence acoustique) et enfin écouter
la phrase complète. Conserver les audios bruts.
