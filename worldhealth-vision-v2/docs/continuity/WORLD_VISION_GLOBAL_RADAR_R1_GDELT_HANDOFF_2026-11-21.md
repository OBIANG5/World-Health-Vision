# World-Vision logiciel V2 — GLOBAL RADAR R1 : découverte de publications GDELT et comparaison documentaire
**Date : 21 novembre 2026. Document de continuité obligatoire, à lire avant toute reprise.**
**Statut : fonctionnalité pilote en PR DRAFT #134, NON fusionnée, NON déployée. CI sur HEAD à vérifier avant toute revendication.**

## 0. Directive produit parent et point d'ancrage GitHub
- Dépôt privé : `OBIANG5/World-Health-Vision`, chemin canonique `worldhealth-vision-v2/`.
- [Issue #133 — directive générale et vraie vision Trading](https://github.com/OBIANG5/World-Health-Vision/issues/133) : donner la priorité à une source/provenance/GDELT réutilisable pour **Atlas, Média, Trading, Bourse Afrique, Watch et sécurité pays**, plutôt que prolonger indéfiniment un panneau Forex et ses rôles.
- [Issue #117 — pluralité critique des sources](https://github.com/OBIANG5/World-Health-Vision/issues/117) : aucun média/institution n'est assimilé à la vérité; local/national/terrain et international comparés équitablement et sous limites documentées.
- [Issue #76 — comparateur articles/claims](https://github.com/OBIANG5/World-Health-Vision/issues/76) : référence métier des cas suivants; **R1 ne prétend pas encore comparer les affirmations des articles**, seulement leurs liens et métadonnées.
- [Issue #96 — staging réel](https://github.com/OBIANG5/World-Health-Vision/issues/96) : le besoin de liaison Gateway/Catalog/Timeseries et d'une URL preview réellement testable persiste. **Tester Vite local avec Chromium n'est PAS déployer sur Vercel.**
- [PR #115](https://github.com/OBIANG5/World-Health-Vision/pull/115) : base canonique Product/Atlas/DATA dans laquelle nous empilons **PR #134**, et NON sur la pile Trading #120→#121→#124→#125→#127→#129.
- Branche créée : `product/v2-global-radar-gdelt-source-discovery-r1-2026-11-21`, base `product/v2-p2c3c2-signed-scoped-public-read-2026-11-21`, base SHA au lancement `798b77987caa7d0f09929834c0ed176e21088915`.
- [PR #134 — Global Radar R1](https://github.com/OBIANG5/World-Health-Vision/pull/134), DRAFT, ne pas merger ni déployer sans décision.
- Workflows GitHub R1 à relire sur le **dernier HEAD**; un commit documentaire ultérieur ne prouve pas automatiquement une CI verte.

## 1. Ce qui est réellement codé, par fichier
- `frontend/web-v2/src/radar/gdeltDoc.ts` : **client commun TypeScript réutilisable**, utilisant **API officielle GDELT DOC 2.0** `https://api.gdeltproject.org/api/v2/doc/doc`, `mode=artlist`, `format=json`, tri DateDesc, période 1/3/7 jours, 40 lignes max par appel, filtre facultatif `sourcecountry:` pour origine du **MÉDIA** et non lieu de l'événement. Tous les termes sont des saisies utilisateur bornées et encodées, jamais un proxy HTTP vers URL saisie librement. La normalisation distingue URL de publication, URL canonique de déduplication, domaine, pays d'origine déclaré, langue déclarée, `seendate` déclaré par GDELT et `retrievedAt` de la réponse. `DISCOVERY_ONLY` constant; n'acquiert ni le corps de l'article, ni une preuve, ni une licence de réutilisation.
- `frontend/web-v2/src/components/layout/GlobalRadarPanel.tsx` : **véritable React V2 FR/EN** en modale, accessible depuis VisionHub. Recherche sur clic seulement, temps/filtres explicites, compte des URLs/domains/outlet-countries (PAS nombre d'événements), liens HTTPS d'origine, 2 cartes choisies par l'utilisateur (jamais sélection imposée), comparaison domaine/langue/date et mention d'indépendance non vérifiée. Feedback clair pour `429`/HTML 200/5xx/CORS/network/timeout/absence de résultats. Lien de secours sur le **même sujet/filtre** vers la recherche HTML officielle GDELT; l'ouverture externe est volontaire et l'accès n'est pas garanti.
- `frontend/web-v2/src/styles/global-radar.css` : édition blanche/bleue selon World-Vision, lisible mobile 320/390px et desktop 1440px, grille/focus sans débordement.
- `frontend/web-v2/src/product/visionProducts.ts` : Global Radar passe honnêtement de `planned` à `partial`, avec action de recherche; les produits non disponibles continuent de l'être.
- `frontend/web-v2/src/navigation/worldRoute.ts` : nouvelle route `?wv=radar` compatible Vercel/static path; pas d'enregistrement des requêtes dans les URL.
- `frontend/web-v2/src/App.tsx` : composant GlobalRadarPanel lazy-loaded et accessible depuis répertoire des Visions; on ne touche ni au globe de l'Atlas ni à la navigation pays/profil.
- `frontend/web-v2/scripts/test-global-radar.mjs` : tests Node des **vrais modèles TS** (par `typescript.transpileModule` et import du code compilé), requêtes sûres, bornes, dates, liens malveillants, duplication de trackers, URL `?id=42` distincte de `?id=43`, métadonnées incertaines, comparaison de domaines sans fausse corroboration, erreurs 429/503, HTML 200, réseau, réponse volumineuse, abort et secours HTML officiel.
- `frontend/web-v2/global-radar-browser-smoke.mjs` : Chromium sur **application React V2 de production compilée** en 320, 390 et 1440, appels API GDELT **interceptés par réponses EXPLICITEMENT SYNTHÉTIQUES**, vérifie zéro collecte au lancement, 1 requête par clic, URLs et absence d'injection HTML, choix de 2 sources non vérifiées, débordement mobile, clavier Escape, URL, filtre `sourcecountry:gabon`, zéro réponse, 429 et HTML malformé avec repli GDELT.
- `.github/workflows/whv-v2-global-radar-gdelt-r1.yml` : npm ci, eslint ciblé, TypeScript 6 + Vite, tests de domaine, Playwright réel 320/390/1440, captures de données synthétiques. **Un job SÉPARÉ de reachability sans pouvoir de validation** fait un seul appel au fournisseur, afin de noter son statut HTTP en CI.

## 2. Vérification officielle du comportement GDELT — documentation et vérité du fournisseur
- [DOC 2.0 — blog officiel GDELT](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/) documente `ArticleList`, sortie JSON, `sourcecountry:`, `timespan`, `maxrecords`, tri DateDesc. Les pays des médias sont des classifications fournisseur, pas une géolocalisation du lieu du fait. La liste des articles n'est ni un fact-checking, ni un inventaire mondial exhaustif, ni une licence de recopier les articles sous copyright.
- **Test du fournisseur réellement tenté le 21/11/2026 depuis GitHub Actions #44942582820**, job `provider-reachability-observation`, qui a renvoyé `HTTP 429` et `status=throttled`. Ce résultat ne prouve pas une panne mondiale et ne prouve pas que le navigateur final aura le même statut; il interdit **d'affirmer que le flux LIVE a été démontré** dans cet environnement. Le client affiche la limitation et une redirection volontaire vers GDELT au lieu de simuler des titres ou relancer à l'infini.
- D'autres runs peuvent reproduire ce comportement. En cas de réussite future, enregistrer `HTTP 200` avec métadonnées de format et lignes GDELT seulement, sans affirmer qu'un événement ou l'indépendance d'un média est vérifiée.

## 3. Protections et décisions non négociables
1. **Source vs fait** : `DISCOVERY_ONLY` obligatoire partout. Deux articles de domaines distincts ne prouvent **ni indépendance de l'information**, ni accord sur le fait, ni exactitude; aucun article n'a été automatiquement téléchargé pour comparaison de texte.
2. **Provenance et temps** : `seendate` est une date déclarée par GDELT, NON une preuve de publication éditeur. `retrievedAt` horloge du client et non horodatage côté serveur. Aucune donnée en retard ne devient `today` sans date.
3. **Protection des utilisateurs** : aucun login, clé d'API, stockage local ou tracking de recherche, aucune transmission d'identifiant, `credentials:omit` et requête HTTPS d'un seul domaine GDELT. Sujet seulement transmis **lors d'un clic**. Pas de Scraping des éditeurs tiers. Ouverture externe explicite HTTPS `rel=noopener noreferrer`; URI dangereuses/non-HTTPS/privées rejetées. Aucun script HTML fournisseur injecté.
4. **Budget fournisseur** : au plus 40 retours par requête, espacement 6 s **sur onglet courant seulement**, timeout 12 s, pas de retry automatique, 429 traité honnêtement. R1 **n'est pas un ordonnanceur distribué** : aucun quota partagé entre utilisateurs, pas d'historisation, pas de stockage Bronze, pas de métriques historiques ni de garanties de latence/fraîcheur.
5. **Pluralité internationale** : sourcecountry = origine du média selon GDELT, **non la localisation du sujet**, et la liste de 26 origines est une aide de recherche qui ne décrit pas la couverture du fournisseur. Langues/continents et éditeurs ne sont pas tous couverts. Ne pas privilégier de nom mondial par défaut. Seuls les domaines et titres transmis par GDELT s'affichent; les éditeurs réels et agences communes doivent être évalués dans un registre de sources ultérieur.
6. **UX vérité** : `0` résultat = 0 lien exploitable dans CET appel, jamais `0 événement`. Un GDELT 429/timeout/CORS/HTML 200 est état d'INDISPONIBILITÉ, jamais converti en vide. Aucun taux de marché/BRVM/Trading ni notification inventée.
7. **Pas de coût** : aucun fournisseur commercial, VPS, abonnement, staging, secrets ni achat. PR empilée en DRAFT, ne touche pas production. Lancement sur URL déjà publiée nécessite revue séparée.
8. **Réutilisation** : `RadarCandidate` TypeScript générique, les futurs contrats Java `SourceDocument`, `ClaimEvidence`, `EventSignal` pourront utiliser les métadonnées sans recopier un nouveau moteur GDELT dans Trading ou Média.

## 4. Ce qui manque — ne pas confondre R1 et le service final
- **Persistance/collecte serveur** : aucun scheduler, outbox, consentement, backoff partagé, journal de découverte de source ni watermark. Une navigation active de l'utilisateur est indispensable; les autres apps ne sont pas encore branchées sur ce module. R1 prouve un **parcours de découverte côté navigateur**, pas un moteur central de veille opérationnel.
- **Vrai événement multi-origines** : aucun cluster indépendant, source originale/locale identifiée et validée, auteur/agence, full-text, claim ou droit commercial de réutilisation n'est vérifié. La comparaison est pour le moment **métadonnées versus métadonnées**.
- **Staging/back end** : aucun Gateway/Catalog/Timeseries supplémentaire ne doit être revendiqué. Le code s'appuie sur le V2 frontend déjà existant.
- **Méthode GDELT** : GDELT ne donne pas automatiquement un corpus homogène de pays/territoires; absence d'actualité ne signifie pas absence de couvertures. Doit être complété par sources originales nationales et locales sous droits.
- **Trading/DataAnalyse** : conserver le ratio valeur/coût, issue #133 exige le vrai rythme et la recherche éditoriale des 160 fiches; R1 sera ensuite une alimentation de Trading et du Média, pas le service premium en lui-même.
- **Révocation et RGPD** : si R2 stocke les candidats, il faut journal d'acquisition, TTL/retention, licences de métadonnées et effacement; R1 n'a ni base ni utilisateurs.

## 5. La SUITE LA PLUS RENTABLE : R2, véritable moteur de sources partagé
**R2A** — Revisiter les contrats existants `Catalog/source`, `CountryLocalEvidencePanel`, `SourceMethodologyModal`, `Timeseries/source rights` et leur séparation Document vs chiffre; concevoir la **table/DTO `SourceDocument` distincte de `StatisticalObservation`**, avec URL originale, canal, date origine `unknown`, `seenAt`, `fetchedAt`, langue, pays de l'éditeur, pays du sujet (distinct), état de licence, politique de rétention, version/correction, digest, doublons, dépendance de dépêche. Pas de valeurs brutes copiées sous droit.
**R2B** — Ingestion serveur GDELT **bornée et compatible avec les quotas/429**, avec une veille thématique par région/sujet, backoff global, sourcecountry/language explicites, checkpoints persistants, incrémental via horodatage vérifiable, suivi des erreurs et coût. Garder `DISCOVERY_ONLY` tant que l'original n'est pas ouvert, lu et passé en revue. Le module TypeScript R1 reste la référence UX, mais le backend ne doit pas faire confiance aux URL fournies par le client.
**R2C** — **Un cas réel international** avec une source originale nationale/locale **et** une indépendante internationale si réellement disponibles et permis. Source originale / publication directe / agence syndiquée; indépendance et contradiction observables, absence de couverture visible. Revue humaine des claims et droits, aucune publication automatique.
**R2D** — Réutiliser le comparateur pays local/national/international issu de #76, les fiches Atlas et le Média; fournir route V2 et test Chromium mobile (320/390/1440), API testée et rapport de droits avant une preview réellement hébergée.
**R3** — Watch calendrier commun, scheduling récurrent, sources officielles macro/BRVM, puis DataAnalyse-like publication originale dans Trading (cadence réellement auditée, pas « 3 analyses obligatoires/jour »). Notifications et comptes uniquement lorsque l'infrastructure de sécurité/consentement existe.

### Gate du prochain lot
**Éviter deux extrêmes** : ne pas s'enliser sur CSS/proto Radar une fois les tests verts, MAIS ne pas lancer automatiquement un faux pipeline backend avec un seul domaine GDELT à 429. D'abord choisir fournisseur et cadre de collecte réellement opérationnels et légalement exploitables, tester les droits, vérifier SourceRegistry existant, élaborer 1 vraie chaîne d'événement avec preuve utilisateur et documentation. Écrire une issue dédiée R2 et des tests; pas d'invention.

## 6. Point de reprise précis / CI
Premiers commits importants R1 :
- `73bcd5c` : client GDELT normalization/provenance ;
- `2975478` : React panneau Radar ;
- `a953a10` : styles mobile ;
- `46e86b2` : branchement App/route/VisionHub ;
- `8794045` : tests Node du module ;
- `3141dcc` : tests Chromium trois tailles ;
- `995919d` : CI dédiée et probe ;
- `c11db48` : nettoyage contrôles conforme ESLint (première CI avait échoué : `no-control-regex`);
- `81b1775` : classe `RadarRequestError` conforme TypeScript 6 `erasableSyntaxOnly`, après première erreur TS1294.
- Les commits postérieurs incluent secours vers recherche officielle HTML GDELT et contrôles de test correspondants.

**Étape au moment d'écrire ce document** : vérifier le HEAD `product/v2-global-radar-gdelt-source-discovery-r1-2026-11-21` et les workflows GitHub `WHV V2 Global Radar R1 — real app, safe GDELT discovery`. Corriger TOUT échec de compile/browser sur le SHA code, puis enregistrer URL, SHA, job et artifacts dans la description de PR #134 et les issues #133/#76. Garder ce document présent, sans le présenter comme preuve de CI verte si le commit de documentation n'a pas été réexécuté.

**Référence officielle du fournisseur** : https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/


---

## 7. CHECKPOINT CI VÉRIFIÉ et prochaine issue prioritaire (21/11/2026)

**Code final R1 + interface + 3 tailles Chromium + handoff initial validés sur SHA EXACT `a0b30153992936914b331353afff5e47a78e73be`.**
- [GitHub Actions #44942883698 — `completed/success` sur ce SHA](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44942883698).
- Job `global-radar-r1` = `136963742913` **success** : `npm ci`, **tests Node sur le vrai modèle TypeScript**, lint de tous les nouveaux fichiers et intégrations modifiées, **build strict TS6/Vite**, parcours **vrai Chrome/React 320/390/1440** avec réponses API **synthétiques et étiquetées**, zéro requête implicite et zéro article fake, sélection/dédup/2 domaines, retours 429/HTML, URL source sûres/FR, responsive et clavier.
- Captures de navigateur exclusivement synthétiques : artifact `global-radar-r1-synthetic-browser-evidence`, **227855 octets**.
- Job `provider-reachability-observation` = `136963743084` "success" indique SEULEMENT que le probe s'est exécuté (non-gating), **pas que l'API GDELT a fonctionné** : les observations précédentes sur GH indiquent `HTTP 429`, et il faut consulter le LOG du job sur chaque SHA pour savoir ce que GDELT a réellement rendu. Aucun article réel n'a été validé dans R1.
- Autre workflow #44942887948 `success` également sur ce SHA.

**Ce checkpoint a été écrit à la suite du commit `a0b3015`, donc sa propre mise à jour produit un HEAD documentaire PLUS RÉCENT. Toute affirmation « exact HEAD validé » requiert le succès du workflow sur ce nouveau HEAD.** Lire les commits et leur CI, ne pas déduire de résultats futurs.

**Prochain ticket prioritaire [#135 — Global Radar R2, fournisseurs fiables, ingestion, provenance et premier événement vrai](https://github.com/OBIANG5/World-Health-Vision/issues/135)**. Il mentionne explicitement le 429 réel de GDELT, la nécessité d'un fournisseur alternatif autorisé et stable, la réutilisation du Catalog/Timeseries et une véritable comparaison d'articles locaux/nationaux et internationaux avec preuve d'indépendance ou absence de preuve signalée. **Ne pas prolonger indéfiniment le frontend R1 : passer à un vrai parcours source→preuve→comparaison qui apporte une valeur à Atlas/Média/Trading.**

**Pas de merge, staging, production, achat, fournisseur payant, renseignement personnel ni lancement de veille autonome dans cette tranche.**
