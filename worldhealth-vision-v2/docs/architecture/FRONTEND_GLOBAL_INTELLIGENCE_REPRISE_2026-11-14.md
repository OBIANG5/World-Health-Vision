# World-Vision V2 — Refonte frontend « Global Intelligence »

Date de travail : 14 novembre 2026  
Branche source : `design/v2-global-intelligence-editorial-2026-11-14`  
Branche canonique (non modifiée par cette refonte) : `v2`  
Prévisualisation isolée : `whv-v2-intelligence-browser-preview`

## 1. Pourquoi cette refonte

Instruction explicite du propriétaire : refonte de **l'ensemble de l'interface du logiciel**, inspirée de la discipline des médias internationaux (Bloomberg, Reuters, Financial Times), sans copier leur design, sans réduire la V2 à une maquette minimale, sans perdre les fonctions existantes, et en continuant à pouvoir vérifier le résultat sur iPhone.

La précédente V2 Electric Earth (13/11) préserve le moteur de globe et les données ; toutefois les styles anciens sont accumulés, la page d'accueil est cadrée sur un seul écran et les panneaux utilisent des positions absolues conçues pour ce cadrage fixe. Il faut une logique éditoriale cohérente qui survive au passage d'une page à une autre.

### Références consultées (inspiration, non reproduction)

- Bloomberg Media : https://www.bloombergmedia.com/press/how-were-keeping-our-audience-first-by-creating-a-homepage-designed-for-them/
- Bloomberg Market quote UX : https://www.karenvanderbilt.com/work/bloomberg-news
- Reuters Professional : https://www.reutersprofessional.com/homepage

Ce que nous empruntons comme **principes** : hiérarchie claire, grande lisibilité, densité structurée plutôt qu'accumulation, séparation données / interprétations, accès rapides entre domaines, identité visuelle stable, interactions clavier et mobile.

Ce que nous **n'empruntons pas** : marque Bloomberg, compositions propriétaires, bandeaux de cotations inventées, scores de risques non sourcés, police sous licence propriétaire.

## 2. Direction visuelle

- **Fonds de lecture** : papier quasi blanc `#f5f7fa`, blocs blancs opaques, bordures `#dce3ec` ; pas de texte bleu sombre sur fond bleu sombre.
- **Titres** : encre `#101827`, haute densité, graisse forte et interlignage serré mais lisible ; taille adaptée de 36 à 75 px pour le titre d'accueil.
- **Accent World-Vision** : bleu `#155ac7`, cyan `#27c8e8` pour le globe ; ambre `#d78a22` réservé aux signaux secondaires, pas aux métriques fictives.
- **Typographie** : pile système / Inter disponible avec repli sans police distante obligatoire.
- **Grille** : vitrine éditoriale 2 colonnes desktop (contexte + vrai globe), 4 grandes entrées vers les univers réels, puis deux panneaux de contexte. Tablette et iPhone reconfigurés sans masquer la hiérarchie.
- **Logo** : l'identité œil-globe Electric Earth reste intacte ; pas d'emoji ni de faux logo média.

## 3. Modifications réalisées sur cette branche

| Composant | Changement | Compatibilité V2 |
| --- | --- | --- |
| `components/home/IntelligenceHome.tsx` | Nouveau point d'entrée « Global Intelligence » : mission, recherche pays, globe réel, sélection, 4 domaines, accès devises, conseiller, favoris, méthodologie | Toutes les actions appellent les callbacks V2 existants |
| `App.tsx` | Remplacement de l'ancien accueil fixe (desktop + copie mobile) ; maintient les états, menus, drawers, panneaux, sources | Aucun contrat API supprimé |
| `styles/intelligence-home.css` | Nouveau système de mise en page, palette, typographie et hiérarchie, cohérent à travers accueil, menus, fiches et panneaux | Chargé après les thèmes historiques, sans écraser les données |
| `components/country/CountryDrawer.tsx` | Favoris vectoriels au lieu de caractères décoratifs | État watchlist inchangé |
| `index.html` | Langue FR par défaut, description, viewport, favicon relatif, titre propre | Build `--base=./` conservé |
| `global-intelligence-smoke.mjs` | Contrôles Playwright iPhone / tablette / desktop, recherche, régions, globe, sources, économie, absence de débordement, ouverture d'outils après scroll | Tests sur vrais composants React |
| `.github/workflows/whv-v2-global-intelligence-editorial.yml` | TypeScript + build Vite + Chromium + captures + publication du **seul aperçu séparé** après succès | `v2`, `main` et production Vercel inchangés |

Les panneaux ont été repositionnés en `fixed` : ils doivent apparaître dans la fenêtre active même lorsque le document a défilé jusqu'en bas. La fiche pays/région devient un véritable espace de travail extensible, avec onglets, cartes de KPI et détails économiques préservés.

## 4. Assertions factuelles obligatoires

- **217 pays et territoires** : inventaire documenté du snapshot de référence, mais l'interface affiche le **nombre réellement chargé** par son catalogue ; `—` si indisponible.
- **22 sources** : institutions et fournisseurs **référencés**, jamais 22 connecteurs de production prétendument actifs.
- Les composants de marchés ne doivent pas simuler de cotations. Le secteur « Marchés financiers complets » est annoncé comme futur lorsque le backend ne le couvre pas.
- Les statistiques nationales et internationales doivent garder pays, date, méthode et statut de disponibilité.
- Le site de prévisualisation reste **statique**, sans base de production persistante ; ne jamais annoncer « monitoring temps réel » à partir d'un test Playwright ou d'un inventaire.
- Le globe est toujours le Canvas orthographique réel, et ses couleurs demeurent **illustratives**.

## 5. Vérifications et livraison

Workflow : [World-Vision V2 — Global Intelligence editorial preview](https://github.com/OBIANG5/World-Health-Vision/actions/workflows/whv-v2-global-intelligence-editorial.yml).

Après réussite des tests automatisés, la CI pousse les assets construits **sur `whv-v2-intelligence-browser-preview` seulement**, sans écraser l'aperçu historique :

https://raw.githack.com/OBIANG5/World-Health-Vision/whv-v2-intelligence-browser-preview/index.html

Captures sur cette même branche : `preview-mobile-intelligence.png`, `preview-desktop-intelligence.png`, ainsi que les captures détaillées en artefacts GitHub Actions.

**Ne pas confondre réussite technique et approbation graphique du propriétaire.** La refonte devra être regardée réellement sur l'iPhone du propriétaire, puis ajustée avant fusion et déploiement sur l'URL Vercel permanente : https://world-health-vision-v2.vercel.app

## 6. Suite recommandée après revue visuelle

1. Corriger toutes observations de lisibilité, proportion du globe, zones de clic et densité au-dessus de la ligne de flottaison.
2. Uniformiser davantage les écrans métier profonds (fiche pays, région, convertisseur de devise, comparateur, immobilier, alertes), un écran après l'autre, avec captures réelles et tests.
3. Ajouter une véritable navigation multi-écrans lorsque les services métier seront prêts, sans supprimer les dialogues existants prématurément.
4. Raccorder aux APIs persistantes et mettre en place un contrat normalisé `source / millésime / statut / fraîcheur / valeur`.
5. Mettre en place les tests de performance et d'accessibilité étendus (Lighthouse, axe, clavier, VoiceOver, latences réelles sur iPhone).
6. Fusionner vers `v2` seulement après revue, tests finaux et plan de release immuable sur la **même URL Vercel**.

## 7. Règle de continuité

Pour tout nouveau chat consacré **au logiciel** : commencer par ce fichier, la branche `v2`, les PR et le dernier pipeline. Ne jamais travailler dans `feature/world-vision-media-studio` pour le front du logiciel. Ne jamais interpréter la capture d'un aperçu comme une validation des données live.
