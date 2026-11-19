# World-Vision — Registre produits, sources, partenariats et revenus (décisions actionnables)
**Daté du 19 novembre 2026.** Tous les chiffres d'affaires ci-dessous sont des modèles à renseigner, pas des prévisions. **Ne pas fusionner ce document avec un état d'intégration technique.**

## 1. Principes commerciaux internationaux

Nous ne vendons pas « des réponses IA » : nous vendons du **temps économisé**, des **comparaisons vérifiables**, des **prix réellement proposés**, de la **surveillance continue**, une **notification pertinente**, des **décisions mieux documentées** et une interface qui revient utile chaque semaine. L'interface mondiale permet à chaque verticale de recruter ses propres utilisateurs puis de les fidéliser dans un même compte.
L'IA peut accélérer l'explication des preuves, mais les moteurs de collecte, stockage, vérification, notification et comparaison sont les fonctions irremplaçables.

Priorités mesurables : `activation` = premier parcours complet ; `retention` = retour volontaire ; `accuracy` = correspondance source/valeur ; `trusted_conversion` = action du client non manipulée ; `unit_economics` = marge nette après prix d'API, hébergement et support.

## 2. Cartographie des verticales et expériences à financer

| Verticale | Jobs-to-be-done | Données indispensables | Pilote démontrable | Monetisation candidate | Freins et risques |
|---|---|---|---|---|---|
| Money-Vision | Convertir, payer moins de frais, envoyer à la diaspora | Fixings horodatés, taux commerçants, frais, corridors et moyens de paiement | Alerte taux réel; puis comparer net reçu pour 500€ | Partenaires transferts transparents, Premium Watch, publicité discrète | Licence/termes fournisseurs, coûts cachés, parités fixes |
| Transport-Vision | Être averti quand un vol/train/bus baisse sous son budget | Offres datées, bagages, taxes, horaires, restrictions, itinéraires | Trajet A→B surveillé, dates flexibles, prix à revérifier avant clic | Affiliation billets/hôtels, Premium alertes flexibles, partenaires voyageurs | APIs commerciales et couverture incomplète, frais, droits de données |
| Tourisme-Vision | Savoir avant de partir : documents, météo, coût local, sécurité | Sources consulaires/officielles + transports + devises + infrastructures | Checklist pays de destination et traçabilité de version | Voyage/assurance/transport autorisés, Premium itinéraires multi-étapes | Mise à jour réglementaire, responsabilité juridique, fiabilité |
| Price-Vision | Savoir quand une référence devient moins chère | SKU/EAN, vendeur, prix net, stock, livraison, date | Historique multi-vendeurs d'une référence vérifiée | Affiliation e-commerce, alertes Premium, programme commerçants | Conditions marketplace, faux « prix barré », stock volatile |
| Panier-Vision | Optimiser un panier réel dans les commerces proches | Catalogues, magasin, géolocalisation approximative, unité, quantité, promos | Panier de dix produits avec prix total et preuve par magasin | Partenariats commerçants, Premium famille, API B2B consentie | Couverture et partage des données locales, biais de sélection, consentement |
| Trading-Vision | Centraliser calendrier macro, cours, risque, journal | Événements des banques centrales, calendrier, cotations sous licence | Tableau calendrier + risque & journal sans exécution | Premium spécialisé, logiciels partenaires autorisés | Finance réglementée, licences temps réel, trading à risque |
| Bourse Afrique Vision | Comprendre les marchés BRVM et autres, surveiller portefeuille | Cotations/volumes/dividendes, annonces d'émetteurs autorisées | Suivi de 5 titres sur historiques datés sous licence | Abonnement niche et espaces pros, affiliation conforme | Droits de redistribution, latence officielle, marques |
| Atlas pays/Core | Comprendre l'économie locale avec sources contradictoires | Instituts locaux, BEAC/BCEAO, IMF/ONU/BM/OECD et métadonnées | France/Gabon/CIV/USA/JPN avec preuve et statut coverage | Publicité mesurée, API B2B, premium pro | Catalogue ≠ ingestion ; comparabilité, périodes divergentes |
| Media/Radar | Repérer, vérifier et publier des faits vérifiables | GDELT, médias locaux/institutions, droits audiovisuels | Sujet associé à deux sources indépendantes et validation humaine | Sponsoring transparent, partenaires média, abonnements pros | Biais de couverture, copyrights, vérification humaine |

### Première coupe produit recommandée

**A.** Finir V2/une donnée officielle de bout en bout. **B.** Identité + moteur Watch persistant. **C.** Money-Watch avec prix informatif de change. **D.** Déclinaison Transport-Watch sur un fournisseur autorisé. **E.** Price-Watch ensuite, lorsque prix des offres identifiables. Cette progression réutilise le même moteur et expose des contraintes d'origine différentes sans promettre trop tôt toutes les géographies.

## 3. Fournisseurs et APIs : registre d'exploration, statut jamais simulé

`STATUT=` **À ÉTUDIER**, **DOCUMENTÉ**, **CONTRACTUALISÉ**, **TESTÉ AVEC QUOTA**, **EN PRODUCTION**, **SUSPENDU**. Ne passer à un statut supérieur que sur preuve GitHub/contrat et test réel.

| Catégorie | Source/piste | Documentation | Statut au départ | Ce qu'il faut vérifier avant intégration |
|---|---|---|---|---|
| Veille mondiale | GDELT 2.0 Events/Mentions/GKG | https://gdeltproject.org/data.html | DOCUMENTÉ, non branché à la V2 | Licence/attribution, dédup, 15min, biais, représentativité, usage commercial |
| Editorial | EarlyForge (benchmark du workflow) | https://docs.earlyforge.ai/ | DOCUMENTÉ, inspiration | Pas de présomption d'accès à son API ni à son modèle |
| Statistiques | Sources nationales et organismes régionaux du catalogue V2 | `docs/architecture/strategie-couverture-mondiale-sources-locales-et-regionales-2026-11-12.md` | CATALOGUÉ / couverture variable | Endpoints réels, licences et périodes, suivi d'ingestion par indicateur |
| Prix de produits | Open Food Facts | https://openfoodfacts.github.io/documentation/docs/ | À ÉTUDIER | Licence de données ODbL, attribution, conditions de partage, couverture des GTIN |
| Prix commerces | Open Prices | https://openfoodfacts.github.io/open-prices/ | À ÉTUDIER | Pays/magasins couverts, date, lieux, unité, prix de caisse, droits de republication |
| Billets avion | Amadeus Self-Service | https://admin.developers.amadeus.com/self-service/apis-docs/guides/developer-guides/faq/ | À ÉTUDIER | Tests vs production, limites et frais, prix revérifiés, éligibilité pays, consolidateur pour émission |
| Trains et bus | Agrégateurs/opérateurs licenciés selon région | Étude fournisseur requise | Aucun fournisseur choisi | Trains/bus internationaux fragmentés, ne pas promettre couverture mondiale |
| FX | Frankfurter déjà étudié pour convertisseur V2 | Référence dans `frontend/web-v2/src/api/fxApi.ts` | Code exploratoire existant | API live en production, fraîcheur, limites, statut non bancaire |
| Paiement/transfert | Fournisseurs de transfert réglementés | Contrats à obtenir par corridor | Aucun contrat | Frais finaux/FX net, autorisation affiliation, données personne |
| Actions BRVM | Bourse régionale, opérateurs de données licenciés | Droit spécifique requis | Non connecté | Accords, délai, marque, redistribution et intégrité des carnets/cours |
| Calendrier macro | Banques centrales et diffuseurs avec licence | Sources par zone | À construire | Datation, fuseau, révisions, consensus, coûts |

Un produit « mondial » doit afficher **les zones couvertes et non couvertes**, y compris le périmètre exact du fournisseur. Une donnée régionale partielle ne doit pas être affichée comme « tous les pays ».

## 4. Modèles de revenus — expérimentations falsifiables

### Publicité
Hypothèse et non promesse : `revenu_ads = pages_publicitaires_eligibles / 1 000 × RPM_net`.
Avant tout chiffre de revenu, relever audiences par pays, adblock, consentement, pages éligibles, coût CDN/cloud, RPM réellement encaissé, partage avec régie, impact UX. Une app utile ne doit pas devenir un labyrinthe publicitaire.

### Affiliation
`revenu_affiliation = visites_eligibles × taux_clic × taux_conversion × commission_nette × taux_validation`.
La commission nette dépend des remboursements, géographie, annulations et délais d'attribution. Tester sur de **vrais programmes approuvés**, divulguer « lien partenaire », séparer score qualité/ranking de la commission. Pas de liens inventés ni scraping abusif de tarifs.

### Premium
`ARR_brut = abonnés_payants × prix_mensuel × 12`; `marge_nette = ARR_brut - TVA/taxes - frais paiement - notifications - APIs - support - hébergement - réclamations`. Mesurer churn, taux activation et support par verticale avant de définir des prix. L'IA coûteuse et les notifications fréquentes nécessitent quotas.
Fonctionnalités premium qui se défendent : historique long, multi-surveillances à contraintes, alertes ciblées, suivi de paniers, portefeuille, outils Forex et données comparées sous licence. Éviter de faire payer une simple description de pays.

### Professionnels
API B2B, études régionales, export vérifiable, dashboards équipe, monitoring de marché, historique, usage facturé et SLA **après** licences et fiabilité. Ne pas vendre un texte généré par l'IA comme une donnée originale.

### Autres leviers
Partenariats institutionnels, service de tableaux économiques, accessibilité en langues locales, marque blanche ciblée, accords médias; tous conditionnés par qualité, droit des données, indépendance éditoriale et coût de maintien.

### Règles de déontologie
Pas de garanties de rendements Forex. Ne pas promouvoir un produit financier/régulé sans vérifier réglementation locale, publicité et éligibilité. Pas de données privées vendues à des annonceurs. Classement de produits fondé sur **coût net et qualité**, pas la commission. Conserver le droit de l'utilisateur de désactiver une alerte et supprimer ses informations.

## 5. Registre d'expériences de revenus

| Expérience | Pourquoi la tester | Indicateur de réussite | Stop/go |
|---|---|---|---|
| 1re alerte Money-Watch | Activer premier parcours sans API de billet coûteuse | % utilisateurs créant une alerte valide; % alerts pertinentes | Continuer si retour et coûts sous contrôle |
| Alerte vol flexible | Forte valeur perçue et potentiel réservation | Alertes cliquées qui révèlent un prix encore payable | Stop si tarifs obsolètes ou coûts API excessifs |
| Panier 10 références | Économie mesurable | Prix par EAN/unités réellement comparables et couverture magasin | Stop si couverture faible/fausses économies |
| Calendrier Trading + journal | Usage quasi quotidien | Journaux persistants, erreurs minimales et rétention | Aucun signal de rentabilité promis |
| Dossier pays + signal GDELT | Différenciation data/actualité | Événement vérifié, traçabilité et compréhension | Stop si faux positifs/news non sourcées |

## 6. Passage à l'échelle internationale

Lancer par corridors/flux pilotes **sans architecture centrée sur la France** : UTC, codes ISO 3166/4217, fuseaux IANA, langues et devises d'affichage, consentement juridictionnel, préférences de notification, formats de dates et unités. Les premières régions peuvent inclure France/Gabon/Côte d'Ivoire/USA/Japon pour tester l'hétérogénéité ; ne pas supposer qu'un même fournisseur couvre ces cinq marchés.
Architecture : un World-Vision Core mutualisé, données par domaine et statut de licence, surveillance indépendante de l'interface, jobs asynchrones bornés, quotas, cache selon type de donnée, logs sans données personnelles, backup vérifiée, API clairement publiques vs privées.
**Performance** : tirer parti du CDN pour les informations réellement cacheables, mais ne jamais cacher un prix volatil comme une offre payable sans revalidation.

## 7. Décisions non négociables et demandes ouvertes

- Ne pas développer simultanément toutes les verticales avant une première Watch réussie.
- Ne pas réécrire toute V2 ni fusionner en bloc les branches média ; préserver le globe validé et la charte graphque.
- Garder le registre institutions par pays et mesurer la couverture réelle ; aucune statistique inventée.
- Conserver un historique des décisions GitHub, tests et arbitrages. Chaque chat reprend à partir de `HANDOFF_CORE_F12B_2026-11-19.md`.
- Réviser les licences/provider pricing au moment de la mise en production ; leur documentation peut évoluer.
- Choix hébergement réel, coût mensuel autorisé, contrat partenaire et niveau de collecte sont des **décisions futures**, pas des faits accomplis.
