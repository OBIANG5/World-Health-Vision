# World-Vision logiciel V2 — Global Radar R2A : acquisition d'archives Events GDELT réelles
**21 novembre 2026. CONTINUITÉ INTER-CHATS OBLIGATOIRE.**
**PR #136 en brouillon, PAS de fusion, PAS de déploiement, PAS de publication ni ingestion Timeseries.**

## 0. Décision et chaîne de reprise exacte
- **Directive stratégique** : [#133](https://github.com/OBIANG5/World-Health-Vision/issues/133) — les moteurs sources/provenance/GDELT et la comparaison locale/nationale/internationale alimentent Atlas, Média, Trading-Vision, BRVM, Watch et pays. **Ne pas prolonger en priorité les formulaires du Trading-Vision**. Les PR Trading #120→#121→#124→#125→#127→#129 sont conservées en brouillons distincts.
- **Base produit canonique** : [PR Atlas #115](https://github.com/OBIANG5/World-Health-Vision/pull/115) `product/v2-p2c3c2-signed-scoped-public-read-2026-11-21` ; [PR Radar R1 #134](https://github.com/OBIANG5/World-Health-Vision/pull/134) branche `product/v2-global-radar-gdelt-source-discovery-r1-2026-11-21`, vérifiée en CI avant R2A. **R1 côté navigateur est seulement une recherche à la demande de titres/liens via GDELT DOC 2.0 et un comparateur de métadonnées**, non un service permanent. Sa requête externe a reçu HTTP 429 à plusieurs reprises sur GitHub.
- **R2A = [PR #136](https://github.com/OBIANG5/World-Health-Vision/pull/136)**, branche `product/v2-global-radar-gdelt-static-events-r2a-2026-11-21`, empilée EXACTEMENT sur R1 #134. Aucun fichier du média ni du Trading-Vision n'est modifié.
- Handoff parent : [R1](https://github.com/OBIANG5/World-Health-Vision/blob/product/v2-global-radar-gdelt-source-discovery-r1-2026-11-21/worldhealth-vision-v2/docs/continuity/WORLD_VISION_GLOBAL_RADAR_R1_GDELT_HANDOFF_2026-11-21.md). Issue d'intégration suivante : [#135](https://github.com/OBIANG5/World-Health-Vision/issues/135) + [#76](https://github.com/OBIANG5/World-Health-Vision/issues/76) comparaison de sources et [#96](https://github.com/OBIANG5/World-Health-Vision/issues/96) véritable staging.

## 1. Pourquoi changer de transport GDELT
Essais HTTP réels (GitHub Actions runner 21/11/2026) :
| Transport | Fait vérifié | Signification |
| --- | --- | --- |
| GDELT DOC 2.0 `api.gdeltproject.org/api/v2/doc/doc` | `HTTP 429`, plusieurs essais | L'API de recherche refuse cet environnement/rate-limit; ne pas la présenter comme un flux live fiable |
| GDELT 2.0 `https://data.gdeltproject.org/gdeltv2/lastupdate.txt` | `HTTP 200` et **3 lignes valides** | Le manifeste statique des fichiers bruts Events, Mentions et GKG reste accessible |
| Archive 15 minutes `...YYYYMMDDHHMMSS.export.CSV.zip` via HTTPS | **acquisition réelle réussie à la CI #44943847745** | Intégrité MD5 publiée par le manifeste vérifiée, ZIP et TSV réellement ouverts, provenance/quasi-temps suivis |

Source primaire [GDELT data](https://gdeltproject.org/data.html). **Attention** : ces produits sont des EXTRACTIONS ET CODES automatiques de mentions médiatiques, **pas** des preuves d'événements ni une autorisation de redistribuer commercialement des articles. Les flux `export` ≠ `mentions` ≠ `gkg`, ne pas confondre leurs schémas/volumes. L'essai n'a téléchargé que la petite archive **Events**. Ne pas introduire les fichiers GKG (plus volumineux) sans ROI et contrat explicites.

## 2. Preuve EMPIRIQUE d'une archive réelle — sans données inventées
**[GitHub Actions #44943847745](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44943847745)** : job `gdelt-events-safety-contract` `136966723282` **success**; job `gdelt-official-events-one-shot` `136966770412` **success** (cette réussite concerne la collecte et l'analyse de la structure, pas la vérité des données).
Résultat réel du probe, `retrievedUtc=2026-11-21T19:59:51.726215Z` :
- `slotUtc=2026-11-21T20:00:00Z` : horodatage **GDELT**, plusieurs secondes dans le futur par rapport au fetch, donc **ne jamais le présenter comme date de publication d'un article ni horloge prouvée**.
- `totalRows=619`, `candidateRows=619`.
- `distinctSafeHttpsArticleLinks=120` liens **candidats** différents, **AUCUN article lu/validé**.
- `duplicateSameArticleLinks=476` : plusieurs événements codés pointent vers une même URL, donc ne pas les compter comme 476 publications indépendantes.
- `unsafeOrMissingLinks=23` (p. ex. HTTP, URL invalide, lien non admissible); un lien HTTP n'est PAS upgradé aveuglément en HTTPS hors du domaine officiel GDELT.
- `providerSlotDiscrepancies=0` pour les 619 lignes.
- `sampleCandidateCount=5`, en mémoire uniquement; **aucune URL, titre ni contenu tiers imprimé** dans les logs.
- `providerMd5Verified=true` (empreinte MANIFESTE FOURNISSEUR, pas signature ni vérification journalistique).
- SHA256 du ZIP réel : `01a7494468fd55c7e01cd32d2157521227d68124012500496554fe0ce5bc9f23`.
- SHA256 du manifeste brut réel : `93ad46beed0c1e6f065bcb26c742183e4a6f9a7cd023d6a225315432947643e3`.
- `verifiedArticleContent=false`, `verifiedEvents=0`, `licensedForPublicRedistribution=false`, `publication=none`.

**La CI de cette preuve portait sur le SHA `0e1ccd370da2230adfda872d28881e885d30ba2b`.** La prochaine mise à jour documentaire produit un commit plus récent : les tests de ce SHA ne vérifient pas automatiquement le nouveau HEAD. Vérifier CI sur HEAD et le communiquer dans la PR sans confondre commits.

## 3. Fichiers livrés et contrat d'architecture

### Client réutilisable d'ingestion Python — Source Engine commun
`services/ingestion-service/src/ingestion_service/connectors/gdelt_events_feed.py` :
- `GdeltStaticEventsClient.fetch_latest_events()` HTTPS only, **hôte unique autorisé** `data.gdeltproject.org`. Récupère un manifeste de **3 entrées** export, mentions, gkg, format officiel `size md5 URL`, même slot temporel, chemin validé, seulement l'export `.export.CSV.zip` téléchargé ensuite.
- `parse_manifest` rejette tailles/métadonnées invalides et suffixes inconnus. **Accepte la casse `CSV.zip` ou `csv.zip` et conserve strictement le chemin annoncé** : première CI réelle rejetait `invalid_manifest_row`, puis correctif validé par ajout d'un test explicite de casse et obtention d'une archive réelle.
- Fichier manifesto <=16 KiB, ZIP export <=8 MB, décompression max 85 MB, ratio max 300, fichiers ZIP EXACTEMENT 1 membre au chemin approuvé, aucun `extractall` ni écriture sur disque.
- Chaque enregistrement TSV **61 colonnes événement GDELT v2** ; bornes 120000 lignes. Champs vérifiés : `GlobalEventID`, `SQLDATE`, `EventCode`, `ActionGeo_CountryCode` (FIPS, PAS ISO3), `DATEADDED` (slot GDELT, PAS date de publication initiale), `SOURCEURL` (URL candidate, PAS article lu). **`NumSources` de GDELT n'est pas la corroboration éditoriale**.
- SourceURL HTTPS seulement ; rejette domaines privés/local/localhost et credentials, aucun proxy ni ouverture automatique, canonicalisation des paramètres UTM seulement. Une URL dupliquée n'est pas une source indépendante, et une URL différente non plus. Garde seulement **jusqu'à 40** candidats, mais compte les URL distinctes dans la totalité des lignes.
- `GdeltEventBatch` et `EventLink` gardent `DISCOVERY_ONLY`, `license_reviewed=False`, `publication_time_verified=False`, `independence_verified=False`, provenance manifeste SHA256, ZIP SHA256, MD5 et UTC distincts.
- **AUCUNE fusion avec StatisticalObservation/Timeseries, aucune publication**, pas de sauvegarde Bronze/DB ni ordonnanceur R2A. Les futurs objets SourceDocument/ClaimEvidence/EventSignal devront être distincts et soumis aux droits et validation.

### Probe très limité, sans tiers reproduit
`services/ingestion-service/probe_gdelt_events.py` : opération one-shot et **agrégats seulement** affichés (compteurs, digests), aucune URL/titre d'article ou publication tierce sur GitHub, aucun téléchargement d'article, ni retries, ni stockage de corpus. Inutilisable comme Watch/production sans R2B.

### Tests et CI
`services/ingestion-service/tests/test_gdelt_events_feed.py` : tests pytest en `httpx.MockTransport`, manifeste 3 flux, dates invalides/futures, URL host piégé, ZIP malveillant/extra/mauvais membre, empreinte MD5/longueur, schéma 61 colonnes, liens privés/HTTP, duplications d'URL, paramètres `id=42` vs `id=43`, quota 40, redirection 301 bloquée, 403/404/429/503, téléchargement uniquement hôte GDELT (jamais un SOURCEURL).
`.github/workflows/whv-v2-global-radar-static-events-r2a.yml` : Python3.12, dépendances minimales HTTPX/pytest, compileall, tests offline bloquants; **un seul essai réel après succès tests** par push, non-gating si fournisseur indisponible. Pas de secrets ni coûts créés.

## 4. Décisions produit / limites à NE PAS oublier
1. **Fait réel testé** : transport + archive ZIP véritable + schéma TSV + URLsCandidates. **Ce qui n'a PAS été testé** : lecture des articles, faits confirmés, vraie indépendance des auteurs/agences, présence de sources gabonaises, multilingue exhaustif, droits commerciaux et interface publique de ce flux.
2. R1 affiche le client GDELT DOC 2.0 lorsque disponible, mais l'API 429 peut empêcher ses résultats. R2A est pour l'instant un **collecteur opérateur isolé** sous le même ingestion-service; **l'interface R1 n'utilise pas encore la sortie R2A**, et n'en dépend pas pour du faux contenu.
3. Les 619 lignes peuvent coder plusieurs « événements » pour le même article. Les 120 URL HTTPS distinctes ne sont NI 120 faits NI 120 sources indépendantes; les 476 références redondantes sont comptées et ne gonflent pas le récit.
4. Les fichiers Archives GDELT peuvent contenir erreurs CAMEO, mauvaise géographie, variations ou corrections, horloges anticipées (ici UTC 20:00 alors que fetch 19:59:51). Traiter `DATEADDED` comme label fournisseur avec degré de confiance, et `SOURCEURL` comme URL candidate, **jamais published_at certifié**.
5. **Droits** : le fait de télécharger un fichier GDELT et de passer un test MD5 n'accorde PAS un droit de republier le contenu d'articles, leurs titres ou un corpus commercial. Les métadonnées d'origine ont une politique de rétention, de citation et de traitement commercial à valider avant publication publique. Aucune licence fournisseur n'a été approuvée par cette PR.
6. **Coûts** : petite archive Events seulement (8MB max, inférieure dans le pilote); pas de VPS, pas de LLM, pas d'API payante. **Un probe depuis GitHub Actions n'est pas un scheduler de production**.
7. **Sécurité** : source hostname fixe et HTTPS, pas de redirection vers réseau local; ZIP unique/membre attendu, cap mémoire/décompression et contrôle d'empreinte. Les URLs tierces restent de simples chaînes validées, **jamais requêtées par le collecteur**.
8. **Provenance** : réutilisation de l'emplacement Python ingestion_service au sein de V2, pas de moteur parallèle dans chaque Vision.

## 5. Suite au MEILLEUR RENDEMENT — R2B, vrai parcours d'utilisateur et sources critiques
**Pas un autre panneau Trading isolé.** [Issue parent #135](https://github.com/OBIANG5/World-Health-Vision/issues/135) :
1. **Contrat mutualisé SourceDocument / ClaimEvidence / EventSignal**, héritant de Source Registry Catalog + pluralité critique #117. Observer les documents locaux, nationaux et internationaux réellement autorisés (GDELT seul ne suffit pas); distinguer COUNTRY_OF_PUBLISHER / EVENT_LOCATION / source original/wire syndiqué.
2. **Persistance contrôlée et scheduler réel** (si l'hébergement est préparé) : acquisition GDELT 15 minutes bornée, eau haute `last_slot_utc`, dédoublonnage idempotent par archive+link, fenêtre rétro de rattrapage limitée, traitement ZIP sans perdre liens, droits/licences/TTL, backoff et métriques. Une livraison future 404 = non prête, pas absence de nouvelles. Stockage privé minimal; statuts DISCOVERY_ONLY.
3. **Un vrai événement et ses origines** : original/source nationale ou locale, contrepoint international et preuve primaire lorsque disponible; liens ouvrables, auteur/agence/syndication, correction et contradictions examinés. Aucune revendication si la source n'a pas été lue et la licence revérifiée. Tests sur langues/quelques pays, notamment Afrique; ne pas inventer « couverture mondiale complète ».
4. **Interface V2 réutilisant Atlas/VisionHub/SourceMethodology et #76** : les articles réellement récupérés et autorisés apparaissent depuis une API sécurisée, pas depuis une fixture React. Panne 429 DOC = données archivées datées ou source officielle GDELT, avec fraîcheur visible; aucune fausse date de publication. Mobile 320/390/1440, vraie URI preview, backend/DB d'abord vérifiés #96.
5. **Watch/Trading/Média/BRVM** consomment ces mêmes événements et sources via une API commune, avec suppression des duplications de dépêches et validation humaine. Trading doit reconstituer cadence de 160 fiches DataAnalyse sur un corpus privé et publier contenu original sous droits, pas recopier les textes du professeur.

**Gate de reprise** : lire dans cet ordre issue #133, cette page, PR #136, latest SHA Actions, R1 #134 et issue #135; n'engager R2B qu'après revue de droits GDELT et une première source locale/nationale fiable, coûts/staging; ne jamais fusionner/deployer sans instruction. Le prochain chat doit reprendre exactement la première étape non terminée.
