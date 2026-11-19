# WORLD-VISION — UX-1A : recherche internationale, navigation partageable et continuité produit

**Date : 19 novembre 2026.** **PR #67 DRAFT**, branche `product/world-vision-ux1-discovery-routing-2026-11-19`. Statut : code implémenté dans le frontend candidat, **aucune fusion / aucun déploiement public**. L'objectif est de construire un produit international utile, sans sacrifier les preuves, la qualité ni les développements déjà accomplis.

## 0. Lire d'abord en cas de changement de chat

1. [PR #67 — UX-1A](https://github.com/OBIANG5/World-Health-Vision/pull/67) ; base immédiate [PR #64 — UX-0](https://github.com/OBIANG5/World-Health-Vision/pull/64), dont la base est [PR #35 — qualité mobile/globe](https://github.com/OBIANG5/World-Health-Vision/pull/35).
2. `docs/product/WORLD_VISION_REORGANISATION_FONCTIONNELLE_ET_UX_2026-11-19.md` : feuille de route centrale des plateformes et de l'architecture. Présente sur la branche UX.
3. **Documents maîtres internationaux** (sur branche DRAFT de [PR #59](https://github.com/OBIANG5/World-Health-Vision/pull/59), pas encore dans la branche UX) :
   - `docs/product/STRATEGIE_INTERNATIONALE_WORLD_VISION_MASTER_2026-11-19.md`
   - `docs/product/REGISTRE_PRODUITS_SOURCES_REVENUS_PRIORITES_2026-11-19.md`
   - `docs/continuity/HANDOFF_CORE_F12B_2026-11-19.md`.
4. [Issue #66 — prochaine phase UX-1B](https://github.com/OBIANG5/World-Health-Vision/issues/66), [issue #63 — fiabilisation SQL/performance jusqu'au niveau mondial](https://github.com/OBIANG5/World-Health-Vision/issues/63), [issue #56 — 50 pays hétérogènes](https://github.com/OBIANG5/World-Health-Vision/issues/56), [issue #65 — 30 erreurs lint héritées hors UX](https://github.com/OBIANG5/World-Health-Vision/issues/65).
5. L'application publique `v2` et Vercel, V0/V1, les branches **média et voix** sont EXCLUS de cette branche. La pile backend expérimentale #36→#59 est indépendante, non fusionnée.

## 1. Problème résolu

UX-0 avait introduit un explorateur honnête des 11 Visions mais l'application restait centrée sur une carte et des panneaux locaux : recharger une page, partager le Gabon, utiliser précédent/suivant ou accéder à la source d'une plateforme restaient des actions peu cohérentes.

**UX-1A livre réellement** :
- Recherche de **pays**, territoires actifs, **codes ISO3/ISO2**, **capitales** et **Visions**, utilisant exclusivement `useCountryCatalog` et le registre `VISION_PRODUCTS`. Les métadonnées de sources ne sont pas encore indexées individuellement ; seul un lien honnête vers leur méthodologie existe.
- Classement déterministe exact ISO3 > exact ISO2 > nom exact > préfixe nom > préfixe capitale > correspondance nom/capitale/autre. L'échec initial GAB→Botswana/Gaborone a révélé puis fait corriger un vrai défaut de pertinence. Ne pas revenir au simple ordre alphabétique.
- Routes **publics partageables** compatibles avec de simples fichiers HTML statiques et hébergement sous un sous-répertoire ; aucune configuration serveur SPA `rewrite` supposée. Utilisation de `history.pushState` et de `popstate`, non d'un second routeur dépendant d'une plateforme.
- Ressources réellement déjà présentes : globe, fiches pays, FX informatif, panneaux de voyage, source méthodologique, répertoire des Visions ; aucune nouvelle donnée/connexion fournisseur inventée.
- Recherche locale, sans API de recherche : **les termes librement saisis ne sont pas dans les URLs** et ne sont ni journalisés ni persistés par ce composant. Seuls pays ISO3, identifiants de produit et types de vue non sensibles sont partageables.
- Contrôles clavier `/`, `Cmd/Ctrl+K`, Escape ; cibles tactiles ; focus bloqué dans le dialogue, focus précédent restauré ; ouverture iPhone/desktop, FR/EN accessibles sur mobile et dans la boîte de recherche.
- Si le registre pays ne charge pas, **aucune correspondance fictive** ; si un code ISO a le bon format mais n'existe pas dans le registre, avertissement et accès à la recherche plutôt qu'une fiche d'un autre pays.

### Routes publiques effectivement prises en charge

| URL, paramètres relatifs | Fonction réelle | Limitation |
| --- | --- | --- |
| `/` ou sans paramètre `wv` | Accueil existant + globe | Le site public ne change pas dans cette PR |
| `?wv=visions&product=atlas` | Vision Hub, Atlas sélectionné | Toutes les Visions ont un niveau de maturité affiché |
| `?wv=visions&product=watch` | Vision Hub, Watch prévu | **PAS** un vrai moteur d'alerte |
| `?wv=visions&product=brvm` | Vision Hub, BRVM prévu | **PAS** un flux boursier officiel en direct |
| `?wv=country&iso3=GAB` | Fiche pays Gabon du V2 si référencé | Catalogue ≠ chiffres institutionnels ingérés |
| `?wv=money` | Convertisseur actuel | Taux indicatif ≠ taux final payable, pas de comparateur de frais nets |
| `?wv=tourism` | Outil voyage/destination actuel | Ne réserve aucun billet, pas d'offre « live » inventée |
| `?wv=sources` | Panneau méthodologie existant | Sources déclarées ≠ données collectées sous licence |
| `?wv=search` | Recherche globale pays+Visions | Ne transporte **pas** `q` ou des recherches privées |
| `?wv=...inconnu` ou ISO3 absent/malformed | Notice d'URL non reconnue | Pas de repli silencieux vers France/Gabon |

Le constructeur de liens conserve paramètres préexistants non gérés et chemins de base d'hébergement. La seule navigation courante est encapsulée dans `useWorldNavigation`.

## 2. Code réellement ajouté/modifié

| Fichier | Fonction |
| --- | --- |
| `frontend/web-v2/src/navigation/worldRoute.ts` | Types/validation/persistance URL, routeurs et historique natif |
| `frontend/web-v2/src/components/layout/WorldDiscovery.tsx` | Recherche locale; pertinence ISO exacte; pays et 11 Visions; modal accessible; FR/EN; état d'indisponibilité |
| `frontend/web-v2/src/styles/world-discovery.css` | Charte bleu électrique/cyan/blanc, modal responsive et avis de route invalide |
| `frontend/web-v2/src/App.tsx` | Navigation réelle des panneaux, Home/Sources/Visions/Money/Tourisme/Pays/Search, raccourcis clavier |
| `frontend/web-v2/src/components/layout/VisionHub.tsx` | Produit sélectionné devient contrôlé par l'URL ; précédent/suivant récupèrent la même fiche |
| `frontend/web-v2/ux1-discovery-smoke.mjs` | Navigateur réel, URL directe/reload, historique, GAB, code invalide, confidentialité, globe, FX, FR/EN |
| `.github/workflows/whv-v2-ux1-discovery-routing-acceptance.yml` | Compilateur TS, ESLint fichiers changés, build Vite, tests préexistants Atlas/UX-0, Playwright iPhone/desktop, screenshots |

**Aucune API métier ajoutée ou modifiée.** Pas de géolocalisation précise ni de données vendeurs/partenaires. Ne pas transformer une liste `217` ou `22` en indicateur de couverture. Pas de Media/Voice dans cette PR.

## 3. Qualité, limites connues et décision de fusion

### Tests réels, et à renouveler sur chaque SHA final
- Le workflow a d'abord détecté que la recherche `GAB` pouvait ouvrir Botswana via sa capitale Gaborone ; corrigé dans le tri ISO prioritaire.
- Un contrôle ESLint React a ensuite détecté une dépendance de locale manquante dans `useMemo` après classement ; corrigée.
- Après ces deux corrections, le workflow a passé TypeScript, ESLint strict des fichiers UX modifiés, Vite build réel, test du globe interactif et des outils existants sur iPhone et desktop, Vision Hub, pays Gabon, historique navigateur, URLs directes, invalides et confidentialité : [premier run entièrement SUCCESS](https://github.com/OBIANG5/World-Health-Vision/actions/runs/44557108891), commit `ad508c876f7846afc9fe593ab12b3d882cff28c0`.
- Le changement ultérieur d'accessibilité FR/EN mobile + documentation doit être **revérifié sur son SHA final**. Ne jamais citer l'ancienne CI comme validation d'un commit plus récent.

**Gate GO** : build complet, pas d'erreur lint sur fichiers modifiés, tests Playwright iPhone/desktop + anciens tests de globe et outils verts sur même SHA, screenshots contrôlables, statut DRAFT et pas de merge avant revue visuelle. **Gate NO-GO** : échec d'un test, faux chiffre, tooltip mensonger, régression Globe, source inexpliquée, panel inopérant ou fuite de saisie.

**Dette indépendante** : `npm run lint` sur **tout le frontend V2 hérité** a ~30 erreurs de règles React touchant des composants/hooks antérieurs ; ne pas les cacher ni désactiver les règles. Elles sont isolées dans [issue #65](https://github.com/OBIANG5/World-Health-Vision/issues/65), tandis que tous les fichiers créés/modifiés ici sont lintés strictement.

## 4. Suite recommandée : UX-1B, puis vraies données et rétention

**Issue #66** prioritaire après UX-1A :
1. Faire un accueil **modulaire** orienté actions réelles, non une succession de 11 cartes mortes. Architecture `Atlas / Surveiller / Comparer / Marchés / Comprendre / Sources / Mon espace`.
2. Faire de la recherche un service transversal réellement puissant : sources **réellement indexées** par pays, type, statut, date de révision, sans confondre catalogue avec ingestion ; recherche d'indicateur et comparateur seulement quand API réellement disponible.
3. Ajouter de vrais parcours URL/navigations pour chaque module **livré**, avec breadcrumbs, état de partage, panneau pays/indicateur conservé, accessible et réversible. Composants visuels/token communs et contrôle d'accessibilité WCAG sans affirmation non auditée.
4. Source institutionnelle d'abord : premier pilote `SOURCE→DROIT→RAW→OBSERVATION→PÉRIODE/RÉVISION→API→UI` vérifié. Gabon, France, CIV, USA ou Japon selon droits et API officielles disponibles. Impossible de prétendre couverture mondiale sans collecte.
5. **Watch Vision** : `WatchRule, Observation, Evaluation, Outbox, DeliveryReceipt` persistants, sans doublons, consentement/opt-out; pilote FX daté.
6. Money frais nets, Transport offres autorisées, Price/Panier prix locaux vérifiés, Trading/BRVM et Radar/Média vérification humaine, en lots successifs. Plafonds de prix et B2B/affiliation conditionnels.

**Fiabilisation internationale non abandonnée :** [issue #63](https://github.com/OBIANG5/World-Health-Vision/issues/63) détaille jusqu'au niveau professionnel tests multi-process/multi-réplicas, queue fairness/timeout, SQL/JDBC/Hikari, RAM/JSON/compression, charges 50 pays/sources hétérogènes, sécurité/mTLS/quotas, observabilité, sauvegarde/restauration et SLO fondés sur des charges vraies. PR #59 reste DRAFT et cap=8 désactivé par défaut.

## 5. Conventions durables de reprise

Toute PR : **1)** objectifs, différences, statuts et interdits ; **2)** code + méthode de test exacts ; **3)** preuves du SHA final ; **4)** avantages et problèmes non résolus ; **5)** documentation dans le dépôt ; **6)** prochain chantier relié à une issue ; **7)** capture iPhone/desktop de la vraie interface, pas simulation sans backend ; **8)** pas de merge ou déploiement public implicites.

**World-Vision doit garder une vision internationale :** ISO3166 pays/territoires et zones politiques sensibles, ISO4217 monnaies, IANA fuseaux, licences de données et juridictions, langues multiples (notamment langues locales à terme), cartes tactiles sur bas débit, accessibilité et confiance par preuve. GDELT fournit des **mentions** et hypothèses, non une statistique nationale certifiée. L'écosystème n'est utile qu'avec des parcours finis, des sources réelles et des alertes persistantes, pas une multiplication de maquettes.
