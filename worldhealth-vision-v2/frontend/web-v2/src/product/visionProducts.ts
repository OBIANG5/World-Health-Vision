/**
 * WORLD-VISION — truthful international product registry.
 *
 * This is navigation, NOT a database of verified integrations or entitlements.
 * Never infer live data, paid services or working notifications from a card.
 * Independent of media/voice branches and of experimental backend PR #59.
 */
export type VisionId =
  | "atlas" | "watch" | "money" | "transport" | "tourism"
  | "price" | "basket" | "trading" | "brvm" | "radar" | "media";

export type VisionFamily = "understand" | "monitor" | "compare" | "editorial";
export type VisionStage = "explorable" | "partial" | "planned";
export type VisionAction = "country" | "favorites" | "currency" | "travel" | "sources" | "radar";

export interface LocalizedCopy {
  fr: string;
  en: string;
}

export interface VisionProduct {
  id: VisionId;
  family: VisionFamily;
  stage: VisionStage;
  name: string;
  tagline: LocalizedCopy;
  description: LocalizedCopy;
  objective: LocalizedCopy;
  caveat: LocalizedCopy;
  action?: VisionAction;
  actionLabel?: LocalizedCopy;
}

export const VISION_PRODUCTS: readonly VisionProduct[] = [
  {
    id: "atlas", family: "understand", stage: "explorable", name: "Atlas Vision",
    tagline: { fr: "Pays, régions et indicateurs", en: "Countries, regions and indicators" },
    description: {
      fr: "Un globe interactif, des fiches pays et des outils d'exploration existants.",
      en: "An interactive globe, country profiles and existing exploration tools.",
    },
    objective: {
      fr: "Comparer les chiffres d'institutions locales, régionales et internationales, avec périodes et révisions vérifiables.",
      en: "Compare local, regional and global institutional figures with verifiable periods and revisions.",
    },
    caveat: {
      fr: "217 pays au registre ne signifient pas 217 pays alimentés par des données officielles vérifiées.",
      en: "A catalog of 217 countries does not mean 217 countries have verified official observations.",
    },
    action: "country", actionLabel: { fr: "Explorer les pays", en: "Explore countries" },
  },
  {
    id: "watch", family: "monitor", stage: "planned", name: "Watch Vision",
    tagline: { fr: "La surveillance qui continue", en: "Monitoring that persists" },
    description: {
      fr: "Un futur moteur partagé d'alertes autonomes et consenties, par sujet et par condition.",
      en: "A future shared engine for autonomous, opt-in, rule-based alerts.",
    },
    objective: {
      fr: "Règles persistantes, historique des observations, dédoublonnage et preuve d'envoi des notifications.",
      en: "Persistent rules, observation history, deduplicated alerts and delivery receipts.",
    },
    caveat: {
      fr: "Les favoris actuels ne constituent pas encore un moteur Watch autonome ni des notifications garanties.",
      en: "Existing favorites are not an autonomous Watch engine or guaranteed notifications.",
    },
    action: "favorites", actionLabel: { fr: "Voir les favoris actuels", en: "View existing favorites" },
  },
  {
    id: "money", family: "compare", stage: "partial", name: "Money Vision",
    tagline: { fr: "Devises et transferts", en: "Currencies and transfers" },
    description: {
      fr: "Le convertisseur V2 est un point de départ pour les taux, les frais et le montant réellement reçu.",
      en: "The existing V2 converter is the starting point for rates, fees and real amounts received.",
    },
    objective: {
      fr: "Comparer le coût total des transferts par corridor, puis surveiller taux et frais sous licence.",
      en: "Compare total transfer costs by corridor, then monitor authorized rates and fees.",
    },
    caveat: {
      fr: "Taux informatif ≠ taux payable, frais nets vérifiés ou accès à un prestataire de transfert.",
      en: "Informational FX is not a payable rate, verified net fee or a connected transfer provider.",
    },
    action: "currency", actionLabel: { fr: "Ouvrir le convertisseur", en: "Open converter" },
  },
  {
    id: "transport", family: "monitor", stage: "planned", name: "Transport Vision",
    tagline: { fr: "Vols, trains, bus et trajets", en: "Flights, rail, bus and journeys" },
    description: {
      fr: "Comparer des offres réellement réservables et surveiller des baisses selon dates, bagages et budget.",
      en: "Compare verifiable bookable offers and watch price drops by dates, baggage and budget.",
    },
    objective: {
      fr: "Parcours origine→destination avec contraintes, prix total daté, revérification et notification.",
      en: "Origin-to-destination journey with constraints, dated all-in price and revalidation.",
    },
    caveat: {
      fr: "Aucun moteur mondial de prix de billets ni fournisseur de réservation n'est encore intégré.",
      en: "No global live-ticket comparison engine or booking supplier is integrated yet.",
    },
  },
  {
    id: "tourism", family: "compare", stage: "partial", name: "Tourisme Vision",
    tagline: { fr: "Découvrir et préparer un séjour", en: "Explore and plan a trip" },
    description: {
      fr: "Les outils de destination V2 existent ; le futur parcours reliera coûts, documents, mobilité et conseils officiels.",
      en: "V2 destination tools exist; future flows will connect costs, documents, mobility and official advisories.",
    },
    objective: {
      fr: "Checklist de voyage sourcée, frais et contraintes personnalisés, vérification des dates.",
      en: "Source-backed travel checklist, personalized costs and rules with date checks.",
    },
    caveat: {
      fr: "Ce n'est pas encore un système de réservation ni un avis consulaire en temps réel.",
      en: "This is not a booking service or live consular advisory.",
    },
    action: "travel", actionLabel: { fr: "Explorer une destination", en: "Explore a destination" },
  },
  {
    id: "price", family: "compare", stage: "planned", name: "Price Vision",
    tagline: { fr: "Prix et évolution d'un produit", en: "Prices and product history" },
    description: {
      fr: "Comparer la même référence entre vendeurs, stock, livraison et date d'observation.",
      en: "Compare the same item across merchants, stock, delivery and observation date.",
    },
    objective: {
      fr: "Historique de prix prouvés, codes-barres, baisse réelle et offres encore disponibles.",
      en: "Proven price history, barcodes, genuine reductions and still-available offers.",
    },
    caveat: {
      fr: "Sans collecte des offres et droits fournisseurs, aucune baisse ou promotion n'est affichée.",
      en: "Without licensed observed offers, no discount or promotion is asserted.",
    },
  },
  {
    id: "basket", family: "compare", stage: "planned", name: "Panier Vision",
    tagline: { fr: "Optimiser des courses locales", en: "Optimize local grocery baskets" },
    description: {
      fr: "Comparer le coût total d'un panier comparable entre commerces proches, unités et déplacement inclus.",
      en: "Compare an equivalent basket's all-in cost at nearby stores, including units and travel.",
    },
    objective: {
      fr: "Panier de dix références EAN avec provenance des prix, substitution et couverture géographique réelle.",
      en: "Ten EAN-identified items with price provenance, substitutes and real geographic coverage.",
    },
    caveat: {
      fr: "La disponibilité par magasin doit être prouvée : une estimation n'est jamais un prix de caisse.",
      en: "Store availability must be proven; an estimate is never a checkout price.",
    },
  },
  {
    id: "trading", family: "monitor", stage: "planned", name: "Trading Vision",
    tagline: { fr: "Macro, marchés et risque", en: "Macro, markets and risk" },
    description: {
      fr: "Calendrier des banques centrales, indices devises, corrélations, journal et gestion du risque.",
      en: "Central-bank calendar, currency indices, correlations, journal and risk management.",
    },
    objective: {
      fr: "Un cockpit financier sourcé, persistant et vérifiable, sans promesse de rendement.",
      en: "A persistent source-backed financial cockpit without return promises.",
    },
    caveat: {
      fr: "Cotations temps réel et exécution exigent droits de marché et conformité : pas de flux fictif.",
      en: "Live quotes and trading require licenses and compliance; no fabricated feed.",
    },
  },
  {
    id: "brvm", family: "monitor", stage: "planned", name: "Bourse Afrique Vision",
    tagline: { fr: "BRVM et marchés africains", en: "BRVM and African markets" },
    description: {
      fr: "Cours datés, dividendes, événements d'entreprises et suivi d'un portefeuille africain.",
      en: "Dated quotes, dividends, corporate events and African portfolio tracking.",
    },
    objective: {
      fr: "Pilote de cinq titres avec données redistribuables sous licence, comparaison et alertes.",
      en: "Five-stock pilot with licensed redistributable data, comparisons and alerts.",
    },
    caveat: {
      fr: "Aucun flux boursier officiel temps réel librement redistribuable n'est revendiqué.",
      en: "No freely redistributable official real-time exchange feed is claimed.",
    },
  },
  {
    id: "radar", family: "understand", stage: "partial", name: "Global Radar",
    tagline: { fr: "GDELT, signaux et vérification", en: "GDELT, signals and verification" },
    description: {
      fr: "Chercher réellement des mentions GDELT, ouvrir les publications originales et comparer leurs métadonnées, sans publier de conclusion automatique.",
      en: "Run actual GDELT discovery, open original links and compare source metadata without automated factual conclusions.",
    },
    objective: {
      fr: "Pipeline Signal→Cluster→Preuves→Revue→Watch ou sujet éditorial validé.",
      en: "Signal→Cluster→Evidence→Review→Watch or approved editorial lead.",
    },
    caveat: {
      fr: "Pilote GDELT à la demande : aucune collecte persistante, aucune vérification automatique du contenu ou des éditeurs, aucune alerte.",
      en: "On-demand GDELT pilot: no persistent collection, automatic article verification, or notifications.",
    },
    action: "radar", actionLabel: { fr: "Ouvrir le Radar de sources", en: "Open source Radar" },
  },
  {
    id: "media", family: "editorial", stage: "planned", name: "World-Vision Média",
    tagline: { fr: "Comprendre et raconter les faits", en: "Explain and report the facts" },
    description: {
      fr: "Recherche, vérification, dossiers, articles, vidéos et publication avec validation éditoriale.",
      en: "Research, verification, reporting, articles, videos and human-approved publication.",
    },
    objective: {
      fr: "Un workflow éditorial relié aux faits et aux sources du Core, sans remplacer les branches média.",
      en: "Editorial workflows linked to Core evidence, without replacing the media branches.",
    },
    caveat: {
      fr: "Les outils et branches médias restent séparés ; aucun studio de publication n'est intégré à cette interface.",
      en: "Media tools and branches remain separate; no publishing studio is integrated here.",
    },
  },
];

export const VISION_FAMILIES: readonly { id: "all" | VisionFamily; title: LocalizedCopy }[] = [
  { id: "all", title: { fr: "Toutes les Visions", en: "All Visions" } },
  { id: "understand", title: { fr: "Comprendre", en: "Understand" } },
  { id: "monitor", title: { fr: "Surveiller", en: "Monitor" } },
  { id: "compare", title: { fr: "Comparer", en: "Compare" } },
  { id: "editorial", title: { fr: "Informer", en: "Report" } },
];
