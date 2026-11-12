# V2 — premier radar de disponibilité des institutions nationales

**Objectif :** commencer à établir un contrôle reproductible des
institutions répertoriées **sans** produire de pseudo-actualités ou de
pseudo-statistiques. Cette brique suit le registre pays, incluant le
cas particulier de la BEAC, banque centrale commune à six pays.

## Fonctionnement réellement codé

`ingestion_service.source_availability_audit` :

1. Lit `GET /api/catalog/local-sources/coverage?limit=500`
   dans le service Catalogue **réel** ;
2. pour les seuls pays dotés de sources, lit leur
   `GET /api/catalog/countries/{ISO3}/local-context` ;
3. exige des réponses cohérentes (ISO3, comptes, nombre de pages,
   organisme, URL) ; en cas de catalogue indisponible,
   l'audit **échoue** plutôt que d'inventer des sites ou des résultats ;
4. fusionne les institutions partagées par `sourceCode` seulement
   si les URLs et catégories coïncident : **BEAC est contrôlée une
   fois**, en conservant les six ISO3 de sa compétence ;
5. vérifie une liste **explicitement autorisée de domaines HTTPS**
   avant toute demande. Refus des ports non standard, identifiants,
   IP privées et noms de domaine externes ;
6. émet une requête `HEAD` sans suivre automatiquement les redirections
   et sans télécharger de pages, fichiers, publications, images ou données ;
7. documente uniquement la réponse HTTP et l'heure du contrôle.
   `SITE_RESPONDED` signifie que le serveur a répondu ; **cela ne
   valide pas les données ni même la fraîcheur éditoriale du site** ;
8. produit du JSON avec les organismes, pays, statuts et limites,
   à examiner ensuite par un humain.

### États possibles

`SITE_RESPONDED`, `REDIRECT_REVIEW_REQUIRED`,
`ACCESS_RESTRICTED`, `RATE_LIMITED`,
`HEAD_NOT_SUPPORTED`, `UPSTREAM_ERROR`,
`HTTP_UNEXPECTED`, `TIMEOUT`,
`TRANSPORT_ERROR`, `UNAPPROVED_HOST`.

Ne jamais conclure d'un 403, 405 ou 429 que l'institution ou
ses données n'existent plus : les restrictions techniques peuvent
bloquer uniquement le contrôle HEAD. Une redirection sortant de
la liste revue **n'est pas suivie**.

## Run Docker isolé et rapport

Workflow :
`.github/workflows/whv-v2-country-local-source-availability.yml`

Le job :
- démarre le Catalogue V2 et sa passerelle sur un PostgreSQL jetable ;
- vérifie les règles de sécurité via des tests Python sans réseau ;
- lit la liste réelle des institutions ;
- effectue les contrôles des 9 organisations uniques identifiées
  à ce stade (Gabon, France, Nigeria, États-Unis, et BEAC pour six pays) ;
- vérifie les métadonnées et conserve l'audit dans un
  *artifact* GitHub Actions de 14 jours ;
- détruit la base de test à la fin.

**Limite d'automatisation :** un workflow n'est **pas** à lui seul
une infrastructure de surveillance continue. Un déclencheur GitHub
`schedule` ne fonctionnerait pas sur la branche secondaire `v2`
si `main` reste la branche par défaut. Il faudra déployer un
planificateur durable contrôlé, avec persistance des preuves et
alertes humaines ; ne pas annoncer des surveillances en continu
ou des résumés médiatiques programmés.

## Séparation du futur média

Le média World-Vision pourra utiliser ce radar pour repérer un lien
à revalider, **pas** pour décider qu'une information est vraie ni
pour publier automatiquement. Une source locale, un article la citant
et un chiffre repris par un organisme international peuvent provenir
d'un **même** recensement initial.

Avant tout véritable flux éditorial : auteur de la publication,
horodatage, pays, métrique, recoupement indépendant, statut des
révisions, autorisation de réutilisation et validation humaine.

## Prochain incrément

Après validation de ce premier radar, choisir un flux statistique
national ou régional **exploitable selon sa licence**, développer le
connecteur réel (date/indicateur/méthode/source_run), écrire dans
TimescaleDB, vérifier via gateway et interface, puis journaliser
les mises à jour et les changements de méthodologie.
