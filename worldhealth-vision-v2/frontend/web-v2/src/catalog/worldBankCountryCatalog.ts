/**
 * Atlas fallback. ONLY stable geographic METADATA from an audited, dated,
 * SHA-pinned World Bank Countries API snapshot (see scripts/ generator).
 *
 * Not canonical WHV country coverage and not publishable statistical data.
 * It must never serve as a forged Gateway response or bypass rights checks.
 * Caching happens through the versioned Vite/CDN bundle, not one World Bank
 * API request per visitor. Snapshot country count coincidentally equals the
 * historical 217-country WHV registry; membership is not assumed identical.
 */
import snapshot from "../data/worldBankCountryCatalog.snapshot.json";
import type { CountrySummary } from "../api/types";

export type CountryCatalogSource = "WORLD_BANK_SNAPSHOT" | "WHV_CATALOG";

export interface WorldBankCountryMetadata {
  iso3: string;
  iso2: string;
  displayName: string;
  regionCode: string;
  regionName: string;
  capitalCity: string | null;
  incomeLevelCode: string | null;
  incomeLevelName: string | null;
}

const REGIONS_FR: Readonly<Record<string, string>> = {
  SSF: "Afrique subsaharienne",
  MEA: "Moyen-Orient, Afrique du Nord, Afghanistan et Pakistan",
  ECS: "Europe et Asie centrale",
  EAS: "Asie de l’Est et Pacifique",
  LCN: "Amérique latine et Caraïbes",
  SAS: "Asie du Sud",
  NAC: "Amérique du Nord",
};

export const worldBankCatalogProvenance = {
  asOfUtc: snapshot.fetchedAtUtc,
  sourceUrl: snapshot.sourceUrl,
  termsUrl: snapshot.termsUrl,
  count: snapshot.countryEntryCount,
  upstreamSha256: snapshot.upstreamSha256,
} as const;

const rows: readonly WorldBankCountryMetadata[] = snapshot.items;
const byCode = new Map(rows.map(row => [row.iso3, row]));

if (rows.length !== snapshot.countryEntryCount ||
  byCode.size !== snapshot.countryEntryCount ||
  rows.length < 190 ||
  rows.some(row => row.regionCode === "NA" ||
    !/^[A-Z]{3}$/.test(row.iso3) ||
    !/^[A-Z]{2}$/.test(row.iso2))) {
  throw new Error("World Bank Atlas fallback snapshot integrity failed");
}

export function getWorldBankCountryMetadata(iso3: string): WorldBankCountryMetadata | null {
  return byCode.get(iso3.toUpperCase()) ?? null;
}

/**
 * WB economies/territories are not automatically sovereign states. Preserve
 * source wording for WB codes with politically or geographically special
 * labeling; locale-aware names elsewhere are explicitly transformed display
 * labels, not verbatim World Bank names.
 */
const SOURCE_NAME_ONLY = new Set(["PSE", "XKX", "HKG", "MAC", "TWN", "CHI"]);
export function listWorldBankCatalog(locale: "fr" | "en"): CountrySummary[] {
  const localizer = locale === "fr"
    ? new Intl.DisplayNames(["fr"], { type: "region" }) : null;
  return rows.map(row => {
    const translated = localizer && !SOURCE_NAME_ONLY.has(row.iso3)
      ? localizer.of(row.iso2) : undefined;
    return {
      iso3: row.iso3,
      iso2: row.iso2,
      displayName: translated && translated !== row.iso2 ? translated : row.displayName,
      regionCode: row.regionCode,
      regionName: locale === "fr" ? REGIONS_FR[row.regionCode] ?? row.regionName : row.regionName,
      subregionCode: null,
      subregionName: null,
      currencyCode: null, // World Bank Country API does not provide currency.
      currencyName: null,
      currencySymbol: null,
      capitalCity: row.capitalCity,
      aggregate: false,
      active: true,
    };
  }).sort((a, b) => a.displayName.localeCompare(b.displayName, locale));
}
