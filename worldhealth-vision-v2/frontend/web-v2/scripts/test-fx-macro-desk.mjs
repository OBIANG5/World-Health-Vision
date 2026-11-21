import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// Exercise the actual TS domain code used in the React app, not a rewritten mock.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/trading");
const compile = (name) => {
  const result = ts.transpileModule(readFileSync(path.join(root, name), "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    reportDiagnostics: true,
  });
  assert.equal(result.diagnostics?.filter(d => d.category === ts.DiagnosticCategory.Error).length ?? 0, 0);
  return result.outputText;
};
const moduleUrl = (code) => "data:text/javascript;base64," + Buffer.from(code).toString("base64");
const planUrl = moduleUrl(compile("tradePlan.ts"));
const deskJs = compile("fxMacroDesk.ts").replace('from "./tradePlan";', 'from "' + planUrl + '";');
assert(deskJs.includes(planUrl), "Test must load the actual shared TradePlan implementation");
const deskModel = await import(moduleUrl(deskJs));
const tradeModel = await import(planUrl);

const T = "2026-11-21T15:00:00.000Z";
const source = (publisher = "Original Publisher A", observation = "Synthetic historical note") => ({
  name: "Original synthetic policy document",
  originalPublisher: publisher,
  url: "https://example.org/policy/" + encodeURIComponent(publisher),
  publishedAt: "2026-11-20", perspective: "national", stance: "context", observation,
});
const snapshot = (currency, id = "item-1", sources = [source()]) => ({
  id, currency, recordedAt: T, asOf: "2026-11-20", view: "mixed",
  policyTheme: "User-declared monetary policy context; not a forecast",
  marketExpectations: "Synthetic market expectations before event",
  nextCatalyst: "Reassess a hypothetical upcoming release",
  contradictions: "Contrary interpretation must be independently reviewed",
  sources,
});
const append = (desk, item) => {
  const next = deskModel.appendMacroSnapshot(desk, item);
  assert(next, "Expected valid immutable macro snapshot");
  return next;
};

test("eight major currencies produce exactly 28 unique, market-oriented unordered pairs", () => {
  assert.equal(deskModel.FX_CURRENCIES.length, 8);
  const pairs = deskModel.FX_PAIRS;
  assert.equal(pairs.length, 28);
  assert.equal(new Set(pairs.map(p => p.symbol)).size, 28);
  for (const pair of pairs) {
    assert.equal(pair.symbol, pair.base + pair.quote);
    assert(pair.base !== pair.quote);
    assert.equal(pairs.some(p => p.base === pair.quote && p.quote === pair.base), false);
    assert.equal(deskModel.pairBySymbol(pair.symbol)?.symbol, pair.symbol);
  }
  for (const instrument of ["EURUSD", "GBPUSD", "AUDUSD", "NZDUSD", "USDJPY", "USDCAD", "USDCHF", "EURGBP"]) {
    assert(deskModel.pairBySymbol(instrument), "Missing conventional pair " + instrument);
  }
  assert.equal(deskModel.pairBySymbol("EURXYZ"), null);
  assert.equal(deskModel.pairBySymbol("__proto__"), null);
});

test("fresh workspace never auto-reads, contains no currency, and has strict v1 schema", () => {
  const empty = deskModel.parseMacroDesk(null);
  assert.equal(empty.status, "empty");
  assert.deepEqual(empty.desk, { schemaVersion: 1, assessments: {} });
  assert.equal(deskModel.FX_MACRO_KEY, "world-vision:trading-macro-desk:v1");
  assert.notEqual(deskModel.FX_MACRO_KEY, "world-vision:trading-mta-cases:v2");
  assert.equal(deskModel.MAX_MACRO_VERSIONS, 8);
});

test("snapshot chronology rejects future look-ahead sources and fabricated future as-of dates", () => {
  assert(deskModel.validFxSnapshot(snapshot("EUR")));
  const laterSource = snapshot("USD", "later", [{ ...source(), publishedAt: "2026-11-21" }]);
  assert.equal(deskModel.validFxSnapshot(laterSource), false);
  assert.equal(deskModel.validFxSnapshot({ ...snapshot("GBP"), asOf: "2026-11-22" }), false);
  assert.equal(deskModel.validFxSnapshot({ ...snapshot("GBP"), asOf: "2026-02-30" }), false);
  assert.equal(deskModel.validFxSnapshot({ ...snapshot("GBP"), recordedAt: "not-an-iso-date" }), false);
  assert.equal(deskModel.validFxSnapshot({ ...snapshot("GBP"), view: "LONG_NOW" }), false);
});

test("rejects unsafe source links, unsupported evidence and duplicate URLs", () => {
  for (const url of ["javascript:alert(1)", "http://example.org/raw", "https://u:pass@example.org",
    "https://example.org/obs#private", "ftp://example.org", "https://", "data:text/html,test"]) {
    assert.equal(deskModel.validFxSnapshot(snapshot("USD", "bad-url", [{ ...source(), url }])), false, url);
  }
  assert.equal(deskModel.validFxSnapshot(snapshot("USD", "bad-perspective",
    [{ ...source(), perspective: "TOP_SECRET" }])), false);
  assert.equal(deskModel.validFxSnapshot(snapshot("USD", "dup", [source(), source()])), false);
  assert.equal(deskModel.validFxSnapshot(snapshot("USD", "empty", [])), false);
  assert.equal(deskModel.validFxSnapshot(snapshot("USD", "too-many",
    Array.from({ length: 5 }, (_, i) => source("Publisher-" + i)))), false);
});

test("append-only versions preserve earlier research and reject identical IDs or backwards chronology", () => {
  const a = snapshot("AUD", "original");
  let desk = append(deskModel.emptyMacroDesk(), a);
  const b = { ...snapshot("AUD", "updated"), policyTheme: "Different later historical interpretation",
    recordedAt: "2026-11-21T16:00:00.000Z" };
  desk = append(desk, b);
  assert.equal(desk.assessments.AUD.length, 2);
  assert.equal(desk.assessments.AUD[0].policyTheme, a.policyTheme);
  assert.equal(desk.assessments.AUD[1].policyTheme, b.policyTheme);
  assert.equal(deskModel.appendMacroSnapshot(desk, a), null);
  assert.equal(deskModel.appendMacroSnapshot(desk, {
    ...snapshot("AUD", "old-version"), recordedAt: "2026-11-20T08:00:00.000Z",
  }), null);
  assert.equal(deskModel.parseMacroDesk(JSON.stringify(desk)).status, "ok");
  for (let i = 2; i < deskModel.MAX_MACRO_VERSIONS; i++) {
    desk = append(desk, { ...snapshot("AUD", "version-" + i),
      recordedAt: "2026-11-21T16:00:00.000Z" });
  }
  assert.equal(desk.assessments.AUD.length, deskModel.MAX_MACRO_VERSIONS);
  assert.equal(deskModel.appendMacroSnapshot(desk, snapshot("AUD", "ninth")), null);
  assert.equal(desk.assessments.AUD[0].id, "original", "No silent eviction");
});

test("corrupt/unknown versions and malformed currency histories fail closed without partial recovery", () => {
  const empty = deskModel.emptyMacroDesk();
  const valid = append(empty, snapshot("CAD"));
  for (const text of [
    "not json", "[]", "null", JSON.stringify({ schemaVersion: 2, assessments: {} }),
    JSON.stringify({ schemaVersion: 1, assessments: { XXX: [snapshot("CAD")] } }),
    JSON.stringify({ schemaVersion: 1, assessments: { CAD: [snapshot("EUR")] } }),
    JSON.stringify({ schemaVersion: 1, assessments: { CAD: [snapshot("CAD"), snapshot("CAD")] } }),
    JSON.stringify({ schemaVersion: 1, assessments: { CAD: [] } }),
    "A".repeat(deskModel.MAX_MACRO_IMPORT_BYTES + 1),
  ]) {
    assert.equal(deskModel.parseMacroDesk(text).status, "corrupt");
  }
  assert.equal(deskModel.parseMacroDesk(JSON.stringify(valid)).status, "ok");
});

test("coverage reports only source documentation, never ranks/scores or trades", () => {
  let desk = append(deskModel.emptyMacroDesk(), snapshot("EUR", "one", [source("Publisher A")]));
  let result = deskModel.pairCoverage(desk, deskModel.pairBySymbol("EURGBP"));
  assert.equal(result.complete, false);
  assert.equal(result.base, "single-publisher");
  assert.equal(result.quote, "absent");
  desk = append(desk, snapshot("GBP", "one-gbp", [source("Publisher B"), source("Publisher C")]));
  result = deskModel.pairCoverage(desk, deskModel.pairBySymbol("EURGBP"));
  assert.equal(result.complete, true);
  assert.equal(result.base, "single-publisher");
  assert.equal(result.quote, "multi-publisher");
  assert.equal(result.sameAsOf, true);
  assert.equal("score" in result, false);
  assert.equal("signal" in result, false);
  desk = append(desk, { ...snapshot("GBP", "stale"), asOf: "2026-11-19",
    sources: [{ ...source("Publisher Z"), publishedAt: "2026-11-19" }],
    recordedAt: "2026-11-21T16:00:00.000Z" });
  assert.equal(deskModel.pairCoverage(desk, deskModel.pairBySymbol("EURGBP")).sameAsOf, false);
});

test("copying a comparison makes new unsaved case with dated original evidence and NO signal", () => {
  const pair = deskModel.pairBySymbol("EURGBP");
  let desk = append(deskModel.emptyMacroDesk(), snapshot("EUR", "eur-source", [source("Publisher EUR")]));
  desk = append(desk, snapshot("GBP", "gbp-source", [source("Publisher GBP")]));
  const oldDeskJson = JSON.stringify(desk);
  const plan = deskModel.newResearchFromMacroPair(desk, pair);
  assert(plan);
  assert.equal(tradeModel.isTradePlan(plan), true);
  assert.equal(plan.schemaVersion, 1, "Server should accept existing v1 research schema");
  assert.equal(plan.instrument, "EURGBP");
  assert.equal(plan.instrumentKind, "spot");
  assert.equal(plan.direction, "undecided");
  assert.equal(plan.mode, "fundamental");
  assert.equal(plan.fields.orderType, "wait");
  assert.equal(plan.evidence.length, 2);
  assert(plan.evidence.every(e => e.url.startsWith("https://")));
  assert(plan.evidence.every(e => e.observation.includes("user-declared as-of")));
  assert(plan.fields.contradictions.includes("Contrary interpretation"));
  assert.equal(plan.fields.entry, undefined);
  assert.equal(plan.fields.stop, undefined);
  assert.equal(plan.fields.target, undefined);
  assert.equal(plan.events.length, 0);
  assert.equal(plan.updates.length, 0);
  assert.equal(JSON.stringify(desk), oldDeskJson, "Original macro history must not be changed");
  assert.equal(deskModel.newResearchFromMacroPair(desk, { ...pair, symbol: "fake" }), null);
  const missingContext = deskModel.newResearchFromMacroPair(deskModel.emptyMacroDesk(), pair);
  assert(missingContext);
  assert.equal(missingContext.evidence.length, 0);
  assert.equal(missingContext.direction, "undecided");
});

test("strict byte caps prevent giant snapshots without modifying existing archive", () => {
  const large = snapshot("JPY", "huge");
  large.policyTheme = "X".repeat(7000);
  assert.equal(deskModel.validFxSnapshot(large), false);
  const normal = append(deskModel.emptyMacroDesk(), snapshot("JPY"));
  const mutated = { ...normal, assessments: { ...normal.assessments,
    JPY: [{ ...snapshot("JPY"), sources: [{ ...source(), observation: "X".repeat(2000) }] }] } };
  assert.equal(deskModel.appendMacroSnapshot(mutated, snapshot("NZD")), null);
  assert.equal(normal.assessments.JPY.length, 1);
});

test("16 institutional source starting points cover all 8 economies without pretending to provide data", () => {
  const directory = deskModel.FX_OFFICIAL_RESEARCH_STARTS;
  assert.equal(Object.keys(directory).length, 8);
  const all = [];
  for (const currency of deskModel.FX_CURRENCIES) {
    const entry = directory[currency];
    assert(entry, "No official source starting points for " + currency);
    for (const item of [entry.monetary, entry.statistics]) {
      assert(item.name.length > 4);
      const url = new URL(item.url);
      assert.equal(url.protocol, "https:");
      assert.equal(url.username, "");
      assert.equal(url.password, "");
      all.push(url.hostname);
    }
  }
  assert.equal(all.length, 16);
  assert(all.includes("www.ecb.europa.eu"));
  assert(all.includes("www.boj.or.jp"));
  assert(all.includes("www.bankofengland.co.uk"));
  assert.equal(JSON.stringify(directory).includes("livePrice"), false);
  assert.equal(JSON.stringify(directory).includes("forecastValue"), false);
});
