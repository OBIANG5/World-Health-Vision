# FILM-2B2 — World-Vision audible : voix française réelle, mix original et sous-titres alignés (20/11/2026)

**Branche active :** `feature/worldvision-film2b-audible-french-news-2026-11-20`, enfant de `feature/worldvision-film2b-artemis2-authentic-media-2026-11-20` PR #105, elle-même fille de PR #104 (Studio) et PR #98 (captions). **État : construction/validation CI — pas de publication, merge ni déploiement.**

## Problème utilisateur réellement prioritaire

Le premier MP4 NASA `worldvision_film2b_verified_final/artemis2-first-real-media-review.mp4` contenait de **vraies photos de mission et un montage 25 s**, mais **pas de son du tout**. L'utilisateur l'a constaté : « je n'écoutais pas de song ». Ce n'était **pas un bug de son de son iPhone**. La démo était volontairement muette, mais nous avions laissé la priorité à trop de micro-effets. Cela doit cesser : le vrai progrès est **un film audible, narré, rigoureusement sourcé, et dont les captions suivent la voix réellement générée**.

Cette PR ne réinvente aucun moteur TTS : elle **réutilise Kokoro-82M**, modèle open weights 82M, avec le français `ff_siwis`. Nous n'imposons pas « Vivienne » ni aucune autre narratrice : **il s'agit d'une voix d'audition à comparer**, pas d'un accord éditorial. L'audio Vivienne C5.2 d'une autre actualité **n'est pas recyclé**.

## Sources, identité vocale, droits — sans fausses promesses

- [Modèle Kokoro-82M original](https://huggingface.co/hexgrad/Kokoro-82M) : poids sous **Apache-2.0**, poids `kokoro-v1_0.pth` SHA-256 **`496dba118d1a58f5f3db2efc88dbdc216e0483fc89fe6e47ee1f2c53f18ad1e4`**. Le script vérifie physiquement le fichier chargé, documente le commit Hub et le SHA de `voices/ff_siwis.pt`.
- [Voix ff_siwis et données SIWIS](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md) : origine SIWIS française, données vocales **CC BY 4.0** ; attribution conservée et revue légale avant usage commercial international.
- [Package Python officiel](https://pypi.org/project/kokoro/0.9.4/) : `kokoro==0.9.4`, Python3.11, `espeak-ng`. CPU PyTorch explicite, pas de GPU/VPS imposé ; aucun service tiers payant.
- NASA originaux : les 3 JPEG, IDs, SHA-256 et dimensions sont ceux de la [PR #105](https://github.com/OBIANG5/World-Health-Vision/pull/105), téléchargés à nouveau et refusés s'ils ont changé. Figure « annotation sur visualisation », **jamais présentée comme une photo d'impacts filmés**.
- Le `soundscape` est **une texture atmosphérique entièrement calculée**, sans extrait musical ni son de « collision lunaire » inventé. Le niveau sonore est ducké contre la voix à partir du vrai signal PCM ; FFmpeg `loudnorm` établit une cible de **−16 LUFS / −1,5 dBTP**, ensuite **audit de l'AAC réel**. Ne pas décrire le son comme un morceau commercial ou une bande-originale approuvée.

## Implémentation, réutilisation intelligente

1. `narration.json` : **7 phrases françaises vérifiables**, horodatage scientifique exact : observations d'avril, rapport NASA du 17 novembre. Quatre scènes mappées par la narration ; aucune IA ne réécrit les faits.
2. `synthesize-kokoro.py` : génération de chacune des **7 phrases** séparément, extraction des **échantillons PCM réels et durées réellement prononcées**, WAV brut, ambiance créée localement, ducking selon parole et fichier final normalisé. Horodatages des phrases déduits du nombre d'échantillons ; SHA du modèle, voix et mix ; refus de silence ou d'un débit incohérent. **Ce n'est pas une transcription/forced alignment mot-à-mot.**
3. `build-narrated-project.mjs` : ajuste automatiquement la durée **des 4 plans existants** aux voix réellement produites, en préservant les fondus et les sources, au lieu d'accélérer artificiellement une narration pour une durée arbitraire. Crée des cues `startFrame/endFrame` globaux en se fondant sur les échantillons PCM ; SRT sidecar et journal voix→film.
4. `render-project.mjs` **existant et inchangé** : mêmes images NASA, même `CreativeEdit.tsx`, calque `CaptionTrack.tsx` de FILM-2A ; rend **le MP4 avec une vraie piste sonore AAC et des captions brûlées dans le film**. La piste son finale est un seul mix préparé, pour garantir l'identité entre Player et export.
5. `audit-audible.mjs` : vérifie sur le **MP4 réel** le H264, l'existence d'un **AAC non muet**, les frames, les 7 captions, la loudness/true peak réellement mesurée dans le fichier encodé et la conservation des SHA originaux des photos NASA.
6. Workflow `.github/workflows/worldvision-film2b-french-narration.yml` dédié, **sans redéclencher les régressions core de 745 frames** à chaque changement de voix : TTS→PCM→mix→import des originaux NASA→manifest à durée mesurée→Remotion MP4→audit AAC→8 vrais photogrammes→MP3 voix de démo et film dans artefact **7 jours**.

## Gates nécessaires, pas seulement « CI verte »

- [ ] Le modèle français Kokoro chargé et poids validés, phrase synthétisée en audio non muet.
- [ ] Le vrai film complet a une **piste AAC audible**, nombre d'images conforme à la voix et 7 captions effectivement rendues, source et attribution NASA inchangées.
- [ ] Vérifier les **vrais pixels et une écoute humaine de la voix** : naturel de « Artémis deux », « novembre », « cinq éclairs », respiration, vitesse, prononciation et proximité des titres.
- [ ] Comparer ce timbre Kokoro à **la référence vocale déjà retenue pour World-Vision**, sans imposer ni plagier ou cloner une personne réelle.
- [ ] Revoir source/date/licence d'usage international, vérifier les droits de la voix et de la bande-son ; tester overlays TikTok et Safari iPhone / Android avant tout avis de publication.
- [ ] Mesurer le temps au film audible, temps pour corriger 5 s de voix et le coût par vidéo. Préparer un moteur **remplaçable** par une vraie prise humaine ou une API commerciale mieux évaluée, plutôt qu'une dépendance qui enferme notre workflow.

**Statut exact attendu :** « montage sonore **audible** pour audition interne », pas version finale du média. La qualité artistique et la voix ne sont pas réputées choisies tant qu'une écoute réelle ne l'a pas confirmé.

**Point de reprise inter-chat** : lire `CONTINUITE_WORLD_VISION.md`, cette note, `narration.json`, la dernière PR FILM-2B2 et son commit SHA. Puis consulter Actions, télécharger le MP3 et le MP4, écouter le MP3 ET le master, regarder les frames 0/milieu/document/fin, relever les défauts honnêtement et documenter sans changer le code au milieu d'un long rendu. Ne pas mélanger avec BAOCOM, GDELT, blog ou la branche V2 générale.
