# World-Vision 001 — Vivienne : alignement réel son / image (révision V3)

**14 novembre 2026.** Le propriétaire a demandé dans une autre conversation que le timbre **Vivienne**, choisi après audition A/B/C pour le Media Studio, soit réutilisé dans ce reportage. Le registre `docs/media/VOICE_REFERENCE.md` conserve l'ID exact.

## Référence reprise sans confusion

- Microsoft Neural Speech : `fr-FR-VivienneMultilingualNeural`, audition `edge-tts` au débit `+11%`, pitch `+0Hz`.
- Extrait de référence confirmé : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/south-sudan-editorial-v2/voice-auditions/vivienne.mp3
- Premier essai **sur l'intégralité de la narration Shenzhen** : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/summit-2026/editorial-v2/voice-vivienne/vivienne-shenzhen-v2-continuous-review.mp3
- SHA-256 MP3 `b30dd0b21d33c3d563a579c9cd02c1d727c2ff97771ed5bcca7459eae403a473`. SHA-256 WAV `96b8ebf4a2692ad67170b98e66144784508a0ca29e6884a65c1b2882db858b7b`.
- Durée vérifiée `30,912 s`, **dernier mot à 30,597 s**, **86 repères de mots** ; aucune pause interne supérieure à `0,65 s` détectée. Pas de `apad/atrim` des phrases, pas de ralentissement/accélération de la prise, pas de slogan prononcé.
- **Statut :** voix **préférée** par l'utilisateur mais cette lecture intégrale reste une **candidate à écouter et valider**. L'essai utilise un accès `edge-tts` à usage d'évaluation ; **les droits commerciaux doivent être confirmés séparément** avant diffusion.

## Reconception de la durée de la vidéo

Le premier montage V2 conservait `42,1 s` alors que Vivienne terminait le reportage à `30,597 s`. Il aurait introduit plus de huit secondes de vide sonore avant la signature. **Interdit :** étirer les phrases ou insérer des plans de remplissage pour atteindre 42 secondes.

Le film de travail est donc recadré à **33,7 secondes / 1011 images à 30 fps**, dont **3,0 s de signature visuelle silencieuse** (30,7 à 33,7 s).

| Source vidéo / scène | Début (s) | Fin (s) | Indice vocal réel |
| --- | ---: | ---: | --- |
| Trois dirigeants | 0,0 | 4,5 | « Trois puissances » à 0,050 s, « Jeudi » à 4,313 s |
| Vrai globe NASA géoréférencé | 4,5 | 9,4 | Lieu annoncé, « Shenzhen » à 8,457 s |
| Shenzhen vraie photographie | 8,9 | 10,4 | Arrivée circulaire de 0,5 s ; chevauche le globe |
| New START, archives Obama–Medvedev | 10,4 | 16,3 | « Au cœur » à 9,932 s, « expiré » à 15,023 s |
| Réserve chinoise | 16,3 | 19,3 | « Trump veut ... Pékin » à 16,340–17,387 s |
| Iran / Ukraine | 19,3 | 23,9 | « Iran » 19,790 s ; bascule vers Ukraine vers 21,4 s |
| Aucun accord / interrogation | 23,9 | 30,7 | « Et attention » 23,953 s, « puissance » jusqu'à 30,597 s |
| Signature World-Vision | 30,7 | 33,7 | **AUCUNE PAROLE**, logo et slogan seulement écrits |

Le globe conserve ses **4,9 secondes entières**, sa texture NASA et sa lecture à `1×`. Les autres plans sont montés autour de Vivienne. Les nouveaux fichiers gardent leurs propres noms, **les V1/V2 ne sont ni supprimées ni écrasées**.

## Réglages vidéo non négociables

- **Vraies images, pas d'IA illustrant un événement qui ne s'est pas encore produit.**
- Plus de logo isolé entre l'accroche et le globe, plus de barre de progression ou d'indication technique gravée dans les MP4.
- Barlow Condensed / DM Sans (tests graphiques encore soumis à évaluation), sous-titrage final DM Sans lisible et placé hors des titres préexistants.
- Aucun doublon de texte ou logo pendant les raccords.
- Le nouveau système d'archivage utilise des tentatives `fetch/reset/apply/commit/push` depuis la dernière branche distante **sans force-push**, afin d'éviter le conflit GitHub qui avait interrompu l'aperçu précédent.

## Emplacement exact

- Branche `rebuild/editorial-v2-quality-gates`.
- Rendu image : `services/media-renderer/render-editorial-v2.mjs` + `src/WorldVisionEditorialV2.tsx`.
- Audio Vivienne : `services/media-renderer/scripts/worldvision_vivienne_shenzhen_v2.py`.
- Assemblage : `services/media-renderer/scripts/worldvision_mux_vivienne_review_v3.py`.
- GitHub Actions : `.github/workflows/whv-editorial-v2-vivienne-voice.yml` et `.github/workflows/whv-editorial-v3-vivienne-full-review.yml`.
- Contrat bloquant : `services/media-renderer/quality/production_contract_v2.json` et `quality_gate_v2.py`.

**Le test technique ne constitue PAS une validation artistique.** La vidéo finale reste bloquée tant que la prise complète n'est pas approuvée, les droits de la voix ne sont pas vérifiés, les sous-titres et le mixage ne sont pas approuvés, et le contrôle factuel ne date pas de la publication.
