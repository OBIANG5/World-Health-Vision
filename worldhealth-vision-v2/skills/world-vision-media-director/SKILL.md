---
name: world-vision-media-director
description: Pilotage de la création vidéo journalistique World-Vision avec validations humaines, continuité GitHub et QA image/son.
---

# World-Vision — compétence de direction audiovisuelle

**Statut : skill interne au dépôt GitHub.** Ce fichier N'EST PAS automatiquement installé dans ChatGPT, n8n, Make ou un agent externe ; il sert de guide réutilisable lorsqu'un agent lit explicitement cette compétence.

## Lecture obligatoire avant toute modification

1. `../../CONTINUITE_WORLD_VISION.md` au niveau racine du dépôt (utiliser le chemin canonique du dépôt).
2. `docs/continuity/CURRENT_STATE_AND_NEXT_STEP.md`.
3. `docs/continuity/DECISION_REGISTER.md`.
4. `docs/media/art-direction/WORLD_VISION_GLOBE_SIGNATURE_DIRECTIVE_2026-11-13.md`.
5. `docs/media/TRAINING_137_PAGES_IMPLEMENTATION_AUDIT_2026-11-13.md`.
6. Les avis utilisateurs GitHub, notamment le refus initial `#9`.

## Priorité actuelle

- Logo œil-globe bleu original : validé, ne pas le redessiner.
- A/B/C : rejetées esthétiquement, pas de note 1–10 inventée.
- D « globe qui se tourne vers le pays » : six maquettes fixes D00–D05 ; **NON validées**.
- Original du TikTok de référence : source tierce, non réutilisable en diffusion sans permission.
- Avant de coder une séquence 3D ou voix : **inspecter et faire noter la maquette fixe du plan correspondant**.

## Garde-fous de production

- Le contexte d'un pays provient d'un système de coordonnées vérifié et de sources factuelles ; marquer les frontières incertaines.
- Toute image d'un événement réel doit provenir d'un média authentique et autorisé ; une illustration ou archive doit être présentée comme telle.
- Le code React/Remotion sert à la composition et aux animations déterministes, pas à inventer des vidéos de terrain.
- Si le clip doit être narré : proposer trois voix françaises réelles, même script et même volume, puis laisser choisir. N'acheter des crédits API ni lancer de coûts sans accord.
- Aucun `HOOK`, `01/07`, barre de progression QA, footer développeur ou « voix générée par IA » constant dans le rendu public. Respecter les règles de transparence par canal.
- Ne pas faire le MP4 entier avant trois paliers : planches fixes → micro-clip 3–6 s → assemblage après accord.
- Tests iPhone et desktop, rendu plein cadre 9:16, contraste, orthographe, safe zones, source/attribution et écoute intégrale.
- CI verte prouve que le code passe, **pas** que l'esthétique est approuvée.

## Pour chaque plan individuel

1. **Fiche** : ID immutable, version, contexte factuel, sources, media, auteur/licence, destination géographique, rendu attendu et quoi juger.
2. **Maquette** : 1080×1920 (ou miniature proportionnelle) inspectable sur iPhone, noms propres vérifiés, pas d'éléments techniques à l'écran.
3. **Revue** : note 1–10 par aspect, texte libre et décision `à corriger / refusé / validé`, approbation positive explicite uniquement.
4. **Correction** : changer seulement ce qui est critiqué ; conserver les éléments validés.
5. **Version** : commit, hash du média, capture GitHub et entrée dans `WORK_JOURNAL.md`.
6. **Handoff** : mettre à jour `CURRENT_STATE_AND_NEXT_STEP.md` et `DECISION_REGISTER.md`.

## Toolchain à étudier, pas à supposer connectée

- `frontend/web-v2/src/media/GeoGlobe.tsx` utilise le GeoJSON existant et présente une étude vectorielle. Le futur rendu planète satellite 3D exige une texture NASA créditée et un moteur/test 3D ; pas encore construit.
- `services/media-renderer/` utilise Remotion/FFmpeg ; le premier pilote a été refusé 1/10.
- Gemini/Google Flow, ElevenLabs et n8n/Make sont des **options**, pas des connecteurs actifs. Les clés vont dans un gestionnaire de secrets côté serveur.
- `frontend/web-v2/media-preview-smoke.mjs` doit vérifier la prévisualisation mobile, la source de carte et les persistances d'avis.

## Reprise après chat bloqué

Ne jamais répondre « tout est terminé » en lisant un ancien résumé. Rechercher le dernier HEAD du dépôt, le dernier GitHub Actions et le SHA de `preview-deployment.json`. Reprendre seulement **le premier plan pas encore validé**.


## Reprise mise à jour du 13 novembre — D00-v6, Manuel 137 pages, vidéo géociblée

**Lire dès le début** :
- `docs/media/AUDIOVISUAL_PRODUCTION_MASTER_PLAN_2026-11-13.md` — référence du parcours complet (neuf parties du PDF de 137 pages, 14 étapes produit, quatre compétences de montage, voix, calage, post-production et contrôle qualité).
- `docs/media/art-direction/D00_EYE_GLOBE_VISUAL_ITERATIONS_2026-11-13.md` — corrections sur les six images conceptuelles, hashes exacts et absence de validation automatique.
- `docs/media/art-direction/d00-eye-globe-visual-contract-v6.json` — contraintes de la version actuelle.

**Décision en cours** : D00-v5 est appréciée mais jugée encore insuffisante ; D00-v6 est générée **sans validation explicite**. Le blanc de l'œil doit être pur ; la diffusion atmosphérique de la Terre plus perceptible que les deux arcs ; les frontières de chaque pays, en particulier dans le Sahara, doivent être géographiquement exactes et lisibles. Le logo œil-globe bleu source demeure officiel et inchangé.

**Après G1 (et seulement après approbation)** : construire en 9:16 un globe réellement 3D, avec frontière GeoJSON vérifiée et rotation vers les coordonnées `lat/lon` de la **nouvelle actuelle** ; un seul pays si le sujet est localisé. Tester séparément une micro-animation de 3–6 secondes. Puis D02–D05, vrais rushes, 3 voix comparées sur même phrase, transcription/alignement, SRT, montage, QA et export. Un **petit logo officiel** en coin d'écran est une hypothèse de design à tester sur fonds variés, pas un emplacement déjà validé.

**Important sur les images** : v5 et v6 ont un hash/document GitHub, **mais pas leurs PNG binaires dans le repo ni dans la preview statique**. Le site affiche les six maquettes vectorielles précédentes et le nouveau statut/plan, pas la nouvelle image ou une vraie vidéo. Ne jamais présenter des frontières inventées par l'illustration IA comme des frontières géographiques exactes.
