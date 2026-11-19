# World-Vision — DATA-1A, premier contrat de source nationale officielle, pilote IBGE

**Date : 19 novembre 2026. Dernier chantier actif : données nationales réelles, pas une refonte graphique.**
**État : code de capture pilotable, tests SYNTHÉTIQUES ; AUCUNE donnée nationale encore ingérée en production.**
**Branche** `data/v2-national-source-ibge-bronze-contract-2026-11-19`, empilée sur la PR #59 Core (candidate backend). Le frontend UX-1A est **indépendant** : PR #67 → #64 → #35.

## 1. Pourquoi ce chantier

Notre vision World-Vision est internationale : avoir des fiches pays, des séries statistiques et économiques, des indices et vérifications qui s'appuient sur les **institutions officielles nationales, locales et régionales** et les confrontent à Banque mondiale/FMI/ONU/BEAC/BCEAO, sous réserve de licence et de comparabilité. Les **217 pays du catalogue** et les nombreuses sources affichées ne sont PAS une preuve que les connecteurs sont réellement actifs ni que chaque pays possède des observations vérifiées.

Le travail précédent F1.2b (SQL/Hikari/backpressure) a réussi ses tests de charge synthétique et demeure conservé dans [issue #63](https://github.com/OBIANG5/World-Health-Vision/issues/63), PR #59. Il n'est pas la priorité quotidienne du produit. Le frontend UX-1A est validé au SHA `aa746748205cf840076c31624d00e4603f11b40e`, mais le **site mobile Vercel existant n'est toujours PAS publié avec cette branche** : [issue #68](https://github.com/OBIANG5/World-Health-Vision/issues/68), échec HTTP 429 GitHub via Vercel. Ne pas mentir à l'utilisateur sur cette publication.

## 2. Choix du premier connecteur national

L'[IBGE — Instituto Brasileiro de Geografia e Estatística](https://www.ibge.gov.br/acesso-informacao/dados-abertos.html), institution nationale brésilienne, expose une [API publique de données agrégées version 3](https://servicodados.ibge.gov.br/api/docs/agregados?versao=3) et des publications du Censo 2022. Il constitue un **pilote technique machine-lisible** pour un pays de grande taille, différent d'une copie de chiffres d'un journal ou d'un portail commercial intermédiaire.

**Contrat précis, volontairement étroit :**

| Contrat | Valeur |
| --- | --- |
| Juridiction | Brésil, ISO3 `BRA` |
| Source | IBGE, source nationale officielle, pas source FMI/WDI |
| Source code | `IBGE` |
| Dataset code | `CENSO2022_4714` |
| Indicateur temporaire spécifique à la méthode | `IBGE.CENSUS2022.RESIDENT_POP` |
| Table officielle SIDRA | 4714 — population résidente, surface, densité |
| Variable | 93 — population résidente |
| Géographie | `N1`, `localidade.id=1` (Brésil national), aucune municipalité/UF implicite |
| Période | **2022 seulement**, ne pas confondre avec estimation 2026 |
| Unité | `Pessoas` (personnes), entier strict, 100 000–500 000 000 garde-fou de validation de forme |
| Acquisition | `GET https://servicodados.ibge.gov.br/api/v3/agregados/4714/periodos/2022/variaveis/93?localidades=N1%5Ball%5D` |
| Bronze | Réponse brute JSON + observation normalisée + manifeste unique + empreinte SHA256 |
| Qualité/droits | `SOURCE_REVISION_DATE_NOT_VERIFIED`, `REUSE_RIGHTS_REVIEW_REQUIRED`, `BRONZE_ONLY_UNREVIEWED` |
| Publication | **OFF**, aucun Timeseries/public Gateway ni valeur locale pseudo-vérifiée |

**Pourquoi un code temporaire spécifique ?** Même si la population correspond conceptuellement à des données WDI `SP.POP.TOTL`, l'IBGE mesure la population résidente du **recensement** : il faut préserver la méthode et l'année avant d'affirmer une comparaison numérique « même indicateur ». Aucun alignement silencieux de valeurs estimées/projetées et observées.

## 3. Réalisation vérifiable dans le code

- `services/ingestion-service/src/ingestion_service/connectors/ibge_national_census_client.py`: hôte officiel fixé, aucune URL arbitraire, timeout borné, redirections refusées, réponse JSON limitée à 1 Mo, 1 seule variable 93, 1 série nationale et année 2022, entier positif, tests de forme et SHA.
- `pipelines/ibge_national_census.py`: conversion `IndicatorObservation.annual`, RAW→NORMALIZED→MANIFEST via `BronzeStore`, données de méthode, provenance, droits et statut non publiable.
- `runtime.py` + `cli.py`: commande **opérateur locale** `python -m ingestion_service.cli ibge capture-census-2022-population` ; PAS de route HTTP publique, pas de tâche automatique qui s'exécute sans audit.
- `tests/test_ibge_national_census.py`: tous les chiffres de test sont **FAUX par conception** (`123456789`), jamais une mesure officielle ; rejet de pays/échelle N3, unités non-personnes, mauvais code, mauvaise année, doublons, suppression, non-JSON, 503, plus d'1 Mo et absence d'envoi Timeseries.
- `.github/workflows/whv-v2-national-ibge-evidence-contract.yml`: CI Python 3.12, pytest sur pilotes et régressions des anciens connecteurs, inspection de l'absence de route publique; aucun réseau externe IBGE dans les tests.

**Ne pas extrapoler un test de forme à une ingestion réelle** : l'API officielle ne peut être dite fonctionnelle dans notre propre infrastructure qu'après avoir exécuté la commande sur un environnement habilité et sauvegardé le manifeste (heure, SHA, version, corps original, HTTP). Les docs et le code ne sont pas une autorisation commerciale de redistribution ; la politique nationale de données ouvertes est une piste pour l'audit des droits de la **table spécifique**.

## 4. DATA-1B : devenir une vraie source officielle dans l'Atlas

1. **Droits et conformité** : vérifier les conditions exactes de republication des tables IBGE 4714/93, attribution, usage commercial, révision des données, robots/quotas et restrictions par géographie. Enregistrer source officielle des droits et date de vérification. Sans conclusion vérifiée, laisser données RAW privées.
2. **Acquisition live contrôlée** : exécuter la commande sur serveur CI/staging à accès externe, limite de taille/timeout, sans secret ni PII; comparer le brut actuel aux métadonnées officielles IBGE, conserver source, date de récupération, SHA et niveau de publication.
3. **Révisions/fraîcheur** : détecter changement de SHA, données corrigées depuis la dernière ingestion, date de publication si disponible, version des séries; ne jamais remplacer une ancienne valeur sans historique. Distinguer recensement historique et estimation actuelle.
4. **Contrat canonique** : réconcilier `IBGE.CENSUS2022.RESIDENT_POP` avec WDI (concept, période, champ géographique, population scope). Ajouter `ComparabilityAssessment` avant comparaison.
5. **Publication autorisée** : seulement après contrôle droits/qualité, activer le premier `IBGE` import Timeseries avec clé idempotente, provenance complète, statut `INGESTED_VERIFIED` testable, route Gateway en lecture sécurisée et fiche Atlas.
6. **Tests end-to-end** : faux pays N3, 404/429/503, évolution de source, cellule manquante, revision, dégradation, replay et anti-fabrication; comparer données brutes/normalisées/API/vue et source originale.
7. **Mise à l'échelle** : deuxième source nationale **INSTAT Gabon** ([portail institutionnel](https://new.instatgabon.org/fr), [RGPL 2026](https://rgplprovisoire.instatgabon.org/)), puis Côte d'Ivoire/France/USA/Japon etc selon droits, qualité de l'API et confiance. Les chiffres du recensement Gabon 2026 affichés au portail officiel doivent faire l'objet d'une **fiche source + preuve vérifiable + droit** avant ingestion ; aucun scraping aveugle.
8. **Index institutionnel universel** : `SourceInstitution`, `Dataset`, `ObservationVersion`, `LicenseGrant`, `CountryCoverage`, `Evidence`, `SourceStatus` (`CATALOG_ONLY`, `CONNECTOR_IN_REVIEW`, `INGESTED_VERIFIED`, `DEGRADED`). Afficher couverture **réelle par indicateur** et délais de fraîcheur.

## 5. Les autres produits : conserver la vision complète

Après une observation nationale publiée avec preuve, attaquer **WATCH-1** (règles persistantes, scheduler, outbox, notifications consenties, opt-out et mesure de livraison), d'abord un signal FX référentiel daté pour Money-Vision. Puis offres réelles nettes pour Money, trajets Transport/Tourisme (taxes/bagages/licence), Price/Panier (EAN/unités/marchands), Trading/BRVM (droits financiers), Global Radar/GDELT **signaux à vérifier**, et média/voix (branches séparées). UX-1B issue #66 demeure documentée sans monopoliser les prochains lots.

Aucune allégation de prix en direct, couverture 217 pays, statistiques officielles non sourcées, revenus commerciaux ou confiance médiale « GDELT = vérité ».

## 6. Reprise inter-chat : chemin exact

1. Lire cette note et la branche `data/v2-national-source-ibge-bronze-contract-2026-11-19`.
2. Consulter ses tests GitHub Actions sur **SHA final**, PR DATA-1A et la conclusion de droits/documentation quand elle sera ajoutée.
3. Retour UX : PR #67→#64→#35 et [issue #68](https://github.com/OBIANG5/World-Health-Vision/issues/68) (publication téléphone Vercel bloquée 429, n'a pas été faite).
4. Backend et performance : PR #59, issue #63, #56. Ne pas fusionner pour l'instant.
5. Grand document de vision international GDELT/EarlyForge/Watch/verticales/revenus dans `docs/product` sur PR #59. Média et voix restent indépendants.
6. Prochaine action produit après DATA-1A : **vérifier une vraie ingestion autorisée en staging puis l'exposer avec son registre de source, sans sacrifier les statuts de qualité**.

**Aucune fusion vers `v2`, aucun déploiement, aucune transaction financière et aucun accès privé externe à ce stade.**


## 7. Continuité après DATA-1A — nouveau chantier DATA-1B1

Le travail s'est poursuivi sur une **PR empilée en brouillon #70**, branche data/v2-ibge-byte-evidence-revision-ledger-2026-11-19, **base PR #69**, sans fusion ni déploiement. Elle distingue octets HTTP de JSON canonique, ajoute versions immuables, replay vérifié et archives privées restaurables. Voir https://github.com/OBIANG5/World-Health-Vision/pull/70 et le document détaillé **docs/continuity/WORLD_VISION_DATA1B1_BYTE_EVIDENCE_2026-11-19.md** sur cette nouvelle branche.

La suite DATA-1B2 est **issue #71** https://github.com/OBIANG5/World-Health-Vision/issues/71 : métadonnées du dataset, droits de réutilisation spécifiques, journal des acquisitions, staging persistant sûr, backup/restauration, puis comparabilité WDI et publication contrôlée. Les résultats de la PR #70 sont d'abord des preuves privées : pas de valeurs officielles exposées dans l'Atlas, pas de licence approuvée ni de backend public. Les travaux UI #67/#64/#35, Vercel issue #68, Core #59 et backlog #63 restent indépendants. Média/voix/V0/V1 intacts.
