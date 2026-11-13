# World-Vision — Contrat des formats narratifs & validation plan par plan

**Date : 13 novembre 2026.** Rédigé après rectification explicite du propriétaire. **Statut : exigence de produit retenue, proposition artistique D00–D05 non encore validée.** À relire dans tout nouveau chat.

## Correction prioritaire

**La vidéo TikTok étudiée comporte cinq actualités géographiques, mais cela ne signifie EN AUCUN CAS que chaque vidéo World-Vision doit traiter cinq pays, ni plusieurs pays.**

La référence montre une **grammaire de mouvement** (Terre → pays / lieu → informations réelles), **pas un nombre de sujets obligatoire**. Un clip World-Vision doit être piloté par **son histoire éditoriale**, pas par un template multi-pays.

### Trois formes de reportage, choisies selon le sujet

| Format | Exemple | Caméra / géographie | Plans qui suivent |
|---|---|---|---|
| `single_location` (**défaut d'un reportage sur un événement localisé**) | Une annonce à la COP31 à Antalya, une crise locale en Haïti, un volcan au Népal | Terre entière → une destination (pays, puis région/ville si utile) → arrêt sur une seule scène géographique | Vraies vidéos/photos autorisées du sujet ; documents officiels ; témoignages ou chiffres vérifiés. **Pas de visite d'un deuxième pays arbitraire.** |
| `related_locations` | Relation diplomatique, déplacement entre deux capitales, flux commercial entre pays | Globe → premier lieu → connexion visuelle réellement pertinente → autre lieu | Documents, flux, événements, sources correspondants ; ne pas inventer de causalité ni de trajet |
| `global_overview` | Tour du monde hebdomadaire ou phénomène simultané | Globe → plusieurs endroits sélectionnés par la rédaction | Un fait indépendant et une preuve par lieu ; limiter le nombre aux histoires qui le justifient, jamais 5 par défaut |

Pour une actualité sans destination géographique pertinente (ex. débat technologique mondial), **ne pas forcer un zoom sur un pays**. Une ouverture cartographique mondiale ou une scène documentaire peut être plus honnête. Le style globe est une identité adaptable, pas une mécanique imposée.

## Séquence cinématographique candidate — pas encore approuvée

1. **D00 — Introduction Terre entière** : une Terre crédible, élégante, suffisamment lumineuse, avec signature World-Vision discrète. Valider une **image fixe haute résolution**, puis seulement son mouvement.
2. **D01 — Orientation** : camera rotative vers une position géographique dérivée de données fiables (lat/long) ; tester deux variantes de trajectoire/easing plutôt qu'une seule transition générique.
3. **D02 — Destination** : country highlight précis, nom et éventuellement ville/région, sans masquer les détails. La géographie doit être vérifiée y compris pays à frontières contestées.
4. **D03 — Passage au reportage réel** : montrer des **vraies photos/vidéos du sujet** dont licence/provenance/date/lieu sont vérifiés. Si aucun rush événementiel légal n'est disponible, utiliser un document primaire avec explication, ou une illustration explicitement identifiée ; ne jamais fabriquer de faux témoignage.
5. **D04 — Décryptage** : chiffres, contexte, explication et sous-titres calés sur une narration approuvée, sans panneaux techniques ni blocs de texte amateur.
6. **D05 — Sortie** : une fin sobre qui peut soit terminer le **sujet unique**, soit passer au deuxième lieu **seulement si l'histoire le justifie**. Ne pas ajouter un nouveau pays pour « remplir » le modèle.

**Un plan peut être omis ou adapté** si la vérité et le rythme du reportage l'exigent. Les identifiants D00–D05 sont des jalons internes, PAS des titres ou compteurs publics incrustés dans la vidéo.

## Réalisme, droits et style

- L'œil-globe bleu source est **logo officiel actuel validé** ; le globe filmique est une scène distincte.
- Aucun fond sombre vide, filtre gris uniforme, animation répétitive, dessin 2D présenté comme vrai globe satellite premium, « HOOK », `01/07`, barres de progression techniques ou voix robotique.
- Une **seule information localisée** peut occuper un épisode entier : le fait doit primer sur la démonstration 3D.
- Les données géographiques viennent de sources contrôlées, les images réelles de sources légalement utilisables, les faits d'agences/primaires ; ne pas copier textures, musique, voix ou charte de TikTok.
- Google Flow peut être envisagé pour des **illustrations**, jamais pour inventer des images qui prétendent filmer un événement réel ; aucune connexion au compte n'est démontrée.
- Gemini / ElevenLabs / OpenAI sont des candidats de voix à **auditionner sur des extraits égaux**. Aucun n'est approuvé par défaut.
- Les scénarios et réglages s'attachent à un `story_id` et à un hash de version, **pas à un exemple figé Turquie/Antalya**.

## Évaluation progressive obligatoire

| Étape | Preuve visible/écoutable | Révision demandée |
|---|---|---|
| Identité marque | Vrai PNG logo | **Validé** sans note ; ne pas redemander |
| Direction D00 | Une composition fixe du globe, 9:16 haute résolution, testée iPhone | **Non validée** ; note 1–10 par critère, motifs de refus |
| Transition D01/D02 | 2 poses (début/fin) puis **micro-clip 3–6 s seulement après validation des images fixes** | Fluidité, relief, géographie, clarté, contraste |
| D03 | 1–3 vrais plans/documents vérifiés séparément, avec sources et licences | Authenticité et pertinence |
| D04 | Script, typo, données, sous-titres / exemple d'une scène | Fiabilité et pédagogie |
| Voix | Comparaison simultanée de 3 auditions même phrase, diction de lieux/noms propres | Naturel, chaleur, intonation, synchronisation |
| Montage | Extraits assemblés puis aperçu téléphone | Rythme, transitions, mixage et QA image par image |
| Final | MP4 hashé avec reçus de validations | Aucune publication sans accord final et droits vérifiés |

**Note 1/10 du MP4 COP31 pilote** reste REFUSÉE. Les anciennes directions A/B/C ont été refusées sans note chiffrée ; ne plus les présenter comme les trois options actives.

## Situation du code au 13 novembre (à vérifier à chaque HEAD)

- `GeoGlobe.tsx` : globe **Canvas 2D**, projection orthographique et GeoJSON, pas encore photo-réaliste ni moteur 3D filmique.
- `GlobeDirection.tsx` : six **maquettes fixes** avec exemple Turquie/Antalya ; les validations locales et lien vers GitHub ne constituent pas une sauvegarde automatique complète.
- `WorldVisionFirstReport.tsx` et `WorldVisionShort.tsx` : moteur Remotion existant, mais ancien style différent et MP4 pilote rejeté. Le nouveau globe n'est **pas encore branché à une composition Remotion validée**.
- Les intégrations **Google Flow, Gemini TTS, ElevenLabs, n8n, Make** ne sont pas prouvées connectées.
- Formation de 137 pages : documents retrouvés et recommandations thématiques extraites ; **audit de tous les fichiers et de toutes les prescriptions page par page non terminé**.

## Relance au prochain chat

« Reprendre G1 — identité audiovisuelle. Le propriétaire a **refusé A/B/C** ; le **logo bleu est validé**. Nous voulons une belle ouverture géographique, adaptative : **un pays pour un sujet, plusieurs uniquement si le récit l'exige**, puis vraies images et faits. Lire ce contrat, l'audit de la formation et le journal GitHub. Évaluer D00 en premier, sans lancer un MP4 complet ou annoncer Google Flow/ElevenLabs connectés sans preuves. »

