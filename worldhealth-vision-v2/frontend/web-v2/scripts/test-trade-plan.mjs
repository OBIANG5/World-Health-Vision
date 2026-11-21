// Lightweight contract tests: run with Node and the repo's own TypeScript.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const modulePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/trading/tradePlan.ts");
const source = readFileSync(modulePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  reportDiagnostics: true,
});
assert.equal(compiled.diagnostics?.filter((diag) => diag.category === ts.DiagnosticCategory.Error).length ?? 0, 0);
const model = await import("data:text/javascript;base64," + Buffer.from(compiled.outputText).toString("base64"));
const researchPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/trading/tradeResearch.ts");
const researchJs = ts.transpileModule(readFileSync(researchPath, "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  reportDiagnostics: true,
});
assert.equal(researchJs.diagnostics?.filter((diag) => diag.category === ts.DiagnosticCategory.Error).length ?? 0, 0);
const research = await import("data:text/javascript;base64," + Buffer.from(researchJs.outputText).toString("base64"));

function planWithGeometry(direction = "long", entry = "100", stop = "98", target = "106") {
  return {
    ...model.newTradePlan(),
    direction,
    instrument: "TEST",
    instrumentKind: "spot",
    fields: { entry, stop, target, rMax: "250", riskPercent: "50", accountCurrency: "EUR" },
  };
}
function evidence(overrides = {}) {
  return {
    id: "e1", name: "Document de test", originalPublisher: "éditeur original",
    url: "https://example.org/notice", publishedAt: "2026-11-20",
    perspective: "national", stance: "context", observation: "Enquête synthétique",
    ...overrides,
  };
}
test("seven ordered stages and default blank non-advisory record", () => {
  const value = model.newTradePlan();
  assert.equal(model.STAGES.length, 7);
  assert.equal(value.evidence.length, 0);
  assert.equal(value.direction, "undecided");
  assert.equal(model.reviewPlan(value).completed, 0);
});
test("long R:R and R max fraction are separate from capital or position size", () => {
  const r = model.reviewRisk(planWithGeometry());
  assert.equal(r.geometryNote, "valid");
  assert.equal(r.ratio, 3);
  assert.equal(r.plannedRiskBudget, 125);
  assert.equal("positionSize" in r, false);
});
test("short geometry uses reverse ordering", () => {
  const r = model.reviewRisk(planWithGeometry("short", "100", "103", "91"));
  assert.equal(r.geometryNote, "valid");
  assert.equal(r.ratio, 3);
});
test("inverted targets, invalid percentage and missing risk fail closed", () => {
  assert.equal(model.reviewRisk(planWithGeometry("long", "100", "102", "108")).validGeometry, false);
  assert.equal(model.reviewRisk(planWithGeometry("short", "100", "98", "95")).validGeometry, false);
  assert.equal(model.reviewRisk({ ...planWithGeometry(), fields: { ...planWithGeometry().fields, riskPercent: "150" } }).plannedRiskBudget, null);
  assert.equal(model.reviewRisk({ ...planWithGeometry(), fields: { ...planWithGeometry().fields, riskPercent: "" } }).plannedRiskBudget, null);
});
test("no fabricated R:R for missing and zero-width stop", () => {
  assert.equal(model.reviewRisk(planWithGeometry("long", "", "98", "106")).ratio, null);
  assert.equal(model.reviewRisk(planWithGeometry("long", "100", "100", "106")).ratio, null);
  assert.equal(model.reviewRisk(planWithGeometry("undecided", "100", "98", "106")).ratio, null);
});
test("technical route is exceptional, requires an explicit reason and does not bypass other stages", () => {
  const p = model.newTradePlan();
  p.mode = "technical_exception";
  p.fields.theme = "No reliable macro imbalance identified";
  const first = model.STAGES[0];
  assert.deepEqual(model.stageMissing(p, first), ["technicalReason"]);
  p.fields.technicalReason = "Short-duration price setup considered separately";
  assert.deepEqual(model.stageMissing(p, first), []);
  assert.ok(model.reviewPlan(p).missingStages.includes("price"));
});
test("multiple republished papers are not automatically independent", () => {
  const samePublisher = [evidence(), evidence({ id: "e2", url: "https://example.org/copy", name: "Article republished", perspective: "international" })];
  assert.equal(model.independentSourceCount(samePublisher), 1);
  assert.equal(model.independentSourceCount([...samePublisher, evidence({ id: "e3", originalPublisher: "second original producer" })]), 2);
});
test("source ledger requires HTTPS, original publisher and dated claim", () => {
  assert.equal(model.validEvidence(evidence()), true);
  assert.equal(model.validEvidence(evidence({ url: "http://example.org" })), false);
  assert.equal(model.validEvidence(evidence({ url: "javascript:alert(1)" })), false);
  assert.equal(model.validEvidence(evidence({ originalPublisher: "" })), false);
  assert.equal(model.validEvidence(evidence({ publishedAt: "not-a-date" })), false);
  assert.equal(model.validEvidence(evidence({ publishedAt: "2026-02-31" })), false);
  assert.equal(model.validEvidence(evidence({ publishedAt: "2026-12-01" })), false);
  assert.equal(model.validEvidence(evidence({ url: "https://user:secret@example.org" })), false);
});
test("stored shape checks reject malformed inputs and over-large blobs", () => {
  const p = planWithGeometry();
  p.evidence = [evidence()];
  assert.equal(model.isTradePlan(p), true);
  assert.equal(model.isTradePlan({ ...p, schemaVersion: 999 }), false);
  assert.equal(model.isTradePlan({ ...p, fields: { theme: 42 } }), false);
  assert.equal(model.isTradePlan({ ...p, evidence: Array(51).fill(evidence()) }), false);
  assert.equal(model.isTradePlan({ ...p, instrument: "x".repeat(10000) }), false);
});

test("thesis revision snapshots original expectations and does not rewrite previous versions", () => {
  const plan = planWithGeometry();
  plan.fields.theme = "Synthetic expectation";
  plan.fields.expectations = "No assumed repricing";
  plan.evidence = [evidence()];
  const update = research.recordThesisUpdate(plan, {
    event: "Demo release", newInformation: "Synthetic contradiction",
    conclusion: "Reconsider; no entry", disposition: "reconsider",
  }, "2026-11-20T12:00:00Z", "rev1");
  assert(update);
  assert.equal(update.snapshot.pricedIn, "No assumed repricing");
  plan.fields.expectations = "Post-event reinterpretation";
  plan.evidence[0].originalPublisher = "Changed source label";
  assert.equal(update.snapshot.pricedIn, "No assumed repricing");
  assert.equal(update.snapshot.originalPublishers[0], "éditeur original");
  assert.equal(research.validThesisUpdate(update), true);
  assert.equal(model.isTradePlan({ ...plan, updates: [update] }), true);
});
test("economic scenario requires linked dated primary expectation source", () => {
  const input = {
    title: "SYNTHETIC inflation event", scheduledAt: "2026-11-20T13:00:00Z",
    expected: "3.0", previous: "2.8", unit: "%",
    expectationPublisher: "Source A", expectationSourceUrl: "https://example.org/expectation",
    expectationAsOf: "2026-11-20T10:00:00Z",
    higherScenario: "Consider the monetary policy surprise", lowerScenario: "Consider an alternative scenario",
  };
  assert.equal(research.prepareMacroEvent({ ...input, expectationSourceUrl: "http://example.org" }, "2026-11-20T11:00:00Z", "ev1"), null);
  const prepared = research.prepareMacroEvent(input, "2026-11-20T11:00:00Z", "ev1");
  assert(prepared);
  assert.equal(research.wasPreparedBeforeEvent(prepared), true);
  assert.equal(research.validEventPreparation(prepared), true);
  assert.equal(model.isTradePlan({ ...model.newTradePlan(), events: [prepared] }), true);
  const retrospective = research.prepareMacroEvent(input, "2026-11-21T11:00:00Z", "ev2");
  assert(retrospective);
  assert.equal(research.wasPreparedBeforeEvent(retrospective), false);
});
test("macro outcome cannot be known before event, from future, or without source", () => {
  const prepared = research.prepareMacroEvent({
    title: "Synthetic release", scheduledAt: "2026-11-20T13:00:00Z",
    expected: "2.8", previous: "2.7", unit: "%",
    expectationPublisher: "Publisher", expectationSourceUrl: "https://example.org/ex-ante",
    expectationAsOf: "2026-11-20T10:00:00Z",
    higherScenario: "Higher case", lowerScenario: "Lower case",
  }, "2026-11-20T12:00:00Z", "e1");
  assert(prepared);
  const result = { actual: "3.1", publishedAt: "2026-11-20T13:20:00Z",
    originalUrl: "https://example.org/actual", reaction: "Synthetic response to inspect" };
  assert.equal(research.attachEventResult(prepared, { ...result, publishedAt: "2026-11-19T13:20:00Z" }), null);
  assert.equal(research.attachEventResult(prepared, { ...result, publishedAt: "2035-11-20T13:20:00Z" }), null);
  assert.equal(research.attachEventResult(prepared, { ...result, originalUrl: "http://example.org/actual" }), null);
  const joined = research.attachEventResult(prepared, result);
  assert(joined);
  assert(Math.abs(research.eventArithmeticDelta(joined) - 0.3) < 1e-9);
  assert.equal(research.attachEventResult(joined, result), null);
  assert.equal(research.validEventPreparation(joined), true);
});
test("non-numeric expected and outcome remain non-aggregated with no invented surprise", () => {
  const ev = research.prepareMacroEvent({
    title: "Human qualitative statement", scheduledAt: "2026-11-20T13:00:00Z",
    expected: "No change", previous: "", unit: "word",
    expectationPublisher: "Publisher", expectationSourceUrl: "https://example.org/statement",
    expectationAsOf: "2026-11-19T12:00:00Z",
    higherScenario: "Higher case", lowerScenario: "Lower case",
  }, "2026-11-20T11:00:00Z", "ev3");
  assert(ev);
  const joined = research.attachEventResult(ev, {
    actual: "Unchanged", publishedAt: "2026-11-20T14:00:00Z",
    originalUrl: "https://example.org/release", reaction: "Neutral response",
  });
  assert(joined);
  assert.equal(research.eventArithmeticDelta(joined), null);
});
