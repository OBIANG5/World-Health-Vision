# World-Vision — V5 Atlas, relecture produit et refonte de la page d'accueil
23 novembre 2026. Branche design/v5-atlas-home-editorial-2026-11-23.
STATUT : expérimental, non validé visuellement, ne pas fusionner ni déployer en production.

## Raison du redémarrage
Le propriétaire rejette l'apparence générale de la V4 : accueil disproportionné, style peu professionnel, rendu du globe peu fidèle. Des tests React/Chrome verts n'équivalent pas à une direction artistique acceptée.

## Sources de conception relues avant de modifier le code
- docs/product/STRATEGIE_INTERNATIONALE_WORLD_VISION_MASTER_2026-11-19.md
- docs/product/WORLD_VISION_REORGANISATION_FONCTIONNELLE_ET_UX_2026-11-19.md
- docs/product/REGISTRE_PRODUITS_SOURCES_REVENUS_PRIORITES_2026-11-19.md
- docs/design/WORLD_VISION_COUNTRY_HUB_AND_GLOBAL_IA_2026-11-23.md
- docs/design/VISUAL_RESET_BEFORE_IMAGES_2026-11-23.md
- docs/design/WIREFRAMES_WORLDVISION_RESET_V2_2026-11-23.md
- src/product/visionProducts.ts, src/product/visionNavigation.ts et les parcours réels App/CountryDrawer.

World-Vision est une plateforme internationale géographique de connaissance, comparaison, vérification de sources et action : Monde → continent → pays → région → ville ; données et preuves → comparaisons → Money/Transport/Tourisme/Watch/Trading/BRVM/Price/Panier/Radar/Média. Le globe sert de navigation, pas de brochure promotionnelle. Les 11 Visions sont accessibles avec états réels et limites.

## Expérience à obtenir
- Sur téléphone : recherche d'un territoire avant le globe; planète reconnaissable, interactive et non recouverte de texte publicitaire; légende/provenance séparées; raccourcis sobres puis véritable répertoire des services.
- Sur ordinateur : globe large et géographique, une colonne de commandes utiles et une table des besoins plus bas, non six panneaux luminescents.
- Visuel : profondeur marine, blanc lisible, un cyan d'accent; pas de six palettes, pas de double halo sur chaque tuile, pas de titre géant servant seulement à occuper de l'espace.
- Typographie d'interface lisible, icônes SVG homogènes; mobile 320/390 vérifiés et aucune commande morte.
- L'accueil et le hub pays sont complémentaires; les espaces expert de chaque Vision restent distincts.
- Actualités = rubrique de lecture datée; Suivre = favoris actuels, futur abonnement de notification consentie à implémenter côté serveur; ne jamais annoncer de push déjà fonctionnel.
- Aucun faux cours de BVMAC/BRVM, aucun vol ni prix fictif; une source enregistrée n'est pas une donnée ingérée puis vérifiée.
- BRVM Vision concerne l'UEMOA, non la bourse locale du Gabon; distinguer BVMAC/CEMAC.

## Code V5 candidat
- WorldLandingV3.tsx : nouveau contenu et composition (nom historique conservé pour les imports et les tests), recherche prioritaire, véritables actions, répertoire des 11 Visions à 6 besoins et états.
- world-v4.css : nouveaux styles strictement limités au home V5; cette étape reste temporaire avant unification complète des anciens styles.
- GlobeMap.tsx : arcs ouverts plus proches, rubans moins épais, glows/stars réduits; projection, GeoJSON, zoom, clavier et WebGL conservés.
- Aucun changement aux données, faux mock, backend, média, facturation ou production.

## Contrôles incontournables et reprise
1. Ouvrir PR DRAFT sur la base de PR #151 et consigner le HEAD exact.
2. Rejouer sur le même HEAD les workflows V3 React/Vite/Chromium 320, 390, 820, 1440, Radar R1, R2B/UX1B. Ne masquer aucun échec.
3. Télécharger les captures produites et examiner les chevauchements, contrastes, scrolls et interactions; corriger les défauts réels.
4. Prévisualisation Vercel séparée, READY et vérifiée sur SHA exact, avec SSO/noindex; production inchangée.
5. Le test technique ne vaut jamais validation esthétique. Montrer au propriétaire un véritable rendu mobile et demander un retour avant de poursuivre sur la fiche pays et les workspaces.
6. Restent à faire : carte multi-échelle sous licence, géographie de niveau régional, performance GPU/Safari, recherche géographique internationale et préférences persistantes, vraies notifications Watch, design system unique et revues WCAG.

## Inspection réelle et correction visuelle V5/1.1
- Premier build TypeScript/lint OK; le premier run browser a échoué au téléchargement npm de dépendances sans lien avec le frontend. La workflow V5 installe désormais Playwright 1.65.1 isolément, sans modifier le lockfile de production.
- Screenshots Chromium du commit 93c9fb0 : sur 320/390, la recherche précède le globe, les services restent accessibles. Défauts constatés : fond rectangulaire du Canvas desktop, extrémités des arcs quasi jointes, recherche partiellement superposée à la scène mobile.
- Nouvelle correction : vignette spatiale transparente sans rectangle, extrémités des arcs séparées verticalement, début de la scène déplacé après la recherche mobile. Smoke test ajouté pour garantir la barre de recherche entièrement accessible à 320/390.
- Résultat de cette correction à vérifier sur le prochain HEAD. Ne pas confondre validation Chrome et approbation artistique du propriétaire.
