# WorldHealth Vision V2 — audit de disponibilité des institutions nationales

**Date : 12 novembre 2026.** Ce document concerne uniquement le
projet logiciel V2, dans `worldhealth-vision-v2/`.

## Mission

Vérifier sans aspirer de données si les pages d'accueil des institutions
nationales et régionales **réellement inscrites dans le catalogue**
répondent à une requête HTTP légère. Ce n'est **pas** un détecteur de
nouvelles statistiques, un moteur de revue journalistique, un connecteur
de données ni une publication automatique.

C'est la première brique d'observabilité du **répertoire national** :
la fiabilité de l'adresse d'une institution et la fiabilité de ses
statistiques sont deux questions différentes.

## Composants

- `services/ingestion-service/src/ingestion_service/source_availability_audit.py`
  : client en lecture seule, déduplication des institutions régionales,
  filtre strict d'hôtes HTTPS, requête `HEAD` unique par organisme,
  classification prudente des réponses et sortie JSON.
- `services/ingestion-service/tests/test_source_availability_audit.py`
  : contrôle des URL refusées, absence de redirections suivies, respect
  de `HEAD`, statuts HTTP, absence d'invention de données, BEAC
  partagée, erreur de catalogue et pagination incomplète.
- `.github/workflows/whv-v2-country-local-source-availability.yml`
  : test reproductible sur une base de données temporaire, dans GitHub
  Actions, et rapport JSON conservé **14 jours**.

Le mécanisme charge les pays dans
`GET /api/catalog/local-sources/coverage`, puis leurs institutions
dans `GET /api/catalog/countries/{ISO3}/local-context`. Il demande
chaque site d'organisme **une fois**, même lorsque l'organisme est
compétent dans plusieurs pays.

**Périmètre de la première exécution réelle : neuf organismes
distincts**, applicables à neuf pays différents. La BEAC a été
interrogée **une fois** et reliée dans le rapport aux six membres
de la CEMAC ; ce résultat ne signifie pas que ces six pays
possèdent tous un institut national de statistique renseigné.

## Exécution GitHub vérifiée

- **Tests et requêtes réels sur les pages officielles :**
  https://github.com/OBIANG5/World-Health-Vision/actions/runs/43270771265
- **Audit complet Java, Python, React et Docker sur le même commit :**
  https://github.com/OBIANG5/World-Health-Vision/actions/runs/43270770873

Résultats de l'exécution du 12 novembre 2026 :
- **8/9** sites : `SITE_RESPONDED` ;
- **1/9** site : `ACCESS_RESTRICTED` — **Banque de France**, réponse HTTP 403 au contrôle `HEAD`, sans conclusion sur l'accès ordinaire au site ;
- **0** hôte non autorisé ;
- **20** tests du module de disponibilité confirmés réussis dans GitHub Actions ;
- **49** tests d'ingestion Python réussis dans l'audit global.

**Attention :** `ACCESS_RESTRICTED` (401/403) ne signifie pas que
l'institution ou sa base statistique est inaccessible au public. Cela
peut provenir d'une politique de filtrage des robots. Le rapport JSON
conserve le détail par organisme dans l'artefact
`whv-v2-country-source-homepage-availability` du workflow.

## Sécurité et interprétation

1. Les URL proviennent du catalogue V2 ; un nom de domaine
   institutionnel doit **aussi figurer dans la liste de confiance
   revue dans le code** avant toute requête publique.
2. HTTPS obligatoire, aucun identifiant utilisateur dans l'URL,
   aucune requête vers `localhost`, les plages IP internes ni un
   domaine non approuvé.
3. **Aucune redirection suivie automatiquement.** Une nouvelle URL
   est seulement rapportée pour revue humaine, si elle satisfait
   elle-même aux restrictions.
4. Une seule requête `HEAD` par institution, délai court, pas de
   corps de réponse téléchargé ni de ré-exécution agressive.
5. `401/403` = accès restreint ; `405/501` = méthode non prise en
   charge ; `429` = limite de trafic ; `5xx` = anomalie serveur ;
   `3xx` = redirection à examiner.
6. **Un HTTP 200 ne signifie pas** qu'un chiffre est exact, que
   les données sont gratuites, ou qu'une nouvelle publication existe.
7. L'absence de réponse à cet audit ne doit pas automatiquement
   retirer une institution du catalogue ni déclencher une alerte
   médiatique sur une crise nationale.

## Exécution manuelle depuis un environnement qui dispose de Docker

Démarrer les services catalog-service et gateway-service à partir de
`worldhealth-vision-v2/infra/docker-compose.yml`, puis lancer :

```bash
pip install -e './worldhealth-vision-v2/services/ingestion-service'
python -m ingestion_service.source_availability_audit \
  --catalog-base-url http://localhost:8080 \
  --output reports/country-source-homepage-availability.json
```

Le moyen le plus simple pour un contrôle sans installer localement
PostgreSQL et Docker reste le lancement manuel du workflow dans l'onglet
**Actions** du dépôt. Il crée son propre environnement puis le détruit.
Ce workflow n'est **pas une supervision 24/7**, et n'est pas programmé
sur une récurrence à ce stade.

## Prochaines étapes

1. Faire examiner les réponses restreintes ou redirigées par un humain
   avant toute modification du répertoire institutionnel.
2. Relier une première institution nationale à un **jeu de données
   explicitement autorisé à la réutilisation**, avec API ou export
   officiel, puis tester l'ingestion et la provenance.
3. Préparer ensuite des notifications de **nouvelle publication**
   à partir de sources/flux officiels vérifiés, distinctes des alertes
   de disponibilité réseau.
4. Mettre en place un stockage persistant des runs et des révisions,
   ainsi que l'infrastructure de suivi régulier, une fois sécurité,
   licences, journaux et alertes prêts.
5. Pour le futur média World-Vision, exiger validation humaine avant
   toute interprétation éditoriale et toute publication.
