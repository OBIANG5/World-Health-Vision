# World-Vision — conception du logiciel V2 (point d'entrée à jour)

> **CORRECTION DU 23/11/2026 APRÈS REJET EXPLICITE DES IMAGES :** lire en priorité **[RESET VISUEL AVANT TOUTE NOUVELLE IMAGE](VISUAL_RESET_BEFORE_IMAGES_2026-11-23.md)**. Les quatre visuels néon multicolores et la même grille de six services ont été rejetés. NE PAS générer de nouvelles captures à partir des précédentes. Reconstruire d'abord l'information, la navigation, l'iconographie monochrome, les surfaces et le parcours pays. Le canon métier pays/services reste valable, mais les dispositions visuelles antérieures ne sont plus la cible.

**Dernière correction de vision : 23 novembre 2026. Aucune direction graphique finale n'est encore approuvée.**

## À LIRE EN PREMIER

**[1. L'œil–Terre, la fiche pays cartographique et tous les services — architecture actuelle proposée](WORLD_VISION_COUNTRY_HUB_AND_GLOBAL_IA_2026-11-23.md)**

Ce document répond au retour utilisateur sur les anciennes maquettes :
- **le globe n'est pas une photo NASA, mais doit s'approcher de la référence œil+Terre originale** (référence fichier conversation SHA256 `63bc6d7d61c7b4cbec05f642382f4cc4f1d2099943dc70d36a240c8ded9a24d4`; **le binaire original n'est pas dans le dépôt**);
- la fiche Gabon commence avec **une vraie carte géographique du Gabon**, non une photo de Libreville ;
- la fiche pays donne accès aux **11 Visions du projet** ainsi qu'aux outils existants, contextuellement, en signalant exactement ce qui marche ou manque ;
- les Visions restent accessibles dans leurs espaces experts globaux ;
- actualité et Média ne prennent jamais la tête de la fiche pays ; droits, preuves et données non fabriquées sont transversaux ;
- l'utilisateur attend la **découvrabilité, l'affordance, la hiérarchie visuelle et une navigation simple**, pas seulement de plus jolies cartes.

**[2. Contrat structuré du répertoire de capacités — 11 Visions + 20 sous-fonctions](country-hub-capability-blueprint.v1.json)**

**[3. Canon antérieur (à lire comme historique, parties A/B/C désormais dépassées)](WORLD_VISION_EXPERIENCE_CANON_2026-11-23.md)**

## État exact des livrables

- Le **design d'architecture** est documenté et vérifiable; il **n'est pas une nouvelle UI déployée**.
- Les **anciennes compositions A/B/C** appartiennent au laboratoire `frontend/web-v2/public/vision-lab/index.html`. Elles sont conservées comme tests comparatifs historiques, **NON VALIDÉES**. La photographie du globe et la photo de haut de fiche pays sont explicitement rejetées comme direction actuelle.
- Les contrôles `frontend/web-v2/scripts/design-country-hub-contract.test.mjs` garantissent que les 11 Visions existantes et certains panneaux historiques sont bien inscrits; ils ne prouvent **ni la disponibilité réelle d'une source, ni la qualité artistique**.
- PR **#149 DRAFT** à partir de PR #148, branche `design/world-vision-experience-system-v1-2026-11-23`. Production et code métier V2 non modifiés par ce travail documentaire. Voir [PR #149](https://github.com/OBIANG5/World-Health-Vision/pull/149) pour le SHA, les contrôles et la reprise après interruption.

## Ordre de reprise

1. Lire la correction **ici** avant une quelconque version A/B/C ou une inspiration extérieure.
2. Lire `docs/product/STRATEGIE_INTERNATIONALE_WORLD_VISION_MASTER_2026-11-19.md`, `docs/product/WORLD_VISION_REORGANISATION_FONCTIONNELLE_ET_UX_2026-11-19.md`, `frontend/web-v2/src/product/visionProducts.ts`, et issue #145.
3. Vérifier le HEAD GitHub, les CI du HEAD, et les restrictions de la preview. Aucun merge autorisé sans GO.
4. Étape **GEO-1** : cartographie réelle Gabon et globe fidèle à la référence, mobile et desktop, avec toutes les Visions visibles selon le registre; ne pas coder 31 cartes égales.
5. Étape **HUB-1** : construire le `CapabilityRegistry` typé partagé avec le CountryPage et tous les workspaces, et le `CoverageResolver` authentique par pays, avant refonte globale des CSS.
6. Étape **FRONT-1** : un seul parcours authentique cohérent `Terre → Gabon → services → données/sources → comparer/retour`, tests et mesure visuelle/mobile. Ne pas laisser le prototype remplacer des fonctionnalités existantes.
