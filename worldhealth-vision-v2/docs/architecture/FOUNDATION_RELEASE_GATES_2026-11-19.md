# World-Vision V2 — chantier Fondation : contrats, jalons et critères de sortie

Date de départ : 2026-11-19. Source canonique : branche `v2`, dossier `worldhealth-vision-v2/`.
Statut : **plan de mise en œuvre + premier correctif de tests en revue**. Ce document n'est ni une preuve de déploiement ni une demande de fusion automatique.

## Vision produit et principes non négociables

La fondation doit permettre à plusieurs applications métier (Money-Vision, Tourisme-Vision, Price-Vision, Trading-Vision, Bourse Afrique, média) d'utiliser les mêmes identifiants géographiques, preuves, données, comptes et notifications **sans devenir un monolithe de pages fictives**.

- Ne jamais compiler ni déployer les dossiers V0/V1 ni les dossiers racine historiques ; seul `worldhealth-vision-v2/` fait autorité.
- Ne pas fusionner les branches média/design en bloc. Préserver les variantes et décisions du propriétaire ; le globe photo-inspiré du 15 novembre reste une variante non approuvée en production.
- Différencier : **source cataloguée**, **source connectée**, **observation réellement ingérée**, **information vérifiée**, **prix en vigueur**, **prix indicatif**. Un catalogue de 22 institutions et 217 pays/territoires ne signifie pas que leurs données sont disponibles.
- Toute valeur doit porter son origine, son horodatage de collecte, sa période de référence, son unité, son statut de licence, ses limites et, si besoin, sa méthode.
- Aucun changement sur la branche `v2` ni le domaine Vercel public avant revue, contrôles CI et confirmation de la source déployée.
- Le média a un workflow éditorial humain indépendant ; aucune publication automatique ou partage de contenus sous licence incertaine.

## Diagnostic observé au départ (ne pas confondre avec un état corrigé)

1. Le dernier workflow `WorldHealth Vision V2 - stable phone preview` de `v2` (run `43468226259`) échoue car `preview-smoke.mjs` tente de cliquer `Carte œil`, un mode supprimé depuis Electric Earth. Le build TypeScript/Vite était auparavant réussi. Cette panne **ne prouve pas un défaut du globe**.
2. Le workflow full-stack temporaire `43468226266` est passé, mais ses conteneurs et sa base sont éphémères : il ne valide pas l'exploitation 24/7.
3. Le domaine Vercel `https://world-health-vision-v2.vercel.app/` sert un aperçu statique avec les scripts `preview-*.js`. Les chemins testés `/api/catalog/countries?limit=2` et `/api/timeseries/sources/coverage` renvoyaient HTTP 404 au contrôle du 18 novembre. Vérifier à nouveau après tout changement de déploiement.
4. `CurrencyPanel.tsx` s'appuie sur `fxApi.ts` et le proxy Vite `/fx-api`, qui n'est configuré que pour le développement. Ne pas prétendre que cet endpoint est disponible sur Vercel sans proxy/API de production.
5. `AlertsPanel.tsx` et `TravelPanel.tsx` sont explicitement « Bientôt disponible ». Les favoris/profils du navigateur ne constituent pas des comptes utilisateur persistants sécurisés.
6. `infra/docker-compose.yml` contient des mots de passe de développement. **Ne jamais exposer ce Compose tel quel à Internet** ; isoler secrets, rôles de base de données, pare-feu, migrations et réseau.
7. Les variantes de globe et de média ne sont pas une justification pour modifier l'interface pendant la stabilisation technique.

## Découpage du chantier Fondation

### F1.1 — Qualité candidate et baseline reproductible [EN COURS]

Livrables :
- Actualiser le test mobile au globe unique, vérifier absence d'ancien Leaflet, sélection géographique, rotation, neuf outils et mention « Aperçu ».
- Workflow indépendant en lecture seule pour chaque PR frontend vers `v2` ; construire **le commit candidat**, non reconstruire par erreur `v2`.
- Injecter les snapshots historiques **uniquement pour les tests hors backend**, avec notice d'absence de données live ; ne publier aucun build en dehors d'une release approuvée.
- Captures d'écran iPhone et bureau archivées comme artefacts de CI.
- Documenter explicitement les échecs et ajuster les assertions uniquement lorsque les exigences réelles du produit ont changé.

Critères de sortie :
- [ ] Workflow de validation candidat **vert** sur le commit final.
- [ ] Zéro erreur JavaScript sur les deux tailles de navigateur.
- [ ] Un pays est sélectionné, sa fiche est ouverte/fermée ; Terre tournée au pointeur ; neuf outils atteignables.
- [ ] Aucun écran Leaflet supprimé n'est réintroduit et aucun chiffre réel fictif n'apparaît.
- [ ] Revue des captures et approbation avant fusion. **F1.1 non terminée tant que ces preuves ne sont pas acquises.**

### F1.2 — Contrat de sécurité et déploiement permanent [À FAIRE]

- Choisir un hébergement réel du backend Java/Python et PostgreSQL/TimescaleDB, compatible avec les contraintes du compte et le coût cible.
- Séparer les fichiers de développement des configurations de production ; secrets uniquement par variables protégées ou gestionnaire de secrets, jamais dans Git ou dans les réponses API.
- Restreindre les ports de base, TLS, CORS, rôles lecture/ingestion, politiques de migration et rotation des identifiants.
- Sauvegardes automatiques chiffrées et **test de restauration**, non simple existence d'une sauvegarde.
- Vérifications de déploiement atomique et de retour arrière ; aucun nouveau build statique prétendant être une release full-stack.

Sortie : configuration revue, base non exposée, restauration prouvée, checklist d'incident et accès autorisés testés.

### F1.3 — Vraie chaîne de données jusqu'au site public [À FAIRE]

- Passer de : fournisseur → `ingestion-service` → TimescaleDB → API `timeseries/analytics` → `gateway` → navigateur Vercel.
- Valider d'abord **une seule série mesurée**, avec sa période, sa source, sa fraîcheur et un repli explicite en cas de panne.
- Établir le routage HTTPS réel entre le domaine Vercel et l'API sans proxy Vite implicite.
- Tester 200/4xx/5xx, réessais, débit, CORS et « aucune donnée » ; interdire les réponses synthétiques dans le chemin production.

Sortie : une vraie observation, stockée et visible, persiste après redémarrage du backend, et sa source peut être ouverte.

### F1.4 — Compte minimal et moteur Watch [À FAIRE]

- Une identité authentifiée, règles de visibilité entre comptes, conservation et suppression RGPD, un journal d'audit proportionné.
- Modèle `WatchRule` + `Observation` + `Evaluation` + `NotificationDelivery` ; déduplication par seuil/franchissement, contrôle de fréquence, reprise après panne.
- Premier cas : alerte de change sur une paire variable, **pas** une alerte trompeuse sur une parité légale fixe.
- Notification initiale par canal autorisé et consenti, avec affichage de la source, du taux et de l'heure ; pas d'affirmation « temps réel » pour des taux quotidiens.

Sortie : une règle survit au redémarrage, se déclenche une seule fois à bon escient, journalise et permet de se désabonner.

### F1.5 — Pilote de valeur internationale [À FAIRE]

- Cas France / Gabon / Côte d'Ivoire / États-Unis / Japon : formats de monnaies, fuseaux, sources et limites selon disponibilité réelle.
- Money-Vision : convertir + historique + seuil ; comparateur des frais réels de transferts **uniquement après accès partenaire**.
- Signal géopolitique GDELT / logique EarlyForge : nouvelle collection distincte des statistiques officielles, avec liens de preuve et incertitudes, pilote limité et contrôlé.
- Tests UX sur téléphone, faible bande passante, langue et accessibilité ; instrumenter coût d'API et taux d'erreur.

Sortie : l'utilisateur peut accomplir un besoin réel sans ressaisir la même chose à chaque visite ; aucune donnée non vérifiée n'est affichée comme fait.

## Décision d'architecture Watch et collecte

Le moteur de surveillance doit être mutualisé, mais les adaptateurs et règles métier distincts :
- FX indicatif : taux de référence et date de fixing ; pas de conversion bancaire garantie.
- Travel : offre datée, bagages/taxes, disponibilité à revalider, contraintes opérateur.
- Courses : magasin/lieu, produit/EAN, quantité et prix unitaire, méthode et fraîcheur ; couverture incomplète explicitée.
- Trading : cotations sous licence, fréquence des données, risques ; gestion des ordres hors du moteur général.
- Monde : événement GDELT = événement **rapporté**, vérification indépendante avant publication.

Schéma conceptuel : `Provider` → `RawObservation` → `CanonicalObservation` → `WatchEvaluation` → `NotificationOutbox`; journaliser les transitions et les écarts source/notification.

## Séquence de PR et règles de livraison

1. PR **F1.1** (celle-ci) : qualité du frontend et baseline, **aucun déploiement**.
2. PR **F1.2** : configuration de production et sécurité (sans véritables secrets committés).
3. PR **F1.3** : connectivité + une vraie série de bout en bout, avec test sur domaine public.
4. PR **F1.4** : authentification et moteur de surveillance.
5. PR **F1.5** : première alerte Money-Vision et pilote GDELT séparé.

Pour chaque PR : cadrage → tests automatiques → inspection manuelle des effets visibles → statut des données/sources → coût d'exploitation → revue → fusion → validation post-déploiement sur le domaine stable. Un CI vert n'est jamais assimilé à une validation visuelle, juridique ou commerciale.

## Références techniques

- `frontend/web-v2/preview-smoke.mjs`
- `frontend/web-v2/globe-smoke.mjs`
- `.github/workflows/whv-v2-stable-preview.yml`
- `.github/workflows/whv-v2-fullstack-audit.yml`
- `infra/docker-compose.yml`
- `frontend/web-v2/src/api/fxApi.ts`
- `frontend/web-v2/src/components/layout/AlertsPanel.tsx`
- `docs/architecture/vision-produit-et-jalons-v2.md`
