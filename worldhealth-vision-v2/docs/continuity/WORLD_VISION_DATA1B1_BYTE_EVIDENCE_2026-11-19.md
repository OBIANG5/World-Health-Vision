# WORLD-VISION — DATA-1B1 : preuve HTTP originale, versions immuables et contrôle de source

**Date : 19 novembre 2026 — document de passation entre chats.**
**Scope : LOGICIEL World-Vision V2 UNIQUEMENT. Ne pas modifier média, voix, vidéos, V0/V1, Vercel ou la branche v2.**
**Branche candidate :** data/v2-ibge-byte-evidence-revision-ledger-2026-11-19
**Base exacte :** PR #69 DATA-1A, commit 88aa29b4438e9547a33750e5e4bf7e65b0ba8323, elle-même empilée sur PR #59 et toute la chaîne Core.
**Statut initial :** développement à valider par le workflow privé whv-v2-ibge-immutable-evidence.yml. Aucune approbation juridique, aucune fusion automatique ni activation publique.

## 0. Départ vérifié : ce qui existait réellement

- Dépôt : https://github.com/OBIANG5/World-Health-Vision ; seule arborescence canonique : worldhealth-vision-v2/
- La branche de référence v2 était au SHA 37aa828163f77f77600a12361ec2ffbb8176b6d9 lors de la reprise.
- Documents à garder : docs/continuity/HANDOFF_CORE_F12B_2026-11-19.md, docs/product/STRATEGIE_INTERNATIONALE_WORLD_VISION_MASTER_2026-11-19.md et REGISTRE_PRODUITS_SOURCES_REVENUS_PRIORITES_2026-11-19.md, disponibles en amont de la PR #69.
- PR #69 DATA-1A avait une acquisition **réelle** et limitée de la source officielle IBGE au workflow https://github.com/OBIANG5/World-Health-Vision/actions/runs/44575072161 (19/11/2026). Pays BRA, échelle N1, agrégat 4714, variable 93, 2022. L'exécution n'a conservé les données que dans un dossier temporaire et a volontairement supprimé les pièces après vérification. C'est un test live, pas une ingestion permanente.
- UX-1A : PR #67 → UX-0 PR #64 → fondation UI PR #35 ; succès CI et aperçu statique isolé sur branche preview-worldvision-ux1-2026-11-19. Vercel public NON mis à jour ; incident Vercel/GitHub 429 suivi par issue #68. Ne pas prétendre que l'écran public dispose de cette refonte.
- Core backend : PR #36→#38→#39→#40→#41→#45→#46→#47→#49→#50→#51→#52/#53→#55→#57→#58→#59. Tests synthétiques solides, non fusionnés. Performance et fiabilité internationale non abandonnées, backlog issue #63 ; issue #56 pour données hétérogènes. **Ne pas travailler directement sur v2.**

## 1. Pourquoi ce sous-lot était nécessaire

Dans DATA-1A, la réponse JSON IBGE était parsée puis sérialisée dans BronzeStore. Le champ rawSha256 était calculé sur un JSON **canonique reconstruit**, pas sur les octets de réponse HTTP effectivement reçus. Une version reformatée pouvait avoir le même hash canonique ; la preuve exacte de transport était perdue. Un nouveau run recevait aussi un identifiant temporel et les données étaient écrites séparément, sans commit atomique des trois fichiers. Risques : écrasement manuel, fichiers partiels, doublons silencieux et comparaison de révisions incontrôlée.

Le présent lot garde **DEUX** empreintes différentes :
1. **httpBodySha256** = SHA-256 des octets exacts du corps de réponse reçu (HTTP entity body sans en-têtes ni chiffrement TLS ; le client demande Accept-Encoding: identity et refuse les réponses compressées). Sert d'identifiant immuable de version.
2. **rawSha256** = SHA-256 du JSON re-sérialisé avec sort_keys, separators et ensure_ascii=False, conservé pour compatibilité avec la normalisation DATA-1A. Ce n'est **PAS** le hash du transport.
3. **normalizedNdjsonSha256** = SHA-256 des observations normalisées, tri JSON stable, un objet par ligne. Ne jamais interpréter ces empreintes comme une signature officielle de l'IBGE : elles prouvent uniquement l'intégrité relative à la capture locale, non l'authenticité juridique ou la validité méthodologique de la valeur.

Le client reste fixé au domaine HTTPS officiel et à une seule API, variable, période et géographie ; réponse bornée à 1 000 000 octets, refus du gzip implicite, des redirections, de tout format inattendu. Rien n'élargit les autorisations ou pays.

## 2. Code mis en place : chemin et responsabilités

- services/ingestion-service/src/ingestion_service/source_evidence_store.py : nouvel archivage JSON **en quarantaine** opt-in. Chemin <bronze_root>/ibge/censo2022_4714/revisions/<sha256_http>/. Chaque révision reçoit original.http.json, observations.ndjson et manifest.json.
- Le dossier de staging est privé (.staging-*, 0700). Chaque fichier est écrit en exclusivité (0600), flush + fsync, puis le dossier est renommé. Une révision ne devient visible qu'une fois les trois fichiers prêts. fsync du parent tenté ; le système de fichiers et la sauvegarde restent des responsabilités d'exploitation.
- Une même réponse HTTP redonne le **même identifiant** et déclenche la vérification intégrale de la révision déjà archivée, sans écrasement. Des octets différents produisent une nouvelle révision conservant l'ancienne. Si la même réponse ne correspond plus à la même normalisation, l'exécution s'arrête : une migration de schéma explicite sera nécessaire.
- source_evidence_store.verify(...) : vérifier hash brut, hash NDJSON, nombre de lignes, identité, chemins, statut de quarantaine, manifest, absence de symlinks terminaux. En cas d'altération ou de réponse incompatible, aucune « réparation » silencieuse. list_verified_revisions(...) donne uniquement des versions complètes et vérifiées ; les dossiers de staging non terminés ne sont pas une version officielle.
- services/ingestion-service/src/ingestion_service/bronze_store.py : ajout d'une méthode opt-in persist_quarantined_json_evidence, **sans modifier persist_dataset** utilisé par les autres sources.
- connectors/ibge_national_census_client.py : octets HTTP reçus en réponse, hash des octets, hash canonique existant et heure de réception. Les dates de récupération et de publication **ne sont pas confondues**.
- pipelines/ibge_national_census.py : branche IBGE seule redirigée vers le stockage de preuves immuables ; timestamp de récupération dans le manifeste uniquement, pas dans l'observation normalisée afin que les replays soient déterministes. Quarantaine obligatoire : BRONZE_ONLY_UNREVIEWED, REVIEW_REQUIRED, NOT_ATTEMPTED.
- cli.py : commande locale 'python -m ingestion_service.cli ibge audit-private-evidence'. Vérifie les versions et restitue **des empreintes**, dates et statuts sans exposer leurs valeurs, sans réseau et sans écriture Timeseries.

ATTENTION : un test CI sur une machine éphémère est également éphémère. Cet archivage devient **réellement durable seulement après montage d'un stockage privé persistant**, sauvegarde chiffrée hors site, exercice de restauration, RBAC/secret/réseau et décision approuvée d'hébergement.

## 3. Preuves exigées sur le SHA FINAL

Tests SYNTHÉTIQUES, jamais des chiffres officiels :
- test original.body bytes exacts différents d'un format JSON canonique ;
- hash transport et hash normalisé cohérents, forme de l'unique observation BRA/N1/2022 ;
- replay même octets = une seule version, métadonnées premières conservées ;
- valeur brute révisée = deux versions historiques distinctes ;
- modification malveillante d'un des trois fichiers = échec, y compris au replay, sans écrasement ;
- même brut + normalisation différente = échec explicite, pas d'upgrade caché ;
- statut « publishable » refusé AVANT écriture ;
- source code de chemin malicieux refusé ;
- dossier de staging interrompu non considéré comme version ;
- captures concurrentes identiques convergent vers une seule version ;
- source absente = zéro couverture, jamais « 217 pays ingérés » ;
- régressions de l'ancienne suite d'ingestion, en ignorant seulement le test World Bank qui exige du réseau live.

Workflow .github/workflows/whv-v2-ibge-immutable-evidence.yml, Python 3.12, pytest et CLI. **GATE GO seulement si workflow SUCCESS sur le SHA FINAL**, et analyse des échecs/runs. Ce workflow ne prouve ni licence, ni hébergement permanent, ni publication, ni équivalence des statistiques recensement/estimations internationales.

### Problèmes techniques détectés pendant le développement
Premier run de CI : certaines réponses HTTPX MockTransport sont déjà bufferisées ; iter_raw() y déclenchait StreamConsumed. Adaptation : pour une réponse déjà consommée, lire response.content ; pour une vraie réponse réseau, itérer le flux brut. Toujours avec Accept-Encoding identity, rejet compression, taille bornée. Ne pas masquer une régression en modifiant les assertions. Revalider les tests sur le prochain SHA.

## 4. Analyse préalable des droits et limites : conclusion = BLOQUÉ

Références institutionnelles relevées le 19/11/2026 :
- IBGE — Dados Abertos : https://www.ibge.gov.br/acesso-informacao/dados-abertos.html
- IBGE — Infraestrutura Nacional de Dados Abertos : https://www.ibge.gov.br/acesso-informacao/acoes-e-programas/infraestrutura-nacional-de-dados-abertos-inda.html
- IBGE — Termo de Uso e Política de Privacidade (11/03/2024) : https://www.ibge.gov.br/acesso-informacao/acoes-e-programas/politica-de-privacidade.html
- IBGE — documentation API agrégats v3 : https://servicodados.ibge.gov.br/api/docs/agregados?versao=3
- Censo Demográfico 2022, méthodologie et révisions : https://www.ibge.gov.br/estatisticas/sociais/populacao/22827-censo-demografico-2022.html?t=resultados-gerais

Ces pages prouvent un programme de données publiques et une documentation institutionnelle. Elles **ne suffisent pas ici à établir la licence réutilisable de la table précise SIDRA 4714 / variable 93 pour une application commerciale, toutes formes de republication/agrégation comprises**, ni sa date de révision exacte. Un autre produit cartographique IBGE peut être soumis à des conditions particulières : ne pas importer ces clauses aveuglément sur le recensement, mais ne pas présumer non plus que « public » = « commercial redistribuable sans condition ».

Avant déverrouillage : récupérer et conserver une version datée des termes exacts de la donnée et de l'API ; attribution, copyright, usage commercial/redistribution, quotas, archivage, mises à jour, dates de publication/révision, jeu et territoire. Si incertitude, demander confirmation à l'institution ou avis juridique. Jusqu'à conclusion documentée, conserver uniquement comme RAW privé de recherche avec publicationStatus=BRONZE_ONLY_UNREVIEWED. Jamais une table de chiffres publics dans une PR ni un artefact GitHub accessible.

## 5. Étapes suivantes — DATA-1B2, DATA-1B3 et DATA-1C

**DATA-1B2 — rendre la preuve opérable avec droit vérifié**
1. Revue du SHA final et workflow de cette PR DRAFT, correction de tout échec.
2. Étudier techniquement les endpoints de métadonnées d'agrégats et le Censo 2022 pour 4714/93 et l'indicateur : période, révision, concepts, nomenclature ; enregistrer la source originale et une trace datée, pas une date inventée.
3. Obtenir et enregistrer l'évaluation juridique spécifique avec evidence URLs, décision, conditions, responsable, période de validité; contrat de licence **séparé** de la donnée brute et révocable.
4. Tester un vrai capture→replay→révision sans publication, **sur un volume de staging privé persistant**, pas en publiant des fichiers dans GitHub ; vérification de restauration et journal des ré-exécutions. Ne pas payer/créer de serveur sans budget approuvé.
5. Ajouter un mécanisme de journal append-only des consultations/récupérations avec horodatage et résultat (un replay aujourd'hui ne doit pas réécrire la date de première capture). Sur disque/machine unique, tester partitions et crash; pour multi-process/multi-hôtes, verrou/transaction centralisée.

**DATA-1B3 — comparabilité avec les institutions internationales**
6. Introduire un ComparabilityAssessment typé : population « résidente recensée » vs estimation Banque mondiale WDI SP.POP.TOTL ; distinguer concepts, dates, couverture, unités, estimations/projections, sans règle de différence en pourcentage arbitraire.
7. Vérifier et archiver les preuves des deux côtés ; tester corrections, années décalées, absence, indicateur non comparable, révisions. Autoriser seulement des comparaisons annotées de limites.

**DATA-1C — du registre à l'Atlas, sous contrôle**
8. Après GO juridique + technique : adapter contrat de données et migrations Timeseries avec sourceRunId, originPayloadHash, sourcePublishedAt nullable, fetchedAtUtc, revision, qualityFlags, idempotencyKey ; test transaction et rejouabilité, séparation des permissions ingestion/public.
9. Créer un endpoint de lecture Gateway **strictement public si autorisé**, soumis aux contrôles sécurité des PRs #36→#59. Statuts CATALOG_ONLY/BRONZE_UNREVIEWED/INGESTED_VERIFIED/STALE/DEGRADED/REVOKED ; aucune fiction de couverture.
10. Connecter le CountryDrawer/Atlas au contrat réel : source IBGE, 2022, unité, période, date de récupération, méthodologie, comparaison WDI éventuellement non comparable, liens originaux, erreurs honnêtes ; tests téléphone 320/390px et desktop, sur domaine réel seulement avec backend réellement accessible.
11. Étendre ensuite à INSTAT Gabon (recensement 2026), puis instituts et banques régionales selon accès et droits, sans scraping silencieux. Le catalogue de 217 pays/territoires ne dit rien de leur couverture vérifiée.
12. Ensuite WATCH-1 persistant (règle, observation, évaluation, outbox, reçu, consentement/opt-out), Money-Vision/FX puis Transport et Price, Trading/BRVM selon licences. L'expérience UX-1B est dans issue #66 et la publication Vercel dans issue #68 : pistes indépendantes à conserver.

## 6. Consignes pour le chat suivant

1. Lire **ce fichier**, le handoff Core F1.2b et les deux documents maîtres stratégie/revenus ; récupérer PR #69 et la nouvelle PR de DATA-1B1.
2. Vérifier status exact branche v2, PRs empilées, CI du dernier commit. Ne jamais citer un SUCCESS d'un ancien SHA comme preuve du nouveau.
3. Regarder le vrai code : client IBGE, pipeline, store immuable, tests, CLI et workflow ; examiner les limitations et cas d'attaque encore non couverts.
4. Ne pas toucher aux branches audio/vidéo/média ni aux déploiements publics Vercel, ni fusionner la chaîne de PRs sans revue.
5. Aucun droit de commercialisation, couverture des 217 pays, API mondiale live, staging permanent, données en production ou revenu n'est prouvé par cette PR.
6. Priorité **DATA-1B2 droits/métadonnées + preuve durable de stockage/reprise**, puis DATA-1B3 comparabilité et DATA-1C ingestion contrôlée. Documenter systématiquement tests, commits, coûts, risques et prochaine décision.

**Invariants permanents World-Vision : international, multilingue, honnête, méthodologies contrôlées, institution nationale + régionale + internationale, séparation du statistique officiel/GDELT/prix commerciaux, vérification des licences, aucune fausse disponibilité et aucune publication média automatique.**


## 7. Addendum de validation et durcissement (même journée, 19/11/2026)

### Preuve d'acquisition IBGE réelle (nouveau mécanisme)
- Workflow LIVE autonome : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44614630826 ; **SUCCESS sur le code de première version** f7dc554ca3ea0ad4fe9cf64bcc56a0b561222cc8.
- Récupération HTTPS effective BRA / N1 / 2022 / 4714 / 93, aucune valeur brute imprimée, aucun upload d'archive, suppression du TemporaryDirectory à la fin.
- Empreinte exacte du corps HTTP enregistré : 03ab8d57735ac80ac001b07e5ba14a6b661d9cc61a6b0470c811674e0ca1ed5a.
- Empreinte JSON canonique (normalisation indépendante du format HTTP) : 7304ff3751facbed5224ce1a94b3fce48539f9a29d877124d2025f9be1ac291d.
- Empreinte de l'observation NDJSON : ba7178cb283234a21350b26b99c917fee328090c66b1538906dcd17737b02d0d.
- Les empreintes prouvent la reproductibilité relative à cette acquisition et que le format brut est bien distinct de la représentation canonique. Elles **ne constituent ni une signature IBGE ni une licence de réutilisation**.
- Workflow SYNTHÉTIQUE précédemment vert : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44614168845 (33 tests ciblés, 76 tests ingestion à ce stade). Après tout durcissement/documentation, reconsulter les deux CI au SHA final de #70 ; conserver les verdicts des runs échoués antérieurs.

### Durcissements supplémentaires de la PR #70
- **Restaurabilité** : manifest.json enregistre désormais les noms de fichiers **relatifs au dossier de révision**. Le vérificateur reconstitue les chemins dans le nouvel emplacement et n'autorise pas de référence arbitraire. Test copytree dans une autre racine privée avec vérification du contenu original.
- **Chemins** : refus des symlinks dans les segments de stockage source/dataset/revisions et des fichiers/symlink finaux ; pas de sortie du répertoire privé par nom de source arbitraire.
- **Budget mémoire** : limite des bytes HTTP de 1 Mo pour ce pilote, 8 Mo pour le NDJSON normalisé, 256 Ko pour le manifest. Vérification de taille avant relecture, refus des archives corrompues ou surdimensionnées sans lecture incontrôlée.
- **Limites assumées** : SHA seuls ne remplacent pas une signature cryptographique externe ni les droits d'accès FS ; sur multi-hôtes il faut registre transactionnel/gestion des leases ; sur stockage permanent il faut sauvegarde et restauration réellement prouvées. L'horodatage firstSeen n'est pas un journal de chaque fetch : à construire en DATA-1B2.
- **Issue de continuation** : https://github.com/OBIANG5/World-Health-Vision/issues/71 (DATA-1B2). Ne pas créer de serveur ou étendre la publication avant décision de budget et droit. PR #70 = candidate DRAFT isolée.

**Point de contrôle pour les prochains chats :** toujours retrouver le **SHA HEAD de PR #70**, regarder ses deux GitHub Actions (synthétique ET LIVE) sur le même SHA, puis lire cette note et l'issue #71. En cas de divergence, la CI et le code priment sur le texte historique. 
