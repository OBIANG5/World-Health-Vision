/** Snapshot contract tested OFFLINE (no live World Bank provider in CI).
 * The upstream-fetch script has separate online/commit gates.
 */
import test from "node:test";
import assert from "node:assert/strict";
import snapshot from "../src/data/worldBankCountryCatalog.snapshot.json" with { type: "json" };

test("static Atlas country metadata is complete, attributed and not statistical coverage", () => {
  assert.equal(snapshot.schemaVersion, 1);
  assert.equal(snapshot.dataset, "WORLD_BANK_COUNTRY_METADATA");
  assert.equal(snapshot.sourceUrl, "https://api.worldbank.org/v2/country?format=json&per_page=400");
  assert.match(snapshot.termsUrl, /^https:\/\/www\.worldbank\.org\//);
  assert.match(snapshot.fetchedAtUtc, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  assert.match(snapshot.upstreamSha256, /^[0-9a-f]{64}$/);
  assert(snapshot.countryEntryCount >= 190 && snapshot.countryEntryCount <= 270);
  assert.equal(snapshot.items.length, snapshot.countryEntryCount);
  assert.equal(
    snapshot.countryEntryCount + snapshot.aggregateExcludedCount + snapshot.otherExcludedCount,
    snapshot.upstreamEntryCount,
  );
  assert.equal(new Set(snapshot.items.map(x => x.iso3)).size, snapshot.countryEntryCount);
  assert(snapshot.scope.includes("NOT sovereign states") && snapshot.scope.includes("NOT the World-Vision"));
  for (const row of snapshot.items) {
    assert.match(row.iso3, /^[A-Z]{3}$/);
    assert.match(row.iso2, /^[A-Z]{2}$/);
    assert(row.regionCode !== "NA");
    assert(row.displayName && row.regionName);
    assert(!Object.keys(row).some(key => /population|gdp|latestobservation|actualvalue|licensegrant/i.test(key)),
      "Never sneak unlicensed indicator series into geography");
  }
});

test("representative World Bank economies across continents have grounded capitals", () => {
  const by = new Map(snapshot.items.map(x => [x.iso3, x]));
  for (const [iso3, capital] of [
    ["GAB", "Libreville"], ["FRA", "Paris"],
    ["BRA", "Brasilia"], ["CIV", "Yamoussoukro"],
  ]) {
    assert.equal(by.get(iso3)?.capitalCity, capital);
  }
  assert(by.has("PSE"), "Countries/territories must not be silently modeled as sovereign states");
  assert(by.has("XKX"), "World Bank codes are not necessarily ISO-3166 sovereign-state codes");
});
