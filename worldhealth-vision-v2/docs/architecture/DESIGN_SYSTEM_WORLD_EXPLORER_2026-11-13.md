# World Health Vision V2 — identité éditoriale et architecture d'exploration
Version : 13 novembre 2026

## Vision produit

World Health Vision est une plateforme d'exploration, de compréhension et d'aide à la décision sur les pays et régions du monde. Le globe, symbole visuel principal, constitue une porte d'entrée, **pas la totalité du produit**.

L'expérience doit aider les utilisateurs à :

1. **Pays & régions** : trouver une destination, ouvrir une fiche pays, explorer les régions, suivre leurs favoris, comparer des indicateurs avec date et provenance.
2. **Économie & marchés** : comprendre les économies et les taux de change, étudier le pouvoir d'achat et, à terme, observer les indices, actions, obligations, matières premières et autres marchés ; ne jamais afficher de faux prix ni confondre un catalogue et un flux réel.
3. **Voyager & vivre** : préparer un voyage ou une installation, comparer les destinations, les coûts de vie, l'immobilier et la retraite ; identifier explicitement la disponibilité réelle de chaque outil.
4. **Sécurité & vigilance** : rendre compréhensibles les risques par pays, futurs avis officiels aux voyageurs et systèmes d'alertes ; **ne pas présenter de score de sécurité fictif ni d'alertes en temps réel sans connecteur démontré**.
5. **Sources, transparence et personnalisation** : toujours distinguer données officielles, périodes observées, estimations, absence de données, fonctions « à venir » et démos statiques.

## Nouveau système visuel

- **Papier minéral** `#F7F7F3`, surfaces `#FFFEFA`, encre `#1F2928`, vert profond `#244D42`, accent terre cuite `#BC7957`.
- Le **bleu du logo œil/globe** est conservé comme signe distinctif, mais cesse d'être la couleur dominante des fonds, de l'interface ou des fiches.
- Hiérarchie rédactionnelle : message utile, actions concrètes, informations de catalogue, puis globe et outils.
- Menu thématique sur ordinateur, navigation horizontale compacte sur téléphone, grille d'accès rapides, recherche de pays et régions.
- Mise en page responsive, contrôles clavier, focus visibles, fermeture Escape, respect du mouvement réduit.
- Utilisation de modules React existants au lieu d'écrans factices. Les fonctions non opérationnelles sont expliquées, jamais inventées.

## Architecture technique et non-régression

- Travail uniquement sur `worldhealth-vision-v2/frontend/web-v2`, branche dédiée `design/v2-world-explorer-editorial-2026-11-13`; **aucune modification Media Studio, V0 ou V1**.
- `App.tsx` : navigation par domaines et accueil.
- `styles/world-editorial.css` : tokens, shell, menus, globe et panneaux, sans modification de leurs moteurs de données.
- `editorial-smoke.mjs` : tests Chromium iPhone, tablette et ordinateur.
- Préserver les raccourcis « Régions », le menu « Tous les outils » avec Expat & Retraite / Conseiller économique, Sources & Méthodologie, les fiches pays et le vrai globe.
- Conserver le découpage optimisé : ne charger Leaflet qu'à la demande.
- Vérifier après déploiement **l'adresse stable `https://world-health-vision-v2.vercel.app`** et le catalogue national versionné (217 pays/territoires, recherche nationale partielle, Gabon) avec leur étiquette d'aperçu statique.

## Séquencement produit après cette refonte

1. Navigation et identité visuelle uniformes, mesure de chargement et tests visuels sur plusieurs formats.
2. Fiches pays et régions vraiment explorables ; comparaisons, provenance, datation et états d'erreur pédagogiques.
3. Tourisme : itinéraires, alertes réglementaires, comparaison des destinations et budgets, sans prétention de données non disponibles.
4. Marchés : cadrage des flux autorisés, données datées, calendriers, graphes comparables et risques.
5. Sécurité : avis institutionnels nationaux sourcés, dates, niveau de vérification, différences entre risque général et alerte active.
6. Fiabilité continue : accessibilité, Core Web Vitals, contrôle régulier des sources, synchronisation GitHub ↔ Vercel une fois autorisée.

La V2 actuellement accessible sur Vercel demeure un **aperçu frontend statique sans backend national permanent** jusqu'à preuve d'un déploiement réel.
