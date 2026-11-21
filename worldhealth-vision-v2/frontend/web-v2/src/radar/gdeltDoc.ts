/**
 * GLOBAL RADAR R1 — cross-product, source-led discovery boundary.
 *
 * Official provider: GDELT DOC 2.0, mode=ArtList, format=json.
 * The returned documents are CANDIDATE LINKS, never verified events,
 * independent journalistic confirmation, full-text, market signals or
 * publication entitlements. No third-party article bodies are downloaded.
 *
 * This module is intentionally UI-independent so Atlas, News, BRVM, Trading
 * and Watch can consume one normalized, conservative contract in later PRs.
 */
export const GDELT_DOC_ENDPOINT = "https://api.gdeltproject.org/api/v2/doc/doc";
export const GDELT_PROVIDER_PAGE = "https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/";
export const RADAR_MAX_ARTICLES = 40;
export const RADAR_MAX_BYTES = 1_000_000;
export const RADAR_CLIENT_MIN_INTERVAL_MS = 6_000;
export const RADAR_FETCH_TIMEOUT_MS = 12_000;
export const RADAR_STATUS = "DISCOVERY_ONLY" as const;

export type RadarTimeWindow = "1d" | "3d" | "7d";
export type RadarSourceCountry =
  | "" | "gabon" | "congo" | "democraticrepublicofcongo" | "cameroon"
  | "cotedivoire" | "senegal" | "nigeria" | "ghana" | "kenya"
  | "southafrica" | "morocco" | "egypt" | "ethiopia" | "rwanda"
  | "france" | "germany" | "unitedkingdom" | "unitedstates"
  | "canada" | "brazil" | "mexico" | "india" | "china"
  | "japan" | "australia" | "newzealand";
export const SOURCE_COUNTRIES: readonly { value: RadarSourceCountry; fr: string; en: string }[] = [
  { value: "", fr: "Toutes origines indexées", en: "All indexed outlet origins" },
  { value: "gabon", fr: "Gabon", en: "Gabon" },
  { value: "congo", fr: "Congo (Brazzaville)", en: "Congo (Brazzaville)" },
  { value: "democraticrepublicofcongo", fr: "RD Congo", en: "DR Congo" },
  { value: "cameroon", fr: "Cameroun", en: "Cameroon" },
  { value: "cotedivoire", fr: "Côte d'Ivoire", en: "Côte d'Ivoire" },
  { value: "senegal", fr: "Sénégal", en: "Senegal" },
  { value: "nigeria", fr: "Nigeria", en: "Nigeria" },
  { value: "ghana", fr: "Ghana", en: "Ghana" },
  { value: "kenya", fr: "Kenya", en: "Kenya" },
  { value: "southafrica", fr: "Afrique du Sud", en: "South Africa" },
  { value: "morocco", fr: "Maroc", en: "Morocco" },
  { value: "egypt", fr: "Égypte", en: "Egypt" },
  { value: "ethiopia", fr: "Éthiopie", en: "Ethiopia" },
  { value: "rwanda", fr: "Rwanda", en: "Rwanda" },
  { value: "france", fr: "France", en: "France" },
  { value: "germany", fr: "Allemagne", en: "Germany" },
  { value: "unitedkingdom", fr: "Royaume-Uni", en: "United Kingdom" },
  { value: "unitedstates", fr: "États-Unis", en: "United States" },
  { value: "canada", fr: "Canada", en: "Canada" },
  { value: "brazil", fr: "Brésil", en: "Brazil" },
  { value: "mexico", fr: "Mexique", en: "Mexico" },
  { value: "india", fr: "Inde", en: "India" },
  { value: "china", fr: "Chine", en: "China" },
  { value: "japan", fr: "Japon", en: "Japan" },
  { value: "australia", fr: "Australie", en: "Australia" },
  { value: "newzealand", fr: "Nouvelle-Zélande", en: "New Zealand" },
] as const;

export interface RadarSearch {
  /** Plain topic only. Operators and queries from other applications not accepted. */
  subject: string;
  outletCountry: RadarSourceCountry;
  window: RadarTimeWindow;
}
export interface RadarCandidate {
  /** Canonical URL key used ONLY for a conservative same-link duplicate check. */
  id: string;
  originalUrl: string;
  title: string;
  /** GDELT-reported source domain. This is NOT verified original ownership. */
  outletDomain: string;
  /** GDELT-reported country of the OUTLET, not the country an event happened in. */
  outletCountry: string | null;
  /** GDELT-reported source language, not a verified translation. */
  language: string | null;
  /** GDELT's seendate. NOT a verified publisher release time. */
  gdeltSeenAt: string | null;
  /** Browser time when this GDELT response was received. NOT source publication time. */
  retrievedAt: string;
  provenance: "GDELT_DOC_2_ARTLIST";
  reviewStatus: typeof RADAR_STATUS;
}
export interface RadarResult {
  provider: "GDELT_DOC_2_ARTLIST";
  query: RadarSearch;
  retrievedAt: string;
  /** Number of rows examined, NOT total mentions or total global coverage. */
  rowsExamined: number;
  duplicatesDropped: number;
  malformedDropped: number;
  candidates: RadarCandidate[];
}

const ALLOWED_WINDOWS: readonly RadarTimeWindow[] = ["1d", "3d", "7d"];
const RESERVED = /[\\:{}()[\]"*+<>]|\b(?:OR|AND|NEAR|REPEAT)\b|\b(?:sourcecountry|sourcelang|domain|theme|imagetag|tone):/i;
export function validRadarSearch(search: unknown): search is RadarSearch {
  if (!search || typeof search !== "object") return false;
  const s = search as Partial<RadarSearch>;
  const subject = s.subject?.trim();
  return typeof subject === "string" && subject.length >= 3 && subject.length <= 90 &&
    /^[\p{L}\p{N}\p{M}\s'’.,-]+$/u.test(subject) && !RESERVED.test(subject) &&
    ALLOWED_WINDOWS.includes(s.window as RadarTimeWindow) &&
    SOURCE_COUNTRIES.some((item) => item.value === s.outletCountry);
}
export function buildRadarUrl(search: RadarSearch): string {
  if (!validRadarSearch(search)) throw new Error("INVALID_RADAR_QUERY");
  const request = new URL(GDELT_DOC_ENDPOINT);
  const query = search.subject.trim().replace(/\s+/g, " ") +
    (search.outletCountry ? " sourcecountry:" + search.outletCountry : "");
  request.searchParams.set("query", query);
  request.searchParams.set("mode", "artlist");
  request.searchParams.set("format", "json");
  request.searchParams.set("sort", "datedesc");
  request.searchParams.set("maxrecords", String(RADAR_MAX_ARTICLES));
  request.searchParams.set("timespan", search.window);
  return request.toString();
}
function printable(raw: unknown, max: number): string | null {
  if (typeof raw !== "string") return null;
  const text = raw.replace(/[\u0000-\u001f\u007f-\u009f]/g, " ").trim();
  return text.length > 0 && text.length <= max ? text : null;
}
function privateOrUnsafeHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") ||
      host.endsWith(".internal") || host.endsWith(".test") || host.endsWith(".invalid")) return true;
  if (host.includes(":")) return true; // disallow IP-literal IPv6 links entirely
  if (/^\d+(?:\.\d+){3}$/.test(host)) {
    const parts = host.split(".").map(Number);
    return parts[0] === 0 || parts[0] === 10 || parts[0] === 127 ||
      parts[0] >= 224 || (parts[0] === 169 && parts[1] === 254) ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168);
  }
  return !host.includes(".") || host.length > 253;
}
/** Follow original article links only after an explicit user click. Never crawl. */
export function safeArticleUrl(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length > 1800) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password ||
        privateOrUnsafeHostname(url.hostname)) return null;
    return url.toString();
  } catch { return null; }
}
/** Deduplicate only the same article URL (with safe tracking keys removed). */
export function canonicalArticleKey(value: string): string {
  const url = new URL(value);
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_[a-z0-9_]+|fbclid|gclid|mc_cid|mc_eid)$/i.test(key)) url.searchParams.delete(key);
  }
  url.hostname = url.hostname.toLowerCase();
  return url.toString();
}
function seenDate(raw: unknown): string | null {
  if (typeof raw !== "string" || !/^\d{8}T\d{6}Z$/.test(raw)) return null;
  const time = raw.slice(0, 4) + "-" + raw.slice(4, 6) + "-" + raw.slice(6, 8) +
    "T" + raw.slice(9, 11) + ":" + raw.slice(11, 13) + ":" + raw.slice(13, 15) + ".000Z";
  const date = new Date(time);
  return Number.isFinite(date.getTime()) && date.toISOString() === time ? time : null;
}
export function normalizeGdeltDoc(
  payload: unknown, search: RadarSearch, retrievedAt: string,
): RadarResult {
  if (!validRadarSearch(search) || Number.isNaN(Date.parse(retrievedAt))) {
    throw new Error("INVALID_RADAR_CONTEXT");
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("INVALID_GDELT_SCHEMA");
  }
  const rows = (payload as { articles?: unknown }).articles;
  if (!Array.isArray(rows) || rows.length > 250) throw new Error("INVALID_GDELT_SCHEMA");
  const candidates: RadarCandidate[] = [];
  const unique = new Set<string>();
  let duplicatesDropped = 0, malformedDropped = 0;
  for (const row of rows.slice(0, RADAR_MAX_ARTICLES)) {
    const obj = row && typeof row === "object" ? row as Record<string, unknown> : {};
    const originalUrl = safeArticleUrl(obj.url);
    const title = printable(obj.title, 320);
    if (!originalUrl || !title) { malformedDropped++; continue; }
    const id = canonicalArticleKey(originalUrl);
    if (unique.has(id)) { duplicatesDropped++; continue; }
    unique.add(id);
    const domain = new URL(originalUrl).hostname.toLowerCase();
    // Domain provenance is from URL only. The GDELT domain string may be
    // inconsistent, and cannot authenticate legal ownership or authorship.
    candidates.push({
      id, originalUrl, title, outletDomain: domain,
      outletCountry: printable(obj.sourcecountry, 80),
      language: printable(obj.language, 50),
      gdeltSeenAt: seenDate(obj.seendate),
      retrievedAt,
      provenance: "GDELT_DOC_2_ARTLIST",
      reviewStatus: RADAR_STATUS,
    });
  }
  return {
    provider: "GDELT_DOC_2_ARTLIST", query: { ...search },
    retrievedAt, rowsExamined: Math.min(rows.length, RADAR_MAX_ARTICLES),
    duplicatesDropped, malformedDropped, candidates,
  };
}
export class RadarRequestError extends Error {
  constructor(public readonly code:
    "invalid" | "throttled" | "unavailable" | "bad_response" | "network") {
    super(code);
  }
}
export async function searchGdeltDocuments(
  search: RadarSearch,
  options: { signal?: AbortSignal; fetcher?: typeof fetch; now?: () => Date } = {},
): Promise<RadarResult> {
  if (!validRadarSearch(search)) throw new RadarRequestError("invalid");
  const target = buildRadarUrl(search);
  let response: Response;
  try {
    response = await (options.fetcher ?? fetch)(target, {
      method: "GET",
      mode: "cors",
      credentials: "omit",
      redirect: "follow",
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: options.signal,
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new RadarRequestError("network");
  }
  if (response.status === 429) throw new RadarRequestError("throttled");
  if (!response.ok) throw new RadarRequestError("unavailable");
  const length = Number(response.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > RADAR_MAX_BYTES) throw new RadarRequestError("bad_response");
  let raw: string;
  try { raw = await response.text(); }
  catch (error) {
    if (options.signal?.aborted) throw error;
    throw new RadarRequestError("network");
  }
  if (raw.length > RADAR_MAX_BYTES) throw new RadarRequestError("bad_response");
  const trimmed = raw.trim();
  if (!trimmed.startsWith("{")) {
    // DOC2 can respond with plain-text 200 notices, including rate limiting.
    if (/too many|rate limit|please wait|try again later/i.test(trimmed))
      throw new RadarRequestError("throttled");
    throw new RadarRequestError("bad_response");
  }
  try {
    const data: unknown = JSON.parse(trimmed);
    return normalizeGdeltDoc(data, search, (options.now ?? (() => new Date()))().toISOString());
  } catch {
    throw new RadarRequestError("bad_response");
  }
}
/**
 * User-selected perspective comparator. Distinct URL hosts are not proof
 * of independent reporting or of agreement/contradiction between claims.
 */
export function compareDiscoveryCandidates(a: RadarCandidate, b: RadarCandidate) {
  return {
    sameLink: a.id === b.id,
    sameHost: a.outletDomain === b.outletDomain,
    independentReportingVerified: false,
    articleContentsReviewed: false,
    claimsComparable: false,
  } as const;
}
