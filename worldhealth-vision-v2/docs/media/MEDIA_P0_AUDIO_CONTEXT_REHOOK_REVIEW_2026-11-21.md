# World-Vision MEDIA — P0.1 / revue des re-hooks avec audio et timecode d'origine

**Décision prioritaire du propriétaire, 21 novembre 2026 :** les scripts/idéations restent fournis ou validés par lui ; toute programmation doit prioritairement accélérer le **montage audiovisuel premium** avec hooks et re-hooks continus, mot cinétique, représentation de l'idée, musique/sound-design et animation cartographique/financière/documentaire. **Les connexions de comptes ChatGPT/Gemini ne sont pas une priorité : elles sont rejetées tant qu'un test ne démontre pas un bénéfice direct qualité/temps.** Aucun moteur de montage ou abonnement supplémentaire par défaut. Cette PR est une étape étroite de la chaîne, et non une déclaration que le moteur complet des hooks est fini.

## Ce qui existait déjà et que nous réutilisons

- `CreativeEdit.tsx` : composition Remotion et `TransitionSeries`, narration, ambiance, captions globales ;
- `creative/editorial-timeline.mjs` : vraie timeline, fondus et glissements non fictifs ;
- `creative/render-project.mjs` : rendu H.264/AAC depuis le JSON fourni et les assets locaux, plus `--shot` isolé ;
- `creative/validate-project.mjs` : script préservé, droits et médias non supposés ;
- Studio projet sauvegardable et réouvrable (#104), captions Remotion (#98), FASTLANE (#30), film intégré (#87).

**Défaut corrigé :** `--shot` extrait une séquence muette par conception, en supprimant la voix, l'ambiance et les captions, et repart au frame 0. On ne peut donc pas juger correctement la **synchronisation visuelle et sonore d'un re-hook**, pourtant la nouvelle priorité absolue.

## Nouvelle commande : `--review-shot`

```sh
node creative/render-project.mjs \
  --project /work/project.json \
  --assets /work/assets \
  --review-shot photo-rehook \
  --output /work/export/rehook-review.mp4
```

- Respecte **la composition et le texte approuvés dans leur intégralité**. Aucun LLM, TTS, abonnement, téléchargement ni contenu de presse supplémentaire.
- Calcule la place réelle du plan `photo-rehook` dans la timeline originale, y compris les overlaps `dissolve/slide`.
- Utilise **l'option native `renderMedia({frameRange:[start,end]})`**, documentée par Remotion : extrait seulement la fenêtre source, conserve la voix, la musique, les captions et les transitions déjà présentes ; pas de concaténation/recréation de pistes.
- Inclut au plus **15 frames / 0,5 s** avant/après la scène pour percevoir le raccord sonore ; bornes clippées aux frames du *contenu* sans inclure la signature vidéo de fin. Le plan exact et la fenêtre réellement rendue figurent dans le rapport JSON.
- Les 3 PNG de contrôle sont échantillonnés aux **frames absolus du film original**, pas de faux screenshots depuis un nouveau projet tronqué.
- L'ancien `--shot` muet reste intact pour les fonctions et CI existantes ; aucune migration silencieuse.
- `review-range.mjs` utilise l'EDL déjà existante, sans réimplémenter un moteur temporel et sans dépendance ajoutée.

**Preuve de méthode :** Remotion `renderMedia` frameRange source, docs https://www.remotion.dev/docs/renderer/render-media . Les bornes sont inclusives.

## Vérifications demandées sur le nouveau HEAD

1. `node --test creative/review-range.test.mjs creative/editorial-timeline.test.mjs` : true source timing, fondus des deux côtés, limites d'intro et conclusion, absence de mutation du script/audio/manifest, refus de shot inconnu.
2. `npm run typecheck` pour le moteur inchangé.
3. Vrai master synthétique `project.example.json` de 151 frames et deux plans, narrateur **OSCILLATEUR DE TEST** (300Hz deux premières secondes, 900Hz ensuite), ambiance 160Hz et deux captions fictives. `--review-shot plan-02` doit produire les **frames sources 52–150 inclus**, soit 99 frames, dont 15 frames de contexte avant le plan (qui démarre au frame 67).
4. Vérifier `ffprobe` H.264 + AAC ; nombre d'images, 1080×1920 ; SHA manifeste original, label de voix, captions, 3 PNG, médias empruntés au dossier local.
5. Décoder la piste AAC du **vrai MP4** : vers 0,6s du court extrait, mesurer ~900Hz par zero-crossings, et non 300Hz qui prouverait que le mix recommence erronément au début. Aucun test esthétique non fondé.
6. Conserver MP4, rapport et 3 PNG en artefact Actions 7 jours, pas de publication TikTok.

**Statut initial :** cinq tests isolés du nouveau calcul de plage ont été exécutés localement sur Node 22, **5/5 PASS**. Le code est dans la branche PR, mais **rendu CI, test AAC réel et vérification du HEAD distant en attente** tant que le workflow n'est pas réellement vert. Ne pas confondre ce jalon avec une vidéo de niveau mondial ni une voix humaine validée.

## Limites volontaires / prochaines étapes par retour sur investissement

Ce jalon ne produit pas encore des hooks cinétiques exceptionnels. Il crée la condition nécessaire pour juger rapidement un vrai re-hook *avec son audio*. Aucune copie des vidéos TikTok fournies, aucun moteur de recherche de nouvelles, aucune connexion aux comptes IA, aucune installation non contrôlée de plugins tiers.

**P0.2 — Motion typographique synchronisé aux mots** : inventorier les composants existants, auditer au plus 2–3 skills utiles (Remotion officiels, claude-motion, HyperFrames open-source), comparer leur rendu 390px, durée de réalisation, licence et coût. **Réutiliser un composant gagnant** en l'intégrant au Remotion unique. Ancrer les mots importants au temps réel de la voix, pas une estimation aléatoire par nombre de mots. Le script doit rester byte-identique.
  
**P0.3 — Sound-design par intention narrative** : effets courts (impact, reveal, pulse, transition, silence), bibliothèque de droits/licences et cues sans mixage arbitraire ; préserver les stems, tester ducking, LUFS et peak. Référence utilisateur Vivienne C5.2 : choix antérieur non remplaçable silencieusement ; **aucun MP3 d'actualité précédente réutilisé**.

**P0.4 — Première séquence 8–12 s avec 2 vrais re-hooks, audio et texte cinétique**, storyboard choisi, assets éditorialement licites, vues réelles sur iPhone, décision humaine. Ne jamais présenter une image IA réaliste comme un témoignage photographique.

**P0.5 — Révision locale ciblée et mesure de productivité** : temps depuis la réception du script + assets approuvés jusqu'à **master artistiquement accepté**, temps d'une modification ciblée, coût, non-régression sur les autres plans, regard 390px et tests TikTok UI réelle.

**P0.6 — Couverture internationale et multi-styles** : GEO/finance/documentaire déjà existants + styles réutilisables pour des clients tiers dans des profils de marque séparés ; aucune universalisation d'une scène non approuvée.

## Continuité GitHub

- Dépôt : `OBIANG5/World-Health-Vision`
- Base initiale vérifiée : PR #110, SHA `b1025c4d28220bc6e1b9cbf868dce4e7574b24a9` (pilotage média existant, PRs empilées et non fusionnées).
- Branche : `feature/worldvision-media-audio-context-review-2026-11-21`.
- Issue de vision prioritaire : [#116](https://github.com/OBIANG5/World-Health-Vision/issues/116).
- Workflow neuf : `.github/workflows/worldvision-media-audio-context.yml`.
- **Ne pas fusionner/déployer/publier sans état CI/QA du SHA exact, revue du film et approbation.** Les outils extra (HyperFrames, etc.) ne sont pas installés implicitement.
