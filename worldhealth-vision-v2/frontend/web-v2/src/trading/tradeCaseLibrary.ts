/**
 * Trading-Vision P0C: intentionally LOCAL, explicitly saved multi-dossier research.
 * NOT a brokerage account, cloud sync, encrypted vault or server-verified history.
 *
 * Fail closed on malformed/corrupted records. No automatic migration or overwrite.
 */
import { isTradePlan, type TradePlan } from "./tradePlan";
import { validEventPreparation, validThesisUpdate } from "./tradeResearch";

export const CASE_LIBRARY_KEY = "world-vision:trading-mta-cases:v2";
export const LEGACY_DRAFT_KEY = "world-vision:trading-mta-process:v1";
export const MAX_CASES = 30;
export const MAX_LIBRARY_CHARS = 1_800_000;
export const MAX_IMPORT_CHARS = 250_000;

export interface SavedTradeCase {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  plan: TradePlan;
}
export interface CaseLibrary {
  schemaVersion: 2;
  cases: SavedTradeCase[];
}
export type LibraryRead =
  | { status: "ok" | "empty"; library: CaseLibrary }
  | { status: "corrupt"; reason: string };

export function emptyCaseLibrary(): CaseLibrary {
  return { schemaVersion: 2, cases: [] };
}

export function isCompleteTradePlan(value: unknown): value is TradePlan {
  if (!isTradePlan(value)) return false;
  const plan = value as TradePlan;
  return plan.evidence.every((e) =>
    typeof e.id === "string" && e.id.length <= 128 &&
    typeof e.url === "string" && e.url.length <= 1800 &&
    typeof e.name === "string" && e.name.length <= 240 &&
    typeof e.originalPublisher === "string" && e.originalPublisher.length <= 240 &&
    // Source metadata may be user-authored, but it must have valid shape.
    // Unverified claims or incomplete historical drafts are still retained.
    sourceUrlSafe(e.url))
    && (plan.updates === undefined || plan.updates.every(validThesisUpdate))
    && (plan.events === undefined || plan.events.every(validEventPreparation));
}
function sourceUrlSafe(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
  } catch { return false; }
}
function isoTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 40 || value.length < 20) return false;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) && d.toISOString() === value;
}
export function isSavedTradeCase(value: unknown): value is SavedTradeCase {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<SavedTradeCase>;
  return typeof row.id === "string" && /^[a-zA-Z0-9_-]{1,128}$/.test(row.id) &&
    typeof row.title === "string" && row.title.trim().length > 0 && row.title.length <= 120 &&
    isoTimestamp(row.createdAt) && isoTimestamp(row.updatedAt) &&
    new Date(row.createdAt).getTime() <= new Date(row.updatedAt).getTime() &&
    isCompleteTradePlan(row.plan);
}
export function readCaseLibrary(raw: string | null): LibraryRead {
  if (raw === null) return { status: "empty", library: emptyCaseLibrary() };
  if (raw.length > MAX_LIBRARY_CHARS) return { status: "corrupt", reason: "library-limit" };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { status: "corrupt", reason: "not-an-object" };
    const row = parsed as Partial<CaseLibrary>;
    if (row.schemaVersion !== 2 || !Array.isArray(row.cases) || row.cases.length > MAX_CASES)
      return { status: "corrupt", reason: "unsupported-schema" };
    if (!row.cases.every(isSavedTradeCase)) return { status: "corrupt", reason: "invalid-case" };
    const ids = new Set(row.cases.map((value) => value.id));
    if (ids.size !== row.cases.length) return { status: "corrupt", reason: "duplicate-identities" };
    return { status: "ok", library: { schemaVersion: 2, cases: row.cases } };
  } catch {
    return { status: "corrupt", reason: "invalid-json" };
  }
}
export function prepareSavedCase(
  id: string, title: string, plan: TradePlan, now: string, createdAt?: string,
): SavedTradeCase | null {
  const normalizedTitle = title.trim();
  const item = { id, title: normalizedTitle, plan, createdAt: createdAt ?? now, updatedAt: now };
  return isSavedTradeCase(item) && JSON.stringify(item).length <= MAX_IMPORT_CHARS ? item : null;
}
/** Never silently evicts another case or truncates a library on quota overflow. */
export function putSavedCase(library: CaseLibrary, next: SavedTradeCase): CaseLibrary | null {
  if (!isSavedTradeCase(next)) return null;
  const previous = library.cases.find((item) => item.id === next.id);
  if (previous && previous.createdAt !== next.createdAt) return null;
  const cases = library.cases.filter((item) => item.id !== next.id).concat(next);
  if (cases.length > MAX_CASES) return null;
  const result: CaseLibrary = { schemaVersion: 2, cases };
  return JSON.stringify(result).length <= MAX_LIBRARY_CHARS ? result : null;
}
export function removeSavedCase(library: CaseLibrary, id: string): CaseLibrary {
  return { schemaVersion: 2, cases: library.cases.filter((item) => item.id !== id) };
}
/** Accept old exported v1 dossiers, not arbitrary foreign JSON or executable data. */
export function parseImportedTradePlan(raw: string): TradePlan | null {
  if (raw.length > MAX_IMPORT_CHARS) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (isCompleteTradePlan(data)) return data;
    if (!data || typeof data !== "object") return null;
    const nested = (data as Record<string, unknown>).plan;
    return isCompleteTradePlan(nested) ? nested : null;
  } catch {
    return null;
  }
}
