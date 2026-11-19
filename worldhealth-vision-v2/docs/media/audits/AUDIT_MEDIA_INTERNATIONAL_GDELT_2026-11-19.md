# WORLD-VISION — AUDIT DU PÔLE MÉDIA ET STRATÉGIE DE PRODUCTION INTERNATIONALE

Date de lecture : 2026-11-19. Nature : audit documentaire et statique du code GitHub connecté, non audit d'exécution du service en production, non test artistique intégral des MP4. Document de reprise inter-chat. Branche de documentation isolée : audit/worldvision-media-global-2026-11-19, fondée sur feature/world-vision-media-studio. Aucun déploiement, aucune fusion, aucune publication et aucun achat autorisés par ce document.

## 1. Règles de continuité et référentiels

- Dépôt : OBIANG5/World-Health-Vision. Produit logiciel canonique : worldhealth-vision-v2/ sur v2. main est historique V0, ne pas réécrire V0/V1 ou remplacer V2.
- Média : feature/world-vision-media-studio, PR #5, brouillon non fusionné dans v2. L'aperçu whv-media-studio-browser-preview est statique et comporte des données de démonstration, pas une rédaction live.
- Vision globale déjà documentée indépendamment : docs/product/STRATEGIE_INTERNATIONALE_WORLD_VISION_MASTER_2026-11-19.md et docs/product/REGISTRE_PRODUITS_SOURCES_REVENUS_PRIORITES_2026-11-19.md sur improve/v2-analytics-perf-and-global-vision-2026-11-19.
- Continuité du noyau : docs/continuity/HANDOFF_CORE_F12B_2026-11-19.md. PRs #35, #36, #38, #39, #40 sont en brouillon ou empilées, sans déploiement du backend V2 mondial.
- Distinguer cinq états : idée, code committé, test CI réussi, environnement fonctionnant réellement, publication et usage effectivement prouvés. CI verte ne signifie jamais journalisme fiable ni qualité artistique approuvée.

## 2. Inventaire des branches médias (familles et état)

| Famille | Branches/PRs clés | Ce qui est exploitable | Statut et risque |
|---|---|---|---|
| Service rédactionnel et interface | feature/world-vision-media-studio / PR #5; improve/media-studio-mobile-preview / PR #6; whv-media-studio-browser-preview | FastAPI, React Control Room, RADAR, VERIFY, CREATIVE, ASSETS, AUDIO, QA, publication manifest; aperçu iPhone démonstratif | PR #5 draft; PR #6 fusionnée seulement dans feature; pas de serveur média 24/7 attesté |
| Shenzhen / reportage 001 | rebuild/editorial-v2-quality-gates, refine/worldvision-shenzhen-vivienne-v4-captions / PR #20, scripts Remotion et segments | Montage 33,7–43s, globe réel, sous-titres calés sur audio, postmortems, anciennes variantes préservées | Notes utilisateur 5–5,5/10 pour le film 33,7s; attention aux faits futurs dans les scripts historiques |
| Soudan du Sud | feature/worldvision-south-sudan-short, -v2-editorial, -v3-locked-vivienne / PR #16 #17 #19 | Hash script, globe NASA/Natural Earth, narration Vivienne, provenance images | V1 rejetée; V3 publiée par utilisateur puis jugée 4–5/10; licence vocale commerciale non établie |
| Guinée / Siguiri | feature/worldvision-guinee-siguiri-v1, -v2-voice-endcard, -v3-authentic-visuals / PR #22 #25 #27 | Script verrouillé, continuité sonore, 13/16 plans remplacés par images réelles pertinentes de Guinée, métadonnées | Version V3 47,133s, appréciation ~6/10, pas master validé; licence CC BY-SA à traiter |
| Voix World-Vision | improve/worldvision-voice-first-pipeline, -vivienne-only-v3, -vivienne-impact-c4-natural-flow; production/worldvision-vivienne-c52-voice-lock / PR #21 #23 #24 #26 | Vivienne C5.2 Impact média, fichier exact 14,088 s +8%, hash, prises continues, profil approuvé | Une référence de *style* seulement, narre la Nouvelle-Orléans : ne jamais utiliser ce MP3 pour autre sujet; +6% à essayer, non validé; licence commerciale Edge à confirmer |
| Auditions 16 novembre | audition/worldvision-vivienne-30s-2026-11-16; audition/worldvision-vivienne-victoria-20s-2026-11-16 | Deux nouveaux MP3 d'audition + prises brutes + rapports et Actions, ajoutés après la branche C5.2 | Sont des AUDITIONS et non des autorisations commerciales; ne modifient pas l'identité vocale choisie |
| WV002 Nouvelle-Orléans | fix/worldvision-002-rejected-authentic-footage-first; production/worldvision-002-authentic-archives-documentary; production/worldvision-002-director-cut-v4 / PR #29 #32 #33 | Gates anti-fausses images, archives USCG authentiques, rendu V4 Remotion 39s 1170 frames, 1080x1920 | Archives USCG 2014/2016/2022, pas rush authentique de l'accident 2026; rendu candidat non validé; droits vocaux insuffisamment établis |
| Montage ultra-répétable | feature/worldvision-fastlane-assembly-only / PR #30 | Assemblage uniquement d'assets, voix et script déjà approuvés, SHA verrouillés, contrôles de timings, non-réencodage quand compatible | Test synthétique 8s/3 plans monté en 0,91s; pas preuve d'un reportage réel prêt en cinq minutes |
| Brooklyn | feature/worldvision-brooklyn-editorial-pack / PR #31 | Dossier sources, storyboard de dix plans, script proposé | Non approuvé, vidéo de presse sous droits sans licence prouvée, aucune publication autorisée |
| Design du logiciel V2, distinct du média | design/v2-global-intelligence-editorial / PR #28; design/v2-photographic-eye-globe / PR #34 | Concepts d'interface éditoriale, œil/globe interactif | Ne pas traiter comme pipeline audiovisuel ni fusionner sans QA du logiciel |

Données de dépôt : 59 branches identifiées le 19 novembre. La comparaison GitHub v2...feature/world-vision-media-studio indique une divergence (760 commits devant et 63 derrière v2) : ne PAS merger en bloc. Réconcilier par petits ensembles de changements audités, si un rapprochement V2 est un jour décidé.

## 3. Forces techniques mesurables ou visibles dans le code

1. Service FastAPI isolé; contrats d'API pour scan, articles candidats, vérification, notation, sélection d'accroche, approbations, rendu, paquet et reçus de publication.
2. RADAR via recherche Web structurée, extraction des URL réellement récupérées, enrichissement par catalog-service. Scheduler Redis avec lock et heartbeat, cadence paramétrable de 300 secondes SI activé, configuré et hébergé.
3. VERIFY décompose une histoire en affirmations; URL de preuve exigée parmi les URL récupérées; tests de rejet de liens inventés, gestion des contradictions et double comptage d'un même domaine.
4. CREATIVE oblige une liaison claim_indexes entre affirmations confirmées et texte, accroches, narration et scènes.
5. ASSETS métadonnées de provenance et droits, sélection par scène, blocage si l'image/vidéo requise n'a pas de droits approuvés. Wikimedia donne une première source utile mais insuffisante pour l'actualité chaude.
6. Remotion et FFmpeg produisent de vrais MP4, codecs et durée mesurés, normalisation audio, hash SHA-256, rapports QA. Job store Redis existe en plus de la version mémoire dans le code; validation d'exploitation persistante reste à démontrer.
7. Flux de publication manifesté par empreinte cryptographique, avec statut published dépendant de preuves de chaque canal; TikTok direct post et WhatsApp Channels ne sont PAS connectés à une publication réelle.
8. Retours humains versionnés, scripts hashés, photographies de contrôle des vrais rendus, CI de régression. Excellent héritage à préserver.

## 4. Critiques vérifiées et dette la plus lourde

- Configuration settings.py de la feature : repository_backend=memory, seed_demo_story=True, radar_scheduler_enabled=False, openai_api_key=None, voix par défaut marin. Rien de cela ne constitue l'exploitation mondiale; marin contredit Vivienne approuvée.
- Source_registry.py : petit registre de neuf entrées d'amorçage; le catalogue local enrichit le modèle, mais la couverture nationale réellement ingérée/contrôlée n'est pas établie pour 217 pays.
- Dédoublonnage : empreinte calculée sur pays + titre normalisé, insuffisant pour une même histoire reprise par 20 médias ou traduite dans 6 langues. Il faut grouper des événements (date, acteurs, lieu, action, liens syndicés) et distinguer mise à jour / nouvel événement.
- VERIFY : une URL retournée par une recherche prouve qu'un lien existe dans les résultats, pas que son contenu étaye précisément l'affirmation. Le statut claim peut être verified avec une URL de soutien; le verdict global est verified quand tous les claims le sont et >=2 domaines ou une source primaire. Risques : syndication commune, faux consensus, source institutionnelle intéressée, citations sans extrait de preuve, horodatage obsolète. Ajouter un audit indépendant d'entailment, sources indépendantes, preuve textuelle/horodatée et statut contesté.
- Score : mélange fraîcheur, importance, impact humain, pertinence Afrique/francophone, potentiel visuel, sous-couverture et saturation. Une note unique ne doit jamais décider la vérité, la priorité civique et la viralité simultanément.
- Asset scoring : privilégie résolution, portrait, poids, format et droits; la pertinence du contenu du plan par rapport au fait est insuffisamment représentée dans la sélection numérique.
- QA : nombreux tests structurels, pas audit complet des pixels et du mouvement. Un export annoncé 1080p peut venir d'un 720p agrandi; faux accidents SVG peuvent passer le ffprobe; des images réelles mais génériques peuvent dégrader le reportage.
- Plusieurs générations complètes déjà ont obtenu des notes artistiques de 1/10 (COP31), 4–5/10 (Soudan du Sud), ~6/10 (Siguiri). Ne jamais confondre plus de tests techniques et meilleure vidéo.
- Risques de licences voix / rushes, tromperie involontaire par images d'archives, marque incohérente entre branches, sous-titres recouvrant les éléments mobiles TikTok, lenteur/stabilité/preview non prouvées 24/7.
- Documentation historique contradictoire (par exemple README media-service plus ancien disant mémoire uniquement malgré Postgres codé, README renderer plus ancien malgré RedisJobStore). Créer des pages STATE_BY_COMMIT fondées sur date de lecture, commit, preuve d'exécution, un seul registre décisionnel actuel.
- Pas de CMS international/bloc blog complet ni de diffusion SEO démontrés dans la chaîne média examinée. Ne pas présenter la partie blog comme livrée.
- Divergence de stack : une proposition de cockpit n8n+Shotstack/Creatomate coexiste avec backend FastAPI+Redis+Remotion. Éviter deux systèmes d'état, deux workflows d'approbation et deux moteurs concurrents pour un même reportage. N8n peut être périphérique, pas remplacer les garde-fous rédactionnels; Shotstack/Creatomate pour des cas justifiés uniquement.

## 5. Identité média approuvée, à ne pas altérer automatiquement

- Logo G0 historique œil/globe et signature animée originale silencieuse sur fond acier clair/graphite. Ne pas dessiner un autre logo ou remplacer son MP4 sans décision.
- Voix exclusive fr-FR-VivienneMultilingualNeural; profil C5.2 Impact; réutiliser le STYLE, non les mots ni le MP3 de Nouvelle-Orléans. Prise continue sur nouveau script verrouillé, sans collage brutal de silences. Le débit +8% est légèrement trop rapide selon le propriétaire; +6% reste à auditionner, pas une nouvelle décision.
- Globe géographique exact NASA/Natural Earth, quand il sert l'histoire; une ouverture de 0–3s n'est pas un rituel obligatoire au détriment de la vraie image d'accroche; faire voir la scène forte rapidement.
- Plans véritables autorisés et précisément liés à chaque phrase; archives datées clairement dans le dossier et contextualisées auprès du public; pas d'images fabriquées présentées comme la vraie scène.
- Pas de bandeaux permanents, micro-mentions QA, habillages arbitraires, cartons beiges, cadres de logo, 720p upscalé, fonds trop vides ou sous-titres qui recouvrent les visages. Qualité à apprécier sur écran iPhone réel, pas au seul niveau du fichier.
- Média World-Vision doit chercher exactitude, clarté, attention et intérêt public, sans sensationnalisme ni représentations trompeuses.

## 6. Formats éditoriaux : produire UNE fiche de preuves, puis plusieurs sorties

Un EditorialCase canonique versionné doit alimenter :
- Flash vertical 10–30s (ou durée adaptée au sujet), hook + preuves visuelles fortes + conséquences.
- Reportage vertical contextuel 30–90s avec narratrice Vivienne, carte, preuves, archives légendées selon pertinence.
- Carrousel TikTok trois images : première URGENT / hook / « Swipe pour comprendre », deuxième compréhension / « Swipe pour voir les conséquences », troisième conséquences et appel à suivre discret. Trois options A/B/C pour le texte de CHAQUE image, validation utilisateur, une image générée à la fois, logo invariant, photos journalistiques, grande typographie sans marges excessives, safe zones réelles.
- Article Web (news rapide, analyse factuelle, « ce que l'on sait / ignore », chronologie, sources, date de mise à jour, corrections). Page Article/NewsArticle structurée, URL canonique, éditorial signé, images licenciées, sitemap et vidéos liées.
- Fiche pays enrichie V2, carte/chronologie, graphique comparant observations officielles et institutionnelles selon périodes et limites.
- Newsletter, fil WhatsApp, extrait YouTube Shorts, audio/podcast et page de sources selon droits et stratégie; jamais auto-distribués sans validation canal.

Une carte éditoriale unique doit porter source exacte, extrait de preuve, auteur/éditeur, dates event/publish/fetch/update, pays ISO3 et lieux, candidats GDELT, score d'importance DISTINCT du score d'engagement, licence des assets, version du script, voix, plan, état d'approbation, versions de tous les exports et reçus.

## 7. GDELT/EarlyForge reliés au Media Studio

GDELT : Events/CAMEO, Mentions, GKG, données multilingues et mises à jour annoncées toutes les 15 minutes; source de SIGNAUX / MENTIONS et de regroupements, jamais constat indépendant de vérité. Débruitage langues/pays, géocodage, biais de couverture et regroupements d'articles syndicés. EarlyForge : inspiration en découverte, regroupement, fraîcheur, contexte et revue; pas un composant possédé ou une API contractuellement acquise.

Contrat cible :
SourceAdapter -> RawEventMention -> NormalizedEntity -> StoryCluster -> EvidenceReview -> EditorialCase -> APPROVAL -> CREATIVE -> ASSET_RIGHTS -> BRAND_VOICE_LOCK -> RENDER -> QA_HUMAN -> CHANNEL_EXPORT -> RECEIPTS -> ANALYTICS.
En parallèle, le même Signal peut enrichir WorldMapSignal, World-Vision Watch, fiche pays, alertes pertinentes. Conserver séparés OfficialStatisticalObservation, EventSignal, PriceOffer, FinancialMarketObservation (droits, fréquence et types de preuve différents). Global Radar n'est pas encore branché à la V2; ne pas dire le contraire.

## 8. Best practices médias internationaux à adopter sans recopier une identité

Reuters/AP : vérification indépendante, impartialité, corrections rapides et claires, rigueur sur noms/dates/chiffres, source première lorsque possible. C2PA/Content Credentials : provenance signée et chaîne de production utiles, PAS certificat de véracité du fait filmé. Mise en page de type grande rédaction : priorité à une vraie scène documentaire et à un fait précis, hiérarchie sobre, narration naturelle et équilibrée, pas de faux effet cinéma.
Le benchmark World-Vision doit séparer :
- Qualité journalistique : exactitude des affirmations, nombre de corrections, preuves indépendantes, fraîcheur, contradictions reconnues, couverture local/international.
- Qualité audiovisuelle : note humaine par plan et vidéo entière, accroche vraie dès 0–3s, utilité visuelle, correspondance mot/plan, clarté en téléphone, prosodie, rythme, cohérence de marque.
- Distribution : formats adaptés à chaque plateforme, contenu sans surimpression interdite, post exact, reçus vérifiables, accessibilité/versions.
- Audience réelle : rétention 3s / 10s, complétion, visionnage moyen, partages, sauvegardes, lecture engagée sur blog, progression de la confiance; aucune promesse artificielle de viralité.
- Économie : coût légal complet par reportage, minutes de revue, sourcing, API, stockage, retour en visites ou abonnements réels, indépendance des sponsors.

## 9. Séquence de consolidation prioritaire

P0 — Patrimoine et gel : registre unique des branches, PRs, scripts et voix exacts, logos, licences, notes et masters; désigner code candidat versus historique et refusé, interdire changement silencieux. Ne pas remerger les 760 commits de PR #5 en bloc.

P1 — Exactitude + cas éditorial unique : modèle Evidence/Claim/Source, contrôles indépendants, déclencheur multi-sources. Dédupe événement multilingue; politique des corrections et mises à jour; une actualité sourcée -> un dossier partagé entre article, vidéo et carte.

P2 — Production qualité : un moteur d'assemblage approuvé avec Remotion/FFmpeg/FASTLANE; intégrer la voix Vivienne via voie commercialement autorisée; médias véritablement disponibles sous droits; sous-titres issus des mots audibles; pixel/frame QC et approbation complète mobile; créer trois modèles de format distincts (flash, reportage, carrousel) sans abandonner les possibilités avancées.

P3 — Site public/blog : front presse séparé des outils économiques mais relié à la même fiche de preuves, pages NewsArticle, corrections, dossiers pays et recherche; mesure de performance, accessibilité, multi-langues en phase ultérieure.

P4 — Exploitation fiable : staging avec backend réel, Postgres/Redis, stockage des médias, secrets et backups, alertes; pas de démonstration de sécurité en production avant arbitrage des PR #35/#36/#38/#39/#40.

P5 — GDELT et observatoire international : connecteur incrémental pilote, mesures des faux positifs/doublons/latences, test de plusieurs langues et régions, suivi de tendances et hypothèses, validation indépendante locale. Puis World-Vision Watch, cartes et produits Money/Transport/etc.

P6 — Distribution et apprentissage : export par canal après signature humaine, TikTok OAuth/audit/consentement si éligible, WhatsApp Channel manuel tant que connecteur officiellement autorisé absent, YouTube selon droits; reçus réels. Retours analytiques par épisode avec coût/qualité/corrections; apprentissage des refus.

Critère final du premier parcours complet : un événement réellement vérifié et sourcé; storyboard et médias conformes; voix légalement diffusable; un article actualisable, une vidéo 1080x1920 dont chaque plan a été visionné et écouté, un carrousel approuvé; publication réelle consentie sur au moins un canal; source et rectification accessibles; rapport de performance; aucune donnée fictive ou droits manquants.

## 10. Risques de stratégie et règles d'arbitrage

- Ne pas confondre rythme cible (jusqu'à une vidéo/h) et qualité effective. Priorité à la meilleure vidéo utile et fiable, pas au maximum de rendus générés.
- Le Média doit être moteur d'acquisition et confiance, non un entonnoir publicitaire opaque; séparation nette rédaction, affiliation, sponsoring et verticales financières.
- La source locale n'est pas automatiquement exacte; juxtaposer sources primaires, médias locaux et contre-enquête indépendante. Aucune « neutralité » obtenue par juxtaposition mécanique de deux opinions sans qualité de preuve.
- L'asset non disponible est un vrai blocage; aucune reconstitution trompeuse n'est permise. Préférer carte sourcée, document officiel, graphique vérifiable et voix solide.
- Au moins une relecture humaine obligatoire des sujets sensibles, en particulier violences, victimes, conflits, finance et déclarations officielles.
- Les contraintes de plateforme et de droits évoluent; revérifier avant production effective. Aucun abonnement ChatGPT/Gemini ne vaut automatiquement un droit à leurs APIs ou aux vidéos tierces.
- Mesurer toute fonctionnalité par « état réel » (non conçue / code / test / intégrée / déployée / utilisable par public) et citer le commit/PR/proof.

## 11. Preuves et liens de reprise

- Media studio : https://github.com/OBIANG5/World-Health-Vision/pull/5 ; preview iPhone PR #6 : https://github.com/OBIANG5/World-Health-Vision/pull/6
- Soudan du Sud : https://github.com/OBIANG5/World-Health-Vision/pull/19
- Guinée V3 : https://github.com/OBIANG5/World-Health-Vision/pull/27
- Voix C5.2 : https://github.com/OBIANG5/World-Health-Vision/pull/26 ; 16/11 auditions branches voice explicites ci-dessus
- WV002 postmortem : https://github.com/OBIANG5/World-Health-Vision/pull/29 ; rendu V4 : https://github.com/OBIANG5/World-Health-Vision/pull/33
- FASTLANE : https://github.com/OBIANG5/World-Health-Vision/pull/30
- Brooklyn sources/rights : https://github.com/OBIANG5/World-Health-Vision/pull/31
- Principes médias : docs/media/WORLD_VISION_MEDIA_STUDIO.md; docs/media/VOICE_REFERENCE.md; docs/media/EDITORIAL_VIDEO_QUALITY_GATES.md; docs/media/REVIEW_AND_APPROVAL_WORKFLOW.md; docs/media/QUALITY_GATE_EDITORIAL_2026-11-13.md; docs/media/PUBLISHING_CONNECTORS.md
- GDELT officiel : https://gdeltproject.org/data.html ; Reuters standards : https://reutersagency.com/about/standards-values/ ; TikTok officiel : https://developers.tiktok.com/docs/en/content-posting-api-get-started ; Google Search Article : https://developers.google.com/search/docs/appearance/structured-data/article ; C2PA : https://spec.c2pa.org/

## 12. Reprise immédiate

Ce document n'a modifié aucun code. Le chantier recommandé ensuite est un audit de fusion sélective (pas merge intégral) de Media Studio et de ses modules de qualité, avec statut explicite pour chaque morceau, puis un parcours éditorial réel polyvalent (article + vidéo + carrousel) testé et approuvé. En parallèle, le connecteur pilote GDELT doit rester distinct des PR de sécurité du noyau jusqu'aux validations, et son premier résultat ne doit pas être déclaré « vérifié » sans enquête source indépendante.