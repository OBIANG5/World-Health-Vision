# World-Vision V2 — DATA-1C-A2B1 : témoin indépendant de provenance et preuve des valeurs originales

**Date : 20 novembre 2026.** Dépôt : OBIANG5/World-Health-Vision. Application : worldhealth-vision-v2/.
Branche : data/v2-bronze-evidence-attestation-2026-11-20.
Base : PR DRAFT #88 DATA-1C-A2A, commit parent 1ebe44cea32dc9fdd41944b60b411e26e006a381. Chaîne empilée, non fusionnée dans v2 : #69 DATA-1A → #70 DATA-1B1 → #73 DATA-1B2A → #78 DATA-1B2B → #81 DATA-1B3 → #85 DATA-1C-A1 → #88 DATA-1C-A2A → DATA-1C-A2B1. Suivi : issue #89 (partie A2B), issue mère #82, #86, droits IBGE #71.

Ne pas changer la priorité DATA : les demandes ponctuelles d'accueil iPhone PR #75, de déploiement Vercel issue #68 et les médias/GDELT/voix et comparaisons d'articles issue #76 restent CONSERVÉES mais séparées. Aucune nouvelle dépense VPS/cloud, fusion, déploiement Vercel, Timeseries prod ou licence IBGE approuvée n'a eu lieu.

## 1. Pourquoi l'ancienne chaîne n'était pas suffisante

PR #88 contrôle des décisions de droits Ed25519 de façon positive, par source/dataset/pays/indicateur/période/SHA HTTP original DÉCLARÉ dans les notes du producteur et par opération PUBLIC_API_INGEST. Une signature juridique valide atteste le droit décidé par des reviewers, mais ne prouve PAS que le SHA choisi par l'émetteur correspond aux vrais octets HTTP de la source. Un producteur connaissant la clé privée de transport (ou compromis) pouvait déclarer le SHA d'une version authentique tout en soumettant d'autres valeurs.

La nouvelle tranche impose une SECOND signature indépendante sur les éléments factuels, générée uniquement après vérification du stockage Bronze privé et du journal d'acquisition, et demande au Java TimeseriesReceiver de recalculer le digest des valeurs réellement présentées.

Les trois notions doivent rester distinctes :
1. original HTTP et normalisation vérifiés (QuarantinedJsonEvidenceStore),
2. réussite prouvée d'une acquisition précise distincte de la révision source (AcquisitionJournal),
3. autorisation de publication et de réutilisation conforme à la licence (SignedRightsRegistry et opération demandée).

## 2. Modifications réellement implémentées

### Python : composant témoin RECHERCHE SEULEMENT

- services/ingestion-service/src/ingestion_service/private_bronze_witness.py : PrivateBronzeWitness.certify_research_only prend le root du stockage privé, un signataire Ed25519 distinct, un couple institution/dataset allowlisté, SHA original et eventId acquisition précis. Il appelle QuarantinedJsonEvidenceStore.verify et AcquisitionJournal.audit, exige un événement SUCCESS HTTP 200 explicitement sélectionné, même responseSHA et manifest valide, et refuse STARTED, FAILED, symlinks, sources non listées, archives altérées et anciennes preuves sans droits. Il relit original/normalized/manifest/outcome, calcule leurs digests, extrait les observations normalisées et signe la preuve versionnée avec ses timestamps et une durée de vie bornée.
- Il signe exclusivement l'opération PRIVATE_RESEARCH_VALIDATION ; IL NE PEUT PAS signer PUBLIC_API_INGEST, car les datasets actuellement archivés sont BRONZE_ONLY_UNREVIEWED / REVIEW_REQUIRED / NOT_ATTEMPTED. Le receveur refuse donc en production les signatures issues de ces pilotes. Une licence spécifique IBGE 4714/93 commercialement réutilisable n'a pas été confirmée.
- Aucune clé privée dans le dépôt, les logs, Vercel ou Timeseries. Dépendance cryptography installée seulement dans la CI de ce témoin. La clé de test est créée à la volée en RAM, non exportée.
- services/ingestion-service/src/ingestion_service/evidence_items_fingerprint.py calcule une projection typée, bornée et sans ambiguïté des valeurs réellement normalisées, dates, sourceMetadata et qualité, avant la signature.

### Java : vérification indépendante et double signature

- services/timeseries-service/src/main/java/com/worldhealthvision/timeseries/service/EvidenceItemsFingerprint.java : projection identique des observations réellement reçues et normalisées. Les identités sont triées, doublons refusés, valeurs numériques en IEEE754 binary64, metadata et flags inclus, champs texte et formats non supportés refusés. Ce SHA ne vient pas des notes du producteur.
- SignedEvidenceAttestation.java : contrat de signature ED25519 version WORLD_VISION_BRONZE_WITNESS_V1, operation, institution, dataset, runKey, fetchedAtEpochSec et nano, originalHttpSha256, normalizedNdjsonSha256, manifestSha256, acquisitionEventId, acquisitionOutcomeSha256, itemsSha256, issuedAt/expiresAt, publicKey SHA et signature base64. Le flux signé est canonical UTF-8 avec longueurs 32-bit big-endian, indépendant d'une représentation JSON ambiguë.
- EvidenceAttestationVerifier.java : clé de confiance publique DIFFÉRENTE de celle des reviewers, issue de WHV_EVIDENCE_TRUST_PUBLIC_KEY_BASE64. Aucune clé = DENY. Il valide structure exacte du token, Ed25519, clé publique, portée/instant du fetch, notes SHA source, normalized/manifest/event/outcome, items_sha256 calculé sur requête, recordCount exact et expiration au plus 10 minutes, puis autorise l'étape suivante. Un token de recherche PRIVÉE, un token expiré, une signature fausse ou une valeur changée après signature renvoie 403 générique.
- TimeseriesIngestionService.java : ordre strict sous la même transaction PostgreSQL : blocage ibge/wdi recherche de #85 → preuve du témoin → décision de droits signée #88 et révocation sous verrou → insert ou replay idempotent. Un mot de passe de transport seul ne suffit plus.
- CanonicalIngestionFingerprint.java exclut de l'identité durable d'une version uniquement le token evidenceAttestation éphémère. Une nouvelle signature du même contenu prouvé reste un replay lecture-seule, sans mettre à jour valeurs et timestamps ; chaque replay vérifie néanmoins la nouvelle preuve et les droits en vigueur.
- TimeseriesRepository et JdbcTimeseriesRepository enregistrent les hashes serveur evidence_attestation_sha256 et attested_items_sha256, pas une assertion arbitraire de leur valeur par le client. Les pages publiques source-runs tiennent compte de ces hashes.
- TimeseriesExceptionHandler.java : HTTP 403 de preuve impossible à valider, sans body fournisseur, valeur numérique ou signature sensible renvoyés.

### Flyway V5 et exposition publique

- services/timeseries-service/src/main/resources/db/migration/V5__immutable_bronze_witness_provenance.sql.
- Deux colonnes SHA nullable sur source_run, avec NULL pour tout run historique sans preuve ; aucun backfill supposant des droits ou une provenance jamais vérifiée.
- Vue latest_observation remplacée en CONSERVANT l'ordre et les colonnes de la vue V4 ainsi que le filtre droits/révocations. Deux nouveaux critères : un SHA de témoin serveur et un SHA des items serveur non NULL, et concordance du SHA items avec l'attestation stockée. Séries, dernières valeurs, comparaisons et couverture ne présentent pas les anciennes lignes non attestées comme publiables. Source-runs publics également masqués sans preuve. La donnée physique reste archivée et consultable par un administrateur autorisé.
- ATTENTION : V5 peut masquer de nombreuses anciennes valeurs publiques sur une ancienne installation. Ce changement est VOLONTAIRE et exige une revue de migration des droits avant tout merge/déploiement. Le compteur de lignes physiques n'est PAS la couverture publique.

## 3. Invariants cryptographiques inter-langages

Les deux logiciels partagent exactement WORLD_VISION_ITEMS_PROJECTION_V1 : valeurs scalaires null/bool/string UTF8/integer/doubleIEEE754/list/map à clé ASCII, lengths et counts big endian, tri déterministe, au plus 256 observations, 2 Mo et profondeur 8. Le contenu signé couvre TOUTE la valeur, sa date, unité/statu via metadata, le pays, l'indicateur, sourcePublishedAt, qualityFlags et toutes les sourceMetadata. Les changements de valeurs, flags, périodes ou metadata invalident la signature.

Vecteur de test entièrement SYNTHÉTIQUE PIB France 2024 à valeur fictive 17.0, jamais statistique réelle :
- SHA items Python ET Java : cd3c0117ff783f8f0c18aa6075eb8062ffb60f68ab44544edc6268ae79a7fb4d
- SHA payload signé length-prefixed Python ET Java : 1f32b6b91178a9019266999ca478385d1613d1481f15bfd02f67111029d20acb

Tests correspondants : tests/test_private_bronze_witness.py et Java EvidenceItemsFingerprintTest, EvidenceSigningPayloadTest. Ces vecteurs détectent une rupture de compatibilité de formats ou signatures entre les langages.

## 4. Suite de tests CI, preuve et évolution

Workflow : .github/workflows/whv-v2-data1c-bronze-attestation.yml. Java21, Maven, Testcontainers PostgreSQL16/Flyway et tous les E2E historiques du service Timeseries ; Python3.12 avec crypto de test et 100% des régressions ingestion hors l'unique live WorldBank indépendant. Aucune API publique consultée, aucun dataset réel dans les artifacts ni secret réel commité.

- E2E Java : 2 clés Ed25519 ÉPHÉMÈRES distinctes en RAM (reviewer vs témoin), token d'ingestion valide seul insuffisant, attestations valides, replay avec renouvellement du token sans mutation, demande research-only rejetée, expiration rejetée, modification après signature de chiffres, flags, sourceMetadata, pays, timestamps, event/HTTP SHA, recordCount ou clé publique rejetée, aucune clé de confiance serveur refusée. Tous les anciens tests Timeseries avec autorisations de données SYNTHÉTIQUES et journalisation SQL en mémoire sont conservés.
- E2E Python : vraies opérations locales Bronze/AcquisitionJournal sur données IBGE FICTIVES, vérification des octets et de la signature du témoin, altération raw/normalized/manifest/outcome, événement FAILED/STARTED, rejet autre dataset et mauvaise validité, restauration sur autre chemin, SHA des valeurs/flags, vecteurs inter-langages.
- Un premier run code complet après E2E additionnels, avant vecteur de signingPayload : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44713068766 — SUCCESS, **31 tests Java et 186 Python**. Vérifier les jobs du HEAD FINAL après documents ; les runs intermédiaires annulés par concurrency ne sont pas des preuves.

## 5. LIMITES IMPORTANTES : ne pas présenter cela comme mise en production

1. Le vrai Python PRIVATE_RESEARCH_VALIDATION ne peut pas signer une publication, même avec un reviewer qui prétendrait être APPROVED. Le Java exige PUBLIC_API_INGEST. Les seules signatures positives dans CI sont des exemples SYNTHÉTIQUES générés avec une clé de test, et ne prouvent aucune licence fournisseur.
2. La vérification Bronze prouve la COHÉRENCE cryptographique de raw+NDJSON+manifest+SUCCESS ; elle ne relance pas encore systématiquement un second PARSEUR indépendant sur les octets originaux pour démontrer que chaque transformation statistique NDJSON correspond réellement à la valeur d'origine. Un faux NDJSON initial avec hashes cohérents pourrait tromper cette étape. **DATA-1C-A2B2** devra refaire les validations de normalisation spécifiques à chaque institution/dataset, versionner et signer la version du parseur et l'unité/protocole méthodologique, garder un audit indépendant des émissions.
3. La clé de témoin, la clé des reviewers et les signataires HUMAINS ne sont pas encore provisionnés : pas de HSM/KMS, mTLS/OIDC interservices, certificats, rotation, liste de révocations de clés, RBAC/DB roles ou vérification de clé encore active au moment d'une LECTURE. Les revocations de LICENCE sont déjà appliquées aux lectures via V4 ; les revocations de CLÉS du témoin restent à développer.
4. Le stockage Bronze est encore local privé et ne garantit ni persistance chiffrée, WORM, backup hors site, restauration automatique, ni SLA mondial. Un test GitHub Actions ne constitue pas un service international 24/7.
5. La permission PUBLIC_API_INGEST ne vaut PAS réutilisation commerciale, redistribution API externe, vente, produits dérivés ni entraînement IA. Les droits par opération de #88 restent séparés. IBGE 4714/93 commercial demeure NEEDS_PROVIDER_CLARIFICATION.
6. La vue latest utilise encore les dates de récupération plutôt que les dates officielles de révision fournisseur : DATA-1C-B2 à corriger avant Atlas international. Aucun nombre de pays couverts n'est déduit du catalogue à 217 pays.

## 6. REPRISE EXACTE AU PROCHAIN CHAT — ne pas perdre le fil

Lire cette note, la PR de la branche DATA-1C-A2B1, ses SHAs et les deux jobs CI du HEAD, le grand HANDOFF_CORE_F12B_2026-11-19.md et l'issue #89. Ne pas recommencer l'audit depuis zéro ni engager un nouveau VPS. Conserver les protections de #88 (droits et revocation), #85 (source-run immuable), #81 (non-comparabilité IBGE/WDI) et #78 (acquisitions).

SUITE PRIORITAIRE : **DATA-1C-A2B2**, attestation de TRANFORMATION sémantique raw→normalized avec un vérificateur indépendant par fournisseur, version/empreinte du parseur, signature par un service isolé après droits validés, identity workload mTLS/OIDC, politique des clés et révocation KMS, rôles DB qui interdisent au writer d'insérer/revoquer des droits, audit des émissions, puis un premier dataset RÉELLEMENT LICENCIÉ seulement après décision humaine juridique et technique. Pas d'inclusion IBGE sans droit.

Ensuite :
- DATA-1C-B2 : vraie sémantique de sourceRevisedAt vs fetchedAt, historique, ordre latest et incertitudes ;
- DATA-1C-C : persistance chiffrée durable, backup PostgreSQL + Bronze + journaux + reçus, restore prouvé et RPO/RTO ;
- DATA-1C-D : Atlas/Gateway réels sur données valides ET autorisées, affichage méthodologie, pays et institutions locales, pilote Gabon INSTAT/BEAC ;
- sources locales par pays, Watch Vision, Money Vision, Global Radar GDELT avec vérification médias multi-sources et ligne éditoriale séparée.

Toujours actualiser HANDOFF_CORE_F12B et commenter PR/issue #89/#82 sur GitHub avec les fonctions, nouveaux tests, risques, commit final et URL CI. N'affirmer ni fusion v2, ni lien Vercel mis à jour, ni droit accordé si rien de tel n'a été fait.


## 7. Validation officielle effective et fermeture du périmètre du témoin (20/11/2026)

**PR DRAFT #91** : https://github.com/OBIANG5/World-Health-Vision/pull/91.

Sur le commit de CODE d3e842c756c1433b49d8bffa2cd1ae7fa016500b, deux workflows GitHub Actions ont réussi séparément :
- https://github.com/OBIANG5/World-Health-Vision/actions/runs/44714823320 : **SUCCESS, 32 tests Java21/PostgreSQL16/Flyway et 190 tests Python ingestion**, dont 26 tests spécifiques au témoin original et à la projection. Les vecteurs GOLDEN Python/Java et toutes les régressions héritées sont verts.
- https://github.com/OBIANG5/World-Health-Vision/actions/runs/44714823274 : **SUCCESS, quatre RESSOURCES officielles du Brésil/2022 réellement interrogées**, IBGE valeur nationale 4714/93, métadonnées table 4714, listing de périodes, Banque mondiale WDI SP.POP.TOTL source 2. Les SHA et journaux de ces quatre ressources et le reçu IBGE composite ont été vérifiés ; **deux attestations Ed25519 de recherche privée** signées et vérifiées en RAM sur les DEUX ressources numériques IBGE + WDI, aucun jeton PUBLIC_API_INGEST, aucune valeur ni source brute affichée, TemporaryDirectory effacé à la fin. En cas de 429/5xx transitoire, WDI peut nécessiter plusieurs tentatives GET : les « quatre ressources » ne constituent donc pas une garantie de nombre de tentatives HTTP exact.
- Ajouter un dernier contrôle de CI sur le HEAD FINAL de cette PR après les commits documentaires, avant annoncer validation définitive de la PR. Les deux runs ci-dessus justifient le CODE inchangé de leurs SHAs mais ne prouvent ni la licence commerciale ni la persistance de production.

**Restriction de périmètre délibérée** : le témoin Python émet des attestations NUMÉRIQUES uniquement pour IBGE CENSO2022_4714 et WORLD_BANK WDI_POP_TOTAL_BRA_2022. Les autres deux ressources IBGE métadonnées et périodes demeurent vérifiées via AcquisitionJournal et IbgeCompositeReceiptStore ; elles ne sont PAS des observations IndicatorObservation et ne doivent pas être déguisées en valeurs numériques dans la signature destinée à Timeseries. Tests Python explicites : test_wdi_brazil_research_witness_verifies_an_estimate_without_reclassifying_observed, test_metadata_is_never_mistaken_for_a_numeric_timeseries_source. WDI garde la qualité ESTIMATED et non OBSERVED.

**Handoff clair vers l'étape A2B2 :** https://github.com/OBIANG5/World-Health-Vision/issues/92. À implémenter ensuite sur nouvelle branche empilée sur #91 : reparser INDEPENDAMMENT les octets originaux selon un contrat institutionnel versionné et vérifier que chaque valeur normalisée correspond exactement à la réponse du fournisseur. Ne pas transformer une cohérence de SHA en validation scientifique. Ensuite seulement un émetteur public piloté par vraie licence, identité service forte et coffre de clés ; PUBLIC_API_INGEST ne signifie pas COMMERCIAL_REUSE. Vercel, v2, cloud payant, médias/voix demeurent inchangés.
