# WORLD-VISION — FILM-2 / Réutilisation des sous-titres minutés et intégration audiovisuelle

**20 novembre 2026 — Branche** `feature/worldvision-editorial-film2-captions-2026-11-20`, enfant directe de la PR #90 (`d8bdd56b...`), elle-même sur PR #87 FILM-1. **Aucun merge V2, aucune diffusion publique, aucune dépense externe.**

## Pourquoi ce sprint et ce qu'il ne prétend PAS apporter

La priorité approuvée par le propriétaire est la meilleure qualité vidéo internationale **avec la meilleure vitesse d'exécution et de correction**. Il ne faut ni réinventer la roue ni continuer à perfectionner des micro-effets alors qu'il manque un reportage authentique. FILM-1 a certifié le montage Remotion GEO→PAYS→PHOTO→DATA→DOC (745 frames synthétiques) ; le prochain goulot audiovisuel est la **mise en relation fiable des paroles enregistrées et des sous-titres**, dans un Player et un MP4 identiques.

L'ancien montage du **14 novembre**, conservé sur `whv-media-studio-browser-preview/media-lab/summit-2026/full-review/`, contenait déjà un `captions.srt` de 13 cues, un `captions.json` avec bornes temporelles, un master 43 s et un SHA de piste voix. **Les timecodes/format SRT sont une référence technique réutilisable, mais les affirmations politiques du reportage et les droits des images NE SONT PAS validés pour réutilisation journalistique ; ne pas republier le film.** La réutilisation ici concerne exclusivement le schéma de timings.

## Fichiers implémentés (FILM-2A)

1. `services/media-renderer/src/caption-timeline.mjs` et `.d.mts` : lecteur **SRT texte** (virgule ou point, BOM/CRLF), conversion des millisecondes en **frames globaux 30fps**. Contrat cues `{startFrame,endFrame,text,position:"upper"|"lower"}`. Détection stricte des blocs mauvais, chevauchements, ordre temporel, trop-long, hors film, contrôle Unicode/markup et limites de lisibilité. **N'effectue ni ASR ni forced alignment automatique** ; l'éditeur doit fournir des timings exacts.
2. `services/media-renderer/src/CaptionTrack.tsx` : un **seul calque de sous-titres global** au-dessus du `TransitionSeries`, ne se duplique pas pendant les dissolves. Placement mobile `upper/lower`, contraste et fondu court. Pour chaque cue, texte source identique à l'export, à l'image près. **Les collisions artistiques avec un titre/graphique restent à juger sur les vrais pixels** ; la position n'est pas une solution universelle automatique.
3. `src/CreativeEdit.tsx` : nouveaux `captions?: CaptionCue[]` dans `CreativeEditProps`, utilisé à la fois par le Player et `renderMedia`. Aucun deuxième moteur.
4. `creative/validate-project.mjs` : contrôles `captionCueIssues` contre la durée **du film avant outro**, y compris les fondu-overlaps. `creative/render-project.mjs` : mêmes cues vers le rendu et rapport `caption_cues` / `caption_timing_source=editor_supplied_not_auto_verified`. Les rendus `--shot` n'inscrivent pas une fausse piste globale désynchronisée ; ils n'ont pas de captions.
5. `frontend/web-v2/src/media/CinematicProductionBoard.tsx` : zone de collage SRT, sélection position de base, retour d'erreur, aperçu « Film entier » et export JSON identiques. Ne pas envoyer les rushes ou voix à GitHub. À terme : import direct de fichier SRT, sous-titres multilingues et placement **par cue** dans l'interface.
6. `creative/caption-timeline.test.mjs`, `creative/validate-project.test.mjs`, `creative-player-smoke.tsx`, `creative/test-player-browser.mjs` : tests unitaires SRT légacy, rejets, timecode et Playwright/Puppeteer sur vraie zone mobile : cue au frame 100, absent au 145.
7. Workflow `worldvision-cinematic-director-gates.yml` : 3e suite de tests Node, un deuxième MP4 synthétique court avec captions contrôlées et rendu Chromium 360px. Rendu intégral FILM-1 toujours conservé : **tests de non-régression non supprimés**.

### Contrat JSON et exemple de timings (illustration inventée NON JOURNALISTIQUE)

```json
{
  "captions": [
    {"startFrame": 2, "endFrame": 55, "text": "SOUS-TITRE TECHNIQUE SEULEMENT", "position": "upper"},
    {"startFrame": 70, "endFrame": 125, "text": "AUCUNE ACTUALITÉ", "position": "upper"}
  ]
}
```

Les cues sont globaux sur le film complet (en tenant compte des fondu-overlaps), et **ne sont pas des sous-titres locaux de chaque plan**. Des coupes en cours de narration doivent être ajustées dans le montage et dans le SRT de la prise finale. Les sous-titres sont textuels, non karaoke mot-par-mot pour l'instant.

## Définition de terminé — états de validation

- **Développé** : fichiers présents en branche uniquement.
- **Intégration technique** : CI Node TypeScript, rendu H.264 et contrôle Player Chromium **sur le HEAD exact**. Un CI vert ne valide ni style ni audio.
- **Artistique** : regarder captures réellement rendues et le master à 360px, sous overlays TikTok, avec lecture de la vraie voix. Exclure les collisions de sous-titres avec titres/carte/chiffres/documents.
- **Journalistique et légal** : sujet/sources vérifiés, médias autorisés pour usage international et TikTok, chronologie/date/lieu, consentement de voix, musique sous licence, chiffres et cartes vérifiables. Sans ça : **interne seulement**.
- **Publication** : validation explicite humaine, jamais par CI.

## FILM-2B — suite prioritaire sans réinventer la roue

1. **Vérifier CI au HEAD** et corriger première erreur de build/test. Lire le vrai MP4 et les screenshots de captions ; ne pas annoncer une certification artistique à partir d'un rapport.
2. **Retrouver assets éditoriaux vérifiés et autorisés** pour une vidéo pilote internationalement pertinente. Construire une fiche d'événement : source primaire + confirmation indépendante + horodatage, emplacement, licence image et preuve, données/graphes (si réellement utiles), voix consentie, BGM et droits internationaux ; aucun média GitHub public sans permission.
3. **Choisir la voix** humainement (sans Vivienne imposée) ; produire le master vocal à partir du script approuvé et aligner mot/phrases avec outil spécialisé existant, en gardant sa transcription, le SHA et les corrections manuelles. Adopter SRT final dans le Studio et évaluer un vrai **DUCKING** musical avec `ffmpeg`/Remotion ; mesurer LUFS/true peak, pas appliquer à l'aveugle des chiffres cibles.
4. **Filmer FILM-2 PREMIUM 20–40 s**, le minimum de plans réellement nécessaires, pas 5 grammaires imposées. Contre-audit 360px avec références finance/géopolitique et charte World-Vision (Gabon et globe appréciés, bleu/cyan, pas d'éclats dorés).
5. **Réutilisation forte** : packager seulement les plans et techniques approuvés, temps de montage et révision mesurés, coûts/licences unitaires documentés ; comparer moteur actuel contre outils tiers seulement lorsqu'un déficit concret est constaté. Audit code externe avant toute installation.
6. **Avant fusion/déploiement** : auditer dépendances PR empilées #44/#72/#74/#80/#84/#87/#90 et rendre le Studio réellement accessible ; procédure de rebase/convergence, puis revue humaine du site et des droits. Aucun merge automatique.

## Règles de gouvernance

- `CONTINUITE_WORLD_VISION.md` reste la porte d'entrée pour tout autre chat ; chaque nouveau HEAD certifié devra mentionner SHA, PR, workflows, artefacts, défauts visuels et prochaines étapes.
- Ne jamais confondre `subtitle` par plan (texte éditorial) avec `captions` (transcription minutée de voix), ni un SRT avec preuve que la voix et les mots correspondent réellement.
- BAOCOM, GDELT, blog, statistiques institutionnelles V2 sont des chantiers indépendants ; ne pas brancher automatiquement leurs contenus dans une vidéo publiable.
- Aucun service de clonage/génération vocale, produit payant, upload de médias, publication sociale ou déploiement n'a été lancé pendant FILM-2A.
