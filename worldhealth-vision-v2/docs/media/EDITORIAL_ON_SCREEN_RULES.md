# World-Vision — Règle éditoriale : clean plates obligatoires

**Décision du 14 novembre 2026, valable pour tous les clips et masters.**

## À l'écran uniquement
Le logo G0 original, les lieux et dates de l'actualité, des titres journalistiques utiles, les vrais sous-titres après synchronisation à une voix française approuvée. La légende « ARCHIVES · PRAGUE · 8 AVRIL 2010 » est justifiée par la nature historique de la photo et ne doit pas être confondue avec une vidéo du sommet futur.

## Jamais dans les pixels exportés
Prévisualisation; Preview; Sans voix; QA; Test; V1/V2/V3; numéros de séquences techniques; Archives & motion design; Motion design; S04 / 07,9 s; état de pipeline; provenance technique; watermark de test; noms de fichiers; identifiants de workflow; durée de l'extrait et dates de fabrication purement internes.

**Ces éléments vont dans les manifestes JSON, le journal de production, les pages de prévisualisation et les fichiers de métadonnées, jamais dans les MP4.** Le crédit de la photographie historique Chuck Kennedy / Maison-Blanche est conservé dans les métadonnées et la légende destinée à accompagner la publication.

Une erreur est définitive lorsqu'un texte est incrusté à la génération : ne jamais compter sur le montage final pour l'effacer. Chaque segment doit être une clean plate.

## Typographie
Polices professionnelles librement utilisables uniquement, Manrope Variable pour S04 V3. Police OFL Google Fonts authentifiée par SHA-256 d0639be45d0af36e798172419d7bd173c4bd4f29e2b76cbb69db1d11bf8b0a40. Titres en graisse 800 et texte d'accompagnement en 500. Couleurs World-Vision bleu nuit, cyan et blanc. Pas de DejaVu, d'emoji ni de police de substitution silencieuse.

## Contrôles
La CI appelle scripts/guard_on_screen_copy.py pour rejeter les mentions opérationnelles passées aux fonctions de dessin. Le test summit-2026-contract.test.mjs vérifie l'absence de watermark de preview sur le master Remotion. Six photogrammes distincts sont extraits pour contrôle réel. Toute V3 a besoin de validation artistique avant montage définitif.

## Versionnement
S04 V1/V2 restent pour preuve historique mais sont interdites au master en raison des textes techniques. S04 V3 est la nouvelle candidate quand son rendu a passé les tests. Ni voix définitive ni master 43s à ce stade.
