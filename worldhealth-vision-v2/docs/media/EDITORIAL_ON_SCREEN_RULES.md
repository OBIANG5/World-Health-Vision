# World-Vision — Règle éditoriale : clean plates obligatoires

**Décision du 14 novembre 2026, valable pour tous les clips et masters.**

## À l'écran uniquement
Le logo G0 original, les lieux et dates de l'actualité, des titres journalistiques utiles, les vrais sous-titres après synchronisation à une voix française approuvée. La légende « ARCHIVES · PRAGUE · 8 AVRIL 2010 » est justifiée par la nature historique de la photo et ne doit pas être confondue avec une vidéo du sommet futur.

## Jamais dans les pixels exportés
Prévisualisation; Preview; Sans voix; QA; Test; V1/V2/V3; numéros de séquences techniques; Archives & motion design; Motion design; S04 / 07,9 s; état de pipeline; provenance technique; watermark de test; noms de fichiers; identifiants de workflow; durée de l'extrait et dates de fabrication purement internes.

**Ces éléments vont dans les manifestes JSON, le journal de production, les pages de prévisualisation et les fichiers de métadonnées, jamais dans les MP4.** Le crédit de la photographie historique Chuck Kennedy / Maison-Blanche est conservé dans les métadonnées et la légende destinée à accompagner la publication.

Une erreur est définitive lorsqu'un texte est incrusté à la génération : ne jamais compter sur le montage final pour l'effacer. Chaque segment doit être une clean plate.

## Typographie
Polices professionnelles librement utilisables uniquement, Manrope Variable pour S04 V3. Police OFL Google Fonts authentifiée par SHA-256 3ae11c49db0455a3cc33e37d380f20fdb8c7f8b41dc07625c177e3d87a9d6ae6. Titres en graisse 800 et texte d'accompagnement en 500. Couleurs World-Vision bleu nuit, cyan et blanc. Pas de DejaVu, d'emoji ni de police de substitution silencieuse.

## Contrôles
La CI appelle scripts/guard_on_screen_copy.py pour rejeter les mentions opérationnelles passées aux fonctions de dessin. Le test summit-2026-contract.test.mjs vérifie l'absence de watermark de preview sur le master Remotion. Six photogrammes distincts sont extraits pour contrôle réel. Toute V3 a besoin de validation artistique avant montage définitif.

## Versionnement
S04 V1/V2 restent pour preuve historique mais sont interdites au master en raison des textes techniques. S04 V3 est la nouvelle candidate quand son rendu a passé les tests. Ni voix définitive ni master 43s à ce stade.


### 14 NOV. 2026 — S03 V3 GÉOGRAPHIQUE PROPRE AUSSI VÉRIFIÉE

État précédent S03 V2 : vrai globe NASA juillet, mais police système DejaVu et footer « NASA BLUE MARBLE / NATURAL EARTH » **incrusté** malgré caractère technique. La source a été modifiée **sans modifier les coordonnées, la texture NASA ni les frontières Natural Earth** ; les informations techniques ont été déplacées dans le manifeste JSON.
- S03 V3 Manrope, 147 frames / 4,9 s / 1080×1920 H264 / 30fps, **sans son**, SHA-256 `59028e59f40585ed30419a56b083386e492d5cd37920f022f5e3b5301f9423fe`, 3 633 979 octets.
- [V3 regarder sur iPhone](https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/summit-2026/segment03-shenzhen-july-v3-clean-4p9s.mp4) ; [quatre images de contrôle](https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-lab/summit-2026/review-s03-july-v3/contact-sheet.jpg).
- [GitHub Actions #43587396877 SUCCESS](https://github.com/OBIANG5/World-Health-Vision/actions/runs/43587396877). Texture/geojson SHA de V2 inchangés ; logo G0 exact et centre géographique Shenzhen 22.5431N 114.0579E.
- Le code de montage master `WorldVisionSummit2026.tsx` et `render-summit-preview.mjs` exige désormais **S03 V3 sha 59028e59... et S04 V3 sha 4fa8aebe...**, avec impossibilité de substituer les anciennes V2. Les sources originales restent archivée. Garder S02 D00 original.
- Contrôle contractuel ajouté au test `summit-2026-contract.test.mjs`; profil et le graphisme documentaire du reportage restent provisoires jusqu'à validation artistique.
- Aucun master 43s, aucune voix française ni vraie vue de Shenzhen S03B. Ne pas prétendre le contraire.

---
