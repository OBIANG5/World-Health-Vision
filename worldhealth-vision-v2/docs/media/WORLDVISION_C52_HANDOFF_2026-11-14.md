# World-Vision — PASSATION canonique C5.2 / nouvelle production

**Date : 14 novembre 2026.** Ce document est la première source de vérité
pour les prochaines branches et les prochains chats lorsque la conversation
précédente est devenue trop longue. Ne pas fusionner de brouillon sans vérifications.

## 1. Décisions finales prises par l'utilisateur

1. **Voix : Vivienne C5.2 — Impact média**, même voix féminine française
   `fr-FR-VivienneMultilingualNeural`, aucun remplacement par Denise,
   Sylvie, Coralie, Remy, Henri ou d'autres timbres. Le test C5.2 dure
   14,088 secondes, débit +8 %, hauteur +0 Hz. Enregistrement de référence
   retenu comme STYLE, pas comme voix d'une actualité différente.
2. Le propriétaire trouve C5.2 **légèrement trop rapide** mais souhaite
   avancer avec ce rendu. Proposition : essayer +6 % sur la prochaine prise
   complète, demander une écoute, ne pas retoucher C5.2 déjà approuvé.
3. **Logo** G0 original, œil + globe avec vrais continents conservés.
   **SIGNATURE FINALE FOND ACIER CLAIR / GRAPHITE** approuvée :
   https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/nextgen/brand/worldvision-original-g0-graphite.mp4
   Ne pas revenir à la tuile blanc/beige ni dessiner un autre œil.
4. Ancien film de Shenzhen 33,7 s déjà posté sur TikTok : ne jamais l'écraser.
5. Les sources réelles et les images vérifiables doivent illustrer chaque
   phrase ; interdits : bâtiments génériques pour expliquer une guerre,
   faux témoignages/photographies, textes opérationnels comme
   « LE MONDE LOCALISATION », sous-titres couvrant les titres.
6. La réussite n'est pas un simple MP4 techniquement correct : rythme,
   ton média, sens, émotion appropriée, typographie, animations utiles,
   qualité de prise visuelle, cadrage TikTok, licences et vrai visionnage
   sur téléphone sont essentiels.

## 2. Référence C5.2 — binaire exact transféré sur cette branche

Branche source historiquement consultable :
`whv-media-studio-browser-preview`.

**Branche canonique de travail :**
`production/worldvision-vivienne-c52-voice-lock-2026-11-14`.

Fichiers internes :
- `worldhealth-vision-v2/services/media-renderer/public/voice/vivienne-c52-impact-media-reference.mp3`
  (Git blob SHA `cd2254c1557b815fd63a4861af9086d26d960da6`)
- `worldhealth-vision-v2/services/media-renderer/public/voice/vivienne-c52-impact-media-raw.mp3`
  (Git blob SHA `b36aca061d634e68be464e805284d3aa1735a5f6`)
- `worldhealth-vision-v2/services/media-renderer/public/voice/vivienne-c52-reference-report.json`
- `worldhealth-vision-v2/services/media-renderer/nextgen/approved_voice_profile.json`
- `worldhealth-vision-v2/services/media-renderer/quality/approved_vivienne_reference.py`

Le workflow `worldvision-approved-c52-master.yml` a réellement importé
les fichiers originaux sur cette branche, les a vérifiés par Git blob
et les a commités. Aucune resynthèse ni altération du MP3 sélectionné.

**Lien stable de la référence C5.2 sur la branche de production :**
https://raw.githack.com/OBIANG5/World-Health-Vision/production/worldvision-vivienne-c52-voice-lock-2026-11-14/worldhealth-vision-v2/services/media-renderer/public/voice/vivienne-c52-impact-media-reference.mp3

Dans une nouvelle branche locale (si la commande Git est disponible) :

```bash
git fetch origin production/worldvision-vivienne-c52-voice-lock-2026-11-14
git restore --source=FETCH_HEAD -- worldhealth-vision-v2/services/media-renderer/public/voice/
git restore --source=FETCH_HEAD -- worldhealth-vision-v2/services/media-renderer/nextgen/approved_voice_profile.json
```

Ou récupérer la piste via la branche canonique ci-dessus depuis le navigateur
du téléphone. Éviter d'importer le MP3 depuis une pièce jointe temporaire.

## 3. Statut des permissions

**CHOIX VOCAL APPROUVÉ ≠ DROIT DE DIFFUSION COMMERCIALE.** Le service
Edge utilisé pour les auditions ne fournit pas automatiquement la preuve
d'un droit commercial. Ne pas déclarer la piste licenciée. Si nécessaire
tester la même identité Vivienne via un moteur Azure Speech contractuel
en s'assurant du modèle disponible, des conditions et du coût.

Le MP3 C5.2 parle du Mississippi et de l'hôpital ; ne pas le réutiliser
pour lire un autre article. Pour le prochain reportage, générer une
nouvelle prise CONTINUE avec Vivienne à un débit initial proposé de +6 %
et garder les syllabes intactes sans découpage excessif.

## 4. Nouvelle actualité en préproduction, PAS encore un film

Le 13/11/2026, le tanker Atlantic Asphalt a heurté le bateau de croisière
American Heritage à quai à La Nouvelle-Orléans. AP, WWNO et WDSU rapportent
32 hospitalisations sans blessures critiques signalées, toutes les personnes
comptabilisées et une enquête sur la cause (non confirmée).

Sources d'actualité consultées et réconciliées le 14/11/2026 :
- https://apnews.com/article/757bed7a70ceb72f0d7140143fe2a764
- https://www.wwno.org/local-regional-news/2026-11-13/tanker-strikes-paddlewheel-cruise-ship-in-new-orleans-32-injured-no-passengers-missing
- https://www.wdsu.com/article/new-orleans-cruise-ship-struck-tanker-river-video/74426522

Un storyboard six scènes d'environ 28s est enregistré :
`services/media-renderer/nextgen/new_orleans_episode_review.json`.
Vidéos de choc et sauvetage WDSU utilisées UNIQUEMENT COMME PISTES
DE SOURCEMENT pour l'instant : les droits de republication n'ont pas
été obtenus et les fichiers n'ont pas été téléchargés comme matériaux
de montage. L'outil doit **bloquer** l'export tant que ces images et la
nouvelle voix ne sont pas autorisées.

## 5. Qualité et accélération par le code

Scripts à consulter :
- `quality/approved_vivienne_reference.py` : vérifie le vrai MP3 C5.2.
- `quality/worldvision_episode_acceptance.py` : refuse licences manquantes,
  source inconnue, texte opérationnel, mauvais logo, collision
  sous-titres/titres, mauvaises scènes et fausse autorisation.
- `quality/worldvision_real_frame_audit.py` : extrait de VRAIES images d'un
  MP4 1080×1920, produit une planche contact et détecte les scènes
  presque totalement noires ; ne se substitue pas au jugement artistique.
- `scripts/worldvision_episode_queue.py` : prépare trois dossiers
  éditoriaux en parallèle, sans prétendre lancer trois vidéos abouties.

Workflows distincts :
- `.github/workflows/worldvision-approved-c52-master.yml` (piste son).
- `.github/workflows/worldvision-visual-truth-qa.yml` (vraies images de contrôle).

Cadence cible : sourcing/fact-check + storyboard et vérification des
licences en parallèle, nouvelle audition Vivienne courte, choix humain
de l'audio, prévisualisation de 4–6 secondes, inspection de vrais
photogrammes, rendu vertical complet puis contrôle final sur iPhone.

**Aucun système automatique n'est capable de noter une vidéo 9/10
artistiquement à la place du propriétaire.** Les contrôles techniques
doivent empêcher les erreurs répétées et le gaspillage, mais la qualité
finale exige une revue humaine du montage intégral.

## 6. Suite prioritaire

1. Sécuriser des images filmées du vrai événement avec droit d'utilisation
   commerciale explicite (ou choisir une autre actualité à assets autorisés).
2. Produire une nouvelle prise de Vivienne de cette actualité, débit +6 %
   comme hypothèse, voix entièrement continue, puis demander validation.
3. Fabriquer un pilote réel de 4–6 secondes et regarder les vrais frames
   de contrôle. Ne pas imposer un mélange de plans génériques.
4. N'effectuer le rendu complet et les sous-titres qu'après cette vérification ;
   si des titres intégrés occupent l'espace, privilégier une version sans
   sous-titres ou une composition entièrement dédiée à ceux-ci.

Le présent journal précise ce qui est terminé, ce qui est validé
artistiquement et ce qui reste bloqué pour raisons de droits.
