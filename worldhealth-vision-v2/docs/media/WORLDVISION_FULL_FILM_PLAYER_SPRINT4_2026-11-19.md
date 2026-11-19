# World‑Vision Media — Sprint 4 : prévisualisation du FILM ENTIER

**Décision active — 19 novembre 2026**  
**Repo** : `OBIANG5/World-Health-Vision`  
**PR** : [#44 — World-Vision Media Studio](https://github.com/OBIANG5/World-Health-Vision/pull/44) (DRAFT, pas de merge ni déploiement)  
**Branche** : `feature/worldvision-cinematic-director-gates-2026-11-19` (nom historique sans portes obligatoires)  
**Précédents** : [Sprint 3](WORLDVISION_CREATIVE_PLAYER_SPRINT3_2026-11-19.md), [Sprint 2](WORLDVISION_MOTION_DIRECTOR_SPRINT2_2026-11-19.md), [périmètre corrigé](WORLDVISION_CREATIVE_EDIT_HANDOFF_2026-11-19.md).

## 1. Périmètre confirmé, immuable sans nouvelle décision

World-Vision vise la production **audiovisuelle internationale haut de gamme**, en orchestrant les meilleurs moteurs existants, pas la reprogrammation d'une nouvelle IA de génération vidéo/voix. Les scripts et la recherche d'actualité sont pour le moment faits **ici avec ChatGPT et le propriétaire**. Les photographies, clips, voix, musiques, assets 2,5D peuvent être fournis. Dans le logiciel : organiser, adapter les plans, articuler le récit, fabriquer du motion design, synchroniser et monter, contrôler réellement avant export.

**Pas de voix Vivienne obligatoire ; aucune IA TTS obligatoire.**  
**Pas de onze portes de recherche/script imposées.**  
**BAOCOM reste totalement indépendant**, sans migration vers GitHub ni connexion.  
**Content OS global, blog et raccord GDELT différés** — seuls des outils utiles au montage média sont concernés.

## 2. Défectuosité précise corrigée

Sprint 3 produisait déjà un vrai aperçu d'**un plan isolé** avec `@remotion/player`, mais il ne permettait pas d'évaluer un reportage du début à la fin : pas de succession de plans, pas de raccords et pas de piste de voix dans le lecteur.

**Sprint 4** garde **un seul** composant canonique `services/media-renderer/src/CreativeEdit.tsx` pour prévisualisation web et rendu MP4 H.264. Le lecteur web réel est `frontend/web-v2/src/media/CreativeCompositionPreview.tsx` qui calcule la durée avec `creativeDuration(props)` — le même calcul que le renderer, chevauchement des transitions compris.

La vue `CinematicProductionBoard.tsx` a désormais trois modes :
- **Média original** : source brute, choix entre image complète et recadrage 9:16.
- **Plan animé** : titre, sous-titre, mouvement et détourage du plan choisi ; sans prétendre jouer la narration de l'ensemble.
- **Film entier** : tous les plans édités, raccords `cut/dissolve/slide`, voix sélectionnée et musique importées, outro fourni s'il existe. Les pistes proviennent de `File`/URL `blob:` locales ; **aucun upload automatique**.

Les props `shots` sont dérivées de l'état local de l'atelier ; le dernier plan n'a pas de transition vers une scène inexistante. La narration sélectionnée correspond au fichier audio A de la comparaison A/B ; la seconde voix n'est pas injectée dans le montage. La vidéo publiée n'est pas modifiée par la prévisualisation.

## 3. Test de navigateur réel et incident historique

Le test ancien `test-player-browser.mjs` a été bloqué à cause d'une confusion entre **l'interface interne `HeadlessBrowser` de Remotion** et les méthodes de Puppeteer. La résolution validée est de réserver Remotion à la composition et d'utiliser **Puppeteer Core** seulement pour le test Vite/Chromium — pas pour générer les images. Une première preuve verte du Player sur **un plan** existe : [Actions #44537703202](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44537703202) ; 11 tests Node validés, build V2 vert, images navigateur à deux images différentes, aucun `pageerror`, audio WAV synthétique détectant une pause volontaire et source conservée. L'artefact précédent contient `player-browser-frame-0.png`, `player-browser-frame-74.png` et le rapport.

**Nouveau contrôle ajouté pour le FILM COMPLET** :
- `frontend/web-v2/src/media/creative-player-smoke.tsx` avec `?mode=film` crée **2 plans artificiels** et une transition officielle Remotion **dissolve** de 10 images entre les plans ;
- une piste WAV générée en CI (`synthetic-tone.wav`) est chargée dans un `blob:` comme narration, sans génération de parole ;
- la durée attendue est **165 images** : 105 + 70 − 10, à 30 ips ;
- `services/media-renderer/creative/test-player-browser.mjs` ouvre Chromium et capture trois instants du film : **0, 100, 145** ; le premier ouvre, le second est proche du raccord, le troisième représente le deuxième plan ;
- le rapport `player-film-smoke.report.json` atteste des images réellement capturées, de l'absence d'erreurs JavaScript, de la présence des props de narration et du passage au plan suivant ;
- le workflow `.github/workflows/worldvision-cinematic-director-gates.yml` vérifie les PNG, sauvegarde les captures, ainsi que les MP4 déjà rendus et rapports audio.

**État vérifiable à la reprise :** [workflow #44540102940](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44540102940) a été déclenché pour ce test. **Ne déclarer le film complet VALIDÉ que si les deux jobs sont explicitement SUCCESS et que les captures/rapports sont présents.** En cas d'échec : examiner le job navigateur, puis corriger *uniquement* l'erreur avérée ; ne pas passer outre.

## 4. Ce qui n'est toujours pas résolu — ne jamais prétendre le contraire

- **La qualité mondiale n'est pas démontrée**. Le décor et l'audio CI sont synthétiques et explicitement non journalistiques. Les captures prouvent la composition, non sa beauté.
- **L'aperçu ne remplace pas le master H.264.** On ne diffuse jamais depuis l'URL locale `blob:`; les codecs iPhone/Safari peuvent différer de Chrome.
- **L'audio du Player n'est pas encore un mastering** : voix + musique sont deux sources, mais pas un traitement professionnel de loudness, EQ, dé-essing, compression latérale, ni une correction de pauses décidée humainement.
- **Pas de sous-titres forcés, mot à mot** alignés sur l'audio reçu ; aucune modification de script par code, ni transcription inventée.
- **Pas de sauvegarde multi-appareils** ou de gestion des rushes sur serveur privé : le projet JSON s'exporte, les vrais fichiers restent dans le navigateur/dossier utilisateur. Un média source non disponible ne doit jamais être remplacé silencieusement par une illustration stock.
- **Pas de validation de droits d'exploitation** ni de garanties de viralité.
- **Pas de déploiement** du Studio amendé, pas de merge vers `v2`, pas de publication externe, pas de push BAOCOM.

## 5. Suite intelligente, par valeur artistique et sûreté

1. **Valider la lecture du film entier dans Chromium** (puis iPhone Safari/Android) et examiner effectivement les PNG du premier plan, du raccord et du second. Corriger toute rupture ou image fausse.
2. **Élever le visionnage à la taille réelle du téléphone** : 300–360 px visibles sans réduire artificiellement les images, contrôle plein écran et retour sur les zones masquées des plateformes.
3. **Première réalisation vraiment remarquable** : partir d'un vrai script fourni par le propriétaire, de vraies photographies/vidéos avec provenance et droits, et d'une narration choisie. Construire 2–3 ouvertures créatives alternatives et les comparer en visionnant les MP4, pas des maquettes.
4. **Révision non destructive** : versionner par plan les médias, paramètres et sources ; faire un cache par empreinte et réutiliser les scènes inchangées, sans réencoder inutilement les éléments approuvés.
5. **Audio de diffusion** avec moteurs professionnels existants (FFmpeg, DAW, éventuels fournisseurs TTS), audition A/B puis choix humain, analyse de durée/silence déjà validée, alignement temporel exact et sous-titres adaptés aux langues.
6. **Sécuriser le passage multi-appareils** : ingestion par upload authentifié, object storage privé, contrôle de tailles/contenus, quotas, URLs temporaires, ledger de droits et crédits, sorties conservées selon politique de rétention.
7. **Content OS de fabrication audiovisuelle uniquement** : projets, plans, scripts *fournis*, voix, validations de scènes, versions, assets et exports. GDELT/blog global attendent.

## 6. Procédure exacte pour le prochain chat

1. Ouvrir [la PR #44](https://github.com/OBIANG5/World-Health-Vision/pull/44) et vérifier qu'elle est encore en **DRAFT**, que sa branche est inchangée.
2. Lire ce fichier et les trois précédents, puis examiner le **HEAD** réel et le dernier workflow du commit.
3. Lire les preuves `player-film-smoke.report.json` et les trois captures 0/100/145. Une compilation seule ne suffit pas.
4. Ne modifier le partage `CreativeEdit.tsx` que de manière à préserver une seule composition canonique. Ne pas coder un second moteur de transitions CSS.
5. Pour la prochaine réalisation, **l'utilisateur apporte le script et potentiellement des fichiers** ; le logiciel assemble, anime, finit. Aucune voix imposée, aucun transfert BAOCOM.
6. Documenter chaque erreur et chaque solution avec commits, tests et caveats. Ne pas déclarer un film prêt pour publication sans visionnage, contrôle journalistique et accord éditorial du propriétaire.


## 7. Preuve d'exécution confirmée — film complet, pas seulement compilation

**Preuve de la nouvelle timeline à deux plans : [GitHub Actions #44540102940](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44540102940), conclu SUCCESS pour les deux jobs.** Le commit de code testé comprend `creative-player-smoke.tsx`, `CreativeCompositionPreview.tsx`, `CinematicProductionBoard.tsx` et le test Chromium multi-scènes. **11 tests Node réussis, 0 échec ; build web V2 réussi.**

**Artefact réel** : `worldvision-creative-compositor-demo`, artifact ID GitHub `14538076534`. Il contient :
- `player-film-frame-0.png` : premier cadre de l'image synthétique ;
- `player-film-frame-100.png` : deux scènes visibles dans le **chevauchement du fondu** (notre code de transition Remotion, non une image CSS statique) ;
- `player-film-frame-145.png` : deuxième plan « LE RÉCIT CONTINUE. » visible seul ;
- `player-film-smoke.report.json` : durée **165 images**, erreurs de navigateur **0**, trois SHA-256 distincts, piste synthétique déclarée ;
- les MP4 tests, trois stills de `focus_reveal` et le rapport du détecteur de silence FFmpeg.

Les trois PNG ont été **ouverts et inspectés** : le fondu est bien présent, puis la typographie du deuxième plan arrive. L'essai prouve l'assemblage de deux plans avec piste audio *référencée* dans le Player mais **pas la qualité acoustique de l'écoute** : l'interprétation d'une voix et le mastering restent des validations distinctes.

**Observation artistique critique :** la typographie du deuxième plan se trouve sur un simple dégradé sombre et la transition intermédiaire produit des titres superposés. C'est acceptable pour tester un fondu, **pas une direction artistique « meilleure au monde »**. Ne pas transformer ce clip synthétique en modèle de journalisme ni le publier.

**Ajustement UX ultérieur du 19 novembre** : la largeur de visionnage sur téléphone a été augmentée (jusqu'à **360 px en 9:16**) et les précédents plafonds de 235 px sur mobile et 420 px en hauteur ont été retirés. **Contrôler le build du HEAD actualisé via son CI** avant de déclarer cette correction de présentation totalement validée.

**Cette documentation décrit ce qui est réellement présent dans la branche, pas une fonctionnalité déjà déployée sur Vercel.**
