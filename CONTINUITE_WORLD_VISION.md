# REPRISE PRIORITAIRE — WORLD-VISION MEDIA P0.5 : ESSAI AUDIOVISUEL NASA À 3 RELANCES (21/11/2026)

**PLUS RÉCENT QUE TOUTES LES SECTIONS HISTORIQUES CI-DESSOUS. MEDIA UNIQUEMENT, PAS ATLAS/LOGICIEL.** Priorité : à partir d'idées/scripts/médias/voix choisis ou approuvés par le propriétaire, produire des vidéos très captivantes : hook immédiat, re-hooks sémantiques, vrais visuels, mots synchronisés, sound design et correction rapide. GEO/cartes = spécialité secondaire et facultative, pas un globe imposé. Réutiliser Remotion/FFmpeg, P0.1–P0.4 sans nouvelle API/abonnement. Aucune connexion ChatGPT/Gemini par réflexe.

## État exact du travail
- **PR mère #128 P0.4** branche feature/worldvision-media-surgical-beat-revision-2026-11-21, HEAD `2411d2a53ae7a57ae9b0759db4dc9d91f4bbc22e`, **quatre workflows SUCCESS** (P0.4 #44903408631, P0.1 #44903408566, P0.2 #44903408571, renderer+Studio #44903408573). Outil de correction locale testé sur deux vrais MP4 mais oscillateurs synthétiques, pas une production journaliste approuvée.
- **PR EN COURS #130 MEDIA P0.5 DRAFT** : https://github.com/OBIANG5/World-Health-Vision/pull/130 ; branche `feature/worldvision-media-artemis2-semantic-microfilm-2026-11-21`, enfant de #128. Rapport complet `worldhealth-vision-v2/docs/media/MEDIA_P0_5_NASA_SEMANTIC_MICROFILM_2026-11-21.md`.
- **Audit réel réalisé** : ancien MP4 NASA FILM-2B2 (#110, artefact #14650480879) téléchargé/inspecté, 33,045 secondes H264/AAC 991 frames, niveau AAC ~−16,31 LUFS. Huit vrais photogrammes ont révélé ouverture photographique statique, re-hooks peu marqués, gros sous-titres en haut, preuves documentaires trop petites. Nous passons de la pure technique à une *preuve de réalisation*.
- **Code P0.5** : `media-voice-pilots/artemis2/build-semantic-microfilm.mjs` construit un projet Remotion 8–12 s à partir des **DEUX PREMIÈRES phrases exactes** et de la **MÊME audition Kokoro NASA** (#110, jamais publiée/approuvée), avec bornes PCM mesurées, trois photos officielles NASA SHA figés et trois visuels hook → face cachée → annotations NASA. Deux SFX de transition originaux NON DIÉGÉTIQUES. Photo annotations = capture d'une visualisation annotée, PAS preuve filmée des éclairs. Pas de logo G0 historique non conforme.
- **CI P0.5** : `.github/workflows/worldvision-media-semantic-microfilm.yml`. Le workflow génère voix/source NASA exactes, rend un vrai MP4 H264/AAC 1080×1920 avec SRT à la phrase, crée quatre frames des beats + contact sheet 390px, analyse audio. **À LIRE ET CERTIFIER SUR LE HEAD EXACT #130.** Aucun résultat de cette nouvelle CI ne doit être présumé vert.
- La synthèse voix, les images et les bruitages sont **UNIQUEMENT pour un essai interne** ; le propriétaire n'a pas validé le sujet NASA comme prochain reportage à publier ni la voix Kokoro. Ne pas affirmer une voix Vivienne ni une rétention vidéo mesurée, ne pas publier.

## ACTION IMMÉDIATE À LA REPRISE
1. Ouvrir PR #130 et workflows du SHA final ; corriger sur **la même branche** toute erreur concrète, sans multiplier les mini-sprints. Consigner état, SHA, lien Actions, artefact et défauts dans un commentaire de PR.
2. Récupérer le MP4 réel et la planche 390px, faire **inspection artistique des pixels et écoute** : pertinence et rythme des 3 relances, caption/safe zones TikTok, qualité source NASA, sound design/licence, pas de visuel ou son d'impact inventé. Contrôler autant les défauts que les réussites.
3. Si nécessaire, appliquer P0.4 à une modification ciblée de 3–5s sans changer script/voix/autres plans et comparer réel avant/après. **Pas de certification artistique sans revue humaine.**
4. Ensuite : vrai sujet ET script CHOISIS par le propriétaire, nouvelle voix correspondante (Vivienne C5.2 comme référence historique, pas réemploi d'un ancien MP3), vraies images et droits, P0.3 pour alignement word-level réel. Mesurer temps vers master vraiment accepté, puis presets éprouvés humain/géopolitique/finance. GEO secondaire.
5. Ne toucher ni au logiciel World-Vision V2, ni à BAOCOM, ni à GDELT. **Pas de merge, déploiement, publication, achat ni connecteur sans consentement et justification concrète.**

**Sources d'autorité :** issue #116 ; PR #130 puis #128/#126/#123/#118. Cette section remplace les anciennes mentions de priorité P0.4, qui restent conservées comme historique.

---

# PRIORITÉ DE REPRISE — WORLD-VISION MEDIA P0.4 : RÉVISER UN RE-HOOK SANS ALTÉRER LE FILM (21/11/2026)

**CETTE SECTION EST LA PLUS RÉCENTE. MEDIA AUDIOVISUEL UNIQUEMENT, PAS ATLAS/LOGICIEL.** Le propriétaire choisit idée/texte/voix/images ; notre métier principal est le montage avec hook initial + deux re-hooks sémantiques, bons visuels, typographie à la parole, sound design et retouche très rapide. **Le globe et les cartes sont une petite priorité secondaire.** Réutiliser Remotion/FFmpeg, P0.1–P0.3 et skills utiles sans nouvelle infrastructure ni connexions ChatGPT/Gemini gratuites supposées. Ne jamais recycler un ancien MP3 Vivienne sur un autre reportage.

## GitHub point d'arrêt vérifiable
- Parent **PR #126 P0.3** HEAD `2b44a3e2a22e63c0ceccc678945a0da53dae4da2` : 4 workflows **SUCCESS** sur ce SHA, confirmation dans les commentaires de #126. Source de mots minutés déjà importable sans ASR nouveau ; aucun vrai reportage final approuvé.
- **PR ACTIVE #128 P0.4 DRAFT** : https://github.com/OBIANG5/World-Health-Vision/pull/128 ; branche `feature/worldvision-media-surgical-beat-revision-2026-11-21` **basée exactement sur #126**, non fusionnée. Rapport `worldhealth-vision-v2/docs/media/MEDIA_P0_4_SURGICAL_REHOOK_REVISION_2026-11-21.md`.
- Nouveau code : `services/media-renderer/creative/surgical-revision.mjs` et `revise-shot.mjs`, tests `surgical-revision.test.mjs`, workflow `.github/workflows/worldvision-media-surgical-revision.yml`. Retouche ciblée d'un plan selon patch approuvé + hash de source : titles/motion/visuel, emphase de mots, volume/ajout SFX. Échec si source a changé, temps d'overlap touchés, script/voix/sons/plans voisins changés ou asset local absent. Produit nouveau JSON + rapport SHA, **jamais écrasement des originaux**. Le mode existant `--review-shot` donne le vrai film avec audio et contexte, pas une sous-composition silencieuse.
- **Nouvelle CI #128 encore à certifier au HEAD exact** ; ne pas considérer le code comme validé tant qu'un run terminé SUCCESS n'a pas prouvé Node tests + deux vrais MP4 avant/après, frame 52 du plan voisin identique et frame 101 du plan changé différente, H264/AAC et protection du script/voix. QA = oscillateurs synthétiques, pas narration vraie ni vidéo premium validée.
- Pas de fusion, déploiement, achat ni publication, ni changement de logo G0 sans asset transparent œil-globe approuvé.

## Prochaine action EXACTE
1. Lire l'état de #128 et de son workflow ; si échec, examiner steps/logs, corriger le bug réel sur **la même branche** et mettre à jour SHA, statut et limites dans un commentaire PR. Si vert, inspecter MP4/audio et stills réellement produits ; pas de note artistique fictive.
2. Préparer ensuite une vraie séquence de 8–12 secondes avec **hook + 2 re-hooks signifiants**, sur un script/voix de la même actualité choisie, photos/rushes et SFX licites. Employer P0.3 pour alignement de la prise réelle, P0.4 pour corriger localement. Ne pas demander de nouvelle voix par principe et ne jamais inventer texte/timing.
3. Mesurer temps jusqu'au master *humainement accepté*, micro-retouche de 3–5s, droit des médias, vrais pixels 390px, intelligibilité/ducking et impact des idées. Benchmark d'effets Remotion officiels vs HyperFrames/claude-motion seulement si qualité, licence et temps total mesurés justifient une intégration.
4. Ensuite comparer au moins trois styles (humain, géopolitique, finance), capitaliser seulement les presets approuvés, profils autres marques séparés. Toute suite doit prolonger le cinéma média, pas le logiciel Atlas.

**Documentation de vision prioritaire :** issue #116 et ce rapport P0.4. Les anciennes sections de ce fichier sont un HISTORIQUE, non les priorités actuelles.

---

# REPRISE PRIORITAIRE — WORLD-VISION MEDIA P0.3 : ALIGNEMENT DE LA VRAIE VOIX AUX HOOKS (21/11/2026)

**Cette section est PLUS RÉCENTE que tout l'historique conservé en dessous. UNIQUEMENT MEDIA ; l'Atlas logiciel relève d'un autre chat.**

L'utilisateur choisit les idées/sujets/scripts, fournit au besoin des images et une voix approuvée. Notre priorité centrale est d'en faire **rapidement des vidéos extrêmement captivantes** : premier hook, re-hooks qui incarnent chaque nouvelle idée, mots cinétiques, photographies/cartes/graphes précis, bande-son cinématographique et corrections ciblées. **Cartes du monde/planète = petite priorité secondaire, GEO existant à réemployer sans nouveau moteur.** Pas de connexion des comptes ChatGPT/Gemini par principe, aucun nouveau TTS, aucun achat ou outil supplémentaire sans gain prouvé.

## État exact

- **PR parent #123 P0.2** `feature/worldvision-media-kinetic-hook-cues-2026-11-21` **HEAD b25c0a95d63d43cf763475ae153f1a78b27b116c** : 3 workflows `SUCCESS` [hook/SFX/GEO #44901041750](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44901041750), [audio-context #44901041766](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44901041766), [renderer+Studio #44901041754](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44901041754). Preuve **technique seulement** : essai de 12,074s H264/AAC avec SFX synthétiques, titres cyan, mots minutés, vrai globe Natural Earth Gabon. Premier plan toujours trop vide, logo G0 à cartouche blanc discordant de la charte récente, **aucune voix humaine, aucun reportage publiable**.
- **NOUVEAU CHANTIER ACTIF P0.3** : branche `feature/worldvision-media-voice-word-alignment-adapter-2026-11-21` issue du SHA P0.2 ci-dessus ; rapport complet `worldhealth-vision-v2/docs/media/MEDIA_P0_3_WORD_ALIGNMENT_BRIDGE_2026-11-21.md`. Convertit des `Caption[]` avec timings issus d'un outil EXISTANT (Whisper.cpp, etc.) en `wordCaptions`, avec mot-pour-mot comparé au script, vérification de la vraie source voix par SHA, **nouveau projet sans écraser l'ancien**, emphases choisies. **N'infère aucun mot ni aucun minutage** et ne réalise ni TTS ni ASR nouveau.
- **CI dédiée P0.3** sur commit code `e6c57e3b3424777bb77a30603e0d40aa201ae862` : [Actions #44901809564](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44901809564) `SUCCESS` — tests de contrat, vraie CLI, rejet d'un mot halluciné, contrôle SHA et projet original. **Test seulement sur faux minutages + oscillateur technique**, la précision sur une vraie voix reste à valider.
- PR P0.3 DRAFT à ouvrir/consulter ; P0.3 ne doit PAS supprimer les correctifs #118/#123. Ne pas fusionner, publier, déployer ni changer la voix sans accord.

## Première prochaine action intelligente
1. Vérifier et commenter **HEAD SHA exact** PR P0.3 + dernière Actions ; réconcilier la documentation si le commit change.
2. À la réception du sujet/script/voix et des médias réels approuvés, **utiliser** un aligner existant FR multilingue, inspecter la vraie waveform, importer les mots contrôlés sans modifier le texte ; ajouter deux re-hooks sémantiques visuels et un sound design sous droits, pas de simple effet cosmétique.
3. Produit attendu : **une vraie séquence hook + deux re-hooks en 8–12 s**, vidéo et son authentiques, perçue à 390px, corrigible localement en langage naturel ; ensuite un film entier, mesurer temps/coût/qualité jusqu'au master accepté, puis transformer uniquement les effets approuvés en presets.
4. GEO, finance, pays, documents et image restent des **outils du réalisateur**, pas des étapes imposées. Préserver Vivienne C5.2 Impact média comme référence validée sans recycler l'ancien MP3 d'une autre actualité.
5. Lire [issue #116](https://github.com/OBIANG5/World-Health-Vision/issues/116), [PR #123](https://github.com/OBIANG5/World-Health-Vision/pull/123), [PR #118](https://github.com/OBIANG5/World-Health-Vision/pull/118) et le rapport P0.3 ci-dessus. **Les anciens titres de continuité ne représentent pas l'objectif actuel.**

---

# WORLD-VISION MEDIA — NOUVELLE PRIORITÉ 21/11/2026 : HOOKS, RE-HOOKS, SON ET CARTES OPPORTUNISTES (P0.2)

**Plus récent que les sections historiques ci-dessous. Périmètre UNIQUEMENT MÉDIA, pas Atlas.**

## Ce qu'a vraiment demandé le propriétaire
La priorité n°1 est de transformer **rapidement et au plus haut niveau** ses idées/scripts/photos/rushes en vidéos qui captent l'attention tout du long par **hooks ET re-hooks sémantiques, mots/thèmes animés, images qui représentent l'idée dite, sound design dynamique, polices percutantes et charte World-Vision**. L'agent fournit du **montage**, le propriétaire choisit les **idées éditoriales**. La cartographie du monde, les pays, l'économie/trading, les photos et les preuves sont des capacités spécialisées à réutiliser **quand le contenu l'exige** ; GEO demeure une **petite priorité secondaire**, pas la vedette de toutes les vidéos. La bibliothèque future doit aussi permettre d'autres marques.

**REUSE-FIRST !** Remotion + `@remotion/captions` + `@remotion/google-fonts` + GEO/PHOTO/DATA existants ; considérer HyperFrames/claude-motion seulement après benchmark vidéo et licence. **NE PAS relier les comptes ChatGPT/Gemini sans gain démontré au montage**, ne pas refaire un éditeur ni détourner les abonnements grand public en API. Ne pas modifier voix approuvée Vivienne C5.2 ni recycler d'ancien audio d'une autre actualité.

## État P0.2 : branche expérimentale non fusionnée
- Branche `feature/worldvision-media-kinetic-hook-cues-2026-11-21` issue de **PR #118 P0.1** certifiée et verte aux deux workflows.
- Rapport détaillé : `worldhealth-vision-v2/docs/media/MEDIA_P0_2_KINETIC_HOOK_SFX_GEO_2026-11-21.md`.
- Code nouveau : `creative/attention-cues.mjs` (mots approuvés, cues SFX avec chemins sûrs / timeline), `src/AttentionTypography.tsx` (pages/tokens officiels Remotion + bande cyan typographie Barlow Condensed/DM Sans), extension opt-in `CreativeEdit.tsx` + `creative/render-project.mjs`, et `brandMark:worldvision` utilisant **G0 original historique**. `creative/hook-rehook-map.synthetic.example.json` (3 scènes 362 frames, dont globe Natural Earth Gabon EXISTANT, 12 mots, 3 SFX de test). Workflow dédié `.github/workflows/worldvision-media-kinetic-hook.yml`.
- **Première version P0.2 techniquement réussie** Actions #44899135304, SHA `a92ba913264c2dfa2c6fcb81880737e960eafa4b`, véritable MP4 H264/AAC 1080×1920/30fps 362 frames, script SHA inchangé, 12 word cues + 3 SFX, 8 photogrammes QA inspectés.
- **MAIS DEFAUT AUDIO MAJEUR IDENTIFIÉ** : fichier AAC présent mais −49.4 LUFS / −31.1 dBFS true peak => trop faible ; augmenter le son de *démonstration seulement* et ajouter QA `volumedetect` au workflow. **Ne pas annoncer le dernier HEAD audio certifié avant nouvel Actions SUCCESS**. Le pilote n'a PAS de voix humaine/actualités et n'est PAS publiable.
- **AUTRE ÉCART** : le G0 historique du dépôt (œil bleu sur rectangle clair, blob `bc80fa70...`, APPROVED 13/11) apparaît comme un cartouche blanc isolé, tandis que les visuels carrousel plus récents fournis montrent une signature œil-globe **blanche avec mot WORLD-VISION**, a priori une charte plus récente. **Ne pas fabriquer ni altérer ce logo** : identifier/obtenir l'asset validé transparent, vérifier sa provenance et soumettre le remplacement à revue. Le style de texte cyan a un bon potentiel mais l'ouverture manque encore de médias illustratifs et de re-hooks narratifs profonds.
- Pas de merge, déploiement, achat, nouvelle connexion ou publication.

## Point de reprise intelligent
1. Vérifier **la dernière CI de la branche P0.2** et l'artefact réel, tester loudness de l'AAC décodé et voir les vrais stills à 390px ; réparer une cause à la fois, arrêter les rerenders pour la pure cosmétique.
2. Ouvrir la PR P0.2 **DRAFT** contre PR #118 ; documenter le HEAD exact et certification, ne pas fusionner prématurément les PR empilées.
3. **P0.3** : appliquer les hooks/mots/SFX au **vrai script et aux médias approuvés** avec nouvelle prise de voix correspondante. Aligner les mots sur le vrai signal avec outils ASR/forced alignment existants, pas inventer le timing ni régénérer l'ancienne voix. Concevoir 1 séquence 8–12 s ayant 2 **re-hooks par idées**, pas seulement par couleurs.
4. **P0.4** : rendre la correction d'un passage (mot/visuel/SFX) réellement rapide et non destructive, afficher dans Studio/Player si utile, puis benchmark temps vers un master accepté, niveau audio, frames mobiles, risques de droits.
5. **P0.5** : tester sur trois narrations réelles (actualité humaine, géopolitique carte, économie/bourse) et capitaliser uniquement les effets artistiquement approuvés. Règle : l'IA exploite un catalogue d'outils éprouvés, **elle n'invente pas nécessairement les meilleures idées**.
- Source de vision et QAs : [GitHub issue #116](https://github.com/OBIANG5/World-Health-Vision/issues/116). Commentaire premier rendu : https://github.com/OBIANG5/World-Health-Vision/issues/116#issuecomment-7061997845 .

---

# WORLD-VISION MEDIA — PRIORITÉ ACTUELLE 21 NOVEMBRE 2026 : HOOKS, RE-HOOKS ET MONTAGE SONORE RAPIDE

**Cette section est plus récente que les états historiques ci-dessous.** Elle concerne **uniquement le média**, pas le logiciel produit/Atlas traité dans un autre chat.

## OBJECTIF VRAIMENT DEMANDÉ PAR LE PROPRIÉTAIRE
Le propriétaire conserve le choix des idées/sujets/scripts ; notre métier premier est de **transformer rapidement ses idées, photos, vidéos et sons en films extrêmement captivants**, avec un **hook dès le début et des re-hooks continus**, mouvements/typographie conçus autour de la signification des mots, démonstrations visuelles, cartes, finance, preuves, photographie et mixage professionnel. Identité originale World-Vision œil/globe, bleu nuit/cyan, titres très gras/italiques et sous-titres DM Sans ; styles internationalement adaptables aux autres clients.

**RÈGLE CENTRALE : REUSE-FIRST.** Exploiter Remotion/FFmpeg et nos modules existants ; auditer les meilleurs skills/FX externes (officiels Remotion `@remotion/captions` et Word Highlight/Popping, HyperFrames, claude-motion), puis **utiliser ce qui démontre un avantage sur le véritable rendu et le temps total**. NE PAS créer de moteur vidéo concurrent, NE PAS connecter le compte ChatGPT/Gemini par principe : ces derniers ne sont qu'une option si le gain mesuré est supérieur. Aucune installation/compte/achat automatique.

## JALON ACTIF P0.1 — AUDIO-CONTEXT SHOT REVIEW

- **PR #118 draft** : https://github.com/OBIANG5/World-Health-Vision/pull/118
- Branche : `feature/worldvision-media-audio-context-review-2026-11-21`, issue prioritaire [#116](https://github.com/OBIANG5/World-Health-Vision/issues/116).
- Base : PR #110 à SHA `b1025c4d28220bc6e1b9cbf868dce4e7574b24a9` (pas fusionnée).
- Nouvel outil `creative/render-project.mjs --review-shot <shot-id>` : utilise l'EDL existante et le `frameRange` officiel Remotion **sur la composition originale** ; voix, musique, sous-titres et transitions sont conservés, avec jusqu'à 15 frames de contexte. Le vieux `--shot` muet reste compatible. Aucun nouveau fournisseur de voix et aucun média externe ajouté.
- Nouveau module `creative/review-range.mjs` et 5 tests de plage ; l'exécution Actions initiale a **validé 9/9 tests Node (incluant 4 tests EDL) et le typecheck**, mais a échoué avant le MP4 parce que la machine ne trouvait pas `ffmpeg`. Correctif d'installation conditionnelle committé. **Statut du vrai MP4/AAC : attendre la CI du HEAD final et regarder l'artefact. Ne jamais annoncer succès sur une CI pending.**
- Workflow dédié : `.github/workflows/worldvision-media-audio-context.yml`, contrôles vrais fichiers H264/AAC, conservation de la voix/texte approuvés, audio offset par fréquence source 300→900 Hz, 3 captures aux frames absolus.
- Rapport/handoff détaillé : [MEDIA_P0_AUDIO_CONTEXT_REHOOK_REVIEW_2026-11-21.md](worldhealth-vision-v2/docs/media/MEDIA_P0_AUDIO_CONTEXT_REHOOK_REVIEW_2026-11-21.md).

## SUITE INCHANGÉE (ordre de valeur)
1. **Certifier ou réparer** le nouveau rendu avec audio source exact, sous-titres et vrais pixels 390px ; enregistrer le HEAD, la CI, l'audio et ses limites dans un commentaire PR sans multiplier les commits documentaires.
2. **P0.2 montage hook/re-hook visuel** : tester **les animations prêtes à l'emploi** de texte `Word Highlight` / `Popping Word` Remotion, `@remotion/captions` compatible 4.0.542, puis 1–2 FX pertinents HyperFrames/claude-motion, avant toute recréation. Benchmark sur mêmes 8–12s de parole et vrai son, 390px. Associer mots exacts à leur vrai timecode, images et idées, sans surcharge.
3. **P0.3 design sonore** : catalogue SFX originaux/licenciés et cue-sheet synchronisée, espace pour la narration, stems non destructifs, niveaux mesurés, demande de correction d'un passage sans régénérer voix/plans inchangés.
4. **P0.4 film complet** à partir de l'idée/script **choisi par l'utilisateur**, images authentiques sous droits et rythme; puis bibliothèque de scènes seulement après validation humaine, styles GEO/Finance/Documentaire et profils indépendants pour d'autres clients.
5. Mesurer **temps jusqu'au master réellement accepté**, corrections, qualité iPhone, coût, puis plus tard analytics rétention/relecture si effectivement disponibles. Aucune publication automatique.

**Règles irrévocables :** script approuvé jamais réécrit/tronqué silencieusement ; voix préférée historique Vivienne C5.2 Impact média sans substitution ni réutilisation d'un ancien MP3 pour un autre reportage ; sources/archives/visuels IA véridiques ou clairement explicités, ne pas inventer de guerre ni de chiffres ; les deux vidéos de référence tierces ne sont **pas** des assets libres à recopier ; toutes PR en brouillon et aucun merge/déploiement sans approbation.

---

# WORLD-VISION — REPRISE IMMÉDIATE — FILM-2B2 AVEC VRAIE PISTE AUDIO FRANÇAISE

**20 novembre 2026. Le propriétaire a constaté que la dernière vidéo était MUETTE.** C'était exact : le MP4 NASA de 25 s sur PR #105 ne comportait aucune piste audio, malgré des images NASA réelles et une CI réussie. **RÉPONSE / PRIORITÉ ACTUELLE : un reportage que l'on peut réellement ÉCOUTER** avec voix française, sound design, 7 phrases minutées sur le VRAI signal audio, film H264/AAC, contrôles loudness/true peak, vérification sur mobile. Ne pas faire encore des micro-effets et ne pas confondre un film muet réussi avec un produit média fini.

**BRANCHE DE TRAVAIL :** `feature/worldvision-film2b-audible-french-news-2026-11-20`, dérivée du HEAD FILM-2B1 `f8181e67108dab17d583383c84ef609d68d7a700` de **PR #105**. Lire **d'abord** [dossier sonore FILM-2B2](worldhealth-vision-v2/media-voice-pilots/artemis2/README.md), [script FR divisé en 7 prises](worldhealth-vision-v2/media-voice-pilots/artemis2/narration.json), le [rapport du film NASA réel](worldhealth-vision-v2/media-pilots/artemis2/README.md) et la **dernière Actions de la nouvelle PR**, puis les commentaires précédents. Ne jamais déclarer une réussite avant un vrai MP4 audible vérifié au SHA exact.

**ÉTAT DÉJÀ CERTIFIÉ :** NASA source-checked `art002e009627`, `art002e009288`, `art002e016252_impactflash_annotation_cropped`, SHA-256 figés et testés. Version visuelle révisée 25s `f8181e6` [Actions #44771440659](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44771440659) SUCCESS, titre dès frame 0, H264 sans audio, sources intactes. Studio/renderer core depuis #104/#98, régressions sur ce code. Aucun merge ni déploiement.

**NOUVELLES PIÈCES FILM-2B2** (code écrit, CI à confirmer) : `synthesize-kokoro.py` charge Kokoro-82M libre en français `ff_siwis`, vérifie poids SHA officiel, génère 7 segments français et mesure les vrais échantillons ; crée un drone atmosphérique algorithmique original **pas une chanson/son d'impacts filmés**, ducké par l'enveloppe de la parole et maîtrisé FFmpeg −16 LUFS/−1,5 dBTP ; `build-narrated-project.mjs` adapte la durée des 4 images NASA à la voix **sans accélérer la voix pour atteindre 25 s**, et émet les vrais timings des 7 phrases + SRT (ce n'est PAS un forced alignment par mot). `render-project.mjs` et `CaptionTrack` existants produisent la vidéo avec **AAC**, `audit-audible.mjs` revalide sur MP4 encodé la présence réelle du son, loudness, 7 captions et SHA NASA. Workflow dédié `worldvision-film2b-french-narration.yml` ne rerend pas inutilement le long film de régression.

**IMPORTANT droits/prod** : voix Kokoro `ff_siwis` est **audition IA**, pas la voix définitive, ni clonage d'une personne ; poids Apache 2.0, origine SIWIS CC BY 4.0 (crédit et revue commerciale). Ancienne référence Vivienne C5.2 non imposée et pas réutilisée pour Artemis. Source NASA 17 novembre / observations 6 avril à conserver ; visualisation annotée ≠ images photographiques des impacts. Pas de piste Universal Production Music ni média sonore tiers. Statut artefact `internal_review_only`, droits NASA/CSA, voix, sources, smartphone QA non approuvés pour publication.

**NEXT** : ouvrir la PR sonore, inspecter CI au dernier HEAD, si échec corriger VRAI bug, récupérer MP3 de voix + MP4 audible, écouter le reportage, regarder les plans document et captions à 360px, vérifier mot/temps (synthetic speech), comparer le timbre à la référence World-Vision, améliorer l'art direction uniquement sur défaut constaté, demander approbation voix/script et droits avant lancement d'un média international. Mesurer coût/durée. Sauvegarder SHA, PR, Actions, artefact et défauts dans un commentaire GitHub à chaque passage. Garder GDELT, BAOCOM, blog et déploiement V2 séparés.

---

# ÉTAT PRIORITAIRE / 20 NOVEMBRE 2026 : PREMIER VRAI FILM NASA RENDU, SHA ÉPINGLÉS ET CORRECTIF TITRE FRAME 0 À CERTIFIER

**Première réussite FILM-2B** : [GitHub Actions #44769402904](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44769402904) SUCCESS sur `f7bed7e6e...`, artefact `#14645664415`. **Vrai MP4** à 25 s / 750 frames / H.264 1080×1920 **sans audio**, construit avec les TROIS originaux NASA `art002e009627`, `art002e009288`, `art002e016252_impactflash_annotation_cropped`, journal des SHA et des licences `OPEN`. Contrôle indépendant du master : SHA `acded617779c7976ef807df088d30307d0d23170c938e9e3884e6f353f760b01`. C'est un **montage interne muet de vraies images**, pas une vidéo journalistique publiable. La visualisation annotée N'EST PAS une captation des impacts.

**Revue visuelle de ce vrai master** : photos et palette prometteuses, mais **titre absent à frame0**, annotations sur document trop petites en 360px, risque de collision bas d'écran avec UI TikTok. Une **nouvelle révision en cours de certification** ajoute `titleFrameZero` comme option réutilisable au moteur, au JSON/Studio et au premier plan, et épingle les SHA des 3 originaux pour interdire les remplacements silencieux. **Lire intégralement** [audit FILM-2B](worldhealth-vision-v2/media-pilots/artemis2/README.md), [registre sources](worldhealth-vision-v2/media-pilots/artemis2/sources.json), [PR #105](https://github.com/OBIANG5/World-Health-Vision/pull/105). **Le nouveau HEAD devra repasser la CI légère ET les tests core Studio/renderer avant la moindre certification.**

**Suite intelligente non négociable** : vérifier le nouveau MP4 frame 0 puis passer à une nouvelle voix FR choisie et sous licence (Vivienne C5.2 = référence facultative et non audio à recycler), aligner les SRT réels sur la voix, mixage pro contrôlé, visuels NASA sous droits, vérification TikTok à 360px iOS/Android et A/B qualité/rendement. Les quatre plans de la démo sont une hypothèse narrative, pas une obligation universelle. L'importance centrale est qualité internationale à coût/temps de production maîtrisés. Pas de nouveau moteur vidéo ni de publication/merge/deploy automatiques.

---

# REPRISE ACTUELLE — WORLD-VISION MÉDIA — FILM-2B AUTHENTIC NASA (20/11/2026)

**CHANGEMENT D'OBJECTIF OPÉRATIONNEL** : cesser les micro-développements pour eux-mêmes ; produire le premier vrai film court à base de **photos originales sourcées**, avec un coût de montage minimal, puis ajouter la **narration choisie, synchronisation, mix et revue smartphone** pour faire un reportage international publiable. Ne pas forcer 5 grammaires et ne pas réinventer Remotion/FFmpeg.

**Branche active** : `feature/worldvision-film2b-artemis2-authentic-media-2026-11-20`, créée sur FILM-2C **PR #104** (HEAD certifié `d9e5ba4`, GitHub Actions `44734012708`, roundtrip Studio), enfant de FILM-2A **PR #98** (HEAD `eb6bd7d`, Actions `44729319744`, captions sur Player et MP4), elle-même fille de #90 et #87. Les PR restent brouillon, aucune fusion, publication ni déploiement.

**Lire d'abord** [Rapport de production du vrai pilote Artemis II](worldhealth-vision-v2/media-pilots/artemis2/README.md), [projet JSON du film](worldhealth-vision-v2/media-pilots/artemis2/project.json), [sources NASA et conditions d'usage](worldhealth-vision-v2/media-pilots/artemis2/sources.json), puis commentaires PR #104 / #98. **Au moment où ce texte est écrit : pipeline FILM-2B ajouté, mais résultat du HEAD et vrais pixels À CERTIFIER. Ne pas déclarer une vidéo prête pour TikTok.**

**Editorial** : l'actualité est le **nouveau rapport NASA du 17 novembre 2026**, non les observations d'avril présentées comme nouveau phénomène. Durant le survol du **6 avril**, 5 éclairs distincts rapportés par l'équipage sur la face cachée, interprétés comme impacts possibles. Trois ressources NASA originales en lecture seule : `art002e009627` (vraie photo de la Lune), `art002e009288` (vraie photographie Earthset), `art002e016252_impactflash_annotation_cropped` (**simulation lunaire annotée par astronautes**, PAS vraie vidéo/photo des impacts). NASA SVS 15103 est uniquement benchmark : musique tierce Universal Production Music non reprise.

**Implémentation** : nouveau sous-dossier `worldhealth-vision-v2/media-pilots/artemis2/` isolé des workflows CORE lourds ; storyboard original à 4 scènes / 750 frames / 25 s via **le renderer existant** ; téléchargeur NASA original restreint au domaine/format/tailles et rapport des SHA, registres source/attribution, test de faits et de droits fail-closed, QA H264 et SHA entrées/master, CI autonome en revue interne + contact sheet de 8 frames. Aucune image ou musique tierce dans l'historique Git. **Absence volontaire de voix et SRT** : cette version d'essai ne doit pas être prise pour un reportage achevé. Référence vocale historique appréciée `Vivienne C5.2 · Impact média` +8 %, mais **pas imposée** et usage commercial à auditer pour une nouvelle prise.

**Pour reprendre intelligemment** : ouvrir la PR FILM-2B et vérifier la CI sur le HEAD ; si NASA CDN échoue, corriger à partir des **identifiants officiels**, pas de média de substitution. Si vert, télécharger le vrai MP4, lire les frames **0, 3, 6, 9, 12, 15, 18, 21 secondes**, le regarder en 360px avec overlays TikTok, noter les défauts. Épingler les SHA des assets pour empêcher changements ultérieurs invisibles. Ensuite composer un **nouveau master avec vraie voix librement choisie et droits**, caler son SRT sur le vrai signal, mix/ducking mesuré et vérifier iPhone/Android. Évaluer qualité artistique contre Bourse Express / géopolitique / Gabon (bleu-cyan, lisibilité, espace écran), puis produire des presets basés sur les plans approuvés. Garder GDELT/blog/BAOCOM séparés. Documenter SHA, PR, Actions, média et défauts dans commentaire GitHub à la fin ; éviter les commits de pure documentation pendant les rendus.

---

# REPRISE ACTIVE — 20 NOVEMBRE 2026 — FILM-2C / STUDIO RÉOUVRABLE

**La dernière étape MEDIA techniquement CERTIFIÉE est FILM-2A PR #98**, commit `eb6bd7dbb283733dd12baa51db3b5e80b763e01b`, [Actions #44729319744](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44729319744), **2/2 jobs SUCCESS**, ancien film cinq scènes H264/AAC 745 frames, nouveau MP4 avec deux cues de captions, Node/TypeScript, Player Chromium et tests audio. Artefact `#14626087265`, expire 27 novembre 2026, 11:48 UTC. Certification TECHNIQUE uniquement, aucun vrai reportage ni publication.

**BRANCHE MEDIA DE TRAVAIL SUIVANTE :** `feature/worldvision-studio-project-roundtrip-2026-11-20`, fille directe de FILM-2A PR #98. **Lire d'abord** [Rapport complet Studio Roundtrip FILM-2C](worldhealth-vision-v2/docs/media/WORLDVISION_STUDIO_PROJECT_ROUNDTRIP_2026-11-20.md), puis [FILM-2A captions](worldhealth-vision-v2/docs/media/WORLDVISION_FILM2_CAPTIONS_AUDIO_REUSE_2026-11-20.md), puis [FILM-2B préproduction](worldhealth-vision-v2/docs/media/FILM2B_PREPROD_ARTEMIS2_IMPACT_FLASHES_2026-11-20.md), et les commentaires PR #98. **Statut FILM-2C : CODE AJOUTÉ, CI HEAD À CERTIFIER** ; ne jamais annoncer succès avant dernière Actions.

**Pourquoi FILM-2C :** l'atelier exportait JSON mais ne savait pas recharger un projet, faisant perdre du temps à chaque correction. Ajout d'une réouverture stricte JSON, restauration des plans GEO/PHOTO/DATA/doc, données et citations, voix/musique choisies, cues per-position et identifiant stable, retrait de toute substitution silencieuse des fichiers manquants. Tests Node négatifs et **vrai navigateur Chromium 390px** import→réattachement de photo synthétique→export JSON exact→rejet d'import invalide, sans réinitialiser l'existant. Les binaires média restent sur le disque du monteur, jamais téléversés. Aucune dépendance tierce ni service payant.

**Prochaine priorité après CI** : FILM-2B — premier reportage premium réellement sourcé, droits et provenance des 2–3 assets NASA contrôlés, script « nouveau rapport publié le 17 novembre » et non nouvel impact du 20 novembre, voix FR libre/licenciée, sous-titrage exactement calé sur audio, mixage, vrais pixels TikTok iPhone/Android, métrique qualité/temps/coût ; ensuite bibliothèque de séquences réutilisables approuvées. Aucune nouvelle batterie de micro-effets gratuits. BAOCOM/GDELT/blog/V2 nationale séparés. **Pas de merge, déploiement ni publication sans approbation explicite.**

---

# REPRISE PRIORITAIRE — 20/11/2026 — FILM-2A : SOUS-TITRES SRT PARTAGÉS + REPORTAGE PREMIUM ENSUITE

**Nouvelle branche active :** `feature/worldvision-editorial-film2-captions-2026-11-20`, fille PR #90 (skills) et PR #87 (film multi-scènes). Instruction utilisateur : maximiser **qualité internationale et vitesse de réalisation**, NE PAS réinventer des outils existants et conserver un journal GitHub exact.

**Implementation FILM-2A en cours de validation** : lecteur SRT partagé `src/caption-timeline.mjs`, calque `src/CaptionTrack.tsx`, cues globaux branchés dans `CreativeEdit.tsx` / `render-project.mjs` / `validate-project.mjs`, collage SRT et placement upper/lower dans l'atelier, tests Node et Chromium, render H.264 synthétique supplémentaire. Exemple de réutilisation : l'ancien master 43s du 14 novembre conservait déjà 13 SRT et un JSON, mais **son récit n'est pas autorisé pour republier une actualité**. Copier les méthodes techniques, pas les assertions journalistiques.

**LIRE ABSOLUMENT :** [rapport complet FILM-2](worldhealth-vision-v2/docs/media/WORLDVISION_FILM2_CAPTIONS_AUDIO_REUSE_2026-11-20.md), puis [audit artistique Sprint12](worldhealth-vision-v2/docs/media/SPRINT12_VERIFIED_PIXEL_REVIEW_AND_SKILL_BENCHMARK_2026-11-20.md), puis PR #90/#87. Résultats du commit de code nouveau **à vérifier sur GitHub Actions avant succès** ; les deux anciens runs verts de PR #90 concernent le parent, pas FILM-2.

**APRÈS CI** : lire vrai master captioned + Player 360px ; correction des bugs de captions et des conflits typographiques ; puis premier **reportage réel de 20–40 s, sourcé, sous droits, voix choisie librement, SRT vrai synchronisé, mixage/ducking mesuré et QA sur iPhone/Android**. Les 5 grammaires ne sont pas obligatoires à chaque sujet. Pas de merge/déploiement/publication sans accord. BAOCOM/GDELT/blog séparés.

---

# WORLD-VISION — COMMENCE ICI POUR REPRENDRE UN CHAT BLOQUÉ

## 20 NOV. 2026 — SKILLS MÉDIA / CLAUDE CODE + CODEX (CHANTIER PARALLÈLE AU FILM)

**NOUVELLE BRANCHE DE DOCUMENTATION ET OUTILLAGE AGENT :** `feature/worldvision-media-agent-skills-2026-11-20` fille de **PR #87 FILM-1**. Nous continuons la création du vrai studio GEO→PAYS→PHOTO→DATA→DOCUMENT ; recherche de skills **en parallèle**, pas une interruption ni une réécriture du moteur. Lire impérativement [ÉVALUATION DES SKILLS](worldhealth-vision-v2/docs/media/MEDIA_AGENT_SKILLS_EVALUATION_2026-11-20.md), qui compare sources *vérifiées au 20/11/2026*, utilité exacte, limites et sécurité.

**Skills compatibles réellement créés dans le dépôt** : `.agents/skills/worldvision-media-director/SKILL.md` (Codex) et `.claude/skills/worldvision-media-director/SKILL.md` (Claude Code), strictement identiques. Des `AGENTS.md` ciblés dirigent les tâches sur `services/media-renderer` et `frontend/web-v2/src/media` vers cette compétence. Un workflow `worldvision-media-skills-guard.yml` compare les deux, vérifie les sources et refuse tout script tiers non audité. **Premier run tests 3/3 SUCCESS : [#44713492928](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44713492928)**, SHA `8678e7353af92b7602592cef23be4e3ce374c41a`. Les edits AGENTS.md suivants ne changent pas les deux skills testés.

**Choix techniques étudiés** : priorité à `remotion-dev/skills` (officiel, markup/mapping/captions/audio), `whaleyxbt/claude-motion` (review-loop, beat grid, sound design), `heygen-com/hyperframes` (catalogue de motions comme référence, runtime HTML/GSAP séparé) et `charlie947/motion-graphics-skills` (briefs, chart, documentary). Ne pas installer automatiquement les centaines de packages : **tous les scripts/mises à jour/achats/telemetry nécessitent revue et compatibilité**. Aucune nouvelle dépendance ou facturation engagée. Claude et Codex partagent le format SKILL.md mais ont leurs chemins de chargement différents ; ces fichiers ne constituent pas en eux-mêmes une installation de plugin dans ChatGPT.

**AUDIT PIXELS EFFECTUÉ après correction :** [11 frames et actions de réalisation](worldhealth-vision-v2/docs/media/SPRINT12_VERIFIED_PIXEL_REVIEW_AND_SKILL_BENCHMARK_2026-11-20.md). Globe très prometteur, mais PHOTO/DATA/DOC trop plats et sous-utilisation de l'écran mobile ; les titres entrant après fondu sont maintenant propres. Les prochains plans doivent être guidés par une vraie information et des rushes sous droits, pas des effets ajoutés pour leur beauté.\n\n**FILM-1 réellement validé avant le chantier skills :** PR #87 Actions [#44710009215](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44710009215), SHA `db7c6ed4` : 31 tests unitaires, 11 parcours Chromium et un MP4 745 frames H.264/AAC, 24,83 s ; la correction des titres doublés aux transitions 145/300/455 est confirmée, artefact GitHub #14617551866 téléchargé et ses onze images inspectées. **Encore synthétique et NON publiable** ; qualité artistique trop inégale : globe prometteur mais PAYS/PHOTO/DATA/DOCUMENT encore trop plats et vides, pas de vraie voix ni images licites.

**SUITE LA PLUS INTELLIGENTE :** consulter la PR skills puis lancer le prochain vrai chantier de vidéo journaliste : sélectionner événement vérifié et sources autorisées, diriger un scénario où chaque plan justifie sa présence, préférer charte vidéo World-Vision, ajouter vraie voix librement choisie/sous-titres calés, sfx et master audio, comparer l'amélioration à l'échelle TikTok par véritable contact sheet. Les deux références « Bourse Express » et carte géopolitique restent les benchmarks, la vidéo Gabon reste direction esthétique appréciée. Ne jamais copier les marques/rushes d'autrui. GDELT, BAOCOM, statistiques institutionnelles, blog = chantiers séparés.

---

### FILM-1 / AUDIT VISUEL DES VRAIS PIXELS — 20 NOVEMBRE

La [PR #87](https://github.com/OBIANG5/World-Health-Vision/pull/87) a réussi un premier master **#44707929919** sur `2007bd82` (**30/30 tests Node, 11 Player, H.264/AAC 745 frames**, artefact **#14616267195**). Les **onze captures réelles** ont ensuite révélé un défaut NON détecté par la CI : **deux titres visibles simultanément** aux raccords 145, 300, 455. Ne surtout pas considérer cette version comme artistique finale.

Correctif `editorial-text-handoff.mjs` appliqué à GEO/PAYS/PHOTO/DATA : incoming title invisible durant les dix frames du fondu, alors que l'image suivante peut entrer ; réapparition ensuite en douze frames. Tests Node et Chromium DOM d'opacité ajoutés, workflow GitHub muni d'une concurrence/cancellation par branche pour ne plus multiplier les rendus. **NOUVEAU RUN à examiner** : [#44709786780](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44709786780), SHA de code de départ `03fceacb9344d57fd87174bb64ff18ece99fb2f0`. Lire le vrai HEAD et les dernières preuves ; si la CI est verte, télécharger l'artefact, inspecter les images 145/300/455/610 et seulement ensuite certifier Sprint12. Rapport détaillé [Sprint12 §7](worldhealth-vision-v2/docs/media/WORLDVISION_INTEGRATED_FILM_SPRINT12_2026-11-20.md).

**Ensuite (pas une autre démo de 5 slides)** : une vraie vidéo de reportage avec script sourcé, photos/vidéos sous licence, sources primaires et unités datées, voix humaine sélectionnée librement, sous-titres fidèles, mixage/ducking et contrôle de publication. Préserver la direction Gabon appréciée ; pas de faux événements/faux médias. Les branches restent en DRAFT.

---


## 20 NOV. 2026 — MEDIA SPRINT 12 : FILM MULTICOUCHE COMPLET

**BRANCHE À REPRENDRE :** `feature/worldvision-editorial-film-five-scene-integration-2026-11-20`, fille de PR #84 DATA ; historique empilé #44→#72→#74→#80→#84→Sprint12. **AUCUNE FUSION/DEPLOIEMENT/PUBLICATION.** Rapport obligatoire : [WORLDVISION_INTEGRATED_FILM_SPRINT12_2026-11-20.md](worldhealth-vision-v2/docs/media/WORLDVISION_INTEGRATED_FILM_SPRINT12_2026-11-20.md).

**Objectif unique de Sprint12 :** ne plus démontrer des plans isolés. Construire/valider **un master de 24,833s et 745 frames** reliant **globe Natural Earth → pays 10m/50m → photographie multicouche → graphique daté/sourcé → document inspecté**, avec **quatre fondus de 10 frames et un vrai audio AAC continu**. Tous les médias non-cartographiques et les chiffres restent **synthétiques et explicitement non journalistiques**, le son est un oscillateur de QA et absolument pas un narrateur. Les cinq scènes doivent être identiques dans le Player V2 et le rendu H.264, avec 11 frames Chromium et rapport EDL de durées exactes. Code : `creative/build-ci-fixtures.mjs`, `creative/editorial-timeline.mjs` et tests, `creative-player-smoke.tsx`, `creative/test-player-browser.mjs`, workflow vidéo. **STATUT : code et garde-fous ajoutés, attendre CI du SHA final et contrôler les vraies images avant d'annoncer réussite.**

**CERTIFICATION précédente :** Sprint11 PR #84 sur `00b3e822c92794ef477aca36002c664d8759c47c` a réussi Actions **#44705502118**, 27/27 tests Node, 10 parcours Chromium, data H264 495 frames, vrai temps ISO proportionnel et titre visible frame 0 ; rapport Sprint11 amendé. La PR #83 DATA concurrente a un ajout potentiel de comparaisons signées, mais ne pas la fusionner ; PR #79 PHOTO archivée. Ne pas compromettre les bonnes valeurs du rendu Gabon.

**PROCHAINE ÉTAPE après film vert :** film éditorial **réel** (sujet vérifié + photo/rush sous licence + sources primaires datées + voix humaine sélectionnée + sous-titres mot à mot + mixage professionnel), revue TikTok réelle sur iPhone/Android, test du rendu niveau média international, et validations explicites avant mise en ligne. BAOCOM séparé ; script/recherche dans ChatGPT ; GDELT/blog hors de cette branche.

---

### 20 NOV. 2026 — REPRISE EXACTE SPRINT 11 APRÈS INTERRUPTIONS

Le dernier run **#44634270490** (SHA `4c3494e507b53b5c72d73e856ca3cfcc41d1c656`) est **2 jobs SUCCESS** et le run jumeau #44634282857 est lui aussi vert. **26/26 tests Node, 10/10 paths Chromium**, vrai H264 DATA de **16,5 s / 495 frames / 1080×1920**, artefact **#14582924805** vérifié par extraction des 9 véritables captures du Player. Espacements mobiles métriques contrôlés, ancienne collision sous-titre/source corrigée. Le rendu demeure silencieux, synthétique et pas encore prêt au reportage réel.

Améliorations en cours le 20 novembre : **axe de temps proportionnel aux dates ISO réelles** (et non indice du point), et **titre visible dès le premier photogramme**. Commits `b55cef07` + `00b3e822` ; nouvelle CI [#44705502118](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44705502118) à contrôler sur HEAD, NE PAS attribuer les résultats verts précédents à ces nouveaux commits avant réussite.

**Risque de branche concurrente :** [PR #83](https://github.com/OBIANG5/World-Health-Vision/pull/83) autre DATA avec comparaisons signées et méthodologie; échec Chromium timeout sur dernier HEAD. **PR #84 reste la référence DATA, #83 ne doit pas être fusionnée côte à côte** ; relever les innovations utiles pour un futur port ciblé. Même principe pour PR #79 PHOTO archivée face à #80 canonique.

**NEXT** après dernière CI : une vraie *séquence complète* de plusieurs plans (GEO→PAYS→PHOTO→DATA→DOCUMENT) et une bande sonore/sous-titres préparés de façon licite, vraie revue de la cohérence visuelle, A/B iPhone/Android. Lire [Rapport Sprint11](worldhealth-vision-v2/docs/media/WORLDVISION_DATA_MOTION_SPRINT11_2026-11-19.md), consulter dernier commit et tests et ne pas redémarrer la même fonctionnalité par mégarde.

---


## WORLD-VISION MEDIA — SPRINT 11 DATA MOTION (19 NOV. 2026)

**NOUVELLE BRANCHE MÉDIA dédiée :** `feature/worldvision-data-motion-sourced-charts-2026-11-19` empilée sur la PR #80 PHOTO. Lire [WORLDVISION_DATA_MOTION_SPRINT11_2026-11-19.md](worldhealth-vision-v2/docs/media/WORLDVISION_DATA_MOTION_SPRINT11_2026-11-19.md). Le logiciel sait désormais *en code de branche* préparer des **courbes temporelles, classements avec ex æquo et heatmaps de valeurs** via `data_story`/Remotion, dans le vrai Player et les MP4. La source, l'institution, l'indicateur, la date, l'unité et **l'intervalle explicite de l'axe** sont FOURNIS par le journaliste. Les classements/heatmaps partent de zéro ; les dates de courbe doivent être réelles et chronologiques. Le Studio fournit un formulaire complet et une saisie de série `DATE|LIBELLÉ|VALEUR`. Tests et films à vérifier : **ne pas annoncer ce nouveau Sprint 11 comme certifié avant la CI et les vrais pixels**.

**État des fondations :** PR #44 Studio, #72 GEO, #74 pays/50m/10m, #80 PHOTO, désormais PR DATA. Tous drafts, aucune fusion dans V2, aucune publication. La PR #79 est **un prototype PHOTO concurrent à garder en référence**, pas un second template à intégrer en parallèle ; la préférence d'architecture est #80, avec tests sur images réelles à poursuivre. [CI PHOTO #44629579242](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44629579242) **2/2 vert, 21/21 tests, vrai film 165 frames** sur SHA `3df37e5`; des commits PHOTO plus récents requièrent leur propre validation exacte.

**SUITE :** inspecter vrais MP4/PNG DATA → corriger la lisibilité, préserver le retour favorable sur la vidéo Gabon → film journalistique complet GEO→PAYS→PHOTO→DATA→DOCUMENT avec narrateur libre et droits vérifiés, puis motion AUDIO/TEXTE, tests iOS/Android et rendu premium. Ne pas revenir à des slides séparées ; **une image porte plusieurs animations utiles en parallèle**. Source/script depuis ChatGPT pour le moment, BAOCOM séparé, blog/GDELT hors du Studio.

---

## WORLD-VISION MEDIA — SPRINT 10 PHOTO MOTION / UNE IMAGE SIX PISTES (19 NOV. 2026)

**Nouvelle branche empilée sur PR #74 :** `feature/worldvision-photo-multilayer-motion-tracks-2026-11-19`, toujours **DRAFT, aucune fusion V2, aucun déploiement**. Référence centrale : [WORLDVISION_PHOTO_MULTILAYER_SPRINT10_2026-11-19.md](worldhealth-vision-v2/docs/media/WORLDVISION_PHOTO_MULTILAYER_SPRINT10_2026-11-19.md). Suite directe des vidéos références Bourse Express/géopolitique : l'objectif est **UNE photographie réelle et plusieurs mouvements simultanés**. Template `photo_story`, moteur `photoTrackPose` déterministe, six pistes séparées (caméra, masque, premier plan transparent, focus lié à la caméra, compteur avec attribution, typographie) en même composition Remotion Player+MP4. L'atelier dispose de véritables réglages de chaque piste ; le validateur refuse les zooms, positions, durées et données incompatibles. Fixtures purement synthétiques, pas une actualité.

**Validation à faire avant succès** : consulter Actions du HEAD précis de la future PR Sprint 10 (Node, rendu H.264, Player Chromium 0/40/85/145), télécharger vraie vidéo et captures puis inspecter les pixels, droits, lisibilité, performances mobile. Le Sprint 9 précédent est techniquement vert sur `b553f7d` (#44624747361, 19 tests et titre↔carte 17,48 px) ; ses limites artistiques ne sont PAS résolues par photo_story. Ne pas prétendre au niveau mondial sans essais comparatifs.

**Étapes suivantes** : corriger PHOTO jusqu'au rendu convaincant, puis DATA (charts/heatmaps/ranking et sources/unités), séquence film `globe → pays → photo → chiffres`, audio/sous-titres/voix au choix, benchmark réel iOS/Android. Ne rien connecter à BAOCOM; script/actualité avec ChatGPT; pas de blog/GDELT dans cette PR.

---


## WORLD-VISION MEDIA — SPRINT 9 GEO-2 CERTIFIÉ TECHNIQUEMENT (19 NOV. 2026)

État fiable et contrôlé : [PR #74](https://github.com/OBIANG5/World-Health-Vision/pull/74) code `country_focus` 10m/50m, carte/pays/média/donnée/texte multicouches. **Dernier code fonctionnel vérifié : `b553f7d38c4111ec8de02e43e1a2dbbf1f614c82`** ; [run #44624747361](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44624747361) **2 jobs SUCCESS, 19 tests Node PASS, six parcours Chromium PASS**. Vérification vraie vidéo 5,5 s 1080×1920 H.264 et photogrammes : l'espace titre→carte est passé de 3,8 à **17,48 px**, le bas de la carte est au-dessus du cartouche photo, contour 10m source Natural Earth et contexte 50m visibles. Artefact #14578693543 conserve toutes les preuves.

**Attention** : qualité artistique mondiale, médias éditorialement sourcés/licenciés et Safari/Android NON certifiés. La PR reste DRAFT, aucune fusion/déploiement/publication. Le cap directeur depuis les vidéos Bourse Express et géopolitique demeure **UNE même image avec plusieurs mouvements indépendants et chorégraphiés**. La suite prioritaire est PHOTO Motion multi-pistes, puis DATA, puis séquence globe→pays→photo/document avec voix/mix. Lire le rapport détaillé [Sprint 9 §8](worldhealth-vision-v2/docs/media/WORLDVISION_COUNTRY_FOCUS_GEO2_SPRINT9_2026-11-19.md). BAOCOM reste séparé, recherche/script dans ChatGPT, narrateur libre, blog/GDELT différés.

---


## WORLD-VISION MEDIA — SPRINT 9 / AUDIT VISUEL ET CORRECTIONS (19 NOV. 2026)

**Reprise prioritaire** : PR #74, branche `feature/worldvision-country-focus-10m-multilayer-2026-11-19`. Lire le [rapport complet GEO-2 §7](worldhealth-vision-v2/docs/media/WORLDVISION_COUNTRY_FOCUS_GEO2_SPRINT9_2026-11-19.md). Contrairement aux premiers builds, nous avons téléchargé et **inspecté les vraies captures Player/MP4** de la CI #44621299587 : carte Gabon 10m, contexte 50m, photo synthétique, compteur et titre réellement animés en même temps. **Deux défauts graphiques avérés** : image 0 trop vide et bas du pays recouvert par la photo. Ils ont été corrigés dans le code (emprise carte déplacée et portrait séparé, base visuelle dès frame 0) et des tests de non-régression ajoutés. Rayon des pays voisins passé de 1,25 rad constant à un choix adaptatif à la taille de la géométrie pour réduire les 709 064 caractères de path observés. Tests Fidji/Russie ajoutés. **Ne PAS annoncer correction artistique définitive sans relire le run #44622728753 et ses images.**

Statut : PR #74 en brouillon, ni merge dans V2 ni déploiement, aucune actualité inventée. Ensuite PHOTO multicouche (image unique, 3–6 motions) et DATA, après analyse film + iOS. Sources et script dans ChatGPT; voix libre; BAOCOM complètement séparé; pas de GDELT/blog dans cette PR.

---

## WORLD-VISION MEDIA — GEO-2 / SPRINT 9 COUNTRY FOCUS (19 NOV. 2026)

**Continuité du besoin initial** : références Bourse Express (finance), vidéo géopolitique et globe-œil lumineux ; nécessité centrale = plusieurs animations de qualité en parallèle sur UN plan / une seule image, pas une succession de diapositives. Base vérifiée : PR #72 (GEO Director Sprint 8), dernière CI avant départ #44617612706 SUCCESS, mais pays trop petit sur l'œil.

**Nouvelle branche isolée :** `feature/worldvision-country-focus-10m-multilayer-2026-11-19`, empilée sur PR #72 ; **nouveau `country_focus` 1080×1920**, vrai polygone Natural Earth/World Atlas 10m, contexte 50m, caméra de carte, reveal contour, média/alpha cutout importés, marqueur appartenant au pays, chiffre fourni, titre et sous-titre chorégraphiés. Source de vérité et checklist : [WORLDVISION_COUNTRY_FOCUS_GEO2_SPRINT9_2026-11-19.md](worldhealth-vision-v2/docs/media/WORLDVISION_COUNTRY_FOCUS_GEO2_SPRINT9_2026-11-19.md). **CI et rendu de cette nouvelle branche à vérifier, ne présumer aucun succès.** Pas de merge, déploiement, diffusion ou licence accordée.

**Prochaines étapes obligatoires :** réconcilier tests+pixels, tester petits pays/archipels et géopolitiques disputées, créer continuité `geo_story -> country_focus -> photo`, puis pack PHOTO (UNE image + 3–6 mouvements utiles) et DATA (courbes/heatmap/ranking). Script/sources restent ChatGPT+utilisateur ; Vivienne optionnelle ; BAOCOM séparé ; GDELT/blog hors du Studio.

---

## WORLD-VISION MEDIA — SPRINT 8 / GEO DIRECTOR + BIBLIOTHÈQUE DE MOTIONS (19 NOV. 2026)

**Reprise à partir des références utilisateurs** : deux vidéos verticales (finance/graphes, géopolitique/cartes) + image de l'œil/globe ; objectif **plusieurs animations sophistiquées simultanées sur la même image** et véritable motion design international, et non multiplication de maquettes simples. La direction est le pack GEO puis DATA, PHOTO 2,5D multi-couches, EDITORIAL, documentaire et AUDIO.

**Branche indépendante (non fusionnée / non déployée)** : `feature/worldvision-geo-camera-country-spotlight-2026-11-19`, empilée sur PR #44 (branche `feature/worldvision-cinematic-director-gates-2026-11-19`, toujours DRAFT). Rapport détaillé : [WORLDVISION_GEO_DIRECTOR_SPRINT8_2026-11-19.md](worldhealth-vision-v2/docs/media/WORLDVISION_GEO_DIRECTOR_SPRINT8_2026-11-19.md). Implémentation : `geo-motion-camera.mjs`, pose géodésique déterministe D3 et Three, zoom optique contrôlé ≤15 %, surlignage de pays depuis véritables géométries Natural Earth 110m, commandes dans Studio, validation et tests Node/Chromium. **Vérifier la CI de la PR Sprint 8 et inspecter ses vrais MP4/PNG avant toute certification.** Les fichiers d'essai ne représentent aucune actualité.

**Règles maintenues** : scripts/recherches dans ChatGPT pour le moment, voix libre (Vivienne possible, non imposée), véritable montage média, BAOCOM totalement séparé, GDELT/blog global différés. Aucune auto-publication, pas de licences supposées. Bien distinguer test technique et qualité artistique. **Prochaine priorité** : lecture des preuves CI, alignement NASA/frontières/camera dans les images, puis country-focus à échelle 50m/10m dans un plan dédié, puis photo multicouche + data motion, QA iPhone/TikTok et voix/mix.

**Contrôle Sprint 8 effectivement réalisé** : Actions [#44615478166](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44615478166) sur le commit de code `f34ae7c` : 2 jobs SUCCESS, 16 tests Node sur 16, MP4 réel H.264 150 images / 5,0s / 1080×1920, 4 captures du vrai Player Chromium, 0 erreurs navigateur. Artefact 14573009991 téléchargé et **pixels réellement inspectés**. Résultat : NASA / D3 / overlays visibles, déplacement caméra fonctionnel ; mais country spotlight trop discret, masqué par le marqueur ; œil blanc dominant et géographie 110m insuffisante pour le vrai zoom pays. Verdict technique positif, **artistique non validé**. [Rapport §7](worldhealth-vision-v2/docs/media/WORLDVISION_GEO_DIRECTOR_SPRINT8_2026-11-19.md). [PR #72](https://github.com/OBIANG5/World-Health-Vision/pull/72) DRAFT. Commit `a149b225` renforce les filtres de CI et son workflow [#44616853136](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44616853136) a conclu **2 jobs SUCCESS**. Suite : country-focus 50m/10m puis PHOTO/DATA multi-couches.

---

## WORLD‑VISION MEDIA — GLOBE NASA 3D / SPRINT 7 (19 NOV. 2026)

**PR #44 DRAFT, non fusionnée/non déployée.** Fichier canonique à lire immédiatement : [WORLDVISION_GEO_BLUE_MARBLE_SPRINT7_2026-11-19.md](worldhealth-vision-v2/docs/media/WORLDVISION_GEO_BLUE_MARBLE_SPRINT7_2026-11-19.md). Ne jamais oublier la continuité des Sprints 1–6 (ingestion script/médias, plan isolé, film entier, documentaire, voix libre/FFmpeg, QA des transitions, motion 2,5D, geo/D3). BAOCOM indépendant et NON connecté, GDELT/blog global différés, scripts/recherche préparés ici avec ChatGPT.

**Correction majeure à ne jamais annuler :** le premier globe 3D photo NASA apparaissait cyan uniforme parce que deux **anciens cercles SVG pleins se superposaient au matériel photo**. Premier rendu entièrement testé [#44567135931 SUCCESS](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44567135931), mais les pixels ont révélé cette erreur visuelle ; artefact 14553635432, frame96 inspecté. En mode `geo.look="photo"`, ces cercles sont désormais des **contours uniquement** et le disque photo NASA est visible. Terre agrandie de r399 à r463, centre [540,690], œil lumineux blanc/cyan derrière le globe, fonds de texte protégés. Points sur l'hémisphère arrière masqués explicitement. Matériau officiel : NASA Blue Marble NG juin 2004, **pas données satellites actuelles**, SHA-256 épinglé `dc059529b8ed1cfcdd59747a7c3f259c93c1322bf88ca1ec8bab1dd71fcc57f5`.

**État** : le code est committé, le dernier rendu amélioré et son contrôle de latitudes/frontières/éclairage **doivent encore être inspectés** avant déclaration de résultat final. Prochainement : rendu MP4 + captures Chromium, comparaison à l'image fournie, alignement NASA-D3, lumières/nuages/océans, puis photo multi-animation/data motion/voix/sound design/Content OS audiovisuel. Ne jamais se satisfaire d'un test technique sans regarder la vidéo.

---

## MEDIA WORLD‑VISION — SPRINT 6 / PACK GEO MULTI‑ANIMATIONS (19 NOV. 2026)

**Nouvelle référence de reprise :** [WORLDVISION_GEO_MOTION_PACK_SPRINT6_2026-11-19.md](worldhealth-vision-v2/docs/media/WORLDVISION_GEO_MOTION_PACK_SPRINT6_2026-11-19.md). PR [#44](https://github.com/OBIANG5/World-Health-Vision/pull/44) toujours **DRAFT**, non fusionnée/non déployée. **Ne pas connecter BAOCOM, imposer Vivienne, écrire/rechercher automatiquement le script ou commencer le blog/GDELT dans le Studio.** Les scripts/recherches restent dans cette conversation ChatGPT ; le code réalise motion, montages, média, son, effets, export.

**Références utilisateurs analysées :** deux MP4 privés : 94,57 s finance « Bourse Express » (nombre, courbes, cartes, heatmap, ticker) et 59,49 s géopolitique (fond satellite, pays drapeau, photos, changements de région), plus image fournie d'un globe européen/africain très lumineux encerclé d'un œil bleu-cyan. Les vidéos et images privées **ne sont pas copiées dans le GitHub**. Objectif : dépasser ces vidéos en combinant plusieurs animations indépendantes dans un même plan.

**Nouveau code** : `services/media-renderer/src/GeoStory.tsx`, template `geo_story` dans la vraie composition `CreativeEdit.tsx`, cartographie **Natural Earth/World Atlas 110m** projetée avec **D3 Geo**, rotation, globe cyan, œil lumineux, frontières, arc de grand cercle, marqueur pulsant, image/vidéo fournie, compteur strictement fourni, titre. Contrat et UI de saisie lon/lat/route/donnée, exports identiques Preview+MP4 et vérifications. Fichiers modifiés : `creative/validate-project.mjs`, `render-project.mjs`, tests et fixture `geo-story.synthetic.example.json`, `CinematicProductionBoard.tsx`, dependencies D3/TopoJSON/World Atlas dans renderer+frontend, lockfile V2, Vite alias, test Chromium + CI.

**Preuve déjà inspectée** : MP4 vertical **5s/1080×1920** issu de `geo-motion-intro.mp4`, captures `player-geo-frame-0/48/96/138.png` ; la géographie réelle, les frontières et les mouvements sont visibles. La qualité est **encore vectorielle** et non le photoréalisme du globe de référence. Un ancien CI a produit le renderer mais a échoué sur résolution Vite de l'atlas ; correction d'alias et dépendances verrouillées effectuée. **Consulter le HEAD et le dernier CI pour vérifier la version finale**, pas un ancien run. Les captures ont conduit à rapprocher photo, donnée et globe et à replacer le titre dans une zone plus sûre du format mobile ; le test de chevauchement a été renforcé.

**Étapes prioritaires** : 1) rendre le dernier CI vert et inspecter les nouveaux PNG/MP4 avec mesure mobile ; 2) texture réelle NASA Blue Marble, moteur Three.js/@remotion/three avec géométrie/frontières alignées et fallback vectoriel ; 3) carte/pays et trajets source-contrôlés, zoom précis à haute résolution ; 4) data motion finance et animations photo multi-couches ; 5) révisions sans destruction/cache, TTS choisi par humain et mix pro, iOS/Android, Content OS média limité. **Ne pas confondre CI fonctionnelle et niveau graphique mondial acquis.**

---

## SPRINT 5 — RENDU DOCUMENTAIRE VALIDÉ (19 NOV. 2026) — REPRENDRE ICI

**État exact :** [PR #44](https://github.com/OBIANG5/World-Health-Vision/pull/44) toujours **DRAFT**, sans fusion ni déploiement public. Lire en premier [WORLDVISION_DOCUMENT_FOCUS_SPRINT5_2026-11-19.md §7–9](worldhealth-vision-v2/docs/media/WORLDVISION_DOCUMENT_FOCUS_SPRINT5_2026-11-19.md). **GitHub Actions [#44546198363 : deux jobs SUCCESS](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44546198363)**, 12 tests Node, build V2 et vraie vidéo de document + 4 séquences de test Player Chromium. Le MP4 d'exemple et quatre captures du document ont été téléchargés et examinés.

**Nouveauté concrète :** `document_focus` dans le même `CreativeEdit.tsx` pour V2 et master MP4, piloté par un rectangle x/y/largeur/hauteur sélectionné sur **l'image source fournie**, zoom optique et texte journalistique fourni ici, **aucun faux passage/citation**. La vidéo commence désormais avec le document visible ; le panneau de texte ne recouvre pas la page (mesure Chrome : **9,86 px de séparation** sur preview 360×640 ; **15,87 px de marge au-dessus du seuil inférieur**). Un premier run a révélé un recouvrement de 13,5 px, **corrigé** puis validé. Sources de test synthétiques (aucune actualité créée artificiellement).

**Prochaine action à haute valeur ajoutée :** monter un vrai contenu d'actualité avec un script préparé ici, des médias authentiques autorisés et une narration choisie librement, réaliser 2 variantes de niveau éditorial exigeant puis regarder **les MP4 et l'écran TikTok réel**. Ensuite workflow de révision non destructif/cache par plan, vraie qualité voix/mix/alignement, droits, stockage privé et Content OS exclusivement audiovisuel. Ne pas revenir aux onze portes imposées, à Vivienne obligatoire ou à une connexion BAOCOM. GDELT/blog global différés.

---

## NOUVEAU POINT DE REPRISE — MEDIA SPRINT 5 : PREUVE VISUELLE AUTHENTIQUE (19 NOV. 2026)

**Relire d'abord [WORLDVISION_DOCUMENT_FOCUS_SPRINT5_2026-11-19.md](worldhealth-vision-v2/docs/media/WORLDVISION_DOCUMENT_FOCUS_SPRINT5_2026-11-19.md) (§ 7–8)**, puis la [PR #44](https://github.com/OBIANG5/World-Health-Vision/pull/44) toujours DRAFT, non fusionnée, non déployée.

La suite du Sprint 4 a créé `document_focus`, une véritable mise en scène Remotion de **l'image documentaire originale** et d'un **rectangle x/y/largeur/hauteur explicitement choisi** : arrivée de la page, zone surlignée, rapprochement optique limité, texte fourni ici, sans citation ni chiffre fabriqués. Même composition pour l'export MP4 et le Player V2. Contrat vérifié par `validate-project.mjs`, interface avec 4 curseurs et page complète non retapée. Aucun lien BAOCOM, aucune voix obligatoire, aucun GDELT/blog ; recherche/script demeurent ici avec ChatGPT.

**Preuve positive initiale** [CI #44544197428 SUCCESS](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44544197428), 12 tests Node, rendu H.264, 4 captures Chromium et source synthétique. **La revue des captures a identifié un début noir et un titre empiétant sur le document ; correction réalisée.** [CI #44545458500](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44545458500) a volontairement **échoué** sur la géométrie : recouvrement mesuré de **13,5 px** au format 360×640, malgré un build frontend vert. Le cadre documentaire a alors été raccourci à 830px Remotion en conservant les légendes dans la zone sûre. **Contrôler le nouveau run [#44546198363](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44546198363) pour le verdict du HEAD de code, puis ouvrir les quatre images et le MP4.**

**À venir** : corriger si le nouveau contrôle échoue, préserver l'état et les preuves ; ensuite une vraie vidéo World‑Vision avec script et médias authentiques autorisés, direction artistique A/B, versioning par plan, son professionnel, tests iPhone/Safari, Content OS audiovisuel limité. Aucun test technique ne garantit viralité ni « qualité mondiale ».

---

## WORLD-VISION MEDIA — SPRINT 4 VALIDÉ TECHNIQUEMENT (19 NOVEMBRE 2026)

**PR #44 DRAFT / NON MERGÉE / NON DÉPLOYÉE**. Le document de reprise le plus complet est [WORLDVISION_FULL_FILM_PLAYER_SPRINT4_2026-11-19.md](worldhealth-vision-v2/docs/media/WORLDVISION_FULL_FILM_PLAYER_SPRINT4_2026-11-19.md), surtout **sections 7 à 9**.

Le Studio V2 dispose de trois vues : source, plan réellement animé, film entier avec raccords Remotion, voix et musique librement sélectionnées ; **même `CreativeEdit.tsx` pour Player et export MP4**. La vue est dimensionnée jusqu'à 360 px de largeur en respectant le vrai 9:16. **Les titres ne se chevauchent plus au milieu du fondu** : gate d'entrée/sortie du texte ajouté dans le moteur partagé.

**Preuve complète du code** : [Actions #44541690295 — deux jobs SUCCESS](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44541690295), 11 tests Node, build V2, vrai MP4 et Chromium, film synthétique deux plans/165 frames, images 0/100/145 et contrôle de l'opacité du titre entrant (≤0,02 au moment du fondu). Captures inspectées ; les mouvements sont corrects techniquement mais la direction artistique n'est PAS au niveau de publication mondiale. [Actions #44540638541](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44540638541) valide la mise en page.

**Prochain travail** : obtenir une véritable photo/vidéo autorisée et un script fourni ici, composer une séquence d'ouverture forte, la comparer à des références haut de gamme et améliorer l'audio, les raccords et la colorimétrie ; QA iPhone Safari et Android ; caches par plan et stockage media privé après. Pas de voix obligatoire, pas d'IA de recherche/script imposée dans le logiciel, BAOCOM séparé, GDELT/blog différés.

---

## REPRISE MÉDIA — SPRINT 4 / FILM ENTIER (19 NOVEMBRE 2026)

**PR #44** : [World‑Vision MEDIA — montage et prévisualisation du film entier](https://github.com/OBIANG5/World-Health-Vision/pull/44), DRAFT sans fusion ni déploiement. **Source de vérité à lire d'abord** : [WORLDVISION_FULL_FILM_PLAYER_SPRINT4_2026-11-19.md](worldhealth-vision-v2/docs/media/WORLDVISION_FULL_FILM_PLAYER_SPRINT4_2026-11-19.md).

Le Studio V2 reçoit un script et des médias fournis ; il ne recherche/rédige pas les nouvelles par IA pour le moment. Nouveaux **trois modes de visionnage** : média original, plan animé, **film entier avec plans successifs, transitions officielles Remotion, narration et musique sélectionnées**. Le Player utilise le **même CreativeEdit.tsx** que le renderer MP4. Pas de voix obligatoire ; Vivienne facultative ; BAOCOM séparé ; blog/Content OS global/GDELT toujours différés.

**Preuves** : [Actions #44540102940 SUCCESS](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44540102940) : 11 tests Node, build frontend, vrai Chromium, film synthétique 165 frames, captures 0/100/145 prouvant fondu et deuxième plan, piste WAV synthétique incluse dans les props. Les images ont été inspectées ; l'esthétique reste trop simple pour être qualifiée de niveau mondial. La correction complémentaire des dimensions d'aperçu **jusqu'à 360 px de largeur** suit le [run #44540638541](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44540638541) à vérifier.

**Prochaines priorités** : contrôle iPhone/Safari réel ; scripts + médias réels autorisés pour produire une vraie ouverture remarquable et la comparer à des références ; historique/cache de plans, médias privés et droits, piste voix avec mastering/alignement, puis Content OS audiovisuel seulement. N'annoncer aucune publication ni connexion BAOCOM.

---

## MEDIA WORLD‑VISION — SPRINT 3 : VRAIE PRÉVISUALISATION REMOTION (19 NOV 2026)

Le nouveau document [Sprint 3 — Creative Player](worldhealth-vision-v2/docs/media/WORLDVISION_CREATIVE_PLAYER_SPRINT3_2026-11-19.md) explique le travail réel, les limites et le prochain chantier. **PR #44 en brouillon, non fusionnée, non déployée.**

La visualisation du **plan animé réel** dans la V2 est maintenant codée : `CreativeCompositionPreview.tsx` charge `@remotion/player` à la demande, importe le **même `services/media-renderer/src/CreativeEdit.tsx` que l'export MP4**, reçoit les fichiers utilisateur via object URL locale, et affiche la vraie composition (titres, effet 2,5D, mouvements, cadrage). L'ancien aperçu du média source reste disponible. Les paquets `remotion`, `@remotion/player`, `@remotion/transitions`, `@remotion/layout-utils` sont fixés à **4.0.542** avec `package-lock.json` mis à jour à partir d'un install CI et restauration de `npm ci`. Le frontend a déjà compilé en CI. **Le test navigateur Chromium doit être vérifié sur le run #44534781424** avant de dire qu'il a réussi. Les tests de rendu MP4 et de détection de silences FFmpeg étaient déjà verts.

Le logiciel n'écrit pas le script à la place de ChatGPT. Aucune voix imposée, BAOCOM séparé, blog et raccord GDELT différés. **À venir :** test vrai iPhone/Safari, aperçu de timeline entière, proxies vidéo & uploads authentifiés, cache des plans et surtout réalisation d'un plan haut de gamme sur des médias authentiques fournis.

---

## MÉDIA — REPRISE APRÈS INTERRUPTION : CONTRÔLES TERMINÉS (19 NOV 2026)

**Source de vérité récente** : [Motion Director Sprint 2 / chapitre 7](worldhealth-vision-v2/docs/media/WORLDVISION_MOTION_DIRECTOR_SPRINT2_2026-11-19.md). [PR #44 BROUILLON](https://github.com/OBIANG5/World-Health-Vision/pull/44), code vérifié au commit `04399843d2af6106d7158b7ffa33652dd960a693`, [GitHub Actions #44530170278 SUCCESS](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44530170278) : renderer et frontend V2 verts ; 11 tests, renders H.264 9:16, couche 2,5D, montage d'un plan, FFmpeg détectant une pause intentionnelle d'environ 1,3 s et préservant le SHA du WAV. Les modifications documentaires ultérieures ne changent pas le code testé.

**Limite majeure :** c'est une fondation technique, non une vidéo de niveau mondial. Prochaines tâches : afficher une vraie **prévisualisation de la composition finale** dans le Studio, apporter des visuels réels autorisés, composer des plans haut de gamme sous direction humaine, cache de fragments, voix/sound design avec outils existants, Content OS limité à la production. Recherche/script dans ChatGPT ; voix choisie librement ; BAOCOM indépendant ; pas de GDELT/blog ni fusion/déploiement.

---

## VALIDATION SPRINT 2 — 19 NOVEMBRE 2026 — LIRE AVANT DE REPRENDRE

[**Actions GitHub #44530170278 : les 2 jobs ont réussi**](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44530170278) pour l'atelier vidéo de la PR #44. Les vrais MP4 avec image/MP4/alpha/audio synthétiques sont produits et vérifiés. `--shot` rend un seul plan et trois frames de contrôle. La **voix est libre**, avec audition A/B. Le contrôle de silences repose sur **FFmpeg/FFprobe existants** (le premier essai Remotion avait échoué et a été retiré), le WAV avec un silence artificiel **1,301 s** est correctement détecté, et le WAV original reste identique. Les musiques ne doivent pas dépasser l'outro G0 silencieux.

Toutes les explications et prochaines étapes dans **[WORLDVISION_MOTION_DIRECTOR_SPRINT2_2026-11-19.md](worldhealth-vision-v2/docs/media/WORLDVISION_MOTION_DIRECTOR_SPRINT2_2026-11-19.md)**. Ce résultat est un **succès technique**, PAS la qualité visuelle mondiale recherchée. Priorité suivante : prévisualisation réellement rendue dans l'interface, tests avec vrais matériaux autorisés, mouvement/typo/masques de qualité, cache des scènes acceptées, voice/sound design. **Ne pas confondre “continue” avec autoriser merge, mise en ligne, voix obligatoire ou toute publication.**

---


## POINT DE REPRISE TECHNIQUE — MOTION DIRECTOR SPRINT 2 — 19 NOVEMBRE 2026

La PR [#44](https://github.com/OBIANG5/World-Health-Vision/pull/44) continue **sans merge**. Lire maintenant **[World‑Vision Motion Director Sprint 2](worldhealth-vision-v2/docs/media/WORLDVISION_MOTION_DIRECTOR_SPRINT2_2026-11-19.md)** pour les changements de code exacts, les tests, la revue des rendus, les limites et le backlog P1–P7.

Le logiciel reçoit les scripts ici rédigés et les médias utilisateur. Derniers apports : `focus_reveal` 9:16 animé, texte mesuré avec Remotion officiel, points d'intérêt x/y, **parallaxe 2,5D depuis un détourage externe**, visualisation du cadrage dans la page, **écoute A/B de deux prises vocales** sans voix imposée, montage individuel avec `--shot`, vraies images `renderStill()` et SHA de la source. Les clips tests utilisent des images **synthétiques, non journalistiques** ; ils ne prouvent pas une qualité artistique mondiale. Ne pas relancer le débat sur onze portes obligatoires / Vivienne forcée : c'était refusé et annulé.

Le dernier workflow vert documenté pour le compositing 2,5D : [Actions #44526523013](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44526523013). **Vérifier la CI du HEAD le plus récent** avant toute annonce de réussite sur les modifications ultérieures. Le test monte l'image, la couche PNG alpha, une vidéo et une piste audio ; aucun fournisseur d'IA de génération/voix n'est branché. Prochaine priorité : une vraie prévisualisation de la composition dans l'interface, qualité cinématographique éprouvée sur **vrais médias choisis**, cache/assemblage sélectif, et voix/son améliorés avec les outils existants.

---


## CORRECTION PRIORITAIRE DU PROPRIÉTAIRE — 19 NOV. 2026 (PREND PRÉSÉANCE)

La première décision du 19/11 imposant 11 « portes » éditoriales et Vivienne au pipeline a été explicitement **refusée et remplacée**. Les modules Python rigides ont été supprimés. **On fournit des scripts et des médias à World-Vision ; ChatGPT travaille la recherche/le récit dans cette conversation. Le logiciel excelle dans la direction artistique, les animations, le montage, la voix libre et la finition en réutilisant les meilleurs moteurs existants.** BAOCOM n'est ni connecté ni poussé, blog/GDELT attendent. Consulter le [nouveau cahier des charges](worldhealth-vision-v2/docs/media/WORLDVISION_CREATIVE_EDIT_HANDOFF_2026-11-19.md) (lien relatif depuis la racine) et la [PR #44](https://github.com/OBIANG5/World-Health-Vision/pull/44).

---

### Archive de la première interprétation du 19/11 — ANNULÉE

Les anciennes contraintes de onze portes, script/recherche dans le code et voix Vivienne imposée ont été explicitement retirées. Voir la correction prioritaire ci-dessus.

---



## ACTUALITÉ EN PRÉPRODUCTION : BROOKLYN / EFFONDREMENT FLATBUSH — 14/11/2026

Le propriétaire a choisi **l'actualité n° 1 (Brooklyn, immeuble effondré)**. Nous sommes à l'étape **script + sélection des vrais rushes** et PAS ENCORE au montage FASTLANE. Un script V2 plus émotionnel a été proposé dans le chat, sans approbation mot par mot pour l'instant. Ne pas lancer de voix ni changer ce texte sans demander la validation éditoriale.

- Branche: feature/worldvision-brooklyn-editorial-pack-2026-11-14. [PR #31](https://github.com/OBIANG5/World-Health-Vision/pull/31).
- Pack: worldhealth-vision-v2/docs/media/episodes/2026-11-14_brooklyn_flatbush/STORYBOARD_PROPOSED_V2.json + EDITORIAL_SOURCES_AND_RIGHTS.md.
- Faits: 1321 Flatbush Avenue, Brooklyn, le 11 novembre 2026 à ~16:01, bâtiment de 3 étages effondré dans l'excavation du chantier 2625 Bedford Ave, huit morts dont deux enfants, 18 blessés, 250 secours. **Enquête, aucune causalité prouvée du chantier.**
- **Moment humain fort** : une femme enceinte extraite vivante après plus de deux heures, mari confirme le 13 novembre femme et bébé à naître vivants, femme grièvement blessée.
- Storyboard avec ~10 plans 48 s: globe très bref ~1,5 s puis vrai effondrement à l'image, destruction, vraie recherche, extraction, témoignage du mari, bilan, excavation, enquête et **vraie signature animée 3 s**.
- Vraies séquences trouvées: Storyful caméra de porte James A Williams https://video.storyful.com/record/41716 ; CBS sauvetage https://www.cbsnews.com/newyork/news/brooklyn-building-collapse-survivor-rescued/ ; WABC mari https://abc7ny.com/live-updates/brooklyn-building-collapse-live-updates-1-dead-flatbush/20034152/ ; Reuters Connect drone https://www.reutersconnect.com/item/drone-2-killed-several-injured-in-building-collapse-in-brooklyn-new-york/dGFnOnJldXRlcnMuY29tLDIwMjY6bmV3c21sX09XQU5BQ0VOMVJSV0MxTk1URlc4VllKUkFVQ1JVSlo .
- **BLOCAGE RÉEL** : ce sont des extraits de presse/surveillance avec droits de tiers. La visualisation sur une page ne constitue PAS une autorisation de téléchargement/republication. Pas de vraie licence / fichier exploitable à ce stade. Ne pas maquiller le blocage en montage rempli de stock footage présenté comme les scènes de Brooklyn.
- Référence vocale choisie: Vivienne C5.2 « impact média », **prise neuve pour ce sujet** à valider après le script, pas l'audio C5.2 qui dit les mots d'une autre actualité.
- Se souvenir du contrat FASTLANE : d'abord le storyboard et la voix validés, ensuite l'assemblage seulement, idéalement sous cinq minutes.


## NOUVELLE STRATÉGIE CONFIRMÉE — MONTAGE EN MOINS DE 5 MINUTES (14 NOVEMBRE 2026)

**Utilisateur :** voix Guinée trop lente et insatisfaisante ; ne plus consacrer une heure à refaire les mêmes images. Dorénavant nous préparons ENSEMBLE le sujet, l'angle, le script, toutes les vidéos/images, les animations utiles, la prise de voix et la fin. GitHub doit s'occuper UNIQUEMENT du **montage rapide de ces éléments déjà validés**, du globe de localisation, de la signature animée et des contrôles de sortie. Objectif <300 s **pour la seule étape d'assemblage**, pas pour le sourcing ni pour l'art vivant. Les clips non préparés ou sans droits bloquent le montage : ne jamais improviser des images génériques.

**Dernière référence vocale authentifiée retrouvée dans l'autre branche : VIVIENNE C5.2 — IMPACT MÉDIA.** Référence originale de 14,088 s, timbre fr-FR-VivienneMultilingualNeural, +8 %, voix enregistrée pour le reportage Nouvelle-Orléans seulement. Fichiers enregistrés sous la branche production/worldvision-vivienne-c52-voice-lock-2026-11-14 ; style sonore sélectionné, pas narration applicable à toutes les actualités. +6 % a été proposé pour une autre prise, non approuvé. Ne pas reprendre le trop lent montage Guinée ; ne pas remplacer le MP3 parlant du Mississippi pour narrer un nouveau sujet. Droits commerciaux d'Edge TTS non acquis.

**Nouveau code déjà enregistré :** branche feature/worldvision-fastlane-assembly-only-2026-11-14, assembleur de clips préparés avec SHA, voix à un seul tenant et signature vidéo 3 s : worldhealth-vision-v2/services/media-renderer/fastlane/assemble.py. Détails et protocole : worldhealth-vision-v2/docs/media/WORLDVISION_FASTLANE_MONTAGE_ONLY_2026-11-14.md. Tests techniques avec FFmpeg : fastlane/test_assemble.py. CI : .github/workflows/worldvision-fastlane.yml. Le montage prend un manifeste verrouillé et refuse tout scénario non approuvé. Les tests synthétiques sont techniques uniquement et ne deviennent jamais un reportage. Revue humaine de la qualité et des droits avant toute diffusion.

**Référence audio à écouter :** https://raw.githack.com/OBIANG5/World-Health-Vision/production/worldvision-vivienne-c52-voice-lock-2026-11-14/worldhealth-vision-v2/services/media-renderer/public/voice/vivienne-c52-impact-media-reference.mp3


## RETOUR APRÈS VISIONNAGE V3 GUINÉE — NOTE 6/10 + CORRECTIF SON, 14/11/2026

L'utilisateur a décidé de **publier la V3** mais la note **6/10**, jugeant la voix **trop basse** et le montage **pas assez émotionnel, vivant, animé** malgré les nouvelles photographies authentiques. Ne plus confondre 13 remplacements d'images ou un zoom sur photo avec un reportage poignant. Les critères des prochaines vidéos imposent de vrais gestes filmés pertinents, des variations fortes de plans, une mise en scène sémantique et des rythmes visuels au service des paroles. Pas de fausses violences ni de faux témoignages.

**Diagnostic du fichier réel** `worldvision-guinee-siguiri-v3-visuels-refaits-voix-identique.mp4` : **-16,40 LUFS et -1,99 dBTP**, souffle non suffisant sur smartphone. **Correction audio exportée et contrôlée** : `worldvision-guinee-siguiri-v3-son-clarifie-et-renforce.mp4`, 47,133s, **-13,67 LUFS, -1,38 dBTP**, soit +2,73 LU, H.264 inchangé exactement (video elementary stream SHA-256 `5518c8ebb75b71700a162cd467579758b9a04d680fc0c2b36a4407757f2a0da0` avant et après) ; SHA-256 du fichier local `c1e4865813013c45e35408bace3c96a7cc5a6b0cfd944e4ef54e259d01f73273`. Script et interprétation Vivienne non regénérés : simplement remaster audio doux. **Version avec son corrigé fournie au propriétaire dans le chat** ; CI GitHub ajoutée sur branche `feature/worldvision-guinee-siguiri-v3-authentic-visuals-2026-11-14` : `.github/workflows/worldvision-guinee-siguiri-v3-louder-audio.yml`, publiant une version son renforcé sans écraser l'original. Vérifier le résultat avant de déclarer le nouveau lecteur publié.

Conserver la note 6/10 dans le registre qualité du Media Studio. La nouvelle règle audio : contrôler le loudness ET l'écoute mobile avant livraison ; la nouvelle règle cinéma : une photo recadrée animée n'est pas une vidéo émotionnellement aboutie. La qualité artistique du propriétaire est distincte du succès du pipeline.


## MONTAGE GUINÉE V3 — REFONTE VISUELLE RÉELLE EN RÉPONSE AU REFUS DE LA V2

Le propriétaire reproche aux V1/V2 Guinée de ne changer pratiquement **aucune image** et de conserver des photographies et plans fades/génériques, malgré ses demandes répétées. **Il demande de terminer l'épisode en conservant EXACTEMENT la dernière voix Vivienne** — ne plus rouvrir le chantier de la voix — tout en refaisant les visuels faibles.

**Nouvelle réponse vérifiable :** branche `feature/worldvision-guinee-siguiri-v3-authentic-visuals-2026-11-14`, [PR #27](https://github.com/OBIANG5/World-Health-Vision/pull/27) brouillon. Script `worldhealth-vision-v2/services/media-renderer/scripts/worldvision_guinee_siguiri_v3_visual_editor.py`. Actions `.github/workflows/worldvision-guinee-siguiri-v3-real-guinea-images.yml`.

- **13 plans sur 16 remplacés** : conserve UNIQUEMENT 0 = globe initial que l'utilisateur aime, 12 = vraie vidéo homme au marteau que l'utilisateur aime, 15 = signature World-Vision bleue.
- **Audio source inchangé bit-à-bit** : le renderer prend le flux AAC de la V2 sans regénérer Vivienne, et teste l'identité binaire de ce flux. Texte choisi verrouillé SHA-256 `0d0e268a9f189b9ae4b1714e89dbd67872444340ebce9c64260ee3f440cde8ac`.
- **Nouvelles sources** : série authentique de 5 photos prises le 21 juillet 2024 en Guinée, `Les Orpailleurs du Quotidien 01–05`, auteur LincolnGN/Wikimedia Commons, **CC BY-SA 4.0** ([sources](https://commons.wikimedia.org/wiki/Category:Gold_panning_in_Guinea)). **Attention à l'attribution, aux transformations signalées, à l'obligation de partage dans les mêmes conditions selon la licence et à la revue juridique si publication**. Elles illustrent l'orpaillage antérieur, PAS les affrontements de 2026. Également, deux vraies pages du communiqué officiel guinéen du 12 novembre 2026 ([texte original](https://gouvernement.gov.gn/wp-content/uploads/2026/11/COMMUNIQUE-NA%C2%B0-008-MATD-CAB-2026-DU-GOUVERNEMENT-RELATIF-AUX-EVENEMENTS-SURVENUS-LE-11-NOVEMBRE-2026-A-BALATO-PREFECTURE-DE-KINTINIAN-DU-12112026.pdf)).
- **Design** : typographie Space Grotesk/DM Sans acceptée conservée, photographie plein cadre et déplacements lents, contenu unique à chaque scène, plus de pages noires vides ou d'incrustations techniques « ILLUSTRATION ». Communiqué mis en scène sans inventer de victimes ou de barricades.
- **QA obligatoire avant livrer** : inspection d'un contact sheet 16 photogrammes, vérification du changement effectif scène par scène (les premières captures montrent des différences visuelles de 42 à 97 niveaux de pixels pour les 13 scènes ; les 3 conservées ~0–1), conservation EXACTE du flux AAC, durée <60 secondes, contrôle des sources et droits. CI réussite n'implique PAS une approbation artistique.
- **Lecteur iPhone V3** : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/guinee-siguiri-v3-2026-11-14/index.html — ne le déclarer accessible qu'après l'exécution GH Actions validée.
- On ne doit plus faire de fausses améliorations cosmétiques à la place de la demande précise. **Les retours négatifs de l'utilisateur sont contractuels, pas de simples préférences.**


## GUINÉE/SIGUIRI — CORRECTIONS V2 APRÈS RETOUR UTILISATEUR (14/11/2026)

L'utilisateur a rejeté la V1 : **Vivienne trop lente, trop robotique et hachée**, blancs entre morceaux TTS, images trop statiques et peu parlantes, labels techniques « ILLUSTRATION »/« PHOTO USAID », logo blanc incongru à la fin. **Deux validations à préserver : la typographie Space Grotesk/DM Sans et le vrai plan vidéo de l'homme qui frappe/travaille dans la mine.**

### Version V2 vérifiée techniquement
- Branche dédiée : `feature/worldvision-guinee-siguiri-v2-voice-endcard-2026-11-14` et [PR #25](https://github.com/OBIANG5/World-Health-Vision/pull/25) (brouillon).
- Lecteur iPhone : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/guinee-siguiri-v2-2026-11-14/index.html
- MP4 **réel** : 47,133 secondes, 1080×1920, H.264/AAC ; SHA-256 `7fd2082b086f570c046d9595db2c0fc8e0705accb9177da71e7712b6504f39b2`. [CI réussi](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43610939312).
- **Script verrouillé inchangé** : SHA-256 `0d0e268a9f189b9ae4b1714e89dbd67872444340ebce9c64260ee3f440cde8ac`.
- Vivienne `fr-FR-VivienneMultilingualNeural` : **une prise intégrale** sans assemblage de phrases ; trois variantes A (148,11 mots/min), B (159,96), C (168,36), accessibles sur la page du lecteur. A utilisée par défaut, mais cela ne vaut pas approbation humaine définitive.
- Ancien carré blanc totalement supprimé, ainsi que les incrustations techniques. Police et homme au marteau préservés. Fin remplacée par une signature bleu cyan pleine hauteur.
- **Original de signature fourni par le propriétaire** : MP4 **3 sec / 512×910 / 30 fps**, SHA-256 `b1a875dd2611e2fc1e10f9f233b8e42d7065faacaecdc520c52af72c90e7d855`, **archivé dans Canva, asset vidéo `VAHa58Do0Cc`**. Important : le MP4 V2 GitHub utilise **une vidéo de trois secondes reconstruite à partir d'un photogramme de cette signature**, pas encore le mouvement exact des 90 images du MP4 original. Ne jamais prétendre le contraire. La version originale réencodée en 1080×1920 a également été générée dans le chat de l'utilisateur. À l'étape suivante, privilégier les octets de la vidéo originale pour l'export final, ne plus reconstruire de photo fixe.
- Les licences TTS commerciales `edge-tts` restent non confirmées. L'export V2 est une version de relecture, non une autorisation automatique de publier.

**Priorité artistique suivante :** davantage de rushes réels pertinents à la Guinée/Siguiri, mieux articuler les relances visuelles avec les faits et obtenir une narration réellement humaine. Le test technique vert ne signifie pas que l'utilisateur a aimé la vidéo. Ne jamais réduire ces critiques au seul débit.


## LIVRABLE VÉRIFIÉ — GUINÉE/SIGUIRI — VIDÉO 02 (14 NOVEMBRE 2026)

- **Vrai MP4 de relecture produit et accessible sur téléphone**, 51,733 secondes, vertical 1080×1920/30fps, H.264/AAC : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/guinee-siguiri-2026-11-14/index.html?revision=028ca808
- Hash du fichier effectivement rendu : `028ca808171133af83d37a9a66728c823e8173bf34d823dbc69e2b71b0a56d17`. [Exécution CI/QA réussie](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43607767094), y compris **validateur multi-épisodes**.
- Script **exactement celui choisi par l'utilisateur**, 10 paragraphes, SHA `0d0e268a9f189b9ae4b1714e89dbd67872444340ebce9c64260ee3f440cde8ac`; source dans `feature/worldvision-guinee-siguiri-v1-2026-11-14`, [PR #22](https://github.com/OBIANG5/World-Health-Vision/pull/22) en brouillon.
- Narration : **Vivienne** `fr-FR-VivienneMultilingualNeural`, débit **126,52 mots/minute**, sans accélération audio artificielle, pauses segmentées ; ce débit ne signifie pas que l'utilisateur a approuvé la naturalité vocale.
- **Quinze plans**, dont globe NASA animé vers la Guinée, deux plans de **vraie vidéo** libre Pexels de gestes miniers (illustrations tournées hors des affrontements), des photos d'archive USAID de Siguiri et des graphiques factuels. Une planche de **douze** photogrammes a été examinée dans les outils, avec vérification des deux plans vidéo. Le vrai lieu des images et licences est consigné dans `manifest.json`.
- Documentation transversale mise à jour : `worldhealth-vision-v2/docs/media/VOICE_REFERENCE.md` et `worldhealth-vision-v2/docs/media/EDITORIAL_VIDEO_QUALITY_GATES.md`. Le contrôle réutilisable `worldhealth-vision-v2/services/media-renderer/scripts/validate_worldvision_short.py` a été ajouté **à cette branche mère media-studio** pour toutes les futures vidéos. Bloque script modifié, master silencieux, vitesse hors plage, plans fixes trop longs, absence de sources et diffusion présumée sans licence.
- **Statut** : validé **techniquement**, encore **non validé artistiquement ni pour publication commerciale** ; ne pas écrire « version définitive approuvée ». Extraits Reuters/AP/TV5MONDE non copiés dans le MP4 car droits non établis. Les plans miniers Pexels sont des illustrations et non des images des morts de Balato.
- Future reprise ChatGPT : **ne pas refaire une production à zéro**, lire la PR #22 et les commentaires du propriétaire à venir ; reprendre ce moteur et ses 15 plans, améliorer ce qui ne convainc pas, sans jamais modifier le script à son insu.


## NOUVELLE VIDÉO EN COURS — GUINÉE / BALATO / SIGUIRI, 14 NOVEMBRE 2026

Le propriétaire a **choisi définitivement comme narration** le dernier script retravaillé de la version 2 sur les affrontements de Balato. **Ne pas réécrire.** Script exact : [SCRIPT_LOCK_V1.json](https://github.com/OBIANG5/World-Health-Vision/blob/feature/worldvision-guinee-siguiri-v1-2026-11-14/worldhealth-vision-v2/docs/media/episodes/2026-11-14_guinee_siguiri/SCRIPT_LOCK_V1.json), SHA-256 : `0d0e268a9f189b9ae4b1714e89dbd67872444340ebce9c64260ee3f440cde8ac`, 109 mots, dix segments. Ouverture exacte : « Dix morts. Treize blessés. En Guinée, une opération contre l’orpaillage illégal a tourné au drame. »

**Branche dédiée** : `feature/worldvision-guinee-siguiri-v1-2026-11-14` ; [PR #22](https://github.com/OBIANG5/World-Health-Vision/pull/22) en brouillon. Moteur Python : `worldhealth-vision-v2/services/media-renderer/scripts/worldvision_guinee_siguiri_v1.py`. CI : `.github/workflows/worldvision-guinee-siguiri-v1.yml`. Nouveau lecteur iPhone après succès : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/guinee-siguiri-2026-11-14/index.html . Toute vidéo créée pour revue uniquement, pas de licence commerciale voix acquise, pas de publication autorisée automatiquement.

**Retours auteur à appliquer obligatoirement :** précédente vidéo Soudan du Sud publiée notée 4–5/10 ; voix Vivienne **trop rapide, pas assez émotionnelle/humaine** ; photos peu parlantes, montage sans véritable accroche émotionnelle. Pour la Guinée : voix Vivienne plus lente avec pauses naturelles **sans accélération artificielle**, vrai globe NASA vers Balato/Siguiri dès l'ouverture, meilleurs plans réellement utiles aux phrases, image de Siguiri documentée USAID domaine public, illustrations extérieures aux événements clairement tracées, aucune fausse scène de violence. Le bilan de dix morts et treize blessés est **provisoire** et attribué aux autorités, cinq morts étrangers non identifiés ; enquête en cours.

Mise à jour de l'état du run et du MP4 **uniquement après vérification GitHub**. Les fichiers de preuve et crédits doivent rester dans le dossier de production. Ne pas modifier la vidéo Soudan du Sud et ne pas empiéter sur l'autre production Shenzhen.


## RETOUR APRÈS PUBLICATION — 14 NOVEMBRE 2026, À LIRE AVANT LA PROCHAINE VIDÉO

La vidéo Soudan du Sud V3 a **été publiée par le propriétaire** ; **note propriétaire 4–5/10** (l'ancienne mention « non publiée » n'est plus à jour). **Ne pas refaire l'épisode**, préparer un sujet différent choisi parmi la liste d'origine (notamment #9 Guinée/Siguiri, #8 Kenya/Syokimau, #6 Guinée équatoriale/Jesús Owono). Avant toute nouvelle production, **abandonner la cadence Vivienne trop rapide : viser une voix plus humaine, plus lente, plus expressive, sans compression artificielle, et mieux synchroniser émotion, preuve et image.** Les images de l'épisode précédent ont été jugées insuffisamment évocatrices. Choisir des images vérifiables, fortes, pertinentes et légalement réutilisables ; ne pas fabriquer de faux documents d'actualité. Un outil qui exporte un MP4 ne garantit pas un reportage regardable : validation artistique distincte.

La règle complète est dans `worldhealth-vision-v2/docs/media/EDITORIAL_VIDEO_QUALITY_GATES.md` sur `feature/worldvision-south-sudan-v3-locked-vivienne-2026-11-14`; consigner chaque nouvelle note dans l'[Issue #18](https://github.com/OBIANG5/World-Health-Vision/issues/18). La vidéo a été publiée par l'utilisateur mais **la situation des droits du test TTS Vivienne reste distincte** ; ne pas déduire une licence de cette publication.


## DERNIER RENDU DU SOUDAN DU SUD — V3 VIVIENNE (14/11/2026)
- **MP4 effectivement généré et accessible sur iPhone**, 22,367 secondes, H.264/AAC 1080×1920, 30 i/s : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/south-sudan-editorial-v3/index.html
- Le script original est **strictement verrouillé et vérifié en CI** (SHA `a5104cedab538771d1c649da242c7b32b4f438514a4230d3e5bb31628139afb9`). Voix **Vivienne** (`fr-FR-VivienneMultilingualNeural`). Globe géographique approuvé de la V2 intact, les 3 premières secondes.
- Une photo différente de la mère et de son enfant pendant l'indépendance à Juba en 2011 (USAID, domaine public) a remplacé le plan de drapeau répétitif à la fin. Le montage vidéo et les médias originaux générés restent distincts ; deux ressources créatives sont enregistrées dans Canva, dont `MAHa5OsUdj4`, mais ne sont **PAS automatiquement intégrées au MP4**.
- Vérification la plus récente du rendu : https://github.com/OBIANG5/World-Health-Vision/actions/runs/43598471386 — SUCCESS ; manifeste MP4 SHA256 `69c893be34941c418b695858dba78665265d03635dc70e84872b398de065579a` ; contact-sheet 9 images consulté ; revue artistique propriétaire **non validée**, publication **non autorisée**.
- Attention licence : la narration Edge Read Aloud via `edge-tts` ne vaut pas le droit de publier commercialement. Microsoft n'accorde explicitement l'usage commercial des voix prédéfinies qu'aux clients du [TTS payant d'Azure](https://www.microsoft.com/licensing/terms/en-US/product/MicrosoftAzure/all). Le master doit recevoir une piste valablement licenciée avant diffusion ; consulter `worldhealth-vision-v2/docs/media/VOICE_REFERENCE.md` sur branche V3.
- Historique de la refonte : [PR #19](https://github.com/OBIANG5/World-Health-Vision/pull/19) (brouillon), [Issue transversale #18](https://github.com/OBIANG5/World-Health-Vision/issues/18). **Ce travail ne doit PAS écraser la production Shenzhen d'une autre branche.**


## MISE À JOUR TRANSVERSALE — RETOURS AUDIOVISUELS DU 14 NOVEMBRE 2026 (TOUTES LES VIDÉOS)

**Ce bloc s'applique aussi au reportage Shenzhen et à tous les futurs épisodes, indépendamment de la branche de montage.** L'utilisateur a critiqué les montages précédents : le système doit mémoriser ses choix et ne plus changer silencieusement les scripts.

- **Voix préférée choisie par l'utilisateur : Vivienne** (identifiant de référence `fr-FR-VivienneMultilingualNeural`). La voix est une référence de direction vocale, **pas une licence de diffusion commerciale**. Kokoro `ff_siwis` et Remy ne sont plus des défauts acceptables. [Écouter l'échantillon Vivienne](https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/south-sudan-editorial-v2/voice-auditions/vivienne.mp3).
- **Soudan du Sud : le script V1 original est VERROUILLÉ mot pour mot**, SHA `a5104cedab538771d1c649da242c7b32b4f438514a4230d3e5bb31628139afb9`. Ne jamais remplacer par la réécriture V2. Toute modification requiert l'accord explicite du propriétaire.
- **Globe V2 réel validé** en ouverture 0–3 secondes : conserver ce clip géographique lors des prochains tests, sans refaire de CGI fictif. Pas de logo en cartouche blanc permanent, de grande date isolée sur beige, de polices arbitraires, ni de mentions techniques incrustées.
- **Documents canoniques sur branche V3** : [VOICE_REFERENCE.md](https://github.com/OBIANG5/World-Health-Vision/blob/feature/worldvision-south-sudan-v3-locked-vivienne-2026-11-14/worldhealth-vision-v2/docs/media/VOICE_REFERENCE.md) ; [EDITORIAL_VIDEO_QUALITY_GATES.md](https://github.com/OBIANG5/World-Health-Vision/blob/feature/worldvision-south-sudan-v3-locked-vivienne-2026-11-14/worldhealth-vision-v2/docs/media/EDITORIAL_VIDEO_QUALITY_GATES.md) ; [script gelé](https://github.com/OBIANG5/World-Health-Vision/blob/feature/worldvision-south-sudan-v3-locked-vivienne-2026-11-14/worldhealth-vision-v2/docs/media/episodes/2026-11-14_south_sudan_elections/SCRIPT_LOCK_V3.json).
- **Point d'entrée cross-branches permanent : [GitHub Issue #18](https://github.com/OBIANG5/World-Health-Vision/issues/18)**. V3 isolée en PR #19, pas de publication sans validation humaine ni licence voix.
- Pour les nouvelles productions Afrique : Guinée/Siguiri, Kenya/Syokimau, Guinée équatoriale/Jesús Owono : lire Issue #18 et le registre voix **avant** de commencer.


## PRIORITÉ ACTUELLE — S03 SHENZHEN V2 VÉRIFIÉ, ENCHAÎNEMENT À 43 S (14/11/2026)

**Commande utilisateur actuelle :** montage d'actualité premium **une vidéo courte à la fois**, et **chaque séquence autonome contrôlée avant assemblage**. Séquence dramatique obligatoire : **S01 vrais portraits Trump/Poutine/Xi → S02 image World-Vision D00-v6 ORIGINALE → S03 le globe tourne réellement depuis l'Afrique vers Shenzhen → S03b vrai visuel de la ville → reste du reportage sur le nucléaire/Iran/Ukraine → signature World-Vision**. Débit normal, 30 images/s, environ **43 secondes** AU TOTAL (surtout pas 3–4 minutes) ; pas de fausse conférence ou faux bâtiments.

**Faits revérifiés le 14 novembre 2026 :** la Maison-Blanche annonce la rencontre trilatérale le **jeudi 19 novembre 2026** en marge de l'APEC, et la diplomatie chinoise confirme l'APEC à **Shenzhen** les 18–19 novembre. **La salle/l'adresse précise de la rencontre ne sont PAS confirmées**. L'animation vise donc **le centre géographique de la ville (22.5431°N, 114.0579°E)**, pas un bâtiment inventé. Sources : https://www.fmprc.gov.cn/eng/xw/wsrc/202611/t20261113_12058556.html ; https://www.afp.com/en/trump-xi-putin-hold-historic-meeting-china-white-house-0.

**VRAIS LIVRABLES vérifiés, pas des promesses :**
1. **S01 HOOK** 4,5 s H264 1080×1920 : vrais portraits photographiques, logo G0 officiel, MP4 sur branche \`whv-media-studio-browser-preview/media-lab/summit-2026/hook-4p5s-preview.mp4\`. Sans narration, non approuvé définitivement.
2. **S02 D00-v6** 3,1 s H264 1080×1920, SHA-256 \`95c47d1a94a1d0487e5b8f2d4c622bedcf6bad980938947ac003be34a8f8ea2a\` ; VRAIE image originale D00-v6 non reconstruite (SHA-256 \`8d9a9d20f20fbf7757713b6f5eab06590f191166eb779865747f0f59683cfca2\`), mouvement de caméra sans rotation fictive, archivé Canva ID \`VAHa4ZT_ySo\`.
3. **S03 NASA véritable rotation vers Shenzhen V1** janvier 4,9 s, SHA-256 \`6bfb45a57794c7dbfc7dc9af9ddb818c67eae327f60216b46bf32f0afb7ba10e\`, QA passée, mais trop enneigé visuellement.
4. **S03 améliorée JULY V2** 4,9 s, **147 frames/30fps 1080×1920**, SHA-256 **\`1e49e5b6dc36c9dde2494253a8ee5c2b426863bed7fd33cd0cd24b4012be4558\`**, NASA July topo 5400×2700 SHA \`85a24885616097b5e06532b7d8e30fa5d749a782e70ea55971dd8539a0899206\`, Natural Earth GeoJSON SHA \`392a03db8aa3ba82c105852655620129b11182b95dfc34ef046827ea7d0e5b8c\`. **Run GitHub Actions #43582938864 = SUCCESS**. Quatre images de contrôle vraiment inspectées ; V2 donne une Eurasie plus verte et cohérente avec D00. **Canva archive média S03 V2 ID \`VAHa4gCj5SQ\`**, import vérifié. **ATTENTE validation artistique utilisateur**, aucun son encore, non publié.
5. Le **fichier exact du logo officiel G0** dans renderer Git blob \`bc80fa70cebd566768bfb1703a0f1f636a78c196\` est contrôlé et utilisé (jamais redessiné).

**LIENS :**
- Vidéo S03 V2 : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/summit-2026/segment03-shenzhen-july-v2-4p9s.mp4
- Contact sheet 4 photogrammes S03 V2 : https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-lab/summit-2026/review-s03-july-v2/contact-sheet.jpg
- Ancienne vidéo S03 V1 gardée sur branche preview pour comparaison ; ne pas effacer.
- Code source S03 : \`worldhealth-vision-v2/services/media-renderer/scripts/worldvision_segment03_shenzhen.py\`.
- Workflow de build/QA mobile : \`.github/workflows/whv-summit-shenzhen-s03.yml\`.
- Journal d'état 8 clips : \`docs/media/episodes/2026-11-14_trump_xi_putin_shenzhen/SEGMENT_LEDGER.json\` (v2 retenue comme candidate).
- **NOUVELLE EDL** \`docs/media/episodes/2026-11-14_trump_xi_putin_shenzhen/EDL_V2_FAST_GLOBE.md\` : S01 4,5s, **extrait S02 0,9s à 1×**, **extrait S03 4,4s à 1×**, futur vrai plan de Shenzhen 2,7s ; suite 12,5s–43s inchangée. **La source n'est pas accélérée, seulement recadrée temporellement.**
- Remotion master existant \`services/media-renderer/src/WorldVisionSummit2026.tsx\` et script \`render-summit-preview.mjs\` ont été raccordés aux **vraies vidéos S02 + S03 V2** avec empreintes SHA exigées ; pas de substitution de globe. La composition finale à ~43 s reste NON RENDUE, car fichiers source n'ont pas encore été installés en binaire dans le repo/renderer et **voix FR approuvée absente**.

**Prochain travail utile :** recueillir avis artistique sur S03 V2 et sur cohérence S02→S03 ; sélectionner vrai plan de Shenzhen 2,7s aux droits confirmés ; **produire le prochain clip autonome S04** (enjeux nucléaires) en motion design soigné ; préparer audition de voix française (2–3 voix) puis calage syllabique des 13 sous-titres ; exporter 43s seulement APRÈS ces validations. Ne pas coder un nouvel éditeur, ne pas réinventer une Terre, ne pas produire un clip sur une autre actualité sans accord.

**Ce qui manque honnêtement :** V2 non encore approuvée artistiquement par l'utilisateur, pas de voix/audio à écouter, pas de vidéo finale 43 s. L'original D00 existe en fichier chat et Canva ; son binaire original n'est pas committé dans GitHub. Les deux clips S02/S03 sont stockés dans Canva mais leur insertion en tant que fichiers locaux dans le renderer final devra être réalisée avant le master.

---


## 14 NOV 2026 — NOUVELLE MÉTHODE VALIDÉE : UN CLIP À LA FOIS, PUIS ASSEMBLAGE

**Instruction utilisateur prioritaire :** arrêter de vouloir tout rendre d'un seul bloc. Construire **huit petites vidéos indépendantes**, chacune très bien montée/contrôlée/revue, avec code ponctuel lorsque plus beau (sans réinventer le globe). **Assembler seulement les séquences validées.** La ligne éditoriale reste la vidéo approuvée dans le chat sur le sommet annoncé Trump–Poutine–Xi du 19 novembre 2026.

**Livrables concrets vérifiés cette session :**
- **S02 identité D00-v6 : film MP4 de 3,1 secondes, H.264 1080×1920, 30fps, 93 images, animé et non statique.** Image originale exactement conservée en entrée (SHA-256 `8d9a9d20f20fbf7757713b6f5eab06590f191166eb779865747f0f59683cfca2`). Mouvement caméra discret + respiration cyan, sans reconstruire la planète ni prétendre une rotation réelle. **MP4 SHA-256 `95c47d1a94a1d0487e5b8f2d4c622bedcf6bad980938947ac003be34a8f8ea2a` ; 2 688 754 octets**, vérifié par FFprobe et lecture 93 frames. Résultat visuel contrôlé sur contact-sheet 3 images.
- Code générateur autonome committé : `worldhealth-vision-v2/services/media-renderer/scripts/worldvision_segment02_globe.py` (exige SHA exact D00 original, produit vidéo MP4 + manifeste). **N'a pas besoin d'un nouvel éditeur** ; FFmpeg/OpenCV/Pillow.
- **Clip S02 archivé dans Canva utilisateur connecté** (véritable vidéo, media ID `VAHa4ZT_ySo`, nom `World-Vision — S02 D00-v6 globe cinématique original — 3,1 s`). L'image source D00 original est également dans Canva sous `MAHa4F1Owfk` et le logo officiel G0 sous `MAHa4H6Rel4`.
- Traçabilité de chaque plan : `docs/media/episodes/2026-11-14_trump_xi_putin_shenzhen/SEGMENT_LEDGER.json`, S01 hook 4,5 s déjà vérifié sur branche preview, S02 3,1 s créé localement+Canva, S03–S08 restent à produire, montage cible total **43 s**, les timecodes sont PROVISOIRES jusqu'à voix FR approuvée.

**Liens locaux pour ce chat** (peuvent ne pas survivre aux nouveaux chats ; Canva est l'archive persistante) :
- `sandbox:/mnt/data/WorldVision_S02_Globe_D00_3s.mp4`
- `sandbox:/mnt/data/WorldVision_S02_contact_sheet.jpg`
- `sandbox:/mnt/data/worldvision_segment02_globe.py`

**Qualité et limites :** le film est un plan original avec faible zoom, **PAS** une rotation géographique de la Terre, ni une simulation de trajet vers Shenzhen. Aucun son/voix dans le clip ; on synchronisera à la voix quand les huit vidéos seront faites. Le logo officiel se trouve déjà dans la composition générale et doit rester inchangé. S02 est **soumis à revue artistique utilisateur**, pas « approuvé pour publication ». **Le montage intégral et sa narration n'existent pas encore.**

**PROCHAIN CLIP S03 (7,6–12,5 s, 4,9 s)** : construire **une vraie localisation de Shenzhen en Chine avec une carte exacte** et typographie/motion design bleu nuit/cyan compatible World-Vision. Ne pas reprendre la vieille carte plate, les logos emoji ni une vidéo de ville non autorisée. Fournir un MP4 de 4,9 s, ses images de contrôle, le code GitHub et son état d'approbation. Ne pas démarrer autre chose avant de récolter une appréciation du clip S02, sauf si utilisateur demande explicitement de poursuivre.

---


## 14 NOVEMBRE 2026 — SOMMET TRUMP XI POUTINE : PREMIER HOOK EN VRAI MP4 ET MONTAGE 43 S CODÉ

**Instruction actuelle du propriétaire** : construire **un montage professionnel** basé sur le script accepté, pas seulement du texte ni un nouvel éditeur. Le style de marque doit reprendre le **PNG logo G0 officiel** exact et le visuel **D00-v6 original** pour une brève introduction. Le sommet du 19 novembre à Shenzhen **n'a pas encore eu lieu** ; utiliser des archives explicitement étiquetées, aucune fausse scène de sommet.

**Vrai code et premier artefact produit :**
- Composition Remotion professionnelle séparée `services/media-renderer/src/WorldVisionSummit2026.tsx` (8 plans, 43 secondes, 13 segments de sous-titres reprenant mot à mot le script, photos d'archives, typographie bleu nuit/cyan, zones sûres, logo exact ; **aucune couleur rose/orange de l'ancien template**).
- Entrée ajoutée à `services/media-renderer/src/Root.tsx` sans écraser l'ancien moteur.
- `services/media-renderer/render-summit-preview.mjs` (vidéo 1080×1920 à 30fps, vérification du Git blob du logo `bc80fa70cebd566768bfb1703a0f1f636a78c196`, SHA-256 D00 attendu `8d9a9d20f20fbf7757713b6f5eab06590f191166eb779865747f0f59683cfca2`, master complet bloqué si assets D00 originaux et voix WAV approuvée manquent).
- `.github/workflows/whv-summit-hook-preview.yml` (téléchargement des vrais portraits à licences vérifiées, build Remotion, 3 captures FFmpeg, publication même branche d'aperçu). **Hook corrigé et livré** via `media-lab/summit-2026/hook-4p5s-preview.mp4` sur `whv-media-studio-browser-preview`, MP4 de **4,5 s 1080×1920, sans voix**, SHA-256 `8e0975eb2fe66cb502271d23c542b120271f9b9d3df989306dd2840a1e1bf05a` au premier contrôle après correction des collisions. Capture `media-lab/summit-2026/review/contact-sheet.jpg`.
- Test de conservation **mot à mot du script** dans `summit-2026-contract.test.mjs`, comparé avec `docs/media/episodes/2026-11-14_trump_xi_putin_shenzhen/SCRIPT_V1.md` ; 13 segments, aucune coupure du texte, 43 secondes. Contrôle unitaire également ajouté au workflow ; les dernières exécutions doivent être vérifiées avant d'affirmer vert.
- SRT préparatoire `SOUS_TITRES_BROUILLON_43S.srt` sur le dossier d'épisode, **non encore aligné à une vraie voix**, 13 sous-titres.
- Import **sans redessin** dans Canva connecté : original globe D00-v6 Canva media `MAHa4F1Owfk`, logo officiel exact téléchargé depuis Github Canva media `MAHa4H6Rel4`. Importation GDrive depuis l'ancien file-ref non aboutie : ne pas prétendre D00 dans Drive ou en binaire dans Github.

**Preuves et limites** :
- Premier hook animé a été généré par l'action [#43579184494](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43579184494), statut **success** : trois images vérifiées avec logo officiel exact et portraits de Trump, Poutine et Xi ; collision texte/labels corrigée et rerendu par l'action [#43579354004](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43579354004) success.
- Le **master 43 s n'existe PAS** à ce stade : le rendu est volontairement bloqué tant que l'image D00 originale n'a pas été **copiée en tant que binaire exact dans l'asset du renderer**, et la vraie voix française choisie/validée n'est pas fournie.
- Photos Reuters/AP sous licence **non utilisées** dans le hook ; photos d'archives d'origine White House / Kremlin téléchargées par Github Action, attributions dans `MONTAGE_PLAN_V1.md`.
- L'audition/choix de voix française et l'alignement réel des sous-titres restent à faire. Aucun MP4 n'est approuvé pour publication.

**LIENS** :
- Vidéo hook https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/summit-2026/hook-4p5s-preview.mp4
- Dossier storyboard https://github.com/OBIANG5/World-Health-Vision/blob/feature/world-vision-media-studio/worldhealth-vision-v2/docs/media/episodes/2026-11-14_trump_xi_putin_shenzhen/MONTAGE_PLAN_V1.md

**Suite obligatoire (pas une autre refonte)** : revue qualitative du hook et correction ; intégrer le PNG D00-v6 ORIGINAL **une seule fois** au renderer, générer/tester une vraie voix française via outil Google accessible puis produire tout le master Remotion de 43 s, aligner SRT sur WAV, QA iPhone et rendre à l'utilisateur. **Ne jamais remplacer l'image par une reconstruction du globe.**

---

## PRIORITÉ ACTUELLE — MONTAGE D'UNE VIDÉO À LA FOIS (13/11/2026)

**Cette décision du propriétaire prévaut sur la priorité n8n/Shotstack et les pilotes refusés plus bas dans l'historique.** La recherche des nouvelles est **SÉPARÉE** du montage : tâche ChatGPT World-Vision existante (`6a9050fddd5c8191929b1f8cfa8d0f3e`) **réactivée**, horaire, filtrée pour actualités majeures et seules nouveautés significatives. L'utilisateur choisit le sujet et valide le script avec nous. **LE TRAVAIL PRINCIPAL DE CE PROJET EST LE MONTAGE PROFESSIONNEL À PARTIR DU SCRIPT APPROUVÉ**.

**Guide canonique à lire en premier pour le futur monteur** : [MONTAGE_ONLY_HANDOFF_2026-11-13.md](worldhealth-vision-v2/docs/media/MONTAGE_ONLY_HANDOFF_2026-11-13.md). Le dépôt possède **déjà** `services/media-renderer/src/WorldVisionShort.tsx` (Remotion : images, vidéos, audio, scènes, citations et logo), `services/media-renderer/server.mjs`, un PNG du logo officiel dans `services/media-renderer/public/brand/world-vision-official.png` ; ne pas reconstruire l'éditeur. Exploiter Google Flow pour les scènes d'ouverture à partir de la référence D00-v6 (après vérification du rendu) et Google Vids en français pour voix/retouches sur ordinateur, puis Remotion/FFmpeg pour le master MP4 9:16 et QA.

**G0 logo bleu officiel et D00-v6 concept du globe/œil : incontournables.** Le PNG original D00-v6 n'a pas encore ses octets dans GitHub ; son mouvement n'est pas encore validé : ne pas reprendre les CGI de démonstration comme intro finale. L'utilisateur n'a pas donné le prochain script approuvé. **Aucune nouvelle vidéo n'est déclarée finie.**

**n8n Radar JSON et étude Shotstack** restent archivés mais **hors chemin critique**. Aucun n8n à acheter ou ouvrir pour débuter ; la tâche ChatGPT couvre la veille horaire.

---

## DÉCISION PRIORITAIRE DU 13 NOVEMBRE — AUTOMATISATION ET IDENTITÉ, FIN DU PILOTE MANGROVES

**C'est désormais le point de reprise ACTUEL ; il annule les anciennes mentions « pilote mangroves actif » et « continuer à coder le globe » figurant plus bas dans l'historique.** L'utilisateur a **rejeté** l'actualité NASA mangroves comme insuffisamment marquante. Il exige : **(1)** sélection de **3 à 5 actualités mondiales majeures** avec classement/validation, **(2)** logo bleu œil-globe officiel et globe D00-v6 intégrés à chaque production pertinente, **(3)** **un centre de production automatisé**, sans ouvrir une multitude de sites, **(4)** usage des meilleurs logiciels existants au lieu de tout recoder.

**Livrables réellement nouveaux** : [AUTOMATION_COCKPIT](worldhealth-vision-v2/automation/WORLD_VISION_AUTOMATION_COCKPIT.md), [workflow n8n importable RADAR](worldhealth-vision-v2/automation/n8n/world-vision-radar-v1.n8n.json), [contrat de marque obligatoire](worldhealth-vision-v2/automation/brand/WORLD_VISION_BRAND_LOCK.json). Le workflow lit 4 flux RSS et classe des candidats toutes les heures ; **non importé/activé sur une instance n8n** faute de compte connecté. n8n est l'orchestrateur envisagé, Shotstack (ou Creatomate si meilleur test) le moteur vidéo à templates ; Google Drive conserve les assets, Gemini/API et TTS sont des intégrations à connecter séparément. Google Flow Pro **n'ouvre pas d'accès API inclus** et ne peut pas être annoncé comme automatisé.

**État actuel, sans surpromesse** : code de workflow/documentation versionné dans GitHub, **aucune plateforme n8n ni moteur Shotstack connecté**, aucun nouveau MP4. L'ancien pilote mangroves a été marqué **REFUSÉ** dans son dossier et ne doit pas être poursuivi. L'image D00-v6 (SHA-256 `8d9a9d20f20fbf7757713b6f5eab06590f191166eb779865747f0f59683cfca2`) existe en conversation et n'a pas encore ses octets committés à GitHub ; sa validation comme ouverture vidéo reste à obtenir.

**Prochaine action réelle** : l'utilisateur active/autorise une instance n8n Cloud d'essai, importe le workflow existant, vérifie les sources/classements puis connecte une file d'approbation. Ensuite un modèle vidéo World-Vision sous Shotstack/Creatomate avec assets de marque, voix, rendu, QA et permissions de publication.

---



## PILOTE REPORTAGE #001 — MANGROVES NASA, SCRIPT ET STORYBOARD (13 NOV 2026)

**La nouvelle méthode multi-outils a réellement démarré sur un sujet d'actualité vérifié.** Sélection : NASA Earth Observatory, 13 novembre 2026, « A Global Rebound for Mangroves ». La NASA compare deux images Landsat de la côte du Myanmar en 2010 et 2026 et résume la reprise mondiale depuis 2010, tout en signalant des pertes persistantes dans le delta du Niger. Recherche croisée avec Tulane University (4 juin 2026) et NOAA.

**Livrables GitHub** : [Dossier de production complet avec 6 plans, vrais médias NASA/NOAA, source fact-check, voix, scénarisation et choix outils](worldhealth-vision-v2/docs/media/episodes/2026-11-13_mangroves_nasa/PRODUCTION_PACK.md) ; [texte voix off FR V1](worldhealth-vision-v2/docs/media/episodes/2026-11-13_mangroves_nasa/voix_off_fr_v1.txt).

**Stade réel :** RADAR/VERIFY/SCORE terminés, script **provisoire** et storyboard terminés, liens vers assets authentiques identifiés ; **pas de vraie voix auditionnée, pas de montage Vids/CapCut, pas de MP4 de ce reportage et aucune publication**. Ne pas confondre avec le micro-clip technique Gabon D01. Pour cet épisode, **Google Flow volontairement écarté** : il y a déjà de vraies images NASA et le code de globe n'est pas nécessaire.

**Prochain livrable à réaliser :** audition voix FR sur le même extrait avec Google Vids si ordinateur, ou voie mobile accessible si iPhone seul ; enregistrer ensuite les deux JPEG originaux NASA (6,23 et 3,56 Mo), montage en six scènes et export complet. Le workflow général des 137 pages est dans [WORLD_VISION_PRODUCTION_CONDUCTOR_2026-11-13.md](worldhealth-vision-v2/docs/media/WORLD_VISION_PRODUCTION_CONDUCTOR_2026-11-13.md).

---


## 13 NOV 2026 — CONDUCTEUR MULTI-OUTILS PRIORITAIRE POUR LA PREMIÈRE VIDÉO COMPLÈTE

**Nouvelle décision stratégique :** le propriétaire ne veut plus de prototypes CGI isolés. Il demande un système fidèle au manuel original de 137 pages, utilisant les **meilleurs outils réellement accessibles** à chaque étape via **ChatGPT Plus + Google AI Pro** : choix d'un fait réel → script sourcé → storyboard → véritables rushes → voix française naturelle → plans illustratifs Flow si utiles → **montage complet dans Google Vids 9:16** → SRT/FFmpeg → contrôle iPhone → MP4 et archivage. **Ne pas passer du temps à réécrire un moteur de montage complet tant que cette filière suffit.**

**Guides canoniques créés :**
- [Conducteur complet multi-outils, 9 parties du PDF, 14 étapes de production, outils, critères, coûts, limites](worldhealth-vision-v2/docs/media/WORLD_VISION_PRODUCTION_CONDUCTOR_2026-11-13.md).
- [Modèle à dupliquer pour chaque nouvelle vidéo, script, storyboard, voix, preuves, médias et étapes](worldhealth-vision-v2/docs/media/WORLD_VISION_EPISODE_TEMPLATE.md).

**Capacités officiellement vérifiées, mais aucun accès personnel à supposer :** Google AI Pro inclut Google Vids avec voix IA FR et projets 9:16, Flow 1 000 crédits/mois (+ crédits quotidiens selon source Google), AI Studio Gemini indépendant pour API ; **ChatGPT Plus n'inclut pas automatiquement l'API OpenAI**. Google Vids s'exporte en MP4, mais **ses sous-titres automatiques documentés sont en anglais** ; pour le français, envisager SRT aligné par Whisper et QA. Ne pas imposer ElevenLabs payant à la première vidéo.

**Statut :** conducteur créé/archivé dans GitHub, **pas encore de reportage complet produit par ce processus**. La vidéo technique D01-Gabon existe mais n'a pas de faits, de voix, de montage ni d'approbation artistique. **Prochain vrai objectif : UN épisode d'actualité réel et complet de 40 à 50 s**. L'épisode commence avec son sujet sourcé et le montage papier ; l'intro 3D définitive n'est plus un blocage pour livrer une première vidéo journalistique.

---


## REPRISE PRIORITAIRE D01 — VRAI CLIP GABON 4S (13 novembre 2026)

**Dernier livrable vérifié** : véritable MP4 H.264 de 4 secondes, 1080×1920 à 24 fps (96 images), produit par WebGL NASA + moteur géographique, dirigé vers GABON (GAB) en démonstration. **Ne pas recommencer le moteur à zéro.**

- [MP4 technique dans GitHub](https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-lab/wv-d01-gab-technical-4s.mp4) — SHA-256 `17796338023f0ffd9732739390ac2535c816113baf8e6dd773879314604bb22a` ; [workflow de rendu réussi](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43466731755).
- [Trois vraies frames début/milieu/fin](https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-lab/review/contact-sheet.jpg) — [QA réussi](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43468666079), SHA et métadonnées vérifiés.
- [Documentation D01](worldhealth-vision-v2/docs/media/D01_GABON_MOTION_REVIEW_2026-11-13.md) ; lecteur D01 directement intégré dans `CinematicMotionReview.tsx/.css` du Media Studio, sans autoplay et sans diffusion.
- **Aucun D00-v6 / D01 approuvé artistiquement.** Le concept beau et réaliste reste référence prioritaire : globe détaillé, deux arcs d'œil, blanc pur, atmosphère cyan plus visible que les arcs, frontières exactes. La nouvelle vidéo est une **preuve de mouvement technique**, pas encore un générique achevé.
- Suite : corrections de fidélité artistique, D02 zoom vers un lieu vérifié, vraies images, audition voix, sous-titrage, montage Remotion/FFmpeg, QA, validation et publication éventuelle. Respecter le manuel original de 137 pages : `worldhealth-vision-v2/docs/media/AUDIOVISUAL_PRODUCTION_MASTER_PLAN_2026-11-13.md`.

---


## POINT PRIORITAIRE 13 NOVEMBRE — FILM CGI D01 DE 4S

**Cette mise à jour supplante les anciens paragraphes « pas de vidéo »** pour le prototype technique uniquement. Le nouveau moteur WebGL phototexturé NASA est codé dans `frontend/web-v2/src/media/CinematicEarth.tsx`; le ciblage géographique GeoJSON préexistant pilote son orientation, sans revenir au vieux globe plat. Une **vraie micro-vidéo H.264 4 secondes (1080×1920, 24 fps, 96 images)** a été rendue et archivée sur GitHub avec preuve FFprobe/sha256.

- [Regarder le MP4 technique GAB / 4s](https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/wv-d01-gab-technical-4s.mp4)
- [Manifest et SHA-256 du film](https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-lab/wv-d01-gab-technical-4s.json) : `17796338023f0ffd9732739390ac2535c816113baf8e6dd773879314604bb22a`
- [Workflow de rendu réussi #43466731755](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43466731755)
- [Documentation technique D01](worldhealth-vision-v2/docs/media/CINEMATIC_D01_MICROCLIP_2026-11-13.md) et [D00 CGI](worldhealth-vision-v2/docs/media/CINEMATIC_EARTH_D00_ENGINE_2026-11-13.md)

**Attention : prototype de rotation, NON approuvé artistiquement, sans actualité réelle Gabon, sans voix, sous-titres, montage documentaire ni diffusion réseaux.** La référence D00-v6 d'origine du chat **n'a pas été écrasée** et reste la boussole artistique (deux arcs, vraie sclère blanche, atmosphère lumineuse et frontières sahariennes très lisibles) ; son PNG original n'est pas encore dans GitHub, contrairement à son hash et à ses spécifications.

**Prochain travail :** comparer le vrai micro-clip/CGI à D00-v6, ajuster l'aspect jusqu'à qualité média, compléter ciblage événementiel avec lieu vérifié et construire une actualité pilote sourcée et montée : voix naturelles auditionnées, rushes véridiques et autorisés, scripts, sous-titres, QA et validation humaine, selon les 14 étapes et le manuel de 137 pages.

---



## ALERTE DE REPRISE — NE PAS REMPLACER D00-v6 PAR LE GLOBE VECTORIEL

**13 novembre 2026.** Le propriétaire a clairement rejeté l'idée que le globe simplifié du laboratoire remplace la belle image cinématographique de référence. **Le Canvas GeoGlobe/GeoTargetingLab n'est qu'un prototype de rotation**, et non une direction artistique de rechange.

**Visuel artistique de référence en cours de validation** : `a_crisp_ultra_detailed_high_contrast_digital_ill.png`, PNG exact 1086×1448, SHA-256 `8d9a9d20f20fbf7757713b6f5eab06590f191166eb779865747f0f59683cfca2`. Le fichier a été retrouvé localement dans le chat ; ses **pixels ne sont pas encore importés dans GitHub**. Ne pas confondre une empreinte et un fichier sauvegardé. Préserver les détails photographiques, les frontières des pays du Sahara, le globe immense, les deux arcs de l'œil du vrai logo, le blanc pur et l'atmosphère cyan dominante ; G1 n'est pas encore validé.

**Changement de code** : `GlobeDirection.tsx` affiche un encadré `data-art-direction-ref="D00-v6"` et range la démonstration technique dans une section `<details id="wv-globe-tech">` fermée par défaut. Le test mobile `media-preview-smoke.mjs` vérifie le libellé et la fermeture avant d'ouvrir volontairement le simulateur. Détails dans `docs/continuity/CURRENT_STATE_AND_NEXT_STEP.md`, `docs/continuity/DECISION_REGISTER.md` et `docs/continuity/WORK_JOURNAL.md`.

**Objectif de l'incrément suivant** : récréer la qualité de D00-v6 en CGI 3D reproductible, coupler le mouvement géographique existant sans en reprendre l'apparence simplifiée, puis faire approuver séparément la belle frame 9:16 et le micro-clip. Les 137 pages de formation, la voix, les rushes, le montage, les sous-titres et la QA restent dans `worldhealth-vision-v2/docs/media/AUDIOVISUAL_PRODUCTION_MASTER_PLAN_2026-11-13.md`.

---


## REPRISE PRIORITAIRE — prototype de rotation vers les pays réellement livré (13/11/2026)

**Ne pas recommencer de zéro :** le laboratoire technique qui fait tourner la Terre vers un pays est **codé et accessible** dans le Media Studio. Il repose sur `geoTargeting.mjs` (SLERP, code ISO3, données GeoJSON), `GeoTargetingLab.tsx` et `GeoGlobe.tsx`; une actualité avec `country_iso3` exploitable présélectionne son pays, sinon aucun pays n'est inventé. Rotation manuelle sur 4 s, curseur et reset. **Il s'agit d'une carte Canvas 2.5D de laboratoire, pas de la future vidéo 3D professionnelle.**

**Preuve :** [workflow de preview mobile réussi](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43461296086) ; manifeste de site `source_commit=f0b281889676a20fbefba62fd45cf1fd5c2856ed` ; screenshots iPhone publiés dont [arrivée au Gabon](https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-globe-motion-arrival-gabon-iphone.png). [Lien Media Studio permanent](https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/index.html?view=media&screen=review&gate=direction), bouton « Tester le nouveau moteur : la Terre tourne vers un pays ».

**Les validations existantes ne changent pas :** G0 logo bleu officiel, D00-v6 concept art non approuvé, A/B/C rejetées, MP4 COP31 refusé, D01 seulement prototype technique. **Étape suivante :** obtenir le master D00 photoréaliste 3D en vrai 9:16 avec frontières Sahara fiables, halo atmosphérique cyan dominant, blanc d'œil pur et exactement deux arcs hors écran ; le faire approuver, puis le connecter à la rotation mathématique. Ensuite voix naturelle à auditionner, montage rushes authentiques, sous-titres, audio, QA, exports. Le PDF 137 pages et les 14 étapes du Media Studio restent documentés [dans le plan directeur](worldhealth-vision-v2/docs/media/AUDIOVISUAL_PRODUCTION_MASTER_PLAN_2026-11-13.md) et [l'audit d'ingénierie](worldhealth-vision-v2/docs/media/engineering/GEO_TARGETING_PROTOTYPE_2026-11-13.md).

---



## POINT ACTUEL — 13 NOVEMBRE, NOUVELLE IMAGE D00-v6 ET PLAN COMPLET

**Ce paragraphe est prioritaire sur les récapitulatifs antérieurs v4/D00 du fichier.** Le propriétaire aime la direction de D00-v5 mais a demandé blanc d'œil **pur**, diffusion atmosphérique **plus claire que les deux arcs** et **frontières des pays du Sahara** beaucoup plus lisibles. Une nouvelle **image fixe D00-v6** existe dans la conversation, SHA-256 `8d9a9d20f20fbf7757713b6f5eab06590f191166eb779865747f0f59683cfca2`. **Elle n'est pas encore validée et son binaire n'a pas été enregistré sur GitHub.**

**À LIRE pour reprendre sans perdre voix/montage/code :**
- [Plan directeur audiovisuel complet : manuel de 137 pages, pipeline, globe, voix, montage, QA](worldhealth-vision-v2/docs/media/AUDIOVISUAL_PRODUCTION_MASTER_PLAN_2026-11-13.md).
- [Contrat machine D00-v6, Géociblage futur](worldhealth-vision-v2/docs/media/art-direction/d00-eye-globe-visual-contract-v6.json).
- [Historique des six images et corrections](worldhealth-vision-v2/docs/media/art-direction/D00_EYE_GLOBE_VISUAL_ITERATIONS_2026-11-13.md).
- [Décisions humaines](worldhealth-vision-v2/docs/continuity/DECISION_REGISTER.md), [Journal](worldhealth-vision-v2/docs/continuity/WORK_JOURNAL.md), [État](worldhealth-vision-v2/docs/continuity/CURRENT_STATE_AND_NEXT_STEP.md).

**Prochaine production à entreprendre après validation humaine du visuel** : créer un globe 3D **qui tourne automatiquement vers le pays/localisation de chaque actualité**, en s'appuyant sur des coordonnées vérifiées, puis traiter chaque plan, les vraies images, trois auditions de voix, le calage/sous-titrage, le montage et les exports ; **pas de vidéo complète avant toutes validations**. Logo officiel discret en haut à gauche ou autre coin = **hypothèse de design non validée**. Ne pas supposer que les fichiers générés dans le chat ont été publiés sur le site statique.

---


> **Point d'entrée durable du dépôt GitHub.** Ce document permet de relancer la plateforme World Health Vision et le média World-Vision sans réinventer le code ni perdre les décisions utilisateurs.

**Entrée GitHub indépendante des branches :** [Issue #11 — START HERE : reprise World-Vision](https://github.com/OBIANG5/World-Health-Vision/issues/11). Ce ticket renvoie à tous les fichiers de continuité même si GitHub ouvre `main` par défaut.

## Décision artistique la plus récente (13 novembre 2026) — LIRE AVANT TOUTE ACTION

Le propriétaire a explicitement **rejeté les trois premières maquettes A/B/C** : elles sont jugées « moches », sans note chiffrée donnée individuellement. Ne jamais lui demander de les sélectionner à nouveau.

Nouvelle signature prioritaire : **« globe terrestre qui tourne vers le pays → zoom pays/ville → vrais médias de l'actualité vérifiée → information/contextualisation → transition »**. Les inspirations viennent de deux vidéos TikTok, dont une a été réellement réexpédiée et analysée (Focus Géopolitique, SHA `4e4e979144b59ee9359287c75773cfbbb5cefbd12d05f71ec9ba3bd66f3328bb`). **Le prompt exact disparu sous les deux vidéos reste introuvable** : ne pas en inventer la citation.

La formation `monter-et-animer-vos-videos-avec-claude-v2.pdf` de **137 pages** a été retrouvée et ses chapitres sur les designs, voix, skills, montage et contrôle qualité ont été lus. Elle doit guider l'implémentation **avec ChatGPT et le code GitHub**, sans prétendre que Claude est indispensable.

**Nouveau code visuel proposé :** `worldhealth-vision-v2/frontend/web-v2/src/media/GeoGlobe.tsx`, `GlobeDirection.tsx` + CSS, six poses fixes D00→D05, source `public/countries.geojson`. **Ce sont des maquettes vectorielles à évaluer, pas encore un globe photoréaliste en vidéo ni des plans réels de reportage.** Logo officiel bleu maintenu. Ancien COP31 MP4 rejeté 1/10. Ne pas lancer de rendu complet.

Lire impérativement :
- [Directive artistique complète](worldhealth-vision-v2/docs/media/art-direction/WORLD_VISION_GLOBE_SIGNATURE_DIRECTIVE_2026-11-13.md)
- [Audit d'application de la formation](worldhealth-vision-v2/docs/media/TRAINING_137_PAGES_IMPLEMENTATION_AUDIT_2026-11-13.md)
- [État actuel](worldhealth-vision-v2/docs/continuity/CURRENT_STATE_AND_NEXT_STEP.md)
- [Registre des décisions](worldhealth-vision-v2/docs/continuity/DECISION_REGISTER.md)

---
## Point de reprise prioritaire — message du 13 novembre 2026

**L'étape actuelle est l'identité audiovisuelle G1 : un globe géographique qui ouvre un reportage et converge vers le lieu concerné, puis de vraies images/vidéos et des explications.**

**Les anciennes maquettes A/B/C sont REFUSÉES. D00–D05 sont des prototypes d'images fixes non approuvés.**
Le propriétaire a corrigé explicitement toute généralisation : **une actualité peut concerner UN seul pays, et ne doit surtout pas en faire défiler plusieurs par défaut**. Plusieurs lieux seulement lorsqu'ils servent le sujet.

- [Contrat des formats : un lieu / relations géographiques / tour du monde](worldhealth-vision-v2/docs/media/art-direction/EDITORIAL_GLOBE_FORMATS_AND_REVIEW_CONTRACT_2026-11-13.md)
- [Audit partiel du manuel de 137 pages contre le code réel](worldhealth-vision-v2/docs/media/TRAINING_137_PAGES_IMPLEMENTATION_AUDIT_2026-11-13.md)
- [État et action suivante](worldhealth-vision-v2/docs/continuity/CURRENT_STATE_AND_NEXT_STEP.md)

Le logiciel et les docs ne prouvent pas une vidéo professionnelle finale, ni la connexion Google Flow/ElevenLabs/Gemini/n8n. Reprendre D00 avec inspection visuelle et notes, **sans faire de MP4 complet avant validation**.

---

## Le plus important, à lire en 60 secondes

- **Dépôt :** `OBIANG5/World-Health-Vision` ; **produit V2** sur `v2`, **Media Studio** sur `feature/world-vision-media-studio` ; PR [#5](https://github.com/OBIANG5/World-Health-Vision/pull/5) en draft, non fusionnée.
- **Lien permanent Media Studio :** https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/index.html?view=media
- **Lien direct aux maquettes actuelles :** https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/index.html?view=media&screen=review&gate=direction
- **Logo officiel actuel :** fichier original `frontend/web/src/assets/logo.png` (œil+globe bleu), **approuvé explicitement sans note** ; éventuel vert et multicolore seront étudiés plus tard.
- **Ancien premier MP4 COP31 :** vrai rendu technique, mais **REFUSÉ 1/10** sur quinze critères ; [Issue #9](https://github.com/OBIANG5/World-Health-Vision/issues/9). Ne pas publier ni traiter comme modèle accepté.
- **Jalon actif :** trois directions de l'ouverture A documentaire, B chiffres, C pédagogie ; **aucune sélection ni notation approuvée**. Les faire juger avant toute animation/voix/montage final.
- **Site statique :** le lien téléphone montre le vrai frontend compilé en mode **archive**, pas le backend live 24/7. L'envoi d'un avis sur GitHub requiert encore une confirmation de l'utilisateur sur GitHub.
- **Interdiction absolue :** ne pas fusionner `main`/`v2`/`feature` à l'aveugle, ne pas inventer des sources, scènes réelles, scores, validations, reçus de publication ou une connexion Gemini.

## Référence vidéo récemment récupérée (13 novembre 2026)

Une des deux vidéos TikTok auparavant signalées comme disparues a **été renvoyée et analysée image par image** : clip de ~64,9 s, globe satellitaire mobile, cinq rubriques géopolitiques, filigrane `@focus.geopolitique`. La direction visuelle candidate **D : « Globe → pays → information »** en est issue. **Aucune nouvelle direction n'est validée** pour autant.

- [Étude minutée de la vidéo réellement reçue](worldhealth-vision-v2/docs/media/references/2026-11-13-focus-geopolitique-video-reference.md)
- [Manifest JSON et SHA-256 exact](worldhealth-vision-v2/docs/media/references/2026-11-13-focus-geopolitique-video-reference.json)
- **Original MP4 :** reçu dans ChatGPT, mais **non versé sur GitHub**, car média tiers dont les droits ne sont pas vérifiés. Une sauvegarde privée est nécessaire pour conserver les octets originaux hors de ce chat.

## Lire les documents dans cet ordre

1. **[État du projet et prochaine décision](worldhealth-vision-v2/docs/continuity/CURRENT_STATE_AND_NEXT_STEP.md)** — ce qui est codé, déployé, refusé et en attente.
2. **[Prompt et procédure pour reprendre dans un nouveau chat](worldhealth-vision-v2/docs/continuity/NEW_CHAT_HANDOFF.md)** — texte à copier, vérifications GitHub et protocole.
3. **[Historique chronologique V0 → V2 → Media Studio](worldhealth-vision-v2/docs/continuity/PROJECT_TIMELINE.md)** — reconstitution sourcée, sans prétendre restituer les chats mot pour mot.
4. **[Registre de toutes les décisions validées/refusées](worldhealth-vision-v2/docs/continuity/DECISION_REGISTER.md)** — preuves et blocages humains.
5. **[Journal de travail à compléter à chaque session](worldhealth-vision-v2/docs/continuity/WORK_JOURNAL.md)** — commits, QA, preview, captures, erreurs, point de reprise.
6. **[Index des 586 commits d'ancêtres vérifiés](worldhealth-vision-v2/docs/continuity/COMMIT_HISTORY_INDEX.md)** — historique Git détaillé jusqu'au 13 novembre ; [historique Git natif dynamique](https://github.com/OBIANG5/World-Health-Vision/commits/feature/world-vision-media-studio/) pour toutes les modifications ultérieures.
7. **[Inventaire des 26 branches](worldhealth-vision-v2/docs/continuity/BRANCHES_SNAPSHOT_2026-11-13.md)** — retrouver V0/V1/V2, médias et branches de preview sans perdre les travaux parallèles.
8. **[Guide du cache et des mises à jour du lien permanent](worldhealth-vision-v2/docs/continuity/PREVIEW_RELEASES_AND_CACHE.md)** — version visible, tests, limites et nouveau lien de preview si nécessaire.

## Compléments techniques

- [Architecture du Media Studio](worldhealth-vision-v2/docs/media/WORLD_VISION_MEDIA_STUDIO.md)
- [Audit artistique et méthodologie d'approbation](worldhealth-vision-v2/docs/media/QUALITY_GATE_EDITORIAL_2026-11-13.md)
- [Contrat du formulaire de notation](worldhealth-vision-v2/docs/media/REVIEW_AND_APPROVAL_WORKFLOW.md)
- [Limites de publication TikTok et WhatsApp](worldhealth-vision-v2/docs/media/PUBLISHING_CONNECTORS.md)
- [Historique des échanges et travaux antérieurs au 13 novembre](worldhealth-vision-v2/docs/media/REPRISE_PROJET_WORLD_VISION_2026-11-12.md) — document d'époque à relire avec attention : certains états sont dépassés.
- [Règles de documentation à respecter](worldhealth-vision-v2/docs/continuity/README.md)

## Discipline à imposer à tout nouveau chat ChatGPT

1. **Lire GitHub AVANT de coder** : sources, dernière branche, PR, CI, publications, fichiers sauvegardés.
2. **Compléter la documentation APRÈS chaque incrément** (pas seulement à la fin du projet).
3. **Montrer les rendus réellement produits**, identifier les maquettes versus MP4, fournir le lien du site mis à jour sur iPhone et vérifier le `source_commit` affiché.
4. **Demander l'approbation du propriétaire à chaque jalon créatif** ; un « continue » est une demande de progression réfléchie, pas une validation rétroactive d'un rendu insuffisant.
5. Garder les sources, crédits, licences, métadonnées, empreintes et retours notés ; ne pas produire des faux éléments d'actualité.
6. **Reconnaître les limites** des données historiques : le journal Git enregistre le code, pas toutes les paroles échangées. Compléter par le propriétaire quand une décision manque.

**Ce fichier se trouve volontairement à la racine de la branche Media Studio.** Il reste accessible indépendamment de la longueur du chat actuel.
