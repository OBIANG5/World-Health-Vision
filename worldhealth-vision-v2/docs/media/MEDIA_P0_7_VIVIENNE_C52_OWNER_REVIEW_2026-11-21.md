# World-Vision MEDIA P0.7 — La voix choisie est une contrainte de réalisation

21 novembre 2026. Le propriétaire a corrigé une dérive importante : de nouvelles vidéos lui ont été montrées avec Kokoro alors qu'il avait déjà retenu Vivienne C5.2 — Impact média. Même pour un « test technique », il ne faut pas lui faire juger le résultat d'une voix qu'il a écartée. **Instruction explicite : la prochaine fois, PAS MAINTENANT.** Cette étape n'ajoute aucun nouvel enregistrement ni vidéo.

## Décision vocale vérifiée sur le dépôt

- Voix choisie : **Vivienne C5.2 — Impact média**, ID fournisseur **fr-FR-VivienneMultilingualNeural**, débit **+8 %** ; ne pas substituer l'ancienne Vivienne +11 %, Kokoro, Remy, Henri ou C5.1.
- Branche historique : whv-media-studio-browser-preview ; dossier media-lab/nextgen/vivienne-c5-linked.
- MP3 de référence seulement : c5_broadcast-review-only.mp3, 14,088 s, Git blob SHA1 cd2254c1557b815fd63a4861af9086d26d960da6 ; brut : c5_broadcast-raw-service.mp3, Git blob SHA1 b36aca061d634e68be464e805284d3aa1735a5f6.
- Détails dans c5_broadcast-report.json : même modèle, débit +8%, 51 mots sur un accident de bateau sur le Mississippi, pas de collage ni coupure de silence. Les métriques ne prouvent pas le naturel ou la licence.
- Le fichier d'audition de 14 secondes n'est pas la narration d'un futur sujet. Son exact contenu sonore ne doit jamais être recyclé pour une autre actualité.

## Ce qui a été implémenté

Le module services/media-renderer/creative/owner-review-voice-gate.mjs fournit la référence canonique et valide un manifeste local, pour la prochaine fois où le propriétaire devra écouter un film. Il n'est ni synthétiseur, ni reconnaissance de locuteur, ni preuve des droits.

Le renderer services/media-renderer/creative/render-project.mjs propose l'argument facultatif --owner-review-voice-manifest /chemin/absolu/manifest.json ; ce drapeau signifie que la vidéo est DESTINÉE À L'AVIS DU PROPRIÉTAIRE, contrairement aux anciens tests techniques.

**Avant** de dépenser du calcul en rendu, le contrat vérifie :
1. Un projet précis avec script inchangé SHA256, piste voix présente, manifeste portant le même project_id ;
2. les valeurs exactes vivienne-c5-2-impact-media, fr-FR-VivienneMultilingualNeural et +8% ;
3. l'existence d'une nouvelle prise avec fichier local sous les assets, la même entrée relative que le projet, et le SHA256 des octets audio ;
4. refus des deux MP3 originaux du laboratoire C5.2 par leurs empreintes Git, d'un ancien sujet, d'un autre fichier, d'un autre modèle ou débit, d'un JSON inconnu, d'un symlink extérieur, d'un fichier vide ou excessif ;
5. statut pending_owner_review, publication_authorized=false et rights_status=not_yet_verified.

La réponse de validation inclut une catégorie « owner_audiovisual_review_not_publication » et les hashes de la voix/texte. En l'absence de ce manifeste, l'export reste explicitement « internal_technical_qa_only » : on ne doit pas le présenter comme film approuvé ou destiné à jugement artistique. Le manifeste constitue une déclaration de provenance : il ne prouve PAS par biométrie que le MP3 est réellement Vivienne, ne prouve pas qu'il prononce chaque mot, et ne certifie ni qualité ni licence. Une écoute humaine et une preuve de fournisseur restent nécessaires.

Tests : services/media-renderer/creative/owner-review-voice-gate.test.mjs. Des OCTETS INVENTÉS uniquement pour les tests permettent de simuler la présence et les empreintes d'un fichier — il ne s'agit pas d'une nouvelle vidéo ou voix. Les scénarios couvrent bonne référence, mauvaises voix et débits, vieux script, altération audio, ancien enregistrement, droits/publication, chemins, JSON et rejet rapide par CLI avant export. CI dédiée Node/TypeScript sans TTS ni MP4.

## Exemple de manifeste à créer à la prochaine production, pas maintenant

Les valeurs entre parenthèses ci-dessous sont des placeholders, et ne prétendent PAS représenter un fichier existant :

    schema_version: worldvision-owner-review-voice-v1
    project_id: (ID du film effectivement choisi)
    voice_profile_id: vivienne-c5-2-impact-media
    provider_voice_id: fr-FR-VivienneMultilingualNeural
    speaking_rate: +8%
    script_sha256: (SHA256 de l'UTF8 exact du texte approuvé)
    voice_file: audio/(nouvelle prise pour CE script).mp3
    voice_sha256: (SHA256 des octets de CE nouveau fichier)
    recording_scope: new_take_for_this_exact_script
    human_listening: pending_owner_review
    publication_authorized: false
    rights_status: not_yet_verified

La commande future, uniquement quand cette vraie prise et son manifeste seront prêts :

    node creative/render-project.mjs --project /work/script-approved.json --assets /work/episode-assets --output /work/review/film-v1.mp4 --owner-review-voice-manifest /work/private/voice-review.json

Ne pas activer le rendu pour le propriétaire sans cette piste C5.2 correspondant au texte. Si elle manque, avancer sur recherche visuelle, scénario, storyboard, effets muets ou contrôles de sources, mais ne jamais la remplacer silencieusement par une autre voix.

## Prochaine suite intelligente à priorité réelle

1. Terminer P0.7 : GitHub Actions sur le HEAD exact avec tests **SANS VOIX/VIDÉO**. Corriger toute erreur attestée, consigner les validations et les limites.
2. Revenir à un vrai sujet explicitement choisi par le propriétaire, sans transformer automatiquement une actualité de carrousel en vidéo. Vérifier faits/temps/droits, fixer script et angle.
3. Écrire le déroulé de la narration et des images ensemble : hook à l'image zéro, deux re-hooks qui font progresser le récit, vrais rushes/action/documents sourcés, chiffres/carte GEO si utiles, SFX et musique sous droits, sous-titres dans les zones TikTok. Aucun objet décoratif injustifié.
4. Enregistrer **la même Vivienne C5.2 +8%** pour ce texte exact, avec une méthode sous droit d'usage confirmé ; écouter la prise, phonèmes, micro-blancs et expressivité avant évaluation. Ne pas recycler le MP3 de l'accident fluvial, ne pas accélérer un rendu pour compenser un texte trop long.
5. P0.3 pour mots réellement horodatés, P0.4 pour corrections chirurgicales, P0.6 pour preuves lisibles en 390px, puis vraie vidéo entière. Un MP4 vert n'est pas encore un film international réussi : le propriétaire doit l'écouter/voir/valider.
6. Mesurer les reprises et le temps jusqu'à un MASTER HUMAINEMENT VALIDÉ, et réutiliser ensuite seulement les effets approuvés en actualité générale, géopolitique et finance.

## Reprise de chat et limites

Dépôt OBIANG5/World-Health-Vision, branche feature/worldvision-media-vivienne-c52-owner-review-lock-2026-11-21, enfant de PR #132 P0.6 dont les 6 workflows étaient SUCCESS sur 3269ac31356d8b8bf474600f43cef9912592a30a. Lire en premier la NOUVELLE section du fichier CONTINUITE_WORLD_VISION.md puis VOICE_REFERENCE.md, le présent document et issue #116 ; les commentaires de la PR P0.7 portent les SHA et les CI plus récents.

Ne rien fusionner, déployer ou publier automatiquement ; aucune dépense, aucun nouveau modèle, aucun accès ChatGPT/Gemini/Azure sous prétexte d'un test. Ne pas toucher au logiciel Atlas, ABAA ou Trading-Vision.
