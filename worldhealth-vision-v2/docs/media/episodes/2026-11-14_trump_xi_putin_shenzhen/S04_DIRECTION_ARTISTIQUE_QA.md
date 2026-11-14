# World-Vision — S04 / Nucléaire & New START
Date de production : 14 novembre 2026
Branche : `feature/world-vision-media-studio`
Durée source cible : **7,9 s** / 237 frames / 30 fps / 1080×1920 / H.264.
Statut initial : **code de rendu livré sur GitHub, pipeline GitHub Actions lancé ; QA finale en attente**.
Aucune autorisation de publication finale, aucune voix, aucun nouveau master 43 s.

## Continuité de montage

S03B Shenzhen (09,8–12,5 s) → S04 New START (12,5–20,4 s) → S05 Chine (20,4–26,6 s).

Raccord colorimétrique : encre `#031126`, cyan `#4EDDF8`, blanc froid.
L'original D00-v6 doit toujours rester intact. Le logo G0 est lu depuis le vrai fichier, et non redessiné.
Composer le clip comme film documentaire: hiérarchie typographique, profondeur, mouvements courbes très doux, aucune explosion nucléaire illustrative.

## Trois battements éditoriaux

1. **0–3,2 s :** « Réduire les arsenaux nucléaires » ; grandes lettres cinétiques et orbites abstraites. Les orbites n'encodent aucune donnée chiffrée sur les armes.
2. **2,9–6,2 s :** « NEW START », photo d'archive authentique de la signature à Prague en 2010, Obama et Medvedev, crédit bien visible. Il est **interdit** de présenter cette scène comme la réunion prévue en 2026.
3. **5,9–7,9 s :** « 05.02.2026 — NEW START A EXPIRÉ », trait interrompu, puis « ET APRÈS ? ». Transition préparatoire vers S05 sur la position chinoise.

Les fenêtres se chevauchent pour produire des fondus sans écran noir et sans accélération de lecture.

## Narration prévue — script utilisateur V1, inchangé

« Au cœur des discussions : réduire les arsenaux nucléaires. Le dernier grand traité entre Washington et Moscou a expiré en février. »

Les deux phrases sont découpées provisoirement autour de 15,65 s absolues. Le calage doit être refait par alignement sur le **fichier vocal français approuvé**, sans tronquer la phrase.

## Provenance et exactitude

- **Expiration factuelle :** ministère français des Affaires étrangères, communiqué du 6 février 2026, expiration le 5 février 2026 : https://www.diplomatie.gouv.fr/en/presse-et-ressources/decouvrir-et-informer/actualites/expiration-du-traite-new-start
- **Document historique illustratif :** Chuck Kennedy / Maison-Blanche, 8 avril 2010, photo dans le domaine public aux États-Unis ; https://commons.wikimedia.org/wiki/File:Obama_and_Medvedev_sign_New_START.jpg
- URL binaire photo primaire : https://upload.wikimedia.org/wikipedia/commons/2/21/Obama_and_Medvedev_sign_New_START.jpg
- Provenance G0 dans code existant : `public/brand/world-vision-official.png` ; blob Git `bc80fa70cebd566768bfb1703a0f1f636a78c196`
- L'histoire n'invente aucun chiffre sur des arsenaux ni aucune scène de négociation de novembre 2026.

## Code, QA et sortie mobile

- Script : `services/media-renderer/scripts/worldvision_segment04_new_start.py`
- CI : `.github/workflows/whv-summit-s04-new-start.yml`
- Sortie attendue : branche `whv-media-studio-browser-preview`, fichier `media-lab/summit-2026/segment04-new-start-7p9s.mp4`
- Manifest attendu : `media-lab/summit-2026/segment04-new-start-7p9s.json`
- Images QA : `media-lab/summit-2026/review-s04/contact-sheet.jpg`, plus six photogrammes à six instants.
- Validation technique : 237 images distinctes dans le flux vidéo, durée 7,9 s, dimensions 1080×1920, H.264, aucune piste audio, logo exact, photo authentique, six captures temporelles non identiques.
- Validation artistique : **réservée à l'utilisateur**. Même avec QA réussie, conserver le statut `WAITING_ART_REVIEW`.

## Bloqueurs du master final

S03B (vrai plan de Shenzhen) absent, S04 encore soumis à contrôle, S05–S08 non produits, source originale D00-v6 et vidéo S02 non intégrées en binaire dans le moteur final, voix française définitive absente, calage sous-titres et mixage non effectués.

**Instruction de reprise :** ne pas reconstruire un globe, ne pas changer la rédaction acceptée, ne pas faire de faux montage global. Continuer un clip à la fois et publier des aperçus mobiles réels.


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
