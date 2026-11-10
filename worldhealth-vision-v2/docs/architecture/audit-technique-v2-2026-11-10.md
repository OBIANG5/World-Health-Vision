# WorldHealth Vision V2 — audit technique de continuité

**Date de travail : 10 novembre 2026.**  
**Périmètre exclusif :** `worldhealth-vision-v2/` (V0/V1 et les dossiers racine historiques exclus).  
**Statut :** contrôle en profondeur des flux critiques et vérifications automatiques de build/intégration. Ce document ne prétend pas certifier chaque ligne des centaines de fichiers : les modules non couverts par les tests nécessitent encore des examens ciblés.

## 1. Ce qui se passait réellement dans l'aperçu public

L'aperçu était un build React/Vite original, mais le script `preview-bootstrap.js` répondait aux appels API **à la place des microservices**, avec un seul enregistrement `WORLD_BANK`, une liste limitée des régions et des **snapshots économiques volontairement vides**.

Cela explique l'absence des autres sources et des statistiques régionales dans le site public ; afficher une source enregistrée ne prouve ni l'ingestion de ses observations ni leur actualité.

## 2. Inventaire et contrats

La branche V2 contient les microservices Java `gateway`, `catalog`, `timeseries`, les services Python `analytics` et `ingestion`, une interface React 19/TypeScript, les configurations Docker, les migrations SQL et la documentation.

Le catalogue des migrations V2 enregistre **22 sources**, dont World Bank, IMF, OECD, ILOSTAT, UNODC, UNSD, Eurostat, WHO GHO, Numbeo, UNDP, BIS, ECB, AfDB, ADB et OpenStreetMap.

Le chargement de référence de l'aperçu produit **217 métadonnées de pays**. Le backend éphémère a répondu avec **12 régions/sous-régions comprenant des pays**. Les codes de continents conceptuels (`AFRICA`, `EUROPE`...) n'ont pas encore tous une affiliation géographique correctement renseignée en base ; ils ne doivent pas être présentés comme des continents pleinement opérationnels.

## 3. Corrections du frontend canonique

- `frontend/web-v2/src/App.tsx` : menu Outils et sélecteur pays dans des portails indépendants de la barre horizontale mobile ; montage à la demande des fiches pays/régions ; statut honnête « Aperçu ».
- `frontend/web-v2/src/components/region/RegionDrawer.tsx` : membres réels de la région consultables, accès à leurs fiches, message explicite si les observations régionales manquent.
- `frontend/web-v2/src/styles/country.css` : grille des membres adaptée à l'écran mobile.
- `frontend/web-v2/src/components/layout/EyeMapFrame.tsx`, `components/map/WorldMap.tsx` : mémoïsation des index de pays et maintien de la couche Leaflet/GeoJSON au lieu d'une reconstruction à chaque clic.
- `frontend/web-v2/src/api/worldBankDirectApi.ts` : requêtes groupées WDI/WGI avec repli à concurrence limitée, plutôt que 40+ appels parallèles.
- `frontend/web-v2/src/components/layout/SourceMethodologyModal.tsx` : transparence sur sources enregistrées vs observations effectivement ingérées.
- `frontend/web-v2/src/components/layout/AdvisorPanel.tsx` : suppression des réponses locales fictives et des statistiques attribuées sans données aux fournisseurs.

## 4. Corrections du backend

- `services/gateway-service/src/main/resources/application.yml` : routage POST ciblé vers `/api/analytics/advisor/chat`. L'ancienne règle GET ne pouvait pas transmettre le bouton du conseiller au backend.
- `services/gateway-service/src/test/.../GatewayRoutingIntegrationTest.java` : test du routage POST et maintien des routes d'ingestion privées.
- `services/analytics-service/src/analytics_service/advisor.py` : lecture des champs réels `signalTone`, `latestComparableValue`, `confidenceLevel`, `latestPeriodLabel` et `sourceAudit.primarySourceCode` ; réponse sans données lorsqu'il n'existe aucune observation chiffrée.
- `services/analytics-service/tests/test_advisor.py` : tests de l'absence de fabrication des données et de la provenance.
- `infra/docker-compose.yml` : dépendances de démarrage plus strictes pour les migrations du catalogue et le TimescaleDB.

## 5. Tests effectivement réussis

Sur la branche d'audit, le pipeline a exécuté **27 tests Java** (gateway 19, catalog 7, timeseries 1), **28 tests Python analytics** et **15 tests Python ingestion**. La compilation TypeScript et la production des assets Vite ont réussi.

La session temporaire Docker a montré cinq services applicatifs actifs avec **zéro redémarrage**, les catalogues de sources/régions accessibles, et le nouveau POST conseiller répondant via la gateway sans inventer d'observations.

Dans cet environnement Docker **éphémère** : `sourceRunCount=0`, `observationCount=0`, `latestObservationCount=0`. La réussite du démarrage ne signifie pas que les données de production ont été ingérées.

L'aperçu React a été testé en Chromium mobile avec **neuf entrées du menu Outils**, **22 sources enregistrées**, les régions et la navigation vers les fiches pays. Un test indépendant a contrôlé l'URL CDN publique après le premier avertissement de sécurité GitHack.

## 6. Limites et risques à corriger avant de déclarer le logiciel terminé

1. **Backend non hébergé en continu.** GitHub Actions arrête et détruit l'infrastructure de test ; l'URL publique est une prévisualisation statique, pas un déploiement full-stack permanent.
2. **Aucune ingestion de données économiques validée en production.** La présence des 22 sources dans le catalogue ne garantit pas des séries exploitées. Exécuter/valider chaque pipeline pertinent, ses licences, sa provenance, son année et sa fraîcheur.
3. **Régions et continents.** Les métadonnées et le passage d'une zone à un pays sont opérationnels dans l'aperçu ; les statistiques régionales nécessitent un backend persistant alimenté, et la correspondance géographique des continents doit être terminée avec une source officielle.
4. **Outils non terminés.** Voyage et Alertes sont explicitement marqués « Bientôt disponible ». Les autres panneaux peuvent afficher « données indisponibles » tant que le backend est absent.
5. **Sécurité du déploiement.** Des identifiants et mots de passe de développement figurent dans Compose. Ils doivent être remplacés par des secrets d'environnement avant toute exposition publique. Finaliser également les contrôles d'accès, Keycloak, les permissions, l'observabilité et les tests de charge.
6. **Tests insuffisants sur certains connecteurs.** De nombreux clients/pipelines de sources ont du code, mais ne disposent pas encore chacun de tests de bout en bout sur des jeux de données réels.
7. **Services différés.** Les services `audit`, `user`, `jobs`, `compute-engine` ne doivent pas être déclarés actifs sans implémentation validée.

## 7. Prochaine condition de réussite

Déployer le backend V2 de façon persistante sur une infrastructure avec base PostgreSQL/TimescaleDB sécurisée, charger des observations traçables des sources autorisées, exposer le gateway avec les bons contrôles CORS/authentification, mettre à jour la configuration API du frontend, puis exécuter les mêmes tests dans le navigateur **sur le vrai site hébergé**. Ne pas remplacer ces étapes par une simulation statique.
