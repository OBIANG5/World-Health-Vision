# ADR — World-Vision MÉDIA : qualité internationale et préparation à plusieurs millions d'utilisateurs

**21 novembre 2026 · statut : DÉCISION D'ARCHITECTURE PROPOSÉE, PAS DÉPLOIEMENT NI BENCHMARK DE CHARGE.** Objet : concevoir dès maintenant les interfaces de production/distribution adaptées aux volumes futurs **sans transformer la réalisation COP31 en reconstruction du logiciel**. Ce projet média diffère du chantier Atlas/logiciel produit; les briques peuvent coexister, mais pas emprunter les priorités éditoriales.

## 1. Deux sortes de « millions » à ne jamais mélanger

**Plusieurs millions de lecteurs/spectateurs :** une vidéo de journalisme est généralement **encodée une seule fois** par langue, version, format, droits et profil; les spectateurs lisent un objet immutable via **stockage objet + CDN**, et non un nouveau rendu Remotion pour chaque lecteur. Le nombre de vues n'implique pas le même nombre de jobs de rendu. Le budget principal de diffusion est souvent **la bande passante**, à modéliser avant achat.

**Beaucoup de créateurs/productions simultanés :** c'est un autre problème : droits individuels, quotas, file durable, idempotence, limites de GPU/CPU, priorité, coût par minute et reprise après crash. Dimensionner sur des mesures **de jobs/heure, pics, p95/p99, taille média**, et non sur « 1 million » comme slogan marketing.

## 2. Audit de l'EXISTANT dans GitHub (pas d'invention)

- Studio/front : **TypeScript + React 19, Vite, Remotion Player** ; `frontend/web-v2/package.json`.
- Montage : **TypeScript/JavaScript Node, Remotion 4.0.542 épinglé + FFmpeg** ; `services/media-renderer/package.json`, `server.mjs` et code créatif. **Garder** cet ensemble : il répond directement au motion design vectoriel, aux overlays, à l'export précis, aux tests et au Player; une réécriture Rust/Go ne produirait pas automatiquement une meilleure vidéo.
- Éditorial / API médias : **Python 3.12 / FastAPI / Pydantic / psycopg / Redis** déjà déclaré dans `services/media-service/pyproject.toml`, et sous-système **Java** de gateway/catalogue dans la V2. Chaque langage garde sa responsabilité; ne pas ajouter d'autres services parce qu'ils existent.
- Renderer `job-store.mjs` : modèle **MemoryJobStore** si `WHV_RENDER_REDIS_URL` absent; **RedisJobStore** si présent, avec fingerprint SHA pour tentative d'idempotence. **Ce n'est pas encore une garantie de HA/multi-workers** : `RedisJobStore.enqueue()` utilise `LRANGE` puis `LPUSH` (deux étapes non atomiques), `dequeue()` utilise `RPOP` sans revendication/ack durable. Le fingerprint est stocké avec `SET` simple, sans `SET NX` atomique. **Do not claim exact-once semantics.** Reprise en cours/absence de sortie, collisions worker, multi-tenant et durabilité doivent être testées avant production.
- `server.mjs` : fichiers MP4 servis depuis `WHV_RENDER_OUTPUT_DIR` local par flux; utile en développement, **pas une couche de diffusion publique à des millions de vues**. Le README du renderer lui-même appelle à persistance/QA et sortie durable.
- `services/media-service/README.md` dit explicitement que le repository éditorial initial est **en mémoire**, pas persistence opérationnelle complète. Ne jamais le décrire comme un CMS multi-tenant prêt pour l'international.
- Aucun test de charge réel à 1 million d'utilisateurs, preuve de droits multi-territoires, CDN global ou architecture multi-région n'a été établi ici. Les tests Remotion verts ne constituent pas un tel benchmark.

## 3. Choix technologiques — par qualité de responsabilité, non par mode

| Responsabilité | Choix prudent actuel | Pourquoi / critère de changement |
|---|---|---|
| Front Studio & Player | **TypeScript + React + Remotion Player** | Préserve le flux éditorial WYSIWYG, les couches synchronisées et le rendu; changer le framework seulement sur problème mesuré |
| Rendus vidéo | **Node/TypeScript + Remotion + FFmpeg** | Même script→composition→export; composer une fois, encoder une fois par version; pool de workers spécialisé |
| Orchestration et catalogage des sources | **Python/FastAPI existant + PostgreSQL** | Provenance, états, licences, décisions et audit durables; ne pas fabriquer un nouveau service ou une base par film |
| Queue de travaux | **Redis existant pour développement**, puis revendication/ACK durable éprouvée ou queue managée | Claim/ACK, visibility timeout, retry borné, DLQ et idempotence testés EN multi-worker; ne pas prétendre que `RPOP` simple suffit |
| Métadonnées, permissions, versions | **PostgreSQL** comme source de vérité transactionnelle | Asset SHA, provenance, territoires, statut des droits, script/voix verrouillés, version du master; journal de décisions |
| Masters/rushes | **Stockage objet** (S3 compatible ou équivalent), buckets privés pour brouillons | Copies durables et versionnées; SHA+ETag, cycle de vie, chiffrement, aucune dépendance au disque d'un conteneur |
| Distribution de vidéos approuvées | **CDN** sur MP4/HLS adaptatifs selon vrais usages | Servir 1 objet à N utilisateurs, coût/latence mesurés et caches à invalidation explicite; pas de renderer par lecture |
| Observabilité/fiabilité | Traces de job, métriques temps/erreur/CPU/coût, logs sans données sensibles, alerting | QA et debugging production, budgets/quotas, contrôles des retards |
| Go/Rust | **Ne pas introduire pour l'instant** | Seulement si profilage prouve un point chaud précis impossible à résoudre avec Remotion/FFmpeg/optimisation de la file |

**Règle de dépendances :** versions épinglées pour moteurs critiques, scans de vulnérabilités, licence de chaque librairie, tests de reproductibilité Player/MP4; journal de mise à jour. Aucune technologie ne devient « meilleure » uniquement parce qu'elle est plus récente.

## 4. Contrat de production qui sera nécessaire AVANT l'ouverture au grand public

1. `story_id`, `script_sha256`, `voice_sha256`, identifiant exact de la voix, `asset_sha256[]`, `rights_scope`, `territories`, `render_profile`, `version` et `publication_approved` explicites dans le manifeste immuable d'un master.
2. Jobs rendus **idempotents sous concurrence**, avec lease/ACK, contention inter-workers, reprises et DLQ démontrés; sorties durables en stockage objet; protection contre doublons coûteux.
3. Brouillons/voix/rushes privés; liens temporaires signés; droit d'accès par rôle, journal d'accès, quotas par compte, rate limits, protection contre requêtes de rendu abusives.
4. Publication exige **droits, vérification des faits actuelle, décision humaine**, absence de diff du script/voix depuis revue; invalidation des versions CDN en cas de correction ou retrait.
5. Export puis vérification du **vrai audio et des pixels mobiles** sur le MP4 final, pas seulement tests/succès CI; tests d'accessibilité sous-titres et sécurité média.
6. Avant changement d'architecture, exécuter un **benchmark contrôlé** de 1, 2, 4 workers, throughput, crash/reprise, p95 rendu, bande passante CDN, coût par vidéo et par 1 000 vues; objectifs documentés à partir de vrais besoins.

## 5. Quand implémenter, pour ne PAS perdre le cap créatif

**MAINTENANT, sur la COP31 :** garder les formats de sources exactes (SHA, licence, statut), docs/URL et décisions, et réutiliser Remotion/FFmpeg existant. Le prochain gain produit est **un vrai film COP31 beau, vérifié, bien narré et corrigible**, pas un nouveau système cloud. Aucun achat ni déplacement de code en masse.

**AVANT UN PREMIER LANCEMENT PUBLIC MULTIUTILISATEUR :** priorité à persistance éditoriale et des droits, stockage objet, queue fiable sous charge et droits d'accès. Puis diffusion CDN, métriques et simulation de trafic. Éviter un seul VPS contenant à la fois base de données, rendu vidéo et serveur public comme fondation de « millions »; c'est un goulot et un risque de panne.

**PLUS TARD, QUAND LES MESURES L'EXIGENT :** scalabilité horizontale des workers, variantes multilingues, pipelines de rendu parallèles et distribution géographique, contrôle des coûts. Pas de microservices/Go/Rust « par prestige ».

**Statut :** ADR préparatoire uniquement; aucun code d'infrastructure modifié, aucun VPS/CDN/abonnement créé, aucun argent engagé. Ne pas confondre PR #142 (MÉDIA) avec les décisions de déploiement du logiciel Atlas.
