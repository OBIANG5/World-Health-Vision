# World-Vision V2 — Continuité R2C : enquête de preuves Gabon–FMI, sources et déploiement bloqué
**Date de point d'ancrage : 21 novembre 2026.** Cette page est une **transmission exacte entre chats**. Ne pas confondre PR testée, données réellement téléchargées, fait journaliste vérifié, site de prévisualisation et production. **Statut au moment de la rédaction : PR #140 en brouillon, CI du dernier HEAD en cours ; résultat final à vérifier dans GitHub.**

## 1. REPRENDRE ICI, sans rien réinventer

Le propriétaire a rappelé plusieurs fois :
- Projet World-Vision international, rigoureux, sources primaires/nationales/locales et contrepoints internationaux, parcours qui sert réellement au lecteur, interface mobile, coût marginal et valeur utilisateur.
- **Le moteur transversal Sources/GDELT/Global Radar, l'Atlas et les comparaisons de preuves sont actuellement plus rentables que de nouveaux écrans Trading-Vision, rôles OIDC isolés ou raffinements cosmétiques.** Le service Trading-Vision futur = publication originale au rythme observé des 160 fiches DataAnalyse, recherche sourcée, outils MTA, prise de trade et freemium/premium ; ne pas abandonner les PR Trading déjà testées. [Décision stratégique #133](https://github.com/OBIANG5/World-Health-Vision/issues/133).
- Tout doit rester récupérable si la conversation s'interrompt : branche, SHA, PR, CI sur ce SHA, ce qui est vrai/non fait, ordre exact des prochains lots.

### Arbre d'ascendance PR : CRITIQUE
1. [#115 Atlas/Product Core](https://github.com/OBIANG5/World-Health-Vision/pull/115) — `product/v2-p2c3c2-signed-scoped-public-read-2026-11-21` : source nationale/statistiques et scoping.
2. [#134 Global Radar R1](https://github.com/OBIANG5/World-Health-Vision/pull/134) — `product/v2-global-radar-gdelt-source-discovery-r1-2026-11-21` : recherche GDELT DOC en ligne sur clic, qui a observé HTTP 429 dans le runner ; comparaison de métadonnées de deux liens, sans validation des faits.
3. [#136 Global Radar R2A](https://github.com/OBIANG5/World-Health-Vision/pull/136) — `product/v2-global-radar-gdelt-static-events-r2a-2026-11-21` : vrai Python `ingestion-service` téléchargent GDELT raw Events via manifest de 15 minutes, MD5, ZIP borné, 61 colonnes TSV, liens HTTPS candidats; **jamais article intégral**.
4. [#139 Global Radar R2B](https://github.com/OBIANG5/World-Health-Vision/pull/139) — `product/v2-global-radar-source-archive-preview-r2b-2026-11-21` : export JSON de 40 URLs max avec droits et date, V2 Chrome 320/390/1440 sur **vraies données GDELT**, dossier Gabon/FMI AGP + FMI + EcoMatin, tests complets et capture. **SHA exact green `22ef673e14c694a42798a30f4d47f65b9ecad754`, [run #44949361155](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44949361155)**. Dernière vraie observation rapportée : slot GDELT 21/11/2026 21:00 UTC, reçue 21:03:17 UTC, 1 507 lignes codées, 185 URL HTTPS distinctes, 1 278 références redondantes, 44 URL invalides/non HTTPS, 40 candidates intégrées au build. Zéro article source téléchargé, zéro vérité d'événement validée.
5. **[NOUVELLE PR #140](https://github.com/OBIANG5/World-Health-Vision/pull/140)** = `product/v2-radar-gabon-imf-claims-evidence-r2c-2026-11-21`, base **exactement PR #139** : **quatre questions sur preuves datées et leurs sources, pas des cartes de plus sans matière**. Statut DRAFT, aucune fusion ni déploiement.

**Ces PR sont des piles de code V2, PAS des branches média.** Aucun coût, abonnement, clé, comptes utilisateurs ni fusion produit n'a été engagé.

## 2. Choix ROI : pourquoi R2C plutôt qu'un grand backend
R2B démontre désormais la vraie chaîne GDELT → ZIP → JSON avec crédit → React V2 → vrai iPhone Chromium. Pourtant :
- Une **liste de 40 URL sans titres ni vérification des affirmations** est encore très peu utile au grand public.
- Une chaîne d'alertes/stockage/scaling aurait du volume technique sans répondre à « que s'est-il réellement passé ? ».
- Le propriétaire a explicitement demandé des sujets concrets, sources nationales/locales, internationales, contradictions de faits et information utile pour Média/Atlas/Trading/BRVM.
R2C crée un **modèle de revue d'affirmations et ses liens vérifiables**, appliqué à un vrai dossier pays (Gabon–FMI) sans acheter une donnée tierce ni copier les articles. La suite du service Global Radar doit peupler ce modèle via une démarche éditoriale contrôlée, et non une IA prétendant avoir fait du fact-check automatique.

## 3. Sources consultées le 21 novembre 2026 — contrôler la provenance

**Cadre méthodologique** : ces URL ont été retrouvées et des passages de contenu de leurs pages étaient fournis par un index public de recherche. La tentative de téléchargement direct des pages dans l'outil de navigation a signalé un *cache miss*. **Les fichiers source complets, les PDF, l'historique de toutes les corrections et l'entretien Bloomberg d'origine n'ont PAS été indépendamment récupérés et versionnés**. Toutes les conclusions décrivent des **déclarations attribuées** et non des faits finaux établis. Aucune extraction à republier sous copyright.

- AGP, 25 septembre 2026, « Gabon-FMI : vers l'ouverture de négociations formelles » : https://agpgabon.ga/gabon-fmi-vers-louverture-de-negociations-formelles-pour-un-nouveau-programme-economique/
  - Reprend expressément un **communiqué gouvernemental** sur le déplacement/rencontre avec Hermann Immongault.
  - Le texte accessible via index évoque une visite terminée le **19 septembre** et un entretien du **23 septembre**. Ne pas l'étiqueter « deux sources primaires indépendantes » ni affirmer à ce stade que l'AGP s'est trompée.
- FMI, communiqué primaire **26 septembre 2026** « IMF Staff Concludes Visit to Gabon » : https://www.imf.org/en/news/articles/2026/09/26/pr2305-imf-staff-concludes-visit-to-gabon
  - Le FMI indique visite de l'équipe Aliona Cebotari **14 au 25 septembre**, discussions techniques sur finances publiques/audit de la dette, orientation 2027 et continuation de discussions en préparation d'éventuelles négociations.
  - AUCUN programme approuvé annoncé dans CE communiqué ; cela n'affirme pas qu'aucun accord ne sera approuvé ensuite. Page française aussi retrouvée dans l'index à `https://www.imf.org/fr/news/articles/2026/09/26/pr2305-imf-staff-concludes-visit-to-gabon`, mais R2B conserve l'URL en officielle indexée en anglais.
- EcoMatin, 20 novembre 2026, publié à 08:18 et modifié à 08:21, signé René Ombala : https://ecomatin.net/le-gabon-vise-un-accord-avec-le-fmi-en-decembre-apres-une-revision-a-la-baisse-de-sa-dette
  - Rapporte **un entretien Bloomberg du 19 novembre** avec le ministre Thierry Minko : **objectif** d'accord au niveau des services pour décembre puis éventuel passage au Conseil en janvier ; **ne pas requalifier comme décision du FMI déjà actée**. L'entretien Bloomberg primaire n'a PAS été récupéré/reproduit/licencié.
  - Rapporte un audit national donnant environ **69 % dette/PIB** et indique que le **FMI n'a pas validé l'audit** à la date de cette publication. Ne pas présenter 69 % comme « chiffre FMI », ni faire de graphique officiel sans périmètre et dénominateur PIB établis.
- Documents supplémentaires consultables pour un contrepoint et vérifier la chronologie : ministère gabonais des Affaires étrangères, 29 septembre 2026, https://www.affaires-etrangeres.gouv.ga/9-actualites/3449-gabon-fmi-vers-lapprofondissement-des-discussions-sur-la-dette-et-les-finances-publiques/ ; Reuters 26 septembre https://www.reuters.com/world/africa/imf-concludes-visit-gabon-says-debt-talks-continue-2026-09-26/ . **Attention** Reuters réutilise des éléments du communiqué FMI, le ministère gabonais en reprend également la thèse, indépendance non démontrée.

### Questions R2C et stade des preuves
| Question | Source(s) | Conclusion prudente | Reste à faire |
| --- | --- | --- | --- |
| DATE_FIN_MISSION | AGP 19 septembre vs FMI 14–25 septembre | **Écart potentiel de chronologie**, peut correspondre à des phases différentes | Communiqués originaux et corrections, préciser période de mission et date de l'entretien |
| ETAT_NEGOCIATIONS | FMI 26 septembre | **Discussions techniques préparatoires selon FMI**, pas d'approbation dans ce communiqué | Rechercher toute décision datée plus récente de l'Executive Board |
| OBJECTIF_DECEMBRE | EcoMatin 20 novembre citant Bloomberg du 19 novembre | **Objectif ministériel** d'accord au niveau des services, pas accord acquis | Interview primaire et communiqués FMI ultérieurs |
| AUDIT_DETTE_69% | EcoMatin 20 novembre sur audit gouvernemental | **Estimation/présentation attribuée au gouvernement**, non certifiée FMI selon l'article | Audit original, définition dette/PIB, révisions et contrepoints indépendants |

**Le fait que 2 sites publient des phrases similaires ne prouve ni indépendance rédactionnelle, ni vérité, ni droit de redistribution.** Le modèle R2C refuse toute promotion automatique de ses statuts et n'a pas de fonction de « décision du vrai ».

## 4. Fichiers R2C nouvellement modifiés
- `frontend/web-v2/src/radar/editorialClaimReview.ts` — contrat TypeScript générique `EditorialClaimReview`, `EditorialClaimEvidence`, statuts `POTENTIAL_DATE_DISCREPANCY`, `PRIMARY_INSTITUTION_POSITION`, `GOVERNMENT_TARGET_VIA_PRESS`, `ATTRIBUTED_ESTIMATE_NOT_APPROVED`, preuves `sourceId` reliées au dossier R2B; `reproducedQuote=false`, `originalPublisherDocumentReviewed=false`, `independentFactCheckComplete=false`; invariants d'unicité, source, droit, date, provenance.
- `frontend/web-v2/src/components/layout/GlobalRadarClaimEvidence.tsx` — UI FR/EN, 4 questions repliables, valeur rapportée et lecteur/source/date/liens, interprétation prudente et prochaine vérification; pas de HTML source, de génération IA ni de classement arbitraire.
- `frontend/web-v2/src/components/layout/GlobalRadarEditorialPilot.tsx` — insère les affirmations **dans le vrai dossier Gabon/FMI**, pas un écran supplémentaire isolé.
- `frontend/web-v2/src/styles/global-radar.css` — style responsive accessible iPhone 320/390 et desktop, contraste, cartes limitées et liens originaux.
- `frontend/web-v2/scripts/test-global-radar-claims.mjs` — véritables objets TS transpilés puis importés (sans redéfinir la logique), rejette faux fait validé, blanchiment de sourceId, lien d'une autre source, copie d'éditeur, article prétendument lu, fausse indépendance, temps et texte.
- `frontend/web-v2/global-radar-real-archive-browser-smoke.mjs` — vrai React/Chrome sur 320/390/1440, ouvre 4 questions, vérifie les DEUX dates AGP/FMI, les sources, les limites Bloomberg et dette, liens HTTPS sûrs, puis le parcours GDELT existant, mobile/scroll/CSS/robots.
- `.github/workflows/whv-v2-global-radar-real-browser-r2b.yml` — ajoute la branche R2C, les tests de domaine et le lint ; pas de nouveau pipeline coûteux, **le vrai appel fournisseur reste déclenché seulement à la demande** via workflow_dispatch ou commit explicite `[radar-live-probe]`. Les tests offline couvrent un snapshot clairement SYNTHETIC.

## 5. Vérification / CI
À l'heure d'écrire :
- PR #140 HEAD de **code** avant ce document : `7dfb2ef9d5b90038f97a898a44a9f07167c4aa7f` ; [Actions R2C #44950302455](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44950302455) était en cours de vérification (Python/snapshot TS/ESLint/TypeScript6 déjà verts, Chromium à vérifier).
- Cette page créée ensuite modifie le HEAD; NE JAMAIS prétendre `CI green sur dernier HEAD` sans relire le SHA effectif et le run exact.
- Le site actuel Vercel ne pointe pas sur ce dossier R2C : l'absence de déploiement est **volontaire** tant que l'autorisation Git et la protection du preview ne sont pas démontrées.
- R2B preuve historique de vrai provider (pas refaire inutilement à chaque push) : SHA `22ef673e14c694a42798a30f4d47f65b9ecad754`, [Action 44949361155](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44949361155) green ; archive ZIP réelle MD5 et capture 320/390/1440. R2C ajoute des assertions éditoriales; nouveau R2C run offline requis.

## 6. BLOCAGE PRODUIT PRIORITAIRE : Vercel n'a PAS le droit d'accéder au dépôt GitHub privé
- Vercel project déjà présent `world-health-vision-v2`, project ID `prj_fHnsDAO3uqgmeGwezmbGah8CJZzF`, team `team_IMgX20wpMDXdEtWinjaFIU0T` (Hobby), site production existant READY.
- Une tentative ancienne de preview, deployment `dpl_9LY1gfbMEBvvGK9m7o6ZhX6DtiYz`, a fini `ERROR git_info_fail` car **l'installation GitHub de Vercel n'a pas autorisé le dépôt privé `OBIANG5/World-Health-Vision`**. La connexion GitHub à ChatGPT ne donne PAS cet accès à Vercel. Une nouvelle création de déploiement Git sans permission n'apporte aucune valeur et consomme une tentative.
- **UNIQUE action utilisateur nécessaire à ce gate :** dans les paramètres d'intégration Git/GitHub de l'équipe Vercel, installer/autoriser l'application Vercel dans GitHub et permettre l'accès **au seul dépôt privé `OBIANG5/World-Health-Vision`**, puis relier la branche preview au projet (sans modifier le domaine de production). L'utilisateur doit agir explicitement; ne pas lui demander token ou mot de passe dans le chat.
- Une fois lié : déploiement **preview uniquement** (pas `production`), si possible protégé par authentication/password; preview-only `noindex,nofollow,noarchive` déjà géré par `scripts/build-radar-preview.sh` sans toucher au SEO production. Réutiliser Vercel Github auto-preview si connexion autorisée; pas besoin de recréer une seconde application.
- IMPORTANT : publication d'un batch GDELT ancien sur un preview figé doit montrer la date de source et l'âge ; **ne pas activer Watch, billing ni 15min cron** sans usage mesuré. La preuve actuelle est un artefact GitHub de compilation, pas une URL mobile accessible.

## 7. SUITE LA PLUS INTELLIGENTE selon valeur/effort (et conditions de réussite)
1. **Maintenant** : corriger tout échec CI Node/TS/ESLint/vrai Chromium de la PR #140, obtenir `completed/success` sur son HEAD exact, enregistrer jobs SHA et arrêt. Ajouter un commentaire PR/issue #133/#96 avec vrai statut.
2. **Dépend de l'utilisateur (Vercel)** : autoriser l'app GitHub dans Vercel pour le dépôt PR, protéger la preview, charger le build V2 avec archive GDELT datée, tester sur vrai iPhone et ne pas affecter production ; fournir enfin l'URL réellement accessible. Si besoin créer un outil de preview isolé sans coûts futurs, mais pas un autre front autonome.
3. **Étape métier P2 comparative** : faire relire/versionner **les documents originaux complets et leurs corrections** AGP/FMI/EcoMatin + entretien Bloomberg seulement sous droits. Changer les statuts source après preuve; puis compléter une source nationale institutionnelle et une source internationale indépendante avec définitions/revisons. Ne jamais transformer « 69 % » en statistique FMI avant validation.
4. **Réutilisation internationale** : créer une **structure de dossier pays/événement** réutilisable et 2 autres cas pilotes de régions distinctes dont les sources nationales/officielles sont réellement accessibles, et mesurer 320/390/1440, qualité, coûts/réutilisation. Éviter l'illusion de couvrir 217 pays avec 1 dossier.
5. **Après preuve d'usage** : SourceDocument/ClaimEvidence/EventSignal central en backend existant, idempotence et droits/TTL; Watch calendrier et Trading-Vision service éditorial **consommateurs**, Média et BRVM aussi. Ne pas continuer de peaufiner un Radar sans lecteur.
6. **Transparence** : PR DRAFT #140 ne sera ni mergée ni déployée sans autorisation et preuves. Ne pas prétendre que ce dossier est une vérification journalistique automatique ou que Vercel preview fonctionne.

## 8. Mode d'emploi pour toute reprise ultérieure
- Ouvrir dans GitHub **#133**, **#140**, le **HEAD de #140**, cette page puis **#96** et **#135**.
- Lire l'état des workflows **sur SHA exact** et logs d'échecs; ne pas « continuer » un ancien ticket #131 Trading par simple proximité.
- Pour changer quelque chose, travailler sur la bonne branche R2C ou une nouvelle PR empilée, conserver ascendance vérifiable et écrire dans la PR ou une issue **où la réflexion s'est arrêtée, ce qui vient d'être réalisé, ce qui reste, les preuves**.
- La priorité persistante : **utilité internationale et parcours mobile exploitable > accumulation de code > décorations**, en restant rigoureux sur les sources et droits.
