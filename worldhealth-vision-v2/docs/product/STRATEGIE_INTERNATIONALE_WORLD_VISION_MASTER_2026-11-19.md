# WORLD-VISION — DOCUMENT MAÎTRE DE STRATÉGIE INTERNATIONALE
**Date de consolidation : 19 novembre 2026.** Statut : vision produit + feuille de route, **pas** fonctionnalités toutes livrées.
**Référentiel de source :** dépôt `OBIANG5/World-Health-Vision`, dossier canonique `worldhealth-vision-v2/`. Ne jamais reprendre V0/V1.
**Slogan média :** « Voir le monde, le comprendre. »

> Point de reprise officiel pour tout nouveau chat : ce fichier + `docs/continuity/HANDOFF_CORE_F12B_2026-11-19.md` et les PR liées. **Conserver les idées, distinguer systématiquement intention / code / API réellement alimentée / produit déployé / service commercialisé.**

## A. Décision fondamentale : ce qu'est World-Vision

World-Vision ne doit pas devenir une collection d'écrans génériques qui reformulent des réponses faciles à obtenir de ChatGPT. Il doit offrir des **capacités persistantes et actionnables impossibles à obtenir par une simple conversation ponctuelle** : données contrôlées, comparaisons normalisées, historiques, vérification des sources, prix réellement observés, alertes autonomes consenties, suivi dans le temps, contraintes personnelles, notifications, outils spécialisés et parcours transactionnels sous licences appropriées.

Le cœur commun `WORLD-VISION CORE` doit servir simultanément :
1. **Atlas mondial / World Health Vision V2** : globe, pays, institutions locales et organismes régionaux/internationaux, indicateurs sourcés, comparaisons contradictoires, historique et limites méthodologiques. Le globe est une **navigation de données**, pas le produit complet.
2. **World-Vision Média** : veille mondiale, recherche journalistique, preuves et vérification, scripts, voix Vivienne C5.2, visuels, vidéos, validation éditoriale et publication autorisée.
3. **Money-Vision** : taux de référence, conversion, frais, taux net effectivement obtenu, suivi et alertes.
4. **Tourisme-/Transport-Vision** : meilleur prix d'avion/train/bus/hôtel selon dates, contraintes et voyageurs, surveillance et notification de baisses ou d'offres réellement utilisables.
5. **Price-/Panier-Vision** : produits, magasins, unités comparables, codes-barres et paniers optimisés selon lieu, disponibilité, distance, frais et habitudes.
6. **Trading-Vision** : tableau de bord Forex, macroéconomie et banques centrales, calendrier économique, indices devises, volatilité, corrélations, journal et gestion du risque, avec sources et droits de marché. Ambition à long terme de concurrencer des **usages** de TradingView, pas une affirmation que le terminal existe déjà.
7. **Bourse Afrique / BRVM-Vision** : données régionales, historiques, dividendes, événements d'entreprise, suivi et alertes de portefeuille sous licences autorisées, sans prétendre disposer aujourd'hui du flux officiel redistribuable.
8. Extensions ultérieures fondées sur besoins et preuves d'usage : économie locale, mobilité urbaine, emploi, éducation, sécurité des voyageurs, coûts de la vie, outils pour diaspora, entreprises et chercheurs.

**Stratégie d'acquisition :** chaque verticale attire par un usage répétitif réel, puis donne accès au reste de l'écosystème via compte et notifications communs. L'actualité et le média contribuent à la découverte ; les outils surveillés et comparés apportent la rétention. Ne pas dépendre de la pub comme seule source de revenus.

## B. Ce qui différencie nos produits d'un chatbot

| Besoin utilisateur | Ce qu'une conversation ponctuelle ne garantit pas | Livrable World-Vision réellement défendable |
| --- | --- | --- |
| « Un billet devient moins cher ? » | Surveillance constante, historique d'offres, notification garantie, réservation | WatchRule persistante par trajet, taxes/bagages, dates flexibles, revérification du tarif et lien partenaire autorisé |
| « Où mes courses sont moins chères ? » | Prix locaux fiables, disponibilité par magasin, quantités, fidélité, substitution | Panier local vérifié et optimisé, coût total + distance, preuves de prix et fraîcheur |
| « Quand transférer 500 € au Gabon ? » | Coût total à l'instant T chez plusieurs opérateurs | Comparaison du montant **net reçu**, frais et FX final, corridor et moyens de paiement réels |
| « Que surveiller pour mon Forex ? » | Terminal, historique d'événements, journal et paramètres de risque durables | Calendrier + cours sous licence, alertes conditions, journal, exécution manuelle ou courtier autorisé |
| « Quelles infos sont importantes dans ce pays ? » | Suivi des sources locales, évolution de couverture, contradictions documentaires | Radar GDELT/institutions, dossier de preuves, chronologie, état de vérification |
| « Ce chiffre économique est-il fiable ? » | Comparaison de méthode, période, révisions et métadonnées de plusieurs fournisseurs | Fiche statistique opposable : source originale, date de publication, période observée, statut estimé/observé, divergences |

## C. Leçons de GDELT et d'EarlyForge

### GDELT (discovery, pas vérité absolue)
Source officielle : https://gdeltproject.org/data.html
Le portail décrit notamment `Events`, `Mentions` et `Global Knowledge Graph` (GKG), avec mises à jour de fichiers GDELT 2.0 à cadence annoncée de **15 minutes** et couverture multilingue. Ce sont des **mentions / événements rapportés** : présence médiatique, géocodage et tonalité ne prouvent ni qu'un événement est avéré ni le chiffre exact ni son importance absolue. Les biais de langues, médias, géographie, bruit et duplications doivent être mesurés.
**Usage retenu :** ingestion incrémentale à autorisation vérifiée → dédoublonnage → rattachement pays/lieux/acteurs → détection d'un changement → dossier d'hypothèses et mentions → validation indépendante auprès d'institutions et médias locaux → alerte / fiche pays / sujet média. Jamais publication automatique d'une allégation uniquement parce que GDELT la remonte.
Séparer le `EventSignal` de l'`OfficialStatisticalObservation` et des `CommercialPriceOffer` ; niveaux de preuve, licences et délais différents.

### EarlyForge (workflow à observer, pas produit à copier)
Site documenté : https://earlyforge.ai/ ; https://docs.earlyforge.ai/
L'outil editorial annonce détection de tendances, regroupement de mentions, scores de momentum et fraîcheur, sourcing, rédaction avec citations, revue humaine et destinations de publication. **Inspiration retenue :** collecter → regrouper → hiérarchiser → vérifier → présenter → suivre → publier après validation.
World-Vision doit aller **au-delà du journalisme** : relier les événements à des chiffres vérifiables et des actions utiles (tourisme, cours, prix, voyages, sécurité du trajet). Ne pas attribuer à EarlyForge des droits d'API, des technologies internes ou une couverture garantie sans documentation contractuelle.

### Architecture Global Radar (prévue, non connectée au backend V2)
`SourceAdapter` → `RawEventMention` (preuve URL et date) → `NormalizedEntity` (ISO3, entités, langue) → `StoryCluster` (déduplication) → `EvidenceReview` (confirmé / contesté / non vérifié) → `WorldMapSignal` → `UserWatchEvaluation` → `EditorialCase` → `PublicationApproval`.
Règles obligatoires : score de sélection ≠ certitude ; les scores doivent être interprétables, révocables et audités. Vérifier les licences de conservation/citation et les restrictions de médias.

## D. Sources institutionnelles — notre exigence internationale

Le référentiel V2 connaît **217 pays/territoires** et un catalogue de **22 sources internationales** ; ce ne sont pas 217 pays intégralement alimentés ni 22 connecteurs en production. Pour chaque pays, construire un **registre d'institutions nationales** (statistiques, banque centrale, budget/finances, agences nationales, administrations sectorielles et parfois parlement), les organismes sous-régionaux (p.ex. BEAC, BCEAO, banques de développement) et les contrepoints internationaux (ONU, FMI, Banque mondiale, OCDE selon périmètre).
Par exemple : Gabon, France, Côte d'Ivoire, États-Unis et Japon pour tester les différences de sources, de monnaies, de fuseaux, de juridictions et de fréquence. Ne pas inventer l'existence d'un API local.
Statut **par source ET par indicateur** :
- `DISCOVERED` : source identifiée, documentation trouvée ;
- `CATALOGUED` : métadonnées enregistrées, aucune donnée garantie ;
- `ACCESS_APPROVED` : droits/termes et quotas vérifiés ;
- `CONNECTED` : connecteur déployé mais succès à vérifier ;
- `INGESTED` : observation réellement reçue et horodatée ;
- `VERIFIED` : contrôles de schéma, période, provenance, cohérence réussis ;
- `DEGRADED/STALE` : manque de fraîcheur ou erreur de collecte ;
- `REVOKED` : source suspendue / conditions changées.
Séparer `period_start/end`, `source_published_at`, `fetched_at_utc`, `observed_at`, `value_status`, `unit`, `currency`, `licence`, `revision_id`. Un indicateur annualisé ne doit jamais être présenté comme « en temps réel ». Paires fixes (EUR/XAF et EUR/XOF au taux légal) ≠ marché libre ni taux net de transfert.

## E. World-Vision Watch : moteur commun de surveillance, pas une seule alerte « news »

`WatchRule` (identité, sujet, conditions, consentements, budget/limite, fenêtre de validité et fréquence) → `Observation` (valeur brute/canonique, fournisseur, heure, source) → `Evaluation` (test de seuil/historique, qualité) → `NotificationOutbox` (idempotence, canal, tentative, statut) → `DeliveryReceipt` (résultat, erreur et désabonnement).
- Une règle et une observation persistent entre sessions et redémarrages ; une alerte ne doit pas se répéter parce qu'une condition est restée vraie.
- Mettre des plafonds de surveillances/notifications et des backoffs, gérer les changements de fuseau et de devises, consentement vérifiable, canal email/push autorisé, quotas, RGPD.
- Distinguer les moteurs d'observation : FX taux de référence (fixing journalier), billets et tarifs périssables, prix par magasin (géolocalisation et unités), cotations boursières en temps différé ou réel sous licence, signaux GDELT.
- Un fournisseur peut disparaître ou retourner zéro offre ; afficher « indisponible », jamais une baisse inventée.
- Compte commun avec scopes par produit, protection des données personnelles, journaux d'audit proportionnés. Pas de lancement commercial avant preuve de sécurité.

## F. Priorités de livraison — un vrai usage avant 30 maquettes

| Rang | Livrable | Pourquoi | Critère de sortie réel |
| --- | --- | --- | --- |
| 0 | V2 fiable + qualité/tests/provenance + sécurité/JWT | La donnée doit survivre et être digne de confiance | CI et staging 24/7, images soutenues, backup/restauration, API web réelle |
| 1 | 1 donnée internationale réelle institutionnelle sur le site | Prouver la chaîne source→ingestion→DB→API→globe | Horodatage, droit, comparaison, statut de fraîcheur affichés |
| 2 | Compte & Watch génériques | Rétention et infrastructure transversale | Règles persistantes, idempotence, envoi vérifié et opt-out |
| 3 | Money-Vision (taux + alerte), puis frais nets de transferts | Réutilise convertisseur existant, besoin diasporas | Alerte utilisable end-to-end ; frais de fournisseurs réellement disponibles |
| 4 | Transport-Vision (trajets surveillés) | Forte valeur et affiliation plausible | Prix effectivement offerts, bagages/taxes, lien de réservation et confirmation du tarif |
| 5 | Price-/Panier-Vision local | Fidélisation forte mais collecte locale difficile | Articles comparables par EAN/quantité, panier fiable et magasins documentés |
| 6 | Trading-Vision | Utilité répétée mais données et tests coûteux | Calendrier économique sourcé, alertes, journaux et calculs de risque |
| 7 | Bourse Afrique/BRVM, APIs B2B | Valeur spécialisée et potentiel abonnement | Droits données, couverture et fraîcheur prouvés |
| Continu | World-Vision Média + Global Radar | Acquisition, crédibilité et dossier vérifié | Revue humaine, sources originales, droit médias, publication conforme |

Éviter MVP minimal vide : construire **un parcours fini de qualité**, pas un produit gigantesque où tous les boutons « arrivent bientôt ». Chaque verticale commence par des parcours fonctionnels profonds, teste les données et la rétention, puis s'étend.

## G. Monétisation — dépendante d'une vraie utilité

**Gratuit** : atlas sourcé, lecture de statistiques, convertisseur informatif, recherche basique et limites raisonnables d'alertes. Utilité réelle avant publicité.
**Affiliation contextuelle et divulguée** : réservation de voyage/hôtel, assurance voyage, services de transfert FX, comparateurs autorisés, éventuellement courtiers strictement conformes aux lois du pays et interdiction de promotions trompeuses. Prioriser montant net payé, pas la commission la plus élevée ; liens sponsorisés identifiables et classement non achetable.
**Premium particulier** : surveillances supplémentaires, destinations et dates flexibles, historique étendu, portefeuille personnel, alertes multicanales, export, indicateurs de fiabilité, absence de pub si techniquement proposée. Aucun prix ni taux de conversion garanti à ce stade.
**Premium pro / B2B** : API officielle auditable, exports licenciés, espaces équipe, watchlists partagées, alertes réglementaires/macros, dashboards et SLA **seulement après** conformité, stabilité et droits de redistribution. Ne pas vendre des données sous licence tierce sans autorisation.
**Publicité** : option secondaire qui exige beaucoup de visiteurs et des consentements/conditions adaptés. Ne jamais concevoir l'interface pour maximiser artificiellement les pages vues ; priorité à la confiance.
**Partenariats / sponsoring médias** : indépendance éditoriale, séparation claire du contenu financé et du contenu journalistique.

### Mesures économiques à instrumenter
`MAU`, rétention J7/J30 par outil, activation de première Watch, alertes pertinentes/non pertinentes, coût par 1 000 observations, coût par notification livrée, taux de clics affiliés autorisés, conversion réellement attribuée, taux de remboursement/annulation, revenu par utilisateur **net des coûts API/cloud et d'assistance**. Consentement, minimisation et événements agrégés : ne pas bâtir une surveillance invasive des usagers.
Ne pas avancer de revenus mensuels « probables » sans trafic, CTR, EPC, concurrence et coûts mesurés. Tester les programmes partenaires et leurs conditions au moment du lancement.

## H. Questions de licences et fournisseurs à étudier, pas à annoncer comme intégrés

- **GDELT** : téléchargement des données et modalités d'utilisation des mentions ; la réutilisation des textes d'articles/images obéit aux droits de leurs éditeurs.
- **Open Food Facts / Open Prices** : pistes pertinentes pour produits, codes-barres et prix locaux ; documentations https://openfoodfacts.github.io/documentation/docs/ et https://openfoodfacts.github.io/open-prices/ . Base collaborative, couverture inégale, différences de licences et attribution/partage à auditer avant produit commercial.
- **Amadeus Self-Service** : point de départ pour exploration d'offres et prix aériens ; la documentation rappelle des exigences de marché et d'accès production et souvent un consolidateur pour émettre des billets. https://admin.developers.amadeus.com/self-service/apis-docs/guides/developer-guides/faq/ . La surveillance de billets/train/bus exige partenaires séparés, renouvellement de prix et respect des quotas ; éviter scraping contournant CGU.
- **FX et paiements** : Frankfurter (conversion informative de V2) ne représente pas les frais des opérateurs. Les comparateurs de transferts exigent une source de taux/frais payable et le consentement/la réglementation. Paires XAF/XOF : afficher clairement fixation monétaire vs frais réels.
- **BRVM / marchés** : prix, historique et latence de diffusion doivent être contractuellement autorisés avant dashboards commerciaux. On ne promet aucune donnée en direct gratuitement sans droit.
- **Trading** : les flux temps réel, indicateurs et exécution sont des sujets distincts ; suivre licences des plateformes et règles financières, ne pas garantir les performances.

## I. Architecture Core, internationalisation et gouvernance

Garder les services V2 existants quand utiles ; **n'ajouter des microservices que pour une isolation démontrable**.
Composants logiques : `Country/Institution Registry`, `Source License Registry`, `Raw + Canonical Evidence Store`, `Timeseries`, `EventSignal`, `PriceOffer`, `Watch Engine`, `Notification Outbox`, `Identity/Entitlements`, `Public API Gateway`, `Media Editorial Workflow`, `Admin Observatory`.
Normaliser ISO 3166 (pays et subdivisions), ISO 4217 (devises), IANA TZ et UTC stockage, unités, taxes, langue locale et langue de restitution ; éviter biais occidentalo-centré, penser langues et appareils bas débit. Les zones disputées et territoires exigent une politique géopolitique transparente.
Sécurité : JWT signé, issuer+audience, scopes par produit, accès public explicite et limité, gestion des secrets hors Git, CI, réseau privé, sauvegardes chiffrées hors-site et tests de restauration. RGPD et règles de notification/partenariat selon juridiction.
Qualité : pour chaque écran `réel / aperçu statique / partiellement alimenté / indisponible` ; pour chaque source `cataloguée ≠ collectée`. Aucun indicateur fabriqué, et transparence sur l'incertitude. Media Studio maintient revue humaine, assets licenciés et charte World-Vision (cyan contrasté, blanc/bleu, photos journalistiques crédibles, voix cohérente, carrousels lisibles, trois images validées une par une).

## J. Planning technique EXACT au 19 novembre 2026

- Branche `v2` canonique inchangée depuis `37aa828163f77f77600a12361ec2ffbb8176b6d9` au contrôle initial.
- PR #35 : qualité globe/iPhone, base `v2`.
- PR #36 : staging sécurisé, base `v2`.
- PR #38 : routes publiques et privées, **base #36**.
- PR #39 : JWT signé et scopes, **base #38**.
- PR #40 : Gateway six services, p50/p95/p99 et panne, **base #39** ; benchmark 120/120 sur CI, p50 économique France ~2491 ms.
- Présent chantier F1.2b.2c : profilage et amélioration HTTP, **branche fondée sur #40** ; ne pas changer le site Vercel.
- Ensuite F1.2b.3 : sécurité/charge sous volume, choix et coûts hébergement validés ; puis F1.3 ingestion vérifiée ; F1.4 Watch ; F1.5 pilotes consommateurs ; radar média progressivement.

**Interdictions :** fusionner les chaînes de PR sans revue, annoncer backend mondial live alors qu'il est en CI, copier les branches média historiques en bloc, sacrifier intégrité des données pour une vitesse apparente, déployer V0/V1, ajouter des fonctions « chatbot » à faible utilité, ou engager dépenses sans contrôle.
