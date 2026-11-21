/**
 * World-Vision Trading — point-in-time RESEARCH notes.
 *
 * Independent user-authored study tool. Timestamps are browser time only and
 * NOT attested by a financial data provider or trusted server. No market feed.
 */
import type { TradePlan, Direction } from "./tradePlan";

export type ThesisDisposition = "watch" | "reconsider" | "reject";
export interface ThesisUpdate {
  id: string;
  recordedAt: string;
  event: string;
  newInformation: string;
  conclusion: string;
  disposition: ThesisDisposition;
  snapshot: {
    instrument: string;
    direction: Direction;
    theme: string;
    pricedIn: string;
    catalyst: string;
    setup: string;
    initialEntry: string;
    initialStop: string;
    initialTarget: string;
    originalPublishers: string[];
  };
}
export interface EventPreparation {
  id: string;
  title: string;
  scheduledAt: string;
  preparedAt: string;
  expected: string;
  previous: string;
  unit: string;
  expectationPublisher: string;
  expectationSourceUrl: string;
  expectationAsOf: string;
  higherScenario: string;
  lowerScenario: string;
  result?: {
    actual: string;
    publishedAt: string;
    originalUrl: string;
    reaction: string;
  };
}
export interface NewThesisUpdate {
  event: string;
  newInformation: string;
  conclusion: string;
  disposition: ThesisDisposition;
}
export interface NewEventPreparation {
  title: string;
  scheduledAt: string;
  expected: string;
  previous: string;
  unit: string;
  expectationPublisher: string;
  expectationSourceUrl: string;
  expectationAsOf: string;
  higherScenario: string;
  lowerScenario: string;
}
export interface NewEventResult {
  actual: string;
  publishedAt: string;
  originalUrl: string;
  reaction: string;
}
const limited = (value: string, cap = 2000) => value.trim().length > 0 && value.length <= cap;
const number = (value: string): number | null => {
  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};
const dateValid = (value: string) => {
  const date = new Date(value);
  return Boolean(value) && Number.isFinite(date.getTime());
};
const publicUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
  } catch { return false; }
};

/** Snapshot is append-only in the UI; no retroactive attribution of knowledge. */
export function recordThesisUpdate(plan: TradePlan, input: NewThesisUpdate, now: string, id: string): ThesisUpdate | null {
  if (!dateValid(now) || !limited(input.event) || !limited(input.newInformation) || !limited(input.conclusion) ||
    !["watch", "reconsider", "reject"].includes(input.disposition)) return null;
  return {
    id, recordedAt: now, event: input.event.trim(), newInformation: input.newInformation.trim(),
    conclusion: input.conclusion.trim(), disposition: input.disposition,
    snapshot: {
      instrument: plan.instrument,
      direction: plan.direction,
      theme: plan.fields.theme ?? "",
      pricedIn: plan.fields.expectations ?? "",
      catalyst: plan.fields.catalyst ?? "",
      setup: plan.fields.setup ?? "",
      initialEntry: plan.fields.entry ?? "",
      initialStop: plan.fields.stop ?? "",
      initialTarget: plan.fields.target ?? "",
      originalPublishers: [...new Set(plan.evidence.map((e) => e.originalPublisher).filter(Boolean))].slice(0, 50),
    },
  };
}

export function prepareMacroEvent(input: NewEventPreparation, now: string, id: string): EventPreparation | null {
  if (!limited(input.title, 240) || !dateValid(input.scheduledAt) || !dateValid(now) ||
    !limited(input.expected, 100) || !limited(input.unit, 60) ||
    !limited(input.expectationPublisher, 240) || !publicUrl(input.expectationSourceUrl) ||
    !dateValid(input.expectationAsOf) ||
    !limited(input.higherScenario) || !limited(input.lowerScenario)) return null;
  // Historical replay is allowed, but is clearly flagged as retrospective
  // when this browser timestamp is later than scheduled release.
  return { id, preparedAt: now, ...input };
}
export function wasPreparedBeforeEvent(event: EventPreparation): boolean {
  return dateValid(event.preparedAt) && dateValid(event.scheduledAt) && dateValid(event.expectationAsOf)
    && new Date(event.preparedAt).getTime() < new Date(event.scheduledAt).getTime()
    && new Date(event.expectationAsOf).getTime() <= new Date(event.preparedAt).getTime();
}
export function attachEventResult(event: EventPreparation, input: NewEventResult): EventPreparation | null {
  if (event.result || !limited(input.actual, 100) || !dateValid(input.publishedAt) ||
    !publicUrl(input.originalUrl) || !limited(input.reaction)) return null;
  // Explicitly block results entered before the event's expected occurrence,
  // or timestamps in the future. A genuine early publication must be audited.
  const publishedAt = new Date(input.publishedAt).getTime();
  if (publishedAt < new Date(event.scheduledAt).getTime() || publishedAt > Date.now()) return null;
  return { ...event, result: { ...input } };
}
/** Arithmetic delta ONLY, never a market signal, prediction or standardized z-score. */
export function eventArithmeticDelta(event: EventPreparation): number | null {
  if (!event.result || !event.unit.trim()) return null;
  const forecast = number(event.expected), actual = number(event.result.actual);
  if (forecast === null || actual === null) return null;
  return actual - forecast;
}
export function validHistorySnapshot(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  const required = ["instrument", "direction", "theme", "pricedIn", "catalyst", "setup", "initialEntry", "initialStop", "initialTarget"];
  return required.every((k) => typeof v[k] === "string" && (v[k] as string).length <= 8000)
    && Array.isArray(v.originalPublishers) && v.originalPublishers.length <= 50
    && v.originalPublishers.every((s: unknown) => typeof s === "string" && s.length <= 3000);
}
export function validThesisUpdate(value: unknown): value is ThesisUpdate {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return ["id", "recordedAt", "event", "newInformation", "conclusion"].every(k => typeof v[k] === "string" && (v[k] as string).length < 2500)
    && dateValid(v.recordedAt as string)
    && ["watch", "reconsider", "reject"].includes(v.disposition as string)
    && validHistorySnapshot(v.snapshot);
}
export function validEventPreparation(value: unknown): value is EventPreparation {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (!["id", "title", "scheduledAt", "preparedAt", "expected", "previous", "unit", "expectationPublisher", "expectationSourceUrl", "expectationAsOf", "higherScenario", "lowerScenario"]
    .every(k => typeof v[k] === "string" && (v[k] as string).length < 3000)) return false;
  if (!dateValid(v.scheduledAt as string) || !dateValid(v.preparedAt as string) ||
    !dateValid(v.expectationAsOf as string) || !publicUrl(v.expectationSourceUrl as string)) return false;
  if (v.result === undefined) return true;
  if (!v.result || typeof v.result !== "object") return false;
  const r = v.result as Record<string, unknown>;
  return ["actual", "publishedAt", "originalUrl", "reaction"].every(k => typeof r[k] === "string" && (r[k] as string).length < 3000)
    && dateValid(r.publishedAt as string) && publicUrl(r.originalUrl as string);
}
