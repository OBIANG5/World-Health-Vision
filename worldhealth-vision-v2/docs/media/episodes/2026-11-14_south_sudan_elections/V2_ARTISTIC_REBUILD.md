# World-Vision — Soudan du Sud · Refonte intégrale V2 du 14 novembre 2026

## Note utilisateur sur V1 : **3/10**, rejet artistique
Défauts explicitement identifiés après visionnage réel :
- Logo G0 enfermé dans une plaque blanche en haut, mal cadré et incompatible avec la composition.
- Cartouches « ARCHIVES · JUBA, 2011 » en bas, perçus comme amateurs.
- Voix Kokoro `ff_siwis` trop robotique, soporifique : **interdite dans les nouvelles versions**.
- Police Manrope, tailles, couleurs et hiérarchie jugées moches. La substitution par une variante Manrope n'est pas une correction suffisante.
- Traits cyan décoratifs sans logique visuelle, asymétrie et répétition du plan.
- Absence de carte/globe géographique dès l'ouverture, alors que le moteur existait sur GitHub.
- Première V1 = diaporama animé, moins engageant qu'une vidéo de média actuel.
Conserver V1 en archive et ne plus la présenter comme modèle.

## Référence utilisateur inspectée directement
Vidéo MP4 transmise le 14 novembre, 168,5 secondes, format 512×910/30 images/s. Grammaire observée : visuels mobiles, information hiérarchisée en deux espaces, gros titres contrastés, habillage stable, narration en continu. La vidéo est une **référence d'étude**, et non une source d'extraits ni une identité réutilisable. Aucune vidéo, voix, logos, images ou design protégés du média concurrent ne sont copiés.

## Nouvelle proposition V2 (distincte et originale)
1. **0,0–3,0 secondes** : vraies données géographiques NASA Blue Marble juillet + Natural Earth ; globe physique pivotant de l'Atlantique à l'Afrique de l'Est, contours du Soudan du Sud et marqueur exact de sa capitale Juba (4.8594 N, 31.5713 E). Pas de faux rendu de frontière IA.
2. **Photographies documentaires plein cadre** : 4 images de Juba 2011 / Salva Kiir 2020, droits PD/CC0, recadrage dynamique léger, pas de faux reportage 2026.
3. **Révélation de date** : vrai changement 22 décembre 2026 → 11 février 2027, grand graphisme typographique distinct, sans lignes et barres répétitives.
4. **Identité visuelle** : polices Archivo Black pour les titres, Inter pour le second niveau ; palette ivoire clair, anthracite, corail ; pas de halo bleu sci-fi, de cadre bleu à filets, de plaque logo permanente. Logo original bleu G0 réintroduit avec calme en toute fin.
5. **Voix** : Kokoro expressément supprimé. Nouveau candidat neural `fr-FR-RemyMultilingualNeural` pour RELECTURE UNIQUEMENT, avec audio segmenté pour synchroniser naturellement les plans. Les voix Edge obtenues via interface non officielle ne sont pas réputées avoir une licence commerciale : reposer le master final sur un service ayant des droits vérifiés (Microsoft Azure Speech payé, ElevenLabs autorisé, Google TTS licencié, ou voix humaine enregistrée). Aucune publication sans validation vocale + droits.
6. **Rythme** : pas de long préambule, voix dans les premières images, moins de 30 secondes, peu de texte à l'écran, chaque scène apporte un fait nouveau.
7. **Aucune micro-étiquette technique** : « Preview », « sans voix », « QA », « motion design » et anciens bas de page interdits dans la vidéo.
8. **Contrôle** : le run fournit neuf photogrammes dont plusieurs dans les 3 premières secondes, un manifeste de provenance et les pistes audio authentiques ; succès CI ne vaut pas acceptation artistique.

## Script V2 segmenté
- « Quinze ans d'indépendance. Zéro élection nationale. »
- « Au Soudan du Sud, indépendant depuis deux mille onze, le premier scrutin se fait toujours attendre. »
- « Les citoyens devaient élire leur président et leurs députés le vingt-deux décembre. »
- « Mais nouveau report : le vote est désormais fixé au onze février deux mille vingt-sept. »
- « La commission électorale ne donne aucune raison officielle. L'ONU alerte sur les violences et les tensions politiques. »
- « Quinze ans après sa naissance, le pays attend toujours ses premières élections nationales. »

**Fact check 14 novembre 2026** :
Reuters : https://www.reuters.com/world/africa/south-sudan-delays-election-february-11-2027-2026-11-14/
AP : https://apnews.com/article/c62033bb79a606ef8ce7e335cfc8478b
La commission n'a pas donné de cause officielle. La violence est un contexte distinct, non une explication affirmée par le pouvoir.

## Développement durable
- Branche isolée : `feature/worldvision-south-sudan-v2-editorial-2026-11-14`
- Renderer V2 : `services/media-renderer/scripts/worldvision_south_sudan_editorial_v2.py`
- Pipeline : `.github/workflows/whv-south-sudan-editorial-v2.yml`
- Lecteur iPhone : `docs/media/episodes/2026-11-14_south_sudan_elections/VIEWER_V2.html`
- Après run réussi : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/south-sudan-editorial-v2/index.html

### Règles de sûreté
V2 est initialement une **candidate de montage non publiable** ; conserver tous les retours du propriétaire. Aucune approbation artistique implicite. Respect des données géographiques, des sources et des droits de voix et images.
