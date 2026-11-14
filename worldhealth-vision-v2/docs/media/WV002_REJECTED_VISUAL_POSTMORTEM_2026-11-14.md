# World-Vision — reportage 002 REJETÉ par contrôle artistique

**14 novembre 2026 — statut : REJECTED_ARTISTICALLY_DO_NOT_PUBLISH.**

Cette décision corrige la présentation précédente de ce MP4 comme un « reportage complet » à évaluer. Le fichier est bien lisible techniquement par FFmpeg et a bien été exporté, mais il est **artistiquement rejeté** par le propriétaire. Les liens temporaires peuvent échouer sur iPhone ; ils ne constituent pas une livraison pérenne.

## Audit du RENDU RÉEL

Source effectivement examinée : `render_worldvision.py` depuis l'archive fournie dans la conversation et `VIDEO_002_REAL_FRAMES_QA.jpg` extraite du MP4. Ces sources sont des fichiers de conversation ; elles ne sont pas prétendues être déjà dans le dépôt.

| Défaut | Preuve précise | Conséquence |
|---|---|---|
| En-tête interdit | Fonction `topbar()` appelée dans quatre scènes | « WORLD—VISION », « ACTUALITÉ », date et filets parasites qui occupent l'écran |
| Pied de page interdit | Fonction `footer()` appelée dans quatre scènes | Mention répétée « ILLUSTRATION GRAPHIQUE — NON IMAGES DE L'ACCIDENT » dans une taille trop petite |
| Faux choc amateur | `make_tanker()` et `make_heritage()` dessinent la coque par polygones/rectangles et une roue à aubes par traits | La simulation cartoon ne ressemble pas aux images authentiques disponibles |
| Faux « native Full HD » | `W,H=720,1280`, encodage intermédiaire `story_silent_720.mp4`, puis `scale=1080:1920` | Export 1080p, mais images fabriquées à 720p et agrandies |
| Surcharge de composition | Deux niveaux de titrages, pastilles, encadrés au bas, chiffres et éléments de décoration | Résultat d'infographie scolaire surchargée, pas d'un documentaire |
| Contrôle qualité insuffisant | FFprobe + planche de 13 images + mesure de loudness seuls | Tests techniques « verts » alors que l'ensemble est visuellement médiocre |
| Livraison fragile | Pièce jointe sandbox non persistante sur tous les clients | « Impossible de lire la vidéo » sur iPhone |

**Aucun nouveau rendu de collision vectorielle ne doit remplacer ce film.** L'ancienne vidéo et sa voix originale C5.2 sont conservées comme éléments historiques, mais le MP4 rejeté ne doit pas être promu comme master ou être annoncé comme prêt à poster.

## Matériaux filmés réels IDENTIFIÉS, sans supposer leur licence

1. [WDSU — vrai choc filmé par Barry Kern / Kern Studios](https://www.wdsu.com/article/new-orleans-cruise-ship-struck-tanker-river-video/74426522). Le titulaire des droits et les conditions de cession doivent être confirmés.
2. [WDSU — conséquences réelles](https://www.wdsu.com/article/new-video-chaotic-aftermath-cruise-ship-tanker-collision/74428633).
3. [WDSU / Hearst — formulaire officiel de demande de licence](https://www.wdsu.com/article/how-to-license-footage-from-wdsu-and-hearst-television/64353314). La chaîne déclare proposer sous licence des images d'actualité issues de ses archives. **L'affichage public n'est pas une autorisation TikTok.**
4. [Reuters Connect — photographie réelle signée Christiana Botic](https://www.reutersconnect.com/item/freighter-collides-with-cruise-ship-in-new-orleans/dGFnOnJldXRlcnMuY29tLDIwMjY6bmV3c21sX1JDMkFOT0E0R1g0Rg) : accès/licence de photographie distincts.
5. [Associated Press — faits de l'accident](https://apnews.com/article/757bed7a70ceb72f0d7140143fe2a764).

**AUCUNE licence n'a été obtenue dans cette conversation et aucun contenu WDSU/Reuters n'a été reproduit.**

## Nouvelle direction graphique — non négociable

- Vrai reportage court, **footage first** : le film commence par la séquence authentique de la collision seulement si son utilisation est autorisée. Ne jamais masquer l'absence de droits par une collision dessinée amateur.
- Garder la version approuvée de **Vivienne C5.2 Impact média** et la vraie signature G0 **fond acier clair**. Ne pas réinventer de logo.
- Supprimer les en-têtes, pieds de page et sous-titres décoratifs incrustés. Si une mention juridiquement nécessaire existe, la réaliser discrète, lisible et contextuelle, pas répétée sur chaque plan.
- Une seule ligne d'accroche réellement utile à l'écran, avec une hiérarchie de typographie premium et du contraste. Les faits doivent apparaître lorsqu'ils sont prononcés.
- Pas de dessins de bateaux ni de faux vidéos « sur place ». Les animations Remotion sont réservées à des graphiques utiles : trajectoire cartographique **exacte et vérifiée**, chiffre 32 justifié, transitions discrètes de sujets réels.
- Production interne nativement 1080 × 1920 minimum. Interdire le passage 720→1080 comme preuve de rendu natif.
- Contrôle humain du MP4 complet sur iPhone, pas uniquement une planche contact et des chiffres FFprobe.
- **Livraison pérenne** sur un vrai chemin GitHub/GitHack ou autre hébergement vérifié, pas seulement un lien de fichier de chat susceptible d'expirer.
- Les permissions sont à obtenir **avant** le montage final. Ne pas publier, diffuser ou réhéberger la vidéo de Barry Kern sans le droit requis.

## Stratégie de production rapide SANS précipitation

Recherche de sources, droits et storyboard peuvent avancer en parallèle. Aucun export long avant : (1) vrais médias vérifiés et autorisés, (2) voix C5.2 déjà choisie, (3) plan pilote de quelques secondes qui passe une **revue artistique humaine**, (4) gabarit d'habillage propre. Le moteur traite la répétition technique ; il ne remplace pas le jugement esthétique.

## Ce qui n'a pas été fait

- Pas de nouvelle vidéo authentique produite à partir de la collision dans ce correctif.
- Pas de licence accordée par WDSU/Kern/Reuters.
- Pas de nouvelle version TikTok déclarée approuvée.
