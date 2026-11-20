# WORLD-VISION — PRODUCT-P2C3 : première source nationale réelle (Insee), en QUARANTAINE de droits
Date : 20 novembre 2026. Dépôt `OBIANG5/World-Health-Vision`.
Branche `product/v2-p2c3-insee-melodi-private-evidence-2026-11-20`, PR #108 DRAFT sur PR #106.
Issue #107 : https://github.com/OBIANG5/World-Health-Vision/issues/107.
Racine canonique : `worldhealth-vision-v2/`. Toute publication sur v2, main, Vercel, une API de données ou un hébergement payant reste strictement hors périmètre.

## 1. Pourquoi cette tranche est prioritaire
PRODUCT-P2C2 vient de réussir le circuit complet d'une observation **SYNTHÉTIQUE** signée, via les six services et le vrai Atlas sur iPhone, puis révocation depuis PostgreSQL avec disparition dans le navigateur. Ce n'est PAS une licence fournisseur. La prochaine valeur utilisateur est une première série institutionnelle, traçable et légalement réutilisable, plutôt qu'une nouvelle collection de moteurs.

Le pilote porte sur Insee/Melodi, parce que les modalités d'accès à une API officielle et un jeu de référence sont documentées. La France n'est pas « couverte » dans World-Vision tant qu'aucune observation n'a été collectée, revue et publiable. Le Gabon (INSTAT/BEAC) et les autres organismes locaux des pays du monde restent une extension prioritaire sous licences vérifiées. Ne jamais assimiler les 217 pays/territoires géographiques aux pays disposant de données live.

## 2. Références institutionnelles et limites
1. API Insee officielle, accès public, contrôle de quota annoncé : https://www.insee.fr/fr/information/1302169?question=comment-utiliser-l-api-melodi — URL de base `https://api.insee.fr/melodi` et limite annoncée de 30 requêtes/minute sans souscription.
2. Catalogue Insee et Licence Ouverte annoncée pour son offre ouverte : https://www.insee.fr/fr/information/8184173 ; régime général https://www.data.gouv.fr/pages/legal/licences/etalab-2-0 . **Une licence générale ne suffit pas** à déduire que toute opération ou fichier de données peut être publié par World-Vision.
3. Documentation de l'outil InseeFrLab (logiciel R de l'Insee) : https://inseefrlab.github.io/melodi/reference/get_data.html ; exemple `DS_POPULATIONS_REFERENCE?GEO=FRANCE-F` avec dimensions annuelles et trois mesures `PTOT` (population totale), `PMUN` (population municipale), `PCAP` (comptée à part). La valeur dans la documentation est un **exemple historique 2023**, PAS un relevé de l'API en novembre 2026.
4. Dictionnaire de codes officiel : https://inseefrlab.github.io/melodi/reference/get_range.html ; métadonnées du dataset https://inseefrlab.github.io/melodi/reference/get_metadata.html .
5. Répertoire API Open data data.gouv : https://www.data.gouv.fr/dataservices/api-melodi .

La sémantique `GEO=FRANCE-F` ne doit pas être automatiquement transformée en ISO3 `FRA` sans revue du territoire exact (France métropolitaine, France entière, DROM, limites géographiques, etc.). Une population totale `PTOT` n'est pas `PMUN`. Une population légale de référence ne doit pas être comparée comme équivalente à une estimation WDI d'une autre méthodologie.

## 3. Code livré, PROVENANCE et absence de publication
**Fichier existant ingestion_service** :
`services/ingestion-service/src/ingestion_service/connectors/insee_melodi_reference_client.py`.
- Autorise UNIQUEMENT `GET https://api.insee.fr/melodi/data/DS_POPULATIONS_REFERENCE?GEO=FRANCE-F&POPREF_MEASURE=PTOT&maxResult=20`.
- `allow_live=False` par défaut ; une exécution réseau nécessite opt-in explicite.
- URL exacte et jeu de paramètres vérifiés : pas de domaine tiers, protocole non HTTPS, redirect, changement de territoire, extra query, plage libre ou clé d'API ; absence de retry sur HTTP 429 et pas de collecte globale.
- JSON UTF-8 et corps <=500 kB, refus doublons de clés / NaN, structure `observations[].dimensions` et `measures.OBS_VALUE_NIVEAU.value` strictement typées, période annuelle et PTOT sans ambiguïté, valeur entière. Refuse les statuts/confidentialités inconnus, valeurs supprimées, doublons période, pagination incomprise ou plus de 20 lignes.
- `countryIso3Candidate=FRA` seulement et `countryMappingStatus=REVIEW_REQUIRED`. Les unités, méthodes, date source/collecte, statut observé/estimé et conditions de réutilisation restent à valider humainement.
- Ne crée ni signature Ed25519 ni droit `PUBLIC_API_INGEST` ; aucun appel `TimeseriesClient`.

**Réutilisation d'une brique existante** : `QuarantinedJsonEvidenceStore` dans `source_evidence_store.py`. Les octets HTTP originaux sont archivés de manière immuable par SHA256 avec NDJSON normalisé vérifié, marqueurs explicites `sourceStatus=PRIVATE_RESEARCH_VALIDATION`, `BRONZE_ONLY_UNREVIEWED`, `licenseReviewStatus=REVIEW_REQUIRED`, `timeseriesPublication=NOT_ATTEMPTED`, `publicationRights=NOT_GRANTED`, aucune autorisation pour une API publique. La répétition de mêmes octets est idempotente ; source mixte et modification contradictoire refusées.

**Contrats et tests** :
`services/ingestion-service/tests/test_insee_melodi_reference_research.py`.
Tests de refus géographie/métrique erronée, PMUN vs PTOT, valeur malformée/NaN, JSON non conforme, pagination, source URL falsifiée, HTTP 429/302/503, confidentialité, preuve immuable et absence de chemin de publication.
`infra/tests/p2c3_insee_readonly_probe.py` : un GET source officielle seulement en action opt-in privée, archive puis vérification en `$RUNNER_TEMP` et suppression dans `finally`. N'affiche aucun chiffre institutionnel ni n'upload raw/normalized au dépôt public.
`.github/workflows/whv-v2-p2c3-insee-private-source-audit.yml` : tests offline à chaque push + ancien tests droits/Bronze. Job réseau réel uniquement en `workflow_dispatch` avec `provider_network_probe=true`. Aucun déploiement Vercel.

## 4. GitHub Actions — VERIFIÉ
Code SHA `3b0d3e8a70605ceb551a625494fc612d76a7fe42`.
Run https://github.com/OBIANG5/World-Health-Vision/actions/runs/44772963402 : SUCCESS.
- `offline-contract-and-bronze` SUCCESS : **44 tests ciblés Insee** + **27 tests historiques rights/Bronze** = **71 PASS**.
- `optional-real-provider-read` **SKIPPED VOLONTAIREMENT**. Aucun GET réel n'a été effectué vers `api.insee.fr` par ce workflow. Une source réelle n'est donc pas encore validée dans ce dépôt et aucune valeur actuelle n'est connue.
- Premier run `44772621044` avait 35 PASS et une erreur de structure d'une fixture (liste de listes). Corrigé précisément dans le commit `776bc0b1` ; les suites suivantes ont passé. Patch sécurité URL+doublons JSON commit `3b0d3e8a`.

Aucun nombre « officiel actualisé » ne doit être déduit des fixtures documentaires historiques. Tout chiffre public est suspendu tant que les critères ci-dessous ne sont pas remplis.

## 5. Comment lancer UN seul audit fournisseur plus tard
Sur GitHub Actions, choisir le workflow `World-Vision P2C3 - Insee Melodi source evidence private audit`, bouton « Run workflow », branche `product/v2-p2c3-insee-melodi-private-evidence-2026-11-20`, paramètre `provider_network_probe=true`. Le job teste UNE requête officielle et contrôle les octets, mais les supprime ensuite du runner. Il ne publie, ne signe aucun droit réel et n'upload aucun provider data.

Si le shape réel diffère des exemples : **FAIL CLOSED**. Corriger le parseur sur la base de la réponse réelle inspectée en privé, compléter les tests hors réseau, et refaire le run. Ne jamais élargir la capture à tout le catalogue pour « réussir » par contournement.

## 6. GO/NO-GO avant la première VRAIE série publiée
1. GET officiel de l'exact dataset et de son dictionnaire de variables. Revue de structure dimensions, éventuelle pagination, statut `OBS_STATUS`, `CONF_STATUS`, unité, période, géographie et modifications. Archiver les octets + dates/ETag de façon **durable privée et sauvegardée**, en préservant les droits de diffusion.
2. Dossier de licence précis, date d'accès, source officielle, attribution exacte, opérations web/public API, redistribution, réemploi commercial, limites spécifiques du jeu et cas de révision ; confirmer avec un reviewer/countersigner humain avant toute signature.
3. Fixer version et SHA d'un parseur revu (PR #95), politique de clés révoquées (#94), témoin indépendant qui reprend les octets originaux et prouve raw→normalized ; ne jamais recycler la signature SYNTHETIC de P2C2 pour des données institutionnelles.
4. Adapter le modèle de domaine une fois la mesure et le périmètre approuvés. Publier d'abord UNE observation autorisée en staging privé, avec source, méthode, date, millésime, unités et droits. Vérifier révocation au navigateur et comparaison scientifique honnête.
5. Sauvegardes/restore DB et Bronze, journaux d'accès, sécurité fournisseur/quotas, coûts, URL HTTPS protégée/noindex iPhone/Safari/Chrome, et rollback. **Décision séparée avant tout Vercel public ou ressource payante.**
6. Après France, ouvrir par sources institutionnelles locales validées le Gabon et les autres pays, sans faux label « monde entier alimenté ».

## 7. Handoff inter-chat
Lire ce document, PR #108 et sa CI finale, issue #107, PR #106 P2C2 et le dossier P2C2, HANDOFF_CORE_F12B, PR #95/issue #94, issue #68 Vercel, puis PR #102/#101/#100/#99/#97 pour la dépendance. Reprendre d'abord l'audit réel de la source puis droits/méthodes avant le premier chiffre officiel publié. Respecter les onze Visions, médias/GDELT, Money/Watch, géographie et sources locales par pays ; aucun site international opérationnel encore déclaré.
