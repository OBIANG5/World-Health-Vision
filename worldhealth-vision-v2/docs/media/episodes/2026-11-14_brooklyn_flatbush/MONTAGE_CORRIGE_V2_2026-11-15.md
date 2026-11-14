# World-Vision — Brooklyn : montage corrigé suite au refus du mono-image

## Retour propriétaire
Le propriétaire avait transmis une photographie photoréaliste de façade effondrée. Son intention : **l’intégrer pour illustrer UNE partie d’un montage existant**, pas centrer l’intégralité de la vidéo sur cette image. La vidéo précédente de 39,9 s a fait cela à tort et a été refusée. **Ne pas refaire cette erreur.** Préserver le globe initial, la voix Vivienne, la signature animée de trois secondes et la diversité des scènes. Son instruction de remplacement est : « Refait la vidéo rapidement ».

## Rendu corrigé effectué et vérifié (15 novembre 2026)
- Nouveau fichier conversation sous `/mnt/data/worldvision_brooklyn_montage_corrige_v2.mp4`, **39,900 secondes**, **1080×1920**, **30 i/s**, H.264 + AAC, taille **11 310 735 octets**.
- Planche réelle de 16 photogrammes : `/mnt/data/worldvision_brooklyn_montage_corrige_v2_contact.jpg` (à conserver dans la conversation; ne pas inventer une URL GitHub de MP4, celui-ci n'a pas été versé au dépôt).
- **Globe réel NASA Blue Marble** construit à partir de la texture locale `mpl_toolkits.basemap_data/bmng.jpg`, animation géolocalisée jusqu'à New York. Durée ~1,7s.
- La photographie expressément choisie par le propriétaire `5255EC03-4107-455F-8FA5-9704B6B36B1D.jpeg` n'est utilisée que **3,5 secondes** (passage « À Brooklyn / un immeuble s’effondre »), sur les **36,9 secondes** de narration. Aucun nouveau visuel IA n'a été généré ; le reste réemploie plusieurs compositions déjà présentes dans les sources de la précédente tentative, avec cadrages mobiles et textes éditoriaux.
- Signature World-Vision originale animée **3 secondes** : `worldvision_signature_original_3s_1080x1920.mp4`.
- **Même voix Vivienne, strictement identique** à `worldvision_brooklyn_image_unique_v1.mp4` : hash du flux audio AAC d'origine et du nouveau montage **identique**, `41fd95366b7be5abd8bf9107104e90984255d83ce1e13a1b53debf7ae7999c02`. Aucune nouvelle synthèse ou changement de débit.
- Marquage « RECONSTITUTION VISUELLE » car les images réalistes sont des créations illustratives, PAS des rushes du véritable effondrement de 1321 Flatbush Avenue.

## Limites honnêtes
Cette correction **répare le choix d'une seule photographie pour l'intégralité de la vidéo** et réintroduit plusieurs séquences variées, un globe précis et la signature originale. Elle ne prétend **pas** restituer les véritables rushes du premier montage si ceux-ci ne sont pas présents dans l'archive actuelle. Elle ne convertit pas des reconstitutions en scènes réelles. L'utilisateur doit évaluer le montage ; ne pas déclarer qu'il l'a approuvé artistiquement. Les droits de diffusion commerciale de `edge-tts` restent non vérifiés.

## Éléments sources existants réutilisés
`effondrement_urbain_sous_le_pont_de_brooklyn.png`, `sauvetage_fdny_dans_les_décombres_de_brooklyn.png`, `sauvetage_émouvant_sous_les_lumières_de_brooklyn.png`, `secours_héroïque_dans_les_décombres_de_brooklyn.png`, `enquête_d_urgence_sous_le_pont_de_brooklyn.png` et `enquête_nocturne_sur_un_effondrement_urbain.png`, toutes déjà disponibles dans les fichiers conversation. Les fichiers générés ne doivent pas être pris pour des images de presse.
