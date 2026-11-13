# World Health Vision V2 — Electric Earth

Mise à jour : 13 novembre 2026. Document de continuité pour les reprises de conversation.

## Décision visuelle de référence

L’image fournie par le propriétaire représente **un œil horizontal lumineux bleu/cyan**, une **sclérotique blanche**, et au centre **une Terre sphérique montrant l’Afrique, l’Europe et l’Atlantique** : océans bleu vif, forêts vertes, désert sable jaune/ocre, contours des pays blancs. Elle est la **référence esthétique** de la nouvelle V2.

Le moteur Canvas est une interprétation interactive **codée** de cette référence, pas une reproduction photographique à l’identique de l’image source. Il conserve les frontières géographiques réelles, le glissement tactile, la rotation douce, le zoom, et le clic ouvrant les véritables fiches pays existantes. Le mode alternatif historique Leaflet / « Carte œil » a été explicitement supprimé à la demande de l'utilisateur. Les codes de couleur du globe sont décoratifs, ne constituent **ni mesures climatiques ni statistiques géopolitiques**.

## Palette

| Rôle | Hex |
| --- | --- |
| Espace nocturne | `#010623` |
| Océan profond | `#043CA3` |
| Bleu électrique | `#0469CF` |
| Cyan de l'œil | `#35DFFB` |
| Blanc de lecture | `#FFFFFF` |
| Papier très clair | `#F5FAFF` |
| Forêt | `#267C48` |
| Sahara / terres arides | `#D5A656` |
| Encre des textes | `#06163B` |

Les contenus, sources et outils utilisent des **cartes claires et opaques** pour une lisibilité mesurable ; le fond de ciel nocturne est réservé à la zone du globe.

## Navigation et domaines

1. Pays & régions — profils pays, régions, favoris et découverte géographique.
2. Économie & marchés — devises, pouvoir d'achat, conseiller économique ; marchés financiers complets restent à connecter.
3. Voyager & vivre — tourisme, destinations, installation, immobilier et retraite.
4. Sécurité & vigilance — panneaux d'alertes existants ; ne **jamais** représenter un niveau de sécurité officiel ou un flux temps réel non vérifié.
5. Tous les outils / Sources & méthodologie — accès transversal, preuves, dates, limites.

Tous les émojis décoratifs des principaux menus et panneaux sont remplacés par les **icônes SVG locales** de `components/ui/WorldIcon.tsx`. Les drapeaux de pays restent des pictogrammes nationaux authentiques, non des icônes de navigation.

## Tests et fiabilité

- `npm ci`, `npx tsc -b`, `npx vite build --base=./`.
- `node globe-smoke.mjs` : globe unique, couleurs de l'œil / continents, sélection pays, rotation, formats iPhone et bureau.
- `node editorial-smoke.mjs` : navigation par thèmes et ouvertures de panneaux existants.
- `node contrast-smoke.mjs` : contrastes réels de libellés clés ≥ 4,5:1 en Chromium.
- `.github/workflows/whv-v2-electric-earth.yml` pour les preuves automatiques et les captures.

CI de la branche source réussie : https://github.com/OBIANG5/World-Health-Vision/actions/runs/43463456008
Fusion de la refonte : PR #15 https://github.com/OBIANG5/World-Health-Vision/pull/15

## Éditions et publication

- Dépôt : `OBIANG5/World-Health-Vision`, **V2 canonique : branche `v2` et répertoire `worldhealth-vision-v2/`** ; `main` est l'ancienne V0, pas la plateforme à améliorer.
- Branche de compilation/aperçu : `preview/whv-v2-complete-current-2026-11-10` ; build publié dans `whv-v2-browser-preview` après tests.
- **Adresse Vercel permanente** : https://world-health-vision-v2.vercel.app — ne **pas** changer l'URL pour chaque version.
- Le projet Vercel n'a pas encore une connexion Git native vérifiée. En l'absence d'autorisation GitHub, publier le **contenu exact d'une compilation immuable** via une nouvelle release Vercel et revérifier le domaine ainsi que ses tests de navigation ; ne jamais mélanger deux compilations.
- L'adresse est pour l'instant un **aperçu statique**. La simple présence de 22 institutions et d'un inventaire national ne prouve pas que les connecteurs de données ou alertes sont opérationnels.

## Pistes de prochaines améliorations

Après validation visuelle de la nouvelle identité sur téléphone : étudier le rendu des régions/côtes par rapport à la référence ; mesurer FPS et énergie sur iPhone physique, améliorer les outils tourisme, comparaison de pays, marchés financiers et sécurité avec des sources officielles datées et vérifiables, rendre la synchronisation GitHub/Vercel automatique après autorisation. Éviter de remplacer le logiciel multi-modules par une maquette à une seule page.
