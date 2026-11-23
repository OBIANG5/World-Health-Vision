# WIREFRAMES WORLD-VISION — RÉEL CHANGEMENT DE COMPOSITION
**23 novembre 2026 · proposition v2 à éprouver, AUCUNE validation graphique du propriétaire.**
**À lire APRÈS** `VISUAL_RESET_BEFORE_IMAGES_2026-11-23.md`, `WORLD_VISION_COUNTRY_HUB_AND_GLOBAL_IA_2026-11-23.md`, `country-hub-capability-blueprint.v1.json`.

## Pourquoi les précédentes maquettes sont rejetées
La répétition `six catégories dans le header → six grosses cartes juste après` encombre l'écran, ajoute du texte et cache le chemin vers une action. Les scènes financières et touristiques réutilisent un modèle de mosaïque décorative plutôt que le véritable flux de travail. Les emojis/stickers sont hétérogènes et les couleurs trop nombreuses. **Ces wireframes changent LES PARCOURS ET LES PLACEMENTS**, pas seulement la peinture.

## I. Header DESKTOP — 4 décisions, pas 11 familles
```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ [œil–Terre] World-Vision   Explorer   Comparer   Services⌄   Suivi       ⌕ FR │
└─────────────────────────────────────────────────────────────────────────────┘
```
- **Explorer** ouvre l'Atlas, le globe, les pays/régions et une recherche géographique.
- **Comparer** ouvre comparaison pays/indicateurs/méthodes, plutôt que cacher Comparer dans `Données & comparer`.
- **Services⌄** ouvre **UN** mega-menu (non une nouvelle page de six gros carrés) : une colonne de besoins/Visions et une colonne de fonctionnalités concrètes adaptées au choix. Les 11 Visions et outils transversaux restent découvrables, leurs états distingués. Le mot `Services` annonce un menu par un chevron; le clic peut également ouvrir l'annuaire complet.
- **Suivi** ouvre favoris, Watch, alertes, Radar et dossiers suivis si fonctionnels. Sinon indicateur explicite de statut; ne pas afficher une fausse cloche de notifications non connectée.
- **À droite** : recherche universelle, langue, paramètres/compte seulement si un profil vrai existe. Pas de doublon `Explorer` et `Comprendre le pays` au même niveau.
- Interactions desktop : ouverture **au clic et au clavier**, et non exclusivement au survol (éviter les ouvertures accidentelles et assurer clavier/tactile); fermeture avec Échap/clic extérieur, focus visible et retour au bouton d'origine; sur mobile navigation courte et recherche prioritaire.
- **Icônes** : texte premier; un pictogramme simple seulement lorsque nécessaire, de même famille (Lucide SVG, 20/24 px, stroke cohérent, monochrome). Ne pas rajouter un pictogramme avant chacun des quatre labels simplement pour décorer.

## II. ÉCRAN 1 — HOME desktop 1440 : globe + recherche, PAS 6 cartes dans le premier écran
```text
╭──────────────────────────────────────────────────────────────────────────────╮
│ WORLD-VISION      Explorer  Comparer  Services⌄  Suivi        [⌕ Recherche] FR│
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│     Voir le monde, le comprendre.               ┌─────────────────────────┐  │
│                                                 │ ŒIL–TERRE              │  │
│     Explorez un pays, ses faits,                 │ globe LARGE 3D futur   │  │
│     ses sources et les actions utiles.           │ arcs ouverts discrets  │  │
│                                                 │ frontières lisibles    │  │
│     [⌕ Pays, région, donnée, service…]           │ interactions pays      │  │
│                                                 └─────────────────────────┘  │
│     Comparer  ·  Monnaie  ·  Voyager  (liens sobres, pas 3 cartes néon)        │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ Explorer les services                                  [Voir l'annuaire →] │
│                                                                              │
│ Besoin (liste discrète)      │ Détails du besoin choisi                     │
│ > Comprendre                 │ Pays, régions, indicateurs et sources         │
│   Argent & marchés           │  • Explorer le Gabon                          │
│   Voyager & vivre            │  • Consulter les données et périodes         │
│   Acheter & comparer         │  • Comparer des organismes                    │
│   Suivre et s'informer       │  • Ouvrir la carte de la région                │
│   Outils professionnels      │  États réels affichés à proximité des liens   │
╰──────────────────────────────────────────────────────────────────────────────╯
```
**Décision non cosmétique** : le répertoire en dessous n'est PAS six copies du menu; `Services` est le menu primaire, mais ici on explore une demande et **une seule colonne de contenus s'adapte**. Pas de carrousel forçant des choix de produits, pas de chiffres artificiels, pas de 11 cartes à même hauteur. Le globe ne doit pas cacher l'usage recherche.

**Œil–Terre** : conserver image originale fournie en référence de composition (pas remplacer par Apollo). Terre large et détaillée, arcs ouverts RAPPROCHÉS, intérieur blanc **moins envahissant**, continents/côtes/frontières très lisibles, quelques étoiles, fond spatial discret. Une **image concept** ne fournit pas interaction globe; la version cible sera globe 3D réel et carte multi-LOD.

## III. ÉCRAN 2 — PAYS desktop 1440 : CARTE + liste de besoins à gauche + une tâche active à droite
```text
╭──────────────────────────────────────────────────────────────────────────────╮
│ [marque]    Explorer  Comparer  Services⌄  Suivi      [⌕ Rechercher…]    FR  │
├──────────────────────────────────────────────────────────────────────────────┤
│ Monde  ›  Afrique  ›  Afrique centrale  ›  Gabon                           │
│                                                                              │
│ ┌────────── CARTE GÉOGRAPHIQUE RÉELLE DU GABON ───────┐ ┌────────────────┐  │
│ │ côtes / frontières / relief / villes documentées    │ │ Gabon  🇬🇦      │  │
│ │ Libreville (vraie position) · zoom, couches          │ │ Libreville     │  │
│ │ données géoréférencées et sources attribuées         │ │ XAF · CEMAC    │  │
│ └──────────────────────────────────────────────────────┘ │ Suivre / retour│  │
│                                                         └────────────────┘  │
│                                                                              │
│ Fiche    Carte    Données    Comparer    Services    Sources    Actualités   │
├──────────────────────────────┬───────────────────────────────────────────────┤
│ POUR LE GABON                │ VOTRE TÂCHE                                   │
│                              │                                               │
│ > Comprendre                │ « Comprendre le Gabon »                        │
│   Argent & marchés           │ Faits essentiels non dupliqués                │
│   Voyager & vivre            │ Séries publiables et provenance, si dispo.   │
│   Acheter & comparer         │ [Ouvrir les indicateurs]  [Comparer]          │
│   Suivre & s'informer        │                                               │
│   Outils pro                 │ Actions contextuelles sous la section        │
│                              │                                               │
│ [11 Visions accessibles]     │ État des services: OK / partiel / prévu       │
└──────────────────────────────┴───────────────────────────────────────────────┘
```
**Changement d'architecture** : la liste des besoins est un **sommaire fonctionnel**, et la zone de droite affiche un **vrai contenu de tâche**, non un autre ensemble de six cartes qui répète la liste. L'état n'est pas déduit d'une simple catégorie (pays ≠ magasin ≠ origine d'un trajet). Les 11 Visions restent listées dans le sommaire/annuaire; les 20 sous-actions apparaissent dans la tâche de la Vision sélectionnée, pas toutes en cartes concurrentes.

**Choix d'un besoin** :
- `Argent & marchés` → FX XAF daté si source disponible, analyses selon droits, accès Trading global et place régionale pertinente BVMAC/CEMAC, **pas BRVM locale du Gabon**, aucun cours fictif.
- `Voyager & vivre` → écran de saisie réelle `Vers : Gabon`, `Depuis : à choisir`, `Dates : à choisir`, transports/hôtels selon fournisseurs, pas « billet disponible » inventé.
- `Acheter & comparer` → demande ville/magasin/produit, ne prétend pas avoir tous les prix nationaux.
- `Suivre & s'informer` → Watch/favoris/alertes selon persistance, Radar et actualités DATÉES, mais jamais en premier contenu du pays.
- `Outils pro` → exports sous droits, sources/méthodes, comparaisons et services B2B si réellement présents.
- `Comprendre` → carte/territoire, statistiques, institutions, données de santé, gouvernance, recettes et méthode.

## IV. MOBILE 390 / 320 : pas un desktop comprimé
```text
┌────────────────────────────────────┐
│ [œil] World-Vision      ⌕  ⋮       │
│ ← Monde / Afrique / Gabon          │
│ ┌──── CARTE DU GABON RÉELLE ────┐  │
│ │  relief, provinces*, villes*  │  │
│ └───────────────────────────────┘  │
│ GABON 🇬🇦                         │
│ Libreville · XAF                  │
│                                    │
│ [Données]    [Comparer]             │
│ [Monnaie]    [Voyager]              │
│                                    │
│ Tous les services du Gabon         │
│ Comprendre                    ›    │
│ Argent & marchés              ›    │
│ Voyager & vivre               ›    │
│ Acheter & comparer            ›    │
│ Suivre & s'informer           ›    │
│ Outils professionnels         ›    │
│                                    │
│ [CONTENU DE LA CATÉGORIE CHOISIE]  │
│ …                                  │
└────────────────────────────────────┘
```
*Provinces/villes seulement selon données géométriques sourcées et droits.* Les flèches de besoins ouvrent des sections **dans la même page ou un workspace clairement indiqué**, pas de fausse navigation ni un menu répétant les mêmes listes.

## V. Kit d'icônes : spécification professionnelle (pas stickers)
- Iconographie de travail : **Lucide line SVG**, possible avec `lucide-react` dans le vrai React après vérification des dépendances. Exemples de noms : `globe-2` ou `earth` pour Explorer; `git-compare-arrows` pour Comparer; `grid-2x2` pour Services; `bookmark` pour Suivi; `arrow-left-right` pour Monnaie; `plane` pour Voyager; `shopping-basket` pour Panier; `chart-no-axes-combined` pour Marchés. S'assurer des noms dans la version choisie (pas de noms inventés).
- Monochrome gris clair ou blanc, cyan pour **état actif seulement**, taille 20–24 px selon conteneur, trait optiquement constant; style cohérent avec les contrôles classiques de ChatGPT sans présenter ces icônes comme propriété ou actifs officiels d'OpenAI. Icônes vectorielles autorisées via la licence de la bibliothèque, distinctes du logo World-Vision.
- Test : icônes conservant le sens à 16 px + label clair; elles ne remplacent pas un texte d'action accessible.

## VI. Typographie & couleurs ancrées à l'éditorial validé
- La charte utilisateur `IMG_1604.jpeg` donne une **hiérarchie** : titre gras et dense, corps lisible, peu d'accents cyan, bleu nuit/bleu en surface, blanc. **Ne pas importer le bandeau urgent TikTok et ses énormes capitales** dans une interface Atlas.
- Une seule famille sans serif professionnelle comme hypothèse (étudier sa graisse et ses courbes à partir du vrai logo et des contrastes); choix de police exact **NON VALIDÉ**. Tester les noms de pays longs, accents et chiffres tabulaires. À taille 390, aucune information fonctionnelle capitale en 9 px.
- Palette système limitée : navy quasi noir, surface navy, blanc, gris de lecture, cyan ponctuel. Couleurs naturelles uniquement dans la géographie. Vert/rouge en sémantique réelle des données (pas par catégorie). AUCUN néon autour de toutes les cartes.
- Lumière : réservée au signe œil–Terre, pas aux lignes de données ou aux menus.

## VII. Critères d'échec sans négociation
1. Header à six familles ET six grandes cartes du même nom = rejet.
2. Visuel au-dessus de la fiche pays autre qu'une géographie cartographique Gabon = rejet.
3. Icônes stickers multicolores / 3D de styles mélangés = rejet.
4. Plus d'une couleur d'accent décorative = rejet.
5. Un espace de travail `Finance` qui n'est qu'une mosaïque « brillant mais faux chiffres » = rejet.
6. Un espace `Voyage` sans vrai formulaire origine/dates = rejet.
7. Carte/blanc/halo qui nuit à la lisibilité de la planète = rejet.
8. Six familles sans liste vérifiable des 11 Visions et statuts = rejet.
9. Compte et action de réservations présentés comme connectés alors qu'ils ne le sont pas = rejet.
10. Confusion entre absence de données dans un territoire et disparition d'un produit = rejet.

## VIII. Ordre de la suite
1. Tester la logique de navigation du wireframe avec tâches, iPhone 320/390 et desktop, avant image.
2. Deux images de révision **seulement après** contrôle des critères I–VII : nouvelle home et nouveau Hub Gabon. Les prévisualisations antérieures servent d'anti-références, jamais de layout source.
3. Si le résultat passe la revue graphique humaine, maquette détaillée des vues Money/Travel/Markets dans la même charte, mais des workspaces réellement adaptés à chacun.
4. Choix d'un moteur géographique par POC réel (MapLibre/Cesium/baseline) et sources géométriques/licences, puis migration progressive du vrai frontend sur branche isolée.
5. Aucun changement production, aucun merge d'une identité refusée. Conserver PR #149 en DRAFT.

**Ce fichier est un wireframe textuel contrôlable, pas une preuve d'esthétique approuvée ni une interface fonctionnelle.**
