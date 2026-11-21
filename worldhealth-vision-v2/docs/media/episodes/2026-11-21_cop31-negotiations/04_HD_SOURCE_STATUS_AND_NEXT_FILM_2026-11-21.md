# WORLD-VISION MÉDIA — COP31 / Étape 2B : situation réelle des ORIGINAUX HD, chronologie des négociations et reprise fiable

**21 novembre 2026 · dernière source journalistique contrôlée : fin de soirée samedi, avant dimanche · statut PAS DE MASTER, PAS DE VOIX C5.2, PAS DE MÉDIA HD ACQUIS.** Ceci est un **registre de PREUVE ET DE BLOCAGES**, pas une liste artificielle de nouvelles fonctionnalités ni une excuse pour recommencer Artemis II. Projet actif = **COP31 négociations des 19–21/22 novembre à Antalya (Turquie)**, PR **#142 DRAFT**, base PR #138. COP31 du 12/11 (ancien programme de financement, film rejeté 1/10) est un autre sujet.

## 1. Actualisation éditoriale : ne pas figer un reportage encore ouvert

La comparaison directe des documents reste solide :
- 16 nov, C16 : https://unfccc.int/sites/default/files/resource/dt_cop31_cover_decision.pdf. Passage sur la sortie des énergies fossiles; **proposition** d'une cible de 120 milliards USD pour l'adaptation.
- 19 nov, C19 : https://unfccc.int/sites/default/files/resource/Upload_dt_cop31_cover_decision.pdf. La mention explicite des fossiles n'est plus dans ce projet et la proposition précise d'adaptation n'y est pas reprise; MAIS **un autre 120 milliards USD lié aux banques multilatérales reste au §54**, à distinguer impérativement. Ce sont des **BROUILLONS**, non un accord final adopté.
- Reuters **21 novembre 14:36 UTC**, https://www.reuters.com/sustainability/cop/cop31-climate-summit-risks-failure-talks-go-deep-into-overtime-2026-11-21/ : négociations prolongées, UE oppose « bon accord ou pas d'accord ».
- FT **21 novembre 18:07 UTC**, https://www.ft.com/content/b3ba64e9-9482-4525-acc7-49825f3daace : l'UE évoque l'absence d'accord plutôt qu'un mauvais compromis.
- Guardian live, **mise à jour samedi en soirée**, https://www.theguardian.com/environment/live/2026/nov/21/cop31-climate-deal-latest-news-updates : les discussions sur la sortie des fossiles et l'adaptation continuent; une plénière finale pourrait glisser **au dimanche matin**. Ce compte-rendu est une source de contexte évolutive et non une preuve d'accord déjà adopté.
- CCNUCC registre décision, https://unfccc.int/process-and-meetings/conferences/un-climate-change-conference-antalya-november-2026/cop-31/cmp-21/cma-8-presidency-consultations : à la vérification, **le dernier projet disponible y était encore daté du 19 novembre à 14:10**. Les pages peuvent changer.

**Règle impérative** : ne jamais enregistrer la voix définitive ou figer le titre « toujours en cours » sans reconsulter **le dernier texte adopté et l'heure**. Si COP31 finit dimanche, le script doit l'indiquer et mettre en regard le brouillon du 19 et le texte final (il ne suffit pas de changer la dernière phrase). Pas de faux direct ni de vidéo datée 21 si publiée après l'issue.

## 2. Correction de provenance : photos du 16 novembre ≠ réunions le 21

La galerie officielle UE https://audiovisual.ec.europa.eu/en/media/photo/P-070944 affiche **Date 16/11/2026**; l'item https://audiovisual.ec.europa.eu/en/media/photo/P-070944/00-163 est indexé comme daté du 16. Les deux images utilisées dans les maquettes :
- `P-070944_00-163_03-MED-275144.jpg` = vue large des **séances de négociation**, 800×533 px, SHA256 `24f65314e3cfef4f14efc6ef981c1ec14d8e048ae5a68ef0b3a21d6881e0e7da`.
- `P-070944_00-162_03-MED-376154.jpg` = participants dont **Wopke Hoekstra**, 800×533 px, SHA256 `c8beff2dd537ae5ae363f1049af24ab889044f9926ccfa689e22f09364f053a5`.

L'ancienne hypothèse `date_range_in_collection: 16–22 novembre` était **erronée**, corrigée dans `media-pilots/cop31-negotiations/reference-assets.json` au commit `d58f855d...`. La date d'archive/collection 16/11 est vérifiée; l'heure exacte d'exposition n'est pas établie. **Les photos n'étayent PAS à elles seules l'affirmation du blocage diplomatique du samedi 21**, qui vient des dépêches sourcées.

Les liens uniquement en 800px ne permettent pas un montage vertical premium sans perte, donc **INTERDICTION de les déclarer assets master** ou de les agrandir artificiellement. Les droits individuels et auteurs restent à confirmer.

## 3. Vérification technique DU VRAI téléchargement HD : résultats, pas suppositions

Le site UE a une procédure officielle : https://audiovisual.ec.europa.eu/en/faq, onglet Photo : ouvrir la miniature individuelle, consulter les métadonnées, cliquer sur le **bouton bleu Download** de la fiche. Une connexion/éventuels droits restent gouvernés par https://audiovisual.ec.europa.eu/en/conditions-of-use . L'automatisation a testé les deux **pages d'images individuelles** sans tentative de contourner l'interface ni de deviner une URL :

- Script `worldhealth-vision-v2/media-pilots/cop31-negotiations/discover-eu-originals.py` : URLs exactes, redirects entre domaines connus, lecture d'ancres publiques; **jamais une URL d'original fabriquée**.
- Workflow [#44954962495](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44954962495) **SUCCESS**, artifact **14727376943** : les pages HTML `/00-162` et `/00-163` ont été reçues (environ 320 ko chacune), mais **AUCUNE ANCRE JPEG HD TÉLÉCHARGEABLE EXPLICITE dans leur HTML statique**. Statut pour les deux : `NO_EXPLICIT_PUBLIC_HD_JPEG_LINK_IN_STATIC_HTML`. Cela ne prouve PAS que le HD n'existe pas : l'interface dynamique/son bouton Download peut le proposer. Les images originales restent **NON ACQUISES**.

## 4. Deux alternatives OFFICIELLES UE à 6 000×4 000, déjà identifiées à la vraie résolution

Deux VRAIES photos publiées sur Wikimedia Commons provenant de l'Audiovisual Service de la Commission européenne, **de l'événement COP31 Antalya le 10 novembre**, pas d'une conférence de presse du 21 :
1. **Salle, réunion ministérielle énergie COP31** — 6000×4000, 6,33 Mo, **Necati Savas / European Union**, 10 nov 2026, source UE `P-070938/00-02`. Fiche https://commons.wikimedia.org/wiki/File:General_view_of_the_COP31_Presidency%E2%80%99s_Energy_Ministerial_Meeting.jpg ; original public explicitement lié depuis Commons : https://upload.wikimedia.org/wikipedia/commons/d/db/General_view_of_the_COP31_Presidency%E2%80%99s_Energy_Ministerial_Meeting.jpg . EXIF déclaré sur Commons : 10/11 à 11:16 heure locale de l'appareil.
2. **Chris Bowen avec Dan Jørgensen** — 6000×4000, 2,02 Mo, **Necati Savas / European Union**, 10 nov 2026, source UE `P-070938/00-31`. Fiche https://commons.wikimedia.org/wiki/File:Chris_Bowen,_COP31_President_of_Negotiation_%26_Dan_J%C3%B8rgensen,_European_Commissioner.jpg ; original public explicitement lié depuis Commons : https://upload.wikimedia.org/wikipedia/commons/f/ff/Chris_Bowen%2C_COP31_President_of_Negotiation_%26_Dan_J%C3%B8rgensen%2C_European_Commissioner.jpg . EXIF déclaré : 10/11 à 16:46.
- Ces photos sont **des illustrations d'ANTALYA le 10 NOV**, pas des photos du samedi 21; elles ne doivent PAS être présentées comme illustrant l'instant des propos du commissaire.
- La licence déclarée par Commons est **CC BY 4.0** avec crédit `© European Union, 2026`, auteur `Necati Savas`, lien et mention de modification; MAIS **les deux fiches affichent « License review needed » pour la source externe**. Droits de personnes/marques/éléments tiers encore à examiner. **NE PAS qualifier les photos de publication-ready**.

**Essai de récupération binaire réel dans la CI** :
- `media-pilots/cop31-negotiations/acquire-eu-commons-originals.py` : URL originales vues sur Commons, test 6000×4000 et EXIF, SHA256 du fichier, 2 cadres verticaux et contact sheet, zéro upscaling.
- Workflow [#44955286230](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44955286230) **FAIL DOCUMENTÉ** à l'étape téléchargement Wikimedia : **HTTP 429 Too Many Requests** dès le premier original. Aucun JPEG 6000×4000 ni SHA256 de ces octets n'a été acquis; deuxième image non téléchargée. **Ne pas contourner le rate-limit ni multiplier les essais**.
- Correction workflow au commit `5b4a292d5be0469bf46b2cc93ec45d7a06864eea` : étape de téléchargement Commons désactivée sur les pushes automatiques et subordonnée à `workflow_dispatch` avec variable explicite `WHV_ALLOW_COMMONS_ORIGINAL_FETCH=true`; **pas de retries implicites**. Workflow [#44955475994](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44955475994) **SUCCESS** pour tous les contrôles existants et l'audit documentaire.
- **Conclusion** : les originaux EU 6000×4000 sont **IDENTIFIÉS via références publiques et EXIF affichés**, mais **PAS DANS NOS FICHIERS DE PRODUCTION**. Leur SHA réel et la revue de droits individuels restent NON EFFECTUÉS. Les previews 800px et deux cadres statiques précédents restent l'unique sortie graphique de cette PR.

## 5. Le meilleur ordre pour la VRAIE VIDÉO, sans nouvelle dérive technique

1. **Statut de la COP31 au moment de sortie** : vérifier l'issue du sommet dimanche ou après, et ses textes officiels. Faire un script **historique exact**, pas une future breaking news périmée; maintenir les IDs de preuves C16/C19/final.
2. **Recevoir / acquérir légalement deux véritables originaux haute définition** (de préférence les photos des négociations du 16, plutôt que les alternatives du 10) via l'interface européenne ou une source équivalente autorisant la monétisation, puis calculer **SHA256** et valider qualité du crop vertical. La résolution connue dans une fiche externe ne remplace pas le JPEG téléchargé.
3. Verrouiller le **script exact** du film (hook sur projet 16→19, re-hook adaptation 120 Md **proposés**, re-hook blocage diplomatique et issue réelle finale). Aucun décalage trompeur entre document/source/photo/date.
4. Nouvelle prise de voix **Vivienne C5.2 — Impact média, fr-FR-VivienneMultilingualNeural, +8%** pour CE texte, droit d'usage vérifié; **aucun moyen contractuel Azure ni nouveau fichier voix disponible actuellement**. Ne pas utiliser Kokoro ni l'ancien clip Vivienne sur le Mississippi.
5. Un film **Remotion/FFmpeg existant** avec hook et re-hooks audiovisuels sémantiques, vrai compo multi-couches, DM Sans, H264/AAC, audit VOIX+PIXELS sur mobile 390px et retouches avec validation propriétaire. Un film muet présenté comme master serait une répétition de l'erreur NASA.
6. À horizon millions de spectateurs, conserver **rendu par version** + stockage objet/CDN + queue fiable pour les producteurs. Voir `docs/media/ADR_MEDIA_SCALE_READINESS_2026-11-21.md`. **Pas d'usine Go/Rust ou nouvelle infrastructure créée pour cette étape audiovisuelle.**

**Aucune dépense, déploiement, fusion, publication, autorisation de voix, accès Azure, vidéo COP31 finie ni JPEG haut résolution réellement acquis.** Toutes les opérations sont durables et contrôlables dans PR #142 et le journal de continuité racine.
