# World-Vision — Soudan du Sud · Élections reportées · 14 novembre 2026

## Décision de production
Premier reportage Afrique à finaliser, format TikTok/WhatsApp 9:16, au plus 30 secondes. L'actualité est une vraie information confirmée ; la production vidéo s'appuie sur le studio World-Vision déjà codé. Le résultat reste une candidate de relecture jusqu'à l'approbation explicite de l'utilisateur.

Branche isolée : feature/worldvision-south-sudan-short-2026-11-14 ; source de base : feature/world-vision-media-studio ; pas de modifications à main.

## Faits journalistiques
- Le pays est indépendant depuis le 9 juillet 2011 et n'a organisé aucune élection générale nationale depuis.
- Les élections présidentielle et législatives prévues le 22 décembre 2026 sont déplacées au 11 février 2027, selon la commission électorale nationale.
- Celle-ci n'a pas fourni de raison officielle du report. NE PAS présenter la guerre ou l'insécurité comme cause officielle.
- Le 10 novembre, la mission de l'ONU mettait en garde contre des tensions et défis politiques et sécuritaires.

Sources : Reuters https://www.reuters.com/world/africa/south-sudan-delays-election-february-11-2027-2026-11-14/ ; AP https://apnews.com/article/c62033bb79a606ef8ce7e335cfc8478b ; ONU https://unmiss.unmissions.org/en/press-releases/remarks-by-anita-kiki-gbeho-special-representative-of-the-secretary-general-1

## Voix, mots exacts
1. « Imagine un pays indépendant depuis quinze ans… mais qui n'a encore jamais organisé d'élections nationales ! »
2. « C'est le Soudan du Sud. »
3. « Le pays devait enfin voter le 22 décembre. Mais nouveau coup de théâtre : les élections sont repoussées au 11 février 2027 ! »
4. « Aucune raison officielle n'a été donnée. »
5. « Pendant ce temps, l'ONU alerte sur les violences et les tensions politiques. »
6. « Quinze ans après l'indépendance, les Sud-Soudanais attendent toujours leur premier scrutin national. »

Six clips calés sur la durée réelle de leur voix. Le moteur local Kokoro-82M sous licence Apache 2.0 et la voix française ff_siwis issue de SIWIS (CC BY 4.0) font une première candidate, pas une validation artistique. Aucune génération de fausses images sur place.

## Storyboard
S1 — vraie foule Juba, 9 juillet 2011, label ARCHIVES · JUBA, 2011. Titre 15 ANS / SANS ÉLECTIONS NATIONALES.
S2 — portrait authentique Salva Kiir 2020, CC0, label ARCHIVES · SALVA KIIR, 2020. Identifier le pays.
S3 — animation typographique originale du changement : 22 DÉC. 2026 barré → 11 FÉV. 2027.
S4 — homme au drapeau photographié en 2011, label d'archive. AUCUNE RAISON OFFICIELLE.
S5 — vraie foule de 2011, label d'archive. L'ONU ALERTE / VIOLENCES · TENSIONS.
S6 — retour à la photo de foule de 2011, label d'archive. 2011 → 2026 / TOUJOURS EN ATTENTE.

Photographies : Sarah Taylor / USAID Africa Bureau, juillet 2011, domaine public américain, et Evon2023, Salva Kiir 2020 CC0. Pages sources et SHA-256 consignés dans le manifest généré. Aucun rush Reuters/AP réutilisé, et aucune scène de novembre 2026 prétendument filmée.

Éléments de marque : logo officiel G0 PNG exact, Manrope Variable épinglé par SHA-256, bleu nuit/cyan/blanc, textes grand format, zones sûres TikTok. Interdiction totale des incrustations purement internes telles que Preview, Sans voix, QA, S01, V1, etc.

## Rendu et traçabilité
Code : worldhealth-vision-v2/services/media-renderer/scripts/worldvision_south_sudan_30s.py
CI : .github/workflows/whv-south-sudan-short-2026-11-14.yml
Viewer mobile après exécution réussie :
https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/south-sudan-2026-11-14/index.html
Vidéo : world-vision-soudan-du-sud-elections-v1.mp4 ; H264, AAC, 1080×1920, 30 images par seconde. Manifeste de provenance et contact-sheet.
Le montage ne doit pas être publié automatiquement.

## Ensuite : file de production demandée
- Sujet 09 : crise de l'or en Guinée, Siguiri.
- Sujet 08 : effondrement à Syokimau au Kenya.
- Sujet 06 : sanction de Jesús Owono, gardien équato-guinéen.
Pour chacun : revérifier les faits, script accrocheur 30 secondes maximum, vrais médias réutilisables et voix de qualité avant publication.


## Journal du premier rendu — 14 novembre 2026
- Action vérifiée : https://github.com/OBIANG5/World-Health-Vision/actions/runs/43591867079 — conclusion SUCCESS sur toutes les étapes.
- Commit publication aperçu : b48fab28dec3741870709b53899cb39404a0a484, branche whv-media-studio-browser-preview.
- Fichier MP4 réellement présent, 1 678 624 octets, empreinte SHA-256 bda65edf53c7589e1fc143aece452063653e3e80fc189aa365d7ba36180e91f1.
- Durée probe 27,576 secondes, 1080×1920, 30 i/s, H.264 + AAC, six scènes vocalement minutées. Voice atempo = 1, donc aucune accélération forcée de la synthèse.
- Visual QA : contact-sheet présent sur la branche publique, trois photogrammes début/milieu/fin consultés ; pas de labels techniques visibles sur ces trois images.
- Limite : la piste Kokoro n'a pas subi d'audition humaine subjective ; demander validation vocale et artistique à l'utilisateur avant tout statut publié.
- URL pérenne de visionnage : https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/south-sudan-2026-11-14/index.html
- Aucune publication TikTok/WhatsApp, aucune validation finale supposée.
