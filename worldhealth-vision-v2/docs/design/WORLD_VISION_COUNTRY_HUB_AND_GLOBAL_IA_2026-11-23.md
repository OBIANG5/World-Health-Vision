# WORLD-VISION — L'ŒIL, LA TERRE, LE PAYS ET TOUTES LES VISIONS
## Architecture UX/UI intégrale et fiche pays–services · Proposition structurante du 23 novembre 2026

**STATUT : nouveau cadrage de conception issu d'un retour explicite du propriétaire — NON VALIDÉ visuellement, NON implémenté dans le frontend métier.**

**Autorité et ordre :**
1. Vision de l'utilisateur et image œil–Terre remise le 23/11/2026 (fichier source de la conversation : `144876CC-3A4C-4214-8995-440697A47FC1(3).jpeg`; **1086×1448, SHA256 `63bc6d7d61c7b4cbec05f642382f4cc4f1d2099943dc70d36a240c8ded9a24d4`**). L'image est la référence de **composition**, pas un raster cartographique interactif publiable. **Le binaire original de l'image ne se trouve pas dans le dépôt** : le SHA et le nom permettent la correspondance à partir de la pièce jointe conservée dans la conversation; avant l'implémentation, déposer légalement la version maître approuvée dans les actifs de marque.
2. `docs/product/STRATEGIE_INTERNATIONALE_WORLD_VISION_MASTER_2026-11-19.md`, `docs/product/WORLD_VISION_REORGANISATION_FONCTIONNELLE_ET_UX_2026-11-19.md`, `docs/product/REGISTRE_PRODUITS_SOURCES_REVENUS_PRIORITES_2026-11-19.md`.
3. Code actuel `frontend/web-v2/src/product/visionProducts.ts` (11 produits; états explorables/partial/planned), `App.tsx` (nombreux panneaux outils) et `CountryDrawer.tsx` (6 rubriques, seulement FX/sécurité dans Services).
4. Corrections utilisateur : [#145](https://github.com/OBIANG5/World-Health-Vision/issues/145) (actualité secondaire) puis ce retour du 23 novembre : **globe conforme à l'œil original, carte DU PAYS tout en haut, tous les services accessibles sur la fiche pays, architecture intuitive et factorisée de tout le logiciel**.
5. `docs/design/WORLD_VISION_EXPERIENCE_CANON_2026-11-23.md` et laboratoire A/B/C de [PR #149](https://github.com/OBIANG5/World-Health-Vision/pull/149) sont des **explorations historiques désormais INSUFFISANTES**. Ne pas présenter l'une des trois compositions comme une direction artistique acceptée, ni leur photo Apollo comme le vrai moteur de globe. Ce document **corrige explicitement** leur hero photo pour pays et leur répertoire de services incomplet.

---

## 1. Concept unique : « de la planète à l'action », plutôt qu'une liste de Visions

World-Vision est un **système géographique de compréhension et d'action** : le même objet « lieu » (planète → continent → pays → région → ville) organise les données, preuves, comparaisons et services. **Chaque Vision est accessible depuis n'importe quel lieu pertinent**, et possède aussi son espace expert global. La carte n'est pas un décor; c'est l'interface d'orientation et le maintien de contexte.

Trois questions sont immédiatement résolues sur chaque écran :
- **Où suis-je ?** Monde → Afrique → Gabon → Libreville, avec zoom, fil d'Ariane, retour et carte.
- **Que puis-je comprendre ?** Faits géographiques, catégories de données, périodes, organismes, comparaisons et limites.
- **Que puis-je faire ?** Monnaie, voyage, marchés, prix, veille, favoris, alertes, personnalisation et outils spécialisés, avec état vrai.

**La cohérence vient d'un modèle géographique central et d'un catalogue de services commun, PAS d'un immense écran affichant les interfaces internes de tous les services en même temps.** Le point d'entrée de tous les services est visible; chacun s'ouvre ensuite dans son workspace adapté.

### Les exigences de découvrabilité
- **Aucun service du registre 11 Visions ne disparaît** parce que le pays n'a pas encore de données. Il reste repérable dans le répertoire du pays, avec une raison d'indisponibilité ou un lien de découverte sans fausse action.
- Premier écran : 3–4 actions réellement utiles et un accès évident au **répertoire complet**, pas onze petites cartes indistinctes dans le hero.
- Sous le hero : **tous les services sont réellement listés et regroupés par besoins**, sans les cacher dans un menu global ni en laisser certains exclus de la page pays.
- Une carte au sens « ServiceTile » ne doit pas se faire passer pour une carte géographique; distinguer `CountryMap` (géographie interactive) et `ServiceEntry` (fonction).
- Chaque action porte verbe + résultat + état; la couleur seule ne transmet jamais la disponibilité.

## 2. ADN VISUEL : ce que l'image fournie impose

### Image de référence — caractéristiques observables
- Deux **arcs ouverts** supérieure et inférieure, périphériques, cyan électrique lumineux et **blanc très pur** à l'intérieur. Ils forment un œil, **pas un anneau fermé**.
- **Terre immense au centre**, relief/océans détaillés; bleu profond des océans, verts et ocres naturels des continents, frontières nationales fines et visibles; Afrique au centre du cadrage de référence et Europe/Moyen-Orient en haut de l'hémisphère.
- Aura atmosphérique cyan **physiquement convaincante, lisible**, quelques étoiles discrètes sur un fond marine très sombre; pas de soleil, pas de nébuleuses agressives, pas de globe cartoon ni globe satellite découpé en carré.
- Dans le produit, conserver **la géographie reconnaissable et les frontières** à tout zoom. Ne jamais inventer de frontières ou coder en dur une image globale en lieu de projection.

### Deux objets liés, non interchangeables
1. **WorldVisionBrandMark** : signe officiel œil–globe, issu d'un **fichier maître fidèle à l'image validée**, avec variantes logo/favicons et une petite version simplifiée conçue à partir du même master. Ne pas le reconstruire avec trois SVG approximatifs différents. La source de ce master reste à intégrer dans le dépôt après contrôle.
2. **WorldVisionEarthScene** : **vrai** globe interactif avec mouvement, rotation, sélection géospatiale, relief/couches pertinentes, frontières, météo/nuages seulement si source et date documentées; les arcs-œil et lumière sont dans une **couche visuelle non interactive** intégrée à l'expérience. Séparer rendu des pays, interaction et langage de marque.
3. **CountryGeographicScene** : carte du pays sélectionné issue de données géographiques, avec contours nationaux, provinces si autorisés/fiables, principales villes si sourcées, relief/sol/eaux et zoom, mêmes familles d'océan et de lumière. **Pas de photo panoramique en tête des fiches.** Photos de Libreville = galerie, tourisme ou contenu documentaire à l'intérieur, jamais hero du pays.

### Palette tirée du langage de l'image, pas arbitraire
Couleurs de travail **candidates seulement** : noir spatial `#010721`, océan bleu `#00399C`, aura cyan `#00D4FA`, blanc éclat `#FFFFFF` (dans la scène de marque), terres vertes/ocres issues de couches géographiques, fond de lecture légèrement minéral `#F6F8FB`, texte bleu noir `#102D44`. Ce sont des indices visuels issus de la référence, **pas un design token officiel ou un permis d'utiliser du cyan sur texte blanc peu contrasté**.

**Règle d'équilibre** : le WOW = Terre et transitions cartographiques; la **lecture de données** reste calme et précise. Il ne faut pas rendre toutes les cartes de services fluo, multiplier les lueurs ou imposer un fond spatial derrière une comparaison tabulaire.

## 3. Architecture d'information GLOBALE, factorisée

### Niveau 0 — AppShell commun, toujours reconnaissable
- Identité `World-Vision`, recherche mondiale omniprésente (pays, région, service, indicateur, ville selon index), choix langue, accès à l'espace utilisateur lorsque réellement connecté.
- Navigation par **besoins** : **Explorer** (Terre, pays, Atlas), **Données & comparer**, **Argent & marchés**, **Voyager & vivre**, **Surveiller**, **Tous les services**. Les sources/preuves sont transversales; Global Radar/Média restent accessibles sans envahir l'Atlas. Sur desktop, certains groupes peuvent être réunis dans un menu bien construit, pas 8 boutons trop petits.
- Sur mobile : en-tête léger et recherche; navigation primaire courte (ex. Monde, Chercher, Services, Suivi) si capacités disponibles; le pays actif et le retour persistent. Pas de double barre supérieure encombrante ni de faux compte connecté.
- Command palette `⌘/Ctrl+K` + recherche tactile, navigation clavier et liens directs durables par lieu/service.

### Niveau 1 — Scope géographique (`GeoContext`)
- `world`, `continent`, `region`, `country`, `subdivision`, `place`. Le code ISO3 n'est pas l'unique identité : vérifier territorialité, langues, noms, droits cartographiques et géopolitique.
- Sous-périmètres d'usage qui ne sont PAS des pays : `corridor` pour transferts et transport (origine + destination), `regional_exchange` pour BRVM/BVMAC, `local_market` pour prix par magasin, `global` pour outils globaux. Un service peut être présent dans le pays sans prétendre avoir des fournisseurs nationaux.
- Conserver le contexte entre outils et retour (`country=GAB`, langue, période si cohérente), sans forcer un portefeuille ni une origine de voyage imaginaire.

### Niveau 2 — Deux types d'écrans complémentaires
- **GeoExplorer/CountryPage** : porte d'entrée géographique, découvre les offres de services pertinentes et leurs états, puis les données.
- **VisionWorkspace** : vrai environnement expert d'une Vision (FX, Markets, Transport, Basket, Watch, Radar, professionnels) utilisant le même AppShell, context-bar, design tokens, système de preuves, mais des tableaux/paramètres/graphes adaptés au métier. Le pays n'est PAS contraint de rendre toute une interface Trading dans sa première page.

### Niveau 3 — Quatre types de panels factorisés
1. **GeoScene** (globe → carte pays → régions) : layers/contrôles/outils / détails géographiques.
2. **Knowledge** (indicateurs, graphiques, statistiques, publications, sources, comparer).
3. **Capability** (service cards, availability, action launchers, statut dépendant du pays).
4. **Activity** (Watch, favoris, historique personnel, Radar/news, notifications, uniquement avec vraies capacités persistantes).

## 4. FICHE PAYS DESKTOP — disposition de référence (1440 px)

```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ World-Vision ◉   Explorer  Données  Argent & marchés  Voyager  Suivre   Recherche ◯ │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ Monde › Afrique › Afrique centrale › Gabon       Changer de pays · Langue · Partager│
│ ┌──────────────────────────── Carte réelle du Gabon ───────────────────┐ ┌────────┐ │
│ │ contours du Gabon, relief, provinces vérifiées, Libreville,          │ │ GABON  │ │
│ │ routes ou sites selon couches autorisées, zoom, carte/satellite      │ │ Gabon  │ │
│ │ légende et contrôle d'échelle; focus depuis le GLOBE                  │ │capitale│ │
│ │                                                                     │ │devise… │ │
│ │   [recentrer] [couches] [plein écran] [comparer territoire]          │ │ actions│ │
│ └─────────────────────────────────────────────────────────────────────┘ └────────┘ │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ Vue d'ensemble   Carte   Données   Comparer   Services   Sources   Actualités       │
│ Les essentiels : repères vrais + 3–4 actions / analyses les plus utiles             │
│                                                                                     │
│ LES SERVICES POUR LE GABON                  Voir les 11 Visions et fonctions locales │
│ ┌──────────────────────────────────┐ ┌────────────────────────────────────────────┐│
│ │ Comprendre & comparer           │ │ Argent & marchés                          ││
│ │ statistiques, institutions, ... │ │ devises, transferts, pouvoir d'achat...    ││
│ ├──────────────────────────────────┤ ├────────────────────────────────────────────┤│
│ │ Voyager & vivre                 │ │ Acheter & comparer                        ││
│ │ voyage, transport, risques, ... │ │ Price/Panier, prix locaux, immobilier ...  ││
│ ├──────────────────────────────────┤ ├────────────────────────────────────────────┤│
│ │ Suivre & s'informer             │ │ Outils professionnels & transversaux      ││
│ │ Watch, Radar, actualités ...    │ │ exports, sources, compte, API prévue...   ││
│ └──────────────────────────────────┘ └────────────────────────────────────────────┘│
│                                                                                     │
│ EXPLORER LES DONNÉES — séries prouvées, périodes, institution, méthodes             │
│ COMPARER — pays/organismes/années, seulement si valeurs comparables                 │
│ SOURCES ET INSTITUTIONS — provenance nationale, régionale, internationale          │
│ ACTUALITÉS DU PAYS — rubrique secondaire, datée, ouverte volontairement            │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Le premier élément visuel du pays est SA CARTE.** Sur desktop, composer un hero à deux zones : **carte géographique dominante ~60–65%** et bloc identité/actions ~35–40%. Aucune photographie. La carte est un composant interactif contextuel (pas une image GIF). On ne garde pas l'ancienne home derrière un tiroir qui prend 45% de la largeur.

**Faits essentiels** : capitale, sous-région, devise/source, éventuellement langue/zone administrative quand attestées; ne pas doubler « Libreville » dans le hero puis dans une grille géante. Un fait = un endroit logique, avec accès source/provenance.

**Navigation** : les sections sont des ancres/onglets secondaires, le répertoire de services apparaît **sur la Vue d'ensemble** et possède également son propre point d'accès stable `Services`. Les six rubriques historiques restent disponibles; ajouter `Carte` comme vue spécialisée (ne pas augmenter les rubriques si cela crée de la duplication : une étude d'usage tranchera).

## 5. FICHE PAYS MOBILE — disposition référence (320–390 px)

```text
┌────────────────────────────────┐
│  ◉ World-Vision      ⌕    ☰    │  barre minimale
├────────────────────────────────┤
│ ← Afrique centrale / Gabon     │  retour clair
│ ┌──── vraie carte du Gabon ──┐ │
│ │ relief et territoire       │ │  220–260 px de carte active
│ │ provinces*, villes*, zoom  │ │  *quand sources disponibles
│ └────────────────────────────┘ │
│ GABON                 🇬🇦      │  hiérarchie pays
│ Libreville · XAF · Régions      │  provenance au détail
│ [Données]    [Comparer]         │  2×2 actions utiles
│ [Monnaie]    [Voyager]          │  si état fonctionnel
│                                │
│ Tous les services du Gabon     │  découvrabilité immédiate
│ [Comprendre & comparer]        │  catégories ancrées
│ [Argent & marchés]             │
│ [Voyager & vivre]              │
│ [Acheter & comparer]           │
│ [Suivre & actualités]          │
│                                │
│ ─── Comprendre & comparer ───  │
│ Données             État réel  │
│ Comparateur         État réel  │
│ Institutions        État réel  │
│ ...                            │
│ ─── Argent & marchés ────────  │
│ Money / FX          État réel  │
│ Trading             En projet │
│ Bourses régionales  Périmètre │
│ ...                            │
│              [autres sections] │
└────────────────────────────────┘
```

À 320 px, **pas de mini-dashboard quatre colonnes** ni de menu de six onglets compressés. Carte 220–260 px (budgets à tester), titre/faits utiles, actions tactiles 44×44 minimum, répertoire **visible en groupes verticalement**. Les catégories mènent aux sous-sections du même écran, sans cacher les services dans un menu hamburger. Lorsque le pays change, `GeoContext` change de façon atomique; aucune carte ou chiffre d'un autre pays ne fuit.

Pour petit écran et bas débit, afficher une géométrie vectorielle locale légère et contrôles accessibles avant chargement éventuel d'une imagerie lourde; l'accès aux services ne doit JAMAIS dépendre d'un WebGL disponible.

## 6. RÉPERTOIRE EXHAUSTIF : 11 VISIONS + modules déjà codés

**Ne pas confondre une Vision (produit), un module (outil), un jeu de données et un service disponible pour un pays.** Ce tableau donne l'architecture d'affichage **visée**, pas un état de disponibilité approuvé.

| Groupe de besoins affiché sur la page pays | Entrées explicitement découvrables | Ancrage existant / état produit à vérifier |
| --- | --- | --- |
| **Comprendre le pays** | Atlas, subdivisions/cartes, institutions locales, économie, santé, gouvernance, développement, finances publiques, indicateurs, comparateur, sources/documents | Atlas `explorable`, vues et `CountryLocalEvidencePanel` partiels; backend institutionnel non public en preview |
| **Argent, économie et marchés** | Money-Vision (devises/taux/frais/transfert), pouvoir d'achat, conseiller économique, Trading-Vision, marchés régionaux, BRVM-Vision, BVMAC (spécificité de périmètre) | `CurrencyPanel`, `PurchasingPowerPanel`, `AdvisorPanel` existent; Trading/BRVM et marchés sous droits sont expérimentaux |
| **Voyager, se déplacer, vivre** | Tourisme-Vision, Transport-Vision (avion/train/bus), hôtel/destination, formalités, sécurité officielle, `DestinationScore`, coût de la vie, immobilier, retraite/expatriation | `TravelPanel`, `DestinationScorePanel`, `RetirementPanel`, `RealEstatePanel` existent, réservations réelles non intégrées |
| **Acheter et comparer localement** | Price-Vision (référence/produit, historique), Panier-Vision (magasins, stock, prix), comparaison des prix/coût total | `price` / `basket` `planned`, aucune collecte nationale garantie |
| **Suivre, vérifier, s'informer** | Watch-Vision (règles, notifications), favoris, alertes existantes, Global Radar, actualités et dossiers datés, lien vers World-Vision Média | `WatchlistPanel`, `AlertsPanel`, `GlobalRadarPanel` existent; Watch persistant et publication éditoriale non intégrés dans V2 |
| **Transversal / professionnel** | exports PDF/CSV sous droits, dossiers comparatifs, API/équipes B2B à terme, profil/permissions, suivi des sources et méthodes | exports/profil locaux partiels, identité centralisée/entitlements/B2B non démontrés en preview |

**11 Visions obligatoirement présentes dans ce regroupement :** Atlas, Watch, Money, Transport, Tourisme, Price, Panier, Trading, BRVM, Radar, Média. Une même Vision peut apparaître à deux endroits utiles, mais la **définition et l'état** ne doivent exister **qu'une fois** dans le registre central.

**Contextualiser sans provincialiser** :
- Gabon → Money préconfigurable avec monnaie légalement attestée XAF (date/émetteur du taux), voyage « destination Gabon » sans prétendre connaître le départ; Trading global accessible depuis son contexte.
- **BVMAC** pour l'environnement CEMAC/gabonais, selon périmètre et droits; **BRVM** pour les huit pays UEMOA, mais BRVM-Vision toujours découvrable dans les marchés africains à l'échelle internationale. Ne jamais appeler BRVM « la bourse locale du Gabon ». Références originales : https://www.bvm-ac.org/ et https://www.brvm.org/fr/historique.
- Panier/Price : nécessitent **ville, localisation ou magasin**; le choix « Gabon » seul est insuffisant. Afficher un parcours pour préciser la zone, sans prix fabriqué.
- Transport : nécessite origine, destination, dates et voyageur; un pays peut renseigner la destination, pas remplir automatiquement l'origine.
- Actualités/Media : ne pas forcer un sujet ancien dans Vue d'ensemble; ouvrir rubriques datées et état de vérification.
- Santé, risque et sécurité : ne pas calculer un « risque pour voyager » à partir d'indicateurs macro généraux. Exiger des avis officiels datés et une qualification responsable.

### La fiche de chaque entrée de service — niveau qualité international
**Nom clair** + **résultat utilisateur** (verbe concret) + **périmètre** (pays/région/global/corridor/local) + **niveau de disponibilité authentifié** + éventuelle dernière source/période + **action primaire** ou désactivation explicite motivée. Une illustration décorative n'est jamais nécessaire pour rendre un service utilisable.

## 7. Modèle d'architecture factorisée, type-driven et réutilisable

```text
BrandSystem (assets officiels, tokens, i18n, icônes, motion)
      │
      ├── AppShell (routes, recherche mondiale, navigation, accessibilité)
      │       └── GeoContext (world / continent / iso3 / subdivisions / place)
      │
      ├── GeoScene
      │       ├── EarthScene     (moteur globe + œil graphique)
      │       ├── CountryMap     (frontières, terrain, couches, labels)
      │       └── RegionMap      (niveaux administratifs vérifiés)
      │
      ├── CountryPage
      │       ├── CountryMapHero + Identity + EssentialFacts
      │       ├── QuickActions   (3-4 actions sûres)
      │       ├── ServiceDirectory ◄───── CapabilityRegistry central
      │       ├── CountryKnowledgeTabs (Données/Comparer/Sources/Actualités)
      │       └── TrustedEvidence + Status/AsOf + Coverage
      │
      ├── VisionWorkspace ("Money", "Trading", "Travel", "Basket", ...)
      │       ├── CountryContextHeader + Search/filter panels
      │       └── DomainSpecificWorkArea (data, map, tables, calendar, trip ...)
      │
      └── SharedContextualServices (Watch, account, sources, exports, consent)
```

**Front V2 actuel :** React + TypeScript + Vite sont suffisants pour cette refonte; aucune nouvelle librairie frontend n'est choisie seulement pour « faire premium ». Extraire à terme `App.tsx` (~953 lignes) et `CountryDrawer.tsx` (~1 734 lignes) de façon incrémentale, avec tests de non-régression sur les parcours. Ne PAS supprimer les panneaux qui existent : leur logique doit être reliée aux workspaces.

**Registre commun de capacités :** l'existant `src/product/visionProducts.ts` représente les 11 Visions et leur maturité générale. Lui adjoindre un **`CapabilityRegistry` typed** contenant groupes de tâches, points d'entrée, `scope` et dépendances, puis un **`CoverageResolver`** renvoyant l'état **pour le lieu** à partir d'informations backend/permissions. Le frontend doit éviter un second registre figé dans CountryPage.

Proposition d'interface, NON encore implémentée :
```ts
type GeoScope = "world"|"region"|"country"|"subdivision"|"place"
  |"corridor"|"market_region"|"global";
type CapabilityStage = "explorable"|"partial"|"planned"; // produit
type CapabilityAvailability = "ready"|"degraded"|"unavailable"
  |"not_covered"|"requires_input"|"not_yet_built"; // dans ce lieu/sujet
interface CapabilityDefinition {
  id: string; visionId: VisionId; groupId: string;
  name: {fr:string;en:string};
  outcome: {fr:string;en:string}; // pas juste un nom marketing
  supportedScopes: readonly GeoScope[];
  route: string; // resolver tenant compte du contexte, pas de /GAB arbitraire
  requiredInputs: readonly string[];
}
interface CapabilityViewState {
  definition: CapabilityDefinition;
  productStage: CapabilityStage;
  availability: CapabilityAvailability; // source autoritative, jamais déduite du drapeau
  reason?: {fr:string;en:string};
  provenanceAsOf?: string;
  context?: {iso3?:string;currency?:string;origin?:string;region?:string};
}
```

**Information critique** : `productStage` et `availability` sont deux dimensions différentes. Exemple : Money est partiel globalement, mais le taux XAF peut être temporairement indisponible; BRVM est planifié au produit mais sa pertinence directe n'est pas « marché local du Gabon ». Ne pas confondre `noData` et `noService`.

**URLs et navigation** : architecture cible `/atlas`, `/pays/GAB`, `/pays/GAB/services/money`, `/visions/trading?country=GAB`, `/comparateur?countries=GAB,FRA`; URL **illustratives** à normaliser avec les routes existantes `?wv=country&iso3=GAB` pour ne casser ni QR, ni liens, ni bookmarks. **Contexte pays persisté dans l'URL**, pas uniquement state React. Aucun franchissement de périmètre de droits à partir de query params.

## 8. Composants Design System proposés (une seule vérité)

**Noyau visuel**
- `WorldVisionLogo` : source vectorielle approuvée, variants, pas de redessin enfantin.
- `GeoSceneFrame`, `EarthScene`, `CountryGeoMap`, `MapLayersControl`, `MapAttribution`, `GeographicBreadcrumb`.
- `AppHeader`, `GlobalSearch`, `PrimaryNavigation`, `ContextBar`, `MobileNavigation`.
- `CountryIdentity`, `EssentialFact`, `CountrySectionNav`, `QuickAction`.
- `ServiceGroup`, `ServiceEntry`, `CapabilityStatus`, `CoverageReason`.
- `IndicatorChart`, `AsOfDate`, `SourceLink`, `EvidenceCard`, `ComparisonWorkspace`, `EmptyReason`.
- `ActivityEntry`, `WatchRuleEditor` (uniquement lorsque moteur authentique), `DataExport` (droits validés).
- `ProductWorkspaceShell` et `ExpertDensityMode` pour Trading/BRVM, sans imposer ce mode à l'Atlas.

**Tokens** : fond spatial vs fond de lecture, ocean/cyan, terre, texte, contrastes, grille, typographie, densité, états preuves, statuts permissions, elevations, motion, responsive. **Supprimer progressivement les cinq cascades CSS actuelles**, pas ajouter un thème six. Éviter des labels traduits au hasard et des prix/avis créés pour remplir une carte.

### Sémantique accessible
WCAG 2.2 AA comme cible de conception, navigation clavier, focus visible, noms de cartes lisibles au lecteur d'écran, carte alternative en liste pays/régions, cible tactile recommandée ≥44×44, mouvement désactivable, contraste des textes sur fonds carte. Temps de chargement et budgets mesurés en conditions lentes. Les frontières disputées sont représentées avec politique documentée, pas avec une certitude visuelle absolue.

## 9. Choisir le moteur cartographique comme un investissement, pas un gadget

**Deux prototypes géospatiaux à mesurer** sur **exactement** le même parcours `Globe Terre → Gabon → carte pays → provinces/villes → retourner à la Terre`, avec **contrats d'interaction identiques** :
- Baseline Canvas 2D existant `GlobeMap.tsx` : très léger et déjà intégré, fidélité visuelle à tester.
- MapLibre GL JS projection globe/tiles vectorielles : performance/tuiles géographiques, couches/labels, droits/licences propres aux tuiles à auditer.
- CesiumJS si relief/imagery 3D plus proche de l'œil demandé : mémoire, CPU/GPU, accessibilité, licences d'imagerie et coût CDN à établir avant choix.

**Ne pas choisir par popularité d'une librairie ou une capture NASA.** Vérifier sélection de territoire, frontières exactes, niveau administratif Gabon, couches terrestres, survol et tactile, animation de transition, réduction du mouvement, appareils bas de gamme, téléchargement tuiles par session, frais mensuels à 10k/100k/1M utilisateurs, conformité de données. Globe WebGL coûteux = fallback 2D/texte obligatoires.

**Données de Gabon** : contour national ISO3, provinces officielles et villes seulement à partir de géométries sourcées et d'un régime de licence connu (ne pas dessiner à la main les provinces). Si la géométrie sous-nationale manque, seule la limite nationale apparaît avec message discret et jamais une frontière fictive.

## 10. Qualité de sortie : la première revue utile n'est PAS un quiz de style

**Mesures d'utilisabilité concrètes sur la même page Gabon** :
1. Premier coup d'œil : identifier immédiatement la **carte DU Gabon**, le nom, les repères et le retour vers le globe.
2. Sous deux gestes depuis la fiche : trouver où convertir une monnaie, comparer un pays, lire des données et ouvrir un outil de voyage; aucun service omis dans la section catalogue.
3. Sans connaître le nom « BRVM », pouvoir trouver les **marchés régionaux pertinents**; ne pas raconter que la BRVM couvre le Gabon.
4. Voir les **11 Visions** répertoriées et reconnaître celles réellement utilisables, celles partielles et celles à venir; ne pas cliquer vers des boutons morts.
5. Voir en FR des labels corrects et une provenance; désactiver une série insuffisamment licenciée sans perdre l'accès aux autres services.
6. Enchaîner globe → pays → service → pays sans perdre ISO3, ne jamais voir les données d'un autre pays pendant un chargement.
7. Temps d'accès, contrastes, touch, CPU/GPU, poids de données, absence de défilement horizontal à 320/390, tests desktop et clavier, niveau Basse Connexion/No WebGL.
8. User testing non simulé : l'utilisateur comprend le but d'un lien à partir de son nom et résout une tâche sans explication de l'assistant.

**NO-GO** si la page utilise en haut une photo générique, si elle propose seulement FX + Sécurité dans Services, si la scène d'accueil ne ressemble pas aux arcs œil–Terre de la référence, si la carte pays n'est pas géographique, si une liste de services confond 11 plans marketing avec 11 fonctions connectées, ou si la preuve/actualité vient avant les besoins du pays.

## 11. Séquence de travail intelligente et point de reprise

**DIAG-0 (cette correction, documentaire)** : extraire la vision d'origine de l'image, répertorier exactement 11 Visions + outils réellement dans App, définir la structure globale et CountryPage, modèle de capacité et état; noter les erreurs du laboratoire A/B/C. **Pas de promesse artistique validée**.

**GEO-1 (prochaine preuve VISUELLE ciblée)** : concevoir un **seul écran pays complet Gabon** et son accueil globe associé, 390px et 1440px, avec carte géographique Gabon réelle, œil–Terre fidèle et **répertoire exhaustif**. Pas de photo en haut ni d'interface de services fictifs. Maquette clairement « conception » si le moteur cartographique n'est pas réel. Ne pas répéter trois variations qui ont toutes le même défaut.

**GEO-2 (spike moteur mesuré)** : comparer les technologies et l'accès aux tuiles/geo boundary, tester carte pays et globe réel sur mobile, licence et coût. Choisir **après** essais, pas sur réputation.

**HUB-1** : extraire le `CapabilityRegistry` depuis les 11 définitions existantes; inclure les outils historiques du frontend et contextualisation pays; renderer `CountryServiceDirectory` avec test complet de l'inventaire, statut honnête, i18n, routes ISO3/permissions.

**FRONT-1** : migrer une VRAIE page `CountryPage` en réutilisant `CountryDrawer`/hooks et `App.tsx`, tests fonctionnels + régression visuelle. Retirer les couches CSS anciennes en phases, pas réécrire tout en un commit.

**FRONT-2** : appliquer le même shell/typographie/GeoContext aux workspaces Money, Trading, BRVM/BVMAC, Tourism/Transport, Watch, Price/Basket, Radar/Media; l'app métier Média reste séparée.

**WORLD-SCALE** : tests p95/p99 et charge représentant le trafic, caches, coût tuiles/FX/datasets, droits/quotas, observabilité/rollbacks, API, RGPD, architecture sous 1M seulement après mesure et une décision d'exploitation, pas sur l'apparence de la maquette.

**BASE DE REPRISE EXACTE (à réactualiser au prochain commit)** : PR #149 `design/world-vision-experience-system-v1-2026-11-23`, base PR #148 SHA `dde51d89d41de4c269b2eb7c52f5cd1578c3fd64`; dernier HEAD avant ce document `bb2ae19351be5ccf941067301b261db97e7c6743`; CI historique concept A/B/C [#45212441827](https://github.com/OBIANG5/World-Health-Vision/actions/runs/45212441827) PASS 12 formats, Vercel Preview `dpl_A9zREU79KtForGNNc9sZPmsJbhAq` READY **mais maquettes historiquement insuffisantes**; prod V0 intacte. Lire ce fichier **avant tout nouveau travail visuel**, avec #145 et les documents produit. Ne pas présenter l'ancien laboratoire/photo de Terre comme le nouveau objectif validé.
