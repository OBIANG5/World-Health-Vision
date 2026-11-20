# WORLD-VISION — PRODUCT-P2C3A : PREMIÈRE SOURCE OFFICIELLE EN RECHERCHE PRIVÉE
Date : 20 novembre 2026. Dépôt OBIANG5/World-Health-Vision.
Branche `product/v2-p2c3a-insee-private-population-2026-11-20`.
PR #109 DRAFT, base PR #106 P2C2 SUCCESS.
Issue produit #107 : première série officielle légalement validée + STAGING privé.
Aucun merge v2/main, déploiement Vercel ou dépenses prévues.

## 1. Pourquoi cette tranche à forte valeur plutôt que 217 sources fictives
P2C2 a prouvé qu'une observation SYNTHÉTIQUE signée pouvait traverser les vrais
six services jusque dans Atlas et disparaître après révocation effective des
droits dans PostgreSQL. Run
https://github.com/OBIANG5/World-Health-Vision/actions/runs/44770455822
SUCCESS, conservé dans la continuité P2C2.
Le prochain goulot d'étranglement est la première source INSTITUTIONNELLE
réellement vérifiée, pas un nouveau service ou un graphe décoratif.
P2C3A choisit un seul dataset et un seul périmètre afin de rendre impossible
une fausse généralisation à tout le pays ou à d'autres années.

## 2. Contrat statistique exact retenu
- Producteur : **Insee**, source nationale officielle française.
- API : `https://api.insee.fr/melodi` (HTTPS, sans inscription pour les
  requêtes publiques ; l'Insee annonce 30 requêtes/minute sans inscription).
- Dataset : `DS_POPULATIONS_REFERENCE` = populations de référence.
- Mesure : `PMUN` = **population MUNICIPALE**, pas `PTOT` (population
  totale) ni `PCAP` (population comptée à part).
- Référence : `TIME_PERIOD=2023` = population au **1er janvier 2023**.
- Géographie demandée : `GEO=FRANCE-F` ; dimension complète publiée par
  l'exemple du client Melodi : `2025-FRANCE-F`. Frontières communales au
  **1er janvier 2025**.
- Portée officielle de cette livraison : **France hors Mayotte**. Le code
  international FRA ne permet PAS d'en faire une mesure de population de
  la France entière, de la France métropolitaine, d'un territoire d'outre-mer
  individuellement ou de l'Union européenne.
- Fréquence : `A` (annuelle), unité physique : personnes, aucune
  multiplication par 1 000 ou ajustement de population.
- Point de cohérence externe : population MUNICIPALE France hors Mayotte
  2023 **68 094 280**, publié par Insee. Ce contrôle HISTORIQUE ne remplace
  PAS une réponse HTTP Melodi vérifiée ; une valeur API différente doit être
  considérée comme une révision à auditer, pas écrasée silencieusement.
- Publication des populations de référence 2023 : 29 décembre 2025,
  décret d'authentification 26 décembre 2025 ; entrée en vigueur
  1er janvier 2026. Ces TROIS DATES n'ont pas le même sens et ne
  doivent jamais être attribuées à la date de collecte de chaque observation.
- Mise en garde Insee : recensements rénovés normalement comparables à
  5 ans d'intervalle ; pour millésime 2023, recommandation exceptionnelle
  de **6 ans** avec les millésimes précédents en raison du report de
  l'enquête 2021. Pas de graphique de croissance 2022→2023 présenté
  comme strictement comparable.

### Sources consultées (20 novembre 2026)
1. Licence et catalogue officiels :
   https://www.insee.fr/fr/information/8184173
2. API Melodi, accès et quotas :
   https://www.insee.fr/fr/information/1302169?question=comment-utiliser-l-api-melodi
3. Publication + méthode, champ et décret 2023 :
   https://www.insee.fr/fr/statistiques/8681011
4. Exemples d'API, `PMUN`/`PTOT`/`PCAP` et `FRANCE-F` :
   https://inseefrlab.github.io/melodi/reference/get_data.html
   https://inseefrlab.github.io/melodi/reference/get_range.html
5. Métadonnées du dataset (spatial `FEHM`) :
   https://inseefrlab.github.io/melodi/reference/get_metadata.html
6. Accès officiel API sur data.gouv.fr :
   https://www.data.gouv.fr/dataservices/api-melodi

Les exemples de bibliothèques ne sont PAS un HTTP GET exécuté par notre
connecteur. La revue du résultat live et de chaque exception juridique est
une porte distincte avant publication.

## 3. Périmètre exact du nouveau code
- `services/ingestion-service/src/ingestion_service/connectors/insee_melodi_population_research.py` :
  GET UNIQUE vers `https://api.insee.fr/melodi/data/DS_POPULATIONS_REFERENCE?GEO=FRANCE-F&POPREF_MEASURE=PMUN&TIME_PERIOD=2023&maxResult=10`.
  Interdit les hôtes variables, paramètres libres, redirects, compression
  non examinée, réponses >256 ko et statuts/méthodes ambigus.
  Rejette géographie incorrecte, PTOT, mauvaise période, doublons,
  valeur absente, confidentialité déclarée, changement du chiffre
  historique et déformation de l'original HTTP.
- `pipelines/insee_melodi_population_research.py` :
  réutilise SANS nouveau microservice `BronzeStore.persist_quarantined_json_evidence`
  et l'`AcquisitionJournal` immuable. Garde les OCTETS ORIGINAUX,
  leur SHA256, la normalisation, manifeste et tentatives START/SUCCESS/FAILED.
  Au redémarrage/replay, les mêmes octets n'écrasent pas l'ancien reçu ;
  de nouveaux octets créent une nouvelle révision auditée.
- Note de publication du manuscrit :
  `BRONZE_ONLY_UNREVIEWED`, `REVIEW_REQUIRED`,
  `timeseriesPublication: NOT_ATTEMPTED`. AUCUN Ed25519 reviewer grant réel
  n'est forgé, aucune API publique, aucune Timeseries, aucun Vercel.
  Le statut privé `OFFICIAL_REFERENCE_COUNT_CALCULATED` évite d'affirmer
  que chaque personne est un comptage direct plutôt qu'un chiffre construit
  par les méthodes de recensement rénové.
- `acquisition_journal.py` : autorise uniquement la paire
  `INSEE/DS_POPULATIONS_REFERENCE` et cette URL exacte ; les whitelists
  IBGE/WDI et les refus de publication demeurent inchangés.
- `tests/test_insee_melodi_private_population.py` : 19 tests
  adversariaux hors réseau, y compris 10 mutations de contrat, révisions
  identiques/distinctes, contenu brut, 301/429/500, attaque URL et statut.
- Workflow `.github/workflows/whv-v2-product-p2c3a-insee-private-source.yml` :
  tous les tests Python sur push ; sonde réseau uniquement opt-in
  `workflow_dispatch.live_probe` ou tag explicite unique
  `[insee-once-live-probe]` dans le message de commit. DEUX GETs maximum
  espacés de 5 secondes, 7 min timeout, aucune donnée réelle publiée,
  aucune archive privée conservée en artifact ou Git.

## 4. Preuves CI et incidents réellement observés
Premier code SHA `5ab84825343e720cfc955ad13fb22a0f758f2e6e`,
run https://github.com/OBIANG5/World-Health-Vision/actions/runs/44773111830 :
**FAILED** ; `httpx.MockTransport` avait déjà consommé le flux brut, ce
qui déclenchait `StreamConsumed`. Incident diagnostiqué par les logs.

Fix SHA `e88fa30d24acaae445bf10a9e1041ee3b17d2044` : si réponse
mock déjà bufferisée, reprendre `response.content`, sinon lire
`response.iter_raw()` sans décodage (compression interdite).
Run https://github.com/OBIANG5/World-Health-Vision/actions/runs/44773353575 :
**SUCCESS**, 19/19 tests INSEE et 235/235 tests du service d'ingestion
complet ; audit statique de non-publication PASS. Job live volontairement
SKIPPED sur ce commit : **aucune réponse officielle directe encore attestée
par cette exécution**.

## 5. Réutilisation et gouvernance : ne pas surinterpréter
- L'Insee indique que le catalogue est sous Licence Ouverte :
  cela soutient une possibilité de réutilisation, MAIS la PR n'a pas
  confirmé pour ce dataset toutes les opérations exactes autorisées
  (API de redistribution par tiers, commercial, création de dérivés,
  lien vers licence attachée au dataset, mentions obligatoires,
  exceptions, délai, rectifications et suppression).
- Avant tout reviewer grant réel, consigner les URLs exactes, les clauses,
  l'autorité humaine qui signe et un contre-signataire distinct. Le moteur
  de preuve P2C2 a utilisé deux clés privées CI, **pas des décideurs légaux**.
- PR #95 (parseur attesté, code SHA V2) et issue #94 (révocation des
  trust anchors) restent à examiner avant de rendre réelle la production.
- Source Insee = source française, NON alternative aux autorités du Gabon ;
  l'extension Gabon INSTAT/BEAC doit obtenir sa propre revue de droits
  et définition des unités/périodes.
- Modèle de qualité international : séparer population municipale, totale,
  estimation mi-année ONU/Banque mondiale, recensement, projection et
  territoire couvert. Une carte du monde ne justifie aucune équivalence.

## 6. Prochain point de reprise P2C3B
1. Exécuter UNE fois le job `insee-private-official-live-probe`,
   constater exactement deux réponses HTTPS et leurs empreintes, que le
   parseur reconnaît les vrais champs Melodi, et que journal START/SUCCESS
   est cohérent. Si erreur API/forme, corriger AVEC SOURCE, pas supprimer
   des validations sans justification. Éviter sondes horaires.
2. Compléter la revue des clauses spécifiques, licence/attribution et
   autorisations par opérations : lecture Web, API, cache, redistribution,
   produit commercial. Le dossier doit lier source, géographie, date, unité,
   méthodologie, finalité, exceptions et décision humaine signée.
3. Construire le témoin indépendant de **VRAIS OCTETS** Bronze plutôt
   que signer automatiquement une revendication côté producteur.
   Respecter l'identité de version de parseur et sa révocation.
4. Ajouter un indicateur et une source catalogue clairement
   `INSEE / population municipale France hors Mayotte`, pas un
   `FRA total population` sans caveat ; faire passer la série
   du champ privé au circuit P2C2 seulement quand légalement autorisée.
5. Vérifier l'affichage correct et la disparition après révocation
   dans Atlas à partir de VRAIES données publiques légitimement autorisées.
6. Préparer URL de préproduction HTTPS PRIVÉE, noindex + auth, secrets,
   volume PostgreSQL sauvegardé/restauré, coûts plafonnés, rollback,
   tests smartphone FR/EN ; jamais promouvoir vieux Vercel sans décision.
7. Réviser la pile de PR DRAFT proprement, conserver toutes les
   Visions, médias GDELT, voix/vidéo, Watch/Money et le globe.
8. Tenir HANDOFF_CORE et issue #107 à jour à chaque incrément.
