# Reprise du fil « Grosses actus mondiales » — World-Vision (12 novembre 2026)

> Document de continuité, reconstitué à partir de l'historique accessible et **contrôlé contre le code GitHub** au 12/11/2026.
> Il ne prétend pas être une retranscription littérale intégrale d'un chat bloqué.
> Les décisions, le code existant, les tests observés et les ambitions non réalisées sont **séparés**.

## 1. Identité et histoire du projet

World-Vision a d'abord été conçu comme un média d'actualité internationale
(chaîne WhatsApp, puis TikTok/vidéos courtes), avec le logo œil/planète
et la devise préférée « Voir le monde, le comprendre. ».
La vision technique parallèle était une plateforme mondiale de compréhension
de l'économie, des conditions de vie, des pays et des régions.

Les deux produits restent **distincts** :
- **WorldHealth Vision V2 économique** : le produit actif et canonique,
  dans `worldhealth-vision-v2/`. On ne modifie pas V0/V1 pour poursuivre V2.
- **World-Vision Media Studio** : futur logiciel éditorial et chaîne média
  supervisée par l'humain, sur `feature/world-vision-media-studio`.
  Ne pas transférer ses pages dans V2 sans spécification explicite.

## 2. Historique éditorial retrouvé

- 26 août : formats de brèves WhatsApp, initialement 6 h, 12 h, 18 h, 21 h,
  visuels verticaux, images fortes, logo/date/rubrique/source,
  information fiable avec vérification humaine.
- 27 août : priorité à « une information = une vidéo », ~10–20 secondes,
  au maximum 30 secondes, accroche immédiate, vidéo témoin ou visuel
  authentique lorsque la licence le permet, ton pédagogique.
- Veille horaire élargie aux événements majeurs, surprenants et nationaux,
  recoupements Reuters/AP/AFP et médias locaux et sources primaires.
- Exemples de sujets expérimentés : catastrophe dans l'Himalaya,
  guerre en Ukraine, violences en Haïti, IA et développement, Nvidia,
  cybersécurité Aur0ra/Cursor et l'accroche « Ils ont dit à l'IA :
  c'est juste un test ». Les formulations/chiffres journalistiques
  doivent toujours être revérifiés avant une nouvelle publication.
- Style : réalisme photographique et visuel, pas d'apparence
  caricaturale ou d'effets dorés, texte court et lisible sur mobile,
  zones d'interface TikTok dégagées ; première image = accroche forte.
- La tâche horaire « World-Vision Breaking News » a été
  **désactivée le 11 septembre 2026 à la demande de l'utilisateur**.
  Ne pas la réactiver sans demande explicite.
- En novembre : périmètre média confirmé : français d'abord, jusqu'à
  une vidéo/heure comme **objectif**, sélection selon intérêt éditorial,
  validation humaine du sujet, angle, montage et publication.

## 3. V2 — ce qui existe dans le dépôt

Dépôt : `OBIANG5/World-Health-Vision`, branche canonique `v2`.
Code cible exclusivement :
- `worldhealth-vision-v2/frontend/web-v2` : React, TypeScript, Vite ;
- `worldhealth-vision-v2/services` : gateway Java Spring Boot,
  catalogue Java/PostgreSQL, séries Java/TimescaleDB,
  analytics Python/FastAPI, ingestion Python/FastAPI ;
- `worldhealth-vision-v2/infra` : infrastructure/test Docker ;
- `worldhealth-vision-v2/docs` : architecture, qualité, sécurité, RGPD.

Les fonctionnalités retrouvées dans le code :
1. Identité visuelle et carte du monde « œil » historique.
2. Globe orthographique interactif, zoom/rotation/toucher/clic/souris/clavier,
   avec retour à la carte d'origine.
3. Catalogue pays, recherche, fiches pays et métadonnées.
4. Régions/sous-régions, navigation depuis une région vers ses pays.
5. Séries historiques par indicateur, graphiques Recharts, sources, années.
6. Confrontation multi-sources, alignement temporel, qualité, estimation,
   fraîcheur, divergences sans faux consensus.
7. Panneau Sources & Méthodologie, audits de disponibilité et de lacunes.
8. Sources nationales dans les fiches pays et comparaison documentée
   national ↔ international.
9. Menu Outils : Pouvoir d'achat, Score destination, Expat & Retraite,
   Immobilier, Devises, Conseiller économique, Favoris, Voyage, Alertes.
10. Profil utilisateur, FR/EN, UI mobile, export CSV/PDF partiellement codés.

**Limites vérifiées** :
- Le frontend publié via GitHack est **statique** ; le backend permanent
  n'a pas été vérifié comme déployé.
- Catalogue de **22 sources internationales** ≠ 22 flux de données
  opérationnels, ni 22 sources indépendantes pour chaque indicateur.
- Snapshot pays Banque mondiale : **217 pays/territoires** ; le GeoJSON
  géographique peut avoir une autre cardinalité.
- Couverture des institutions nationales encore partielle :
  Gabon, France, Nigeria, États-Unis ; BEAC partagée pour six pays.
- Voyage/Alertes non finis ; une fiche pays peut manquer de séries réelles.
- Les moteurs `audit-service`, `jobs-service`, `user-service`,
  `compute-engine-service` sont différés selon la roadmap.
- Les fonctionnalités bancaires/crypto et IA prédictive avancée restent différées.

## 4. Principales avancées techniques de novembre

### 5 novembre
Synchronisation vers GitHub de code/docs/configs V2 ; les gros jeux de données,
environnements locaux et éléments personnels n'ont pas tous été transférés.

### 10 novembre
Audit V2, corrections de navigation/tactile/panels, tests gateway/catalogue,
ingestion, analytics, frontend ; aperçu mobile React réel sans backend permanent.
Retrait de réponses fictives du conseiller ; prise en compte de l'absence
de données économiques dans la prévisualisation.

### 12 novembre — local-first et Gabon
- Registre des institutions nationales, statut connexion/recherche et portée
  BEAC/CEMAC ; couverture manquante explicitée.
- Cas INSTAT : RGPL 2026, **3 518 621 résidents**, provisoire ;
  Banque mondiale WDI 2025 : **2 593 130 personnes**.
  Années/méthodes distinctes : **pas de différence arithmétique
  présentée comme une divergence validée**.
- La série WDI réelle a été ingérée en **TimescaleDB éphémère** et lue
  via la gateway lors de la CI, pas dans une base de production durable.
- Radar sites institutionnels : seulement `HEAD` sur domaines autorisés,
  sans scraping, sans inventer une donnée ou une disponibilité.
  Un 403/405/429 ne prouve pas qu'une institution est hors ligne.
- Tests Java, Python, TypeScript et Docker décrits dans les rapports
  `docs/architecture/` et workflows GitHub Actions.

### 12 novembre — globe
Intégration sur `v2` au commit `856e47ac2db51b8d429ccdce88ed416d91f19b9d` :
globe réel basé sur `countries.geojson`, gestes et clics pays,
conservation de la carte œil et de ses outils.
Full-stack CI :
https://github.com/OBIANG5/World-Health-Vision/actions/runs/43286983972

## 5. Même lien de prévisualisation à conserver

Branche de sortie existante : `whv-v2-browser-preview`.
Lien **de développement** dont le chemin reste inchangé :
https://raw.githack.com/OBIANG5/World-Health-Vision/whv-v2-browser-preview/index.html

Le lien historique de production `rawcdn.githack.com` avec **SHA figé**
reste un instantané immuable : le modifier en conservant exactement
cette URL est impossible par la mécanique de cache GitHack.
Le lien de branche `raw.githack.com` reflète en revanche les mises à
jour dans les minutes suivant un push (éventuellement plus sous charge).

Depuis le 12/11 :
`.github/workflows/whv-v2-stable-preview.yml` construit le vrai
frontend V2 avec `VITE_WHV_PREVIEW_MODE=true`, réinjecte les scripts
d'aperçu (catalogues SQL versionnés **pas de statistiques simulées**)
et met à jour **la même branche**.
Première publication automatique réussie :
https://github.com/OBIANG5/World-Health-Vision/actions/runs/43292544087
Les modifications backend ne deviennent pas des données live tant qu'aucun
backend durable n'est relié.

## 6. Travail à poursuivre sans changement de chantier

1. Consolider la publication automatique par une validation navigateur
   sur le **résultat publié** (mobile, desktop, globe, carte œil,
   Sources, menus) ; bloquer la publication si les contrôles échouent.
2. Choisir puis réaliser un **vrai connecteur statistique national** dont
   les droits, données, périodes et formats sont vérifiés, en séparant
   les sources nationales et internationales. Ne pas injecter des
   snapshots fixes sous l'étiquette « temps réel ».
3. Persister les données ingérées (PostgreSQL/TimescaleDB), versions,
   `source_run`, provenance, planification, sauvegardes et supervision.
4. Raccorder le frontend réel et les outils au backend sécurisé ;
   développer ensuite les modules Voyage, Alertes et analyses de décision.
5. Étendre progressivement la recherche locale à chaque pays, y compris
   langues régionales et publications indépendantes, sans déclarer une
   couverture exhaustive fictive.
6. Garder le média supervisé humainement séparé jusqu'à une intégration
   voulue, documentée et respectueuse des droits.

## 7. Règles permanentes

- Travailler sur la V2 canonique, pas sur une nouvelle page isolée.
- Vérifier **ce qui marche réellement**, pas seulement la présence de code.
- Surveiller licences, dates, unités, méthodes, biais et provenance.
- Jamais de chiffre, comparaison, actualité, fiabilité ou alerte inventé.
- Ne pas supprimer la carte œil, les fiches, les outils et l'historique.
- Prévisualisation mobile après chaque modification via **une seule URL**.
- Aucun média autonome, bot de publication ou veille réactivée sans demande.
