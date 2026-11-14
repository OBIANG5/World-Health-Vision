# World-Vision — AUDIT HONNÊTE de la voix (14 novembre 2026)

## Défaut encore non résolu

L'utilisateur a auditionné les deux précédents MP3 et les a trouvés
**quasiment identiques, trop robotiques et avec des micro-blancs**.
Ce retour prime sur les contrôles numériques. Il est INEXACT de déclarer
une amélioration qualitative parce que la CI est verte.

Dans l'ancien `worldvision_voice_lab.py`, « conversational » et « focused »
utilisaient la *même* voix `fr-FR-VivienneMultilingualNeural` avec seulement
0% contre +5% de vitesse de base. Pire, les appels TTS étaient effectués
par segments séparés, puis des `anullsrc` de 100/135 ms étaient concaténés
aux pauses déjà synthétisées naturellement. Les ruptures audibles
étaient donc structurelles et prévisibles.

## Nouveau protocole expérimental

1. **Un seul flux TTS continu par prise, sur l'intégralité du script** :
   aucune synthèse par phrase, pas de collage de segments, pas de pause
   blanche artificiellement réinsérée.
2. Trois prises sincèrement distinctes sur le même texte :
   `vivienne_continuous` (Vivienne d'origine),
   `denise_news` (autre voix féminine française),
   `coralie_warm` (autre voix féminine française).
   Denise et Coralie sont des **candidates**, non des remplacements validés.
3. Couper uniquement le centre des longues portions de SILENCE repérées
   par FFmpeg dans la piste continue. Ne modifier ni hauteur, ni temporalité,
   ni ordre des phonèmes prononcés. Conserver RAW + MP3 poli pour audit.
4. Test régression des motifs sonores : démonstration synthétique avec deux
   morceaux de sinusoïdes encadrant 380ms de silence, vérifier que les
   oscillations parlées (métaphore de l'essai) ne sont pas altérées.
5. Compte-rendu incluant identification vocale exacte, hash du script
   commun, nombre de mots repérés par l'API, nombre de pauses coupées,
   durée totale réellement retirée, SHA du fichier et mention
   « NOT AUTHORIZED FOR COMMERCIAL PUBLICATION ».
6. **Test utilisateur sur iPhone** : écouter les trois pistes *sans*
   connaître leur identité au premier passage. Les évaluer séparément
   sur naturel, intention, émotion, micro-pauses, prononciation, crédibilité
   journalistique. Ne pas sélectionner artificiellement le « gagnant ».
7. Si les voix Edge sont toutes robotisées, ARRÊTER d'itérer sur l'EQ,
   la compression, la hauteur ou la vitesse : changer le MOTEUR TTS.

## Nouvelle architecture TTS de qualité supérieure

Microsoft confirme l'existence de
`fr-FR-Vivienne:DragonHDLatestNeural` dans le catalogue Azure Speech.
Il s'agit d'une famille **HD** distincte, pas d'un réglage de
`fr-FR-VivienneMultilingualNeural`.
Référence : https://learn.microsoft.com/en-us/azure/ai-services/speech-service/high-definition-voices

Module prêt : `scripts/worldvision_azure_vivienne_hd.py`, utilisation
optionnelle avec Azure Speech autorisé et credentials fournis dans un
gestionnaire de secrets (jamais dans le code, les PR, les logs ou ChatGPT).

- `pip install azure-cognitiveservices-speech`
- `AZURE_SPEECH_KEY` et `AZURE_SPEECH_REGION` via environnement secret.
- `python scripts/worldvision_azure_vivienne_hd.py --brief nextgen/continuous_v2_sample.json --out output/hd/vivienne-dragon-hd-audition.mp3`

**Important** : la documentation précise que DragonHD classique ne prend
pas en charge `<prosody>` ni `<mstts:express-as>` malgré des listes de
styles HD dans d'autres pages Microsoft. Aucun style de joie/urgence
n'est revendiqué comme disponible pour le texte français sans test réel
du modèle et de la version déployée.
Les clés Azure ne sont PAS confirmées disponibles : **aucun son HD n'a
encore été synthétisé**. Ne jamais écrire l'inverse.

## Fond de l'outro / identité visuelle

La signature CORRIGÉE avec le vrai G0 (œil bleu et globe), son centrage
et ses animations est validée comme **direction à préserver**.
Seul le turquoise très lumineux du fond a été rejeté.
Deux nouveaux fonds candidats à comparer :
- MIDNIGHT : bleu nuit profond, halo bleu désaturé;
- GRAPHITE : bleu-charbon neutre, halo acier discret.
La forme de l'œil et les continents ne sont jamais redessinés.
Les films restent des aperçus de 3 secondes sans publication automatique.

## Critère de réussite pour la prochaine actualité

Pas de « C'est réussi » sur seule base de tests techniques.
**Voix humaine perçue** évaluée par écoute, respiration naturelle et
raccords indétectables, rythme journalistique crédible, aucune longue
pause de remplissage, variation émotionnelle adaptée au texte.
**Visuels qui montrent réellement ce qui est dit**, provenance, droit,
source et date; sous-titres compatibles avec les titres existants.
Une première comparaison peut être un échec artistique tout en étant une
réussite technique; la difficulté doit rester explicitement mentionnée.

Les anciens MP3 demeurent en archives; les nouveaux essais sont versionnés
dans media-lab/nextgen/voice-v2 sans remplacer les fichiers précédents.


## Exécution du deuxième véritable cycle — résultats et liens

GitHub Actions Voice 2 : https://github.com/OBIANG5/World-Health-Vision/actions/runs/43606584139

**5 tâches réussies** après correction d'un défaut réel : CoralieNeural
n'émettait pas d'audio sur le service Edge. Le secours ayant réellement
fonctionné est la voix canadienne française **fr-CA-SylvieNeural** ;
ne PAS présenter le troisième son comme Coralie. Les scripts et rapports
exposent l'identité réelle choisie.

Les sorties A/B/C ont été synthétisées en **une seule prise chacune**,
sans coller artificiellement plusieurs textes parlés, puis avec suppression
partielle des silences détectés (voix non accélérée syllabe par syllabe) :

- Vivienne d'origine : 15,408 s brut → 13,400 s traité ; 9 réductions
  de pause, 2,008 secondes de silences retirées.
- Denise (nouvelle voix fr-FR) : 19,608 s brut → 15,944 s traité ; 10
  réductions de pause, 3,664 secondes de silences retirées.
- Sylvie (nouvelle voix fr-CA) : 19,128 s brut → 15,960 s traité ; 9
  réductions de pause, 3,168 secondes de silences retirées.

Les durées MP3 finales incluent quelques échantillons de codec supplémentaires.
Les trois voix ont le **même script** ; contrôle automatisé par empreinte du
fichier de texte; 3 empreintes MP3 distinctes. Cela ne constitue **PAS**
une preuve d'intonation humaine : audition et validation subjective obligatoires.

Lien permanent d'écoute iPhone (tous les lecteurs audio HTML5 au même endroit) :
https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/nextgen/voice-v2/listen.html

A — Vivienne :
https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/nextgen/voice-v2/vivienne_continuous-audition-only.mp3

B — Denise :
https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/nextgen/voice-v2/denise_news-audition-only.mp3

C — Sylvie :
https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/nextgen/voice-v2/coralie_warm-audition-only.mp3

AUCUN fichier MP3 n'est autorisé pour diffusion commerciale automatique.
La prochaine étape **conditionnelle** est une audition Dragon HD avec accès
Azure réellement autorisé, non disponible dans le présent pipeline.

## Fond de signature corrigé après VRAI contrôle de photogrammes

Un premier essai bleu nuit et graphite a été rejeté par AUTO-AUDIT :
le logo bleu foncé restait trop peu contrasté sur les fonds très sombres.
Le code a été corrigé en gardant la même source G0, la même animation
Remotion et la même typographie.

- "Bleu nuit" : léger halo bleu acier éclairant l'œil, bordure très sombre.
- "Acier clair" : bleu-gris très désaturé, texte bleu marine à fort contraste.

Les vrais photogrammes finaux ont été comparés côté serveur.
CI de cette correction :
https://github.com/OBIANG5/World-Health-Vision/actions/runs/43606786112

Prévisualisations indépendantes de 3 s :
https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/nextgen/brand/worldvision-original-g0-midnight.mp4

https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/nextgen/brand/worldvision-original-g0-graphite.mp4

L'ancien MP4 du reportage Shenzhen n'a jamais été écrasé.
