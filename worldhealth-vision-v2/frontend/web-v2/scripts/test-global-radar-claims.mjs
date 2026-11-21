/**
 * R2C editorial evidence tests: execute exact production TypeScript domain,
 * not a reimplemented assertion copy. Offline tests validate *attribution*,
 * temporal/independence boundaries and fail-closed public research status,
 * not the external publishers' truth.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function compile(filepath) {
  const source = readFileSync(path.join(root, filepath), "utf8");
  const result = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    reportDiagnostics: true,
  });
  assert.equal(result.diagnostics?.filter((d) => d.category === ts.DiagnosticCategory.Error).length ?? 0, 0);
  return result.outputText;
}
const underlying = compile("src/radar/editorialSourceCase.ts");
const underlyingUrl = "data:text/javascript;base64," + Buffer.from(underlying).toString("base64");
let review = compile("src/radar/editorialClaimReview.ts");
assert(review.includes('from "./editorialSourceCase"'));
review = review.replace('from "./editorialSourceCase"', 'from "' + underlyingUrl + '"');
const mod = await import("data:text/javascript;base64," + Buffer.from(review).toString("base64"));
const { GABON_IMF_CLAIMS_R2C: claims, validateEditorialClaimReview: valid,
  sourceForEvidence: sourceFor } = mod;

const copy = (claim) => structuredClone(claim);
const changed = (index, transform) => {
  const all = copy(claims);
  all[index] = transform(all[index]);
  return all;
};

test("review covers four actionable attributed questions with explicit as-of and no truth shortcuts", () => {
  assert.equal(claims.length, 4);
  assert.deepEqual(claims.map((c) => c.id), [
    "MISSION_END_DAY", "PROGRAMME_DISCUSSIONS_STAGE",
    "DECEMBER_STAFF_LEVEL_TARGET", "GOVERNMENT_DEBT_AUDIT_RATIO",
  ]);
  assert.deepEqual(claims.map((c) => c.status), [
    "POTENTIAL_DATE_DISCREPANCY", "PRIMARY_INSTITUTION_POSITION",
    "GOVERNMENT_TARGET_VIA_PRESS", "ATTRIBUTED_ESTIMATE_NOT_APPROVED",
  ]);
  assert.equal(valid(claims), true);
  for (const c of claims) {
    assert.equal(c.independentFactCheckComplete, false);
    assert.equal(c.asOfDay, "2026-11-21");
    assert(c.headline.fr && c.headline.en && c.nextVerification.fr && c.nextVerification.en);
    for (const ref of c.evidence) {
      assert.equal(ref.reproducedQuote, false);
      assert.equal(ref.originalPublisherDocumentReviewed, false);
      const source = sourceFor(ref);
      assert(source && source.originalUrl.startsWith("https://"));
      assert.equal(source.sourceStatus, "LINK_AND_INDEX_EXCERPT_RESEARCHED");
      assert.equal(source.editorialIndependenceVerified, false);
      assert.equal(source.publisherFullTextFetched, false);
    }
  }
});

test("date conflict precisely attributes AGP 19 Sep and IMF 14–25 Sep instead of resolving by outlet rank", () => {
  const c = claims[0];
  assert.equal(c.status, "POTENTIAL_DATE_DISCREPANCY");
  assert.deepEqual(c.evidence.map((e) => e.sourceId),
    ["agp-20260925", "imf-20260926"]);
  assert.deepEqual(c.evidence.map((e) => e.evidencePath),
    ["AGP_GOVERNMENT_COMMUNIQUE_RELAY", "IMF_ORIGINAL_RELEASE_INDEX"]);
  assert(c.evidence[0].reportedValue.fr.includes("19 septembre"));
  assert(c.evidence[1].reportedValue.fr.includes("14–25 septembre"));
  assert(c.significance.fr.includes("pas une erreur définitivement attribuée"));
  assert(c.nextVerification.fr.includes("correctif de l'AGP"));
});

test("FMI source stage, public December target and debt ratio are three distinct evidential questions", () => {
  assert.deepEqual(claims[1].evidence.map((e) => e.sourceId), ["imf-20260926"]);
  assert(claims[1].significance.fr.includes("26 septembre"));
  assert(claims[1].nextVerification.fr.includes("Conseil d'administration"));
  assert.deepEqual(claims[2].evidence.map((e) => e.sourceId), ["ecomatin-20261120"]);
  assert(claims[2].evidence[0].meaning.fr.includes("Bloomberg"));
  assert(claims[2].significance.fr.includes("ne constitue ni"));
  assert.deepEqual(claims[3].evidence.map((e) => e.sourceId), ["ecomatin-20261120"]);
  assert(claims[3].evidence[0].meaning.fr.includes("n'a pas encore validé"));
  assert(claims[3].nextVerification.fr.includes("périmètre de dette"));
  assert(!claims.some((c) => c.independentFactCheckComplete));
});

test("reject source ID laundering, copied publisher quotations and unreviewed article promotion", () => {
  assert.equal(valid(changed(0, c => ({ ...c, independentFactCheckComplete: true }))), false);
  assert.equal(valid(changed(0, c => ({ ...c, evidence: [] }))), false);
  assert.equal(valid(changed(0, c => ({ ...c, asOfDay: "2027-01-01" }))), false);
  assert.equal(valid(changed(0, c => ({ ...c, evidence: [c.evidence[0]] }))), false);
  const alter = (delta) => changed(0, c => ({
    ...c,
    evidence: [{ ...c.evidence[0], ...delta }, c.evidence[1]],
  }));
  assert.equal(valid(alter({ sourceId: "fake-imf-approved" })), false);
  assert.equal(valid(alter({ evidencePath: "IMF_ORIGINAL_RELEASE_INDEX" })), false);
  assert.equal(valid(alter({ reproducedQuote: true })), false);
  assert.equal(valid(alter({ originalPublisherDocumentReviewed: true })), false);
  assert.equal(valid(changed(0, c => ({
    ...c, evidence: [c.evidence[0], c.evidence[0]],
  }))), false);
});

test("primary sources required for institution position; source index reading is never a fact check", () => {
  assert.equal(valid(changed(1, c => ({
    ...c, evidence: [copy(claims[2].evidence[0])],
  }))), false);
  assert.equal(valid(changed(2, c => ({
    ...c, evidence: [copy(claims[1].evidence[0])],
  }))), false);
  assert.equal(valid(changed(0, c => ({
    ...c, evidence: c.evidence.map(e => ({
      ...e, reportedValue: { fr: "2026-09-25", en: "2026-09-25" },
    })),
  }))), false);
  assert.equal(valid(copy(claims).concat(copy(claims))), false);
});

test("source links remain publisher-owned destinations, no proxy, fake access or editorial independence", () => {
  const urls = new Set();
  for (const c of claims) {
    for (const e of c.evidence) {
      const s = sourceFor(e);
      const u = new URL(s.originalUrl);
      assert.equal(u.protocol, "https:");
      assert.equal(u.username, "");
      assert.equal(u.password, "");
      urls.add(u.hostname);
    }
  }
  assert.deepEqual([...urls].sort(), ["agpgabon.ga", "ecomatin.net", "www.imf.org"]);
  assert.equal(sourceFor({ sourceId: "unknown" }), null);
});
