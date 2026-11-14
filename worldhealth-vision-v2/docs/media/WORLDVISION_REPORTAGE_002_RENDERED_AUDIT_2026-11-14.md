# World-Vision — Reportage n°002 : premier MP4 COMPLET rendu

**Livrable produit dans ChatGPT le 14 novembre 2026, pas encore publié dans le dépôt GitHub sous forme binaire.**
Cette distinction est importante : la vidéo a bien été rendue et vérifiée
localement dans la conversation, mais son téléchargement dépend de la
pièce jointe de la conversation, jusqu'à dépôt du MP4 sur la branche d'aperçu.

## Film complet effectivement généré

- Titre : collision du pétrolier Atlantic Asphalt avec le bateau de
  croisière American Heritage, La Nouvelle-Orléans, 13/11/2026.
- Durée ffprobe : **17,100 s**, 513 images à 30 fps.
- Export H.264/AAC, **1080×1920**, 2 186 664 octets.
- SHA-256 du MP4 : `bb02423dc380acafd4ec4859f20daf230b9adb4a4509eaba4d0ede799f624384`.
- Narration : **Vivienne C5.2 Impact média** originale retenue par le
  propriétaire, **14,088 s**, aucun changement de voix.
- Outro : **signature officielle G0 fond acier clair**, trois secondes
  silencieuses, intacte et visuellement inspectée dans le fichier final.
- Loudness audio final mesuré environ **−16,64 LUFS**, true peak −2,19 dBTP.

## Images : caractéristiques et limites

Le film comporte **quatre parties d'illustration animée originales** :
1. Navire-citerne et bateau de croisière vus en illustration explicative;
2. Le navire se couche sur le côté dans le Mississippi;
3. Chiffre 32 des hospitalisations, aucun état critique signalé;
4. Question finale sur la cause encore à déterminer;
5. Signature graphique validée de trois secondes.

**Aucun visuel n'est une image documentaire de l'accident.**
Chaque plan explicatif porte la mention :
« ILLUSTRATION GRAPHIQUE — NON IMAGES DE L'ACCIDENT ».
Les images sont construites en vecteurs et Pillow, sans téléchargement
ni utilisation sans droit de vidéos WDSU / AP / Barry Kern.
Il ne faut pas prétendre que le film prouve visuellement les faits :
il s'agit d'une explication graphique temporaire.

Le programme local utilisé pour le rendu est disponible dans l'archive
`WORLD_VISION_002_COMPLETE_SOURCE.zip` attachée au chat World-Vision,
avec la vidéo, le code Python, l'audio, l'outro et le rapport QA.
**Ce script Python n'est PAS encore committé sur GitHub** : ne pas
annoncer le contraire à la reprise du projet.

## Contrôles réels déjà effectués

- `ffprobe` : durée, piste audio AAC, 1080x1920 à 30 fps H.264;
- inspection de 13 vrais photogrammes aux timestamps
  0.2, 1.4, 2.75, 3.9, 5.5, 7.4, 9.3, 11.4, 12.7, 14.0,
  14.13, 15.75, 16.9 secondes;
- photo réelle du fond acier clair inspectée à 16.8s;
- intégration sans remplissage de huit secondes après la voix;
- mesure d'intensité sonore via filtre FFmpeg loudnorm (−16,64 LUFS).

## Véritable état de validation

**MP4 complet obtenu** : oui.
**Nouvelle version du film visible sur téléphone** : via l'attachement
MP4 de la conversation.
**Vidéo publiée sur GitHub/GitHack** : non.
**Images de l'accident autorisées/licenciées** : non.
**Droits commerciaux de la voix Edge établis** : non.
**Qualité artistique approuvée par l'utilisateur** : en attente.
**Publication TikTok automatique** : interdite.

Pour la prochaine amélioration : reprendre l'archive source du chat,
importer le script sur une branche, puis consolider les rendus et tests
dans GitHub Actions ; acquérir les droits des vraies images de l'accident
ou poursuivre les animations honnêtement signalées, sans faux plans
documentaires.

Sources factuelles :
- https://apnews.com/article/757bed7a70ceb72f0d7140143fe2a764
- https://www.wwno.org/local-regional-news/2026-11-13/tanker-strikes-paddlewheel-cruise-ship-in-new-orleans-32-injured-no-passengers-missing

Le modèle Vivienne C5.2 et la signature claire restent verrouillés
dans `nextgen/approved_voice_profile.json`.
