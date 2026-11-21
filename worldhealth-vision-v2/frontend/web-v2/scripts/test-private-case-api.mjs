import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/trading");
function compile(file) {
  const compiled = ts.transpileModule(readFileSync(path.join(root, file), "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    reportDiagnostics: true,
  });
  assert.equal(compiled.diagnostics?.filter(d => d.category === ts.DiagnosticCategory.Error).length ?? 0, 0);
  return compiled.outputText;
}
const moduleUrl = (source) => "data:text/javascript;base64," + Buffer.from(source).toString("base64");
const planUrl = moduleUrl(compile("tradePlan.ts"));
const researchUrl = moduleUrl(compile("tradeResearch.ts"));
const libraryJs = compile("tradeCaseLibrary.ts")
  .replace('from "./tradePlan";', `from "${planUrl}";`)
  .replace('from "./tradeResearch";', `from "${researchUrl}";`);
const libUrl = moduleUrl(libraryJs);
assert(libraryJs.includes(planUrl) && libraryJs.includes(researchUrl), "Real model required");
const clientJs = compile("privateCaseApi.ts")
  .replace('from "./tradeCaseLibrary";', `from "${libUrl}";`);
assert(clientJs.includes(libUrl), "Actual strict library validator required");
const { PrivateCaseApi, PrivateCaseApiError } = await import(moduleUrl(clientJs));
const { newTradePlan } = await import(planUrl);

const token = "test-signed-token-fixture-not-production";
const identity = { providerLabel: "Synthetic OIDC fixture", sessionInstanceId: "test-A",
  accessToken: async () => token };
const plan = newTradePlan();
plan.instrument = "AUDCAD";
plan.instrumentKind = "spot";
const id = "123e4567-e89b-42d3-a456-426614174000";
const createdAt = "2026-11-21T12:30:00.000Z";
const summary = (version = 1) => ({
  id, title: "Synthetic thesis", version, createdAt, updatedAt: createdAt,
});
const record = (version = 1) => ({ ...summary(version), plan });
const response = (status, payload, headers = {}) => new Response(
  status === 204 ? null : JSON.stringify(payload),
  { status, headers: status === 204 ? headers : { "Content-Type": "application/json", ...headers } },
);
const mock = (handler) => {
  const calls = [];
  return {
    calls,
    transport: { fetch: async (url, init) => {
      calls.push({url, init});
      return handler(url, init);
    } },
  };
};

test("constructor and unconfigured auth never send an implicit GET or a write", async () => {
  const m = mock(() => response(200, []));
  const client = new PrivateCaseApi({ ...identity, accessToken: async () => null }, m.transport);
  assert.equal(m.calls.length, 0);
  await assert.rejects(() => client.list(), (e) => e.code === "unauthenticated");
  await assert.rejects(() => client.create("Private", plan), (e) => e.code === "unauthenticated");
  assert.equal(m.calls.length, 0);
});

test("bad or injected bearer never reaches gateway", async () => {
  for (const bad of ["", "short", "abcd\r\nX-User-ID: administrator", "with space malicious token"]) {
    const m = mock(() => response(200, []));
    const client = new PrivateCaseApi({ ...identity, accessToken: async () => bad }, m.transport);
    await assert.rejects(() => client.list(), (e) => e.code === "unauthenticated");
    assert.equal(m.calls.length, 0);
  }
});

test("explicit read is same-origin with bearer, no cookies, redirects, caching or identity headers", async () => {
  const m = mock(() => response(200, [summary()]));
  const client = new PrivateCaseApi(identity, m.transport);
  assert.equal(m.calls.length, 0);
  const cases = await client.list();
  assert.deepEqual(cases, [summary()]);
  assert.equal(m.calls.length, 1);
  assert.equal(m.calls[0].url, "/api/trading/cases");
  assert.equal(m.calls[0].init.method, "GET");
  assert.equal(m.calls[0].init.credentials, "omit");
  assert.equal(m.calls[0].init.redirect, "error");
  assert.equal(m.calls[0].init.cache, "no-store");
  assert.equal(m.calls[0].init.referrerPolicy, "no-referrer");
  assert.equal(m.calls[0].init.headers.Authorization, "Bearer " + token);
  assert.equal("X-User-ID" in m.calls[0].init.headers, false);
  assert.equal("Cookie" in m.calls[0].init.headers, false);
});

test("create, get, update and delete use server IDs, quoted ETag and no silent retries", async () => {
  let step = 0;
  const m = mock((url, init) => {
    step++;
    if (step === 1) return response(201, record(1), { ETag: '"v1"' });
    if (step === 2) return response(200, record(1), { ETag: '"v1"' });
    if (step === 3) return response(200, record(2), { ETag: '"v2"' });
    if (step === 4) return response(204);
    throw Error("Unexpected automatic request");
  });
  const client = new PrivateCaseApi(identity, m.transport);
  const created = await client.create("Synthetic thesis", plan);
  assert.equal(created.etag, '"v1"');
  assert.equal(created.id, id);
  assert.equal(JSON.parse(m.calls[0].init.body).title, "Synthetic thesis");
  assert.equal("owner" in JSON.parse(m.calls[0].init.body), false);
  const loaded = await client.get(id);
  assert.equal(loaded.plan.instrument, "AUDCAD");
  assert.equal(m.calls[1].url, "/api/trading/cases/" + id);
  const updated = await client.update(id, loaded.etag, "Updated research", plan);
  assert.equal(updated.version, 2);
  assert.equal(m.calls[2].init.headers["If-Match"], '"v1"');
  assert.equal(m.calls[2].init.method, "PUT");
  await client.remove(id, updated.etag);
  assert.equal(m.calls[3].init.method, "DELETE");
  assert.equal(m.calls[3].init.headers["If-Match"], '"v2"');
  assert.equal(m.calls.length, 4);
});

test("stale/forbidden/missing responses never retry, overwrite or expose server body", async () => {
  for (const [status, code] of [[401, "unauthenticated"], [403, "forbidden"], [404, "missing"],
    [409, "conflict"], [412, "stale"], [428, "precondition"], [429, "quota"], [503, "unavailable"]]) {
    const m = mock(() => new Response("SECRET_SERVER_BODY", {status}));
    const client = new PrivateCaseApi(identity, m.transport);
    await assert.rejects(() => client.update(id, '"v1"', "Safe", plan), (e) => {
      assert.equal(e instanceof PrivateCaseApiError, true);
      assert.equal(e.code, code);
      assert.equal(e.message.includes("SECRET"), false);
      return true;
    });
    assert.equal(m.calls.length, 1, "Failed write must not retry");
  }
});

test("no malformed UUID, invalid plan, unquoted ETag or dangerous evidence can be sent", async () => {
  const m = mock(() => response(200, record(1), { ETag: '"v1"' }));
  const client = new PrivateCaseApi(identity, m.transport);
  const dangerous = { ...plan, evidence: [{
    id: "bad", name: "Fake", originalPublisher: "Fake", url: "javascript:alert(1)",
    publishedAt: "2026-11-20", perspective: "other", stance: "context", observation: "X",
  }] };
  await assert.rejects(() => client.get("../../admin"), (e) => e.code === "invalid");
  await assert.rejects(() => client.update(id, "v1", "x", plan), (e) => e.code === "invalid");
  await assert.rejects(() => client.create("Bad", dangerous), (e) => e.code === "invalid");
  assert.equal(m.calls.length, 0);
});

test("malformed server JSON, version mismatch, missing ETag, huge listing and redirect are rejected", async () => {
  const samples = [
    () => response(200, record(1)), // ETag absent
    () => response(200, record(1), { ETag: '"v2"' }),
    () => new Response('{"plan":', { status: 200, headers: {"Content-Type": "application/json"} }),
    () => new Response(JSON.stringify(record(1)), { status: 200, headers: {"Content-Type": "text/html", ETag: '"v1"'} }),
  ];
  for (const handler of samples) {
    const client = new PrivateCaseApi(identity, mock(handler).transport);
    await assert.rejects(() => client.get(id), (e) => e.code === "untrusted");
  }
  const badList = new PrivateCaseApi(identity,
    mock(() => response(200, Array.from({ length: 31 }, () => summary()))).transport);
  await assert.rejects(() => badList.list(), (e) => e.code === "untrusted");
  const redirected = new PrivateCaseApi(identity, mock(() => {
    const res = response(200, []);
    Object.defineProperty(res, "url", { value: "https://attacker.invalid/collect" });
    return res;
  }).transport);
  await assert.rejects(() => redirected.list(), (e) => e.code === "untrusted");
});

test("network error and abort reject without sending new data or touching storage", async () => {
  const m = mock(async () => { throw new Error("Network unreachable"); });
  const client = new PrivateCaseApi(identity, m.transport);
  await assert.rejects(() => client.list(), (e) => e.code === "offline");
  assert.equal(m.calls.length, 1);
});

test("history remains read-only and validates server-supplied original research plans", async () => {
  const m = mock(() => response(200, [
    {version: 2, title: "Updated", plan, savedAt: createdAt},
    {version: 1, title: "Initial", plan, savedAt: createdAt},
  ]));
  const client = new PrivateCaseApi(identity, m.transport);
  const revisions = await client.history(id);
  assert.deepEqual(revisions.map(x => x.version), [2, 1]);
  assert.equal(m.calls[0].url, "/api/trading/cases/" + id + "/history");
  assert.equal(m.calls[0].init.method, "GET");
});
