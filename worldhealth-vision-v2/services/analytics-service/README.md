# analytics-service

`analytics-service` est la premiere couche metier au-dessus du canonique
multi-source de WorldHealth Vision V2.

Il ne remplace ni `catalog-service` ni `timeseries-service`.
Il assemble leurs donnees, calcule des signaux explicables et expose des
contrats plus proches du produit :

- vue pays
- vue indicateur
- comparaison multi-pays
- syntheses de tendance et de divergence entre sources

Principes de conception :

- pas de score opaque
- pas de source unique imposee comme verite absolue
- calculs simples, explicables et auditables
- compatibilite avec une future couche ML plus tard
