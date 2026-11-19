# World‑Vision MEDIA — atelier audiovisuel à partir du script et des médias fournis

**Décision corrigée du propriétaire, 19 novembre 2026.**
**Source de vérité pour le nouveau chantier média.** Elle remplace, sur tous les points contradictoires, le document `WORLDVISION_CINEMATIC_DIRECTOR_PRODUCTION_V1_2026-11-19.md` généré prématurément.

## 1. Ce que l'utilisateur demande — explicitement

> Pour le moment ChatGPT recherche les idées et prépare les scripts dans la conversation. Le code de World-Vision doit prioritairement transformer les scripts, photos, petites vidéos et éventuels audios fournis en **vidéos extrêmement belles**, captivantes du début à la fin. Le studio concentre son travail sur la direction artistique, les visuels, le motion design ambitieux, la voix (Vivienne remplaçable), le son, le montage et les contrôles finaux. Prendre les meilleures idées de BAOCOM sans l'intégrer ni le publier. Plus tard World-Vision pourra inspirer BAOCOM, jamais l'inverse comme dépendance technique. Ne pas programmer un faux concurrent de technologies IA plus fortes qui existent déjà.

### Répartition retenue

| Fonction | Aujourd'hui |
|---|---|
| Recherche d'actualité, choix éditoriaux, scénarisation | ChatGPT + utilisateur dans la conversation ; PAS un prérequis informatique du montage |
| Entrée du studio | Script fourni ou copié + fichiers images, vidéos, sons, ou animations MP4 externes |
| Direction artistique | Composer et choisir chaque plan, styles cinématographiques, cadrage et rythme |
| Animation | Remotion pour motion design éditorial reproductible, clips générés/animés par services spécialisés importables |
| Voix | Source audio humaine ou synthétique choisie par l'utilisateur. **Aucun timbre fixe ni Vivienne obligatoire** |
| Montage | Timeline déclarative, Remotion/FFmpeg existants, transitions, soundbed, clips déjà produits importés |
| Finalisation | Vraie sortie vidéo, images de contrôle, audio et revue humaine ; non-confusion tests/qualité artistique |
| Futur | Content OS étendu, blog, connecteurs GDELT à laisser de côté jusqu'à décision ultérieure |

**BAOCOM reste totalement indépendant et n'est PAS copié, poussé, connecté ou publié dans ce chantier.** Le panneau de travail inspiré de ses meilleures idées peut être intégré à **World-Vision**, sans partager son code.

## 2. Ce qui a été corrigé immédiatement

La première PR #44 contenait une mauvaise interprétation : onze « portes » de recherche/approbation imposées par du Python, une voix Vivienne obligatoire et une interface de consignes plutôt qu'un montage réel. **Le propriétaire a explicitement refusé ce périmètre.**

Les trois fichiers de validateur strict ont été supprimés de la branche. Le panneau précédent a été remplacé par un atelier **script + fichiers + plans + composition + choix audio + export de projet**. Le code du moteur enregistre désormais toute piste vocale reçue sans imposer de fournisseur, de débit ou de script généré.

Les documents précédents restent historiques ; les présentes décisions priment sur les descriptions anciennes qui parlent encore de Vivienne « obligatoire », de 11 portes imposées, ou de Content OS/GDELT à lancer immédiatement.

## 3. Architecture pragmatique — NE PAS réinventer les technologies IA

**Le meilleur code n'est pas le plus gros.** World-Vision doit être la *colle de production* entre un média réel et les moteurs les plus aptes à chaque tâche :

| Besoin | Réutiliser d'abord | Rôle exact de notre code | Vérification avant activation |
|---|---|---|---|
| Motion design éditorial paramétrique | **Remotion** existant + transitions officielles | Plans, keyframes/trajectoires, audio, compositing, rendus | Licence de production, direction graphique, résultats sur iPhone |
| Montages complexes et traitement audio | **FFmpeg / ffprobe** existants | Recadrage contrôlé, cuts, concat, normalisation, mastering, mesures | Aucune dégradation de source/voix |
| Effets motion professionnels très complexes | **Adobe After Effects** ou **Blackmagic Fusion/DaVinci Resolve** | Importer le clip exporté, ou adapter plus tard un flux d'automatisation sous licence | Accès utilisateur, coût, formats, capacité de rendu headless |
| Génération / transformation artistique de b‑roll illustratif | **Runway et autres fournisseurs professionnels de génération vidéo**, suivant leurs API et droits réels | Appeler un fournisseur **si configuré** ou importer son MP4 | Autorisation commerciale, provenance, pas de faux plan d'événement |
| Narration naturelle, multilingue et expressive | **Voix humaine**, **ElevenLabs**, **Azure Speech** (Vivienne si souhaitée), ou autre prestataire autorisé | Importer et synchroniser le master réellement choisi | Essai comparatif, qualité, vocabulaire, prononciation, licence |
| Photos / vidéos réelles | Agences et titulaires de droits, bases officielles, photojournalisme autorisé, bibliothèques stock **seulement pour contexte explicite** | Organiser, importer, recadrer, attribuer, présenter | Exactitude lieu/date, authenticité et droits de publication |
| Sous-titres et alignement | Outils ASR / forced alignment spécialisés existants | Synchroniser les vrais mots à l'audio, styler sobrement | Écart visuel, lecture mobile, chiffres et noms |
| Génériques et identité | Signature **G0 originale fournie**, ou nouveau choix explicite de l'utilisateur | Assembler le clip original comme clip, ne pas redessiner le logo | Conserver la séquence approuvée |

**Liens officiels de vérification** :
- Remotion compositing/transitions : https://www.remotion.dev/docs/video-and-audio et https://www.remotion.dev/docs/transitioning
- Remotion licence (une règle doit être relue à l'échelle future de l'entreprise) : https://www.remotion.dev/docs/license/pricing
- Adobe After Effects automatisation `aerender` : https://helpx.adobe.com/after-effects/desktop/render-and-export/automate-rendering/automated-rendering-network-rendering.html
- Blackmagic Fusion scripts Python/Lua : https://www.blackmagicdesign.com/products/davinciresolve/fusion
- Runway Dev : https://docs.dev.runwayml.com/
- ElevenLabs API : https://elevenlabs.io/docs/overview/capabilities/text-to-speech

**Aucun de ces comptes/services payants n'est ici déclaré connecté ou souscrit.** Les clés restent en coffre serveur, jamais dans le navigateur ni dans Git. Le moteur doit fonctionner avec des médias déjà fournis sans attendre ces intégrations.

## 4. Livrables réellement codés sur PR #44 corrigée

### A. Compositeur audiovisuel réel

`services/media-renderer/src/CreativeEdit.tsx`, composition `WorldVisionCreativeEdit` dans `src/Root.tsx` :
- Script d'entrée **inchangé** (aucune génération) ; titres/eyebrows/sous-titres éditoriaux par plan, uniquement à partir du projet.
- Photos et rushes vidéo ; permet aussi de poser des **animations MP4 externes complètes** sur la timeline.
- Cinq *familles de plans techniques* : `documentary`, `kinetic`, `evidence`, `number`, `clean_video`. Ce sont des bases de compositing, **pas des créations certifiées dignes des meilleurs studios de motion design**.
- Mouvement doux `locked/dolly/drift/push`, transitions officielles Remotion `cut/dissolve/slide`, timings en frames et calcul exact des chevauchements.
- **Voix fournie libre** et musique externe en pistes indépendantes. La voix est **facultative dans le projet** ; son fournisseur est libre.
- Clip de signature fourni en fin de film, utilisé comme vrai clip vidéo ; aucun logo régénéré. Les visuels du clip sont réencodés lors du master, ne pas promettre une identité de SHA entre fichier source et master.

### B. Import et rendu local sans réinventer un logiciel de montage

`services/media-renderer/creative/validate-project.mjs` et `render-project.mjs` :

- Contrat JSON `worldvision-creative-project-v1`, durées en frames 30ips, images/vidéos/audios référencés par fichiers **locaux**.
- Protection de chemins (pas d'URL distante incontrôlée, pas de `../`, symlinks ne doivent pas sortir du répertoire), SHA-256 réel sur chaque fichier, copie temporaire des sources dans le `public/` Remotion avant rendu et nettoyage après traitement.
- Blocage si une image requise manque ; aucun plan de fausse actualité ajouté à la place.
- `@remotion/bundler` → `selectComposition` → `renderMedia` H.264 MP4 ; rapport JSON avec empreinte du script, fichiers source, taille, empreinte MP4.
- Ne prétend ni autoriser publication ni valider licence, émotion, vérité journalistique ou performance TikTok.
- Exemple `creative/project.example.json` volontairement **entièrement synthétique**, sans images représentant une actualité.
- Tests `creative/validate-project.test.mjs` de l'import, des noms et des chemins, des transitions, des narrations librement choisies et de l'absence de substitution de médias.

**Lancer localement** :
```bash
cd worldhealth-vision-v2/services/media-renderer
npm install
node --test creative/validate-project.test.mjs
npm run typecheck
node creative/render-project.mjs --project creative/project.example.json --assets /chemin/vers/assets --output output/creative/essai.mp4
```
Pour un vrai reportage, remplacer le projet d'exemple par **le JSON exporté de l'interface et les fichiers dans le dossier assets sélectionné**. Les noms de fichiers doivent correspondre.

### C. Interface inspirée du meilleur concept BAOCOM, mais spécifique à World-Vision

`frontend/web-v2/src/media/CinematicProductionBoard.tsx` :
- Champ **script fourni** (le code ne le rédige pas).
- Sélection locale de photos, vidéos, voix, musique et outro ; aperçu d'un média importé.
- Édition des plans (type de composition, durée, visuel, mouvement, transition, titre, sous-titre, ordre).
- Sélection **sans timbre de voix imposé**.
- Export d'un projet JSON compatible avec l'assembleur en ligne de commande ; **les fichiers sources ne sont PAS téléversés à cette étape**.
- Le tableau dans la véritable page `ProductionJourney` remplace le panneau de portes imposées. Le circuit historique de 14 étapes médias reste disponible mais ne constitue PAS un prérequis bloquant dans ce nouveau montage.
- Pas encore d'export MP4 directement dans le navigateur, pas de backend d'uploads, pas de TTS commandé par cette page.
- Dans le code de l'interface, la prévisualisation locale est **la source brute, pas un aperçu mensonger du composite final**.

## 5. Pourquoi cette base n'est pas encore un résultat de qualité mondiale

Un moteur de rendu qui réussit ses tests n'a pas les compétences d'un directeur de la photographie ni d'un véritable motion designer. Les compositions initiales sont des **supports techniques**, pas une collection d'effets « cinéma » aboutis.

Pour atteindre la qualité souhaitée il faut :
1. Étudier des références visuelles et sonores de première qualité ; documenter le mouvement, la lumière, la hiérarchie visuelle et la tension narrative sans copier des créations protégées.
2. Construire une **bibliothèque de séquences élaborées** avec une vraie attention aux détails : tracking, masquages, lumière, profondeur et transitions de sens ; utiliser directement les meilleurs moteurs existants et importer les animations plus complexes produites ailleurs.
3. Tester sur **vraies images choisies par le propriétaire**, pas une couleur unie de fixture.
4. Évaluer l'audio avec essais comparatifs (pas seulement la transcription égale), en conservant les meilleurs masters vocaux.
5. Corriger **plan par plan** sans régénérer les médias inchangés.
6. Rendre des previews à coût limité, puis assembler à haute qualité seulement après approbation.
7. Comparer les versions avec l'utilisateur ; apprendre des notes humaines, mais ne pas prédire ou garantir la viralité.

## 6. Prochain chantier — ordre intelligent et concret

**R1 — Ingestion médias fiable.** Ajouter un upload authentifié/durable avec stockage objet; exploiter les services existants V2, pas réécrire un stockage serveur complet. Supporter vidéo, photo, audio, projets JSON, gestion des versions, droits et origines. Ne jamais envoyer les rushes dans des repos publics.

**R2 — Vrais aperçus de composition.** Relier la nouvelle interface au moteur Remotion avec rendu d'une image ou d'une courte séquence pour le plan sélectionné, avant master MP4. Éviter la lenteur : caches par SHA, travail sur un seul plan modifié, player mobile.

**R3 — Direction graphique de haut niveau.** Un plan d'ouverture / un tableau de chiffres / un document primaire doivent être réalisés à la hauteur d'un vrai reportage. Remotion de base si suffisant ; pour les effets supérieurs, intégrer un export Resolve/Fusion, After Effects, Blender, ou un fournisseur de génération vidéo par API plutôt que reconstruire le moteur de ces logiciels.

**R4 — Comparateur de voix.** Prises humaines ou prestataires interchangeables, l'utilisateur peut garder Vivienne ou élire une meilleure voix. Comparer sur le même script et volume. Aligner sous-titres et rendre le mix non destructif.

**R5 — Montage avancé, design audio et finitions.** Compositions sur plusieurs pistes, masques, transitions pro choisies, raccords au récit, son et couleur plus cinématographiques, vrais exports 1080×1920 et éventuellement horizontaux.

**R6 — Atelier de production façon Content OS (limité à l'audiovisuel).** Vues projet/plan/assets/voix/review/export/version, pas de blog, pas de connexion GDELT ni un deuxième CMS.

**R7 — Bibliothèque de projets réellement acceptés.** À partir des scripts et médias fournis ici, reproduire ce qui a réellement reçu un bon retour et l'enrichir. Les styles rejetés restent archivés comme échecs, pas comme templates.

## 7. Audit de validation avant toute déclaration de réussite

| Preuve | Statut |
|---|---|
| Projet utilisateur → contrat JSON | Codé |
| Choix de voix arbitraire et script intact | Codé et couvert par tests |
| Interface locale + export JSON | Codé ; compilation CI à vérifier |
| Remotion dans ce dépôt et types TS | Déjà existants, nouvelle composition ajoutée ; vérifier en CI |
| **Véritable MP4 avec la composition nouvelle** | Nécessite un job CI de rendu, pas encore une validation artistique |
| Upload distant vers le serveur & master depuis interface | **Non fait** |
| Des animations dignes des plus grands motion designers | **Non fait : direction artistique et approbation nécessaires** |
| Connecteurs Runway/ElevenLabs/After Effects/Fusion | **Non configurés** ; références seulement |
| Sélection de photo reportage automatique fiable | **Non faite** ; sources à fournir ou rechercher explicitement |
| Performance de rétention et viralité | **Non mesurée** ; dépend du sujet, de l'édition et du public |
| GitHub `v2` fusionné / site Vercel mis à jour | **Non** : PR brouillon, pas de déploiement |

## 8. Continuité entre chats

1. Lire cette note **en premier**, puis PR #44 sur `feature/worldvision-cinematic-director-gates-2026-11-19` (nom de branche historique qui ne reflète plus la nouvelle philosophie).
2. Les anciennes informations disant « Onze portes obligatoires », « Vivienne seule » sont expressément **supplantées**. Ne pas ressusciter ce contrôleur Python.
3. Le prochain script peut être fourni directement dans ChatGPT, et les images/vidéos associées ici. Préparer un montage avec les médias réels fournis, puis intégrer son rendu/apprentissage au Studio si utile.
4. BAOCOM **reste hors de GitHub et hors de ce travail**. Le blog/Content OS global et GDELT attendent.
5. Ne jamais supposer qu'une clé API, un abonnement ou un outil externe est connecté.
6. Documenter chaque incrément et tous les tests réellement exécutés, erreurs comprises.
