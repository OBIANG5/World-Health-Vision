import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/trading");
function compile(filename) {
  const result = ts.transpileModule(readFileSync(path.join(root, filename), "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    reportDiagnostics: true,
  });
  assert.equal(result.diagnostics?.filter((x) => x.category === ts.DiagnosticCategory.Error).length ?? 0, 0);
  return result.outputText;
}
function dataUrl(source) { return "data:text/javascript;base64," + Buffer.from(source).toString("base64"); }
const modelUrl = dataUrl(compile("tradePlan.ts"));
const researchUrl = dataUrl(compile("tradeResearch.ts"));
const libJs = compile("tradeCaseLibrary.ts")
  .replace('from "./tradePlan";', `from "${modelUrl}";`)
  .replace('from "./tradeResearch";', `from "${researchUrl}";`);
assert(libJs.includes(modelUrl) && libJs.includes(researchUrl), "Unit test must load actual domain models");
const lib = await import(dataUrl(libJs));
const model = await import(modelUrl);

const now = "2026-11-21T12:22:00.000Z";
const create = (id, title, plan = model.newTradePlan()) => {
  const saved = lib.prepareSavedCase(id, title, plan, now);
  assert(saved, "Expected valid case: " + id);
  return saved;
};
const evidence = {
  id: "example", name: "Document original fictif", originalPublisher: "Publisher A",
  url: "https://example.org/primary", publishedAt: "2026-11-20",
  perspective: "national", stance: "context", observation: "Synthetic explanatory source",
};

test("empty device has a clean, explicit version-2 portfolio", () => {
  const result = lib.readCaseLibrary(null);
  assert.equal(result.status, "empty");
  assert.equal(result.library.cases.length, 0);
  assert.equal(lib.CASE_LIBRARY_KEY, "world-vision:trading-mta-cases:v2");
  assert.notEqual(lib.CASE_LIBRARY_KEY, lib.LEGACY_DRAFT_KEY);
});
test("two distinct market theses remain separate and openable", () => {
  const first = create("one", "AUDCAD — monetary expectations");
  const second = create("two", "CHFJPY — safe haven");
  let result = lib.putSavedCase(lib.emptyCaseLibrary(), first);
  assert(result);
  result = lib.putSavedCase(result, second);
  assert(result);
  const imported = lib.readCaseLibrary(JSON.stringify(result));
  assert.equal(imported.status, "ok");
  assert.equal(imported.library.cases.length, 2);
  assert.equal(imported.library.cases[0].title, "AUDCAD — monetary expectations");
  assert.equal(imported.library.cases[1].title, "CHFJPY — safe haven");
});
test("updating one case never changes or evicts the other", () => {
  const plan = model.newTradePlan();
  const a = create("one", "First", plan), b = create("two", "Second");
  const both = lib.putSavedCase(lib.putSavedCase(lib.emptyCaseLibrary(), a), b);
  assert(both);
  const changed = model.newTradePlan();
  changed.instrument = "EURJPY";
  const update = lib.prepareSavedCase("one", "First updated", changed, "2026-11-21T13:10:00.000Z", a.createdAt);
  assert(update);
  const result = lib.putSavedCase(both, update);
  assert(result);
  assert.equal(result.cases.length, 2);
  assert.equal(result.cases.find(x => x.id === "two").title, "Second");
  assert.equal(result.cases.find(x => x.id === "one").plan.instrument, "EURJPY");
  assert.equal(lib.putSavedCase(both, { ...update, createdAt: "2026-11-19T12:22:00.000Z" }), null);
});
test("delete changes only one ID; deleted case is not silently resurrected", () => {
  const a = create("one", "A"), b = create("two", "B");
  const source = lib.putSavedCase(lib.putSavedCase(lib.emptyCaseLibrary(), a), b);
  const result = lib.removeSavedCase(source, "one");
  assert.equal(result.cases.length, 1);
  assert.equal(result.cases[0].id, "two");
  assert.equal(source.cases.length, 2);
});
test("reject invalid/corrupted, unsupported and duplicate-ID storage without silent reset", () => {
  for (const data of [
    "not json", "[]", '{"schemaVersion":1,"cases":[]}', '{"schemaVersion":2,"cases":{}}',
    JSON.stringify({ schemaVersion: 2, cases: [create("duplicate", "A"), create("duplicate", "B")] }),
    "x".repeat(lib.MAX_LIBRARY_CHARS + 1),
  ]) {
    assert.equal(lib.readCaseLibrary(data).status, "corrupt");
  }
});
test("strict file validation accepts legacy export and rejects untrusted URLs and malformed history", () => {
  const v1 = model.newTradePlan();
  v1.instrument = "EURCAD";
  v1.evidence = [evidence];
  assert.equal(lib.parseImportedTradePlan(JSON.stringify({ ...v1, exportedAt: now })).instrument, "EURCAD");
  assert.equal(lib.parseImportedTradePlan(JSON.stringify({ plan: v1 })).instrument, "EURCAD");
  assert.equal(lib.parseImportedTradePlan(JSON.stringify({ ...v1, evidence: [{ ...evidence, url: "javascript:alert(1)" }] })), null);
  assert.equal(lib.parseImportedTradePlan(JSON.stringify({ ...v1, evidence: [{ ...evidence, publishedAt: "not-a-date" }] })), null);
  assert.equal(lib.parseImportedTradePlan(JSON.stringify({ ...v1, updates: [{ id: "x" }] })), null);
  assert.equal(lib.parseImportedTradePlan(JSON.stringify({ ...v1, events: [{ id: "bad" }] })), null);
  assert.equal(lib.parseImportedTradePlan(JSON.stringify({ ...v1, schemaVersion: 3 })), null);
  assert.equal(lib.parseImportedTradePlan("x".repeat(lib.MAX_IMPORT_CHARS + 1)), null);
});
test("caps prevent oversized case and indiscriminate eviction", () => {
  let value = lib.emptyCaseLibrary();
  for (let i = 0; i < lib.MAX_CASES; i++) {
    const item = create("id_" + i, "Case " + i);
    value = lib.putSavedCase(value, item);
    assert(value);
  }
  assert.equal(value.cases.length, lib.MAX_CASES);
  assert.equal(lib.putSavedCase(value, create("over", "One too many")), null);
  assert.equal(value.cases.length, lib.MAX_CASES);
  const hugePlan = model.newTradePlan();
  for (let i = 0; i < 55; i++) hugePlan.fields["memo" + i] = "A".repeat(8000);
  assert.equal(lib.prepareSavedCase("huge", "Huge", hugePlan, now), null);
});
test("source metadata and chronology retain referential structure", () => {
  const p = model.newTradePlan();
  p.evidence = [evidence];
  p.fields.theme = "Price/monetary divergence";
  assert(lib.isCompleteTradePlan(p));
  const entry = create("case_1", "AUDCAD research", p);
  assert.equal(entry.plan.evidence[0].originalPublisher, "Publisher A");
  const latest = lib.readCaseLibrary(JSON.stringify({ schemaVersion: 2, cases: [entry] }));
  assert.equal(latest.status, "ok");
});
