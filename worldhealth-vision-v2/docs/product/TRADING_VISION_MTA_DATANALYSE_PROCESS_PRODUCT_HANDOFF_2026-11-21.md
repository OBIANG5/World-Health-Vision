# World-Vision Trading — processus MTA / service DataAnalyse : décision produit, preuves et handoff
**Date : 21 novembre 2026. État : première tranche frontend développée sur branche DRAFT; CI et backend à vérifier.**
**Priorité supérieure aux modules Price / Panier.** Le présent document prime sur la description générique « terminal Forex » du registre du 19/11.

## 0. Décision du propriétaire, à ne jamais redéformer
Le service Trading de World-Vision doit **aider le trader à suivre tout le processus de prise de trade enseigné dans la formation du professeur et concrétisé dans les fiches/analyses de son service DataAnalyse**. Il ne s'agit ni d'un simple dashboard Forex, ni d'un fournisseur de signaux opaques, ni d'une promesse de trading automatique profitable. Il doit regrouper **outils, calendrier, données, comparateurs, grilles de décision, surveillance, études de cas, journal, gestion du risque, ressources pédagogiques contextuelles**, avec une mise en pratique fidèle des étapes. Des outils multiactifs sont souhaitables car les travaux historiques portent aussi sur actions, indices, crypto, matières premières et marchés interconnectés. Les bourses africaines ont en parallèle leur verticale propre.

### Trois statuts de preuve à exposer séparément dans toute interface
1. **ENSEIGNÉ** : règle explicitement identifiable dans les transcriptions du professeur, avec repère de cours et exception.
2. **OBSERVÉ DANS LE SERVICE** : décision, préparation, analyse ou suivi présent dans une fiche datée du service DataAnalyse; note d'origine et contexte exact.
3. **PROPOSÉ PAR WORLD-VISION** : amélioration UX, calcul, consolidation, monitoring, workflow, algorithme propre, source de données supplémentaire. Ne jamais attribuer une invention du logiciel au professeur.

Ne pas copier, republier, donner accès à des transcriptions intégrales, images privées, analyses payantes DataAnalyse, marque, ressources propriétaires, layouts licenciés ou stratégies au-delà des droits détenus. Les idées générales de workflow sont reformulées indépendamment ; l'accès éventuel aux ressources du cours reste privé et personnel. Ne jamais laisser entendre affiliation/approbation du professeur.

## 1. Audit documentaire source et limites
Références utilisateur privées **consultées par l'assistant dans la Library (ne pas importer dans le dépôt public)** :
- `OBATRADING-Formation-Reference-Cumulative.md` (11/09/2026) : synthèse historique de **124 transcriptions (~371 853 mots)**, cours Forex, prix, money management, huit devises/28 paires, macro et facteurs de marché. Les vidéos et écrans originaux n'ont pas tous été vus ; une leçon et certaines formules/layouts restent manquants.
- `OBATRADING-Processus-Operationnel.md` (12/09/2026, r3) : tentative de transformation complète en système; 160 publications DataAnalyse **inventoriées** (~76 266 mots dans les corps de texte) couvrant 03/08–11/09/2026; catégories ci-dessous. Il s'agit d'une synthèse historique, pas d'un audit des cours originaux réalisé dans ce lot.
- `OBATRADING_Reconstruction_01.md` (10/11/2026) : reconstruction indépendante de huit documents pédagogiques centraux, vidéo Processus Forex A→Z et dix publications DataAnalyse (neuf AUDCAD, une CHFJPY); 16 règles MTA-001 à MTA-016 et exceptions, ambiguïtés.
- `OBATRADING-Desk-pedagogique.html`, `OBATRADING-Academie-mobile-corrigee.html` : prototypes éducatifs indépendants.
- Ancien `REPRISE.md` (projet OBATRADING OneDrive) : **déclarations historiques non réauditées** ; notamment backtests invalidés par simulation `limit→market`, capteurs périmés, branchements incomplets, besoin de preuves de bout en bout.
- Dépôt privé `OBIANG5/OBATRADING-ACADEMY`, `docs/HERITAGE-OBATRADING-PRIORITES.md`, `docs/ANCIEN-OBATRADING-RECUPERATION.md` : code historique OneDrive identifié mais téléchargement HTTP 403 au 12/11, **pas audité ni réintégré**. Academy actuelle : outil pédagogique statique, non connecté aux prix ou comptes.
- Document World-Vision `docs/continuity/HANDOFF_CORE_F12B_2026-11-19.md` et issue #117 (doctrine pluralité des sources / trading prioritaire).

**Important** : ce lot s'appuie sur les synthèses établies et des extraits retrouvés, pas sur une nouvelle inspection exhaustive des 160 originaux, de chaque image, vidéo ou graphique. La fidélité finale exige le rattachement ultérieur de chaque fonctionnalité aux preuves originales et la résolution des contradictions.

### Typologie historique des 160 publications DataAnalyse
| Catégorie | Nombre dans le rapport historique | Transformation utile en service |
| --- | ---: | --- |
| Briefing journalier | 28 | Centre de préparation : thème, prévisions, devises et calendrier datés |
| Préparation d'annonce | 26 | Consensus connu *avant* l'événement, scénarios et attentes |
| Récapitulatif d'annonce | 28 | Valeur publiée, révisions, surprise, réaction par classe d'actifs |
| Analyses techniques / suivis | 58 | Versionner la thèse, zone, déclencheur, expositions, gestion, invalidations |
| Préparations hebdomadaires | 5 | Radar scénarios et priorités |
| Récaps hebdomadaires en images | 5 | Matrice multifacteurs explicable et datée |
| Préparation mensuelle | 1 | Régime, banques centrales, divergences, priorités |
| Vidéos sans transcription dans l'archive | 3 | À auditer ; ne pas revendiquer avoir analysé le contenu |
| Autres | 6 | Psychologie, méthode et notes macro |
Total historique 160. Ne pas convertir les opinions du professeur ou les résultats déclarés en statistiques de performance certifiées.

## 2. Les 7 étapes et leurs vrais outils
| Étape méthodologique reconstruite | Besoin de l'utilisateur | Outils à relier graduellement |
| --- | --- | --- |
| 0. Disponibilité (prérequis) | Horizon, temps, état déclaré, autorisation de ne pas trader | Préflight, calendrier, capacité et paramètres de compte (pas de diagnostic psychologique) |
| 1. Direction fondamentale | Pourquoi telle direction ? Pourquoi maintenant ? Qu'attendait le marché ? Quelle jambe de la paire ? | Huit économies/28 paires, huit drivers par régime, banques centrales, calendrier consensus/précédent/révisions, interconnexions, thèse versionnée, contre-arguments |
| 2. Price action | La structure confirme-t-elle ? Où est l'invalidation ? | Graphiques multi-timeframes W/D/H4/H1/M15 selon horizon, tendance/range, zones, confluences, swing, entrée/stop/objectif **avant** R:R ; chart daté, fournisseur/contrat explicite |
| 3. Paramètres et exposition | Combien de perte suis-je prêt à accepter et quel risque corrélé existe déjà ? | R max personnel, fraction de R max, ratio brut/net, taille uniquement avec spécification contrat/pip value/coûts vérifiés, facteur commun, stress/gap |
| 4. Participants | Le positionnement retail/institutionnel corrobore-t-il ou nuance-t-il ? | Retail fournisseur/échantillon/date, CFTC COT (date de position ≠ publication), PMT si légalement accessible, filtres non prescriptifs |
| 5. Gestion prévue | Que faire si impulsion, stagnation, annonce, réentrée, ajout, week-end ? | Scénarios conditionnels, suivi de stop, P&L et R restant, journal d'actions; mesures réelles distinctes des prix théoriques |
| 6. Pré-mortem / scénario adverse | Qu'est-ce qui invalide la thèse même si le setup est beau ? | Invalidation prix/fondamentale, surprises inverses, dépendances et risques de concentration |
| 7. Décision et ordre | L'ordre market, limit ou stop correspond-il à la structure, aux risques et au prix réellement connu ? | Revue humaine, simulateur fidèle des fills et non-fills, export de préparation, à terme compte démo et autorisations explicites |

**Règles et nuances critiques du cours reconstruit** : source S1 « Processus Forex de A à Z » (7 étapes); MTA-004 exception technique sans thèse macro fabriquée; MTA-005 quatre confluences référencées comme repère pédagogique, sans leur inventer indépendance; MTA-006 stops/targets fixés par la structure avant ratio; MTA-007 seuil indicatif 3:1 avec transcription ambiguë autour de 2,8–2,9 **non convertie en dérogation automatique**; MTA-008/009 R max monétaire personnel et pourcentage de R max, **pas pourcentage du capital**; MTA-011 ne pas élargir le stop après entrée pour accroître la perte prévue; MTA-013 ratio restant ≠ initial; MTA-014/015 multi-timeframes selon horizon; MTA-016 réentrée justifiée, nouvelle version. Aucune performance garantie.

**Exemples historiques à rejouer sans signal présent** : AUDCAD (thèse RBA/BoC, changement données canadiennes, gestion malgré contradiction); AUDUSD (pré-annonce, ajout après confirmation), CHFJPY (attente longue et réévaluation de divergence de banques centrales), EURGBP (setup sans justification macro, peut rester en attente), S&P 500 (absence de suivi de l'impulsion), BTC (couverture distincte du portefeuille). Dates/cours historiques, jamais cotations actuelles.

## 3. Contrat de données professionnel, mutualisé avec World-Vision
**Entités métier recommandées** :
- `TradeThesis` (stable ID, actif/thème/contrat/horizon, statut IDÉE→SURVEILLER→ZONE→CONDITION, invalidé/expiré; propriétaire);
- `ThesisRevision` (événement, ce qui change, justification, auteur, horodatage UTC, snapshot avant/après);
- `ClaimEvidence` / `SourceDocument` (premier éditeur, canal local/national/régional/international, URL, droits, texte de claim limité, période publiée, date de collecte, corrections, contradiction et dépendances entre publications);
- `MacroEvent` / `MarketExpectation` / `ObservedRelease` (consensus enregistré avec `known_at` AVANT publication; annonce réelle, révisions);
- `MarketSnapshot` (instrument exact, spot/CFD/future/exchange, bid/ask/ohlc, timeframes, timezone, heure de référence, licence, fraîcheur);
- `TechnicalSetup` (zones, structure, déclencheur, stop, cible, version et capture autorisée);
- `RiskBudget` / `PortfolioExposure` (R max, fraction, devise, facteur commun, conversion, frais, gap);
- `TradeDecision` (WAIT / REJECT / REVIEW / PLANNED; jamais EXECUTED sans événement indépendant vérifié); `OrderSimulation` (fills correctement simulés par type et OHLC, non-remplissage et ambiguïtés);
- `ManagementPlan` / `ManagementEvent` / `JournalEntry` (actions, motif, date, résultat réalisé versus estimé, exceptions);
- `WatchRule` / `WatchObservation` / `NotificationReceipt` (moteur transversal persistant, consentement, abonnement, dedup et défaillance).

Pour la vraie intégration serveur : réutiliser les services V2 Catalog/Timeseries/Analytics/Gateway et le socle Watch, éviter un septième microservice sans démonstration d'intérêt. Stockage par utilisateur protégé, migrations et audit, séparation public/privé/tenant, RGPD, quotas API, coûts de données et reprise durable. Le site statique et le localStorage actuel n'équivalent **pas** à cette architecture.

### Pluralité des sources appliquée au trading
Prévoir sources officielles des données macro (mais pas vérité unique sur leurs interprétations), agences locales/nationales et internationales, calendriers, études privées avec conditions d'utilisation, contre-thèses et historiques de révision. Présenter divergences et incertitude ; distinguer publication primaire, reprise d'article, chiffres identiques et corroboration indépendante. Ne pas moyenner sans critères homogènes. Le prix spot X et un CFD Y ne sont pas une unique cotation interchangeable. Un COT du vendredi décrivant des positions arrêtées mardi ne prouve pas des flux spot temps réel.

## 4. Première tranche de code dans la PR courante : ce qui est fait / ce qui ne l'est pas
Développée dans `product/v2-trading-mta-datanalyse-process-v1-2026-11-21`, base `product/v2-p2c3c2-signed-scoped-public-read-2026-11-21` (PR #115, **DRAFT non fusionnée**).
- `src/trading/tradePlan.ts` : les sept étapes structurées, états/contrats v1, calcul du ratio directionnel, budget fraction de R max, garde d'incohérence, statut de dossier, registre de preuve HTTPS et regroupement déclaratif par éditeur original.
- `src/components/layout/TradingProcessPanel.tsx` : atelier responsive FR/EN, changement de route macro/technique, saisie sept étapes, source national/régional/international/terrain/média/marché, pour/contre, registre, calcul et alertes, export JSON et localStorage **sur clic seulement**. Aucune synchronisation, collecte ou trade transmis.
- `src/styles/trading-process.css` : UI isolée responsive 320/390/desktop.
- `src/product/visionProducts.ts`, `src/navigation/worldRoute.ts`, `src/App.tsx` : produit « Trading Vision » devient **partiel**, accessible du hub, du menu Marchés et du lien `?wv=trading`, sans mettre en péril Atlas.
- `scripts/test-trade-plan.mjs`, `npm run test:trading`, `.github/workflows/whv-v2-trading-mta-process.yml` : tests géométrie long/short, budget R max, source/republication, stockage, route exceptionnelle; CI TypeScript/Vite + ESLint (consigner état sur SHA final).

**Limites sans ambiguïté** : pas de vrai DataAnalyse API/abonnement, aucun flux de cours, aucune analyse automatique ni historique des thèses synchronisé, pas d'analyse d'images de graphiques, pas de risque global calculé, pas de COT live, pas d'alerte push, pas de tailles/ordres exécutables. Sources et niveaux saisis manuellement par l'utilisateur; localStorage non chiffré. Couverture des 124 cours dans la bibliothèque documentée historiquement ≠ tous les écrans et ressources du professeur intégrés.

## 5. Prochain ordre de développement raisonné (pas de stagnation sur microfonctions)
**P0 (terminer ce lot)** : GitHub Actions toutes vertes sur SHA final, corriger TS/lint/tests, audit mobile 320/390/desktop et navigation/sécurité/états de chargement ; revue de PR, pas de fusion automatique. Vérifier que `?wv=trading` ouvre réellement l'atelier sans casser pays/profil/convertisseur.
**P1 (valeur métier)** : persistance durable par compte, `TradeThesis`+révisions et registre sources/citations, recherche et reprises ; authentification, consentement, contrôle d'accès serveur. Conserver les dossiers locaux déjà exportés et proposer migration explicite.
**P2 (reproduire le service)** : développer `DataAnalyse Workbench` ORIGINAL (sans copier les fiches payantes) : briefing journalier / hebdo / mensuel, préparation d'annonce puis résultat/surprise, synthèse des 8 drivers, évolution des attentes et trajectoire d'une thèse. Rejouer de façon point-in-time les cas historiques et montrer ce qui a été connu au moment t.
**P3 (outils vérifiables)** : données sources et calendriers légalement utilisables, 8 économies / 28 paires, visualisations multi-timeframes, indices de devises dont formules attribuées/vérifiées, corrélations conditionnelles, COT et retail avec échantillon/date, calculateur de taille uniquement pour contrats vérifiés, journal et reporting.
**P4 (Watch transversal)** : suivi sur serveur des événements économiques, changements de thèses, prix/zone et invalidation; notification consentie, idempotence, historisation, quotas, reprise après panne, distinction intraday et collectes lentes.
**P5 (recherche robuste et conformité)** : backtest sans information future et sans fills fantômes, scénarios/invalidations, démonstration multi-marchés, coûts, slippage, out-of-sample, revues de risque, compatibilité réglementaire/market data; avant toute exécution, passer par environnement démo contrôlé, validation humaine et kill-switch.
**Parallèle** : bourses africaines sous licences ; infrastructure World-Vision et Atlas comparatif / Radar / sécurité / Voyage / Money prioritaires; Price/Panier restent en backlog.

## 6. Contrats de qualité pour chaque prochain lot
- Documents de cours identifiés par ID, repère et statut « confirmé / reconstruction / incertain » ; jamais recopier les archives commerciales dans le public.
- Exemple DataAnalyse : inscrire date d'origine, source de l'analyse, ce qui était connu alors, divergence des sources, et ce que le marché a réellement montré ; ne pas transformer les déclarations en performance prouvée.
- Tests rouges attendus : pas de trade forcé sans setup; pas de taille sans R max; aucune « confirmation indépendante » de deux dépêches copiées; pas de ratio calculé sur stop du mauvais côté; pas de consensus trouvé après l'annonce présenté comme ex ante; pas de cours gelé présenté comme live; aucun ordre limite simulé en market.
- Chaque réponse API et carte UI distingue `NOT_CONNECTED`, `UNAVAILABLE`, `STALE`, `OBSERVED`, `ESTIMATED`, `RESEARCH_ONLY` et `NOT_LICENSED`. Une absence de source n'est pas transformée en signal.
- Preuve de tests à commit SHA précis, tests navigateurs mobiles, journal des issues/PR, zéro achat API/VPS/domaine, zéro déploiement public/fusion sans revue.
- Continuité nouveaux chats : lire **ce document, la PR de cette branche, issue #117, la stratégie multi-sources, l'Academy privée**, puis les fichiers source et résultats CI avant le prochain code. Les prototypes média/voix et l'ancienne V0/V1 ne font pas partie de ce lot.
