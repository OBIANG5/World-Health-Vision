/**
 * Trading-Vision P1B1 — private REST client. No automatic uploads, polling,
 * browser token persistence or user-identifying headers. Login is provided by
 * a separate, rigorously reviewed OIDC/PKCE adapter (P1B2).
 *
 * Browser requests go to same-origin /api/trading/cases via the Gateway.
 * A signed access token is mandatory and revalidated in Gateway and backend.
 */
import type { ResearchIdentity } from "../auth/researchIdentity";
import { isCompleteTradePlan, MAX_CASES } from "./tradeCaseLibrary";
import type { TradePlan } from "./tradePlan";

const CASE_PATH = "/api/trading/cases";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ETAG = /^"v([1-9][0-9]*)"$/;
const MAX_PLAN_BYTES = 200_000;
const MAX_RESPONSE_BYTES = 235_000;
const MAX_LIST_BYTES = 70_000;

export type CaseApiErrorCode =
  | "unauthenticated" | "forbidden" | "missing" | "conflict" | "stale"
  | "precondition" | "quota" | "invalid" | "offline" | "unavailable" | "untrusted";

export class PrivateCaseApiError extends Error {
  readonly code: CaseApiErrorCode;
  readonly status?: number;
  constructor(code: CaseApiErrorCode, status?: number) {
    super(code);
    this.code = code;
    this.status = status;
    this.name = "PrivateCaseApiError";
  }
}

export interface PrivateCaseSummary {
  id: string;
  title: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}
export interface PrivateCase extends PrivateCaseSummary {
  plan: TradePlan;
  etag: string;
}
export interface PrivateRevision {
  version: number;
  title: string;
  plan: TradePlan;
  savedAt: string;
}
export interface PrivateCaseHttp {
  fetch(input: string, init?: RequestInit): Promise<Response>;
}

/** Strictly local string validation. Server is authoritative for owner/scope. */
function validSummary(v: unknown): v is PrivateCaseSummary {
  if (!v || typeof v !== "object") return false;
  const item = v as Record<string, unknown>;
  return typeof item.id === "string" && UUID.test(item.id) &&
    typeof item.title === "string" && item.title.trim().length > 0 && item.title.length <= 120 &&
    Number.isSafeInteger(item.version) && (item.version as number) >= 1 &&
    (item.version as number) <= 200 &&
    typeof item.createdAt === "string" && !!Date.parse(item.createdAt) &&
    typeof item.updatedAt === "string" && !!Date.parse(item.updatedAt);
}
function versionTag(value: string | null, expected: number): string {
  if (!value || !ETAG.test(value) || Number(ETAG.exec(value)?.[1]) !== expected) {
    throw new PrivateCaseApiError("untrusted");
  }
  return value;
}
function validatePrivateCase(v: unknown, header: string | null): PrivateCase {
  if (!validSummary(v) || !("plan" in v) || !isCompleteTradePlan(v.plan)) {
    throw new PrivateCaseApiError("untrusted");
  }
  return { ...v, plan: v.plan, etag: versionTag(header, v.version) };
}
function limitedWrite(title: string, plan: TradePlan): string {
  if (!title.trim() || title.length > 120 || !isCompleteTradePlan(plan)) {
    throw new PrivateCaseApiError("invalid");
  }
  const body = JSON.stringify({ title: title.trim(), plan });
  if (new TextEncoder().encode(JSON.stringify(plan)).length > MAX_PLAN_BYTES) {
    throw new PrivateCaseApiError("quota");
  }
  return body;
}
function validId(id: string): string {
  if (!UUID.test(id)) throw new PrivateCaseApiError("invalid");
  return id;
}
function validTag(etag: string): string {
  if (!ETAG.test(etag)) throw new PrivateCaseApiError("invalid");
  return etag;
}
function mapHttpError(status: number): PrivateCaseApiError {
  const code: CaseApiErrorCode =
    status === 401 ? "unauthenticated" :
    status === 403 ? "forbidden" :
    status === 404 ? "missing" :
    status === 409 ? "conflict" :
    status === 412 ? "stale" :
    status === 428 ? "precondition" :
    status === 400 || status === 415 ? "invalid" :
    status === 413 || status === 429 ? "quota" : "unavailable";
  return new PrivateCaseApiError(code, status);
}

/**
 * No retries after stale/unauthenticated; no request body replay. No redirects
 * (prevents the bearer going to a user-controlled redirect target).
 */
export class PrivateCaseApi {
  private readonly transport: PrivateCaseHttp;
  private readonly identity: ResearchIdentity;
  private readonly signal?: AbortSignal;
  constructor(identity: ResearchIdentity, transport?: PrivateCaseHttp, signal?: AbortSignal) {
    this.identity = identity;
    this.signal = signal;
    this.transport = transport ?? { fetch: (url, init) => fetch(url, init) };
  }

  private async request(method: "GET" | "POST" | "PUT" | "DELETE",
      suffix: string, body?: string, ifMatch?: string): Promise<Response> {
    const token = await this.identity.accessToken();
    if (typeof token !== "string" || token.length < 16 || token.length > 8192 ||
      /[\s\r\n]/.test(token)) {
      throw new PrivateCaseApiError("unauthenticated");
    }
    const headers: Record<string, string> = {
      Authorization: "Bearer " + token,
      Accept: "application/json",
    };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (ifMatch !== undefined) headers["If-Match"] = validTag(ifMatch);
    let response: Response;
    try {
      response = await this.transport.fetch(CASE_PATH + suffix, {
        method, headers, body, credentials: "omit", redirect: "error",
        cache: "no-store", referrerPolicy: "no-referrer", signal: this.signal,
      });
    } catch {
      throw new PrivateCaseApiError("offline");
    }
    if (response.status === 0 || response.type === "opaqueredirect" ||
      response.redirected || (response.url &&
        new URL(response.url, "https://same-origin.invalid").origin !==
        (typeof location !== "undefined" ? location.origin : "https://same-origin.invalid"))) {
      throw new PrivateCaseApiError("untrusted");
    }
    if (!response.ok) throw mapHttpError(response.status);
    return response;
  }

  private async json(response: Response, cap: number): Promise<unknown> {
    if (!response.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) {
      throw new PrivateCaseApiError("untrusted");
    }
    const hint = Number(response.headers.get("Content-Length") ?? 0);
    if (hint > cap) throw new PrivateCaseApiError("untrusted");
    const raw = await response.text();
    if (new TextEncoder().encode(raw).length > cap) throw new PrivateCaseApiError("untrusted");
    try { return JSON.parse(raw) as unknown; }
    catch { throw new PrivateCaseApiError("untrusted"); }
  }

  async list(): Promise<PrivateCaseSummary[]> {
    const response = await this.request("GET", "");
    const payload = await this.json(response, MAX_LIST_BYTES);
    if (!Array.isArray(payload) || payload.length > MAX_CASES ||
      !payload.every(validSummary) ||
      new Set(payload.map((item: PrivateCaseSummary) => item.id)).size !== payload.length) {
      throw new PrivateCaseApiError("untrusted");
    }
    return payload as PrivateCaseSummary[];
  }

  async get(id: string): Promise<PrivateCase> {
    const response = await this.request("GET", "/" + validId(id));
    return validatePrivateCase(await this.json(response, MAX_RESPONSE_BYTES),
      response.headers.get("ETag"));
  }

  async create(title: string, plan: TradePlan): Promise<PrivateCase> {
    const response = await this.request("POST", "", limitedWrite(title, plan));
    if (response.status !== 201) throw new PrivateCaseApiError("untrusted");
    return validatePrivateCase(await this.json(response, MAX_RESPONSE_BYTES),
      response.headers.get("ETag"));
  }

  async update(id: string, etag: string, title: string, plan: TradePlan): Promise<PrivateCase> {
    const response = await this.request("PUT", "/" + validId(id),
      limitedWrite(title, plan), validTag(etag));
    return validatePrivateCase(await this.json(response, MAX_RESPONSE_BYTES),
      response.headers.get("ETag"));
  }

  async remove(id: string, etag: string): Promise<void> {
    const response = await this.request("DELETE", "/" + validId(id), undefined, validTag(etag));
    if (response.status !== 204) throw new PrivateCaseApiError("untrusted");
  }

  async history(id: string): Promise<PrivateRevision[]> {
    const response = await this.request("GET", "/" + validId(id) + "/history");
    const payload = await this.json(response, 4_000_000);
    if (!Array.isArray(payload) || payload.length > 200 ||
      !payload.every((v): v is PrivateRevision => !!v && typeof v === "object" &&
        Number.isSafeInteger(v.version) && v.version >= 1 && v.version <= 200 &&
        typeof v.title === "string" && !!v.title.trim() && v.title.length <= 120 &&
        typeof v.savedAt === "string" && !!Date.parse(v.savedAt) &&
        isCompleteTradePlan(v.plan))) {
      throw new PrivateCaseApiError("untrusted");
    }
    return payload;
  }
}
