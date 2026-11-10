# WorldHealth Vision V2 — Vision produit et jalons de qualité

> Document directeur du **logiciel économique**, version active `worldhealth-vision-v2/`.
> Il se fonde sur la vision exprimée dans les échanges historiques du projet, et sépare les décisions produit, les fonctions testées et les ambitions futures.
> Ne pas confondre `catalog.source` (source enregistrée) et des observations effectivement collectées.

## Vision

Faire de WorldHealth Vision une plateforme mondiale d'intelligence économique **multi-sources, pédagogique, visuellement excellente et utile à la décision**.

L'utilisateur doit pouvoir :
- comprendre la dynamique d'un pays, d'une région ou d'un continent sans être économiste ;
- voir les chiffres **avec leur année, définition, unité, source, fraîcheur et limites** ;
- confronter des sources institutionnelles, de recherche, communautaires et, légalement, de marché/terrain ;
- voir quand les sources divergent plutôt qu'un « score magique » qui dissimule les désaccords ;
- prendre de meilleures décisions concrètes : budget, devises, voyages, logement, comparaison de pays, suivi des risques.

Une source n'est jamais intrinsèquement « sans biais ». La plateforme doit expliquer les méthodologies et les limites. Les observations non comparables ne doivent pas être agrégées ou présentées comme équivalentes.

## Contrat de vérité des données

Pour chaque résultat économique présenté à l'utilisateur, pouvoir distinguer :
1. **Enregistrement** : la source est connue du catalogue, même sans observation disponible.
2. **Disponibilité** : au moins une observation utilisable est réellement stockée.
3. **Nature** : observation mesurée, estimation, donnée manquante ou supprimée.
4. **Période** : quand la valeur s'applique (année/mois/date), distincte de la date de collecte.
5. **Provenance** : source, jeu de données, run d'ingestion et éventuellement méthodologie.
6. **Comparabilité** : unité, couverture géographique/temporelle, définition et éventuelles divergences entre sources.
7. **Fiabilité opérationnelle** : échecs d'ingestion, retard de publication, représentativité, licence et restrictions de réutilisation.

Une interface ne doit pas déclarer un service « connecté » sans preuve d'une connexion active. Aucun chiffre, source ou recommandation ne doit être inventé si le backend ou les données manquent.

## Jalons successifs, chacun avec critères de sortie

### Étape 1 — Transparence de couverture des sources

**Objet :** passer de « 22 sources répertoriées » à « voici celles qui possèdent vraiment des observations ».

- Endpoint lecture seule dans `timeseries-service` : `GET /api/timeseries/sources/coverage`.
- Compteurs calculés à partir des observations canoniques dédupliquées, avec distinction `OBSERVED` et `ESTIMATED`.
- Interface Sources : état vérifié/non vérifiable, nombre de valeurs, couverture pays, période et collecte, recherche et filtres.
- Tests Java/PostgreSQL avec source mesurée, estimée et absente ; tests full-stack sur catalogue vide.
- **Limite :** ce jalon mesure la disponibilité, **pas** la qualité statistique ni la fraîcheur suffisante d'une source. Une API de couverture ne réalise pas d'ingestion.

### Étape 2 — Données réelles et comparaison rigoureuse

- Exécuter des pipelines réels depuis au moins deux organismes sur des indicateurs réellement comparables, sans réutiliser les mêmes chiffres sous plusieurs étiquettes.
- Vérifier les droits/licences, la robustesse des téléchargements, la traçabilité des runs, les doublons, les périodes et la fraîcheur.
- Tests d'intégration ingestion → PostgreSQL/TimescaleDB → API → interface, avec valeurs réelles non fictives.
- Montrer les divergences **sans interprétation excessive**, avec le nombre d'observations et le niveau de confiance justifié.
- Aucune promesse de données « temps réel » si la publication est annuelle ou trimestrielle.

### Étape 3 — Produit pays / régions / continents

- Fiches pays et régions complètes, rapides, accessibles sur téléphone comme sur ordinateur.
- Indicateurs et comparateurs connectés aux vraies données ; indicateurs absents explicitement signalés.
- Validation des correspondances géographiques continent/région/sous-région et de la représentativité.
- Mesurer réellement les temps de chargement et améliorer les principaux goulots d'étranglement.

### Étape 4 — Services de décision concrets

- Convertisseur et comparateur de devises avec date et nature des taux.
- Pouvoir d'achat, coût de vie réel et budgets comparables, sans cacher les limites des paniers.
- Comparateur de destinations, hébergements/immobilier fondés sur des sources licites et proches du terrain.
- Sécurité traitée par familles d'indicateurs et mises en garde, pas par indice unique trompeur.
- Watchlist, alertes significatives, exports CSV/PDF avec méthodologie et métadonnées.

### Étape 5 — Produit exploitable et sûr

- Backend permanent avec stockage durable, secrets non codés en dur, authentification et règles RGPD effectives.
- Supervision technique, erreurs visibles, métriques, audits de provenance, budgets d'API, stratégie d'incident.
- Tests de charge et tests mobiles de bout en bout sur le domaine réellement hébergé.
- Ne pas considérer la réussite d'un environnement Docker éphémère comme une mise en production.

## Extension future : média World-Vision supervisé

Le média constitue **un domaine produit distinct** qui pourra exploiter les analyses économiques de WorldHealth Vision sans confondre données statistiques et événements journalistiques.

Vision cible :
1. veille automatisée des actualités internationales et des signaux économiques ;
2. collecte depuis des sources traçables, datées et légalement réutilisables ;
3. regroupement des dépêches, validation croisée et attribution claire ;
4. préparation de propositions éditoriales, scripts, graphiques, visuels et formats courts ;
5. **validation humaine explicite avant publication** par le responsable éditorial ;
6. programmation et diffusion par canaux autorisés (site, messagerie, plateformes vidéo/sociales) ;
7. suivi des corrections, droits d'auteur, décisions éditoriales, performances et audit.

Le but est **d'automatiser le travail préparatoire tout en laissant à l'utilisateur le contrôle de la ligne éditoriale**. Aucun système de publication autonome ne doit être activé simplement parce qu'un texte ou un visuel a été généré.

**Ordre retenu : d'abord finir le logiciel économique V2 et son socle de données.** Le média sera conçu comme une extension professionnelle, après stabilisation des données et des services.
