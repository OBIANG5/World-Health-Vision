# World-Vision — lien permanent, versions publiées et cache

**Établi le : 13 novembre 2026.** Motif : l'utilisateur ne voyait pas les maquettes A/B/C en ouvrant le lien « permanent » historique.

## Les trois couches à distinguer

1. **Source GitHub** : `feature/world-vision-media-studio` contient React/TypeScript, Remotion, backend, tests et documentation.
2. **Déploiement des fichiers compilés** : `whv-media-studio-browser-preview` reçoit le contenu de `frontend/web-v2/dist/` après succès du workflow `.github/workflows/whv-media-studio-mobile-preview.yml`. Ne pas confondre son HEAD avec celui de la branche source.
3. **Cache de diffusion tiers RawGitHack** : `https://raw.githack.com/...` sert les fichiers branchés, avec un délai avant de refléter les derniers commits. Ce n'est pas le serveur Node ni le navigateur connecté à la base de données.

Le site **n'est pas une application avec backend public en fonctionnement permanent**. Les liens TikTok et WhatsApp ne servent pas à publier automatiquement.

## Pourquoi la page semblait ancienne

- `index.html?view=media` présente **« Parcours vidéo »** au départ. Les maquettes A/B/C étaient cachées dans **« Noter & valider » → « Direction artistique »**. L'utilisateur pouvait donc voir encore le premier MP4 refusé sans savoir que trois nouveaux cadres avaient été produits.
- Le service RawGitHack documente une mise en cache temporaire pour les URLs de branche ; les changements peuvent arriver « within minutes », parfois jusqu'à environ une heure avec plus de trafic.
- Un ajout arbitraire de `?v=123` n'est **pas une preuve d'invalidation du CDN** ; les règles cache sont gérées par le service et la navigation de l'application utilise déjà des paramètres `view`, `screen` et `gate`.

**Documentation du fournisseur :** https://raw.githack.com/

## Correction de visibilité dans le frontend

- La page d'accueil « Parcours vidéo » affiche en haut un panneau clair : **« Les trois nouvelles ouvertures sont disponibles ici »**, avec bouton **« Voir A, B et C · noter une proposition »**.
- L'en-tête affiche un bandeau **« APERCU STATIQUE · VERSION DU SITE : <SHA court> »** et un lien vers la branche GitHub compilée. Ce SHA provient de `preview-deployment.json` et identifie le `source_commit` du code ayant servi au build.
- L'URL directe G1 permet d'ouvrir les trois créations sans parcourir les 14 étapes :
  https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/index.html?view=media&screen=review&gate=direction
- Les captures et le MP4 réel continuent d'exister dans `whv-media-studio-browser-preview`, sans écraser la preuve de la première version rejetée.

## Contrôles après chaque publication d'un incrément

1. Ouvrir le dernier workflow [Media Studio real-UI mobile preview](https://github.com/OBIANG5/World-Health-Vision/actions/workflows/whv-media-studio-mobile-preview.yml) et vérifier `conclusion: success`.
2. Vérifier que la branche d'aperçu contient `index.html`, `assets/`, `preview-deployment.json`, les images A/B/C, `brand/world-vision-official.png`, les licences et l'archive du MP4.
3. Vérifier que le `source_commit` de `preview-deployment.json` est **le commit réellement déployé** par le run, pas nécessairement le HEAD de la branche source si des commits docs ont été ajoutés ensuite.
4. Ouvrir le lien permanent **sans aucun paramètre supplémentaire**, vérifier le panneau de l'accueil, le SHA affiché et la navigation vers A/B/C.
5. Ouvrir le lien G1 direct, contrôler les trois cadres 9:16 et la provenance de la photo historique.
6. Inspecter les captures produites lors des tests Playwright (iPhone 390×844, desktop), mais **ne pas prendre une capture de CI comme preuve définitive du contenu déjà sorti du cache RawGitHack**.
7. En cas de doute, consulter le lien **immuable** du commit de `whv-media-studio-browser-preview` via `rawcdn.githack.com`; cette URL change à chaque release et n'est donc pas le lien permanent.
8. Ne jamais promettre le rafraîchissement instantané sous RawGitHack. Envisager un hébergement stable de vrai site (par ex. Vercel avec domaine/alias fixe et releases atomiques) séparément, si les accès, budgets et règles de contenu le permettent.

## Que faire quand le téléphone montre encore l'ancien site

- Aller directement vers la page G1 avec `screen=review&gate=direction`.
- Vérifier la valeur `VERSION DU SITE` : si différente du dernier `source_commit` de la branche déployée, l'ancien code/HTML peut encore être en cache.
- Éventuellement réouvrir dans un navigateur externe et actualiser, ou attendre le renouvellement du cache. Cela ne règle pas le problème structurel d'un CDN branché.
- Pour une preuve immédiate sans cache mouvant, consulter les images sur GitHub :
  `style-frame-terrain.png`, `style-frame-chiffres.png`, `style-frame-pedagogie.png` sur la branche `whv-media-studio-browser-preview`.

## Ne pas confondre « permanent » et « instantané »

`raw.githack.com/.../whv-media-studio-browser-preview/index.html` = **adresse constante pointant vers la branche** (mise à jour après déploiement + TTL).

`rawcdn.githack.com/.../<SHA>/index.html` = **photo figée et immutable d'une release précise** (adresse nouvelle à chaque release).

Une future URL Vercel avec alias fixe pourrait apporter un déploiement contrôlé sans attendre le cache d'une URL GitHack branchée ; **elle n'est pas encore déployée par le simple fait d'avoir cité Vercel**.
