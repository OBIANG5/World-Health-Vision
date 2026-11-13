# WORLD-VISION — Jalon 0 : audit du logo avant toute nouvelle vidéo

**Date :** 13 novembre 2026  
**Statut :** BLOQUÉ — la version multicolore approuvée n'est pas présente sous forme de fichier dans les sources accessibles examinées.  
**Référence qualité :** [refus du pilote COP31, note générale 1/10](https://github.com/OBIANG5/World-Health-Vision/issues/9).

## Vérifications effectuées

1. Le dépôt GitHub contient une image historique à `frontend/web/src/assets/logo.png`, représentant l'œil et le globe en **bleu monochrome**. Elle ne convient pas comme logo final de la nouvelle identité média.
2. Un fichier Google Drive `Logo_WorldHealth-Vision5.png` a été retrouvé et visualisé (919 786 octets). Il représente lui aussi la version bleue historique. Ce fichier ne doit pas être réutilisé comme validation de la nouvelle charte.
3. L'historique de conception du 12 novembre 2026 établit la contrainte impérative : **conserver exactement la silhouette œil + globe historique**, avec une nouvelle colorisation **multicolore représentant la diversité du monde**. Une variante colorisée a été appréciée après ajustement de la répartition des couleurs.
4. Le fichier binaire exact de cette dernière variante approuvée n'a pas encore été localisé dans le dépôt, dans les résultats disponibles de Google Drive ni dans les éléments récupérables de l'historique. Une description ne suffit pas à restaurer les pixels ou la géométrie au pixel près.

## Ce qu'il ne faut plus faire

- Ne pas dessiner une variante arbitraire du logo avec SVG ou image générée en se faisant passer pour le fichier validé.
- Ne pas prendre le logo historique bleu pour le nouveau logo officiel.
- Ne pas ajouter de fantaisies visuelles : pas de peinture ou éclats dorés, pas de plans sombres et vides, pas de faux éléments de diffusion technique dans les vidéos.
- Ne pas assembler ou publier un nouveau reportage tant que les bases visuelles ne sont pas réellement validées.

## Étape concrète à réaliser après réception du fichier officiel

1. Copier **l'image originale complète**, avec sa provenance et son SHA-256, dans un chemin versionné explicite sous `worldhealth-vision-v2/frontend/web-v2/public/brand/`.
2. **Montrer cette image d'origine, non altérée** sur la page mobile « Identité & logo » comme référence. Ne pas modifier ses couleurs, sa silhouette ni sa disposition.
3. Réaliser une **planche de charte** avec le véritable logo sur fond clair et foncé, une signature typographique réutilisable et un premier exemple de cartouche d'actualité, sans faux textes techniques dans la vidéo.
4. Soumettre cette seule planche à une notation 1–10 avec possibilité de blocage, et enregistrer l'avis lié à la version et au fichier par hash.
5. Après validation positive, définir les variables de design, puis réaliser seulement **un plan animé de 3–6 secondes** pour validation séparée, sans rendu complet.

## Lien de production

Le site permanent conserve la branche `whv-media-studio-browser-preview`, et les travaux applicatifs restent dans `feature/world-vision-media-studio`.

**La vraie validation G0 ne pourra pas être prononcée tant que la copie officielle multicolore n'est pas retrouvée.** Aucun résultat CI ou score artificiel ne doit suppléer cette preuve.
