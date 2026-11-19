# World-Vision V2 — F1.2b.1 : contrat international d'accès API
Date : 2026-11-19. Statut : **candidat sur branche**, pas de mise en production.

## 1. Situation de départ vérifiée

- La V2 canonique est la branche `v2` du dépôt `OBIANG5/World-Health-Vision`. Exclure les dossiers historiques V0/V1, même s'ils contiennent un site visuellement similaire.
- La PR #35 contient le premier contrat de qualité visuelle V2, validé en GitHub Actions mais encore brouillon.
- La PR #36 `security/v2-secure-staging-2026-11-19` contient le réseau de staging privé, les fichiers secrets, la sauvegarde et la restauration prouvées, également brouillon.
- La présente branche est **empilée sur le SHA de la PR #36** : `c9275c7602c29cfb74ff9ada54123bbbdeefdc64`. Une PR doit cibler cette branche tant que #36 n'est pas intégrée. **Ne pas fusionner cette branche directement dans `v2` en doublant les commits**.
- Les tests antérieurs ont mesuré ~736 Mio à vide pour cinq conteneurs, sans le Gateway, sans collecte massive ni utilisateurs ; ce n'est pas une capacité garantie.
- L'URL Vercel publique reste un aperçu statique : aucune API de production n'a été activée ici.

## 2. Pourquoi ce contrat est stratégique pour une plateforme internationale

Les fiches des pays, les statistiques, les sources et les comparateurs fondamentaux doivent être trouvables/utilisables par **n'importe quel visiteur**, sans obligation de compte. Les futures surveillances de prix, watchlists, journaux Forex, profils, paiements et préférences personnelles ne doivent jamais hériter accidentellement de cette autorisation.

Règle : **lecture publique de données sélectionnées, pas accès public au logiciel entier.** Une nouvelle route ajoutée demain ne devient pas publique automatiquement.

### Matrice d'accès

| Ressource | Visiteur anonyme | JWT valide | Justification |
| --- | --- | --- | --- |
| `GET /actuator/health` | Oui | Oui | Readiness minimale, sans détails ni métriques |
| Catalogue géographique, monnaies, sources | Oui si `WHV_PUBLIC_READ_ENABLED=true` | Oui | Référentiel public et provenance |
| Données temporelles publiées et taux de couverture | Oui si flag | Oui | Consultation publique, ne pas confondre avec live/temps réel |
| Vues économiques / pays / régions / continents | Oui si flag | Oui | Produit international |
| `POST /api/analytics/advisor/chat` | Non, 401 | Oui, sous réserve des quotas futurs | Éviter l'usage anonyme non plafonné |
| `GET /api/timeseries/source-runs` | Non | Non | Informations d'exploitation non publiques |
| `GET /api/**/readiness` | Non | Non | Détails techniques réservés à l'exploitation interne |
| `GET /actuator/prometheus`, `/actuator/info` | Non | Non | Télémétrie interdite à l'edge |
| `POST /internal/timeseries/ingestion/**` | Non | Non | Ingestion interne, hors Gateway |
| Routes futures `/api/users/**`, watchlists, paiements | Non | Non tant que non autorisées | Politique fail-closed par défaut |

Mode local explicitement autorisé : `WHV_SECURITY_ENABLED=false` dans `infra/docker-compose.yml`, exclusivement localhost.
Mode de staging : `WHV_SECURITY_ENABLED=true`, `WHV_PUBLIC_READ_ENABLED=false`; toutes les lectures listées sont privées tant que le flag n'est pas ouvert.
Mode public proposé : `WHV_SECURITY_ENABLED=true`, `WHV_PUBLIC_READ_ENABLED=true` **uniquement après** OIDC, HTTPS, quota, CORS, licences et audit.

Implémentation : `GatewaySecurityConfiguration.java` et `PublicReadRoutes.java`. Les 57 patrons GET sont explicites, pas de wildcard général `/api/**`. Une nouvelle fonction Money-Vision/Trading-Vision devra disposer de sa propre revue de sensibilité/licence.

## 3. Le contrat de sécurité est indépendant des licences

Une route publiquement lisible ne signifie pas qu'un flux externe (tarif de vol, cours BRVM, cotation FX sous licence, GDELT, Open Prices) est autorisé à la redistribution commerciale. Avant un nouveau connecteur, ajouter au registre de sources :
- titulaire des droits, source originale et modalité (officielle, partenaire, agrégateur) ;
- licence, redistribution, obligations d'attribution, restrictions de stockage et de durée ;
- pays et monnaies couverts, fraîcheur, date de collecte, période et unité ;
- statut de collecte (`CATALOG_ONLY`, `CONNECTED`, `INGESTED`) et dégradation documentée ;
- données personnelles ou non, base de traitement, règles de consentement et suppression.

Le futur moteur de suivi des billets et des produits doit **revalider le prix réellement payable** avant toute action. Une annonce GDELT est un signal rapporté, jamais une preuve institutionnelle.

## 4. Tests construits dans cette branche

`GatewayPublicReadIntegrationTest.java` emploie des serveurs HTTP simulés (aucune donnée inventée dans une page produit). Il contrôle :
- accès anonyme aux pays FRA/GAB/JPN et comparaisons sourcées ;
- transparence sur la disponibilité des séries ;
- routage réel vers la façade analytics et conservation du chemin transformé ;
- interdiction des métadonnées d'exploitation et des routes futures ;
- 401 lorsque l'utilisateur est anonyme, 403 si JWT valide mais permission refusée ;
- refus des mutations internes même avec un JWT ;
- Advisor POST exigeant une identité ; métriques non exposées.
Les tests `GatewaySecurityIntegrationTest` (staging privé) et `GatewayRoutingIntegrationTest` (développement explicitement non sécurisé) doivent continuer de fonctionner.

Workflow : `.github/workflows/whv-v2-gateway-access-contract.yml`. Il teste le **SHA candidat** sur Java 21, publie les rapports JUnit, vérifie le caractère explicite du mode local et le défaut sécurisé.

**Limites non couvertes** : JWT signé et révoqué par un vrai OIDC, scopes et droits multi-tenant, CORS sous HTTPS, rate limits anti-abus, WAF, charge concurrente, licences des données, CDN, cache et production. Ne pas transformer un test unitaire vert en promesse d'exploitation internationale.

## 5. Premières options d'hébergement vérifiées au 19/11/2026

Comparaison indicative, pas commande ni devis personnalisé :
- **OVHcloud VPS 2027** (France/UE) : l'offre publique affiche VPS-2 4 vCores / 8 Go / 75 Go NVMe à partir de 7,21 € HT/mois et VPS-3 6 vCores / 12 Go / 100 Go à partir de 10,40 € HT/mois. La sauvegarde standard annoncée conserve la dernière journée, insuffisant seul pour notre PRA. Source : https://www.ovhcloud.com/fr/vps/unmetered-vps/
- **Hetzner CX33** (UE) : la famille Cloud x86 propose 4 vCPU, 8 Go et 80 Go NVMe ; son catalogue français montre ponctuellement le produit « indisponible ». Les prix varient par localisation, IPv4/TVA/options ; **ne pas réserver sans devis courant et disponibilité réelle**. Source : https://www.hetzner.com/fr/cloud/cost-optimized/
- **Railway** : Hobby $5/mois, Pro $20/mois, abonnement incluant du crédit d'utilisation, puis facturation CPU/RAM/volumes/sortie réseau ; aucune instance World-Vision n'existait parmi les connexions inspectées. Une architecture avec plusieurs services toujours allumés nécessite une **simulation précise par service**. Source : https://docs.railway.com/pricing/plans
- **Vercel** : conserver la distribution frontend/CDN est cohérent ; l'offre Hobby est pour usage personnel non commercial selon ses conditions. Dès qu'affiliation, publicité ou abonnements commerciaux démarrent, vérifier/choisir un plan autorisé (souvent Pro) avant de monétiser. Source : https://vercel.com/legal/terms

Les tarifs **n'incluent pas** nécessairement TVA, sauvegardes chiffrées hors hôte, stockage brut des séries, domaine, emails, monitoring, frais de prestataires de données ou support. L'option la moins chère n'est pas forcément la plus fiable. Ne pas confondre 8 Go proposés et dimensionnement établi : CPU/RAM en pic, taille hypertables et restauration restent à mesurer.

**Orientation provisoire, non décision d'achat** : noyau de données européen unique et sauvegardes indépendantes, frontend diffusé mondialement ; ensuite isoler les charges (collecte asynchrone, Watch, média, trading) et introduire plusieurs régions sur preuves de trafic, de latence et de licences. Une machine seule n'offre pas une haute disponibilité mondiale.

## 6. Dimension internationale dès le départ

- Identifiants géographiques ISO 3166 et codification des subdivisions ; politique de délimitation des pays/territoires explicitée.
- Montants stockés en unité et devise ISO 4217 ; distinguer taux de référence, taux commercial, commissions et dates d'observation.
- UTC pour stockage, IANA time zones pour présentation ; dates statistiques distinctes des dates d'ingestion.
- Langue interface distincte de langue source ; traductions ne remplacent pas les documents originaux.
- Qualité de données par pays, avec possibilité d'afficher « couverture absente » ; ne jamais inventer des séries.
- Droit à la suppression des données personnelles, consentement et limitation du stockage selon RGPD/lois applicables, vérifiés avant collecte.
- Réduction de latence par cache et CDN, mais **aucune mise en cache longue sur les prix supposés actuels**.
- Identité unifiée future entre Money-/Travel-/Trading-/Bourse-/Media-Vision ; droits et quotas spécifiques par verticale.

## 7. Go / no-go : fin de F1.2b.1

- [ ] Tests de ce commit réussis, y compris public/privé, refus des opérations et compatibilité staging.
- [ ] Aucun nouveau service public ou ressource payante créé.
- [ ] Revue des risques (JWT, coûts, licence, abuse/rate-limit, cache).
- [ ] Document de reprise et PR en brouillon conservés.
- [ ] Approbation humaine avant fusion en cascade : PR #36 puis cette PR.

## 8. F1.2b.2 et la suite exacte

1. **Performance & dimensionnement** : ajouter le Gateway dans une CI isolée avec issuer OIDC factice local (tests uniquement) ; mesurer latence p50/p95/p99, mémoire CPU au démarrage et sous charges légères/modérées, et comportement en cas d'absence d'analytics.
2. **Sécurité opérationnelle** : vrai fournisseur d'identité, tests d'émission/révocation de JWT, CORS et limites d'appel par route, firewall egress, images soutenues épinglées, TLS.
3. **Sauvegardes complètes** : Flyway catalog + timeseries, hypertables et série témoin, restauration chiffrée hors-hôte et vérification automatique ; RPO/RTO réalistes.
4. **Comparatif financier final** : devis et coût total (24/7, stockage, sauvegardes, réseau, données, alertes), choix documenté de l'hôte et de la région UE.
5. **Staging réel** uniquement après l'accord sur le coût ; API accessible en HTTPS avec provenance vérifiée.
6. **F1.3** : un flux officiel réel passe institution → ingestion → DB → Gateway → site Vercel, puis premiers comptes et Watch (F1.4).

Ne pas confondre cette feuille de route avec un déploiement réalisé.
