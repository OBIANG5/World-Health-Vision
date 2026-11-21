/** Explicit user-choice editorial dossier backed by real, dated original URLs.
 * Offline tests validate semantics and rights states, not publisher truth. */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const input = readFileSync(path.join(root, "src/radar/editorialSourceCase.ts"), "utf8");
const js = ts.transpileModule(input, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  reportDiagnostics: true,
});
assert.equal(js.diagnostics?.filter(x => x.category === ts.DiagnosticCategory.Error).length ?? 0, 0);
const { EDITORIAL_GABON_IMF_CASE: dossier, validateEditorialSourceCase: validates } =
  await import("data:text/javascript;base64," + Buffer.from(js.outputText).toString("base64"));

test("Gabon/IMF is a real dated TOPIC dossier, not a machine-verified event", () => {
  assert.equal(dossier.id, "gabon-imf-dialogue-2026-11-21");
  assert.equal(dossier.countryIso3, "GAB");
  assert.equal(dossier.asOfDay, "2026-11-21");
  assert.equal(dossier.stage, "TOPIC_TIMELINE_NOT_SAME_EVENT");
  assert.equal(dossier.claimVerified, false);
  assert.equal(dossier.sourceMaterialCopied, false);
  assert.equal(validates(dossier), true);
  assert(dossier.links.length >= 3);
  assert(dossier.context.fr.includes("extraits publics indexés"));
  assert(dossier.editorialConclusion.fr.includes("ne sont pas équivalents"));
});

test("three original links cover Gabon national media, IMF primary and regional African media", () => {
  assert.deepEqual(dossier.links.map(x => x.role),
    ["national_news", "international_primary", "regional_business_news"]);
  assert.deepEqual(dossier.links.map(x => x.dependence),
    ["GOVERNMENT_RELEASE", "ORIGINAL_INSTITUTION", "CITES_OTHER_INTERVIEW"]);
  assert.deepEqual(dossier.links.map(x => x.publishedDay),
    ["2026-09-25", "2026-09-26", "2026-11-20"]);
  const hosts = dossier.links.map(x => new URL(x.originalUrl).hostname);
  assert.deepEqual(hosts, ["agpgabon.ga", "www.imf.org", "ecomatin.net"]);
  assert(new URL(dossier.links[1].originalUrl).pathname.startsWith("/en/news/articles/2026/09/26/"),
    "Only the officially discovered IMF English release is linked; no unsupported translation URL");
  for (const source of dossier.links) {
    assert.equal(source.editorialIndependenceVerified, false);
    assert.equal(source.publisherFullTextFetched, false);
    assert.equal(source.sourceStatus, "LINK_AND_INDEX_EXCERPT_RESEARCHED");
    assert.equal(new URL(source.originalUrl).protocol, "https:");
    assert(source.summary.fr.length > 60 && source.summary.en.length > 50);
    assert(source.publishedDay <= dossier.asOfDay);
  }
});

test("a government statement relayed by a news agency is not an independent original source", () => {
  const a = dossier.links[0];
  assert.equal(a.dependence, "GOVERNMENT_RELEASE");
  assert(a.summary.fr.includes("communication officielle"));
  const b = dossier.links[2];
  assert.equal(b.dependence, "CITES_OTHER_INTERVIEW");
  assert(b.summary.fr.includes("Bloomberg"));
  assert(dossier.editorialConclusion.fr.includes("ne suffisent pas à attester"));
});

test("fail-closed editorial gates reject promoted claims/rights and future-dated titles", () => {
  assert.equal(validates({ ...dossier, claimVerified: true }), false);
  assert.equal(validates({ ...dossier, sourceMaterialCopied: true }), false);
  assert.equal(validates({ ...dossier, stage: "VERIFIED_EVENT" }), false);
  assert.equal(validates({ ...dossier, links: [] }), false);
  assert.equal(validates({ ...dossier, links: [dossier.links[0], dossier.links[0]] }), false);
  const altered = (newSource) => ({ ...dossier, links: [newSource, ...dossier.links.slice(1)] });
  assert.equal(validates(altered({ ...dossier.links[0], publisherFullTextFetched: true })), false);
  assert.equal(validates(altered({ ...dossier.links[0], editorialIndependenceVerified: true })), false);
  assert.equal(validates(altered({ ...dossier.links[0], sourceStatus: "FULL_TEXT_CHECKED" })), false);
  assert.equal(validates(altered({ ...dossier.links[0], publishedDay: "2027-01-03" })), false);
  assert.equal(validates(altered({ ...dossier.links[0], originalUrl: "http://agpgabon.ga/a" })), false);
  assert.equal(validates(altered({ ...dossier.links[0], originalUrl: "javascript:alert(1)" })), false);
});
