// WorldHealthVision V2 — labels.ts
// Dictionnaires FR/EN pour les labels UI statiques (section titles, boutons, métadonnées).
// Les données dynamiques (lensDisplayName, headline…) viennent du backend en français.

import type { Lang } from "../context/LanguageContext";

export const UI: Record<Lang, {
  pays: string;
  regions: string;
  indicateursClés: string;
  pointsClés: string;
  indicateursMacro: string;
  clicPourDetails: string;
  signauxVoyageCout: string;
  coutVie: string;
  securite: string;
  convertisseurDevises: string;
  comparateurPays: string;
  indicateur: string;
  comparerAvec: string;
  comparer: string;
  chargement: string;
  chargementCatalogue: string;
  paysDisponibles: string;
  chargementFiche: string;
  aucuneDonnee: string;
  aucuneDonneeSecurite: string;
  ingestionPendante: string;
  tauxActuel: string;
  sourceData: string;
  tauxChange: string;
  baseFallback: string;
  capitale: string;
  devise: string;
  region: string;
  sousRegion: string;
  classeRevenu: string;
  qualiteDonnees: string;
  exporter: string;
  maxNrm: string;
  fermer: string;
  csv: string;
  pdf: string;
  tendanceHistorique: string;
  evolution30j: string;
  evolution90j: string;
  sources: string;
  langue: string;
}> = {
  fr: {
    pays: "Pays",
    regions: "Régions",
    indicateursClés: "Indicateurs clés",
    pointsClés: "Points clés",
    indicateursMacro: "Indicateurs macro",
    clicPourDetails: "Cliquer pour détails + graphique + sources",
    signauxVoyageCout: "Signaux voyage & coût",
    coutVie: "Coût de la vie",
    securite: "Sécurité",
    convertisseurDevises: "Convertisseur de devises",
    comparateurPays: "Comparateur de pays",
    indicateur: "Indicateur",
    comparerAvec: "Comparer avec (Ctrl+clic, 4 pays max)",
    comparer: "Comparer",
    chargement: "Chargement...",
    chargementCatalogue: "Chargement du catalogue...",
    paysDisponibles: "pays disponibles",
    chargementFiche: "Chargement de la fiche pays...",
    aucuneDonnee: "Aucune donnée disponible pour ce pays.",
    aucuneDonneeSecurite: "Données de sécurité non disponibles pour ce pays.",
    ingestionPendante: "Ingestion UNODC en attente.",
    tauxActuel: "Taux :",
    sourceData: "Frankfurter API",
    tauxChange: "Taux de change",
    baseFallback: "hors Frankfurter — base USD",
    capitale: "Capitale",
    devise: "Devise",
    region: "Région",
    sousRegion: "Sous-région",
    classeRevenu: "Classe de revenu",
    qualiteDonnees: "Qualité données",
    exporter: "Exporter",
    maxNrm: "Nrm",
    fermer: "✕",
    csv: "CSV",
    pdf: "PDF",
    tendanceHistorique: "Tendance historique",
    evolution30j: "Évolution 30 j",
    evolution90j: "Évolution 90 j",
    sources: "Sources",
    langue: "EN",
  },
  en: {
    pays: "Country",
    regions: "Regions",
    indicateursClés: "Key Indicators",
    pointsClés: "Highlights",
    indicateursMacro: "Macro Indicators",
    clicPourDetails: "Click for details + chart + sources",
    signauxVoyageCout: "Travel & Cost Signals",
    coutVie: "Cost of Living",
    securite: "Safety",
    convertisseurDevises: "Currency Converter",
    comparateurPays: "Country Comparator",
    indicateur: "Indicator",
    comparerAvec: "Compare with (Ctrl+click, max 4)",
    comparer: "Compare",
    chargement: "Loading...",
    chargementCatalogue: "Loading catalogue...",
    paysDisponibles: "countries available",
    chargementFiche: "Loading country sheet...",
    aucuneDonnee: "No data available for this country.",
    aucuneDonneeSecurite: "No safety data available for this country.",
    ingestionPendante: "UNODC ingestion pending.",
    tauxActuel: "Rate:",
    sourceData: "Frankfurter API",
    tauxChange: "Exchange rate",
    baseFallback: "not in Frankfurter — using USD",
    capitale: "Capital",
    devise: "Currency",
    region: "Region",
    sousRegion: "Sub-region",
    classeRevenu: "Income class",
    qualiteDonnees: "Data quality",
    exporter: "Export",
    maxNrm: "Nrm",
    fermer: "✕",
    csv: "CSV",
    pdf: "PDF",
    tendanceHistorique: "Historical trend",
    evolution30j: "30-day evolution",
    evolution90j: "90-day evolution",
    sources: "Sources",
    langue: "FR",
  },
};

export function t(lang: Lang, key: keyof typeof UI["fr"]): string {
  return UI[lang][key];
}