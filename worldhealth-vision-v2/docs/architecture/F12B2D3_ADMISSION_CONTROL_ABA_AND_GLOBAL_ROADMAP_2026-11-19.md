# F1.2b.2d-3 — contrôle d'admission économique, expérience 0 → 8 → 0

**19 novembre 2026.** Branche `perf/v2-economy-batch-backpressure-ab-2026-11-19`, PR #59 basée directement sur #58. Application inchangée par défaut, aucun déploiement.

## Hypothèse causale testée

La PR #58 a observé des temps JDBC beaucoup plus longs sous 12 snapshots concurrents, parfois 20 connexions Hikari actives et 14 demandes en attente (échantillons), mais sans prouver que le pool lui-même est le goulet unique. La piste à tester est une régulation **en amont** des trois batchs SQL de 54 profils, non une augmentation aveugle du maximum Hikari de 20.

Le réglage Pydantic `economic_timeseries_batch_max_inflight` accepte 0–64, **0 par défaut**. Une instance de service Analytics crée un sémaphore partagé entre les tâches des snapshots **dans ce processus**. Lorsqu'il vaut zéro, le parcours historique ne fait aucune attente additionnelle. Les seules tâches protégées sont `latest`, `availability`, `history`. Une erreur d'HTTP ou une annulation libère le jeton. La métrique de durée de queue porte uniquement `operation`, jamais un pays, source, personne ou URL dynamique. Le sémaphore n'est pas un quota par client, et ne limite pas plusieurs workers ou répliques.

## Validation A/B/A

Run GitHub : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44542527928
Artefact : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44542527928/artifacts/14538393774
Commit réellement éprouvé : `e716eb669a3f8d1757f9de089ffd9330502b0e25`, SUCCESS.

- Base PostgreSQL/Timescale unique et **124 416 observations synthétiques** pour 12 pays × 54 profils × 4 sources × 24 années × deux révisions ; elle reste inchangée entre traitements.
- Quatre batchs optimisés actifs dans le conteneur CI. Seul Analytics est recréé pour modifier `WHV_ANALYTICS_ECONOMIC_TIMESERIES_BATCH_MAX_INFLIGHT` à 0, 8 puis 0.
- Chaque traitement effectue 12 requêtes aux niveaux 1/2/4/8/12 = 60, soit 180 observations expérimentales ; réussite HTTP **180/180**.
- Tous les pays conservent la **même empreinte SHA256 du JSON complet hors generatedAtUtc**, avec 54 indicateurs, 200 comparaisons, 270 preuves ; les scripts échouent si cap mal appliqué, réponse partielle, mismatch, temps sans métrique ou groupe corrompu.
- Hikari/JDBC de Timeseries et les réponses JSON sont réellement observés ; métriques et API internes confinées au réseau Docker jetable.
- Au niveau 12 : temps total des 12 requêtes **2039,224 / 1861,472 / 2019,164 ms**, latence p50 **1803,413 / 1466,674 / 1833,008 ms** ; Hikari pending max observé **3 / 0 / 16**, acquire moyen **89,212 / 0,275 / 69,626 ms** ; JDBC historique **776,611 / 178,955 / 775,521 ms**.
- Interprétation : gain de temps total de **8,7 %** vs premier témoin ; la situation revient près du témoin quand le cap est retiré. Une part de l'attente est transférée à Analytics, non effacée par magie.

## Menaces à la validité et critères pour choisir

1. Seulement **un runner / un cycle A/B/A**, avec cache, ordonnancement OS, CPU, réchauffement et petites séries de 12 réponses : aucune déclaration p95/p99 de production.
2. Les jauges Hikari sont **échantillonnées** : zéro pending observé ne garantit pas zéro pending entre deux prélèvements.
3. Le maximum en vol de 8 est **par processus Analytics**. Si 4 workers ou 6 répliques servent les requêtes, le total possible peut atteindre 32/48 ; le réglage n'apporte pas d'équité entre utilisateurs, de taille maximale de queue ni de délai d'attente garanti.
4. Une queue trop longue pourrait causer 502/503, impatience de l'utilisateur, saturation de la mémoire ou starvation. Ajouter ensuite métriques queue p95, temps de bout en bout, délai maximum et politique de surcharge, avec tests pannes/reprise et cancellation.
5. Contrairement à la source statistique, le réglage ne doit pas changer une seule année comparable, révision, statut estimé/supprimé/manquant ou preuve de provenance.
6. Répéter dans des environnements comparables des séquences alternées 0/4/6/8/12, puis charger la **fixture hétérogène** de 50 pays et sources locales partielles (issue #56), sans achat cloud non validé.

## Vision de produit — document maître non substitué

Lire `docs/product/STRATEGIE_INTERNATIONALE_WORLD_VISION_MASTER_2026-11-19.md` et `docs/product/REGISTRE_PRODUITS_SOURCES_REVENUS_PRIORITES_2026-11-19.md` avec le handoff central : ce sont les références de GDELT/EarlyForge, de la gouvernance des 217 pays et 22 sources *cataloguées*, de la collecte locale licenciée, de Core/Atlas et de Media, Money, Transport/Tourisme, Price/Panier, Trading, BRVM, Watch. Le moteur Watch persistant et l'ingestion institutionnelle sont les **premiers leviers d'utilité répétée**, avant les spéculations de revenus. L'affiliation, Premium, B2B/API, publicité et partenariats sont des pistes sous preuve de trafic, droits, frais et consentement, pas des chiffres d'affaires réalisés.

Conserver PR #59 DRAFT, branche `v2` et site publics inchangés, V0/V1 et branches média/voix hors champ.
