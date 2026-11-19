# World‑Vision / Media Studio — Sprint 3 : prévisualisation Remotion identique au rendu

**Décision produit : 19 novembre 2026.**  
**Branche :** `feature/worldvision-cinematic-director-gates-2026-11-19`.  
**PR :** [#44 — atelier audiovisuel](https://github.com/OBIANG5/World-Health-Vision/pull/44) — **brouillon, non fusionnée, non déployée**.  
**Document précédent :** [Sprint 2](WORLDVISION_MOTION_DIRECTOR_SPRINT2_2026-11-19.md).  
**Document de périmètre :** [Creative Edit Handoff](WORLDVISION_CREATIVE_EDIT_HANDOFF_2026-11-19.md).

## 1. Objectif et frontière éditoriale

Le propriétaire apporte le script rédigé ici dans ChatGPT ainsi que, facultativement, des photographies, vidéos, détourage, voix et musique. World‑Vision doit fournir une **direction artistique, une réalisation visuelle, des animations, un montage, un mixage et des contrôles remarquables**. Il ne doit pas tenter de recréer un moteur génératif vidéo/TTS supérieur existant : **orchestrer Remotion, FFmpeg, les moteurs vidéo et les prestataires spécialisés choisis**.

BAOCOM reste un projet indépendant, sans transfert GitHub ni connexion. Blog/Content OS global/GDELT ne font pas partie de ce sprint. **Voix libre : Vivienne ou une autre.** Aucune des anciennes « onze portes obligatoires » ne doit être réintroduite.

**Le défaut corrigé** : le studio montrait seulement la photo ou la vidéo brute, tandis que les véritables animations étaient calculées plus tard par Remotion. Il était impossible de juger avant export les titres, la vitesse des mouvements et la composition complète. Une seconde simulation CSS aurait créé deux sources de vérité et des écarts de résultat.

## 2. Architecture réellement ajoutée

### A. Un seul composant, deux modes d'exécution

Source canonique : `services/media-renderer/src/CreativeEdit.tsx` (Remotion 4.0.542).
- **Export** : `creative/render-project.mjs` produit le MP4 H.264 depuis les fichiers locaux normalisés/stagés, avec SHA, miniatures, rapport, sortie inspectable.
- **Prévisualisation** : `frontend/web-v2/src/media/CreativeCompositionPreview.tsx` importe **exactement le même `CreativeEdit.tsx`**, à travers `@remotion/player`, sans duplicata de la chorégraphie.
- **Préparation** : `CinematicProductionBoard.tsx` réutilise les médias de la session (des `URL.createObjectURL(File)`) et convertit uniquement le **plan choisi** vers les mêmes `CreativeEditProps` que l'export. Il force `transitionAfter: "cut"` pour l'essai isolé, sans altérer les vrais paramètres de la timeline exportée.
- `resolveCreativeSource()` préserve une URL utilisateur `blob:`/`data:`/`https:` dans le lecteur, mais applique `staticFile()` aux noms des fichiers préparés par le renderer. Les médias ne sont pas téléversés par l'aperçu.
- Deux boutons permettent de comparer **Composition animée** et **Média original**. L'ancien cadrage original/9:16 reste distinct.
- `CreativeCompositionPreview.tsx` est **chargé paresseusement** : Remotion et ses dépendances ne ralentissent pas systématiquement l'accueil du logiciel, et ne se chargent qu'à la demande.
- Le lecteur a de vrais contrôles de lecture, de recherche dans les images, le plein écran lorsque disponible, et un rendu d'erreur explicite si un codec local n'est pas lisible.

### B. Solidité des versions et compatibilité

- Le frontend Vite utilise `remotion`, `@remotion/player`, `@remotion/transitions`, `@remotion/layout-utils` **tous figés à 4.0.542**, comme le renderer. Cette version n'est pas présentée comme la dernière universellement disponible : elle correspond aux moteurs existants et leur alignement est plus important que l'adoption improvisée d'une autre version.
- Les modules React/Remotion sont dédoublonnés au niveau Vite pour éviter plusieurs contextes/hooks React.
- TypeScript résout explicitement les types du composant source situé dans le répertoire `services/media-renderer` ; le partage de sources est permis côté Vite dans les limites du projet, **sans autoriser l'accès au stockage privé des médias**.
- `frontend/web-v2/package-lock.json` a été régénéré après un `npm install` réel en GitHub Actions puis enregistré dans le dépôt ; l'installation CI revient à `npm ci` afin de rester reproductible.
- Le rendu MP4 en production **n'a pas été remplacé** : même `CreativeEdit`, deux exécutions adaptées aux entrées (fichier serveur vs URL de session navigateur).

### C. Tests réels et limites explicites

**Validation établie avant le test navigateur** :
- Build complet `npm run build` du frontend avec `@remotion/player` compilé et un chunk asynchrone pour `CreativeCompositionPreview`.
- Renderer TypeScript + 11 tests de contrat + séquences MP4 9:16 avec photo, vidéo, couche transparente et audio.
- WAV réel de test analysé avec FFmpeg, silence artificiel détecté, octets sources conservés.
- Ancien artefact MP4 synthétique visible sur GitHub Actions ; il ne constitue pas une réalisation journalistique.

**Validation navigateur du sprint en plus** :
- `frontend/web-v2/creative-player-smoke.html` et `src/media/creative-player-smoke.tsx` : page *de test* ouverte uniquement par le serveur Vite de développement, non incluse dans l'entrée HTML publiée. Le test utilise une image abstraite créée par CI ; aucune photo d'événement réel inventée.
- `services/media-renderer/creative/test-player-browser.mjs` : ouvre Chromium via `@remotion/renderer`, lui fournit cette image comme `blob:` local, effectue des seeks dans le `@remotion/player`, prend deux captures de l'exact composant et compare leurs SHA ; une erreur JavaScript ou une absence de mouvement bloque le test.
- Les captures sont sauvegardées comme **artefacts CI** au lieu de se fier à une simple compilation TypeScript.
- **IMPORTANT : ne déclarer ce test navigateur réussi que si le job `Inspect real Remotion Player pixels in Chromium browser` est réellement marqué vert sur le dernier run.** Si le test échoue, consulter les logs et corriger. Un build vert n'est pas une preuve de lecture sur un téléphone.

**Limites à ne pas minimiser** :
- L'aperçu animé est **un plan à la fois**, pas encore la timeline complète avec transitions/VO/sound design synchronisés.
- Les formats vidéo locaux ne sont pas tous décodables par Safari/iOS ; l'erreur doit être présentée au rédacteur. Les fichiers MOV, HEVC ou autres peuvent nécessiter un **proxy vidéo léger** généré par FFmpeg sans modifier l'original.
- Un `blob:` de navigateur ne peut pas être utilisé par le renderer distant. Pour partager un projet entre appareils ou effectuer un vrai rendu serveur, il faut plus tard un stockage objet privé avec droits d'accès et durée de rétention.
- Des couleurs, métriques de police et timings peuvent légèrement différer selon les navigateurs. La validation visuelle finale porte sur **le MP4 exporté**, pas exclusivement sur le Player.
- Les ressources du navigateur mobile, la fluidité de lecture, les licences des contenus et le tarif/licence commerciale Remotion doivent être examinés avant un déploiement international. Les performances 5G/3G et sur iPhone réel ne sont pas mesurées par ce sprint.
- Aucun compte externe de génération vidéo/voix n'est configuré ou facturé. **Ne pas promettre que le Player réinvente After Effects, Runway, Fusion, etc.**

## 3. Priorités suivantes — du plus utile à l'échelle mondiale

1. **Un plan art-dirigé réellement excellent** avec le script, les photos/vidéos authentiques autorisées et éventuellement la narration de l'utilisateur. Comparaison A/B et revue iPhone/Android avant d'enrichir les modèles de motion design. Ne jamais publier une maquette technique synthétique.
2. **Prévisualisation du film entier** : chronologie avec raccords et prise vocale choisie, contrôle du début à la fin, commentaires et annotations temporelles. Les corrections d'un plan ne doivent pas modifier les autres.
3. **Upload authentifié et stockage sécurisé** : fichiers réels volumineux, private object storage, contrôle de droits/attribution, prévisualisations proxy, renouvellement d'URL, suppression et quota. Ne pas rendre le dossier `public/creative-import` ou un token API visible depuis Internet.
4. **Rendu incrémental et versioning** : empreintes média + styles + version renderer par scène, cache de previews, préservation de fragments approuvés, rapports de diff et vraie validation humaine. Test QA systématique comparant les frames produites avec les frames approuvées.
5. **Voix/sound design de niveau professionnel** : comparer plusieurs voix, écouter au même volume, script inchangé, forced alignment des paroles et sous-titres, mix avec FFmpeg/DAW professionnel, sans TTS maison et sans poser un timbre obligatoire.
6. **Connecteurs externes interchangeables** après audit : bibliothèques d'images licites et authentiques, source d'assets autorisés, exports After Effects/DaVinci/Fusion/Blender et API d'IA vidéo/voix quand elles améliorent réellement l'art. Concevoir un contrat provider + import MP4 plutôt qu'une dépendance à une IA unique.
7. **Content OS audiovisuel** : projets, scripts fournis, banque de médias, plans, dossiers, auditions A/B, versions, notes de revue, exports et archives. Pas encore de publication/blog/GDELT.

## 4. Mode opératoire et instructions de reprise entre chats

1. Lire la PR #44, ce document, `WORLDVISION_CREATIVE_EDIT_HANDOFF_2026-11-19.md` et le dernier chapitre de `WORLDVISION_MOTION_DIRECTOR_SPRINT2_2026-11-19.md`.
2. Inspecter le dernier commit et **le dernier GitHub Actions complet**, en particulier le job de test Player Chromium. Ne pas conclure qu'un test a réussi avant la fin de son run.
3. Vérifier `npm ci && npm run build` en `frontend/web-v2` et `npm run typecheck` en `services/media-renderer`.
4. Modifier le **composant partagé** `CreativeEdit.tsx` pour corriger une animation visible, jamais coder un effet dissocié uniquement dans le Player.
5. Ne toucher ni à BAOCOM, ni à l'export GDELT, ni à la branche canonique `v2` sans une demande explicite. PR #44 toujours brouillon tant qu'une vraie revue produit et artistique n'a pas eu lieu.

## 5. Traçabilité finale

- [PR #44](https://github.com/OBIANG5/World-Health-Vision/pull/44)
- [Media renderer / source commune](../../services/media-renderer/src/CreativeEdit.tsx)
- [Player exact / interface](../../frontend/web-v2/src/media/CreativeCompositionPreview.tsx)
- [Studio import et édition de plans](../../frontend/web-v2/src/media/CinematicProductionBoard.tsx)
- [Test visuel du Player](../../services/media-renderer/creative/test-player-browser.mjs)

**Objectif constant : produire un véritable journal audiovisuel international au niveau des meilleurs travaux de motion design, et non accumuler du code ou des interfaces inutiles.**
