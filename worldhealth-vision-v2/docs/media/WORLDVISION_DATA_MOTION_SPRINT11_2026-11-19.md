# WORLD-VISION MEDIA — Sprint 11 : DATA Motion international et séries chiffrées
**Date : 19 novembre 2026. Branche de développement :** `feature/worldvision-data-motion-sourced-charts-2026-11-19`.
**Parent architectural :** `feature/worldvision-photo-multilayer-motion-tracks-2026-11-19` / PR #80. **Branche dédiée, aucun merge sur V2, aucun déploiement.**

## 1. Continuité artistique : pourquoi le pack DATA

La demande originale reposait sur deux vidéos de références (une vidéo finance « Bourse Express » ~94,6s et une vidéo géopolitique/cartographie ~59,5s), plus l'image-signature œil/globe lumineux. Le propriétaire demande des **compositions vivantes avec plusieurs motions simultanées**, jamais des captures/slides fixes. La série de sprints GEO (#44→#72→#74), puis PHOTO (#80) a posé le principe : **source vérifiable → pistes indépendantes → Player réel → MP4 réel → analyse des pixels et du son → décision éditoriale**.

Le pack DATA ajoute les capacités cruciales de la référence finance **sans réinventer de statistiques**. Aucune connexion cachée à la Bourse, aucune variation inventée, aucune valeur "live" supposée. Tout est fourni explicitement et peut être comparé à une source originale par le journaliste.

## 2. Grammaires de DATA Motion réellement développées

Trois graphies sont intégrées dans un seul nouveau template `data_story` partagé `CreativeEdit.tsx` :
- **Line / évolution temporelle** : série datée chronologique, projection SVG pure contrôlée, axes chiffrés et intervalle d'échelle visible, tracé dessiné progressivement, point final valorisé, libellés premier/dernier temps.
- **Ranking / classement** : barres comparatives avec valeur fournie, axe partant obligatoirement de zéro, ordre décroissant déterministe avec **ex æquo ayant le même rang** (et pas de faux ordres attribués aux valeurs égales), animation séquencée.
- **Heatmap / intensité** : cases contenant chacune **leur valeur exacte**, opacité calculée explicitement dans un domaine commençant à zéro, légende chiffrée et révélation progressive. Ici "heatmap" est une grille de catégories, **pas une carte géographique prétendument exacte**.

Pour ces trois modules : entrée des titres, apparition de la grille, tracé/barres/cases, chiffre/clé, interprétation écrite et source/date ont des **timings distincts et déterministes**. Le module purement mathématique `data-motion-engine.mjs` (+ typage `.d.mts`) est partagé entre les sorties Chromium et H.264. Une vraie photo licite peut être importée en arrière-plan discret ; elle n'est ni obligatoire ni fabriquée.

## 3. Contrats de vérité / source / honnêteté numérique

`creative/validate-project.mjs` refuse :
- nombre de points incohérent selon la grammaire : courbe 3–16 observations, ranking 3–8, heatmap 4–12 ;
- unités absentes du contrat, valeur non finie, étiquette vide ou doublon, chiffre excessif ;
- chronologie mal ordonnée, date invalide (dont 30 février), date de source antérieure à la dernière observation ;
- échelle explicite incapable de contenir toutes les données, ou axe tronqué caché pour ranking/heatmap (minimum **0 obligatoire**) ;
- provenance absente (organisme, indicateur, date), URL prétendument de source non HTTPS quand fournie ;
- vidéo non autorisée comme fond cartographique, confusion GEO/PHOTO avec DATA.

La courbe **peut afficher une plage min/max autre que zéro**, mais cette plage est publiquement écrite à l'écran. Ne pas orienter la lecture par une coupe d'axe dissimulée. La validation garantit la forme et la cohérence de la donnée **fournie** ; elle ne certifie pas son exactitude économique ni l'authenticité d'un organisme saisi.

`source:{publisher,dataset,asOf,url?}`, `unit`, `precision`, `locale` (fr-FR/en-US au Sprint 11), `domain:{min,max}` et la série de points font partie du **JSON de production**. Le Studio ne remplit jamais ces champs à partir d'un titre ou d'un article.

## 4. Code et intégration

| Fichier | Responsabilité |
|---|---|
| `services/media-renderer/src/data-motion-engine.mjs` et `.d.mts` | poses par frame, coordonnées des courbes, classement stable des ex æquo, intensité des cases, formats |
| `services/media-renderer/src/DataMotion.tsx` | véritable composition React/Remotion 1080×1920 ligne/rank/heatmap et attribution visible |
| `services/media-renderer/src/CreativeEdit.tsx` | `data_story` au même niveau que `geo_story`, `country_focus`, `photo_story` |
| `services/media-renderer/creative/render-project.mjs` | `shot.data` transmis tel quel au **vrai** moteur MP4, afin d'éviter la régression PHOTO du plan figé |
| `services/media-renderer/creative/validate-project.mjs` | validation des dates, plages, valeurs, unités, sources et mode |
| `frontend/web-v2/src/media/CinematicProductionBoard.tsx` | formulaire éditorial explicite et saisie de séries `DATE|LIBELLÉ|VALEUR` / `LIBELLÉ|VALEUR`, pas de fausse donnée imposée |
| `creative/validate-project.test.mjs` | tests du domaine, tracé fidèle, ex æquo, source, date et motion beats |
| `creative/build-ci-fixtures.mjs` | trois épisodes de **nombres entièrement fictifs**, étiquetés simulation et conservés dans un projet temporaire |
| `creative/test-player-browser.mjs` et smoke React | vrais parcours Chromium pour trois genres de graphiques et sécurité du texte mobile |
| `.github/workflows/worldvision-cinematic-director-gates.yml` | rendu film de 495 frames H.264 + tests/unités/Player + artefacts MP4/PNG + non-régression des sprints existants |

## 5. Preuves attendues pour la PR DATA (à remplir seulement APRÈS observation)

- [ ] CI au SHA exact : code Node, typecheck Remotion, build V2 et H.264 de **495 frames**.
- [ ] Trois épisodes de **165 frames** chacun, **1080×1920 à 30fps**, avec des cadres/séries réellement différents.
- [ ] Captures Player à frames 0, 80, 145 pour **line, ranking, heatmap**, vérification des libellés, source, axes visibles et absence de collisions avec les éléments TikTok.
- [ ] Audit **visuel manuel** des PNG/MP4 (fond, contrastes, tailles réelles des valeurs et unités, respiration, transition inter-épisodes, aucun écrêtage).
- [ ] Test de dates impossibles, source manquante, ex æquo, classement tricheur avec axe de départ non zéro, courbe à échelle déclarée.
- [ ] Tests futurs sur téléphone Safari iPhone et Chrome Android, variantes linguistiques anglais/arabe/français et data économiques réelles sous licence. Ne pas déclarer "production internationale achevée" sans cela.

Si la CI échoue : identifier le commit, le vrai message et la cause, corriger dans une nouvelle révision puis garder la chronologie.

## 6. Exemples d'essai NON JOURNALISTIQUES

Le film CI n'utilise **que** des données inventées : une courbe à trois valeurs, un classement à quatre catégories, une heatmap à six cases. Les titres disent « ESSAI SYNTHÉTIQUE », les unités « TEST », la source « SIMULATION SYNTHÉTIQUE CI » et l'URL `example.invalid`. Aucune de ces valeurs ne constitue un cours, une population, une victime, un PIB ou un classement réel. Ne pas publier ces essais comme actualités.

## 7. Le chemin intelligent pour la suite, sans perdre le cap

1. Revue du vrai dernier HEAD de la PR #80 PHOTO et de la CI de la présente PR DATA ; aucune double fusion des deux moteurs concurrents PHOTO #79/#80 (préférence #80 motivée et documentée dans [le rapport de convergence](SPRINT10_PARALLEL_PHOTO_RECONCILIATION_2026-11-19.md)).
2. Éliminer les défauts de lisibilité et la surcharge visuelle des trois graphiques sans casser la source ni l'échelle.
3. Composer une **séquence narrative réaliste complète** : `geo_story → country_focus → photo_story → data_story → document_focus`, transitions orientées par l'information, vrais fichiers sous droits et vraie narration choisie librement.
4. Poursuivre EDITORIAL et AUDIO pro : sous-titres alignés sur les mots réellement prononcés, mixage/ducking, musicalisation sous licences, mastering, reportage A/B comparé aux références.
5. Optimiser international : conversion des données selon la langue/région, accessibilité couleurs, clavier mobile, performances de l'atlas 10m, tests device et politique de provenance publiée ; **GDELT/blog, BAOCOM, Content OS général restent hors de ces PR médias**.

**Pour reprendre un nouveau chat :** partir de `CONTINUITE_WORLD_VISION.md`, lire ce Sprint 11, le Sprint 10 PHOTO et le Sprint 9 GEO, consulter **HEAD, derniers runs GitHub Actions et vrais artefacts**. Distinguer code/test/qualité esthétique/licence/publication. Les quatre PR précédentes restent **drafts empilées**, non déployées et non fusionnées dans `v2`.

## 8. Retour sur l'arrêt et certification de base (20 novembre 2026)

**Reprise sans approximation :** l'exécution [#44634270490](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44634270490) sur SHA `4c3494e507b53b5c72d73e856ca3cfcc41d1c656` s'est terminée **SUCCESS** sur les deux jobs, ainsi que la seconde exécution #44634282857. **26/26 tests Node** et **10/10 parcours Chromium**. MP4 réel extrait de l'artefact GitHub **#14582924805** : **495 images, 1080×1920, H.264 30fps, 16,5 secondes**, trois compositions successives (courbe, classement et heatmap). Les empreintes des stills réels aux frames 0/247/494 sont toutes différentes. Ne pas confondre ces démonstrations synthétiques avec des événements économiques factuels. Dans le Player, la scène DATA présente des mesures d'espacement conforme : bas graphique 406,67 px ; haut métrique 411,67 ; bas métrique 445 ; haut interprétation 450 ; bas interprétation 480,33 ; haut source 494,33 ; bas source 515,4 ; limite mobile 520,6. Fenêtre de prévisualisation mesurée 360×640. Les quatre zones ont une séparation mesurée et aucun écrêtage dans le test Chromium.

**Revue manuelle des neuf PNG Player** (modes × frames 0/80/145) : les trois visuels sont cohérents et animés. Observations artistiques distinctes de la CI : source et petits libellés restent modestes à 360 px, le film est silencieux, les zones basses sont volontairement laissées libres pour l'interface TikTok, les médias sont un habillage abstrait artificiel, les 3 plans affichent une même formule et n'ont pas encore de narration ni de transition de reportage. Ne pas proclamer « meilleur média du monde » avec ce prototype.

**Correction de fidélité temporelle du 20 novembre :** le moteur projetait auparavant les observations chronologiques à distance égale par index, y compris si des dates réelles étaient espacées irrégulièrement. Le correctif `b55cef07e7137ec07ffd1c5c565c3046af808be1` calcule maintenant chaque abscisse avec `Date.UTC` sur les vraies dates ISO et la durée totale. Le titre DATA s'affiche désormais à 78 % dès frame 0, plutôt que 18 %. Le commit test `00b3e822c92794ef477aca36002c664d8759c47c` ajoute une assertion sur Jan→Feb (31 jours / 59 jours) et une série volontairement irrégulière Jan1, Jan2, Apr1. **Ces nouveaux commits doivent être certifiés séparément** : consulter [Actions #44705502118](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44705502118) au dernier SHA.

### Parallèle DATA à ne pas fusionner aveuglément

**PR #83** `feature/worldvision-data-motion-sourced-2026-11-19` propose aussi `data_story` (trend, signed comparison, ranking, heatmap), une méthodologie et une légende min/max explicites. À son HEAD `5ed3921`, ses jobs Node + V2 sont passés mais son dernier Chromium est **FAILED** par timeout d'attente de l'interface. Le bon chemin : **retenir PR #84 comme base DATA confirmée**, auditer les morceaux réellement supérieurs de #83 (notamment comparaisons à valeurs signées, source méthodologique et heatmap légendée) et les porter sélectivement avec de nouveaux tests dans un seul moteur après avoir consolidé un film complet. Ne jamais fusionner deux `data_story` concurrents.

## 9. Suite prioritaire : passage du prototype au reportage

Prochain chantier distinct : **film entier piloté par un manifeste éditorial**, pas des plans synthétiques isolés : `geo_story → country_focus → photo_story → data_story → document_focus`. Un contrat unique doit préserver séquence, durée des transitions, source média, marque de preuve et narrateur/fichier voix. Fixture synthétique à utiliser d'abord pour tester le raccord cinématique et les 5 plans, puis essai sur une photographie authentique licite / dataset réellement vérifié. Comparer aux vidéos de référence finance et géopolitique et au rendu Gabon apprécié. Les métadonnées économiques du projet V2 DATA institutional ne doivent PAS être déclarées automatiquement fiables pour le Média sans contrôles de droits, versions et comparabilité. Toujours maintenir l'intégrité et la traçabilité.
