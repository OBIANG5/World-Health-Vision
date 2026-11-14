# World-Vision — état actuel, blocages et prochaine action

## 14 NOV. 2026 — S01 V2 MANROPE / CLEAN PLATE CONFIRMÉE

Suite à la demande de supprimer définitivement les mentions de production et d'améliorer la typographie, un deuxième contrôle a identifié un mauvais sous-titrage **serif** dans le clip S01 d'origine (sous-titres provisoires dessinés par la composition et non alignés à une vraie voix). Décision : les segments autonomes sont **sans sous-titres brûlés dans les pixels** ; le calage des sous-titres n'a lieu que lors du montage avec la voix française approuvée.

**Livrable réel :** S01 V2 MP4 4,5 secondes 1080×1920 30fps, portraits d'archives et G0 intacts, typographie Manrope Variable (Google Fonts commit immuable 29b4ec6df2522a8aee279414b78a07910b065874, SHA-256 3ae11c49db0455a3cc33e37d380f20fdb8c7f8b41dc07625c177e3d87a9d6ae6). MP4 SHA256 **3a73172cd565f1b8d075166a6ae8f50572af77dceb97e91999c7d53a63456979**, 1 774 610 octets.

- **Regarder sur téléphone** : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/summit-2026/hook-v2-clean-manrope-4p5s.mp4
- **Trois photogrammes de contrôle** : https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-lab/summit-2026/review-s01-v2/contact-sheet.jpg
- **Exécution GitHub** : https://github.com/OBIANG5/World-Health-Vision/actions/runs/43587829876 (success).
- Le hook initial V1 reste archivé, non retenu pour le master.
- `WorldVisionSummit2026.tsx` charge la Manrope authentique ; `render-summit-preview.mjs` vérifie son empreinte ; `summit-2026-contract.test.mjs` interdit le sous-titrage sans voix approuvée et le watermark de production.
- `SEGMENT_LEDGER.json` mis à jour avec empreinte, URL, statut et V1 historique.

**État :** S01 V2, S03 V3 (rotation Shenzhen, clean plate) et S04 V3 (New START, clean plate) sont techniquement vérifiées. Les clips ne sont PAS approuvés artistiquement pour publication. S02 D00-v6 reste source originale distincte, S03B images authentiques de la ville manque, S05–S08 à produire ; narration, synchronisation et master 43s absents. Ne pas renommer un artefact dans le master sans hash ni QA.

---


### 14 NOV. 2026 — S03 V3 GÉOGRAPHIQUE PROPRE AUSSI VÉRIFIÉE

État précédent S03 V2 : vrai globe NASA juillet, mais police système DejaVu et footer « NASA BLUE MARBLE / NATURAL EARTH » **incrusté** malgré caractère technique. La source a été modifiée **sans modifier les coordonnées, la texture NASA ni les frontières Natural Earth** ; les informations techniques ont été déplacées dans le manifeste JSON.
- S03 V3 Manrope, 147 frames / 4,9 s / 1080×1920 H264 / 30fps, **sans son**, SHA-256 `59028e59f40585ed30419a56b083386e492d5cd37920f022f5e3b5301f9423fe`, 3 633 979 octets.
- [V3 regarder sur iPhone](https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/summit-2026/segment03-shenzhen-july-v3-clean-4p9s.mp4) ; [quatre images de contrôle](https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-lab/summit-2026/review-s03-july-v3/contact-sheet.jpg).
- [GitHub Actions #43587396877 SUCCESS](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43587396877). Texture/geojson SHA de V2 inchangés ; logo G0 exact et centre géographique Shenzhen 22.5431N 114.0579E.
- Le code de montage master `WorldVisionSummit2026.tsx` et `render-summit-preview.mjs` exige désormais **S03 V3 sha 59028e59... et S04 V3 sha 4fa8aebe...**, avec impossibilité de substituer les anciennes V2. Les sources originales restent archivée. Garder S02 D00 original.
- Contrôle contractuel ajouté au test `summit-2026-contract.test.mjs`; profil et le graphisme documentaire du reportage restent provisoires jusqu'à validation artistique.
- Aucun master 43s, aucune voix française ni vraie vue de Shenzhen S03B. Ne pas prétendre le contraire.

---


## 14 NOV. 2026 — CORRECTION ÉDITORIALE PRIORITAIRE : AUCUN TEXTE DE PRODUCTION À L'ÉCRAN

**Retour utilisateur explicite :** rejet de la police DejaVu et des phrases incrustées « PRÉVISUALISATION · SANS VOIX », « ARCHIVES & MOTION DESIGN », des numéros internes et des dates de fabrication. NE JAMAIS répéter ce défaut. Chaque MP4 doit être **un clean plate** directement utilisable, aucune promesse d'effacement ultérieur au master.

**Correction S04 V3 VÉRIFIÉE** : Manrope Variable OFL 1.1 depuis commit immuable google/fonts 29b4ec6df2522a8aee279414b78a07910b065874, SHA-256 `3ae11c49db0455a3cc33e37d380f20fdb8c7f8b41dc07625c177e3d87a9d6ae6`. Aucun repli sur DejaVu.
- MP4 final de *séquence* (pas master 43s) : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/summit-2026/segment04-new-start-v3-clean-7p9s.mp4
- Contact sheet : https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-lab/summit-2026/review-s04-v3/contact-sheet.jpg
- GitHub Actions **SUCCESS** https://github.com/OBIANG5/World-Health-Vision/actions/runs/43587064217
- SHA-256 vidéo `4fa8aebec451f4edb0d8bd495655b619feaab0d9fb0d517c12e4bd9f88b33e69`; 1 097 118 octets; 7,9 s, 237 images, 30 i/s, H264, 1080×1920, sans piste audio; QA de six photogrammes distincts. Vérifié visuellement sur les captures.
- Les seuls textes visibles sont **éditoriaux** : réduction des arsenaux, NEW START, date d'expiration, logo original et « Archives · Prague · 8 avril 2010 » pour signaler la vraie image historique. AUCUN status de prévisualisation, crédit de pipeline ou chronomètre technique. Crédit Chuck Kennedy / Maison-Blanche déplacé vers manifeste/légende.
- V1 et V2 archives conservées dans GitHub mais explicitement **interdites dans le master**. `SEGMENT_LEDGER.json` garde les trois états et l'empreinte V3.

**Blocage technique contre oubli** : `WorldVisionSummit2026.tsx` lit désormais le fichier `segment04-new-start-v3-clean-7p9s.mp4`, plus son dessin ancien. `render-summit-preview.mjs` impose l'existence et le SHA-256 EXACT de cette V3 avant tout master. Le composant `Credit` ne dessine plus de texte technique ; l'option d'affichage de watermark a été supprimée. Tests de contrat renforcés ; la CI bloque les textes de production incrustés via `scripts/guard_on_screen_copy.py`.
Règle inscrite : `docs/media/EDITORIAL_ON_SCREEN_RULES.md`.

**Audit des autres séquences** : S03 avait également une police DejaVu et une mention technique « NASA BLUE MARBLE / NATURAL EARTH » incrustée. Le script S03 et son workflow ont été corrigés vers une **V3 Manrope propre** conservant la même géographie ; rendu de cette S03 V3 lancé, à vérifier puis à raccorder au master seulement après QC. S01/S02 ne doivent recevoir aucune phrase interne.

**État d'approbation** : S04 V3 QA techniquement passée, **validation artistique humaine non encore obtenue**. S03B Shenzhen absent ; voix définitive absente ; master 43 s non disponible, publication non autorisée.

---

### 14 NOV. 2026 — REFINEMENT S04 V2 / TRÈS IMPORTANT

Une inspection visuelle des **vrais** photogrammes GitHub S04 V1 a révélé une **grille de fond exagérément lumineuse** en raison d'une mauvaise composition alpha PIL (RGBA direct). Le script a été corrigé pour composer la grille sur RGB avec transparence, puis revenir à RGBA; **V1 n'a pas été supprimée**.

**V2 sélectionnée comme candidate technique :** GitHub Actions [#43586235979](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43586235979) SUCCESS ; 7,9 secondes / 237 frames / 1080×1920 / H.264 / silence ; MP4 SHA-256 `5ae78d45850aa9eeb51c30f3f83e99a93cac244f327233fd04257c01906e97a1`, 1 109 346 octets.
- [V2 vidéo mobile](https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/summit-2026/segment04-new-start-v2-7p9s.mp4)
- [V2 planche de contrôle](https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-lab/summit-2026/review-s04-v2/contact-sheet.jpg)
- [V1 originale archivée](https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/summit-2026/segment04-new-start-7p9s.mp4)
- [Journal JSON source et empreintes](https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-lab/summit-2026/segment04-new-start-v2-7p9s.json)
- Statut : **TECHNICAL V2 READY / HUMAN ART REVIEW REQUIRED**, ni voix ni publication. Le `SEGMENT_LEDGER.json` pointe désormais vers V2 tout en conservant V1.
- Source photographique S04 inchangée, White House 2010, et logo G0 inchangé.
- Recherche S03B engagée : choisir une **image réelle vérifiable de Shenzhen** ; ne jamais montrer faux lieu de réunion. Une photo CC0 de 2025 trouvée sur Wikimedia Commons a été écartée artistiquement car peu représentative du skyline ; d'autres options sont encore à comparer.
---

## 14 NOV. 2026 — S04 NEW START PRODUITE ET ARCHIVÉE (QA TECHNIQUE VÉRIFIÉE)

**Suite immédiate du raccord Shenzhen** : production autonome **S04 (12,5–20,4 s, 7,9 s)** sur le traité New START, sans modifier S01/S02/S03 et sans assembler de master fictif.

**Rendu réel vérifié :** vidéo S04 `segment04-new-start-7p9s.mp4`, H.264, 1080×1920, 30 fps, 237 images, 7,9 s, **aucun audio**, SHA-256 `1e25443e40b4b9a867bcbd53f5f7ad4f977cb7577cf6277b348f3bf2e05ec6c9`, 1 150 810 octets. Workflow GitHub Actions [#43585854686](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43585854686) terminé avec job `render` success (vérification des six captures distinctes et de FFprobe).

**Image réelle et vérifiée :** signature de New START à Prague le 8 avril 2010, photographie officielle Chuck Kennedy / Maison-Blanche, domaine public US ; source https://commons.wikimedia.org/wiki/File:Obama_and_Medvedev_sign_New_START.jpg ; SHA-256 du fichier photo `36789c11b8a4777dc432213fcd206b05a09feda7d1f1809f592b4904ccec43a1`. **Pas une image de novembre 2026.** G0 officiel contrôlé avant rendu (Git blob `bc80fa70cebd566768bfb1703a0f1f636a78c196`).

**Fait sourcé :** New START a expiré le 5 février 2026 selon le ministère français des Affaires étrangères https://www.diplomatie.gouv.fr/en/presse-et-ressources/decouvrir-et-informer/actualites/expiration-du-traite-new-start .

**Liens de reprise et d'affichage iPhone :**
- MP4 : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/summit-2026/segment04-new-start-7p9s.mp4
- Images de contrôle : https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-lab/summit-2026/review-s04/contact-sheet.jpg
- Script : `services/media-renderer/scripts/worldvision_segment04_new_start.py`
- Workflow : `.github/workflows/whv-summit-s04-new-start.yml`
- Conducteur : `docs/media/episodes/2026-11-14_trump_xi_putin_shenzhen/S04_DIRECTION_ARTISTIQUE_QA.md`
- Registre `SEGMENT_LEDGER.json` mis à jour.

**État fidèle :** S04 est TECHNIQUEMENT produite, pas encore approuvée visuellement par l'utilisateur, pas de voix ni musique. S03B **authentiques images Shenzhen** manquante. S05–S08 restent à produire. Contradiction existante : `WorldVisionSummit2026.tsx` doit encore intégrer la nouvelle EDL S02 (0,9s) → S03 (4,4s) → S03B (2,7s), sinon le master sera incohérent. Pas de master 43s et pas d'autorisation de publication.

**Suite recommandée :** vérifier la qualité réelle du clip S04 sur téléphone, puis fournir S03B avec des images authentiques de Shenzhen licenciées, avant de produire S05. En parallèle rechercher une voix française naturelle approuvable puis aligner les 13 sous-titres, sans changer le script validé.

---

## PRIORITÉ ACTUELLE — S03 SHENZHEN V2 VÉRIFIÉ, ENCHAÎNEMENT À 43 S (14/11/2026)

**Commande utilisateur actuelle :** montage d'actualité premium **une vidéo courte à la fois**, et **chaque séquence autonome contrôlée avant assemblage**. Séquence dramatique obligatoire : **S01 vrais portraits Trump/Poutine/Xi → S02 image World-Vision D00-v6 ORIGINALE → S03 le globe tourne réellement depuis l'Afrique vers Shenzhen → S03b vrai visuel de la ville → reste du reportage sur le nucléaire/Iran/Ukraine → signature World-Vision**. Débit normal, 30 images/s, environ **43 secondes** AU TOTAL (surtout pas 3–4 minutes) ; pas de fausse conférence ou faux bâtiments.

**Faits revérifiés le 14 novembre 2026 :** la Maison-Blanche annonce la rencontre trilatérale le **jeudi 19 novembre 2026** en marge de l'APEC, et la diplomatie chinoise confirme l'APEC à **Shenzhen** les 18–19 novembre. **La salle/l'adresse précise de la rencontre ne sont PAS confirmées**. L'animation vise donc **le centre géographique de la ville (22.5431°N, 114.0579°E)**, pas un bâtiment inventé. Sources : https://www.fmprc.gov.cn/eng/xw/wsrc/202611/t20261113_12058556.html ; https://www.afp.com/en/trump-xi-putin-hold-historic-meeting-china-white-house-0.

**VRAIS LIVRABLES vérifiés, pas des promesses :**
1. **S01 HOOK** 4,5 s H264 1080×1920 : vrais portraits photographiques, logo G0 officiel, MP4 sur branche \`whv-media-studio-browser-preview/media-lab/summit-2026/hook-4p5s-preview.mp4\`. Sans narration, non approuvé définitivement.
2. **S02 D00-v6** 3,1 s H264 1080×1920, SHA-256 \`95c47d1a94a1d0487e5b8f2d4c622bedcf6bad980938947ac003be34a8f8ea2a\` ; VRAIE image originale D00-v6 non reconstruite (SHA-256 \`8d9a9d20f20fbf7757713b6f5eab06590f191166eb779865747f0f59683cfca2\`), mouvement de caméra sans rotation fictive, archivé Canva ID \`VAHa4ZT_ySo\`.
3. **S03 NASA véritable rotation vers Shenzhen V1** janvier 4,9 s, SHA-256 \`6bfb45a57794c7dbfc7dc9af9ddb818c67eae327f60216b46bf32f0afb7ba10e\`, QA passée, mais trop enneigé visuellement.
4. **S03 améliorée JULY V2** 4,9 s, **147 frames/30fps 1080×1920**, SHA-256 **\`1e49e5b6dc36c9dde2494253a8ee5c2b426863bed7fd33cd0cd24b4012be4558\`**, NASA July topo 5400×2700 SHA \`85a24885616097b5e06532b7d8e30fa5d749a782e70ea55971dd8539a0899206\`, Natural Earth GeoJSON SHA \`392a03db8aa3ba82c105852655620129b11182b95dfc34ef046827ea7d0e5b8c\`. **Run GitHub Actions #43582938864 = SUCCESS**. Quatre images de contrôle vraiment inspectées ; V2 donne une Eurasie plus verte et cohérente avec D00. **Canva archive média S03 V2 ID \`VAHa4gCj5SQ\`**, import vérifié. **ATTENTE validation artistique utilisateur**, aucun son encore, non publié.
5. Le **fichier exact du logo officiel G0** dans renderer Git blob \`bc80fa70cebd566768bfb1703a0f1f636a78c196\` est contrôlé et utilisé (jamais redessiné).

**LIENS :**
- Vidéo S03 V2 : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/summit-2026/segment03-shenzhen-july-v2-4p9s.mp4
- Contact sheet 4 photogrammes S03 V2 : https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-lab/summit-2026/review-s03-july-v2/contact-sheet.jpg
- Ancienne vidéo S03 V1 gardée sur branche preview pour comparaison ; ne pas effacer.
- Code source S03 : \`worldhealth-vision-v2/services/media-renderer/scripts/worldvision_segment03_shenzhen.py\`.
- Workflow de build/QA mobile : \`.github/workflows/whv-summit-shenzhen-s03.yml\`.
- Journal d'état 8 clips : \`docs/media/episodes/2026-11-14_trump_xi_putin_shenzhen/SEGMENT_LEDGER.json\` (v2 retenue comme candidate).
- **NOUVELLE EDL** \`docs/media/episodes/2026-11-14_trump_xi_putin_shenzhen/EDL_V2_FAST_GLOBE.md\` : S01 4,5s, **extrait S02 0,9s à 1×**, **extrait S03 4,4s à 1×**, futur vrai plan de Shenzhen 2,7s ; suite 12,5s–43s inchangée. **La source n'est pas accélérée, seulement recadrée temporellement.**
- Remotion master existant \`services/media-renderer/src/WorldVisionSummit2026.tsx\` et script \`render-summit-preview.mjs\` ont été raccordés aux **vraies vidéos S02 + S03 V2** avec empreintes SHA exigées ; pas de substitution de globe. La composition finale à ~43 s reste NON RENDUE, car fichiers source n'ont pas encore été installés en binaire dans le repo/renderer et **voix FR approuvée absente**.

**Prochain travail utile :** recueillir avis artistique sur S03 V2 et sur cohérence S02→S03 ; sélectionner vrai plan de Shenzhen 2,7s aux droits confirmés ; **produire le prochain clip autonome S04** (enjeux nucléaires) en motion design soigné ; préparer audition de voix française (2–3 voix) puis calage syllabique des 13 sous-titres ; exporter 43s seulement APRÈS ces validations. Ne pas coder un nouvel éditeur, ne pas réinventer une Terre, ne pas produire un clip sur une autre actualité sans accord.

**Ce qui manque honnêtement :** V2 non encore approuvée artistiquement par l'utilisateur, pas de voix/audio à écouter, pas de vidéo finale 43 s. L'original D00 existe en fichier chat et Canva ; son binaire original n'est pas committé dans GitHub. Les deux clips S02/S03 sont stockés dans Canva mais leur insertion en tant que fichiers locaux dans le renderer final devra être réalisée avant le master.

---


## 14 NOV 2026 — NOUVELLE MÉTHODE VALIDÉE : UN CLIP À LA FOIS, PUIS ASSEMBLAGE

**Instruction utilisateur prioritaire :** arrêter de vouloir tout rendre d'un seul bloc. Construire **huit petites vidéos indépendantes**, chacune très bien montée/contrôlée/revue, avec code ponctuel lorsque plus beau (sans réinventer le globe). **Assembler seulement les séquences validées.** La ligne éditoriale reste la vidéo approuvée dans le chat sur le sommet annoncé Trump–Poutine–Xi du 19 novembre 2026.

**Livrables concrets vérifiés cette session :**
- **S02 identité D00-v6 : film MP4 de 3,1 secondes, H.264 1080×1920, 30fps, 93 images, animé et non statique.** Image originale exactement conservée en entrée (SHA-256 `8d9a9d20f20fbf7757713b6f5eab06590f191166eb779865747f0f59683cfca2`). Mouvement caméra discret + respiration cyan, sans reconstruire la planète ni prétendre une rotation réelle. **MP4 SHA-256 `95c47d1a94a1d0487e5b8f2d4c622bedcf6bad980938947ac003be34a8f8ea2a` ; 2 688 754 octets**, vérifié par FFprobe et lecture 93 frames. Résultat visuel contrôlé sur contact-sheet 3 images.
- Code générateur autonome committé : `worldhealth-vision-v2/services/media-renderer/scripts/worldvision_segment02_globe.py` (exige SHA exact D00 original, produit vidéo MP4 + manifeste). **N'a pas besoin d'un nouvel éditeur** ; FFmpeg/OpenCV/Pillow.
- **Clip S02 archivé dans Canva utilisateur connecté** (véritable vidéo, media ID `VAHa4ZT_ySo`, nom `World-Vision — S02 D00-v6 globe cinématique original — 3,1 s`). L'image source D00 original est également dans Canva sous `MAHa4F1Owfk` et le logo officiel G0 sous `MAHa4H6Rel4`.
- Traçabilité de chaque plan : `docs/media/episodes/2026-11-14_trump_xi_putin_shenzhen/SEGMENT_LEDGER.json`, S01 hook 4,5 s déjà vérifié sur branche preview, S02 3,1 s créé localement+Canva, S03–S08 restent à produire, montage cible total **43 s**, les timecodes sont PROVISOIRES jusqu'à voix FR approuvée.

**Liens locaux pour ce chat** (peuvent ne pas survivre aux nouveaux chats ; Canva est l'archive persistante) :
- `sandbox:/mnt/data/WorldVision_S02_Globe_D00_3s.mp4`
- `sandbox:/mnt/data/WorldVision_S02_contact_sheet.jpg`
- `sandbox:/mnt/data/worldvision_segment02_globe.py`

**Qualité et limites :** le film est un plan original avec faible zoom, **PAS** une rotation géographique de la Terre, ni une simulation de trajet vers Shenzhen. Aucun son/voix dans le clip ; on synchronisera à la voix quand les huit vidéos seront faites. Le logo officiel se trouve déjà dans la composition générale et doit rester inchangé. S02 est **soumis à revue artistique utilisateur**, pas « approuvé pour publication ». **Le montage intégral et sa narration n'existent pas encore.**

**PROCHAIN CLIP S03 (7,6–12,5 s, 4,9 s)** : construire **une vraie localisation de Shenzhen en Chine avec une carte exacte** et typographie/motion design bleu nuit/cyan compatible World-Vision. Ne pas reprendre la vieille carte plate, les logos emoji ni une vidéo de ville non autorisée. Fournir un MP4 de 4,9 s, ses images de contrôle, le code GitHub et son état d'approbation. Ne pas démarrer autre chose avant de récolter une appréciation du clip S02, sauf si utilisateur demande explicitement de poursuivre.

---


## 14 NOVEMBRE 2026 — SOMMET TRUMP XI POUTINE : PREMIER HOOK EN VRAI MP4 ET MONTAGE 43 S CODÉ

**Instruction actuelle du propriétaire** : construire **un montage professionnel** basé sur le script accepté, pas seulement du texte ni un nouvel éditeur. Le style de marque doit reprendre le **PNG logo G0 officiel** exact et le visuel **D00-v6 original** pour une brève introduction. Le sommet du 19 novembre à Shenzhen **n'a pas encore eu lieu** ; utiliser des archives explicitement étiquetées, aucune fausse scène de sommet.

**Vrai code et premier artefact produit :**
- Composition Remotion professionnelle séparée `services/media-renderer/src/WorldVisionSummit2026.tsx` (8 plans, 43 secondes, 13 segments de sous-titres reprenant mot à mot le script, photos d'archives, typographie bleu nuit/cyan, zones sûres, logo exact ; **aucune couleur rose/orange de l'ancien template**).
- Entrée ajoutée à `services/media-renderer/src/Root.tsx` sans écraser l'ancien moteur.
- `services/media-renderer/render-summit-preview.mjs` (vidéo 1080×1920 à 30fps, vérification du Git blob du logo `bc80fa70cebd566768bfb1703a0f1f636a78c196`, SHA-256 D00 attendu `8d9a9d20f20fbf7757713b6f5eab06590f191166eb779865747f0f59683cfca2`, master complet bloqué si assets D00 originaux et voix WAV approuvée manquent).
- `.github/workflows/whv-summit-hook-preview.yml` (téléchargement des vrais portraits à licences vérifiées, build Remotion, 3 captures FFmpeg, publication même branche d'aperçu). **Hook corrigé et livré** via `media-lab/summit-2026/hook-4p5s-preview.mp4` sur `whv-media-studio-browser-preview`, MP4 de **4,5 s 1080×1920, sans voix**, SHA-256 `8e0975eb2fe66cb502271d23c542b120271f9b9d3df989306dd2840a1e1bf05a` au premier contrôle après correction des collisions. Capture `media-lab/summit-2026/review/contact-sheet.jpg`.
- Test de conservation **mot à mot du script** dans `summit-2026-contract.test.mjs`, comparé avec `docs/media/episodes/2026-11-14_trump_xi_putin_shenzhen/SCRIPT_V1.md` ; 13 segments, aucune coupure du texte, 43 secondes. Contrôle unitaire également ajouté au workflow ; les dernières exécutions doivent être vérifiées avant d'affirmer vert.
- SRT préparatoire `SOUS_TITRES_BROUILLON_43S.srt` sur le dossier d'épisode, **non encore aligné à une vraie voix**, 13 sous-titres.
- Import **sans redessin** dans Canva connecté : original globe D00-v6 Canva media `MAHa4F1Owfk`, logo officiel exact téléchargé depuis Github Canva media `MAHa4H6Rel4`. Importation GDrive depuis l'ancien file-ref non aboutie : ne pas prétendre D00 dans Drive ou en binaire dans Github.

**Preuves et limites** :
- Premier hook animé a été généré par l'action [#43579184494](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43579184494), statut **success** : trois images vérifiées avec logo officiel exact et portraits de Trump, Poutine et Xi ; collision texte/labels corrigée et rerendu par l'action [#43579354004](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43579354004) success.
- Le **master 43 s n'existe PAS** à ce stade : le rendu est volontairement bloqué tant que l'image D00 originale n'a pas été **copiée en tant que binaire exact dans l'asset du renderer**, et la vraie voix française choisie/validée n'est pas fournie.
- Photos Reuters/AP sous licence **non utilisées** dans le hook ; photos d'archives d'origine White House / Kremlin téléchargées par Github Action, attributions dans `MONTAGE_PLAN_V1.md`.
- L'audition/choix de voix française et l'alignement réel des sous-titres restent à faire. Aucun MP4 n'est approuvé pour publication.

**LIENS** :
- Vidéo hook https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/summit-2026/hook-4p5s-preview.mp4
- Dossier storyboard https://github.com/OBIANG5/World-Health-Vision/blob/feature/world-vision-media-studio/worldhealth-vision-v2/docs/media/episodes/2026-11-14_trump_xi_putin_shenzhen/MONTAGE_PLAN_V1.md

**Suite obligatoire (pas une autre refonte)** : revue qualitative du hook et correction ; intégrer le PNG D00-v6 ORIGINAL **une seule fois** au renderer, générer/tester une vraie voix française via outil Google accessible puis produire tout le master Remotion de 43 s, aligner SRT sur WAV, QA iPhone et rendre à l'utilisateur. **Ne jamais remplacer l'image par une reconstruction du globe.**

---

## ÉPISODE ACTIF — TRUMP / XI / POUTINE, SHENZHEN (14 NOVEMBRE 2026)

**Choix éditorial explicite du propriétaire :** préparation d'une vidéo de 30–45 s sur le sommet trilatéral Trump–Xi–Poutine **annoncé** pour le 19 novembre 2026 à Shenzhen ; ne pas traiter la réunion comme déjà tenue. Reuters/AP/AFP (13–14 nov.) consultés et recoupés : objectif de désarmement nucléaire, Iran à l'agenda attendu, Ukraine non prévue selon Washington ; aucune entente nucléaire anticipée. **Script proposé V1 de 97 mots, EN ATTENTE DE VALIDATION**, pas de voix ni de MP4.

**Fichier unique à reprendre et à modifier sans effacer les versions antérieures** : [SCRIPT_V1.md](../media/episodes/2026-11-14_trump_xi_putin_shenzhen/SCRIPT_V1.md). Il contient narration exacte, liens de sources, qualifications et contraintes sur les visuels. **Après accord utilisateur seulement** : storyboard minuté, sourcing photos/vidéos sous droits, identité G0/D00 conservée, audition voix FR puis montage Remotion/FFmpeg existant et QA mobile.

**Ne pas dériver vers** le pilote mangroves rejeté, la création d'un nouveau globe, n8n ou une autre actualité imposée. Le radar horaire ChatGPT existe indépendamment.

---


## NOUVEAU POINT DE REPRISE — MONTAGE UNIQUEMENT APRÈS SCRIPT APPROUVÉ

**Décision actuelle, prioritaire sur les anciens plans présents dans ce journal :** sélection de l'actualité et script discutés/validés dans ChatGPT ; **le développement World-Vision se concentre désormais sur le montage vidéo à partir de ce script**. Ne plus forcer n8n/Shotstack, ni un autre pilote, ni un globe artisanal, ni l'automatisation intégrale de la rédaction.

**Veille** : la tâche ChatGPT World-Vision existante ID `6a9050fddd5c8191929b1f8cfa8d0f3e` a été **réactivée** et reconfigurée en recherche horaire ; envoie des candidats majeurs seulement quand un changement significatif mérite l'attention. Pas besoin d'un n8n supplémentaire pour ce besoin immédiat.

**Studio vidéo existant** : `services/media-renderer/src/WorldVisionShort.tsx` est le composant Remotion qui sait déjà placer vraie photo/vidéo, narration, scènes, texte et crédit ; worker `server.mjs`. Logo réel présent dans le dossier du renderer ; concept D00-v6 conservé mais intro animée NON approuvée. **Réutiliser** le moteur. Google Vids FR sur ordinateur = voix/timeline si accessible; Flow = courtes animations à partir du concept/image si possible (utilisation manuelle Google AI Pro, API non supposée); FFmpeg/Remotion = master et contrôles. CapCut iPhone = plan de secours.

**Plan de montage étape par étape** dans [MONTAGE_ONLY_HANDOFF_2026-11-13.md](../media/MONTAGE_ONLY_HANDOFF_2026-11-13.md). Le prochain input attendu est le **script utilisateur approuvé** ; fournir de suite storyboard minuté, sélection d'images authentiques avec droits, prompts pour les plans nécessaires et voie de voix française, puis un aperçu vidéo réel et ensuite un MP4 entier. Ne pas prétendre qu'une voix, une intro CGI approuvée ou un MP4 complet existent avant vérification.

---

## PRÉCÉDENCE ABSOLUE — WORLD-VISION AUTOMATISATION CENTRALE (13/11/2026)

**Le dossier NASA mangroves cité dans les anciens paragraphes est explicitement REJETÉ par l'utilisateur.** Sa production est arrêtée. La priorité n'est plus une autre maquette de globe, une vidéo isolée ou une sélection de sujet imposée.

**Objectif central** : un pipeline professionnel de veille d'actualités majeures → sélection parmi 3–5 → vérification → script → voix → assets authentiques → modèle vidéo de marque → QA → approbation → diffusion. Outils existants, pas de nouvelle usine CGI maison.

**Artefacts vérifiables en GitHub** : `automation/n8n/world-vision-radar-v1.n8n.json` (8 nœuds, 4 RSS, tri heuristique, aucune publication), `automation/brand/WORLD_VISION_BRAND_LOCK.json` (logo G0 et référence D00-v6, règles d'intégrité, placement safe-zone, géociblage, voix, titres, SRT, crédits), `automation/WORLD_VISION_AUTOMATION_COCKPIT.md` (architecture, abonnement/API, limites, étapes de connexion). **Aucun workflow activé**, aucune instance n8n disponible, aucun rendu automatique Shotstack exécuté. Le JSON est un artefact importable et doit encore être testé dans un vrai n8n.

**Prochaine vraie opération** : connecter/activer n8n Cloud d'essai **une seule fois** et importer le RADAR ; tester les 4 flux, classer les 3–5 meilleures informations, puis connecter Google Drive et un moteur de rendu à modèle. Le montage ne doit pas sortir sans image identité World-Vision et accord humain. Google AI Pro **n'est pas une clé API** ; Flow reste manuel sans nouvelle intégration approuvée.

---



## PILOTE VIDÉO WORLD-VISION #001 — MANGROVES NASA (13 NOV 2026)

**PROGRÈS SUR LA PRODUCTION COMPLÈTE, PAS DE CGI SUPPLÉMENTAIRE :** choix d'un sujet daté et sourcé (« A Global Rebound for Mangroves », NASA 13/11/2026), vérification NASA/Tulane/NOAA et élaboration d'un **script de narration FR 112 mots** pour ~50 s + storyboard professionnel en six plans + liens vers 2010/2026 NASA haute résolution et photo NOAA d'illustration clairement localisée hors Myanmar. Aucun visuel IA nécessaire, Flow **SKIPPED_WITH_REASON**.

**Dossier à lire pour reprendre** : [PRODUCTION_PACK.md](../media/episodes/2026-11-13_mangroves_nasa/PRODUCTION_PACK.md) et [voix_off_fr_v1.txt](../media/episodes/2026-11-13_mangroves_nasa/voix_off_fr_v1.txt). Faits et dates précis : comparatif local février 2010 et février 2026 ; les gains mondiaux concernent **2010–2023**, pas 2010–2026. Ne pas attribuer au Myanmar toute la statistique mondiale. Une nuance critique : delta du Niger encore en recul.

**Statut honnête** : script/plan DRAFT_READY, sélection sujet NOT_EXPLICITLY_APPROVED, médias SOURCED_NOT_DOWNLOADED, voix et montage NOT_STARTED, **aucun MP4 complet à prétendre terminé**. Source NASA photos à importer via les liens de la fiche puis générer/auditionner vraie voix FR dans **Google Vids (ordinateur)** ; sinon passer à une voie iPhone (CapCut + voix disponible sous conditions) sans ajouter de logiciel de montage à programmer. Montage cible 50 s, six scènes, vrais visuels et sous-titres calés au son final.

**Objectif suivant** : premier **MP4 journalistique complet** ; ne plus perdre le temps sur l'esthétique du globe D00-v6 pour ce pilote. G0/D00 et le prototype Gabon demeurent archivés séparément.


## PROCHAINE ÉTAPE — REPORTAGE COMPLET AVEC CONDUCTEUR MULTI-OUTILS

**L'objectif est maintenant de terminer UN vrai reportage d'actualité (script + voix + médias authentiques + montage 9:16 + MP4) au lieu d'accumuler des expériences de globe.** Procédure : [conducteur multi-outils](../media/WORLD_VISION_PRODUCTION_CONDUCTOR_2026-11-13.md), [fiche d'épisode](../media/WORLD_VISION_EPISODE_TEMPLATE.md).

Le manuel original de 137 pages reste le cadre méthodologique (9 parties) ; nous conservons les 14 étapes du Media Studio. Affectation cible : ChatGPT/Gemini = faits, contre-lecture, scénarios ; Google Flow = **plans d'illustration ciblés** ; **Google Vids, inclus dans Google AI Pro = montage portrait et voix off FR** ; FFmpeg/Remotion = précision géographique, SRT et contrôle automatisé, pas reconstruction systématique de toutes les scènes ; Drive = binaires ; GitHub = scripts, décisions et traçabilité.

**Faits vérifiés** : Google Vids peut exporter MP4 et travailler en 9:16 ; la voix off AI en français est officiellement listée. En revanche, la **génération automatique de captions Google Vids est documentée pour l'anglais** ; gérer l'alignement français autrement. Flow nécessite les actions de l'utilisateur dans son compte : aucun connecteur direct ici. Les API Google/OpenAI ne sont pas financées automatiquement par les abonnements.

**État actuel** : seuls les documents d'orchestration et templates sont créés ; **aucune vidéo complète produite dans le nouveau processus**. Ne pas confondre avec MP4 CGI Gabon 4 s, qui reste une démo technique artistiquement refusée et non publiée. La vraie création commence à la prochaine actualité choisie/sourcée ; fournir immédiatement le script provisoire, les sources et le montage papier, sans obliger l'utilisateur à inventer des réponses.


## PRIORITÉ ACTUELLE — PIVOT QUALITÉ FLOW + GIS (13/11/2026)

**Retour explicite du propriétaire :** la vidéo technique D01 est décevante, la Terre n'est pas centrée comme l'œil, le CGI perd la beauté du concept et le rythme des développements a été trop lent. **Ne pas relancer sans raison de nouveaux rendus WebGL**. Les résultats techniques et le MP4 sont conservés pour la géographie, pas comme identité visuelle approuvée.

**Diagnostic précis après inspection du code source :** WebGL `u_center=H*.48` (origine bas) et frontières Canvas `cy=h*.52` (origine haut) donnent **tous deux 52 % du haut**, mais l'œil SVG centré à y875/1600 n'y était pas complètement aligné. Correctif committé : WebGL `H*.5`, frontières `h*.5`, SVG centre `y800/1600`, test visuel régressif dans Playwright. Commits `9882b5d266af141410d20d4c48fa0dfdd6205386` et `14abd484e465bed7fc663d62c5addf3f266dc219`. **Ce centrage ne suffit pas pour réparer la qualité artistique**. CI du test `14abd484` réussie ; vérifier le manifeste avant d'affirmer que le site mobile montre la correction.

**Pivot proposé et documenté** : [DECISION_HYBRID_GOOGLE_FLOW_D00_2026-11-13.md](../media/DECISION_HYBRID_GOOGLE_FLOW_D00_2026-11-13.md). Commencer avec **la véritable image de référence D00-v6** (SHA-256 `8d9a9d20f20fbf7757713b6f5eab06590f191166eb779865747f0f59683cfca2`) comme **Start frame dans Google Flow**, 1 seul essai 4–6 s, animer légèrement l'atmosphère sans changer les frontières ; obtenir un retour avant de multiplier les générations. Flow peut altérer la géographie, donc le mouvement rigoureux vers un pays reste géré par `geoTargeting.mjs` et une scène GIS de production séparée. **Aucune vidéo Google Flow produite ni accès API Flow acquis.**

L'utilisateur indique disposer de **Google AI Pro** ; les pages officielles présentent **1000 crédits Flow/mois** mais cela ne prouve pas son solde personnel ni une clé API. Les futurs montages, voix, sous-titres et reportages restent dans le plan vidéo de 137 pages. Le clip CGI D01 Gabon n'a **pas** de validation artistique ni d'autorisation de publication.

---



## POINT DE REPRISE LE PLUS RÉCENT — moteur de rotation géographique codé et visible

**Le code a changé, pas l'approbation artistique.** Le 13 novembre 2026, un premier moteur de **rotation vers le pays de l'actualité** a été développé dans `frontend/web-v2/src/media/geoTargeting.mjs` avec les types, le laboratoire React et les tests, basé sur le GeoJSON du produit et le `country_iso3` du dossier. Il est intégré sous la direction artistique des six étapes. Le labo permet de choisir le Gabon/Mali ou d'autres pays, faire tourner le globe en 4 s, ajuster la progression, et revenir au départ. Le rendu est une **simulation technique Canvas/2.5D**, pas la Terre photographique D00-v6 ni une vidéo.

**Preuves officielles de livraison :** [GitHub Actions preview #43461296086](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43461296086) **success**, tests Node/TypeScript/Playwright sur iPhone/desktop, manifeste de preview `source_commit=f0b281889676a20fbefba62fd45cf1fd5c2856ed`, captures réelles `media-globe-motion-lab-iphone.png` et `media-globe-motion-arrival-gabon-iphone.png`. `backend_connected=false` et `channel_published=false` restent vrais.

**Lien utilisable :** https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/index.html?view=media&screen=review&gate=direction → bouton **« Tester le nouveau moteur : la Terre tourne vers un pays »**. Il ne remplace pas les frames originales D00–D05 ni leurs avis.

**Le statut d'approbation reste :** G0 logo bleu approuvé ; MP4 COP31 refusé 1/10 ; A/B/C refusées ; D00-v5 appréciée avec corrections ; D00-v6 image **non encore approuvée**, PNG non commité ; 3D photoréaliste, scène Remotion, voix et montage final non réalisés. Préserver toute la formation originale de 137 pages dans le [plan directeur](../media/AUDIOVISUAL_PRODUCTION_MASTER_PLAN_2026-11-13.md) et l'[audit de géociblage](../media/engineering/GEO_TARGETING_PROTOTYPE_2026-11-13.md).

**Action de développement suivante, sans revenir en arrière :** master artistique D00 reproductible en **vraie 3D 1080×1920** (frontières géographiques exactes, atmosphère cyan, deux arcs et vrai blanc d'œil, textures sous droits vérifiés), test image sur iPhone et avis humain. Le **mouvement géographique existe** désormais en code et doit être réutilisé, puis raccordé à la 3D et testé 3–6 s. Ne pas sauter auditions de voix, alignement, montage des vrais plans et QA. Chaque itération : code GitHub, tests, SHA preview, journal et décision.

---



## POINT ACTIF — D00-v6 après retour positif conditionnel sur v5 (13 novembre 2026)

**NOUVELLE RÉFÉRENCE (priorité sur les anciennes sections v4) :** l'utilisateur a trouvé **très belle** D00-v5 mais demandé vrai blanc de l'œil (#FFFFFF), halo atmosphérique bleu plus lumineux que les deux arcs et frontières nationales (notamment Sahara) plus marquées ; conserver la taille de Terre. Une image **D00-v6 a été créée**, `a_crisp_ultra_detailed_high_contrast_digital_ill.png`, SHA-256 `8d9a9d20f20fbf7757713b6f5eab06590f191166eb779865747f0f59683cfca2`, 1086×1448, **EN ATTENTE DE L'AVIS HUMAIN, PAS ENCORE UNE VIDÉO**. Les bytes du PNG ne sont **pas versés à GitHub**, seul le contrat et son empreinte y figurent. Ne pas prétendre qu'un aperçu du site montre v6 : le build statique n'a pas été relancé dans cette session.

**Plan exhaustif du pipeline à conserver :** [AUDIOVISUAL_PRODUCTION_MASTER_PLAN_2026-11-13.md](../media/AUDIOVISUAL_PRODUCTION_MASTER_PLAN_2026-11-13.md) — neuf parties du PDF de 137 pages, 14 étapes du Media Studio, quatre compétences de montage, sélection voix à l'aveugle sur la même phrase, alignement, scènes réelles, montage, exports/QA et preuves. **Contrat D00-v6 :** [d00-eye-globe-visual-contract-v6.json](../media/art-direction/d00-eye-globe-visual-contract-v6.json).

**Prochaine étape après approbation de D00** : reconstruire fidèlement l'image en **3D programmatique** 1080×1920 avec frontières GIS exactes, blanc de l'œil et atmosphère séparés ; comparer moteur Three.js/Blender piloté par Remotion/FFmpeg. Puis rotation géographique vers `lat/lon` du **pays de l'actualité**, avec validation D01 et micro-clip 3–6 s avant D02/D03/D04/D05. Ne jamais forcer plusieurs pays. Tester **logo officiel discret en coin** plus tard ; place non validée, respecter les règles du canal. Voix et montage ne sont pas oubliés : ce sont des jalons ultérieurs distincts, pas du travail déjà terminé.

---


## 13 NOVEMBRE — DERNIÈRE DIRECTION D00 ŒIL / GLOBE (PRIORITÉ ACTUELLE)

**Nouvelle proposition fixe générée, NON APPROUVÉE :** D00-v4, Terre presque plein cadre, **exactement deux arcs d'œil non circulaires** inspirés du logo officiel (arcs au-delà des bords gauche et droit, extrémités invisibles), halo atmosphérique bleu/cyan, continents naturels, **frontières nationales visibles**, aucun éclairage nocturne urbain, soleil ou nuages décoratifs hors planète, étoiles très discrètes. Dimensions du fichier image de conversation : 1086 × 1448 (donc **pas encore 9:16**) ; SHA-256 `5f97e5f0d29551e187b50106e0aaf2f00e700062a9a2f5845dbf9f9715b6a90e`.

**Sources impératives :** [historique des quatre visuels + corrections humaines](../media/art-direction/D00_EYE_GLOBE_VISUAL_ITERATIONS_2026-11-13.md), [contrat JSON v4](../media/art-direction/d00-eye-globe-visual-contract-v4.json), `DECISION_REGISTER.md` D-018–D-022, et `WORK_JOURNAL.md`. La Terre est la pupille ; les deux arcs sont des paupières secondaires, **pas deux anneaux formant un cercle**. Ne pas recréer ou modifier le logo bleu PNG officiel.

**Prochaine opération :** attendre le retour sur D00-v4 et corriger si nécessaire. Avant toute vidéo, réaliser/évaluer un vrai **D00 3D vertical 1080×1920** avec géographie tracée depuis données fiables, atmosphère simulée et arcs paramétriques. Puis micro-animation 3–6 secondes sur validation explicite ; D01–D05 et montage complet restent ultérieurs. **Image générée dans le chat, binaire non archivé sur GitHub** ; seule sa trace et son cahier des charges sont versionnés. Aucun nouveau build de l'aperçu statique n'est revendiqué pour cette révision.

---

## NOUVELLE REPRISE DU 13 NOVEMBRE — AUDIT DU CHAT BLOQUÉ (SANS NOUVELLE VALIDATION)

Le propriétaire a fourni une capture du dernier message du chat précédent et demandé la vérification de l'historique et du dépôt. Rapport de lecture détaillé : [MEDIA_STUDIO_RECOVERY_AUDIT_2026-11-13.md](MEDIA_STUDIO_RECOVERY_AUDIT_2026-11-13.md). Le journal de travail est complété.

**Preuves au démarrage de la reprise :** code média HEAD `c422eafa1bbbe47f427057ba4ce2bb1c54612e06` ; preview HEAD `824bd847a8c0a0703f507cb85e7d25cbff1bd0ba` ; manifeste `source_commit=e57207ba1b19add8649f39511eda0984798afb78`, `backend_connected=false`, `channel_published=false`, `human_qa_completed=false`. Entre le code de la preview et le HEAD média initial, **cinq commits purement documentaires**, pas de modification de l'UI. Les commits ajoutés depuis cette lecture concernent seulement la documentation de reprise. CI média du HEAD initial signalée successful ; ce n'est pas une validation créative.

**Statut inchangé :** G0 logo bleu validé ; MP4 COP31 refusé 1/10 ; A/B/C refusées ; G1 direction géographique D00–D05 **frames fixes non approuvées**. **Priorité immédiate D00**, image du globe réellement convaincante, présentation dans le chat/site mobile et jugement humain avant mouvement. Un événement localisé n'impose pas plusieurs pays. La formation de 137 pages n'a qu'un audit thématique ; Gemini/Flow, ElevenLabs et n8n/Make non prouvés intégrés.

**Limite de la récupération :** ancien chat non disponible intégralement mot pour mot ; son dernier message et les traces GitHub/contextuelles ont été croisés. Aucune nouvelle image, voix ou vidéo n'a été produite pendant cette session d'audit.

---


**Date de rédaction : 13 novembre 2026.** Ce document est un **état de reprise vivant**, à actualiser après chaque incrément. Les preuves de changement et les dates des commits sont dans [COMMIT_HISTORY_INDEX.md](COMMIT_HISTORY_INDEX.md).

## POINT DE REPRISE IMMÉDIAT — clarification du propriétaire (13 novembre, ~15 h 26 CET)

**Cette entrée est prioritaire sur les passages plus anciens du document.**

- Le propriétaire a signalé un nouveau risque de blocage du chat et exige la conservation des avancées dans GitHub après chaque étape.
- **Notre jalon est G1 : validation de l'identité audiovisuelle géographique**, PAS réimplémentation d'un nouveau dashboard ni finalisation d'une vidéo.
- **Anciennes directions A/B/C : refusées explicitement**, sans scores inventés ; ancien MP4 COP31 : refusé 1/10 ; **logo bleu original : validé sans note**.
- Des compositions **D00–D05** ont déjà été codées pour montrer le globe → le pays → les preuves → l'explication → la sortie, mais **ce ne sont que des frames Canvas/React fixes et non approuvées**, pas le globe satellite premium final.
- **Correction impérative : un reportage ne doit PAS forcément traiter plusieurs pays.** Une actualité sur un pays = un seul pays dans la vidéo si le récit l'impose ; deux pays si une relation est pertinente ; plusieurs pour un véritable tour du monde seulement. Les cinq pays du clip TikTok étaient une référence de technique visuelle, pas un moule de format.
- **Spécification canonique mise à jour :** [contrat des formats et approbations](../media/art-direction/EDITORIAL_GLOBE_FORMATS_AND_REVIEW_CONTRACT_2026-11-13.md).
- **Audit du PDF / code : PARTIEL, NON terminé**. Formation 137 pages accessible et sections essentielles extraites, code de `GeoGlobe`, `GlobeDirection`, `ReviewStudio`, `WorldVisionFirstReport`, `WorldVisionShort`, `media-renderer/server.mjs`, `media-service/voiceover.py` et package Remotion examinés. **Pas de certification complète du code ligne par ligne, ni de validation artistique.** Voir `docs/media/TRAINING_137_PAGES_IMPLEMENTATION_AUDIT_2026-11-13.md`.
- **Fait technique important :** la narration dans le service média utilise OpenAI Realtime avec contrôle de transcription ; ce n'est PAS une intégration Gemini/ElevenLabs. Le moteur Remotion existe mais les écrans D00–D05 ne sont pas encore branchés à une composition animée validée. La vidéo initiale contient encore des signes de l'ancien style refusé : ne pas la rediffuser.
- **Google Flow / Gemini vidéo, ElevenLabs TTS/alignement, n8n/Make : non connectés à ce jour selon le code inspecté.** Le fait de posséder un abonnement Google n'implique pas une autorisation API.
- **Prochaine action artistique :** relire la capture réelle **D00**, proposer une image du globe plus convaincante et expliciter les critères de notation ; faire valider son style **avant tout rendu de 3–6 secondes**, puis seulement poursuivre D01 → D05 avec de vrais médias autorisés.

**Ne pas confondre documentation des intentions, code présent, CI technique et rendu professionnel approuvé.**

---

## Dernière décision de direction créative (13 novembre 2026) — PRIORITÉ ACTUELLE

**Ne pas se tromper de jalon.** La plateforme World Health Vision V2 et le Media Studio existent toujours. Dans Media Studio, le propriétaire était en train d'évaluer l'identité visuelle, et **a rejeté les trois anciennes maquettes A/B/C** pour leur manque de qualité. Aucun score chiffré individuel n'a été attribué à A/B/C.

**Nouveau chemin demandé :** géolocalisation cinématique « Terre entière → pays ciblé → région/ville → médias véritables vérifiés → explication → transition ». Le logo officiel bleu est conservé. Développement **plan par plan**, aperçus au téléphone, notes 1–10, refus/corrections et validation explicite à chaque jalon. **Ne pas relancer un MP4 final.**

**Code de la nouvelle étude :** `frontend/web-v2/src/media/GeoGlobe.tsx`, `GlobeDirection.tsx` et `GlobeDirection.css`. Six poses D00–D05 s'appuient sur le GeoJSON des pays déjà présent dans le projet. **Ce sont des maquettes fixes vectorielles et lumineuses, pas encore une sphère satellite 3D photoréaliste ni un film animé.** L'évaluation doit aussi déterminer si leur rendu est assez professionnel ; ne pas déclarer la direction validée sous prétexte que les tests passent.

**Formation retrouvée et étudiée :** `monter-et-animer-vos-videos-avec-claude-v2.pdf` de 137 pages. Voir `docs/media/TRAINING_137_PAGES_IMPLEMENTATION_AUDIT_2026-11-13.md` pour une comparaison honnête avec les fonctions actuelles et les manques, notamment voix, dérushage, compétences et QA.

**Rappel sur les deux vidéos perdues :** une vidéo géopolitique de ~65 s a été renvoyée et réellement examinée ; l'autre et le texte exact du prompt historique n'ont pas été retrouvés. Ne pas attribuer des détails inventés à cette deuxième référence.

**État des validations :** logo bleu actuel APPROUVÉ sans note ; ancien MP4 COP31 REFUSÉ 1/10 ; anciennes A/B/C REFUSÉES sans score ; **D00–D05 proposés seulement, pas approuvés**. Ne pas publier ni fusionner la branche média dans `v2` sans autorisation.

**Liens utiles :**
- [Directive artistique à respecter](../media/art-direction/WORLD_VISION_GLOBE_SIGNATURE_DIRECTIVE_2026-11-13.md)
- [Audit de la formation](../media/TRAINING_137_PAGES_IMPLEMENTATION_AUDIT_2026-11-13.md)
- [Registre de décisions](DECISION_REGISTER.md)
- Media Studio : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/index.html?view=media&screen=review&gate=direction

---

## Nouvel élément confirmé le 13 novembre 2026 : référence vidéo originale réexpédiée

Une des deux vidéos TikTok mentionnées dans la conversation disparue vient d'être **réellement reçue et inspectée**. Il s'agit d'une vidéo de ~64,9 s en 512×910 H.264 avec globe terrestre et cinq sujets géographiques (Mexique, Royaume-Uni, Riyad/Bruxelles, Soudan du Sud, Turquie/Chine), filigrane `@focus.geopolitique`.

- **Analyse vérifiée et chronométrée :** `docs/media/references/2026-11-13-focus-geopolitique-video-reference.md`
- **JSON de preuve :** `docs/media/references/2026-11-13-focus-geopolitique-video-reference.json`
- **Empreinte du MP4 remis :** `4e4e979144b59ee9359287c75773cfbbb5cefbd12d05f71ec9ba3bd66f3328bb`
- **Conservation :** les observations/empreintes sont commités dans GitHub ; le **fichier vidéo tiers n'a pas été ajouté au dépôt** et reste une pièce reçue en conversation. Droits de rediffusion non établis.
- **Nouvelle piste G1 :** **D — « Le globe raconte l'actualité »** (globe → zoom pays → marqueur/contour → vraie information). **CONCEPT PROPOSÉ, PAS une maquette réalisée, PAS une validation utilisateur.** Les directions A/B/C précédentes restent non approuvées.
- **Aucun changement automatique de montage :** conserver l'exigence de validation de l'ouverture avant animation 3–6 s, puis de la voix et du montage.

Ce nouvel élément documentaire **complète**, mais ne supprime pas, la priorité de l'avis humain G1. La seconde vidéo évoquée précédemment n'a pas été remise dans ce tour.

---

## Ce qu'il faut ouvrir d'abord

| Rôle | Référence |
| --- | --- |
| Dépôt canonique | `OBIANG5/World-Health-Vision` |
| Branche plateforme V2 | `v2` |
| Branche Media Studio (code source) | `feature/world-vision-media-studio` |
| PR Media Studio, non fusionnée | [PR #5](https://github.com/OBIANG5/World-Health-Vision/pull/5), base `v2`, **draft** |
| Branche d'aperçu compilé | `whv-media-studio-browser-preview` |
| Lien d'aperçu permanent | https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/index.html?view=media |
| Lien direct vers le travail en cours | https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/index.html?view=media&screen=review&gate=direction |
| Manifeste du déploiement statique | `preview-deployment.json` à la racine de la branche de preview |
| Vidéo rejetée / vraie preuve | `media-pilots/cop31-risk-finance-2026-11-12/world-vision-cop31-master.mp4` dans la branche de preview |
| Refus 1/10 | [Issue #9](https://github.com/OBIANG5/World-Health-Vision/issues/9) |
| Programme qualité | [Issue #8](https://github.com/OBIANG5/World-Health-Vision/issues/8) |

## Milestones avec décisions exactes

| Gate | Objet | État actuel | Preuve |
| --- | --- | --- | --- |
| G0 | Logo officiel actuel œil-globe bleu | **VALIDÉ sans note numérique** | `docs/media/approvals/2026-11-13-current-official-logo.json` |
| G1 | Direction artistique d'ouverture A/B/C | **Trois propositions produites, AUCUNE validée** | `docs/media/art-direction/cop31-opening-directions-v1.json` et `style-frame-*.png` |
| G2 | Médias sous licence et illustrations réelles | À confirmer par séquence, pas validation finale | Licence/photo historique documentée, `editorial/harvey-rescue-2017.provenance.json` |
| G3 | Script, narration et vérification phrase par phrase | Pilote existant, nouvelle revue requise | `docs/media/pilots/cop31-risk-finance-2026-11-12.json` |
| G4 | Casting de voix françaises naturelles | **Non validé** (Piper rejeté) | Issue #9 |
| G5 | Animation d'un extrait 3–6 secondes | **Non créée** après approbation du nouveau style | A/B/C en attente |
| G6 | Montage final complet | **NON AUTORISÉ pour l'instant** | MP4 COP31 original rejeté |
| G7 | QA visuelle/audio humaine + automatisée | Non validée sur une nouvelle version | Rapport qualité actuel |
| G8 | Exports et publication TikTok/WhatsApp | Non autorisés | `docs/media/PUBLISHING_CONNECTORS.md` |

> Les libellés G0–G8 sont les **jalons humains** ; ils coexistent avec les **14 étapes techniques** du parcours RADAR→PUBLISH. Ne pas confondre ces deux taxonomies.

## Statuts à ne jamais confondre

### Ce qui existe réellement
- Le vrai frontend V2 Media Studio, son parcours interactif de 14 étapes, un Control Room et l'onglet d'évaluation.
- Code FastAPI media-service/PostgreSQL, Redis scheduler conditionnel, VERIFY, scoring, CREATIVE, ASSETS, audio, Remotion, QA, manifests et reçus (état exact à vérifier dans le code au HEAD du jour).
- Un vrai MP4 COP31 encodé H.264/AAC avec un SHA-256 `5e62e2f0f65e1335c67a3ac3cac70b827b2d676111309f3b151528bdc8440cfd` ; **refusé 1/10 par l'utilisateur**.
- Trois frames visuelles A/B/C avec le bon logo actuel, des faits sourcés et une photo d'archive de 2017 clairement distinguée de la COP31 2026.
- Enregistrement de l'avis 1/10 dans GitHub et restauration sur le site, sauvegarde locale/session des nouveaux brouillons.

### Ce qui n'existe PAS encore en production démontrée
- Hébergement permanent d'un backend Media Studio avec une veille et génération 24 h/24.
- Transfert automatique et authentifié d'une note utilisateur depuis le site statique jusqu'à GitHub **sans confirmation GitHub**.
- Voix approuvée et animation approuvée pour un nouveau reportage.
- Un nouveau montage complet approuvé et diffusé publiquement.
- Publication automatique WhatsApp Channels, TikTok Direct Post autorisé, comptes OAuth validés.
- Connexion effective du compte Gemini/Google AI personnel au renderer ou à n8n/Make.
- Une garantie de rafraîchissement instantané via RawGitHack.

### Cache / version
- Le lien `?view=media` ouvre historiquement **Parcours vidéo**, pas directement les nouvelles directions. Utiliser `screen=review&gate=direction` pour A/B/C.
- Les changements sont sur la branche compilée `whv-media-studio-browser-preview`. Dans l'interface, la **bande de version** doit montrer les 12 premiers caractères de `source_commit`, obtenus depuis `preview-deployment.json`.
- RawGitHack est une **passerelle de fichiers avec cache**, pas une plateforme de déploiement applicatif temps réel. Les fichiers peuvent rester en cache pendant plusieurs minutes, parfois davantage avec du trafic. Ajouter un `?v=...` arbitraire **ne garantit pas de purger le CDN**.
- Pour déboguer, comparer le SHA de la bande du site, `preview-deployment.json` dans la branche d'aperçu, le dernier run `World-Vision Media Studio real-UI mobile preview` et le dernier commit de la branche source. Ne pas déclarer un problème résolu uniquement parce que le workflow GitHub a été vert.
- Une version **immuable** peut se consulter via `https://rawcdn.githack.com/OBIANG5/World-Health-Vision/<SHA-40-DE-LA-BRANCHE-PREVIEW>/index.html?view=media&screen=review&gate=direction` ; son URL change à chaque release, contrairement au lien permanent en dev.

## Prochaine action NON négociable

1. **Faire examiner l'écran exact des trois propositions A/B/C sur téléphone**, avec le logo bleu actuel officiel et la photo d'archives chargée.
2. L'utilisateur **choisit une proposition** et la note aspect par aspect ; les refus/points bloquants restent enregistrés dans GitHub. Il peut ne valider aucune proposition : dans ce cas, on itère les trois images fixes.
3. **Ne pas faire d'animation, de nouvel MP4 ou de voix définitive** avant cette étape. Une fois la direction validée, préparer un micro-clip de 3–6 secondes puis le faire noter.
4. Ensuite seulement auditionner plusieurs voix naturelles, créer le montage, inspecter les pixels et le son, conserver les preuves, demander approbation humaine finale.

## Discipline de reprise

- Commencer chaque session par vérifier le HEAD de la branche Media Studio **et** celui de `v2`, l'état de PR #5, l'Issue #9 et les derniers runs CI / preview.
- Ne pas fusionner `feature/world-vision-media-studio` dans `v2` par défaut. L'intégration doit être préparée et testée.
- À la fin de chaque modification : preuves, tests, capture mobile quand utile, date de release, statut validé/refusé, mise à jour de ce document et de [WORK_JOURNAL.md](WORK_JOURNAL.md).
- Consigner toute restriction, correction, crédit/licence, statut authentique/fictif, SHA-256, URL du média ou de sa publication **dans le dépôt**, pas seulement dans ChatGPT.

### Site Media Studio — état technique après l'ajout du panneau de continuité

Le frontend `frontend/web-v2/src/media/ProductionJourney.tsx` et `ProductionJourney.css` a été **réellement modifié** : la page du parcours (lien stable `?view=media`) indique D00-v6 en attente de revue, avertit que les six images du laboratoire sont des **frames plus anciennes**, et résume le futur globe ciblé, médias réels, voix, montage et QA ; elle propose aussi un lien vers le **plan directeur complet**. **Cela ne téléverse pas l'image D00-v6 au site.**

Commits source UI : `fa26c788b463269f64afbb760a4099d8e2498f35` (interface) et `00224feaaffb97c13a65e2518ee301d7aaefa910` (styles). CI média associée au commit CSS : **success** [run #43457617960](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43457617960). Workflow de publication statique [#43457606661](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43457606661) **encore in_progress lors de la première vérification** : tant que son statut et `preview-deployment.json` ne sont pas confirmés, ne pas affirmer que le lien public affiche ce nouveau panneau. La preview précédente était `source_commit=e57207ba1b19add8649f39511eda0984798afb78`.

**Aucune modification du renderer globe animée, de la voix finale ni des APIs de publication.**


### Confirmation de publication du panneau de continuité (13 novembre, contrôle final)

Le workflow [World-Vision Media Studio real-UI mobile preview #43457606661](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43457606661) est désormais **completed / success** (y compris build React, test Playwright iPhone/desktop, publication de la branche de preview). Branche de preview : HEAD `bdd6277fd88b9a5eebefe1e1737ac6ad19d31931`, manifeste `source_commit=00224feaaffb97c13a65e2518ee301d7aaefa910`. **Ce qu'il prouve** : le panneau « D00-v6 non encore validé » et la feuille de route sont intégrés au bundle statique. **Ce qu'il ne prouve pas** : synchronisation instantanée du cache RawGitHack, présence des pixels du concept D00-v6, moteur 3D fonctionnel, ou backend actif. Les captures anciennes du laboratoire restent explicitement distinguées de la nouvelle image dans l'UI.


---

## MISE À JOUR APRÈS INTERRUPTION — GÉOCIBLAGE INTERACTIF VALIDÉ TECHNIQUEMENT (13/11/2026)

**Priorité de reprise récente (supplante les anciennes indications « pas de rotation ») :** la rotation **technique** du globe est bien développée sur la branche média et testée dans le site mobile. **Elle n'est pas le rendu photo/CGI du plan D00-v6 et ne vaut pas validation de la direction artistique.**

**Architecture** : `frontend/web-v2/src/media/geoTargeting.mjs`, `geoTargeting.d.mts`, `geoTargeting.test.mjs`, `GeoTargetingLab.tsx/.css`, `GeoGlobe.tsx`, intégration au parcours `ReviewStudio` et six maquettes anciennes via `GlobeDirection`. Pays identifiés par ISO3 du dossier d'actualité ou sélection de test manuelle ; mouvement sphérique lissé, frontière GeoJSON, contrôles iPhone. Pas de zoom dans une ville imaginaire ni de diffusion automatique.

**Preuves** : CI `43460449189` = six jobs verts ; workflow mobile `43460509829` = `completed/success`, GitHack manifest `source_commit=30f280b089148dd12768ce67d6bf7adea270419b`, preview HEAD `08492abc9ab7ab55f2beebb4e0f1d268e8365765` ; capture `media-globe-motion-lab-iphone.png` existe sur la branche preview et a été inspectée. Voir [GEO_TARGETING_MOTION_LAB_2026-11-13.md](../media/GEO_TARGETING_MOTION_LAB_2026-11-13.md).

**Lien permanent de démonstration** : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/index.html?view=media&screen=review&gate=direction . Faire défiler après les six images D00–D05 pour trouver « Une actualité. Un pays. La Terre s'oriente. ».

**Prochaine étape intelligente** : utiliser ce moteur comme **moteur de géographie pour une future vraie 3D**, mais reconstruire le plan D00 selon la charte toujours en cours de validation (Terre immense, frontières sahariennes exactes, blanc pur dans l'œil à deux arcs, atmosphère cyan mieux éclairée). Livrer le prototype CGI 1080×1920 et obtenir validation humaine avant micro-clip 3–6 s, voix, montage complet. Se référer aux 9 parties du manuel de 137 pages sauvegardées dans `AUDIOVISUAL_PRODUCTION_MASTER_PLAN_2026-11-13.md`.



---

## ALERTE VISUELLE PRIORITAIRE — LE GLOBE SIMPLIFIÉ NE REMPLACE PAS D00-v6

Après présentation du laboratoire Canvas de rotation, le propriétaire a signalé que la carte du site n'avait **plus la qualité visuelle du concept World-Vision déjà travaillé**. Il a raison : le moteur géographique était un prototype technique, et son exposition sans séparation assez nette créait une confusion de direction artistique.

**État officiel :** référence actuelle `D00-v6`, image d'origine `a_crisp_ultra_detailed_high_contrast_digital_ill.png` 1086×1448 (SHA-256 `8d9a9d20f20fbf7757713b6f5eab06590f191166eb779865747f0f59683cfca2`). Elle a été retrouvée dans le contexte fichier du chat et inspectée ; son **PNG original n'est toujours pas dans GitHub**, seulement les spécifications/hashes. Son statut est encore **en attente d'approbation finale**. Le G0 logo bleu officiel reste accepté, inchangé.

**Distinction code** : `GlobeDirection.tsx` affiche en priorité un rappel `data-art-direction-ref="D00-v6"`, puis les anciennes maquettes D00–D05 ; le laboratoire schématique `GeoTargetingLab` est replié par défaut dans `<details id="wv-globe-tech">`. Test dans `media-preview-smoke.mjs`. Le simulateur sert uniquement à la rotation et aux frontières, **jamais à définir l'esthétique de l'image finale**.

**Prochaine vraie étape artistique** : reconstruire avec un moteur CGI 3D la Terre détaillée, grande, naturelle et atmosphérique, les blancs purs dans les deux arcs de l'œil, la couche atmosphérique cyan plus lumineuse que les arcs, et des frontières exactes, notamment au Sahara. Un prototype photo-CGI 1080×1920 doit être présenté et corrigé avant d'animer D01. Préserver le moteur pays ISO3 développé mais dissocier son rendu de l'identité visuelle. Le futur montage/voix/QA suit `docs/media/AUDIOVISUAL_PRODUCTION_MASTER_PLAN_2026-11-13.md`.

  
---

## 13 NOVEMBRE 2026 — NOUVELLE TERRE CGI WEBGL VRAIMENT PUBLIÉE (PRIORITÉ DE REPRISE)

**Le prototype géographique plat N'EST PLUS le seul rendu proposé.** Le nouveau composant `CinematicEarth.tsx` affiche une **Terre phototexturée NASA Blue Marble**, sphère calculée par shader WebGL, grande et en couleurs jour, halo atmosphérique cyan, **deux arcs de l'œil sur blanc pur** et des **frontières tirées du fichier réel `countries.geojson`**. Le D00 original de conversation **n'est pas remplacé ni approuvé** ; le CGI est une première réinterprétation codée à évaluer.

- Référence canonique et détail du code : [CINEMATIC_EARTH_D00_ENGINE_2026-11-13.md](../media/CINEMATIC_EARTH_D00_ENGINE_2026-11-13.md).
- Code : `frontend/web-v2/src/media/CinematicEarth.tsx`, `CinematicEarth.css`, `GeoTargetingLab.tsx`, `GlobeDirection.tsx`, et workflow de packaging NASA `.github/workflows/whv-media-studio-mobile-preview.yml`.
- **Preuve publique** : workflow https://github.com/OBIANG5/World-Health-Vision/actions/runs/43464929633 **completed/success**, tests du PNG NASA + WebGL + iPhone Playwright, capture `media-globe-cinematic-d00-candidate-iphone.png`. Preview `source_commit=2f9fedd46ae2ee77e3984814b3d47710e0a25c27`; son lien permanent n'a pas changé.
- Capture : https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-globe-cinematic-d00-candidate-iphone.png
- Site : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/index.html?view=media&screen=review&gate=direction
- Texture NASA archivée dans le build `earth/blue-marble-topography-nasa.jpg`, SHA-256 `9743175942473681d78838ca1042553dab4779cf957fb6d8f22a81fb796f7797` et `earth/provenance.json`.

**MAINTENIR LES GATES:** une compilation réussie n'est pas une validation artistique, le CGI interactif n'est pas encore un master 1080×1920 Remotion ni un MP4. L'original D00-v6 a SHA-256 `8d9a9d20f20fbf7757713b6f5eab06590f191166eb779865747f0f59683cfca2` et n'a pas encore son PNG dans GitHub. **Prochaine étape** : revue visuelle de cette vraie capture, ajustements de la signature œil/atmosphère/pays, puis premier micro-clip D01 3–6 s et intégration Remotion/FFmpeg. **Ne pas revenir à la carte vectorielle plate ni déclarer D00 validé sans l'utilisateur.** Conserver le plan audiovisuel complet de 137 pages.



---

## D01 : PREMIER MICRO-CLIP CGI RÉEL DE 4 SECONDES (13 NOVEMBRE 2026)

**Nouveau jalon techniquement atteint, sans validation artistique implicite.** Une véritable vidéo H.264 **1080×1920 / 24 fps / 4 s / 96 images** a été rendue depuis le **même shader WebGL `CinematicEarth.tsx`** et le **même moteur géographique `geoTargeting.mjs`** que le site. La rotation pilote la Terre vers le Gabon (`GAB`) en utilisant un point de pays issu du GeoJSON, non la localisation d'une vraie actualité.

**Preuves vérifiées** : workflow GitHub [#43466731755](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43466731755) **completed/success**, tous tests passés. MP4 présent sur `whv-media-studio-browser-preview/media-lab/wv-d01-gab-technical-4s.mp4`, SHA-256 `17796338023f0ffd9732739390ac2535c816113baf8e6dd773879314604bb22a` ; blob Git `8dd35afc5f5ef56eae1b40b72208dfc19380cb78`. Manifeste `media-lab/wv-d01-gab-technical-4s.json`; branche preview HEAD initial de livraison `e6022b36c4bcdc368fae71d52f92a817a21ca3cb`.

**Lien vidéo** : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/wv-d01-gab-technical-4s.mp4

**Code du nouvel export** : `frontend/web-v2/src/media/CinematicCapture.tsx`, `frontend/web-v2/render-cinematic-d01.mjs`, `.github/workflows/whv-cinematic-motion-d01.yml`. La branche d'aperçu préserve `media-lab/` lors de ses prochains builds. Document canonique : [CINEMATIC_D01_MICROCLIP_2026-11-13.md](../media/CINEMATIC_D01_MICROCLIP_2026-11-13.md).

**À NE PAS CONFONDRE** : ce MP4 est un **prototype de mouvement technique**, pas un reportage, pas une vidéo finale, pas une approbation G1/D00/D01, pas un vrai événement Gabon, pas de voix, pas de publication TikTok/WhatsApp. D00-v6 original reste la référence artistique incomplètement archivée (PNG non committé). La suite doit se concentrer sur **la fidélité artistique de l'œil, de la texture, de la couche atmosphérique et des frontières**, puis sur les cartes/cadrages véritablement liés à une actualité, les vraies séquences et les 14 étapes de production du manuel de 137 pages.

---


## ÉTAT D01 — MP4 GABON RÉEL + QA FRAMES (13 novembre 2026)

**Priorité sur les paragraphes antérieurs où D01 n'était qu'une idée :** un véritable **micro-clip de rotation D01** est maintenant produit (MP4 H.264 1080×1920, 4 secondes, 24 fps, 96 images) par le **même globe CGI WebGL et moteur de mouvement géographique** que le Media Studio.

- **Vidéo technique** : https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-lab/wv-d01-gab-technical-4s.mp4
- **SHA-256 vidéo** : `17796338023f0ffd9732739390ac2535c816113baf8e6dd773879314604bb22a` ; manifeste de provenance dans `media-lab/wv-d01-gab-technical-4s.json` sur la branche d'aperçu.
- **Rendu source** : workflow https://github.com/OBIANG5/World-Health-Vision/actions/runs/43466731755 **success**.
- **Vérification visuelle** : https://github.com/OBIANG5/World-Health-Vision/actions/runs/43468666079 **success**, vérification SHA + dimensions/durée/images par FFprobe, 3 frames distinctes extraites à 0, 2, 3,87 secondes. Contact sheet : https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-lab/review/contact-sheet.jpg.
- **Lecteur dans le site** : `frontend/web-v2/src/media/CinematicMotionReview.tsx/.css` intégré à `GlobeDirection.tsx`, avec vérification manifeste, `controls`, `playsInline`, aucun autoplay, poster tiré du MP4 et lien QA. Compile frontend au commit `94336393e7659303780c406bd30a8f3cba5ee5de` réussie. Le build mobile de ce commit doit être confirmé séparément au manifeste `preview-deployment.json`.
- **Détail intégral** : [D01_GABON_MOTION_REVIEW_2026-11-13.md](../media/D01_GABON_MOTION_REVIEW_2026-11-13.md).

**Limites :** le point choisi est un centre national de GABON démonstratif, pas un événement particulier ; vidéo sans voix, sans actualité réelle, sans marqueur final, et **pas encore conforme/validée au niveau esthétique D00-v6**. Aucune publication TikTok/WhatsApp ni approbation implicite. Le prochain travail : comparer le vrai film à la direction D00-v6 et améliorer la lumière du globe, les deux arcs, le contour atmosphérique et le traitement des frontières, puis aborder le zoom D02 et les vrais rushes. Les neuf parties du manuel de 137 pages restent le parcours audiovisuel complet.

