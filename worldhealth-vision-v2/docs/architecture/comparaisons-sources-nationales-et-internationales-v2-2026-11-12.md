# V2 — Comparaisons documentées pays par pays (national ↔ international)

> **État :** code implémenté, tests CI à consulter sur le commit associé. Cette
> fonctionnalité est **en lecture seule** et ne signifie pas que les sources
> ont toutes été collectées ni que le backend est déployé en permanence.

## Motivation

World Health Vision doit connaître les vérités et les institutions propres à
chaque pays. Les grands organismes mondiaux publient souvent plus tard des
estimations ou des reprises de statistiques nationales. Une valeur plus récente
d'une institution locale peut être très utile, mais la nationalité de la source
ne garantit pas sa méthode ou son impartialité.

**Exemple de travail :** RGPL 2026 du Gabon, chiffre documenté de 3 518 621
résidents et publication préliminaire homologuée. Toute comparaison avec
`SP.POP.TOTL` de la Banque mondiale doit afficher **l'année du chiffre WDI
réellement stocké**, son statut et la méthode, et ne jamais inventer un écart
entre années différentes.

## Contrats logiciels

1. **Catalogue national** `GET /api/catalog/countries/{ISO3}/local-context` :
   institutions et médias locaux identifiés, lien de preuve, rôle, statut de
   vérification, droits et publications documentées. Une publication
   `DOCUMENTED_NOT_INGESTED` n'est **pas** une observation canonique.
2. **Séries temporelles** `GET /api/timeseries/series/latest` : chiffres
   réellement disponibles en base, avec année, éditeur, jeu de données,
   statut `OBSERVED` ou `ESTIMATED`, dates de publication/collecte.
3. **Comparaison** `GET /api/product/countries/{ISO3}/national-comparisons`
   (passerelle vers Analytics) :
   - `NO_INTERNATIONAL_OBSERVATIONS` — aucune série utilisable n'est
     enregistrée ; **ce n'est pas nécessairement une absence de publication
     dans le monde réel** ;
   - `DIFFERENT_REFERENCE_PERIOD` — années / intervalles différents, pas
     de contradiction chiffrée affirmée ;
   - `SAME_YEAR_METHOD_NOT_VERIFIED` — année complète commune, mais
     définitions/méthodes non encore validées ensemble.
4. **Interface** : sous chaque publication nationale, afficher les chiffres
   internationaux *effectivement reçus*, leurs années et leurs statuts.
   Une panne du backend affiche « comparaison non vérifiable » et **ne se
   transforme pas en données manquantes**.
5. **Contrat futur média** : les mêmes statuts et références pourront
   accompagner une veille journalistique supervisée, sans autoriser un
   contenu à conclure automatiquement à une fraude statistique.

Dans ce jalon, `comparableByMethod=false` et
`numericalDifference=null` **dans tous les cas**. Les chiffres locaux
ne sont donc jamais fusionnés avec la statistique internationale ou
présentés comme une deuxième mesure indépendante sans vérification.

## Règles de robustesse

- ISO3 et indicateur vérifiés lors du retour de TimeSeries ;
- valeurs manquantes, supprimées ou non finies exclues ;
- un organisme publiant plusieurs jeux de données ne compte qu'une fois
  pour cette vue ;
- distinction observation/estimation conservée ;
- limite de concurrence (quatre appels) pour protéger le pool PostgreSQL ;
- aucune valeur historique internationale conservée en dur dans le
  commentaire national (migration Flyway V25) ;
- l'existence d'un article local reprenant un recensement ne crée pas une
  deuxième source statistique indépendante ;
- aucune URL de publication réutilisée sans respecter les conditions
  de licence et d'attribution.

## Validation

Tests de logique Python : années différentes, même année mais méthodes
inconnues, absence de données, doublons par éditeur, mauvais ISO3/indicateur,
statuts non publiables, fuseaux horaires. Test API asynchrone avec connecteurs
simulés, tests Gateway Java et test Docker V2 sur base réelle **initialement
vide**, où la réponse doit rester `NO_INTERNATIONAL_OBSERVATIONS`.

**Ce qui reste à faire avant un usage médiatique autonome :**
vérification systématique des licences, cycle de validation humaine,
suivi des révisions et des décisions éditoriales, collecte publique des
institutions nationales de chaque pays et infrastructure permanente.
Ne pas annoncer ces éléments comme déjà livrés.
