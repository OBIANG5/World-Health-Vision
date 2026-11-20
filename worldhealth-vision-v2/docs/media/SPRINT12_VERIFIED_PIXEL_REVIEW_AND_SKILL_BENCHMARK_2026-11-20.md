# World-Vision — audit éditorial du vrai film intégré et plan d'amélioration avec les skills

**Date : 20 novembre 2026**. Film de la [PR #87](https://github.com/OBIANG5/World-Health-Vision/pull/87), run vert [#44710009215](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44710009215), HEAD `db7c6ed4f9f5a7c80f01df212c66758d69b93408`. Artefact GitHub **#14617551866** et ses onze PNG Player réels **0, 70, 145, 230, 300, 375, 455, 520, 610, 686, 742**, extraits et examinés. **Aucune scène de reportage réel, toutes les données/non-médias Natural Earth sont synthétiques, aucun droit journalistique inféré.**

## Constats indépendants de la CI — il ne faut pas confondre intégration et cinéma

| Frame | Scène ou raccord | Constat actuel (pixels Player 360px) | Action artistique réellement utile |
|---|---|---|---|
| **0** | Globe, ouverture | Beau globe coloré géographiquement lisible, halo bleu/cyan rappelant la signature, mais **pas de titre journalistique visible** ; le mot d'accroche arrive plus tard | Accroche informative dès la première seconde *sans cacher le globe* ; évaluer la priorité du sujet, pas juste un titre décoratif |
| **70** | GEO actif | Pays visible et premier titre, bonne direction de globe déjà appréciée ; informations éditoriales encore courtes | Utiliser le mouvement caméra pour expliquer le rapport entre monde, région et fait, non tourner pour tourner |
| **145** | GEO→PAYS | Le titre du plan entrant est désormais invisible durant le fondu ; pas de double titre nouveau/ancien | Chercher match-cut sur la **même géographie** et suivi du point ; remplacer un simple fondu par un raccord utile si le message l'exige |
| **230** | PAYS actif | Carte Gabon détaillée et insertion photo, **insertion étroite** et beaucoup d'espace bas inutilisé | Augmenter la place de l'illustration vraie sous licence et du *country focus*, sans empiéter sur UI TikTok |
| **300** | PAYS→PHOTO | Double titre évité ; la photo de paysage artificiel devient plus visible ; raccord sans continuité du point focal | Une photo réelle liée à la narration, sujet détouré seulement si naturel, continuité de caméra et de couleur |
| **375** | PHOTO actif | Bon principe de plusieurs mouvements ; rendu encore **abstrait/simple**, cercle lumineux/lune peu journalistique, espace utile sous-employé | 2.5D réel avec masque propre, profondeur contrôlée, trajectoires indépendantes cohérentes et même source visible |
| **455** | PHOTO→DATA | Correctif titre entrant en vigueur ; transition demeure un fondu fonctionnel | Raccord de sens **photo → statistique** : pointer zone/objet de la photo vers le chiffre correspondant |
| **520** | DATA actif | Courbe et chiffres sont lisibles/animés, échelle affichée ; le panneau de graphe se limite à la partie centrale, et le reste de la scène reste uniforme | Utiliser animation de comparaison proportionnelle, labels mobiles lisibles, éventuel commentaire vocal, pas de fausses valeurs |
| **610** | DATA→DOCUMENT | Le chevauchement concerne les médias (normal), document émerge sur courbe ; fondus encore génériques | Passer de l'indicateur à sa **preuve** par zoom correspondance valeur→ligne du document |
| **686** | DOCUMENT actif | Document très lisible comme image abstraite mais simple, cadre central et bas vide ; pas encore de citation ni de référence authentique | Surlignage d'une vraie phrase sourcée, date et auteur licites ; angle de lecture confortable |
| **742** | Dernière image | Contexte final visible « REMONTER À LA SOURCE » ; pas encore d'outro du média ni appel à rétention discret | Signature World-Vision discrète, fait récapitulé, lien ou source de vérification, clôture/CTA professionnel |

**Bilan honnête :** intégration technique convaincante, esthétique **forte au globe**, mais les trois plans PHOTO, DATA et DOC ne sont pas encore un reportage cohérent. Le véritable saut de qualité ne sera pas de multiplier les pulses. Il viendra des **sources et scènes utiles au récit**, de la caméra raccordée à un point, de la profondeur, de la typographie hiérarchisée et d'une voix/sound design rigoureusement synchronisés.

## Mapping skills → actions vérifiables

- **`remotion-maps` et `remotion-markup` officiels :** revoir la transition GEO→PAYS pour une continuité de localisation sans reconstruire l'atlas. Mesure : le même point/countryId reste vrai et à l'écran, sans glissement géographique.
- **`remotion-markup` + `claude-motion motion-design` :** trois pistes PHOTO qui participent à la compréhension (caméra, sujet, information) ; critique visuelle au téléphone plutôt que « x effets ajoutés ». Mesure : sujet, texte et preuve ne se masquent pas mutuellement.
- **`animated-chart` / registry HyperFrames comme vocabulaire :** explorer une liaison narrative photo→donnée, puis DATA→DOC, tout en vérifiant les valeurs originelles et l'axe du temps réel. Mesure : mêmes nombres/sources dans JSON, Player et export.
- **`remotion-captions` :** aligner sous-titres aux mots réellement prononcés quand le vrai narrateur sera fourni. Mesure : décalage d'échantillons, contraste et temps de lecture.
- **`claude-motion review-loop` :** rendre des planches autour de **chaque transition à ±3 et ±8 frames**, pas seulement le pic de scène. Mesure : zéro titre concurrent, zéro noir inattendu, frame0 fort, aucun clipping mobile.
- **`claude-motion sound-design` :** cue-sheet basé sur un EDL réel ; normalisation et vrai mix de voix, pas un bruit de démonstration. Mesure : voix audible, ducking mesuré, pas de clipping.

Ces recommandations sont des **applications vérifiables**, pas la déclaration que chaque skill tiers est déjà installé. Voir la [revue complète](MEDIA_AGENT_SKILLS_EVALUATION_2026-11-20.md).

## Prochain vrai jalon supérieur — journalisme et bande-son

1. Créer un brief avec **une seule actualité** : sujet, date, zone, sources de fait (primaire+indépendante), chiffres et incertitude, droits du média et attribution, phrase de voix par plan. Aucun plan juste pour atteindre cinq templates.
2. Importer une photo/vidéo **authentique et autorisée**, conserver les sources, faire un récit réellement monté dans le moteur commun avec transitions servant le sens.
3. Voix humaine sélectionnée librement ; captions alignés sur l'original de l'audio, ambiances/sfx sous droits, mesure et rendu mix.
4. Deux variantes A/B de **30 s environ** sur même source. Appliquer la revue frame0/hook, 360 px, TikTok réel et l'évaluation d'une vidéo d'information crédible. Conserver les mêmes valeurs/source et le même narration timing.
5. Chercher le premier composant tiers utile seulement si notre moteur montre un déficit prouvé, version épinglée, tests de compatibilité et audit de sécurité préalable.

**État :** cette feuille d'audit est une décision de réalisation **documentée**, pas un approbation de publication. Le propriétaire valide les rendus créatifs ; les scripts tiers ne sont pas autorisés à installer de nouvelles dépendances ou à publier par défaut.
