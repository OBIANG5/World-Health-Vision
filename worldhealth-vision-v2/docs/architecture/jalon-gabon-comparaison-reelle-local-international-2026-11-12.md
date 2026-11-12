# Jalons V2 du 12 novembre 2026 — preuve nationale Gabon ↔ Banque mondiale

**État : vérifié dans GitHub Actions, intégré à la branche canonique `v2`.**

**But métier** : une information officielle locale ne doit pas être cachée
par une estimation internationale potentiellement moins récente. Inversement,
une donnée nationale récente ne doit pas être déclarée automatiquement plus
fiable ou parfaitement comparable. WorldHealth Vision doit présenter
**les deux publications, leur contexte et leurs limites**.

## Vérification réelle de bout en bout

- Run officiel de données WDI :
  https://github.com/OBIANG5/World-Health-Vision/actions/runs/43262518055
- Audit strict V2 Java, Python, TypeScript, Docker :
  https://github.com/OBIANG5/World-Health-Vision/actions/runs/43262517804
- Branche de développement ayant servi au contrôle :
  `improve/v2-country-national-comparisons-2026-11-12`
- Commit testé et fusionné : `1e35f27371fd9d9ac38b5c51fb459c2ae4d50c38`.

### Résultat observé dans les logs d'exécution

| Source | Référence | Valeur |
| --- | --- | ---: |
| INSTAT Gabon, RGPL, population résidente, publication préliminaire homologuée | 2026 | 3 518 621 personnes |
| Banque mondiale, `SP.POP.TOTL`, **vraie série WDI publiée en base temporaire** | 2025 | 2 593 130 personnes |

Le job GitHub a téléchargé une série Banque mondiale sur l'indicateur
`SP.POP.TOTL` pour le pays `GAB`, écrit **au moins une observation
canonique** dans TimescaleDB (condition contrôlée par `upsertedCount > 0`),
puis relu la valeur WDI 2025 par
`GET /api/timeseries/series/latest`.

La réponse `GET /api/product/countries/GAB/national-comparisons`,
accessible par la passerelle, a retourné :
- `status = DIFFERENT_REFERENCE_PERIOD` ;
- `localReferenceYear = 2026` ;
- `internationalLatest[WORLD_BANK].periodLabel = 2025` ;
- `internationalLatest[WORLD_BANK].numericValue = 2593130.0` ;
- `numericalDifference = null` ;
- `comparableByMethod = false`.

L'écart arithmétique **ne permet pas d'affirmer que l'une des
institutions a tort** : les années, la source statistique primaire, la
méthode et les révisions restent à examiner. La statistique nationale
est une **publication documentée**, pas une valeur injectée
manuellement dans TimescaleDB.

## Limites à conserver dans toutes les interfaces et le média

1. La base de cette exécution était **éphémère** et a été supprimée
   à la fin du test. Il n'existe pas de base durable de production démontrée.
2. Les archives WDI CSV officielles ne fournissent pas le même niveau
   de qualification par observation que toutes les interfaces
   internationales : le connecteur conserve un avertissement de qualité.
3. Le dernier millésime WDI dans le run était 2025, mais la dernière
   révision affichée par la Banque mondiale peut changer.
4. Les chiffres locaux ont été documentés à partir des publications
   de l'INSTAT et de l'Agence gabonaise de presse. Ce ne sont pas deux
   recensements indépendants.
5. Les institutions nationales pour les autres pays ne sont **pas encore
   recensées exhaustivement** ; l'API doit annoncer honnêtement la
   couverture documentée pour chaque pays.
6. Aucune conclusion journalistique, accusation de manipulation ou
   publication automatique n'est autorisée par ce seul écart.

## Tests réels et non réels

- 31 tests Java réussis ;
- 52 tests Python Analytics réussis ;
- 29 tests Python Ingestion réussis ;
- frontend compilé en TypeScript/Vite ;
- conteneurs Docker V2 validés, dont la route publique.
- Les tests unitaires utilisent des **fixtures**, strictement séparées du
  run réel WDI référencé plus haut.

## Prochain jalon responsable

Construire le **référentiel mondial de sources locales** avec
identification, vérification, acquisition, licence et suivi des révisions
pays par pays, puis mettre en place une infrastructure persistante et
un traitement d'actualisation. Une source enregistrée dans un catalogue
n'est pas encore un connecteur de collecte automatisée.

Toute évolution doit rester testée sur une branche de travail puis
intégrée à `v2` seulement après contrôle. Les versions historiques
V0/V1 ne doivent pas être modifiées.
