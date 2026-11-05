// WorldHealthVision V2 — fxApi
// Client Frankfurter + parités fixes (CFA, Gulf, etc.)
// Proxié via Vite (/fx-api → https://api.frankfurter.dev/v1)
const FX_BASE = "/fx-api";

export const FX_SUPPORTED_CURRENCIES = new Set([
  "AUD","BRL","CAD","CHF","CNY","CZK","DKK","EUR","GBP",
  "HKD","HUF","IDR","ILS","INR","ISK","JPY","KRW","MXN",
  "MYR","NOK","NZD","PHP","PLN","RON","SEK","SGD","THB",
  "TRY","USD","ZAR",
]);

// Parités fixes légales — taux garantis par traité ou loi.
// Sources: BRI, FMI, banques centrales respectives.
export interface FixedPeg {
  anchor: "EUR" | "USD";
  rate: number;   // unités de la devise pour 1 ancre
  since: string;  // année d'ancrage
  zone?: string;
}

export const FIXED_PEGS: Record<string, FixedPeg> = {
  XOF: { anchor: "EUR", rate: 655.957, since: "1999", zone: "UEMOA" },
  XAF: { anchor: "EUR", rate: 655.957, since: "1999", zone: "CEMAC" },
  CVE: { anchor: "EUR", rate: 110.265, since: "1999", zone: "Cap-Vert" },
  KMF: { anchor: "EUR", rate: 491.968, since: "1999", zone: "Comores" },
  DJF: { anchor: "USD", rate: 177.721, since: "1973", zone: "Djibouti" },
  XCD: { anchor: "USD", rate: 2.700,   since: "1976", zone: "Caraïbes orientales" },
  BBD: { anchor: "USD", rate: 2.000,   since: "1975", zone: "Barbade" },
  SAR: { anchor: "USD", rate: 3.750,   since: "1986", zone: "Arabie saoudite" },
  AED: { anchor: "USD", rate: 3.672,   since: "1973", zone: "Émirats arabes unis" },
  QAR: { anchor: "USD", rate: 3.641,   since: "2001", zone: "Qatar" },
  BHD: { anchor: "USD", rate: 0.376,   since: "1965", zone: "Bahreïn" },
  JOD: { anchor: "USD", rate: 0.709,   since: "1995", zone: "Jordanie" },
  OMR: { anchor: "USD", rate: 0.385,   since: "1986", zone: "Oman" },
  KWD: { anchor: "USD", rate: 0.308,   since: "2003", zone: "Koweït" },
};

export type CurrencyType = "floating" | "managed" | "fixed";

export interface CurrencyMeta {
  name: string;
  nameFr: string;
  type: CurrencyType;
  zone?: string;
  anchor?: string;
  countries?: string[];
}

export const CURRENCY_META: Record<string, CurrencyMeta> = {
  EUR: { name: "Euro", nameFr: "Euro", type: "floating", zone: "Zone euro (20 pays)" },
  USD: { name: "US Dollar", nameFr: "Dollar américain", type: "floating" },
  GBP: { name: "Pound Sterling", nameFr: "Livre sterling", type: "floating" },
  CHF: { name: "Swiss Franc", nameFr: "Franc suisse", type: "managed" },
  JPY: { name: "Japanese Yen", nameFr: "Yen japonais", type: "managed" },
  CNY: { name: "Chinese Yuan", nameFr: "Yuan renminbi", type: "managed" },
  CAD: { name: "Canadian Dollar", nameFr: "Dollar canadien", type: "floating" },
  AUD: { name: "Australian Dollar", nameFr: "Dollar australien", type: "floating" },
  NZD: { name: "New Zealand Dollar", nameFr: "Dollar néo-zélandais", type: "floating" },
  HKD: { name: "Hong Kong Dollar", nameFr: "Dollar de Hong Kong", type: "managed" },
  SGD: { name: "Singapore Dollar", nameFr: "Dollar de Singapour", type: "managed" },
  INR: { name: "Indian Rupee", nameFr: "Roupie indienne", type: "managed" },
  KRW: { name: "South Korean Won", nameFr: "Won sud-coréen", type: "managed" },
  BRL: { name: "Brazilian Real", nameFr: "Real brésilien", type: "floating" },
  MXN: { name: "Mexican Peso", nameFr: "Peso mexicain", type: "floating" },
  ZAR: { name: "South African Rand", nameFr: "Rand sud-africain", type: "floating" },
  TRY: { name: "Turkish Lira", nameFr: "Livre turque", type: "floating" },
  PLN: { name: "Polish Zloty", nameFr: "Zloty polonais", type: "floating" },
  HUF: { name: "Hungarian Forint", nameFr: "Forint hongrois", type: "managed" },
  CZK: { name: "Czech Koruna", nameFr: "Couronne tchèque", type: "managed" },
  SEK: { name: "Swedish Krona", nameFr: "Couronne suédoise", type: "floating" },
  NOK: { name: "Norwegian Krone", nameFr: "Couronne norvégienne", type: "floating" },
  DKK: { name: "Danish Krone", nameFr: "Couronne danoise", type: "managed" },
  RON: { name: "Romanian Leu", nameFr: "Leu roumain", type: "managed" },
  PHP: { name: "Philippine Peso", nameFr: "Peso philippin", type: "floating" },
  IDR: { name: "Indonesian Rupiah", nameFr: "Roupie indonésienne", type: "managed" },
  MYR: { name: "Malaysian Ringgit", nameFr: "Ringgit malaisien", type: "managed" },
  THB: { name: "Thai Baht", nameFr: "Baht thaïlandais", type: "managed" },
  ILS: { name: "Israeli Shekel", nameFr: "Shekel israélien", type: "floating" },
  ISK: { name: "Icelandic Krona", nameFr: "Couronne islandaise", type: "floating" },
  // Afrique — parités fixes
  XOF: { name: "CFA Franc BCEAO", nameFr: "Franc CFA (UEMOA)", type: "fixed", anchor: "EUR",
         zone: "UEMOA", countries: ["SEN","CIV","MLI","BFA","NER","BEN","TGO","GNB"] },
  XAF: { name: "CFA Franc BEAC", nameFr: "Franc CFA (CEMAC)", type: "fixed", anchor: "EUR",
         zone: "CEMAC", countries: ["CMR","CAF","COG","GAB","GNQ","TCD"] },
  CVE: { name: "Cape Verdean Escudo", nameFr: "Escudo cap-verdien", type: "fixed", anchor: "EUR" },
  KMF: { name: "Comorian Franc", nameFr: "Franc comorien", type: "fixed", anchor: "EUR" },
  DJF: { name: "Djiboutian Franc", nameFr: "Franc djiboutien", type: "fixed", anchor: "USD" },
  // Golfe — parités fixes USD
  SAR: { name: "Saudi Riyal", nameFr: "Riyal saoudien", type: "fixed", anchor: "USD" },
  AED: { name: "UAE Dirham", nameFr: "Dirham des EAU", type: "fixed", anchor: "USD" },
  QAR: { name: "Qatari Riyal", nameFr: "Riyal qatari", type: "fixed", anchor: "USD" },
  BHD: { name: "Bahraini Dinar", nameFr: "Dinar bahreïni", type: "fixed", anchor: "USD" },
  JOD: { name: "Jordanian Dinar", nameFr: "Dinar jordanien", type: "fixed", anchor: "USD" },
  OMR: { name: "Omani Rial", nameFr: "Rial omanais", type: "fixed", anchor: "USD" },
  KWD: { name: "Kuwaiti Dinar", nameFr: "Dinar koweïtien", type: "fixed", anchor: "USD" },
  XCD: { name: "East Caribbean Dollar", nameFr: "Dollar des Caraïbes orientales", type: "fixed", anchor: "USD" },
  BBD: { name: "Barbadian Dollar", nameFr: "Dollar barbadien", type: "fixed", anchor: "USD" },
};

// Toutes les devises que le panel peut afficher, organisées par groupe (sans doublons)
export const CURRENCY_GROUPS: { label: string; labelFr: string; codes: string[] }[] = [
  {
    label: "Major currencies", labelFr: "Devises majeures",
    codes: ["EUR","USD","GBP","JPY","CNY"],
  },
  {
    label: "Europe", labelFr: "Europe",
    codes: ["CHF","SEK","NOK","DKK","PLN","HUF","CZK","RON","TRY","ISK"],
  },
  {
    label: "Africa & CFA Zone", labelFr: "Afrique & Zone CFA",
    codes: ["XOF","XAF","ZAR","CVE","KMF","DJF"],
  },
  {
    label: "Americas", labelFr: "Amériques",
    codes: ["CAD","AUD","NZD","BRL","MXN","XCD","BBD"],
  },
  {
    label: "Asia-Pacific", labelFr: "Asie-Pacifique",
    codes: ["HKD","SGD","INR","KRW","IDR","MYR","THB","PHP"],
  },
  {
    label: "Middle East", labelFr: "Moyen-Orient",
    codes: ["SAR","AED","QAR","BHD","JOD","OMR","KWD","ILS"],
  },
];

// Calcule le taux base→target en passant par EUR.
// eurRates: résultat Frankfurter avec base=EUR (EUR→XXX)
// Retourne null si impossible à calculer.
export function computeRate(
  base: string,
  target: string,
  eurRates: Record<string, number>,
): number | null {
  if (base === target) return 1;

  const eurToUsd = eurRates["USD"]; // requis uniquement pour les devises ancrées au USD

  // base → EUR (EUR/USD requis seulement si la devise est ancrée à USD)
  function toEur(code: string): number | null {
    if (code === "EUR") return 1;
    const peg = FIXED_PEGS[code];
    if (peg) {
      if (peg.anchor === "EUR") return 1 / peg.rate;
      if (peg.anchor === "USD") return eurToUsd ? (1 / peg.rate) / eurToUsd : null;
    }
    const r = eurRates[code];
    return r ? 1 / r : null;
  }

  // EUR → target (EUR/USD requis seulement si la devise est ancrée à USD)
  function fromEur(code: string): number | null {
    if (code === "EUR") return 1;
    const peg = FIXED_PEGS[code];
    if (peg) {
      if (peg.anchor === "EUR") return peg.rate;
      if (peg.anchor === "USD") return eurToUsd ? eurToUsd * peg.rate : null;
    }
    return eurRates[code] ?? null;
  }

  const b2e = toEur(base);
  if (b2e === null) return null;

  const e2t = fromEur(target);
  if (e2t === null) return null;

  return b2e * e2t;
}

export interface FxRatesResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

export interface FxCurrencyList {
  [code: string]: string;
}

export async function fetchFxRates(base: string): Promise<FxRatesResponse> {
  const effectiveBase = FX_SUPPORTED_CURRENCIES.has(base.toUpperCase()) ? base.toUpperCase() : "USD";
  const res = await fetch(`${FX_BASE}/latest?base=${effectiveBase}`);
  if (!res.ok) throw new Error("Taux de change indisponibles");
  return res.json() as Promise<FxRatesResponse>;
}

export async function fetchFxCurrencies(): Promise<FxCurrencyList> {
  const res = await fetch(`${FX_BASE}/currencies`);
  if (!res.ok) throw new Error("Liste des devises indisponible");
  return res.json() as Promise<FxCurrencyList>;
}

export interface FxHistoryResponse {
  amount: number;
  base: string;
  start_date: string;
  end_date: string;
  rates: Record<string, Record<string, number>>;
}

export interface FxHistoryPoint { date: string; rate: number }

export async function fetchFxHistory(base: string, target: string, days = 30): Promise<FxHistoryPoint[]> {
  const end = new Date().toISOString().slice(0, 10);
  const start = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  const res = await fetch(`${FX_BASE}/${start}..${end}?base=${base}&symbols=${target}`);
  if (!res.ok) throw new Error("Historique FX indisponible");
  const data = await res.json() as FxHistoryResponse;
  return Object.entries(data.rates)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, rateMap]) => ({ date, rate: rateMap[target] ?? 0 }));
}