# World-Vision V2 — DATA-1C-A2B2b : empreinte et version du vérificateur scientifique dans l'attestation Ed25519

Date : 20 novembre 2026. Dépôt : OBIANG5/World-Health-Vision, répertoire canonique worldhealth-vision-v2.
Branche DRAFT : data/v2-semantic-parser-attestation-2026-11-20.
Parent : PR #93 DATA-1C-A2B2a, commit de départ e87c1b45c20e44df4e2d8a78aee946b6c0d6aa20, empilé sur PR #91 / #88 / #85 / #81 / #78 / #73 / #70 / #69. Issues #92, #89, #82 et #71.
**Statut : candidat en CI sur branche, aucune fusion v2, aucune livraison Vercel, aucune licence IBGE/WDI autorisée ou coût supplémentaire.**

## 1. Problème corrigé

Le reparseur indépendant DATA-1C-A2B2a (PR #93) reconstruisait l'observation brute → NDJSON et détectait même un faux NDJSON initial dont les hashes, manifestes et événements SUCCESS étaient cohérents. Son rapport SemanticReplayProof contenait une version logique, MAIS l'attestation que le témoin Python transmettait à Java n'indiquait pas **quelle version exacte de la méthode et du code** avait été exécutée.

Une signature Ed25519 peut être authentique même si le composant témoin a été remplacé par une implémentation ancienne ou non approuvée. Pour une future plateforme mondiale, il faut distinguer deux questions :
1. « Ce code de référence a-t-il été inspecté et autorisé comme vérificateur pour cet usage ? »
2. « Est-ce exactement ce code qui a produit l'attestation de cette observation ? »

Cette tranche introduit un verrou POSITIF de version/code et fait échouer les anciennes preuves V1 sans conversion silencieuse.

## 2. Modifications réellement codées

### Python — version V2 du contrat et SHA des octets de code

Fichier services/ingestion-service/src/ingestion_service/private_bronze_witness.py.

- Le témoin ne peut toujours signer que PRIVATE_RESEARCH_VALIDATION pour les pilotes non licenciés ; PUBLIC_API_INGEST reste impossible.
- Il vérifie maintenant les octets originaux, la normalisation via semantic_source_replay.py, la preuve AcquisitionJournal SUCCESS et la projection complète avant de préparer son attestation.
- L'attestation devient WORLD_VISION_BRONZE_WITNESS_V2. Elle comporte deux nouveaux champs **couverts par la signature Ed25519** :
  - semanticVerifierVersion = WORLD_VISION_SEMANTIC_POPULATION_REPLAY_V1, fourni par la référence scientifique appliquée ;
  - semanticVerifierCodeSha256 = SHA-256 des octets du fichier de code semantic_source_replay.py exécuté sur l'environnement privé.
- Ces deux attributs sont inclus dans le même message length-prefixed UTF-8 que les hashes originaux, la requête, son opération, les événements d'acquisition, dates et items, avec domaine VERSIONNÉ V2. Leur modification après émission invalide la signature.
- Aucun nombre de population, body fournisseur ni chemin de fichier interne n'est ajouté à la preuve publique. Les fichiers et données restent sous le root Bronze privé.
- La clé privée du signataire est injectée hors code de publication et n'est ni dans GitHub ni dans le service Timeseries.

### Java — réception indépendamment approuvée

Fichiers :
- services/timeseries-service/src/main/java/com/worldhealthvision/timeseries/service/SignedEvidenceAttestation.java : deux champs version + SHA implémentation, encodés et signés dans le protocole V2.
- EvidenceAttestationVerifier.java : refuse V1, refuse schémas inconnus, refuse version sémantique différente, refuse le SHA non autorisé du code par rapport à **un digest que le propriétaire du serveur a configuré hors requête** via WHV_SEMANTIC_REPLAY_CODE_SHA256. Une simple chaîne de hash soumise par un client ne peut pas être autoapprouvée. Champ absent, configuration vide, digest mal formé, vieux token, code changé, signature invalide : HTTP 403 sans données source.
- src/main/resources/application.yml : le SHA de code autorisé est VIDE par défaut, donc aucune publication n'est possible tant qu'un opérateur habilité n'a pas revu le parseur puis déployé un digest adéquat.
- src/test/resources/application.yml : seulement un SHA synthétique 64 caractères « 9 » pour les tests CI, explicitement dépourvu de statut d'approbation réelle.

Le code conserve les garanties précédentes : indépendance clé témoin et clé reviewer, code de refus IBGE/WDI source, SignedRightsRegistry, vérification des revocations au moment de l'ingestion, SHA des observations calculé par le receveur, replays read-only, ancienne migration Flyway V5 qui cache les runs sans provenance tout en conservant leur historique physique.

## 3. Validation et contrat versionné

- Nouveau message signé V2 avec identité des composants ; identifiant de domaine changé de V1 à V2 pour éviter confusion de protocole.
- Tests Python vérifient que semanticVerifierCodeSha256 correspond au SHA **des octets du fichier réel** sur le runner, et que les deux champs sont inclus dans le message signé : modification d'un champ = signature invalide.
- Tests Java/PostgreSQL16/Flyway/Testcontainers utilisent deux signataires éphémères indépendants en CI et vérifient une signature Ed25519 correcte MAIS un mauvais code SHA/version → 403, ancienne preuve V1 → 403, aucune empreinte de méthode serveur → DENY, et un SHA de configuration mal formé → démarrage/refus.
- Vecteur GOLDEN interlangages mis à jour pour V2 avec code SHA de test purement synthétique, sans clé réelle ni valeur IBGE/WDI.
- Workflow autonome .github/workflows/whv-v2-data1c-parser-proof-v2.yml : Java 21, vrais tests PostgreSQL16, tests Python3.12 + cryptography éphémère et régressions ingestion complètes hors test World Bank réseau séparé.
- Workflow live .github/workflows/whv-v2-data1c-semantic-live-private.yml : deux seules ressources officielles originales IBGE/WDI, reparse indépendant, deux attestations PRIVÉES avec version du validateur et SHA recalculé du code en cours, aucun export ou publication des chiffres. Ces workflows doivent être validés au HEAD final avant de déclarer cette PR techniquement prête.

## 4. Ce qui n'est PAS résolu par cette tranche

1. Le SHA d'un fichier de parseur prouve l'identité des octets de code **déclarés par un témoin déjà fiable**, pas leur justesse mathématique absolue ni la sécurité d'un environnement compromis. KMS/HSM, approbation de versions sous contrôle à quatre yeux, SBOM, signataire isolé, attestation de build reproductible, identités mTLS/OIDC, DB RBAC et autorité de déploiement restent à mettre en place.
2. La configuration actuelle approuve exactement UN digest de code de référence pour ce domaine ; gérer une vraie transition multi-clés/multi-versions avec **revocation et non-exposition de toutes les observations dérivées** si une version de parseur est compromise reste le chantier suivant. L'ancienne vue latest s'assure de l'existence d'une preuve passée, mais ne vérifie pas dynamiquement si la clé de témoin ou le parseur ont été révoqués depuis.
3. Le témoin Python du pilote vérifie uniquement un recensement national 2022 et une estimation WDI BRA/2022 ; pas de couverture automatique des 217 pays. Les autres jeux institutionnels exigent des validateurs versionnés et licences propres.
4. Ces données sont BLOQUÉES pour publication (IBGE 4714/93 commercial license NEEDS_PROVIDER_CLARIFICATION). Le protocole V2 et les droits signés ne valent ni droit commercial ni permission API redistribution. Un signataire de PUBLICATION dans une infrastructure souveraine reste à concevoir séparément d'un témoin de recherche.
5. L'hébergement durable sécurisé, l'identité workload, la persistance chiffrée et les restaurations complètes PostgreSQL+Bronze/journal/reçus/droits ne sont toujours pas réalisés. AUCUN déploiement Vercel n'a été modifié.

## 5. Suite intelligente, sans rupture du fil

- **DATA-1C-A2C** : gouvernance et audit des versions de parseurs, registre de confiance à durée/version, révocation de clé ET parseur qui masque immédiatement les anciennes observations publiques, mTLS/OIDC/KMS/DB role separation, signataire PUBLIC isolé uniquement pour jeux réellement licenciés, audit append-only de chaque émission.
- **DATA-1C-B2** : dates de révision fournisseur, heure de publication et heure de récupération séparées; ne pas confondre fresh fetch et latest methodology, source-native revision et dépendance WDI/IBGE.
- **DATA-1C-C** : stockage privé durable/chiffré, off-site backup et restauration PostgreSQL + Bronze + journal + droits, RPO/RTO mesurés, coûts approuvés.
- **DATA-1C-D** : Gateway/Atlas sur seules données concrètes ET juridiquement autorisées, territoire/méthodologie/sources primaires et internationales, puis institut INSTAT Gabon, BEAC et pays supplémentaires. Les thèmes média/GDELT/voix, PR UX #75, issues #76/#68 restent séparés.
- Pour reprendre : lire ce document, les docs A2B2a et A2B1, l'issue #92 et #82, vérifier PR HEAD/CI, ne jamais déclarer que la version publique a changé par une simple PR DRAFT.

**Critère de livraison de cette branche : CI Java/PostgreSQL/Python + live recherche privée V2 réussies sur le même commit code; documenter les SHA et liens dans la PR, l'issue #92 et HANDOFF_CORE_F12B.**
