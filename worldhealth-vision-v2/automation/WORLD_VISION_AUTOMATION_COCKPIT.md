# WORLD-VISION — cockpit central et chaîne audiovisuelle automatisable

**Décision prioritaire du 13 novembre 2026 (après refus du sujet mangroves et des CGI simplifiés).**
**Statut réel :** architecture de production validable + premier **workflow n8n importable** committé dans GitHub. Aucun compte n8n, Shotstack ou Google Flow n'est connecté par ces fichiers ; aucun scénario n'est activé ; aucun reportage complet généré ; aucune publication.

## 1. Objectif utilisateur NON NÉGOCIABLE

**Un centre de production**, depuis lequel on déclenche et suit les étapes :
**VEILLE ACTUS IMPORTANTES → sélection/validation → script sourcé → storyboard → vraie identité World-Vision → voix française → médias réels sous droits → modèle vidéo → sous-titres → QA/aperçu iPhone → autorisation → diffusion**.

L'utilisateur n'a pas demandé de réinventer un éditeur, un globe 3D ou un studio de montage ; les heures perdues sur le prototype Canvas/CGI et le faux sujet prioritaire ne doivent **pas** être répétées. Le logiciel `MediaStudio` qui existe déjà sert de point de visibilité s'il est connecté aux événements de l'orchestrateur, et non de second système de montage à programmer.

## 2. Stack choisie / pourquoi

| Couche | Produit | Choix retenu | Coût / vraie limite |
|---|---|---|---|
| Orchestration | **n8n Cloud** (ou Community Edition auto-hébergée) | Un seul conducteur visuel, déclencheurs RSS/webhook, vérifications, attentes/approbations et appels aux services ; ne pas reconstruire un moteur | Cloud Starter annoncé **20 €/mois facturés annuellement** en novembre 2026, essai disponible ; auto-hébergé sans coût de licence communautaire mais maintenance/serveur en plus. https://n8n.io/pricing/ |
| Alternative moins chère pour RADAR | Make Free | Si n8n cloud coûte trop ou pour tester sans frais : scénario RSS/Drive | 1 000 crédits/mois, 2 scénarios actifs, minimum 15 min entre scans. https://www.make.com/en/pricing |
| Rendus vidéo répétables | **Shotstack** (Studio + templates + node n8n officiel) | Construire **UNE FOIS** le modèle World-Vision : scènes, logo, sous-titres, cadres, transitions ; n8n remplit les emplacements puis lance le rendu | Sandbox avec filigrane, production via crédits/API distincts ; coût exact à vérifier avant achat. https://shotstack.io/integrations/n8n/ |
| Autre rendu possible | Creatomate | Moteur à templates API avec n8n officiel ; évaluer en essai si Shotstack ne couvre pas la qualité/édition désirée | Coût supplémentaire, **pas** inclus dans ChatGPT/Gemini. https://creatomate.com/docs/fundamentals/getting-started/api-automation |
| Faits, scripts, contre-lecture | ChatGPT + Gemini | Chef de rédaction et comparaison des sources ; **l'automatisation non supervisée** nécessitera un fournisseur API autorisé | ChatGPT Plus/Google AI Pro **ne sont pas** des crédits API. Gemini API et OpenAI API ont leur propre système de facturation ; ne pas déduire un accès API de l'abonnement |
| Génération d'ouverture IA | Google Flow (option) | Réutiliser le concept D00-v6 validé visuellement pour ouverture/atmosphère ; clip généré importé dans le modèle | **Application Flow**, accessible via abonnement Pro ; **aucune API officielle Flow incluse dans Pro**. Pour une génération entièrement automatisée, envisager Veo via Gemini API séparée, après chiffrage; ne pas confier une carte géographique exacte à une génération probabiliste |
| Voix | Vids FR pour essais manuels, puis TTS API licencié si automatisation | Sélectionner une voix après écoute comparative ; ensuite une même voix versionnée par émission | Google Vids dans Google AI Pro pour usage dans l'app, pas API vidéo / voix garantie ; TTS API facturée à part pour n8n |
| Médias et archivage | Google Drive + GitHub | Drive stocke sources/masters avec droits ; GitHub conserve scripts, décisions, manifests, workflows, tags | Connexion OAuth initiale nécessaire ; ne pas publier le contenu de la Drive par défaut |
| Publication | TikTok/WhatsApp/YouTube selon canaux autorisés | Toujours une APPROBATION HUMAINE puis API si éligible, sinon publication contrôlée via app | TikTok Content Posting API soumise à éligibilité/revue ; ne pas promettre API WhatsApp Channels ni automatiser depuis un compte sans droit |

**Décision** : construire d'abord le workflow n8n sans achats supplémentaires, puis connecter un seul stockage et un seul moteur de vidéo à modèles. Éviter de multiplier les abonnements avant une démonstration réellement satisfaisante.

## 3. Première brique déjà faite : un vrai workflow n8n importable

Fichier : [`n8n/world-vision-radar-v1.n8n.json`](n8n/world-vision-radar-v1.n8n.json).

**Comportement défini dans le fichier :**
1. Déclenchement toutes les heures.
2. Lecture de **quatre flux** RSS publics : BBC Monde, BBC Économie, BBC Technologie et ONU.
3. Fusion et classement par signaux : conflits, catastrophes, géopolitique, économie, IA, santé ; fraîcheur, conséquences humaines et importance ; réduction des sujets « lifestyle »/sans impact.
4. Déduplication et **maximum 12 propositions**, chacune accompagnée de son URL, score de tri, catégorie et exigences de vérification.
5. Sortie dans les exécutions n8n marquée `TO_VERIFY` — **aucune validation automatique, aucun script généré, aucune publication**.

**Limites réelles** : les RSS peuvent être bloqués ou changer d'URL ; l'accès réel n'est PAS testé sur un compte n8n dans cette conversation ; les scores sont heuristiques et **ne prouvent pas qu'un article est exact** ni qu'il fait réellement l'actualité principale mondiale. C'est le radar initial, à compléter avec d'autres sources primaires et corroboration. Il n'enregistre pas encore les résultats dans une base persistante : connecter la Data Table n8n ou Google Sheets après une première exécution validée.

**Étape manuelle unique pour activer le pilote** : ouvrir https://n8n.io/ → essai n8n Cloud → importer le JSON depuis GitHub → exécuter une fois et vérifier les 12 sorties. **Ne pas activer horaire ni API tant que les RSS, scores et déduplication ne sont pas testés.** Une fois validé, activer le déclenchement et connecter la Data Table et l'approbation (un compte et quelques connecteurs, pas cinq mille sites par actualité).

## 4. Identité toujours injectée dans CHAQUE rendu

[Contrat de marque versionné](brand/WORLD_VISION_BRAND_LOCK.json) — applicabilité **avant** le rendu, pas une simple option décorative.

- **Logo G0 officiel validé** : `frontend/web/src/assets/logo.png` ; hash Git connu. Ne jamais remplacer par emoji, dessin improvisé ou vieux logo.
- **Signature Terre/œil D00-v6** : image originale `a_crisp_ultra_detailed_high_contrast_digital_ill.png`, SHA-256 `8d9a9d20f20fbf7757713b6f5eab06590f191166eb779865747f0f59683cfca2` ; Terre dominante, frontière Sahara lisible, atmosphère cyan, blanc pur, **deux** arcs hors cadre et pas de lumières artificielles nocturnes.
- **Statut honnête** : l'image est un concept visuel apprécié mais le **plan animé n'a pas été explicitement validé**, et les **octets de l'image originale ne sont pas encore présents dans GitHub**. Elle est disponible dans l'archive de conversation ; il faudra l'importer UNE FOIS dans les assets Drive/Shotstack (ou autre bibliothèque) avant de pouvoir la réutiliser.
- **Un modèle vidéo World-Vision unique** avec emplacements : `brand_logo`, `earth_opening`, `country_target`, `headline`, `visuals_licensed`, `voice_fr`, `captions_fr`, `citations`, `outro`.
- **Règle de production** : lorsque l'ouverture géographique est indispensable au montage, **bloquer le master final** tant que la version artistique n'est pas approuvée ; on peut préparer le script/voix/visuels parallèlement.
- Contrôle qualité : logo intact + arcs corrects + géographie non inventée + lisibilité iPhone + sources/droits + audio français + SRT + URL et empreintes.

## 5. Flux centralisé : automations, gates et étapes du manuel de 137 pages

| Phase | n8n et fournisseur délégué | Automatique une fois connecté ? | Blocage / validation |
|---|---|---|---|
| Détection | RSS/sources médias → score/déduplication → inbox | **Oui**, prototype importable créé | Le score n'est qu'un tri, pas une sélection approuvée |
| Sélection | Liste de cinq grandes actus, angle et raison d'intérêt | Semi-automatique | **Choix éditorial utilisateur obligatoire** |
| Sources & faits | 2 sources indépendantes + originaux, dates et lieux | API autorisée / n8n | Vérification humaine avant narration |
| Script & storyboard | Gemini API ou autre modèle API avec contexte de marque | Oui **si** API distincte et payante | Script final et durée approuvés |
| Assets & licences | Google Drive, licences et média réel vérifié | Partiel | Aucun faux reportage ni média sans autorisation |
| Ouverture logo/globe | Template Shotstack + asset D00 signé + GIS | Partiel | D00 animé approuvé, exacte localisation |
| Voix | TTS API sélectionné et auditionné | Oui après choix, avec coûts | Diction FR et prononciation validées |
| Montage | Shotstack ou Creatomate via template verrouillé | Oui après template et API | Preview et contrôle humains |
| Sous-titres / QA | Transcription / SRT et contrôles MP4 | Oui techniquement | Lisibilité/fiabilité/son acceptés |
| Approbation / diffusion | Bouton d'approbation, puis canal connecté | **Conditionnel** | **Jamais publication automatique sans accord** |

**Correspondance** : les 14 étapes RADAR, VERIFY, SCORE, APPROVAL, CREATIVE, ASSETS, STORYBOARD, AUDIO, REMOTION / TEMPLATE, PREVIEW, QA, PACKAGE, TIKTOK CLEAN, PUBLISH déjà dans `ProductionJourney.tsx` sont conservées. Le manuel original de 137 pages reste la méthodologie ; les services existants remplacent le développement inutile.

## 6. Politique de sélection éditoriale (correction immédiate)

**L'épisode mangroves NASA du 13 novembre a été explicitement REJETÉ par le propriétaire.** Ne pas le reprendre, ne pas y générer voix, vidéo ou story. Son dossier existe uniquement dans l'historique avec `REFUSÉ` inscrit en tête.

Une actualité proposée pour production doit prioriser :
- événement à portée majeure et actuelle, conséquences concrètes pour les personnes, la sécurité, l'économie ou l'ordre mondial ;
- une vraie accroche compréhensible dans les **3 premières secondes**, pas une formule vide ;
- intérêt public et originalité, pas simplement « un article intéressant aujourd'hui » ;
- **images authentiques ou données vérifiables** disponibles/licenciables ;
- deux sources pertinentes, dates réelles, confirmation du lieu ; pas de biais sensationnaliste ou géographique imposé ;
- panier court de **3 à 5 candidats** plutôt qu'un choix imposé par l'assistant.

**Critère de seuil** : l'humain peut rejeter toute proposition indépendamment du score n8n. Un score automatisé **n'est jamais une acceptation ni une note de qualité artistique**.

## 7. Pourquoi l'automatisation complète n'est pas encore branchée

Il manque seulement des **connexions de services** et des **templates approuvés**, pas un nouveau backend de montage maison :

1. Le compte n8n n'est pas connecté à ce chat : impossible ici de créer ou activer une exécution sur une instance distante inexistante.
2. Le rendu automatique à partir de modèles nécessite un compte et une clé Shotstack/Creatomate (avec abonnement/crédits séparés).
3. Gemini Pro / ChatGPT Plus donnent accès à des **applications**, pas aux appels API des scénarios ; il faut une autorisation et facturation distinctes pour une vraie rédaction/voix automatiques 24h/24.
4. Flow Pro est principalement accessible **dans son interface** : on ne peut pas affirmer qu'un plan généré par Flow est automatiquement produit depuis n8n grâce au seul abonnement étudiant.
5. Les **deux fichiers binaires d'identité** (logo officiel pour template, D00-v6 pour intro) doivent être mis UNE fois dans la bibliothèque de création avant que le rendu récurrent soit reproductible.
6. Les canaux TikTok/WhatsApp exigent des accès et permissions distincts, et l'humain reste responsable de la validation éditoriale.

**Important :** dire ces limites clairement au propriétaire dès le départ ; ne jamais prétendre avoir « connecté tout le système » du seul fait que le JSON est committé.

## 8. Ordre de déploiement sans perdre de temps

**M1 — maintenant :** importer le workflow n8n RADAR, vérifier les résultats, fixer 3–5 sources fiables complémentaires, connecter une file d'approbation. **Livrable** : shortlist utile de grandes actualités consultable sans changer de site.

**M2 — après le premier test :** définir une seule carte vidéo Shotstack/Creatomate à partir de notre vrai logo et de l'asset D00-v6 ; une voix FR sélectionnée, un modèle de sous-titres et un aperçu vertical. **Livrable** : une vidéo témoin portant l'identité World-Vision, même sans publication.

**M3 — connecter services** (Google Drive, API rédaction, voix, rendu) et construire le workflow n8n de production avec trois gates humains ; éviter d'automatiser une étape avant d'avoir validé sa sortie.

**M4 — publier selon les permissions** : TikTok/WhatsApp seulement si statut vidéo `READY_FOR_PUBLICATION` ET approbation explicite. Aucun raccourci publicitaire ni diffusion silencieuse.

**Aucun nouveau code de globe, aucune nouvelle vidéo NASA mangroves ni nouveau site générique ne constitue le chemin critique.**

## 9. Fichiers à conserver au démarrage de chaque chat

- `CONTINUITE_WORLD_VISION.md` (insérer la présente décision en tête pour qu'elle domine les anciens plans devenus obsolètes).
- `docs/continuity/CURRENT_STATE_AND_NEXT_STEP.md`.
- `automation/WORLD_VISION_AUTOMATION_COCKPIT.md` (ce guide).
- `automation/n8n/world-vision-radar-v1.n8n.json` (artefact réel importable).
- `automation/brand/WORLD_VISION_BRAND_LOCK.json` (identité verrouillée).
- `docs/media/AUDIOVISUAL_PRODUCTION_MASTER_PLAN_2026-11-13.md` (137 pages, voix, montage, QA).
- `docs/media/episodes/2026-11-13_mangroves_nasa/PRODUCTION_PACK.md` (historique marqué **REJETÉ**, PAS épisode actif).

Ne pas prétendre avoir livré un portail n8n ou connecté Shotstack : l'étape d'activation des comptes n'est pas encore réalisée.
