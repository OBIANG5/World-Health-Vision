# World-Vision — standards obligatoires et apprentissage permanent

## RETOUR PROPRIÉTAIRE APRÈS PUBLICATION (14/11/2026) — V3 NOTE 4–5/10

**Nouvelle décision explicite : la vidéo Soudan du Sud a été effectivement publiée par le propriétaire ; ne pas recommencer cet épisode. Passer au prochain sujet choisi par le propriétaire.** Ce constat ne confirme ni licence de la voix, ni qualité artistique approuvée. Les anciennes mentions « pas publiée » sont HISTORIQUES et dépassées.

Défauts signalés après publication : **voix Vivienne encore trop rapide, sans intonation humaine, émotion ou chaleur suffisante ; images trop faibles, peu parlantes et insuffisamment liées aux phrases ; la succession visuelle ne suscite pas assez l'intérêt pour rester, aimer ou commenter.** Ce retour écrase la lecture trop optimiste des rapports techniques de V3. La note propriétaire **4–5/10** est notre référence de progrès, pas une certification.

### Règles opérationnelles pour le prochain sujet (bloquantes avant export)
1. **Narration non accélérée** : cible éditoriale de départ ~125–145 mots français/minute, pauses expressives, accentuation des mots décisifs ; aucune vitesse `+14%`, aucune compression `atempo>1.0` par commodité. Mesurer le débit réel en mots parlés/minute. Si le script ne tient pas dans 30 s, **proposer une version courte à approuver avant verrouillage**, ne jamais couper ou réécrire un master approuvé en cachette. Si les pauses naturelles allongent de 1–2 secondes le clip, arbitrer le texte AVANT le rendu.
2. **Direction de voix Vivienne : préférée mais non finalisée.** Tester au moins deux prises du **même texte** et faire écouter les différences de respirations, d'accent, d'intonation et d'intention. Les SSML prosody/contour/style ne sont utilisés que si réellement pris en charge par le fournisseur sous licence ; ne pas inventer un caractère « émotionnel » par pitch artificiel. Relecture intégrale obligatoire par l'utilisateur. Option narratrice humaine si la synthèse reste mécanique.
3. **Scénario émotionnel et visuel conjoint** : chaque phrase a un « pourquoi le spectateur s'en soucierait ? », un fait vérifié, un visuel précis, son statut (vraie scène contemporaine / archive datée / illustration conceptuelle), le droit de réutilisation, une fonction (preuve, contexte, conséquence humaine, échelle, révélation). **Interdiction des portraits/photos génériques posés uniquement pour meubler.** Favoriser du mouvement réel, un geste humain, un lieu précis et des séquences dont l'objet correspond exactement aux paroles ; diversifier plans rapprochés / moyens / géographiques. Prévoir plans montés au rythme de la narration, non une diapositive par phrase.
4. **Images puissantes mais exactes** : rechercher d'abord des rushes documentaires de qualité (résolution, netteté, action, cadre, licence); si les meilleures images sont sous droits, demander/licencier plutôt que les copier. Images de studio générées uniquement comme **illustrations clairement présentées**, jamais comme vraies victimes, vraies manifestations, fausses personnes publiques ou faux événements. Pas d'images trompeusement réalistes. Éviter la sensation de visuel IA/cartoon.
5. **Storyboard préalable, images fortes avant montage** : préparer 4–7 plans maximum pour ≤30 s, visualiser le premier plan, la carte/globe validée quand pertinente, le plan central « révélation », le plan humain final. Relecture des compositions typographiques **en taille iPhone**, texte minimal, lisibilité et grille rigoureuse ; éviter le retour des écrans beige/date, les cadres de logo, filets décoratifs et descriptions d'archives intrusives.
6. **Test de rétention sans prétendre prédire l'algorithme TikTok** : le hook doit transmettre le sujet dès 0–3 s ; chaque plan justifie un nouveau fait/émotion. Après publication analyser taux de complétion, durée moyenne regardée, relectures, courbe d'abandon à 3 et 10 s si l'utilisateur fournit TikTok Analytics. Ne jamais affirmer « fera le buzz » sans données.
7. **Apprentissage par épisode** : enregistrer à la racine/Issue #18 : note propriétaire, erreurs, décisions, source, licences, choix voix, métriques observées, version corrigée. Ne pas réécrire la vidéo déjà publiée : appliquer ces règles à la **suivante**.


**Document transversal** à lire avant chaque nouvelle vidéo, sur toutes les branches. Révision après retours du 14 novembre 2026.

## Ce que l'utilisateur a effectivement validé / rejeté
- Validé et à préserver : **intro géographique V2 Terre NASA qui tourne vers le pays dès les premières secondes**. Ne jamais recréer avec un globe factice.
- Script premier épisode **verrouillé** dans `episodes/2026-11-14_south_sudan_elections/SCRIPT_LOCK_V3.json`. V2 a violé la consigne en changeant des phrases ; cette erreur doit être impossible sans validation.
- Voix de référence préférée **Vivienne** : `VOICE_REFERENCE.md`. Kokoro et Remy sont rejetées.
- Rejetés : plaque de logo en haut, emblèmes artificiels, étiquettes d'archives et de QA en bas, barres/filets décoratifs asymétriques, énormes dates mal composées sur fond beige, Manrope puis Archivo Black si utilisés dans des layouts amateurs, fonds trop vides, faux reportage, mauvais rushes, narration robotique.
- La photo documentaire trop faible ne devient pas bonne parce qu'elle est « sous licence ». Chercher des images réellement évocatrices ; sinon composer un **tableau éditorial original** (photographie de studio illustrative ou motion design) dont le caractère conceptuel est divulgué, jamais un faux événement historique.
- Aucun nouveau plan ne peut écraser un élément validé sans plainte spécifique ou accord.

## Workflow impératif
1. **Faits verrouillés** : au moins 2 sources crédibles ; dates et causalité vérifiées ; définir exactement ce qui est vérifié et ce qui ne l'est pas.
2. **Script gelé** : numérotation des phrases, hash SHA-256, comparaison mot pour mot en CI. Une version rejetée n'est pas « l'ancienne version valide ». Tout nouveau script = nouvelle version + consentement.
3. **Source visuelle unique par plan** : licence, auteur, date, géographie, état `archive / actualité filmée / illustration générée / graphique factuel`. Ne jamais présenter des illustrations comme des images sur place.
4. **Planche de composition 9:16** : d'abord maquette fixe avec police de qualité, grille cohérente, jamais des morceaux de titres éparpillés, largeur max, marges et safe zones définies. Texte éditorial maximum deux niveaux de hiérarchie par plan.
5. **Globe utile** : 0–3s, géographie NASA/Natural Earth, centrage calculé. L'audio démarre avec le mouvement et ne doit pas être tronqué.
6. **Essais de voix** : audition comparée et approbation. Si la voix ne convainc pas, ne pas « réparer » le problème en accélérant toute la piste.
7. **Montage** : coupes calées sur des mots et événements, transitions courtes et intentionnelles, sous-titres seulement à partir de l'audio réellement produit (interdits s'ils ne sont pas synchronisés).
8. **Garde-fous automatisés** : script hash, absence de silence involontaire, sortie 1080×1920/30fps/H.264/AAC, moins de 30 s, 9 photogrammes dont 3 dans le globe, contraste/zone sûre, fichiers source présents, attribution en manifeste.
9. **Relecture visuelle ET écoute intégrale** : décrire ce qui échoue au lieu d'affirmer une note fictive. CI verte n'est pas approbation esthétique.
10. **Approvisionnement continu** : conserver chaque note utilisateur, version refusée, diff et lien du run GitHub ; réutiliser les décisions dès l'ouverture du chat suivant.

## Grille éditoriale V3 proposée
- Proportions verticales 1080×1920, 30 ips.
- **Borne de texte** recommandée : x=96–984 et y=245–1590 hors plans particuliers ; libre sur l'intro globe si validé par l'original.
- Pas de logo permanent plaqué ; signature originale G0 discrète en fin uniquement, sans altérer ses pixels.
- Réserver les 1,5–2 dernières secondes à la dernière pensée, sans lire le slogan à voix haute.
- Ne pas fabriquer de faux pictogrammes, fausses couvertures, fausses photographies d'élections.
- Garder l'espace pour les interfaces des réseaux sociaux sur smartphone.
- Décor de chiffres : principe **un nombre fort par plan**. La donnée chiffrée doit être reliée à une image et à un sens, pas isolée comme une diapo bureautique.
- Polices proposées pour examen séparé : **DM Sans** (texte/voix), **Newsreader** (éditorial/titres), typographie optique avec tailles contrôlées ; ne pas revenir par défaut à Manrope/Archivo Black.
- Couleurs : conserver les couleurs authentiques des photos ; contraste neutre (noir/ivoire) et une couleur d'accent justifiée par le pays, **pas d'aplats cyan/saumon arbitraires**.

## Invariants techniques réutilisables
- Bibliothèque d'assets persistante avec SHA, nom, provenance, licence.
- Composant de montage qui accepte `script_lock.json`, `voice_profile`, `visual_ledger`, `timeline` ; sans duplication des phrases à la main.
- Tester 3 éléments visuels réels avant de publier l'ensemble, et refuser si le script diverge.
- Conserver V1/V2 pour audit ; ne plus les recommander.
- Pour prochaines actualités Afrique : Guinée/Siguiri, Kenya/Syokimau, Guinée équatoriale/Jesús Owono, appliquer immédiatement ces règles.

## Contrôles qualité bloquants
**BLOCK** si phrase modifiée ; voix bannie ; image présentée comme source filmée alors qu'elle est générée ; lien éphémère présenté comme permanent ; texte technique incrusté ; master sans piste de voix ; musique non licenciée ; vidéo terminée déclarée avant existence du MP4 ; approbation commerciale présumée ; carte géographique inexacte ; publication sans consentement.


## Nouveau refus explicite Siguiri V1 — 14 novembre 2026

**Cette règle s'applique à toutes les vidéos du média, même hors épisode Guinée.** Après l'essai sur Balato/Siguiri, le propriétaire juge :
- **Vivienne reste la voix**, mais le rendu V1 à -28 à -32 % est **trop lent, robotique, découpé en morceaux avec des blancs**. Ne plus synthétiser phrase par phrase puis recoller. **Créer une prise continue du script entier**, comparer A/B/C avec différents débits **de cette même voix**, viser une diction proche de la parole humaine et soumettre l'écoute complète.
- **Plans validés à conserver** : vidéo réelle de l'homme qui frappe/travaille dans la mine ; police Space Grotesk/DM Sans utilisée à Siguiri. Ne pas détruire les éléments validés lors de la correction des autres défauts.
- **Images rejetées** : trop de mines génériques sans lien narratif, cartes noires fixes, plans répétitifs, manque d'impact émotionnel. Obtenir d'abord des plans spécifiques et réellement sourcés, ou rendre les graphiques informatifs et animés; pas de faux événements.
- **Interdiction ferme de toute étiquette technique à l'écran** : « ILLUSTRATION », « PHOTO USAID », « PREVIEW », « QA ». La provenance des stock-shots hors événement doit rester dans la description/publication et le manifest; l'absence de petit label ne doit jamais servir à tromper le spectateur sur l'origine des images.
- **L'ancien logo World-Vision avec carré blanc est définitivement proscrit**. **Remplacement de référence** : vidéo de signature 3 s 512×910, fournie directement par le propriétaire, SHA original `b1a875dd2611e2fc1e10f9f233b8e42d7065faacaecdc520c52af72c90e7d855`; Canva user asset `VAHa58Do0Cc`. Le clip vidéo envoyé doit être prioritaire; ne jamais reprendre l'icône PNG blanc ancien. L'outro bleu 3 s se diffuse **après** la dernière phrase.
- Sur GitHub, dossier de travail dédié `feature/worldvision-guinee-siguiri-v2-voice-endcard-2026-11-14`, PR #25. Ne jamais prétendre qu'une animation dérivée d'une capture est le fichier exact : mentionner distinctement si un re-rendu à partir d'une image est utilisé temporairement.
- L'absence de validation vocale ou de licence commerciale vérifiée reste une contrainte de publication, même si le master est techniquement réussi.

### Nouvelles portes qualité bloquantes
1. **Sauf choix explicite contraire, chaque prise TTS est un seul appel pour tout le script**, audio sans soudure de phrases. Exceptions humaines/prises additionnelles documentées.
2. **Fin de vidéo : source bleue fournie par l'utilisateur**, aucun rectangle blanc; contrôle de 3 photogrammes de fin dans la review contact sheet.
3. Au moins un plan en mouvement documentaire approprié aux faits par passage humain important; ne pas réutiliser quatre fois le même camion ou la même image pour représenter des scènes différentes.
4. Exiger une revue sur écran mobile à taille réelle (titres, safe zones, contrastes, images) ET l'écoute subjective avant publication; la CI verte ne constitue pas un « 9/10 ».
