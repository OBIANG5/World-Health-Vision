# World-Vision n°001 — reconstruction éditoriale V2 après refus formel

**Date : 14 novembre 2026.** La précédente vidéo de 43 secondes a été **REFUSÉE ARTISTIQUEMENT** par le propriétaire. Un rendu technique réussi sur GitHub ne signifie **jamais** « belle vidéo », « voix naturelle », « master approuvé » ou « prête à publier ».

## Ce qui a été effectivement critiqué

Les captures transmises montrent un logo carré immobile entre les trois portraits et la Terre, une typographie pauvre, des sous-titres peu lisibles et placés par-dessus des pieds de page, des effets pseudo-techniques trop présents et un écran de fermeture où le slogan est lu à voix haute. Le propriétaire a également **rejeté** le timbre `fr-FR-HenriNeural`, les pauses très longues entre les paragraphes, le remplissage par des plans inutiles et les barres de progression au bas des images.

**Erreur de processus fondamentale :** l'équipe de production précédente a confondu *FFprobe passe* avec *montage digne d'un média*. On ne devra plus présenter une compilation de clips réussis techniquement comme un reportage professionnel sans contrôle artistique complet, regardé ET écouté à vitesse normale.

## Décisions irréversibles pour le nouvel essai

1. **Garder seulement le véritable globe géographique S03 V3** (SHA-256 `59028e59f40585ed30419a56b083386e492d5cd37920f022f5e3b5301f9423fe`) comme référence géographique. Il ne sera pas reconstruit, ralenti ou remplacé. Les autres plans sont **à refondre**, même s'ils restent dans l'historique.
2. **Couper directement des trois portraits vers le globe.** Retirer définitivement les 27 images / 0,9 s de carte G0 ajoutées à l'ancien montage. D00-v6 n'est plus une dépendance obligatoire de cette nouvelle structure. Conserver néanmoins son vrai fichier et son empreinte dans l'historique Canva, sans en substituer un faux.
3. **Refaire l'identité typographique**, pas changer seulement le nom de police : Barlow Condensed Bold pour titres journalistiques, DM Sans pour contexte et sous-titres. Les titres ne peuvent pas revenir à la ligne accidentellement, dépasser la zone de composition ou se chevaucher.
4. **Retirer les barres de progression et pieds de page systématiques**, les numéros de montage, dates de fabrication, compteurs et mentions QA de tous les pixels publics. Les mentions `ARCHIVES · PRAGUE · AVRIL 2010` sont des contextualisations honnêtes et utiles.
5. **Abandonner le faux entre-deux « réduction nucléaire »** fait de petits cercles abstraits. Montrer immédiatement la photographie authentique de la signature de New START en 2010, avec sa vraie date ; aucune image ne doit prétendre illustrer une rencontre de novembre 2026.
6. **Rejeter la voix Henri** et son empreinte, ainsi que les fichiers WAV/MP3 issus de la génération précédente. La prochaine voix doit être écoutée et approuvée sur un extrait indépendant AVANT toute composition finale. Une voix humaine enregistrée est une solution valide. Le système ne doit jamais remplacer une voix non approuvée par un TTS de secours sans le signaler.
7. **Interdire `apad` ou `atrim` par segment pour remplir les durées vidéo.** Monter les images autour de l'interprétation vocale (respirations naturelles, pas de longues pauses). Auditer le signal sonore **sec**, avant d'ajouter la musique de fond, et l'écouter intégralement.
8. **Dernières trois secondes : aucun mot prononcé.** Le logo officiel et « Voir le monde, le comprendre. » peuvent rester *écrits*, mais sont interdits dans la narration.
9. **Sous-titres : police DM Sans, 78 px, 2 lignes maximum, 29 caractères par ligne**, contraste élevé, bordure discrète, position sûre au-dessus de l'interface mobile, aucun chevauchement avec les textes éditoriaux des scènes. Ils ne seront créés qu'après validation de la vraie narration et de ses repères temporels.
10. **Nouvelle durée d'environ 42,1 secondes**, et non un remplissage obligatoire à 43 secondes. Aucun plan ne sera ajouté uniquement pour atteindre le nombre 43.

## Nouvelle ligne de temps V2 — 30 fps

| Moment | Images | Intention visuelle | Source |
| --- | ---: | --- | --- |
| 0–4,50 s | 0–134 | Portraits authentiques, accroche typographique courte | Photos archivées Trump, Poutine, Xi |
| 4,50–9,40 s | 135–281 | Terre géoréférencée, rotation vers Shenzhen | **S03 V3 conservé** |
| 8,90–11,60 s | 267–347 | Shenzhen authentique, ouverture circulaire 0,5 s | Renek78 CC0 2025 |
| 11,60–19,50 s | 348–584 | Photo d'archive New START + fait vérifié de 2026 | Maison-Blanche, Prague 2010 |
| 19,50–25,70 s | 585–770 | Réserve chinoise | Portrait authentique de Xi |
| 25,70–32,90 s | 771–986 | Iran/Ukraine, comparaison éditoriale non sensationnaliste | Mise en page de faits, pas fausses vidéos |
| 32,90–39,10 s | 987–1172 | Incertitude de l'issue, aucune entente annoncée | Portrait authentique de Trump |
| 39,10–42,10 s | 1173–1262 | Signature G0 exclusivement visuelle | Logo original, slogan écrit seulement |

## Production comme vraie chaîne de qualité

**Étape A — sources :** provenance, droits, chronologie, vrai lieu ; empêcher la confusion archive/actualité.  
**Étape B — direction :** comparaison de frames et audit des coordonnées d'éléments, type, marges, contraste.  
**Étape C — voix :** audition d'un échantillon sérieux et validation humaine ; aucune voix automatiquement acceptée pour la seule raison que le fournisseur dit « neural ».  
**Étape D — montage :** un pilote à vitesse réelle, inspecté en images clés et intégralement, puis scénettes et master une fois la direction retenue.  
**Étape E — automatic QA :** format, SHA, nombre de frames, séquences, absence de fillers et progress bars, timbre rejeté, silences, lisibilité à mobile.  
**Étape F — HUMAN QA :** regarder la vidéo **entière** et l'écouter **entière** sur smartphone avant livraison. Les contrôles du programme ne savent pas décider seuls ce qui est artistiquement beau.  
**Étape G — publication :** aucun envoi TikTok/WhatsApp sans source finale, voix et image approuvées, contrôle factuel à jour.

## Sources de vérité GitHub

- Branche de reconstruction : `rebuild/editorial-v2-quality-gates` issue de `feature/world-vision-media-studio`.
- Composition Remotion refondue : `services/media-renderer/src/WorldVisionEditorialV2.tsx` ; entrée : `EditorialV2Root.tsx`.
- Rendu autonome : `services/media-renderer/render-editorial-v2.mjs`.
- Identité / droits à télécharger : `services/media-renderer/scripts/setup_editorial_v2_assets.sh`.
- Contrat : `services/media-renderer/quality/production_contract_v2.json`.
- Verrouillage CI : `services/media-renderer/quality/quality_gate_v2.py`.
- Audit audio : `services/media-renderer/quality/voice_continuity_audit.py`.
- Sous-titrage lisible : `services/media-renderer/quality/subtitle_design_v2.py`.
- Workflow de première visualisation : `.github/workflows/whv-editorial-v2-pilot.yml`.
- Les MP4 V1 refusés sont **conservés**, mais leur statut reste `REJECTED` ; ils ne doivent pas être repris comme référence artistique.

**État à cette date :** le pilote V2 de 11,6 s est une étape de test, pas un nouveau master complet. Le premier rendu pilote a révélé un titre qui chevauchait sa deuxième ligne et un cadrage Shenzhen mal centré ; le code a été corrigé puis re-rendu. Ne déclarer aucune réussite artistique avant inspection de cette correction. Le son V2 n'existe pas encore et n'est pas improvisé.
