# World-Vision Media Studio — échec de qualité et nouvelle procédure de validation

Date : 13 novembre 2026  
Branche de travail : `feature/world-vision-media-studio`  
Lien de consultation à conserver : `https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/index.html?view=media`

## Décision formelle

**Le pilote COP31 rendu le 13 novembre 2026 est REFUSÉ artistiquement.** Le rendu technique, le hash SHA-256 et une CI verte ne valent **pas** validation éditoriale, artistique ou audiovisuelle.

- Ne pas publier ce MP4 sur TikTok ou WhatsApp.
- Ne pas l'utiliser comme modèle de qualité, de charte ou comme référence pour les rendus suivants.
- Conserver le MP4, son script, ses sources, ses journaux d'exécution et son manifeste à des fins d'audit ; les éléments techniques fonctionnels restent exploitables.
- Ne pas regénérer automatiquement le MP4 entier à chaque modification du composant : produire et approuver **séparément** chaque brique (branding, voix, plan, animation, montage).
- Conserver la branche média isolée ; ne pas fusionner dans `main` sans validation complète.

## Audit basé sur le fichier vidéo utilisateur

Le 13/11/2026, le fichier vidéo renvoyé par l'utilisateur a été inspecté et neuf instants ont été comparés (1,5 ; 5 ; 9 ; 13 ; 17 ; 21 ; 25 ; 29 et 34 secondes).

1. **Logo non conforme.** Le renderer dessine un nouvel œil/globe géométrique en SVG au lieu de charger et afficher le logo World-Vision **effectivement approuvé**. Le logo affiché dans le MP4 rejeté était un dessin approximatif. Le propriétaire a depuis explicitement confirmé le logo bleu historique exact comme **logo officiel actuel** (13/11/2026) ; une éventuelle recolorisation sera étudiée ultérieurement.
2. **Narration visuelle déficiente.** Les sept scènes reprennent globalement le même globe filaire et la même grille typographique, sans vrais médias évocateurs de l'événement, sans progression visuelle démontrant les mécanismes.
3. **Image trop sombre.** Fond bleu-noir et zones vides massives ; manque de contraste visuel, de hiérarchie et de matière documentaire.
4. **Mauvais habillage.** Éléments « 01 / 07 », « HOOK », barre de progression, étiquettes de QA, micro-textes permanents et footer répété : ce sont des indicateurs techniques qui n'ont pas leur place dans un reportage grand public.
5. **Voix hors critères.** Le TTS de substitution Piper `fr_FR-siwis-medium` a été choisi pour démontrer la chaîne technique, mais sans audition comparative de voix, sans validation de prosodie journalistique, sans écoute humaine et sans transcription ASR indépendante avant livraison.
6. **Manque d'exigence éditoriale.** Les preuves d'encodage H.264/AAC et SHA-256 ne garantissent ni une vidéo intéressante ni la conformité de la direction artistique.

**Important :** les utilisateurs doivent toujours recevoir l'information honnête sur les voix ou images synthétiques lorsqu'elle est requise. Sur TikTok, préférer l'étiquette native « contenu généré par IA » et/ou la description appropriée lorsque nécessaire, plutôt que d'afficher en permanence « voix générée par IA » dans le cadre vidéo ; contrôler les règles du canal avant chaque diffusion. Ne jamais fabriquer de faux plans d'un événement réel en les présentant comme une couverture authentique.

## Nouveau workflow : jalons de validation, un livrable à la fois

### Gate 0 — Restauration de l'identité officielle
- **Décision G0 enregistrée :** utiliser le PNG bleu original œil-globe comme identité officielle actuelle, dans le frontend et Remotion ; multicolore reporté.
- Préparer les variantes sans altération : positif, négatif, fond clair/foncé, signature courte et filigrane discret.
- Fixer les tokens validés : palette, police(s) légalement utilisables, tailles, contrastes, marges verticales TikTok, signature éditoriale.
- Livrable : **une seule planche de charte** (PNG ou page web), visualisable sur smartphone, à approuver **avant** vidéo.

### Gate 1 — Grammaire d'un reportage World-Vision
- Préparer les références de standards qualitatifs : image d'ouverture, vrai document/source, infographie, carte utile, sous-titres mesurés, clôture.
- Ne pas recopier le style d'un autre média ; construire une signature originale.
- Supprimer de l'export public les balises `HOOK`, numéros de scènes, barres de durée et informations de QA ; ces éléments restent dans le Control Room uniquement.
- Livrable : storyboard **image par image** et 1 à 2 maquettes de scènes, pas 36 secondes finalisées.

### Gate 2 — Vérification des médias/illustrations
- Privilégier photos et vidéos réelles de l'événement, officielles ou sous licence vérifiée, avec attribution.
- Si aucune preuve visuelle exploitable n'existe, choisir graphique factuel ou illustration originale **clairement identifiable comme telle**, sans inventer de fausses images du terrain.
- Chaque asset porte la source, l'auteur, la licence, le crédit et l'adéquation factuelle.
- Livrable : sélection de plans / assets validés.

### Gate 3 — Casting vocal
- Comparer séparément plusieurs voix françaises adaptées à l'actualité, dont Gemini 3.8 Flash TTS via Google AI Studio si accessible, et éventuellement un enregistrement humain.
- Exiger une voix chaleureuse, expressive, calme, non dramatique ; tester chiffres, noms propres, liaison et diction ; valider le débit et la ponctuation.
- Les voix ne sont pas considérées acceptées par le simple fait qu'un WAV existe.
- Livrable : courts extraits audibles ; validation d'une seule voix avant montage.

### Gate 4 — Prototype de mouvement
- Créer un clip original de 3 à 6 secondes à partir des composants visuels approuvés.
- Utiliser les outils vidéo Google (Flow / Veo / Omni si disponibles) pour les plans spécifiques, **sans** déléguer aux modèles IA la représentation factuelle d'événements non filmés.
- Valider transition, mouvement de caméra, lisibilité, composition, éclairage et safe zones.
- Livrable : micro-clip + revue sur iPhone.

### Gate 5 — Assemblage et vérifications
- Assembler les plans/voix approuvés dans Remotion avec composition sonore, sous-titrage et transitions cohérentes.
- Écouter intégralement le MP4 et inspecter des images à plusieurs temps, en vérifiant la présence des voix, le rythme, la lisibilité et la cohérence visuelle.
- Tests automatiques : H.264/AAC, orientation, texte hors cadre, safe zones, droits, sources, cohérence script/transcription, SHA-256.
- Livrable : version candidate, **non publiable tant que les contrôles humains ne sont pas explicitement verts**.

### Gate 6 — Sorties par canal
- Générer séparément le master WhatsApp et le dérivé TikTok conforme ; assurer la traçabilité vers le MP4 canonique.
- Publication avec consentement et reçus de vrais canaux ; aucun faux indicateur « published ».

## Ce que l'on conserve du code

- Source-checks, preuves des claims et fiches média.
- Génération de scripts, structuration des scènes et manifestes.
- Contrats API, frontend des 14 étapes, Control Room, Remotion/FFmpeg, files de rendu, SHA-256.
- Les tests CI, utiles mais insuffisants : **QA visuelle et sonore obligatoire**.

## Transparence sur les outils

L'abonnement Google AI personnel et l'accès aux applications Google ne sont pas synonymes de crédits API, de connecteur ni de serveur IA. Les outils Google Flow, Nano Banana et Gemini Audio peuvent être employés via les applications et exports auxquels le compte donne effectivement accès. Ne pas affirmer que ces intégrations ont déjà été configurées.

## État de reprise

Le dernier MP4 reste un **pilote technique rejeté**, même s'il est lisible au lien GitHub. **G0 confirmé sans note numérique.** Prochaine opération : évaluer séparément l'une des trois directions artistiques de l'ouverture (A, B ou C), puis créer un micro-clip seulement après validation. Le rendu vidéo complet reste interdit jusqu'aux gates ultérieurs.

Ce document est l'engagement de ne plus confondre « build réussi » et « vidéo professionnelle ».
