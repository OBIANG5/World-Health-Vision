# WORLD-VISION — PASSATION DATA-1B2A : métadonnées officielles et gouvernance des droits

**19 novembre 2026. Exclusivement logiciel World-Vision V2.** Dossier canonique : OBIANG5/World-Health-Vision/worldhealth-vision-v2/. La PR #73 est candidate DRAFT sur branche data/v2-ibge-metadata-rights-gates-2026-11-19, basée sur PR #70 DATA-1B1, elle-même basée sur PR #69 DATA-1A et chaîne Core #59. **Pas de fusion v2, pas de déploiement public, pas de dépense, pas de travail sur médias/voix/vidéos ou V0/V1.**

## 0 — REPRISE OBLIGATOIRE POUR UN AUTRE CHAT

Lire les sources et dépendances dans l'ordre :
1. Cette note et https://github.com/OBIANG5/World-Health-Vision/pull/73, dernière branche candidate.
2. PR #70 https://github.com/OBIANG5/World-Health-Vision/pull/70 et docs/continuity/WORLD_VISION_DATA1B1_BYTE_EVIDENCE_2026-11-19.md : octets HTTP originaux, hash exact + hash canonique, replay, corruption, révisions et restauration.
3. PR #69 : contrat source réelle IBGE (BRA/N1/2022/table 4714/variable 93), collecte éphémère réussie sans publication.
4. docs/continuity/HANDOFF_CORE_F12B_2026-11-19.md et les deux documents maîtres docs/product/STRATEGIE_INTERNATIONALE_WORLD_VISION_MASTER_2026-11-19.md et REGISTRE_PRODUITS_SOURCES_REVENUS_PRIORITES_2026-11-19.md.
5. Front indépendant PR #67 UX-1A → #64 UX-0 → #35 fondation. Blocage Vercel public issue #68 ; UX-1B issue #66 ; performance et fiabilité internationale issue #63 et #56. Branches médias, production vidéo, voix EXCLUES du présent chantier.

## 1 — PROBLÈME RÉSOLU PAR DATA-1B2A

Les chiffres officiels ne peuvent être crédibles à l'échelle mondiale sans identité du fournisseur, version de la table, méthode, unité, géographie, période, référence, date de capture, date de publication séparée, conditions d'utilisation et statut de vérification. Avoir une API accessible n'est pas une permission de publication commerciale.

DATA-1B2A a commencé l'acquisition **officielle de métadonnées**, et non l'extension prématurée à 217 pays :
- Hôte officiel fixe https://servicodados.ibge.gov.br.
- Ressource métadonnées : https://servicodados.ibge.gov.br/api/v3/agregados/4714/metadados.
- Ressource périodes : https://servicodados.ibge.gov.br/api/v3/agregados/4714/periodos.
- Ressource population 2022 utilisée par DATA-1A : GET /api/v3/agregados/4714/periodos/2022/variaveis/93?localidades=N1%5Ball%5D. Cette valeur n'a PAS été diffusée dans Atlas.

Une sonde live GitHub Actions du 19/11/2026 a constaté :
- /metadados renvoie un objet JSON avec clés URL, assunto, classificacoes, id, nivelTerritorial, nome, periodicidade, pesquisa, variaveis. Id = 4714 ; 3 variables ; chacune contient id, nome, sumarizacao, unidade ; niveau territorial avec Administrativo, Especial et IBGE.
- **Le champ periodos n'existe pas dans /metadados** : les périodes se récupèrent dans une requête officielle séparée.
- /periodos renvoie une liste JSON (1 élément observé) avec id, literals, modificacao. Le connecteur exige la période 2022 mais conserve 'modificacao' comme donnée du fournisseur dont la sémantique exacte n'est PAS encore validée. Ne jamais la convertir automatiquement en date de première publication ou révision de l'observation.
- SHA256 exact du corps HTTP metadata : 84f6da58f6b881c4e5b417913605f1a7e3b4b8e70bf889e07e8a4e42a2eee715.
- SHA256 exact du corps HTTP periods : 5898bf878122923a311be4c7fdda4990b93cac17853d398a31305d1b4cd6e754.
- Run de découverte API / metadata / périodes : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44616040218.
- Run REAL du nouveau pipeline dans un espace privé temporaire : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44617042183, SUCCESS sur SHA 82723d41892594fbb5ffb49e71cbce035deeb248.
- Run de validation code et tests synthétiques / régressions : https://github.com/OBIANG5/World-Health-Vision/actions/runs/44617042088, SUCCESS sur le MÊME SHA. **Tout commit documentaire ultérieur change le SHA : contrôler à nouveau les deux workflows sur le SHA final, jamais citer une ancienne CI à sa place.**

Les preuves cryptographiques sont des empreintes locales de l'acquisition ; aucune n'est une signature officielle de l'IBGE ni une preuve de licence. L'essai de CI supprime les données dès la fin et ne constitue pas un stockage de production ou staging durable.

## 2 — CODE PRODUIT ET TESTS

1. services/ingestion-service/src/ingestion_service/connectors/ibge_census_metadata_client.py
   - Deux chemins exacts, HTTPS hôte fixe, pas de redirect, pas de compression inattendue, JSON obligatoire, timeout borné et limite 1 Mo.
   - Contrat : table 4714, population variable 93, unité personnes, niveau national N1, recherche identifiée, référence 2022 sans doublons ; erreur explicite si changement.
   - Octets HTTP originaux et hash distinct du hash JSON canonique. Champs sans date réelle restent null.
2. services/ingestion-service/src/ingestion_service/pipelines/ibge_census_metadata.py
   - Deux jeux d'archives immuables privées indépendants : CENSO2022_4714_METADATA et CENSO2022_4714_PERIODS, stockés via l'archive DATA-1B1.
   - Chaque archive possède original.http.json + observations.ndjson + manifest.json, hash exact et version, fichiers de quarantaine ; pas de Timeseries.
   - La valeur 'modificacao' reste providerModificationFieldUninterpreted / SEMANTICS_UNVERIFIED, sourcePublishedAt=null et sourceRevisionAt=null.
3. services/ingestion-service/src/ingestion_service/source_rights_review.py
   - Dossier typed institution, dataset, juridiction, opération, preuves, date/expiration, relecteur humain, attribution et conditions.
   - Preuves classées GENERAL_CONTEXT_ONLY / DATASET_SPECIFIC_TERMS / PROVIDER_WRITTEN_CONFIRMATION / DIFFERENT_PRODUCT_NOT_APPLICABLE.
   - Aucune approbation sur simple politique générale. Revue avec status APPROVED_WITH_CONDITIONS exigerait dossier spécifique, relecteur, expiration, actions autorisées et attribution. **Même une revue approuvée n'est PAS un jeton de déploiement Gateway ; revue juridique et autorisation prod sécurisée restent séparées.**
   - Pour la table IBGE 4714/93 : statut NEEDS_PROVIDER_CLARIFICATION, conseil de republication commerciale BLOCKED.
4. services/ingestion-service/src/ingestion_service/runtime.py et cli.py
   - Commande opérateur : python -m ingestion_service.cli ibge capture-census-2022-metadata ; production de deux archives privées selon WHV_INGEST_BRONZE_ROOT.
   - Commande opérateur : python -m ingestion_service.cli ibge review-census-2022-rights ; synthèse de blocage et sources. Aucune nouvelle route HTTP publique.
5. services/ingestion-service/tests/test_ibge_metadata_rights.py
   - Tests SYNTHÉTIQUES : id, unité, variable, géographie, année, doublons, format HTML, statut HTTP 302/503, compression, version/modification, replay, droits généraux, expiration, mauvais pays, usage non autorisé, preuve sans source spécifique.
   - Workflow .github/workflows/whv-v2-ibge-metadata-rights-acceptance.yml exécute Python, nouveaux tests, anciens tests IBGE, toutes les régressions ingestion sauf test World Bank explicitement live, et contrôle que le conseil commercial est BLOCKED.
   - Workflow .github/workflows/whv-v2-ibge-metadata-live-evidence.yml : deux GET officiels, archivage RAW temporaire et vérification des hashes, statut de quarantaine, aucune figure officielle dans log, suppression totale et aucun artifact.
   - Workflow de découverte .github/workflows/whv-v2-ibge-metadata-live-schema.yml : inspection des clés seulement.

## 3 — REVUE DES DROITS : CE QUI EST ÉTABLI ET CE QUI NE L'EST PAS

Éléments publics identifiés au 19 novembre 2026 :
- Portail IBGE 'Dados Abertos' : https://www.ibge.gov.br/acesso-informacao/dados-abertos.html ; décrit la politique générale et référence des plans.
- Plan IBGE 2024-2025 (DOCUMENT HISTORIQUE, PAS L'AUTORISATION 2026) : https://www.ibge.gov.br/np_download/novoportal/documentos_institucionais/Plano_de_Dados_Abertos_IBGE_2024_2025.pdf. Il définit le concept de licence ouverte, mais ne prouve pas un contrat de redistribution commerciale exact pour table 4714 / variable 93.
- Consultation publique en cours du 04/11/2026 au 04/12/2026 pour les priorités du prochain plan IBGE : https://brasilparticipativo.presidencia.gov.br/processes/IBGE-Prioridade-de-divulgacao-nos-temas-das-pesquisas-e-resultados-2026 . Ce n'est PAS un droit de republication.
- API agrégats v3 : https://servicodados.ibge.gov.br/api/docs/agregados?versao=3 ; la disponibilité technique ne constitue pas une licence de commerce.
- Censo 2022, contexte et politique de révisions : https://www.ibge.gov.br/estatisticas/sociais/populacao/2098-np-censo-demografico/22827-censo-demografico-2022.html.
- Un contrat IBGE cartographique BC250 de 2017 peut imposer des conditions spéciales ; **ne pas en déduire les droits du recensement 2022**, car il concerne un produit différent.

**Décision :** aucun droit public/commercial/API redistribution accordé ou inféré. Il faut trouver et sauvegarder les textes propres au jeu de données SIDRA 4714/93, identité de l'émetteur, clauses précises, droits par action, attribution, dates, version, preuve et décision datée. Si manque ou ambiguïté : demander confirmation institutionnelle / avis juridique, garder BRONZE_ONLY_UNREVIEWED et LICENSE REVIEW_REQUIRED.

## 4 — RISQUES ET LIMITES NON ENCORE RÉSOLUS

- CI éphémère ≠ stockage durable. Les volumes permanents privés, contrôles de montage, chiffrement, sauvegarde hors-site, restauration réelle, RBAC/JWT, coûts d'hébergement, supervision, RPO/RTO ne sont pas encore validés. Ne pas créer de VPS ni engager des frais sans accord.
- Deux appels metadata / periods distincts ne forment pas une transaction multi-ressource : si le second échoue, un fichier local du premier peut rester ; jamais exposé publiquement. DATA-1B2B doit définir reçu composite et cohérence.
- Le hash du corps ne trace pas chaque consultation dans le temps. Même payload hier et aujourd'hui = une seule révision ; il faut un journal append-only des tentatives (firstSeen, lastSeen, HTTP, éventuel ETag/Last-Modified), sans modifier le manifeste immuable original. Prévoir anti-doublons, rejouabilité et crash handling.
- Le sens de 'modificacao', les dates de publication de l'IBGE et les règles de correction sont des questions ouvertes. Ne pas inventer un sourcePublishedAt.
- Règles de droits : le modèle n'est pas un service d'identité, ne remplace pas une approbation institutionnelle signée et ne peut être alimenté automatiquement par un texte web non fiable.
- Les données recensées 2022 et estimations 2026 ne sont pas directement comparables ; un protocole comparabilité WDI SP.POP.TOTL doit comparer les méthodes, champs, années, statuts et révisions avant toute différence chiffrée.
- 217 territoires et 22 sources dans le registre UI ne signifient pas 217 pays ingérés ou licences acquises. Front Vercel actuel ne possède pas automatiquement la PR UI #67.

## 5 — PROCHAINS CHANTIERS EXACTS — NE RIEN PERDRE

DATA-1B2B (issue globale #71, sous-lot suivant):
A. Journal d'acquisition append-only et contrôles d'erreur (horodatage UTC, statut de fetch, réponse, ETag/Last-Modified seulement si réellement présents, hash + signature du journal selon contrôle, journaux sans PII).
B. Reçu composite reliant observation BRA/N1/2022, metadata et périodes, versions distinctes, champs non assimilés, état de quarantaine.
C. Droits exacts dataset/variable : texte institutionnel, date, usages, durée, attribution, archivage, redistribution, quota et décision humaine auditable. Publication toujours OFF.
D. Étudier 'modificacao' et les corrections officielles ; ne pas en faire une date de publication sans preuve.
E. Tests de sauvegarde/restauration d'une véritable archive sur support persistant privé dans staging sécurisé **après validation du budget**. Prévoir redémarrage, concurrence multi-process, détection altération et test d'absence de fuite.

DATA-1B3 : protocole ComparabilityAssessment population résidente recensée IBGE 2022 vs WDI SP.POP.TOTL, avec unité, type OBSERVED/ESTIMATED, champ géographique, période, révision et juridiction ; refus de comparaison trompeuse.

DATA-1C : seulement après GO juridique + technique, transaction idempotente Timeseries, Gateway à permissions explicites, Atlas pays BRA provenance/date/qualité/indisponibilité, tests vrais mobiles et déploiement contrôlé avec rollback ; pilote INSTAT Gabon ensuite, puis sources nationales/régionales pour les autres pays et APIs sous droits.

Suite produit stratégique : Watch persistant (WatchRule, Observation, Evaluation, Outbox, DeliveryReceipt), Money FX/transfert à frais nets, Transport, Price/Panier, Trading/BRVM sous licences, Global Radar/GDELT comme signaux et jamais statistiques certifiées ; média et voix dans branches entièrement séparées.

## 6 — CONDITION DE QUALITÉ POUR UNE NOUVELLE PR / NOUVEAU CHAT

- Relire ce document, branches et SHA HEAD des PR #73/#70/#69, CI sur le dernier SHA, répertoires sources + tests.
- Écrire et vérifier code + tests adversariaux, CI scientifique et acquisitions réelles séparées, documenter les échecs et corrections, aucun faux chiffre, aucune fausse licence.
- Pas de merge automatique, pas de production Vercel ou backend sans tests pertinents, droits, sécurité, sauvegardes et budget.
- Préserver TOUT le backlog international issue #63, UX #66, publication issue #68, documents stratégie/revenus ; ne pas consacrer des jours à sur-optimiser un seul composant sans valeur utilisateur.
- Conserver le globe original, la géographie internationale et le futur registre des sources comme navigation utile vers des preuves, pas comme écran décoratif.

**World-Vision = une plateforme internationale de vérification, données institutionnelles, comparaisons, historiques, surveillance et produits utiles ; pas une liste de boutons 'bientôt'.**
