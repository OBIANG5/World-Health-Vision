import { useEffect, useState } from "react";
import { fetchWbMultipleLatest } from "../api/worldBankDirectApi";
import type { CountryEconomicLens, SignalTone, SourceAuditView } from "../api/types";

// Tous les codes WB récupérables directement via l'API publique (CORS activé)
export const WB_DIRECT_CODES = [
  "NY.GDP.MKTP.CD",   "NY.GDP.PCAP.CD",   "NY.GDP.MKTP.KD.ZG",
  "FP.CPI.TOTL.ZG",  "SL.UEM.TOTL.ZS",  "BN.CAB.XOKA.GD.ZS",
  "NE.EXP.GNFS.ZS",  "NE.IMP.GNFS.ZS",  "SP.POP.TOTL",
  "SP.DYN.LE00.IN",  "SP.DYN.IMRT.IN",  "SH.XPD.CHEX.GD.ZS",
  "SH.MED.PHYS.ZS",  "SE.XPD.TOTL.GD.ZS", "SI.POV.GINI",
  "GC.DOD.TOTL.GD.ZS","GC.REV.TOTL.GD.ZS","GC.XPN.TOTL.GD.ZS",
  "IT.NET.USER.ZS",  "EN.ATM.CO2E.PC",  "BX.KLT.DINV.WD.GD.ZS",
  "NE.GDI.FTOT.ZS",  "SL.TLF.CACT.ZS",
  "NV.AGR.TOTL.ZS",  "NV.IND.TOTL.ZS",  "NV.SRV.TOTL.ZS",
  "SE.ADT.LITR.ZS",  "SE.PRM.NENR",      "SE.SEC.NENR",
  "EG.ELC.ACCS.ZS",  "SH.H2O.BASW.ZS",  "SH.STA.BASS.ZS",
  "SP.RUR.TOTL.ZS",  "MS.MIL.XPND.GD.ZS","AG.LND.ARBL.ZS",
  // WGI — publiés par la Banque Mondiale, accessibles via la même API
  "RL.EST", "CC.EST", "GE.EST", "PV.EST", "VA.EST", "RQ.EST",
] as const;

export type WbDirectCode = (typeof WB_DIRECT_CODES)[number];

const WB_UNIT_LABELS: Record<string, string> = {
  "NY.GDP.MKTP.CD": "USD",         "NY.GDP.PCAP.CD": "USD",
  "NY.GDP.MKTP.KD.ZG": "PERCENT",  "FP.CPI.TOTL.ZG": "PERCENT",
  "SL.UEM.TOTL.ZS": "PERCENT",     "BN.CAB.XOKA.GD.ZS": "PERCENT",
  "NE.EXP.GNFS.ZS": "PERCENT",     "NE.IMP.GNFS.ZS": "PERCENT",
  "SP.POP.TOTL": "PERSONS",         "SP.DYN.LE00.IN": "YEARS",
  "SP.DYN.IMRT.IN": "PER_1000",    "SH.XPD.CHEX.GD.ZS": "PERCENT",
  "SH.MED.PHYS.ZS": "PER_1000",    "SE.XPD.TOTL.GD.ZS": "PERCENT",
  "SI.POV.GINI": "PERCENT",         "GC.DOD.TOTL.GD.ZS": "PERCENT",
  "GC.REV.TOTL.GD.ZS": "PERCENT",  "GC.XPN.TOTL.GD.ZS": "PERCENT",
  "IT.NET.USER.ZS": "PERCENT",      "EN.ATM.CO2E.PC": "TONNES_CO2",
  "BX.KLT.DINV.WD.GD.ZS": "PERCENT","NE.GDI.FTOT.ZS": "PERCENT",
  "SL.TLF.CACT.ZS": "PERCENT",     "NV.AGR.TOTL.ZS": "PERCENT",
  "NV.IND.TOTL.ZS": "PERCENT",     "NV.SRV.TOTL.ZS": "PERCENT",
  "SE.ADT.LITR.ZS": "PERCENT",     "SE.PRM.NENR": "PERCENT",
  "SE.SEC.NENR": "PERCENT",         "EG.ELC.ACCS.ZS": "PERCENT",
  "SH.H2O.BASW.ZS": "PERCENT",     "SH.STA.BASS.ZS": "PERCENT",
  "SP.RUR.TOTL.ZS": "PERCENT",     "MS.MIL.XPND.GD.ZS": "PERCENT",
  "AG.LND.ARBL.ZS": "PERCENT",
  "RL.EST": "WGI_SCORE", "CC.EST": "WGI_SCORE", "GE.EST": "WGI_SCORE",
  "PV.EST": "WGI_SCORE", "VA.EST": "WGI_SCORE", "RQ.EST": "WGI_SCORE",
};

const WGI_CODES = new Set(["RL.EST", "CC.EST", "GE.EST", "PV.EST", "VA.EST", "RQ.EST"]);
const ACCESS_CODES = new Set(["EG.ELC.ACCS.ZS", "SH.H2O.BASW.ZS", "SH.STA.BASS.ZS"]);

function computeTone(code: string, value: number): SignalTone {
  if (code === "NY.GDP.MKTP.KD.ZG")
    return value >= 4 ? "POSITIVE" : value >= 1 ? "BALANCED" : value >= -1 ? "WATCH" : "STRESS";
  if (code === "FP.CPI.TOTL.ZG")
    return value <= 3 ? "POSITIVE" : value <= 7 ? "BALANCED" : value <= 15 ? "WATCH" : "STRESS";
  if (code === "SL.UEM.TOTL.ZS")
    return value <= 5 ? "POSITIVE" : value <= 10 ? "BALANCED" : value <= 15 ? "WATCH" : "STRESS";
  if (code === "GC.DOD.TOTL.GD.ZS")
    return value <= 40 ? "POSITIVE" : value <= 60 ? "BALANCED" : value <= 90 ? "WATCH" : "STRESS";
  if (WGI_CODES.has(code))
    return value >= 0.5 ? "POSITIVE" : value >= -0.5 ? "BALANCED" : "WATCH";
  if (code === "SP.DYN.LE00.IN")
    return value >= 75 ? "POSITIVE" : value >= 65 ? "BALANCED" : "WATCH";
  if (code === "SP.DYN.IMRT.IN")
    return value <= 10 ? "POSITIVE" : value <= 30 ? "BALANCED" : value <= 60 ? "WATCH" : "STRESS";
  if (ACCESS_CODES.has(code))
    return value >= 90 ? "POSITIVE" : value >= 70 ? "BALANCED" : value >= 40 ? "WATCH" : "STRESS";
  if (code === "SE.ADT.LITR.ZS" || code === "SE.PRM.NENR" || code === "SE.SEC.NENR")
    return value >= 95 ? "POSITIVE" : value >= 80 ? "BALANCED" : value >= 60 ? "WATCH" : "STRESS";
  return "CONTEXT";
}

export function buildWbLens(
  iso3: string,
  code: string,
  value: number,
  year: string,
): CountryEconomicLens {
  const unitLabel = WB_UNIT_LABELS[code] ?? "UNKNOWN";
  const tone = computeTone(code, value);
  const currentYear = new Date().getFullYear();
  const freshness = parseInt(year) >= currentYear - 3 ? "FRESH" : "AGING";

  const sourceAudit: SourceAuditView = {
    scopeType: "COUNTRY",
    scopeCode: iso3,
    scopeDisplayName: iso3,
    indicatorCode: code,
    indicatorDisplayName: code,
    confidenceLevel: "MEDIUM",
    freshnessLevel: freshness,
    agreementLevel: "INSUFFICIENT_DATA",
    primarySourceCode: "WORLD_BANK",
    primarySourceDisplayName: "Banque Mondiale",
    comparableSourceCount: 1,
    evidence: [],
  };

  return {
    lensCode: code,
    lensDisplayName: code,
    signalTone: tone,
    headline: `Données ${year} — Banque Mondiale (API directe)`,
    narrative: "",
    whyItMatters: "",
    indicatorCode: code,
    indicatorDisplayName: code,
    unitLabel,
    latestComparableValue: value,
    latestComparableSourceCount: 1,
    latestPeriodLabel: year,
    trendDirection: "INSUFFICIENT_DATA",
    selectedSourceCode: "WORLD_BANK",
    selectedDatasetCode: "WB_PUBLIC_DATA",
    agreementLevel: "INSUFFICIENT_DATA",
    confidenceLevel: "MEDIUM",
    freshnessLevel: freshness,
    sourceAudit,
  };
}

// Cache mémoire : évite de refaire les 40 appels API si on revient sur le même pays
const wbCache = new Map<
  string,
  { data: Record<string, { value: number; year: string }>; fetchedAt: number }
>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export function useWorldBankLenses(iso3: string, enabled: boolean) {
  const [wbData, setWbData] = useState<Record<string, { value: number; year: string }>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !iso3 || iso3 === "-99") {
      setWbData({});
      return;
    }

    // Résultat déjà en cache et frais
    const cached = wbCache.get(iso3);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      setWbData(cached.data);
      return;
    }

    let active = true;
    setLoading(true);

    fetchWbMultipleLatest(iso3, WB_DIRECT_CODES).then((results) => {
      if (!active) return;
      wbCache.set(iso3, { data: results, fetchedAt: Date.now() });
      setWbData(results);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [iso3, enabled]);

  return { wbData, loading };
}