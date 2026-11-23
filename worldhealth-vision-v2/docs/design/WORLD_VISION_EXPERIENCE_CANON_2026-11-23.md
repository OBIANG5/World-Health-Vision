# WORLD-VISION — CANON DE CONCEPTION PRODUIT & DIRECTION ARTISTIQUE
**Version : 0.1 — CANDIDAT NON VALIDÉ par le propriétaire · 23 novembre 2026**
**Statut : étude de conception, PAS cahier graphique final approuvé, PAS preuve d'un produit déployé.**

> Ce document est le point d'entrée artistique unique **proposé**. Les documents métier de référence restent dans `docs/product/`, avec les corrections de priorités #117, #133, #145. Ne jamais supprimer une fonction parce qu'elle ne rentre pas dans une maquette. Toute décision prise plus tard doit être historisée en ADR et inscrite ici, avec date, propriétaire et preuve visuelle. La validation esthétique du propriétaire n'est **pas encore accordée**.

## 0. Le problème que cette étape résout

Le logiciel V2 a déjà du code pertinent (GlobeMap, CountryDrawer, Source Evidence, Timeseries, Trading en branche séparée) mais n'a jamais possédé une direction artistique système. Le frontend additionne `eye.css` et `mobile.css` (sombre), `world-editorial.css` (papier/vert/terracotta), `world-electric.css` (cyan/bleu), `country-editorial.css` (patchs). Un écran peut compiler et réussir Playwright tout en demeurant laid, surchargé, contradictoire ou trompeur. **Interdiction de traiter ce constat comme une invitation à ajouter une sixième couche CSS.**

Autre défaut objectif : `EyeLayout.tsx` redessine un logo SVG proche mais différent de l'actif officiel souhaité. Le globe `GlobeMap.tsx` dessine une orthographique Canvas 2D avec polygones colorés; rotation et sélection sont fonctionnelles, mais l'ambition esthétique du globe atmosphérique détaillé n'est pas réalisée. Des panneaux latéraux de données concurrencent la homepage sous-jacente; la capitale est répétée dans l'en-tête et les cartes; des libellés World Bank restent anglais en FR. La carte d'un pays est davantage un panneau technique qu'une expérience géographique aboutie.

## 1. Source de vérité : qu'est-ce que World-Vision, sans copier une référence externe ?

**Promesse : « Voir le monde, le comprendre ».**
World-Vision est une **interface mondiale de compréhension et d'action** : on part d'un lieu, d'un fait, d'une donnée ou d'un besoin; on accède aux différents points de vue et aux preuves; puis on compare, suit ou agit avec des outils réels. Ce n'est ni uniquement un média, ni un moteur de rendu de cartes, ni un terminal boursier, ni un chatbot, ni onze dashboards indépendants. Le Média est un consommateur distinct du Core, pas le contenu primaire de la fiche Atlas.

### Les principes non négociables et leurs conséquences VISUELLES

| Principe du produit | Décision de conception |
| --- | --- |
| La Terre est notre repère commun | Globe œil-Terre **distinctif et authentique**, central pour découvrir le monde, toujours utilisable pour choisir un pays; pas un GIF de décoration ou une photo satellite non cliquable |
| Un pays est une entité complète | Son identité, sa géographie, ses repères, ses cartes, ses données et outils précèdent l'actualité. **Actualités = une rubrique optionnelle de même niveau que les autres** (#145 corrigé) |
| Plusieurs sources, jamais une vérité imposée | Chaque chiffre important donne une manière d'accéder à la période, l'unité, l'organisme, la méthode et aux éventuelles divergences; une source cataloguée n'est pas une source exploitée |
| Voir puis approfondir | Architecture à **divulgation progressive** : au premier regard, orientation et 3–5 actions pertinentes; au deuxième, données/graphique; au troisième, sources/méthodes et versions. Pas de mur de textes, pas de chiffres faux |
| Les Visions partagent le même Core | Un **contexte pays/zone/date** durable relie Atlas ↔ Données ↔ Sources ↔ Marchés ↔ Money ↔ Voyage ↔ Watch. Les verticales peuvent avoir des outils experts différents sans changer la marque |
| L'international signifie diversité réelle | Pays, territoires disputés, organismes locaux, monnaies/fuseaux, formats, langues, bas débit et accessibilité; ne pas définir l'Afrique exclusivement par l'Europe ou une source unique |
| Une action doit fonctionner | Une entrée menant vers un outil non disponible doit être distinguée d'une action fonctionnelle. Jamais de 11 promesses cliquables vides, de faux cours ou de faux voyages |
| Une expérience excellente est aussi rapide | Stabilité 320 px–desktop, navigation clavier, préférences motion, contrastes et temps d'affichage mesurés; images et cartes délivrées par budgets de poids et cache contrôlé |

### Positionnement émotionnel
**Émerveillement à l'entrée** (le monde semble vivant, sans cartoon) + **calme éditorial dans la lecture** (l'information inspire confiance) + **précision dans les outils experts** (Trading, BRVM, calendrier, comparaisons). L'émerveillement ne doit jamais noyer un chiffre ou une action.

## 2. Marque : éléments acquis et éléments encore À VALIDER

**À préserver (décisions du propriétaire)** : nom **World-Vision**; slogan **« Voir le monde, le comprendre »**; symbole **œil et globe**; deux **arcs extérieurs ouverts et blancs**, sclère blanche très lumineuse, Terre centrée, frontières de pays visibles, couche atmosphérique claire, nuages subtils, étoiles très discrètes, **aucun soleil**, pas de cercle fermé autour de l'œil. La Terre doit être riche et non une icône géométrique enfantine.

**Écart du code** : l'SVG hardcodé dans `EyeLayout.tsx` et le dessin Canvas dans `GlobeMap.tsx` n'expriment pas le même symbole. C'est une **dette critique de marque**, non un détail typographique.

**Direction chromatique CANDIDATE** : bleu océan et nuit profonde pour la Terre, cyan pour l'énergie et la sélection, blanc presque pur pour la lisibilité, couleurs géographiques terrestres fidèles à la réalité; couleurs sémantiques d'état uniquement selon le sens. Le blanc/minéral peut prendre la majorité de l'espace de lecture; le bleu nuit peut soutenir la scène du globe et les outils de marchés. Éviter le kit générique « grosse bordure + fond gris + douze cartes ».

**À ne PAS figer sans maquettes comparatives** : valeurs hexadécimales exactes, poids de police, rayons, photométrie de la Terre, composition du logo, placement de la recherche et tous les comportements de transition. Les tokens du prototype ne sont pas le design system final.

## 3. Parcours coeur commun : le test artistique doit prouver l'utilité

**Parcours de référence à montrer dans chaque piste** : (A) accueil World-Vision → (B) explorer la Terre / rechercher Gabon → (C) fiche Gabon vue d'ensemble **géographie d'abord** → (D) économie et indicateur avec période/méthode → (E) comparer pays et confronter les sources → (F) revenir au Gabon et ouvrir Money, Marchés ou Voyages sans perdre le contexte. L'actualité est accessible en rubrique mais jamais insérée avant la vue pays.

**Parcours mobile** : une seule orientation lisible à chaque instant; la page de pays doit pouvoir devenir **une vraie page navigable**, pas toujours un tiroir compressant les données dans 380 px. Les outils complexes se chargent à la demande, pas tous simultanément en sous-panneaux.

**Parcours desktop** : deux modes complémentaires : exploration immersive (globe visible, recherche) et lecture / analyse (surface généreuse, graphique, tableau, contexte de carte secondaire). À la sélection d'un pays, **la page pays doit remplacer la grande publicité d'accueil**, pas afficher les deux côte à côte comme aujourd'hui. Navigation de retour claire.

## 4. Trois COMPOSITIONS à tester sous UNE SEULE marque (pas trois logos/palettes arbitraires)

Toutes les pistes doivent conserver le même produit, les mêmes fonctions, les mêmes états de données et le même signe œil-Terre. Ce ne sont pas des « variantes déco » : elles testent des hiérarchies différentes.

### Piste A — « Atlas vivant » (HYPOTHÈSE FAVORITE POUR ÉVALUATION)
- Accueil : grand espace cartographique immersif avec Terre photoréaliste navigable; recherche mondiale nette et deux actions de départ visibles; accès tranquille aux univers du Core.
- Page pays : entrée géographique avec photo/licence réelle et localisation, puis large **surface documentaire** blanche, sources dans les détails et rubriques données/comparer/actualités/services. La carte est un contexte déplaçable, **pas la couverture d'un article média**.
- Expert : la même structure de navigation, mais les graphiques, frises et outils dominent, pas la grande photo. Une variation de densité, pas une nouvelle marque.
- Risque à tester : la Terre peut monopoliser l'écran et nuire au temps d'accès au pays et aux tâches répétitives. Prévoir mode rapide / retour / recherche toujours visibles.

### Piste B — « Atlas documentaire »
- Accueil : surface d'exploration claire, carte et recherche côte à côte avec un accès immédiat aux domaines. Le globe apparaît dans une grande fenêtre active, mais pas en plein écran.
- Page pays : identité, repères, cartographie et données comme dossier de référence, tables et graphiques rigoureux; approfondissement sur plusieurs niveaux.
- Expert : facile à étendre aux 11 Visions, sources et comparaison, avec une densité modulable.
- Risque : devenir une encyclopédie/grille de cartes standard sans âme. Évaluer l'intensité du signe World-Vision et la sensation de découverte.

### Piste C — « Globe + atelier d'analyse »
- Accueil : scène Terre dominante et bande d'actions contextuelles qui se réorganise sur sélection du lieu.
- Page pays : un panneau de contexte ancré au globe, puis ouverture **plein espace** pour analyse de séries, de méthodes et de services; état géospatial et historique persistants.
- Expert : véritable workspace multi-colonnes sur grand écran; mobile revient au modèle mono-colonne.
- Risque : complexité de navigation, implémentation coûteuse et perte de repères pour le visiteur généraliste. Refuser si les tests d'usage ne sont pas meilleurs.

**Décision provisoire** : ne pas choisir « la plus jolie capture » seule. Étudier A/B/C sur desktop et mobile avec le **même parcours complet**; pondérer émotion et identité (25 %), compréhension et orientation (25 %), information/méthodes (20 %), aisance des outils (15 %), accessibilité et performance (15 %). **Pondération CANDIDATE** à approuver, pas une note objective.

## 5. Inventaire applicatif ACTUEL à conserver / intégrer, pas à oublier

| Objet réel dans le code / PR | État connu au 23/11 | Futur rôle UI |
| --- | --- | --- |
| `GlobeMap.tsx` canvas 2D orthographique / `EyeMapFrame.tsx` | interaction, projection, sélection/zoom déjà codés; rendu pas premium | conserver contrats et UX comme baseline, comparer un moteur de globe évolutif |
| `App.tsx` ~953 lignes, navigation, routes, ~12 panneaux d'outils | vrai code avec états nombreux, couplage difficile | séparer `AppShell`, route pages, contexte global, commandes; ne pas casser liens/favoris |
| `CountryDrawer.tsx` ~1734 lignes | rubriques pays corrigées, mais densité et redondances | `CountryPage` responsive, navigation sectionnelle, identité/cartographie, détails sourcés |
| `CountryLocalEvidencePanel` et sources | pluralité et provenance explorables avec couverture variable | profondeur Sources accessible du pays/d'une donnée, pas bannière volumineuse |
| `useCountryCatalog` + snapshot World Bank `#148` | 217 économies/territoires WB de **métadonnées**, pas 217 profils statistiques | index/recherche rapide CDN, frontière visible entre méta et données prouvées |
| `useCountrySheet`, WB direct, Timeseries/Gateway | séries partielles, backend privé non hébergé dans preview | indicateurs sous droits et périodes; contraintes 401/403/503/stale |
| `CountryNewsPanel`, Global Radar | documents candidats et un dossier ancien, **pas** une newsroom mondiale | sous-rubrique Actualités à ouverture volontaire, source/dates/méthodes |
| `CurrencyPanel`, `FxConverterSection`, `TravelPanel`, sécurité, coût de vie | outils existants plus ou moins partiels | capacités réelles intégrées au contexte géographique |
| `VisionHub`/ `visionProducts.ts` | 11 Visions honnêtement `explorable/partial/planned` | architecture d'information par **tâches**, pas grille de 11 produits au-dessus du globe |
| Trading #120→#129 (chaîne DRAFT distincte) | recherche macro, MTA et 8 devises/28 paires sous conditions, NON déployé | espace expert cohérent, ne pas montrer des cours inventés ni dire `live` |
| DATA #85→#115 (DRAFT) | règles droits, preuve, révocation et tests sérieusement avancés | design du **statut de publication** fondamental pour chaque indicateur |
| Watch, BRVM, Transport, Price/Panier | éléments candidats / backlog; fournisseurs/licences à compléter | futur raccord via contrats, clairement hors des actions fonctionnelles aujourd'hui |
| Remotion et Média | branche éditoriale séparée | réutilise les preuves et la marque sans imposer le style de TikTok aux fiches pays |

*Attention aux branches : #148 (frontend Atlas) et #129 (Trading) sont des chaînes distinctes. Ne jamais parler de ces fonctions comme déjà réunies dans la Preview Atlas.*

## 6. Spécification des écrans de référence

**Accueil** : identité forte et cohérente du symbole, recherche mondiale, globe réellement interactif, deux tâches principales (explorer un pays / comparer), accès intelligent aux services vraiment disponibles. « 217 territoires » est un compte de référentiel, PAS « 217 pays alimentés ». Le reste du catalogue est accessible par navigation, sans faux CTA.

**Fiche pays** : identité/localisation/photo sourcée, géographie essentielle sans double emploi, choix des dates/territoires, rubriques `Vue d'ensemble, Données, Comparer, Sources, Actualités, Services`, quelques informations réellement expliquées et liens vers la méthode. Un panneau utile ne doit pas cacher un autre panneau. Actualités n'a ni hero prioritaire ni longue liste de liens bruts sur la première page.

**Fiche indicateur** : « quoi ? / où ? / unité ? / quand ? / qui publie ? / actualisé quand ? / observation, estimation ou révision ? ». Graphique/tableau et comparaison au niveau approprié; données absentes = explication et prochaine action honnête, pas chiffre de démonstration.

**Comparer** : pays et périodes dans la même zone de visualisation; sources comparables ou refus motivé. Choix entre organismes sans présumer indépendance.

**Sources** : organismes locaux, régionaux et internationaux, document original, statut `catalogué/ingéré/vérifié/publiable/révoqué`, date, méthode, périmètre, droits. Recherche et filtre, mais pas « console GDELT » dans le parcours ordinaire.

**Money / Marchés / Trading / BRVM** : unifié dans le shell, espaces denses dotés d'outils spécifiques; graphiques et macro sans faux cours ni conseils de trading. Le pays et l'indicateur restent navigables depuis une analyse.

**Watch / Voyage / Sécurité** : premières actions seulement si une règle persistante, un avis officiel daté ou une offre vérifiée existe; sinon page de capacité explicite et crédible.

## 7. Système visuel CANDIDAT — règles de qualité, pas 300 patchs CSS

1. **Une seule source de vérité graphique** : tokens couleur, caractères, échelles 4/8 px, surfaces, bordures, élévations, rayons, transitions, état des données; plus de mélange `eye/editorial/electric/country` au hasard. Déploiement progressif, aucune suppression aveugle de CSS.
2. **Marque contrôlée** : vrai master SVG/logo approuvé, versions claire/sombre, favicon et splash testées. Code et web ne doivent pas redessiner chacun une Terre différente; pas de fichiers de fontes distribués.
3. **Typographie hiérarchisée** : titres de lieu expressifs, sous-titres courts, données tabulaires, textes lisibles 15–17 px sur mobile en corps de lecture; FR/EN/locales et longueurs de noms testées. Ne pas afficher la classification World Bank brute en anglais dans un espace français.
4. **Géographie comme matière** : image Terre crédible, couches adaptées au zoom, frontières correctement géoréférencées, longitude/latitude et statut territoires documentés. Les couleurs de pays ne prétendent pas exprimer un indice.
5. **Photos et cartographie sous droits** : pilote Wikimedia attribué de 3 pays ≠ système mondial; source, auteur, licence, recadrage, état d'expiration et optimisation CDN/self-hosting avant échelle; tenir la preuve des droits.
6. **Niveaux de densité** : « découverte » aérienne, « analyse » structurée et « expert » dense, tous issus des mêmes tokens et navigation, pas un CSS complètement différent par Vision.
7. **Mouvement intentionnel** : rotation globe calme, transitions lieu→pays, liens cartographie→graphique; arrêter/reduire avec `prefers-reduced-motion`; pas de micro-animations sans sens, ni de clignotements médiatiques dans le produit.
8. **Qualité mesurable** : tests 320, 390, 820, 1440, 1920px; clavier, lecteurs d'écran, zoom 200 %, mode réduit, bas débit, appareils peu puissants; budgets LCP/INP/CLS **définis et mesurés** en staging, sans les inventer ici.
9. **Architecture millions** : choisir le moteur carto par POC comparatif mesuré, tuiles multi-LOD/CDN, caches et droits source, lazy-loading, pagination, métriques et quotas; **une CI avec 12 pays n'est pas un test de millions**.

### Moteur globe : aucun choix technologique hâtif
- **Baseline** : garder `GlobeMap` orthographique Canvas 2D, vérifier sélection géographique/clavier, coût de mise à niveau et lisibilité.
- **MapLibre GL JS** : rendu WebGL/vector tiles, projection globe prise en charge, BSD-3-Clause. Très bon candidat pour couches pays et cartographie rapide; mesurer rendu globe/zoom, mobile/bas débit, attribution fournisseur et coûts de tuiles.
- **CesiumJS** : 3D WGS84, relief/imagery/tiles, Apache-2.0 pour le moteur. Plus proche d'une Terre immersive mais potentiellement plus lourd en mémoire/temps; moteurs ouverts ≠ tuiles/imagerie gratuites sous toutes les licences.
- **Verdict** : micro-POC A/B **après** direction visuelle et contraintes acceptées; pas de réécriture totale en Three.js parce que l'image semble plus belle.

Références primaires : https://maplibre.org/projects/gl-js/ ; https://maplibre.org/roadmap/maplibre-gl-js/globe-view/ ; https://cesium.com/platform/cesiumjs/ ; https://www.nasa.gov/nasa-brand-center/images-and-media/ ; https://www.naturalearthdata.com/about/terms-of-use/ . Visuels NASA : leur usage doit respecter les conditions NASA, crédit, absence d'approbation commerciale implicite; marque NASA non libre à utiliser comme logo World-Vision.

## 8. Ordre des petites étapes — **ne pas confondre vitesse et valeur**

**DESIGN-0 (ce document)** : reconstruire ADN marque / carte des fonctions, risques et invariants; identifier où les choix antérieurs se contredisent; publier base de revue. **Sortie :** document + code/SHA exact + point de reprise, PAS validation d'art direction.

**DESIGN-1 (prototypes candidats isolés)** : compositions comparables A/B/C sur exactement les mêmes parcours et les mêmes états réels, mobile + desktop. Prototypes marqués « CONCEPT / données non connectées », sans toucher `App.tsx`, `GlobeMap` ni les CSS de production; démontrer les actions qui seront réellement possibles. **Sortie :** 6+ écrans rendus + description des compromis, revue qualité interne, avis explicite du propriétaire.

**DESIGN-2 (sélection & système)** : documenter la piste retenue/combinaison corrigée, tokens master, logo master, grilles, composants (navigation, lieu, sourcing, série, comparaison, FX, news en section, états panne), design accessible FR/EN et variations experts. **Gate :** pas d'implémentation « finale » avant accord explicite sur la direction artistique.

**FRONT-1 (verticale pays)** : sur branche isolée, migrer un seul parcours complet `Accueil → recherche → Gabon → données → comparer → provenance → services` avec code et vrais hooks, intégrité backend et visuelle; défaire progressivement les anciens styles; staging SSO/noindex, captures et tests a11y/perf.

**FRONT-2 (écosystème)** : appliquer le langage aux routes Trading/BRVM, Money/Watch, Voyage, sources/Global Radar, sans les réduire à des fiches ni inventer de fournisseurs. Mesure UX et coût, compatibilité web mobile.

**WORLD-SCALE** : budgets, stress/soak, cache/rollback, conformité licences et hébergement seulement après preuves de vrais parcours; production uniquement après GO explicite du propriétaire.

## 9. Critères GO / NO-GO de direction artistique

- **NO-GO** si photo, carte ou actualité sont plus visibles que l'identité et les tâches du pays sans justification d'usage.
- **NO-GO** si le globe est simplement une illustration ou si l'œil est un cercle fermé/une variation du logo non approuvée.
- **NO-GO** si la recherche mondiale disparaît, si le chemin vers un chiffre/méthode prend plus d'étapes qu'avant sans gain prouvé, ou si un outil installé est perdu.
- **NO-GO** si un simple rendu mock avec des données fictives est présenté comme réel.
- **NO-GO** si la version mobile est une compression du desktop, si un pays non photographié devient une interface vide, ou si les états droits/stale/error sont cachés.
- **NO-GO** si l'on confond la réussite des tests avec le goût et la validation artistique du propriétaire.

## 10. État, provenance du travail et reprise exacte

- Dépôt : https://github.com/OBIANG5/World-Health-Vision
- Base source logiciels : PR #148, commit `dde51d89d41de4c269b2eb7c52f5cd1578c3fd64`, elle-même sur PR #146, #144/#143, données #115.
- Branche documentaire candidate : `design/world-vision-experience-system-v1-2026-11-23`, créée depuis ce SHA. **Aucune fusion, aucune promotion.**
- Prévisualisation U2 historique https://world-health-vision-v2-8mu66kos8.vercel.app/?wv=country&iso3=GAB (SSO/noindex, PAS la future maquette).
- Audit fondateur issu #66, commentaire https://github.com/OBIANG5/World-Health-Vision/issues/66#issuecomment-7105436102 ; correction d'ordre #145.
- Captures du FRONT ACTUEL : artifact GitHub #14743582101 de workflow #44994802167, pas un résultat de DESIGN-1.
- Toute proposition future doit préciser **code exécuté/maquette/fixture/production**, SHA exact, captures visuellement contrôlées, décisions prises ou encore ouvertes.
- Ne pas reprendre les anciennes propositions de CSS comme la charte finale; ce document prime pour l'analyse de la direction, mais ne remplace pas l'approbation esthétique du propriétaire.
