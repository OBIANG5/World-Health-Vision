# World-Vision 001 — EDL V3 : Terre géographique → vraie vue de Shenzhen

Date : **14 novembre 2026**. Statut : conducteur de montage **SOURCE-CONTROLLED**, S03B rendue, raccord circulaire V2 rendu et contrôlé, non encore validé artistiquement, voix encore absente, master 43 s non exporté.

## Direction de réalisation validée comme objectif

Avant le traité New START, le spectateur doit identifier **qui** (Trump/Poutine/Xi), **où** (Shenzhen, Chine) et **de quoi** on parlera. Court métrage vertical de 43 secondes. Pas de fiction vidéo montrant des dirigeants réunis, pas de bâtiments supposés accueillir une rencontre. La ville est montrée à partir de photos documentaires avec leur date réelle et des droits explicitement vérifiés.

- Résolution 1080 × 1920, 30 images/seconde, H.264.
- Toute source conserve sa vitesse naturelle **1,0×** ; on utilise uniquement des extraits ou un **recouvrement temporel**, jamais un accéléré.
- Chaque petit MP4 est une clean plate **sans sous-titres provisoires, sans watermark, sans commentaires techniques incrustés**. Manrope (code typographique unique), vrai fichier logo G0.
- S02 doit conserver la vraie image D00-v6, non remplacée ni redessinée.

## Montage temporel à 30 fps

| Master | Images master | Source et geste de montage | Durée interprétée |
| --- | ---: | --- | ---: |
| 00:00.00–00:04.50 | 0–134 | **S01 V2** vrais portraits, Manrope, pas de sous-titres avant voix | 4,5 s |
| 00:04.50–00:05.40 | 135–161 | **S02** 0,9 s du MP4 original D00-v6 (commence à 0 s source) | 0,9 s |
| 00:05.40–00:10.30 | 162–308 | **S03 V3** réel globe NASA/Natural Earth, **4,9 s intégrales** | 4,9 s |
| 00:09.80–00:12.50 | 294–374 | **S03B V1** vrai centre de Shenzhen (CC0 2025), 2,7 s intégrales, ouverture circulaire 0→1250px pendant les 15 premières images (Remotion, sans superposition translucide des logos) | 2,7 s |
| 00:12.50–00:20.40 | 375–611 | **S04 V3** New START, photo de Prague 2010 | 7,9 s |
| 00:20.40–00:26.60 | 612–797 | S05 Chine, à produire | 6,2 s |
| 00:26.60–00:33.80 | 798–1013 | S06 Iran/Ukraine, à produire | 7,2 s |
| 00:33.80–00:40.00 | 1014–1199 | S07 perspective diplomatique, à produire | 6,2 s |
| 00:40.00–00:43.00 | 1200–1289 | S08 signature World-Vision, à produire | 3,0 s |

**Chevauchement volontaire de 15 images (0,5 seconde) entre S03 et S03B, révélé par une ouverture circulaire et NON un fondu général, lequel avait causé des logos et titres fantômes** : 4,9 + 2,7 − 0,5 = **7,1 secondes**, entre 05,4 s et 12,5 s. Le montage reste à 43 s sans coupe agressive, sans retiming, sans accélérer les images.

## Images et licences réelles

1. **S03** = `segment03-shenzhen-july-v3-clean-4p9s.mp4`. SHA256 `59028e59f40585ed30419a56b083386e492d5cd37920f022f5e3b5301f9423fe`. NASA Blue Marble juillet / Natural Earth, géoréférence centre de Shenzhen, pas de bâtiment précis.
2. **S03B** = `segment03b-shenzhen-city-v1-2p7s.mp4`. SHA256 `cd0dfa113ec71d95b615fba341f0aec5db8953ad1ca520dc292db6c11540f016`. Photo du **13 septembre 2025**, photographe **Renek78**, prise depuis **Lianhuashan, Shenzhen**, CC0 1.0. Source exacte : https://commons.wikimedia.org/wiki/File:02_View_from_Lianhuashan,_Shenzhen_in_2025.jpg ; licence https://creativecommons.org/publicdomain/zero/1.0/. Original photo SHA256 `213604b3c78690367db2be0f8152e687923c1a4fb56474a095019cc8ae22bfa6`. Vue authentique de la ville, **pas une photo de la réunion, ni une confirmation de sa salle**.
3. **S04** = `segment04-new-start-v3-clean-7p9s.mp4`, SHA256 `4fa8aebec451f4edb0d8bd495655b619feaab0d9fb0d517c12e4bd9f88b33e69`. Événement historique de 2010 clairement signalé comme tel.
4. **Logo exact G0** Git blob `bc80fa70cebd566768bfb1703a0f1f636a78c196`. **Manrope** SHA256 `3ae11c49db0455a3cc33e37d380f20fdb8c7f8b41dc07625c177e3d87a9d6ae6`.

## Code et QC

- Générateur photo/vidéo : `services/media-renderer/scripts/worldvision_segment03b_shenzhen_city.py`.
- Workflow autonome S03B : `.github/workflows/whv-summit-s03b-shenzhen-city.yml`, exécution GitHub #43589613072 succès.
- Workflow raccord 7,1s **V2 retenue comme candidate** : `.github/workflows/whv-summit-s03-s03b-transition-v2.yml`, effet FFmpeg `xfade=circleopen` à 0,5 s, exécution GitHub #43590163241, succès.
- La première version `s03-to-s03b-shenzhen-matchcut-7p1s.mp4` a été **rejetée artistiquement** après inspection (double logo et textes fantômes au centre du fondu), conservée dans l'historique.
- **Raccord V2 prêt pour revue utilisateur** : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/summit-2026/s03-to-s03b-shenzhen-matchcut-v2-circleopen-7p1s.mp4
- **Planche V2 (vrais photogrammes)** : https://github.com/OBIANG5/World-Health-Vision/blob/whv-media-studio-browser-preview/media-lab/summit-2026/review-transition-v2/contact-sheet.jpg
- SHA-256 V2 `8ab698002dfd82375423e6866b5bf0a7e602af5a7bba3a0ebafdce3b9191ef37`, MP4 H.264 1080x1920, 213 frames, 7,1 s, 1x, pas d'audio.

- Moteur final Remotion : `services/media-renderer/src/WorldVisionSummit2026.tsx` définit 9 plans à l'écran dont les scènes S03/S03B en chevauchement ; `render-summit-preview.mjs` refuse tout fichier dont le SHA n'est pas l'original.
- Chaque vidéo a six images QA ; les fichiers de rapport JSON servent aux audits. Aucune mention QA dans les pixels.

## Limites et suite

Les clips S01 V2, S02 D00 original, S03 V3, S03B V1 et S04 V3 existent (S02 archivé Canva, pas encore en binaire dans le renderer). **Les approbations artistiques utilisateur sont en attente**. S05–S08 non produites ; aucune voix française finale, SRT syllabiquement aligné ou master validé. Ne pas dire « réunion tenue » ni inventer un accord. Ne jamais publier sans vérification des faits juste avant diffusion et sans contrôle de l'écoute finale.

**Prochaine séquence éditoriale : S05 — Pourquoi Pékin demeure réticent à rejoindre un cadre de désarmement trilatéral.** Utiliser portrait Xi authentique et direction Manrope G0 ; limiter les mentions de production au manifeste.
