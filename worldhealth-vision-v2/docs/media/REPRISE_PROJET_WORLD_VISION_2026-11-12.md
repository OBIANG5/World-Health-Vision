# World-Vision — reprise sans perte du projet (12 novembre 2026)

## Portée et règles non négociables

- Dépôt canonique : `OBIANG5/World-Health-Vision`.
- **Produit actif : `worldhealth-vision-v2/`, branche `v2`.** Ne jamais remplacer cette plateforme par la V0, la V1 ou un dashboard générique.
- Extension Media Studio isolée : `feature/world-vision-media-studio`, PR #5, volontairement non fusionnée dans `v2` tant que l'intégration complète n'est pas validée.
- `main` représente encore l'ancien historique V0 ; ne pas la traiter comme la source canonique du produit.
- Conserver l'identité World-Vision et son slogan « Voir le monde, le comprendre. » ; pas de refonte visuelle arbitraire.
- À la fin de chaque incrément visible, livrer **un aperçu réellement consultable sur iPhone** et distinguer démo statique, backend local et production déployée.
- Zéro actualité inventée présentée comme réelle ; provenance, dates, droits et incertitudes visibles.
- L'utilisateur veut des étapes complètes et testées, non un « MVP minimal » présenté comme produit final.

## Les deux piliers du projet

### A. World-Vision V2 — intelligence mondiale

Produit React/TypeScript (Vite), backend Java/Python, PostgreSQL/TimescaleDB, ingest multi-sources, carte mondiale, fiches pays et régions, comparateurs, provenance et statut des données.

Familles implémentées dans l'architecture : World Bank, FMI, OECD, ILOSTAT, UNSD SDG, UNODC (partiellement via export local). La V2 officielle a aussi reçu en novembre 2026 des travaux sur les comparaisons nationales/internationales, l'alignement temporel et les audits prudents des institutions locales.

Un aperçu web statique de la vraie interface V2 a été construit sur `whv-v2-browser-preview`. **Ce n'est pas une base de données live ni un hébergement backend.** Ne jamais présenter les données d'aperçu comme des observations fraîches.

### B. World-Vision Media Studio — rédaction audiovisuelle

Objectif : détecter et préparer jusqu'à une vidéo d'actualité francophone par heure, avec décision humaine à chaque étape critique.

Branche : `feature/world-vision-media-studio`.

Chemin réel du workflow : `RADAR → VERIFY → SCORE → APPROVAL → CREATIVE → ASSETS → VideoDraft → AUDIO → Remotion → QA → PACKAGE → PUBLISH`.

Fonctions codées à date :
- `media-service` FastAPI, état rédactionnel PostgreSQL, API derrière la gateway.
- RADAR web et scheduler Redis toutes les 5 minutes **si infrastructure déployée et configurée**, pas une veille déjà hébergée 24/7.
- Sourcing pays/local via `catalog-service`, dédoublonnage et scoring explicable.
- VERIFY par affirmation et blocage de validation si preuve insuffisante.
- CREATIVE script, accroches, narrations, scène, légende et hashtags.
- ASSETS Wikimedia Commons avec licences et sélection traçable ; médias sans droits bloqués.
- Génération de voix off et comparaison de transcription ; brouillon vidéo 1080×1920 à 30 images/s.
- Rendu Remotion H.264 avec images réelles sélectionnées et voix-off contrôlée.
- QA 7 contrôles structurels/factuels/audio et manifeste de publication SHA-256.
- Rendus `canonical_newsroom_v1` (marque visible) et `tiktok_api_clean_v1` (export distinct, **non équivalent à un connecteur officiel approuvé**).
- Reçus réels requis avant le statut `published`.
- CI : six jobs (service média, PostgreSQL, renderer, frontend, gateway et Compose).

Restent **non démontrés en production publique** : exploitation permanente, serveur externe, stockage durable des vidéos/rendus et de la file renderer (actuellement mémoire/processus), inspection visuelle des images MP4 réelles, normalisation finale du son, couverture de nombreuses agences locales, licence automatique de vidéos d'actualité, publication TikTok approuvée, API officielle WhatsApp Channels.

## Prévisualisations — état vérifié

### V2 générale

Branche de fichiers compilés : `whv-v2-browser-preview`. Dernier SHA confirmé au moment du contrôle : `2a893ccf7b713110bdcb319b462f78e61c7092f0`.

Aperçu immuable :
https://rawcdn.githack.com/OBIANG5/World-Health-Vision/2a893ccf7b713110bdcb319b462f78e61c7092f0/index.html

### Media Studio — réalisé lors de cette reprise

- Amélioration issue de la PR #6, fusionnée **uniquement dans la branche Media Studio**.
- Fichiers dans `scripts/media-preview-bootstrap.js`, `scripts/build-media-preview.mjs`, `frontend/web-v2/media-preview-smoke.mjs` et workflow `whv-media-studio-mobile-preview.yml`.
- Le véritable frontend React du studio est compilé et servi avec un **adaptateur de simulation explicitement étiqueté**, sans faux backend en direct. Les opérations live renvoient une erreur explicite ; sélection d'accroches et filtres fonctionnent sur données de démonstration.
- GitHub Actions `43280719262` validé **success** (build, smoke-test Chromium iPhone 390×844, desktop 1365×900, publication).
- Branche déployée distincte : `whv-media-studio-browser-preview`, SHA confirmé `3e3b6d2984ce134786219838bc9c98353fe8306f`.
- Interface téléphone :
https://rawcdn.githack.com/OBIANG5/World-Health-Vision/3e3b6d2984ce134786219838bc9c98353fe8306f/index.html?view=media
- Captures navigateur stockées dans cette branche : `media-studio-iphone.png`, `media-studio-desktop.png`.
- **Ne pas confondre cet aperçu statique avec des vidéos MP4 réellement produites ou la rédaction déployée.**

## Plan d'exécution prioritaire

1. **Tester la version intégrée exacte.** Vérifier la CI six-jobs au HEAD de `feature/world-vision-media-studio`, le rendu statique et ses captures, et maintenir PR #5 en draft tant que les blocages d'exploitation ne sont pas levés.
2. **Fiabiliser l'exploitation du rendu.** Les jobs vivent aujourd'hui dans un `Map` et une file en mémoire du serveur Node. Ajouter file persistante, idempotence, récupération après redémarrage, gestion d'échecs, rétention et stockage des MP4/WAV hors conteneur, puis tester ces scénarios.
3. **Faire un vrai premier reportage bout en bout**, à partir d'une actualité vérifiée et correctement sourcée : sélection humaine, images réellement sous licence, voix-off, MP4, revue visuelle et audio sur iPhone, QA, manifeste final, publication manuelle éventuelle et reçu vérifiable. Séparer nettement preuve d'exécution et code seulement écrit.
4. **Faire fonctionner la rédaction en continu** sous hébergement HTTPS, PostgreSQL/Redis, workers isolés, secrets gérés correctement, sauvegardes, alertes et suivi du scheduler. Ne promettre une vidéo par heure que lorsque le système a effectivement tenu sa cadence.
5. **Renforcer les normes média :** cadrage iPhone/TikTok (safe zones sur images réellement rendues), contraste/lisibilité, son, attribution, formats et droits ; étendre les sources nationales avec contrôles d'accès raisonnables.
6. **Canaux :** préparer TikTok via l'API officielle, les autorisations/audits OAuth et le consentement utilisateur ; garder la chaîne WhatsApp en publication manuelle tant qu'aucune API officielle utilisable n'a été démontrée.
7. **Intégration de la V2 :** réconcilier l'évolution de `v2` et la feature via diff/CI/tests d'intégration, sans écraser les fonctions pays/indicateurs ni les nouveaux travaux de provenance.

## Reprendre depuis n'importe quel nouveau chat

Lire dans cet ordre :
1. Cette note et `docs/media/WORLD_VISION_MEDIA_STUDIO.md`.
2. `docs/media/PUBLISHING_CONNECTORS.md` et le contenu de la PR #5.
3. Les workflows GitHub Actions des branches `v2` et `feature/world-vision-media-studio` et leur HEAD réel.
4. `services/media-service/`, `services/media-renderer/`, `frontend/web-v2/src/media/`, `infra/docker-compose.yml`.
5. Les prévisualisations compilées (statut : démonstration seulement).

**Ne jamais se fier uniquement aux anciens messages d'un chat bloqué : comparer chaque affirmation au code, aux commits et aux tests GitHub en vigueur.**
