# World-Vision V2 — DATA-1C-A2B2a : contradiction indépendante RAW → observation normalisée

**Date : 20 novembre 2026.** Projet international World-Vision, logiciel canonique worldhealth-vision-v2.
Dépôt GitHub : OBIANG5/World-Health-Vision. Branche **data/v2-independent-semantic-replay-2026-11-20**.
Parent initial **PR DRAFT #91** DATA-1C-A2B1, tête initiale **7f34665d81218d5fc9995b1e5dcff033c1e73359**. Chaîne de développement empilée non fusionnée dans v2 : #69 DATA-1A → #70 DATA-1B1 → #73 DATA-1B2A → #78 DATA-1B2B → #81 DATA-1B3 → #85 DATA-1C-A1 → #88 DATA-1C-A2A → #91 DATA-1C-A2B1 → CETTE BRANCHE A2B2a. Issue de pilotage **#92** et parents #89, #86, #82, #71.

**NE PAS OUBLIER L'OBJECTIF DU PROJET** : couverture géographique internationale, institutions locales/nationales/régionales/internationales, comparaison scientifique des méthodes et sources, provenance, droits exacts par opération, data durable et vrai Atlas/Gateway. Le média/GDELT/voix et l'UX sont conservés dans leurs flux de travail distincts (#76 / #75 / #68) mais ne déplacent pas la priorité présente. Aucun VPS acheté, aucune fusion v2, aucun déploiement Vercel ou publication de nombres IBGE/WDI.

## 1. Problème scientifique découvert dans DATA-1C-A2B1

La PR #91 a réellement établi deux piliers : octets HTTP, NDJSON, manifeste et journal SUCCESS signés en Ed25519 par un témoin indépendant ; projection complète des observations ré-hachée en Java et comparée à sa signature avant toute autorisation positive du registre de droits. Cependant **des SHA cohérents ne sont pas la preuve qu'un parseur a correctement transformé la source**.

Scénario hostile précis : la réponse originale du fournisseur est intacte, mais le premier pipeline fabrique dès le départ un NDJSON mensonger, et calcule correctement ses SHA/manifestes, enregistre un SUCCESS et demande une signature à un témoin qui ne fait que vérifier les intégrités binaires. Les SHA et le journal sont alors parfaits, mais la valeur statistique est fausse. **Il faut reparser les octets de façon indépendante, pas seulement les re-hasher.**

## 2. Nouvelle implémentation, réutilisation des moteurs

### 2.1 Référence sémantique indépendante, STRICTEMENT deux ressources

Fichier Python ajouté : services/ingestion-service/src/ingestion_service/semantic_source_replay.py.

Fonction verify_original_to_normalized(source_code, dataset_code, original_http_bytes, normalized_ndjson) :
- Utilise un **code de relecture séparé** des parseurs initiaux des connecteurs IBGE et WDI et des pipelines d'ingestion. Réutilise uniquement le modèle canonique IndicatorObservation pour l'encodage de la ligne attendue ; ne rappelle PAS parse_ibge_national_population ni parse_wdi_brazil_2022_population.
- Décode JSON en UTF-8 strict, rejette les noms de clé dupliqués, NaN/Infinity et formes ambiguës, refuse tailles excessives et sources non allowlistées. Un seul enregistrement NDJSON prévu : tout résultat additionnel/inattendu est refusé.
- **IBGE Censo 2022** : exige agrégat implicitement fixé au dataset CENSO2022_4714, variable 93, personne(s), libellé population, une classification nationale totale, une localité 1 au niveau N1 et la seule période 2022, entier textuel non manquant dans les limites du pilote. Construit indépendamment l'identité du recensement national OBSERVED, indicateur, date, unité, pays, sourceURL, rawSha256 et httpBodySha256, flags méthodologiques et droits REVIEW_REQUIRED.
- **WDI BRA 2022** : exige exactement une page WDI source 2, une seule observation de BRA/BR, indicateur SP.POP.TOTL, année 2022, valeur numérique entière dans bornes validées, pas de valeur future/supprimée, statut fournisseur, horodatage de mise à jour de DATASET séparé de la révision OBSERVATION, unité WDI inchangée et format de précision contrôlé. Construit indépendamment le statut MIDYEAR_ESTIMATE, le concept de population de mi-année, l'URL de méthodologie, flags de dépendance non vérifiée, droits REVIEW_REQUIRED et métadonnées officielles.
- Compare **TOUS les champs** de la ligne NDJSON originale (pas uniquement le chiffre ou le nombre de lignes) à une observation attendue reconstruite à partir de la source HTTP. Valeur, pays, dates, statut, indicateur, unité, source/URL, métadonnées d'origine, qualité, caveats, droits : la moindre différence est refusée avec un message GENERIQUE sans numéro de population dans les logs.
- Retourne uniquement SemanticReplayProof(verifier_version, raw_sha256, normalized_sha256, semantic_projection_sha256, observation_count). Ne retourne jamais la valeur dans une sortie de diagnostic. La version de méthode est WORLD_VISION_SEMANTIC_POPULATION_REPLAY_V1.

Ce module ne découvre pas de nouvelles sources ni de pays. D'autres institutions et formats demanderont chacun un contrat explicite, des références de méthode et une revue, sinon FAIL-CLOSED.

### 2.2 Garde renforcé DANS le véritable témoin Bronze

Fichier modifié : services/ingestion-service/src/ingestion_service/private_bronze_witness.py.

La méthode PrivateBronzeWitness.certify_research_only :
1. revérifie le stockage Bronze, les octets originaux et la normalisation ;
2. revérifie AcquisitionJournal et l'événement SUCCESS exact ;
3. **appelle désormais le vérificateur sémantique indépendant raw→normalized** ;
4. confirme concordance du raw SHA, du nombre d'items et de la projection SHA ;
5. **ensuite seulement** signe une attestation de vérification privée à durée courte.

Un faux NDJSON formé au premier instant, même totalement cohérent avec tous les SHA et le journal, ne reçoit plus l'attestation de recherche. Un changement de WDI MIDYEAR_ESTIMATE en OBSERVED et un changement de population IBGE OBSERVED en MIDYEAR_ESTIMATE sont également refusés, comme les changements de metadata/flags.

Le signataire travaille encore UNIQUEMENT en PRIVATE_RESEARCH_VALIDATION pour les deux datasets sans licence commerciale confirmée. Le Java TimeseriesReceiver continue à refuser l'utilisation de ces attestations pour PUBLIC_API_INGEST. Aucun bypass du blocage IBGE/WDI #85 ou du registre de droits #88.

## 3. Tests adversariaux réels en stockage local synthétique

Fichier tests/test_semantic_source_replay.py :
- Deux sources originales synthétiques IBGE/WDI valides → vérification sémantique complète de chaque champ et des hashes.
- **14 faux enregistrements initialement archivés** (2 sources × 7 corruptions : valeur, date, pays, indicateur, metadata juridique, flags, statut). Les faux enregistrements sont volontairement capturés dans un NOUVEAU QuarantinedJsonEvidenceStore, avec manifest/hash correctement recalculés et un événement AcquisitionJournal SUCCESS certifié. L'ancien contrôle Bronze réussit ; le reparseur indépendant refuse : c'est le scénario de sécurité recherché.
- Source originale à l'année ou au pays incorrect refusée ; source dataset inconnue refusée ; NDJSON plusieurs lignes refusé ; JSON source avec duplicata de clé refusé.
- Tous les tests de témoin Bronze parent #91 sont conservés : falsification byte brute/manifeste/normalisée/outcome, STARTED/FAILED, preuve originale déplacée/restaurée, contrats ED25519 Python/Java, etc.
- Aucun chiffre institutionnel réel n'est commité, aucun accès réseau ni clé privée de production dans les tests.
- CI .github/workflows/whv-v2-data1c-independent-semantic-replay.yml : Python3.12, test-only cryptography, tests ciblés et toutes régressions sauf live WDI séparé. Première CI sur SHA 2b572bf3305880f5166ab45e6a8e5df62b0610c5 **SUCCESS : 46 tests ciblés et 210 tests ingestion** : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44716084775.
- CI live distincte .github/workflows/whv-v2-data1c-semantic-live-private.yml : **exactement deux GETs officiels** IBGE Censo population BRA/2022 et World Bank WDI SP.POP.TOTL BRA/2022, stockage temp privé, reparse indépendant, deux signatures recherches privées, aucune valeur/log/artefact ni publication Timeseries/Atlas. Vérifier sa réussite sur le SHA exact de la PR avant toute affirmation d'acceptation réelle.

## 4. Limites honnêtes, même avec une CI verte

**Cette vérification est une interprétation scientifique explicitement codée, non une garantie absolue de vérité humaine ou fournisseur.** Le parser de référence peut lui-même comporter une erreur; les méthodes recensement IBGE et estimation WDI ne sont pas automatiquement comparables ni indépendantes. Exiger des tests de référence de champs, de parseur et de version à chaque évolution institutionnelle.

Le verifier_version est disponible dans le rapport SemanticReplayProof, mais **n'est pas encore intégré au payload signé envoyé au Java**. La prochaine tranche A2B2b devra lier explicitement version et hash de SPEC/code de référence à l'attestation Ed25519, ainsi que les décisions humaines d'évolution. Aucune rétro-approbation automatique des anciennes données par changement de parseur.

Sécurité production toujours manquante : signataire PUBLIC isolé, décision de licence applicable à l'usage commercial, gouvernance reviewers/countersigners, HSM/KMS, mTLS/OIDC, révocation de clés sur lecture, rôles DB et vraie gestion de stockage chiffré/WORM/backup-restores. La permission PUBLIC_API_INGEST ne signifie pas droit de vendre, redistribuer l'API ou dériver des produits commerciaux. Le frontend ancien peut encore avoir des valeurs historiques non attestées qui seront masquées par V5 en cas de déploiement ; impact à évaluer avant merge.

Les données officielles restent privées, la licence exacte IBGE 4714/93 reste NEEDS_PROVIDER_CLARIFICATION. Aucune mise en production v2 ou changement de Vercel.

## 5. Suites obligatoires / point de reprise inter-chats

1. Contrôler le HEAD et les deux workflows A2B2a (offline + live) de la PR candidate ; conserver leurs SHA/URL sur GitHub. Si le code change après réussite, relancer l'acceptance.
2. **DATA-1C-A2B2b** : signer l'identifiant et l'empreinte de version du **vérificateur sémantique** par le témoin, vérifier côté Java, audit des changements de parser, tests croisés et faux parseur, et lier à RightsDecision/bronze event de façon traçable.
3. **DATA-1C-A2C** : opérateur habilité de publication pour un dataset VRAIMENT autorisé (NE PAS utiliser IBGE/WDI non revus), gérer clés publiques/signatures/rotation/révocation, identités workload mTLS/OIDC, rôles PostgreSQL séparés, audit et contrôle des droits par opération.
4. **DATA-1C-B2** : dates révisions fournisseur vs simple date de collecte, version historique latest et méthode de comparabilité.
5. **DATA-1C-C** : stockage durable privé/chiffré PostgreSQL + Bronze + journal + reçus + droits, backup offsite + restauration avec RPO/RTO testés.
6. **DATA-1C-D** : Atlas/Gateway réels avec provenance, unités, dates, territoires et statut de licence, institutions nationales et internationales, pilote Gabon INSTAT/BEAC et extension aux autres pays. Media/GDELT/voix sur leurs branches respectives.

Documentation parent : docs/continuity/WORLD_VISION_DATA1C_A2B1_BRONZE_WITNESS_2026-11-20.md et HANDOFF_CORE_F12B_2026-11-19.md.
NE PAS dévier sur l'esthétique du globe ou de l'accueil iPhone pendant la priorité DATA sans décision explicite. Toujours commenter les issues #92/#89/#82 et créer des PR DRAFT empilées plutôt que fusionner sans revue.
