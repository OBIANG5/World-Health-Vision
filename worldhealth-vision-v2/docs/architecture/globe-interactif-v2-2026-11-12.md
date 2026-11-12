# World Health Vision V2 — nouveau globe interactif

Cette évolution conserve la véritable application V2 et son système de fiches pays.

- Nouveau mode globe orthographique par défaut, avec détection des pays réels à partir de `countries.geojson`.
- Contrôles tactiles : glisser pour faire tourner, pincer pour zoomer, toucher un pays pour ouvrir la fiche V2 existante.
- Contrôles souris, roulette, boutons +/− et flèches du clavier.
- Le mode historique « Carte œil » reste disponible d’un clic, sans remplacement de Leaflet.
- Les couleurs régionales sont décoratives, **elles ne codent aucune statistique ni indice de crise**.
- L’aperçu GitHack reste statique et doit être explicitement identifié comme tel ; aucune collecte ou publication en direct n’est simulée.

Vérification attendue avant diffusion : build TypeScript, capture et interactions Chromium iPhone, sélection de pays, retour à la carte initiale, fiches pays et Sources & Méthodologie.