# World-Vision V2 — DATA-1C-A2A : décisions de droits signées, refus par défaut, révocation transactionnelle et lectures publiques

**Date : 20 novembre 2026.** Dépôt : OBIANG5/World-Health-Vision.
**Branche DRAFT :** data/v2-signed-rights-registry-2026-11-20.
**Parent DRAFT :** #85 DATA-1C-A1 (SHA de départ bde82762b933dbaba5099ab09dd231cbca2421c9) → #81 DATA-1B3 → #78 DATA-1B2B → #73 DATA-1B2A → #70 DATA-1B1 → #69 DATA-1A.
**Issues :** #86 DATA-1C-A2, #82 DATA-1C globale, #71 droits/provenance spécifiques IBGE.
**Aucun changement de v2 public, de Vercel, des médias, de la voix ou des coûts infrastructure.** Le code est une PR empilée DRAFT non fusionnée.

## 1. Pourquoi cette suite est utile — droit et fait sont distincts

La précédente PR #85 a sécurisé le transport d'une écriture interne et les replays immuables, mais une personne ou un connecteur connaissant le secret partagé pouvait encore écrire d'AUTRES sources sans décision juridique positive côté serveur. Dans une plateforme de données mondiale, il est dangereux de supposer que disponibilité d'un fichier ou réputation d'un organisme = droit de republier commercialement.

Ce lot introduit une autorisation indépendante, **spécifique à la paire source/dataset, au pays, indicateur, période, SHA de réponse HTTP originale déclaré, et opération PUBLIC_API_INGEST**. Aucune approbation n'est préchargée. Le seul mot APPROVED dans une requête n'accorde rien. Un droit de simple archivage ou affichage web ne permet pas l'ingestion vers une API publique. Les champs d'attribution, licence, hash de licence, auteur et contresignataire sont inclus dans une signature indépendante ; cette signature atteste l'identité de la décision, **PAS l'authenticité automatique d'une licence détenue auprès du fournisseur**.

## 2. Architecture effectivement modifiée, sans moteur neuf

### 2.1 Flyway V4, aucune destruction des données

Fichier : services/timeseries-service/src/main/resources/db/migration/V4__signed_source_rights_and_serialized_revocations.sql

- timeseries.rights_decision : décision UUID, source_code, dataset_code, country_iso3, indicator_code, operation, original_http_sha256, plage période, issued_at / valid_from / valid_until, 2 identités reviewer/countersigner, identifiant/URL/hash de texte de licence, attribution, empreinte de clé publique, signature Ed25519 base64 et date de création.
- timeseries.rights_revocation : **événement append-only** par décision, avec date, opérateur et code motif ; jamais un simple booléen mutable.
- timeseries.source_run_rights_decision : lie chaque NOUVELLE exécution Timeseries à toutes les autorisations vérifiées qui ont effectivement permis d'écrire. Ne rétro-approuve aucune ligne préexistante.
- Index ciblés par source/dataset/pays/indicateur/opération/HTTP SHA. Différents types d'opérations autorisées par le schéma, mais la route de publication actuelle exige explicitement PUBLIC_API_INGEST.
- Aucune ligne INSERT de droit par migration : **zéro licence supposée**, y compris pour World Bank, IMF, IBGE et registres de 217 pays.
- Triggers de rejet d'UPDATE/DELETE sur décisions, révocations et liens de preuve. Un administrateur privilégié de la base peut techniquement désactiver des triggers : cela N'EST PAS une infrastructure WORM ni un journal juridiquement inviolable.

### 2.2 Ed25519 avec clé publique de confiance externe

Fichiers : SignedRightsDecision.java (encodage canonique longueur+UTF-8), RightsSignatureVerifier.java, RightsAuthorizationException.java.

- Une décision signe TOUS ses attributs critiques : source, dataset, pays, indicateur, opération, SHA des octets d'origine REVENDIQUÉ, période, validité, texte de licence/empreinte, attribution, signataires, clé identifiée et UUID.
- KeyFactory Ed25519 + X509EncodedKeySpec de Java 21 ; Signature Ed25519 pour vérifier avec une clé publique indépendante du lot. Références techniques : https://docs.oracle.com/en/java/javase/21/security/java-cryptography-architecture-jca-reference-guide.html
- Clé publique X.509 DER/base64 uniquement dans WHV_RIGHTS_TRUST_PUBLIC_KEY_BASE64 ; **jamais de clé privée d'approbation dans Timeseries ni dans GitHub**. En l'absence de clé de confiance, Timeseries peut démarrer pour lire mais ne peut autoriser aucune NOUVELLE publication.
- Rejet si signature fausse, mauvaise empreinte de clé, validité dépassée, licence non définie, opération insuffisante, reviewer identique au countersigner ou décision manquante. Toujours HTTP 403 sans valeurs de la source.
- La gouvernance réelle des signataires, les demandes de licences aux fournisseurs, l'attribution de rôles, la rotation des clés, la signature par HSM/KMS et la révocation des clés restent à définir : le TEST signe uniquement des permissions SYNTHÉTIQUES avec une clé ÉPHÉMÈRE créée en mémoire.

### 2.3 Autorisation pendant LA transaction PostgreSQL

Fichiers : SignedRightsRegistry.java et TimeseriesIngestionService.java.
- Le serveur normalise source et indicateurs puis bloque d'abord les sources de recherche protégées de la PR #85.
- À l'intérieur de la transaction SQL READ COMMITTED, SignedRightsRegistry exige le SHA original prétendu httpBodySha256 dans les notes. Sélection de décisions à territoire, indicateur, période, source, dataset, SHA et opération EXACTS. AUCUN wildcard implicite.
- Les lignes de décision sont verrouillées SELECT FOR UPDATE en ordre stable. Le trigger rights_revocation_lock_parent exige le MÊME verrou avant d'ajouter une révocation. Après acquisition des verrous, l'ingestion vérifie l'existence de révocations dans une seconde requête SQL, pour voir les commits survenus pendant l'attente.
- Signatures vérifiées pendant la transaction ; un droit absent, expiré ou révoqué = refus. Deux décisions actives qui prétendent au même champ sans règle de succession explicite = refus (ne pas choisir arbitrairement).
- Avant commit, les droits sont recontrôlés puis liés au nouveau source_run. Un replay identique vérifie aussi les droits courants, mais ne réécrit pas de liens ou observations.
- La signature juridique et la transaction ne sont PAS une preuve que le champ httpBodySha256 envoyé par le producteur correspond aux vrais octets originaux. Ce lien doit être vérifié contre QuarantinedJsonEvidenceStore/AcquisitionJournal par attestation interservices dans la SUITE DATA-1C-A2B ; d'ici là, ne pas émettre d'approval réel et ne pas exploiter publiquement. La clé d'ingestion partagée de #85 n'équivaut pas à une identité forte.

### 2.4 Révocation s'appliquant aussi aux LECTURES PUBLIQUES

Les données peuvent rester physiquement conservées dans PostgreSQL comme preuve, tout en cessant d'être autorisées à l'exposition :

- La migration V4 remplace (sans en changer les colonnes) la vue timeseries.latest_observation, base des lectures de séries, latest, comparaisons et statistiques de couverture. Chaque observation doit posséder un lien vers une décision encore valide et non révoquée, correspondant à son pays, indicateur, période, source, dataset et SHA présent dans le source_run.
- JdbcTimeseriesRepository.listSourceRuns ne présente plus publiquement les journaux des runs sans droits actifs, périmés ou révoqués. Les métadonnées d'un ancien run non certifié ne deviennent pas une preuve de publication.
- Les observations historiques de V1/V2 (sans source_run_rights_decision) sont conservées physiquement mais **masquées dans les vues publiques** jusqu'à réexamen. C'est un changement de comportement volontaire, à évaluer avant toute migration du vrai service : il peut réduire drastiquement les séries visibles si l'ancienne base n'a pas de licences vérifiées.
- L'endpoint readiness peut continuer à compter des lignes physiques non publiables : ce compteur n'est PAS une preuve de couverture légale, un produit ne doit pas le transformer en chiffre visible d'offres réellement actives.
- La consultation par un administrateur de la base n'est pas une exposition publique. Les politiques RBAC, chiffrement et règles de conservation restent distinctes.

## 3. Preuves de qualité et tests

Workflow dédié : .github/workflows/whv-v2-data1c-signed-rights.yml.
- Java 21, PostgreSQL 16 Testcontainers, migrations Flyway et tous les tests Timeseries existants.
- Python 3.12 : tests de sécurité du producteur et régressions intégrales ingestion hors test World Bank *explicitement réseau live* (déjà couvert indépendamment sur PR #81).
- SignedTestRightsFixture.java : génère KeyPair Ed25519 avec KeyPairGenerator **uniquement en RAM dans le processus CI**, ne commit jamais la clé privée. Les décisions signées ne portent que des données synthétiques de PIB France/Allemagne ou d'indicateurs SYNTH.RIGHTS.*. AUCUN droit réel émis par ce fixture.
- Scénarios de tests : aucune décision même si token d'ingestion valide + message APPROVED ; signature valide/incorrecte ; source/dataset/pays/indicateur/année et version SHA sans correspondance ; ancienne permission expirée ; permission PUBLIC_WEB_DISPLAY insuffisante pour PUBLIC_API_INGEST ; deux décisions actives ambiguës ; création d'un lien de décision avec le run ; replay sans modification ; révocation puis refus du replay ; impossibilité de supprimer ou modifier la décision/révocation ; sérialisation de la révocation sur verrou PostgreSQL ; suppression de l'observation des lectures publiques dès la révocation ; données anciennes non attestées stockées mais masquées ; absence de clé publique de confiance = refus.
- Preuve avant derniers tests historiques : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44707941014, **SUCCESS**, 22 tests Java/PostgreSQL et 164 tests Python, HEAD 5f72f6dbe764c487f6a7ea7360370bf54da3ef80.
- Tests supplémentaires créés ensuite : ancien source_run physique sans autorisation masqué à la lecture, absence/malformed trust anchor, référence dynamique du dernier run Github Actions à consigner dans la PR avant acceptation finale.
- TOUT commit de documentation relance le workflow Java/Python ; ne prétendre que le HEAD final a été validé qu'avec le run correspondant, et n'utiliser aucun run antérieur pour couvrir un changement de comportement SQL non exécuté.

## 4. Ce qui RESTE pour une vraie mise en exploitation mondiale

**DATA-1C-A2B : preuve complète et identité forte.**
- Mettre au point une attestation serveur sécurisée liant ORIGINAL HTTP SHA, normalized SHA, manifest, acquisition event, objet composite, source scope et décision légale signée. Le receiver ne doit pas se contenter du httpBodySha256 déclaratif dans notes. Revoir le modèle de copie/accès privé Bronze sans exposer les octets via Gateway et éviter la duplication non maîtrisée.
- Provisionner/rotater et auditer les clés de confiance, définir la séparation vérificateur/reviewer/countersigner, mTLS/OIDC/workload identity, ACL réseau et DB roles : rôle de publication incapable de fabriquer des grants, rôle spécialisé de révocation, signataire hors ligne dans infrastructure HSM/KMS.
- Revoir la liste exacte d'opérations : l'autorisation PUBLIC_API_INGEST couvre la mise à disposition via l'API publique mais ne vaut PAS permission distincte de monétisation, export commercial, entraînement IA, redistribution à des tiers ou création de produits dérivés. Les usages commerciaux exigent une décision indépendante adéquate. Un administrateur ne peut pas transformer un droit NONCOMMERCIAL en commercial en changeant un booléen dans la requête.
- Clarifier les droits commerciaux IBGE 4714/93 : NEEDS_PROVIDER_CLARIFICATION, aucun droit signé ; WDI doit être revu séparément.
- Ajouter un journal de tentatives d'autorisation sans données sensibles, nombre d'échecs, cause catégorisée, signataire/révocation, corrélation avec import ; droits refusés ne doivent pas disparaître de l'audit privé.
- Tester la révocation après revue et au milieu d'une transaction réelle avec injection contrôlée et scénarios multi-threads ; un run Java qui passe sur PostgreSQL CI est une preuve d'intégration bornée, pas un déploiement multi-instance 24/7.

**DATA-1C-B2 : sémantique des versions fournisseur**, sans confondre fetched_at_utc avec source_revised_at ni appeler « dernier recensement » un dataset à la méthodologie différente. Protéger latest, états estimés/observés et source de l'année.

**DATA-1C-C : stockage privé durable et restauration** : PostgreSQL + Bronze + journaux + reçus + droits + révocations, chiffrement, backup/restore testés, RPO/RTO et coûts acceptés. Les workflows CI gardent tout en environnement éphémère.

**DATA-1C-D : Gateway/Atlas réels** : ne publier que les sources autorisées, éviter les données absentes inventées, afficher provenance, droits, méthode, période, incertitude, degré de dépendance source, géographie ; ne jamais confondre un registre de 217 pays avec une couverture réelle. Ensuite INSTAT/BEAC Gabon et autres sources locales; médias/GDELT et voix sont conservés sur leur fil distinct (issue #76), UI PR #75 et Vercel #68 également.

## 5. Reprise exacte entre chats

1. Lire PR DRAFT basée sur #85 (branche data/v2-signed-rights-registry-2026-11-20), vérifier HEAD réel et les deux jobs du run GitHub Actions sur ce SHA.
2. Lire CE fichier puis HANDOFF_CORE_F12B_2026-11-19.md, issue #86 et #82, ainsi que le handoff A1 (documents continuity de la branche parent).
3. Inspecter la migration V4, SignedRightsDecision, RightsSignatureVerifier, SignedRightsRegistry, TimeseriesIngestionService, le filtre de latest_observation et source-runs ; ne pas recréer un autre service et ne pas sauter le blocage IBGE.
4. Commencer DATA-1C-A2B par la vérification forte du SHA déclaré dans notes et l'origine Bronze en transaction (pas seulement une signature de la déclaration) ; puis gouvernance des clés/service-auth et journal légal. Ne fusionner la pile qu'après les exigences de sécurité/licences/QA.
5. Documenter chaque correction et nouvelle PR sur GitHub, et lier issue #86/#82, sans dévier vers la page d'accueil de l'iPhone ou des médias lorsque la priorité explicitement poursuivie est DATA.

**Aucune promesse de licence, déploiement en production ou sécurité juridique définitive n'a été faite par ces tests.**


## 6. Preuves acceptées et référence du prochain chantier

Sur commit 063307bf320c95e551e63304c990aaffc4b20510, le run https://github.com/OBIANG5/World-Health-Vision/actions/runs/44708660259 est SUCCESS, 24 tests Java/PostgreSQL et 164 tests Python. Nouveaux scénarios : ancien source_run V1 avec une valeur physique mais aucun droit signé → lecture publique nulle, et absence/invalidité de trust anchor → refus d'approuver. Lors de l'ajout de ce document, toujours re-vérifier que le HEAD de la PR #88 a réussi les mêmes contrôles : GitHub Actions concurrence annule les runs intermédiaires.

**PROCHAINE ISSUE DÉTAILLÉE DATA-1C-A2B #89** : https://github.com/OBIANG5/World-Health-Vision/issues/89, vérification des bytes Bronze/SHA/journal de l'autre côté du service, preuve signée de provenance et identité workload. Ce chantier demeure requis avant toute publication de sources dont la licence n'a pas été dûment revue. La suppression de valeurs révoquées des lectures n'efface ni les liens de preuve ni l'observation conservée dans le stockage privé.
