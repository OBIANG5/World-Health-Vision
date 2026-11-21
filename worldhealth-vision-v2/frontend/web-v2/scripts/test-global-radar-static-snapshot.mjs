/** R2B: Tests run production TS parser, not a rewritten mock validator. */
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(path.resolve(root, p), "utf8");
const transpile = (source) => {
  const out = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    reportDiagnostics: true,
  });
  assert.equal(out.diagnostics?.filter((d) => d.category === ts.DiagnosticCategory.Error).length ?? 0, 0);
  return out.outputText;
};
const gdeltJs = transpile(read("src/radar/gdeltDoc.ts"));
const gdeltUri = "data:text/javascript;base64," + Buffer.from(gdeltJs).toString("base64");
let snapshotJs = transpile(read("src/radar/gdeltStaticSnapshot.ts"));
assert(snapshotJs.includes('from "./gdeltDoc"'));
snapshotJs = snapshotJs.replace('from "./gdeltDoc"', 'from "' + gdeltUri + '"');
const sdk = await import("data:text/javascript;base64," + Buffer.from(snapshotJs).toString("base64"));

const at = "2026-11-21T20:15:00.000Z";
const made = (id, url = "https://source" + id + ".example.org/article?id=" + id) => ({
  url,
  outletDomainFromUrl: "source" + id + ".example.org",
  gdeltEventId: String(2000 + id),
  gdeltAddedAtUtc: "2026-11-21T20:00:00Z",
  gdeltEventDay: "20261121",
  gdeltCameoCode: "043",
  gdeltActionGeoFipsCode: "GB",
  status: "DISCOVERY_ONLY",
  publisherPublicationTime: null,
  editorialIndependenceVerified: false,
});
function fixture(items = [made(1), made(2)]) {
  return {
    schemaVersion: 1, kind: "WORLD_VISION_GDELT_STATIC_SOURCE_SNAPSHOT",
    status: "DISCOVERY_ONLY",
    generatedAtUtc: at, providerObservedAtUtc: "2026-11-21T20:05:00Z",
    providerBatchSlotUtc: "2026-11-21T20:00:00Z",
    sourceDataset: "GDELT_2_EVENTS_EXPORT",
    providerLink: "https://www.gdeltproject.org/",
    providerAttribution: "Data: The GDELT Project — https://www.gdeltproject.org/",
    gdeltDatasetReuseTermsUrl: "https://www.gdeltproject.org/about.html",
    originalPublisherArticleRights: "NOT_REVIEWED_NO_ARTICLE_TEXT_COPIED",
    publisherTextPresent: false,
    eventFactsVerified: false,
    editorialIndependenceVerified: false,
    sourceManifestSha256: "a".repeat(64),
    sourceArchiveSha256: "b".repeat(64),
    providerMd5Verified: true,
    stats: {
      codedRows: 619, distinctOriginalUrlsFound: 120,
      duplicateReferencesDropped: 476,
      unsafeOrMissingLinks: 23, reportedSlotDiscrepancies: 0,
      selectedForPreview: items.length,
    },
    candidates: items,
  };
}
const rejected = (data) => assert.throws(
  () => sdk.parseGdeltStaticSnapshot(data), (error) => error.code === "unexpected",
);

test("accept real-code version 1 source-only contract with visible GDELT credit", () => {
  const s = sdk.parseGdeltStaticSnapshot(fixture());
  assert.equal(s.candidates.length, 2);
  assert.equal(s.providerLink, sdk.GDELT_CREDIT_URI);
  assert.equal(s.providerAttribution, sdk.GDELT_CREDIT);
  assert.equal(s.eventFactsVerified, false);
  assert.equal(s.originalPublisherArticleRights, "NOT_REVIEWED_NO_ARTICLE_TEXT_COPIED");
  assert.equal(s.candidates[0].publisherPublicationTime, null);
  assert.equal(s.stats.codedRows, 619);
  assert.equal(s.stats.selectedForPreview, 2);
});

test("never accept marketed articles or doctored source entitlements", () => {
  for (const [key, value] of Object.entries({
    status: "PUBLISHED", eventFactsVerified: true, publisherTextPresent: true,
    editorialIndependenceVerified: true, providerMd5Verified: false,
    originalPublisherArticleRights: "OPEN",
    providerLink: "https://some-other-site.test/",
    providerAttribution: "World-Vision verified",
    gdeltDatasetReuseTermsUrl: "https://fake.example.org/license",
  })) rejected({ ...fixture(), [key]: value });
  rejected({ ...fixture(), sourceManifestSha256: "not-a-sha" });
  rejected({ ...fixture(), sourceArchiveSha256: "0" });
  rejected({ ...fixture(), sourceDataset: "GDELT_CLOUD_PAID_GENERATED_ANALYSIS" });
});

test("mandatory timestamp and source version validation prevents false currentness", () => {
  for (const data of [
    { generatedAtUtc: "2026-11-21T20:15:00" },
    { generatedAtUtc: "not a date" },
    { providerBatchSlotUtc: "2026-11-21T21:00:00Z" },
    { providerObservedAtUtc: "2026-11-21T20:30:00Z" },
    { generatedAtUtc: "2026-11-22T05:00:00Z" },
    { kind: "FAKE_NEWS" },
    { schemaVersion: 2 },
  ]) rejected({ ...fixture(), ...data });
  const parsed = sdk.parseGdeltStaticSnapshot(fixture());
  assert.equal(sdk.snapshotAgeHours(parsed, new Date("2026-11-21T22:00:00Z")), 2);
  assert(sdk.snapshotAgeHours(parsed, new Date("2026-11-22T06:00:00Z")) > 6,
    "Already-delivered builds must show an old-snapshot warning");
});

test("unsafe URLs, unknown geo coding, duplicate trackers and text rights fail closed", () => {
  const bad = [
    made(1, "javascript:alert(1)"),
    made(1, "http://source1.example.org/article"),
    made(1, "https://localhost/a"),
    made(1, "https://192.168.1.1/a"),
    made(1, "https://user:pass@source1.example.org/a"),
    { ...made(1), gdeltActionGeoFipsCode: "<img onerror=alert(1)>" },
    { ...made(1), status: "REVIEWED" },
    { ...made(1), publisherPublicationTime: at },
    { ...made(1), editorialIndependenceVerified: true },
    { ...made(1), outletDomainFromUrl: "another.example.org" },
    { ...made(1), gdeltEventId: "ABC" },
    { ...made(1), gdeltCameoCode: "<b>043</b>" },
  ];
  for (const item of bad) rejected(fixture([item]));
  const a = made(1, "https://source1.example.org/article?id=1&utm_source=a");
  const b = made(2, "https://source1.example.org/article?id=1&utm_source=b");
  b.outletDomainFromUrl = "source1.example.org";
  rejected(fixture([a, b]));
  const c = made(2, "https://source1.example.org/article?id=2&utm_source=b");
  c.outletDomainFromUrl = "source1.example.org";
  assert.equal(sdk.parseGdeltStaticSnapshot(fixture([a, c])).candidates.length, 2);
});

test("zero/mismatched/noisy candidate lists cannot mean there were no news", () => {
  rejected(fixture([]));
  rejected({ ...fixture(), candidates: ["not a candidate"] });
  rejected({ ...fixture(), stats: { ...fixture().stats, codedRows: 1 } });
  rejected({ ...fixture(), stats: { ...fixture().stats, selectedForPreview: 40 } });
  rejected(fixture(Array.from({ length: 41 }, (_, index) => made(index + 1))));
  rejected({ ...fixture(), stats: { ...fixture().stats, distinctOriginalUrlsFound: -1 } });
});

test("same-origin static preview fetch never attaches credentials or dynamically chooses an upstream", async () => {
  let calls = 0;
  const parsed = await sdk.fetchGdeltStaticSnapshot({
    baseUrl: "/world-vision/",
    fetcher: async (url, options) => {
      calls++;
      assert.equal(url, "/world-vision/radar/global-latest.json");
      assert.equal(options.credentials, "omit");
      assert.equal(options.redirect, "error");
      assert.equal(options.method, "GET");
      assert.equal(options.cache, "no-store");
      return new Response(JSON.stringify(fixture()), { status: 200 });
    },
  });
  assert.equal(calls, 1);
  assert.equal(parsed.candidates.length, 2);
  await assert.rejects(sdk.fetchGdeltStaticSnapshot({
    baseUrl: "https://evil.example.org/", fetcher: async () => { throw new Error("unexpected network"); },
  }), (e) => e.code === "unexpected");
});

test("unavailable snapshot, HTML 200, oversized and aborted responses are never treated as zero events", async () => {
  await assert.rejects(sdk.fetchGdeltStaticSnapshot({
    baseUrl: "/", fetcher: async () => new Response("404", { status: 404 }),
  }), (error) => error.code === "missing");
  await assert.rejects(sdk.fetchGdeltStaticSnapshot({
    baseUrl: "/", fetcher: async () => new Response("<html>SPA fallback</html>", { status: 200 }),
  }), (error) => error.code === "unexpected");
  await assert.rejects(sdk.fetchGdeltStaticSnapshot({
    baseUrl: "/", fetcher: async () => new Response("X".repeat(141_000), { status: 200 }),
  }), (error) => error.code === "oversized");
  await assert.rejects(sdk.fetchGdeltStaticSnapshot({
    baseUrl: "/", fetcher: async () => { throw new TypeError("fetch failed"); },
  }), (error) => error.code === "network");
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(sdk.fetchGdeltStaticSnapshot({
    baseUrl: "/", signal: controller.signal,
    fetcher: async () => { throw new DOMException("Aborted", "AbortError"); },
  }), (error) => error.name === "AbortError");
});
