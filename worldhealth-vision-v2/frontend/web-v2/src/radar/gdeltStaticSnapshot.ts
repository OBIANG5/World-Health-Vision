/**
 * WORLD-VISION GLOBAL RADAR R2B: read a build-produced static snapshot of REAL
 * GDELT 2.0 Events metadata, never a publisher article or verified news item.
 *
 * GDELT explicitly permits dataset reuse with attribution. This does not
 * license third-party publisher article text. Static snapshot may be absent
 * on ordinary dev/builds, is not live, and must never silently become "today".
 */
import { canonicalArticleKey, safeArticleUrl } from "./gdeltDoc";

export const RADAR_SNAPSHOT_PUBLIC_PATH = "radar/global-latest.json";
export const RADAR_SNAPSHOT_LIMIT_BYTES = 140_000;
export const GDELT_CREDIT = "Data: The GDELT Project — https://www.gdeltproject.org/";
export const GDELT_CREDIT_URI = "https://www.gdeltproject.org/";
export const GDELT_DATASET_RIGHTS_URI = "https://www.gdeltproject.org/about.html";
export const RADAR_SNAPSHOT_MAX_CANDIDATES = 40;
const HASH = /^[0-9a-f]{64}$/i;
const EVENT_ID = /^\d{1,20}$/;
const EVENT_DAY = /^\d{8}$/;
const CAMEO = /^[0-9A-Za-z]{1,8}$/;
const GEO_CODE = /^[A-Z0-9]{1,5}$/;
const UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3,6})?Z$/;
const DOMAIN = /^[a-z0-9.-]{3,253}$/;

export interface GdeltStaticSource {
  url: string;
  outletDomainFromUrl: string;
  gdeltEventId: string;
  gdeltAddedAtUtc: string;
  gdeltEventDay: string;
  gdeltCameoCode: string;
  gdeltActionGeoFipsCode: string | null;
  status: "DISCOVERY_ONLY";
  publisherPublicationTime: null;
  editorialIndependenceVerified: false;
}
export interface GdeltStaticSnapshot {
  schemaVersion: 1;
  kind: "WORLD_VISION_GDELT_STATIC_SOURCE_SNAPSHOT";
  status: "DISCOVERY_ONLY";
  generatedAtUtc: string;
  providerObservedAtUtc: string;
  providerBatchSlotUtc: string;
  sourceDataset: "GDELT_2_EVENTS_EXPORT";
  providerLink: typeof GDELT_CREDIT_URI;
  providerAttribution: typeof GDELT_CREDIT;
  gdeltDatasetReuseTermsUrl: typeof GDELT_DATASET_RIGHTS_URI;
  originalPublisherArticleRights: "NOT_REVIEWED_NO_ARTICLE_TEXT_COPIED";
  publisherTextPresent: false;
  eventFactsVerified: false;
  editorialIndependenceVerified: false;
  sourceManifestSha256: string;
  sourceArchiveSha256: string;
  providerMd5Verified: true;
  stats: {
    codedRows: number;
    distinctOriginalUrlsFound: number;
    duplicateReferencesDropped: number;
    unsafeOrMissingLinks: number;
    reportedSlotDiscrepancies: number;
    selectedForPreview: number;
  };
  candidates: GdeltStaticSource[];
}
function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function validIsoUtc(v: unknown): v is string {
  if (typeof v !== "string" || !UTC.test(v)) return false;
  const ms = Date.parse(v);
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 19) === v.slice(0, 19);
}
function nonnegativeCount(v: unknown): v is number {
  return typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
}
export class GdeltStaticSnapshotError extends Error {
  readonly code: "missing" | "unexpected" | "oversized" | "network";
  constructor(code: GdeltStaticSnapshotError["code"]) {
    super(code);
    this.code = code;
  }
}
/**
 * Fail-closed boundary against stale/malformed/provider-controlled data.
 * A valid snapshot is only proof that a batch was parsed, NEVER that
 * linked articles were read, verified or independently corroborated.
 */
export function parseGdeltStaticSnapshot(raw: unknown): GdeltStaticSnapshot {
  if (!isRecord(raw) || raw.schemaVersion !== 1 ||
    raw.kind !== "WORLD_VISION_GDELT_STATIC_SOURCE_SNAPSHOT" ||
    raw.status !== "DISCOVERY_ONLY" ||
    raw.sourceDataset !== "GDELT_2_EVENTS_EXPORT" ||
    raw.providerLink !== GDELT_CREDIT_URI ||
    raw.providerAttribution !== GDELT_CREDIT ||
    raw.gdeltDatasetReuseTermsUrl !== GDELT_DATASET_RIGHTS_URI ||
    raw.originalPublisherArticleRights !== "NOT_REVIEWED_NO_ARTICLE_TEXT_COPIED" ||
    raw.publisherTextPresent !== false ||
    raw.eventFactsVerified !== false ||
    raw.editorialIndependenceVerified !== false ||
    raw.providerMd5Verified !== true ||
    !validIsoUtc(raw.generatedAtUtc) ||
    !validIsoUtc(raw.providerObservedAtUtc) ||
    !validIsoUtc(raw.providerBatchSlotUtc) ||
    !HASH.test(String(raw.sourceManifestSha256)) ||
    !HASH.test(String(raw.sourceArchiveSha256))) {
    throw new GdeltStaticSnapshotError("unexpected");
  }
  const generated = Date.parse(raw.generatedAtUtc);
  const observed = Date.parse(raw.providerObservedAtUtc);
  const batch = Date.parse(raw.providerBatchSlotUtc);
  if (observed > generated || batch > generated + 15 * 60_000 ||
      generated - batch > 6 * 3_600_000) {
    throw new GdeltStaticSnapshotError("unexpected");
  }
  if (!isRecord(raw.stats) || !nonnegativeCount(raw.stats.codedRows) ||
    !nonnegativeCount(raw.stats.distinctOriginalUrlsFound) ||
    !nonnegativeCount(raw.stats.duplicateReferencesDropped) ||
    !nonnegativeCount(raw.stats.unsafeOrMissingLinks) ||
    !nonnegativeCount(raw.stats.reportedSlotDiscrepancies) ||
    !nonnegativeCount(raw.stats.selectedForPreview) ||
    !Array.isArray(raw.candidates) || raw.candidates.length < 1 ||
    raw.candidates.length > RADAR_SNAPSHOT_MAX_CANDIDATES ||
    raw.candidates.length !== raw.stats.selectedForPreview ||
    raw.stats.distinctOriginalUrlsFound < raw.candidates.length ||
    raw.stats.codedRows < raw.stats.distinctOriginalUrlsFound) {
    throw new GdeltStaticSnapshotError("unexpected");
  }
  const seen = new Set<string>();
  for (const candidate of raw.candidates) {
    if (!isRecord(candidate) ||
      typeof candidate.url !== "string" ||
      !safeArticleUrl(candidate.url) ||
      typeof candidate.outletDomainFromUrl !== "string" ||
      !DOMAIN.test(candidate.outletDomainFromUrl) ||
      new URL(candidate.url).hostname.toLowerCase() !== candidate.outletDomainFromUrl ||
      typeof candidate.gdeltEventId !== "string" || !EVENT_ID.test(candidate.gdeltEventId) ||
      typeof candidate.gdeltEventDay !== "string" || !EVENT_DAY.test(candidate.gdeltEventDay) ||
      typeof candidate.gdeltCameoCode !== "string" ||
      (candidate.gdeltCameoCode !== "" && !CAMEO.test(candidate.gdeltCameoCode)) ||
      (candidate.gdeltActionGeoFipsCode !== null &&
        (typeof candidate.gdeltActionGeoFipsCode !== "string" ||
          !GEO_CODE.test(candidate.gdeltActionGeoFipsCode))) ||
      !validIsoUtc(candidate.gdeltAddedAtUtc) ||
      candidate.status !== "DISCOVERY_ONLY" ||
      candidate.publisherPublicationTime !== null ||
      candidate.editorialIndependenceVerified !== false) {
      throw new GdeltStaticSnapshotError("unexpected");
    }
    const canonical = canonicalArticleKey(candidate.url);
    if (seen.has(canonical)) throw new GdeltStaticSnapshotError("unexpected");
    seen.add(canonical);
  }
  return raw as unknown as GdeltStaticSnapshot;
}

/**
 * Only fetches an owned, same-origin, static build artifact. Never arbitrary
 * URLs or frontend CORS proxies. Missing asset = unavailable, NOT zero news.
 */
export async function fetchGdeltStaticSnapshot(
  options: { fetcher?: typeof fetch; baseUrl?: string; signal?: AbortSignal } = {},
): Promise<GdeltStaticSnapshot> {
  const base = options.baseUrl ?? import.meta.env.BASE_URL;
  if (!/^\/(?:[a-z0-9._~!$&'()*+,;=:@%-]+\/)*$/i.test(base) || base.includes("..")) {
    throw new GdeltStaticSnapshotError("unexpected");
  }
  let response: Response;
  try {
    response = await (options.fetcher ?? fetch)(base + RADAR_SNAPSHOT_PUBLIC_PATH, {
      method: "GET", credentials: "omit", cache: "no-store", redirect: "error",
      signal: options.signal, headers: { Accept: "application/json" },
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new GdeltStaticSnapshotError("network");
  }
  if (response.status === 404) throw new GdeltStaticSnapshotError("missing");
  if (!response.ok) throw new GdeltStaticSnapshotError("network");
  const length = Number(response.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > RADAR_SNAPSHOT_LIMIT_BYTES) {
    throw new GdeltStaticSnapshotError("oversized");
  }
  let data: string;
  try { data = await response.text(); }
  catch (error) {
    if (options.signal?.aborted) throw error;
    throw new GdeltStaticSnapshotError("network");
  }
  if (data.length > RADAR_SNAPSHOT_LIMIT_BYTES) throw new GdeltStaticSnapshotError("oversized");
  try {
    return parseGdeltStaticSnapshot(JSON.parse(data));
  } catch {
    throw new GdeltStaticSnapshotError("unexpected");
  }
}
export function snapshotAgeHours(snapshot: GdeltStaticSnapshot, now = new Date()): number {
  return (now.getTime() - Date.parse(snapshot.providerBatchSlotUtc)) / 3_600_000;
}
