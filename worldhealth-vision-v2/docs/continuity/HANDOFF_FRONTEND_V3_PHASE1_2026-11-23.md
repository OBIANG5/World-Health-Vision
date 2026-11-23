# World-Vision V3 — refonte du vrai FRONTEND, plan et continuité CANONIQUE
**23 novembre 2026 · PR DRAFT #150, branche `frontend/v3-country-services-news-follow-2026-11-23`**
**ATTENTION : ce dossier est un journal de développement. La refonte intégrale, le globe 3D et les vraies notifications NE sont PAS terminés. NE PAS fusionner ni annoncer une production sans validation.**

## 0. Primauté des sources et de la demande
- [README design](../design/README.md), [reset visuel](../design/VISUAL_RESET_BEFORE_IMAGES_2026-11-23.md), [wireframes corrigés](../design/WIREFRAMES_WORLDVISION_RESET_V2_2026-11-23.md), [Country Hub / tous services](../design/WORLD_VISION_COUNTRY_HUB_AND_GLOBAL_IA_2026-11-23.md), [contrat de 11 Visions et 20 outils](../design/country-hub-capability-blueprint.v1.json). Tout est sur la branche parente PR #149. **Les anciennes maquettes A/B/C sont rejetées.**
- Message utilisateur le plus récent : refaire **tout le vrai frontend** en phases méticuleuses ; menu concis, **Actualités ET Suivre** indépendants (mais notifications d'actualités de pays souhaitées), 11 appellations de Vision réellement retenues et découvrables, téléphones, géographie réelle pays, œil–globe original, icônes SVG homogènes, police forte et retenue, navy/blanc/cyan rare, pas de mosaïques décoratives ni de fausses données.
- Le SITE PUBLIC/mobile ancien **ne doit pas être remplacé par une version non évaluée** : toute mise à jour sera précédée d'une preview protégée sur SHA + CI complets + revue visuelle + consentement propriétaire.
- Ne jamais confondre **World-Vision V2 logiciel** avec **World-Vision Média** Remotion/TikTok ni toucher `main`/V0/V1/chaîne Trading séparée.

## 1. Tranche FRONT-V3/1 — code exécuté, pas maquette (sur PR #150)

### Navigation et expérience
- `src/App.tsx` : menu compact aligné à gauche **Explorer | Comparer | Services ▾ | Actualités | Suivre**. Recherche et langue à droite. Actualités ouvre la sous-rubrique du pays actif, ou invite à choisir un pays depuis l'accueil neutre. Suivre ouvre les favoris existants, **pas une fausse boîte de notification opérationnelle**. Requêtes country et changement de section isolés par key.
- `src/components/layout/ServicesMegaMenuV3.tsx` : remplace l'ancien empilement de catégories + répertoire produit dupliqué : 6 familles sélectionnables, vrais modules locaux existants, les **11 noms de Vision** depuis `visionProducts.ts`, états partiel/prévu/explorable, un seul contenu de tâche.
- `src/product/visionNavigation.ts` : mapping typé unique groupe/vision/pictogramme utilisé par menu, accueil et pays. La cohérence ne dépend plus de trois listes copiées-collées.
- `src/components/layout/WorldLandingV3.tsx` : accueille le vrai globe interactif `GlobeMap.tsx` (pas une photo Apollo), une recherche et quelques actions sobres, puis index de besoins à panneau adaptatif. Suppression de l'ancienne homepage bureautique et des gros bloc promotionnels qui recouvrent le globe. **Le globe reste une projection Canvas2D provisoire, PAS un monde 3D abouti.**
- `src/styles/world-v3.css` : couche de transition isolée (nav desktop, menu mobile, couverture plein écran de la fiche pays, services, silhouette SVG, accueil, actualités). Les 5 anciennes cascades ne sont PAS encore nettoyées : la refonte finale exigera un design system unique, le remplacement des styles au fur et à mesure, PAS plus de rustines.
- `src/components/layout/EyeLayout.tsx` : petit marqueur œil–Terre désormais **deux arcs ouverts**, au lieu de la sclère blanche fermée. C'est un logo *intermédiaire codé* : le master officiel fourni par le propriétaire n'est pas encore intégré comme SVG master licencié et validé.
- `src/components/map/GlobeMap.tsx` : dessin œil Canvas changé vers **deux arcs ouverts cyan/blanc**, blanc massif supprimé, Terre reste au premier plan. Limite majeure : rendu du globe encore simplifié, altitude/nuages/LOD/rotation premium à prouver par moteur cartographique réel.

### Géographie et fiche pays
- `src/components/country/CountryGeographicHero.tsx` : vraie silhouette pays issue **du même `/countries.geojson` embarqué** que le Globe, coordonnées projetées, contour/zoom et contrôles, identité/capitale, actions Comparer/Actualités/Suivre. **Pas de photo en haut** ; aucune fausse province/relief. Couverture des territoires hors fichier : état honnête « carte non disponible », texte et services restent accessibles. Algorithme bounding box itératif (pas de `Math.min(...100000)`). Ce composant n'est PAS encore une belle carte multi-couches MapLibre/Cesium 3D.
- `src/components/country/CountryDrawer.tsx` : UX pleine page sous le header, `Overview` par défaut, vrais repères Banque mondiale, Source/News/Compare/Data préservés, bloc ServiceDirectory directement en vue pays et dans Services, actions Money/Travel utilisables selon backend; anciens FX/sécurité sous détail pour transition. Le contexte de sécurité tiré des proxies macro n'est **pas** à promouvoir comme avis de voyage.
- `src/components/country/CountryServiceDirectory.tsx` : liste gauche de six besoins + droite tâches et **11 Visions parents** (non 31 grosses cartes), avec leurs noms exacts, états prudents; limites explicites Gabon/CEMAC/BVMAC ≠ BRVM UEMOA, Price/Panier nécessitent ville/magasin, voyage origine/date à définir, Watch notifications à venir.
- `src/product/visionProducts.ts` : nom de produit `brvm` rétabli **BRVM Vision** en conservant l'ID et le contexte régional.

### Actualités et Suivre — priorité utilisateur
- `Actualités` dans le header et dans la fiche n'est pas une fenêtre de notifications : c'est la lecture des dossiers et sources datés du pays; l'ancien `CountryNewsPanel` demeure **historique**, sans prétention de flux temps réel national généralisé.
- `Suivre` ouvre réellement les pays mis en favoris via Watchlist (état local) ; depuis la fiche et depuis Actualités, le pays peut être enregistré/retiré.
- **Notifications d'actualité automatiques non actives** : besoin d'un `NewsSubscription` côté serveur avec pays/ISO, sujets, langues, sources, événements dédoublonnés et *vérifiés*, consentement, fréquence, annulation, gestion des push/email, fuseaux, RGPD, anti-spam, alertes de rupture d'informations; pas une fausse action visuelle.
- Le futur moteur `Watch Vision` devra réutiliser la même entité d'abonnement pour country news et autres événements, pas reconstruire une alerte différente par service.

## 2. Preuves de non-régression
- Workflow isolé `.github/workflows/whv-v3-frontend-country-hub.yml` : `npm ci`, `tsc -b && vite build`, ESLint strict React/TS, tests statiques Vision/WorldBank, Playwright vrai Vite/React 320/390/820/1440. Vérifie global Services, 11 noms, route pays GAB, GeoJSON SVG, news vs follow, statut, screenshots.
- Tests hérités UX1B `ux1b-sources-smoke.mjs` et `ux1b-no-backend-smoke.mjs` remis à jour **pour le nouveau contrat visuel**, sans supprimer leurs vérifications critiques : provenance, données absentes, 3 sources nationales archivées sélectionnées, original URLs HTTPS, vrai passage recherche→GAB, course GAB→FRA avec réponses tardives.
- Le R1 Radar et R2B continuent de tourner sur cette même branche pour prévenir des régressions qui n'auraient rien à voir avec la partie pays.
- **Ne pas prétendre que React/Chromium = validation artistique mondiale.** Images CI à inspecter avant les décisions suivantes. Des défauts de composition ont été réellement identifiés et corrigés au fil des captures (annuaire sur globe, toast masquant smartphone, ancien grid de tabs écrasé par CSS, répétition de capitale). Les captures exactes et dernière CI seront consignées dans le commentaire PR #150 après la dernière validation.

## 3. Système cible pour des MILLIONS de visiteurs (non prouvé)
- Source de vérité des Visions et routes typées, droits/entitlements backend, liens profonds/pays, langues/territoires, gestion d'états : **une architecture** avant multiplication des composants.
- GeoJSON public cacheable sur CDN et versionné ; **le globe 3D et les frontières régionales ne doivent pas appeler API utilisateur par utilisateur**. Choix de moteur MapLibre/Cesium ou autre après benchmark qualité visuelle/interaction sur iPhone Android bas de gamme, bas débit, memory, coût des tuiles, licences d'imagerie, droits frontières; fallback SVG accessibles et liste pays.
- Datasets Timeseries signés, indicateurs avec période/source/méthode, pas de FX ni prix en `live` si périmètre/droits manquants; API Gateway avec caches TTL/ETags et quotas, source freshness, erreurs 401/403/503.
- Fréquence des actualités et notifications : dédoublonnage, détection d'événements et revues, pas simplement GDELT repris comme vérité, cache et contraintes économiques/clés.
- Cibles à définir avec mesures (LCP/INP/CLS, coûts par 10k/100k/1M sessions, p95/p99, WCAG 2.2 AA, charges, CDN hit ratio, restauration). L'objectif 1M n'est pas déclaré atteint parce qu'une page Vite compile.

## 4. Refonte TOTALE par tranches — travail encore à faire

| Tranche | Parcours concret | Critère d'achèvement |
| --- | --- | --- |
| V3/1 (cette PR) | Monde → Services → carte Gabon → toutes les Visions → Actualités → Suivre | CI R1/R2B/V3 verte sur SHA exact, capture iPhone/desktop, preview SSO/noindex, approbation UX; pas de merge immédiat |
| V3/2 CARTE | Vrai globe œil–Terre immersif 3D → pays → cartes nationales/régionales multicouches | benchmark moteur, sources relief/tuiles, frontières et toponymes vérifiés, consommation GPU/mobile/bas débit et licence |
| V3/3 DOMAINE | Money Vision / Trading Vision / BRVM Vision / Travel/Transport et comparaisons réelles | même AppShell, parcours complets, états honnêtes des sources, aucune commande morte et aucun prix inventé |
| V3/4 NEWS/WATCH | Actualité filtrée par pays/sources → Suivre → notifications par sujet/pays | pipeline flux validés, abonnement consentement, tests dédup/anti-spam/droits/rétractation, notification réellement reçue |
| V3/5 EXPLORATION | Price Vision / Panier Vision, régional/ville, données locales, logements/retraite, Radar, sources, outils pro | fournisseurs localisés réels, data quality, filtres pays/ville, langue et monnaie, permissions |
| V3/6 DESIGN SYSTEM | retire anciens `eye.css/mobile.css/world-editorial/world-electric/country-editorial`, remplace par tokens/composants | une seule charte validée et réellement cohérente, QA iOS Safari/Android, design checkpoints, a11y |
| SCALE/RELEASE | CDN, observabilité, quotas, droits, caching, workers, tests de charge / migrations | budgets financiers et SLO testés, stade PREPROD, approval propriétaire, rollback, puis production |

## 5. Reprise après une déconnexion technique

1. Lire **ce dossier** + [PR #150](https://github.com/OBIANG5/World-Health-Vision/pull/150) + documents design/vision puis code indiqué. Vérifier **HEAD** et CI par `get_pr_info` et `fetch_commit_workflow_runs`; **ne jamais supposer** que le HEAD de ce commentaire est encore le plus récent.
2. Priorité immédiate après interruption : finaliser CI V3/R2B/R1 sur le même HEAD ; examiner Playwright screenshots `v3-artifacts/` par vrai fichier ZIP; aucune image simulée n'est preuve.
3. Ne pas confondre `WorldLandingV3` avec les anciennes maquettes `public/vision-lab/` (archives rejetées). Ne pas pointer vers un ancien déploiement Vercel tant que l'identité du dernier SHA n'est pas vérifiée.
4. Si CI verte, créer **Preview Vercel isolée et protégée** (même projet V2, autoriser uniquement nouvelle branche de Preview dans `commandForIgnoringBuildStep` en conservant restrictions de prod/Média), vérifier commit exact READY, pas de fusion.
5. Demander la revue esthétique **du vrai produit** sur iPhone, puis seulement démarrer V3/2. Documenter chaque décision et limitation. 
6. Production ancienne, PR #148, PR #149, branches MEDIA et Trading séparées restent inchangées. Pas de nouveaux abonnements, backend réel non connecté dans Preview.
