# World-Vision MEDIA — Sprint P0.2, hooks cinétiques + re-hooks sonores + carte réutilisée

**21 novembre 2026 — séquence CREATIVE P0.2, branche `feature/worldvision-media-kinetic-hook-cues-2026-11-21` sur P0.1 PR #118.**

## Décision explicite, ordre absolu
L'utilisateur apporte **l'idée**, le sujet et éventuellement texte, médias et voix. Notre priorité n°1 est un **montage audiovisuel rapide et excellent** : un hook fort puis des re-hooks sémantiques à mesure du récit, mouvement des mots et des idées, musique/ambiances/effets au bon moment, et révisions non destructrices. **Cartographie du monde reste une priorité secondaire utile et une signature**, à déclencher uniquement si les paroles/le contexte le justifient. Les capacités GEO/finances/photo/document restent à l'appui ; aucune extension du globe pour elle-même.

**Contre-exemples interdits :** connecter comptes ChatGPT/Gemini sans gain démontré ; coder un deuxième moteur vidéo ; créer une IA propriétaire de segmentation de sous-titres alors qu'une API maintenue suffit ; assembler des effets aléatoires toutes les 2 secondes ; transformer un script approuvé ; cloner/voler des éléments de vidéos TikTok ; publier des démonstrations synthétiques comme actualités.

## Réemploi des meilleurs outils effectivement confirmé
- Le studio était déjà basé sur **Remotion 4.0.542**, `CreativeEdit`, `TransitionSeries`, `GeoStory`/Natural Earth, `render-project`, `--review-shot` P0.1 (vrai son), `CaptionTrack` et `@remotion/layout-utils`.
- **`@remotion/captions@4.0.542`** fournit officiellement `createTikTokStyleCaptions`, les pages et leurs tokens mot-par-mot, avec césures silencieuses. Nous l'utilisons **au lieu de réimplémenter** le moteur de sous-titres. Documentation officielle : https://www.remotion.dev/docs/captions/create-tiktok-style-captions et https://www.remotion.dev/docs/captions/displaying .
- **`@remotion/google-fonts@4.0.542`**, styles chargés à la demande : Barlow Condensed **900 italic** pour accroches à bande cyan, DM Sans **700** pour les mots et petits textes. Police d'origine des trois JPEG **non identifiée avec certitude**, choisir après comparaison à la vraie taille TikTok. Aucune police binaire vendue à l'utilisateur.
- Les Elements officiels **Word Highlight** / **Popping Word** demeurent **candidats de benchmark**, pas du code copié à l'aveugle ; compatibilité, licence, poids et qualité à juger. HyperFrames/claude-motion peuvent fournir un meilleur effet occasionnel mais ne doivent pas entraîner une deuxième pile obligatoire ; le registre HyperFrames dispose de télémétrie à analyser avant invocation.

## Architecture minimale, non destructive
- `attention-cues.mjs` valide un **champ optionnel** `wordCaptions` de mots fournis et alignés à des *frames absolues du film*, sans ASR inventé ni réécriture du script. `emphasis:true` est une **décision éditoriale**, jamais une estimation probabiliste automatique.
- Le même module valide les `soundCues`, fichiers audio locaux sourcés sous le dossier d'assets et leurs instants absolus ; rejet des chemins hors dossier, volumes dangereux, durées négatives et dépassement du film. L'ancien `voice` reste inchangé. Les origines/droits des WAV doivent être suivis dans le dossier de production ; la validation d'une extension n'est pas une validation juridique.
- `src/AttentionTypography.tsx` réutilise les **pages de `@remotion/captions`** ; notre seul habillage propre est la palette World-Vision, la typographie/police, la dalle cyan sur mot pivot et l'entrée courte. `ImpactSlabTitle` est un habillage opt-in du **titre déjà existant** sur shots `kinetic`/`number` via `titleTreatment: "cyan-slab"`.
- `CreativeEdit.tsx` dessine **les mêmes pistes** pour Player et MP4 ; ajoute les Sound FX Remotion `<Sequence>` + `<Audio>` directement à la timeline globale. Si `wordCaptions` est fourni, les anciennes `captions` ne sont pas mélangées dans le même projet : pas de double couche. **Aucun comportement changé pour les anciens JSON.**
- `brandMark: "worldvision"` active **l'ancien original** `public/brand/world-vision-official.png`, jamais un logo redessiné. Un autre média laisse ce preset absent et utilise ses propres matériaux (le profil multi-client approfondi n'est pas P0.2).
- `creative/render-project.mjs` stage les vrais WAV/MP3 fournis avec SHA et journalise le nombre de mots et SFX, puis produit le MP4 H264/AAC. `--review-shot` issu de P0.1 demeure compatible avec la nouvelle timeline — pour réviser juste un passage AVEC sons et mots pertinents, sans changer les 11 autres secondes.

### Exemple purement technique
```json
{
  "brandMark": "worldvision",
  "shots": [{
    "id": "hook-01",
    "template": "kinetic",
    "title": "LE MONDE EN MOUVEMENT",
    "titleFrameZero": true,
    "titleTreatment": "cyan-slab",
    "durationFrames": 120
  }],
  "wordCaptions": [
    {"text": "VOIR", "startFrame": 0, "endFrame": 17, "emphasis": true},
    {"text": "LE", "startFrame": 17, "endFrame": 30},
    {"text": "MONDE.", "startFrame": 30, "endFrame": 58, "emphasis": true}
  ],
  "soundCues": [
    {"file":"audio/first-whoosh.wav","startFrame":0,"durationFrames":24,"volume":0.24}
  ]
}
```
Ce fragment est illustratif, il n'est **pas** un JSON projet complet. Voir `creative/hook-rehook-map.synthetic.example.json` pour les vrais champs du schéma et le film à 3 scènes.

## Démonstration et critères de certification
Fichier : `creative/hook-rehook-map.synthetic.example.json` — film inédit de **362 images / 12,067 s**, 3 scènes dans cet ordre :
1. Hook cyan frame 0, titre gras incliné + première emphase.
2. **GEO existant** : globe vectoriel reposant sur Natural Earth, centre réellement proche du Gabon (coordonnées / ID 266 explicitement fournis), **aucun conflit ni événement inventé**. Ce n'est pas une réécriture du module GEO.
3. Retour au texte cyan avec deuxième relance.
**12 mots chronométrés**, **3 accentuations sonores originales synthétiques** + ambiance de synthèse faite par FFmpeg. **Pas de voix humaine ni de narration Vivienne**, **pas de source d'actualité réelle** ; **NON publié**. Ce test ne constitue PAS une preuve de qualité de voix, de synchronisation avec une diction humaine ni de rétention réelle.

Workflow GitHub `.github/workflows/worldvision-media-kinetic-hook.yml` :
- Installer uniquement les packages **Remotion officiels** de même version et FFmpeg si absent.
- Exécuter TypeScript + tests de schéma, timing, rétrocompatibilité, GEO (aucun compte connecté).
- Générer les WAV originaux de test (aucune musique commerciale).
- Rendre un vrai **1080×1920 / 30 fps H264+AAC**, puis contrôler 362 frames, SCRIPT SHA, 12 cues mots, 3 SFX, 4 sources audio de test dans le ledger, présence des 3 vrais stills. Extraire 8 frames à différents instants, incluant carte et re-hooks.
- Déposer MP4 + SHA + PNG en artefact temporaire. **Inspection humaine de ces 8 frames + écoute du film avant toute certification artistique.**

**État initial :** implémenté sur branche de travail, **CI et vrai rendu du SHA final à vérifier**, puis corriger seulement les défaillances réellement observées. Les vidéos d'essai ne sont pas publiables ni évaluées 10/10.

## Suite hiérarchisée P0.3–P0.5
1. **Qualité P0.2** : regarder le MP4 final et les 8 photogrammes (390 px), vérifier que les mots d'impact s'intègrent et que le globe reste pertinent sans alourdir l'ouverture. Ajuster police, hauteur, surface et mouvements seulement sur défauts visibles, *pas construire 20 presets*.
2. **P0.3 audio réellement professionnel** : partir de la **nouvelle** narration approuvée pour le bon texte (référence timbre Vivienne C5.2), importer un alignement de mots vrai/contrôlé (Whisper/forced alignment sous droits), sfx de droits établis avec séquences, ducking et stems exportables ; **ne jamais réutiliser un vieux MP3 d'un autre sujet**. Conserver une correction de timecode sans réencoder les plans inchangés.
3. **P0.4 véritable microfilm 8–12 s** approuvé (hook + 2 re-hooks réellement sémantiques, pas de buzzword visuel), comparer **l'élément Word Highlight officiel** / notre peau Remotion / éventuel effet HyperFrames sur *le même script, la même vraie voix et les mêmes actifs*. Mesurer délai, coût, qualité, 390px et changements ciblés.
4. **P0.5 film complet World-Vision** depuis l'idée choisie par l'utilisateur avec ses médias sourcés, script strict, identité validée, carte quand utile, finance quand utile ; documenter SHAs, temps et décisions à chaque PR. Ensuite recycler seulement les effets approuvés dans une bibliothèque de styles personnalisables pour autres clients.

**Issue de décision centrale** : https://github.com/OBIANG5/World-Health-Vision/issues/116 .
**Avant toute autre tâche** : relire en premier `CONTINUITE_WORLD_VISION.md` sur la branche la plus récente, puis cette note et les commentaires de la PR active.
