# World-Vision — RESET VISUEL AVANT TOUTE NOUVELLE IMAGE
**23 novembre 2026 · décision : les 4 dernières images sont rejetées, pas « presque validées ».**
**STATUT : diagnostic et hypothèse UX, aucune maquette approuvée, aucun changement frontend.**

## Reprendre correctement le message de l'utilisateur
Le propriétaire apprécie la progression dans la compréhension de l'écosystème mais dit clairement que les images suivantes conservent **exactement la même structure**, malgré ses demandes : accueil 6 cartes multicolores, page Gabon mêmes six cartes, finances = panneaux + graphiques inventés, voyage = rangées de tuiles. Changer palette et icônes ne constitue pas une vraie refonte. Il exige expressément **de réfléchir et lire sa demande AVANT de générer à nouveau**.

La référence **visuelle éditoriale** du 23/11 `IMG_1604.jpeg` (présente dans la conversation, PAS déposée comme fichier maître dans GitHub) montre du bleu nuit, du blanc, un cyan rare, des titres gras et très lisibles, un document hiérarchisé et des cartes graphiques au service de l'information. **Ce n'est pas une demande de copier la composition TikTok sur une page Atlas.** La référence œil–Terre `144876CC-3A4C-4214-8995-440697A47FC1(3).jpeg` comporte un globe terrestre immense, des frontières très lisibles, 2 arcs ouverts et non un cercle, blanc de la sclère à réduire dans la déclinaison interactive, halo cyan maîtrisé et quelques étoiles. **Ne pas remplacer cette référence par une photographie Apollo découpée, un petit dessin au logo différent ou un globe cartoon.**

### Diagnostic des quatre dernières images (toutes rejetées)
1. **Couleur** : chaque service = bleu, vert, turquoise, violet, jaune/orange; quatre bords néon sur chaque panneau; accent cyan partout. L'effet final ressemble à une page de démonstration de composants, pas à un logiciel mature.
2. **Icônes** : mélange de stickers émoji multicolores, pseudo-pictogrammes 3D et logos ligne; tailles, traits, couleur, densité incohérents.
3. **Architecture** : mêmes six noms en haut et six gros blocs plus bas = gaspillage de hauteur et répétition. Aucune nouvelle manière d'explorer le pays; l'utilisateur voit une mosaïque de catégories, pas sa tâche.
4. **Typographie** : échelle de titres publicitaires, trop de gras/cyan, textes fonctionnels trop petits, écart énorme avec la référence éditoriale; fautes de densité.
5. **Contenu non honnête** : chiffres BVMAC, fluctuations, variations et prix de voyage/loyers inventés en maquette, sans marques `DÉMONSTRATION – VALEURS FICTIVES`; ces valeurs **ne doivent jamais être proposées comme données factuelles**. Les prochains rendus prennent des labels/états et de vrais métadonnées vérifiées, ou choisissent de ne PAS afficher les chiffres. Pas de fausse performance de marchés.
6. **Style systémique** : les mêmes blocs lumineux s'imposent partout; un espace financier professionnel et une fiche géographique n'ont pas besoin du même niveau de densité, mais doivent partager le même design system.
7. **Brand** : petit œil non conforme dans certaines vues; arcs trop éloignés/épais et zones blanches dominantes; la Terre doit être **plus grande, géographique, plus claire** avec limites nationales visibles, et devenir un moteur 3D au moment du code (images seulement des concepts).

## Décision pour la prochaine proposition — TRAVAIL SUR LA COMPOSITION, pas la décoration

### A. Navigation mondiale en deux niveaux, sans répétition

**Header desktop (une ligne, tout à gauche après logo)** :
```
[Œil/World-Vision]  Explorer    Comparer    Services ▾    Suivi       [Recherche universelle........] [FR] [Compte]
```
- **Explorer** : globe, pays, régions et profils.
- **Comparer** : pays, séries, institutions et méthodes.
- **Services ▾** : mega-menu **clair** ouvrant le répertoire des 11 Visions regroupées par cinq/six intentions, mais pas six boutons multicolores déjà répétés dans le hero.
- **Suivi** : Watch, favoris, alertes vérifiées, dossiers suivis (selon permissions).
- Recherche universelle et options à droite; les quatre liens restent groupés à gauche.
- `Outils pro` ne mérite pas un des 4 liens primaires si ses actions sont encore inégales ; accessibles depuis Services et depuis les workspaces, avec états.
- Menus de premier niveau par **tâches** et courts, pas « Argent & marchés » partout si cela a déjà sa place dans le répertoire.
- Sur mobile, ne pas essayer de compresser ces quatre labels dans 375px; marque + recherche + panneau des activités, navigation concise et menu services clair, clavier/focus.

**La barre de navigation globale ne doit PAS devenir le catalogue complet.** Le pays garde son répertoire de services local ET contextualisé : besoin différent, contenu différent.

### B. Accueil — une page immersive, PAS une mosaïque de six cartes
```
┌───────────────────────────────────────────────────────────────────────┐
│  [Marque]  Explorer  Comparer  Services  Suivi              [⌕] [FR] │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Explorer le monde.                        TERRE 3D MAJEURE            │
│  Voir le monde, le comprendre.             arcs œil ouverts/serrés    │
│                                                                       │
│  [Rechercher pays / région / service.....] globe interactif dominant │
│                                                                       │
│  Reprendre une tâche :  Comparer  Monnaie  Voyager   (petites actions)│
│                                                                       │
├───────────────────────────────────────────────────────────────────────┤
│  Découvrir vos possibilités                                        ↗ │
│  [Table des besoins : liste sobre, 2 colonnes] + un volet de         │
│  découverte CONTEXTUELLE pour le besoin choisi; pas six cartes        │
│  colorées, pas six listes de quatre tuiles déjà visibles              │
└───────────────────────────────────────────────────────────────────────┘
```
- La Terre occupe visuellement l'espace principal **sans bandeau de chiffres ou d'actualité au-dessus**.
- Le répertoire des services est un index lisible, **PAS la reproduction des six éléments du header**; une sélection révèle sa profondeur sans multiplier les cadres.
- Beaucoup d'air autour de la Terre et de la recherche; la lumière est une propriété du globe, non du formulaire ou de chaque bordure.

### C. Pays — carte du Gabon d'abord, puis un HUB d'actions, pas une rangée répétée
```
┌───────────────────────────────────────────────────────────────────────┐
│ Monde › Afrique › Gabon                                              │
│ ┌──────────────── Carte géographique du GABON ──────────┐ ┌─────────┐│
│ │ VRAIES limites, relief, villes, zoom, layers,         │ │ GABON   ││
│ │ source geo, pas de photo panoramique                  │ │ capitale││
│ └───────────────────────────────────────────────────────┘ │ actions ││
│                                                          └─────────┘│
│ Pays  |  Données  |  Comparer  |  Services  |  Sources | Actualités    │
├───────────────────────────────┬───────────────────────────────────────┤
│ POUR LE GABON                 │              ESPACE DE TÂCHE          │
│ Comprendre       ↗            │   contenu métier du choix courant     │
│ Argent & marchés ↗            │   repères, graphique sourcé, trajet,  │
│ Voyager & vivre  ↗            │   conversion ou sources documentées   │
│ Acheter & comparer ↗          │                                       │
│ Suivre & s'informer ↗         │                                       │
│ Outils professionnels ↗       │                                       │
├───────────────────────────────┴───────────────────────────────────────┤
│ Tous les services / 11 Visions : entrée explicite + état de couverture│
└───────────────────────────────────────────────────────────────────────┘
```
- Le panneau à gauche devient une navigation **contextuelle permanente** sur desktop, pas six grosses cartes uniformes; les services sont tous visibles avec progression vers leurs fonctions.
- La zone de contenu à droite devient véritablement utile : choisir `Money` expose l'outil FX sourcé, `Transport` demande origine/dates, `Comparer` affiche des séries et leurs définitions, `Sources` les preuves.
- Sur mobile : carte du pays, nom/faits non redondants, 3–4 actions fréquentes, index des six familles sous forme de **lignes compactes explicites**, puis contenu; pas six couleurs ni un scroll interminable de tuiles.
- Les six rubriques historiques `Vue d'ensemble / Données / Comparer / Sources / Actualités / Services` ne sont PAS 6 grandes icônes au-dessus d'un autre répertoire identique. Distinguer clairement **navigation de contenu** et **annuaire des outils**.

### D. Workspaces : interfaces vraiment différentes selon métier
- Argent / marchés : graphes/tableaux réels avec source et année, densité d'analyste, plus de gigantesque fond planétaire derrière tous les chiffres. Pas de fake taux/variations BVMAC.
- Voyager : **formulaire de tâche** (origine, destination, date, mode) avec carte de destination et sources officielles; pas un collage de photo de vacances + prix inventés.
- Prix/Panier : choix ville/commerce/produits, état de couverture authentique.
- Watch/Radar : filtres, sources et dernières vérifications; actualités datées dans leur rubrique, pas sur l'hero du pays.

## Design tokens — PROPOSITION limitée issue des références, non approuvée

- Couleurs de base : 1 marine presque noir, 1 marine de surface, 1 couleur texte blanc, 1 couleur texte secondaire. **Cyan = accent unique** (sélection, focus, actions); vert/rouge = statut sémantique seulement dans des graphiques professionnels. **Supprimer** les six palettes de catégories et les six halos de néon.
- Bordures et ombres : hairlines neutres et surfaces à niveaux, très peu de glow; les arcs du globe peuvent rayonner, pas les cartes UI.
- Typographie : retrouver le **poids, les proportions et la clarté** de `IMG_1604.jpeg`. 2 niveaux : affichage d'identité/lieu plus fort, textes d'interface légers, lisibles, avec métriques tabulaires. `DM Sans` est la police media de sous-titres déjà retenue mais **ne suffit pas à décréter la fonte UI officielle**; tester comparativement les vraies polices sans en inventer la validation.
- Iconographie : **Lucide SVG homogène**, taille normalisée 20/24 px, stroke 1.75–2 (à tester optiquement), monochrome blanc / gris, cyan seulement sur actif, labels texte obligatoires pour actions ambiguës. AUCUN sticker emoji/3D dans les menus; les drapeaux et émojis géographiques peuvent rester des contenus sémantiques si appropriés. La forme de l'œil/logo reste un actif de marque à part, pas une icône générique Lucide.
- Références recherchées le 23/11 : https://lucide.dev/ ; https://lucide.dev/guide/react/ ; https://www.nngroup.com/articles/progressive-disclosure/ ; https://www.nngroup.com/articles/local-navigation/ . On emprunte le **système**, pas le branding ChatGPT.

## Gates AVANT toute image générée
1. Reprendre **la mise en page** à partir de ce document, pas l'ancienne image comme image principale de référence de composition. Les screenshots rejetés peuvent être employés uniquement comme **anti-références** pour supprimer les défauts.
2. Faire d'abord un **wireframe basse fidélité** de l'accueil et du HUB Gabon, avec placement, libellés, contenu réel ou états honnêtes et interactions explicites. Relecture interne de la répétition nav/catalogue et des espacements.
3. Vérifier inventaire 11 Visions + 20 modules (JSON dans `country-hub-capability-blueprint.v1.json`), contextualité Gabon/CEMAC/BVMAC, transit origine/dates et sous-outils.
4. Conserver **le vrai master œil–Terre fourni** comme seule référence du globe, pas les glows disproportionnés des images rejetées; scène 3D future, photo non acceptable comme carte interactive.
5. Générer au plus **deux écrans franchement différents** lors de la prochaine itération : un accueil qui n'a PAS six colonnes de cartes et un HUB Gabon avec navigation latérale des besoins + surface de tâche. N'ajouter argent/voyage qu'une fois le système commun éprouvé.
6. Rejeter immédiatement tout rendu : six couleurs de catégories, 6 boutons de header répétés en 6 cartes, faux chiffres, gros bord néon autour de chaque module, typographie trop promotionnelle, icônes de styles différents, photo en tête de fiche pays.
7. Validation esthétique du propriétaire reste un **GO distinct** des tests et du code. Pas de promotion ou merge production.

## Continuité, périmètre et prochain chantier
- Base : PR DRAFT #149 `design/world-vision-experience-system-v1-2026-11-23` empilée sur PR #148 ; les maquettes historiques sont archivées et **non validées**. Aucun changement de marque, image, CSS de production ou données métiers dans cette décision.
- Documents croisés : `docs/design/README.md`; `WORLD_VISION_COUNTRY_HUB_AND_GLOBAL_IA_2026-11-23.md` (invariants métier) ; `country-hub-capability-blueprint.v1.json` (11 Visions + 20 outils) ; `docs/product/STRATEGIE_INTERNATIONALE_WORLD_VISION_MASTER_2026-11-19.md`.
- Dans un nouveau chat, lire **CE RESET** avant les maquettes A/B/C ou la vague d'images couleur. Demander validation de l'expérience, non pas du seul dégradé.
