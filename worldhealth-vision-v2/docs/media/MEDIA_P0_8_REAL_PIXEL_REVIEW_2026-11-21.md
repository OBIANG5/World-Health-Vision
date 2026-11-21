# WORLD-VISION MEDIA — P0.8 : revue de trois vrais rendus mobiles, 21 novembre 2026

## Cadre et décisions non négociables

Le mandat du propriétaire reste : **montage premium international avec hook dès image zéro, re-hooks qui révèlent réellement des informations, images/voix/texte/données/masques en mouvement simultané avec le sens du récit**, production rapide et corrections locales. Les 5 scènes GEO/PAYS/PHOTO/DATA/DOCUMENT ne sont pas obligatoires. La référence de voix du prochain film montré au propriétaire est **Vivienne C5.2 — Impact média, fr-FR-VivienneMultilingualNeural, +8%**, nouvelle prise enregistrée pour LE SCRIPT EXACT ; l'audition de 14,088s du Mississippi n'est pas réutilisable. **Ne pas montrer une vidéo avec Kokoro sous prétexte de test.**

Les images dans ce QA sont **un paysage procédural synthétique, un calque de premier plan synthétique et une comparaison chiffrée totalement FICTIVE**. C'est une simulation interne, jamais des images/données de l'actualité. Aucune voix, aucun contrat commercial supposé, aucune publication.

## Preuves visuelles réellement téléchargées et examinées

Les trois exécutions ont rendu **un vrai MP4 H.264 1080×1920 de 165 frames à 30fps** via le même moteur Remotion que le Studio, avec deux cues de sous-titres. Des images aux frames **0, 48, 82, 124, 164** ont été exportées en **390×693px** et ouvertes pour évaluation. Les liens GitHub restent vérifiables dans l'historique Actions ; les ZIP d'artefacts sont temporaires (7 jours).

**V1** — https://github.com/OBIANG5/World-Health-Vision/actions/runs/44947605830 — artifact **14724357212**, MP4 SHA256 **356a71ed55487ecb6e608d803d2d46749e63ad5dc9515ef48f9bf20ae6b5a793**.
- Constats à partir des pixels : le panneau DATA est déjà entièrement visible sur image0 malgré une entrée prévue frame38; il obstrue le point d'intérêt photo. L'axe signé et les valeurs étaient mathématiquement corrects, mais la composition éditoriale était mauvaise.
- Action : le module photo-comparison-motion.mjs introduit un **panelProgress** temporisé distinct de l'animation plus lente des barres; PhotoMultilayer déplace le rail vers la zone basse, et CaptionTrack remplace Arial par **DM Sans**.

**V2** — https://github.com/OBIANG5/World-Health-Vision/actions/runs/44948038026 — artifact **14724511538**, MP4 SHA256 **ea06c12a122ac04082fc3da5647cfb9fb962b1b23c93adbdee0958f208fdd799**.
- À frame0 PHOTO et accroche visibles sans carton chiffré. À frames 82/124 photo et cercle de focus réapparaissent au-dessus des données.
- **Nouveau défaut découvert** : le panneau avec source répartie sur deux lignes recouvre le sous-titre explicatif de scène (vers frame124/164). Les sous-titres parlés sont encore distincts mais l'ensemble est trop serré. Ne pas se contenter de ce deuxième “vert”.

**V3 — dernière version inspectée** — https://github.com/OBIANG5/World-Health-Vision/actions/runs/44948365338 — artifact **14725020484**, MP4 SHA256 **7a088ced41a7ab35727bfdc6210d6c63bdb786dcaabc388977eca57cf6cb86d2**.
- Le panneau est absent à frame0 ; il entre avec le vrai beat de comparaison après frame38 tandis que les barres se révèlent plus longtemps. À frames 82, 124, 164 la photo/focus, la comparaison signée, la source, le texte de scène et les captions sont visuellement séparés. Les valeurs et le zéro ne changent pas artificiellement au cours de l'animation.
- Les hauteurs/paddings/titres/axes/lignes des barres ont été compactés **sans couper la source ni les valeurs**. Résultat confirmé en ouvrant les cinq images 390px ; **pas de chevauchement visible** aux moments inspectés. Certains crédits restent petits : à juger à nouveau avec un vrai sujet sur téléphone et dans TikTok.
- Validation : workflow P0.8 **SUCCESS : 52 tests/52, 0 échec**, TypeScript du renderer et compilation frontend Studio Vite **SUCCESS**, vrai MP4 H264 1080×1920 /30fps/165 images, 2 sous-titres, **track_voice=no_narration**, **intended_audience=internal_technical_qa_only**. Ce n'est NI une voix Vivienne testée ni un master artistique jugé par l'utilisateur.
- Provenance des deux seules images : synthetic-landscape.png SHA256 **2af038dc104799579733306beb17ea2bdbe23ae8505f343ebe2a82c4ba5dd607** ; synthetic-foreground.png SHA256 **037c169919ccb60039fa45f54090fbbf84e923c0079f1da17b55e62fd6dfbde4**. Source des nombres visible dans la simulation : **SIMULATION CI / Valeurs inventées, non journalistiques / 2026-11-21**.

## État du dépôt et STOP des microtests

PR brouillon **#138** : https://github.com/OBIANG5/World-Health-Vision/pull/138, branche **feature/worldvision-media-semantic-multilayer-photo-data-2026-11-21** ; commit code final audité **0accfacb898b9aef92e6d868f899f332f98c0f31**. PR fille de #137 (voix choisie), fille de #132 (preuve mobile). Pas de merge, publication, déploiement, dépense ou intervention sur logiciel Atlas / Obabap.

Sur ce SHA code, P0.8 #44948365338 SUCCESS, skills #44948365335 SUCCESS, audio-context #44948365394 SUCCESS, hooks/GEO #44948365327 SUCCESS, P0.6 #44948365319 SUCCESS ; le dernier renderer/Studio global **#44948365315 était encore en cours** à la dernière vérification. Il faut relire ce run pour savoir si les 6/6 sont réellement finis.

**La correction graphique P0.8 est techniquement utilisable mais elle n'est pas une preuve d'excellence artistique internationale.** N'en faire ni une P0.9 “nouvelle fonctionnalité” ni un nouveau banc d'essai NASA. Les défauts denses de la source seront revérifiés uniquement avec un sujet et des médias réels.

## Reprise intelligente — objectif vrai reportage et temps jusqu'à acceptation

1. Contrôler le run renderer/Studio **#44948365315** et enregistrer sa conclusion dans les commentaires PR #138 et issue stratégique #116.
2. Lire la **première section** de CONTINUITE_WORLD_VISION.md et MEDIA_CREATIVE_PRIORITY_CANON_2026-11-21.md. Préserver le fil réel : **hook/re-hook par le sens, montage multicouche simultané, audio, vraie source et correction rapide**. GEO minoritaire selon sujet, aucun cinq-scènes imposé.
3. Aucun **nouveau sujet/script vidéo approuvé** n'a été donné pendant cette étape. À la prochaine phase, recherche/choix de sujet et script dans ChatGPT avec l'utilisateur ; montage code **uniquement à partir du texte validé**, véritables médias, contrats de réutilisation, **nouvelle prise Vivienne C5.2 Impact média +8% pour ce texte**. Jamais substituer Kokoro, ni recycler audio Mississippi, Shenzhen/Soudan/Guinée sans instruction.
4. Concevoir un **conducteur phrase/beat** : information apprise, visuel original sourcé, image ou chiffre qui bouge, sound cue et sous-titres au vrai timecode, **deux nouvelles révélations qui justifient les re-hooks**, transitions du sens, vrais montages 9:16 et audit des pixels/du son, correction locale P0.4. Le film final doit recevoir une **approbation humaine** avant toute diffusion. Mesurer temps script/médias/voix → master accepté.

**Les références binaires d'artefacts expirent; le code, les rapports, les SHA, les CI, les observations et la présente documentation GitHub restent.**
