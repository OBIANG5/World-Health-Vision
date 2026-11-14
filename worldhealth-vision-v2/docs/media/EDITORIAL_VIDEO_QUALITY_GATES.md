# World-Vision — standards obligatoires et apprentissage permanent

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
