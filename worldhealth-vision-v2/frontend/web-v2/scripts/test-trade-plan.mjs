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
