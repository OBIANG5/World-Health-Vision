/** DESIGN-SPEC CONTRACT ONLY: no backend, no sources, no UI claim. */
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname,resolve} from "node:path";

const here=dirname(fileURLToPath(import.meta.url));
const base=resolve(here,"../../..");
const manifest=JSON.parse(readFileSync(resolve(base,"docs/design/country-hub-capability-blueprint.v1.json"),"utf8"));
const productSource=readFileSync(resolve(here,"../src/product/visionProducts.ts"),"utf8");
const declaredVisionIds=[...productSource.matchAll(/^\s*id:\s*"([^"]+)",\s*family:/gm)].map(m=>m[1]);

test("all existing 11 Vision IDs are mapped exactly once to the country service directory",()=>{
 assert.equal(manifest.status,"DESIGN_ONLY_NOT_DEPLOYED");
 assert.equal(manifest.schemaVersion,1);
 assert.equal(declaredVisionIds.length,11,"If product registry evolves, the design catalog must evolve consciously");
 const visionRows=manifest.capabilities.filter(c=>c.kind==="vision");
 assert.equal(visionRows.length,declaredVisionIds.length);
 assert.deepEqual([...visionRows.map(c=>c.visionId)].sort(),[...declaredVisionIds].sort());
 assert.equal(new Set(visionRows.map(c=>c.visionId)).size,11);
});

test("all existing App utilities are discoverable from country, without fake activation",()=>{
 const utilityNames=["CurrencyPanel","PurchasingPowerPanel","AdvisorPanel","DestinationScorePanel",
  "RealEstatePanel","RetirementPanel","TravelPanel","WatchlistPanel","AlertsPanel","UserProfilePanel"];
 for(const name of utilityNames){
   assert(manifest.capabilities.some(c=>c.sourceAnchor===name),
    "Existing tool silently missing from cross-service hub: "+name);
 }
 const ids=new Set();
 const groups=new Set(manifest.groups.map(g=>g.id));
 assert.equal(groups.size,6,"6 semantic groupings, not another panel-level feature menu");
 for(const c of manifest.capabilities){
   assert(!ids.has(c.id),"Duplicate capability id: "+c.id);
   ids.add(c.id);
   assert(groups.has(c.groupId),"Orphaned service group: "+c.id);
   assert(typeof c.label.fr==="string" && c.label.fr.length>=5);
   assert(typeof c.label.en==="string" && c.label.en.length>=5);
   assert(c.discoverableOnEveryCountry===true,"Do not hide a Vision because it is not live");
   assert(c.availabilitySource==="authoritative-coverage-resolver");
   assert(!Object.hasOwn(c,"live")&&!Object.hasOwn(c,"isAvailable"),
    "Never invent country provider availability inside a design directory");
 }
 assert(manifest.capabilities.length>=31);
});

test("regional financial coverage, travel origins and local market are not falsely inferred",()=>{
 assert.match(manifest.examples.GAB.regionalExchangeHint,/BVMAC.*NOT_BRVM/);
 assert.match(manifest.examples.CIV.regionalExchangeHint,/BRVM_UEMOA/);
 assert.equal(manifest.examples.GAB.departureHint,"USER_INPUT_REQUIRED");
 assert.equal(manifest.examples.GAB.localMarketHint,"CITY_OR_STORE_REQUIRED");
 const local=manifest.capabilities.filter(c=>c.scope==="local-market");
 assert(local.length>=3);
 const travel=manifest.capabilities.find(c=>c.id==="transport");
 assert(travel.requiredInputs.includes("origin")&&travel.requiredInputs.includes("destination"));
 assert(manifest.invariants.includes("no_photo_hero"));
 assert(manifest.invariants.includes("actual_map_first"));
 assert(manifest.invariants.includes("no_primary_safety_from_macro_proxies"));
});
