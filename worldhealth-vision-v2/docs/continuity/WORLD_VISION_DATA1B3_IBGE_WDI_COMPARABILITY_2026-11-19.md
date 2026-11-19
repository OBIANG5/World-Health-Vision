# WORLD-VISION V2 — DATA-1B3 : recensement IBGE vs estimation Banque mondiale, comparaison honnête

Date de chantier : 19 novembre 2026. Dépôt : OBIANG5/World-Health-Vision.
Dossier CANONIQUE du logiciel : worldhealth-vision-v2/.
Branche candidate : data/v2-ibge-wdi-population-comparability-2026-11-19.
Parent direct : PR #78 DATA-1B2B, qui dépend de #73 DATA-1B2A → #70 DATA-1B1 → #69 DATA-1A et du Core #59. Toutes DRAFT et non fusionnées à v2. Issue de suivi DATA-1B3 : #77.

**Règle de pilotage NON NÉGOCIABLE :** ne jamais abandonner la suite DATA annoncée parce qu'une demande ponctuelle mentionne la page d'accueil de l'iPhone. La PR UX #75, la publication Vercel issue #68, le répertoire de médias multi-sources issue #76 et les branches média/voix sont préservés mais HORS de cette branche. Il n'y a ni merge dans v2, ni publication, ni achat d'infrastructure.

## 1. Constat vérifié dans les sources primaires, au-delà des chiffres

### IBGE — Brésil national, Censo Demográfico 2022

- API officielle : https://servicodados.ibge.gov.br/api/v3/agregados/4714/periodos/2022/variaveis/93?localidades=N1%5Ball%5D
- Identité exacte : table 4714, variable 93, pays BRA, national N1, População residente, unité Pessoas, période 2022.
- Documentation primaire : https://biblioteca.ibge.gov.br/visualizacao/livros/liv102011.pdf, Censo Demográfico 2022 – População e domicílios – Primeiros resultados. Sections Notas técnicas et Conceitos e definições : référence à la **minuit du 31 juillet au 1er août 2022**, population résidente du domicile habituel / « de direito », imputation d'une partie des habitants des logements occupés sans interview. Il ne s'agit pas d'une photographie du 1er juillet; « recensement » ne signifie pas que chaque résident a personnellement répondu.
- Une année de référence ne suffit PAS pour inférer la date de première publication, de mise à jour, la méthodologie exacte de toutes les reprises ni la version source actuellement archivée. Le champ « modificacao » du listing des périodes reste SÉMANTIQUE NON VÉRIFIÉE.
- Licence commerciale de la table spécifique 4714/93 : NEEDS_PROVIDER_CLARIFICATION, statut enregistré dans RightsReviewDossier de PR #73. Ne pas déduire d'autorisation de la simple disponibilité du site IBGE ni de dispositions d'un produit cartographique distinct.

### Banque mondiale — World Development Indicators 2022

- Indicateur : WDI SP.POP.TOTL, Population, total, pays BRA et période 2022, catalogue WDI source id 2.
- Documentation officielle : https://databank.worldbank.org/metadataglossary/world-development-indicators/series/SP.POP.TOTL
- API documentée : https://datahelpdesk.worldbank.org/knowledgebase/articles/898581 et https://datahelpdesk.worldbank.org/knowledgebase/articles/1886674-new-features-and-enhancements-in-the-v2-api
- Endpoint restreint de la recherche : https://api.worldbank.org/v2/country/BRA/indicator/SP.POP.TOTL?date=2022&format=json&source=2
- Définition officielle : de facto, tous les résidents indépendamment du statut légal ou de la nationalité ; **ESTIMATION de mi-année**. Les sources amont possibles comprennent World Population Prospects de l'ONU, offices statistiques nationaux (NSO), Eurostat et la Division statistique de l'ONU. La liste institutionnelle GÉNÉRALE ne prouve pas l'origine précise de la cellule BRA/2022.
- Les méthodes de recensement et d'estimation diffèrent; la valeur du WDI n'est PAS automatiquement une seconde observation directe indépendante sur le terrain. La WDI peut avoir des entrées liées à l'IBGE, mais cette relation exacte ne doit pas être affirmée sans métadonnées spécifiques.
- Lastupdated au niveau du flux/ensemble n'est PAS l'horodatage de révision de la cellule BRA/2022. Date originale de publication locale = UNKNOWN sans document exact. Source observation status vide/absent signifie UNSPECIFIED; ne jamais la déclarer « observée » par défaut. Une observation marquée forecast F est rejetée de cette étude historique.
- Le portail public de l'indicateur https://data.worldbank.org/indicator/SP.POP.TOTL indique CC BY-4.0 pour le produit WDI. Conserver ces conditions d'attribution et l'examen du périmètre exact. Notre prototype technique garde explicitement REVIEW_REQUIRED pour l'opération de redistribution, car la publication de la PAIRE échoue déjà au gate de l'IBGE et au gate opérationnel.

### Décision scientifique

Même pays + année 2022 + unité apparente personnes ne suffisent PAS à conclure que deux valeurs sont directement comparables. IBGE = recensement résident (31 juillet/1er août) et imputations; WDI = estimation de mi-année, méthode et sources amont potentiellement dépendantes. Une soustraction arithmétique serait toujours calculable mais potentiellement trompeuse à ce stade. Dans DATA-1B3, le moteur REFUSE donc volontairement de créer un « écart de population » %, une affirmation de contradiction, un consensus, une validation d'indépendance ou une meilleure source.

## 2. Changements code réels et raccourci intelligent

### Réutiliser, ne pas réinventer

Le système possédait déjà :
- WorldBankClient général (source officielle WDI JSON + repli CSV ZIP officiel), réutilisable pour l'ingestion internationale quand l'exploitation et les droits sont décidés. Ce client retourne des objets normalisés et ne conserve pas actuellement l'intégralité des octets HTTP d'une réponse précise; son repli ZIP ne contient pas le statut de chaque observation.
- BronzeStore et QuarantinedJsonEvidenceStore DATA-1B1, immuabilité des versions par SHA des OCTETS originaux; journal d'événements DATA-1B2B (première collecte ≠ révision d'une source), reçu composite IBGE 3/3.
- RightsReviewDossier IBGE spécifique, CLI et suite de tests Python.
- Aucun second globe, aucun autre moteur de recherche, pas de base parallèle et aucun nouveau service d'exposition publique.

Ce lot ajoute UNIQUEMENT une spécialisation strictement bornée et un moteur méthodologique isolé :

1. services/ingestion-service/src/ingestion_service/connectors/worldbank_population_2022_research.py : UN seul endpoint officiel WDI en HTTPS, JSON format/source/year/ISO3 FIXÉS, un corps inférieur à 1 Mo, pas de redirection ni de compression, erreurs explicites, nombre de pages et ligne uniques, validation pays/date/indicateur/valeur positive entière, forecast refusé, empreintes SHA HTTP et JSON canonique, champs HTTP ETag / Last-Modified si réellement reçus. AUCUNE bascule silencieuse vers un miroir ou ZIP de format/identité différents.
2. services/ingestion-service/src/ingestion_service/acquisition_journal.py : extension minimale de l'allowlist existante à la seule paire (WORLD_BANK, WDI_POP_TOTAL_BRA_2022) et à l'URL officielle exacte. Les trois ressources IBGE restent fixées et tous les anciens tests d'intégrité restent utilisés.
3. services/ingestion-service/src/ingestion_service/pipelines/worldbank_population_2022_research.py : réception d'une seule ligne BRA/2022, conservation de l'original dans la MÊME archive Bronze privée, journal START/SUCCESS/FAILED, statut MIDYEAR_ESTIMATE, original dataset id 2 et méthodologie, revision de cellule non devinée, licence et publication bloquées.
4. services/ingestion-service/src/ingestion_service/population_comparability.py : Pydantic typé, Country ISO3, année, unité, concept population résidentielle, méthode de recensement/estimation, instant de référence, dépendance amont et preuve SHA. Décisions explicites : MISSING_SOURCE, INCOMPATIBLE_COUNTRY, INCOMPATIBLE_YEAR, INCOMPATIBLE_UNIT, INCOMPATIBLE_POPULATION_CONCEPT, REFERENCE_TIME_AND_METHOD_DIFFER, METHOD_REVIEW_REQUIRED. À tout niveau : numeric_difference_percent=None, numeric_delta_persons=None, independent_corroboration_established=False, commercial_display_authorized=False, timeseries_publication NOT_ATTEMPTED.
5. services/ingestion-service/src/ingestion_service/private_population_review.py : nécessite le SHA explicite du précédent reçu composite IBGE et SHA de la révision WDI, revalide les trois parties IBGE, SHA WDI, type/année/méthode et preuve d'événement WDI, traite numériquement les valeurs UNIQUEMENT en mémoire privée, écrit un reçu méthodologique stable SHA256 **sans valeurs numériques ni écart** dans ibge/_population_reviews, avec sources amont POSSIBLES, non prouvées indépendantes, et tous les verrous de publication. Reprise possible après copie du stockage privé complet ; les modifications et suppressions des preuves font échouer la vérification.
6. runtime.py et cli.py : commandes privées existantes + pilot capture-wdi-bra-2022-private, pilot review-bra-population-2022-private, pilot verify-bra-population-2022-review. Aucune route API.
7. tests/test_ibge_wdi_population_comparability.py : réponses API intégralement SYNTHÉTIQUES (les valeurs fictives ne doivent pas être présentées au public comme statistiques brésiliennes réelles), variations de pays, période, pagination, type, forecast, erreurs HTTP, URL hostile, bytes SHA, droits, dates, indépendance non prouvée, ratio bloqué même si deux valeurs sont identiques, transaction IBGE composite + WDI et tampering.
8. CI : whv-v2-ibge-wdi-comparability-acceptance.yml (régressions synthétiques ciblées puis ingestion complète, hors worldbank_live_scope explicite) et whv-v2-ibge-wdi-live-research.yml (strict 4 endpoints officiels, temps/volume bornés, répertoire privé éphémère et zéro artifact de chiffres, actif seulement sur changement de code ou du workflow, pas sur mise à jour documentaire).

## 3. Comportement exact sur un exemple de recherche

- Si l'IBGE ou WDI n'est pas disponible : MISSING_SOURCE, pas de zéro inventé.
- Si ISO3 diffère : INCOMPATIBLE_COUNTRY, pas de chiffre mis côte à côte.
- Si les années diffèrent : INCOMPATIBLE_YEAR.
- Si unité est « milliers de personnes » et l'autre « personnes » : INCOMPATIBLE_UNIT ; pas de x1000 supposé sans contrat.
- Si concept de population de facto vs de jure diffère : INCOMPATIBLE_POPULATION_CONCEPT ; le moteur indique AUSSI le décalage 31 juillet / mi-année et l'écart de méthode.
- Si même concept mais instant de référence différent : REFERENCE_TIME_AND_METHOD_DIFFER.
- Si même pays, année, unité, concept et instant : METHOD_REVIEW_REQUIRED parce que l'identité apparente ne démontre pas l'indépendance ni l'équivalence des protocoles.
- Si une source est révisée : nouvelle SHA et nouvel événement ; ancienne source/revue demeure historiquement vérifiable (ou rejetée si preuve endommagée), jamais mise à jour silencieuse.
- Toutes les branches : publication Atlas/Timeseries interdite et DÉCISION humaine/méthodologique requise avant toute comparaison numériquement interprétable.

## 4. Tests et état d'exécution, à ne jamais exagérer

Preuve initiale sur commit d6b329a8bdd18af40049ab9c5b07b16ed182bc64 :
- GitHub Actions https://github.com/OBIANG5/World-Health-Vision/actions/runs/44630694152 — **SUCCESS**, 102 tests ciblés et 145 tests de régression ingestion ; compilation Python 3.12, CLI privée et conditions de non-publication.
- Après ajout du nouveau workflow live et de ce document, toujours re-vérifier la CI sur le HEAD FINAL de la PR avant toute formulation « version finale validée ».
- Contrôle réel : workflow whv-v2-ibge-wdi-live-research.yml, exactement 3 GETs IBGE + 1 GET WDI BRA/2022, reçu composite et méthodologie en espace privé, zéro valeur brute imprimée. Le flux WDI a historiquement eu des 502 : un 502 documente une indisponibilité réelle, pas une preuve que la série est manquante. Ne jamais prétendre la démonstration réelle réussie si le run du HEAD vérifié est rouge.
- Tous les artifacts de recherche officiels sont éphémères et effacés à la fin, même si la comparaison passe. AUCUN stockage cloud durable ni production Atlas.
- Vérification des PDFs via moteur web : les versions IBGE et WDI accessibles par leurs URLs officielles et extraits documentaires; l'accès au rendu de certains PDFs peut échouer, donc ne pas sur-interpréter comme licence ni rapport de publication de l'observation.
- V2 branche principale et alias Vercel public restent inchangés.

## 5. Limitations expressément conservées

1. Le statut d'entrée d'une valeur WDI BRA/2022 dans UN WPP / un office national ne peut PAS être déduit du glossaire général de l'indicateur. Il faut une fiche/piste amont réellement spécifique au pays/année pour confirmer le degré de dépendance. Deux « sources » peuvent republier la même mesure d'origine.
2. Le WDI « mi-année » n'est pas un relevé au 31 juillet ; même si la différence calendaire paraît modeste, calculer un delta / pourcentage sans ajustement scientifiquement justifié donne une impression de contradiction trompeuse.
3. Les estimations et imputations ont leurs propres incertitudes, souvent sous-décrites; ne jamais fabriquer une marge d'erreur ou un intervalle de confiance.
4. L'attribution et les conditions exactes d'utilisation commerciale des deux sources ne sont pas une conséquence d'un succès HTTP, d'une licence générale consultée ou d'une CI réussie. IBGE rights demeure non approuvé, WDI contexte CC BY-4.0 à documenter dans le registre des droits de production.
5. DATA-1B2B journal/fsync de stockage privé local ≠ garantie 24/7 mondiale, WORM, backups hors site, multi-host ou contrôle d'accès cloud. La haute disponibilité et le backup/restore chiffré sont à faire lorsque budget/déploiement autorisés.
6. Aucune source nationale ou internationale n'est implicitement « meilleure »; afficher leurs périmètres, dates et origines exactes. Ne jamais masquer les écarts sous un faux consensus.
7. Ce pilote ne crée PAS une couverture réelle pour 217 pays ni de nouvelles statistiques nationales en production.

## 6. La SUITE INTELLIGENTE : plan strict, projet international

**DATA-1B3C (si nécessaire) — évaluation méthodologique concrète :** obtenir la documentation spécifique à la série BRA/2022 et au traitement des imputations/révisions IBGE, analyser la contribution exacte de WPP/IBGE à la série WDI, documenter les différences temporelles. Un examinateur peut établir une note scientifiquement défendable, mais pas débloquer automatiquement les droits. L'outil peut ensuite juxtaposer honnêtement les chiffres avec leurs métadonnées si une base d'exposition autorisée existe ; pourcentage de divergence seulement après protocole de normalisation documenté, révisable et vérifié.

**DATA-1C — priorité opérationnelle suivante :** stockage privé réellement durable et chiffré + restauration, snapshots versionnés et journal append-only, contrôle d'accès, statuts de licences et authentification des autorisations par dataset/opération, import Timeseries idempotent lié aux SourceEvidenceReceipts et historisation de révisions, Gateway/Atlas avec sources et méthodologies comparables et limites. Pas de VPS payé ni déploiement sans accord.

**INTERNATIONALISATION SUITE :** preuves par territoire/indicateur/période, INSTAT Gabon/BEAC spécifiques et ensuite autres pays; s'assurer qu'un catalogue de 217 pays ne sert jamais de preuve de 217 connecteurs actifs. Développer Watch Vision persistant (évaluation, dédoublonnage, alertes opt-in) puis Money, prix, tourisme, transport, marchés, et Global Radar GDELT sous statut de découverte/confirmation différencié. Les sources médias locales vs internationales et leur comparaison d'articles demeurent dans issue #76 séparée, jamais comme substitut au chantier statistique.

## 7. Reprise pratique inter-chats

1. Ouvrir la nouvelle PR DATA-1B3 dont base est PR #78 et consulter le HEAD exact, état DRAFT et les deux workflows CI sur le même SHA.
2. Lire CE document, le handoff DATA-1B2B et le HANDOFF_CORE_F12B ; lire PR #73 et droits/source spécifique IBGE. Ne pas repartir sur UI si le dernier sujet est une correction mineure.
3. Examiner les fichiers de code listés ici; constater les sorties audit et les reçus de comparaison SANS valeurs ni publication; ne pas traiter les nombres synthétiques des tests comme des chiffres du Brésil.
4. Si la CI réelle WDI est en échec, traiter source indisponible/format changé de façon transparente, sans rétrograder les contrats ni créer une fausse donnée.
5. Prochaine priorisation : fiabilité/provenance des données et véritable utilité Atlas, puis robustesse de stockage/droits/exploitation, en conservant la documentation et les bonnes branches.
