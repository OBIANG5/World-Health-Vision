/**
 * Trading-Vision P1C: the original, user-authored international FX Macro Desk.
 *
 * Eight currency contexts and all 28 unordered FX crosses. No licensed
 * material, price feed, live macro consensus, ranking, prediction, signal or
 * trading execution. Sources and as-of dates are DECLARED by the user.
 *
 * Snapshots are append-only. Browser clock is not server-attested. Entirely
 * separate from both remote account data and the P0C trade case library.
 */
import { newTradePlan, type TradePlan, type Evidence } from "./tradePlan";

export const FX_MACRO_KEY = "world-vision:trading-macro-desk:v1";
export const FX_CURRENCIES = ["EUR", "GBP", "AUD", "NZD", "USD", "CAD", "CHF", "JPY"] as const;
export type FxCurrency = (typeof FX_CURRENCIES)[number];

/**
 * Institutional research starting points, NOT data feeds, live publications,
 * endorsements, consensus providers or automatically verified citations.
 * A user MUST open a specific dated publication and enter its exact URL,
 * original publisher and observation; no link below is saved as evidence.
 * All 16 sites are public institutional homepages, reviewed 2026-11-21.
 */
export const FX_OFFICIAL_RESEARCH_STARTS: Readonly<Record<FxCurrency, {
  monetary: { name: string; url: string };
  statistics: { name: string; url: string };
}>> = Object.freeze({
  EUR: { monetary: { name: "European Central Bank", url: "https://www.ecb.europa.eu/" },
    statistics: { name: "Eurostat", url: "https://ec.europa.eu/eurostat" } },
  GBP: { monetary: { name: "Bank of England", url: "https://www.bankofengland.co.uk/" },
    statistics: { name: "Office for National Statistics", url: "https://www.ons.gov.uk/" } },
  AUD: { monetary: { name: "Reserve Bank of Australia", url: "https://www.rba.gov.au/" },
    statistics: { name: "Australian Bureau of Statistics", url: "https://www.abs.gov.au/" } },
  NZD: { monetary: { name: "Reserve Bank of New Zealand", url: "https://www.rbnz.govt.nz/" },
    statistics: { name: "Stats NZ", url: "https://www.stats.govt.nz/" } },
  USD: { monetary: { name: "Federal Reserve", url: "https://www.federalreserve.gov/" },
    statistics: { name: "Bureau of Labor Statistics", url: "https://www.bls.gov/" } },
  CAD: { monetary: { name: "Bank of Canada", url: "https://www.bankofcanada.ca/" },
    statistics: { name: "Statistics Canada", url: "https://www.statcan.gc.ca/" } },
  CHF: { monetary: { name: "Swiss National Bank", url: "https://www.snb.ch/en" },
    statistics: { name: "Swiss Federal Statistical Office", url: "https://www.bfs.admin.ch/bfs/en/home.html" } },
  JPY: { monetary: { name: "Bank of Japan", url: "https://www.boj.or.jp/en/" },
    statistics: { name: "Statistics Bureau of Japan", url: "https://www.stat.go.jp/english/" } },
});
export const MAX_MACRO_VERSIONS = 8;
export const MAX_MACRO_SOURCES = 4;
export const MAX_MACRO_DESK_BYTES = 450_000;
export const MAX_MACRO_SNAPSHOT_BYTES = 7_000;
export const MAX_MACRO_IMPORT_BYTES = 450_000;
const SAFE_ID = /^[A-Za-z0-9_-]{1,90}$/;
const STANCES = ["unclear", "resilient", "fragile", "mixed"] as const;
const PERSPECTIVES = ["national", "regional", "international", "field", "media", "market", "other"] as const;
const SOURCE_STANCES = ["supports", "challenges", "context"] as const;
export type FxView = (typeof STANCES)[number];
export type FxSourcePerspective = (typeof PERSPECTIVES)[number];
export type FxSourceStance = (typeof SOURCE_STANCES)[number];

export interface FxMacroSource {
  name: string;
  originalPublisher: string;
  url: string;
  publishedAt: string;
  perspective: FxSourcePerspective;
  stance: FxSourceStance;
  observation: string;
}
export interface FxMacroSnapshot {
  id: string;
  currency: FxCurrency;
  /** Browser-only date of authoring, not attested by a third party. */
  recordedAt: string;
  /** User-declared information cut-off date; NOT a verified historical fact. */
  asOf: string;
  view: FxView;
  policyTheme: string;
  marketExpectations: string;
  nextCatalyst: string;
  contradictions: string;
  sources: FxMacroSource[];
}
export interface FxMacroDesk {
  schemaVersion: 1;
  assessments: Partial<Record<FxCurrency, FxMacroSnapshot[]>>;
}
export interface FxPair {
  symbol: string;
  base: FxCurrency;
  quote: FxCurrency;
}
export interface FxPairCoverage {
  base: "absent" | "single-publisher" | "multi-publisher";
  quote: "absent" | "single-publisher" | "multi-publisher";
  complete: boolean;
  sameAsOf: boolean;
}

export const FX_PAIRS: readonly FxPair[] = Object.freeze(FX_CURRENCIES.flatMap((base, i) =>
  FX_CURRENCIES.slice(i + 1).map((quote) =>
    Object.freeze({ base, quote, symbol: base + quote }))));

export function isFxCurrency(value: unknown): value is FxCurrency {
  return typeof value === "string" && FX_CURRENCIES.some((currency) => currency === value);
}
export function emptyMacroDesk(): FxMacroDesk {
  return { schemaVersion: 1, assessments: {} };
}
function isoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const ms = Date.UTC(year, month - 1, day);
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === value;
}
function isoInstant(value: unknown): value is string {
  if (typeof value !== "string" || value.length < 20 || value.length > 40) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString() === value;
}
function limited(value: unknown, max: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max;
}
function publicHttps(url: unknown): url is string {
  if (!limited(url, 1800)) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && Boolean(parsed.hostname) &&
      !parsed.username && !parsed.password && !parsed.hash;
  } catch { return false; }
}
function inValues<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && allowed.some((v) => v === value);
}
function byteLength(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}
export function validFxSource(value: unknown, asOf: string): value is FxMacroSource {
  if (!value || typeof value !== "object") return false;
  const s = value as Partial<FxMacroSource>;
  return limited(s.name, 180) && limited(s.originalPublisher, 180) &&
    publicHttps(s.url) && isoDate(s.publishedAt) && s.publishedAt <= asOf &&
    inValues(s.perspective, PERSPECTIVES) && inValues(s.stance, SOURCE_STANCES) &&
    limited(s.observation, 500);
}
export function validFxSnapshot(value: unknown): value is FxMacroSnapshot {
  if (!value || typeof value !== "object") return false;
  const s = value as Partial<FxMacroSnapshot>;
  if (!limited(s.id, 90) || !SAFE_ID.test(s.id) || !isFxCurrency(s.currency) ||
      !isoInstant(s.recordedAt) || !isoDate(s.asOf) || s.asOf > s.recordedAt.slice(0, 10) ||
      !inValues(s.view, STANCES) || !limited(s.policyTheme, 1000) ||
      !limited(s.marketExpectations, 1000) || !limited(s.nextCatalyst, 1000) ||
      !limited(s.contradictions, 1000) || !Array.isArray(s.sources) ||
      s.sources.length < 1 || s.sources.length > MAX_MACRO_SOURCES ||
      !s.sources.every((source) => validFxSource(source, s.asOf as string))) return false;
  const urls = s.sources.map((source) => source.url.toLowerCase());
  return new Set(urls).size === urls.length && byteLength(s) <= MAX_MACRO_SNAPSHOT_BYTES;
}
export function parseMacroDesk(raw: string | null): { status: "empty" | "ok"; desk: FxMacroDesk } |
    { status: "corrupt"; reason: string } {
  if (raw === null) return { status: "empty", desk: emptyMacroDesk() };
  if (new TextEncoder().encode(raw).length > MAX_MACRO_IMPORT_BYTES) {
    return { status: "corrupt", reason: "too-large" };
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return { status: "corrupt", reason: "not-object" };
    const row = value as Partial<FxMacroDesk>;
    if (row.schemaVersion !== 1 || !row.assessments || typeof row.assessments !== "object" ||
      Array.isArray(row.assessments)) return { status: "corrupt", reason: "unknown-schema" };
    const collections = Object.entries(row.assessments);
    if (collections.length > FX_CURRENCIES.length) return { status: "corrupt", reason: "too-many" };
    for (const [key, snapshots] of collections) {
      if (!isFxCurrency(key) || !Array.isArray(snapshots) || snapshots.length < 1 ||
        snapshots.length > MAX_MACRO_VERSIONS ||
        !snapshots.every((item) => validFxSnapshot(item) && item.currency === key)) {
        return { status: "corrupt", reason: "invalid-snapshot" };
      }
      const ids = snapshots.map((item) => item.id);
      if (new Set(ids).size !== ids.length ||
          snapshots.some((item, i) => i > 0 && item.recordedAt < snapshots[i - 1].recordedAt)) {
        return { status: "corrupt", reason: "invalid-history" };
      }
    }
    return { status: "ok", desk: row as FxMacroDesk };
  } catch {
    return { status: "corrupt", reason: "invalid-json" };
  }
}
/** Never drops prior snapshots, evicts another currency, or changes v1 data. */
export function appendMacroSnapshot(desk: FxMacroDesk, snapshot: FxMacroSnapshot): FxMacroDesk | null {
  if (!validFxSnapshot(snapshot) || parseMacroDesk(JSON.stringify(desk)).status === "corrupt") return null;
  const existing = desk.assessments[snapshot.currency] ?? [];
  if (existing.length >= MAX_MACRO_VERSIONS ||
      existing.some((item) => item.id === snapshot.id) ||
      (existing.length > 0 && snapshot.recordedAt < existing[existing.length - 1].recordedAt)) return null;
  const next: FxMacroDesk = {
    schemaVersion: 1,
    assessments: { ...desk.assessments, [snapshot.currency]: [...existing, snapshot] },
  };
  return byteLength(next) <= MAX_MACRO_DESK_BYTES ? next : null;
}
export function latestMacroSnapshot(desk: FxMacroDesk, currency: FxCurrency): FxMacroSnapshot | null {
  const versions = desk.assessments[currency] ?? [];
  return versions.length > 0 ? versions[versions.length - 1] : null;
}
/** Only descriptive coverage, NEVER a financial ranking or trade signal. */
export function pairCoverage(desk: FxMacroDesk, pair: FxPair): FxPairCoverage {
  const base = latestMacroSnapshot(desk, pair.base);
  const quote = latestMacroSnapshot(desk, pair.quote);
  const status = (item: FxMacroSnapshot | null): FxPairCoverage["base"] => {
    if (!item) return "absent";
    const publishers = new Set(item.sources.map((s) => s.originalPublisher.trim().toLowerCase()));
    return publishers.size >= 2 ? "multi-publisher" : "single-publisher";
  };
  return {
    base: status(base), quote: status(quote),
    complete: Boolean(base && quote),
    sameAsOf: Boolean(base && quote && base.asOf === quote.asOf),
  };
}
export function pairBySymbol(symbol: string): FxPair | null {
  return FX_PAIRS.find((item) => item.symbol === symbol) ?? null;
}
/**
 * Copies ONLY a manual point-in-time research snapshot and its original
 * references into a NEW blank case. No existing case is ever mutated.
 * Direction remains "undecided", no levels, broker order or signal.
 */
export function newResearchFromMacroPair(desk: FxMacroDesk, pair: FxPair): TradePlan | null {
  if (!FX_PAIRS.some((valid) => valid.symbol === pair.symbol &&
        valid.base === pair.base && valid.quote === pair.quote)) return null;
  const research = newTradePlan();
  research.instrument = pair.symbol;
  research.instrumentKind = "spot";
  research.direction = "undecided";
  research.mode = "fundamental";
  research.fields.orderType = "wait";
  const base = latestMacroSnapshot(desk, pair.base);
  const quote = latestMacroSnapshot(desk, pair.quote);
  const notes = [base, quote].filter((v): v is FxMacroSnapshot => v !== null);
  if (notes.length > 0) {
    research.fields.theme = "USER-DECLARED comparative FX context, NOT a verified thesis: " +
      notes.map((note) => note.currency + " (" + note.asOf + "): " + note.policyTheme).join(" | ");
    research.fields.baseCurrency = base ?
      base.currency + " (" + base.asOf + "): " + base.policyTheme + " / " + base.nextCatalyst : "";
    research.fields.quoteCurrency = quote ?
      quote.currency + " (" + quote.asOf + "): " + quote.policyTheme + " / " + quote.nextCatalyst : "";
    research.fields.expectations = notes.map((note) =>
      note.currency + " [" + note.asOf + "]: " + note.marketExpectations).join(" | ");
    research.fields.contradictions = notes.map((note) =>
      note.currency + ": " + note.contradictions).join(" | ");
  }
  research.evidence = notes.flatMap((note) => note.sources.map((source, index): Evidence => ({
    id: "macro_" + note.currency + "_" + note.id + "_" + index,
    name: source.name,
    originalPublisher: source.originalPublisher,
    url: source.url,
    publishedAt: source.publishedAt,
    perspective: source.perspective,
    stance: source.stance,
    observation: "[" + note.currency + " | user-declared as-of " + note.asOf + "] " +
      source.observation,
  })));
  return research;
}
