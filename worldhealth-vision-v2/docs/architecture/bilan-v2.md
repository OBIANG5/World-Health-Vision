# Bilan V2 — World Health Vision
> Dernière mise à jour : juin 2026

---

## Vision

World Health Vision est une plateforme d'intelligence économique mondiale. L'objectif est de permettre à n'importe qui de comprendre l'état économique, social et géopolitique d'un pays ou d'une région en quelques secondes — en agrégeant des données de multiples sources (World Bank, IMF, OECD, ILO, UN) et en les rendant lisibles via une interface interactive professionnelle.

---

## Architecture technique

### Services backend actifs

| Service | Port | Stack | Rôle |
|---|---|---|---|
| **gateway** | 8080 | Java 21 Spring Boot | Reverse proxy, routing vers les microservices |
| **catalog-service** | 8082 | Java 21 Spring Boot + PostgreSQL | Référentiel pays, indicateurs, régions |
| **timeseries-service** | 8083 | Java 21 Spring Boot + TimescaleDB | Séries temporelles par pays/indicateur/source |
| **analytics-service** | 8000 | Python 3.12 FastAPI | Agrégation, scoring, snapshots économiques |
| **ingestion-service** | 8001 | Python 3.12 FastAPI | Pipelines d'import World Bank, IMF, OECD, ILO |

### Frontend

- **Framework** : React 19 + TypeScript, bundlé par Vite
- **Carte** : Leaflet + react-leaflet + GeoJSON (258 pays)
- **Graphiques** : Recharts (LineChart multi-sources)
- **Style** : CSS pur, thème sombre inspiré Bloomberg/Trading Economics
- **Forme de la carte** : CSS `clip-path` en forme d'œil — le `<div>` Leaflet est clippé via un SVG `clipPath` défini en dehors du flux.

---

## Ce qui est fait en V2

### Infrastructure et stabilisation

- [x] Architecture microservices Docker Compose avec réseau interne
- [x] Gateway Spring Boot routant vers les 4 services backend
- [x] Catalog service : pays, indicateurs, régions, qualité de données
- [x] Timeseries service : stockage TimescaleDB, API séries temporelles
- [x] Analytics service : snapshots économiques et coût de la vie agrégés
- [x] Ingestion service : pipelines World Bank + IMF + OECD + ILOSTAT

### Frontend V2 — axes d'amélioration réalisés

#### Axe 1 — Graphiques de tendance (Recharts)
- `TrendChart.tsx` : `ResponsiveContainer + LineChart`, multi-sources avec couleurs distinctes
- `formatValue()` adapte l'affichage selon l'unité (T$/Md$/M$, %, etc.)
- Tooltip personnalisé, `connectNulls`, dégradé sombre

#### Axe 2 — Comparaison multi-sources par indicateur
- `SourceComparisonRow.tsx` + `TrendChartSection.tsx` — wrappers autonomes
- Badge d'accord (`CONSISTENT / MIXED / DIVERGENT / INSUFFICIENT_DATA`)
- Tableau de sources avec `freshnessLevel` (Récent / Vieillissant / Périmé)
- Médiane et écart relatif entre sources affichés

#### Axe 3 — Ingestion ILOSTAT + OECD
- Pipelines d'ingestion ajoutés au service `ingestion-service`
- Endpoints OECD (main aggregates, structural indicators) + ILOSTAT (emploi, chômage)

#### Axe 4 — Navigation régions / continents
- `RegionDrawer.tsx` : panneau dédié avec sélecteur groupé (Région / Sous-région)
- `useRegions()` + `useRegionSheet()` : fetch parallèle snapshot économique + coût
- **Correction bug** : les codes continent (AFRICA, EUROPE…) avaient `countryCount = 0` dans le catalog — filtrage `r.countryCount > 0` implémenté, seules les vraies régions World Bank (EAS, ECS, LCN…) sont affichées
- Bouton "Régions" dans l'interface, s'ouvre en remplacement du drawer pays

#### Axe 5 — Comparateur de pays
- `ComparatorSection` dans `CountryDrawer` : sélectionner un indicateur + jusqu'à 4 pays
- Résultat : tableau trié avec barre proportionnelle pour visualiser les écarts
- Appel backend `/api/analytics/compare-countries`

#### Axe 6 — Convertisseur de devises FX
- `fxApi.ts` + `useFxRates.ts` : intégration **Frankfurter API** (https://api.frankfurter.app)
- API publique, gratuite, sans clé, CORS-enabled, ~31 devises majeures
- Cache mémoire `Map<string, FxRatesResponse>` pour éviter les re-fetch
- Fallback automatique sur USD si la devise du pays n'est pas supportée
- Affiché dans la fiche pays : montant saisi + devise source = résultat en devise cible
- Taux en temps réel, date de mise à jour affichée

#### Axe 7 — Export CSV
- Bouton "CSV" dans l'en-tête du drawer pays
- Exporte tous les indicateurs économiques + coût de vie du pays sélectionné
- Colonnes : Pays, Indicateur, Valeur, Unité, Période, Source, Dataset, Ton, Accord, Confiance

#### Axe 8 — Commentaires d'en-tête
- Tous les fichiers créés ou modifiés portent un commentaire d'en-tête `// WorldHealthVision V2 — [Composant]` + description courte

### UX / Design

- [x] **Carte interactive** : Leaflet dans un div HTML clippé en forme d'œil — résout le problème d'événements `foreignObject` SVG qui bloquaient les clics
- [x] **Tous les pays cliquables** : suppression de la garde `activeIso3Set.has(iso3)` + `renderKey` dynamique pour forcer le remontage GeoJSON quand le catalog se charge
- [x] **Drawer pays** : design page unique professionnelle en français, expandable par indicateur, lazy-loading des graphiques et sources
- [x] **Suppression du panel "Current focus"** en bas à gauche de la carte
- [x] **Interface en français** : CountryDrawer, RegionDrawer, App — l'option multilingue viendra plus tard
- [x] **Indicateurs KPI** : bande de 4 grands chiffres en haut de la fiche pays
- [x] **Grille métadonnées** : capitale, devise, région, sous-région, classe de revenu, tier qualité données

---

## Ce qui reste à faire (V2 — suite)

### Indicateurs supplémentaires (non fait — complexe)

Ajouter un indicateur = 3 étapes backend :
1. **Catalog** : nouvelle ligne dans `catalog.indicator` + `catalog.indicator_source` (migration SQL)
2. **Ingestion** : pipeline d'import depuis la source correspondante (World Bank, UN, etc.)
3. **Analytics** : les snapshots récupèrent automatiquement les nouveaux indicateurs — rien à faire

**Candidats prioritaires :**
- Population totale (World Bank WDI : SP.POP.TOTL)
- Espérance de vie à la naissance (World Bank : SP.DYN.LE00.IN)
- Émissions CO₂ par habitant (World Bank : EN.ATM.CO2E.PC)
- Balance commerciale (FMI : BCA/Current Account)
- Dette publique % PIB (FMI : GGXWDG_NGDP)
- IDE entrants % PIB (World Bank : BX.KLT.DINV.WD.GD.ZS)

### Multilingue

- Menu de sélection de langue (FR / EN pour commencer)
- Dictionnaire i18n pour les labels UI + les valeurs d'énumération backend (`signalTone`, `trendDirection`, etc.)
- Les dictionnaires de traduction sont déjà en place dans `CountryDrawer.tsx` — il faut les externaliser

### Optimisations à prévoir

- Pagination dans les comparateurs et snapshots (actuellement limité à N lenses)
- Skeleton loaders à la place des "Chargement..." textuels
- PWA / mode hors-ligne pour les pays récemment consultés

---

## Décisions architecturales verrouillées

| Décision | Raison |
|---|---|
| Pas de Docker pour le dev local | Trop lourd pour itérer vite, les services tournent en natif |
| Carte en div clippé, pas SVG foreignObject | Les clics Leaflet ne traversent pas foreignObject |
| Frankfurter API pour le FX | Gratuit, sans clé, CORS-ready, suffisant pour les devises majeures |
| Recharts (pas D3 direct) | Intégration React native, moins de code impératif |
| CSS pur (pas Tailwind/styled-components) | Contrôle précis du thème sombre, pas de dépendance de build |
| Lazy-loading des graphiques | Évite N×2 requêtes au chargement du drawer — expand déclenche le fetch |

---

## Flux de données (résumé)

```
GeoJSON (258 pays)
    ↓ click
CountryDrawer
    ├── useCountrySheet(iso3)
    │       ├── GET /api/analytics/economic-snapshot/{iso3}
    │       └── GET /api/analytics/relative-cost-snapshot/{iso3}
    ├── IndicatorCard (expand)
    │       ├── useIndicatorHistory(iso3, code)  → GET /api/timeseries/history/{iso3}/{code}
    │       └── useIndicatorOverview(iso3, code) → GET /api/analytics/indicator-overview/{iso3}/{code}
    ├── FxConverterSection
    │       └── useFxRates(currency)             → GET https://api.frankfurter.app/latest?base={currency}
    └── ComparatorSection
            └── fetchCompareCountries([...])     → POST /api/analytics/compare-countries

RegionDrawer
    ├── useRegions()     → GET /api/catalog/regions
    └── useRegionSheet(code)
            ├── GET /api/analytics/region-economic-snapshot/{code}
            └── GET /api/analytics/region-relative-cost-snapshot/{code}
```

---

*Bilan rédigé automatiquement par Claude Code — World Health Vision V2*