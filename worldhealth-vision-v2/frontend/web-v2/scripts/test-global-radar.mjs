/**
 * Node test harness executes the SAME TypeScript module used by the V2 UI.
 * No rewrite of provider validation, provenance, deduplication or errors.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const source = readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)),
  "../src/radar/gdeltDoc.ts"), "utf8");
const result = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  reportDiagnostics: true,
});
assert.equal(result.diagnostics?.filter((d) => d.category === ts.DiagnosticCategory.Error).length ?? 0, 0);
const sdk = await import("data:text/javascript;base64," + Buffer.from(result.outputText).toString("base64"));
const topic = { subject: "Gabon elections", window: "1d", outletCountry: "" };
const url = (domain, slug, search = "") => "https://" + domain + "/news/" + slug + search;
const make = (href, title = "Synthetic publisher entry", country = "Gabon", when = "20261121T131500Z") =>
  ({ url: href, title, seendate: when, language: "French", sourcecountry: country, domain: "NOT_VERIFIED" });
const fixture = { articles: [
  make(url("publication-a.example.org", "economic-update", "?utm_source=gdelt")),
  make(url("publication-a.example.org", "economic-update", "?utm_source=another")),
  make(url("publication-b.example.org", "economic-update")),
  make("javascript:alert(1)", "Unsafe article title"),
  make("https://192.168.1.1/secret", "Private link"),
  make(url("publication-c.example.org", "case-id", "?id=42"), "<img src=x onerror=alert(1)>"),
  make(url("publication-c.example.org", "case-id", "?id=43"), "Second article with different ID"),
] };
const response = (payload, status = 200, contentType = "application/json") => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: (key) => key === "content-type" ? contentType : null },
  text: async () => typeof payload === "string" ? payload : JSON.stringify(payload),
});
const now = () => new Date("2026-11-21T20:15:00.000Z");

test("only plain, bounded queries, internationally selectable outlet origins", () => {
  assert(sdk.validRadarSearch(topic));
  assert(sdk.validRadarSearch({ ...topic, subject: "banking and inflation in Côte d'Ivoire" }));
  assert(sdk.validRadarSearch({ ...topic, subject: "climate or election" }));
  assert.equal(sdk.SOURCE_COUNTRIES.length >= 25, true);
  for (const value of ["", "gabon", "cotedivoire", "democraticrepublicofcongo",
    "brazil", "japan", "newzealand", "unitedkingdom"]) {
    assert(sdk.validRadarSearch({ ...topic, outletCountry: value }));
  }
  for (const value of ["", "ab", "X".repeat(92), "voting OR election",
    "vote sourcecountry:gabon", "theme:CRISIS", "news?format=xml", "earthquake&maxrecords=250",
    "<script>alert(1)</script>", "USD)"] ) {
    assert.equal(sdk.validRadarSearch({ ...topic, subject: value }), false, value);
  }
  for (const window of ["9d", "30d", "0d", "365d", "", "1h"]) {
    assert.equal(sdk.validRadarSearch({ ...topic, window }), false, window);
  }
  assert.equal(sdk.validRadarSearch({ ...topic, outletCountry: "__proto__" }), false);
});

test("official GDELT DOC 2.0 URL has fixed mode/format/max and encoded country operator", () => {
  const request = new URL(sdk.buildRadarUrl({ subject: "Gabon elections", window: "7d", outletCountry: "gabon" }));
  assert.equal(request.origin, "https://api.gdeltproject.org");
  assert.equal(request.pathname, "/api/v2/doc/doc");
  assert.equal(request.searchParams.get("query"), "Gabon elections sourcecountry:gabon");
  assert.equal(request.searchParams.get("format"), "json");
  assert.equal(request.searchParams.get("mode"), "artlist");
  assert.equal(request.searchParams.get("timespan"), "7d");
  assert.equal(request.searchParams.get("sort"), "datedesc");
  assert.equal(request.searchParams.get("maxrecords"), "40");
  assert.equal(request.searchParams.get("callback"), null);
  assert.equal(request.searchParams.get("startdatetime"), null);
  assert.equal(request.searchParams.get("enddatetime"), null);
  assert.throws(() => sdk.buildRadarUrl({ ...topic, subject: "a" }), /INVALID_RADAR_QUERY/);
});

test("canonical URL dedupes only safe trackers; real id query parameters remain distinct", () => {
  const start = url("media.example.org", "a", "?id=42&utm_source=GDELT");
  assert.equal(sdk.canonicalArticleKey(start), url("media.example.org", "a", "?id=42"));
  assert.notEqual(sdk.canonicalArticleKey(start),
    sdk.canonicalArticleKey(url("media.example.org", "a", "?id=43")));
  assert.equal(sdk.canonicalArticleKey(url("media.example.org", "a", "?utm_medium=email")),
    url("media.example.org", "a"));
  assert.equal(sdk.canonicalArticleKey(url("media.example.org", "a", "#section")),
    url("media.example.org", "a"));
});

test("rejects credentials, script schemes, private networks, URL fragments without inventing another source", () => {
  for (const link of [
    "javascript:alert(document.cookie)", "data:text/html,attack", "http://newspaper.example.org/a",
    "https://localhost/a", "https://127.0.0.1/a", "https://10.1.2.3/a",
    "https://192.168.1.1/a", "https://172.16.0.1/a", "https://169.254.1.1/a",
    "https://[::1]/a", "https://user:pass@publisher.example.org/news", "/relative",
    "https://media.local/a", "https://a.internal/news",
  ]) {
    assert.equal(sdk.safeArticleUrl(link), null, link);
  }
  assert.equal(sdk.safeArticleUrl("https://publication.example.org/news?id=42"),
    "https://publication.example.org/news?id=42");
});

test("normalizes only actual GDELT URLs/titles and exposes incomplete source metadata honestly", () => {
  const state = sdk.normalizeGdeltDoc(fixture, topic, now().toISOString());
  assert.equal(state.provider, "GDELT_DOC_2_ARTLIST");
  assert.equal(state.rowsExamined, fixture.articles.length);
  assert.equal(state.duplicatesDropped, 1);
  assert.equal(state.malformedDropped, 2);
  assert.equal(state.candidates.length, 4);
  assert.deepEqual(state.candidates.map((v) => v.reviewStatus), Array(4).fill("DISCOVERY_ONLY"));
  assert.equal(state.candidates[0].outletDomain, "publication-a.example.org");
  assert.equal(state.candidates[0].outletCountry, "Gabon");
  assert.equal(state.candidates[0].language, "French");
  assert.equal(state.candidates[0].gdeltSeenAt, "2026-11-21T13:15:00.000Z");
  assert.equal(state.candidates[0].retrievedAt, now().toISOString());
  assert.equal("publishedAt" in state.candidates[0], false, "GDELT seendate is not attested publisher publication time");
  assert.equal("verifiedEvent" in state.candidates[0], false);
  assert.equal(state.candidates[2].title, "<img src=x onerror=alert(1)>", "React must render only text, never HTML");
  assert.notEqual(state.candidates[2].id, state.candidates[3].id);
});

test("source-domain metadata comparison never implies independent reporting or verified facts", () => {
  const data = sdk.normalizeGdeltDoc(fixture, topic, now().toISOString()).candidates;
  const different = sdk.compareDiscoveryCandidates(data[0], data[1]);
  assert.equal(different.sameHost, false);
  assert.equal(different.independentReportingVerified, false);
  assert.equal(different.articleContentsReviewed, false);
  assert.equal(different.claimsComparable, false);
  const a = data[2], b = data[3];
  const same = sdk.compareDiscoveryCandidates(a, b);
  assert.equal(same.sameHost, true);
  assert.equal(same.sameLink, false, "Different ?id articles are not collapsed");
});

test("unknown original publish time and reporting country remain unknown, not guessed from query", () => {
  const other = sdk.normalizeGdeltDoc({ articles: [
    { url: url("example.org", "a"), title: "Research headline", seendate: "impossible" },
    { url: url("another.example.org", "b"), title: "Independent? unverified", seendate: "20261321T100000Z" },
  ] }, topic, now().toISOString());
  assert.equal(other.candidates.length, 2);
  for (const item of other.candidates) {
    assert.equal(item.outletCountry, null);
    assert.equal(item.language, null);
    assert.equal(item.gdeltSeenAt, null);
    assert.equal(item.reviewStatus, "DISCOVERY_ONLY");
  }
});

test("malformed/oversized payloads fail closed rather than fabricating empty coverage", () => {
  for (const input of [null, "hello", {}, [], { articles: "fake" },
    { articles: Array(251).fill({}) }]) {
    assert.throws(() => sdk.normalizeGdeltDoc(input, topic, now().toISOString()));
  }
  const empty = sdk.normalizeGdeltDoc({ articles: [] }, topic, now().toISOString());
  assert.equal(empty.candidates.length, 0);
  assert.equal(empty.rowsExamined, 0);
  assert.equal(empty.provider, "GDELT_DOC_2_ARTLIST");
  assert.equal(empty.candidates.some((item) => item.verifiedEvent), false);
});

test("bounded 40 rows, no full article bodies, duplicate provenance and invalid link counters", () => {
  const many = { articles: Array.from({ length: 43 }, (_, i) =>
    make(url("newspaper.example.org", "item-" + i), "Synthetic title " + i)) };
  const state = sdk.normalizeGdeltDoc(many, topic, now().toISOString());
  assert.equal(state.rowsExamined, 40);
  assert.equal(state.candidates.length, 40);
  assert.equal(state.candidates[39].title, "Synthetic title 39");
  assert.equal(state.candidates.some((item) => item.html || item.body || item.fullText), false);
});

test("HTTP client GETs only GDELT, omits credentials, propagates AbortSignal, records retrieval time", async () => {
  const controller = new AbortController();
  let called = 0;
  const found = await sdk.searchGdeltDocuments(topic, {
    signal: controller.signal, now,
    fetcher: async (request, init) => {
      called++;
      assert.equal(new URL(request).origin, "https://api.gdeltproject.org");
      assert.equal(init.method, "GET");
      assert.equal(init.credentials, "omit");
      assert.equal(init.mode, "cors");
      assert.equal(init.cache, "no-store");
      assert.equal(init.signal, controller.signal);
      return response(fixture);
    },
  });
  assert.equal(called, 1);
  assert.equal(found.candidates.length, 4);
  assert.equal(found.retrievedAt, now().toISOString());
});

test("invalid search cannot cause a network request", async () => {
  let calls = 0;
  await assert.rejects(sdk.searchGdeltDocuments({ ...topic, subject: "X" }, {
    fetcher: async () => { calls++; return response({ articles: [] }); },
  }), (error) => error.code === "invalid");
  assert.equal(calls, 0);
});

test("429, 503, HTML/plain-text 200 notices, JSON corruption and network errors fail closed", async () => {
  const cases = [
    { returned: response("Too many requests", 429), error: "throttled" },
    { returned: response("Service not available", 503), error: "unavailable" },
    { returned: response("Please wait a few seconds", 200, "text/plain"), error: "throttled" },
    { returned: response("<html>try again</html>", 200, "text/html"), error: "bad_response" },
    { returned: response("not JSON", 200), error: "bad_response" },
    { returned: response("{garbage", 200), error: "bad_response" },
    { returned: response({}), error: "bad_response" },
  ];
  for (const example of cases) {
    await assert.rejects(sdk.searchGdeltDocuments(topic, {
      fetcher: async () => example.returned,
    }), (error) => error.code === example.error, example.error);
  }
  await assert.rejects(sdk.searchGdeltDocuments(topic, {
    fetcher: async () => { throw new TypeError("failed to fetch"); },
  }), (error) => error.code === "network");
  await assert.rejects(sdk.searchGdeltDocuments(topic, {
    fetcher: async () => ({ ...response(fixture), headers: { get: () => String(2_000_000) } }),
  }), (error) => error.code === "bad_response");
  await assert.rejects(sdk.searchGdeltDocuments(topic, {
    fetcher: async () => response("A".repeat(sdk.RADAR_MAX_BYTES + 1), 200, "text/plain"),
  }), (error) => error.code === "bad_response");
});

test("aborted requests remain aborted and are not transformed into provider failure", async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(sdk.searchGdeltDocuments(topic, {
    signal: controller.signal,
    fetcher: async () => { throw new DOMException("Aborted", "AbortError"); },
  }), (error) => error.name === "AbortError");
});

test("official HTML fallback preserves user-submitted bounded query and only changes output format", () => {
  const input = { subject: "Gabon elections", window: "3d", outletCountry: "gabon" };
  const direct = new URL(sdk.buildRadarUrl(input));
  const html = new URL(sdk.buildRadarOfficialSearchUrl(input));
  assert.equal(html.origin, direct.origin);
  assert.equal(html.pathname, direct.pathname);
  assert.equal(html.searchParams.get("query"), direct.searchParams.get("query"));
  assert.equal(html.searchParams.get("timespan"), "3d");
  assert.equal(html.searchParams.get("maxrecords"), "40");
  assert.equal(html.searchParams.get("format"), "html");
  assert.throws(() => sdk.buildRadarOfficialSearchUrl({ ...input, subject: "invalid:theme" }),
    /INVALID_RADAR_QUERY/);
});
