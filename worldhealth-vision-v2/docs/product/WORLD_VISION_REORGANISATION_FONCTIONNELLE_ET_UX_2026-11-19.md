# WORLD-VISION — Réorganisation fonctionnelle, expérience internationale et plan de livraison

**Décision : 19 novembre 2026.** Pilotage produit, pas inventaire de fonctions existantes.
**Source stratégique de référence :** les documents
`docs/product/STRATEGIE_INTERNATIONALE_WORLD_VISION_MASTER_2026-11-19.md` et
`docs/product/REGISTRE_PRODUITS_SOURCES_REVENUS_PRIORITES_2026-11-19.md`
sur la branche expérimentale backend de la [PR #59](https://github.com/OBIANG5/World-Health-Vision/pull/59).
**Important :** cette branche frontend découplée part de la [PR #35](https://github.com/OBIANG5/World-Health-Vision/pull/35), pas de la chaîne #36→#59 : les documents maîtres n'y sont pas encore physiquement fusionnés.
Le programme de performance jusqu'au niveau international est archivé dans [l'issue #63](https://github.com/OBIANG5/World-Health-Vision/issues/63), et reste relançable quand il devient un prérequis concret. **Ne pas fusionner automatiquement**.

## 1. Repositionnement du produit

Le nom de l'écosystème est **World-Vision** (« Voir le monde, le comprendre. »). **World Health Vision V2** devient l'Atlas et le noyau de données d'un ensemble plus grand, pas la seule identité visible.
Le différenciateur n'est pas une conversation générant des réponses : c'est la collecte sous droits, la traçabilité, la comparaison, l'historique, les surveillances persistantes, la notification, la vraie offre transactionnelle et la prise de décision avec preuves.

Le globe avec œil, océans bleus/cyan, terres vert/ocre et arcs bleus est **préservé** comme entrée Atlas, pas remplacé par une autre maquette. L'écosystème ne doit pas être une page aux dizaines de faux boutons « bientôt ». Toute fonction est étiquetée **explorable / outil existant partiel / prévu** selon l'état réel vérifiable.

## 2. Carte fonctionnelle complète : ce qu'un utilisateur doit pouvoir faire

| Produit | Parcours réellement différenciant cible | Point de départ existant | Dépendance critique |
| --- | --- | --- | --- |
| **Atlas Vision** (World Health Vision V2) | Sélectionner pays/région, lire données et institutions locales, comparer ONU/FMI/BEAC/BCEAO/autres, périodes, révisions et désaccords | Globe interactif, catalogue pays, fiches et outils d'indicateurs | Ingestion institutionnelle réelle, droits, exactitude, disponibilité |
| **Global Radar** (GDELT) | Suivre des mentions par lieu/acteur, dédoublonner, regrouper sujets, attribuer des niveaux de preuve et renvoyer vers pays/Watch/Média | Architecture et recherche documentées, pas de pipeline V2 actif | Licences, faux positifs, sources locales et revue contradictoire |
| **Watch Vision** (moteur transversal) | Définir une règle, observer dans le temps, recevoir une notification unique et retraçable, gérer préférences/opt-out | Favoris locaux V2 seulement, pas Watch persistant | Authentification, règles, scheduler, outbox, délivrabilité, consentement |
| **Money Vision** | Convertir, comparer montant net de transfert après frais, surveiller un corridor EUR→XAF/XOF/etc | Convertisseur V2 exploratoire | Taux de référence datés ≠ offre transactionnelle ; vrais fournisseurs |
| **Transport Vision** | Comparer avion/train/bus avec dates flexibles, prix final/taxes/bagages et réserver après revalidation | Parcours voyage V2 non transactionnel | Fournisseurs autorisés, quotas et offres réservables |
| **Tourisme Vision** | Préparer pays/itinéraire, documents, sécurité officielle, coût local et checklist versionnée | Voyage/destination/expat V2 exploratoires | Institution officielle par juridiction, date et responsabilité |
| **Price Vision** | Rechercher référence/EAN, afficher prix et stock observés, comparer marchands, suivre baisse prouvée | Aucun moteur commercial actif | Catalogues et droits, identifiant produit, prix vérifiés |
| **Panier Vision** | Composer 10 références, unités et quantités, optimiser coût total/transport selon magasins réels | Aucun panier local vérifié | Couverture magasin, unités, prix par lieu et date |
| **Trading Vision** | Calendrier macro, banques centrales, FX, volatilité, corrélations, gestion du risque et journal | Idées et objectifs métier, **pas** terminal en production | Licences cotations, calendrier, sécurité des comptes, conformité |
| **Bourse Afrique Vision** | BRVM/dividendes, historiques sourcés, titres, watchlists et événements d'émetteurs | Vision stratégique, flux officiel non redistribué | Droit de redistribution et fraîcheur de données |
| **World-Vision Média** | Dossier journalistique source→vérification→script/article/visuel/voix/vidéo→validation→publication | Développé dans des **branches média/voix distinctes** | Contrôle éditorial humain, droits médias, continuité charte |
| **Compte & Identité** | Un même compte pour toutes les Visions, permissions, pays, devises, langues, notifications, données RGPD | Profil local exploratoire (pas authentification unifiée) | JWT/scopes, consentement, suppression, facturation future |
| **Sources & confiance** | Registre institutionnel par pays et indicateur, couverture réelle, licence, observations, révisions et erreurs | Méthodologie + références 217 pays/22 sources dans le catalogue | SOURCE CATALOGUÉE ≠ SOURCE INGÉRÉE ≠ VALEUR VÉRIFIÉE |
| **Observatoire & administration** | Santé des connecteurs, coûts, latence, qualité, alertes sur dérives, validation de sources et gouvernance | Métriques et outils internes de tests, pas console produit unifiée | Autorisations et cloisonnement Admin / public |
| **Professionnels / B2B** | Export de données redistribuables, API, dashboards équipe, rapports sourcés et quotas | Hypothèse commerciale | Contrats de redistribution, SLA, sécurité et coût démontrés |

Extensions de recherche **non prioritaires** : immobilier, retraite/expatriation, comparaisons de niveau de vie, emploi, éducation, mobilité urbaine, diaspora et sécurité voyageurs. Garder les outils déjà présents sans les faire passer pour des offres complètes.

## 3. Architecture de navigation visée

- **World-Vision (accueil)** : proposition de valeur, accès rapide à une action réelle, état des produits, recherche universelle, couverture honnête ; ni écran vide ni course aux clics.
- **Atlas** : globe, pays, continents, institutions, chiffres sourcés, historique, comparateur d'indicateurs, divergences, contexte événements vérifiés. Toujours garder la Terre interactive.
- **Surveiller** : Watch comme moteur transversal, suivi de règles/personnalisations, événements récents et notifications prouvées.
- **Comparer** : Money, Transport, Tourisme, Price/Panier ; résultats avec unités, montants nets, périodes, frais, disponibilité.
- **Marchés** : Trading, BRVM et finance macro. Pas de cotations fictives ni promesses de rendement.
- **Comprendre l'actualité** : Global Radar + Média mais interfaces éditoriales et autorisations distinctes, pas de fusion naïve des branches.
- **Confiance** : source locale, méthode, licence, statut `DISCOVERED/CATALOGUED/ACCESS_APPROVED/CONNECTED/INGESTED/VERIFIED/DEGRADED/REVOKED`, traçabilité, corrections et comparabilité.
- **Personnel** : identités et abonnements seulement quand développés et sécurisés. L'historique/Watch personnels ne doivent pas être considérés persistants avant preuve.

Sur **mobile**, privilégier une action principale visible, un menu cohérent, une sélection de pays simple, le globe manipulable et des panneaux sans débordement. Sur desktop, navigation latérale ou barre adaptée aux tâches, panneau pays/produits et globe conservé. Concevoir avec traduction FR/EN présente, puis internationalisation sémantique (IANA, ISO 3166/4217, régions et langues locales) ; clavier, contraste, tailles touch, état chargement/vide/indisponible.

## 4. Séquence des livraisons — chacune testable comme un vrai produit

### UX-0 — Entrée mondiale et répertoire fiable (EN COURS sur cette branche)
- Nouvelle identité d'en-tête **World-Vision**.
- 11 produits dans un registre typé FR/EN, catalogue consultable/recherchable/filtrable, détails des limites, vrais liens vers Atlas/convertisseur/destination/favoris/sources.
- Historique des styles du globe et de la charte cyan/bleu préservé ; responsive 390px / desktop, Escape, clavier, focus, pas de backend simulé.
- **Critère GO** : compilation + tests sur vrai React/Chrome et aucune régression du globe ni de ses fiches. Les outils prévus restent explicitement non ouverts.

### UX-1 — Navigation durable et homepage modulaire
- Routes et URL partageables, recherche globale multi-entités, filtres, navigation principale cohérente et compatible écrans tactiles, favoris accessibles.
- Design tokens, typographies, états source, skeletons, navigation accessible, accessibilité WCAG à tester (ne pas prétendre certifié).
- Chaque entrée correspond à un module réel, un aperçu encadré ou un document de capacité honnête ; aucune CTA inerte.

### DATA-1 — Première observation institutionnelle réelle de bout en bout
- Prouver **un connecteur national autorisé** avec raw payload, révision, périodicité, ID source et licence. Test initial Gabon/France/Côte d'Ivoire/États-Unis/Japon selon accès réel ; **ne jamais fabriquer le chiffre**.
- Interface « registre des sources » et « couverture réelle » par pays+indicateur, y compris source absente, stale ou invalide.
- Synchronisation source→ingestion→Timeseries→Analytics→Gateway→fiche pays, avec comparateurs contradictoires et années alignées.
- GO si source originale, date, valeur, qualité, historique, licence et statut sont affichés et testés.

### WATCH-1 — Moteur de surveillance générique, persistant
- Une WatchRule `id, owner, type, conditions, consent, cadence, expiration`, Observation, Evaluation, NotificationOutbox, DeliveryReceipt et idempotence.
- Gestion horaire, doublons, quotas, opt-in/opt-out, backoff, rebonds et reprise après redémarrage. Test réel d'une première alerte utiles et livraison confirmée.
- GO si la règle fonctionne sans que la page reste ouverte, et si son utilisateur peut la supprimer/arrêter.

### MONEY-1 puis TRANSPORT-1 puis PRICE/PANIER-1
- **Money** : source FX de référence datée → Watch; ensuite transfert réel par corridor avec montant net reçu et frais contractuellement vérifiés.
- **Transport/Tourisme** : première route avec vraie offre légale (taxes et bagages), revalidation avant clic/réservation, Watch trajets flexibles et checklist officielle datée.
- **Price/Panier** : identifiant EAN/SKU, prix observés par magasin, unités et frais comparables, historique, panier de dix articles et disponibilité prouvée.
- Commencer chaque verticale par **un parcours de haute qualité**, puis étendre à plusieurs pays ; ne pas lancer simultanément des dizaines de cartes vides.

### FINANCE-1 & AFRICA-1
- **Trading** : calendrier économique contrôlé, journal et risque avant prix temps réel/exécution ; conformité et financement par fournisseur.
- **BRVM** : contrat d'usage des cotations, historique limité pilote puis watchlists/dividendes/portefeuille ; sinon rester en étude.

### RADAR-1 & MÉDIA-1 (Piste éditoriale coordonnée, indépendante)
- Démarrer GDELT par mentions datées, clusters dédoublonnés, score d'intérêt **non confondu avec confiance**, revue indépendante et dossiers de sources.
- Ponts d'interface : associer dossiers vérifiés aux pays, observatoires et Watch; transmettre seulement les cas validés au contenu Média/vidéo/blog.
- Garder les **branches média et voix distinctes**, aucune publication automatique fondée uniquement sur GDELT.

### OPS-1, PARTENARIATS et REVENUS (au bon moment)
- Connecteurs, coûts par source/pays, sauvegarde et restauration, politique pays/territoires, mTLS, quotas, audits et légalités.
- Gratuit utile → Premium Watch/history → affiliation divulguée seulement sur vraies offres → B2B/API redistribuables sous contrat → pub secondaire et média financé séparément.
- Mesurer activation, rétention J7/J30, taux d'alertes utiles, coûts API/1 000 observations, conversion vérifiée, marge après tous frais. **Aucune recette ni conversion fictive**.

## 5. Programme technique mis en veille (non abandonné)

Issue [#63 — fiabilisation internationale intégrale](https://github.com/OBIANG5/World-Health-Vision/issues/63) :
paliers 0/4/6/8/12 et multi-réplicas; files bornées/annulations/fairness; mémoire/SQL/Hikari/JSON et compression; fixture hétérogène 50 pays; budget et quotas; sécurité/identités réseau; monitoring, CI Maven; sauvegarde et restauration; SLO mesurés sur charge et données réelles. PR #59 candidate validée en CI, **cap 8 OFF en production**. Reprendre ces lots lorsqu'un besoin produit le justifie, sans empêcher les parcours de valeur.

## 6. Décisions et interdits

1. Branche UI indépendante de `v2` public et de la pile backend PRs #36→#59 ; base PR #35 tant qu'elle reste candidate.
2. Ne jamais fusionner automatiquement, ne pas déployer Vercel/Pages ni engager dépenses sans validation.
3. Ne pas toucher ni intégrer en douce les branches média/voix ou V0/V1.
4. Ne pas présenter **217 territoires catalogués** comme couverture réelle, ni **22 sources référencées** comme 22 connecteurs vérifiés.
5. Pas de chiffres officiels inventés, de rendements promis, de fournisseurs intégrés fictivement, de prix « live » non revérifiés, ni de données sous licence redistribuées sans accord.
6. Préserver intégralement l'histoire du projet, les statuts, la progression et les chantiers différés dans GitHub.
7. Documenter à chaque étape : code réellement ajouté, limites, tests sur SHA final, captures iPhone/desktop, PR DRAFT, prochain jalon, et décision GO/NO-GO.
