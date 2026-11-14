# World-Vision / Soudan du Sud — livraison candidate V3 et audit contradictoire

## Rendu V3 réellement vérifié — 14 novembre 2026
- Run GitHub Actions : https://github.com/OBIANG5/World-Health-Vision/actions/runs/43597340303 — **completed/success**.
- MP4 présent : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/south-sudan-editorial-v3/world-vision-soudan-du-sud-v3-vivienne-review.mp4
- Visionnage mobile : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/south-sudan-editorial-v3/index.html
- Contact-sheet 9 photogrammes : https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-lab/south-sudan-editorial-v3/review/contact-sheet.jpg
- Durée mesurée : **22,367 secondes** ; 1080×1920 ; 30 fps ; H.264/AAC ; 3 621 459 octets.
- Empreinte vidéo SHA-256 : `97c4a8b94ea955a40dccd4c4b042412c01c3ac53d74ca01b1112e6aacc44a11d`.
- Script original gelé SHA-256 : `a5104cedab538771d1c649da242c7b32b4f438514a4230d3e5bb31628139afb9`, **six phrases identiques au contrat**.
- Voix : `fr-FR-VivienneMultilingualNeural` (choix utilisateur), vitesse de génération +4 %, atempo final **1.0** (aucune accélération supplémentaire), durée de narration mesurée 22,338 secondes.
- Le traitement anti-blancs rejette les silences >680 ms ; le master a passé ce contrôle. La pause rhétorique de 485 ms détectée dans un essai précédent reste acceptable ; **la fluidité doit être évaluée à l'écoute sur le téléphone**.
- Le premier plan (0–3s) reprend exactement le globe géographique V2 à partir de la vidéo épinglée par SHA. Pas de voix du slogan World-Vision en outro.
- Le pipeline a sauvegardé l'archive photo 2011 à 2160×1440, l'identité G0 intacte, les métadonnées de sources, la planche de neuf images et le viewer GitHack.

## Audit artistique des neuf photogrammes — franc et reproductible
**Progrès observables** :
- Suppression de la carte beige au grand « 11 » orange de la V2.
- Polices changées intégralement : Newsreader pour le titre et DM Sans pour le descriptif. Grille plus cohérente, plus de grande plaque blanche autour du logo.
- Le 22 décembre 2026 et le 11 février 2027 sont deux plans documentaires distincts, avec un ordre causal.
- De vraies photos liées au pays et à l'indépendance, dont une nouvelle vue de Juba plus définie.
- Aucun watermark technique / numéro de plan incrusté.
- Script original réellement prononcé et synchronisé à une piste voix continue.

**Réserves encore visibles : aucune autosatisfaction ni note fictive** :
1. La même photo de drapeau de Juba sert à plus d'un plan (indépendance, nouvelle date, conclusion), ce qui nuit à la variété des rushes. Dans les prochaines versions, privilégier deux médias réels additionnels, du motion design documentaire ou une illustration conceptuelle clairement identifiée.
2. La scène « L'ONU alerte » utilise une archive de 2011 non tournée lors de la prise de parole de l'ONU en novembre 2026. Elle est utilisée comme contexte, **pas preuve de l'alerte** ; un vrai document/source ONU ou photo UNMISS autorisée serait plus pertinent.
3. Les polices et compositions ne deviennent pas « professionnelles » parce qu'elles ont changé de nom. Tester sur iPhone, comparer à une référence internationale légitime et recueillir l'évaluation du propriétaire ; aucun score inventé.
4. La nouvelle affiche illustrée avec une urne est **créée et disponible dans Canva** (`MAHa5OsUdj4`), mais **elle n'a PAS encore été insérée dans ce MP4 automatisé**. Ne pas prétendre l'avoir fait.
5. La piste Vivienne a passé les contrôles de présence et de silences ; elle n'est **pas approuvée artistiquement par le propriétaire**, ni licenciée commercialement via le chemin de synthèse actuellement utilisé.

## Suite à apprendre par le système
Ces réserves ne sont pas des petits détails à oublier. Les écrire dans les contrats `EDITORIAL_VIDEO_QUALITY_GATES.md` et `VOICE_REFERENCE.md` si le propriétaire confirme et réutiliser pour Guinée (09), Kenya (08), Guinée équatoriale (06). La vidéo actuelle est **candidate de relecture uniquement** : publication TikTok/WhatsApp strictement interdite sans accord explicite et licence voix vérifiée.

Conservation des versions V1/V2 sur la branche de prévisualisation, de la V3 sur cette PR, des fichiers source et du manifeste.
