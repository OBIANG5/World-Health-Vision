// WorldHealthVision V2 — CountryDrawer (refonte dashboard)
// Design : onglets + KPI hero + détail par indicateur + projections en avant.
// Accessible aux professionnels et aux particuliers — termes vulgarisés.

import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTip, ResponsiveContainer } from "recharts";
import type {
  AgreementLevel,
  CompareCountriesResponse,
  CountryEconomicLens,
  CountryRelativeCostLens,
  CountrySummary,
  RelativeCostDecisionSignal,
} from "../../api/types";
import { fetchCompareCountries } from "../../api/whvApi";
import { useLang } from "../../context/LanguageContext";
import { useFxHistory } from "../../hooks/useFxHistory";
import { useCountrySheet } from "../../hooks/useCountrySheet";
import CountryLocalEvidencePanel from "./CountryLocalEvidencePanel";
import { useFxRates } from "../../hooks/useFxRates";
import { useIndicatorHistory } from "../../hooks/useIndicatorHistory";
import { useIndicatorOverview } from "../../hooks/useIndicatorOverview";
import { useIndicatorRank } from "../../hooks/useIndicatorRank";
import { t } from "../../i18n/labels";
import { pdfSafe } from "../../utils/pdf";
import TrendChart from "../charts/TrendChart";
import {WorldIcon,type WorldIconName} from "../ui/WorldIcon";
import ForecastChart from "../charts/ForecastChart";
import "../../styles/charts.css";
import "../../styles/country.css";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DrawerTab = "overview" | "economy" | "health" | "governance" | "markets" | "forecasts" | "safety" | "compare" | "fx";

type Props = {
  open: boolean;
  onClose: () => void;
  selectedCountryIso3: string;
  onCountryChange: (iso3: string) => void;
  countries: CountrySummary[];
  countriesLoading: boolean;
  countriesError: string | null;
  watched?: boolean;
  onToggleWatch?: () => void;
};

// ---------------------------------------------------------------------------
// Noms courts pour les pills (max ~12 car.)
// ---------------------------------------------------------------------------

const INDICATOR_SHORT: Record<string, string> = {
  "NY.GDP.MKTP.CD":        "PIB total",
  "NY.GDP.PCAP.CD":        "PIB/hab.",
  "NY.GDP.MKTP.KD.ZG":     "Croissance",
  "FP.CPI.TOTL.ZG":        "Inflation",
  "SL.UEM.TOTL.ZS":        "Chômage",
  "BN.CAB.XOKA.GD.ZS":     "Balance ext.",
  "NE.EXP.GNFS.ZS":        "Exports",
  "NE.IMP.GNFS.ZS":        "Imports",
  "SP.POP.TOTL":            "Population",
  "SP.DYN.LE00.IN":         "Espér. vie",
  "SP.DYN.IMRT.IN":         "Mortal. inf.",
  "SH.XPD.CHEX.GD.ZS":     "Santé",
  "SH.MED.PHYS.ZS":         "Médecins",
  "SE.XPD.TOTL.GD.ZS":     "Éducation",
  "SI.POV.GINI":             "Inégalités",
  "GC.DOD.TOTL.GD.ZS":     "Dette pub.",
  "GC.REV.TOTL.GD.ZS":     "Recettes",
  "GC.XPN.TOTL.GD.ZS":     "Dépenses",
  "IT.NET.USER.ZS":         "Internet",
  "EN.GHG.CO2.PC.CE.AR5":  "CO₂",
  "BX.KLT.DINV.WD.GD.ZS":  "IDE",
  "NE.GDI.FTOT.ZS":         "Investis.",
  "SL.TLF.CACT.ZS":         "Taux activ.",
  "WHV.SAFETY.HOMICIDE.RATE.P100K": "Homicides",
  "RL.EST":                  "État de droit",
  "CC.EST":                  "Anti-corruption",
  "GE.EST":                  "Efficacité gouv.",
  "PV.EST":                  "Stabilité pol.",
  "VA.EST":                  "Voix & compte",
  "RQ.EST":                  "Qualité réglmt.",
  "WHV.HDR.HDI.INDEX":       "IDH",
  "WHV.HDR.GII.INDEX":       "Inégal. genre",
  // Secteurs économiques (WB)
  "NV.AGR.TOTL.ZS":          "Agriculture",
  "NV.IND.TOTL.ZS":          "Industrie",
  "NV.SRV.TOTL.ZS":          "Services",
  // Education & infrastructure (WB)
  "SE.ADT.LITR.ZS":          "Alphabétis.",
  "SE.PRM.NENR":              "Scol. primaire",
  "SE.SEC.NENR":              "Scol. secondaire",
  "EG.ELC.ACCS.ZS":          "Électricité",
  "SH.H2O.BASW.ZS":          "Eau potable",
  "SH.STA.BASS.ZS":          "Assainissement",
  "SP.RUR.TOTL.ZS":          "Pop. rurale",
  "MS.MIL.XPND.GD.ZS":      "Dépense milit.",
  "AG.LND.ARBL.ZS":          "Terres arables",
  // BIS
  "WHV.BIS.CBPOL.RATE":      "Taux directeur",
  "WHV.BIS.CREDIT.PRIVATE.GDP": "Crédit privé",
  // IMF IFS
  "WHV.IFS.RESERVES.XAU.USD": "Réserves",
  "WHV.IFS.BROAD.MONEY.GDP": "Monnaie large",
  // ADB
  "WHV.ADB.GDP.GROWTH":      "Croiss. (ADB)",
  "WHV.ADB.POVERTY.HEADCOUNT": "Pauvreté (ADB)",
  // UNAIDS
  "WHV.UNAIDS.HIV.PREVALENCE.ADULT": "VIH adult.",
  "WHV.UNAIDS.ART.COVERAGE": "Traitem. VIH",
  // CEPAL
  "WHV.CEPAL.POVERTY.RATE":  "Pauvreté",
  "WHV.CEPAL.EXTREME.POVERTY": "Pauvreté ext.",
  // AfDB
  "WHV.AFDB.GDP.GROWTH":     "Croiss. (AfDB)",
  "WHV.AFDB.FDI.GDP":        "IDE (AfDB)",
  // ECB
  "WHV.ECB.HICP.ANNUAL":     "Inflation HICP",
  "WHV.ECB.BOND.YIELD.10Y":  "Rend. oblig. 10Y",
  // UNCTAD
  "WHV.UNCTAD.FDI.INFLOWS":  "IDE entrants",
  // UNESCO UIS
  "WHV.UNESCO.OOS.PRIMARY":  "Hors-école",
  "WHV.UNESCO.LITERACY":     "Alphabétis. (UIS)",
};

// ---------------------------------------------------------------------------
// Descriptions vulgarisées (une ligne simple)
// ---------------------------------------------------------------------------

const INDICATOR_DESC: Record<string, string> = {
  "NY.GDP.MKTP.CD":        "Richesse totale créée par le pays en un an",
  "NY.GDP.PCAP.CD":        "Part de richesse par habitant — proxy du niveau de vie",
  "NY.GDP.MKTP.KD.ZG":     "L'économie accélère-t-elle ou ralentit-elle ?",
  "FP.CPI.TOTL.ZG":        "À quelle vitesse les prix augmentent — pouvoir d'achat",
  "SL.UEM.TOTL.ZS":        "Part de la population active qui cherche du travail sans en trouver",
  "BN.CAB.XOKA.GD.ZS":     "Le pays vend-il plus à l'étranger qu'il n'achète ?",
  "NE.EXP.GNFS.ZS":        "Poids des ventes à l'étranger dans l'économie",
  "NE.IMP.GNFS.ZS":        "Dépendance aux achats à l'étranger",
  "SP.POP.TOTL":            "Taille du marché de consommation et de la main-d'œuvre",
  "SP.DYN.LE00.IN":         "Âge moyen attendu à la naissance — santé globale de la population",
  "SP.DYN.IMRT.IN":         "Décès avant 1 an sur 1 000 naissances — indicateur de santé infantile",
  "SH.XPD.CHEX.GD.ZS":     "Ce que le pays consacre à la santé de ses habitants",
  "SH.MED.PHYS.ZS":         "Accès aux soins : médecins disponibles pour 1 000 personnes",
  "SE.XPD.TOTL.GD.ZS":     "Investissement de l'État dans l'avenir : l'éducation",
  "SI.POV.GINI":             "0 = égalité parfaite • 100 = toute la richesse chez une personne",
  "GC.DOD.TOTL.GD.ZS":     "Cumul de ce que l'État doit rembourser — soutenabilité budgétaire",
  "GC.REV.TOTL.GD.ZS":     "Ce que perçoit l'État — capacité à financer ses services",
  "GC.XPN.TOTL.GD.ZS":     "Ce que dépense l'État pour faire fonctionner le pays",
  "IT.NET.USER.ZS":         "Proportion de la population connectée — modernisation de l'économie",
  "EN.GHG.CO2.PC.CE.AR5":  "Empreinte carbone par habitant (t CO₂e, AR5) — signal de transition énergétique et d'engagement climatique",
  "BX.KLT.DINV.WD.GD.ZS":  "Capitaux étrangers investis dans le pays — attractivité économique",
  "NE.GDI.FTOT.ZS":         "Investissements en équipements et infrastructures",
  "SL.TLF.CACT.ZS":         "Part des adultes qui travaillent ou cherchent activement du travail",
  "WHV.SAFETY.HOMICIDE.RATE.P100K": "Homicides pour 100 000 habitants — sécurité physique",
  "RL.EST":   "Dans quelle mesure lois et contrats sont respectés — justice et sécurité des droits de propriété",
  "CC.EST":   "Dans quelle mesure le pouvoir public est exercé sans détournement ni corruption",
  "GE.EST":   "Qualité de l'administration publique et capacité à mettre en œuvre les politiques",
  "PV.EST":   "Probabilité d'instabilité politique, violences ou terrorisme",
  "VA.EST":   "Liberté d'expression, d'association et de presse — voix des citoyens",
  "RQ.EST":   "Capacité du gouvernement à édicter des régulations favorables au secteur privé",
  "WHV.HDR.HDI.INDEX": "Indice composite : santé + éducation + revenu — développement humain global (0→1)",
  "WHV.HDR.GII.INDEX": "Inégalités de genre : santé reproductive, autonomisation et emploi (0 = égalité, 1 = max. inégalité)",
  "NV.AGR.TOTL.ZS":   "Part de l'agriculture dans la richesse produite — importance du secteur primaire",
  "NV.IND.TOTL.ZS":   "Part de l'industrie dans le PIB — capacité manufacturière et transformation",
  "NV.SRV.TOTL.ZS":   "Part des services dans le PIB — tertiaire et économie de la connaissance",
  "SE.ADT.LITR.ZS":   "Pourcentage d'adultes sachant lire et écrire — capital humain de base",
  "SE.PRM.NENR":       "Enfants scolarisés en primaire — accès à l'éducation fondamentale",
  "SE.SEC.NENR":       "Enfants scolarisés en secondaire — poursuite de la scolarisation",
  "EG.ELC.ACCS.ZS":   "Part de la population ayant accès à l'électricité — infrastructure essentielle",
  "SH.H2O.BASW.ZS":   "Part de la population avec accès à l'eau potable — santé et dignité",
  "SH.STA.BASS.ZS":   "Part de la population avec accès à des sanitaires — santé publique",
  "SP.RUR.TOTL.ZS":   "Part de la population en zone rurale — urbanisation et développement",
  "MS.MIL.XPND.GD.ZS": "Part du PIB consacrée à la défense — priorités budgétaires et sécurité",
  "AG.LND.ARBL.ZS":   "Part des terres utilisables pour l'agriculture — potentiel alimentaire",
  "WHV.BIS.CBPOL.RATE": "Taux directeur de la banque centrale — coût de l'argent dans l'économie",
  "WHV.BIS.CREDIT.PRIVATE.GDP": "Crédit bancaire accordé au secteur privé — profondeur financière",
  "WHV.IFS.RESERVES.XAU.USD": "Réserves de change et or — capacité à défendre la monnaie et honorer les dettes",
  "WHV.IFS.BROAD.MONEY.GDP": "Masse monétaire large (M2/M3) en % du PIB — approfondissement financier",
  "WHV.ADB.GDP.GROWTH": "Croissance économique annuelle selon la Banque africaine de développement",
  "WHV.ADB.POVERTY.HEADCOUNT": "Part de la population sous le seuil de pauvreté selon l'ADB",
  "WHV.UNAIDS.HIV.PREVALENCE.ADULT": "Proportion d'adultes vivant avec le VIH — santé publique critique",
  "WHV.UNAIDS.ART.COVERAGE": "Couverture du traitement antirétroviral — accès aux soins VIH",
  "WHV.CEPAL.POVERTY.RATE": "Taux de pauvreté selon la CEPAL — enjeux sociaux en Amérique latine",
  "WHV.CEPAL.EXTREME.POVERTY": "Taux de pauvreté extrême selon la CEPAL — indigence et exclusion",
  "WHV.AFDB.GDP.GROWTH": "Croissance économique annuelle selon la Banque africaine de développement",
  "WHV.AFDB.FDI.GDP": "Investissements directs étrangers en % du PIB selon l'AfDB",
  // ECB
  "WHV.ECB.HICP.ANNUAL": "Inflation harmonisée (HICP) selon la BCE — référence pour la politique monétaire de la zone euro",
  "WHV.ECB.BOND.YIELD.10Y": "Rendement des obligations souveraines à 10 ans — coût du financement public et prime de risque",
  // UNCTAD
  "WHV.UNCTAD.FDI.INFLOWS": "Flux d'IDE entrants en millions USD selon la CNUCED — attractivité pour les investisseurs étrangers",
  // UNESCO UIS
  "WHV.UNESCO.OOS.PRIMARY": "Enfants en âge de scolarisation primaire non scolarisés — inégalités d'accès à l'éducation (ODD 4)",
  "WHV.UNESCO.LITERACY": "Proportion d'adultes (15+) sachant lire et écrire — capital humain de base selon l'UNESCO",
};

// Noms complets (pour PDF, comparateur, etc.)
const INDICATOR_NAME_FR: Record<string, string> = {
  "NY.GDP.MKTP.CD":        "PIB (USD courants)",
  "NY.GDP.PCAP.CD":        "PIB par habitant (USD courants)",
  "NY.GDP.MKTP.KD.ZG":     "Croissance PIB (% annuel)",
  "FP.CPI.TOTL.ZG":        "Inflation (prix conso, % annuel)",
  "SL.UEM.TOTL.ZS":        "Chômage (% actifs)",
  "BN.CAB.XOKA.GD.ZS":     "Compte courant (% PIB)",
  "SP.POP.TOTL":            "Population totale",
  "SP.DYN.LE00.IN":         "Espérance de vie (ans)",
  "SL.TLF.CACT.ZS":        "Taux d'activité (% pop. 15+)",
  "WHV.PRICE.LEVEL.GDP.OECD100":      "Niveau de prix (OCDE = 100)",
  "WHV.HOUSING.PRICE.REAL.INDEX2015": "Prix immo réels (2015 = 100)",
  "WHV.SAFETY.HOMICIDE.RATE.P100K":   "Taux d'homicide (/ 100 000 hab.)",
  "SI.POV.GINI":            "Indice de Gini (inégalités)",
  "IT.NET.USER.ZS":         "Utilisateurs d'Internet (% pop.)",
  "GC.DOD.TOTL.GD.ZS":     "Dette publique (% PIB)",
  "NE.EXP.GNFS.ZS":        "Exportations (% PIB)",
  "NE.IMP.GNFS.ZS":        "Importations (% PIB)",
  "SH.XPD.CHEX.GD.ZS":     "Dépenses santé (% PIB)",
  "SE.XPD.TOTL.GD.ZS":     "Dépenses éducation (% PIB)",
  "EN.GHG.CO2.PC.CE.AR5":  "Émissions CO₂ (t CO₂e / habitant, AR5)",
  "SP.DYN.IMRT.IN":         "Mortalité infantile (/ 1 000 naissances)",
  "GC.REV.TOTL.GD.ZS":     "Recettes publiques (% PIB)",
  "NE.GDI.FTOT.ZS":         "Formation brute de capital fixe (% PIB)",
  "BX.KLT.DINV.WD.GD.ZS":  "Investissement direct étranger (% PIB)",
  "SH.MED.PHYS.ZS":         "Médecins (pour 1 000 habitants)",
  "GC.XPN.TOTL.GD.ZS":     "Dépenses publiques (% PIB)",
  "RL.EST":               "État de droit (WGI, -2,5 à +2,5)",
  "CC.EST":               "Contrôle de la corruption (WGI, -2,5 à +2,5)",
  "GE.EST":               "Efficacité du gouvernement (WGI, -2,5 à +2,5)",
  "PV.EST":               "Stabilité politique / absence de violence (WGI, -2,5 à +2,5)",
  "VA.EST":               "Voix & responsabilité (WGI, -2,5 à +2,5)",
  "RQ.EST":               "Qualité réglementaire (WGI, -2,5 à +2,5)",
  "WHV.HDR.HDI.INDEX":    "Indice de développement humain (IDH, 0–1)",
  "WHV.HDR.GII.INDEX":    "Indice d'inégalité de genre (GII, 0–1)",
  "NV.AGR.TOTL.ZS":      "Agriculture, valeur ajoutée (% PIB)",
  "NV.IND.TOTL.ZS":      "Industrie, valeur ajoutée (% PIB)",
  "NV.SRV.TOTL.ZS":      "Services, valeur ajoutée (% PIB)",
  "SE.ADT.LITR.ZS":      "Taux d'alphabétisation adultes (% 15+)",
  "SE.PRM.NENR":          "Scolarisation primaire nette (% enfants)",
  "SE.SEC.NENR":          "Scolarisation secondaire nette (% enfants)",
  "EG.ELC.ACCS.ZS":      "Accès à l'électricité (% population)",
  "SH.H2O.BASW.ZS":      "Accès à l'eau potable (% population)",
  "SH.STA.BASS.ZS":      "Accès à l'assainissement (% population)",
  "SP.RUR.TOTL.ZS":      "Population rurale (% total)",
  "MS.MIL.XPND.GD.ZS":  "Dépenses militaires (% PIB)",
  "AG.LND.ARBL.ZS":      "Terres arables (% superficie totale)",
  "WHV.BIS.CBPOL.RATE":  "Taux directeur banque centrale (%, BIS)",
  "WHV.BIS.CREDIT.PRIVATE.GDP": "Crédit secteur privé (% PIB, BIS)",
  "WHV.IFS.RESERVES.XAU.USD": "Réserves de change (M USD, FMI IFS)",
  "WHV.IFS.BROAD.MONEY.GDP": "Monnaie large M2/M3 (% PIB, FMI IFS)",
  "WHV.ADB.GDP.GROWTH":  "Croissance PIB (% annuel, ADB)",
  "WHV.ADB.POVERTY.HEADCOUNT": "Taux de pauvreté (%, ADB)",
  "WHV.UNAIDS.HIV.PREVALENCE.ADULT": "Prévalence VIH adultes (%, ONUSIDA)",
  "WHV.UNAIDS.ART.COVERAGE": "Couverture traitement antirétroviral (%, ONUSIDA)",
  "WHV.CEPAL.POVERTY.RATE": "Taux de pauvreté (%, CEPAL)",
  "WHV.CEPAL.EXTREME.POVERTY": "Pauvreté extrême (%, CEPAL)",
  "WHV.AFDB.GDP.GROWTH": "Croissance PIB (% annuel, AfDB)",
  "WHV.AFDB.FDI.GDP":    "IDE nets (% PIB, AfDB)",
  // ECB
  "WHV.ECB.HICP.ANNUAL":    "Inflation HICP (% annuel, BCE)",
  "WHV.ECB.BOND.YIELD.10Y": "Rendement obligataire souverain 10 ans (%, BCE)",
  // UNCTAD
  "WHV.UNCTAD.FDI.INFLOWS": "IDE entrants (M USD, CNUCED)",
  // UNESCO UIS
  "WHV.UNESCO.OOS.PRIMARY": "Taux hors-école primaire (%, UNESCO UIS)",
  "WHV.UNESCO.LITERACY":    "Taux d'alphabétisation adultes (% 15+, UNESCO UIS)",
};

// ---------------------------------------------------------------------------
// Groupes d'indicateurs par onglet
// ---------------------------------------------------------------------------

const ECONOMY_CODES   = [
  "NY.GDP.MKTP.CD","NY.GDP.PCAP.CD","NY.GDP.MKTP.KD.ZG","FP.CPI.TOTL.ZG","SL.UEM.TOTL.ZS",
  "BN.CAB.XOKA.GD.ZS","NE.EXP.GNFS.ZS","NE.IMP.GNFS.ZS","SP.POP.TOTL",
  "NV.AGR.TOTL.ZS","NV.IND.TOTL.ZS","NV.SRV.TOTL.ZS","AG.LND.ARBL.ZS",
  "WHV.ECB.HICP.ANNUAL",
];
const HEALTH_CODES    = [
  "SP.DYN.LE00.IN","SP.DYN.IMRT.IN","SH.XPD.CHEX.GD.ZS","SH.MED.PHYS.ZS",
  "SE.XPD.TOTL.GD.ZS","SI.POV.GINI","WHV.HDR.HDI.INDEX","WHV.HDR.GII.INDEX",
  "SE.ADT.LITR.ZS","SE.PRM.NENR","SE.SEC.NENR","WHV.UNESCO.OOS.PRIMARY",
  "EG.ELC.ACCS.ZS","SH.H2O.BASW.ZS","SH.STA.BASS.ZS","SP.RUR.TOTL.ZS",
  "WHV.UNAIDS.HIV.PREVALENCE.ADULT","WHV.UNAIDS.ART.COVERAGE",
];
const GOVERNANCE_CODES = [
  "GC.DOD.TOTL.GD.ZS","GC.REV.TOTL.GD.ZS","GC.XPN.TOTL.GD.ZS",
  "IT.NET.USER.ZS","EN.GHG.CO2.PC.CE.AR5","MS.MIL.XPND.GD.ZS",
  "RL.EST","CC.EST","GE.EST","PV.EST","VA.EST","RQ.EST",
  "WHV.IFS.BROAD.MONEY.GDP","WHV.ECB.BOND.YIELD.10Y",
];
const MARKETS_CODES   = [
  "BX.KLT.DINV.WD.GD.ZS","NE.GDI.FTOT.ZS","SL.TLF.CACT.ZS",
  "WHV.BIS.CBPOL.RATE","WHV.BIS.CREDIT.PRIVATE.GDP",
  "WHV.IFS.RESERVES.XAU.USD","WHV.UNCTAD.FDI.INFLOWS",
];
const OVERVIEW_CODES  = ["NY.GDP.PCAP.CD","SP.DYN.LE00.IN","FP.CPI.TOTL.ZG","GC.DOD.TOTL.GD.ZS"];

// ---------------------------------------------------------------------------
// Dictionnaires UI
// ---------------------------------------------------------------------------

const TONE_FR: Record<string, string> = { POSITIVE:"Positif", BALANCED:"Équilibré", WATCH:"Vigilance", STRESS:"Stress", CONTEXT:"Contexte" };
const AGREEMENT_FR: Record<AgreementLevel, string> = { CONSISTENT:"Cohérent", MIXED:"Mixte", DIVERGENT:"Divergent", INSUFFICIENT_DATA:"Insuffisant" };
const CONFIDENCE_FR: Record<string, string> = { HIGH:"Haute", MEDIUM:"Moyenne", LOW:"Faible", INSUFFICIENT_EVIDENCE:"Insuffisant" };
const TREND_ARROW: Record<string, string> = { UP:"↑", DOWN:"↓", FLAT:"→", INSUFFICIENT_DATA:"—" };
const TREND_COLOR: Record<string, string> = { UP:"#9df0c5", DOWN:"#ffb3a0", FLAT:"rgba(33,68,100,0.90)", INSUFFICIENT_DATA:"rgba(48,82,114,0.86)" };

// Noms lisibles des sources (codes catalog → libellé court).
const SOURCE_LABELS: Record<string, string> = {
  WORLD_BANK: "Banque mondiale", IMF: "FMI", EUROSTAT: "Eurostat", OECD: "OCDE",
  ECB: "BCE", BIS: "BRI", UNDP_HDR: "PNUD (HDR)", UNAIDS: "ONUSIDA", UNCTAD: "CNUCED",
  UNESCO_UIS: "UNESCO (UIS)", UNODC: "ONUDC", UNSD_SDG: "ONU (SDG)", WHO_GHO: "OMS",
  VDEM: "V-Dem", ILOSTAT: "OIT (ILOSTAT)", GEONAMES: "GeoNames", OSM: "OpenStreetMap",
  WIKIDATA: "Wikidata", NUMBEO: "Numbeo", ADB_KIDB: "ADB", AFDB: "AfDB", CEPAL: "CEPAL",
};

function sourceLabel(code: string | null | undefined): string {
  if (!code) return "—";
  return SOURCE_LABELS[code] ?? code.replace(/_/g, " ");
}

const TAB_LABELS: Record<DrawerTab,string> = {
 overview:"Résumé",economy:"Économie",health:"Santé",governance:"Finances pub.",
 markets:"Marchés",forecasts:"Projections",safety:"Sécurité",
 compare:"Comparer",fx:"Devises",
};
const TAB_ICONS:Record<DrawerTab,WorldIconName>={
 overview:"layers",economy:"currency",health:"info",governance:"scale",
 markets:"markets",forecasts:"destination",safety:"shield",compare:"regions",fx:"currency",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countryFlag(iso2?: string | null): string {
  if (!iso2 || iso2.length !== 2) return "—";
  const base = 0x1f1e6; const A = 65;
  const u = iso2.toUpperCase();
  return String.fromCodePoint(u.charCodeAt(0) - A + base) + String.fromCodePoint(u.charCodeAt(1) - A + base);
}

function fmtCompact(v: number | null, unit: string): string {
  if (v === null) return "—";
  const abs = Math.abs(v);
  const u = unit.toUpperCase();
  if (u.includes("USD")) {
    if (abs >= 1e12) return `${(v / 1e12).toFixed(2)} T$`;
    if (abs >= 1e9)  return `${(v / 1e9).toFixed(1)} Md$`;
    if (abs >= 1e6)  return `${(v / 1e6).toFixed(1)} M$`;
  }
  if (u === "PERCENT" || u.includes("%")) return `${v.toFixed(1)} %`;
  if (u === "WGI_SCORE") return v.toFixed(2);
  if (u === "INDEX_0_1") return v.toFixed(3);
  if (u === "YEARS") return `${v.toFixed(1)} ans`;
  if (u === "PER_1000" || u === "PER_1000_LIVE_BIRTHS") return `${v.toFixed(1)} / 1 000`;
  if (u === "TONNES_CO2" || u === "T_CO2") return `${v.toFixed(2)} t CO₂`;
  if (u === "USD_MILLIONS") {
    if (abs >= 1e6) return `${(v / 1e6).toFixed(2)} T$`;
    if (abs >= 1e3) return `${(v / 1e3).toFixed(1)} Md$`;
    return `${v.toFixed(0)} M$`;
  }
  if (abs >= 1e12) return `${(v / 1e12).toFixed(2)} T`;
  if (abs >= 1e9)  return `${(v / 1e9).toFixed(1)} Md`;
  if (abs >= 1e6)  return `${(v / 1e6).toFixed(1)} M`;
  return v.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}

function buildCsvBlob(iso3: string, lenses: (CountryEconomicLens | CountryRelativeCostLens)[]): Blob {
  const header = "Pays,Indicateur,Valeur,Unité,Période,Source,Dataset,Ton,Accord,Confiance";
  const rows = lenses.map((l) =>
    [iso3, `"${l.lensDisplayName.replace(/"/g, '""')}"`, l.latestComparableValue ?? "", l.unitLabel,
     l.latestPeriodLabel ?? "", l.selectedSourceCode ?? "", l.selectedDatasetCode ?? "",
     l.signalTone, l.agreementLevel, l.confidenceLevel].join(","),
  );
  return new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
}

// ---------------------------------------------------------------------------
// MetaItem
// ---------------------------------------------------------------------------

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="country-meta-item">
      <span className="country-meta-label">{label}</span>
      <strong className="country-meta-value">{value}</strong>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RankBadge — version complète (dans IndicatorDetailPanel)
// ---------------------------------------------------------------------------

function RankBadge({ iso3, indicatorCode, enabled }: { iso3: string; indicatorCode: string; enabled: boolean }) {
  const { rank, loading } = useIndicatorRank(iso3, indicatorCode, enabled);
  if (!enabled || loading || !rank || rank.worldTotal === 0) return null;
  const worldStr = rank.worldRank ? `#${rank.worldRank} / ${rank.worldTotal}` : `— / ${rank.worldTotal}`;
  const regionStr = rank.regionRank && rank.regionTotal > 0
    ? `#${rank.regionRank} / ${rank.regionTotal}${rank.regionName ? ` · ${rank.regionName}` : ""}`
    : null;
  return (
    <div className="rank-badge-row">
      <span className="rank-badge">Monde : <strong>{worldStr}</strong></span>
      {regionStr && <span className="rank-badge">Région : <strong>{regionStr}</strong></span>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// KpiRankLine — rang compact dans les cartes KPI de l'overview
// Affiche deux pills (monde + région) juste sous la valeur principale.
// Quand plusieurs sources seront agrégées, le rang sera calculé sur la
// valeur consensus — le composant n'a pas à changer.
// ---------------------------------------------------------------------------

function KpiRankLine({ iso3, indicatorCode }: { iso3: string; indicatorCode: string }) {
  const { rank, loading } = useIndicatorRank(iso3, indicatorCode, true);
  if (loading || !rank || rank.worldTotal === 0) return null;
  const worldRankStr = rank.worldRank ? `#${rank.worldRank}` : "—";
  const regionRankStr = rank.regionRank ? `#${rank.regionRank}` : "—";
  const regionLabel = rank.regionName ?? "Région";
  return (
    <div className="kpi-rank-line">
      <span className="kpi-rank-pill">
        <span className="rank-num">{worldRankStr}</span>/{rank.worldTotal} monde
      </span>
      {rank.regionTotal > 0 && (
        <span className="kpi-rank-pill">
          <span className="rank-num">{regionRankStr}</span>/{rank.regionTotal} {regionLabel}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SourceChipsRow — comparaison sources compacte
// ---------------------------------------------------------------------------

function SourceChipsRow({ lens, iso3 }: { lens: CountryEconomicLens | CountryRelativeCostLens; iso3: string }) {
  const { overview, loading } = useIndicatorOverview(iso3, lens.indicatorCode, true);
  if (loading || !overview || overview.sourcePerspectives.length === 0) return null;
  const { divergence, sourcePerspectives } = overview;
  const commonValues = overview.alignedComparisonValues ?? [];
  const hasComparablePeriod = divergence.comparableValueCount >= 2 && commonValues.length >= 2;
  // Never visually label 2025 from one institution and 2024 from another
  // as a same-period comparison. Show the actual aligned evidence instead.
  const displayed = hasComparablePeriod ? commonValues : sourcePerspectives;
  const includesEstimates = commonValues.some((item) => item.valueStatus === "ESTIMATED");
  return (
    <div className="source-chips-row" aria-label="Provenance et comparaison entre organismes">
      {displayed.map((sp) => {
        const status = sp.valueStatus === "ESTIMATED" ? " · estimation" : "";
        const freshness = sourcePerspectives.find((src) => src.sourceCode === sp.sourceCode)?.freshnessLevel ?? "UNKNOWN";
        return (
          <span key={`${sp.sourceCode}-${sp.datasetCode}`} className={`source-chip freshness-${freshness}`}>
            <strong>{sp.sourceCode.replace(/_/g, " ")}</strong>
            {sp.numericValue !== null && <span className="source-chip-value">{fmtCompact(sp.numericValue, lens.unitLabel)}</span>}
            {sp.periodLabel && <span className="source-chip-period">{sp.periodLabel}{status}</span>}
          </span>
        );
      })}
      {hasComparablePeriod ? (
        <span
          className={`source-chip source-chip--agreement agreement-${divergence.agreementLevel}`}
          title="Les valeurs comparées concernent exactement la même période. Les méthodes des organismes peuvent cependant différer."
        >
          {AGREEMENT_FR[divergence.agreementLevel]}
          {" · "}{divergence.latestComparablePeriodLabel}
          {includesEstimates ? " · estimations incluses" : " · mesures"}
          {divergence.rangeRelativeToMedian !== null && ` · écart ${(divergence.rangeRelativeToMedian * 100).toFixed(1)} %`}
        </span>
      ) : (
        <span className="source-chip" title="Pas de comparaison intersources sur une période commune suffisamment documentée.">
          Comparaison non établie
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// IndicatorDetailPanel — panneau détail d'un indicateur unique
// ---------------------------------------------------------------------------

function IndicatorDetailPanel({
  lens, iso3, lang, showForecastDefault = false,
}: {
  lens: CountryEconomicLens | CountryRelativeCostLens;
  iso3: string;
  lang: string;
  showForecastDefault?: boolean;
}) {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showForecast, setShowForecast] = useState(showForecastDefault);
  const { points, loading: histLoading } = useIndicatorHistory(iso3, lens.indicatorCode, true);

  const arrow = TREND_ARROW[lens.trendDirection] ?? "—";
  const trendColor = TREND_COLOR[lens.trendDirection] ?? "rgba(33,68,100,0.90)";
  const desc = INDICATOR_DESC[lens.indicatorCode];

  return (
    <div className="indicator-detail-panel">
      {/* ── Stat héro ── */}
      <div className={`stat-hero tone-${lens.signalTone.toLowerCase()}`}>
        <div className="stat-hero-top">
          <div className="stat-hero-left">
            <span className="stat-hero-value">
              {fmtCompact(lens.latestComparableValue, lens.unitLabel)}
            </span>
            <span className="stat-hero-unit">{lens.unitLabel}</span>
          </div>
          <div className="stat-hero-right">
            <span className={`tone-pill tone-${lens.signalTone.toLowerCase()}`} style={{ fontSize: 11 }}>
              {TONE_FR[lens.signalTone] ?? lens.signalTone}
            </span>
            <span className="stat-hero-trend" style={{ color: trendColor }}>
              {arrow} {lens.latestPeriodLabel ?? ""}
            </span>
          </div>
        </div>
        <div className="stat-hero-bottom">
          <span className="stat-hero-label">
            {INDICATOR_NAME_FR[lens.indicatorCode] ?? lens.lensDisplayName}
          </span>
          {desc && <span className="stat-hero-desc">{desc}</span>}
        </div>
        {/* Attribution source — TOUJOURS visible, dérivée du lens (sans appel API).
            Valeur affichée = médiane des sources comparables ; on indique combien
            de sources et, en source unique, laquelle. Le détail par source est
            listé juste en dessous (SourceChipsRow). */}
        <div className="stat-hero-source" style={{ fontSize: 11, fontWeight: 600, color: "rgba(157,240,197,0.9)", marginTop: 5 }}>
          {lens.latestComparableSourceCount > 1
            ? `Médiane de ${lens.latestComparableSourceCount} sources`
            : `Source : ${sourceLabel(lens.selectedSourceCode)}`}
        </div>
        {/* Rang intégré dans le bloc héro, visible sans scroll */}
        <RankBadge iso3={iso3} indicatorCode={lens.indicatorCode} enabled={true} />
      </div>

      {/* ── Sources comparées ── */}
      <SourceChipsRow lens={lens} iso3={iso3} />

      {/* ── Graphique historique ── */}
      <div className="detail-chart-block">
        <span className="detail-chart-label">{lang === "fr" ? "Tendance historique" : "Historical trend"}</span>
        {histLoading
          ? <div className="chart-empty" style={{ height: 100 }}>Chargement…</div>
          : <TrendChart points={points} unitLabel={lens.unitLabel} height={130} />
        }
      </div>

      {/* ── Bouton projection ── */}
      <button
        type="button"
        className={`forecast-toggle-btn${showForecast ? " active" : ""}`}
        onClick={() => setShowForecast((v) => !v)}
      >
        {showForecast
          ? (lang === "fr" ? "Masquer la projection" : "Hide projection")
          : (lang === "fr" ? "Voir la projection tendancielle" : "Show trend projection")}
      </button>

      {showForecast && (
        <ForecastChart
          iso3={iso3}
          indicatorCode={lens.indicatorCode}
          unitLabel={lens.unitLabel}
          lang={lang}
          enabled={showForecast}
        />
      )}

      {/* ── Analyse (déroulante) ── */}
      {(lens.headline || lens.narrative || lens.whyItMatters) && (
        <div className="analysis-accordion">
          <button
            type="button"
            className="analysis-toggle"
            onClick={() => setShowAnalysis((v) => !v)}
          >
            <span className="analysis-toggle-chevron">{showAnalysis ? "▲" : "▼"}</span>
            {lang === "fr" ? "Voir l'analyse complète" : "Show full analysis"}
          </button>
          {showAnalysis && (
            <div className="analysis-content">
              {lens.headline && (
                <p className="analysis-headline">{lens.headline}</p>
              )}
              {lens.narrative && lens.narrative !== lens.headline && (
                <p className="analysis-narrative">{lens.narrative}</p>
              )}
              {lens.whyItMatters && (
                <p className="analysis-why">
                  <span style={{ opacity: 0.76, marginRight: 4 }}><WorldIcon name="info" size={15}/></span>
                  {lens.whyItMatters}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// IndicatorPillBar — sélecteur pillule horizontal
// ---------------------------------------------------------------------------

function IndicatorPillBar({
  lenses,
  selected,
  onSelect,
}: {
  lenses: (CountryEconomicLens | CountryRelativeCostLens)[];
  selected: string;
  onSelect: (code: string) => void;
}) {
  return (
    <div className="indicator-pill-bar">
      {lenses.map((l) => {
        const short = INDICATOR_SHORT[l.indicatorCode] ?? l.lensDisplayName.slice(0, 14);
        const isActive = l.lensCode === selected;
        return (
          <button
            key={l.lensCode}
            type="button"
            className={`indicator-pill tone-border-${l.signalTone.toLowerCase()}${isActive ? " active" : ""}`}
            onClick={() => onSelect(l.lensCode)}
          >
            {short}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// IndicatorTabView — onglet générique avec pill bar + détail
// ---------------------------------------------------------------------------

function IndicatorTabView({
  lenses, iso3, lang, title, emptyMsg,
}: {
  lenses: (CountryEconomicLens | CountryRelativeCostLens)[];
  iso3: string;
  lang: string;
  title: string;
  emptyMsg: string;
}) {
  const [selectedCode, setSelectedCode] = useState<string>("");

  useEffect(() => {
    if (lenses.length > 0 && (!selectedCode || !lenses.find((l) => l.lensCode === selectedCode))) {
      setSelectedCode(lenses[0].lensCode);
    }
  }, [lenses, selectedCode]);

  const selectedLens = lenses.find((l) => l.lensCode === selectedCode);

  if (lenses.length === 0) {
    return (
      <div className="info-card" style={{ marginTop: 8 }}>
        <p style={{ color: "rgba(40,72,105,0.85)", fontSize: 13, margin: 0 }}>{emptyMsg}</p>
      </div>
    );
  }

  return (
    <div className="indicator-tab-view">
      <p className="tab-section-title">{title}</p>
      <IndicatorPillBar lenses={lenses} selected={selectedCode} onSelect={setSelectedCode} />
      {selectedLens && (
        <IndicatorDetailPanel lens={selectedLens} iso3={iso3} lang={lang} key={selectedCode} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// OverviewTab — 4 KPI hero + highlights + signaux décision
// ---------------------------------------------------------------------------

function OverviewTab({
  allLenses,
  highlights,
  decisionSignals,
  lang,
  onTabChange,
  iso3,
}: {
  allLenses: (CountryEconomicLens | CountryRelativeCostLens)[];
  highlights: string[];
  decisionSignals: RelativeCostDecisionSignal[];
  lang: string;
  onTabChange: (tab: DrawerTab) => void;
  iso3: string;
}) {
  const fr = lang === "fr";

  const kpiLenses = useMemo(() => {
    return OVERVIEW_CODES
      .map((code) => allLenses.find((l) => l.indicatorCode === code))
      .filter((l): l is CountryEconomicLens | CountryRelativeCostLens => l !== undefined);
  }, [allLenses]);

  const tabForCode: Record<string, DrawerTab> = {
    "NY.GDP.PCAP.CD": "economy",
    "SP.DYN.LE00.IN": "health",
    "FP.CPI.TOTL.ZG": "economy",
    "GC.DOD.TOTL.GD.ZS": "governance",
  };

  return (
    <div className="overview-tab">
      {/* KPI Grid */}
      {kpiLenses.length > 0 && (
        <div className="overview-kpi-grid">
          {kpiLenses.map((lens) => {
            const arrow = TREND_ARROW[lens.trendDirection] ?? "—";
            const trendColor = TREND_COLOR[lens.trendDirection] ?? "rgba(33,68,100,0.90)";
            const tab = tabForCode[lens.indicatorCode];
            return (
              <button
                key={lens.lensCode}
                type="button"
                className={`overview-kpi-card tone-${lens.signalTone.toLowerCase()}`}
                onClick={() => tab && onTabChange(tab)}
                title={fr ? "Cliquer pour détails" : "Click for details"}
              >
                <div className="overview-kpi-label">
                  {INDICATOR_SHORT[lens.indicatorCode] ?? lens.lensDisplayName}
                </div>
                <div className="overview-kpi-value">
                  {fmtCompact(lens.latestComparableValue, lens.unitLabel)}
                </div>
                {/* Rang immédiatement sous la valeur pour visibilité maximale */}
                <KpiRankLine iso3={iso3} indicatorCode={lens.indicatorCode} />
                <div className="overview-kpi-desc">
                  {INDICATOR_DESC[lens.indicatorCode] ?? ""}
                </div>
                <div className="overview-kpi-footer">
                  <span className="overview-kpi-trend" style={{ color: trendColor }}>
                    {arrow} {lens.latestPeriodLabel ?? ""}
                  </span>
                  <span className={`tone-pill tone-${lens.signalTone.toLowerCase()}`} style={{ fontSize: 10 }}>
                    {TONE_FR[lens.signalTone] ?? lens.signalTone}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Points clés */}
      {highlights.length > 0 && (
        <div className="overview-highlights">
          <p className="tab-section-title">{fr ? "Points clés" : "Key insights"}</p>
          <ul className="highlight-list">
            {highlights.slice(0, 4).map((h) => <li key={h}>{h}</li>)}
          </ul>
        </div>
      )}

      {/* Signaux décision */}
      {decisionSignals.length > 0 && (
        <div className="overview-signals">
          <p className="tab-section-title">{fr ? "Signaux attractivité & coût" : "Attractiveness signals"}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {decisionSignals.map((sig) => (
              <div key={sig.decisionCode} className={`signal-chip tone-${sig.signalTone.toLowerCase()}`}>
                <div className="signal-chip-top">
                  <span className={`tone-pill tone-${sig.signalTone.toLowerCase()}`} style={{ fontSize: 10 }}>
                    {TONE_FR[sig.signalTone] ?? sig.signalTone}
                  </span>
                  <span className="signal-chip-name">{sig.decisionDisplayName}</span>
                  <span className="signal-chip-conf">{CONFIDENCE_FR[sig.confidenceLevel] ?? sig.confidenceLevel}</span>
                </div>
                <p className="signal-chip-headline">{sig.headline}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raccourcis onglets */}
      <div className="overview-shortcuts">
        <p className="tab-section-title">{fr ? "Explorer en détail" : "Explore in detail"}</p>
        <div className="overview-shortcut-grid">
          {(["economy","health","governance","markets","safety","forecasts"] as DrawerTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`overview-shortcut-btn${tab === "forecasts" ? " btn--forecast" : ""}`}
              onClick={() => onTabChange(tab)}
            >
              <WorldIcon name={TAB_ICONS[tab]} size={15}/> {TAB_LABELS[tab]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ForecastsTab — onglet projections (mis en avant)
// ---------------------------------------------------------------------------

function ForecastsTab({
  allEconomicLenses,
  iso3,
  lang,
}: {
  allEconomicLenses: CountryEconomicLens[];
  iso3: string;
  lang: string;
}) {
  const fr = lang === "fr";
  const [selectedCode, setSelectedCode] = useState<string>("");

  const projectableLenses = useMemo(() => {
    const seen = new Set<string>();
    return allEconomicLenses.filter((l) => {
      if (seen.has(l.indicatorCode)) return false;
      seen.add(l.indicatorCode);
      return true;
    });
  }, [allEconomicLenses]);

  useEffect(() => {
    if (projectableLenses.length > 0 && (!selectedCode || !projectableLenses.find((l) => l.lensCode === selectedCode))) {
      setSelectedCode(projectableLenses[0].lensCode);
    }
  }, [projectableLenses, selectedCode]);

  const selectedLens = projectableLenses.find((l) => l.lensCode === selectedCode);

  return (
    <div className="forecasts-tab">
      {/* En-tête explicatif */}
      <div className="forecasts-tab-header">
        <p className="forecasts-tab-title"><WorldIcon name="markets" size={17}/> {fr ? "Projections tendancielles" : "Trend projections"}</p>
        <p className="forecasts-tab-subtitle">
          {fr
            ? "Basé sur la régression des données historiques. Ces projections supposent que les conditions actuelles restent stables — aucun choc (crise, guerre, pandémie) n'est intégré. Trois niveaux de fiabilité indiqués : ✓ Fiable · ~ Indicatif · ! Spéculatif."
            : "Based on regression of historical data. These projections assume stable current conditions — no major shock is modelled. Three reliability levels: ✓ Reliable · ~ Indicative · ! Speculative."}
        </p>
      </div>

      {projectableLenses.length === 0 ? (
        <div className="info-card">
          <p style={{ color: "rgba(40,72,105,0.85)", fontSize: 13, margin: 0 }}>
            {fr ? "Chargez d'abord les données économiques." : "Load economic data first."}
          </p>
        </div>
      ) : (
        <>
          <IndicatorPillBar lenses={projectableLenses} selected={selectedCode} onSelect={setSelectedCode} />
          {selectedLens && (
            <div className="forecasts-detail">
              <div className="forecasts-current-val">
                <span className="forecasts-val-label">
                  {INDICATOR_NAME_FR[selectedLens.indicatorCode] ?? selectedLens.lensDisplayName}
                </span>
                <span className="forecasts-val-number">
                  {fmtCompact(selectedLens.latestComparableValue, selectedLens.unitLabel)}
                </span>
                <span style={{ fontSize: 11, color: "rgba(44,76,110,0.85)" }}>
                  {selectedLens.latestPeriodLabel ?? ""}
                </span>
              </div>
              <ForecastChart
                iso3={iso3}
                indicatorCode={selectedLens.indicatorCode}
                unitLabel={selectedLens.unitLabel}
                lang={lang}
                enabled={true}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}


// ---------------------------------------------------------------------------
// SafetySection (simplifiée)
// ---------------------------------------------------------------------------

function SafetyTab({
  allLenses, iso3, lang,
}: {
  allLenses: (CountryEconomicLens | CountryRelativeCostLens)[];
  iso3: string;
  lang: string;
}) {
  const fr = lang === "fr";
  const safetyLens = allLenses.find((l) => l.indicatorCode === "WHV.SAFETY.HOMICIDE.RATE.P100K");
  const [selCode, setSelCode] = useState<string>(safetyLens?.lensCode ?? "");
  const proxyLenses = allLenses.filter((l) => ["LABOR_STRESS","PRICE_PRESSURE","EXTERNAL_BALANCE"].includes(l.lensCode));
  const stressCount = proxyLenses.filter((l) => l.signalTone === "STRESS" || l.signalTone === "WATCH").length;
  const risk = proxyLenses.length === 0 ? null : stressCount >= 2 ? "ELEVATED" : stressCount === 1 ? "MODERATE" : "LOW";
  const riskColors: Record<string, string> = { LOW: "#4ade80", MODERATE: "#fbbf24", ELEVATED: "#f87171" };
  const riskLabels: Record<string, string> = { LOW: "Contexte stable", MODERATE: "Vigilance modérée", ELEVATED: "Risque élevé" };

  const lenses = safetyLens ? [safetyLens] : [];

  return (
    <div className="indicator-tab-view">
      {risk && (
        <div className="safety-risk-banner" style={{ borderColor: `${riskColors[risk]}33`, background: `${riskColors[risk]}0d` }}>
          <span style={{ color: riskColors[risk], fontWeight: 700, fontSize: 13 }}>{riskLabels[risk]}</span>
          <span style={{ fontSize: 12, color: "rgba(40,72,105,0.85)", marginLeft: 8 }}>
            {fr ? "basé sur indicateurs macroéconomiques" : "based on macro indicators"}
          </span>
        </div>
      )}
      {proxyLenses.length > 0 && (
        <div className="safety-proxy-row" style={{ marginBottom: 8 }}>
          {proxyLenses.map((l) => (
            <div key={l.lensCode} className="safety-proxy-chip">
              <span className="safety-proxy-name">{l.lensDisplayName}</span>
              <span className={`tone-pill tone-${l.signalTone.toLowerCase()}`} style={{ fontSize: 9 }}>
                {TONE_FR[l.signalTone] ?? l.signalTone}
              </span>
            </div>
          ))}
        </div>
      )}
      {lenses.length > 0 && (
        <>
          <IndicatorPillBar lenses={lenses} selected={selCode} onSelect={setSelCode} />
          {safetyLens && <IndicatorDetailPanel lens={safetyLens} iso3={iso3} lang={lang} key="safety" />}
        </>
      )}
      {lenses.length === 0 && !risk && (
        <div className="info-card">
          <p style={{ color: "rgba(40,72,105,0.85)", fontSize: 13, margin: 0 }}>
            {fr ? "Données de sécurité en cours d'intégration (GPI, UNODC)." : "Safety data integration in progress (GPI, UNODC)."}
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FX History Chart (inchangé)
// ---------------------------------------------------------------------------

const FX_PERIODS = [{ label: "1M", days: 30 }, { label: "3M", days: 90 }, { label: "1A", days: 365 }] as const;
type FxPeriodDays = 30 | 90 | 365;

function calcFxStats(points: { date: string; rate: number }[]) {
  if (points.length < 2) return { pctChange: null, minRate: null, maxRate: null, volatility: null };
  const rates = points.map((p) => p.rate).filter((r) => r > 0);
  if (rates.length < 2) return { pctChange: null, minRate: null, maxRate: null, volatility: null };
  const first = rates[0]; const last = rates[rates.length - 1];
  const pctChange = ((last - first) / first) * 100;
  const minRate = Math.min(...rates); const maxRate = Math.max(...rates);
  const dailyReturns: number[] = [];
  for (let i = 1; i < rates.length; i++) {
    if (rates[i - 1] !== 0) dailyReturns.push((rates[i] - rates[i - 1]) / rates[i - 1]);
  }
  let volatility: number | null = null;
  if (dailyReturns.length > 1) {
    const mean = dailyReturns.reduce((s, r) => s + r, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((s, r) => s + (r - mean) ** 2, 0) / dailyReturns.length;
    volatility = Math.sqrt(variance) * Math.sqrt(252) * 100;
  }
  return { pctChange, minRate, maxRate, volatility };
}

function FxHistoryChart({ base, target }: { base: string; target: string }) {
  const lang = useLang();
  const [periodDays, setPeriodDays] = useState<FxPeriodDays>(30);
  const { points, loading, error } = useFxHistory(base, target, periodDays, base !== target);
  const stats = useMemo(() => calcFxStats(points), [points]);
  const chartPoints = useMemo(() => {
    if (periodDays <= 90 || points.length <= 50) return points;
    const step = Math.ceil(points.length / 50);
    return points.filter((_, i) => i % step === 0 || i === points.length - 1);
  }, [points, periodDays]);
  if (loading) return <div className="chart-empty" style={{ height: 36, fontSize: 12 }}>Chargement historique…</div>;
  if (error || points.length === 0) return null;
  const { pctChange, minRate, maxRate, volatility } = stats;
  const up = (pctChange ?? 0) >= 0;
  const strokeColor = up ? "#4db8ff" : "#ff8c6e";
  const gradId = `fxGrad-${base}-${target}`;
  return (
    <div className="fx-history-block">
      <div className="fx-history-header">
        <span className="fx-history-title">{t(lang, "tendanceHistorique")}</span>
        {pctChange !== null && (
          <span className="fx-history-pct" style={{ color: up ? "#9df0c5" : "#ffb3a0" }}>
            {up ? "+" : ""}{pctChange.toFixed(2)} %
          </span>
        )}
        <div className="fx-period-tabs">
          {FX_PERIODS.map(({ label, days }) => (
            <button key={days} type="button"
              className={`fx-period-btn${periodDays === days ? " active" : ""}`}
              onClick={(e) => { e.stopPropagation(); setPeriodDays(days as FxPeriodDays); }}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={88}>
        <AreaChart data={chartPoints} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.22} />
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" hide />
          <YAxis domain={["auto", "auto"]} hide />
          <RechartsTip
            contentStyle={{ background: "#071a29", border: "1px solid rgba(115,192,242,0.18)", borderRadius: 8, fontSize: 11, padding: "4px 10px" }}
            labelStyle={{ color: "rgba(36,69,99,0.9)" }}
            itemStyle={{ color: strokeColor }}
            formatter={(v) => [typeof v === 'number' ? v.toFixed(4) : '—', `${base}/${target}`]}
          />
          <Area type="monotone" dataKey="rate" stroke={strokeColor} strokeWidth={1.5} fill={`url(#${gradId})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
      <div className="fx-stats-row">
        {minRate !== null && <div className="fx-stat"><span className="fx-stat-label">Min</span><span className="fx-stat-value">{minRate.toFixed(4)}</span></div>}
        {maxRate !== null && <div className="fx-stat"><span className="fx-stat-label">Max</span><span className="fx-stat-value">{maxRate.toFixed(4)}</span></div>}
        {volatility !== null && (
          <div className="fx-stat">
            <span className="fx-stat-label">Volatilité ann.</span>
            <span className="fx-stat-value" style={{ color: volatility > 15 ? "#ffb3a0" : volatility > 8 ? "#fde68a" : "#9df0c5" }}>
              {volatility.toFixed(1)} %
            </span>
          </div>
        )}
        <div className="fx-stat"><span className="fx-stat-label">Actuel</span><span className="fx-stat-value">{points[points.length - 1]?.rate.toFixed(4) ?? "—"}</span></div>
      </div>
    </div>
  );
}

function defaultTarget(base: string): string {
  const b = base.toUpperCase();
  if (b === "USD") return "EUR";
  if (b === "EUR") return "USD";
  if (b === "GBP") return "USD";
  return "USD";
}

function FxConverterSection({ baseCurrency }: { baseCurrency: string }) {
  const lang = useLang();
  const { rates, loading, error, supported } = useFxRates(baseCurrency);
  const effectiveBase = supported ? baseCurrency.toUpperCase() : "USD";
  const [amount, setAmount] = useState("100");
  const [targetCurrency, setTargetCurrency] = useState(() => defaultTarget(baseCurrency));
  useEffect(() => { setTargetCurrency(defaultTarget(effectiveBase)); }, [effectiveBase]);
  const availableCurrencies = rates ? Object.keys(rates.rates).sort() : [];
  const rate = rates?.rates[targetCurrency];
  const convertedAmount = rate !== undefined && !Number.isNaN(parseFloat(amount))
    ? (parseFloat(amount) * rate).toLocaleString("fr-FR", { maximumFractionDigits: 2 }) : "—";
  return (
    <div className="fx-converter">
      <div className="fx-header">
        <span className="section-title">{t(lang, "convertisseurDevises")}</span>
        {!supported && <span className="fx-unsupported-note">{baseCurrency} {t(lang, "baseFallback")}</span>}
      </div>
      {loading && <p style={{ color: "rgba(40,72,105,0.85)", fontSize: 13 }}>Chargement des taux…</p>}
      {error && <p className="drawer-error">{error}</p>}
      {rates && !loading && (
        <>
          <div className="fx-row">
            <input className="fx-amount" type="number" value={amount} min="0"
              onChange={(e) => setAmount(e.target.value)} />
            <span className="fx-currency-badge">{effectiveBase}</span>
            <span className="fx-equals">=</span>
            <span className="fx-result-value">{convertedAmount}</span>
            <select className="fx-currency-select" value={targetCurrency}
              onChange={(e) => setTargetCurrency(e.target.value)}>
              {availableCurrencies.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <p className="fx-rate-info">
            {t(lang, "tauxActuel")} 1 {effectiveBase} = {rate?.toFixed(4) ?? "—"} {targetCurrency}
            {" • "}{t(lang, "sourceData")}{" • "}{rates.date}
          </p>
          <FxHistoryChart base={effectiveBase} target={targetCurrency} />
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ComparatorSection (inchangé)
// ---------------------------------------------------------------------------

function ComparatorSection({
  iso3, economicLenses, countries,
}: {
  iso3: string;
  economicLenses: CountryEconomicLens[];
  countries: CountrySummary[];
}) {
  const lang = useLang();
  const indicatorOptions = useMemo(() => {
    const seen = new Set<string>();
    return economicLenses.filter((l) => seen.has(l.indicatorCode) ? false : (seen.add(l.indicatorCode), true));
  }, [economicLenses]);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);
  const [selectedIso3s, setSelectedIso3s] = useState<string[]>([]);
  const [compMatrix, setCompMatrix] = useState<Map<string, CompareCountriesResponse>>(new Map());
  const [compLoading, setCompLoading] = useState(false);
  const [compError, setCompError] = useState<string | null>(null);
  useEffect(() => {
    if (indicatorOptions.length > 0 && selectedIndicators.length === 0) {
      setSelectedIndicators(indicatorOptions.slice(0, 3).map((l) => l.indicatorCode));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indicatorOptions.length]);
  function toggleIndicator(code: string) {
    setSelectedIndicators((prev) => prev.includes(code) ? prev.filter((c) => c !== code) : prev.length >= 4 ? prev : [...prev, code]);
    setCompMatrix(new Map());
  }
  const availableCountries = useMemo(() => countries.filter((c) => c.iso3 !== iso3), [countries, iso3]);
  const countryNameMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of countries) m[c.iso3] = c.displayName;
    return m;
  }, [countries]);
  async function runComparison() {
    if (selectedIndicators.length === 0) return;
    setCompLoading(true); setCompError(null);
    try {
      const allCountries = [iso3, ...selectedIso3s];
      const results = await Promise.all(selectedIndicators.map((code) => fetchCompareCountries(allCountries, code)));
      const matrix = new Map<string, CompareCountriesResponse>();
      selectedIndicators.forEach((code, i) => matrix.set(code, results[i]));
      setCompMatrix(matrix);
    } catch (err: unknown) {
      setCompError(err instanceof Error ? err.message : "Comparaison échouée");
    } finally { setCompLoading(false); }
  }
  function handleCountrySelect(e: ChangeEvent<HTMLSelectElement>) {
    setSelectedIso3s(Array.from(e.target.selectedOptions).map((o) => o.value).slice(0, 4));
    setCompMatrix(new Map());
  }
  if (indicatorOptions.length === 0) {
    return <div className="info-card"><p>{lang === "fr" ? "Chargez d'abord les données économiques." : "Load economic data first."}</p></div>;
  }
  const comparisonCountries = [iso3, ...selectedIso3s];
  return (
    <div className="fx-converter" style={{ borderColor: "rgba(118,191,240,0.14)" }}>
      <div className="fx-header">
        <span className="section-title">{t(lang, "comparateurPays")}</span>
        <span style={{ fontSize: 11, color: "rgba(48,82,114,0.86)" }}>multi-indicateurs • côte à côte</span>
      </div>
      <div className="comparator-controls">
        <div>
          <label className="comparator-label">{lang === "fr" ? `Indicateurs (${selectedIndicators.length}/4)` : `Indicators (${selectedIndicators.length}/4)`}</label>
          <div className="comparator-indicator-grid">
            {indicatorOptions.map((l) => {
              const active = selectedIndicators.includes(l.indicatorCode);
              const maxReached = !active && selectedIndicators.length >= 4;
              return (
                <button key={l.indicatorCode} type="button"
                  className={`comparator-indicator-chip${active ? " active" : ""}${maxReached ? " disabled" : ""}`}
                  onClick={() => !maxReached && toggleIndicator(l.indicatorCode)}
                  title={l.indicatorDisplayName}>
                  {INDICATOR_SHORT[l.indicatorCode] ?? l.indicatorDisplayName}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="comparator-label" htmlFor="comp-countries">{t(lang, "comparerAvec")}</label>
          <select id="comp-countries" className="comparator-countries-select" multiple
            value={selectedIso3s} onChange={handleCountrySelect}>
            {availableCountries.map((c) => <option key={c.iso3} value={c.iso3}>{c.displayName}</option>)}
          </select>
        </div>
        <button type="button" className="comparator-run-btn" onClick={runComparison}
          disabled={compLoading || selectedIndicators.length === 0}>
          {compLoading ? t(lang, "chargement") : t(lang, "comparer")}
        </button>
      </div>
      {compError && <p className="drawer-error">{compError}</p>}
      {compMatrix.size > 0 && !compLoading && (
        <div className="comparator-matrix">
          <table className="comparator-table">
            <thead>
              <tr>
                <th className="comparator-th comparator-th--country">{lang === "fr" ? "Pays" : "Country"}</th>
                {selectedIndicators.map((code) => {
                  const data = compMatrix.get(code);
                  const name = INDICATOR_SHORT[code] ?? data?.indicator.displayName ?? code;
                  const unit = data?.indicator.unitLabel ?? "";
                  return (
                    <th key={code} className="comparator-th" title={name}>
                      {name.length > 14 ? `${name.slice(0, 12)}…` : name}
                      {unit && <span style={{ display: "block", fontWeight: 400, opacity: 0.6, fontSize: 9 }}>{unit}</span>}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {comparisonCountries.map((ciso3) => (
                <tr key={ciso3} className={`comparator-tr${ciso3 === iso3 ? " comparator-tr--current" : ""}`}>
                  <td className="comparator-td comparator-td--country">
                    {ciso3 === iso3 && <span style={{ color: "#4db8ff", marginRight: 4, fontSize: 10 }}>▶</span>}
                    {countryNameMap[ciso3] ?? ciso3}
                  </td>
                  {selectedIndicators.map((code) => {
                    const data = compMatrix.get(code);
                    const item = data?.items.find((it) => it.countryIso3 === ciso3);
                    const unitLabel = data?.indicator.unitLabel ?? "";
                    return <td key={code} className="comparator-td">{item ? fmtCompact(item.numericValue, unitLabel) : "—"}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CountryDrawer — composant principal
// ---------------------------------------------------------------------------

export default function CountryDrawer({
  open, onClose, selectedCountryIso3, onCountryChange,
  countries, countriesLoading, countriesError,
  watched = false, onToggleWatch,
}: Props) {
  const lang = useLang();
  const fr = lang === "fr";
  const [fullscreen, setFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<DrawerTab>("overview");

  const { countryDetail, economicSnapshot, relativeCostSnapshot, loading, error } =
    useCountrySheet(selectedCountryIso3, open);

  const selectedCountry = useMemo(
    () => countries.find((c) => c.iso3 === selectedCountryIso3) ?? null,
    [countries, selectedCountryIso3],
  );

  useEffect(() => { setActiveTab("overview"); }, [selectedCountryIso3]);

  const flag = countryFlag(countryDetail?.iso2 ?? selectedCountry?.iso2);
  const displayName = countryDetail?.displayName ?? selectedCountry?.displayName ?? selectedCountryIso3;
  const subtitle = [countryDetail?.regionName ?? selectedCountry?.regionName, countryDetail?.worldBankIncomeGroup].filter(Boolean).join(" • ");

  const allEconomicLenses = useMemo(() => economicSnapshot?.lenses ?? [], [economicSnapshot]);
  const allLenses = useMemo(() => [
    ...(economicSnapshot?.lenses ?? []),
    ...(relativeCostSnapshot?.lenses ?? []),
  ], [economicSnapshot?.lenses, relativeCostSnapshot?.lenses]);

  const combinedHighlights = useMemo(() => {
    const all = [...(economicSnapshot?.highlights ?? []), ...(relativeCostSnapshot?.highlights ?? [])];
    return [...new Set(all)].slice(0, 5);
  }, [economicSnapshot?.highlights, relativeCostSnapshot?.highlights]);

  const decisionSignals = relativeCostSnapshot?.decisionSignals ?? [];

  // Filtrer lenses par onglet (dédupliqué par lensCode).
  // On exclut les indicateurs SANS donnée pour CE pays : cela évite les onglets
  // vides ("No historical data") et garantit la cohérence géographique — une
  // source régionale (ECB=Europe, BIS, etc.) n'apparaît que là où elle couvre
  // réellement le pays, jamais comme onglet vide ailleurs.
  function filterLenses(codes: string[]): (CountryEconomicLens | CountryRelativeCostLens)[] {
    const seen = new Set<string>();
    return allLenses.filter((l) => {
      if (!codes.includes(l.indicatorCode)) return false;
      if (l.latestComparableValue === null) return false;
      if (seen.has(l.lensCode)) return false;
      seen.add(l.lensCode);
      return true;
    });
  }

  const economyLenses   = useMemo(() => filterLenses(ECONOMY_CODES),    [allLenses]);
  const healthLenses    = useMemo(() => filterLenses(HEALTH_CODES),     [allLenses]);
  const governanceLenses = useMemo(() => filterLenses(GOVERNANCE_CODES), [allLenses]);
  const marketsLenses   = useMemo(() => filterLenses(MARKETS_CODES),    [allLenses]);

  // CSV export
  function downloadCsv() {
    if (allLenses.length === 0) return;
    const blob = buildCsvBlob(selectedCountryIso3, allLenses);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${selectedCountryIso3}_whv_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  // PDF export
  async function downloadPdf() {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      let y = 15;
      doc.setFontSize(18); doc.setFont("helvetica", "bold"); doc.setTextColor(10, 60, 100);
      doc.text("World Health Vision", 15, y); y += 9;
      doc.setFontSize(14); doc.setTextColor(30, 30, 60);
      doc.text(pdfSafe(`${displayName} — Fiche économique`), 15, y); y += 7;
      doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 120, 140);
      doc.text(pdfSafe(`Généré le ${new Date().toLocaleDateString("fr-FR")} • World Health Vision V2`), 15, y); y += 8;
      doc.setDrawColor(77, 150, 210); doc.setLineWidth(0.4); doc.line(15, y, 195, y); y += 8;
      if (countryDetail) {
        const meta: [string, string][] = [
          ["Capitale", countryDetail.capitalCity ?? "—"],
          ["Devise", countryDetail.currencyCode ? `${countryDetail.currencyCode} ${countryDetail.currencySymbol ?? ""}`.trim() : "—"],
          ["Région", countryDetail.regionName ?? "—"],
          ["Classe de revenu", countryDetail.worldBankIncomeGroup ?? "—"],
        ];
        for (const [label, value] of meta) {
          doc.setFont("helvetica", "bold"); doc.setTextColor(30, 70, 120); doc.text(pdfSafe(`${label} :`), 15, y);
          doc.setFont("helvetica", "normal"); doc.setTextColor(40, 40, 70); doc.text(pdfSafe(value), 68, y); y += 6;
        }
        y += 4;
      }
      if (combinedHighlights.length > 0) {
        doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(10, 60, 100);
        doc.text("Points clés", 15, y); y += 6;
        doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(40, 40, 70);
        for (const h of combinedHighlights) {
          if (y > 270) { doc.addPage(); y = 15; }
          const lines = doc.splitTextToSize(pdfSafe(`• ${h}`), 175) as string[];
          doc.text(lines, 18, y); y += 5.8 * lines.length;
        }
        y += 4;
      }
      if (allEconomicLenses.length > 0) {
        doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(10, 60, 100);
        doc.text("Indicateurs clés", 15, y); y += 6;
        doc.setFont("helvetica", "normal"); doc.setFontSize(10);
        for (const lens of allEconomicLenses.slice(0, 8)) {
          if (y > 270) { doc.addPage(); y = 15; }
          const label = INDICATOR_NAME_FR[lens.indicatorCode] ?? lens.lensDisplayName;
          const value = `${fmtCompact(lens.latestComparableValue, lens.unitLabel)}  ${lens.latestPeriodLabel ?? ""}`;
          doc.setFont("helvetica", "bold"); doc.setTextColor(30, 70, 120); doc.text(pdfSafe(`${label} :`), 18, y);
          doc.setFont("helvetica", "normal"); doc.setTextColor(40, 40, 70); doc.text(pdfSafe(value), 105, y); y += 5.8;
        }
      }
      doc.save(`${selectedCountryIso3}_WHV_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch { /* jsPDF non disponible */ }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <aside className={`country-drawer ${open ? "open" : ""} ${fullscreen ? "fullscreen" : ""}`}>

      {/* ── En-tête ── */}
      <div className="country-drawer-header">
        <div className="country-hero">
          <span className="country-hero-flag" aria-hidden="true">{flag}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="country-drawer-title">{displayName}</h2>
            {subtitle && <p className="country-drawer-subtitle">{subtitle}</p>}
            {(selectedCountry?.capitalCity || selectedCountry?.currencyCode) && (
              <p className="country-drawer-meta-line">
                {selectedCountry.capitalCity && <span><WorldIcon name="building" size={14}/> {selectedCountry.capitalCity}</span>}
                {selectedCountry.capitalCity && selectedCountry.currencyCode && <span className="country-meta-sep">·</span>}
                {selectedCountry.currencyCode && (
                  <span>{selectedCountry.currencyCode}{selectedCountry.currencySymbol ? ` ${selectedCountry.currencySymbol}` : ""}{selectedCountry.currencyName ? ` — ${selectedCountry.currencyName}` : ""}</span>
                )}
              </p>
            )}
          </div>
        </div>
        <div className="country-drawer-actions">
          {onToggleWatch && (
            <button type="button" className={`drawer-btn${watched ? " active" : ""}`}
              title={watched ? "Retirer des favoris" : "Ajouter aux favoris"}
              onClick={onToggleWatch} style={{ fontSize: 16, padding: "5px 10px" }}>
              {watched ? "★" : "☆"}
            </button>
          )}
          <button type="button" className="drawer-btn" title="CSV" disabled={!economicSnapshot} onClick={downloadCsv}>{t(lang, "csv")}</button>
          <button type="button" className="drawer-btn" title="PDF" disabled={!countryDetail} onClick={() => { void downloadPdf(); }}>{t(lang, "pdf")}</button>
          <button type="button" className="drawer-btn" onClick={() => setFullscreen(!fullscreen)}>
            {fullscreen ? t(lang, "maxNrm") : "Max"}
          </button>
          <button type="button" className="drawer-btn close" onClick={onClose}>{t(lang, "fermer")}</button>
        </div>
      </div>

      {/* ── Corps scrollable ── */}
      <div className="country-drawer-body">

        {/* Sélecteur de pays */}
        <div>
          <label className="country-select-label" htmlFor="country-select">
            {countriesLoading ? t(lang, "chargementCatalogue") : `${countries.length} ${t(lang, "paysDisponibles")}`}
          </label>
          <select id="country-select" className="country-select" value={selectedCountryIso3}
            onChange={(e) => onCountryChange(e.target.value)}
            disabled={countriesLoading || countries.length === 0}>
            {countries.map((c) => <option key={c.iso3} value={c.iso3}>{c.displayName} ({c.iso3})</option>)}
          </select>
          {countriesError && <p className="drawer-error">{countriesError}</p>}
        </div>

        {/* Méta pays */}
        {countryDetail && (
          <div className="country-meta-grid">
            <MetaItem label={t(lang, "capitale")} value={countryDetail.capitalCity ?? "—"} />
            <MetaItem label={t(lang, "devise")} value={(() => {
              const code = countryDetail.currencyCode;
              const name = countryDetail.currencyName;
              const sym  = countryDetail.currencySymbol;
              if (!code) return "—";
              // "ETB — Birr éthiopien (Br)"  or  "EUR — Euro (€)"
              const parts: string[] = [code];
              if (name) parts.push(`— ${name}`);
              if (sym && sym !== code) parts.push(`(${sym})`);
              return parts.join(" ");
            })()} />
            <MetaItem label={t(lang, "region")} value={countryDetail.regionName ?? "—"} />
            <MetaItem label={t(lang, "sousRegion")} value={countryDetail.subregionName ?? "—"} />
            <MetaItem label={t(lang, "classeRevenu")} value={countryDetail.worldBankIncomeGroup ?? "—"} />
            <MetaItem label={t(lang, "qualiteDonnees")} value={(() => {
              const tier = countryDetail.dataQualityTier;
              const labels: Record<number, string> = {
                1: "Tier 1 — données riches, multiple sources",
                2: "Tier 2 — couverture partielle",
                3: "Tier 3 — données limitées",
              };
              return labels[tier] ?? `Tier ${tier}`;
            })()} />
          </div>
        )}

        {/* Independent national/local evidence even when no economic observations exist. */}
        <CountryLocalEvidencePanel
          key={selectedCountryIso3}
          iso3={selectedCountryIso3}
          enabled={open && selectedCountryIso3 !== "-99"}
          lang={lang}
        />

        {/* Chargement / erreur */}
        {loading && (
          <div className="info-card">
            <p style={{ color: "rgba(183,220,245,0.72)" }}>{t(lang, "chargementFiche")}</p>
          </div>
        )}
        {selectedCountryIso3 === "-99" && !loading && (
          <div className="info-card">
            <p className="drawer-error" style={{ color: "rgba(251,191,36,0.9)" }}>Territoire non reconnu internationalement</p>
            <p className="drawer-hint">
              Le Somaliland est un territoire dont le statut international est contesté. Il n'est pas
              reconnu comme État souverain par l'ONU ni par la majorité des pays, et ne dispose
              pas de données économiques standardisées dans les bases de données mondiales (Banque
              mondiale, FMI, ONU). Aucune fiche n'est disponible.
            </p>
          </div>
        )}
        {error && selectedCountryIso3 !== "-99" && (
          <div className="info-card">
            <p className="drawer-error">{error}</p>
            <p className="drawer-hint">
              {error.includes("404") || error.includes("Not Found")
                ? "Ce pays n'est pas encore couvert par notre base de données. Les données seront ajoutées progressivement."
                : "Vérifiez que les services catalog (8082), analytics (8000) et gateway (8080) sont démarrés."}
            </p>
          </div>
        )}

        {/* Onglets */}
        {!loading && !error && (economicSnapshot || relativeCostSnapshot) && (
          <>
            {/* Barre d'onglets */}
            <div className="drawer-tab-bar">
              {(Object.keys(TAB_LABELS) as DrawerTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`drawer-tab-btn${tab === "forecasts" ? " drawer-tab-btn--forecast" : ""}${activeTab === tab ? " active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  <WorldIcon name={TAB_ICONS[tab]} size={15}/> {TAB_LABELS[tab]}
                </button>
              ))}
            </div>

            {/* Contenu onglet */}
            <div className="drawer-tab-content">

              {activeTab === "overview" && (
                <OverviewTab
                  allLenses={allLenses}
                  highlights={combinedHighlights}
                  decisionSignals={decisionSignals}
                  lang={lang}
                  onTabChange={setActiveTab}
                  iso3={selectedCountryIso3}
                />
              )}

              {activeTab === "economy" && (
                <IndicatorTabView
                  lenses={economyLenses}
                  iso3={selectedCountryIso3}
                  lang={lang}
                  title={fr ? "Indicateurs macroéconomiques" : "Macroeconomic indicators"}
                  emptyMsg={fr ? "Pas de données économiques disponibles." : "No economic data available."}
                />
              )}

              {activeTab === "health" && (
                <IndicatorTabView
                  lenses={healthLenses}
                  iso3={selectedCountryIso3}
                  lang={lang}
                  title={fr ? "Santé & développement humain" : "Health & human development"}
                  emptyMsg={fr ? "Pas de données santé disponibles." : "No health data available."}
                />
              )}

              {activeTab === "governance" && (
                <IndicatorTabView
                  lenses={governanceLenses}
                  iso3={selectedCountryIso3}
                  lang={lang}
                  title={fr ? "Finances publiques & gouvernance" : "Public finances & governance"}
                  emptyMsg={fr ? "Pas de données de gouvernance disponibles." : "No governance data available."}
                />
              )}

              {activeTab === "markets" && (
                <IndicatorTabView
                  lenses={marketsLenses}
                  iso3={selectedCountryIso3}
                  lang={lang}
                  title={fr ? "Marchés & investissement" : "Markets & investment"}
                  emptyMsg={fr ? "Pas de données disponibles." : "No data available."}
                />
              )}

              {activeTab === "forecasts" && (
                <ForecastsTab
                  allEconomicLenses={allEconomicLenses}
                  iso3={selectedCountryIso3}
                  lang={lang}
                />
              )}

              {activeTab === "safety" && (
                <SafetyTab allLenses={allLenses} iso3={selectedCountryIso3} lang={lang} />
              )}

              {activeTab === "compare" && economicSnapshot && (
                <ComparatorSection
                  iso3={selectedCountryIso3}
                  economicLenses={allEconomicLenses}
                  countries={countries}
                />
              )}

              {activeTab === "fx" && countryDetail?.currencyCode && (
                <FxConverterSection
                  key={`fx-${selectedCountryIso3}-${countryDetail.currencyCode}`}
                  baseCurrency={countryDetail.currencyCode}
                />
              )}
              {activeTab === "fx" && !countryDetail?.currencyCode && (
                <div className="info-card">
                  <p style={{ color: "rgba(40,72,105,0.85)", fontSize: 13, margin: 0 }}>
                    {fr ? "Devise du pays non disponible." : "Country currency not available."}
                  </p>
                </div>
              )}

            </div>
          </>
        )}

        {/* Aucune donnée */}
        {!loading && !error && !economicSnapshot && !countriesLoading && (
          <div className="info-card">
            <p>{t(lang, "aucuneDonnee")}</p>
          </div>
        )}

      </div>
    </aside>
  );
}