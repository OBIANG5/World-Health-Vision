# F1.2b.2d-1 — preuve de concurrence réelle sur 12 pays SYNTHÉTIQUES

**GitHub PR #57, 19 novembre 2026 — test d'infrastructure jetable, aucun déploiement.**
Issue de qualification internationale #56. Dépendance directe PR #55 / quatre batchs actifs + panne/reprise. Branche `test/v2-optimized-dense-concurrency-2026-11-19`, ne pas fusionner directement sur `v2`.

## Méthode (reproductible)

- Code `infra/tests/benchmark_optimized_dense_concurrency.py` : vrai FastAPI dans Analytics, non `AnalyticsService` simulé, quatre flags batch ON par overlay Docker CI, origine loopback privée ; aucun endpoint Internet ni donnée réelle.
- Fixture SQL générée `sql_profile_build_fixture.py` + `sql_profile_dense_fixture.sql` : **12 pays x 54 profils économiques canoniques x 4 sources x 24 années x 2 versions = 124 416 observations brutes / 62 208 dernière révision**. Source/fetchedAt, statut et valeurs clairement marqués SYNTHETIC.
- Après échauffement FRA, cinq paliers de concurrence **1/2/4/8/12**, **12 snapshots par palier** (un par pays) = 60 par run. Chaque réponse vérifiée HTTP 200, `lensCount=54`, 200 comparaisons et 270 preuves ; SHA256 du JSON entier hors seul generatedAtUtc doit rester stable par pays entre paliers.
- Mesure de `wall_time_ms`, p50/p95/p99 *des 12 réponses par palier* (descriptifs, pas SLO statistique), réponse JSON octets (non compressée), échantillons asynchrones `docker stats` pour quatre services, métriques HTTP réelles. Échec si l'un des 60 JSON est incomplet ou incohérent.
- Workflow `.github/workflows/whv-v2-optimized-dense-concurrency.yml` exécuté sur Ubuntu GitHub Actions avec base de données non publiée; volumes/secrets détruits; rapports JSON archivés 90 jours.

## Preuves des deux CI SUCCESS sur le SHA exécutable `e8bd5b174384e09de19189d31ef11cb1378f8a9e`

1. Run https://github.com/OBIANG5/World-Health-Vision/actions/runs/44535824959, artefact https://github.com/OBIANG5/World-Health-Vision/actions/runs/44535824959/artifacts/14536631372 .
2. Run https://github.com/OBIANG5/World-Health-Vision/actions/runs/44536007880, artefact https://github.com/OBIANG5/World-Health-Vision/actions/runs/44536007880/artifacts/14535358789 .
3. Les deux ont fait **60/60 réponses HTTP 200 chacun**, empreintes invariantes par pays sur les cinq charges, mêmes données et preuves. Le contrôle des métriques démontre 61 opérations batch par type (60 runs et un warmup), zéro fallback historique N+1.
4. Temps pour 12 pays (ms), run 1 / run 2 : 
   - 1 actif : **3536,127 / 4136,893**
   - 2 actifs : **2789,512 / 3284,259**
   - 4 actifs : **2640,095 / 3075,782**
   - 8 actifs : **2636,088 / 3015,370**
   - 12 actifs : **2668,125 / 3092,240**
5. Latence *individuelle* p50 (ms), run 1 / run 2 : 1 actif **286,699/312,868** ; 2 actifs **458,709/537,527** ; 4 actifs **833,637/918,503** ; 8 actifs **1675,106/1667,071** ; 12 actifs **2426,658/2811,259**. Le p95 à 12 actifs atteint **2662,721/3084,877 ms** mais seulement 12 échantillons par palier. Pas de p99 SLA.
6. Taille JSON moyen par synthèse **174 440,5 octets**, maximum **174 766 octets**. Ce chiffre reflète les quatre sources et le niveau de preuve SYNTHÉTIQUES, pas le maximum pour toutes les institutions internationales.

### Relevés de ressources Docker — maxima échantillonnés, PAS des pics certifiés

| Service | CPU max Run 1 | RAM max Run 1 | CPU max Run 2 | RAM max Run 2 |
| --- | ---: | ---: | ---: | ---: |
| Analytics/Python | 69,1 % | 174,5 MiB | 95,8 % | 184,3 MiB |
| Catalog/Java | 31,8 % | 294,6 MiB | 62,3 % | 320,6 MiB |
| Timeseries/Java | 226,2 % | 347,7 MiB | 239,1 % | 392,0 MiB |
| Timescale/PostgreSQL | 241,7 % | 350,9 MiB | 224,0 % | 344,6 MiB |

Seulement 6–7 `docker stats` par service sur le test ; les échantillons CPU sont multi-core (donc >100 % possible), pas des budgets ni une mesure Hikari. **Ces chiffres orientent l'expérience suivante, sans attribuer prudemment la causalité à SQL ou Java seul.** Sous charge, temps global plateau vers 4–8 tâches, alors que le temps individuel croît.

## Interprétation et go/no-go

**Démontré** : les quatre batchs actifs peuvent répondre pour 12 pays SYNTHÉTIQUES sous concurrence 1–12, maintenir la même sémantique et les références de source, sans fuite de codes source/pays comme labels; les réponses ne sont pas à taille négligeable.

**Non démontré** : p95/p99 stable pour milliers d'utilisateurs, base 217 pays réellement ingérée, latence intercontinental, coût de régénération, nouvelles institutions, droit de redistribution, vraie auth entre services, haute disponibilité 24/7, débit maximum cloud, charge d'ingestion concurrente.

**Prochaine étape strictement prioritaire (#56)** : instrumenter Hikari/JDBC/Timeseries (connexions occupées/en attente, temps SQL, mapping, queue) et parsing JSON, puis tester A/B même runner sur sources hétérogènes/volumes 50 pays. Ne pas réduire aveuglément la concurrence ni créer des caches périmés. Examiner le payload maximum 54×600 et implémenter une borne de bytes + pagination si nécessaire. Traiter la sécurité interservices, quotas, backup/restauration et contrats des sources avant un staging exposé.

Maintenir #42/#48/#56 ouverts jusqu'aux preuves. PR #57 reste DRAFT en chaîne, flags OFF par défaut, V0/V1/média/voix/Vercel inchangés, aucun achat. Les stratégies GDELT, EarlyForge, Watch, Money, Transport, Price, Trading, BRVM, monétisation sont conservées dans les deux documents maîtres de #41 ; aucune promesse de service mondial fonctionnel sans données réelles.
