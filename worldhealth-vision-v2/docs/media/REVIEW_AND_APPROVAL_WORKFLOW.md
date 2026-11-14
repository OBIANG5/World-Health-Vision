# World-Vision — système de notation et de validation humaine (v1)

État : UI intégrée à la branche `feature/world-vision-media-studio`. **Aucun moteur n'est autorisé à recommencer un rendu sur la seule base d'une note.**

## Objectif

Mettre en place une boucle de production itérative, traçable et strictement soumise à validation humaine : chaque élément peut être noté de 1 à 10, refusé, corrigé et de nouveau évalué avant la phase suivante.

## Parcours utilisateur

1. Ouvrir le **même lien permanent** `https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/index.html?view=media`.
2. Ouvrir l'onglet **« ★ Noter & valider »** ou le bouton **« ★ Noter / valider cette étape »** depuis l'étape du processus.
3. Choisir le jalon : identité/logo, script, médias, voix, animation, montage, publication, ou **vidéo complète**.
4. Visionner le livrable (quand il existe), noter la qualité **globale** et les critères concernés de 1 à 10. Marquer ce qui est **bloquant**.
5. Décrire les défauts observés et les modifications attendues.
6. Décider explicitement : **À corriger**, **Refusé** ou **Je valide**.
7. Cliquer sur **Transmettre l'avis à GitHub** : le navigateur ouvre un **GitHub Issue prérempli**. Il faut se connecter au compte GitHub ayant accès au dépôt puis cliquer sur **Submit new issue** pour réellement l'enregistrer.
8. Une fois soumis, l'avis devient durable et peut être retrouvé par ChatGPT via le connecteur GitHub, en recherchant le préfixe `[WV-REVIEW]` sur le dépôt. L'utilisateur peut aussi donner le numéro `#issue`.
9. Le prochain élément à réaliser est déterminé à partir des notes et des points bloquants de la **version** évaluée. Une correction doit générer une nouvelle version puis une nouvelle évaluation.

## Champs structurés conservés dans l'issue

```json
{
  "schema_version": "world-vision-review-v1",
  "kind": "editorial_human_feedback",
  "story_id": "wv-cop31-un-risk-finance-2026-11-12",
  "gate_id": "video",
  "artifact_ref": "<SHA-256 du MP4>",
  "video_sha256": "<SHA-256 du MP4>",
  "decision": "refuse",
  "overall_score": 2,
  "category_scores": {"logo": 1, "voix": 2, "animations": 1},
  "blocking_categories": ["logo", "voix", "animations"],
  "feedback": "La vidéo doit être complètement repensée.",
  "correction_priorities": "Reprendre le logo, auditionner les voix, refaire les animations."
}
```

Le JSON ci-dessus illustre le schéma, **ce n'est pas une évaluation enregistrée par l'utilisateur**.

## Critères et sécurités

- Les notes sont de **1 à 10**, avec état *non noté*, sans note artificielle initiale.
- Une validation positive n'est proposée que si un livrable réellement versionné existe, que la note globale est au moins **8/10**, qu'au moins trois aspects sont notés à au moins **8/10**, et qu'aucun aspect marqué **bloquant** n'existe.
- Même si les scores dépassent 8/10, **seul l'utilisateur peut choisir « Je valide »**. Les notes ne constituent pas automatiquement une autorisation de production.
- Un refus ou une demande de correction n'a pas de seuil minimum de notation, mais la grille conserve des raisons concrètes et un plan de correction.
- Chaque avis est lié au `story_id`, au jalon et à l'identifiant de version du livrable ; pour un MP4, le SHA-256 exact permet de comparer plusieurs versions sans mélanger les avis.
- Une version rejetée reste rejetée, même si les contrôles CI automatiques passent.

## Stockage et sécurité : état réel

Le site GitHack est **statique**, donc incapable de recevoir directement des notes persistantes en provenance d'un navigateur non authentifié.

### Ce qui fonctionne maintenant

- Le formulaire est entièrement utilisable sur téléphone et ordinateur.
- Les brouillons de notation sont enregistrés dans **localStorage** de ce navigateur pour cette origine et cette version d'artefact (non synchronisés avec un autre appareil).
- Un avis peut être copié en JSON et exporté.
- La transmission durable est réalisable par le **GitHub Issue prérempli** qui nécessite un clic final de l'utilisateur sur GitHub. **Aucune clé API GitHub n'est incorporée au JavaScript du site.**
- ChatGPT, lorsque la connexion GitHub est disponible dans une future conversation, peut retrouver les avis effectivement soumis sur le dépôt.

### Ce qui n'est PAS encore implémenté

- Un backend authentifié pour enregistrer automatiquement la note dès « Envoyer » depuis le site.
- La synchronisation instantanée des notes entre téléphones.
- La transformation automatique d'un avis en tasks/commits/rendus.
- Le blocage côté serveur des transitions éditoriales selon les gates de validation.
- L'accès API à Google Flow/Gemini Pro depuis l'abonnement Google personnel.

Ces fonctions pourront être réalisées **après** la validation de l'interface et la création d'un service d'enregistrement sécurisé (GitHub App/OAuth ou service web protégé avec audit). Ne pas injecter un token GitHub ni une clé Gemini dans le frontend ou dans un webhook public non authentifié.

## Contrat de workflow futur

```text
Livrable version N
  -> formulaire 1–10 par critère
  -> avis humain sur GitHub / service sécurisé
  -> VALIDÉ ?  (oui -> nouvelle étape, non -> tâches de correction)
  -> rendu du composant version N+1
  -> nouvelle notation
```

Important : cet automate n'est **pas encore branché**. Tout rendu ou publication nécessite toujours les contrôles existants et une décision humaine supplémentaire.

## Connexion future n8n, Make et Gemini

- **n8n/Make** peuvent exécuter la logique conditionnelle, transformer un avis en tâche GitHub, notifier ChatGPT et appeler Gemini.
- **Gemini API** nécessite une clé propre à Google AI Studio/Google Cloud, stockée dans une variable d'environnement secrète sur le service ou dans un coffre de credentials n8n/Make. Les abonnements Google AI Plus/Pro/Ultra pour les applications ne garantissent **pas** des appels API gratuits avec les mêmes quotas.
- Les crédits **Google Flow** sont une autre voie : produire manuellement des extraits haute qualité dans Flow puis les importer dans le dossier de médias approuvés. Ils ne doivent jamais servir à présenter une fiction comme image d'un événement réel.
- Après la validation du jalon système de notation, comparer les deux options : **GitHub Issues uniquement** (simple, gratuit, traçable et avec confirmation) et **service privé + webhook n8n/Make** (automatisable, authentifié, plus d'exploitation et de coût).

Dernière règle : **la qualité artistique, la protection de la marque et l'approbation humaine priment sur la rapidité et la quantité de rendus.**
