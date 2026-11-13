# World-Vision — contrat de montage vidéo à partir d'un script approuvé

**Décision du 13 novembre 2026.** Cette consigne prend priorité sur les anciennes priorités « construire le globe », « créer le radar n8n », « réaliser d'office le pilote mangroves » et « refaire un éditeur ». **Objectif : une vidéo par vidéo, montage professionnel d'abord.**

## Deux workflows séparés

**A. Sélection des sujets (automatisation ChatGPT dédiée)**  
La tâche EXISTANTE « World-Vision Breaking News » (`6a9050fddd5c8191929b1f8cfa8d0f3e`) a été **réactivée et mise à jour** pour une recherche horaire des nouveautés mondiales majeures. Elle prépare 3–5 candidats vérifiables par Reuters/AP/AFP/BBC/ONU et sources officielles lorsqu'ils apportent une nouveauté significative. Elle ne produit ni script définitif, ni vidéo, ni publication. Le propriétaire choisit une actualité, discute l'angle avec ChatGPT, puis **valide le script**. **Ne pas dupliquer ni remplacer cette tâche par le radar n8n, qui reste un prototype non connecté.**

**B. Montage d'une vidéo depuis le SCRIPT APPROUVÉ (priorité du projet)**  
Une fois le texte remis par l'utilisateur, l'assistant doit :
1. **Geler les paroles exactes** (conserver ponctuation, noms, chiffres, citations) ; si une correction factuelle est indispensable, signaler et demander validation, **jamais réécrire silencieusement**.
2. Décomposer en une timeline **9:16 / 1080×1920 / 30 fps** ; **chaque phrase** a : `time_in`, `time_out`, `narration`, `source_factuelle`, `visual`, `type_visuel`, `media_url`, `droit`, `texte_ecran`, `transition`, `logo`, `statut`.
3. **Chercher et sélectionner les vrais visuels** (images/vidéos de l'événement, graphiques officiels, documents, cartes fiables) avec origine, date, lieu, autorisation de réutilisation. Exclure les images synthétiques présentées comme tournées sur place ; en cas de manque, produire une représentation illustrative clairement signalée, jamais une « preuve » inventée.
4. Choisir les outils **en fonction du plan et de l'abonnement**, pas de réflexe de recodage : **Google Flow Frames-to-video** pour une intro/transition issue de l'image D00-v6 (si visuel pertinent et fourni) ; **Google Vids sur ordinateur** pour voix off française et retouches manuelles ; **Remotion/FFmpeg déjà présents dans GitHub** pour mise en page répétable, inserts, voix importée, alignement des textes, export final ; alternative **CapCut iPhone** si seule la voie mobile est disponible. **Shotstack/Creatomate restent facultatifs**, non achetés et non connectés.
5. Employer le **logo officiel G0** déjà présent dans `services/media-renderer/public/brand/world-vision-official.png` et préserver les contraintes D00-v6 (deux arcs, Terre dominante, blanc #FFF, halo cyan, frontières exactes). **Ne jamais substituer un prototype Canvas/CGI rejeté** au plan artistique. **L'intro globe animée est une composition candidate**, pas encore approuvée : en cas d'absence d'un clip validé, continuer le montage éditorial mais **bloquer le master final de la version qui l'exige**, ou proposer un montage sans cette intro pour approbation explicite.
6. **Voix off** : Gemini/Google Vids français sur ordinateur **si effectivement disponible dans son compte**, sinon voix de l'utilisateur/voix générée via un fournisseur accessible et licencié. Les forfaits ChatGPT Plus et Google AI Pro ne donnent pas automatiquement des API TTS. Ne jamais déclarer une narration enregistrée sans fichier audio réel.
7. Livrer **des étapes visibles** : storyboard complet → vidéo brouillon avec vraie image et son → 3 photogrammes (début/milieu/fin) → corrections → MP4 avec son, sous-titres FR et logo → contrôle sur iPhone. Fournir un lien **pérenne**, jamais un `sandbox:` supposé permanent. Pas de vidéos terminées imaginaires.
8. **Contrôles** : ffprobe résolutions/framerate, absence de médias absents, voix intelligible et calée (tolerance captions ±300 ms), musique sous licence, contraste, zones sûres TikTok, pas d'affirmations non sourcées, respect de l'image et du logo. Publication seulement avec accord explicite.

## L'infrastructure qu'il faut RÉUTILISER, pas reconstruire

Le dépôt `OBIANG5/World-Health-Vision`, branche `feature/world-vision-media-studio`, possède déjà :
- `services/media-renderer/src/WorldVisionShort.tsx` : composition Remotion avec `<Video>` de médias réels, `<Img>` d'images, `<Audio>` de narration, `<Sequence>` de scènes, texte et attributions de sources ;
- `services/media-renderer/src/types.ts` : contrat des scènes `VideoDraft` avec `visual_kind`, `asset_url`, `asset_license`, `asset_attribution` ;
- `services/media-renderer/server.mjs` : worker de rendu MP4 ;
- `services/media-renderer/public/brand/world-vision-official.png` : logo réellement committé ;
- `services/media-renderer/src/WorldVisionFirstReport.tsx` et `render-first-report.mjs` : **ancien essai COP31 REJETÉ**, à ne pas reproduire comme maquette.
- `automation/brand/WORLD_VISION_BRAND_LOCK.json` : contrat graphique, concept D00-v6 ; le PNG d'origine de D00-v6 **n'est pas encore binaire-committé dans GitHub**, il faut le transférer une fois dans une bibliothèque persistante avant utilisation automatique.

**État actuel :** ces composants existent ; il n'y a **aucun script final d'actualité approuvé par l'utilisateur dans ce nouveau mode**, donc pas de nouveau MP4 de reportage. La prochaine tâche de production est **d'intégrer le script que l'utilisateur remettra**, sans revenir à la construction d'un studio générique.

## Outils : choix par scène, pas allers-retours entre 5 000 sites

| Besoin | Outil n°1 et condition | Sortie attendue |
|---|---|---|
| Créer un plan visuel à partir de la référence D00-v6 | **Google Flow** : start frame / end frame (utilisation manuelle dans le compte Pro, pas API automatique présumée) | Un vrai MP4 d'intro ; on l'importe une fois dans la bibliothèque |
| Voix française et retouche guidée | **Google Vids** sur ordinateur si présent (voix off française documentée) | Fichier audio ou vidéo exportée ; accepter une voix humaine en alternative |
| Montage répétable et cohérence visuelle | **Remotion existant** + FFmpeg (source GitHub déjà auditée) | Composition 9:16, sous-titres, mixage, MP4 contrôlable |
| Ajustements manuels depuis iPhone | **CapCut mobile** uniquement si nécessaire | Finition/synchronisation depuis le téléphone, pas nouvelle application à coder |
| Rendu API cloud sans serveur maison plus tard | Shotstack/Creatomate **uniquement après démonstration de leur utilité** | Template réutilisable et rendu sous licence payante si accepté |

Google : https://support.google.com/flow/answer/16353334 ; https://support.google.com/docs/answer/15070345?hl=fr ; https://support.google.com/docs/answer/15082958?hl=fr. L'outil Flow est un générateur d'images animées qui peut déformer la carte réelle ; la géographie exacte se fait avec sources GIS quand nécessaire.

## Réponse standard au prochain script de l'utilisateur

**Ne pas faire** une nouvelle recherche d'actualités à la place de son script. Ne pas demander de revalider tout le projet. Commencer immédiatement par :
- la **timeline minutée complète** en respectant le script ;
- l'inventaire des vrais plans avec liens/licences et une direction d'animation pour chacun ;
- le placement précis de l'identité G0 et du globe D00-v6 dans le montage ;
- les prompts Flow par plan **uniquement là où justifiés** ;
- le choix de la voix FR et le support de récupération de l'audio ;
- le **premier vrai export** dès que tous les éléments nécessaires sont accessibles. Si une connexion externe ou un fichier manque, le dire exactement, sans prétendre que la vidéo existe.

**Règle de qualité :** mieux vaut une vidéo entière avec de vrais plans, un montage sobre et une voix claire qu'un fragment de CGI techniquement correct mais visuellement raté.
