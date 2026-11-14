# World-Vision Guinée / Siguiri — master V2 avec les 90 images originales de la signature

Date : 14 novembre 2026, retour propriétaire sur les problèmes graves de la V1.

## Correction finale, vérifiée sur le vrai MP4
- Les **trois dernières secondes** de la vidéo GitHub V2 ont été **REPLACÉES effectivement** par la vidéo originale de signature World-Vision que le propriétaire a jointe (512×910, 30 fps, 3 sec, aucun son).
- Il s'agit de **toutes les images du clip original** recadrées en 1080×1920 à 30 images/seconde, et NON d'une image figée. Différences entre trois photogrammes testés : moyennes de pixels 4,74 et 0,61 après re-montage, confirmant un mouvement réel.
- Les premières 44,133 secondes de la vidéo éditoriale GitHub V2 conservent intégralement le script verrouillé (SHA `0d0e268a9f189b9ae4b1714e89dbd67872444340ebce9c64260ee3f440cde8ac`) et la narration Vivienne **en une seule prise continue** sélection A -12% (~148,11 mots/min).
- MP4 final 47,133 s, 1080×1920, 30 fps, H.264/AAC, 16 013 805 octets ; **SHA-256 final `c983ee13203732f546b994324f4a89f6350ccfbd94c3457f2f1da4ba317477be`**.
- Derniers photogrammes visuellement relus : signature bleue, œil+globe, texte WORLD-VISION et slogan ; **aucun rectangle blanc**.
- **Master vidéo conservé dans la bibliothèque personnelle ChatGPT du propriétaire** à `/World-Vision/Video Masters/Guinee-Siguiri-V2-signature-video-originale.mp4`, référence `libfile_9fac2b9f01bc8191b1ff5c085e837d19`.
- Original vidéo de 3 s conservé dans Canva `VAHa58Do0Cc`, original SHA `b1a875dd2611e2fc1e10f9f233b8e42d7065faacaecdc520c52af72c90e7d855`.
- GitHub Actions a archivé la version V2 de **47,133 s** `7fd2082b...`, dont les 3 secondes finales sont une reconstruction à partir d'un photogramme. **NE PAS confondre** l'export GitHub préliminaire avec le nouveau master exact, encore non uploadé en binaire sur GitHub. La V2 Github reste revue préliminaire ; le master corrigé est dans la bibliothèque.
- Ce master reste à auditer artistiquement par le propriétaire (voix et image) ; la licence de diffusion commerciale du TTS `edge-tts` n'est PAS confirmée.

## Comment reproduire la correction depuis les fichiers binaires
À partir du MP4 de 47,133 s exporté par Github V2 et de l'original 3s MP4 fourni par le propriétaire, remplacer les 90 dernières images 30 fps via FFmpeg `trim=end_frame=1324` et concat avec le clip original rescalé 1080×1920 ; conserver la voix entière, puis ajouter exactement 3s de silence dans l'audio. Ne pas redessiner la signature à la main.

## Standards permanents
Ne jamais remettre les labels « ILLUSTRATION », « PHOTO USAID », « QA » dans les vidéos ; conserver attribution dans manifeste et post. Conserver Space Grotesk/DM Sans et le vrai plan d'homme travaillant à la mine. Toute future voix Vivienne doit être une prise intégrale avant mixage, pas une succession de synthèses coupées et collées, et doit recevoir une **évaluation de naturalité humaine**.

**Règle éditoriale** : pas d'approbation de publication ni de licence présumées ; 47,133 s est une preuve technique et non une preuve d'excellence.
